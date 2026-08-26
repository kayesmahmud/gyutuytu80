/** One link in an ad's location chain, leaf first, each pointing at its parent. */
interface LocationChainNode {
  name: string;
  type?: string | null;
  locations?: LocationChainNode | null;
}

/**
 * Prisma select that pulls an ad's location plus two ancestors — enough to reach
 * the district from the deepest tier we store (area → municipality → district).
 */
export const AD_CARD_LOCATION_SELECT = {
  id: true,
  name: true,
  type: true,
  locations: {
    select: {
      id: true,
      name: true,
      type: true,
      locations: { select: { id: true, name: true, type: true } },
    },
  },
} as const;

/**
 * The place name an ad card shows. Always the district: municipality names
 * average 26 characters (max 43, "Mukhiyapatti Musaharmiya Rural Municipality")
 * and truncate in a half-width card, while districts average 8 (max 16).
 *
 * Falls back to the ad's own location name when nothing above it is a district —
 * the 56 legacy province-level ads, which show their province instead of nothing.
 */
export function resolveDistrictName(location: LocationChainNode | null | undefined): string | null {
  let current = location;
  while (current) {
    if (current.type === 'district') return current.name;
    current = current.locations;
  }
  return location?.name ?? null;
}
