/**
 * Receipt Service
 * Generates PDF receipts for payment transactions
 */

import PDFDocument from 'pdfkit';
import { prisma } from '@thulobazaar/database';
import type { Readable } from 'stream';

interface ReceiptTransaction {
  id: number;
  transaction_id: string | null;
  payment_type: string | null;
  payment_gateway: string | null;
  amount: unknown;
  status: string | null;
  reference_id: string | null;
  created_at: Date | null;
  verified_at: Date | null;
  user_id: number;
  metadata: unknown;
}

interface ReceiptUser {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export async function getTransactionForReceipt(
  transactionId: string,
  userId: number
): Promise<ReceiptTransaction | null> {
  return prisma.payment_transactions.findFirst({
    where: {
      transaction_id: transactionId,
      user_id: userId,
    },
    select: {
      id: true,
      transaction_id: true,
      payment_type: true,
      payment_gateway: true,
      amount: true,
      status: true,
      reference_id: true,
      created_at: true,
      verified_at: true,
      user_id: true,
      metadata: true,
    },
  });
}

function formatPaymentType(type: string | null): string {
  switch (type) {
    case 'ad_promotion': return 'Ad Promotion';
    case 'individual_verification': return 'Individual Verification';
    case 'business_verification': return 'Business Verification';
    default: return type || 'Payment';
  }
}

function formatGateway(gateway: string | null): string {
  switch (gateway) {
    case 'khalti': return 'Khalti';
    case 'esewa': return 'eSewa';
    default: return gateway || 'N/A';
  }
}

function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kathmandu',
  });
}

function formatAmount(amount: unknown): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  return `NPR ${num.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateReceiptPDF(
  transaction: ReceiptTransaction,
  user: ReceiptUser
): typeof PDFDocument.prototype {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: `Receipt - ${transaction.transaction_id}`,
      Author: 'Thulo Bazaar',
    },
  });

  const primaryColor = '#DC143C';
  const grayColor = '#6B7280';
  const darkColor = '#111827';
  const lightGray = '#F3F4F6';

  // Header
  doc
    .fontSize(24)
    .fillColor(primaryColor)
    .text('Thulo Bazaar', 50, 50, { align: 'left' })
    .fontSize(10)
    .fillColor(grayColor)
    .text('thulobazaar.com.np', 50, 80)
    .text('Nepal\'s Marketplace', 50, 95);

  // Receipt title (right side)
  doc
    .fontSize(20)
    .fillColor(darkColor)
    .text('PAYMENT RECEIPT', 300, 50, { align: 'right' })
    .fontSize(10)
    .fillColor(grayColor)
    .text(`Receipt #: ${transaction.transaction_id || 'N/A'}`, 300, 78, { align: 'right' })
    .text(`Date: ${formatDate(transaction.created_at)}`, 300, 93, { align: 'right' });

  // Horizontal line
  doc
    .moveTo(50, 120)
    .lineTo(545, 120)
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .stroke();

  // Status badge
  const status = transaction.status || 'pending';
  const statusColor = status === 'verified' ? '#10B981' : status === 'pending' ? '#F59E0B' : '#EF4444';
  const statusLabel = status === 'verified' ? 'PAID' : status.toUpperCase();

  doc
    .roundedRect(50, 135, 80, 24, 4)
    .fill(statusColor);
  doc
    .fontSize(10)
    .fillColor('#FFFFFF')
    .text(statusLabel, 50, 141, { width: 80, align: 'center' });

  // Bill To section
  let y = 180;
  doc
    .fontSize(10)
    .fillColor(grayColor)
    .text('BILL TO', 50, y);
  y += 18;
  doc
    .fontSize(12)
    .fillColor(darkColor)
    .text(user.full_name || 'N/A', 50, y);
  y += 16;
  if (user.email) {
    doc.fontSize(10).fillColor(grayColor).text(user.email, 50, y);
    y += 14;
  }
  if (user.phone) {
    doc.fontSize(10).fillColor(grayColor).text(user.phone, 50, y);
    y += 14;
  }

  // Transaction details table
  y += 20;

  // Table header
  doc
    .rect(50, y, 495, 30)
    .fill(lightGray);
  doc
    .fontSize(10)
    .fillColor(grayColor)
    .text('Description', 60, y + 9)
    .text('Details', 350, y + 9, { width: 185, align: 'right' });

  y += 30;

  // Table rows
  const rows = [
    ['Payment Type', formatPaymentType(transaction.payment_type)],
    ['Payment Gateway', formatGateway(transaction.payment_gateway)],
    ['Transaction ID', transaction.transaction_id || 'N/A'],
    ['Reference ID', transaction.reference_id || 'N/A'],
    ['Payment Date', formatDate(transaction.created_at)],
  ];

  if (transaction.verified_at) {
    rows.push(['Verified Date', formatDate(transaction.verified_at)]);
  }

  // Extract metadata details if available
  const meta = transaction.metadata as Record<string, unknown> | null;
  if (meta) {
    if (meta.promotionType) {
      rows.push(['Promotion Type', String(meta.promotionType)]);
    }
    if (meta.durationDays) {
      rows.push(['Duration', `${meta.durationDays} days`]);
    }
  }

  for (const [label, value] of rows) {
    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor('#F3F4F6')
      .lineWidth(0.5)
      .stroke();

    doc
      .fontSize(10)
      .fillColor(darkColor)
      .text(label, 60, y + 8)
      .fillColor(grayColor)
      .text(value, 350, y + 8, { width: 185, align: 'right' });

    y += 30;
  }

  // Amount section
  y += 10;
  doc
    .moveTo(50, y)
    .lineTo(545, y)
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .stroke();

  y += 15;
  doc
    .rect(350, y, 195, 40)
    .fill(primaryColor);
  doc
    .fontSize(12)
    .fillColor('#FFFFFF')
    .text('Total Amount', 360, y + 5)
    .fontSize(16)
    .text(formatAmount(transaction.amount), 360, y + 20);

  // Footer
  const footerY = 700;
  doc
    .moveTo(50, footerY)
    .lineTo(545, footerY)
    .strokeColor('#E5E7EB')
    .lineWidth(0.5)
    .stroke();

  doc
    .fontSize(9)
    .fillColor(grayColor)
    .text('This is a computer-generated receipt and does not require a signature.', 50, footerY + 15, { align: 'center' })
    .text('Thulo Bazaar Pvt. Ltd. | thulobazaar.com.np | support@thulobazaar.com.np', 50, footerY + 30, { align: 'center' })
    .text(`Generated on ${new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: 'long', day: 'numeric' })}`, 50, footerY + 45, { align: 'center' });

  doc.end();
  return doc;
}

export async function getUserForReceipt(userId: number): Promise<ReceiptUser | null> {
  return prisma.users.findUnique({
    where: { id: userId },
    select: {
      full_name: true,
      email: true,
      phone: true,
    },
  });
}
