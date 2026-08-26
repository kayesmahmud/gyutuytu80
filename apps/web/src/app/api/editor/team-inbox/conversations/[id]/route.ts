import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/auth';
import { getTeamAccountId } from '@/lib/teamAccount';

function authErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
  }
  if (error instanceof Error && error.message === 'Forbidden') {
    return NextResponse.json({ success: false, message: 'Staff access required' }, { status: 403 });
  }
  return null;
}

/**
 * GET /api/editor/team-inbox/conversations/:id
 * One team thread with its messages. Team-sent messages carry `sentBy`
 * (the staff member who wrote them) — editor-panel display only.
 * Opening the thread marks it read for the whole team (shared read state).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireEditor(request);
    const teamId = await getTeamAccountId();
    const { id } = await params;
    const conversationId = parseInt(id, 10);

    if (isNaN(conversationId)) {
      return NextResponse.json({ success: false, message: 'Invalid conversation ID' }, { status: 400 });
    }

    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        ad_id: true,
        team_user_id: true,
        team_user: {
          select: { id: true, full_name: true, avatar: true, email: true, phone: true },
        },
        ads: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!conversation?.team_user_id || !conversation.team_user) {
      return NextResponse.json({ success: false, message: 'Team conversation not found' }, { status: 404 });
    }

    const messages = await prisma.messages.findMany({
      where: { conversation_id: conversationId },
      select: {
        id: true,
        sender_id: true,
        content: true,
        type: true,
        attachment_url: true,
        is_edited: true,
        is_deleted: true,
        created_at: true,
        sent_by_user: { select: { id: true, full_name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 200,
    });

    // Shared read state: any staff member opening the thread clears its unread
    // for everyone. updateMany so a missing participant row is a no-op.
    await prisma.conversation_participants.updateMany({
      where: { conversation_id: conversationId, user_id: teamId },
      data: { last_read_at: new Date() },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: conversation.id,
          adId: conversation.ad_id,
          ad: conversation.ads
            ? { id: conversation.ads.id, title: conversation.ads.title, slug: conversation.ads.slug }
            : null,
          user: {
            id: conversation.team_user.id,
            fullName: conversation.team_user.full_name,
            avatar: conversation.team_user.avatar,
            email: conversation.team_user.email,
            phone: conversation.team_user.phone,
          },
          messages: messages.reverse().map((m) => ({
            id: m.id,
            content: m.is_deleted ? '[Message deleted]' : m.content,
            type: m.type,
            attachmentUrl: m.attachment_url,
            isEdited: m.is_edited,
            isDeleted: m.is_deleted,
            createdAt: m.created_at,
            fromTeam: m.sender_id === teamId,
            sentBy: m.sent_by_user
              ? { id: m.sent_by_user.id, fullName: m.sent_by_user.full_name }
              : null,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Team conversation fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load conversation' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/editor/team-inbox/conversations/:id
 * Send a message AS "Thulo Bazaar Team". The message is recorded with
 * sent_by_user_id = the editor who wrote it, but the user only ever sees the
 * team identity.
 *
 * Body:
 * - content: string (required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const editor = await requireEditor(request);
    const teamId = await getTeamAccountId();
    const { id } = await params;
    const conversationId = parseInt(id, 10);

    if (isNaN(conversationId)) {
      return NextResponse.json({ success: false, message: 'Invalid conversation ID' }, { status: 400 });
    }

    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!content) {
      return NextResponse.json({ success: false, message: 'Message content is required' }, { status: 400 });
    }

    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      select: { team_user_id: true },
    });
    if (!conversation?.team_user_id) {
      return NextResponse.json({ success: false, message: 'Team conversation not found' }, { status: 404 });
    }

    const [teamAccount, editorUser] = await Promise.all([
      prisma.users.findUnique({
        where: { id: teamId },
        select: { full_name: true, avatar: true },
      }),
      prisma.users.findUnique({
        where: { id: editor.userId },
        select: { id: true, full_name: true },
      }),
    ]);

    const message = await prisma.messages.create({
      data: {
        conversation_id: conversationId,
        sender_id: teamId,
        sent_by_user_id: editor.userId,
        content,
        type: 'text',
      },
      select: { id: true, content: true, type: true, created_at: true },
    });

    await prisma.conversations.update({
      where: { id: conversationId },
      data: { last_message_at: new Date() },
    });
    await prisma.conversation_participants.updateMany({
      where: { conversation_id: conversationId, user_id: teamId },
      data: { last_read_at: new Date() },
    });

    const sentBy = editorUser ? { id: editorUser.id, fullName: editorUser.full_name } : null;

    // User-facing payload: the team identity only — no editor attribution.
    const messageData = {
      id: message.id,
      conversationId,
      senderId: teamId,
      sender: {
        id: teamId,
        fullName: teamAccount?.full_name || 'Thulo Bazaar Team',
        avatar: teamAccount?.avatar || null,
        isStaff: true,
      },
      content: message.content,
      type: message.type,
      attachmentUrl: null,
      createdAt: message.created_at,
    };

    // Bridge to Express Socket.IO: user gets the team payload; the staff room
    // additionally gets `sentBy` for attribution (see /api/internal/broadcast-message).
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${backendUrl}/api/internal/broadcast-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.INTERNAL_API_SECRET,
        messageData,
        conversationId,
        sentBy,
      }),
    }).catch((err) => console.error('Socket broadcast failed (non-critical):', err.message));

    return NextResponse.json(
      {
        success: true,
        data: {
          id: message.id,
          content: message.content,
          type: message.type,
          attachmentUrl: null,
          isEdited: false,
          isDeleted: false,
          createdAt: message.created_at,
          fromTeam: true,
          sentBy,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Team message send error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
