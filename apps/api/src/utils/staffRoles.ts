/**
 * Staff roles whose chat identity shows the official "Thulo Bazaar Team" badge.
 * Server-derived from users.role, so it cannot be faked by user input.
 */
export const STAFF_ROLES = ['editor', 'super_admin', 'admin', 'root'];

export function isStaffRole(role?: string | null): boolean {
  return !!role && STAFF_ROLES.includes(role);
}
