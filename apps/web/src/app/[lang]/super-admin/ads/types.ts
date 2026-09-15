// Shape of one row from GET /api/editor/ads (camelCase — see
// apps/api/src/routes/editor/ads.routes.ts). Only the fields this page reads.
export interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  status: string;
  createdAt: string;
  categoryName: string | null;
  locationName: string | null;
  user: {
    id: number;
    fullName: string | null;
    email: string | null;
  } | null;
}

export const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-700';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-rose-100 text-rose-700';
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
