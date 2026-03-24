import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@thulobazaar/database';
import { createToken, authOptions } from '@/lib/auth';

/**
 * POST /api/auth/refresh-token
 * Generate a fresh backend JWT for the currently authenticated user.
 * Requires a valid NextAuth session (session cookie sent automatically).
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.users.findFirst({
      where: { email: session.user.email, is_active: true },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const token = await createToken({
      userId: user.id,
      email: user.email || '',
      role: user.role || 'user',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully',
        data: { token },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
