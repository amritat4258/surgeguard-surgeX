import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  Navigation,
  Radio,
  RotateCcw,
  Shield,
  ShieldAlert,
  Siren,
  Sparkles,
  X,
  MessageSquare,
  Flame,
  HeartPulse,
  Users,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import { getRushColor, type FacilityKind, type VenueFacility } from '@/data/facilities';
import { occupancyToRisk } from '@/config/scenario';
import {
  walkLabel,
  zoneAt,
  generateNavigationSteps,
  type NavigationStep,
} from '@/data/venueGeometry';
import { rankFacilities, rankGates } from '@/lib/attendeeRanking';
import { useMyPosition } from '@/lib/useMyPosition';
import { VenueMapPicker } from '@/components/attendee/VenueMapPicker';
import type { RiskLevel, SOSSeverity, SOSType } from '@/types';

interface AttendeeAppProps {
  onExit: () => void;
}

interface SosTypeOption {
  type: SOSType;
  label: string;
  icon: string;
  defaultSeverity: SOSSeverity;
}

const SOS_TYPES: SosTypeOption[] = [
  { type: 'medical', label: 'Medical emergency', icon: '🚑', defaultSeverity: 'critical' },
  { type: 'fire', label: 'Fire / smoke', icon: '🔥', defaultSeverity: 'critical' },
  { type: 'crush', label: 'Crowd crush / trapped', icon: '⚠️', defaultSeverity: 'critical' },
  { type: 'security', label: 'Security threat', icon: '🛡️', defaultSeverity: 'urgent' },
  { type: 'lost_child', label: 'Lost child / person', icon: '🧒', defaultSeverity: 'urgent' },
  { type: 'other', label: 'Other assistance', icon: '🆘', defaultSeverity: 'assistance' },
];

const FACILITY_FILTERS: { kind: FacilityKind; label: string; icon: string }[] = [
  { kind: 'all', label: 'All', icon: '✨' },
  { kind: 'water', label: 'Water', icon: '💧' },
  { kind: 'restroom', label: 'Restrooms', icon: '🚻' },
  { kind: 'energy', label: 'Energy', icon: '⚡' },
  { kind: 'food', label: 'Food', icon: '🍔' },
  { kind: 'medical', label: 'First aid', icon: '🚑' },
  { kind: 'exit', label: 'Exits', icon: '🚪' },
];

const RISK_STYLE: Record<RiskLevel, { text: string; bar: string; chip: string; label: string }> = {
  normal: {
    text: 'text-emerald-300',
    bar: 'bg-emerald-400',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    label: 'Smooth',
  },
  warning: {
    text: 'text-amber-300',
    bar: 'bg-amber-400',
    chip: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    label: 'Getting busy',
  },
  high: {
    text: 'text-orange-300',
    bar: 'bg-orange-400',
    chip: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
    label: 'Very busy',
  },
  critical: {
    text: 'text-rose-300',
    bar: 'bg-rose-500',
    chip: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
    label: 'Avoid',
  },
};

// Anonymous device ID generator cached per session
function getDeviceId(): string {
  try {
    let id = localStorage.getItem('surgeguard_device_id');
    if (!id) {
      id = `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      localStorage.setItem('surgeguard_device_id', id);
    }
    return id;
  } catch {
    return 'DEV-ANON-01';
  }
}

export default function AttendeeApp({ onExit }: AttendeeAppProps) {
  const {
    zoneList,
    mode,
    status,
    runSurgeScenario,
    connectionMode,
    mySOS,
    sendMySOS,
    cancelMySOS,
    clearMySOS,
  } = useCommandCenter();

  const {
    position,
    isSet,
    setPosition,
    clearPosition,
    isGpsActive,
    gpsStatus,
    gpsError,
    requestGps,
  } = useMyPosition();

  const [filter, setFilter] = useState<FacilityKind>('all');
  const [navTarget, setNavTarget] = useState<VenueFacility | null>(null);

  // SOS Creation State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<SOSType>('medical');
  const [severity, setSeverity] = useState<SOSSeverity>('critical');
  const [note, setNote] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mapRef = useRef<HTMLElement>(null);
  const deviceId = useMemo(getDeviceId, []);

  // Sim mode auto-starter
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    if (mode === 'sim' && status === 'idle') {
      startedRef.current = true;
      runSurgeScenario();
    }
  }, [mode, status, runSurgeScenario]);

  const myZoneId = zoneAt(position);
  const myZone = zoneList.find((z) => z.id === myZoneId) ?? zoneList[0];
  const myPct = myZone ? Math.round((myZone.current / myZone.capacity) * 100) : 0;
  const myRisk = RISK_STYLE[occupancyToRisk(myPct)];

  const gateOptions = useMemo(
    () => rankGates(zoneList.filter((z) => z.kind === 'gate'), position),
    [zoneList, position]
  );
  const bestGate = gateOptions[0] ?? null;

  const crowdedNames = gateOptions
    .filter((g) => !g.isBest && g.pct >= 85)
    .map((g) => g.zone.name);

  const facilityOptions = useMemo(() => rankFacilities(filter, position), [filter, position]);

  const navOption = useMemo(() => {
    if (!navTarget) return null;
    return rankFacilities('all', position).find((o) => o.facility.id === navTarget.id) ?? null;
  }, [navTarget, position]);

  // Turn-by-turn 3-step navigation
  const navigationSteps: NavigationStep[] = useMemo(() => {
    if (!navTarget) return [];
    return generateNavigationSteps(position, { x: navTarget.x, y: navTarget.y }, navTarget.name, navTarget.queueMin);
  }, [position, navTarget]);

  const startNavigation = (f: VenueFacility) => {
    setNavTarget(f);
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setHoldProgress(0);
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
  };

  // Hold-to-send handlers (2.5 seconds hold to prevent accidental triggering)
  const startHold = () => {
    setHoldProgress(0);
    const stepMs = 50;
    const totalMs = 2500;
    const increment = (stepMs / totalMs) * 100;

    holdTimerRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev + increment >= 100) {
          if (holdTimerRef.current) clearInterval(holdTimerRef.current);
          handleTriggerSend();
          return 100;
        }
        return prev + increment;
      });
    }, stepMs);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  };

  const handleTriggerSend = () => {
    if (!myZone) return;
    sendMySOS({
      type: selectedType,
      zoneId: myZone.id,
      point: position,
      severity,
      note: note.trim() || undefined,
      peopleCount,
      deviceId,
    });
    closeSheet();
  };

  return (
    <div
      data-theme="dark"
      className="min-h-[100dvh] bg-slate-950 font-body text-slate-100"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* App Header Bar */}
      <header
        className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onExit}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300 active:scale-95"
              aria-label="Back to role chooser"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-md">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black tracking-tight leading-tight">SurgeGuard</p>
              <p className="text-[10px] text-slate-400 font-mono">MMRDA BKC Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            {/* GPS Status Chip */}
            <button
              type="button"
              onClick={requestGps}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-bold border transition ${
                isGpsActive
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-sky-500/40'
              }`}
              title="Click to request GPS geolocation tracking"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isGpsActive ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isGpsActive ? 'GPS ACTIVE' : 'USE GPS'}</span>
            </button>

            {/* Connection Relay Chip */}
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-1 font-bold border ${
                connectionMode === 'live'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : connectionMode === 'local-only'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connectionMode === 'live'
                    ? 'bg-emerald-400 animate-ping'
                    : connectionMode === 'local-only'
                    ? 'bg-blue-400'
                    : 'bg-slate-500'
                }`}
              />
              <span>{connectionMode === 'live' ? 'LIVE' : connectionMode === 'local-only' ? 'RELAY' : 'OFFLINE'}</span>
            </span>
          </div>
        </div>

        {/* GPS Warning / Error Note */}
        {gpsError && (
          <div className="bg-amber-950/80 border-b border-amber-500/40 px-3 py-1.5 text-[10px] text-amber-200 flex items-center justify-between font-mono">
            <span>⚠️ {gpsError}</span>
            <button onClick={clearPosition} className="text-amber-300 underline text-[9px] font-bold">
              Dismiss
            </button>
          </div>
        )}
      </header>

      <main
        className="space-y-4 px-3.5 pt-3"
        style={{ paddingBottom: 'calc(7.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* ACTIVE SOS STATUS BANNER */}
        {mySOS && (
          <section className="rounded-2xl border-2 border-rose-500/80 bg-gradient-to-b from-rose-950/90 via-slate-900/95 to-slate-950 p-4 shadow-xl shadow-rose-950/50 animate-in fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-lg animate-pulse">
                  <Siren className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black uppercase text-rose-300">
                      🚨 SOS ACTIVE: {mySOS.type.toUpperCase()}
                    </span>
                    <span className="rounded bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.2 font-mono text-[9px] font-bold text-rose-200">
                      {mySOS.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Assigned: <span className="font-semibold text-white">{mySOS.responderName || 'Rapid Response Medic Team'}</span>
                  </p>
                </div>
              </div>

              {mySOS.status === 'dispatched' && (
                <div className="text-right shrink-0">
                  <span className="font-mono text-2xl font-black text-rose-400">{mySOS.etaSeconds}s</span>
                  <p className="text-[9px] font-mono text-slate-400">EST. ARRIVAL</p>
                </div>
              )}
            </div>

            {/* Lifecycle Stages Indicator */}
            <div className="mt-3.5 grid grid-cols-4 gap-1 border-t border-rose-900/40 pt-3 text-[10px] font-mono text-center">
              {[
                { key: 'sent', label: '1. Sent', active: true },
                { key: 'received', label: '2. Received', active: mySOS.status !== 'sending' },
                { key: 'assigned', label: '3. Assigned', active: mySOS.status === 'assigned' || mySOS.status === 'dispatched' || mySOS.status === 'resolved' },
                { key: 'dispatched', label: '4. En Route', active: mySOS.status === 'dispatched' || mySOS.status === 'resolved' },
              ].map((step) => (
                <div
                  key={step.key}
                  className={`rounded-lg py-1 px-0.5 border ${
                    step.active
                      ? 'bg-rose-500/20 border-rose-500/60 text-rose-200 font-bold'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  {step.label}
                </div>
              ))}
            </div>

            {/* Message from Control Room */}
            {mySOS.messageFromOrganizer && (
              <div className="mt-3 rounded-xl border border-sky-500/50 bg-sky-950/70 p-2.5 text-xs text-sky-200 flex items-start gap-2">
                <MessageSquare className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
                <div>
                  <p className="font-bold text-[10px] uppercase font-mono text-sky-300">Control Room Dispatch Message:</p>
                  <p className="mt-0.5 text-slate-200">{mySOS.messageFromOrganizer}</p>
                </div>
              </div>
            )}

            {/* Actions: Cancel False Alarm */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-mono">Incident ID: {mySOS.id}</span>
              {mySOS.status !== 'resolved' ? (
                <button
                  type="button"
                  onClick={cancelMySOS}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1 font-mono text-xs font-semibold text-slate-300 transition active:scale-95"
                >
                  Cancel False Alarm
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearMySOS}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 font-mono text-xs font-bold text-white transition active:scale-95"
                >
                  Dismiss / Clear
                </button>
              )}
            </div>
          </section>
        )}

        {/* Location & Map Section */}
        <section ref={mapRef} className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-sky-400" />
              <span>Your Venue Location &amp; Navigation</span>
            </h2>
            {isSet && (
              <button
                onClick={clearPosition}
                className="text-[11px] font-semibold text-sky-400 hover:underline flex items-center gap-1 font-mono"
              >
                <RotateCcw className="h-2.5 w-2.5" /> Reset pin
              </button>
            )}
          </div>

          <VenueMapPicker
            zones={zoneList}
            position={position}
            onPick={setPosition}
            filter={filter}
            target={navTarget}
            bestGateId={bestGate?.zone.id ?? null}
          />

          <div className="flex items-center justify-between gap-2 text-xs">
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-sky-400" />
              {isSet ? 'Tap map anytime to re-pin location' : 'Tap venue map to pin your position'}
            </p>
            {myZone && (
              <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${myRisk.chip}`}>
                {myZone.name} · {myPct}% Full
              </span>
            )}
          </div>

          {/* TURN-BY-TURN NAVIGATION CARD */}
          {navOption && (
            <div className="rounded-2xl border-2 border-sky-500/60 bg-gradient-to-r from-sky-950/90 via-slate-900 to-sky-950/90 p-3.5 shadow-lg space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl shadow">
                    {navOption.facility.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">{navOption.facility.name}</span>
                      <span className="rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 font-mono text-[9px] font-bold">
                        {navOption.waitMin === 0 ? 'NO QUEUE' : `${navOption.waitMin}M WAIT`}
                      </span>
                    </div>
                    <p className="text-[11px] text-sky-200 font-mono">
                      {navOption.meters} m away · ~{walkLabel(navOption.walkMin)} min walk
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNavTarget(null)}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300 active:scale-95"
                >
                  End
                </button>
              </div>

              {/* 3 Text Steps */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 space-y-1.5 text-xs">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                  <Compass className="h-3 w-3" /> Turn-by-Turn Route:
                </p>
                {navigationSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-200 text-[11px] leading-snug">
                    <span className="font-mono font-bold text-sky-300 shrink-0">{idx + 1}.</span>
                    <span className="shrink-0">{step.icon}</span>
                    <span className="flex-1">{step.text}</span>
                    {step.distanceM && <span className="font-mono text-[10px] text-slate-400 shrink-0">{step.distanceM}m</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Category Chips Filter Strip */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Nearest Amenities &amp; Safety Posts
            </h2>
            <span className="text-[10px] font-mono text-slate-500">Wait-Weighted Routing</span>
          </div>

          <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 no-scrollbar scrollbar-none whitespace-nowrap">
            {FACILITY_FILTERS.map((f) => (
              <button
                key={f.kind}
                onClick={() => setFilter(f.kind)}
                className={`flex items-center gap-1.5 shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                  filter === f.kind
                    ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Facility Cards List */}
          <div className="space-y-2">
            {facilityOptions.map((o) => {
              const rush = getRushColor(o.facility.rushLevel);
              const isCurrentTarget = navTarget?.id === o.facility.id;

              return (
                <div
                  key={o.facility.id}
                  className={`rounded-2xl border p-3 transition ${
                    isCurrentTarget
                      ? 'border-sky-500/80 bg-sky-950/40 shadow-md'
                      : 'border-slate-800 bg-slate-900/90'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                      {o.facility.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold leading-tight text-white">
                          {o.facility.name}
                        </p>
                        {o.isBest && (
                          <span className="shrink-0 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300 font-mono">
                            OPTIMAL
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400 font-mono">
                        {o.meters} m · ~{walkLabel(o.walkMin)} min walk
                      </p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-mono font-bold ${rush.badgeBg}`}>
                      <Clock size={10} />
                      {o.waitMin === 0 ? 'No wait' : `${o.waitMin}m queue`}
                    </span>
                  </div>

                  {o.better && (
                    <p className="mt-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-[10px] text-amber-200">
                      ⚡ Faster alternative: {o.better.facility.name} (saves ~{o.better.saveMin}m).
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startNavigation(o.facility)}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 font-mono text-xs font-bold transition active:scale-[0.98] ${
                        isCurrentTarget
                          ? 'bg-sky-500 text-white shadow-lg'
                          : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700'
                      }`}
                    >
                      <Navigation size={13} />
                      {isCurrentTarget ? 'Navigating Active' : 'Navigate Here'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Best Gate Overview */}
        {bestGate && (
          <section className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono">
                ⚡ Fastest Exit Gate For You
              </span>
              <span className="font-mono text-xs font-bold text-emerald-300">
                ~{Math.round(bestGate.totalMin)} min total
              </span>
            </div>
            <p className="text-xl font-black text-white mt-1">{bestGate.zone.name}</p>
            <p className="text-xs text-slate-300 mt-1">
              {bestGate.waitMin} min queue + {walkLabel(bestGate.walkMin)} min walk ({bestGate.meters}m).
            </p>
          </section>
        )}
      </main>

      {/* Floating Persistent Emergency SOS Bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-rose-900/60 bg-slate-950/95 px-4 pt-3 backdrop-blur"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 py-3.5 text-base font-black tracking-wide text-white shadow-lg shadow-rose-600/40 transition hover:scale-[1.01] active:scale-[0.98]"
        >
          <span className="text-xl">🆘</span>
          <span>EMERGENCY SOS // REQUEST ASSISTANCE</span>
        </button>
      </div>

      {/* SOS MODAL & CLASSIFICATION DRAWER */}
      {sheetOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/80 backdrop-blur-sm" onClick={closeSheet}>
          <div
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border-t-2 border-rose-500/80 bg-slate-900 p-4 text-slate-100 shadow-2xl"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-700" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white text-lg">
                  🚨
                </span>
                <div>
                  <h3 className="font-display font-bold text-base text-white">Emergency Assistance Dispatch</h3>
                  <p className="text-[10px] text-slate-400 font-mono">MMRDA Grounds Command Link · {myZone?.name}</p>
                </div>
              </div>
              <button
                onClick={closeSheet}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Incident Type Grid */}
              <div>
                <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  1. Select Emergency Type:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SOS_TYPES.map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => {
                        setSelectedType(t.type);
                        setSeverity(t.defaultSeverity);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition ${
                        selectedType === t.type
                          ? 'border-rose-500 bg-rose-600/20 text-rose-200 font-bold shadow-sm'
                          : 'border-slate-800 bg-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <span className="text-[11px] leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Selector */}
              <div>
                <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  2. Urgency Level:
                </label>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  {[
                    { key: 'critical', label: '🔴 CRITICAL', desc: 'Life Threatening' },
                    { key: 'urgent', label: '🟠 URGENT', desc: 'Prompt Aid' },
                    { key: 'assistance', label: '🟡 ASSISTANCE', desc: 'Minor / Support' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSeverity(s.key as SOSSeverity)}
                      className={`rounded-xl border p-2 text-center transition ${
                        severity === s.key
                          ? 'border-rose-500 bg-rose-500/20 text-rose-200 font-bold'
                          : 'border-slate-800 bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      <p className="font-bold">{s.label}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* People Affected & Optional Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    People Affected:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 5].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setPeopleCount(cnt)}
                        className={`flex-1 rounded-xl border py-1.5 font-mono font-bold text-xs ${
                          peopleCount === cnt
                            ? 'border-rose-500 bg-rose-600 text-white'
                            : 'border-slate-800 bg-slate-800 text-slate-300'
                        }`}
                      >
                        {cnt === 5 ? '5+' : cnt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Optional Situation Note (Max 140 Chars):
                  </label>
                  <input
                    type="text"
                    maxLength={140}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Near speaker tower 4, collapsed person"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none font-sans"
                  />
                </div>
              </div>

              {/* Telemetry Attachment Preview & Consent */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-[10px] font-mono text-slate-400 space-y-1">
                <div className="flex justify-between text-slate-300 font-bold">
                  <span>🛰️ AUTO-ATTACHED TELEMETRY:</span>
                  <span>{deviceId}</span>
                </div>
                <p>Location: {myZone?.name} (Coord: {Math.round(position.x)}, {Math.round(position.y)}) · Timestamp: {new Date().toLocaleTimeString()}</p>
                <p className="text-slate-400 italic text-[9px] pt-1 border-t border-slate-800">
                  By sending, you agree to share your real-time venue coordinates with the emergency response room.
                </p>
              </div>

              {/* Hold-to-Send 2.5s Progress Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onMouseDown={startHold}
                  onMouseUp={cancelHold}
                  onMouseLeave={cancelHold}
                  onTouchStart={startHold}
                  onTouchEnd={cancelHold}
                  className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 py-4 text-center font-mono text-sm font-black uppercase text-white shadow-xl shadow-rose-600/40 select-none active:scale-[0.99]"
                >
                  {/* Progress Fill Indicator */}
                  <div
                    className="absolute inset-0 bg-white/30 transition-all duration-75"
                    style={{ width: `${holdProgress}%` }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span>🚨</span>
                    <span>
                      {holdProgress > 0
                        ? `HOLDING... ${Math.round(holdProgress)}%`
                        : 'PRESS & HOLD 2.5S TO DISPATCH SOS'}
                    </span>
                  </span>
                </button>
                <p className="text-center text-[10px] font-mono text-slate-500 mt-1.5">
                  Hold to prevent accidental activation · Emergency triage is instant
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

