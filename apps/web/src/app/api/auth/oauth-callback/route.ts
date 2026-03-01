import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@thulobazaar/database';

// =============================================================================
// OAUTH CALLBACK HANDLER
// This route receives the token from backend Passport.js Google OAuth
// and creates a session for the user
// =============================================================================

export async function GET(request: NextRequest) {
  // Use NEXTAUTH_URL for redirects to avoid Docker internal URLs (0.0.0.0:3333)
  const baseUrl = process.env.NEXTAUTH_URL || request.url;

  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');

    console.log('🔄 OAuth callback received:', { provider, hasToken: !!token });

    if (!token) {
      console.error('❌ No token in OAuth callback');
      return NextResponse.redirect(new URL('/en/auth/signin?error=NoToken', baseUrl));
    }

    // Verify and decode the token
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('❌ JWT_SECRET not configured');
      return NextResponse.redirect(new URL('/en/auth/signin?error=Configuration', baseUrl));
    }

    let decoded: { userId: number; email: string; role?: string };
    try {
      decoded = jwt.verify(token, jwtSecret) as { userId: number; email: string; role?: string };
      console.log('✅ Token verified:', { userId: decoded.userId, email: decoded.email });
    } catch (err: any) {
      console.error('❌ Token verification failed:', err?.message || err);
      return NextResponse.redirect(new URL('/en/auth/signin?error=InvalidToken', baseUrl));
    }

    // Fetch the full user from database
    const user = await prisma.users.findUnique({
      where: { id: Number(decoded.userId) },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        account_type: true,
        shop_slug: true,
        business_verification_status: true,
        individual_verified: true,
        avatar: true,
      },
    });

    if (!user) {
      console.error('❌ User not found:', decoded.userId);
      return NextResponse.redirect(new URL('/en/auth/signin?error=UserNotFound', baseUrl));
    }

    console.log('✅ User found:', user.email);

    const refreshToken = searchParams.get('refreshToken');

    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      account_type: user.account_type,
      shop_slug: user.shop_slug,
      business_verification_status: user.business_verification_status,
      individual_verified: user.individual_verified,
      avatar: user.avatar,
    }));

    // Redirect to client-side handler that stores the token
    return NextResponse.redirect(
      new URL(`/en/auth/oauth-success?token=${token}&refreshToken=${refreshToken}&user=${userData}`, baseUrl)
    );
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return NextResponse.redirect(new URL('/en/auth/signin?error=CallbackError', baseUrl));
  }
}
