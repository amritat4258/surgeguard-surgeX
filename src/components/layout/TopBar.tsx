import { Play, Pause, RotateCcw, ShieldAlert, Siren, Megaphone } from 'lucide-react';
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
    setIsSOSModalOpen,
    setIsPoliceModalOpen,
    setIsBroadcastModalOpen,
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
          <button
            type="button"
            onClick={() => setIsSOSModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-rose-500/80 bg-rose-600/25 px-3 py-1 font-mono text-xs font-bold text-rose-300 animate-pulse shadow-md shadow-rose-600/30 hover:bg-rose-600/40 transition"
          >
            <Siren className="h-3.5 w-3.5 text-rose-400 animate-spin" style={{ animationDuration: '3s' }} />
            <span>SOS: {activeSOS.type.replace('-', ' ').toUpperCase()}</span>
          </button>
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
        {/* 1. Stadium PA & Digital Screens (Inside stadium speakers & digital signage) */}
        <button
          type="button"
          onClick={() => setIsBroadcastModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-950/40 px-3 py-2 text-xs font-mono font-bold text-purple-300 hover:bg-purple-900/60 hover:text-white transition hover:scale-105 active:scale-95"
          title="Inside stadium speakers & digital signage"
        >
          <Megaphone className="h-4 w-4 text-purple-400" />
          <span>📢 STADIUM PA & SCREENS</span>
        </button>

        {/* 2. Mumbai Police & BMC Disaster Cell (Outside city traffic & Green Corridor) */}
        <button
          type="button"
          onClick={() => setIsPoliceModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-950/40 px-3 py-2 text-xs font-mono font-bold text-sky-300 hover:bg-sky-900/60 hover:text-white transition hover:scale-105 active:scale-95"
          title="Outside city traffic & Green Corridor"
        >
          <ShieldAlert className="h-4 w-4 text-sky-400" />
          <span>🏛️ POLICE / BMC</span>
          <span className="rounded bg-sky-900/80 border border-sky-400/50 px-1.5 py-0.2 text-[9px] text-sky-200">
            CAP v1.2
          </span>
        </button>

        {/* 3. On-Site Paramedic Dispatch & Emergency SOS (On-site paramedic dispatch) */}
        <button
          type="button"
          onClick={() => setIsSOSModalOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-mono font-bold transition hover:scale-105 active:scale-95 ${
            activeSOS
              ? 'border-rose-500 bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
              : 'border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:text-white'
          }`}
          title="On-site paramedic dispatch"
        >
          <Siren className={`h-4 w-4 ${activeSOS ? 'animate-spin' : 'text-rose-400'}`} style={{ animationDuration: '3s' }} />
          <span>🚨 EMERGENCY SOS</span>
          {activeSOS ? (
            <span className="rounded bg-rose-950/90 border border-rose-300 px-1.5 py-0.2 text-[9px] font-mono text-rose-200">
              {activeSOS.status.toUpperCase()}
            </span>
          ) : (
            <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-mono text-slate-400">
              READY
            </span>
          )}
        </button>

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