import type { ZoneId } from '@/types';

// Same 800 x 530 drawing space as the organizer's EventMap.
// (Copied here on purpose so the organizer map stays untouched.)
export const MAP_W = 800;
export const MAP_H = 530;
export const MAP_BOUNDS = { minX: 40, maxX: 760, minY: 25, maxY: 505 };

export interface Point {
  x: number;
  y: number;
}

export interface ZoneShape {
  x: number; // center
  y: number;
  w: number;
  h: number;
  ellipse?: boolean;
}

export const ZONE_SHAPES: Record<ZoneId, ZoneShape> = {
  'gate-a': { x: 140, y: 100, w: 130, h: 60 },
  'gate-c': { x: 400, y: 65, w: 130, h: 60 },
  'gate-b': { x: 660, y: 100, w: 130, h: 60 },
  'main-arena': { x: 400, y: 260, w: 340, h: 165, ellipse: true },
  'food-court': { x: 670, y: 395, w: 140, h: 60 },
  parking: { x: 400, y: 460, w: 190, h: 60 },
};

/** Where "you" start until you tap the map (inside the arena, below the stage). */
export const DEFAULT_POSITION: Point = { x: 400, y: 320 };

/** 1 map unit = 0.6 m  (the 720-unit-wide grounds are about 430 m across). */
export const METERS_PER_UNIT = 0.6;
/** Walking pace in a busy crowd. */
export const WALK_M_PER_MIN = 72;

export function clampToVenue(p: Point): Point {
  return {
    x: Math.min(MAP_BOUNDS.maxX, Math.max(MAP_BOUNDS.minX, p.x)),
    y: Math.min(MAP_BOUNDS.maxY, Math.max(MAP_BOUNDS.minY, p.y)),
  };
}

export function distanceMeters(a: Point, b: Point): number {
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y) * METERS_PER_UNIT);
}

/** Exact (fractional) walking minutes, used for ranking. */
export function walkMinutesFromMeters(meters: number): number {
  return meters / WALK_M_PER_MIN;
}

/** Whole minutes for display (never shows 0). */
export function walkLabel(walkMin: number): number {
  return Math.max(1, Math.round(walkMin));
}

/** Which zone is this point in? Falls back to the nearest zone centre. */
export function zoneAt(p: Point): ZoneId {
  const ids = Object.keys(ZONE_SHAPES) as ZoneId[];

  // Rectangles first (gates, food court, parking)
  for (const id of ids) {
    const s = ZONE_SHAPES[id];
    if (s.ellipse) continue;
    if (Math.abs(p.x - s.x) <= s.w / 2 && Math.abs(p.y - s.y) <= s.h / 2) return id;
  }
  // Then the arena ellipse
  for (const id of ids) {
    const s = ZONE_SHAPES[id];
    if (!s.ellipse) continue;
    const nx = (p.x - s.x) / (s.w / 2);
    const ny = (p.y - s.y) / (s.h / 2);
    if (nx * nx + ny * ny <= 1) return id;
  }
  // Otherwise the closest zone centre
  let best: ZoneId = ids[0];
  let bestD = Infinity;
  for (const id of ids) {
    const s = ZONE_SHAPES[id];
    const d = Math.hypot(p.x - s.x, p.y - s.y);
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}
