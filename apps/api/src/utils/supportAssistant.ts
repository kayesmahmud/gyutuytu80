import { prisma } from '@thulobazaar/database';

/**
 * "Thulo Bazaar Assistant" — the AI first-line responder on support tickets.
 * Seeded by migration 20260827000003_support_ai with role 'editor' so every
 * client renders its messages with the existing staff styling; looked up by
 * email because the id differs per environment. The account cannot log in
 * (password_hash is not valid bcrypt) and is excluded from editor alerts in
 * notification.service.ts.
 */
export const SUPPORT_ASSISTANT_EMAIL = 'assistant@thulobazaar.com.np';

let cachedAssistantId: number | null = null;

export async function getSupportAssistantId(): Promise<number> {
  if (cachedAssistantId !== null) return cachedAssistantId;
  const account = await prisma.users.findUnique({
    where: { email: SUPPORT_ASSISTANT_EMAIL },
    select: { id: true },
  });
  if (!account) {
    throw new Error(`Support assistant ${SUPPORT_ASSISTANT_EMAIL} is missing — run migrations`);
  }
  cachedAssistantId = account.id;
  return cachedAssistantId;
}
