/**
 * GET /api/support/live-chat
 *
 * Thin proxy to the Express live-chat endpoint. Deliberately NOT a second
 * Prisma implementation: the find-or-reopen thread logic, the AI trigger and
 * the editor alerts live in one place, so the two surfaces cannot drift apart
 * the way the support-ticket twins did.
 */
import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/api/support/live-chat`, {
      headers: { Authorization: auth },
      cache: 'no-store',
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Live chat fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load live chat' },
      { status: 502 }
    );
  }
}
