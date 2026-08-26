import { prisma } from '@thulobazaar/database';
import { isTeamAccount } from './teamAccount.js';

/**
 * Returns true if either user has blocked the other (bidirectional).
 * One blocked_users row prevents messaging in both directions.
 */
export async function isBlockedBetween(userA: number, userB: number): Promise<boolean> {
  // The team account is exempt: a block here would silently cut off all
  // staff/moderation outreach (and blocking it is rejected at the API anyway).
  if ((await isTeamAccount(userA)) || (await isTeamAccount(userB))) return false;
  const block = await prisma.blocked_users.findFirst({
    where: {
      OR: [
        { blocker_id: userA, blocked_id: userB },
        { blocker_id: userB, blocked_id: userA },
      ],
    },
    select: { id: true },
  });
  return block !== null;
}

/**
 * Block status of `otherUserId` relative to `userId`.
 * - blockedByMe: userId has blocked otherUserId
 * - blockedMe: otherUserId has blocked userId
 */
export async function getBlockStatus(
  userId: number,
  otherUserId: number
): Promise<{ blockedByMe: boolean; blockedMe: boolean }> {
  const rows = await prisma.blocked_users.findMany({
    where: {
      OR: [
        { blocker_id: userId, blocked_id: otherUserId },
        { blocker_id: otherUserId, blocked_id: userId },
      ],
    },
    select: { blocker_id: true },
  });
  return {
    blockedByMe: rows.some((r) => r.blocker_id === userId),
    blockedMe: rows.some((r) => r.blocker_id === otherUserId),
  };
}
