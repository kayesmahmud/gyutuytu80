import { prisma } from '@thulobazaar/database';

/**
 * Shared "Thulo Bazaar Team" sender account for editor→user outreach.
 * Seeded by migration 20260826000001_team_inbox; looked up by email because the
 * id differs per environment. Mirrored in apps/web/src/lib/teamAccount.ts.
 */
export const TEAM_ACCOUNT_EMAIL = 'team@thulobazaar.com.np';

let cachedTeamAccountId: number | null = null;

export async function getTeamAccountId(): Promise<number> {
  if (cachedTeamAccountId !== null) return cachedTeamAccountId;
  const account = await prisma.users.findUnique({
    where: { email: TEAM_ACCOUNT_EMAIL },
    select: { id: true },
  });
  if (!account) {
    throw new Error(`Team account ${TEAM_ACCOUNT_EMAIL} is missing — run migrations`);
  }
  cachedTeamAccountId = account.id;
  return cachedTeamAccountId;
}

/** Never throws — regular chat must keep working even if the seed is missing. */
export async function isTeamAccount(userId: number): Promise<boolean> {
  try {
    return userId === (await getTeamAccountId());
  } catch {
    return false;
  }
}
