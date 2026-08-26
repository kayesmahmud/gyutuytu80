import { prisma } from '@thulobazaar/database';

/**
 * Shared "Thulo Bazaar Team" sender account for editor→user outreach.
 * Mirror of apps/api/src/utils/teamAccount.ts (same convention as staffRoles).
 * Seeded by migration 20260826000001_team_inbox; looked up by email because the
 * id differs per environment.
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
