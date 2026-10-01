// Live-data engine for SurgeGuard. Pure functions, no React.
// Turns batches of real sensor readings into SimState, and measures the
// impact of an executed plan from what the sensors actually report.

import type { Zone, ZoneId, ZoneReading } from '@/types';
import type { RecommendationPlan } from '@/engine/recommendations';
import {
  occupancyPct,
  queueFromOccupancy,
  type ExecutionRecord,
  type ImpactMetrics,
  type SimState,
} from '@/engine/simulation';
import { INITIAL_ZONES, LIVE_HISTORY_MAX_LENGTH } from '@/config/scenario';

const KNOWN_IDS = new Set<string>(INITIAL_ZONES.map((z) => z.id));

/** Runtime check for data coming off the wire. Never trust the network. */
export function isValidReading(x: unknown): x is ZoneReading {
  const r = x as ZoneReading;
  return (
    !!r &&
    typeof r.zoneId === 'string' &&
    KNOWN_IDS.has(r.zoneId) &&
    Number.isFinite(r.timestamp) &&
    Number.isFinite(r.count) &&
    r.count >= 0 &&
    (r.queueMin === undefined || Number.isFinite(r.queueMin)) &&
    (r.staff === undefined || Number.isFinite(r.staff))
  );
}

function capped<T>(arr: T[], item: T): T[] {
  const next = [...arr, item];
  return next.length > LIVE_HISTORY_MAX_LENGTH
    ? next.slice(next.length - LIVE_HISTORY_MAX_LENGTH)
    : next;
}

function metrics(zone: Zone): ImpactMetrics {
  return {
    occupancyPct: occupancyPct(zone),
    queueMin: zone.queueMin,
    staff: zone.staff,
  };
}

/**
 * Apply a batch of readings. Zones start fresh on their first live reading
 * (simulated seed history is discarded), out-of-order or duplicate readings
 * are dropped, and an executed plan's "after" numbers follow the real data.
 */
export function applyReadings(
  state: SimState,
  readings: ZoneReading[]
): SimState {
  const zones: Record<ZoneId, Zone> = { ...state.zones };
  let changed = false;

  const ordered = [...readings].sort((a, b) => a.timestamp - b.timestamp);
  for (const r of ordered) {
    const zone = zones[r.zoneId];
    if (!zone) continue;

    const times = zone.historyTimes;
    const last = times ? times[times.length - 1] : undefined;
    if (last !== undefined && r.timestamp <= last) continue; // stale / duplicate

    const count = Math.max(0, r.count);
    const pct = (count / zone.capacity) * 100;
    zones[r.zoneId] = {
      ...zone,
      current: count,
      queueMin: r.queueMin ?? queueFromOccupancy(pct),
      staff: r.staff ?? zone.staff,
      history: times ? capped(zone.history, count) : [count],
      historyTimes: times ? capped(times, r.timestamp) : [r.timestamp],
    };
    changed = true;
  }

  if (!changed) return state;

  let execution = state.execution;
  if (execution) {
    const src = zones[execution.sourceZoneId];
    const tgt = execution.targetZoneId ? zones[execution.targetZoneId] : null;
    execution = {
      ...execution,
      after: metrics(src),
      targetAfter: tgt ? metrics(tgt) : null,
    };
  }

  return {
    ...state,
    zones,
    execution,
    status: 'running',
    tick: state.tick + 1,
  };
}

/**
 * Live "execute": record what was dispatched and snapshot the real "before"
 * numbers. Zones are NOT changed here. The "after" numbers update as the
 * sensors report the effect (see applyReadings).
 */
export function executePlanLive(
  state: SimState,
  plan: RecommendationPlan
): SimState {
  if (state.execution) return state;

  const source = state.zones[plan.sourceZoneId];
  const target = plan.targetZoneId ? state.zones[plan.targetZoneId] : null;
  const staffDeployed = Math.min(plan.staffToDeploy, state.staff.available);

  const execution: ExecutionRecord = {
    sourceZoneId: source.id,
    targetZoneId: target ? target.id : null,
    redirectPeople: plan.redirectPeople,
    staffDeployed,
    before: metrics(source),
    after: metrics(source),
    targetBefore: target ? metrics(target) : null,
    targetAfter: target ? metrics(target) : null,
    executedAtMinutes: state.simulatedMinutes,
  };

  return {
    ...state,
    staff: {
      ...state.staff,
      deployed: state.staff.deployed + staffDeployed,
      available: state.staff.available - staffDeployed,
    },
    execution,
  };
}
