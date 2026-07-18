/**
 * Staff roles whose chat messages get the official "Thulo Bazaar Team" badge.
 * Derived from the server-side users.role column, so it cannot be faked by
 * user input — only accounts you grant these roles ever show the badge.
 */
export const STAFF_ROLES = ['editor', 'super_admin', 'admin', 'root'] as const;

export function isStaffRole(role?: string | null): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}
