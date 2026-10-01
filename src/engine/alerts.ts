// Alert logic for SurgeGuard. Pure functions, no React.
// Rule: a zone that is HIGH or CRITICAL gets one open alert.
// When the zone drops back below HIGH, its alert becomes RESOLVED.

import type { Alert, RiskLevel, Zone, ZoneId, ZonePrediction } from '@/types';

function isAlarming(level: RiskLevel): boolean {
  return level === 'high' || level === 'critical';
}

function buildMessage(zone: Zone, prediction: ZonePrediction): string {
  const pct = Math.round((zone.current / zone.capacity) * 100);
  const eta = prediction.timeToCapacityMin;
  if (eta !== null && eta <= 30) {
    return `${zone.name} predicted to hit capacity in ~${eta.toFixed(1)} min (${pct}% full)`;
  }
  return `${zone.name} at ${pct}% occupancy`;
}

/**
 * Compares current predictions with the existing alert list and returns
 * the updated list. Returns the SAME array if nothing changed.
 */
export function syncAlerts(
  prev: Alert[],
  zones: Record<ZoneId, Zone>,
  predictions: Record<ZoneId, ZonePrediction>,
  now: number
): Alert[] {
  let changed = false;

  // 1. Update or resolve alerts that are still open
  const updated = prev.map((alert) => {
    if (alert.status === 'resolved') return alert;
    const prediction = predictions[alert.zoneId];

    if (!isAlarming(prediction.riskLevel)) {
      changed = true;
      return { ...alert, status: 'resolved' as const };
    }
    if (prediction.riskLevel !== alert.riskLevel) {
      changed = true;
      return {
        ...alert,
        riskLevel: prediction.riskLevel,
        message: buildMessage(zones[alert.zoneId], prediction),
      };
    }
    return alert;
  });

  // 2. Raise new alerts for alarming zones that have no open alert
  const created: Alert[] = [];
  for (const zone of Object.values(zones)) {
    const prediction = predictions[zone.id];
    if (!isAlarming(prediction.riskLevel)) continue;
    const hasOpen = updated.some(
      (a) => a.zoneId === zone.id && a.status !== 'resolved'
    );
    if (hasOpen) continue;
    changed = true;
    created.push({
      id: `alert-${zone.id}-${now}`,
      zoneId: zone.id,
      riskLevel: prediction.riskLevel,
      message: buildMessage(zone, prediction),
      status: 'active',
      raisedAt: now,
    });
  }

  if (!changed) return prev;
  return [...created, ...updated]; // newest first
}