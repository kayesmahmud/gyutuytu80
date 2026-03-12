import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/support/macros
 * Fetch available support macros for staff
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    // Basic permissions check for staff roles
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role === 'user') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const macros = await prisma.support_macros.findMany({
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: macros,
    });
  } catch (error: unknown) {
    console.error('Macros fetch error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch macros' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/support/macros
 * Create a new support macro
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role === 'user') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Title and content are required' },
        { status: 400 }
      );
    }

    const macro = await prisma.support_macros.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        created_by: userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: macro,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Macro creation error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create macro' },
      { status: 500 }
    );
  }
}
