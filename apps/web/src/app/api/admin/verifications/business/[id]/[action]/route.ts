// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/auth';
import { sendNotificationByUserId } from '@/lib/notifications';

/**
 * POST /api/admin/verifications/business/:id/:action
 * Approve or reject business verification request
 *
 * Params:
 * - id: verification request ID
 * - action: 'approve' or 'reject'
 *
 * Body:
 * - reason (required for reject)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    // Authenticate admin/editor
    const admin = await requireEditor(request);

    const { id, action } = await params;
    const requestId = parseInt(id, 10);

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid action. Must be approve or reject',
        },
        { status: 400 }
      );
    }

    // Get request body for rejection reason
    let reason: string | null = null;
    if (action === 'reject') {
      const body = await request.json();
      reason = body.reason;

      if (!reason) {
        return NextResponse.json(
          {
            success: false,
            message: 'Rejection reason is required',
          },
          { status: 400 }
        );
      }
    }

    // Load the request and make sure it is still pending before mutating anything
    const verificationRequest = await prisma.business_verification_requests.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        user_id: true,
        business_name: true,
        status: true,
        duration_days: true,
        payment_status: true,
      },
    });

    if (!verificationRequest || verificationRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Verification request not found or already processed' },
        { status: 404 }
      );
    }

    // If approved, update user's profile to business account
    if (action === 'approve') {
      // Business name should always be present, but guard anyway so a missing
      // value can never crash the approval (root cause of orphaned approvals).
      const businessName = (verificationRequest.business_name || '').trim();

      const baseSlug =
        businessName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim() || `business-${verificationRequest.user_id}`;

      // Check for slug collision (ignore the user being verified)
      let shopSlug = baseSlug;
      let counter = 1;

      while (true) {
        const existingUser = await prisma.users.findFirst({
          where: { shop_slug: shopSlug, id: { not: verificationRequest.user_id } },
          select: { id: true },
        });

        if (!existingUser) {
          break;
        }

        counter++;
        shopSlug = `${baseSlug}-${counter}`;
      }

      // Calculate expiry date based on duration_days
      const durationDays = verificationRequest.duration_days || 365; // Default to 1 year
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      // Atomic: approve the request AND upgrade the user together, or neither.
      // Prevents the partial-commit that left requests "approved" but users not verified.
      await prisma.$transaction([
        prisma.business_verification_requests.update({
          where: { id: requestId, status: 'pending' },
          data: {
            status: 'approved',
            rejection_reason: null,
            reviewed_by: admin.userId,
            reviewed_at: new Date(),
          },
        }),
        prisma.users.update({
          where: { id: verificationRequest.user_id },
          data: {
            account_type: 'business',
            business_verification_status: 'approved',
            business_verified_at: new Date(),
            business_verification_expires_at: expiresAt,
            ...(businessName ? { business_name: businessName, full_name: businessName } : {}),
            shop_slug: shopSlug,
          },
        }),
      ]);

      console.log(
        `✅ Business verification approved: ${businessName || `business-${verificationRequest.user_id}`} (ID: ${requestId})`
      );
      console.log(`   Shop URL: /shop/${shopSlug}`);
      console.log(`   Duration: ${durationDays} days (expires: ${expiresAt.toISOString()})`);
      console.log(`   Payment Status: ${verificationRequest.payment_status || 'N/A'}`);

      // Send notification to user (don't await to avoid blocking response)
      sendNotificationByUserId(
        verificationRequest.user_id,
        'business_verification_approved'
      ).catch((err) => console.error('Failed to send approval notification:', err));
    } else {
      // Reject: single write, no user mutation
      await prisma.business_verification_requests.update({
        where: { id: requestId, status: 'pending' },
        data: {
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: admin.userId,
          reviewed_at: new Date(),
        },
      });

      console.log(
        `❌ Business verification rejected: Request ID ${requestId}, Reason: ${reason}`
      );

      // Send rejection notification (don't await to avoid blocking response)
      sendNotificationByUserId(
        verificationRequest.user_id,
        'business_verification_rejected',
        { reason: reason || undefined }
      ).catch((err) => console.error('Failed to send rejection notification:', err));
    }

    return NextResponse.json(
      {
        success: true,
        message: `Business verification ${action}d successfully`,
        data: {
          id: verificationRequest.id,
          userId: verificationRequest.user_id,
          businessName: verificationRequest.business_name,
          status: action === 'approve' ? 'approved' : 'rejected',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Business verification review error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          message: 'Verification request not found or already processed',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process verification request',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
