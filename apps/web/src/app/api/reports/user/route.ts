import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth';

const VALID_USER_REPORT_REASONS = [
  'spam',
  'scam',
  'harassment',
  'inappropriate',
  'impersonation',
  'other',
];

/**
 * POST /api/reports/user
 * Report a user (e.g. from a chat conversation).
 * Mirrors the Express POST /api/reports/user endpoint used by mobile.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const { reportedUserId, reason, details, conversationId } = body;

    if (!reportedUserId || !reason) {
      return NextResponse.json(
        { success: false, message: 'Reported user ID and reason are required' },
        { status: 400 }
      );
    }

    if (!VALID_USER_REPORT_REASONS.includes(reason)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid reason. Must be one of: ${VALID_USER_REPORT_REASONS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const reportedId = parseInt(String(reportedUserId), 10);
    if (reportedId === userId) {
      return NextResponse.json(
        { success: false, message: 'You cannot report yourself' },
        { status: 400 }
      );
    }

    const reportedUser = await prisma.users.findUnique({
      where: { id: reportedId },
      select: { id: true },
    });
    if (!reportedUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Allow a new report only if there is no pending report from this reporter
    const existingPending = await prisma.user_reports.findFirst({
      where: { reported_user_id: reportedId, reporter_id: userId, status: 'pending' },
    });
    if (existingPending) {
      return NextResponse.json(
        { success: false, message: 'You already have a pending report for this user' },
        { status: 400 }
      );
    }

    const report = await prisma.user_reports.upsert({
      where: {
        reported_user_id_reporter_id: { reported_user_id: reportedId, reporter_id: userId },
      },
      update: {
        reason,
        details: details || null,
        status: 'pending',
        conversation_id: conversationId ? parseInt(String(conversationId), 10) : null,
        admin_notes: null,
        resolved_by: null,
        updated_at: new Date(),
      },
      create: {
        reported_user_id: reportedId,
        reporter_id: userId,
        reason,
        details: details || null,
        status: 'pending',
        conversation_id: conversationId ? parseInt(String(conversationId), 10) : null,
      },
    });

    console.log(`✅ User ${reportedId} reported by user ${userId} for reason: ${reason}`);

    return NextResponse.json(
      {
        success: true,
        message: 'User reported successfully. Our team will review it shortly.',
        data: { id: report.id, createdAt: report.created_at },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('User report creation error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to report user' },
      { status: 500 }
    );
  }
}
