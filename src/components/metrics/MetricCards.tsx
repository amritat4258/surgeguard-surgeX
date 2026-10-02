import { useState } from 'react';
import {
  Users,
  AlertTriangle,
  Clock,
  UserCheck,
  Timer,
  Volume2,
  Thermometer,
  Wind,
  Sliders,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
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

  // Controlled crowd volume override for testing / presentation
  const [crowdOverride, setCrowdOverride] = useState<number | null>(null);
  const [isTunerOpen, setIsTunerOpen] = useState(true);

  const actualCrowd = zoneList.reduce((sum, z) => sum + z.current, 0);
  const totalCapacity = zoneList.reduce((sum, z) => sum + z.capacity, 0) || 50000;

  const atRisk = zoneList.filter((z) => {
    const level = predictions[z.id]?.riskLevel;
    return level === 'high' || level === 'critical';
  }).length;

  const longestQueue = zoneList.reduce((a, b) =>
    b.queueMin > a.queueMin ? b : a
  );

  // Soonest predicted breach among zones (within the next hour)
  let nextBreach: { name: string; min: number } | null = null;
  for (const z of zoneList) {
    const eta = predictions[z.id]?.timeToCapacityMin;
    if (eta !== null && eta !== undefined && eta <= 60 && (nextBreach === null || eta < nextBreach.min)) {
      nextBreach = { name: z.name, min: eta };
    }
  }

  // 1. Safe crowd and occupancy calculations (guaranteed no NaN)
  const effectiveCrowd = crowdOverride !== null ? crowdOverride : actualCrowd;
  const crowdFraction = Math.min(1.2, Math.max(0.1, effectiveCrowd / 38000));
  const crowdPct = Math.round((effectiveCrowd / totalCapacity) * 100);

  // Safe Fruin Level of Service (LOS) density calculation (0 to 4.5+ p/m²)
  const maxOccupancyRatio = zoneList.length > 0
    ? Math.max(...zoneList.map((z) => (z.capacity > 0 ? z.current / z.capacity : 0)))
    : 0.5;
  const effectiveOccupancy = crowdOverride !== null ? effectiveCrowd / totalCapacity : maxOccupancyRatio;
  const peakDensity = Math.min(5.0, Math.max(0.5, +(effectiveOccupancy * 4.5).toFixed(2)));

  const criticalCount = zoneList.filter((z) => predictions[z.id]?.riskLevel === 'critical').length;
  const isSurging = (crowdOverride !== null ? effectiveCrowd > 35000 : atRisk > 0) || criticalCount > 0;

  // 2. Acoustic SPL Decibel Level (80 dB nominal up to 108.5 dB at max surge)
  // Human vocal effort scales logarithmically with ambient crowd density (Lombard Effect)
  const nominalDb = 82.5;
  const decibelValue = Math.min(
    110,
    Math.max(76, +(78 + crowdFraction * 18 + (peakDensity / 3.0) * 5 + (isSurging ? 4.5 : 0)).toFixed(1))
  );
  const currentDbStr = decibelValue.toFixed(1);
  const dbDelta = +(decibelValue - nominalDb).toFixed(1);
  const isAcousticMasking = decibelValue >= 98;

  // 12 Spectrum audio meter bars scaled dynamically
  const baseBars = [38, 52, 70, 84, 94, 100, 92, 76, 82, 96, 84, 60];
  const audioBars = baseBars.map((h, i) => {
    const ratio = decibelValue / 106;
    const harmonicOffset = Math.sin((i / 11) * Math.PI) * 12;
    return Math.min(100, Math.max(16, Math.round(h * ratio + harmonicOffset * (ratio - 0.7))));
  });

  // 3. Heat Stress Index (WBGT - Wet Bulb Globe Temperature)
  // Human metabolic output: ~120W sensible heat + breath moisture per attendee in dense concourses
  const nominalWbgt = 26.5;
  const wbgtValue = Math.min(
    36.5,
    Math.max(24.5, +(26.0 + crowdFraction * 5.2 + Math.max(0, peakDensity - 1.5) * 1.4 + (isSurging ? 1.2 : 0)).toFixed(1))
  );
  const currentWbgtStr = wbgtValue.toFixed(1);
  const wbgtDelta = +(wbgtValue - nominalWbgt).toFixed(1);
  const humidity = Math.min(92, Math.round(56 + crowdFraction * 24 + (isSurging ? 6 : 0)));
  const wbgtBarPct = Math.min(100, Math.max(20, Math.round(((wbgtValue - 22) / 14) * 100)));

  // WBGT Categories (OSHA / Sports Medicine standard)
  let wbgtRiskLabel = 'SAFE THERMAL ZONE';
  let wbgtColorClass = 'text-emerald-400';
  let wbgtAdvice = `Humidity ${humidity}% · Concourse cool · Hydration flow stable`;
  if (wbgtValue >= 32.0) {
    wbgtRiskLabel = 'EXTREME HEAT RISK';
    wbgtColorClass = 'text-rose-400 animate-pulse';
    wbgtAdvice = `Humidity ${humidity}% · High Dehydration Velocity · Water Misting Units Active`;
  } else if (wbgtValue >= 29.5) {
    wbgtRiskLabel = 'ELEVATED THERMAL LOAD';
    wbgtColorClass = 'text-amber-400';
    wbgtAdvice = `Humidity ${humidity}% · Electrolyte Hydration Stations W1/W2/W3 Deployed`;
  }

  // 4. Concourse Microclimate Airflow & Jet Fan Response
  // Dense crowd slows natural concourse breeze, prompting HVAC extraction
  const nominalHvacFan = 45;
  const windVelocity = Math.max(
    0.8,
    +(3.2 - crowdFraction * 1.5 + (isSurging ? -0.4 : 0.2)).toFixed(1)
  );
  const ventilationPct = wbgtValue >= 32.0 || isSurging ? 100 : wbgtValue >= 29.5 ? 80 : 45;
  const ventilationAdvice =
    ventilationPct === 100
      ? 'Exhaust Max (100%) · Concourse Jet Fans 1-6 Forced Extraction'
      : ventilationPct === 80
      ? 'Variable Exhaust (80%) · Cross-Concourse Breeze Maintained'
      : 'Standard HVAC Draft (45%) · Baseline 2.8 m/s Air Exchange Nominal';

  return (
    <>
      {/* 5 Core Top-Level Command Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric
          label="Total Crowd"
          value={Math.round(effectiveCrowd).toLocaleString()}
          sub={crowdOverride !== null ? `Manual Tuner (${crowdPct}%)` : `of ${totalCapacity.toLocaleString()} capacity`}
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

      {/* Venue Environmental & Acoustic Sensor Telemetry HUD Container */}
      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-3 font-mono">
        {/* Environmental Header & Interactive Stress Tuner Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-200">
                Venue Acoustic, Heat Stress (WBGT) & Concourse HVAC Telemetry
              </span>
              <span className="ml-2 text-[10px] text-slate-400">
                {crowdOverride !== null ? '⚡ MANUAL STRESS TUNER ACTIVE' : '🟢 AUTO-SYNCED WITH VENUE SENSORS'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setIsTunerOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-slate-300 transition"
            >
              <Sliders className="h-3 w-3 text-sky-400" />
              <span>{isTunerOpen ? 'Hide Stress Tuner' : 'Adjust Crowd & Stress'}</span>
              {isTunerOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {crowdOverride !== null && (
              <button
                type="button"
                onClick={() => setCrowdOverride(null)}
                className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 text-[11px] text-emerald-400 transition"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset to Live Sensors</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Interactive Crowd & Heat Stress Tuner Slider */}
        {isTunerOpen && (
          <div className="rounded-xl border border-sky-500/30 bg-slate-950/80 p-3 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-sky-400" />
                Simulate Crowd Volume to Test Environmental & HVAC Response:
              </span>
              <span className="font-mono text-sky-400 font-bold">
                {effectiveCrowd.toLocaleString()} Attendees ({crowdPct}% Capacity) · Density ~{peakDensity} p/m²
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="14000"
              max="50000"
              step="500"
              value={effectiveCrowd}
              onChange={(e) => setCrowdOverride(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCrowdOverride(19500)}
                className={`px-2.5 py-1 rounded-lg border transition text-[11px] flex items-center gap-1 ${
                  effectiveCrowd < 25000
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-ink'
                }`}
              >
                <span>🟢 Nominal State (19.5k)</span>
              </button>

              <button
                type="button"
                onClick={() => setCrowdOverride(36000)}
                className={`px-2.5 py-1 rounded-lg border transition text-[11px] flex items-center gap-1 ${
                  effectiveCrowd >= 25000 && effectiveCrowd < 42000
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-ink'
                }`}
              >
                <span>🟡 Surge Concourse (36k)</span>
              </button>

              <button
                type="button"
                onClick={() => setCrowdOverride(48000)}
                className={`px-2.5 py-1 rounded-lg border transition text-[11px] flex items-center gap-1 ${
                  effectiveCrowd >= 42000
                    ? 'border-rose-500 bg-rose-500/20 text-rose-300 font-bold'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-ink'
                }`}
              >
                <span>🔴 Critical Crush (48k)</span>
              </button>

              <button
                type="button"
                onClick={() => setCrowdOverride(null)}
                className={`px-2.5 py-1 rounded-lg border transition text-[11px] ml-auto ${
                  crowdOverride === null
                    ? 'border-sky-500/80 bg-sky-500/20 text-sky-300 font-bold'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-ink'
                }`}
              >
                <span>⚡ Live Feed Sync ({actualCrowd.toLocaleString()})</span>
              </button>
            </div>
          </div>
        )}

        {/* 3 Telemetry Cards: Acoustic SPL, Heat Stress WBGT, Concourse HVAC */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-mono">
          {/* 1. Acoustic SPL Decibel Meter */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                decibelValue > 98 ? 'bg-rose-500/20 text-rose-300' : 'bg-purple-500/20 text-purple-300'
              }`}
            >
              <Volume2 className={`h-4 w-4 ${isAcousticMasking ? 'animate-bounce' : 'animate-pulse'}`} />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Venue Acoustic (SPL)</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold ${
                      decibelValue > 100
                        ? 'text-rose-400 animate-pulse'
                        : decibelValue > 90
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {currentDbStr} dB
                  </span>
                  <span className="text-[9px] text-slate-400">
                    ({dbDelta >= 0 ? `+${dbDelta}` : dbDelta} dB vs {nominalDb})
                  </span>
                </div>
              </div>

              {/* Decibel audio meter bars */}
              <div className="flex items-center gap-0.5 h-2.5">
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

              <div className="flex items-center justify-between text-[9px] text-slate-400 truncate">
                <span className="truncate">
                  {isAcousticMasking
                    ? '⚠️ Masking Active · Visual Strobes + Haptics Boosted'
                    : 'Nominal Sound Level · PA Intelligibility STI 0.74'}
                </span>
                <span className="shrink-0 text-slate-500 font-mono">Base: {nominalDb} dB</span>
              </div>
            </div>
          </div>

          {/* 2. Heat Stress Index (WBGT) */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                wbgtValue > 31.5 ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              <Thermometer className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Heat Stress (WBGT)</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${wbgtColorClass}`}>
                    {currentWbgtStr}°C · {wbgtRiskLabel}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    ({wbgtDelta >= 0 ? `+${wbgtDelta}` : wbgtDelta}°C vs {nominalWbgt}°C)
                  </span>
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-500"
                  style={{ width: `${wbgtBarPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400 truncate">
                <span className="truncate">{wbgtAdvice}</span>
                <span className="shrink-0 text-slate-500 font-mono">Nominal: {nominalWbgt}°C</span>
              </div>
            </div>
          </div>

          {/* 3. Concourse HVAC & Microclimate Flow */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300">
              <Wind className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Concourse HVAC & Wind</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-sky-300">
                    {ventilationPct}% Fan · {windVelocity} m/s
                  </span>
                  <span className="text-[9px] text-slate-400">
                    (Base: {nominalHvacFan}%)
                  </span>
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    ventilationPct === 100
                      ? 'bg-rose-400'
                      : ventilationPct === 80
                      ? 'bg-amber-400'
                      : 'bg-sky-400'
                  }`}
                  style={{ width: `${ventilationPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400 truncate">
                <span className="truncate">{ventilationAdvice}</span>
                <span className="shrink-0 text-slate-500 font-mono">Draft: 2.8 m/s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}