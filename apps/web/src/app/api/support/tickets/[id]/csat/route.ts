import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth/jwt';

/**
 * POST /api/support/tickets/:id/csat
 * Submit a customer satisfaction rating for a resolved ticket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { score, comment } = body;

    if (typeof score !== 'number' || score < 1 || score > 5) {
      return NextResponse.json(
        { success: false, message: 'Score must be between 1 and 5' },
        { status: 400 }
      );
    }

    const ticket = await prisma.support_tickets.findUnique({
      where: { id: ticketId },
      select: { user_id: true, status: true, csat_score: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    if (ticket.user_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      return NextResponse.json(
        { success: false, message: 'Ticket must be resolved to leave a rating' },
        { status: 400 }
      );
    }

    if (ticket.csat_score !== null) {
      return NextResponse.json(
        { success: false, message: 'A rating has already been submitted for this ticket' },
        { status: 400 }
      );
    }

    await prisma.support_tickets.update({
      where: { id: ticketId },
      data: {
        csat_score: score,
        csat_comment: comment?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully',
    });
  } catch (error: unknown) {
    console.error('CSAT submit error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}
