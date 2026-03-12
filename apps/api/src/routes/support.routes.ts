import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TB-${timestamp}${random}`;
}

function calculateSlaBreach(priority: string): Date {
  const now = new Date();
  switch (priority) {
    case 'urgent':
      now.setHours(now.getHours() + 2);
      break;
    case 'high':
      now.setHours(now.getHours() + 8);
      break;
    case 'normal':
      now.setHours(now.getHours() + 24);
      break;
    case 'low':
    default:
      now.setHours(now.getHours() + 48);
      break;
  }
  return now;
}

/**
 * GET /api/support/tickets
 * List user's support tickets
 */
router.get(
  '/tickets',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 100);
    const offset = parseInt(req.query.offset as string || '0', 10);
    const status = req.query.status as string | undefined;

    const where: any = { user_id: userId };
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.support_tickets.findMany({
        where,
        select: {
          id: true,
          ticket_number: true,
          subject: true,
          category: true,
          priority: true,
          status: true,
          created_at: true,
          updated_at: true,
          sla_breach_at: true,
          support_messages: {
            select: {
              id: true,
              content: true,
              created_at: true,
            },
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.support_tickets.count({ where }),
    ]);

    const data = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticket_number,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      slaBreachAt: t.sla_breach_at,
      lastMessage: t.support_messages[0]
        ? {
            content: t.support_messages[0].content.substring(0, 100),
            createdAt: t.support_messages[0].created_at,
          }
        : null,
    }));

    res.json({
      success: true,
      data,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  })
);

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
router.post(
  '/tickets',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { subject, category = 'general', priority = 'normal', message, customFields } = req.body;

    if (!subject?.trim()) {
      res.status(400).json({ success: false, message: 'Subject is required' });
      return;
    }

    if (!message?.trim()) {
      res.status(400).json({ success: false, message: 'Initial message is required' });
      return;
    }

    const ticket = await prisma.support_tickets.create({
      data: {
        ticket_number: generateTicketNumber(),
        user_id: userId,
        subject: subject.trim(),
        category,
        priority,
        custom_fields: customFields || null,
        sla_breach_at: calculateSlaBreach(priority),
        support_messages: {
          create: {
            sender_id: userId,
            content: message.trim(),
            type: 'text',
          },
        },
      },
      select: {
        id: true,
        ticket_number: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        created_at: true,
        sla_breach_at: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.created_at,
        slaBreachAt: ticket.sla_breach_at,
      },
    });
  })
);

/**
 * GET /api/support/tickets/:id
 * Get ticket detail with messages
 */
router.get(
  '/tickets/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const ticketId = parseInt(req.params.id as string, 10);

    if (isNaN(ticketId)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    const ticket = await prisma.support_tickets.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticket_number: true,
        user_id: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        created_at: true,
        updated_at: true,
        resolved_at: true,
        closed_at: true,
        sla_breach_at: true,
        csat_score: true,
        csat_comment: true,
        custom_fields: true,
        support_messages: {
          select: {
            id: true,
            sender_id: true,
            content: true,
            type: true,
            attachment_url: true,
            is_internal: true,
            created_at: true,
            users: {
              select: {
                id: true,
                full_name: true,
                avatar: true,
                role: true,
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    if (ticket.user_id !== userId && userRole === 'user') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Filter out internal messages for regular users
    const isStaff = userRole !== 'user';
    const messages = ticket.support_messages
      .filter((msg) => isStaff || !msg.is_internal)
      .map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        content: msg.content,
        type: msg.type,
        attachmentUrl: msg.attachment_url,
        createdAt: msg.created_at,
        sender: {
          id: msg.users.id,
          fullName: msg.users.full_name,
          avatar: msg.users.avatar,
          isStaff: msg.users.role !== 'user',
        },
        isOwnMessage: msg.sender_id === userId,
      }));

    // Fetch user context if requester is staff
    let userContext = null;
    if (isStaff && ticket.user_id) {
      const ticketUser = await prisma.users.findUnique({
        where: { id: ticket.user_id },
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          created_at: true,
          identity_verified: true,
          business_verified: true,
          ads: {
            where: { status: 'active' },
            select: { id: true, title: true, price: true, created_at: true },
            orderBy: { created_at: 'desc' },
            take: 5,
          },
        },
      });

      if (ticketUser) {
        userContext = {
          id: ticketUser.id,
          fullName: ticketUser.full_name,
          email: ticketUser.email,
          phone: ticketUser.phone,
          joinedAt: ticketUser.created_at,
          identityVerified: ticketUser.identity_verified,
          businessVerified: ticketUser.business_verified,
          activeAds: ticketUser.ads,
        };
      }
    }

    res.json({
      success: true,
      data: {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        resolvedAt: ticket.resolved_at,
        closedAt: ticket.closed_at,
        slaBreachAt: ticket.sla_breach_at,
        csatScore: ticket.csat_score,
        csatComment: ticket.csat_comment,
        customFields: ticket.custom_fields,
        messages,
        userContext,
      },
    });
  })
);

/**
 * POST /api/support/tickets/:id/messages
 * Send a message to a ticket
 */
router.post(
  '/tickets/:id/messages',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const ticketId = parseInt(req.params.id as string, 10);

    if (isNaN(ticketId)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    const { content } = req.body;

    if (!content?.trim()) {
      res.status(400).json({ success: false, message: 'Message content is required' });
      return;
    }

    // Verify ticket ownership
    const ticket = await prisma.support_tickets.findUnique({
      where: { id: ticketId },
      select: { id: true, user_id: true, status: true },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    if (ticket.user_id !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const message = await prisma.support_messages.create({
      data: {
        ticket_id: ticketId,
        sender_id: userId,
        content: content.trim(),
        type: 'text',
      },
      select: {
        id: true,
        sender_id: true,
        content: true,
        type: true,
        created_at: true,
        users: {
          select: {
            id: true,
            full_name: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Update ticket status and timestamp
    if (ticket.status === 'waiting_on_user' || ticket.status === 'open') {
      await prisma.support_tickets.update({
        where: { id: ticketId },
        data: { status: 'in_progress', updated_at: new Date() },
      });
    } else {
      await prisma.support_tickets.update({
        where: { id: ticketId },
        data: { updated_at: new Date() },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: message.id,
        senderId: message.sender_id,
        content: message.content,
        type: message.type,
        createdAt: message.created_at,
        sender: {
          id: message.users.id,
          fullName: message.users.full_name,
          avatar: message.users.avatar,
          isStaff: message.users.role !== 'user',
        },
        isOwnMessage: true,
      },
    });
  })
);

/**
 * POST /api/support/tickets/:id/csat
 * Submit a customer satisfaction rating for a resolved ticket
 */
router.post(
  '/tickets/:id/csat',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const ticketId = parseInt(req.params.id as string, 10);
    const { score, comment } = req.body;

    if (isNaN(ticketId)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    if (score < 1 || score > 5) {
      res.status(400).json({ success: false, message: 'Score must be between 1 and 5' });
      return;
    }

    const ticket = await prisma.support_tickets.findUnique({
      where: { id: ticketId },
      select: { user_id: true, status: true, csat_score: true },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    if (ticket.user_id !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      res.status(400).json({ success: false, message: 'Ticket must be resolved to leave a rating' });
      return;
    }

    if (ticket.csat_score !== null) {
      res.status(400).json({ success: false, message: 'A rating has already been submitted for this ticket' });
      return;
    }

    await prisma.support_tickets.update({
      where: { id: ticketId },
      data: {
        csat_score: score,
        csat_comment: comment?.trim() || null,
      },
    });

    res.json({ success: true, message: 'Rating submitted successfully' });
  })
);

/**
 * GET /api/support/macros
 * Fetch available support macros for staff
 */
router.get(
  '/macros',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    // Basic permissions check for staff roles
    const userRole = req.user!.role;
    if (userRole === 'user') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const macros = await prisma.support_macros.findMany({
      orderBy: { title: 'asc' },
    });

    res.json({ success: true, data: macros });
  })
);

/**
 * POST /api/support/macros
 * Create a new support macro
 */
router.post(
  '/macros',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userRole = req.user!.role;
    if (userRole === 'user') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const { title, content } = req.body;

    if (!title?.trim() || !content?.trim()) {
      res.status(400).json({ success: false, message: 'Title and content are required' });
      return;
    }

    const macro = await prisma.support_macros.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        created_by: req.user!.userId,
      },
    });

    res.status(201).json({ success: true, data: macro });
  })
);

export default router;
