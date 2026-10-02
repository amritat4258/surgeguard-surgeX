import { Clock, UserCheck, Camera } from 'lucide-react';
import type { Zone, ZonePrediction } from '@/types';
import { riskStyles } from '@/components/zones/riskStyles';
import { useCommandCenter } from '@/state/CommandCenterProvider';

interface ZoneCardProps {
  zone: Zone;
  prediction: ZonePrediction;
}

export function ZoneCard({ zone, prediction }: ZoneCardProps) {
  const { openCCTV } = useCommandCenter();
  const style = riskStyles[prediction.riskLevel];
  const pct = (zone.current / zone.capacity) * 100;
  const barWidth = Math.min(100, Math.max(0, pct));
  const eta = prediction.timeToCapacityMin;

  return (
    <div
      className={`rounded-xl border bg-surface-panel p-4 transition-colors ${style.border} ${style.glow}`}
    >
      {/* Header: name + CCTV button + risk badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-100">
            {zone.name}
          </h3>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {zone.kind}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openCCTV(zone.id)}
            title={`View real-time optical/LIDAR CCTV feed for ${zone.name}`}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/90 px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:border-info hover:text-info transition shadow-sm"
          >
            <Camera className="h-3 w-3 text-info" />
            <span>CCTV</span>
          </button>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${style.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {style.label}
            </span>
          </div>
        </div>

        {/* Occupancy */}
        <div className="mt-4">
          <div className="flex items-end justify-between">
            <span className={`font-mono text-3xl font-bold ${style.text}`}>
              {pct.toFixed(0)}%
            </span>
            <span className="font-mono text-xs text-slate-400">
              {Math.round(zone.current).toLocaleString()} /{' '}
              {zone.capacity.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        {/* Queue + staff */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="font-mono">{zone.queueMin} min</span>
            <span className="text-xs text-slate-500">queue</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <UserCheck className="h-4 w-4 text-slate-500" />
            <span className="font-mono">{zone.staff}</span>
            <span className="text-xs text-slate-500">staff</span>
          </div>
        </div>

        {/* Prediction */}
        <div className="mt-4 border-t border-surface-border pt-3">
          {eta !== null && eta <= 30 ? (
            <p className={`text-sm font-medium ${style.text}`}>
              Capacity in ~{eta.toFixed(1)} min
            </p>
          ) : (
            <p className="text-sm font-medium text-slate-400">
              No breach predicted
            </p>
          )}
          <p className="mt-1 font-mono text-[11px] leading-snug text-slate-500">
            {prediction.explanation}
          </p>
        </div>
      </div>
  );
}