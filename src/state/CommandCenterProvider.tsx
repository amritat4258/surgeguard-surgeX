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
import { TICK_INTERVAL_MS, INITIAL_STAFF } from '@/config/scenario';
import { playEmergencyAlertSound } from '@/lib/audioAlert';

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

interface CommandCenterContextValue {
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
  triggerSOS: (type: SOSType, zoneId?: ZoneId) => void;
  assignResponder: () => void;
  dispatchParamedics: () => void;
  sendCalmBroadcast: () => void;
  resolveSOS: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

const CommandCenterContext = createContext<CommandCenterContextValue | null>(null);

export function CommandCenterProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DataMode>(
    import.meta.env.VITE_FEED_URL ? 'live' : 'sim'
  );
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLogItem[]>([]);

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

  const { status: liveStatus, send: feedSend } = useLiveFeed(activeFeedUrl, handleReadings);
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

  // Alert synchronization & sound chime trigger on critical risk
  useEffect(() => {
    setAlerts((prev) => {
      const next = syncAlerts(prev, state.zones, predictions, Date.now());
      const currentCritical = new Set<string>();

      for (const a of next) {
        if (a.status === 'active' && a.riskLevel === 'critical') {
          currentCritical.add(a.zoneId);
        }
      }

      // If a new critical zone was added, play the tactical chime
      let hasNewCritical = false;
      for (const zoneId of currentCritical) {
        if (!prevCriticalZonesRef.current.has(zoneId)) {
          hasNewCritical = true;
          break;
        }
      }

      if (hasNewCritical) {
        playEmergencyAlertSound();
      }

      prevCriticalZonesRef.current = currentCritical;
      return next;
    });
  }, [state.zones, predictions]);

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
    if (sent) dispatch({ type: 'EXECUTE_PLAN_LIVE', plan });
  }, [plan, state.execution, mode, feedStatus, feedSend]);

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

  const [activeSOS, setActiveSOS] = useState<SOSBeacon | null>(null);
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [isPoliceModalOpen, setIsPoliceModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

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

  const triggerSOS = useCallback((type: SOSType, targetZoneId: ZoneId = 'gate-b') => {
    const z = state.zones[targetZoneId] || state.zones['gate-b'];

    const labels: Record<SOSType, { label: string; desc: string; responder: SOSBeacon['responder'] }> = {
      medical: {
        label: 'Medical Emergency / Unconscious',
        desc: 'Attendee collapsed due to acute heat, dehydration, and high crowd pressure.',
        responder: {
          id: 'RESP-MED-01',
          name: 'EMT Dr. Priya Sharma & Team Alpha-4',
          role: 'Emergency Medical Technician',
          unit: 'First Aid Tent Bravo (Sector 2)',
          phone: '+91 98201 44921',
          avatar: '🚑',
          location: 'Tent Bravo (28m away)',
          etaSeconds: 28,
        },
      },
      fire: {
        label: 'Pyrotechnic Fire / Smoke Flash',
        desc: 'Stage pyrotechnics flare ignited near East corridor truss. Smoke hazard detected.',
        responder: {
          id: 'RESP-FIRE-02',
          name: 'Lead Inspector Vikram Patil',
          role: 'Rapid Fire Suppression Team F-2',
          unit: 'East Hydrant & CO2 Extinguisher Post',
          phone: '+91 98202 88123',
          avatar: '🚒',
          location: 'East Perimeter Hydrant (38m away)',
          etaSeconds: 35,
        },
      },
      lost_child: {
        label: 'Lost Child / Family Separation',
        desc: '7-year-old child separated from guardian at crowded concourse. Wearing blue cap, white shirt.',
        responder: {
          id: 'RESP-SEC-03',
          name: 'Officer Sunita Rane',
          role: 'Child Safety & Reunification Patrol S-1',
          unit: 'Central Guest Relations Hub',
          phone: '+91 98203 11984',
          avatar: '👮‍♀️',
          location: 'Central Safety Desk (30m away)',
          etaSeconds: 22,
        },
      },
      harassment: {
        label: 'Harassment / Safety Disturbance',
        desc: 'Bystander reported persistent harassment and physical aggression in dense crowd queue.',
        responder: {
          id: 'RESP-MARSHAL-04',
          name: 'Marshall Arjun Desai & Squad M-3',
          role: 'Tactical Venue Safety & Marshall',
          unit: 'Plainclothes Rapid Intervention Squad',
          phone: '+91 98204 77332',
          avatar: '🛡️',
          location: 'Arena Sector B Rim (18m away)',
          etaSeconds: 20,
        },
      },
      faint: {
        label: 'Attendee Fainted / Unconscious',
        desc: 'Severe heat exhaustion, non-responsive, acute dehydration.',
        responder: {
          id: 'RESP-MED-01',
          name: 'EMT Dr. Priya Sharma & Team Alpha-4',
          role: 'Emergency Medical Technician',
          unit: 'First Aid Tent Bravo (Sector 2)',
          phone: '+91 98201 44921',
          avatar: '🚑',
          location: 'Tent Bravo (28m away)',
          etaSeconds: 28,
        },
      },
      breathing: {
        label: 'Acute Breathing Difficulty',
        desc: 'Asthma/hyperventilation in high density crowd sector.',
        responder: {
          id: 'RESP-MED-01',
          name: 'EMT Dr. Priya Sharma & Team Alpha-4',
          role: 'Emergency Medical Technician',
          unit: 'First Aid Tent Bravo (Sector 2)',
          phone: '+91 98201 44921',
          avatar: '🚑',
          location: 'Tent Bravo (28m away)',
          etaSeconds: 28,
        },
      },
      crush: {
        label: 'Crowd Crush Hazard / Trapped',
        desc: 'Barricade crush distress signal received.',
        responder: {
          id: 'RESP-MED-01',
          name: 'EMT Dr. Priya Sharma & Team Alpha-4',
          role: 'Emergency Medical Technician',
          unit: 'First Aid Tent Bravo (Sector 2)',
          phone: '+91 98201 44921',
          avatar: '🚑',
          location: 'Tent Bravo (28m away)',
          etaSeconds: 28,
        },
      },
      injury: {
        label: 'Severe Physical Trauma',
        desc: 'Laceration / fall injury requiring stretcher.',
        responder: {
          id: 'RESP-MED-01',
          name: 'EMT Dr. Priya Sharma & Team Alpha-4',
          role: 'Emergency Medical Technician',
          unit: 'First Aid Tent Bravo (Sector 2)',
          phone: '+91 98201 44921',
          avatar: '🚑',
          location: 'Tent Bravo (28m away)',
          etaSeconds: 28,
        },
      },
    };

    const info = labels[type] || labels.medical;

    const beacon: SOSBeacon = {
      id: `SOS-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: Date.now(),
      zoneId: z.id,
      zoneName: z.name,
      type,
      label: info.label,
      description: info.desc,
      callerPhone: `+91 9820${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'received',
      nearestMedId: 'm2',
      nearestMedName: 'First Aid Tent Bravo (Gate B/C Sector)',
      etaSeconds: info.responder?.etaSeconds ?? 28,
      coordinates: targetZoneId === 'gate-b' ? { x: 630, y: 145 } : { x: 380, y: 240 },
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

    setActiveSOS(beacon);
    setIsSOSModalOpen(true);
    playEmergencyAlertSound();
  }, [state.zones]);

  const assignResponder = useCallback(() => {
    setActiveSOS((prev) => (prev ? { ...prev, status: 'assigned' } : null));
  }, []);

  const dispatchParamedics = useCallback(() => {
    setActiveSOS((prev) => (prev ? { ...prev, status: 'dispatched', etaSeconds: 28 } : null));
  }, []);

  const sendCalmBroadcast = useCallback(() => {
    setActiveSOS((prev) => (prev ? { ...prev, calmMessageSent: true } : null));
  }, []);

  const resolveSOS = useCallback(() => {
    setActiveSOS(null);
  }, []);

  const value: CommandCenterContextValue = {
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