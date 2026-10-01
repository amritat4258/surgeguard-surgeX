import { useState } from 'react';
import {
  AlertOctagon,
  X,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  Siren,
  Ambulance,
  HeartPulse,
  Flame,
  Baby,
  ShieldAlert,
  Users,
  Radio,
  Navigation,
  Send,
  Smartphone,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';

interface SOSDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SOSDispatchModal({ isOpen, onClose }: SOSDispatchModalProps) {
  const {
    activeSOS,
    triggerSOS,
    assignResponder,
    dispatchParamedics,
    sendCalmBroadcast,
    resolveSOS,
  } = useCommandCenter();

  const [activeTab, setActiveTab] = useState<'dispatcher' | 'attendee'>('dispatcher');
  const [lang, setLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [isVolunteer, setIsVolunteer] = useState(true);

  if (!isOpen) return null;

  const isDispatched = activeSOS?.status === 'dispatched';
  const isAssigned = activeSOS?.status === 'assigned' || isDispatched;
  const isResolved = activeSOS?.status === 'resolved';

  const calmMessages = {
    en: 'Notice: Please keep center aisle clear for emergency service access. Concessions remain open normally.',
    hi: 'सूचना: कृपया आपातकालीन सहायता दल के लिए मुख्य गलियारा खाली रखें। सहायता पहुंच रही है।',
    mr: 'सूचना: कृपया आपत्कालीन मदत पथकासाठी मुख्य मार्ग मोकळा ठेवा. इतर सेवा सुरळीत सुरू आहेत.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex w-full max-w-4xl max-h-[92vh] flex-col rounded-2xl border-2 border-rose-500/80 bg-slate-950 text-slate-100 shadow-[0_0_60px_rgba(244,63,94,0.35)] overflow-hidden">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-rose-900/60 bg-gradient-to-r from-rose-950/90 via-slate-950 to-rose-950/90 px-5 py-3 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-md shadow-rose-600/50 animate-pulse">
              <Siren className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black tracking-widest text-rose-300">
                  SURGEGUARD // EMERGENCY SOS HUB
                </span>
                {activeSOS ? (
                  <span className="rounded-full bg-rose-500/20 border border-rose-500/60 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300 animate-pulse">
                    INCIDENT ACTIVE
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/50 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                    MONITORING // STANDBY
                  </span>
                )}
              </div>
              <h3 className="font-display text-base font-bold text-white">
                {activeSOS ? activeSOS.label : 'Emergency Operations & Triage Console'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('dispatcher')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition ${
                  activeTab === 'dispatcher'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Command Dispatcher</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('attendee')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition ${
                  activeTab === 'attendee'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Attendee 1-Tap SOS</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: COMMAND DISPATCHER VIEW */}
          {activeTab === 'dispatcher' && (
            <>
              {/* If No Active SOS Incident */}
              {!activeSOS && (
                <div className="space-y-5 py-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h4 className="font-display text-base font-bold text-white">
                      All Sectors Normal · Emergency Rapid Response On Standby
                    </h4>
                    <p className="mt-1 text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                      MMRDA Grounds BKC is monitored by 2 First Aid tents, 4 tactical marshalls, and 12 rapid response personnel. Click any scenario below to trigger a live distress beacon demo.
                    </p>

                    {/* Quick Trigger Scenarios for Demo */}
                    <div className="mt-6 border-t border-slate-800 pt-5">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-300 block mb-3">
                        ⚡ Simulate Emergency Incident (For Judges & Presenters):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <button
                          type="button"
                          onClick={() => triggerSOS('medical', 'gate-b')}
                          className="flex flex-col items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/50 p-3 text-left transition group"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600/30 text-rose-300 group-hover:scale-110 transition">
                            <HeartPulse className="h-4 w-4" />
                          </span>
                          <span className="font-bold text-xs text-white">1. Medical Emergency</span>
                          <span className="text-[10px] text-slate-400 text-center">Attendee fainted / heat stroke at Gate B</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => triggerSOS('fire', 'gate-b')}
                          className="flex flex-col items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/50 p-3 text-left transition group"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600/30 text-amber-300 group-hover:scale-110 transition">
                            <Flame className="h-4 w-4" />
                          </span>
                          <span className="font-bold text-xs text-white">2. Pyrotechnic Fire</span>
                          <span className="text-[10px] text-slate-400 text-center">Stage smoke flare / truss hazard</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => triggerSOS('lost_child', 'gate-b')}
                          className="flex flex-col items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/30 hover:bg-sky-900/50 p-3 text-left transition group"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600/30 text-sky-300 group-hover:scale-110 transition">
                            <Baby className="h-4 w-4" />
                          </span>
                          <span className="font-bold text-xs text-white">3. Lost Child</span>
                          <span className="text-[10px] text-slate-400 text-center">7-yr-old minor separated from guardian</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => triggerSOS('harassment', 'gate-b')}
                          className="flex flex-col items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/30 hover:bg-purple-900/50 p-3 text-left transition group"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/30 text-purple-300 group-hover:scale-110 transition">
                            <ShieldAlert className="h-4 w-4" />
                          </span>
                          <span className="font-bold text-xs text-white">4. Harassment / Safety</span>
                          <span className="text-[10px] text-slate-400 text-center">Plainclothes marshall discreet extraction</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* If Active SOS Incident is Running */}
              {activeSOS && (
                <div className="space-y-4">
                  {/* 4-Stage Response Pipeline Stepper */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                      Live Incident Status Pipeline:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col items-center text-center p-2 rounded-lg bg-rose-950/60 border border-rose-500/60">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-bold mb-1">
                          ✓
                        </span>
                        <span className="font-mono text-[10px] font-bold text-rose-300">1. RECEIVED</span>
                        <span className="text-[9px] text-slate-400">GPS Ping Logged</span>
                      </div>

                      <div
                        className={`flex flex-col items-center text-center p-2 rounded-lg border transition ${
                          isAssigned
                            ? 'bg-rose-950/60 border-rose-500/60'
                            : 'bg-slate-900/40 border-slate-800 opacity-60'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold mb-1 ${
                            isAssigned ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isAssigned ? '✓' : '2'}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-slate-200">
                          2. ASSIGNED
                        </span>
                        <span className="text-[9px] text-slate-400">Nearest Unit</span>
                      </div>

                      <div
                        className={`flex flex-col items-center text-center p-2 rounded-lg border transition ${
                          isDispatched
                            ? 'bg-amber-950/60 border-amber-500/60 animate-pulse'
                            : 'bg-slate-900/40 border-slate-800 opacity-60'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold mb-1 ${
                            isDispatched ? 'bg-amber-500 text-slate-950 animate-bounce' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isResolved ? '✓' : '3'}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-amber-300">
                          3. EN ROUTE
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {isDispatched ? `ETA: ${activeSOS.etaSeconds}s` : 'Navigation'}
                        </span>
                      </div>

                      <div
                        className={`flex flex-col items-center text-center p-2 rounded-lg border transition ${
                          isResolved
                            ? 'bg-emerald-950/60 border-emerald-500/60'
                            : 'bg-slate-900/40 border-slate-800 opacity-60'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold mb-1 ${
                            isResolved ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isResolved ? '✓' : '4'}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-emerald-400">
                          4. RESOLVED
                        </span>
                        <span className="text-[9px] text-slate-400">Cleared</span>
                      </div>
                    </div>
                  </div>

                  {/* Incident Situation & Location Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Caller & Condition */}
                    <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                          <AlertOctagon className="h-4 w-4 text-rose-400" />
                          Incident Report:
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {activeSOS.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-snug">
                        {activeSOS.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Phone className="h-3 w-3 text-rose-400" />
                          {activeSOS.callerPhone}
                        </span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="h-3 w-3 text-sky-400" />
                          {new Date(activeSOS.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* Nearest Assigned Responder Profile Card */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Ambulance className="h-4 w-4 text-emerald-400" />
                          Assigned Unit:
                        </span>
                        <span className="font-mono text-[10px] font-bold text-emerald-400">
                          AUTO-MATCHED
                        </span>
                      </div>
                      {activeSOS.responder ? (
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-lg">
                            {activeSOS.responder.avatar}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-xs text-white truncate">
                              {activeSOS.responder.name}
                            </h5>
                            <p className="text-[11px] text-slate-400">
                              {activeSOS.responder.role} · {activeSOS.responder.unit}
                            </p>
                            <p className="text-[10px] font-mono text-emerald-400 mt-0.5">
                              📍 {activeSOS.responder.location}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Locating nearest available responder...</p>
                      )}
                    </div>
                  </div>

                  {/* Crowd-Aware Routing & 30m Volunteer Mesh */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Crowd-Aware Routing Visualizer */}
                    <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                        <Navigation className="h-4 w-4 text-sky-400" />
                        Crowd-Aware Smart Routing
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        <span className="text-rose-400 font-bold">Avoided Chokepoint:</span> {activeSOS.crowdRoute?.avoidZoneName} (4.4 p/m² critical density).
                      </p>
                      <p className="text-[11px] text-emerald-300 font-mono">
                        ✓ Rerouted via {activeSOS.crowdRoute?.detourName} (&lt; 1.6 p/m²) — Saved approx. {activeSOS.crowdRoute?.timeSavedMinutes} minutes.
                      </p>
                    </div>

                    {/* Nearby Volunteer Mesh (30m Radius) */}
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between font-mono text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-emerald-400" />
                          30m Volunteer Mesh
                        </span>
                        <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 text-[10px] text-emerald-300">
                          {activeSOS.nearbyVolunteersNotified} VOLUNTEERS
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Discreet silent vibration sent to 6 nearby First-Aid certified ticket holders within 30m radius to initiate CPR/hydration while medics navigate.
                      </p>
                    </div>
                  </div>

                  {/* Calm Directional Broadcast (Panic Prevention) */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        <Radio className="h-4 w-4 text-info" />
                        Calm Targeted Sector Announcement (Panic Prevention)
                      </div>
                      {/* Language Selector */}
                      <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800 p-0.5 text-[10px] font-mono">
                        <button
                          type="button"
                          onClick={() => setLang('en')}
                          className={`rounded px-1.5 py-0.5 ${lang === 'en' ? 'bg-info text-slate-950 font-bold' : 'text-slate-400'}`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => setLang('hi')}
                          className={`rounded px-1.5 py-0.5 ${lang === 'hi' ? 'bg-info text-slate-950 font-bold' : 'text-slate-400'}`}
                        >
                          हिंदी
                        </button>
                        <button
                          type="button"
                          onClick={() => setLang('mr')}
                          className={`rounded px-1.5 py-0.5 ${lang === 'mr' ? 'bg-info text-slate-950 font-bold' : 'text-slate-400'}`}
                        >
                          मराठी
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 bg-slate-950/80 p-2 rounded-lg border border-slate-800 font-mono">
                      &quot;{calmMessages[lang]}&quot;
                    </p>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        Sends targeted, calm audio/text without triggering crowd panic across 50,000 attendees.
                      </span>
                      <button
                        type="button"
                        onClick={sendCalmBroadcast}
                        disabled={activeSOS.calmMessageSent}
                        className={`flex items-center gap-1 rounded-lg px-3 py-1 font-mono text-xs font-bold transition ${
                          activeSOS.calmMessageSent
                            ? 'bg-emerald-600 text-white cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {activeSOS.calmMessageSent ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-white" />
                            Broadcast Sent to Gate B
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            Send Calm Notice
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: ATTENDEE 1-TAP SOS SIMULATOR */}
          {activeTab === 'attendee' && (
            <div className="max-w-md mx-auto rounded-3xl border-4 border-slate-700 bg-slate-900 p-4 shadow-2xl space-y-4">
              {/* Phone Status Notch */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-2 pb-1 border-b border-slate-800">
                <span className="font-bold text-white">19:42</span>
                <span>SurgeGuard Attendee Companion</span>
                <span>5G · 98%</span>
              </div>

              {/* Attendee Location Header */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rose-400" />
                    <div>
                      <h5 className="text-xs font-bold text-white">MMRDA Grounds, BKC</h5>
                      <p className="text-[10px] text-slate-400 font-mono">
                        GPS Active: Sector Gate B (Concourse East)
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-mono text-emerald-300">
                    ONLINE
                  </span>
                </div>
              </div>

              {/* Active Incident Feedback Card if triggered */}
              {activeSOS && (
                <div className="rounded-xl border border-rose-500 bg-rose-950/80 p-3.5 text-center animate-pulse">
                  <span className="font-mono text-xs font-bold text-rose-300 block">
                    🚨 SOS BEACON TRANSMITTED
                  </span>
                  <p className="text-xs text-white mt-1">
                    {activeSOS.responder?.name} has been assigned.
                  </p>
                  <p className="text-[11px] text-amber-300 font-mono mt-0.5">
                    {activeSOS.status === 'dispatched'
                      ? `Paramedics En Route (ETA ${activeSOS.etaSeconds}s)`
                      : 'Responder assigned. Stand by.'}
                  </p>
                </div>
              )}

              {/* 1-Tap SOS Triage Buttons */}
              <div className="space-y-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-rose-300 block">
                  Select Emergency Type (1-Tap):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => triggerSOS('medical', 'gate-b')}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-rose-500/60 bg-rose-600/20 hover:bg-rose-600/40 p-3 transition"
                  >
                    <span className="text-2xl">😵</span>
                    <span className="font-bold text-xs text-white">Medical Help</span>
                    <span className="text-[9px] text-rose-200">Fainted / Heart / Heat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerSOS('fire', 'gate-b')}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-amber-500/60 bg-amber-600/20 hover:bg-amber-600/40 p-3 transition"
                  >
                    <span className="text-2xl">🔥</span>
                    <span className="font-bold text-xs text-white">Fire / Smoke</span>
                    <span className="text-[9px] text-amber-200">Pyro / Electrical</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerSOS('lost_child', 'gate-b')}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-sky-500/60 bg-sky-600/20 hover:bg-sky-600/40 p-3 transition"
                  >
                    <span className="text-2xl">👶</span>
                    <span className="font-bold text-xs text-white">Lost Child</span>
                    <span className="text-[9px] text-sky-200">Separated Minor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerSOS('harassment', 'gate-b')}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-purple-500/60 bg-purple-600/20 hover:bg-purple-600/40 p-3 transition"
                  >
                    <span className="text-2xl">🛡️</span>
                    <span className="font-bold text-xs text-white">Harassment</span>
                    <span className="text-[9px] text-purple-200">Safety Threat</span>
                  </button>
                </div>
              </div>

              {/* Find My Friends & Safe Meeting Point Card */}
              <div className="rounded-xl border border-sky-500/40 bg-sky-950/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-sky-300 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-sky-400" />
                    Find My Friends (3 Connected via Peer Mesh)
                  </span>
                  <span className="rounded bg-sky-500/20 px-1.5 py-0.2 text-[9px] text-sky-300">
                    5G ACTIVE
                  </span>
                </div>

                <div className="space-y-1 text-[10px] font-mono">
                  <div className="flex items-center justify-between bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-200">🟢 Rahul M.</span>
                    <span className="text-slate-400">14m · Food Court</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-200">🟡 Priya K.</span>
                    <span className="text-amber-300">38m · Arena East</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-sky-900/30 border border-sky-500/30 text-[10px]">
                  <div className="flex items-center gap-1 text-sky-300 font-bold font-mono">
                    <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    <span>Safe Meeting Point (Auto-Recommended):</span>
                  </div>
                  <p className="text-[9.5px] text-slate-300 mt-0.5">
                    <b>Water Point #2 (Near Gate C)</b> · Low Density (&lt;1.4 p/m²) · Egress Corridor Clear
                  </p>
                </div>
              </div>

              {/* Volunteer Opt-In Switch */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between">
                <div>
                  <h6 className="text-xs font-bold text-slate-200">First-Aid Volunteer Network</h6>
                  <p className="text-[10px] text-slate-400">Receive discreet 30m peer alerts</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVolunteer((v) => !v)}
                  className={`h-6 w-11 rounded-full p-0.5 transition ${isVolunteer ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`h-5 w-5 rounded-full bg-white transition ${isVolunteer ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-800 bg-slate-900/60 px-5 py-3.5 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
          >
            Close Window
          </button>

          {activeSOS && (
            <div className="flex items-center gap-2">
              {!isAssigned && (
                <button
                  type="button"
                  onClick={assignResponder}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-2 font-mono text-xs font-bold text-white shadow-md transition"
                >
                  <Users className="h-3.5 w-3.5" />
                  Assign Responder
                </button>
              )}

              {isAssigned && !isDispatched && !isResolved && (
                <button
                  type="button"
                  onClick={dispatchParamedics}
                  className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-5 py-2 font-mono text-xs font-bold text-white shadow-lg shadow-rose-600/40 transition hover:scale-105"
                >
                  <Ambulance className="h-4 w-4" />
                  Deploy Unit & Navigate (Live ETA) 🚑
                </button>
              )}

              {(isDispatched || isResolved) && (
                <button
                  type="button"
                  onClick={() => {
                    resolveSOS();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 font-mono text-xs font-bold text-white shadow-md transition"
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirm Patient Stabilization & Resolve
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
