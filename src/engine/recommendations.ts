// Recommendation engine for SurgeGuard. Pure functions, no React.
// Looks for a stressed gate and builds an action plan for it.

import type {
  Recommendation,
  RiskLevel,
  StaffPool,
  Zone,
  ZoneId,
  ZonePrediction,
} from '@/types';

// ── Tunable knobs ─────────────────────────────────────────────────────
const TARGET_OCCUPANCY_PCT = 78; // where we want the stressed gate to land
const STAFF_TO_DEPLOY = 3; // staff moved to the stressed gate
const TARGET_QUEUE_MIN = 9; // queue time we aim for after the plan
const REDIRECT_ROUND_TO = 50; // round the redirect number to this
const MIN_REDIRECT = 100; // never suggest redirecting fewer people than this
const MAX_TARGET_PCT = 70; // only redirect to a gate below this occupancy

export interface RecommendationPlan {
  sourceZoneId: ZoneId;
  targetZoneId: ZoneId | null;
  redirectPeople: number;
  staffToDeploy: number;
  recommendations: Recommendation[];
}

const RANK: Record<RiskLevel, number> = {
  normal: 0,
  warning: 1,
  high: 2,
  critical: 3,
};

function pct(zone: Zone): number {
  return (zone.current / zone.capacity) * 100;
}

export function getRecommendations(
  zones: Record<ZoneId, Zone>,
  predictions: Record<ZoneId, ZonePrediction>,
  staff: StaffPool
): RecommendationPlan | null {
  const gates = Object.values(zones).filter((z) => z.kind === 'gate');

  // The most stressed gate (HIGH or CRITICAL), worst first
  const stressed = gates
    .filter((z) => RANK[predictions[z.id].riskLevel] >= RANK.high)
    .sort(
      (a, b) =>
        RANK[predictions[b.id].riskLevel] - RANK[predictions[a.id].riskLevel] ||
        pct(b) - pct(a)
    );
  const source = stressed[0];
  if (!source) return null;

  // The calmest other gate becomes the redirect target
  const others = gates
    .filter((z) => z.id !== source.id)
    .sort((a, b) => pct(a) - pct(b));
  const best = others[0];
  const target = best && pct(best) < MAX_TARGET_PCT ? best : null;

  // How many people to move so the source lands near the target occupancy
  const excess = source.current - (source.capacity * TARGET_OCCUPANCY_PCT) / 100;
  let redirectPeople = Math.max(
    MIN_REDIRECT,
    Math.round(excess / REDIRECT_ROUND_TO) * REDIRECT_ROUND_TO
  );
  if (target) {
    redirectPeople = Math.min(
      redirectPeople,
      Math.max(0, Math.floor(target.capacity - target.current))
    );
  }

  const staffToDeploy = Math.min(STAFF_TO_DEPLOY, staff.available);

  const recommendations: Recommendation[] = [];

  if (target) {
    recommendations.push({
      id: 'rec-redirect',
      label: `Redirect ~${redirectPeople.toLocaleString()} arrivals to ${target.name}`,
      detail: `${target.name} is only at ${pct(target).toFixed(0)}%, so it has room. Sending arrivals there eases ${source.name}.`,
      icon: 'redirect',
    });
  }

  if (staffToDeploy > 0) {
    recommendations.push({
      id: 'rec-staff',
      label: `Deploy ${staffToDeploy} staff to ${source.name}`,
      detail: `Taken from the ${staff.available} on standby. ${source.name} goes from ${source.staff} to ${source.staff + staffToDeploy} staff.`,
      icon: 'deploy-staff',
    });
  }

  recommendations.push({
    id: 'rec-lane',
    label: `Open 1 extra entry lane at ${source.name}`,
    detail: `More throughput. Queue is ${source.queueMin} min now; the goal is about ${TARGET_QUEUE_MIN} min.`,
    icon: 'open-lane',
  });

  recommendations.push({
    id: 'rec-signage',
    label: target
      ? `Update signage toward ${target.name}`
      : 'Update signage with live wait times',
    detail: target
      ? `Digital signs and PA announcements guide guests to ${target.name}.`
      : 'Digital signs and PA announcements show alternate entrances.',
    icon: 'update-signage',
  });

  return {
    sourceZoneId: source.id,
    targetZoneId: target ? target.id : null,
    redirectPeople,
    staffToDeploy,
    recommendations,
  };
}