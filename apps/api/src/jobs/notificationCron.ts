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
import {
  sendNotification,
  canSendNotification,
  countNotificationsSent,
} from '../services/notification.service.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * ONE_DAY_MS;
const FIFTEEN_DAYS_MS = 15 * ONE_DAY_MS;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;
const TWENTY_FOUR_HOURS_MS = ONE_DAY_MS;

/**
 * After this many reminders about the same conversation, stop asking.
 * An unread message the user has ignored three times is one they have decided
 * not to answer, not one they missed.
 */
const MAX_UNREAD_REMINDERS_PER_CONVERSATION = 3;

/**
 * Bucket rows by recipient so one cron pass produces one message per person
 * instead of one per matched row.
 */
function groupByUser<T extends { user_id: number | null }>(rows: T[]): Map<number, T[]> {
  const byUser = new Map<number, T[]>();
  for (const row of rows) {
    if (row.user_id == null) continue;
    const existing = byUser.get(row.user_id);
    if (existing) existing.push(row);
    else byUser.set(row.user_id, [row]);
  }
  return byUser;
}

/**
 * #5 — Ad Expiring Soon (expires within 15 days)
 * Keep the window in sync with the grace floor in
 * apps/web/src/lib/services/adLimits.service.ts (applyExpirySettingToAllAds).
 */
async function checkExpiringAds(): Promise<void> {
  const now = new Date();
  const fifteenDaysFromNow = new Date(now.getTime() + FIFTEEN_DAYS_MS);

  const ads = await prisma.ads.findMany({
    where: {
      status: 'approved',
      deleted_at: null,
      expires_at: {
        gte: now,
        lte: fifteenDaysFromNow,
      },
    },
    select: { id: true, user_id: true, title: true, expires_at: true },
  });

  // Filter to ads not yet warned about, then send ONE message per seller.
  // A shop with 40 ads expiring in the same window previously got 40 separate
  // pushes in a single cron run: each ad carried its own reference id, so each
  // passed its own cooldown independently.
  const pending: typeof ads = [];
  for (const ad of ads) {
    if (!ad.user_id || !ad.expires_at) continue;
    // Once per ad (cooldown = forever via referenceId)
    const canSend = await canSendNotification(ad.user_id, 'ad_expiring', ad.id, 60 * 24 * 30);
    if (canSend) pending.push(ad);
  }

  for (const [userId, userAds] of groupByUser<(typeof pending)[number]>(pending)) {
    const soonest = userAds.reduce((a, b) =>
      (a.expires_at as Date) <= (b.expires_at as Date) ? a : b
    );
    const daysLeft = Math.max(
      1,
      Math.ceil(((soonest.expires_at as Date).getTime() - now.getTime()) / ONE_DAY_MS)
    );
    const dayLabel = `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;

    await sendNotification({
      recipientUserIds: [userId],
      type: 'ad_expiring',
      title: 'Ad Expiring Soon',
      body: userAds.length === 1
        ? `Your ad "${soonest.title}" expires in ${dayLabel} — renew it to stay visible!`
        : `${userAds.length} of your ads are expiring, starting with "${soonest.title}" in ${dayLabel} — renew them to stay visible!`,
      data: { adId: String(soonest.id), route: '/ad' },
      logReferenceIds: userAds.map(ad => ad.id),
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
 *
 * Grouped per conversation rather than per user, because the 24h cooldown had
 * no terminal state: an unread message the recipient simply did not want to
 * answer produced a push every single day, forever. In production this single
 * type was 60% of all non-staff notifications, and one user received it on 58
 * of 60 consecutive days.
 */
async function checkUnreadMessages(): Promise<void> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

  // Find unread conversations older than 6 hours
  const unreadConversations = await prisma.$queryRaw<
    Array<{ user_id: number; conversation_id: number; unread_count: bigint }>
  >`
    SELECT cp.user_id, cp.conversation_id, COUNT(m.id) as unread_count
    FROM conversation_participants cp
    JOIN messages m ON m.conversation_id = cp.conversation_id
      AND m.sender_id != cp.user_id
      AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')
      AND m.created_at < ${sixHoursAgo}
      AND m.is_deleted = false
    GROUP BY cp.user_id, cp.conversation_id
    HAVING COUNT(m.id) > 0
  `;

  const byUser = groupByUser<(typeof unreadConversations)[number]>(unreadConversations);

  for (const [userId, conversations] of byUser) {
    // Once per 24 hours
    const canSend = await canSendNotification(userId, 'unread_messages_reminder', undefined, 60 * 24);
    if (!canSend) continue;

    // Drop conversations already reminded about the maximum number of times.
    // Silenced reminders count too: the in-app entry is still a reminder, and
    // counting them errs toward sending less, which is the point.
    const eligible: typeof unreadConversations = [];
    for (const conversation of conversations) {
      const alreadySent = await countNotificationsSent(
        userId,
        'unread_messages_reminder',
        conversation.conversation_id
      );
      if (alreadySent < MAX_UNREAD_REMINDERS_PER_CONVERSATION) eligible.push(conversation);
    }
    if (eligible.length === 0) continue;

    const count = eligible.reduce((sum, c) => sum + Number(c.unread_count), 0);
    await sendNotification({
      recipientUserIds: [userId],
      type: 'unread_messages_reminder',
      title: 'Unread Messages',
      body: `You have ${count} unread message${count > 1 ? 's' : ''} waiting for you.`,
      data: { route: '/chat' },
      logReferenceIds: eligible.map(c => c.conversation_id),
    }).catch(err => console.error(`❌ [NotifCron] unread_messages error:`, err));
  }

  if (byUser.size > 0) console.log(`📊 [NotifCron] Found ${byUser.size} users with unread messages`);
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

  // One message per user covering all their due bookmarks. This was the worst
  // offender in production: one user received 15 pushes within a single hour,
  // then 14 the following week, because every bookmark had its own cooldown.
  const pending: typeof bookmarks = [];
  for (const bm of bookmarks) {
    // Once per 7 days per bookmark
    const canSend = await canSendNotification(bm.user_id, 'abandoned_bookmark', bm.ad_id, 60 * 24 * 7);
    if (canSend) pending.push(bm);
  }

  for (const [userId, items] of groupByUser<(typeof pending)[number]>(pending)) {
    const first = items[0];
    const firstTitle = first.ads?.title || 'A saved ad';

    await sendNotification({
      recipientUserIds: [userId],
      type: 'abandoned_bookmark',
      title: 'Still Interested?',
      body: items.length === 1
        ? `"${firstTitle}" is still available — check it out before it's gone!`
        : `${items.length} of your saved ads are still available, including "${firstTitle}" — check them before they're gone!`,
      data: { adId: String(first.ad_id), route: '/ad' },
      logReferenceIds: items.map(bm => bm.ad_id),
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

  // Collect across every milestone first, so a seller whose ads crossed
  // several thresholds in the same hour gets one message rather than one per
  // ad per threshold.
  const hits: Array<{ id: number; user_id: number; title: string; milestone: number }> = [];

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
      hits.push({ id: ad.id, user_id: ad.user_id, title: ad.title, milestone });
    }
  }

  for (const [userId, items] of groupByUser<(typeof hits)[number]>(hits)) {
    const best = items.reduce((a, b) => (a.milestone >= b.milestone ? a : b));

    await sendNotification({
      recipientUserIds: [userId],
      type: 'ad_views_milestone',
      title: items.length === 1 ? `${best.milestone} Views!` : 'Your ads are getting noticed!',
      body: items.length === 1
        ? `Your ad "${best.title}" just hit ${best.milestone} views!`
        : `${items.length} of your ads hit new view milestones — "${best.title}" reached ${best.milestone} views!`,
      data: { adId: String(best.id), route: '/ad' },
      logReferenceIds: items.map(hit => hit.id),
    }).catch(err => console.error(`❌ [NotifCron] ad_views_milestone error:`, err));
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

  // In-app only (sendPush:false), but still collapsed per user — 14 identical
  // rows landing in the notification centre at once reads as spam even when
  // the phone stays quiet.
  const pending: typeof results = [];
  for (const row of results) {
    const canSend = await canSendNotification(row.user_id, 'viewed_not_acted', row.ad_id, 60 * 24 * 7);
    if (canSend) pending.push(row);
  }

  for (const [userId, items] of groupByUser<(typeof pending)[number]>(pending)) {
    const first = items[0];

    await sendNotification({
      recipientUserIds: [userId],
      type: 'viewed_not_acted',
      title: 'Still Looking?',
      body: items.length === 1
        ? `"${first.ad_title}" you viewed is still available — save it before it's gone!`
        : `${items.length} ads you viewed are still available, including "${first.ad_title}" — save them before they're gone!`,
      data: { adId: String(first.ad_id), route: '/ad' },
      logReferenceIds: items.map(row => row.ad_id),
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
    // Engagement checks run SEQUENTIALLY, in ENGAGEMENT_PRIORITY order.
    // Only one engagement push per user survives the 48h window, so the winner
    // is simply whichever check runs first — racing them through
    // Promise.allSettled would award that slot to whichever query happened to
    // finish first, meaning "trending in your area" could beat a warning that
    // the user's paid promotion is about to lapse.
    const engagementChecks: Array<[string, () => Promise<void>]> = [
      ['ad_expiring', checkExpiringAds],
      ['verification_expiring', checkExpiringVerifications],
      ['promotion_expiring', checkExpiringPromotions],
      ['unread_messages', checkUnreadMessages],
      ['ad_views_milestone', checkAdViewsMilestone],
      ['abandoned_bookmark', checkAbandonedBookmarks],
      ['viewed_not_acted', checkViewedNotActed],
      ['new_ad_area', checkNewAdsInArea],
      ['nearby_seller', checkNearbyVerifiedSeller],
      ['trending_area', checkTrendingInArea],
      ['weekly_bookmarks', checkWeeklyBookmarks],
      ['win_back', checkInactiveUsers],
    ];

    for (const [name, run] of engagementChecks) {
      try {
        await run();
      } catch (err) {
        console.error(`❌ [NotifCron] ${name} failed:`, err);
      }
    }

    // Transactional and staff-scheduled sends bypass the cap, so their order
    // relative to anything else is irrelevant.
    await Promise.allSettled([
      checkPromotionStarted(),
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
