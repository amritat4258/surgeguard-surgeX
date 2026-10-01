import { Bell, CheckCircle2 } from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import { riskStyles } from '@/components/zones/riskStyles';
import type { AlertStatus } from '@/types';

const statusLabel: Record<AlertStatus, string> = {
  active: 'ACTIVE',
  acknowledged: 'ACKNOWLEDGED',
  resolved: 'RESOLVED',
};

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function AlertsPanel() {
  const { alerts, acknowledgeAlert } = useCommandCenter();
  const openCount = alerts.filter((a) => a.status !== 'resolved').length;

  return (
    <div className="rounded-xl border border-surface-border bg-surface-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          <Bell className="h-4 w-4" />
          Alerts
        </h2>
        <span className="font-mono text-xs text-slate-500">{openCount} open</span>
      </div>

      {alerts.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No alerts. All zones are within safe range.
        </p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => {
            const style = riskStyles[alert.riskLevel];
            const resolved = alert.status === 'resolved';
            return (
              <li
                key={alert.id}
                className={`rounded-lg border p-3 ${
                  resolved
                    ? 'border-surface-border bg-surface-base/40 opacity-60'
                    : `bg-surface-raised ${style.border}`
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${
                      resolved
                        ? 'border-risk-normal/40 bg-risk-normal/15 text-risk-normal'
                        : style.badge
                    }`}
                  >
                    {resolved && <CheckCircle2 className="h-3 w-3" />}
                    {resolved ? 'RESOLVED' : style.label}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {formatTime(alert.raisedAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-200">{alert.message}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] tracking-wide text-slate-500">
                    {statusLabel[alert.status]}
                  </span>
                  {alert.status === 'active' && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="rounded-md border border-surface-border px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-surface-border"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}