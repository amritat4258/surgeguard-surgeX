import { useState } from 'react';
import { ArrowRight, TrendingDown, FileText } from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import { IncidentReportModal } from '@/components/reports/IncidentReportModal';

interface RowProps {
  label: string;
  before: string;
  after: string;
  delta: string;
  good: boolean;
}

function Row({ label, before, after, delta, good }: RowProps) {
  return (
    <div className="grid grid-cols-[1.2fr_1fr_auto_1fr_auto] items-center gap-3 border-b border-surface-border py-3 last:border-b-0">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="text-right font-mono text-lg font-bold text-risk-critical">
        {before}
      </span>
      <ArrowRight className="h-4 w-4 text-slate-500" />
      <span className="font-mono text-lg font-bold text-risk-normal">
        {after}
      </span>
      <span
        className={`rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold ${
          good
            ? 'border-risk-normal/40 bg-risk-normal/15 text-risk-normal'
            : 'border-surface-border bg-surface-raised text-slate-400'
        }`}
      >
        {delta}
      </span>
    </div>
  );
}

function signed(n: number, unit: string): string {
  const rounded = Math.round(n);
  return `${rounded > 0 ? '+' : ''}${rounded} ${unit}`;
}

export function ImpactPanel() {
  const { execution, zones, alerts } = useCommandCenter();
  const [isReportOpen, setIsReportOpen] = useState(false);

  if (!execution) return null;

  const source = zones[execution.sourceZoneId];
  const target = execution.targetZoneId ? zones[execution.targetZoneId] : null;
  const { before, after, targetBefore, targetAfter } = execution;

  const resolved = alerts.some(
    (a) => a.zoneId === execution.sourceZoneId && a.status === 'resolved'
  );

  return (
    <>
      <section className="rounded-xl border border-risk-normal/40 bg-surface-panel p-4 shadow-panel-glow">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <TrendingDown className="h-4 w-4" />
            Measured Impact: {source.name}
          </h2>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-500">
              {execution.redirectPeople.toLocaleString()} people redirected
            </span>
            {resolved && (
              <span className="rounded-full border border-risk-normal/40 bg-risk-normal/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-risk-normal">
                ALERT RESOLVED
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-info/40 bg-info/10 px-2.5 py-1 text-xs font-semibold text-info hover:bg-info/20 transition shadow-sm"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Export Audit Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1.2fr_1fr_auto_1fr_auto] gap-3 text-[11px] uppercase tracking-wide text-slate-500">
          <span />
          <span className="text-right">Before</span>
          <span />
          <span>After</span>
          <span />
        </div>

        <Row
          label={`${source.name} occupancy`}
          before={`${before.occupancyPct.toFixed(0)}%`}
          after={`${after.occupancyPct.toFixed(0)}%`}
          delta={signed(after.occupancyPct - before.occupancyPct, 'pts')}
          good
        />
        <Row
          label="Queue time"
          before={`${before.queueMin} min`}
          after={`${after.queueMin} min`}
          delta={signed(after.queueMin - before.queueMin, 'min')}
          good
        />
        <Row
          label={`Staff at ${source.name}`}
          before={String(before.staff)}
          after={String(after.staff)}
          delta={signed(after.staff - before.staff, 'staff')}
          good
        />
        {target && targetBefore && targetAfter && (
          <Row
            label={`${target.name} occupancy (receiving)`}
            before={`${targetBefore.occupancyPct.toFixed(0)}%`}
            after={`${targetAfter.occupancyPct.toFixed(0)}%`}
            delta={signed(targetAfter.occupancyPct - targetBefore.occupancyPct, 'pts')}
            good={false}
          />
        )}
      </section>

      <IncidentReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </>
  );
}