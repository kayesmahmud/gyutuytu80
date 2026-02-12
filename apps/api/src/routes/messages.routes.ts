import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadMessageImage } from '../middleware/upload.js';

const router = Router();

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
    const { id } = req.params;
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
      }));

    res.json({
      success: true,
      data: {
        conversation: {
          id: conversationData.id,
          type: conversationData.type,
          title: conversationData.title,
          participants: otherParticipants,
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

    if (existingConversation.length > 0) {
      return res.json({
        success: true,
        data: { id: existingConversation[0].id, isNew: false },
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
      data: { id: conversation.id, isNew: true },
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
 * POST /api/messages/upload
 * Upload image for messaging
 */
router.post(
  '/upload',
  authenticateToken,
  uploadMessageImage.single('image'),
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
    const conversationId = parseInt(req.params.id);
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

    const message = await prisma.messages.create({
      data: {
        conversation_id: conversationId,
        sender_id: userId,
        content: content || '',
        type,
        attachment_url: attachmentUrl || null,
      },
      include: {
        users: { select: { id: true, full_name: true, avatar: true } },
      },
    });

    // Update conversation timestamp and sender's last_read_at
    await prisma.conversations.update({
      where: { id: conversationId },
      data: { last_message_at: new Date() },
    });
    await prisma.conversation_participants.update({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
      data: { last_read_at: new Date() },
    });

    const messageData = {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      sender: { id: message.users.id, fullName: message.users.full_name, avatar: message.users.avatar },
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
    }

    res.status(201).json({
      success: true,
      data: messageData,
    });
  })
);

/**
 * GET /api/messages/search-users?q=...
 * Search users for starting new conversations
 */
router.get(
  '/search-users',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const query = (req.query.q as string || '').trim();

    if (query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const users = await prisma.users.findMany({
      where: {
        id: { not: userId },
        is_active: true,
        full_name: { contains: query, mode: 'insensitive' },
      },
      select: { id: true, full_name: true, avatar: true },
      take: 10,
    });

    res.json({
      success: true,
      data: users.map((u) => ({ id: u.id, fullName: u.full_name, avatar: u.avatar })),
    });
  })
);

export default router;
