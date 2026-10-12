import { Play, Pause, RotateCcw, ShieldAlert, Siren, Megaphone, Smartphone, Camera } from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import { ThemeToggle } from '@/theme/ThemeToggle';
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
    setIsAttendeeModalOpen,
    openCCTV,
    runSurgeScenario,
    pause,
    resume,
    reset,
  } = useCommandCenter();
  const isLive = mode === 'live';
  const look = isLive ? feedLook[feedStatus] : statusLook[status];
  const showPulse = isLive ? feedLook[feedStatus].pulse : status === 'running';

  return (
    <header className="border-b border-surface-border bg-surface-panel px-3 sm:px-6 py-2.5 sm:py-3.5 space-y-2.5 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-3">
      {/* Top row: Brand + Status/Clock + ThemeToggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ShieldAlert className="h-6 w-6 sm:h-7 sm:w-7 text-info shrink-0" />
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink leading-tight">
              SurgeGuard
            </h1>
            <p className="hidden sm:block text-xs text-muted">
              Predictive crowd command center
            </p>
          </div>
        </div>

        {/* Status + clock + SOS badge + Theme toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {activeSOS && (
            <button
              type="button"
              onClick={() => setIsSOSModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-rose-500/80 bg-rose-600/25 px-2.5 sm:px-3 py-1 font-mono text-[11px] sm:text-xs font-bold text-rose-300 animate-pulse shadow-md shadow-rose-600/30 hover:bg-rose-600/40 transition shrink-0"
            >
              <Siren className="h-3.5 w-3.5 text-rose-400 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
              <span>SOS: {activeSOS.type.replace('-', ' ').toUpperCase()}</span>
            </button>
          )}

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold tracking-wide shrink-0 ${look.cls}`}
          >
            {showPulse && (
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-risk-normal animate-pulse-slow shrink-0" />
            )}
            {look.label}
          </span>

          <span className="font-mono text-xs text-slate-400 shrink-0">
            {isLive
              ? `${tick} updates`
              : `T+${simulatedMinutes}m`}
          </span>

          <div className="lg:hidden shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Controls: Horizontal scrollable strip on mobile, wrapped flex on desktop */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 w-full lg:w-auto lg:overflow-visible lg:flex-wrap">
        <div className="hidden lg:block shrink-0">
          <ThemeToggle />
        </div>

        {/* 0a. Mobile Attendee App Preview */}
        <button
          type="button"
          onClick={() => setIsAttendeeModalOpen(true)}
          className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-mono font-bold text-emerald-300 hover:bg-emerald-900/60 hover:text-ink transition hover:scale-105 active:scale-95 shadow-sm"
          title="Attendee mobile app — live stall wait times"
        >
          <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
          <span>ATTENDEE APP</span>
        </button>

        {/* 0b. Automated CCTV Intelligence & Vision AI */}
        <button
          type="button"
          onClick={() => openCCTV('gate-b')}
          className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-900/60 hover:text-ink transition hover:scale-105 active:scale-95 shadow-sm"
          title="Automated CCTV Intelligence & Vision AI (Live Camera Tracking)"
        >
          <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400 shrink-0" />
          <span>CCTV AI</span>
          <span className="hidden sm:inline-block rounded bg-cyan-900/80 border border-cyan-400/50 px-1 py-0.2 text-[9px] text-cyan-200">
            60 FPS
          </span>
        </button>

        {/* 1. Stadium PA & Digital Screens */}
        <button
          type="button"
          onClick={() => setIsBroadcastModalOpen(true)}
          className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-lg border border-purple-500/40 bg-purple-950/40 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-mono font-bold text-purple-300 hover:bg-purple-900/60 hover:text-ink transition hover:scale-105 active:scale-95 shadow-sm"
          title="Inside stadium speakers & digital signage"
        >
          <Megaphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400 shrink-0" />
          <span>PA & SCREENS</span>
        </button>

        {/* 2. Mumbai Police & BMC Disaster Cell */}
        <button
          type="button"
          onClick={() => setIsPoliceModalOpen(true)}
          className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-lg border border-sky-500/40 bg-sky-950/40 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-mono font-bold text-sky-300 hover:bg-sky-900/60 hover:text-ink transition hover:scale-105 active:scale-95 shadow-sm"
          title="Outside city traffic & Green Corridor"
        >
          <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-400 shrink-0" />
          <span>POLICE / BMC</span>
        </button>

        {/* 3. On-Site Paramedic Dispatch & Emergency SOS */}
        <button
          type="button"
          onClick={() => setIsSOSModalOpen(true)}
          className={`inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-mono font-bold transition hover:scale-105 active:scale-95 shadow-sm ${
            activeSOS
              ? 'border-rose-500 bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
              : 'border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:text-ink'
          }`}
          title="On-site paramedic dispatch"
        >
          <Siren className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${activeSOS ? 'animate-spin' : 'text-rose-400'}`} style={{ animationDuration: '3s' }} />
          <span>EMERGENCY SOS</span>
        </button>

        {/* Scenario Controls */}
        {!isLive && status === 'idle' && (
          <button
            onClick={runSurgeScenario}
            className="btn-primary shrink-0 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold"
          >
            <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>Run Surge</span>
          </button>
        )}
        {!isLive && status === 'running' && (
          <button
            onClick={pause}
            className="btn-tool shrink-0 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold"
          >
            <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>Pause</span>
          </button>
        )}
        {!isLive && status === 'paused' && (
          <button
            onClick={resume}
            className="btn-tool shrink-0 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold"
          >
            <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>Resume</span>
          </button>
        )}
        <button
          onClick={reset}
          className="btn border border-surface-border text-ink hover:bg-surface-raised shrink-0 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold"
        >
          <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
}