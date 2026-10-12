import type { ZoneId, Zone, RiskLevel } from '@/types';
import type { VenueFacility } from '@/data/facilities';
import { distanceMeters, ZONE_SHAPES } from '@/data/venueGeometry';
import { occupancyToRisk } from '@/config/scenario';

export interface Point {
  x: number;
  y: number;
}

export interface MedkitAllocationResult {
  medkit: VenueFacility;
  etaSeconds: number;
  route: Point[];
  crowdPenaltySeconds: number;
  baseDistanceM: number;
}

// Paramedic rapid response pace: ~ 120 meters/min (2.0 m/s)
const RESPONDER_SPEED_MPS = 2.0;

/**
 * Check if the segment between point A and point B intersects or enters a given zone bounding box.
 */
function lineIntersectsZone(p1: Point, p2: Point, zoneId: ZoneId): boolean {
  const shape = ZONE_SHAPES[zoneId];
  if (!shape) return false;

  // Check 5 sample points along the direct route line
  for (let t = 0.1; t <= 0.9; t += 0.2) {
    const x = p1.x + (p2.x - p1.x) * t;
    const y = p1.y + (p2.y - p1.y) * t;
    if (shape.ellipse) {
      const nx = (x - shape.x) / (shape.w / 2);
      const ny = (y - shape.y) / (shape.h / 2);
      if (nx * nx + ny * ny <= 1) return true;
    } else {
      if (
        x >= shape.x - shape.w / 2 &&
        x <= shape.x + shape.w / 2 &&
        y >= shape.y - shape.h / 2 &&
        y <= shape.y + shape.h / 2
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Compute crowd congestion transit penalty in seconds when crossing congested zones.
 */
function computeRouteCrowdPenalty(
  from: Point,
  to: Point,
  zones: Partial<Record<ZoneId, Zone>> = {}
): number {
  let penaltySeconds = 0;
  for (const [id, zone] of Object.entries(zones)) {
    if (!zone) continue;
    const zoneId = id as ZoneId;
    if (lineIntersectsZone(from, to, zoneId)) {
      const pct = (zone.current / zone.capacity) * 100;
      const risk: RiskLevel = occupancyToRisk(pct);
      if (risk === 'critical') {
        penaltySeconds += 35; // Heavy congestion bottleneck
      } else if (risk === 'high') {
        penaltySeconds += 20; // High crowd flow friction
      } else if (risk === 'warning') {
        penaltySeconds += 8; // Mild queue slowdown
      }
    }
  }
  return penaltySeconds;
}

/**
 * Pure function to choose the available medkit/first-aid post with the lowest ETA.
 * Takes into account Euclidean distance and crowd risk transit penalties.
 */
export function allocateNearestMedkit(
  targetPoint: Point,
  zones: Partial<Record<ZoneId, Zone>> = {},
  facilities: VenueFacility[],
  inUseMedkitIds: Set<string> = new Set()
): MedkitAllocationResult | null {
  const candidates = facilities.filter(
    (f) =>
      f.kind === 'medical' &&
      f.medkitStatus !== 'in-use' &&
      f.medkitStatus !== 'restocking' &&
      !inUseMedkitIds.has(f.id)
  );

  if (candidates.length === 0) return null;

  let best: MedkitAllocationResult | null = null;

  for (const medkit of candidates) {
    const medkitPoint: Point = { x: medkit.x, y: medkit.y };
    const distMeters = distanceMeters(medkitPoint, targetPoint);
    const baseSeconds = Math.round(distMeters / RESPONDER_SPEED_MPS);
    const crowdPenalty = computeRouteCrowdPenalty(medkitPoint, targetPoint, zones);
    const totalEtaSeconds = Math.max(12, baseSeconds + crowdPenalty);

    // Intermediate waypoint detour if crossing the central stage area
    const midX = (medkit.x + targetPoint.x) / 2;
    const midY = (medkit.y + targetPoint.y) / 2;
    const route: Point[] = [medkitPoint, { x: midX, y: midY }, targetPoint];

    if (!best || totalEtaSeconds < best.etaSeconds) {
      best = {
        medkit,
        etaSeconds: totalEtaSeconds,
        route,
        crowdPenaltySeconds: crowdPenalty,
        baseDistanceM: distMeters,
      };
    }
  }

  return best;
}
