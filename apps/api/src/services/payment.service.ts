/**
 * Payment Service
 * Handles payment initiation, verification, and success processing
 */

import { prisma } from '@thulobazaar/database';
import { initiatePayment, verifyPayment, getAvailableGateways, decodeEsewaCallback } from '../lib/payment/index.js';
import type { PaymentGateway, PaymentType } from '../lib/payment/types.js';

// ============================================================================
// Types
// ============================================================================

export interface InitiatePaymentInput {
  userId: number;
  gateway: PaymentGateway;
  amount: number;
  paymentType: PaymentType;
  relatedId?: number;
  orderName?: string;
  metadata?: Record<string, unknown>;
  customReturnUrl?: string;
}

export interface VerifyPaymentInput {
  transactionId: string;
  pidx?: string;
  esewaData?: string;
}

export interface PaymentTransaction {
  id: number;
  user_id: number;
  payment_type: string;
  payment_gateway: string | null;
  amount: unknown;
  metadata: unknown;
  transaction_id: string | null;
  related_id: number | null;
  status: string | null;
}

// ============================================================================
// Helpers
// ============================================================================

function generateOrderId(paymentType: PaymentType): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TB_${paymentType.toUpperCase().slice(0, 3)}_${timestamp}_${random}`;
}

function buildReturnUrl(
  baseUrl: string,
  gateway: PaymentGateway,
  orderId: string,
  paymentType: PaymentType,
  relatedId?: number,
  customReturnUrl?: string
): string {
  if (customReturnUrl) return customReturnUrl;

  let returnUrl = `${baseUrl}/api/payments/callback?gateway=${gateway}&orderId=${orderId}&paymentType=${paymentType}`;
  if (relatedId) {
    returnUrl += `&relatedId=${relatedId}`;
  }
  return returnUrl;
}

function parseMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }
  return metadata as Record<string, unknown>;
}

// ============================================================================
// Payment Initiation
// ============================================================================

export async function initiatePaymentTransaction(input: InitiatePaymentInput) {
  const {
    userId,
    gateway,
    amount,
    paymentType,
    relatedId,
    orderName,
    metadata,
    customReturnUrl,
  } = input;

  const orderId = generateOrderId(paymentType);
  const baseUrl = process.env.APP_URL || 'http://localhost:5000';
  const returnUrl = buildReturnUrl(baseUrl, gateway, orderId, paymentType, relatedId, customReturnUrl);

  // Get user info for payment
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { full_name: true, email: true, phone: true },
  });

  // Create payment transaction record
  const transaction = await prisma.payment_transactions.create({
    data: {
      user_id: userId,
      payment_type: paymentType,
      payment_gateway: gateway,
      amount: amount,
      transaction_id: orderId,
      related_id: relatedId || null,
      status: 'pending',
      metadata: JSON.stringify({
        ...metadata,
        orderName: orderName || `ThuluBazaar ${paymentType.replace('_', ' ')}`,
        initiatedAt: new Date().toISOString(),
      }),
    },
  });

  // Initiate payment with gateway
  const result = await initiatePayment({
    gateway,
    amount,
    paymentType,
    orderId,
    orderName: orderName || `ThuluBazaar ${paymentType.replace('_', ' ')}`,
    userId,
    returnUrl,
    metadata: {
      ...metadata,
      userName: user?.full_name || 'Customer',
      userEmail: user?.email || '',
      userPhone: user?.phone || '',
      transactionDbId: transaction.id,
    },
  });

  if (!result.success) {
    // Update transaction as failed
    await prisma.payment_transactions.update({
      where: { id: transaction.id },
      data: {
        status: 'failed',
        failure_reason: result.error,
      },
    });

    return { success: false, error: result.error };
  }

  // Update transaction with gateway response
  await prisma.payment_transactions.update({
    where: { id: transaction.id },
    data: {
      payment_url: result.paymentUrl,
      metadata: JSON.stringify({
        ...parseMetadata(transaction.metadata),
        pidx: result.pidx,
        expiresAt: result.expiresAt,
      }),
    },
  });

  console.log(`✅ Payment initiated: ${orderId} via ${gateway}, amount: NPR ${amount}`);

  return {
    success: true,
    data: {
      transactionId: orderId,
      paymentUrl: result.paymentUrl,
      gateway,
      amount,
      pidx: result.pidx,
      expiresAt: result.expiresAt,
    },
  };
}

// ============================================================================
// Payment Verification
// ============================================================================

export async function verifyGatewayPayment(
  transaction: PaymentTransaction,
  gateway: PaymentGateway,
  pidx?: string,
  esewaData?: string
) {
  let verifyResult;
  let parsedEsewaData: Record<string, unknown> | null = null;

  if (gateway === 'khalti') {
    const transactionPidx = pidx || parseMetadata(transaction.metadata).pidx as string;

    verifyResult = await verifyPayment({
      gateway: 'khalti',
      transactionId: transaction.transaction_id || '',
      pidx: transactionPidx,
      amount: transaction.amount ? parseFloat(transaction.amount.toString()) : 0,
    });
  } else if (gateway === 'esewa') {
    if (esewaData) {
      parsedEsewaData = decodeEsewaCallback(esewaData);
    }

    if (parsedEsewaData?.status === 'COMPLETE') {
      verifyResult = {
        success: true,
        status: 'completed' as const,
        transactionId: transaction.transaction_id || '',
        amount: parseFloat(String(parsedEsewaData.total_amount)) || 0,
        gateway: 'esewa' as const,
        gatewayTransactionId: String(parsedEsewaData.transaction_code),
      };
    } else {
      verifyResult = await verifyPayment({
        gateway: 'esewa',
        transactionId: transaction.transaction_id || '',
        amount: transaction.amount ? parseFloat(transaction.amount.toString()) : 0,
      });
    }
  } else {
    return { success: false, error: `Unknown gateway: ${gateway}` };
  }

  return { ...verifyResult, parsedEsewaData };
}

export async function updateTransactionStatus(
  transactionId: number,
  verifyResult: any,
  originalMetadata: unknown,
  additionalData?: Record<string, unknown>
) {
  if (verifyResult.success && verifyResult.status === 'completed') {
    await prisma.payment_transactions.update({
      where: { id: transactionId },
      data: {
        status: 'verified',
        verified_at: new Date(),
        reference_id: verifyResult.gatewayTransactionId || null,
        metadata: JSON.stringify({
          ...parseMetadata(originalMetadata),
          verifiedAt: new Date().toISOString(),
          gatewayResponse: verifyResult,
          ...additionalData,
        }),
      },
    });
    return true;
  }

  await prisma.payment_transactions.update({
    where: { id: transactionId },
    data: {
      status: verifyResult.status === 'pending' ? 'pending' : 'failed',
      failure_reason: verifyResult.error || `Payment ${verifyResult.status}`,
    },
  });
  return false;
}

// ============================================================================
// Payment Success Handlers
// ============================================================================

export async function handlePaymentSuccess(
  transaction: { id: number; user_id: number; payment_type: string; amount: unknown; metadata: unknown; transaction_id: string | null },
  paymentType: PaymentType,
  relatedId: number | null
) {
  try {
    const metadata = parseMetadata(transaction.metadata);

    switch (paymentType) {
      case 'ad_promotion':
        await handleAdPromotionSuccess(transaction, metadata, relatedId);
        break;

      case 'individual_verification':
        await handleIndividualVerificationSuccess(transaction, relatedId);
        break;

      case 'business_verification':
        await handleBusinessVerificationSuccess(transaction, relatedId);
        break;
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handleAdPromotionSuccess(
  transaction: { id: number; user_id: number; amount: unknown },
  metadata: Record<string, unknown>,
  relatedId: number | null
) {
  if (!relatedId) {
    console.error('Ad promotion payment missing relatedId (adId)');
    return;
  }

  const { promotionType, durationDays } = metadata;
  if (!promotionType || !durationDays) {
    console.error('Ad promotion payment missing metadata');
    return;
  }

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(String(durationDays), 10));

  // Get user account type for pricing record
  const user = await prisma.users.findUnique({
    where: { id: transaction.user_id },
    select: { account_type: true, business_verification_status: true, individual_verified: true },
  });

  let accountType = 'individual';
  if (user?.business_verification_status === 'approved') {
    accountType = 'business';
  } else if (user?.individual_verified) {
    accountType = 'individual_verified';
  }

  // Get the ad to find its owner
  const ad = await prisma.ads.findUnique({
    where: { id: relatedId },
    select: { user_id: true },
  });

  const adOwnerId = ad?.user_id ?? transaction.user_id;

  // Deactivate existing promotions
  await prisma.ad_promotions.updateMany({
    where: { ad_id: relatedId, is_active: true },
    data: { is_active: false },
  });

  // Create promotion record
  await prisma.ad_promotions.create({
    data: {
      ad_id: relatedId,
      user_id: adOwnerId,
      promoted_by: transaction.user_id,
      promotion_type: String(promotionType),
      duration_days: parseInt(String(durationDays), 10),
      price_paid: transaction.amount as number,
      account_type: accountType,
      payment_reference: transaction.id.toString(),
      payment_method: 'online',
      starts_at: new Date(),
      expires_at: expiresAt,
      is_active: true,
    },
  });

  // Log if someone else promoted this ad
  if (transaction.user_id !== adOwnerId) {
    console.log(`🎁 User ${transaction.user_id} promoted ad ${relatedId} owned by user ${adOwnerId}`);
  }

  // Update ad with promotion flags
  const updateData: Record<string, unknown> = {
    promoted_at: new Date(),
  };

  if (promotionType === 'featured') {
    updateData.is_featured = true;
    updateData.featured_until = expiresAt;
  } else if (promotionType === 'urgent') {
    updateData.is_urgent = true;
    updateData.urgent_until = expiresAt;
  } else if (promotionType === 'sticky') {
    updateData.is_sticky = true;
    updateData.sticky_until = expiresAt;
  }

  await prisma.ads.update({
    where: { id: relatedId },
    data: updateData,
  });

  console.log(`✅ Ad ${relatedId} promoted as ${promotionType} until ${expiresAt.toISOString()}`);
}

async function handleIndividualVerificationSuccess(
  transaction: { transaction_id: string | null; user_id: number },
  relatedId: number | null
) {
  if (!relatedId) {
    console.error('Individual verification payment missing relatedId (verificationRequestId)');
    return;
  }

  await prisma.individual_verification_requests.update({
    where: { id: relatedId },
    data: {
      status: 'pending',
      payment_status: 'paid',
      payment_reference: transaction.transaction_id || '',
    },
  });

  console.log(`✅ Individual verification ${relatedId} activated after payment for user ${transaction.user_id}`);
}

async function handleBusinessVerificationSuccess(
  transaction: { transaction_id: string | null; user_id: number },
  relatedId: number | null
) {
  if (!relatedId) {
    console.error('Business verification payment missing relatedId (verificationRequestId)');
    return;
  }

  await prisma.business_verification_requests.update({
    where: { id: relatedId },
    data: {
      status: 'pending',
      payment_status: 'paid',
      payment_reference: transaction.transaction_id || '',
    },
  });

  console.log(`✅ Business verification ${relatedId} activated after payment for user ${transaction.user_id}`);
}

// ============================================================================
// Transaction Queries
// ============================================================================

export async function findTransactionByOrderId(orderId: string) {
  return prisma.payment_transactions.findFirst({
    where: { transaction_id: orderId },
    select: {
      id: true,
      user_id: true,
      payment_type: true,
      amount: true,
      metadata: true,
      transaction_id: true,
    },
  });
}

export async function findTransactionWithStatus(transactionId: string) {
  return prisma.payment_transactions.findFirst({
    where: { transaction_id: transactionId },
    select: {
      id: true,
      user_id: true,
      payment_type: true,
      payment_gateway: true,
      amount: true,
      metadata: true,
      transaction_id: true,
      related_id: true,
      status: true,
    },
  });
}

export async function getTransactionStatus(transactionId: string, userId: number) {
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
      payment_url: true,
      reference_id: true,
      created_at: true,
      verified_at: true,
      failure_reason: true,
    },
  });
}

export async function getPaymentHistory(
  userId: number,
  options: { page?: number; limit?: number; status?: string; type?: string }
) {
  const pageNum = options.page || 1;
  const limitNum = Math.min(options.limit || 10, 50);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { user_id: userId };
  if (options.status) where.status = options.status;
  if (options.type) where.payment_type = options.type;

  const [transactions, total] = await Promise.all([
    prisma.payment_transactions.findMany({
      where,
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
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.payment_transactions.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

export async function markTransactionCanceled(transactionId: number, reason: string) {
  await prisma.payment_transactions.update({
    where: { id: transactionId },
    data: { status: 'canceled', failure_reason: reason },
  });
}
