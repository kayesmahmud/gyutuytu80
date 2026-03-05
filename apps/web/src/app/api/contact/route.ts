/**
 * Contact Form API
 * POST /api/contact - Submit a contact form message
 */

import { NextRequest, NextResponse } from 'next/server';

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

    // Log the contact form submission
    // TODO: Create a dedicated contact_messages table for anonymous submissions
    // TODO: Send email notification to support team
    // TODO: Send confirmation email to user
    console.log('📩 Contact form submission:', {
      name: body.name,
      email: body.email,
      phone: body.phone || 'Not provided',
      reason: body.reason,
      subject: body.subject,
      message: body.message,
    });

    return NextResponse.json({
      success: true,
      message: 'Your message has been received. We will get back to you soon.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit message' },
      { status: 500 }
    );
  }
}
