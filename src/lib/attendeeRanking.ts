import type { Zone } from '@/types';
import { VENUE_FACILITIES, type FacilityKind, type VenueFacility } from '@/data/facilities';
import {
  ZONE_SHAPES,
  distanceMeters,
  walkMinutesFromMeters,
  type Point,
} from '@/data/venueGeometry';

// ---- Gates ----------------------------------------------------------

export interface GateOption {
  zone: Zone;
  pct: number;
  meters: number;
  walkMin: number;
  waitMin: number;
  /** wait + walk: what we rank by */
  totalMin: number;
  isBest: boolean;
  isFastest: boolean;
  isNearest: boolean;
}

export function rankGates(gates: Zone[], from: Point): GateOption[] {
  if (gates.length === 0) return [];

  const base = gates.map((zone) => {
    const c = ZONE_SHAPES[zone.id];
    const meters = distanceMeters(from, { x: c.x, y: c.y });
    const walkMin = walkMinutesFromMeters(meters);
    return {
      zone,
      pct: Math.round((zone.current / zone.capacity) * 100),
      meters,
      walkMin,
      waitMin: zone.queueMin,
      totalMin: zone.queueMin + walkMin,
    };
  });

  const minWait = Math.min(...base.map((g) => g.waitMin));
  const minMeters = Math.min(...base.map((g) => g.meters));
  const sorted = [...base].sort((a, b) => a.totalMin - b.totalMin || a.pct - b.pct);
  const bestId = sorted[0].zone.id;

  return sorted.map((g) => ({
    ...g,
    isBest: g.zone.id === bestId,
    isFastest: g.waitMin === minWait,
    isNearest: g.meters === minMeters,
  }));
}

// ---- Stalls and facilities -----------------------------------------

export interface FacilityOption {
  facility: VenueFacility;
  meters: number;
  walkMin: number;
  waitMin: number;
  totalMin: number;
  /** best (wait + walk) of its kind, e.g. best water stop */
  isBest: boolean;
  /** a clearly better alternative, if the data names one */
  better: { facility: VenueFacility; saveMin: number } | null;
}

function measure(f: VenueFacility, from: Point) {
  const meters = distanceMeters(from, { x: f.x, y: f.y });
  const walkMin = walkMinutesFromMeters(meters);
  return {
    facility: f,
    meters,
    walkMin,
    waitMin: f.queueMin,
    totalMin: f.queueMin + walkMin,
  };
}

/** Stalls (no exits) of the chosen kind, best total time first. */
export function rankFacilities(kind: FacilityKind, from: Point): FacilityOption[] {
  const all = VENUE_FACILITIES.filter((f) => f.kind !== 'exit').map((f) => measure(f, from));

  const bestByKind = new Map<string, string>();
  for (const o of [...all].sort((a, b) => a.totalMin - b.totalMin)) {
    if (!bestByKind.has(o.facility.kind)) bestByKind.set(o.facility.kind, o.facility.id);
  }

  const byId = new Map(all.map((o) => [o.facility.id, o]));

  return all
    .filter((o) => kind === 'all' || o.facility.kind === kind)
    .map((o) => {
      let better: FacilityOption['better'] = null;
      const altId = o.facility.altFacilityId;
      const alt = altId ? byId.get(altId) : undefined;
      if (alt && alt.totalMin < o.totalMin - 1) {
        better = { facility: alt.facility, saveMin: Math.round(o.totalMin - alt.totalMin) };
      }
      return { ...o, isBest: bestByKind.get(o.facility.kind) === o.facility.id, better };
    })
    .sort((a, b) => a.totalMin - b.totalMin);
}

/** Closest facility of a kind by distance only (used for first aid after an SOS). */
export function nearestOfKind(
  kind: VenueFacility['kind'],
  from: Point
): { facility: VenueFacility; meters: number } | null {
  let best: { facility: VenueFacility; meters: number } | null = null;
  for (const f of VENUE_FACILITIES) {
    if (f.kind !== kind) continue;
    const meters = distanceMeters(from, { x: f.x, y: f.y });
    if (!best || meters < best.meters) best = { facility: f, meters };
  }
  return best;
}
