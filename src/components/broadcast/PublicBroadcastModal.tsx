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
  Users,
  MapPin,
} from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';

interface PublicBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PublicBroadcastModal({ isOpen, onClose }: PublicBroadcastModalProps) {
  const { execution, zones, predictions, triggerSOS, activeSOS } = useCommandCenter();
  const [activeTab, setActiveTab] = useState<'both' | 'led' | 'mobile'>('both');
  const [simulatedDeliveries, setSimulatedDeliveries] = useState(48392);
  const [isPushSent, setIsPushSent] = useState(false);

  if (!isOpen) return null;

  const isExecuted = !!execution;
  const isGateBCritical = predictions['gate-b'].riskLevel === 'critical' || predictions['gate-b'].riskLevel === 'high';

  const handleManualPushTrigger = () => {
    setIsPushSent(true);
    setSimulatedDeliveries((prev) => prev + 120);
    setTimeout(() => setIsPushSent(false), 3000);
  };

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
                <h2 className="font-display text-lg font-bold tracking-tight text-white">
                  Public Broadcast & Attendee Wayfinding
                </h2>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE RE-ROUTING SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                End-to-end incident management: Stadium Jumbotrons + 48,000+ attendee smartphones
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
                  activeTab === 'both' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Split View
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('led')}
                className={`flex items-center gap-1 rounded px-3 py-1 font-medium transition ${
                  activeTab === 'led' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tv className="h-3.5 w-3.5" />
                Stadium LED
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mobile')}
                className={`flex items-center gap-1 rounded px-3 py-1 font-medium transition ${
                  activeTab === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile App
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
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
              <p className="mt-1 font-mono text-xl font-bold text-white">
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
              <span className="text-[11px] uppercase tracking-wide text-slate-400">Attendee Compliance</span>
              <p className="mt-1 font-mono text-xl font-bold text-amber-400">
                84.6% <span className="text-xs text-slate-400 font-normal">diverted to Gate C</span>
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* VIEW 1: Stadium LED Digital Signboard */}
            {(activeTab === 'both' || activeTab === 'led') && (
              <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tv className="h-4 w-4 text-amber-400" />
                    <h3 className="font-semibold text-sm text-slate-200 uppercase tracking-wider">
                      Main Concourse & Gate B Overhead Jumbotron
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    Matrix ID: LED-DISP-NORTH-02
                  </span>
                </div>

                {/* Stadium LED Bezel & Screen */}
                <div className="flex-1 rounded-xl border-4 border-slate-950 bg-black p-4 shadow-inner relative flex flex-col justify-between min-h-[360px]">
                  {/* Digital screen header */}
                  <div className="flex items-center justify-between border-b border-amber-950/60 pb-2 text-[10px] font-mono text-amber-500/80">
                    <span>VENUE COMMAND BROADCAST NETWORK</span>
                    <span>17:20:45 PST</span>
                  </div>

                  {/* LED Content Display */}
                  <div className="my-auto py-4 text-center">
                    {isExecuted ? (
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
                          STADIUM ENTRANCE CONTROL
                        </div>
                        <h4 className="font-mono text-2xl font-bold uppercase tracking-wider text-slate-200">
                          WELCOME TO THE CONCERT
                        </h4>
                        <p className="font-mono text-xs text-emerald-400">
                          ALL GATES OPERATING NORMALLY • HAVE DIGITAL PASSES READY
                        </p>
                      </div>
                    )}
                  </div>

                  {/* LED Screen Footer */}
                  <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-[10px] font-mono text-slate-500">
                    <span>REFRESH: 1.0s</span>
                    <span className="text-emerald-500">SYSTEM OPERATIONAL</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    Auto-synchronized to Gate B sensor thresholds
                  </span>
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
                      Attendee Mobile Companion (Live Push Notification)
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
                <div className="mx-auto w-full max-w-[320px] rounded-[36px] border-4 border-slate-700 bg-slate-950 p-3 shadow-2xl relative min-h-[460px] flex flex-col justify-between">
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
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        <span className="flex h-4 w-4 items-center justify-center rounded bg-info text-slate-950 text-[9px] font-black">
                          S
                        </span>
                        <span>SurgeGuard Event Pass</span>
                      </div>
                      <span>Now</span>
                    </div>

                    <p className="text-xs font-bold text-white">
                      {isExecuted
                        ? '🚨 Expedited Entry Available at Gate C'
                        : isGateBCritical
                        ? '⚠️ Gate B Experiencing Longer Queues'
                        : '🎉 Welcome! Gates A, B, and C Open'}
                    </p>

                    <p className="mt-1 text-[11px] leading-snug text-slate-300">
                      {isExecuted
                        ? 'Gate B is experiencing delays. Divert to Gate C for fast-track entry + complimentary water voucher.'
                        : isGateBCritical
                        ? 'Gate B queue time is 22 mins. Check other gates on the in-app map for faster access.'
                        : 'Show your digital ticket barcode at any turnstile for entrance.'}
                    </p>

                    {isExecuted && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          className="flex-1 rounded-lg bg-emerald-500 py-1.5 text-center text-[10px] font-bold text-slate-950 hover:bg-emerald-400"
                        >
                          Navigate to Gate C (2m)
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-[10px] font-semibold text-slate-300"
                        >
                          Voucher
                        </button>
                      </div>
                    )}
                  </div>

                  {/* In-App Live Gate Status Cards */}
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

                  {/* Find My Friends & Safe Meeting Point Card */}
                  <div className="mt-2.5 rounded-2xl border border-sky-500/40 bg-sky-950/40 p-2.5 shadow-lg space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-sky-300 font-mono">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-sky-400" />
                        FIND MY FRIENDS (3 CONNECTED)
                      </span>
                      <span className="rounded bg-sky-500/20 px-1.5 py-0.2 text-[9px] text-sky-300">
                        PEER MESH
                      </span>
                    </div>

                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex items-center justify-between bg-slate-900/70 p-1.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span>Rahul M.</span>
                        </div>
                        <span className="text-slate-400">14m · Food Court</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-900/70 p-1.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          <span>Priya K.</span>
                        </div>
                        <span className="text-amber-300">38m · Arena East</span>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg bg-sky-900/30 border border-sky-500/30 text-[10px]">
                      <div className="flex items-center gap-1 text-sky-300 font-bold font-mono">
                        <MapPin className="h-3 w-3 text-sky-400 shrink-0" />
                        <span>Safe Meeting Point:</span>
                      </div>
                      <p className="text-[9.5px] text-slate-300 mt-0.5">
                        <b>Water Point #2 (Near Gate C)</b> · Low Density (&lt;1.4 p/m²) · Egress Clear
                      </p>
                    </div>
                  </div>

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
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/60 px-6 py-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>FCM & APNs Push Gateway Connected • 99.98% delivery SLA</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 font-semibold text-white hover:bg-slate-700 transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
