/**
 * AD EXPIRY JOB
 * =============
 * Runs periodically to mark expired ads as 'expired'.
 * Ads with expires_at = null never expire (when adExpiryDays = 0).
 */

import cron from 'node-cron';
import { prisma } from '@thulobazaar/database';

/**
 * Mark all ads past their expires_at date as expired
 */
export async function expireAds(): Promise<{ expired: number }> {
  console.log('🔄 [Cron] Checking for expired ads...');

  try {
    const now = new Date();

    const result = await prisma.ads.updateMany({
      where: {
        expires_at: { lt: now },
        status: { in: ['approved', 'pending'] },
        deleted_at: null,
      },
      data: {
        status: 'expired',
        updated_at: now,
      },
    });

    if (result.count > 0) {
      console.log(`📊 [Cron] Expired ${result.count} ads`);
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
    console.log('\n⏰ [Cron] Running scheduled ad expiry check...');
    await expireAds();
  });

  console.log('✅ [Cron] Ad expiry job scheduled (every hour)');

  // Run on startup after 10 seconds
  setTimeout(async () => {
    console.log('\n🚀 [Cron] Running initial ad expiry check on startup...');
    await expireAds();
  }, 10000);
}
