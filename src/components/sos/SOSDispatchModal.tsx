import {
  AlertOctagon,
  X,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  Siren,
  Ambulance,
  HeartPulse,
} from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';

interface SOSDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SOSDispatchModal({ isOpen, onClose }: SOSDispatchModalProps) {
  const { activeSOS, dispatchParamedics, resolveSOS } = useCommandCenter();

  if (!isOpen || !activeSOS) return null;

  const isDispatched = activeSOS.status === 'dispatched';
  const isResolved = activeSOS.status === 'resolved';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex w-full max-w-xl flex-col rounded-2xl border-2 border-rose-500 bg-slate-950 text-slate-100 shadow-[0_0_50px_rgba(244,63,94,0.4)] overflow-hidden">
        {/* Blinking Emergency Strobe Bar */}
        <div className="flex items-center justify-between border-b border-rose-900/60 bg-rose-950/70 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white animate-pulse">
              <Siren className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black tracking-widest text-rose-300">
                  {activeSOS.id} // ATTENDEE DISTRESS BEACON
                </span>
                <span className="rounded-full bg-rose-500/20 border border-rose-500/50 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300 animate-ping">
                  EMERGENCY
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-white">
                {activeSOS.label}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-rose-300 hover:bg-rose-900/50 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Situation Details */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
            <div className="flex items-start gap-3">
              <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300 font-mono">
                  Reported Condition:
                </span>
                <p className="mt-0.5 text-sm text-slate-200">
                  {activeSOS.description}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-rose-400" />
                    Caller: {activeSOS.callerPhone}
                  </span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-info" />
                    Logged: {new Date(activeSOS.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Nearest Medical Facility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <MapPin className="h-4 w-4 text-rose-400" />
                <span className="font-semibold uppercase">Incident Location</span>
              </div>
              <p className="font-bold text-white text-sm">
                {activeSOS.zoneName}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                MMRDA Grounds, BKC (Coordinates: 19.0657° N, 72.8682° E)
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <HeartPulse className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold uppercase">Nearest Med Station</span>
              </div>
              <p className="font-bold text-emerald-300 text-sm">
                {activeSOS.nearestMedName}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Distance: ~28 meters · Stretcher & AED Ready
              </p>
            </div>
          </div>

          {/* Status & Paramedic Dispatch Control */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            {isResolved ? (
              <div className="flex items-center gap-3 text-emerald-400 font-mono">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-300">
                    PATIENT STABILIZED & CLEARED
                  </h4>
                  <p className="text-xs text-slate-300">
                    Paramedics on scene. Oxygen and IV hydration administered. Egress clear.
                  </p>
                </div>
              </div>
            ) : isDispatched ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Ambulance className="h-4 w-4 animate-bounce" />
                    PARAMEDICS EN ROUTE
                  </span>
                  <span className="font-bold text-rose-400 text-sm">
                    ETA: {activeSOS.etaSeconds}s
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-1000"
                    style={{ width: `${Math.max(10, 100 - (activeSOS.etaSeconds / 35) * 100)}%` }}
                  />
                </div>

                <p className="text-xs text-slate-400">
                  Rapid response medics dispatched from First Aid Tent Bravo with trauma kit and wheelchair.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>DISPATCH PROTOCOL:</span>
                  <span className="text-rose-400 font-bold">READY FOR DEPLOYMENT</span>
                </div>
                <p className="text-xs text-slate-300">
                  Clicking dispatch will deploy 2 paramedics and an automated wheelchair/stretcher team immediately to {activeSOS.zoneName}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Minimize
          </button>

          <div className="flex items-center gap-2">
            {!isDispatched && !isResolved && (
              <button
                type="button"
                onClick={dispatchParamedics}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 font-display text-sm font-bold text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] hover:bg-rose-500 transition"
              >
                <Ambulance className="h-4 w-4" />
                DISPATCH PARAMEDIC UNIT 🚑
              </button>
            )}

            {(isDispatched || isResolved) && (
              <button
                type="button"
                onClick={() => {
                  resolveSOS();
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 font-display text-xs font-bold text-white hover:bg-emerald-500 transition"
              >
                <CheckCircle className="h-4 w-4" />
                Mark Resolved & Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
