/**
 * Next.js → Express support-event bridge.
 *
 * The Next.js support routes write to the DB directly, so by themselves they
 * produce no socket broadcasts, no editor alerts, no owner notifications, and
 * never wake the AI assistant. After saving, they report what happened here;
 * Express (/api/internal/support-event) fans it out exactly like its own paths.
 *
 * Fire-and-forget on purpose: the user's request must never fail because the
 * side-effect fan-out did.
 */
export type SupportBridgeEvent =
  | 'ticket-created'
  | 'customer-message'
  | 'staff-reply'
  | 'ticket-updated';

export function notifySupportEvent(
  event: SupportBridgeEvent,
  ticketId: number,
  messageId?: number,
  /** For 'ticket-updated': the status THIS request set, if it set one. */
  statusChangedTo?: string
): void {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  fetch(`${backendUrl}/api/internal/support-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.INTERNAL_API_SECRET,
      event,
      ticketId,
      ...(messageId ? { messageId } : {}),
      ...(statusChangedTo ? { statusChangedTo } : {}),
    }),
  })
    // A 403 (missing/mismatched secret) resolves normally, so without this the
    // whole fan-out can be dead in production with no log line anywhere —
    // exactly how the chat broadcast bridge stayed silently broken before.
    .then((res) => {
      if (!res.ok) {
        console.error(
          `Support event bridge rejected: ${res.status} for ${event} on ticket ${ticketId}` +
            (res.status === 403 ? ' — check INTERNAL_API_SECRET in the web container' : '')
        );
      }
    })
    .catch((err) => console.error('Support event bridge failed (non-critical):', err.message));
}
