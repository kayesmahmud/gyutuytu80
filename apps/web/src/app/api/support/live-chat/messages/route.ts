/**
 * POST /api/support/live-chat/messages
 * Thin proxy to Express (see ../route.ts for why).
 */
import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const response = await fetch(`${API_URL}/api/support/live-chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ content: body?.content }),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Live chat send error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 502 }
    );
  }
}
