import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, MapPin, Navigation, Shield, X } from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import { getRushColor, type FacilityKind, type VenueFacility } from '@/data/facilities';
import { occupancyToRisk } from '@/config/scenario';
import { walkLabel, zoneAt } from '@/data/venueGeometry';
import { rankFacilities, rankGates, nearestOfKind } from '@/lib/attendeeRanking';
import { useMyPosition } from '@/lib/useMyPosition';
import { VenueMapPicker } from '@/components/attendee/VenueMapPicker';
import type { RiskLevel, SOSType } from '@/types';

interface AttendeeAppProps {
  onExit: () => void;
}

const SOS_OPTIONS: { type: SOSType; label: string; icon: string }[] = [
  { type: 'medical', label: 'Medical emergency', icon: '\u{1F691}' },
  { type: 'faint', label: 'Someone fainted', icon: '\u{1F635}' },
  { type: 'breathing', label: "Can't breathe", icon: '\u{1F62E}' },
  { type: 'crush', label: 'Crowd crush', icon: '\u26A0\uFE0F' },
  { type: 'injury', label: 'Injury', icon: '\u{1FA79}' },
  { type: 'lost_child', label: 'Lost child', icon: '\u{1F9D2}' },
  { type: 'harassment', label: 'Harassment', icon: '\u{1F6E1}\uFE0F' },
  { type: 'fire', label: 'Fire / smoke', icon: '\u{1F525}' },
];

const SOS_ICON = '\u{1F198}';

const FACILITY_FILTERS: { kind: FacilityKind; label: string }[] = [
  { kind: 'all', label: 'All' },
  { kind: 'water', label: 'Water' },
  { kind: 'energy', label: 'Food & drinks' },
  { kind: 'restroom', label: 'Restrooms' },
  { kind: 'medical', label: 'First aid' },
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

interface SentSOS {
  type: SOSType;
  label: string;
  zoneName: string;
  sentAt: number;
  firstAidName: string | null;
  firstAidMeters: number | null;
}

export default function AttendeeApp({ onExit }: AttendeeAppProps) {
  const { zoneList, mode, status, runSurgeScenario } = useCommandCenter();
  const { position, isSet, setPosition, clearPosition } = useMyPosition();

  const [filter, setFilter] = useState<FacilityKind>('all');
  const [navTarget, setNavTarget] = useState<VenueFacility | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingType, setPendingType] = useState<SOSType | null>(null);
  const [sent, setSent] = useState<SentSOS | null>(null);
  const mapRef = useRef<HTMLElement>(null);

  // Sim mode only: start the scripted scenario once so the numbers move.
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
    () =>
      rankGates(
        zoneList.filter((z) => z.kind === 'gate'),
        position
      ),
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

  const pendingOption = SOS_OPTIONS.find((o) => o.type === pendingType) ?? null;

  const closeSheet = () => {
    setSheetOpen(false);
    setPendingType(null);
  };

  const confirmSend = () => {
    if (!pendingOption || !myZone) return;
    const aid = nearestOfKind('medical', position);
    setSent({
      type: pendingOption.type,
      label: pendingOption.label,
      zoneName: myZone.name,
      sentAt: Date.now(),
      firstAidName: aid?.facility.name ?? null,
      firstAidMeters: aid?.meters ?? null,
    });
    closeSheet();
  };

  const startNavigation = (f: VenueFacility) => {
    setNavTarget(f);
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div
      data-theme="dark"
      className="min-h-[100dvh] bg-slate-950 font-body text-slate-100"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onExit}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 active:scale-95"
            aria-label="Back to role chooser"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600">
            <Shield size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight">SurgeGuard</p>
            <p className="text-[11px] text-slate-400">Your safety companion</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-600/20 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-300">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {mode === 'live' ? 'LIVE' : 'DEMO'}
          </span>
        </div>
      </header>

      <main
        className="space-y-5 px-4 pt-4"
        style={{ paddingBottom: 'calc(7.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* SOS sent confirmation */}
        {sent && (
          <section className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-emerald-200">Help request sent</p>
                <p className="mt-0.5 text-xs text-slate-300">
                  {sent.label} - {sent.zoneName}
                </p>
                {sent.firstAidName && (
                  <p className="mt-2 text-xs text-slate-200">
                    Nearest first aid: <span className="font-semibold">{sent.firstAidName}</span>
                    {sent.firstAidMeters !== null && ` - ${sent.firstAidMeters} m away`}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-slate-400">
                  Demo only for now: it has not reached the control room yet. Live status will
                  appear here once the devices are connected.
                </p>
                <button
                  onClick={() => setSent(null)}
                  className="mt-3 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 active:scale-95"
                >
                  Cancel request
                </button>
              </div>
              <button
                onClick={() => setSent(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300 active:scale-95"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </section>
        )}

        {/* Location: tap the map */}
        <section ref={mapRef}>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Your location
            </h2>
            {isSet && (
              <button
                onClick={clearPosition}
                className="text-[11px] font-semibold text-slate-400 underline underline-offset-2"
              >
                Reset pin
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

          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin size={13} className="text-blue-400" />
              {isSet ? 'Tap the map to move your pin' : 'Tap the map to set where you are'}
            </p>
            {myZone && (
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${myRisk.chip}`}
              >
                {myZone.name} - {myPct}% - {myRisk.label}
              </span>
            )}
          </div>

          {navOption && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-sky-500/40 bg-sky-500/10 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl">
                {navOption.facility.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{navOption.facility.name}</p>
                <p className="text-[11px] text-sky-200">
                  {navOption.meters} m - {walkLabel(navOption.walkMin)} min walk
                </p>
              </div>
              <button
                onClick={() => setNavTarget(null)}
                className="shrink-0 rounded-xl bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-200 active:scale-95"
              >
                Stop
              </button>
            </div>
          )}
        </section>

        {/* Best gate */}
        {bestGate && (
          <section className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Best gate for you
            </p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <p className="text-3xl font-black leading-none">{bestGate.zone.name}</p>
              <p className="text-right text-xs text-slate-300">
                ~{Math.round(bestGate.totalMin)} min total
              </p>
            </div>
            <p className="mt-2 text-sm text-slate-200">
              {bestGate.waitMin} min wait + {walkLabel(bestGate.walkMin)} min walk (
              {bestGate.meters} m).
              {!bestGate.isNearest && ' Not the closest gate, but quicker overall.'}
            </p>
            {crowdedNames.length > 0 && (
              <p className="mt-1 text-xs font-semibold text-amber-300">
                {crowdedNames.join(' and ')} {crowdedNames.length > 1 ? 'are' : 'is'} crowded right
                now.
              </p>
            )}
          </section>
        )}

        {/* All gates ranked */}
        <section>
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            All gates
          </h2>
          <div className="space-y-2">
            {gateOptions.map((g) => {
              const style = RISK_STYLE[occupancyToRisk(g.pct)];
              return (
                <div key={g.zone.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-base font-bold">{g.zone.name}</p>
                        {g.isBest && (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            BEST
                          </span>
                        )}
                        {g.isFastest && (
                          <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                            FASTEST
                          </span>
                        )}
                        {g.isNearest && (
                          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                            NEAREST
                          </span>
                        )}
                      </div>
                      <p className={`text-xs font-semibold ${style.text}`}>
                        {style.label} - {g.pct}% full
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {g.meters} m - {walkLabel(g.walkMin)} min walk
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-3xl font-black leading-none ${style.text}`}>{g.waitMin}</p>
                      <p className="text-[11px] text-slate-400">min wait</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
                      style={{ width: `${Math.min(100, g.pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stalls and facilities */}
        <section>
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Stalls &amp; facilities near you
          </h2>
          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {FACILITY_FILTERS.map((f) => (
              <button
                key={f.kind}
                onClick={() => setFilter(f.kind)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold active:scale-95 ${
                  filter === f.kind
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {facilityOptions.map((o) => {
              const rush = getRushColor(o.facility.rushLevel);
              return (
                <div
                  key={o.facility.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                      {o.facility.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold leading-tight">
                          {o.facility.name}
                        </p>
                        {o.isBest && (
                          <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            BEST
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {o.meters} m - {walkLabel(o.walkMin)} min walk
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${rush.badgeBg}`}
                    >
                      <Clock size={11} />
                      {o.waitMin === 0 ? 'No wait' : `${o.waitMin} min`}
                    </span>
                  </div>

                  {o.better && (
                    <p className="mt-2 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                      Busy. {o.better.facility.name} saves about {o.better.saveMin} min.
                    </p>
                  )}

                  <button
                    onClick={() => startNavigation(o.facility)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white active:scale-[0.98]"
                  >
                    <Navigation size={13} />
                    Show on map
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Fixed SOS bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 px-4 pt-3 backdrop-blur"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-base font-black tracking-wide text-white shadow-lg shadow-red-600/30 active:scale-[0.98]"
        >
          <span>{SOS_ICON}</span> Need help? Send SOS
        </button>
      </div>

      {/* SOS bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/70" onClick={closeSheet}>
          <div
            className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border-t border-slate-700 bg-slate-900 p-4"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-700" />

            {!pendingOption ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold">What's happening?</p>
                    <p className="text-xs text-slate-400">
                      Location: {myZone?.name ?? 'Unknown'}
                    </p>
                  </div>
                  <button
                    onClick={closeSheet}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 active:scale-95"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SOS_OPTIONS.map((o) => (
                    <button
                      key={o.type}
                      onClick={() => setPendingType(o.type)}
                      className="flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800 p-3 text-center active:scale-95"
                    >
                      <span className="text-2xl">{o.icon}</span>
                      <span className="text-xs font-semibold leading-tight">{o.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="text-5xl">{pendingOption.icon}</div>
                <p className="mt-2 text-lg font-bold">Send SOS?</p>
                <p className="mt-1 text-sm text-slate-300">{pendingOption.label}</p>
                <p className="text-xs text-slate-400">Location: {myZone?.name ?? 'Unknown'}</p>
                <p className="mt-3 text-xs text-slate-400">
                  Only send this if you or someone near you needs urgent help.
                </p>
                <div className="mt-4 grid gap-2">
                  <button
                    onClick={confirmSend}
                    className="w-full rounded-2xl bg-red-600 py-4 text-base font-black text-white active:scale-[0.98]"
                  >
                    Yes, send SOS
                  </button>
                  <button
                    onClick={() => setPendingType(null)}
                    className="w-full rounded-2xl bg-slate-800 py-3.5 text-sm font-semibold text-slate-200 active:scale-[0.98]"
                  >
                    Go back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
