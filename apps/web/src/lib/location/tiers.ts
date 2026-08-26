import type { LocationType } from './types';

/** Coarsest → most precise. Index doubles as the tier's rank. */
const TIER_ORDER: LocationType[] = ['province', 'district', 'municipality', 'area'];

/**
 * An ad must be pinned at least this precisely. Mirrors the Flutter app, which
 * has always required a municipality (`_selectedMunicipality!.id`) — the web
 * had no such rule, which is how 112 province-level ads reached production.
 */
export const MIN_AD_LOCATION_TIER: LocationType = 'municipality';

/** True when `type` is at least as precise as `minimum`. */
export function isTierAtLeast(type: string | null | undefined, minimum: LocationType): boolean {
  if (!type) return false;
  const rank = TIER_ORDER.indexOf(type as LocationType);
  if (rank === -1) return false;
  return rank >= TIER_ORDER.indexOf(minimum);
}

/**
 * True when a location at `type` is precise enough to be an ad's location.
 *
 * This is the floor, not the whole rule: a municipality that is subdivided into
 * areas also requires one of those areas. That check needs the municipality's
 * children, so it lives in the picker (`needsArea`) and is enforced server-side
 * by `validateAdLocation` in the API's ad.service.
 */
export function isValidAdLocationTier(type: string | null | undefined): boolean {
  return isTierAtLeast(type, MIN_AD_LOCATION_TIER);
}
