import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdsTable from '@/app/[lang]/super-admin/ads/components/AdsTable';
import type { Ad } from '@/app/[lang]/super-admin/ads/types';

// The exact shape GET /api/editor/ads emits (apps/api/src/routes/editor/ads.routes.ts).
// The table once read snake_case (created_at, seller_name) and showed "Invalid Date".
const AD: Ad = {
  id: 1,
  title: 'Selfie Stick Tripod R1-L',
  description: 'Selfie stick tripod model R1-L shown in its retail box',
  price: 950,
  status: 'pending',
  createdAt: '2026-09-14T10:30:00.000Z',
  categoryName: 'Mobile Accessories',
  locationName: 'Kathmandu',
  user: { id: 7, fullName: 'Anita Pandey', email: 'anita@example.com' },
};

function renderTable(ads: Ad[]) {
  return render(
    <AdsTable
      ads={ads}
      lang="en"
      page={1}
      totalPages={1}
      totalAds={ads.length}
      actionLoading={null}
      onPageChange={vi.fn()}
      onApprove={vi.fn()}
      onReject={vi.fn()}
    />
  );
}

describe('SuperAdmin AdsTable', () => {
  it('renders the created date, seller, category and location from the camelCase API payload', () => {
    renderTable([AD]);
    expect(screen.getByText('Sep 14, 2026')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid Date/)).toBeNull();
    expect(screen.getByText('Anita Pandey')).toBeInTheDocument();
    expect(screen.getByText('anita@example.com')).toBeInTheDocument();
    expect(screen.getByText('Mobile Accessories')).toBeInTheDocument();
    expect(screen.getByText('Kathmandu')).toBeInTheDocument();
  });

  it('does not crash on an ad whose seller account is gone', () => {
    renderTable([{ ...AD, user: null }]);
    expect(screen.getByText('Sep 14, 2026')).toBeInTheDocument();
  });
});
