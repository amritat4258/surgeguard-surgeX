import { Activity, Check, Eye, Gauge, Lightbulb, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';

type Phase = 'monitor' | 'predict' | 'recommend' | 'act' | 'measure';

const PHASES: { id: Phase; label: string; icon: LucideIcon }[] = [
  { id: 'monitor', label: 'Monitor', icon: Eye },
  { id: 'predict', label: 'Predict', icon: Activity },
  { id: 'recommend', label: 'Recommend', icon: Lightbulb },
  { id: 'act', label: 'Act', icon: Zap },
  { id: 'measure', label: 'Measure Impact', icon: Gauge },
];

export function PhaseStepper() {
  const { status, tick, plan, execution, zoneList, predictions } =
    useCommandCenter();

  // Work out which phase the demo is in right now
  let current: Phase = 'monitor';
  if (status !== 'idle') {
    if (execution) {
      current = 'measure';
    } else if (plan) {
      current = 'recommend';
    } else if (
      tick >= 1 &&
      zoneList.some((z) => {
        const p = predictions[z.id];
        return (
          p.riskLevel !== 'normal' &&
          p.timeToCapacityMin !== null &&
          p.timeToCapacityMin <= 30
        );
      })
    ) {
      current = 'predict';
    }
  }

  const currentIndex = PHASES.findIndex((p) => p.id === current);

  return (
    <nav className="border-b border-surface-border bg-surface-base px-6 py-3">
      <ol className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto">
        {PHASES.map((phase, i) => {
          // "Act" is instant, so it counts as done once we reach "measure"
          const done = i < currentIndex;
          const active = i === currentIndex;
          const Icon = phase.icon;
          return (
            <li key={phase.id} className="flex items-center gap-2">
              <span
                className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${
                  active
                    ? 'border-info bg-info/15 text-info'
                    : done
                      ? 'border-risk-normal/40 bg-risk-normal/10 text-risk-normal'
                      : 'border-surface-border text-slate-500'
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                {phase.label.toUpperCase()}
              </span>
              {i < PHASES.length - 1 && (
                <span className="h-px w-4 bg-surface-border" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}