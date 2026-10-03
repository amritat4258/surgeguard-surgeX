import type { SOSSeverity, SOSType, ZoneId } from '@/types';

// Messages exchanged between organizer and attendee phones through the gateway.
// Sensor readings are NOT part of this: those are arrays without a `kind`.

export const APP_MESSAGE_KINDS = ['sos', 'sos_status', 'broadcast'] as const;

export const SOS_TYPE_LIST: readonly SOSType[] = [
  'medical',
  'fire',
  'crush',
  'security',
  'lost_child',
  'other',
  'harassment',
  'faint',
  'breathing',
  'injury',
];

export const SOS_SEVERITY_LIST: readonly SOSSeverity[] = [
  'critical',
  'urgent',
  'assistance',
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
  severity?: SOSSeverity;
  zoneId: ZoneId;
  ts: number;
  /** attendee pin on the 800 x 530 venue map (optional) */
  x?: number;
  y?: number;
  note?: string;
  peopleCount?: number;
  deviceId?: string;
}

/** Organizer -> phone */
export interface SosStatusMessage {
  kind: 'sos_status';
  id: string;
  status: SOSProgress;
  etaSeconds: number;
  message?: string;
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
      if (inList(SOS_SEVERITY_LIST, m.severity)) {
        out.severity = m.severity;
      }
      if (isString(m.note, 140)) {
        out.note = m.note;
      }
      if (inRange(m.peopleCount, 1, 100)) {
        out.peopleCount = Math.round(m.peopleCount);
      }
      if (isString(m.deviceId, 60)) {
        out.deviceId = m.deviceId;
      }
      return out;
    }
    case 'sos_status': {
      if (!isString(m.id, 40)) return null;
      if (!inList(SOS_PROGRESS, m.status)) return null;
      if (!inRange(m.etaSeconds, 0, 3600)) return null;
      const out: SosStatusMessage = {
        kind: 'sos_status',
        id: m.id,
        status: m.status,
        etaSeconds: Math.round(m.etaSeconds),
      };
      if (isString(m.message, 280)) {
        out.message = m.message;
      }
      return out;
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
