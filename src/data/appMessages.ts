import type { SOSType, ZoneId } from '@/types';

// Messages exchanged between organizer and attendee phones through the gateway.
// Sensor readings are NOT part of this: those are arrays without a `kind`.

export const APP_MESSAGE_KINDS = ['sos', 'sos_status', 'broadcast'] as const;

export const SOS_TYPE_LIST: readonly SOSType[] = [
  'medical',
  'fire',
  'lost_child',
  'harassment',
  'faint',
  'breathing',
  'crush',
  'injury',
];

export const ZONE_ID_LIST: readonly ZoneId[] = [
  'gate-a',
  'gate-b',
  'gate-c',
  'main-arena',
  'food-court',
  'parking',
];

export const SOS_PROGRESS = ['received', 'assigned', 'dispatched', 'resolved'] as const;
export type SOSProgress = (typeof SOS_PROGRESS)[number];

export const BROADCAST_SEVERITIES = ['info', 'warning', 'critical'] as const;
export type BroadcastSeverity = (typeof BROADCAST_SEVERITIES)[number];

/** Phone -> organizer */
export interface SosMessage {
  kind: 'sos';
  id: string;
  type: SOSType;
  zoneId: ZoneId;
  ts: number;
  /** attendee pin on the 800 x 530 venue map (optional) */
  x?: number;
  y?: number;
}

/** Organizer -> phone */
export interface SosStatusMessage {
  kind: 'sos_status';
  id: string;
  status: SOSProgress;
  etaSeconds: number;
}

/** Organizer -> phone */
export interface BroadcastMessage {
  kind: 'broadcast';
  id: string;
  title: string;
  body: string;
  severity: BroadcastSeverity;
}

export type AppMessage = SosMessage | SosStatusMessage | BroadcastMessage;

function isString(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= max;
}

function inList<T extends string>(list: readonly T[], v: unknown): v is T {
  return typeof v === 'string' && (list as readonly string[]).includes(v);
}

function inRange(v: unknown, lo: number, hi: number): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
}

/** Returns a clean, typed message, or null if anything is off. */
export function parseAppMessage(raw: unknown): AppMessage | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const m = raw as Record<string, unknown>;

  switch (m.kind) {
    case 'sos': {
      if (!isString(m.id, 40)) return null;
      if (!inList(SOS_TYPE_LIST, m.type)) return null;
      if (!inList(ZONE_ID_LIST, m.zoneId)) return null;
      if (typeof m.ts !== 'number' || !Number.isFinite(m.ts)) return null;
      const out: SosMessage = { kind: 'sos', id: m.id, type: m.type, zoneId: m.zoneId, ts: m.ts };
      if (inRange(m.x, 0, 800) && inRange(m.y, 0, 530)) {
        out.x = m.x;
        out.y = m.y;
      }
      return out;
    }
    case 'sos_status': {
      if (!isString(m.id, 40)) return null;
      if (!inList(SOS_PROGRESS, m.status)) return null;
      if (!inRange(m.etaSeconds, 0, 3600)) return null;
      return { kind: 'sos_status', id: m.id, status: m.status, etaSeconds: Math.round(m.etaSeconds) };
    }
    case 'broadcast': {
      if (!isString(m.id, 40)) return null;
      if (!isString(m.title, 80)) return null;
      if (!isString(m.body, 280)) return null;
      if (!inList(BROADCAST_SEVERITIES, m.severity)) return null;
      return { kind: 'broadcast', id: m.id, title: m.title, body: m.body, severity: m.severity };
    }
    default:
      return null;
  }
}
