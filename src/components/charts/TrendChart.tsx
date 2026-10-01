import { useMemo, useState } from 'react';
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
import type { ZoneId } from '@/types';
import { useCommandCenter } from '@/state/CommandCenterProvider';
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
}

const SHOWN_HISTORY = 12; // past readings shown
const FORECAST_TICKS = 6; // future readings shown

export function TrendChart() {
  const { zoneList, zones } = useCommandCenter();
  const [selected, setSelected] = useState<ZoneId>('gate-b');
  const zone = zones[selected];

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
    return rows;
  }, [zone]);

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
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={tickLabel}
              stroke="#64748b"
              fontSize={11}
            />
            <YAxis
              domain={[
                (dataMin: number) => Math.floor((dataMin * 0.9) / 100) * 100,
                zone.capacity,
              ]}
              tickFormatter={(v: number) => v.toLocaleString()}
              stroke="#64748b"
              fontSize={11}
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(t) => tickLabel(Number(t))}
              formatter={(value) => Math.round(Number(value)).toLocaleString()}
            />
            <ReferenceLine
              y={zone.capacity}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{
                value: 'Capacity',
                fill: '#ef4444',
                fontSize: 11,
                position: 'insideTopLeft',
              }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke="#f97316"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}