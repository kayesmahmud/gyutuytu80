/**
 * NOTIFICATION CRON JOB
 * =====================
 * Runs hourly to check for time-based notification triggers.
 * Handles: expiring warnings, reminders, re-engagement.
 *
 * Notifications that fire AFTER an action (ad expired, verification expired,
 * promotion expired/started) are hooked into the existing cleanup jobs instead.
 */

import cron from 'node-cron';
import { prisma } from '@thulobazaar/database';
import { sendNotification, canSendNotification } from '../services/notification.service.js';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * #5 — Ad Expiring Soon (expires within 3 days)
 */
async function checkExpiringAds(): Promise<void> {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + THREE_DAYS_MS);

  const ads = await prisma.ads.findMany({
    where: {
      status: 'approved',
      deleted_at: null,
      expires_at: {
        gte: now,
        lte: threeDaysFromNow,
      },
    },
    select: { id: true, user_id: true, title: true },
  });

  for (const ad of ads) {
    if (!ad.user_id) continue;
    // Once per ad (cooldown = forever via referenceId)
    const canSend = await canSendNotification(ad.user_id, 'ad_expiring', ad.id, 60 * 24 * 30);
    if (!canSend) continue;

    await sendNotification({
      recipientUserIds: [ad.user_id],
      type: 'ad_expiring',
      title: 'Ad Expiring Soon',
      body: `Your ad "${ad.title}" expires in 3 days — renew it to stay visible!`,
      data: { adId: String(ad.id), route: '/ad' },
      referenceId: ad.id,
    }).catch(err => console.error(`❌ [NotifCron] ad_expiring error:`, err));
  }

  if (ads.length > 0) console.log(`📊 [NotifCron] Checked ${ads.length} expiring ads`);
}

/**
 * #14 — Verification Expiring (within 30 days)
 */
async function checkExpiringVerifications(): Promise<void> {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + THIRTY_DAYS_MS);

  // Business verifications expiring
  const businessUsers = await prisma.users.findMany({
    where: {
      business_verification_status: 'approved',
      business_verification_expires_at: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
    },
    select: { id: true, business_name: true },
  });

  for (const user of businessUsers) {
    // Once per 7 days
    const canSend = await canSendNotification(user.id, 'verification_expiring', undefined, 60 * 24 * 7);
    if (!canSend) continue;

    await sendNotification({
      recipientUserIds: [user.id],
      type: 'verification_expiring',
      title: 'Verification Expiring Soon',
      body: `Your business verification${user.business_name ? ` for "${user.business_name}"` : ''} is expiring soon — renew to keep your verified badge.`,
      data: { route: '/verification' },
    }).catch(err => console.error(`❌ [NotifCron] verification_expiring error:`, err));
  }

  // Individual verifications expiring
  const individualUsers = await prisma.users.findMany({
    where: {
      individual_verified: true,
      individual_verification_expires_at: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
    },
    select: { id: true, full_name: true },
  });

  for (const user of individualUsers) {
    const canSend = await canSendNotification(user.id, 'verification_expiring', undefined, 60 * 24 * 7);
    if (!canSend) continue;

    await sendNotification({
      recipientUserIds: [user.id],
      type: 'verification_expiring',
      title: 'Verification Expiring Soon',
      body: `Your individual verification is expiring soon — renew to keep your verified badge.`,
      data: { route: '/verification' },
    }).catch(err => console.error(`❌ [NotifCron] verification_expiring error:`, err));
  }

  const total = businessUsers.length + individualUsers.length;
  if (total > 0) console.log(`📊 [NotifCron] Checked ${total} expiring verifications`);
}

/**
 * #18 — Promotion Expiring (within 24 hours)
 */
async function checkExpiringPromotions(): Promise<void> {
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + TWENTY_FOUR_HOURS_MS);

  const promotions = await prisma.ad_promotions.findMany({
    where: {
      is_active: true,
      expires_at: {
        gte: now,
        lte: oneDayFromNow,
      },
    },
    select: {
      id: true,
      user_id: true,
      ad_id: true,
      promotion_type: true,
      ads: { select: { title: true } },
    },
  });

  for (const promo of promotions) {
    const canSend = await canSendNotification(promo.user_id, 'promotion_expiring', promo.id, 60 * 24);
    if (!canSend) continue;

    const adTitle = promo.ads?.title || 'your ad';
    await sendNotification({
      recipientUserIds: [promo.user_id],
      type: 'promotion_expiring',
      title: 'Promotion Expiring',
      body: `The ${promo.promotion_type} promotion on "${adTitle}" expires in 24 hours.`,
      data: { adId: String(promo.ad_id), route: '/promotion' },
      referenceId: promo.id,
    }).catch(err => console.error(`❌ [NotifCron] promotion_expiring error:`, err));
  }

  if (promotions.length > 0) console.log(`📊 [NotifCron] Checked ${promotions.length} expiring promotions`);
}

/**
 * #17 — Promotion Started (just went live in the last hour)
 */
async function checkPromotionStarted(): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const promotions = await prisma.ad_promotions.findMany({
    where: {
      is_active: true,
      starts_at: { gte: oneHourAgo },
    },
    select: {
      id: true,
      user_id: true,
      ad_id: true,
      promotion_type: true,
      ads: { select: { title: true } },
    },
  });

  for (const promo of promotions) {
    const canSend = await canSendNotification(promo.user_id, 'promotion_started', promo.id, 60 * 24);
    if (!canSend) continue;

    const adTitle = promo.ads?.title || 'your ad';
    await sendNotification({
      recipientUserIds: [promo.user_id],
      type: 'promotion_started',
      title: 'Promotion Live!',
      body: `Your ${promo.promotion_type} promotion on "${adTitle}" is now live!`,
      data: { adId: String(promo.ad_id), route: '/promotion' },
      referenceId: promo.id,
    }).catch(err => console.error(`❌ [NotifCron] promotion_started error:`, err));
  }

  if (promotions.length > 0) console.log(`📊 [NotifCron] Found ${promotions.length} newly started promotions`);
}

/**
 * #2 — Unread Messages Reminder (6+ hours unread)
 */
async function checkUnreadMessages(): Promise<void> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

  // Find users with unread messages older than 6 hours
  const unreadParticipants = await prisma.$queryRaw<
    Array<{ user_id: number; unread_count: bigint }>
  >`
    SELECT cp.user_id, COUNT(m.id) as unread_count
    FROM conversation_participants cp
    JOIN messages m ON m.conversation_id = cp.conversation_id
      AND m.sender_id != cp.user_id
      AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')
      AND m.created_at < ${sixHoursAgo}
      AND m.is_deleted = false
    GROUP BY cp.user_id
    HAVING COUNT(m.id) > 0
  `;

  for (const row of unreadParticipants) {
    // Once per 24 hours
    const canSend = await canSendNotification(row.user_id, 'unread_messages_reminder', undefined, 60 * 24);
    if (!canSend) continue;

    const count = Number(row.unread_count);
    await sendNotification({
      recipientUserIds: [row.user_id],
      type: 'unread_messages_reminder',
      title: 'Unread Messages',
      body: `You have ${count} unread message${count > 1 ? 's' : ''} waiting for you.`,
      data: { route: '/chat' },
    }).catch(err => console.error(`❌ [NotifCron] unread_messages error:`, err));
  }

  if (unreadParticipants.length > 0) console.log(`📊 [NotifCron] Found ${unreadParticipants.length} users with unread messages`);
}

/**
 * #24 — Abandoned Bookmark (bookmarked 3+ days ago, ad still available)
 */
async function checkAbandonedBookmarks(): Promise<void> {
  const threeDaysAgo = new Date(Date.now() - THREE_DAYS_MS);

  const bookmarks = await prisma.user_favorites.findMany({
    where: {
      created_at: { lt: threeDaysAgo },
      ads: {
        status: 'approved',
        deleted_at: null,
      },
    },
    select: {
      user_id: true,
      ad_id: true,
      ads: { select: { title: true } },
    },
    take: 100, // Process in batches
  });

  for (const bm of bookmarks) {
    // Once per 7 days per bookmark
    const canSend = await canSendNotification(bm.user_id, 'abandoned_bookmark', bm.ad_id, 60 * 24 * 7);
    if (!canSend) continue;

    await sendNotification({
      recipientUserIds: [bm.user_id],
      type: 'abandoned_bookmark',
      title: 'Still Interested?',
      body: `"${bm.ads?.title || 'A saved ad'}" is still available — check it out before it's gone!`,
      data: { adId: String(bm.ad_id), route: '/ad' },
      referenceId: bm.ad_id,
    }).catch(err => console.error(`❌ [NotifCron] abandoned_bookmark error:`, err));
  }

  if (bookmarks.length > 0) console.log(`📊 [NotifCron] Checked ${bookmarks.length} abandoned bookmarks`);
}

/**
 * #26 — Win-back Inactive User (no login in 7+ days)
 */
async function checkInactiveUsers(): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const inactiveUsers = await prisma.users.findMany({
    where: {
      last_login: { lt: sevenDaysAgo },
      role: 'user',
    },
    select: { id: true },
    take: 50,
  });

  for (const user of inactiveUsers) {
    // Once per 14 days
    const canSend = await canSendNotification(user.id, 'win_back', undefined, 60 * 24 * 14);
    if (!canSend) continue;

    await sendNotification({
      recipientUserIds: [user.id],
      type: 'win_back',
      title: 'We Miss You!',
      body: 'New ads have been posted since your last visit. Come check them out!',
      data: { route: '/home' },
      sendPush: true,
    }).catch(err => console.error(`❌ [NotifCron] win_back error:`, err));
  }

  if (inactiveUsers.length > 0) console.log(`📊 [NotifCron] Checked ${inactiveUsers.length} inactive users`);
}

/**
 * #27 — Weekly Bookmark Reminder (Sundays only)
 */
async function checkWeeklyBookmarks(): Promise<void> {
  // Only run on Sundays
  if (new Date().getDay() !== 0) return;

  const usersWithBookmarks = await prisma.$queryRaw<
    Array<{ user_id: number; count: bigint }>
  >`
    SELECT uf.user_id, COUNT(*) as count
    FROM user_favorites uf
    JOIN ads a ON a.id = uf.ad_id AND a.status = 'approved' AND a.deleted_at IS NULL
    GROUP BY uf.user_id
    HAVING COUNT(*) > 0
    LIMIT 100
  `;

  for (const row of usersWithBookmarks) {
    // Once per 7 days
    const canSend = await canSendNotification(row.user_id, 'weekly_bookmarks', undefined, 60 * 24 * 7);
    if (!canSend) continue;

    const count = Number(row.count);
    await sendNotification({
      recipientUserIds: [row.user_id],
      type: 'weekly_bookmarks',
      title: 'Your Saved Ads',
      body: `${count} of your saved ad${count > 1 ? 's are' : ' is'} still available. Take a look!`,
      data: { route: '/favorites' },
      sendPush: false, // Don't push for weekly digest
    }).catch(err => console.error(`❌ [NotifCron] weekly_bookmarks error:`, err));
  }

  if (usersWithBookmarks.length > 0) console.log(`📊 [NotifCron] Sent weekly bookmark reminders to ${usersWithBookmarks.length} users`);
}

// ============================================================================
// Phase 4: Location-Based Notifications
// ============================================================================

/**
 * #21 — New Ad in Your Area + Category (posted in last 2 hours)
 * Uses existing user.location_id → locations table
 */
async function checkNewAdsInArea(): Promise<void> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  // Find users with a location who have favorites (to infer category interest)
  const results = await prisma.$queryRaw<
    Array<{ user_id: number; ad_id: number; ad_title: string; city: string }>
  >`
    SELECT DISTINCT u.id as user_id, a.id as ad_id, a.title as ad_title, l.name as city
    FROM users u
    JOIN locations l ON l.id = u.location_id
    JOIN ads a ON a.location_id = u.location_id
      AND a.status = 'approved'
      AND a.deleted_at IS NULL
      AND a.created_at > ${twoHoursAgo}
      AND a.user_id != u.id
    WHERE u.location_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM user_favorites uf
        JOIN ads fav ON fav.id = uf.ad_id
        WHERE uf.user_id = u.id AND fav.category_id = a.category_id
      )
    LIMIT 100
  `;

  for (const row of results) {
    const canSend = await canSendNotification(row.user_id, 'new_ad_area', undefined, 60 * 12);
    if (!canSend) continue;

    await sendNotification({
      recipientUserIds: [row.user_id],
      type: 'new_ad_area',
      title: 'New in Your Area',
      body: `"${row.ad_title}" just listed in ${row.city} — check it out!`,
      data: { adId: String(row.ad_id), route: '/ad' },
      referenceId: row.ad_id,
    }).catch(err => console.error(`❌ [NotifCron] new_ad_area error:`, err));
  }

  if (results.length > 0) console.log(`📊 [NotifCron] Found ${results.length} new ads in user areas`);
}

/**
 * #22 — Trending in Your Area (10+ new ads in a category in user's city, last 24h)
 */
async function checkTrendingInArea(): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const results = await prisma.$queryRaw<
    Array<{ user_id: number; category_name: string; city: string; count: bigint }>
  >`
    SELECT u.id as user_id, c.name as category_name, l.name as city, COUNT(a.id) as count
    FROM users u
    JOIN locations l ON l.id = u.location_id
    JOIN ads a ON a.location_id = u.location_id
      AND a.status = 'approved'
      AND a.deleted_at IS NULL
      AND a.created_at > ${oneDayAgo}
    JOIN categories c ON c.id = a.category_id
    WHERE u.location_id IS NOT NULL
    GROUP BY u.id, c.name, l.name
    HAVING COUNT(a.id) >= 10
    LIMIT 50
  `;

  for (const row of results) {
    const canSend = await canSendNotification(row.user_id, 'trending_area', undefined, 60 * 24 * 7);
    if (!canSend) continue;

    await sendNotification({
      recipientUserIds: [row.user_id],
      type: 'trending_area',
      title: `${row.category_name} is Trending`,
      body: `${Number(row.count)} new ads in ${row.category_name} in ${row.city} today!`,
      data: { route: '/home' },
    }).catch(err => console.error(`❌ [NotifCron] trending_area error:`, err));
  }

  if (results.length > 0) console.log(`📊 [NotifCron] Found ${results.length} trending area notifications`);
}

/**
 * #23 — Nearby Verified Seller posted new ads
 */
async function checkNearbyVerifiedSeller(): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const results = await prisma.$queryRaw<
    Array<{ user_id: number; seller_name: string; ad_count: bigint; ad_id: number }>
  >`
    SELECT u.id as user_id, seller.business_name as seller_name,
           COUNT(a.id) as ad_count, MIN(a.id) as ad_id
    FROM users u
    JOIN locations l ON l.id = u.location_id
    JOIN ads a ON a.location_id = u.location_id
      AND a.status = 'approved'
      AND a.deleted_at IS NULL
      AND a.created_at > ${oneDayAgo}
      AND a.user_id != u.id
    JOIN users seller ON seller.id = a.user_id
      AND seller.business_verification_status IN ('approved', 'verified')
    WHERE u.location_id IS NOT NULL
    GROUP BY u.id, seller.business_name
    LIMIT 50
  `;

  for (const row of results) {
    const canSend = await canSendNotification(row.user_id, 'nearby_seller', undefined, 60 * 24 * 7);
    if (!canSend) continue;

    await sendNotification({
      recipientUserIds: [row.user_id],
      type: 'nearby_seller',
      title: 'Verified Seller Near You',
      body: `${row.seller_name || 'A verified seller'} near you just posted ${Number(row.ad_count)} new ad${Number(row.ad_count) > 1 ? 's' : ''}!`,
      data: { adId: String(row.ad_id), route: '/ad' },
    }).catch(err => console.error(`❌ [NotifCron] nearby_seller error:`, err));
  }

  if (results.length > 0) console.log(`📊 [NotifCron] Found ${results.length} nearby seller notifications`);
}

// ============================================================================
// Phase 5: Tracking & Behavior Notifications
// ============================================================================

/**
 * #7 — Ad Views Milestone (50, 100, 500, 1000)
 */
async function checkAdViewsMilestone(): Promise<void> {
  const milestones = [50, 100, 500, 1000];

  for (const milestone of milestones) {
    const ads = await prisma.ads.findMany({
      where: {
        view_count: milestone,
        status: 'approved',
        deleted_at: null,
        user_id: { not: null },
      },
      select: { id: true, user_id: true, title: true },
      take: 20,
    });

    for (const ad of ads) {
      if (!ad.user_id) continue;
      const canSend = await canSendNotification(ad.user_id, 'ad_views_milestone', ad.id, 60 * 24 * 365);
      if (!canSend) continue;

      await sendNotification({
        recipientUserIds: [ad.user_id],
        type: 'ad_views_milestone',
        title: `${milestone} Views!`,
        body: `Your ad "${ad.title}" just hit ${milestone} views!`,
        data: { adId: String(ad.id), route: '/ad' },
        referenceId: ad.id,
      }).catch(err => console.error(`❌ [NotifCron] ad_views_milestone error:`, err));
    }
  }
}

/**
 * #25 — Viewed But Didn't Act (viewed 3+ times, not favorited, not contacted)
 */
async function checkViewedNotActed(): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const results = await prisma.$queryRaw<
    Array<{ user_id: number; ad_id: number; ad_title: string; view_count: bigint }>
  >`
    SELECT av.user_id, av.ad_id, a.title as ad_title, COUNT(*) as view_count
    FROM ad_views av
    JOIN ads a ON a.id = av.ad_id AND a.status = 'approved' AND a.deleted_at IS NULL
    WHERE av.user_id IS NOT NULL
      AND av.created_at > ${sevenDaysAgo}
      AND NOT EXISTS (
        SELECT 1 FROM user_favorites uf WHERE uf.user_id = av.user_id AND uf.ad_id = av.ad_id
      )
    GROUP BY av.user_id, av.ad_id, a.title
    HAVING COUNT(*) >= 3
    LIMIT 50
  `;

  for (const row of results) {
    const canSend = await canSendNotification(row.user_id, 'viewed_not_acted', row.ad_id, 60 * 24 * 7);
    if (!canSend) continue;

    await sendNotification({
      recipientUserIds: [row.user_id],
      type: 'viewed_not_acted',
      title: 'Still Looking?',
      body: `"${row.ad_title}" you viewed is still available — save it before it's gone!`,
      data: { adId: String(row.ad_id), route: '/ad' },
      referenceId: row.ad_id,
      sendPush: false,
    }).catch(err => console.error(`❌ [NotifCron] viewed_not_acted error:`, err));
  }

  if (results.length > 0) console.log(`📊 [NotifCron] Found ${results.length} viewed-not-acted notifications`);
}

/**
 * Phase 6 — Process pending scheduled notifications
 * Finds scheduled_notifications where scheduled_for <= now and status = 'pending',
 * sends them, and marks as 'sent'.
 */
async function processScheduledNotifications(): Promise<void> {
  const now = new Date();

  const pending = await prisma.scheduled_notifications.findMany({
    where: {
      status: 'pending',
      scheduled_for: { lte: now },
    },
  });

  for (const item of pending) {
    try {
      // Determine recipients
      const where: Record<string, unknown> = { is_active: true };
      if (item.target_audience === 'business') {
        where.account_type = 'business';
      } else if (item.target_audience === 'individual') {
        where.account_type = 'individual';
      }

      const users = await prisma.users.findMany({
        where,
        select: { id: true },
      });

      const recipientIds = users.map(u => u.id);

      if (recipientIds.length > 0) {
        await sendNotification({
          recipientUserIds: recipientIds,
          type: item.type,
          title: item.title,
          body: item.body,
          data: (item.data as Record<string, string>) || {},
          imageUrl: item.image_url || undefined,
        });
      }

      await prisma.scheduled_notifications.update({
        where: { id: item.id },
        data: {
          status: 'sent',
          sent_at: now,
          recipient_count: recipientIds.length,
        },
      });

      console.log(`📬 [NotifCron] Scheduled notification #${item.id} sent to ${recipientIds.length} users`);
    } catch (err) {
      console.error(`❌ [NotifCron] Failed to process scheduled notification #${item.id}:`, err);
    }
  }
}

/**
 * Run all notification checks
 */
export async function runNotificationChecks(): Promise<void> {
  const startTime = Date.now();
  console.log('\n🔔 [NotifCron] Running notification checks...');

  try {
    await Promise.allSettled([
      // Phase 3 — time-based
      checkExpiringAds(),
      checkExpiringVerifications(),
      checkExpiringPromotions(),
      checkPromotionStarted(),
      checkUnreadMessages(),
      checkAbandonedBookmarks(),
      checkInactiveUsers(),
      checkWeeklyBookmarks(),
      // Phase 4+5 — location + behavior
      checkNewAdsInArea(),
      checkTrendingInArea(),
      checkNearbyVerifiedSeller(),
      checkAdViewsMilestone(),
      checkViewedNotActed(),
      // Phase 6 — admin scheduled
      processScheduledNotifications(),
    ]);

    const duration = Date.now() - startTime;
    console.log(`✅ [NotifCron] Notification checks completed in ${duration}ms`);
  } catch (error) {
    console.error('❌ [NotifCron] Notification checks failed:', error);
  }
}

/**
 * Schedule the notification cron job — runs every hour at minute 30
 * (offset from existing jobs that run at minute 0)
 */
export function scheduleNotificationCron(): void {
  cron.schedule('30 * * * *', async () => {
    await runNotificationChecks();
  });

  console.log('✅ [Cron] Notification checks scheduled (every hour at :30)');

  // Run on startup after 15 seconds
  setTimeout(async () => {
    console.log('\n🚀 [NotifCron] Running initial notification checks on startup...');
    await runNotificationChecks();
  }, 15000);
}
