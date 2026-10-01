import { useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  DoorOpen,
  Lightbulb,
  Signpost,
  UserPlus,
  Zap,
  Smartphone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import type { RecommendationIconKey } from '@/types';
import { PublicBroadcastModal } from '@/components/broadcast/PublicBroadcastModal';

const icons: Record<RecommendationIconKey, LucideIcon> = {
  redirect: ArrowRightLeft,
  'deploy-staff': UserPlus,
  'open-lane': DoorOpen,
  'update-signage': Signpost,
};

export function RecommendationsPanel() {
  const { plan, zones, execution, executeResponsePlan, canExecute, mode } =
    useCommandCenter();
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border border-surface-border bg-surface-panel p-4 flex flex-col justify-between">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <Lightbulb className="h-4 w-4" />
              Recommended Response
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBroadcastOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-info/40 bg-info/10 px-2.5 py-1 text-xs font-semibold text-info hover:bg-info/20 transition shadow-sm"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Signage & Mobile</span>
              </button>
              {plan && (
                <span className="font-mono text-xs text-info">
                  for {zones[plan.sourceZoneId].name}
                </span>
              )}
            </div>
          </div>

          {plan ? (
            <>
              <ol className="space-y-2">
                {plan.recommendations.map((rec, i) => {
                  const Icon = icons[rec.icon];
                  const isSignage = rec.icon === 'update-signage';
                  return (
                    <li
                      key={rec.id}
                      className="flex gap-3 rounded-lg border border-surface-border bg-surface-raised p-3 items-start justify-between"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info/15 text-info">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-100">
                            {i + 1}. {rec.label}
                          </p>
                          <p className="mt-0.5 text-xs leading-snug text-slate-400">
                            {rec.detail}
                          </p>
                        </div>
                      </div>
                      {isSignage && (
                        <button
                          type="button"
                          onClick={() => setIsBroadcastOpen(true)}
                          className="shrink-0 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white transition"
                        >
                          Preview Screen
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>

              <button
                onClick={executeResponsePlan}
                disabled={!canExecute}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-risk-critical px-4 py-3 font-display text-sm font-bold tracking-wide text-white shadow-critical-glow hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                <Zap className="h-4 w-4" />
                EXECUTE RESPONSE PLAN
              </button>
              {mode === 'live' && !canExecute && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  Waiting for a live feed. A plan is never sent on stale data.
                </p>
              )}
            </>
          ) : execution ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-risk-normal/40 bg-risk-normal/10 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-risk-normal" />
                <div>
                  <p className="text-sm font-semibold text-risk-normal">
                    Response plan executed
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {zones[execution.sourceZoneId].name} is stabilising. Jumbotrons and push notifications have been updated.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBroadcastOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-info/50 bg-info/10 py-2.5 text-xs font-semibold text-info hover:bg-info/20 transition"
              >
                <Smartphone className="h-4 w-4" />
                View Attendee Screens (Jumbotron & Mobile App)
              </button>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">
              No action needed. All gates are within safe range.
            </p>
          )}
        </div>
      </div>

      <PublicBroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
      />
    </>
  );
}