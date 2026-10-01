// Explainable prediction engine for SurgeGuard.
// Pure functions, no React. Tunable numbers live in config/scenario.ts.

import type { Zone, RiskLevel, ZonePrediction } from '@/types';
import {
  MINUTES_PER_TICK,
  PREDICTION_ESCALATION_MIN,
  LIVE_WINDOW_MS,
  LIVE_MIN_POINTS,
  occupancyToRisk,
} from '@/config/scenario';

/** Average people-per-minute change over the last `windowSize` readings. 0 if flat or declining. */
export function getGrowthRate(
  history: number[],
  minutesPerTick: number,
  windowSize = 3
): number {
  const recent = history.slice(-windowSize);
  if (recent.length < 2) return 0;
  const delta = recent[recent.length - 1] - recent[0];
  const minutes = (recent.length - 1) * minutesPerTick;
  const rate = delta / minutes;
  return rate > 0 ? rate : 0;
}

/**
 * Live mode: growth in people/min from a least-squares line over the last
 * `windowMs` of SENSOR time. Real sensors do not tick at a fixed rate, so
 * "last 3 readings x minutesPerTick" would give wrong numbers.
 * Returns null when there are fewer than `minPoints` readings in the window.
 */
export function getGrowthRateTimed(
  history: number[],
  times: number[],
  windowMs = LIVE_WINDOW_MS,
  minPoints = LIVE_MIN_POINTS
): number | null {
  const n = Math.min(history.length, times.length);
  if (n === 0) return null;
  const latest = times[n - 1];
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    if (latest - times[i] <= windowMs) {
      xs.push((times[i] - latest) / 60_000); // minutes, <= 0
      ys.push(history[i]);
    }
  }
  if (xs.length < minPoints) return null;
  const m = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / m;
  const my = ys.reduce((a, b) => a + b, 0) / m;
  let num = 0;
  let den = 0;
  for (let i = 0; i < m; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  if (den === 0) return null;
  const rate = num / den;
  return rate > 0 ? rate : 0;
}

/** Growth rate for a zone: time-based in live mode, tick-based in simulation. */
export function getZoneGrowthRate(zone: Zone): number {
  if (zone.historyTimes) {
    return getGrowthRateTimed(zone.history, zone.historyTimes) ?? 0;
  }
  return getGrowthRate(zone.history, MINUTES_PER_TICK);
}

/** True while a live zone has not collected enough readings to predict yet. */
export function isWarmingUp(zone: Zone): boolean {
  return (
    !!zone.historyTimes &&
    getGrowthRateTimed(zone.history, zone.historyTimes) === null
  );
}

/** Minutes between forecast points: 1 in live mode, MINUTES_PER_TICK in simulation. */
export function getForecastStepMin(zone: Zone): number {
  return zone.historyTimes ? 1 : MINUTES_PER_TICK;
}

/** Minutes until capacity is reached. null if the crowd is not growing. */
export function getTimeToCapacity(
  zone: Zone,
  growthRatePerMin: number
): number | null {
  if (growthRatePerMin <= 0) return null;
  const remaining = zone.capacity - zone.current;
  if (remaining <= 0) return 0;
  return remaining / growthRatePerMin;
}

const ORDER: RiskLevel[] = ['normal', 'warning', 'high', 'critical'];

/**
 * Base risk from occupancy, escalated one level when capacity is close.
 * CRITICAL also applies if ETA <= 10 min and occupancy >= 90%.
 */
export function getRiskLevel(
  occupancyPctValue: number,
  timeToCapacityMin: number | null
): RiskLevel {
  const base = occupancyToRisk(occupancyPctValue);
  if (timeToCapacityMin === null) return base;

  if (timeToCapacityMin <= 10 && occupancyPctValue >= 90) return 'critical';

  if (timeToCapacityMin < PREDICTION_ESCALATION_MIN) {
    const idx = Math.min(ORDER.indexOf(base) + 1, ORDER.length - 1);
    return ORDER[idx];
  }
  return base;
}

export function predictZone(zone: Zone): ZonePrediction {
  const growthRatePerMin = getZoneGrowthRate(zone);
  const remainingCapacity = Math.max(0, zone.capacity - zone.current);
  const timeToCapacityMin = getTimeToCapacity(zone, growthRatePerMin);
  const pct = (zone.current / zone.capacity) * 100;
  const riskLevel = getRiskLevel(pct, timeToCapacityMin);

  const explanation = isWarmingUp(zone)
    ? `Collecting live data: need ${LIVE_MIN_POINTS} readings to estimate growth`
    : timeToCapacityMin !== null
      ? `Remaining ${remainingCapacity.toLocaleString()} / growth ${growthRatePerMin.toFixed(
          1
        )} per min = ${timeToCapacityMin.toFixed(1)} min to capacity`
      : 'Crowd stable or falling: no capacity breach predicted';

  return {
    zoneId: zone.id,
    growthRatePerMin,
    remainingCapacity,
    timeToCapacityMin,
    riskLevel,
    explanation,
  };
}

/** Projected future crowd values at the current growth rate, capped at capacity. */
export function getForecastSeries(zone: Zone, horizonTicks: number): number[] {
  const growthRatePerMin = getZoneGrowthRate(zone);
  if (growthRatePerMin <= 0) return [];
  const perTick = growthRatePerMin * getForecastStepMin(zone);
  const series: number[] = [];
  let next = zone.current;
  for (let i = 1; i <= horizonTicks; i++) {
    next = Math.min(zone.capacity, next + perTick);
    series.push(Math.round(next));
  }
  return series;
}