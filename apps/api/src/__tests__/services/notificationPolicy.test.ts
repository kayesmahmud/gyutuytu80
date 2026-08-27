import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@thulobazaar/database', () => ({
  prisma: {
    notifications: { create: vi.fn(), count: vi.fn() },
    notification_log: { findFirst: vi.fn(), createMany: vi.fn(), count: vi.fn() },
    fcm_tokens: { findMany: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock('../../services/firebase.js', () => ({ getFirebaseMessaging: vi.fn() }));
vi.mock('../../socket/index.js', () => ({ getIO: vi.fn(() => null) }));
vi.mock('@thulobazaar/types', () => ({
  transformDbNotificationToApi: vi.fn((row: unknown) => row),
}));

import { prisma } from '@thulobazaar/database';
import { getFirebaseMessaging } from '../../services/firebase.js';
import { sendNotification } from '../../services/notification.service.js';
import {
  isEngagementType,
  hasRecentEngagementPush,
  ENGAGEMENT_PRIORITY,
  ENGAGEMENT_WINDOW_HOURS,
} from '../../services/notificationPolicy.js';

const sendEachForMulticast = vi.fn();

/** The single log row written by a send, for asserting `pushed`. */
function loggedRows(): Array<{ pushed: boolean; reference_id: number | null }> {
  const call = vi.mocked(prisma.notification_log.createMany).mock.calls[0]?.[0];
  return (call as { data: Array<{ pushed: boolean; reference_id: number | null }> })?.data ?? [];
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(getFirebaseMessaging).mockReturnValue({ sendEachForMulticast } as never);
  sendEachForMulticast.mockResolvedValue({ successCount: 1, failureCount: 0, responses: [{}] });

  vi.mocked(prisma.notifications.create).mockResolvedValue({ id: 1 } as never);
  vi.mocked(prisma.notifications.count).mockResolvedValue(0 as never);
  vi.mocked(prisma.notification_log.createMany).mockResolvedValue({ count: 1 } as never);
  vi.mocked(prisma.notification_log.count).mockResolvedValue(0 as never);
  vi.mocked(prisma.fcm_tokens.findMany).mockResolvedValue([{ id: 1, token: 't1' }] as never);

  // Window clear by default.
  vi.mocked(prisma.notification_log.findFirst).mockResolvedValue(null as never);
});

describe('notification frequency policy', () => {
  it('classifies engagement types but never transactional ones', () => {
    expect(isEngagementType('win_back')).toBe(true);
    expect(isEngagementType('abandoned_bookmark')).toBe(true);
    expect(isEngagementType('unread_messages_reminder')).toBe(true);

    // The types users actually asked for must never be throttled.
    expect(isEngagementType('new_message')).toBe(false);
    expect(isEngagementType('ad_approved')).toBe(false);
    expect(isEngagementType('payment_confirmed')).toBe(false);
    expect(isEngagementType('verification_approved')).toBe(false);
  });

  it('ranks things the user can lose above discovery', () => {
    const rank = (type: string) => ENGAGEMENT_PRIORITY.indexOf(type as never);

    expect(rank('ad_expiring')).toBeLessThan(rank('trending_area'));
    expect(rank('promotion_expiring')).toBeLessThan(rank('nearby_seller'));
    expect(rank('unread_messages_reminder')).toBeLessThan(rank('win_back'));
  });

  it('counts only pushed rows inside the window', async () => {
    await hasRecentEngagementPush(7);

    const where = vi.mocked(prisma.notification_log.findFirst).mock.calls[0][0]?.where as {
      pushed: boolean;
      sent_at: { gte: Date };
      notification_type: { in: string[] };
    };

    // Counting silenced rows would turn the cap into a permanent mute.
    expect(where.pushed).toBe(true);
    expect(where.notification_type.in).toContain('win_back');

    const windowMs = Date.now() - where.sent_at.gte.getTime();
    expect(windowMs).toBeGreaterThan((ENGAGEMENT_WINDOW_HOURS - 1) * 3600_000);
    expect(windowMs).toBeLessThan((ENGAGEMENT_WINDOW_HOURS + 1) * 3600_000);
  });
});

describe('sendNotification frequency gate', () => {
  it('pushes an engagement notification when the window is clear', async () => {
    await sendNotification({
      recipientUserIds: [7],
      type: 'win_back',
      title: 'We Miss You!',
      body: 'Come back',
    });

    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(loggedRows()[0].pushed).toBe(true);
  });

  it('silences the push when the window is spent but keeps the inbox entry', async () => {
    vi.mocked(prisma.notification_log.findFirst).mockResolvedValue({ id: 99 } as never);

    await sendNotification({
      recipientUserIds: [7],
      type: 'trending_area',
      title: 'Trending',
      body: 'Lots of new ads',
    });

    expect(sendEachForMulticast).not.toHaveBeenCalled();
    // The content is not lost — it just does not buzz the phone.
    expect(prisma.notifications.create).toHaveBeenCalledTimes(1);
    // ...and it must not consume the window itself, or the cap would cascade.
    expect(loggedRows()[0].pushed).toBe(false);
  });

  it('never gates transactional notifications', async () => {
    vi.mocked(prisma.notification_log.findFirst).mockResolvedValue({ id: 99 } as never);

    await sendNotification({
      recipientUserIds: [7],
      type: 'new_message',
      title: 'New message from Ram',
      body: 'Hello',
    });

    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    // The cap is not even consulted for transactional types.
    expect(prisma.notification_log.findFirst).not.toHaveBeenCalled();
  });

  it('does not burn the window on a user with no device', async () => {
    vi.mocked(prisma.fcm_tokens.findMany).mockResolvedValue([] as never);

    await sendNotification({
      recipientUserIds: [7],
      type: 'nearby_seller',
      title: 'Verified Seller Near You',
      body: 'New ads nearby',
    });

    expect(loggedRows()[0].pushed).toBe(false);
  });

  it('does not burn the window when every device token is stale', async () => {
    sendEachForMulticast.mockResolvedValue({
      successCount: 0,
      failureCount: 1,
      responses: [{ error: { code: 'messaging/registration-token-not-registered' } }],
    });
    vi.mocked(prisma.fcm_tokens.deleteMany).mockResolvedValue({ count: 1 } as never);

    await sendNotification({
      recipientUserIds: [7],
      type: 'nearby_seller',
      title: 'Verified Seller Near You',
      body: 'New ads nearby',
    });

    expect(loggedRows()[0].pushed).toBe(false);
  });

  it('logs one row per collapsed item so none is re-sent tomorrow', async () => {
    await sendNotification({
      recipientUserIds: [7],
      type: 'abandoned_bookmark',
      title: 'Still Interested?',
      body: '3 of your saved ads are still available',
      logReferenceIds: [11, 22, 33],
    });

    // One push, one inbox entry, three cooldown records.
    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(prisma.notifications.create).toHaveBeenCalledTimes(1);
    expect(loggedRows().map(r => r.reference_id)).toEqual([11, 22, 33]);
  });
});
