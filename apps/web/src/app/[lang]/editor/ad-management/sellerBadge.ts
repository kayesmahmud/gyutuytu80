import type { Seller } from './types';

/**
 * Visual descriptor for a seller's verification status, shown in the
 * "Posted by" footer of each editor ad card.
 *
 * - `badgeImage`: path under /public (the same badges used across the site),
 *   or null for unverified sellers.
 * - `label`: short text shown next to the name.
 * - `className`: Tailwind classes for the label pill.
 */
export interface SellerBadge {
  label: string;
  badgeImage: string | null;
  className: string;
}

/**
 * Decide how to badge the seller who posted an ad.
 *
 * Precedence: a business-verified seller outranks an individual-verified one,
 * which outranks a normal (unverified) user. Editors care most about the
 * highest trust signal, so that wins when both happen to be true.
 *
 * 👉 This is the one spot that encodes a product decision. Tweak the copy
 *    (labels) and the precedence here to match how you want sellers framed.
 */
export function getSellerBadge(seller: Seller | null | undefined): SellerBadge {
  if (seller?.businessVerified) {
    return {
      label: 'Business Verified',
      badgeImage: '/golden-badge.png',
      className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    };
  }

  if (seller?.individualVerified) {
    return {
      label: 'Verified',
      badgeImage: '/blue-badge.png',
      className: 'bg-blue-100 text-blue-700 border border-blue-200',
    };
  }

  return {
    label: 'Normal user',
    badgeImage: null,
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
  };
}
