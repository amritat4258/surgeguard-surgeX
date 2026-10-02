import { useState } from 'react';
import {
  Smartphone,
  Tv,
  X,
  Radio,
  CheckCircle,
  ShieldCheck,
  Send,
  Siren,
  Droplets,
  Clock,
  Users,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import { VENUE_FACILITIES, getRushColor } from '@/data/facilities';

interface PublicBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PublicBroadcastModal({ isOpen, onClose }: PublicBroadcastModalProps) {
  const { execution, zones, predictions, triggerSOS, activeSOS } = useCommandCenter();
  const [activeTab, setActiveTab] = useState<'both' | 'led' | 'mobile' | 'stalls'>('both');
  const [mobileSubTab, setMobileSubTab] = useState<'gates' | 'stalls'>('stalls');
  const [ledDisplayMode, setLedDisplayMode] = useState<'auto' | 'gates' | 'stalls'>('auto');
  const [simulatedDeliveries, setSimulatedDeliveries] = useState(48392);
  const [isPushSent, setIsPushSent] = useState(false);
  const [isStallBroadcastActive, setIsStallBroadcastActive] = useState(false);
  const [claimedVoucher, setClaimedVoucher] = useState(false);

  if (!isOpen) return null;

  const isExecuted = !!execution;
  const isGateBCritical = predictions['gate-b'].riskLevel === 'critical' || predictions['gate-b'].riskLevel === 'high';

  const handleManualPushTrigger = () => {
    setIsPushSent(true);
    setSimulatedDeliveries((prev) => prev + 120);
    setTimeout(() => setIsPushSent(false), 3000);
  };

  const handleTriggerStallBroadcast = () => {
    setIsStallBroadcastActive(true);
    setSimulatedDeliveries((prev) => prev + 240);
  };

  // Facilities filtered by refreshment & stalls
  const refreshmentStalls = VENUE_FACILITIES.filter(
    (f) => f.kind === 'water' || f.kind === 'energy' || f.kind === 'restroom' || f.kind === 'medical'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/20 text-info">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                  📢 Stadium PA & Digital Screens
                </h2>
                <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-purple-300 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                  CONCOURSE AUDIO & LED SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inside stadium speakers, concourse Jumbotrons, stall rush monitors & attendee smartphone wayfinding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Filter */}
            <div className="hidden sm:flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('both')}
                className={`rounded px-3 py-1 font-medium transition ${
                  activeTab === 'both' ? 'bg-slate-700 text-ink' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Split View
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('led')}
                className={`flex items-center gap-1 rounded px-3 py-1 font-medium transition ${
                  activeTab === 'led' ? 'bg-slate-700 text-ink' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tv className="h-3.5 w-3.5" />
                Stadium LED
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mobile')}
                className={`flex items-center gap-1 rounded px-3 py-1 font-medium transition ${
                  activeTab === 'mobile' ? 'bg-slate-700 text-ink' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile App
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stalls')}
                className={`flex items-center gap-1 rounded px-3 py-1 font-medium transition ${
                  activeTab === 'stalls' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-sky-300'
                }`}
              >
                <Droplets className="h-3.5 w-3.5" />
                Concourse Stall Rush
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-ink transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Real-time Broadcast Stats Bar */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <span className="text-[11px] uppercase tracking-wide text-slate-400">Total Audience Reached</span>
              <p className="mt-1 font-mono text-xl font-bold text-ink">
                {simulatedDeliveries.toLocaleString()} <span className="text-xs text-slate-400 font-normal">devices</span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <span className="text-[11px] uppercase tracking-wide text-slate-400">Push Delivery Latency</span>
              <p className="mt-1 font-mono text-xl font-bold text-emerald-400">
                1.18 <span className="text-xs text-slate-400 font-normal">sec avg</span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <span className="text-[11px] uppercase tracking-wide text-slate-400">Signboard Sync Status</span>
              <p className="mt-1 font-mono text-xl font-bold text-info">
                8 / 8 <span className="text-xs text-slate-400 font-normal">Displays Online</span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <span className="text-[11px] uppercase tracking-wide text-slate-400">Hydration Reroute Efficacy</span>
              <p className="mt-1 font-mono text-xl font-bold text-sky-400">
                89.2% <span className="text-xs text-slate-400 font-normal">dispersed to Gate C</span>
              </p>
            </div>
          </div>

          {/* TAB: Stall Rush Board (Dedicated Full View) */}
          {activeTab === 'stalls' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stadium PA Audio Broadcast Banner */}
              <div className="rounded-2xl border border-sky-500/50 bg-gradient-to-r from-sky-950/80 via-slate-900/90 to-purple-950/80 p-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40">
                      <Volume2 className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-bold text-ink">
                          Concourse Public Address (PA) Audio Dispatch
                        </h3>
                        <span className="rounded bg-sky-500/20 border border-sky-500/40 px-2 py-0.5 font-mono text-[10px] text-sky-300">
                          36 LINE ARRAY CLUSTERS
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Broadcast automated voice instructions to disperse water and beverage stall bottlenecks in real-time.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerStallBroadcast}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2.5 font-mono text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition"
                  >
                    <Radio className="h-4 w-4 animate-spin" style={{ animationDuration: '4s' }} />
                    <span>{isStallBroadcastActive ? 'PA BROADCAST ACTIVE • TICKER SYNCED' : '📢 BROADCAST GATE C WATER DISPERSION'}</span>
                  </button>
                </div>

                {/* Simulated Audio Waveform & Live Voice Script */}
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5 text-sky-300 font-semibold">
                      <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                      LIVE STADIUM PA ANNOUNCEMENT TRANSCRIPT:
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      CONCOURSE SPEAKERS: 84 dB(A)
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-200 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-slate-800">
                    &quot;Attention all attendees in the West Concourse: Water Station 1 is currently experiencing heavy volume with a 14-minute wait. For faster hydration and complimentary ORS electrolyte sachets, please proceed 90 seconds forward to Water Station 2 at Gate C. Eight high-speed refill taps are open with zero wait.&quot;
                  </p>
                </div>
              </div>

              {/* Side-by-Side Live Stalls Queue Monitor */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-sky-400" />
                      Live Concourse Stalls & Hydration Queue Telemetry
                    </h3>
                    <p className="text-xs text-slate-400">
                      Real-time queue depth, wait estimates, and fast-track diversion routing
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    Refreshed via Concourse Vision Nodes: 1s
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {refreshmentStalls.map((stall) => {
                    const rush = getRushColor(stall.rushLevel);
                    return (
                      <div
                        key={stall.id}
                        className={`rounded-xl border p-4 transition ${
                          stall.id === 'w1'
                            ? 'border-rose-500/50 bg-rose-950/20'
                            : stall.id === 'w2'
                            ? 'border-emerald-500/50 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                            : 'border-slate-800 bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-lg shadow-inner">
                              {stall.icon}
                            </span>
                            <div>
                              <h4 className="font-semibold text-xs text-ink">
                                {stall.name}
                              </h4>
                              <span
                                className="font-mono text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: stall.color }}
                              >
                                {stall.badge}
                              </span>
                            </div>
                          </div>
                          <span className={`rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase border ${rush.badgeBg}`}>
                            {rush.label}
                          </span>
                        </div>

                        {/* Wait Time & Crowd Bar */}
                        <div className="mt-3 rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-info" />
                              Wait Time:
                            </span>
                            <span className={`font-bold ${
                              stall.rushLevel === 'critical' ? 'text-rose-400 text-sm animate-pulse' :
                              stall.rushLevel === 'high' ? 'text-rose-300 font-bold' :
                              stall.rushLevel === 'moderate' ? 'text-amber-300 font-bold' :
                              'text-emerald-400 font-bold'
                            }`}>
                              {stall.queueMin === 0 ? 'Zero Wait (0m)' : `${stall.queueMin} Minutes`}
                            </span>
                          </div>

                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden mb-2">
                            <div
                              className={`h-full rounded-full ${rush.barColor}`}
                              style={{ width: rush.barWidth }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {stall.queueCount} in line
                            </span>
                            <span>{stall.tapsOrStaff}</span>
                          </div>
                        </div>

                        {stall.recommendation && (
                          <div className="mt-2.5 rounded-lg border border-sky-500/30 bg-sky-950/40 p-2 text-[11px] text-sky-200">
                            <div className="flex items-start gap-1.5">
                              <Sparkles className="h-3 w-3 text-sky-400 shrink-0 mt-0.5" />
                              <p className="leading-snug">{stall.recommendation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEWS 1 & 2: Split View or LED / Mobile */}
          {(activeTab === 'both' || activeTab === 'led' || activeTab === 'mobile') && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* VIEW 1: Stadium LED Digital Signboard */}
              {(activeTab === 'both' || activeTab === 'led') && (
                <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Tv className="h-4 w-4 text-amber-400" />
                      <h3 className="font-semibold text-sm text-slate-200 uppercase tracking-wider">
                        Main Concourse & Overhead Jumbotron
                      </h3>
                    </div>

                    {/* Mode toggle */}
                    <div className="flex rounded-md border border-slate-700 bg-slate-800 p-0.5 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => setLedDisplayMode('auto')}
                        className={`rounded px-2 py-0.5 transition ${ledDisplayMode === 'auto' ? 'bg-slate-700 text-ink' : 'text-slate-400 hover:text-ink'}`}
                      >
                        Auto
                      </button>
                      <button
                        type="button"
                        onClick={() => setLedDisplayMode('stalls')}
                        className={`rounded px-2 py-0.5 transition ${ledDisplayMode === 'stalls' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-sky-300'}`}
                      >
                        💧 Stall Queues
                      </button>
                      <button
                        type="button"
                        onClick={() => setLedDisplayMode('gates')}
                        className={`rounded px-2 py-0.5 transition ${ledDisplayMode === 'gates' ? 'bg-slate-700 text-ink' : 'text-slate-400 hover:text-ink'}`}
                      >
                        🚪 Gates
                      </button>
                    </div>
                  </div>

                  {/* Stadium LED Bezel & Screen */}
                  <div data-theme="dark" className="flex-1 rounded-xl border-4 border-slate-950 bg-black p-4 shadow-inner relative flex flex-col justify-between min-h-[380px]">
                    {/* Digital screen header */}
                    <div className="flex items-center justify-between border-b border-amber-950/60 pb-2 text-[10px] font-mono text-amber-500/80">
                      <span>MMRDA STADIUM CONCOURSE NETWORK</span>
                      <span>17:20:45 PST</span>
                    </div>

                    {/* LED Content Display */}
                    <div className="my-auto py-4 text-center">
                      {isStallBroadcastActive || ledDisplayMode === 'stalls' ? (
                        <div className="space-y-3 animate-in fade-in duration-300">
                          <div className="inline-block rounded border border-sky-500/50 bg-sky-950/80 px-3 py-1 text-xs font-mono font-bold tracking-widest text-sky-300 animate-pulse">
                            💧 LIVE CONCOURSE HYDRATION WAYFINDING
                          </div>
                          <h4 className="font-mono text-xl sm:text-2xl font-black uppercase tracking-widest text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]">
                            WATER STATION #2 (GATE C) OPEN
                          </h4>
                          <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-sky-200">
                            <span>8 EXPRESS TAPS</span>
                            <span>•</span>
                            <span className="text-emerald-400">1 MIN WAIT</span>
                            <span>•</span>
                            <span>FREE ORS ELECTROLYTES</span>
                          </div>

                          {/* Quick Live Stall Wait Comparison Board on LED */}
                          <div className="mx-auto max-w-md rounded-lg border border-slate-800 bg-slate-950/80 p-2 text-[10px] font-mono text-left space-y-1">
                            <div className="flex justify-between text-rose-400 border-b border-slate-900 pb-1">
                              <span>💧 WATER #1 (GATE A):</span>
                              <span className="font-bold">14 MIN WAIT (AVOID)</span>
                            </div>
                            <div className="flex justify-between text-emerald-400 font-bold border-b border-slate-900 pb-1">
                              <span>💧 WATER #2 (GATE C):</span>
                              <span>1 MIN WAIT (PROCEED)</span>
                            </div>
                            <div className="flex justify-between text-amber-400">
                              <span>⚡ RED BULL KIOSK:</span>
                              <span>8 MIN WAIT</span>
                            </div>
                          </div>

                          <div className="mx-auto max-w-md rounded-lg border border-sky-500/40 bg-sky-950/60 p-2 text-xs font-mono text-sky-300">
                            &gt;&gt;&gt; FOLLOW BLUE OVERHEAD ARROWS TO GATE C HYDRATION BAR &gt;&gt;&gt;
                          </div>
                        </div>
                      ) : isExecuted ? (
                        <div className="space-y-4 animate-in fade-in duration-300">
                          <div className="inline-block rounded border border-rose-500/50 bg-rose-950/60 px-3 py-1 text-xs font-mono font-bold tracking-widest text-rose-400 animate-pulse">
                            ⚠️ NOTICE: GATE B HEAVY INFLUX
                          </div>
                          <h4 className="font-mono text-2xl font-black uppercase tracking-widest text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">
                            PLEASE PROCEED TO GATE C
                          </h4>
                          <div className="flex items-center justify-center gap-3 font-mono text-sm font-bold text-emerald-400">
                            <span>FAST-TRACK LANES OPEN</span>
                            <span>•</span>
                            <span>2 MIN WALK</span>
                          </div>
                          <div className="mx-auto max-w-md rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs font-mono text-emerald-300">
                            &gt;&gt;&gt; FOLLOW GREEN OVERHEAD SIGNS TO GATE C &gt;&gt;&gt;
                          </div>
                        </div>
                      ) : isGateBCritical ? (
                        <div className="space-y-3">
                          <div className="inline-block rounded border border-rose-600 bg-rose-950/80 px-4 py-1 text-sm font-mono font-bold tracking-widest text-rose-300 animate-pulse">
                            🚨 DELAY WARNING AT GATE B
                          </div>
                          <h4 className="font-mono text-xl font-bold uppercase tracking-wide text-rose-400">
                            APPROACHING MAXIMUM CAPACITY
                          </h4>
                          <p className="font-mono text-xs text-amber-300/80">
                            CONSIDER ENTERING VIA GATE A OR GATE C
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="font-mono text-xs tracking-widest text-slate-500">
                            STADIUM CONCOURSE CONTROL
                          </div>
                          <h4 className="font-mono text-2xl font-bold uppercase tracking-wider text-slate-200">
                            WELCOME TO MMRDA GROUNDS
                          </h4>
                          <p className="font-mono text-xs text-emerald-400">
                            ALL STALLS & HYDRATION STATIONS OPERATIONAL • ZERO CONGESTION
                          </p>
                        </div>
                      )}
                    </div>

                    {/* LED Screen Footer */}
                    <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-[10px] font-mono text-slate-500">
                      <span>REFRESH: 1.0s</span>
                      <span className="text-emerald-500">MATRIX OPERATIONAL</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      Auto-synchronized to Gate B & Concourse sensor thresholds
                    </span>
                    <button
                      type="button"
                      onClick={handleTriggerStallBroadcast}
                      className="text-sky-400 hover:text-sky-300 underline font-mono text-[11px]"
                    >
                      {isStallBroadcastActive ? 'Broadcast Synced' : 'Sync Stall Reroute'}
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 2: Attendee Mobile Smartphone Mockup */}
              {(activeTab === 'both' || activeTab === 'mobile') && (
                <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-info" />
                      <h3 className="font-semibold text-sm text-slate-200 uppercase tracking-wider">
                        Attendee Mobile Companion
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleManualPushTrigger}
                      className="flex items-center gap-1 rounded-lg bg-info/20 px-2.5 py-1 font-mono text-xs font-semibold text-info hover:bg-info/30 transition"
                    >
                      <Send className="h-3 w-3" />
                      {isPushSent ? 'Push Dispatched!' : 'Simulate Push'}
                    </button>
                  </div>

                  {/* Smartphone Device Frame */}
                  <div className="mx-auto w-full max-w-[320px] rounded-[36px] border-4 border-slate-700 bg-slate-950 p-3 shadow-2xl relative min-h-[490px] flex flex-col justify-between">
                    {/* Dynamic Island / Speaker Notch */}
                    <div className="mx-auto mb-2 h-5 w-24 rounded-full bg-black flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-slate-800" />
                    </div>

                    {/* Status Bar */}
                    <div className="mb-2 flex items-center justify-between px-3 text-[10px] font-medium text-slate-400">
                      <span>17:21</span>
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>5G</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Push Notification Card */}
                    <div className="mb-3 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <div className="flex items-center gap-1.5 font-semibold text-ink">
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-info text-slate-950 text-[9px] font-black">
                            S
                          </span>
                          <span>SurgeGuard Event Pass</span>
                        </div>
                        <span>Now</span>
                      </div>

                      <p className="text-xs font-bold text-ink">
                        {isStallBroadcastActive
                          ? '💧 Beat the Rush: Fast Water Refill at Gate C'
                          : isExecuted
                          ? '🚨 Expedited Entry Available at Gate C'
                          : isGateBCritical
                          ? '⚠️ Gate B Experiencing Longer Queues'
                          : '🎉 Welcome! Turnstiles & Concourse Open'}
                      </p>

                      <p className="mt-1 text-[11px] leading-snug text-slate-300">
                        {isStallBroadcastActive
                          ? 'Water Station #1 has a 14 min wait. Save time: Walk 90s to Gate C for zero wait + free ORS electrolyte sachet!'
                          : isExecuted
                          ? 'Gate B is experiencing delays. Divert to Gate C for fast-track entry + complimentary water voucher.'
                          : isGateBCritical
                          ? 'Gate B queue time is 22 mins. Check other gates on the in-app map for faster access.'
                          : 'Show your digital ticket barcode at any turnstile for entrance.'}
                      </p>

                      {(isStallBroadcastActive || isExecuted) && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setClaimedVoucher(true)}
                            className="flex-1 rounded-lg bg-emerald-500 py-1.5 text-center text-[10px] font-bold text-slate-950 hover:bg-emerald-400"
                          >
                            {claimedVoucher ? '✓ Voucher Claimed!' : 'Claim Fast Refill Pass'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMobileSubTab('stalls')}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-[10px] font-semibold text-slate-300 hover:text-ink"
                          >
                            Map
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Smartphone In-App Content Switcher */}
                    <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 mb-2 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => setMobileSubTab('gates')}
                        className={`flex-1 py-1 rounded text-center transition ${
                          mobileSubTab === 'gates' ? 'bg-slate-800 text-ink font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🚪 Gate Queues
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSubTab('stalls')}
                        className={`flex-1 py-1 rounded text-center transition ${
                          mobileSubTab === 'stalls' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-sky-200'
                        }`}
                      >
                        💧 Stall Wait Times
                      </button>
                    </div>

                    {/* SUBTAB 1: In-App Live Gate Status */}
                    {mobileSubTab === 'gates' && (
                      <div className="flex-1 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-2.5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase text-slate-400">
                          <span>Live Gate Wait Times</span>
                          <span className="text-info">Live Sync</span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-2.5 py-1.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-400" />
                              <span className="font-medium text-slate-200">Gate A</span>
                            </div>
                            <span className="font-mono text-emerald-400 text-[11px]">4 min queue</span>
                          </div>

                          <div className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                            isExecuted || isGateBCritical ? 'bg-rose-500/15 border border-rose-500/30' : 'bg-slate-800/60'
                          }`}>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${isGateBCritical ? 'bg-rose-500 animate-ping' : 'bg-amber-400'}`} />
                              <span className="font-medium text-slate-200">Gate B</span>
                            </div>
                            <span className="font-mono text-rose-400 text-[11px] font-bold">
                              {zones['gate-b']?.queueMin ?? 22} min (Crowded)
                            </span>
                          </div>

                          <div className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                            isExecuted ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-slate-800/60'
                          }`}>
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-400" />
                              <span className="font-semibold text-emerald-300">Gate C (Recommended)</span>
                            </div>
                            <span className="font-mono text-emerald-300 text-[11px] font-bold">
                              {zones['gate-c']?.queueMin ?? 2} min (Fast-Track)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB 2: In-App Concourse Stall Wait Times */}
                    {mobileSubTab === 'stalls' && (
                      <div className="flex-1 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-2.5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase text-slate-400">
                          <span>Live Stall Queues</span>
                          <span className="text-sky-400">Real-time</span>
                        </div>

                        <div className="space-y-1.5">
                          {/* Gate C Recommended Fast Refill */}
                          <div className="flex items-center justify-between rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span>💧</span>
                              <div>
                                <p className="font-bold text-emerald-300 text-[11px] leading-tight">Water #2 (Gate C)</p>
                                <span className="text-[9px] text-emerald-400 font-mono">90m away • 8 taps</span>
                              </div>
                            </div>
                            <span className="font-mono text-emerald-300 text-[11px] font-bold">
                              1m wait ⭐
                            </span>
                          </div>

                          {/* Gate A Water (Congested) */}
                          <div className="flex items-center justify-between rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span>💧</span>
                              <div>
                                <p className="font-medium text-slate-200 text-[11px] leading-tight">Water #1 (Gate A)</p>
                                <span className="text-[9px] text-rose-300 font-mono">54 people in line</span>
                              </div>
                            </div>
                            <span className="font-mono text-rose-400 text-[11px] font-bold">
                              14m wait
                            </span>
                          </div>

                          {/* Red Bull Kiosk */}
                          <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-2.5 py-1.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span>⚡</span>
                              <div>
                                <p className="font-medium text-slate-200 text-[11px] leading-tight">Red Bull West</p>
                                <span className="text-[9px] text-slate-400 font-mono">2 registers</span>
                              </div>
                            </div>
                            <span className="font-mono text-amber-400 text-[11px]">
                              8m wait
                            </span>
                          </div>

                          {/* Food Court */}
                          <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-2.5 py-1.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span>🍔</span>
                              <div>
                                <p className="font-medium text-slate-200 text-[11px] leading-tight">Food Court Bar</p>
                                <span className="text-[9px] text-slate-400 font-mono">Beverage & snack</span>
                              </div>
                            </div>
                            <span className="font-mono text-amber-400 text-[11px]">
                              12m wait
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Attendee Emergency SOS Quick Distress Trigger */}
                    <div className="mt-2.5 rounded-2xl border border-rose-500/50 bg-rose-950/40 p-2.5 shadow-lg">
                      <div className="flex items-center justify-between text-[10px] font-bold text-rose-300 font-mono mb-1.5">
                        <span className="flex items-center gap-1">
                          <Siren className="h-3 w-3 text-rose-400 animate-pulse" />
                          ATTENDEE EMERGENCY SOS
                        </span>
                        {activeSOS ? (
                          <span className="text-amber-400 animate-ping text-[9px]">BEACON ACTIVE</span>
                        ) : (
                          <span className="text-slate-400 text-[9px]">1-TAP MEDICAL DISPATCH</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                        <button
                          type="button"
                          onClick={() => triggerSOS('medical', 'gate-b')}
                          className="rounded-lg border border-rose-500/40 bg-rose-600/80 p-1.5 font-bold text-white hover:bg-rose-500 transition text-left"
                        >
                          🩺 Medical / Fainted
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerSOS('fire', 'gate-b')}
                          className="rounded-lg border border-amber-500/40 bg-amber-600/80 p-1.5 font-bold text-white hover:bg-amber-500 transition text-left"
                        >
                          🔥 Fire / Smoke
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerSOS('lost_child', 'gate-b')}
                          className="rounded-lg border border-sky-600/50 bg-sky-700 p-1.5 font-bold text-white hover:bg-sky-600 transition text-left"
                        >
                          👶 Lost Child
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerSOS('harassment', 'gate-b')}
                          className="rounded-lg border border-purple-600/50 bg-purple-700 p-1.5 font-bold text-white hover:bg-purple-600 transition text-left"
                        >
                          🛡️ Harassment
                        </button>
                      </div>
                    </div>

                    {/* Smartphone Home Bar */}
                    <div className="mx-auto mt-2 h-1 w-28 rounded-full bg-slate-700" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/60 px-6 py-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Stadium PA & Digital Display Network • 99.98% broadcast uptime</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerStallBroadcast}
              className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 font-mono text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition"
            >
              📢 Test Gate C Water Reroute PA
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 font-semibold text-ink hover:bg-slate-700 transition"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
