import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const VALID_REASONS = ['spam', 'fraud', 'inappropriate', 'duplicate', 'misleading', 'other'];

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
