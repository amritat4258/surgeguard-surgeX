import { Play, Pause, RotateCcw, ShieldAlert, Siren } from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import type { FeedStatus, SimStatus } from '@/types';

const statusLook: Record<SimStatus, { label: string; cls: string }> = {
  idle: {
    label: 'IDLE',
    cls: 'border-surface-border bg-surface-raised text-slate-400',
  },
  running: {
    label: 'SIMULATING',
    cls: 'border-risk-normal/40 bg-risk-normal/15 text-risk-normal',
  },
  paused: {
    label: 'PAUSED',
    cls: 'border-risk-warning/40 bg-risk-warning/15 text-risk-warning',
  },
};

// Live-feed badge (only used when VITE_FEED_URL is set)
const feedLook: Record<FeedStatus, { label: string; cls: string; pulse: boolean }> = {
  connecting: {
    label: 'CONNECTING',
    cls: 'border-surface-border bg-surface-raised text-slate-400',
    pulse: false,
  },
  live: {
    label: 'LIVE FEED',
    cls: 'border-risk-normal/40 bg-risk-normal/15 text-risk-normal',
    pulse: true,
  },
  reconnecting: {
    label: 'RECONNECTING',
    cls: 'border-risk-warning/40 bg-risk-warning/15 text-risk-warning',
    pulse: false,
  },
  stale: {
    label: 'STALE DATA',
    cls: 'border-risk-high/40 bg-risk-high/15 text-risk-high',
    pulse: false,
  },
  offline: {
    label: 'OFFLINE',
    cls: 'border-risk-critical/40 bg-risk-critical/15 text-risk-critical',
    pulse: false,
  },
};

export function TopBar() {
  const {
    status,
    tick,
    simulatedMinutes,
    mode,
    feedStatus,
    activeSOS,
    runSurgeScenario,
    pause,
    resume,
    reset,
  } = useCommandCenter();
  const isLive = mode === 'live';
  const look = isLive ? feedLook[feedStatus] : statusLook[status];
  const showPulse = isLive ? feedLook[feedStatus].pulse : status === 'running';

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border bg-surface-panel px-6 py-4">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-7 w-7 text-info" />
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-100">
            SurgeGuard
          </h1>
          <p className="text-xs text-slate-500">
            Predictive crowd command center
          </p>
        </div>
      </div>

      {/* Status + clock */}
      <div className="flex items-center gap-4">
        {activeSOS && (
          <span className="flex items-center gap-1.5 rounded-full border border-rose-500/80 bg-rose-600/25 px-3 py-1 font-mono text-xs font-bold text-rose-300 animate-pulse shadow-md shadow-rose-600/30">
            <Siren className="h-3.5 w-3.5 text-rose-400 animate-spin" style={{ animationDuration: '3s' }} />
            <span>SOS: {activeSOS.type.replace('-', ' ').toUpperCase()}</span>
          </span>
        )}
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${look.cls}`}
        >
          {showPulse && (
            <span className="h-2 w-2 rounded-full bg-risk-normal animate-pulse-slow" />
          )}
          {look.label}
        </span>
        <span className="font-mono text-sm text-slate-400">
          {isLive
            ? `${tick} live updates`
            : `T+${simulatedMinutes} min · tick ${tick}`}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isLive && status === 'idle' && (
          <button
            onClick={runSurgeScenario}
            className="inline-flex items-center gap-2 rounded-lg bg-info px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
          >
            <Play className="h-4 w-4" />
            Run Surge Scenario
          </button>
        )}
        {!isLive && status === 'running' && (
          <button
            onClick={pause}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-surface-border"
          >
            <Pause className="h-4 w-4" />
            Pause
          </button>
        )}
        {!isLive && status === 'paused' && (
          <button
            onClick={resume}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-surface-border"
          >
            <Play className="h-4 w-4" />
            Resume
          </button>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-surface-raised"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
    </header>
  );
}