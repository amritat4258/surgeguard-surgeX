import { useEffect, useState } from 'react';
import './critical.css';
import { Siren, Zap, Volume2, VolumeX } from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import { getAlertMuted, setAlertMuted, startSiren, stopSiren } from '@/lib/audioAlert';

/** mm:ss from minutes. Caps at 99:59 so the banner never overflows. */
function formatCountdown(minutes: number | null): string {
  if (minutes === null) return '--:--';
  const total = Math.min(99 * 60 + 59, Math.max(0, Math.round(minutes * 60)));
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Full-screen CRITICAL state: pulsing red frame, red gradients from both
 * screen edges, a looping siren, and a sticky banner with a breach countdown
 * and a one-click execute button.
 *
 * The visuals stay until the critical alert is resolved. The siren stops
 * earlier if the alert is acknowledged or the user mutes it.
 */
export function CriticalOverlay() {
  const { alerts, zones, predictions, plan, canExecute, executeResponsePlan } =
    useCommandCenter();
  const [muted, setMuted] = useState(getAlertMuted);

  const critical = alerts.filter(
    (a) => a.riskLevel === 'critical' && a.status !== 'resolved'
  );
  const sirenActive = alerts.some(
    (a) => a.riskLevel === 'critical' && a.status === 'active'
  );

  // Siren runs only while an unacknowledged critical alert exists.
  useEffect(() => {
    if (sirenActive && !muted) startSiren();
    else stopSiren();
    return () => stopSiren();
  }, [sirenActive, muted]);

  const toggleMute = () => {
    const next = !muted;
    setAlertMuted(next);
    setMuted(next);
  };

  if (critical.length === 0) return null;

  // Most urgent first: smallest time-to-capacity, unknown ETA last.
  const worst = [...critical].sort((a, b) => {
    const ea = predictions[a.zoneId].timeToCapacityMin ?? Infinity;
    const eb = predictions[b.zoneId].timeToCapacityMin ?? Infinity;
    return ea - eb;
  })[0];

  const zone = zones[worst.zoneId];
  const eta = predictions[worst.zoneId].timeToCapacityMin;
  const pct = Math.round((zone.current / zone.capacity) * 100);
  const showExecute = canExecute && plan?.sourceZoneId === worst.zoneId;

  return (
    <>
      {/* Pulsing frame and side gradients. None of these block clicks. */}
      <div
        aria-hidden="true"
        className="critical-frame pointer-events-none fixed inset-0 z-[60]"
      />
      <div aria-hidden="true" className="critical-edge critical-edge-left" />
      <div aria-hidden="true" className="critical-edge critical-edge-right" />

      {/* Sticky breach banner */}
      <div
        role="alert"
        aria-live="assertive"
        className="sticky top-0 z-[55] flex flex-wrap items-center justify-between gap-3 border-b border-risk-critical/60 bg-red-950/95 px-6 py-3 backdrop-blur"
      >
        <div className="flex items-center gap-3">
          <Siren className="h-6 w-6 text-risk-critical motion-safe:animate-pulse" />
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-widest text-red-200">
              Critical: {zone.name} at {pct}%
              {critical.length > 1 ? ` (+${critical.length - 1} more)` : ''}
            </p>
            <p className="text-xs text-red-300/80">
              {predictions[worst.zoneId].explanation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest text-red-300/70">
              Breach in
            </p>
            <p className="font-mono text-3xl font-bold leading-none text-risk-critical tabular-nums">
              {formatCountdown(eta)}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute siren' : 'Mute siren'}
            className="rounded-lg border border-red-400/40 p-2 text-red-200 transition hover:bg-red-900/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          {showExecute && (
            <button
              type="button"
              onClick={executeResponsePlan}
              className="inline-flex items-center gap-2 rounded-lg bg-risk-critical px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-white shadow-critical-glow transition hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Zap className="h-4 w-4" />
              Execute response plan
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default CriticalOverlay;