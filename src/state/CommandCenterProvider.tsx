import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useReducer,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Alert,
  ZoneId,
  Zone,
  StaffPool,
  SimStatus,
  ZonePrediction,
  ZoneReading,
  FeedStatus,
  DataMode,
  TelemetryLogItem,
  SOSBeacon,
  SOSType,
  CCTVVisionData,
  VisionTrackedPerson,
} from '@/types';
import { predictZone } from '@/engine/prediction';
import {
  createInitialState,
  advanceTick,
  executePlan,
  type SimState,
  type ExecutionRecord,
} from '@/engine/simulation';
import { syncAlerts } from '@/engine/alerts';
import {
  getRecommendations,
  type RecommendationPlan,
} from '@/engine/recommendations';
import { applyReadings, executePlanLive } from '@/engine/live';
import { useLiveFeed } from '@/data/useLiveFeed';
import { TICK_INTERVAL_MS, INITIAL_STAFF, ZONE_NAMES } from '@/config/scenario';
import { playEmergencyAlertSound } from '@/lib/audioAlert';
import {
  parseAppMessage,
  type BroadcastSeverity,
  type SOSProgress,
} from '@/data/appMessages';
import { nearestOfKind } from '@/lib/attendeeRanking';
import type { Role } from '@/lib/role';

// Default live URL if mode is live
const DEFAULT_FEED_URL = (import.meta.env.VITE_FEED_URL as string | undefined) || 'ws://localhost:8080';

type Action =
  | { type: 'RUN_SURGE' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET'; keepZones?: boolean }
  | { type: 'TICK' }
  | { type: 'EXECUTE_PLAN'; plan: RecommendationPlan }
  | { type: 'EXECUTE_PLAN_LIVE'; plan: RecommendationPlan }
  | { type: 'LIVE_READINGS'; readings: ZoneReading[] };

function reducer(state: SimState, action: Action): SimState {
  switch (action.type) {
    case 'RUN_SURGE':
      if (state.status === 'running') return state;
      if (state.status === 'paused' && state.tick > 0) {
        return { ...state, status: 'running' };
      }
      return { ...createInitialState(), status: 'running' };

    case 'PAUSE':
      if (state.status !== 'running') return state;
      return { ...state, status: 'paused' };

    case 'RESUME':
      if (state.status !== 'paused') return state;
      return { ...state, status: 'running' };

    case 'RESET':
      if (action.keepZones) {
        return { ...state, execution: null, staff: { ...INITIAL_STAFF } };
      }
      return createInitialState();

    case 'TICK':
      if (state.status !== 'running') return state;
      return advanceTick(state);

    case 'EXECUTE_PLAN':
      return executePlan(state, action.plan);

    case 'EXECUTE_PLAN_LIVE':
      return executePlanLive(state, action.plan);

    case 'LIVE_READINGS':
      return applyReadings(state, action.readings);

    default:
      return state;
  }
}

// ---- SOS data (responders defined once) -----------------------------

type Responder = NonNullable<SOSBeacon['responder']>;

const EMT: Responder = {
  id: 'RESP-MED-01',
  name: 'EMT Dr. Priya Sharma & Team Alpha-4',
  role: 'Emergency Medical Technician',
  unit: 'First Aid Tent Bravo (Sector 2)',
  phone: '+91 98201 44921',
  avatar: '\u{1F691}',
  location: 'Tent Bravo (28m away)',
  etaSeconds: 28,
};

const FIRE_TEAM: Responder = {
  id: 'RESP-FIRE-02',
  name: 'Lead Inspector Vikram Patil',
  role: 'Rapid Fire Suppression Team F-2',
  unit: 'East Hydrant & CO2 Extinguisher Post',
  phone: '+91 98202 88123',
  avatar: '\u{1F692}',
  location: 'East Perimeter Hydrant (38m away)',
  etaSeconds: 35,
};

const CHILD_PATROL: Responder = {
  id: 'RESP-SEC-03',
  name: 'Officer Sunita Rane',
  role: 'Child Safety & Reunification Patrol S-1',
  unit: 'Central Guest Relations Hub',
  phone: '+91 98203 11984',
  avatar: '\u{1F46E}\u200D\u2640\uFE0F',
  location: 'Central Safety Desk (30m away)',
  etaSeconds: 22,
};

const MARSHAL_SQUAD: Responder = {
  id: 'RESP-MARSHAL-04',
  name: 'Marshall Arjun Desai & Squad M-3',
  role: 'Tactical Venue Safety & Marshall',
  unit: 'Plainclothes Rapid Intervention Squad',
  phone: '+91 98204 77332',
  avatar: '\u{1F6E1}\uFE0F',
  location: 'Arena Sector B Rim (18m away)',
  etaSeconds: 20,
};

const SOS_INFO: Record<SOSType, { label: string; desc: string; responder: Responder }> = {
  medical: {
    label: 'Medical Emergency / Unconscious',
    desc: 'Attendee collapsed due to acute heat, dehydration, and high crowd pressure.',
    responder: EMT,
  },
  fire: {
    label: 'Pyrotechnic Fire / Smoke Flash',
    desc: 'Stage pyrotechnics flare ignited near East corridor truss. Smoke hazard detected.',
    responder: FIRE_TEAM,
  },
  lost_child: {
    label: 'Lost Child / Family Separation',
    desc: '7-year-old child separated from guardian at crowded concourse. Wearing blue cap, white shirt.',
    responder: CHILD_PATROL,
  },
  harassment: {
    label: 'Harassment / Safety Disturbance',
    desc: 'Bystander reported persistent harassment and physical aggression in dense crowd queue.',
    responder: MARSHAL_SQUAD,
  },
  faint: {
    label: 'Attendee Fainted / Unconscious',
    desc: 'Severe heat exhaustion, non-responsive, acute dehydration.',
    responder: EMT,
  },
  breathing: {
    label: 'Acute Breathing Difficulty',
    desc: 'Asthma/hyperventilation in high density crowd sector.',
    responder: EMT,
  },
  crush: {
    label: 'Crowd Crush Hazard / Trapped',
    desc: 'Barricade crush distress signal received.',
    responder: EMT,
  },
  injury: {
    label: 'Severe Physical Trauma',
    desc: 'Laceration / fall injury requiring stretcher.',
    responder: EMT,
  },
};

function buildBeacon(
  type: SOSType,
  zoneId: ZoneId,
  opts: { id?: string; point?: { x: number; y: number } } = {}
): SOSBeacon {
  const info = SOS_INFO[type] ?? SOS_INFO.medical;
  const point = opts.point ?? (zoneId === 'gate-b' ? { x: 630, y: 145 } : { x: 380, y: 240 });
  const med = opts.point ? nearestOfKind('medical', opts.point) : null;

  return {
    id: opts.id ?? `SOS-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: Date.now(),
    zoneId,
    zoneName: ZONE_NAMES[zoneId],
    type,
    label: info.label,
    description: info.desc,
    callerPhone: `+91 9820${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'received',
    nearestMedId: med?.facility.id ?? 'm2',
    nearestMedName: med?.facility.name ?? 'First Aid Tent Bravo (Gate B/C Sector)',
    etaSeconds: info.responder.etaSeconds,
    coordinates: point,
    responder: info.responder,
    crowdRoute: {
      avoidZoneId: 'gate-b',
      avoidZoneName: 'Gate B Concourse Chokepoint',
      densityAvoided: 4.4,
      detourName: 'North-West Auxiliary Service Alley',
      timeSavedMinutes: 3.5,
      waypoints: [
        { x: 515, y: 110 },
        { x: 570, y: 90 },
        { x: 630, y: 145 },
      ],
    },
    nearbyVolunteersNotified: 6,
    calmMessageSent: false,
  };
}

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    /* not supported */
  }
}

// ---- Types shared with the attendee app and organizer panel ---------

export interface MySOS {
  id: string;
  type: SOSType;
  zoneId: ZoneId;
  /** 'sending' = sent from this phone, control room has not confirmed yet */
  status: 'sending' | SOSProgress;
  etaSeconds: number;
  sentAt: number;
}

export interface InboxItem {
  id: string;
  title: string;
  body: string;
  severity: BroadcastSeverity;
  receivedAt: number;
  seen: boolean;
}

export interface PushLogItem {
  title: string;
  body: string;
  severity: BroadcastSeverity;
  at: number;
}

interface CommandCenterContextValue {
  role: Role;
  zones: Record<ZoneId, Zone>;
  zoneList: Zone[];
  staff: StaffPool;
  status: SimStatus;
  tick: number;
  simulatedMinutes: number;
  predictions: Record<ZoneId, ZonePrediction>;
  alerts: Alert[];
  plan: RecommendationPlan | null;
  execution: ExecutionRecord | null;
  mode: DataMode;
  setMode: (mode: DataMode) => void;
  feedStatus: FeedStatus;
  hasData: boolean;
  canExecute: boolean;
  telemetryLogs: TelemetryLogItem[];
  clearTelemetry: () => void;
  acknowledgeAlert: (id: string) => void;
  executeResponsePlan: () => void;
  runSurgeScenario: () => void;
  triggerSurge: () => void;
  triggerChaos: (type: 'turnstile_fail' | 'weather_rush') => void;
  setSimSpeed: (multiplier: number) => void;
  activeSOS: SOSBeacon | null;
  isSOSModalOpen: boolean;
  setIsSOSModalOpen: (open: boolean) => void;
  isPoliceModalOpen: boolean;
  setIsPoliceModalOpen: (open: boolean) => void;
  isBroadcastModalOpen: boolean;
  setIsBroadcastModalOpen: (open: boolean) => void;
  isAttendeeModalOpen: boolean;
  setIsAttendeeModalOpen: (open: boolean) => void;
  // CCTV Intelligence & Map Tracking
  cctvVisionData: CCTVVisionData;
  updateCCTVVisionData: (data: Partial<CCTVVisionData>) => void;
  isCCTVModalOpen: boolean;
  setIsCCTVModalOpen: (open: boolean) => void;
  openCCTV: (zoneId?: ZoneId) => void;
  cctvActiveZoneId: ZoneId;
  triggerSOS: (type: SOSType, zoneId?: ZoneId) => void;
  assignResponder: () => void;
  dispatchParamedics: () => void;
  sendCalmBroadcast: () => void;
  resolveSOS: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  // organizer -> phones
  pushBroadcast: (title: string, body: string, severity?: BroadcastSeverity) => boolean;
  pushLog: PushLogItem[];
  phoneSOSCount: number;
  // attendee phone
  mySOS: MySOS | null;
  sendMySOS: (type: SOSType, zoneId: ZoneId, point?: { x: number; y: number }) => boolean;
  clearMySOS: () => void;
  inbox: InboxItem[];
  markInboxSeen: () => void;
}

const CommandCenterContext = createContext<CommandCenterContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  /** 'organizer' (default) or 'attendee' phone */
  role?: Role;
  /** Attendee phones always run on the live feed. */
  forceLive?: boolean;
}

export function CommandCenterProvider({
  children,
  role = 'organizer',
  forceLive = false,
}: ProviderProps) {
  const [mode, setMode] = useState<DataMode>(
    forceLive || import.meta.env.VITE_FEED_URL ? 'live' : 'sim'
  );
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLogItem[]>([]);

  const [activeSOS, setActiveSOS] = useState<SOSBeacon | null>(null);
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [isPoliceModalOpen, setIsPoliceModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);

  // CCTV Intelligence & Map Tracking State
  const [isCCTVModalOpen, setIsCCTVModalOpen] = useState(false);
  const [cctvActiveZoneId, setCctvActiveZoneId] = useState<ZoneId>('gate-b');
  const [cctvVisionData, setCctvVisionData] = useState<CCTVVisionData>({
    isActive: true,
    zoneId: 'gate-b',
    cameraName: 'CAM-GB-02 (Gate B Main Influx)',
    sourceType: 'demo_video',
    people: [],
    count: 42,
    densityPerM2: 2.8,
    inflowRatePerSec: 2.4,
    surgeProbability: 78,
    turnstileQueues: [
      { id: 'T-1', name: 'Turnstile A1', count: 14, status: 'optimal' },
      { id: 'T-2', name: 'Turnstile A2', count: 18, status: 'moderate' },
      { id: 'T-3', name: 'Turnstile B1 (Main)', count: 32, status: 'congested' },
      { id: 'T-4', name: 'Turnstile B2 (FastTrack)', count: 9, status: 'optimal' },
    ],
    aiObservations: [
      'Vision AI: Rapid ingress detected (+38%) at Turnstile B1.',
      'Density index in Quad-2 approaching Fruin LOS E threshold (3.1 p/m²).',
      'Prescriptive Action: Flip signage to divert excess arrivals to Gate C.',
    ],
  });

  const updateCCTVVisionData = useCallback((data: Partial<CCTVVisionData>) => {
    setCctvVisionData((prev) => ({ ...prev, ...data }));
  }, []);

  const openCCTV = useCallback((zoneId: ZoneId = 'gate-b') => {
    setCctvActiveZoneId(zoneId);
    setIsCCTVModalOpen(true);
  }, []);

  const [mySOS, setMySOS] = useState<MySOS | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [pushLog, setPushLog] = useState<PushLogItem[]>([]);
  const [phoneSOSCount, setPhoneSOSCount] = useState(0);
  const seenSosRef = useRef<Set<string>>(new Set());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCriticalZonesRef = useRef<Set<string>>(new Set());

  // WebSocket connects only when in 'live' mode
  const activeFeedUrl = mode === 'live' ? DEFAULT_FEED_URL : undefined;

  const handleReadings = useCallback((readings: ZoneReading[]) => {
    dispatch({ type: 'LIVE_READINGS', readings });

    // Append to live telemetry log
    const now = Date.now();
    const newItems: TelemetryLogItem[] = readings.map((r, i) => ({
      id: `${now}-${r.zoneId}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: r.timestamp || now,
      zoneId: r.zoneId,
      count: r.count,
      queueMin: r.queueMin ?? 0,
      staff: r.staff ?? 0,
      sensorId: r.sensorId || `SENSOR-${r.zoneId.toUpperCase()}`,
      sensorType: r.sensorType || 'optical_rfid',
      confidence: r.confidence ?? 0.98,
    }));

    setTelemetryLogs((prev) => [...newItems, ...prev].slice(0, 40));
  }, []);

  // Messages between organizer and phones (validated before use)
  const handleAppMessage = useCallback(
    (raw: Record<string, unknown>) => {
      const msg = parseAppMessage(raw);
      if (!msg) return;

      if (role === 'attendee') {
        if (msg.kind === 'sos_status') {
          const { id, status, etaSeconds } = msg;
          setMySOS((prev) =>
            prev && prev.id === id ? { ...prev, status, etaSeconds } : prev
          );
          vibrate([200, 100, 200]);
        } else if (msg.kind === 'broadcast') {
          const item: InboxItem = {
            id: msg.id,
            title: msg.title,
            body: msg.body,
            severity: msg.severity,
            receivedAt: Date.now(),
            seen: false,
          };
          setInbox((prev) =>
            prev.some((b) => b.id === item.id) ? prev : [item, ...prev].slice(0, 20)
          );
          vibrate(msg.severity === 'critical' ? [400, 150, 400, 150, 400] : [250, 100, 250]);
        }
        return;
      }

      // organizer
      if (msg.kind === 'sos') {
        if (seenSosRef.current.has(msg.id)) return;
        seenSosRef.current.add(msg.id);
        const point =
          msg.x !== undefined && msg.y !== undefined ? { x: msg.x, y: msg.y } : undefined;
        setActiveSOS(buildBeacon(msg.type, msg.zoneId, { id: msg.id, point }));
        setIsSOSModalOpen(true);
        setPhoneSOSCount((c) => c + 1);
        playEmergencyAlertSound();
      }
    },
    [role]
  );

  const { status: liveStatus, send: feedSend } = useLiveFeed(
    activeFeedUrl,
    handleReadings,
    handleAppMessage
  );
  const feedStatus: FeedStatus = mode === 'live' ? liveStatus : 'offline';

  // Sim mode tick driver
  useEffect(() => {
    if (mode === 'sim' && state.status === 'running') {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, TICK_INTERVAL_MS);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [mode, state.status]);

  // If in sim mode, log simulated readings for telemetry visibility
  useEffect(() => {
    if (mode === 'sim' && state.status === 'running') {
      const now = Date.now();
      const simItems: TelemetryLogItem[] = Object.values(state.zones).map((z) => ({
        id: `${now}-${z.id}`,
        timestamp: now,
        zoneId: z.id,
        count: z.current,
        queueMin: z.queueMin,
        staff: z.staff,
        sensorId: `SIM-CAM-${z.id.toUpperCase()}`,
        sensorType: 'simulated_feed',
        confidence: 0.99,
      }));
      setTelemetryLogs((prev) => [...simItems, ...prev].slice(0, 40));
    }
  }, [mode, state.tick, state.status, state.zones]);

  const predictions = useMemo(() => {
    const result = {} as Record<ZoneId, ZonePrediction>;
    for (const zone of Object.values(state.zones)) {
      result[zone.id] = predictZone(zone);
    }
    return result;
  }, [state.zones]);

  // Alert synchronization & sound chime trigger on critical risk (organizer only)
  useEffect(() => {
    setAlerts((prev) => {
      const next = syncAlerts(prev, state.zones, predictions, Date.now());
      const currentCritical = new Set<string>();

      for (const a of next) {
        if (a.status === 'active' && a.riskLevel === 'critical') {
          currentCritical.add(a.zoneId);
        }
      }

      let hasNewCritical = false;
      for (const zoneId of currentCritical) {
        if (!prevCriticalZonesRef.current.has(zoneId)) {
          hasNewCritical = true;
          break;
        }
      }

      if (hasNewCritical && role !== 'attendee') {
        playEmergencyAlertSound();
      }

      prevCriticalZonesRef.current = currentCritical;
      return next;
    });
  }, [state.zones, predictions, role]);

  const plan = useMemo(
    () =>
      mode === 'live' && state.execution
        ? null
        : getRecommendations(state.zones, predictions, state.staff),
    [mode, state.zones, predictions, state.staff, state.execution]
  );

  const hasData = mode === 'sim' || state.tick > 0;
  const canExecute =
    !!plan && !state.execution && (mode === 'sim' || feedStatus === 'live');

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id && a.status === 'active'
          ? { ...a, status: 'acknowledged' as const }
          : a
      )
    );
  }, []);

  // ---- Organizer -> phones -----------------------------------------

  const pushBroadcast = useCallback(
    (title: string, body: string, severity: BroadcastSeverity = 'info'): boolean => {
      const t = title.slice(0, 80);
      const b = body.slice(0, 280);
      if (!t || !b) return false;
      const ok = feedSend({
        kind: 'broadcast',
        id: `BC-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`,
        title: t,
        body: b,
        severity,
      });
      if (ok) {
        setPushLog((prev) => [{ title: t, body: b, severity, at: Date.now() }, ...prev].slice(0, 5));
      }
      return ok;
    },
    [feedSend]
  );

  // Auto-push to phones when a zone newly goes critical
  const zonesRef = useRef(state.zones);
  zonesRef.current = state.zones;
  const pushedCriticalRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (role === 'attendee' || mode !== 'live') return;
    const current = new Set<string>();
    for (const a of alerts) {
      if (a.riskLevel === 'critical' && a.status !== 'resolved') current.add(a.zoneId);
    }
    const sent = new Set<string>();
    for (const id of current) {
      if (pushedCriticalRef.current.has(id)) {
        sent.add(id);
        continue;
      }
      const zones = zonesRef.current;
      const name = ZONE_NAMES[id as ZoneId] ?? id;
      let body = 'Please avoid the area and follow staff directions.';
      if (zones[id as ZoneId]?.kind === 'gate') {
        const alt = Object.values(zones)
          .filter((z) => z.kind === 'gate' && z.id !== id)
          .sort((a, b) => a.current / a.capacity - b.current / b.capacity)[0];
        if (alt) {
          body = `Please use ${alt.name} instead (about ${alt.queueMin} min wait). Staff are guiding you.`;
        }
      }
      if (pushBroadcast(`${name} is very crowded`, body, 'critical')) sent.add(id);
    }
    pushedCriticalRef.current = sent;
  }, [alerts, role, mode, pushBroadcast]);

  const executeResponsePlan = useCallback(() => {
    if (!plan || state.execution) return;
    if (mode === 'sim') {
      dispatch({ type: 'EXECUTE_PLAN', plan });
      return;
    }
    if (feedStatus !== 'live') return;
    const sent = feedSend({
      cmd: 'execute',
      sourceZoneId: plan.sourceZoneId,
      targetZoneId: plan.targetZoneId,
      redirectPeople: plan.redirectPeople,
      staffToDeploy: plan.staffToDeploy,
    });
    if (sent) {
      dispatch({ type: 'EXECUTE_PLAN_LIVE', plan });
      const from = ZONE_NAMES[plan.sourceZoneId];
      const to = plan.targetZoneId ? ZONE_NAMES[plan.targetZoneId] : null;
      if (to) {
        pushBroadcast(
          `Use ${to} instead of ${from}`,
          `The control room is redirecting crowds from ${from} to ${to}. Staff are guiding you.`,
          'warning'
        );
      } else {
        pushBroadcast(
          `${from}: follow staff directions`,
          'The control room has deployed extra staff. Please follow their instructions.',
          'warning'
        );
      }
    }
  }, [plan, state.execution, mode, feedStatus, feedSend, pushBroadcast]);

  const triggerSurge = useCallback(() => {
    if (mode === 'live') {
      feedSend({ cmd: 'surge' });
    } else {
      if (state.status === 'idle') setAlerts([]);
      dispatch({ type: 'RUN_SURGE' });
    }
  }, [mode, feedSend, state.status]);

  const triggerChaos = useCallback((type: 'turnstile_fail' | 'weather_rush') => {
    if (mode === 'live') {
      feedSend({ cmd: 'chaos', type });
    }
  }, [mode, feedSend]);

  const setSimSpeed = useCallback((multiplier: number) => {
    if (mode === 'live') {
      feedSend({ cmd: 'speed', multiplier });
    }
  }, [mode, feedSend]);

  // ---- SOS (organizer side) ------------------------------------------

  // Paramedic countdown timer when dispatched
  const activeSOSStatus = activeSOS?.status;
  useEffect(() => {
    if (activeSOSStatus !== 'dispatched') return;
    const interval = setInterval(() => {
      setActiveSOS((prev) => {
        if (!prev || prev.status !== 'dispatched') return prev;
        if (prev.etaSeconds <= 1) {
          return { ...prev, etaSeconds: 0, status: 'resolved' };
        }
        return { ...prev, etaSeconds: prev.etaSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSOSStatus]);

  // Tell the phone whenever the incident moves to a new stage
  const sosRef = useRef(activeSOS);
  sosRef.current = activeSOS;
  const activeSOSId = activeSOS?.id;
  useEffect(() => {
    if (role === 'attendee') return;
    const b = sosRef.current;
    if (!b) return;
    const status: SOSProgress = b.status === 'active' ? 'received' : b.status;
    feedSend({ kind: 'sos_status', id: b.id, status, etaSeconds: b.etaSeconds });
  }, [role, activeSOSId, activeSOSStatus, feedSend]);

  const triggerSOS = useCallback((type: SOSType, targetZoneId: ZoneId = 'gate-b') => {
    setActiveSOS(buildBeacon(type, targetZoneId));
    setIsSOSModalOpen(true);
    playEmergencyAlertSound();
  }, []);

  const assignResponder = useCallback(() => {
    setActiveSOS((prev) => (prev ? { ...prev, status: 'assigned' } : null));
  }, []);

  const dispatchParamedics = useCallback(() => {
    setActiveSOS((prev) => (prev ? { ...prev, status: 'dispatched', etaSeconds: 28 } : null));
  }, []);

  const sendCalmBroadcast = useCallback(() => {
    setActiveSOS((prev) => (prev ? { ...prev, calmMessageSent: true } : null));
    pushBroadcast(
      'Please keep the aisle clear',
      'Emergency responders are on the way. Keep the centre aisle clear. Everything else is running normally.',
      'info'
    );
  }, [pushBroadcast]);

  const resolveSOS = useCallback(() => {
    const b = sosRef.current;
    if (b && b.status !== 'resolved') {
      feedSend({ kind: 'sos_status', id: b.id, status: 'resolved', etaSeconds: 0 });
    }
    setActiveSOS(null);
  }, [feedSend]);

  // ---- SOS (attendee phone side) ---------------------------------------

  const sendMySOS = useCallback(
    (type: SOSType, zoneId: ZoneId, point?: { x: number; y: number }): boolean => {
      const id = `SOS-${Date.now().toString(36).slice(-4).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
      const ok = feedSend({
        kind: 'sos',
        id,
        type,
        zoneId,
        ts: Date.now(),
        ...(point ? { x: Math.round(point.x), y: Math.round(point.y) } : {}),
      });
      if (!ok) return false;
      setMySOS({ id, type, zoneId, status: 'sending', etaSeconds: 0, sentAt: Date.now() });
      return true;
    },
    [feedSend]
  );

  const clearMySOS = useCallback(() => setMySOS(null), []);

  const markInboxSeen = useCallback(() => {
    setInbox((prev) => prev.map((i) => ({ ...i, seen: true })));
  }, []);

  // ETA countdown on the phone while the unit is on the way
  const mySOSStatus = mySOS?.status;
  useEffect(() => {
    if (mySOSStatus !== 'dispatched') return;
    const t = setInterval(() => {
      setMySOS((prev) =>
        prev && prev.status === 'dispatched'
          ? { ...prev, etaSeconds: Math.max(0, prev.etaSeconds - 1) }
          : prev
      );
    }, 1000);
    return () => clearInterval(t);
  }, [mySOSStatus]);

  const value: CommandCenterContextValue = {
    role,
    zones: state.zones,
    zoneList: Object.values(state.zones),
    staff: state.staff,
    status: state.status,
    tick: state.tick,
    simulatedMinutes: state.simulatedMinutes,
    predictions,
    alerts,
    plan,
    execution: state.execution,
    mode,
    setMode,
    feedStatus,
    hasData,
    canExecute,
    telemetryLogs,
    clearTelemetry: () => setTelemetryLogs([]),
    acknowledgeAlert,
    executeResponsePlan,
    runSurgeScenario: triggerSurge,
    triggerSurge,
    triggerChaos,
    setSimSpeed,
    activeSOS,
    isSOSModalOpen,
    setIsSOSModalOpen,
    isPoliceModalOpen,
    setIsPoliceModalOpen,
    isBroadcastModalOpen,
    setIsBroadcastModalOpen,
    isAttendeeModalOpen,
    setIsAttendeeModalOpen,
    cctvVisionData,
    updateCCTVVisionData,
    isCCTVModalOpen,
    setIsCCTVModalOpen,
    openCCTV,
    cctvActiveZoneId,
    triggerSOS,
    assignResponder,
    dispatchParamedics,
    sendCalmBroadcast,
    resolveSOS,
    pause: () => dispatch({ type: 'PAUSE' }),
    resume: () => dispatch({ type: 'RESUME' }),
    reset: () => {
      setAlerts([]);
      setActiveSOS(null);
      if (mode === 'live') {
        feedSend({ cmd: 'reset' });
      }
      dispatch({ type: 'RESET', keepZones: mode === 'live' });
    },
    pushBroadcast,
    pushLog,
    phoneSOSCount,
    mySOS,
    sendMySOS,
    clearMySOS,
    inbox,
    markInboxSeen,
  };

  return (
    <CommandCenterContext.Provider value={value}>
      {children}
    </CommandCenterContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCommandCenter(): CommandCenterContextValue {
  const ctx = useContext(CommandCenterContext);
  if (!ctx) {
    throw new Error('useCommandCenter must be used within CommandCenterProvider');
  }
  return ctx;
}
