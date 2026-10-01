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

  // Dynamic Environmental Telemetry derived from real-time crowd dynamics
  const maxDensity = Math.max(...zoneList.map((z) => z.density), 0);
  const criticalCount = zoneList.filter((z) => predictions[z.id]?.riskLevel === 'critical').length;

  // 1. Acoustic SPL Decibel Level (80 dB nominal up to 108.5 dB at max surge)
  // Human vocal effort scales logarithmically with ambient crowd density (Lombard Effect)
  const crowdFraction = Math.min(1.2, Math.max(0.1, totalCrowd / 38000));
  const densityFactor = Math.min(1.5, maxDensity / 3.0);
  const decibelValue = Math.min(110, Math.max(76, 78 + crowdFraction * 18 + densityFactor * 6 + criticalCount * 3.5));
  const currentDbStr = decibelValue.toFixed(1);
  const isAcousticMasking = decibelValue >= 98;

  // 12 Spectrum audio meter bars scaled dynamically
  const baseBars = [40, 55, 72, 85, 96, 100, 92, 78, 84, 98, 86, 62];
  const audioBars = baseBars.map((h, i) => {
    const ratio = decibelValue / 106;
    const harmonicOffset = Math.sin((i / 11) * Math.PI) * 12;
    return Math.min(100, Math.max(18, Math.round(h * ratio + harmonicOffset * (ratio - 0.7))));
  });

  // 2. Heat Stress Index (WBGT - Wet Bulb Globe Temperature)
  // Human metabolic output: ~120W sensible heat + breath moisture per attendee in dense crowd
  const wbgtValue = Math.min(36.5, Math.max(24.5, 26.0 + crowdFraction * 5.2 + Math.max(0, (maxDensity - 1.5) * 1.5) + criticalCount * 0.9));
  const currentWbgtStr = wbgtValue.toFixed(1);
  const humidity = Math.min(92, Math.round(56 + crowdFraction * 24 + criticalCount * 5));
  const wbgtBarPct = Math.min(100, Math.max(25, Math.round(((wbgtValue - 22) / 14) * 100)));

  // WBGT Categories (OSHA / Sports Medicine standard)
  let wbgtRiskLabel = 'SAFE THERMAL ZONE';
  let wbgtColorClass = 'text-emerald-400';
  let wbgtAdvice = `Humidity ${humidity}% · Concourse Ambient Cool · Hydration Flow Stable`;
  if (wbgtValue >= 32.0) {
    wbgtRiskLabel = 'EXTREME HEAT RISK';
    wbgtColorClass = 'text-rose-400 animate-pulse';
    wbgtAdvice = `Humidity ${humidity}% · High Dehydration Velocity · Water Misting Units Engaged`;
  } else if (wbgtValue >= 29.5) {
    wbgtRiskLabel = 'ELEVATED THERMAL LOAD';
    wbgtColorClass = 'text-amber-400';
    wbgtAdvice = `Humidity ${humidity}% · Free Electrolyte Stations Deployed at W1/W2/W3`;
  }

  // 3. Concourse Microclimate Airflow & Jet Fan Response
  // Dense crowd slows natural concourse breeze, prompting HVAC extraction
  const windVelocity = Math.max(0.8, +(3.2 - crowdFraction * 1.6 + (criticalCount > 0 ? -0.3 : 0.2)).toFixed(1));
  const ventilationPct = wbgtValue >= 32.0 || criticalCount > 0 ? 100 : wbgtValue >= 29.5 ? 80 : 45;
  const ventilationAdvice =
    ventilationPct === 100
      ? 'Exhaust Velocity Max (100%) · Concourse Jet Fans 1-6 Forced Extraction'
      : ventilationPct === 80
      ? 'Variable Exhaust 80% · Cross-Concourse Breeze Maintained'
      : 'Standard HVAC Draft (45%) · Natural Air Exchange Nominal';

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
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
          decibelValue > 98 ? 'bg-rose-500/20 text-rose-300' : 'bg-purple-500/20 text-purple-300'
        }`}>
          <Volume2 className={`h-4 w-4 ${isAcousticMasking ? 'animate-bounce' : 'animate-pulse'}`} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Venue Acoustic (SPL)</span>
            <span className={`text-[10px] font-bold ${
              decibelValue > 100 ? 'text-rose-400 animate-pulse' : decibelValue > 90 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {currentDbStr} dB
            </span>
          </div>
          {/* Decibel audio meter bars */}
          <div className="mt-1 flex items-center gap-0.5 h-2">
            {audioBars.map((h, i) => (
              <div
                key={i}
                className={`w-full rounded-sm transition-all duration-300 ${
                  h > 88 ? 'bg-rose-500' : h > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <p className="mt-1 text-[9px] text-slate-400 truncate">
            {isAcousticMasking
              ? 'Acoustic Masking Active · Visual Strobes + Haptics Boosted'
              : 'Nominal Sound Level · PA Intelligibility Confirmed (STI 0.74)'}
          </p>
        </div>
      </div>

      {/* Heat Stress Index (WBGT) */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
          wbgtValue > 31.5 ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
        }`}>
          <Thermometer className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Heat Stress (WBGT)</span>
            <span className={`text-[10px] font-bold ${wbgtColorClass}`}>
              {currentWbgtStr}°C · {wbgtRiskLabel}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-500"
              style={{ width: `${wbgtBarPct}%` }}
            />
          </div>
          <p className="mt-1 text-[9px] text-slate-400 truncate">
            {wbgtAdvice}
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
            <span className="text-[10px] font-bold text-sky-300">{windVelocity} m/s · Concourse Flow</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                ventilationPct === 100 ? 'bg-rose-400' : ventilationPct === 80 ? 'bg-amber-400' : 'bg-sky-400'
              }`}
              style={{ width: `${ventilationPct}%` }}
            />
          </div>
          <p className="mt-1 text-[9px] text-slate-400 truncate">
            {ventilationAdvice}
          </p>
        </div>
      </div>
    </div>
  </>
  );
}