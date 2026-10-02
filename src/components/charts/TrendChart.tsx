import { useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Zone, ZoneId } from '@/types';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import { useChartColors } from '@/theme/ThemeProvider';
import { getForecastSeries, getForecastStepMin } from '@/engine/prediction';
import {
  MINUTES_PER_TICK,
  LIVE_CHART_PAST_MIN,
  LIVE_CHART_FORECAST_MIN,
} from '@/config/scenario';

interface Row {
  t: number; // minutes relative to now (negative = past)
  actual?: number;
  forecast?: number;
  withoutPlan?: number; // what would have happened with no action
}

const SHOWN_HISTORY = 12; // past readings shown
const FORECAST_TICKS = 6; // future readings shown

export function TrendChart() {
  const { zoneList, zones, execution, simulatedMinutes } = useCommandCenter();
  const [selected, setSelected] = useState<ZoneId>('gate-b');
  const c = useChartColors();
  const zone = zones[selected];

  // Keep the last zone snapshot from BEFORE the plan was executed, so we can
  // keep drawing the "no action" forecast afterwards.
  const preExecZones = useRef<Record<ZoneId, Zone> | null>(null);
  if (!execution) preExecZones.current = zones;
  const frozen =
    execution && execution.sourceZoneId === selected && !zone.historyTimes
      ? preExecZones.current?.[selected] ?? null
      : null;

  const data = useMemo(() => {
    const rows: Row[] = [];
    const times = zone.historyTimes;
    let horizon = FORECAST_TICKS;
    let step = MINUTES_PER_TICK;

    if (times) {
      // Live mode: x axis is real sensor time, in minutes relative to now
      const latest = times[times.length - 1];
      zone.history.forEach((value, i) => {
        const t = (times[i] - latest) / 60_000;
        if (t >= -LIVE_CHART_PAST_MIN) rows.push({ t, actual: Math.round(value) });
      });
      step = getForecastStepMin(zone);
      horizon = Math.round(LIVE_CHART_FORECAST_MIN / step);
    } else {
      const recent = zone.history.slice(-SHOWN_HISTORY);
      const n = recent.length;
      recent.forEach((value, i) => {
        rows.push({ t: (i - (n - 1)) * MINUTES_PER_TICK, actual: Math.round(value) });
      });
    }

    const forecast = getForecastSeries(zone, horizon);
    if (forecast.length > 0 && rows.length > 0) {
      // start the forecast line at "now" so the two lines connect
      rows[rows.length - 1].forecast = Math.round(zone.current);
      forecast.forEach((value, i) => {
        rows.push({ t: (i + 1) * step, forecast: value });
      });
    }

    // "Without SurgeGuard": the forecast frozen at the moment of execution,
    // drawn from that moment onward (sim mode only).
    if (frozen && execution) {
      const elapsed = Math.max(0, simulatedMinutes - execution.executedAtMinutes);
      const start = -elapsed;
      const firstT = rows.length > 0 ? rows[0].t : start;
      const series = getForecastSeries(frozen, FORECAST_TICKS * 2);
      if (series.length > 0) {
        const pts = [Math.round(frozen.current), ...series];
        pts.forEach((value, i) => {
          const t = start + i * MINUTES_PER_TICK;
          if (t >= firstT) rows.push({ t, withoutPlan: value });
        });
      }
    }
    rows.sort((a, b) => a.t - b.t);
    return rows;
  }, [zone, frozen, execution, simulatedMinutes]);

  const tickLabel = (t: number) =>
    t === 0 ? 'now' : `${t > 0 ? '+' : ''}${Math.round(t * 10) / 10}m`;

  return (
    <div className="rounded-xl border border-surface-border bg-surface-panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Crowd Trend &amp; Forecast
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {zoneList.map((z) => (
            <button
              key={z.id}
              onClick={() => setSelected(z.id)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                z.id === selected
                  ? 'border-info bg-info/15 text-info'
                  : 'border-surface-border text-slate-400 hover:bg-surface-raised'
              }`}
            >
              {z.name}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={tickLabel}
              stroke={c.axis}
              fontSize={11}
            />
            <YAxis
              domain={[
                (dataMin: number) => Math.floor((dataMin * 0.9) / 100) * 100,
                zone.capacity,
              ]}
              tickFormatter={(v: number) => v.toLocaleString()}
              stroke={c.axis}
              fontSize={11}
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: c.tooltipBg,
                border: '1px solid ' + c.tooltipBorder,
                color: c.tooltipText,
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(t) => tickLabel(Number(t))}
              formatter={(value) => Math.round(Number(value)).toLocaleString()}
            />
            <ReferenceLine
              y={zone.capacity}
              stroke={c.danger}
              strokeDasharray="4 4"
              label={{
                value: 'Capacity',
                fill: c.danger,
                fontSize: 11,
                position: 'insideTopLeft',
              }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke={c.actual}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke={c.forecast}
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
            {frozen && (
              <Line
                type="monotone"
                dataKey="withoutPlan"
                name="Without SurgeGuard"
                stroke={c.danger}
                strokeWidth={2.5}
                strokeDasharray="2 4"
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {frozen && (
        <p className="mt-2 text-xs text-slate-400">
          <span className="font-semibold text-red-400">Red dotted line:</span> where{' '}
          {zone.name} was heading if no action had been taken.
        </p>
      )}
    </div>
  );
}