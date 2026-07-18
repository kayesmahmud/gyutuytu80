/**
 * Official "Thulo Bazaar Team" badge shown next to staff names in chat.
 * Driven by the server-computed `isStaff` flag (users.role), so regular
 * users can never display it.
 */
import { BadgeCheck } from 'lucide-react';

export function TeamBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 text-[10px] uppercase tracking-wide flex-shrink-0 align-middle"
      title="Official Thulo Bazaar staff account"
    >
      <BadgeCheck size={compact ? 10 : 12} strokeWidth={2.5} />
      {compact ? 'Team' : 'Thulo Bazaar Team'}
    </span>
  );
}
