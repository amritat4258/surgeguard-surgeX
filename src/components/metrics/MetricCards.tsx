import { Users, AlertTriangle, Clock, UserCheck, Timer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';

interface MetricProps {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  valueClass?: string;
}

function Metric({ label, value, sub, icon: Icon, valueClass }: MetricProps) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-panel p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div
        className={`mt-2 font-mono text-2xl font-bold ${
          valueClass ?? 'text-slate-100'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 truncate text-xs text-slate-500">{sub}</div>
    </div>
  );
}

export function MetricCards() {
  const { zoneList, predictions, staff } = useCommandCenter();

  const totalCrowd = zoneList.reduce((sum, z) => sum + z.current, 0);
  const totalCapacity = zoneList.reduce((sum, z) => sum + z.capacity, 0);

  const atRisk = zoneList.filter((z) => {
    const level = predictions[z.id].riskLevel;
    return level === 'high' || level === 'critical';
  }).length;

  const longestQueue = zoneList.reduce((a, b) =>
    b.queueMin > a.queueMin ? b : a
  );

  // Soonest predicted breach among zones (within the next hour)
  let nextBreach: { name: string; min: number } | null = null;
  for (const z of zoneList) {
    const eta = predictions[z.id].timeToCapacityMin;
    if (eta !== null && eta <= 60 && (nextBreach === null || eta < nextBreach.min)) {
      nextBreach = { name: z.name, min: eta };
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Metric
        label="Total Crowd"
        value={Math.round(totalCrowd).toLocaleString()}
        sub={`of ${totalCapacity.toLocaleString()} capacity`}
        icon={Users}
      />
      <Metric
        label="Zones at Risk"
        value={String(atRisk)}
        sub="high or critical"
        icon={AlertTriangle}
        valueClass={atRisk > 0 ? 'text-risk-high' : 'text-risk-normal'}
      />
      <Metric
        label="Longest Queue"
        value={`${longestQueue.queueMin} min`}
        sub={longestQueue.name}
        icon={Clock}
        valueClass={longestQueue.queueMin >= 15 ? 'text-risk-critical' : undefined}
      />
      <Metric
        label="Staff Deployed"
        value={`${staff.deployed} / ${staff.total}`}
        sub={`${staff.available} available`}
        icon={UserCheck}
      />
      <Metric
        label="Next Breach"
        value={nextBreach ? `~${nextBreach.min.toFixed(1)} min` : 'None'}
        sub={nextBreach ? nextBreach.name : 'no breach predicted'}
        icon={Timer}
        valueClass={nextBreach ? 'text-risk-critical' : 'text-risk-normal'}
      />
    </div>
  );
}