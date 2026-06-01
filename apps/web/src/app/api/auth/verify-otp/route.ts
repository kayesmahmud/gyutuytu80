import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOtp } from '@thulobazaar/auth-core';

// Thin wrapper over the shared verifyOtp (single source of truth with the API).
// On success it returns an HMAC-SIGNED verification token; the previous web
// implementation issued an UNSIGNED base64 token that could be forged to claim
// any phone without an OTP — switching to the shared logic closes that hole.
const verifyOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z
    .enum(['registration', 'login', 'password_reset', 'phone_verification'])
    .default('registration'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = verifyOtpSchema.safeParse(body);
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

    const { phone, otp, purpose } = validation.data;

    const result = await verifyOtp(phone, otp, purpose);

    if (!result.success) {
      const status = result.error?.includes('Too many') ? 429 : 400;
      return NextResponse.json(
        {
          success: false,
          message: result.error,
          remainingAttempts: result.remainingAttempts,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Phone number verified successfully',
        identifier: result.identifier,
        verificationToken: result.verificationToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
