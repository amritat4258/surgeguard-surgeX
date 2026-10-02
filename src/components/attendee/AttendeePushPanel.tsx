import { useState } from 'react';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import type { BroadcastSeverity } from '@/data/appMessages';

const PRESETS: { label: string; title: string; body: string; severity: BroadcastSeverity }[] = [
  {
    label: 'Gate B crowded: use Gate C',
    title: 'Gate B is very crowded',
    body: 'Please use Gate C instead. Staff are guiding you there.',
    severity: 'warning',
  },
  {
    label: 'Stay calm notice',
    title: 'Please stay calm',
    body: 'Everything is under control. Follow staff directions and keep walkways clear.',
    severity: 'info',
  },
  {
    label: 'Clear the aisle',
    title: 'Keep the centre aisle clear',
    body: 'Emergency responders need access. Please move to the sides.',
    severity: 'critical',
  },
];

const SEV_CLASS: Record<BroadcastSeverity, string> = {
  info: 'text-sky-300',
  warning: 'text-amber-300',
  critical: 'text-rose-300',
};

export function AttendeePushPanel() {
  const { mode, feedStatus, pushBroadcast, pushLog, phoneSOSCount } = useCommandCenter();
  const [text, setText] = useState('');
  const [severity, setSeverity] = useState<BroadcastSeverity>('info');
  const [error, setError] = useState<string | null>(null);

  const connected = mode === 'live' && feedStatus === 'live';

  const send = (title: string, body: string, sev: BroadcastSeverity) => {
    const ok = pushBroadcast(title, body, sev);
    setError(ok ? null : 'Not connected to the gateway, so nothing was sent.');
    return ok;
  };

  return (
    <section className="rounded-xl border border-surface-border bg-surface-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
          Attendee phones
        </h2>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span
            className={`rounded px-2 py-0.5 border ${
              connected
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
            }`}
          >
            {connected ? 'GATEWAY CONNECTED' : mode === 'sim' ? 'SIMULATION MODE' : feedStatus.toUpperCase()}
          </span>
          <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-300">
            SOS from phones: {phoneSOSCount}
          </span>
        </div>
      </div>

      {mode === 'sim' && (
        <p className="mt-2 text-xs text-amber-300">
          Phones cannot connect in Simulation mode. Switch to Live in the Demo Deck.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => send(p.title, p.body, p.severity)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          placeholder="Type a custom message to all phones"
          className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500"
        />
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as BroadcastSeverity)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100"
        >
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => {
            if (send('Message from control room', text.trim(), severity)) setText('');
          }}
          className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-40"
        >
          Push
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}

      {pushLog.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-slate-800 pt-2">
          {pushLog.map((p) => (
            <li key={p.at} className="text-[11px] text-slate-400">
              <span className="font-mono">{new Date(p.at).toLocaleTimeString()}</span>{' '}
              <span className={`font-semibold ${SEV_CLASS[p.severity]}`}>{p.title}</span>
              {' - '}
              {p.body}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
