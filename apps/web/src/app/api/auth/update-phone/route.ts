import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { updatePhone } from '@thulobazaar/auth-core';

// Thin wrapper over the shared updatePhone. The shared logic validates the
// HMAC-signed verification token, re-checks the number isn't taken by another
// account (excluding this user), then persists — same code the API uses.
const updatePhoneSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  verificationToken: z.string().min(1, 'Verification token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const validation = updatePhoneSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { phone, verificationToken } = validation.data;
    const userId = parseInt(session.user.id, 10);

    const result = await updatePhone(userId, phone, verificationToken);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Phone number verified and updated successfully',
        data: {
          phone: result.phone,
          phoneVerified: result.phoneVerified,
          phoneVerifiedAt: result.phoneVerifiedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update phone error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
