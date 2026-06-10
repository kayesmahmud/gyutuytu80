import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * POST /api/auth/2fa/setup
 * Begin self-service 2FA setup. Proxies to the backend (which generates the TOTP
 * secret + QR) using the signed-in user's backend token, so web and mobile share
 * the exact same 2FA logic.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const backendToken =
      (session as { backendToken?: string } | null)?.backendToken ||
      session?.user?.backendToken;

    if (!session?.user?.id || !backendToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const res = await fetch(`${API_URL}/api/auth/2fa/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${backendToken}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[2FA setup proxy] error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
