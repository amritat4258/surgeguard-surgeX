import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CloudRain,
  Flame,
  Radio,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Terminal,
  Cpu,
  Trash2,
  Smartphone,
  Camera,
  FileText,
  Siren,
  ShieldAlert,
} from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import { getAlertMuted, setAlertMuted } from '@/lib/audioAlert';
import { PublicBroadcastModal } from '@/components/broadcast/PublicBroadcastModal';
import { CCTVModal } from '@/components/cctv/CCTVModal';
import { IncidentReportModal } from '@/components/reports/IncidentReportModal';

export function ChaosController() {
  const {
    mode,
    setMode,
    feedStatus,
    telemetryLogs,
    clearTelemetry,
    triggerSurge,
    triggerChaos,
    activeSOS,
    triggerSOS,
    setIsSOSModalOpen,
    setIsPoliceModalOpen,
    setSimSpeed,
    reset,
  } = useCommandCenter();

  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isCCTVModalOpen, setIsCCTVModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMuted, setIsMutedState] = useState(getAlertMuted());
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [filterZone, setFilterZone] = useState<string>('all');

  const toggleMute = () => {
    const next = !isMuted;
    setIsMutedState(next);
    setAlertMuted(next);
  };

  const handleSpeed = (mult: number) => {
    setSpeedMultiplier(mult);
    setSimSpeed(mult);
  };

  // Keyboard shortcut: Press `~` or `T` to toggle telemetry
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '`' || e.key === '~') {
        setIsDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const filteredLogs = filterZone === 'all'
    ? telemetryLogs
    : telemetryLogs.filter((l) => l.zoneId === filterZone);

  return (
    <>
      {/* Floating Control Deck */}
      <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 w-full max-w-5xl px-4 pointer-events-none">
        <div className="pointer-events-auto rounded-2xl border border-slate-700/80 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-xl">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-info/20 text-info">
                <Cpu className="h-3.5 w-3.5" />
              </span>
              <span className="font-semibold uppercase tracking-wider text-slate-200">
                Hackathon Demo Deck
              </span>

              {/* Mode Selector */}
              <div className="ml-2 flex items-center rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setMode('sim')}
                  className={`rounded-md px-2.5 py-1 font-medium transition ${
                    mode === 'sim'
                      ? 'bg-info text-slate-950 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Simulation
                </button>
                <button
                  type="button"
                  onClick={() => setMode('live')}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition ${
                    mode === 'live'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      feedStatus === 'live'
                        ? 'bg-slate-950 animate-ping'
                        : 'bg-amber-400'
                    }`}
                  />
                  Live IoT (WS)
                </button>
              </div>

              {/* Connection status badge */}
              {mode === 'live' && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold ${
                    feedStatus === 'live'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : feedStatus === 'stale'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  <Radio className="h-3 w-3" />
                  {feedStatus.toUpperCase()}
                </span>
              )}

              {/* Active SOS Beacon indicator */}
              {activeSOS && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/60 bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300 animate-pulse">
                  <Siren className="h-3 w-3 text-rose-400" />
                  SOS: {activeSOS.type.toUpperCase()}
                </span>
              )}
            </div>

            {/* Quick Actions & Drawer Trigger */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? 'Unmute tactical siren' : 'Mute tactical siren'}
                className={`rounded-lg border p-1.5 transition ${
                  isMuted
                    ? 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'border-info/40 bg-info/10 text-info hover:bg-info/20'
                }`}
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsSOSModalOpen(true)}
                title="Open Standalone Emergency SOS Operations & Dispatch Hub"
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono transition ${
                  activeSOS
                    ? 'border-rose-500 bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                }`}
              >
                <Siren className={`h-3.5 w-3.5 ${activeSOS ? 'animate-spin' : 'text-rose-400'}`} style={{ animationDuration: '3s' }} />
                <span className="hidden sm:inline">SOS Hub</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCCTVModalOpen(true)}
                title="View Automated CCTV Intelligence & Camera Wall"
                className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 font-mono text-purple-300 hover:bg-purple-500/20 transition"
              >
                <Camera className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">CCTV Feeds</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(true)}
                title="View Stadium Jumbotrons & Attendee Mobile Push App"
                className="flex items-center gap-1.5 rounded-lg border border-info/40 bg-info/10 px-2.5 py-1 font-mono text-info hover:bg-info/20 transition"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Signage & Mobile</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                title="View Formal Post-Mortem Incident Audit Report"
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 font-mono text-amber-300 hover:bg-amber-500/20 transition"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Audit Report</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPoliceModalOpen(true)}
                title="1-Click Mumbai Police & BMC Disaster Cell Gateway"
                className="flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 font-mono text-sky-300 hover:bg-sky-500/20 transition"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden sm:inline">Police / BMC</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDrawerOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono transition ${
                  isDrawerOpen
                    ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                <span>IoT Stream</span>
                <span className="rounded-full bg-slate-700 px-1.5 py-0.2 text-[10px] text-slate-200">
                  {telemetryLogs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700 transition"
              >
                <span>Chaos Bar</span>
                {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Expandable Chaos Action Strip */}
          {isOpen && (
            <div className="mt-3 border-t border-slate-800 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1">
                    Triggers:
                  </span>
                  <button
                    type="button"
                    onClick={triggerSurge}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/50 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition shadow-sm"
                  >
                    <Flame className="h-3.5 w-3.5 text-rose-400" />
                    Surge Gate B
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerChaos('turnstile_fail')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 transition shadow-sm"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    Turnstile Jam (Gate A)
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerChaos('weather_rush')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/50 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/25 transition shadow-sm"
                  >
                    <CloudRain className="h-3.5 w-3.5 text-sky-400" />
                    Downpour Arena Rush
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerSOS('fainted', 'gate-b')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/60 bg-rose-600/20 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-600/30 transition shadow-sm animate-pulse"
                  >
                    <Siren className="h-3.5 w-3.5 text-rose-400" />
                    😵 Attendee Fainted (SOS)
                  </button>

                  <div className="ml-1 flex items-center rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                    <span className="px-2 text-[10px] text-slate-400 font-mono">Speed:</span>
                    {[1, 2, 4].map((mult) => (
                      <button
                        key={mult}
                        type="button"
                        onClick={() => handleSpeed(mult)}
                        className={`rounded px-1.5 py-0.5 text-[11px] font-mono transition ${
                          speedMultiplier === mult
                            ? 'bg-slate-700 text-slate-100 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mult}x
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live IoT Telemetry Terminal Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-x-0 bottom-24 z-30 mx-auto max-w-5xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex h-80 flex-col rounded-2xl border border-slate-700 bg-slate-950/95 shadow-2xl backdrop-blur-md">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Live IoT Sensor Stream
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  (ws://localhost:8080 · {telemetryLogs.length} buffered)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Filter */}
                <select
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="all">All Zones</option>
                  <option value="gate-a">Gate A</option>
                  <option value="gate-b">Gate B</option>
                  <option value="gate-c">Gate C</option>
                  <option value="main-arena">Main Arena</option>
                  <option value="food-court">Food Court</option>
                  <option value="parking">Parking</option>
                </select>

                <button
                  type="button"
                  onClick={clearTelemetry}
                  title="Clear telemetry logs"
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Terminal Logs Table */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-slate-300">
              {filteredLogs.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-500">
                  <Activity className="h-6 w-6 mb-2 opacity-40 animate-pulse" />
                  <span>Awaiting incoming sensor telemetry...</span>
                  <span className="text-[10px] text-slate-600 mt-1">
                    {mode === 'live'
                      ? 'Ensure "npm run feed" is running on port 8080'
                      : 'Click "Run Surge Scenario" or trigger a surge to start simulated stream'}
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLogs.map((log) => {
                    const timeStr = new Date(log.timestamp).toLocaleTimeString();
                    const isGateB = log.zoneId === 'gate-b';
                    return (
                      <div
                        key={log.id}
                        className={`flex flex-wrap items-center justify-between rounded px-2 py-1 transition ${
                          isGateB
                            ? 'bg-rose-500/10 border-l-2 border-rose-500 text-rose-200'
                            : 'hover:bg-slate-900 border-l-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{timeStr}</span>
                          <span className="font-semibold text-info">{log.sensorId}</span>
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                            {log.zoneId.toUpperCase()}
                          </span>
                          <span>Count: <strong className="text-slate-100">{log.count.toLocaleString()}</strong></span>
                          <span className="text-slate-400">Queue: {log.queueMin}m</span>
                          <span className="text-slate-500">Staff: {log.staff}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="text-emerald-400/80">{(log.confidence * 100).toFixed(1)}% conf</span>
                          <span className="rounded bg-slate-900 px-1 text-slate-400">{log.sensorType}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stadium Jumbotron & Attendee Mobile Push Simulator */}
      <PublicBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
      />

      {/* Automated CCTV Vision & Camera Wall */}
      <CCTVModal
        isOpen={isCCTVModalOpen}
        onClose={() => setIsCCTVModalOpen(false)}
      />

      {/* Official Incident Post-Mortem & Regulatory Audit Report */}
      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </>
  );
}
