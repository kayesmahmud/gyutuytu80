import { NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { getToken as getNextAuthToken } from 'next-auth/jwt';

// 🔒 SEC-2: Fail closed — never fall back to a published literal secret.
// The web app both signs AND verifies session JWTs with this, and the API trusts
// the same secret, so a hardcoded fallback would let anyone forge tokens for any
// user/role. Evaluated lazily so a missing build-time env doesn't crash the build,
// but any real auth call hard-fails when the secret is absent.
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '';

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  [key: string]: unknown;  // Index signature for jose compatibility
}

/**
 * Verify JWT token from Authorization header or cookies
 */
export async function verifyToken(request: NextRequest): Promise<JWTPayload | null> {
  // First, check Authorization header (used by backend-issued JWT)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // 🔒 AUTH-L3: pin the algorithm so a token can't dictate its own verification alg
      const verified = await jwtVerify(token, getJwtSecret(), { algorithms: ['HS256'] });
      return verified.payload as unknown as JWTPayload;
    } catch (error) {
      console.error('JWT verification error:', error);
    }
  }

  // Check for editorToken cookie (super-admin/editor sessions)
  const editorToken = request.cookies.get('editorToken')?.value;
  if (editorToken) {
    try {
      // 🔒 AUTH-L3: pin the algorithm (HS256) here too
      const verified = await jwtVerify(editorToken, getJwtSecret(), { algorithms: ['HS256'] });
      return verified.payload as unknown as JWTPayload;
    } catch (error) {
      console.error('Editor token verification error:', error);
    }
  }

  // Fallback: try NextAuth JWT from cookies (browser session)
  if (NEXTAUTH_SECRET) {
    try {
      const nextAuthToken = await getNextAuthToken({ req: request as any, secret: NEXTAUTH_SECRET });
      if (nextAuthToken?.id) {
        return {
          userId: parseInt(nextAuthToken.id as string, 10),
          email: (nextAuthToken.email as string) || '',
          role: (nextAuthToken.role as string) || 'user',
        };
      }
    } catch (error) {
      console.error('NextAuth token verification error:', error);
    }
  }

  return null;
}

/**
 * Create a new JWT token
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecret());

  return token;
}

/**
 * Verify authentication and return user ID
 * Throws error if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<number> {
  const payload = await verifyToken(request);
  if (!payload || !payload.userId) {
    throw new Error('Unauthorized');
  }
  return payload.userId;
}

/**
 * Verify authentication and check for specific role
 */
export async function requireRole(request: NextRequest, allowedRoles: string[]): Promise<JWTPayload> {
  const payload = await verifyToken(request);
  if (!payload || !payload.userId) {
    throw new Error('Unauthorized');
  }

  if (!allowedRoles.includes(payload.role)) {
    throw new Error('Forbidden');
  }

  return payload;
}

/**
 * Check if user is admin or super_admin
 */
export async function requireAdmin(request: NextRequest): Promise<JWTPayload> {
  return requireRole(request, ['super_admin']);
}

/**
 * Check if user is editor or super_admin
 */
export async function requireEditor(request: NextRequest): Promise<JWTPayload> {
  return requireRole(request, ['super_admin', 'editor']);
}

/**
 * Check if user is super_admin only
 * Returns user ID for convenience
 */
export async function requireSuperAdmin(request: NextRequest): Promise<number> {
  const payload = await requireRole(request, ['super_admin']);
  return payload.userId;
}

/**
 * Optional auth - returns user ID if authenticated, null otherwise
 * Does not throw error
 */
export async function optionalAuth(request: NextRequest): Promise<number | null> {
  const payload = await verifyToken(request);
  return payload?.userId ?? null;
}
