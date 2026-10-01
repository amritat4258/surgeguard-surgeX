// ── Core domain types for SurgeGuard ──────────────────────────────────

export type ZoneId =
  | 'gate-a'
  | 'gate-b'
  | 'gate-c'
  | 'main-arena'
  | 'food-court'
  | 'parking';

export type ZoneKind = 'gate' | 'arena' | 'venue' | 'parking';

export type RiskLevel = 'normal' | 'warning' | 'high' | 'critical';

export interface Zone {
  id: ZoneId;
  name: string;
  kind: ZoneKind;
  capacity: number;
  /** current crowd count (people) */
  current: number;
  /** estimated queue time in minutes */
  queueMin: number;
  /** staff currently deployed at this zone */
  staff: number;
  /** recent occupancy readings (most recent last), used for trend & prediction */
  history: number[];
  /**
   * Live mode only: epoch ms of each reading in `history` (same length, same
   * order). Sensor time, not arrival time. Undefined in simulation mode.
   */
  historyTimes?: number[];
}

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  zoneId: ZoneId;
  riskLevel: RiskLevel;
  message: string;
  status: AlertStatus;
  /** epoch ms when the alert was raised */
  raisedAt: number;
}

export type RecommendationIconKey =
  | 'redirect'
  | 'deploy-staff'
  | 'open-lane'
  | 'update-signage';

export interface Recommendation {
  id: string;
  /** short action label, e.g. "Redirect to Gate C" */
  label: string;
  /** explanation / rationale */
  detail: string;
  icon: RecommendationIconKey;
}

export interface ImpactSnapshot {
  /** zone id → occupancy % at snapshot time */
  occupancy: Record<ZoneId, number>;
  /** zone id → queue time (min) at snapshot time */
  queue: Record<ZoneId, number>;
  /** zone id → risk level at snapshot time */
  risk: Record<ZoneId, RiskLevel>;
}

export interface StaffPool {
  total: number;
  deployed: number;
  available: number;
}

export type SimStatus = 'idle' | 'running' | 'paused';

export interface ZonePrediction {
  zoneId: ZoneId;
  growthRatePerMin: number;
  remainingCapacity: number;
  timeToCapacityMin: number | null;
  riskLevel: RiskLevel;
  explanation: string;
}


// ── Live data (real-time feed) ───────────────────────────────────────

/** One measurement for one zone, as sent by the sensor gateway. */
export interface ZoneReading {
  zoneId: ZoneId;
  /** epoch ms from the SENSOR, not the arrival time in the browser */
  timestamp: number;
  /** people currently in the zone */
  count: number;
  queueMin?: number;
  staff?: number;
  sensorId?: string;
  sensorType?: string;
  confidence?: number;
}

export interface TelemetryLogItem {
  id: string;
  timestamp: number;
  zoneId: ZoneId;
  count: number;
  queueMin: number;
  staff: number;
  sensorId: string;
  sensorType: string;
  confidence: number;
}

export type FeedStatus =
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'stale' // connected, but no data for a while
  | 'offline';

/** 'sim' = built-in scripted scenario, 'live' = real-time feed. */
export type DataMode = 'sim' | 'live';

// ── Attendee Emergency SOS ──────────────────────────────────────────

export type SOSType = 'faint' | 'breathing' | 'crush' | 'injury';
export type SOSStatus = 'active' | 'dispatched' | 'resolved';

export interface SOSBeacon {
  id: string;
  timestamp: number;
  zoneId: ZoneId;
  zoneName: string;
  type: SOSType;
  label: string;
  description: string;
  callerPhone: string;
  status: SOSStatus;
  nearestMedId: string;
  nearestMedName: string;
  etaSeconds: number;
  coordinates: { x: number; y: number };
}


