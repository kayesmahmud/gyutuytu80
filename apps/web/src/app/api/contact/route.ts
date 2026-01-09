/**
 * Contact Form API
 * POST /api/contact - Submit a contact form message
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  reason: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Store in database (contact_messages table)
    // For now, we'll create a support ticket for contact messages
    // This ensures they're tracked in the existing support system
    const ticket = await prisma.support_tickets.create({
      data: {
        subject: `[Contact Form - ${body.reason}] ${body.subject}`,
        description: `
Name: ${body.name}
Email: ${body.email}
Phone: ${body.phone || 'Not provided'}
Reason: ${body.reason}

Message:
${body.message}
        `.trim(),
        category: 'other',
        priority: 'medium',
        status: 'open',
        // user_id is null for anonymous contact form submissions
      },
    });

    // TODO: Send email notification to support team
    // TODO: Send confirmation email to user

    return NextResponse.json({
      success: true,
      message: 'Your message has been received. We will get back to you soon.',
      ticketId: ticket.id,
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit message' },
      { status: 500 }
    );
  }
}
