/**
 * NOTIFICATION FREQUENCY POLICY
 * =============================
 * Users reported getting too many notifications. The per-type cooldowns in
 * notification.service.ts were all individually correct — each one answers
 * "may I send THIS notification again?" — but nothing answered the question a
 * person actually experiences: "have I heard from this app recently?"
 *
 * With thirteen checks each policing only its own type, production showed one
 * user receiving 15 pushes in a single day and another getting an unread-message
 * reminder on 58 of 60 consecutive days, while every individual cooldown was
 * being honoured.
 *
 * This module is the missing recipient-level gate: every engagement type shares
 * ONE budget, so adding a new engagement notification can never again silently
 * raise the volume everybody receives.
 */

import { prisma } from '@thulobazaar/database';

/**
 * How long a single engagement push reserves the user's attention.
 * Product decision: at most one engagement push every two days.
 */
export const ENGAGEMENT_WINDOW_HOURS = 48;

/**
 * Engagement types in descending priority.
 *
 * Order matters operationally, not just documentationally: only one of these
 * wins each window, and the winner is simply whichever runs first. The cron
 * therefore executes its checks sequentially in this order (see
 * runNotificationChecks) rather than racing them through Promise.allSettled.
 *
 * The ranking is "how much does this cost the user to miss?" — losing a paid
 * promotion or a listing beats being told a category is trending.
 */
export const ENGAGEMENT_PRIORITY = [
  // Something the user owns is about to lapse.
  'ad_expiring',
  'verification_expiring',
  'promotion_expiring',
  // A real person is waiting for a reply.
  'unread_messages_reminder',
  // Positive news about the user's own listings.
  'ad_views_milestone',
  // Something the user explicitly saved or watched changed.
  'price_drop',
  'abandoned_bookmark',
  'viewed_not_acted',
  // Discovery. Useful, but nobody loses anything by missing it.
  'new_ad_area',
  'nearby_seller',
  'trending_area',
  'weekly_bookmarks',
  // Pure win-back marketing, lowest value per interruption.
  'win_back',
] as const;

export type EngagementType = (typeof ENGAGEMENT_PRIORITY)[number];

const ENGAGEMENT_TYPES: ReadonlySet<string> = new Set(ENGAGEMENT_PRIORITY);

/**
 * Staff-scheduled broadcasts. These bypass the cap because a human deliberately
 * chose to send them and silently dropping most recipients would make the admin
 * scheduler untrustworthy — but they still CONSUME the window, so a broadcast
 * suppresses the next two days of automated engagement rather than stacking on
 * top of it.
 */
const CAP_CONSUMING_BYPASS: ReadonlySet<string> = new Set(['announcement']);

/**
 * Types whose delivery occupies the shared window.
 * Everything else — chat messages, approvals, rejections, payment receipts,
 * verification outcomes, welcome — is transactional and neither capped nor
 * counted. This is an allowlist on purpose: a new transactional type added
 * later must never start getting throttled by accident.
 */
const WINDOW_TYPES: readonly string[] = [...ENGAGEMENT_PRIORITY, ...CAP_CONSUMING_BYPASS];

/** Whether this type must pass the shared frequency cap before pushing. */
export function isEngagementType(type: string): boolean {
  return ENGAGEMENT_TYPES.has(type);
}

/**
 * Has this user already received a push that claimed the shared window?
 *
 * Counts only rows where a push actually reached a device: a notification that
 * was written to the in-app inbox but deliberately silenced must not block the
 * next one, or the cap would compound into a permanent mute.
 */
export async function hasRecentEngagementPush(userId: number): Promise<boolean> {
  const since = new Date(Date.now() - ENGAGEMENT_WINDOW_HOURS * 60 * 60 * 1000);

  const recent = await prisma.notification_log.findFirst({
    where: {
      user_id: userId,
      notification_type: { in: WINDOW_TYPES },
      pushed: true,
      sent_at: { gte: since },
    },
    select: { id: true },
  });

  return recent !== null;
}
