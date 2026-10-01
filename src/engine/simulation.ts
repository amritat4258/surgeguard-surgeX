// SurgeGuard simulation engine - pure functions, no React.
// All tunable numbers live in src/config/scenario.ts.

import type { Zone, ZoneId, StaffPool, SimStatus } from '@/types';
import type { RecommendationPlan } from '@/engine/recommendations';
import {
  INITIAL_ZONES,
  INITIAL_STAFF,
  GATE_B_TRAJECTORY,
  GATE_B_POST_EXECUTE,
  MINUTES_PER_TICK,
  HISTORY_SEED_LENGTH,
  HISTORY_MAX_LENGTH,
  QUEUE_BASE_MIN,
  QUEUE_EXPONENT,
} from '@/config/scenario';

// -- Impact record (what the before/after panel shows) -----------------
export interface ImpactMetrics {
  occupancyPct: number;
  queueMin: number;
  staff: number;
}

export interface ExecutionRecord {
  sourceZoneId: ZoneId;
  targetZoneId: ZoneId | null;
  redirectPeople: number;
  staffDeployed: number;
  before: ImpactMetrics; // source zone, just before the plan
  after: ImpactMetrics; // source zone, just after the plan
  targetBefore: ImpactMetrics | null;
  targetAfter: ImpactMetrics | null;
  executedAtMinutes: number;
}

// -- Engine state shape ------------------------------------------------
export interface SimState {
  zones: Record<ZoneId, Zone>;
  staff: StaffPool;
  status: SimStatus;
  tick: number;
  simulatedMinutes: number;
  /** null until the manager executes the response plan */
  execution: ExecutionRecord | null;
}

// -- Deterministic PRNG (mulberry32) -----------------------------------
// Seed-based so the simulation is reproducible across runs.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

// -- Pure helpers ------------------------------------------------------

/** Occupancy percentage (0-100). */
export function occupancyPct(zone: Zone): number {
  return (zone.current / zone.capacity) * 100;
}

/**
 * Queue time derived from occupancy %.
 * Formula: QUEUE_BASE_MIN * (pct/100) ^ QUEUE_EXPONENT
 * Calibrated so Gate B at 96% gives about 18 min.
 */
export function queueFromOccupancy(pct: number): number {
  const ratio = Math.max(0, Math.min(1, pct / 100));
  return Math.round(QUEUE_BASE_MIN * Math.pow(ratio, QUEUE_EXPONENT));
}

/** Append a reading to history, capping at HISTORY_MAX_LENGTH. */
function pushHistory(history: number[], value: number): number[] {
  const next = [...history, value];
  if (next.length > HISTORY_MAX_LENGTH) {
    return next.slice(next.length - HISTORY_MAX_LENGTH);
  }
  return next;
}

/** Bounded noise: returns a value in [-mag, +mag] as fraction of base. */
function noise(base: number, magPct: number): number {
  const r = rng() * 2 - 1; // [-1, 1]
  return Math.round(base * magPct * r);
}

// -- Seed history for a zone (deterministic, ~8 readings) --------------
function seedHistory(zone: Zone): number[] {
  const history: number[] = [];
  const step = zone.current / (HISTORY_SEED_LENGTH + 1);
  for (let i = 1; i <= HISTORY_SEED_LENGTH; i++) {
    const base = Math.round(step * i);
    history.push(Math.max(0, base + noise(base, 0.03)));
  }
  history.push(zone.current); // ensure last entry matches `current`
  return history;
}

// -- Create initial state ----------------------------------------------
export function createInitialState(): SimState {
  const zones = {} as Record<ZoneId, Zone>;
  for (const z of INITIAL_ZONES) {
    const seeded: Zone = {
      ...z,
      history: seedHistory(z),
    };
    zones[z.id] = seeded;
  }
  return {
    zones,
    staff: { ...INITIAL_STAFF },
    status: 'idle',
    tick: 0,
    simulatedMinutes: 0,
    execution: null,
  };
}

// -- Per-zone drift model (non-Gate-B zones) ---------------------------
function driftZone(zone: Zone): Zone {
  let next = zone.current;
  switch (zone.id) {
    case 'gate-a':
      // stays comfortably normal (~55-62%), tiny drift
      next = zone.current + noise(zone.capacity, 0.004);
      break;
    case 'gate-c':
      // stays normal, tiny drift
      next = zone.current + noise(zone.capacity, 0.003);
      break;
    case 'main-arena':
      // fills slowly as gates discharge, drift up gently
      next = zone.current + Math.round(zone.capacity * 0.002) + noise(zone.capacity, 0.001);
      break;
    case 'food-court':
      // queue gradually increases - slight crowd rise
      next = zone.current + Math.round(zone.capacity * 0.003) + noise(zone.capacity, 0.002);
      break;
    case 'parking':
      // rises slowly toward ~78% over the scenario
      {
        const target = zone.capacity * 0.78;
        const diff = target - zone.current;
        if (diff > 20) {
          next = zone.current + Math.round(diff * 0.08) + noise(zone.capacity, 0.002);
        } else {
          next = zone.current + noise(zone.capacity, 0.002);
        }
      }
      break;
    default:
      next = zone.current + noise(zone.capacity, 0.002);
  }
  // Clamp to [0, capacity]
  next = Math.max(0, Math.min(zone.capacity, next));
  const pct = (next / zone.capacity) * 100;
  return {
    ...zone,
    current: next,
    queueMin: queueFromOccupancy(pct),
    history: pushHistory(zone.history, next),
  };
}

// -- After the plan: the stressed zone holds steady near its new level --
function recoverZone(zone: Zone, exec: ExecutionRecord): Zone {
  const holdCurrent = (exec.after.occupancyPct / 100) * zone.capacity;
  const pull = Math.round((holdCurrent - zone.current) * 0.3);
  let next = zone.current + pull + noise(zone.capacity, 0.002);
  next = Math.max(0, Math.min(zone.capacity, next));
  return {
    ...zone,
    current: next,
    queueMin: exec.after.queueMin,
    history: pushHistory(zone.history, next),
  };
}

// -- Advance one tick --------------------------------------------------
export function advanceTick(state: SimState): SimState {
  const tick = state.tick + 1;
  const exec = state.execution;

  // Gate B follows the scripted trajectory (tick 1 -> index 1, since tick 0 = initial)
  const gateBTrajIdx = Math.min(tick, GATE_B_TRAJECTORY.length - 1);
  const gateBValue = GATE_B_TRAJECTORY[gateBTrajIdx];
  const gateBFinished = !exec && tick >= GATE_B_TRAJECTORY.length - 1;

  const zones = {} as Record<ZoneId, Zone>;
  for (const id of Object.keys(state.zones) as ZoneId[]) {
    const zone = state.zones[id];
    if (exec && id === exec.sourceZoneId) {
      zones[id] = recoverZone(zone, exec);
    } else if (id === 'gate-b') {
      const pct = (gateBValue / zone.capacity) * 100;
      zones[id] = {
        ...zone,
        current: gateBValue,
        queueMin: queueFromOccupancy(pct),
        history: pushHistory(zone.history, gateBValue),
      };
    } else {
      zones[id] = driftZone(zone);
    }
  }

  return {
    ...state,
    zones,
    tick,
    simulatedMinutes: state.simulatedMinutes + MINUTES_PER_TICK,
    // Hold at final state once trajectory completes (until the plan is executed)
    status: gateBFinished ? 'paused' : state.status,
  };
}

// -- Execute the response plan ----------------------------------------
export function executePlan(
  state: SimState,
  plan: RecommendationPlan
): SimState {
  if (state.execution) return state; // only once per run

  const source = state.zones[plan.sourceZoneId];
  const target = plan.targetZoneId ? state.zones[plan.targetZoneId] : null;

  const staffDeployed = Math.min(plan.staffToDeploy, state.staff.available);

  // Source zone after: fewer people, extra staff, shorter queue
  const sourceCurrent = Math.max(0, source.current - plan.redirectPeople);
  const sourceQueue = Math.min(source.queueMin, GATE_B_POST_EXECUTE.queueMin);
  const sourceStaff = source.staff + staffDeployed;

  const before: ImpactMetrics = {
    occupancyPct: occupancyPct(source),
    queueMin: source.queueMin,
    staff: source.staff,
  };
  const after: ImpactMetrics = {
    occupancyPct: (sourceCurrent / source.capacity) * 100,
    queueMin: sourceQueue,
    staff: sourceStaff,
  };

  const zones: Record<ZoneId, Zone> = { ...state.zones };
  zones[source.id] = {
    ...source,
    current: sourceCurrent,
    queueMin: sourceQueue,
    staff: sourceStaff,
    history: pushHistory(source.history, sourceCurrent),
  };

  // Target zone after: receives the redirected crowd
  let targetBefore: ImpactMetrics | null = null;
  let targetAfter: ImpactMetrics | null = null;
  if (target) {
    const targetCurrent = Math.min(
      target.capacity,
      target.current + plan.redirectPeople
    );
    const targetPct = (targetCurrent / target.capacity) * 100;
    const targetQueue = queueFromOccupancy(targetPct);
    targetBefore = {
      occupancyPct: occupancyPct(target),
      queueMin: target.queueMin,
      staff: target.staff,
    };
    targetAfter = {
      occupancyPct: targetPct,
      queueMin: targetQueue,
      staff: target.staff,
    };
    // Push the new level three times so the growth rate reads flat, not a spike
    let history = target.history;
    for (let i = 0; i < 3; i++) history = pushHistory(history, targetCurrent);
    zones[target.id] = {
      ...target,
      current: targetCurrent,
      queueMin: targetQueue,
      history,
    };
  }

  const execution: ExecutionRecord = {
    sourceZoneId: source.id,
    targetZoneId: target ? target.id : null,
    redirectPeople: plan.redirectPeople,
    staffDeployed,
    before,
    after,
    targetBefore,
    targetAfter,
    executedAtMinutes: state.simulatedMinutes,
  };

  return {
    ...state,
    zones,
    staff: {
      ...state.staff,
      deployed: state.staff.deployed + staffDeployed,
      available: state.staff.available - staffDeployed,
    },
    status: 'running',
    execution,
  };
}