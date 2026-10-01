import {
  Users,
  AlertTriangle,
  Clock,
  UserCheck,
  Timer,
  Volume2,
  Thermometer,
  Wind,
} from 'lucide-react';
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
    <>
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

    {/* Venue Environmental & Acoustic Sensor Telemetry HUD */}
    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs font-mono">
      {/* Acoustic SPL Decibel Meter */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300">
          <Volume2 className="h-4 w-4 animate-pulse" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Venue Acoustic (SPL)</span>
            <span className="text-[10px] font-bold text-amber-400">104.8 dB</span>
          </div>
          {/* Decibel audio meter bars */}
          <div className="mt-1 flex items-center gap-0.5 h-2">
            {[40, 55, 70, 85, 95, 100, 90, 75, 80, 100, 85, 60].map((h, i) => (
              <div
                key={i}
                className={`w-full rounded-sm transition-all duration-300 ${
                  h > 90 ? 'bg-rose-500' : h > 75 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <p className="mt-1 text-[9px] text-slate-400 truncate">
            Acoustic Masking Active · Visual Strobes + Haptics Boosted
          </p>
        </div>
      </div>

      {/* Heat Stress Index (WBGT) */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
          <Thermometer className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Heat Stress (WBGT)</span>
            <span className="text-[10px] font-bold text-rose-400">31.8°C · HIGH RISK</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500" style={{ width: '78%' }} />
          </div>
          <p className="mt-1 text-[9px] text-slate-400 truncate">
            Humidity 74% · Free Electrolyte Stations Deployed at W1/W2/W3
          </p>
        </div>
      </div>

      {/* Microclimate & Wind Dispersion */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300">
          <Wind className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Microclimate & Wind</span>
            <span className="text-[10px] font-bold text-sky-300">2.1 m/s · NW Flow</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-sky-400" style={{ width: '42%' }} />
          </div>
          <p className="mt-1 text-[9px] text-slate-400 truncate">
            Dispersal Favorable · Concourse Ventilation Operating at 100%
          </p>
        </div>
      </div>
    </div>
  </>
  );
}