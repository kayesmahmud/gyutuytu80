/**
 * Payment Routes
 * Handle payment initiation, callbacks, and verification for Khalti and eSewa
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { initiatePayment, verifyPayment, getAvailableGateways } from '../lib/payment/index.js';
import type { PaymentGateway, PaymentType } from '../lib/payment/types.js';
import {
  initiatePaymentTransaction,
  findTransactionByOrderId,
  findTransactionWithStatus,
  verifyGatewayPayment,
  updateTransactionStatus,
  handlePaymentSuccess,
  getTransactionStatus,
  getPaymentHistory,
  markTransactionCanceled,
} from '../services/payment.service.js';

const router = Router();

// ============================================================================
// Validation Helpers
// ============================================================================

function validateGateway(gateway: string): gateway is PaymentGateway {
  return ['khalti', 'esewa'].includes(gateway);
}

function validatePaymentType(type: string): type is PaymentType {
  return ['ad_promotion', 'individual_verification', 'business_verification'].includes(type);
}

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/payments/gateways
 * Get available payment gateways
 */
router.get('/gateways', (_req: Request, res: Response) => {
  const gateways = getAvailableGateways();
  res.json({ success: true, data: gateways });
});

/**
 * POST /api/payments/initiate
 * Initiate a payment with Khalti or eSewa
 */
router.post('/initiate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { gateway, amount, paymentType, relatedId, orderName, metadata, returnUrl } = req.body;

    // Validate gateway
    if (!gateway || !validateGateway(gateway)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment gateway. Use "khalti" or "esewa"',
      });
    }

    // Validate amount
    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount is NPR 10',
      });
    }

    // Validate payment type
    if (!paymentType || !validatePaymentType(paymentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment type',
      });
    }

    const result = await initiatePaymentTransaction({
      userId,
      gateway,
      amount,
      paymentType,
      relatedId,
      orderName,
      metadata,
      customReturnUrl: returnUrl,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Payment initiation failed',
      });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Payment initiation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: `Failed to initiate payment: ${errorMessage}`,
    });
  }
});

/**
 * GET /api/payments/callback
 * Handle payment gateway callbacks (redirects from Khalti/eSewa)
 */
router.get('/callback', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3333';

  try {
    // Get common params
    const gateway = req.query.gateway as PaymentGateway;
    const orderId = req.query.orderId as string;
    const paymentType = req.query.paymentType as PaymentType;
    const relatedId = req.query.relatedId as string | undefined;

    // Khalti params
    const pidx = req.query.pidx as string | undefined;
    const khaltiStatus = req.query.status as string | undefined;
    const khaltiTxnId = req.query.transaction_id as string | undefined;
    const khaltiAmount = req.query.amount as string | undefined;

    // eSewa params
    const esewaData = req.query.data as string | undefined;

    if (!orderId) {
      console.error('Payment callback: Missing orderId');
      return res.redirect(`${frontendUrl}/en/payment/failure?error=missing_order`);
    }

    // Find transaction
    const transaction = await findTransactionByOrderId(orderId);

    if (!transaction) {
      console.error(`Payment callback: Transaction not found: ${orderId}`);
      return res.redirect(`${frontendUrl}/en/payment/failure?error=transaction_not_found`);
    }

    // Handle Khalti user cancellation
    if (gateway === 'khalti' && khaltiStatus === 'User canceled') {
      await markTransactionCanceled(transaction.id, 'User canceled payment');
      return res.redirect(`${frontendUrl}/en/payment/failure?error=canceled&orderId=${orderId}`);
    }

    // Verify payment
    const verifyResult = await verifyGatewayPayment(
      { ...transaction, payment_gateway: gateway, related_id: null, status: null },
      gateway,
      pidx,
      esewaData
    );

    if ('error' in verifyResult && verifyResult.error) {
      console.error(`Payment callback: ${verifyResult.error}`);
      return res.redirect(`${frontendUrl}/en/payment/failure?error=invalid_gateway`);
    }

    // Update transaction status
    const verified = await updateTransactionStatus(
      transaction.id,
      verifyResult,
      transaction.metadata,
      { khaltiTxnId, esewaData: verifyResult.parsedEsewaData }
    );

    if (verified) {
      console.log(`✅ Payment verified: ${orderId} via ${gateway}`);
      await handlePaymentSuccess(transaction, paymentType, relatedId ? parseInt(relatedId, 10) : null);

      return res.redirect(
        `${frontendUrl}/en/payment/success?orderId=${orderId}&gateway=${gateway}&type=${paymentType}${relatedId ? `&relatedId=${relatedId}` : ''}`
      );
    }

    console.log(`❌ Payment failed/pending: ${orderId}, status: ${verifyResult.status}`);
    return res.redirect(
      `${frontendUrl}/en/payment/failure?orderId=${orderId}&status=${verifyResult.status}&error=${encodeURIComponent(verifyResult.error || '')}`
    );
  } catch (error) {
    console.error('Payment callback error:', error);
    return res.redirect(`${frontendUrl}/en/payment/failure?error=internal_error`);
  }
});

/**
 * POST /api/payments/verify
 * Manually verify a payment (for mobile apps)
 */
router.post('/verify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { transactionId, pidx, esewaData } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
      });
    }

    // Find transaction
    const transaction = await findTransactionWithStatus(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Already verified
    if (transaction.status === 'verified') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        data: { status: 'verified', transactionId },
      });
    }

    const gateway = transaction.payment_gateway as PaymentGateway;

    if (!gateway || !validateGateway(gateway)) {
      return res.status(400).json({
        success: false,
        message: `Unknown gateway: ${gateway}`,
      });
    }

    // Verify payment
    const verifyResult = await verifyGatewayPayment(transaction, gateway, pidx, esewaData);

    if ('error' in verifyResult && verifyResult.error && !verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.error,
      });
    }

    // Update transaction
    const verified = await updateTransactionStatus(transaction.id, verifyResult, transaction.metadata);

    if (verified) {
      await handlePaymentSuccess(
        { ...transaction, transaction_id: transaction.transaction_id || '' },
        transaction.payment_type as PaymentType,
        transaction.related_id
      );

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          status: 'verified',
          transactionId,
          amount: verifyResult.amount,
          gateway,
        },
      });
    } else {
      res.json({
        success: false,
        message: verifyResult.error || `Payment ${verifyResult.status}`,
        data: { status: verifyResult.status, transactionId },
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
    });
  }
});

/**
 * GET /api/payments/status/:transactionId
 * Get payment status
 */
router.get('/status/:transactionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user!.userId;

    const transaction = await getTransactionStatus(transactionId, userId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: {
        transactionId: transaction.transaction_id,
        paymentType: transaction.payment_type,
        gateway: transaction.payment_gateway,
        amount: transaction.amount,
        status: transaction.status,
        paymentUrl: transaction.payment_url,
        referenceId: transaction.reference_id,
        createdAt: transaction.created_at,
        verifiedAt: transaction.verified_at,
        failureReason: transaction.failure_reason,
      },
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
    });
  }
});

/**
 * GET /api/payments/history
 * Get user's payment history
 */
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { page, limit, status, type } = req.query as Record<string, string>;

    const result = await getPaymentHistory(userId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      type,
    });

    res.json({
      success: true,
      data: result.transactions.map(t => ({
        transactionId: t.transaction_id,
        paymentType: t.payment_type,
        gateway: t.payment_gateway,
        amount: t.amount,
        status: t.status,
        referenceId: t.reference_id,
        createdAt: t.created_at,
        verifiedAt: t.verified_at,
      })),
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
    });
  }
});

export default router;
