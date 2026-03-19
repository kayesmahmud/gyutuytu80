/**
 * PROMOTION CLEANUP JOB
 * =====================
 * Runs periodically to deactivate expired promotions
 * and clear promotion flags from ads.
 */

import cron from 'node-cron';
import { prisma } from '@thulobazaar/database';
import { sendNotification } from '../services/notification.service.js';

/**
 * Deactivate all expired promotions and clear their flags
 */
export async function cleanupExpiredPromotions(): Promise<{ deactivated: number }> {
  console.log('🔄 [Cron] Checking for expired promotions...');

  try {
    const now = new Date();

    // Find all expired but still active promotions
    const expiredPromotions = await prisma.ad_promotions.findMany({
      where: {
        is_active: true,
        expires_at: { lt: now },
      },
      select: {
        id: true,
        ad_id: true,
        promotion_type: true,
        expires_at: true,
      },
    });

    if (expiredPromotions.length === 0) {
      console.log('✅ [Cron] No expired promotions found');
      return { deactivated: 0 };
    }

    console.log(`📊 [Cron] Found ${expiredPromotions.length} expired promotions to clean up`);

    let deactivatedCount = 0;

    for (const promo of expiredPromotions) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Mark promotion record as inactive
          await tx.ad_promotions.update({
            where: { id: promo.id },
            data: { is_active: false },
          });

          // 2. Clear the corresponding flag on the ad
          const updateData: Record<string, boolean | null> = {};

          if (promo.promotion_type === 'featured') {
            updateData.is_featured = false;
            updateData.featured_until = null;
          } else if (promo.promotion_type === 'urgent') {
            updateData.is_urgent = false;
            updateData.urgent_until = null;
          } else if (promo.promotion_type === 'sticky') {
            updateData.is_sticky = false;
            updateData.sticky_until = null;
          }

          await tx.ads.update({
            where: { id: promo.ad_id },
            data: updateData,
          });
        });

        deactivatedCount++;
        console.log(
          `  ✅ Deactivated ${promo.promotion_type} for ad #${promo.ad_id} (expired: ${promo.expires_at.toISOString()})`
        );

        // #19 — Notify the promotion owner
        // Need to look up user_id since we only selected limited fields
        const fullPromo = await prisma.ad_promotions.findUnique({
          where: { id: promo.id },
          select: { user_id: true, ads: { select: { title: true } } },
        });
        if (fullPromo) {
          sendNotification({
            recipientUserIds: [fullPromo.user_id],
            type: 'promotion_expired',
            title: 'Promotion Ended',
            body: `The ${promo.promotion_type} promotion on "${fullPromo.ads?.title || 'your ad'}" has ended. Promote again to boost visibility!`,
            data: { adId: String(promo.ad_id), route: '/promotion' },
            referenceId: promo.id,
          }).catch(err => console.error(`❌ [Cron] promotion_expired notif error:`, err));
        }
      } catch (error) {
        console.error(`  ❌ Failed to deactivate promotion #${promo.id}:`, error);
      }
    }

    console.log(`🎉 [Cron] Cleanup complete: ${deactivatedCount}/${expiredPromotions.length} promotions deactivated`);

    return { deactivated: deactivatedCount };
  } catch (error) {
    console.error('❌ [Cron] Promotion cleanup failed:', error);
    throw error;
  }
}

/**
 * Also clean up ads that have expired promotion flags but no active promotion record
 * This handles edge cases where promotion records were deleted but flags weren't cleared
 */
export async function cleanupOrphanedPromotionFlags(): Promise<{ cleaned: number }> {
  const now = new Date();

  try {
    // Find ads with expired promotion flags
    const adsWithExpiredFlags = await prisma.ads.findMany({
      where: {
        OR: [
          { is_featured: true, featured_until: { lt: now } },
          { is_urgent: true, urgent_until: { lt: now } },
          { is_sticky: true, sticky_until: { lt: now } },
        ],
      },
      select: {
        id: true,
        is_featured: true,
        featured_until: true,
        is_urgent: true,
        urgent_until: true,
        is_sticky: true,
        sticky_until: true,
      },
    });

    if (adsWithExpiredFlags.length === 0) {
      return { cleaned: 0 };
    }

    console.log(`🧹 [Cron] Found ${adsWithExpiredFlags.length} ads with orphaned promotion flags`);

    let cleanedCount = 0;

    for (const ad of adsWithExpiredFlags) {
      const updateData: Record<string, boolean | null> = {};

      if (ad.is_featured && ad.featured_until && ad.featured_until < now) {
        updateData.is_featured = false;
        updateData.featured_until = null;
      }
      if (ad.is_urgent && ad.urgent_until && ad.urgent_until < now) {
        updateData.is_urgent = false;
        updateData.urgent_until = null;
      }
      if (ad.is_sticky && ad.sticky_until && ad.sticky_until < now) {
        updateData.is_sticky = false;
        updateData.sticky_until = null;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.ads.update({
          where: { id: ad.id },
          data: updateData,
        });
        cleanedCount++;
      }
    }

    console.log(`🧹 [Cron] Cleaned ${cleanedCount} orphaned promotion flags`);

    return { cleaned: cleanedCount };
  } catch (error) {
    console.error('❌ [Cron] Orphaned flags cleanup failed:', error);
    throw error;
  }
}

/**
 * Run full promotion cleanup (both expired promotions and orphaned flags)
 */
export async function runFullCleanup(): Promise<void> {
  const startTime = Date.now();

  try {
    const [promotionResult, orphanResult] = await Promise.all([
      cleanupExpiredPromotions(),
      cleanupOrphanedPromotionFlags(),
    ]);

    const duration = Date.now() - startTime;
    console.log(
      `📊 [Cron] Full cleanup completed in ${duration}ms: ` +
        `${promotionResult.deactivated} promotions deactivated, ` +
        `${orphanResult.cleaned} orphaned flags cleaned`
    );
  } catch (error) {
    console.error('❌ [Cron] Full cleanup failed:', error);
  }
}

/**
 * Schedule the promotion cleanup job
 * Runs every 5 minutes
 */
export function schedulePromotionCleanup(): void {
  // Run every 5 minutes: */5 * * * *
  cron.schedule('*/5 * * * *', async () => {
    console.log('\n⏰ [Cron] Running scheduled promotion cleanup...');
    await runFullCleanup();
  });

  console.log('✅ [Cron] Promotion cleanup job scheduled (every 5 minutes)');

  // Also run immediately on startup
  setTimeout(async () => {
    console.log('\n🚀 [Cron] Running initial promotion cleanup on startup...');
    await runFullCleanup();
  }, 5000); // Wait 5 seconds after startup
}
