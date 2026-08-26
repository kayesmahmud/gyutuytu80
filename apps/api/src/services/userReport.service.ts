/**
 * System-generated user reports (AI trust & safety).
 *
 * user_reports has a UNIQUE(reported_user_id, reporter_id) pair and reporter_id
 * is a hard FK — there is no "system" user, so AI reports are self-referencing
 * (reporter = reported) and clearly prefixed [AI]. That gives exactly ONE
 * aggregated AI report per offender: repeat incidents bump the count and
 * re-open the report instead of piling up rows.
 */
import { prisma } from '@thulobazaar/database';

export const EXPLICIT_CONTENT_REASON = 'explicit_image_upload';

export async function reportExplicitContent(userId: number, source: string): Promise<void> {
  const now = new Date();
  const existing = await prisma.user_reports.findUnique({
    where: {
      idx_user_reports_unique: { reported_user_id: userId, reporter_id: userId },
    },
    select: { id: true, details: true },
  });

  if (existing) {
    const match = existing.details?.match(/Incidents: (\d+)/);
    const count = (match ? parseInt(match[1], 10) : 1) + 1;
    await prisma.user_reports.update({
      where: { id: existing.id },
      data: {
        status: 'pending', // re-open if it was resolved
        details: `[AI] Prohibited sexual/nude content detected in image upload (latest via ${source}, ${now.toISOString()}). Incidents: ${count}`,
        updated_at: now,
      },
    });
  } else {
    await prisma.user_reports.create({
      data: {
        reported_user_id: userId,
        reporter_id: userId,
        reason: EXPLICIT_CONTENT_REASON,
        details: `[AI] Prohibited sexual/nude content detected in image upload (via ${source}, ${now.toISOString()}). Incidents: 1`,
      },
    });
  }
  console.log(`🚨 Explicit-content report filed for user ${userId} (via ${source})`);
}
