import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadMessageImage } from '../middleware/upload.js';
import { optimizeImage } from '../middleware/optimizeImage.js';
import { sendMessagePushNotification } from '../services/pushNotification.js';
import { isUserOnline } from '../socket/index.js';
import { containsProfanity, getDetectedWords, censorProfanity } from '../utils/profanityFilter.js';
import { isBlockedBetween, getBlockStatus } from '../utils/blockCheck.js';
import { isStaffRole } from '../utils/staffRoles.js';
import { isTeamAccount } from '../utils/teamAccount.js';

const router = Router();

/**
 * POST /api/messages/block
 * Block a user (bidirectional: neither can message the other)
 */
router.post(
  '/block',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const blockedId = parseInt(String(req.body.userId), 10);

    if (!blockedId || Number.isNaN(blockedId)) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    if (blockedId === userId) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }
    if (await isTeamAccount(blockedId)) {
      return res.status(400).json({ success: false, message: 'Thulo Bazaar Team cannot be blocked' });
    }

    await prisma.blocked_users.upsert({
      where: { blocker_id_blocked_id: { blocker_id: userId, blocked_id: blockedId } },
      update: {},
      create: { blocker_id: userId, blocked_id: blockedId },
    });

    console.log(`🚫 User ${userId} blocked user ${blockedId}`);
    res.json({ success: true, message: 'User blocked', data: { blockedByMe: true } });
  })
);

/**
 * DELETE /api/messages/block/:userId
 * Unblock a previously blocked user
 */
router.delete(
  '/block/:userId',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const blockedId = parseInt(String(req.params.userId), 10);

    if (!blockedId || Number.isNaN(blockedId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    await prisma.blocked_users.deleteMany({
      where: { blocker_id: userId, blocked_id: blockedId },
    });

    console.log(`✅ User ${userId} unblocked user ${blockedId}`);
    res.json({ success: true, message: 'User unblocked', data: { blockedByMe: false } });
  })
);

/**
 * GET /api/messages/conversations
 * Get user's conversations
 */
router.get(
  '/conversations',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const conversations = await prisma.conversation_participants.findMany({
      where: { user_id: userId },
      include: {
        conversations: {
          include: {
            conversation_participants: {
              include: {
                users: {
                  select: {
                    id: true,
                    full_name: true,
                    avatar: true,
                    role: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        conversations: {
          last_message_at: 'desc',
        },
      },
    });

    // Compute unread counts per conversation
    const unreadCounts = await prisma.$queryRaw<{ conversation_id: number; count: bigint }[]>`
      SELECT m.conversation_id, COUNT(*) as count
      FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = ${userId}
        AND m.sender_id != ${userId}
        AND m.is_deleted = false
        AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
      GROUP BY m.conversation_id
    `;
    const unreadMap = new Map(unreadCounts.map((r) => [r.conversation_id, Number(r.count)]));

    const data = conversations.map((cp) => {
      const conv = cp.conversations;
      const otherParticipants = conv.conversation_participants
        .filter((p) => p.user_id !== userId)
        .map((p) => ({
          id: p.users.id,
          fullName: p.users.full_name,
          avatar: p.users.avatar,
          isStaff: isStaffRole(p.users.role),
        }));
      const other = otherParticipants[0];
      const lastMessage = conv.messages[0];

      return {
        id: conv.id,
        type: conv.type,
        title: conv.title,
        participants: otherParticipants,
        // Flat fields for Flutter compatibility
        otherUserId: other?.id ?? 0,
        otherUserName: other?.fullName ?? 'Unknown',
        otherUserAvatar: other?.avatar ?? null,
        otherUserIsStaff: other?.isStaff ?? false,
        lastMessage: lastMessage?.content ?? '',
        lastMessageAt: conv.last_message_at,
        unreadCount: unreadMap.get(conv.id) ?? 0,
        adId: conv.ad_id,
        createdAt: conv.created_at,
      };
    });

    res.json({
      success: true,
      data,
    });
  })
);

/**
 * GET /api/messages/conversations/:id
 * Get messages in a conversation
 */
router.get(
  '/conversations/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const id = String(req.params.id);
    const { limit = '50', before } = req.query;
    console.log(`📩 GET /conversations/${id} messages for user ${userId} (limit: ${limit})`);

    // Verify membership and get conversation details
    const conversationData = await prisma.conversations.findFirst({
      where: {
        id: parseInt(id),
        conversation_participants: {
          some: { user_id: userId },
        },
      },
      include: {
        conversation_participants: {
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!conversationData) {
      throw new NotFoundError('Conversation not found');
    }

    const where: any = {
      conversation_id: parseInt(id),
      is_deleted: false,
    };

    if (before) {
      where.created_at = { lt: new Date(before as string) };
    }

    const messages = await prisma.messages.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit as string),
    });

    // Update last_read_at
    await prisma.conversation_participants.update({
      where: {
        conversation_id_user_id: {
          conversation_id: parseInt(id),
          user_id: userId,
        },
      },
      data: { last_read_at: new Date() },
    });

    // Transform conversation data for frontend
    const otherParticipants = conversationData.conversation_participants
      .filter((p) => p.user_id !== userId)
      .map((p) => ({
        id: p.users.id,
        fullName: p.users.full_name,
        avatar: p.users.avatar,
        isStaff: isStaffRole(p.users.role),
      }));

    // Block status relative to the other participant (drives mobile menu + composer)
    const otherUser = otherParticipants[0];
    const blockStatus = otherUser
      ? await getBlockStatus(userId, otherUser.id)
      : { blockedByMe: false, blockedMe: false };

    res.json({
      success: true,
      data: {
        conversation: {
          id: conversationData.id,
          type: conversationData.type,
          title: conversationData.title,
          participants: otherParticipants,
          otherUserId: otherUser?.id ?? null,
          otherUserIsStaff: otherUser?.isStaff ?? false,
          blockedByMe: blockStatus.blockedByMe,
          blockedMe: blockStatus.blockedMe,
          lastMessageAt: conversationData.last_message_at,
          createdAt: conversationData.created_at,
        },
        messages: messages.reverse().map((msg) => ({
          id: msg.id,
          conversationId: msg.conversation_id,
          senderId: msg.sender_id,
          sender: {
            id: msg.users.id,
            fullName: msg.users.full_name,
            avatar: msg.users.avatar,
            isStaff: isStaffRole(msg.users.role),
          },
          content: msg.content,
          type: msg.type,
          attachmentUrl: msg.attachment_url,
          isEdited: msg.is_edited,
          createdAt: msg.created_at,
        })),
      },
    });
  })
);

/**
 * POST /api/messages/conversations
 * Create a new conversation or get existing one
 */
router.post(
  '/conversations',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    // Support both participantId (single) and participantIds (array) for flexibility
    const { participantId, participantIds, adId } = req.body;

    // Extract participant ID from either format
    const targetParticipantId = participantId || (Array.isArray(participantIds) ? participantIds[0] : null);

    if (!targetParticipantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required',
      });
    }

    // Check if direct conversation already exists between these users
    const existingConversation = await prisma.$queryRaw<{ id: number }[]>`
      SELECT c.id
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ${userId}
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ${parseInt(String(targetParticipantId))}
      WHERE c.type = 'direct'
      LIMIT 1
    `;

    // Fetch the other user's info for the response
    const otherUser = await prisma.users.findUnique({
      where: { id: parseInt(String(targetParticipantId)) },
      select: { id: true, full_name: true, avatar: true },
    });

    if (existingConversation.length > 0) {
      return res.json({
        success: true,
        data: {
          id: existingConversation[0].id,
          isNew: false,
          otherUserId: otherUser?.id ?? parseInt(String(targetParticipantId)),
          otherUserName: otherUser?.full_name ?? '',
          otherUserAvatar: otherUser?.avatar ?? null,
        },
      });
    }

    // Create new conversation
    const conversation = await prisma.conversations.create({
      data: {
        type: 'direct',
        ad_id: adId ? parseInt(adId) : null,
      },
    });

    // Add participants
    await prisma.conversation_participants.createMany({
      data: [
        { conversation_id: conversation.id, user_id: userId },
        { conversation_id: conversation.id, user_id: parseInt(String(targetParticipantId)) },
      ],
    });

    console.log(`✅ Conversation created: ${conversation.id} between users ${userId} and ${targetParticipantId}`);

    res.status(201).json({
      success: true,
      data: {
        id: conversation.id,
        isNew: true,
        otherUserId: otherUser?.id ?? parseInt(String(targetParticipantId)),
        otherUserName: otherUser?.full_name ?? '',
        otherUserAvatar: otherUser?.avatar ?? null,
      },
    });
  })
);

/**
 * GET /api/messages/unread-count
 * Get unread message count
 */
router.get(
  '/unread-count',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = ${userId}
        AND m.sender_id != ${userId}
        AND m.is_deleted = false
        AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
    `;

    res.json({
      success: true,
      data: { unread_messages: Number(result[0]?.count || 0) },
    });
  })
);

/**
 * POST /api/messages/check-profanity
 * Check if text contains profanity (for client-side pre-validation)
 */
router.post(
  '/check-profanity',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.json({ success: true, data: { hasProfanity: false, words: [] } });
    }
    const hasProfanity = containsProfanity(text);
    const words = hasProfanity ? getDetectedWords(text) : [];
    res.json({ success: true, data: { hasProfanity, words } });
  })
);

/**
 * POST /api/messages/upload
 * Upload image for messaging
 */
router.post(
  '/upload',
  authenticateToken,
  uploadMessageImage.single('image'),
  optimizeImage('message'),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    const imageUrl = `/uploads/messages/${req.file.filename}`;

    console.log(`📸 Message image uploaded: ${imageUrl} by user ${userId}`);

    res.json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
      },
    });
  })
);

/**
 * POST /api/messages/conversations/:id/messages
 * Send a message in a conversation (REST fallback for Socket.IO)
 */
router.post(
  '/conversations/:id/messages',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const conversationId = parseInt(String(req.params.id));
    const { content, type = 'text', attachmentUrl } = req.body;

    if (!content && type === 'text') {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // Verify membership
    const participant = await prisma.conversation_participants.findUnique({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    });
    if (!participant) {
      return res.status(403).json({ success: false, message: 'Not a member of this conversation' });
    }

    // Block enforcement: reject if either party blocked the other
    const otherParticipant = await prisma.conversation_participants.findFirst({
      where: { conversation_id: conversationId, user_id: { not: userId } },
      select: { user_id: true },
    });
    if (otherParticipant && (await isBlockedBetween(userId, otherParticipant.user_id))) {
      return res.status(403).json({
        success: false,
        message: 'You cannot send messages in this conversation because of a block.',
        code: 'BLOCKED',
      });
    }

    // Server-side profanity censoring (safety net)
    const sanitizedContent = content ? censorProfanity(content) : '';

    const message = await prisma.messages.create({
      data: {
        conversation_id: conversationId,
        sender_id: userId,
        content: sanitizedContent,
        type,
        attachment_url: attachmentUrl || null,
      },
      include: {
        users: { select: { id: true, full_name: true, avatar: true, role: true } },
      },
    });

    // Update conversation timestamp and sender's last_read_at
    const updatedConversation = await prisma.conversations.update({
      where: { id: conversationId },
      data: { last_message_at: new Date() },
      select: { team_user_id: true },
    });
    await prisma.conversation_participants.update({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
      data: { last_read_at: new Date() },
    });

    const messageData = {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      sender: { id: message.users.id, fullName: message.users.full_name, avatar: message.users.avatar, isStaff: isStaffRole(message.users.role) },
      content: message.content,
      type: message.type,
      attachmentUrl: message.attachment_url,
      isEdited: message.is_edited,
      createdAt: message.created_at,
    };

    // Broadcast via Socket.IO for real-time sync to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversationId}`).emit('message:new', messageData);
      io.to(`conversation:${conversationId}`).emit('conversation:updated', {
        conversationId,
        lastMessage: messageData,
        timestamp: new Date(),
      });

      // Team threads also mirror into the shared editor inbox room (distinct
      // event name so staff sockets can tell it apart from their own chats)
      if (updatedConversation.team_user_id) {
        io.to('team:inbox').emit('team-inbox:message-new', messageData);
      }
    }

    // Send push notifications to offline participants (fire-and-forget)
    prisma.conversation_participants
      .findMany({
        where: {
          conversation_id: conversationId,
          user_id: { not: userId },
          is_muted: { not: true },
        },
        select: { user_id: true },
      })
      .then((participants) => {
        const offlineRecipientIds = participants
          .map((p) => p.user_id)
          .filter((uid) => !isUserOnline(uid));

        if (offlineRecipientIds.length > 0) {
          sendMessagePushNotification({
            senderName: message.users.full_name,
            senderAvatar: message.users.avatar,
            messageContent: content || '',
            messageType: type,
            conversationId,
            recipientUserIds: offlineRecipientIds,
          }).catch((err) => console.error('Push notification error:', err));
        }
      })
      .catch((err) => console.error('Error fetching participants for push:', err));

    res.status(201).json({
      success: true,
      data: messageData,
    });
  })
);

export default router;
