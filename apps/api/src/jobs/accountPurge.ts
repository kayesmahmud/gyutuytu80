/**
 * ACCOUNT PURGE JOB
 * =================
 * Runs daily to permanently delete accounts where the 30-day recovery
 * window has expired. Removes personal data, deactivates ads, and
 * cleans up associated records.
 */

import cron from 'node-cron';
import { prisma } from '@thulobazaar/database';

const RECOVERY_DAYS = 30;

/**
 * Permanently purge accounts past the 30-day recovery window
 */
export async function purgeDeletedAccounts(): Promise<{ purged: number }> {
  console.log('🔄 [Cron] Checking for accounts past recovery window...');

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RECOVERY_DAYS);

    // Find accounts past recovery window
    const expiredAccounts = await prisma.users.findMany({
      where: {
        deletion_requested_at: { lt: cutoffDate },
        deleted_at: { not: null },
      },
      select: {
        id: true,
        email: true,
        phone: true,
        full_name: true,
        deletion_requested_at: true,
      },
    });

    if (expiredAccounts.length === 0) {
      console.log('✅ [Cron] No accounts to purge');
      return { purged: 0 };
    }

    console.log(`📊 [Cron] Found ${expiredAccounts.length} accounts to permanently purge`);

    let purgedCount = 0;

    for (const account of expiredAccounts) {
      try {
        await prisma.$transaction([
          // Deactivate all user's ads
          prisma.ads.updateMany({
            where: { user_id: account.id },
            data: { status: 'deleted' },
          }),
          // Revoke all refresh tokens
          prisma.refresh_tokens.updateMany({
            where: { user_id: account.id },
            data: { is_revoked: true },
          }),
          // Scrub personal data but keep the row for referential integrity
          prisma.users.update({
            where: { id: account.id },
            data: {
              email: null,
              phone: null,
              full_name: 'Deleted User',
              password_hash: null,
              avatar: null,
              bio: null,
              business_name: null,
              business_address: null,
              business_phone: null,
              business_email: null,
              business_pan_number: null,
              business_registration_number: null,
              two_factor_secret: null,
              two_factor_backup_codes: [],
              two_factor_enabled: false,
              is_active: false,
              phone_verified: false,
            },
          }),
        ]);

        purgedCount++;
        console.log(
          `  ✅ Purged account #${account.id} (deleted: ${account.deletion_requested_at?.toISOString()})`
        );
      } catch (error) {
        console.error(`  ❌ Failed to purge account #${account.id}:`, error);
      }
    }

    console.log(`🎉 [Cron] Account purge complete: ${purgedCount}/${expiredAccounts.length} accounts purged`);

    return { purged: purgedCount };
  } catch (error) {
    console.error('❌ [Cron] Account purge failed:', error);
    throw error;
  }
}

/**
 * Schedule the account purge job
 * Runs daily at 3:00 AM
 */
export function scheduleAccountPurge(): void {
  cron.schedule('0 3 * * *', async () => {
    console.log('\n⏰ [Cron] Running scheduled account purge...');
    await purgeDeletedAccounts();
  });

  console.log('✅ [Cron] Account purge job scheduled (daily at 3:00 AM)');
}
