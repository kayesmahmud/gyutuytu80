import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { sendOtp } from '@thulobazaar/auth-core';

// OTP logic lives in the shared @thulobazaar/auth-core package (single source of
// truth with the Express API). This route is a thin HTTP wrapper: validate the
// body, supply the logged-in user's id for phone_verification, shape the JSON.
const sendOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  purpose: z
    .enum(['registration', 'login', 'password_reset', 'phone_verification'])
    .default('registration'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = sendOtpSchema.safeParse(body);
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

    const { phone, purpose } = validation.data;

    // For phone_verification, pass the logged-in user's id so the duplicate
    // check excludes their own number (lets them re-verify it). Other purposes
    // are anonymous flows.
    let currentUserId: number | undefined;
    if (purpose === 'phone_verification') {
      const session = await getServerSession(authOptions);
      currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : undefined;
    }

    const result = await sendOtp(phone, purpose, { currentUserId });

    if (!result.success) {
      const msg = result.error || '';
      const status =
        result.cooldownRemaining || msg.includes('Too many')
          ? 429
          : msg.includes('No account')
            ? 404
            : msg.includes('suspended')
              ? 403
              : 400;
      return NextResponse.json(
        {
          success: false,
          message: result.error,
          cooldownRemaining: result.cooldownRemaining,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent successfully via SMS',
        identifier: result.identifier,
        expiresIn: result.expiresIn,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
