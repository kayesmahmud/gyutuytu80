/**
 * Support Tickets API
 * GET /api/support/tickets - Get user's tickets (or all tickets for editors)
 * POST /api/support/tickets - Create a new support ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth';
import { censorProfanity } from '@/utils/profanityCheck';
import { notifySupportEvent } from '@/lib/supportBridge';

// Generate unique ticket number
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TB-${timestamp}${random}`;
}

// SLA deadline by priority — kept in sync with calculateSlaBreach in
// apps/api/src/routes/support.routes.ts (urgent 2h / high 8h / normal 24h / low 48h).
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
 * GET - Get support tickets
 * Regular users see their own tickets
 * Editors see all tickets (with filtering)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigned = searchParams.get('assigned'); // 'me', 'unassigned', or user ID
    // 'live_chat' for the Live Chat queue, 'ticket' for filed support tickets
    const source = searchParams.get('source');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Check if user is editor/admin
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isStaff = user?.role === 'editor' || user?.role === 'super_admin';

    // Build where clause
    const where: any = {};

    if (!isStaff) {
      // Regular users can only see their own tickets
      where.user_id = userId;
    } else {
      // Staff can filter by assigned
      if (assigned === 'me') {
        where.assigned_to = userId;
      } else if (assigned === 'unassigned') {
        where.assigned_to = null;
      } else if (assigned) {
        where.assigned_to = parseInt(assigned, 10);
      }
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (source) {
      where.source = source;
    } else if (!isStaff) {
      // Live Chat has its own screen; keep it out of the user's ticket list.
      where.source = { not: 'live_chat' };
    }

    // Fetch tickets
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
          resolved_at: true,
          sla_breach_at: true,
          users_support_tickets_user_idTousers: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar: true,
            },
          },
          users_support_tickets_assigned_toTousers: {
            select: {
              id: true,
              full_name: true,
              avatar: true,
            },
          },
          support_messages: {
            // An internal staff note must never become a customer's list preview
            ...(isStaff ? {} : { where: { is_internal: false } }),
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

    // Transform response
    const transformedTickets = tickets.map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      resolvedAt: ticket.resolved_at,
      slaBreachAt: ticket.sla_breach_at,
      user: {
        id: ticket.users_support_tickets_user_idTousers.id,
        fullName: ticket.users_support_tickets_user_idTousers.full_name,
        email: ticket.users_support_tickets_user_idTousers.email,
        avatar: ticket.users_support_tickets_user_idTousers.avatar,
      },
      assignedTo: ticket.users_support_tickets_assigned_toTousers
        ? {
            id: ticket.users_support_tickets_assigned_toTousers.id,
            fullName: ticket.users_support_tickets_assigned_toTousers.full_name,
            avatar: ticket.users_support_tickets_assigned_toTousers.avatar,
          }
        : null,
      lastMessage: ticket.support_messages[0]
        ? {
            content: ticket.support_messages[0].content.substring(0, 100),
            createdAt: ticket.support_messages[0].created_at,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: transformedTickets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: unknown) {
    console.error('Tickets fetch error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new support ticket
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const { subject, category = 'general', priority = 'normal', message, customFields } = body;

    if (!subject || subject.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Initial message is required' },
        { status: 400 }
      );
    }

    // Create ticket with initial message
    const ticketNumber = generateTicketNumber();

    const ticket = await prisma.support_tickets.create({
      data: {
        ticket_number: ticketNumber,
        user_id: userId,
        subject: subject.trim(),
        category,
        priority,
        custom_fields: customFields || null,
        sla_breach_at: calculateSlaBreach(priority),
        support_messages: {
          create: {
            sender_id: userId,
            content: censorProfanity(message.trim()),
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
        users_support_tickets_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    // Editor alerts, staff-queue socket insert, and the AI assistant all run
    // Express-side — without this, web-created tickets alerted nobody.
    notifySupportEvent('ticket-created', ticket.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: ticket.id,
          ticketNumber: ticket.ticket_number,
          subject: ticket.subject,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          createdAt: ticket.created_at,
        },
        message: 'Support ticket created successfully',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Ticket create error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
