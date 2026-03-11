import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

// ── Shared helpers ───────────────────────────────────────────────────

function formatAvgHours(avgHours: number): string {
  if (avgHours <= 0) return 'N/A';
  if (avgHours < 1) return `${Math.round(avgHours * 60)}m`;
  if (avgHours < 24) return `${avgHours.toFixed(1)}h`;
  return `${(avgHours / 24).toFixed(1)}d`;
}

function formatChange(change: number): string {
  if (change === 0) return '0%';
  const sign = change > 0 ? '+' : '';
  return `${sign}${Math.round(change)}%`;
}

/**
 * GET /api/editor/dashboard-data
 * Combined endpoint — returns ALL dashboard data in a single request.
 * Replaces 10 separate API calls with 1, using SQL aggregation where possible.
 */
router.get(
  '/dashboard-data',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Date boundaries
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fire ALL queries in parallel
    const [
      // Stats (6 counts)
      totalUsers, totalAds, pendingAds, approvedAds, rejectedAds, pendingVerificationsUsers,
      // Avg response time via SQL aggregation (30 days)
      avgResponseRaw,
      // Avg response time trend via SQL aggregation (current 7 days + previous 7 days)
      avgResponseTrendRaw,
      // Trends (4 counts)
      pastPendingAds, currentPendingVerifications, pastPendingVerifications,
      // Notifications (3 counts)
      urgentReports, oldPendingAds, oldVerifications,
      // System alerts (3 counts — shares scam/fraud with notifications)
      alertOldPendingAds, alertOldVerifications,
      // Support chat count
      supportChatCount,
      // Reported ads count
      reportedAdsCount,
      // Verification badge counts
      businessVerificationCount, individualVerificationCount,
      // Pending tasks (real data)
      recentScamReports, oldestPendingVerifications, pendingAdsByCategory,
      // My work today (6 queries)
      adsApprovedToday, adsRejectedToday, adsEditedToday,
      businessVerificationsToday, individualVerificationsToday, supportTicketsToday,
    ] = await Promise.all([
      // ── Stats ──
      prisma.users.count(),
      prisma.ads.count(),
      prisma.ads.count({ where: { status: 'pending' } }),
      prisma.ads.count({ where: { status: 'approved' } }),
      prisma.ads.count({ where: { status: 'rejected' } }),
      // Pending verifications = actual pending requests, not unverified users
      Promise.all([
        prisma.business_verification_requests.count({ where: { status: 'pending' } }),
        prisma.individual_verification_requests.count({ where: { status: 'pending' } }),
      ]).then(([biz, ind]) => biz + ind),

      // ── Avg response time (SQL aggregation instead of fetching all rows) ──
      prisma.$queryRaw<[{ avg_hours: number | null; count: bigint }]>`
        SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600) as avg_hours,
               COUNT(*) as count
        FROM ads
        WHERE reviewed_at >= ${thirtyDaysAgo} AND reviewed_at IS NOT NULL AND created_at IS NOT NULL
      `,

      // ── Avg response time trend (SQL aggregation for both windows) ──
      prisma.$queryRaw<[{ period: string; avg_hours: number | null }]>`
        SELECT
          CASE
            WHEN reviewed_at >= ${sevenDaysAgo} THEN 'current'
            ELSE 'previous'
          END as period,
          AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600) as avg_hours
        FROM ads
        WHERE reviewed_at >= ${fourteenDaysAgo} AND reviewed_at IS NOT NULL AND created_at IS NOT NULL
        GROUP BY period
      `,

      // ── Trends ──
      prisma.ads.count({ where: { status: 'pending', created_at: { lte: sevenDaysAgo } } }),
      // Current pending verification requests (both types combined)
      Promise.all([
        prisma.business_verification_requests.count({ where: { status: 'pending' } }),
        prisma.individual_verification_requests.count({ where: { status: 'pending' } }),
      ]).then(([biz, ind]) => biz + ind),
      // Past pending verification requests (created 7+ days ago)
      Promise.all([
        prisma.business_verification_requests.count({ where: { status: 'pending', created_at: { lte: sevenDaysAgo } } }),
        prisma.individual_verification_requests.count({ where: { status: 'pending', created_at: { lte: sevenDaysAgo } } }),
      ]).then(([biz, ind]) => biz + ind),

      // ── Notifications ──
      prisma.ad_reports.count({ where: { status: 'pending', reason: { in: ['scam', 'fraud'] } } }),
      prisma.ads.count({ where: { status: 'pending', created_at: { lt: threeDaysAgo } } }),
      prisma.users.count({ where: { business_verification_status: 'pending', created_at: { lt: sevenDaysAgo } } }),

      // ── System alerts (reuse urgentReports above, just need different date thresholds) ──
      prisma.ads.count({ where: { status: 'pending', created_at: { lt: twoDaysAgo } } }),
      prisma.users.count({ where: { business_verification_status: 'pending', created_at: { lt: fiveDaysAgo } } }),

      // ── Support chat ──
      prisma.ad_reports.count({ where: { status: 'pending', admin_notes: null } }),

      // ── Reported ads ──
      prisma.ad_reports.count({ where: { status: 'pending' } }),

      // ── Verification badge counts ──
      prisma.business_verification_requests.count({ where: { status: 'pending' } }),
      prisma.individual_verification_requests.count({ where: { status: 'pending' } }),

      // ── Pending tasks (real data for dashboard widget) ──
      // Latest scam/fraud reports
      prisma.ad_reports.findMany({
        where: { status: 'pending', reason: { in: ['scam', 'fraud'] } },
        select: { id: true, reason: true, details: true, created_at: true, ads: { select: { title: true } } },
        orderBy: { created_at: 'desc' },
        take: 3,
      }),
      // Oldest pending business verifications
      prisma.business_verification_requests.findMany({
        where: { status: 'pending' },
        select: { id: true, business_name: true, created_at: true },
        orderBy: { created_at: 'asc' },
        take: 3,
      }),
      // Pending ads grouped by top category
      prisma.$queryRaw<{ category_name: string; count: bigint }[]>`
        SELECT c.name as category_name, COUNT(*)::bigint as count
        FROM ads a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'pending' AND a.deleted_at IS NULL
        GROUP BY c.name
        ORDER BY count DESC
        LIMIT 3
      `,

      // ── My work today ──
      prisma.ads.count({ where: { status: 'approved', reviewed_by: userId, reviewed_at: { gte: today } } }),
      prisma.ads.count({ where: { status: 'rejected', reviewed_by: userId, reviewed_at: { gte: today } } }),
      prisma.admin_activity_logs.count({
        where: { admin_id: userId, action_type: { contains: 'edit' }, created_at: { gte: today } },
      }).catch(() => 0),
      prisma.business_verification_requests.count({
        where: { reviewed_by: userId, reviewed_at: { gte: today }, status: { in: ['approved', 'rejected'] } },
      }).catch(() => 0),
      prisma.individual_verification_requests.count({
        where: { reviewed_by: userId, reviewed_at: { gte: today }, status: { in: ['approved', 'rejected'] } },
      }).catch(() => 0),
      prisma.support_messages.groupBy({
        by: ['ticket_id'],
        where: { sender_id: userId, created_at: { gte: today } },
      }).then((r) => r.length).catch(() => 0),
    ]);

    // ── Process avg response time ──
    const avgHours = Number(avgResponseRaw[0]?.avg_hours) || 0;

    // ── Process avg response time trend ──
    const currentAvg = Number(avgResponseTrendRaw.find((r) => r.period === 'current')?.avg_hours) || 0;
    const previousAvg = Number(avgResponseTrendRaw.find((r) => r.period === 'previous')?.avg_hours) || 0;
    let improvementPercent = 0;
    let trendText = 'No change';
    if (previousAvg > 0 && currentAvg > 0) {
      improvementPercent = ((currentAvg - previousAvg) / previousAvg) * 100;
      if (improvementPercent < -5) trendText = `Improved ${Math.abs(Math.round(improvementPercent))}%`;
      else if (improvementPercent > 5) trendText = `Slower by ${Math.round(improvementPercent)}%`;
      else trendText = 'Stable';
    }

    // ── Process trends ──
    let pendingAdsChange = 0;
    if (pastPendingAds > 0) pendingAdsChange = ((pendingAds - pastPendingAds) / pastPendingAds) * 100;
    else if (pendingAds > 0) pendingAdsChange = 100;

    let verificationsChangeVal = 0;
    if (pastPendingVerifications > 0) verificationsChangeVal = ((currentPendingVerifications - pastPendingVerifications) / pastPendingVerifications) * 100;
    else if (currentPendingVerifications > 0) verificationsChangeVal = 100;

    // ── Process system alerts ──
    const alerts: Array<{ message: string; type: string; count: number }> = [];
    if (urgentReports > 0) {
      alerts.push({ message: `${urgentReports} scam/fraud ${urgentReports === 1 ? 'report' : 'reports'} need immediate attention`, type: 'danger', count: urgentReports });
    }
    if (alertOldPendingAds > 0) {
      alerts.push({ message: `${alertOldPendingAds} ${alertOldPendingAds === 1 ? 'ad has' : 'ads have'} been pending for 2+ days`, type: 'warning', count: alertOldPendingAds });
    }
    if (alertOldVerifications > 0) {
      alerts.push({ message: `${alertOldVerifications} ${alertOldVerifications === 1 ? 'verification' : 'verifications'} pending for 5+ days`, type: 'warning', count: alertOldVerifications });
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers, totalAds, pendingAds, approvedAds, rejectedAds,
          pendingVerifications: pendingVerificationsUsers,
          avgResponseTime: formatAvgHours(avgHours),
          pendingChange: formatChange(pendingAdsChange),
          verificationsChange: formatChange(verificationsChangeVal),
        },
        avgResponseTimeTrend: {
          improvementPercent: Math.round(improvementPercent),
          formattedText: trendText,
          isImproved: improvementPercent < 0,
        },
        notifications: {
          count: urgentReports + oldPendingAds + oldVerifications,
        },
        systemAlert: alerts.length > 0 ? alerts[0] : null,
        badgeCounts: {
          pendingAds,
          businessVerifications: businessVerificationCount,
          individualVerifications: individualVerificationCount,
          supportChat: supportChatCount,
          reportedAds: reportedAdsCount,
        },
        myWorkToday: {
          adsApprovedToday,
          adsRejectedToday,
          adsEditedToday,
          businessVerificationsToday,
          individualVerificationsToday,
          supportTicketsAssigned: supportTicketsToday,
        },
        pendingTasks: [
          // Scam/fraud reports
          ...recentScamReports.map((r) => ({
            type: 'scam_report' as const,
            title: 'Scam Report',
            description: `Reported: ${r.ads?.title || 'Unknown ad'} — ${r.reason}`,
            priority: 'high' as const,
            createdAt: r.created_at?.toISOString() || null,
            linkId: r.id,
          })),
          // Pending verifications
          ...oldestPendingVerifications.map((v) => ({
            type: 'business_verification' as const,
            title: 'Business Verification',
            description: `${v.business_name} — Documents submitted`,
            priority: 'medium' as const,
            createdAt: v.created_at?.toISOString() || null,
            linkId: v.id,
          })),
          // Pending ads by category
          ...pendingAdsByCategory.map((c) => ({
            type: 'ad_review' as const,
            title: 'Ad Review Batch',
            description: `${Number(c.count)} ${c.category_name || 'Uncategorized'} ads pending review`,
            priority: (Number(c.count) > 10 ? 'high' : 'medium') as 'high' | 'medium',
            createdAt: null,
            linkId: null,
          })),
        ],
      },
    });
  })
);

/**
 * GET /api/editor/reported-ads/count
 * Get pending reported ads count
 */
router.get(
  '/reported-ads/count',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const count = await prisma.ad_reports.count({ where: { status: 'pending' } });
    res.json({ success: true, data: { count } });
  })
);

/**
 * GET /api/editor/stats
 * Get dashboard statistics
 */
router.get(
  '/stats',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const [totalUsers, totalAds, pendingAds, approvedAds, rejectedAds, pendingVerifications] =
      await Promise.all([
        prisma.users.count(),
        prisma.ads.count(),
        prisma.ads.count({ where: { status: 'pending' } }),
        prisma.ads.count({ where: { status: 'approved' } }),
        prisma.ads.count({ where: { status: 'rejected' } }),
        prisma.users.count({
          where: {
            OR: [
              { business_verification_status: 'pending' },
              { individual_verified: false },
            ],
          },
        }),
      ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAds,
        pendingAds,
        approvedAds,
        rejectedAds,
        pendingVerifications,
      },
    });
  })
);

/**
 * GET /api/editor/notifications/count
 * Get urgent notifications/alerts count
 */
router.get(
  '/notifications/count',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [urgentReports, oldPendingAds, oldVerifications] = await Promise.all([
      prisma.ad_reports.count({
        where: {
          status: 'pending',
          reason: { in: ['scam', 'fraud'] },
        },
      }),
      prisma.ads.count({
        where: {
          status: 'pending',
          created_at: { lt: threeDaysAgo },
        },
      }),
      prisma.users.count({
        where: {
          business_verification_status: 'pending',
          created_at: { lt: sevenDaysAgo },
        },
      }),
    ]);

    const totalNotifications = urgentReports + oldPendingAds + oldVerifications;

    res.json({
      success: true,
      data: {
        count: totalNotifications,
        breakdown: {
          urgentReports,
          oldPendingAds,
          oldVerifications,
        },
      },
    });
  })
);

/**
 * GET /api/editor/system-alerts
 * Get system alerts for dashboard
 */
router.get(
  '/system-alerts',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const [scamReports, oldPendingAds, oldVerifications] = await Promise.all([
      prisma.ad_reports.count({
        where: {
          status: 'pending',
          reason: { in: ['scam', 'fraud'] },
        },
      }),
      prisma.ads.count({
        where: {
          status: 'pending',
          created_at: { lt: twoDaysAgo },
        },
      }),
      prisma.users.count({
        where: {
          business_verification_status: 'pending',
          created_at: { lt: fiveDaysAgo },
        },
      }),
    ]);

    const alerts: Array<{ message: string; type: string; count: number }> = [];

    if (scamReports > 0) {
      alerts.push({
        message: `${scamReports} scam/fraud ${scamReports === 1 ? 'report' : 'reports'} need immediate attention`,
        type: 'danger',
        count: scamReports,
      });
    }

    if (oldPendingAds > 0) {
      alerts.push({
        message: `${oldPendingAds} ${oldPendingAds === 1 ? 'ad has' : 'ads have'} been pending for 2+ days`,
        type: 'warning',
        count: oldPendingAds,
      });
    }

    if (oldVerifications > 0) {
      alerts.push({
        message: `${oldVerifications} ${oldVerifications === 1 ? 'verification' : 'verifications'} pending for 5+ days`,
        type: 'warning',
        count: oldVerifications,
      });
    }

    res.json({
      success: true,
      data: alerts.length > 0 ? alerts[0] : null,
    });
  })
);

/**
 * GET /api/editor/avg-response-time
 * Get average response time
 */
router.get(
  '/avg-response-time',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.$queryRaw<[{ avg_hours: number | null }]>`
      SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600) as avg_hours
      FROM ads
      WHERE reviewed_at >= ${thirtyDaysAgo} AND reviewed_at IS NOT NULL AND created_at IS NOT NULL
    `;

    const avgHours = Number(result[0]?.avg_hours) || 0;

    res.json({
      success: true,
      data: {
        avgResponseTime: formatAvgHours(avgHours),
        breakdown: {
          adsAvgHours: avgHours,
          combinedAvgHours: avgHours,
        },
      },
    });
  })
);

/**
 * GET /api/editor/trends
 * Get trends (percentage changes)
 */
router.get(
  '/trends',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [currentPendingAds, pastPendingAds, currentPendingVerifications, pastPendingVerifications] =
      await Promise.all([
        prisma.ads.count({ where: { status: 'pending' } }),
        prisma.ads.count({
          where: {
            status: 'pending',
            created_at: { lte: sevenDaysAgo },
          },
        }),
        prisma.users.count({ where: { business_verification_status: 'pending' } }),
        prisma.users.count({
          where: {
            business_verification_status: 'pending',
            created_at: { lte: sevenDaysAgo },
          },
        }),
      ]);

    let pendingAdsChange = 0;
    if (pastPendingAds > 0) {
      pendingAdsChange = ((currentPendingAds - pastPendingAds) / pastPendingAds) * 100;
    } else if (currentPendingAds > 0) {
      pendingAdsChange = 100;
    }

    let verificationsChange = 0;
    if (pastPendingVerifications > 0) {
      verificationsChange =
        ((currentPendingVerifications - pastPendingVerifications) / pastPendingVerifications) * 100;
    } else if (currentPendingVerifications > 0) {
      verificationsChange = 100;
    }

    res.json({
      success: true,
      data: {
        pendingChange: formatChange(pendingAdsChange),
        verificationsChange: formatChange(verificationsChange),
        breakdown: {
          currentPendingAds,
          pastPendingAds,
          pendingAdsChangePercent: pendingAdsChange,
          currentPendingVerifications,
          pastPendingVerifications,
          verificationsChangePercent: verificationsChange,
        },
      },
    });
  })
);

/**
 * GET /api/editor/support-chat/count
 * Get support chat count
 */
router.get(
  '/support-chat/count',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const count = await prisma.ad_reports.count({
      where: {
        status: 'pending',
        admin_notes: null,
      },
    });

    res.json({
      success: true,
      data: { count },
    });
  })
);

/**
 * GET /api/editor/avg-response-time/trend
 * Get average response time trend
 */
router.get(
  '/avg-response-time/trend',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const result = await prisma.$queryRaw<[{ period: string; avg_hours: number | null }]>`
      SELECT
        CASE WHEN reviewed_at >= ${sevenDaysAgo} THEN 'current' ELSE 'previous' END as period,
        AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600) as avg_hours
      FROM ads
      WHERE reviewed_at >= ${fourteenDaysAgo} AND reviewed_at IS NOT NULL AND created_at IS NOT NULL
      GROUP BY period
    `;

    const currentAvg = Number(result.find((r) => r.period === 'current')?.avg_hours) || 0;
    const previousAvg = Number(result.find((r) => r.period === 'previous')?.avg_hours) || 0;

    let improvementPercent = 0;
    let formattedText = 'No change';

    if (previousAvg > 0 && currentAvg > 0) {
      improvementPercent = ((currentAvg - previousAvg) / previousAvg) * 100;

      if (improvementPercent < -5) {
        formattedText = `Improved ${Math.abs(Math.round(improvementPercent))}%`;
      } else if (improvementPercent > 5) {
        formattedText = `Slower by ${Math.round(improvementPercent)}%`;
      } else {
        formattedText = 'Stable';
      }
    }

    res.json({
      success: true,
      data: {
        improvementPercent: Math.round(improvementPercent),
        formattedText,
        isImproved: improvementPercent < 0,
        breakdown: {
          currentAvgHours: currentAvg,
          previousAvgHours: previousAvg,
        },
      },
    });
  })
);

/**
 * GET /api/editor/my-work-today
 * Get editor's work statistics for today
 */
router.get(
  '/my-work-today',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      adsApprovedToday,
      adsRejectedToday,
      adsEditedToday,
      businessVerificationsToday,
      individualVerificationsToday,
      supportTicketsAssigned,
    ] = await Promise.all([
      prisma.ads.count({
        where: {
          status: 'approved',
          reviewed_by: userId,
          reviewed_at: { gte: today },
        },
      }),
      prisma.ads.count({
        where: {
          status: 'rejected',
          reviewed_by: userId,
          reviewed_at: { gte: today },
        },
      }),
      prisma.admin_activity_logs.count({
        where: {
          admin_id: userId,
          action_type: { contains: 'edit' },
          created_at: { gte: today },
        },
      }).catch(() => 0),
      prisma.business_verification_requests.count({
        where: {
          reviewed_by: userId,
          reviewed_at: { gte: today },
          status: { in: ['approved', 'rejected'] },
        },
      }).catch(() => 0),
      prisma.individual_verification_requests.count({
        where: {
          reviewed_by: userId,
          reviewed_at: { gte: today },
          status: { in: ['approved', 'rejected'] },
        },
      }).catch(() => 0),
      prisma.support_messages.groupBy({
        by: ['ticket_id'],
        where: {
          sender_id: userId,
          created_at: { gte: today },
        },
      }).then((result) => result.length).catch(() => 0),
    ]);

    res.json({
      success: true,
      data: {
        adsApprovedToday,
        adsRejectedToday,
        adsEditedToday,
        businessVerificationsToday,
        individualVerificationsToday,
        supportTicketsAssigned,
      },
    });
  })
);

// ── Date range helper ────────────────────────────────────────────────

function getRangeStartDate(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'all': return null;
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * GET /api/editor/analytics?range=7d|30d|90d|all
 * Per-editor analytics — all stats scoped to the logged-in editor's ID.
 */
router.get(
  '/analytics',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const range = (req.query.range as string) || '30d';
    const rangeStart = getRangeStartDate(range);

    // Build date filter for reviewed_at
    const reviewedAtFilter = rangeStart
      ? { reviewed_by: userId, reviewed_at: { gte: rangeStart } }
      : { reviewed_by: userId, reviewed_at: { not: null } };

    // Fire all queries in parallel
    const [
      adsApproved,
      adsRejected,
      bizVerifications,
      indVerifications,
      avgResponseRaw,
      dailyStatsRaw,
      categoryBreakdownRaw,
      rejectionReasonsRaw,
      hourlyActivityRaw,
    ] = await Promise.all([
      prisma.ads.count({ where: { status: 'approved', ...reviewedAtFilter } }),
      prisma.ads.count({ where: { status: 'rejected', ...reviewedAtFilter } }),
      prisma.business_verification_requests.count({
        where: {
          reviewed_by: userId,
          status: { in: ['approved', 'rejected'] },
          ...(rangeStart ? { reviewed_at: { gte: rangeStart } } : {}),
        },
      }).catch(() => 0),
      prisma.individual_verification_requests.count({
        where: {
          reviewed_by: userId,
          status: { in: ['approved', 'rejected'] },
          ...(rangeStart ? { reviewed_at: { gte: rangeStart } } : {}),
        },
      }).catch(() => 0),

      // Avg response time for this editor's reviewed ads
      rangeStart
        ? prisma.$queryRaw<[{ avg_hours: number | null }]>`
            SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600) as avg_hours
            FROM ads
            WHERE reviewed_by = ${userId}
              AND reviewed_at >= ${rangeStart}
              AND reviewed_at IS NOT NULL AND created_at IS NOT NULL
          `
        : prisma.$queryRaw<[{ avg_hours: number | null }]>`
            SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600) as avg_hours
            FROM ads
            WHERE reviewed_by = ${userId}
              AND reviewed_at IS NOT NULL AND created_at IS NOT NULL
          `,

      // Daily stats: approved vs rejected per day
      rangeStart
        ? prisma.$queryRaw<{ date: string; status: string; count: bigint }[]>`
            SELECT DATE(reviewed_at) as date, status, COUNT(*)::bigint as count
            FROM ads
            WHERE reviewed_by = ${userId} AND reviewed_at >= ${rangeStart}
              AND reviewed_at IS NOT NULL AND status IN ('approved', 'rejected')
            GROUP BY DATE(reviewed_at), status ORDER BY date ASC
          `
        : prisma.$queryRaw<{ date: string; status: string; count: bigint }[]>`
            SELECT DATE(reviewed_at) as date, status, COUNT(*)::bigint as count
            FROM ads
            WHERE reviewed_by = ${userId}
              AND reviewed_at IS NOT NULL AND status IN ('approved', 'rejected')
            GROUP BY DATE(reviewed_at), status ORDER BY date ASC
          `,

      // Category breakdown
      rangeStart
        ? prisma.$queryRaw<{ category_name: string; count: bigint }[]>`
            SELECT COALESCE(c.name, 'Uncategorized') as category_name, COUNT(*)::bigint as count
            FROM ads a LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.reviewed_by = ${userId} AND a.reviewed_at >= ${rangeStart}
              AND a.reviewed_at IS NOT NULL AND a.status IN ('approved', 'rejected')
            GROUP BY c.name ORDER BY count DESC
          `
        : prisma.$queryRaw<{ category_name: string; count: bigint }[]>`
            SELECT COALESCE(c.name, 'Uncategorized') as category_name, COUNT(*)::bigint as count
            FROM ads a LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.reviewed_by = ${userId}
              AND a.reviewed_at IS NOT NULL AND a.status IN ('approved', 'rejected')
            GROUP BY c.name ORDER BY count DESC
          `,

      // Rejection reasons
      rangeStart
        ? prisma.$queryRaw<{ reason: string; count: bigint }[]>`
            SELECT COALESCE(status_reason, 'No reason specified') as reason, COUNT(*)::bigint as count
            FROM ads
            WHERE reviewed_by = ${userId} AND status = 'rejected'
              AND reviewed_at >= ${rangeStart} AND reviewed_at IS NOT NULL
            GROUP BY status_reason ORDER BY count DESC LIMIT 10
          `
        : prisma.$queryRaw<{ reason: string; count: bigint }[]>`
            SELECT COALESCE(status_reason, 'No reason specified') as reason, COUNT(*)::bigint as count
            FROM ads
            WHERE reviewed_by = ${userId} AND status = 'rejected' AND reviewed_at IS NOT NULL
            GROUP BY status_reason ORDER BY count DESC LIMIT 10
          `,

      // Hourly activity heatmap
      rangeStart
        ? prisma.$queryRaw<{ hour: number; count: bigint }[]>`
            SELECT EXTRACT(HOUR FROM reviewed_at)::int as hour, COUNT(*)::bigint as count
            FROM ads
            WHERE reviewed_by = ${userId} AND reviewed_at >= ${rangeStart} AND reviewed_at IS NOT NULL
            GROUP BY hour ORDER BY hour ASC
          `
        : prisma.$queryRaw<{ hour: number; count: bigint }[]>`
            SELECT EXTRACT(HOUR FROM reviewed_at)::int as hour, COUNT(*)::bigint as count
            FROM ads
            WHERE reviewed_by = ${userId} AND reviewed_at IS NOT NULL
            GROUP BY hour ORDER BY hour ASC
          `,
    ]);

    // Process overview
    const totalReviewed = adsApproved + adsRejected;
    const totalVerifications = bizVerifications + indVerifications;
    const avgHours = Number(avgResponseRaw[0]?.avg_hours) || 0;
    const approvalRate = totalReviewed > 0 ? Math.round((adsApproved / totalReviewed) * 1000) / 10 : 0;

    // Process daily stats — merge approved/rejected per date
    const dailyMap = new Map<string, { approved: number; rejected: number }>();
    for (const row of dailyStatsRaw) {
      const dateStr = typeof row.date === 'string' ? row.date : new Date(row.date).toISOString().slice(0, 10);
      const entry = dailyMap.get(dateStr) || { approved: 0, rejected: 0 };
      if (row.status === 'approved') entry.approved = Number(row.count);
      if (row.status === 'rejected') entry.rejected = Number(row.count);
      dailyMap.set(dateStr, entry);
    }
    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, counts]) => ({ date, approved: counts.approved, rejected: counts.rejected, pending: 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Process category breakdown
    const totalCategoryAds = categoryBreakdownRaw.reduce((sum, c) => sum + Number(c.count), 0);
    const categoryBreakdown = categoryBreakdownRaw.map((c) => ({
      category: c.category_name,
      count: Number(c.count),
      percentage: totalCategoryAds > 0 ? Math.round((Number(c.count) / totalCategoryAds) * 1000) / 10 : 0,
    }));

    // Process rejection reasons
    const totalRejections = rejectionReasonsRaw.reduce((sum, r) => sum + Number(r.count), 0);
    const rejectionReasons = rejectionReasonsRaw.map((r) => ({
      reason: r.reason,
      count: Number(r.count),
      percentage: totalRejections > 0 ? Math.round((Number(r.count) / totalRejections) * 1000) / 10 : 0,
    }));

    // Process hourly activity — fill all 24 hours
    const hourlyMap = new Map<number, number>();
    for (const row of hourlyActivityRaw) {
      hourlyMap.set(Number(row.hour), Number(row.count));
    }
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyMap.get(hour) || 0,
    }));

    res.json({
      success: true,
      data: {
        overview: {
          totalAdsReviewed: totalReviewed,
          totalAdsApproved: adsApproved,
          totalAdsRejected: adsRejected,
          totalVerifications,
          avgResponseTime: avgHours,
          approvalRate,
        },
        dailyStats,
        categoryBreakdown,
        rejectionReasons,
        hourlyActivity,
      },
    });
  })
);

export default router;
