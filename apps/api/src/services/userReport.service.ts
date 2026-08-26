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
export const PROHIBITED_ITEM_REASON = 'prohibited_item_listing';

/** From this many AI incidents on, the report tells editors to consider suspension. */
const SUSPENSION_NUDGE_THRESHOLD = 3;
const MAX_DETAIL_LENGTH = 200;

export type AiViolationKind = 'explicit' | 'prohibited';

const VIOLATION_TEXT: Record<AiViolationKind, { reason: string; summary: string }> = {
  explicit: {
    reason: EXPLICIT_CONTENT_REASON,
    summary: 'Prohibited sexual/nude content detected in image upload',
  },
  prohibited: {
    reason: PROHIBITED_ITEM_REASON,
    summary: 'Prohibited item listed (weapons, drugs, tobacco/nicotine or other banned goods)',
  },
};

export async function reportAiViolation(
  userId: number,
  source: string,
  kind: AiViolationKind,
  detail?: string
): Promise<void> {
  const now = new Date();
  const { reason, summary } = VIOLATION_TEXT[kind];
  // detail is model free text over attacker-controlled ad content: strip
  // anything that could masquerade as the counter token, and keep it AFTER
  // the genuine "Incidents: N" so the first-match parser below stays honest.
  const detailNote = detail
    ? ` Detail: ${detail.replace(/Incidents:\s*\d+/gi, '').slice(0, MAX_DETAIL_LENGTH)}`
    : '';
  const existing = await prisma.user_reports.findUnique({
    where: {
      // Prisma names the compound-unique input by its fields, not the DB index name
      reported_user_id_reporter_id: { reported_user_id: userId, reporter_id: userId },
    },
    select: { id: true, details: true },
  });

  if (existing) {
    const match = existing.details?.match(/Incidents: (\d+)/);
    const count = (match ? parseInt(match[1], 10) : 1) + 1;
    const nudge =
      count >= SUSPENSION_NUDGE_THRESHOLD ? ' Repeated violations — consider suspension.' : '';
    await prisma.user_reports.update({
      where: { id: existing.id },
      data: {
        status: 'pending', // re-open if it was resolved
        reason, // the latest violation kind headlines the report
        details: `[AI] ${summary} (latest via ${source}, ${now.toISOString()}). Incidents: ${count}.${nudge}${detailNote}`,
        updated_at: now,
      },
    });
  } else {
    await prisma.user_reports.create({
      data: {
        reported_user_id: userId,
        reporter_id: userId,
        reason,
        details: `[AI] ${summary} (via ${source}, ${now.toISOString()}). Incidents: 1.${detailNote}`,
      },
    });
  }
  console.log(`🚨 AI ${kind} report filed for user ${userId} (via ${source})`);
}
