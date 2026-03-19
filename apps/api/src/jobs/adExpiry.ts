/**
 * AD EXPIRY JOB
 * =============
 * Runs periodically to mark expired ads as 'expired'.
 * Ads with expires_at = null never expire (when adExpiryDays = 0).
 */

import cron from 'node-cron';
import { prisma } from '@thulobazaar/database';
import { sendNotification } from '../services/notification.service.js';

/**
 * Mark all ads past their expires_at date as expired
 */
export async function expireAds(): Promise<{ expired: number }> {
  console.log('🔄 [Cron] Checking for expired ads...');

  try {
    const now = new Date();

    // Fetch ads about to be expired (need user_id + title for notifications)
    const adsToExpire = await prisma.ads.findMany({
      where: {
        expires_at: { lt: now },
        status: { in: ['approved', 'pending'] },
        deleted_at: null,
      },
      select: {
        id: true,
        user_id: true,
        title: true,
        user_favorites: { select: { user_id: true } },
      },
    });

    const result = await prisma.ads.updateMany({
      where: {
        id: { in: adsToExpire.map(a => a.id) },
      },
      data: {
        status: 'expired',
        updated_at: now,
      },
    });

    if (result.count > 0) {
      console.log(`📊 [Cron] Expired ${result.count} ads`);

      // #6 — Notify ad owners
      for (const ad of adsToExpire) {
        if (!ad.user_id) continue;
        sendNotification({
          recipientUserIds: [ad.user_id],
          type: 'ad_expired',
          title: 'Ad Expired',
          body: `Your ad "${ad.title}" has expired. Repost it to get more visibility!`,
          data: { adId: String(ad.id), route: '/ad' },
          referenceId: ad.id,
        }).catch(err => console.error(`❌ [Cron] ad_expired notif error:`, err));
      }

      // #29 — Notify users who favorited these ads
      for (const ad of adsToExpire) {
        const favUserIds = ad.user_favorites
          .map(f => f.user_id)
          .filter(uid => uid !== ad.user_id); // Don't notify the owner
        if (favUserIds.length === 0) continue;

        sendNotification({
          recipientUserIds: favUserIds,
          type: 'favorite_removed',
          title: 'Saved Ad Expired',
          body: `"${ad.title}" that you saved has expired.`,
          data: { adId: String(ad.id), route: '/favorites' },
          referenceId: ad.id,
          sendPush: false, // Don't push for this
        }).catch(err => console.error(`❌ [Cron] favorite_removed notif error:`, err));
      }
    } else {
      console.log('✅ [Cron] No ads to expire');
    }

    return { expired: result.count };
  } catch (error) {
    console.error('❌ [Cron] Ad expiry job failed:', error);
    throw error;
  }
}

/**
 * Schedule the ad expiry job
 * Runs every hour
 */
export function scheduleAdExpiry(): void {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('\n⏰ [Cron] Running scheduled ad expiry check...');
      await expireAds();
    } catch (error) {
      console.error('❌ [Cron] Scheduled ad expiry check failed:', error);
    }
  });

  console.log('✅ [Cron] Ad expiry job scheduled (every hour)');

  // Run on startup after 10 seconds
  setTimeout(async () => {
    try {
      console.log('\n🚀 [Cron] Running initial ad expiry check on startup...');
      await expireAds();
    } catch (error) {
      console.error('❌ [Cron] Initial ad expiry check failed:', error);
    }
  }, 10000);
}
