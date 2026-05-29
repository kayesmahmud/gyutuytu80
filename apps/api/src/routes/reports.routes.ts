import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const VALID_REASONS = ['spam', 'fraud', 'inappropriate', 'duplicate', 'misleading', 'other'];
const VALID_USER_REPORT_REASONS = ['spam', 'scam', 'harassment', 'inappropriate', 'impersonation', 'other'];

/**
 * POST /api/reports/user
 * Report a user (e.g. from a chat conversation)
 */
router.post('/user', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { reportedUserId, reason, details, conversationId } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Reported user ID and reason are required',
      });
    }

    if (!VALID_USER_REPORT_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reason. Must be one of: ${VALID_USER_REPORT_REASONS.join(', ')}`,
      });
    }

    const reportedId = parseInt(String(reportedUserId), 10);
    if (reportedId === userId) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself' });
    }

    const reportedUser = await prisma.users.findUnique({
      where: { id: reportedId },
      select: { id: true },
    });
    if (!reportedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Allow a new report only if there is no pending report from this reporter
    const existingPending = await prisma.user_reports.findFirst({
      where: { reported_user_id: reportedId, reporter_id: userId, status: 'pending' },
    });
    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending report for this user',
      });
    }

    const report = await prisma.user_reports.upsert({
      where: { reported_user_id_reporter_id: { reported_user_id: reportedId, reporter_id: userId } },
      update: {
        reason,
        details: details || null,
        status: 'pending',
        conversation_id: conversationId ? parseInt(String(conversationId), 10) : null,
        admin_notes: null,
        resolved_by: null,
        updated_at: new Date(),
      },
      create: {
        reported_user_id: reportedId,
        reporter_id: userId,
        reason,
        details: details || null,
        status: 'pending',
        conversation_id: conversationId ? parseInt(String(conversationId), 10) : null,
      },
    });

    console.log(`✅ User ${reportedId} reported by user ${userId} for reason: ${reason}`);

    return res.status(201).json({
      success: true,
      message: 'User reported successfully. Our team will review it shortly.',
      data: { id: report.id, createdAt: report.created_at },
    });
  } catch (error: any) {
    console.error('User report creation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to report user' });
  }
});

/**
 * POST /api/reports
 * Report an ad for inappropriate content
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { adId, reason, details } = req.body;

    if (!adId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Ad ID and reason are required',
      });
    }

    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reason. Must be one of: ${VALID_REASONS.join(', ')}`,
      });
    }

    const ad = await prisma.ads.findUnique({
      where: { id: parseInt(adId, 10) },
      select: { id: true, user_id: true },
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    if (ad.user_id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report your own ad',
      });
    }

    const existingReport = await prisma.ad_reports.findFirst({
      where: { ad_id: ad.id, reporter_id: userId },
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this ad',
      });
    }

    const report = await prisma.ad_reports.create({
      data: {
        ad_id: ad.id,
        reporter_id: userId,
        reason,
        details: details || null,
        status: 'pending',
      },
    });

    console.log(`✅ Ad ${ad.id} reported by user ${userId} for reason: ${reason}`);

    return res.status(201).json({
      success: true,
      message: 'Ad reported successfully. Our team will review it shortly.',
      data: { id: report.id, createdAt: report.created_at },
    });
  } catch (error: any) {
    console.error('Report creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to report ad',
    });
  }
});

export default router;
