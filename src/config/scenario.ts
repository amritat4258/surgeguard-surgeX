// ── Tunable scenario configuration ───────────────────────────────────
// Every number in this file is a tunable knob. Adjust here to change
// the simulation without touching engine or UI code.

import type { Zone, ZoneId, RiskLevel } from '@/types';

// ── Timing ───────────────────────────────────────────────────────────
/** Milliseconds between simulation ticks (tunable). */
export const TICK_INTERVAL_MS = 1500;
/** Simulated minutes elapsed per tick (tunable). */
export const MINUTES_PER_TICK = 5;

// ── Risk thresholds (occupancy %) ────────────────────────────────────
// NORMAL < WARNING_MIN ≤ WARNING < HIGH_MIN ≤ HIGH < CRITICAL_MIN ≤ CRITICAL
/** Below this = normal (tunable). */
export const RISK_THRESHOLDS = {
  warningMin: 70, // ≥ 70 → warning
  highMin: 85, // ≥ 85 → high
  criticalMin: 95, // ≥ 95 → critical
} as const;

/**
 * If time-to-capacity (minutes) is at or below this value, risk is
 * escalated one level above what occupancy alone would dictate (tunable).
 */
export const PREDICTION_ESCALATION_MIN = 10;

// ── Staff pool (tunable) ──────────────────────────────────────────────
export const INITIAL_STAFF = {
  total: 120,
  deployed: 84,
  available: 36,
};

// ── Initial zone values (tunable) ─────────────────────────────────────
// capacity, current, queueMin, staff, history (seeded with 3 readings)
export const INITIAL_ZONES: Zone[] = [
  {
    id: 'gate-a',
    name: 'Gate A',
    kind: 'gate',
    capacity: 5000,
    current: 2900, // 58%
    queueMin: 6,
    staff: 6,
    history: [2700, 2800, 2900],
  },
  {
    id: 'gate-b',
    name: 'Gate B',
    kind: 'gate',
    capacity: 5000,
    current: 3600, // 72% — start of hero trajectory
    queueMin: 12,
    staff: 8,
    history: [3300, 3450, 3600],
  },
  {
    id: 'gate-c',
    name: 'Gate C',
    kind: 'gate',
    capacity: 5000,
    current: 2100, // 42%
    queueMin: 3,
    staff: 5,
    history: [1900, 2000, 2100],
  },
  {
    id: 'main-arena',
    name: 'Main Arena',
    kind: 'arena',
    capacity: 30000,
    current: 19200, // 64%
    queueMin: 0,
    staff: 40,
    history: [18000, 18600, 19200],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    kind: 'venue',
    capacity: 4000,
    current: 2200, // 55%
    queueMin: 4,
    staff: 10,
    history: [2000, 2100, 2200],
  },
  {
    id: 'parking',
    name: 'Parking',
    kind: 'parking',
    capacity: 12000,
    current: 8400, // 70%
    queueMin: 8,
    staff: 15,
    history: [7800, 8100, 8400],
  },
];

// ── Hero scenario: scripted Gate B occupancy trajectory (tunable) ────
// Each tick the engine reads the next value from this array for Gate B's
// current crowd, overriding the normal growth model.
// 72% → 76% → 81% → 86% → 91% → 96%  (capacity 5000)
export const GATE_B_TRAJECTORY: number[] = [
  3600, // 72%
  3800, // 76%
  4000, // 80%
  4200, // 84%
  4400, // 88%
  4560, // 91.2%
  4680, // 93.6%
  4800, // 96%
];

// ── Post-execute recovery values for Gate B (tunable) ─────────────────
export const GATE_B_POST_EXECUTE = {
  current: 3900, // ~78%
  queueMin: 9,
  staff: 11, // 8 + 3 deployed
};

// ── History configuration (tunable) ───────────────────────────────────
/** Number of past readings to seed each zone with at init (tunable). */
export const HISTORY_SEED_LENGTH = 8;
/** Maximum history entries retained per zone (tunable). */
export const HISTORY_MAX_LENGTH = 30;

// ── Queue time formula (tunable) ──────────────────────────────────────
// queue = QUEUE_BASE_MIN * (occupancyPct / 100) ^ QUEUE_EXPONENT
// At 96% occupancy: 2 * 0.96^7 ≈ 1.43  →  needs scaling so Gate B reaches ~18 min.
// Calibrated: QUEUE_BASE_MIN=24, QUEUE_EXPONENT=7  →  24 * 0.96^7 ≈ 18.0 min at 96%.  ✓
/** Base multiplier for the queue-time formula (tunable). */
export const QUEUE_BASE_MIN = 24;
/** Exponent controlling how sharply queue time rises with occupancy (tunable). */
export const QUEUE_EXPONENT = 7;

// ── Live data feed (tunable) ──────────────────────────────────────────
// Only used when VITE_FEED_URL is set (see README, "Live mode").
/** Mark the feed STALE if nothing arrives for this long (ms). */
export const LIVE_STALE_AFTER_MS = 10_000;
/** Growth rate is fitted over this much SENSOR time (ms). Longer = smoother but slower to react. */
export const LIVE_WINDOW_MS = 5 * 60_000;
/** Minimum readings inside the window before we trust a growth rate. */
export const LIVE_MIN_POINTS = 3;
/** Max readings kept per zone in live mode. */
export const LIVE_HISTORY_MAX_LENGTH = 400;
/** Trend chart: minutes of past data shown, and minutes of forecast. */
export const LIVE_CHART_PAST_MIN = 15;
export const LIVE_CHART_FORECAST_MIN = 15;

// ── Map occupancy % → risk level (pure helper, exported for engine) ──
export function occupancyToRisk(pct: number): RiskLevel {
  if (pct >= RISK_THRESHOLDS.criticalMin) return 'critical';
  if (pct >= RISK_THRESHOLDS.highMin) return 'high';
  if (pct >= RISK_THRESHOLDS.warningMin) return 'warning';
  return 'normal';
}

// ── Zone ID → display name lookup (tunable) ───────────────────────────
export const ZONE_NAMES: Record<ZoneId, string> = {
  'gate-a': 'Gate A',
  'gate-b': 'Gate B',
  'gate-c': 'Gate C',
  'main-arena': 'Main Arena',
  'food-court': 'Food Court',
  parking: 'Parking',
};
