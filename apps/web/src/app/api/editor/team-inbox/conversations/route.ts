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
 * GET /api/editor/team-inbox/conversations
 * The shared team inbox: every "Thulo Bazaar Team" ↔ user thread.
 * Visible to ALL staff — this is the whole point of the shared inbox.
 */
export async function GET(request: NextRequest) {
  try {
    await requireEditor(request);
    const teamId = await getTeamAccountId();

    const conversations = await prisma.conversations.findMany({
      where: { team_user_id: { not: null } },
      select: {
        id: true,
        ad_id: true,
        last_message_at: true,
        team_user: {
          select: { id: true, full_name: true, avatar: true, email: true },
        },
        ads: { select: { id: true, title: true, slug: true } },
        conversation_participants: {
          where: { user_id: teamId },
          select: { last_read_at: true },
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            sender_id: true,
            type: true,
            created_at: true,
            is_deleted: true,
          },
        },
      },
      orderBy: { last_message_at: 'desc' },
      take: 100,
    });

    const data = await Promise.all(
      conversations.map(async (c) => {
        // Shared read state: "unread" means no staff member has opened it yet
        const lastReadAt = c.conversation_participants[0]?.last_read_at;
        const unreadCount = await prisma.messages.count({
          where: {
            conversation_id: c.id,
            sender_id: { not: teamId },
            created_at: { gt: lastReadAt || new Date(0) },
          },
        });

        const last = c.messages[0];
        return {
          id: c.id,
          adId: c.ad_id,
          ad: c.ads ? { id: c.ads.id, title: c.ads.title, slug: c.ads.slug } : null,
          user: c.team_user
            ? {
                id: c.team_user.id,
                fullName: c.team_user.full_name,
                avatar: c.team_user.avatar,
                email: c.team_user.email,
              }
            : null,
          lastMessageAt: c.last_message_at,
          unreadCount,
          lastMessage: last
            ? {
                id: last.id,
                content: last.is_deleted ? '[Message deleted]' : last.content,
                type: last.type,
                fromTeam: last.sender_id === teamId,
                createdAt: last.created_at,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Team inbox list error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load team inbox' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/editor/team-inbox/conversations
 * Find-or-create the ONE team conversation for a user.
 *
 * Body:
 * - userId: number (required) — the end user to message
 * - adId: number (optional) — the ad being discussed (shown as thread context)
 */
export async function POST(request: NextRequest) {
  try {
    await requireEditor(request);
    const teamId = await getTeamAccountId();

    const body = await request.json();
    const targetUserId = parseInt(String(body.userId), 10);
    const adId = body.adId ? parseInt(String(body.adId), 10) : null;

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }
    if (targetUserId === teamId) {
      return NextResponse.json(
        { success: false, message: 'Cannot open a team conversation with the team account' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // One team thread per user — team_user_id is UNIQUE, so this upsert is
    // race-safe (concurrent editors land on the same conversation).
    const conversation = await prisma.conversations.upsert({
      where: { team_user_id: targetUserId },
      create: {
        type: 'team',
        ad_id: adId,
        team_user_id: targetUserId,
        conversation_participants: {
          create: [{ user_id: teamId }, { user_id: targetUserId }],
        },
      },
      // Re-point the "About: <ad>" context at the ad being discussed now —
      // same behavior as the existing direct-chat flow.
      update: adId ? { ad_id: adId } : {},
      select: { id: true, ad_id: true },
    });

    return NextResponse.json(
      { success: true, data: { id: conversation.id, adId: conversation.ad_id } },
      { status: 200 }
    );
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Team conversation create error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to open team conversation' },
      { status: 500 }
    );
  }
}
