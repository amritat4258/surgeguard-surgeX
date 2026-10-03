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
  Zap,
  HelpCircle,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import { VENUE_FACILITIES } from '@/data/facilities';
import type { SOSType, SOSSeverity } from '@/types';

interface SOSDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_MESSAGES = [
  'Help is on the way. Please stay where you are.',
  'Paramedic assigned with AED kit. Wave your hand or flash torch.',
  'Move carefully towards the nearest well-lit perimeter exit.',
  'First aid volunteer nearby has been notified to assist you.',
];

export function SOSDispatchModal({ isOpen, onClose }: SOSDispatchModalProps) {
  const {
    activeSOS,
    triggerSOS,
    acknowledgeSOS,
    assignResponder,
    dispatchParamedics,
    messageAttendee,
    sendCalmBroadcast,
    resolveSOS,
    autoDispatchEnabled,
    toggleAutoDispatch,
    inUseMedkits,
  } = useCommandCenter();

  const [activeTab, setActiveTab] = useState<'dispatcher' | 'attendee'>('dispatcher');
  const [lang, setLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [isVolunteer, setIsVolunteer] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [messageSentFeedback, setMessageSentFeedback] = useState(false);

  // Attendee tab form state
  const [simType, setSimType] = useState<SOSType>('medical');
  const [simSeverity, setSimSeverity] = useState<SOSSeverity>('critical');
  const [simNote, setSimNote] = useState('');
  const [simPeopleCount, setSimPeopleCount] = useState(1);

  if (!isOpen) return null;

  const isReceived = activeSOS?.status === 'received' || activeSOS?.status === 'active';
  const isDispatched = activeSOS?.status === 'dispatched';
  const isAssigned = activeSOS?.status === 'assigned' || isDispatched;
  const isResolved = activeSOS?.status === 'resolved';

  const calmMessages = {
    en: 'Notice: Please keep center aisle clear for emergency service access. Concessions remain open normally.',
    hi: 'सूचना: कृपया आपातकालीन सहायता दल के लिए मुख्य गलियारा खाली रखें। सहायता पहुंच रही है।',
    mr: 'सूचना: कृपया आपत्कालीन मदत पथकासाठी मुख्य मार्ग मोकळा ठेवा. इतर सेवा सुरळीत सुरू आहेत.',
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend ?? messageText;
    if (!text.trim()) return;
    messageAttendee(text.trim());
    setMessageText('');
    setMessageSentFeedback(true);
    setTimeout(() => setMessageSentFeedback(false), 2500);
  };

  const medkits = VENUE_FACILITIES.filter((f) => f.kind === 'medical');

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
              <h3 className="font-display text-base font-bold text-ink">
                {activeSOS ? activeSOS.label : 'Emergency Operations & Triage Console'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Dispatch Toggle */}
            <button
              type="button"
              onClick={toggleAutoDispatch}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-bold transition ${
                autoDispatchEnabled
                  ? 'border-emerald-500/60 bg-emerald-950/50 text-emerald-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
              title="Automatically dispatch nearest medkit when critical SOS arrives"
            >
              <Zap className={`h-3.5 w-3.5 ${autoDispatchEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>Auto-Dispatch: {autoDispatchEnabled ? 'ON' : 'OFF'}</span>
            </button>

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
              aria-label="Close SOS Modal"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-ink transition ml-1"
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
                    <h4 className="font-display text-base font-bold text-ink">
                      All Sectors Normal · Emergency Rapid Response On Standby
                    </h4>
                    <p className="mt-1 text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                      MMRDA Grounds BKC is monitored by 3 First Aid / Medkit posts, 4 tactical marshalls, and 12 rapid response personnel. Click any scenario below to trigger a live distress beacon demo.
                    </p>

                    {/* Quick Trigger Scenarios for Demo */}
                    <div className="mt-6 border-t border-slate-800 pt-5">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-300 block mb-3">
                        ⚡ Simulate Emergency Incident (For Judges & Presenters):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => triggerSOS('medical', 'gate-b', 'critical')}
                          className="flex flex-col items-start gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/50 p-3 text-left transition group"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600/30 text-rose-300 group-hover:scale-110 transition">
                              <HeartPulse className="h-4 w-4" />
                            </span>
                            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-mono text-rose-300 font-bold">
                              CRITICAL
                            </span>
                          </div>
                          <span className="font-bold text-xs text-ink">1. Medical Collapse</span>
                          <span className="text-[10px] text-slate-400">Attendee fainted / heat stroke at Gate B</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => triggerSOS('fire', 'gate-b', 'critical')}
                          className="flex flex-col items-start gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/50 p-3 text-left transition group"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600/30 text-amber-300 group-hover:scale-110 transition">
                              <Flame className="h-4 w-4" />
                            </span>
                            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-mono text-rose-300 font-bold">
                              CRITICAL
                            </span>
                          </div>
                          <span className="font-bold text-xs text-ink">2. Pyrotechnic Fire</span>
                          <span className="text-[10px] text-slate-400">Stage smoke flare / truss hazard</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => triggerSOS('crush', 'gate-b', 'critical')}
                          className="flex flex-col items-start gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/50 p-3 text-left transition group"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600/30 text-rose-300 group-hover:scale-110 transition">
                              <AlertOctagon className="h-4 w-4" />
                            </span>
                            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-mono text-rose-300 font-bold">
                              CRITICAL
                            </span>
                          </div>
                          <span className="font-bold text-xs text-ink">3. Crowd Crush Hazard</span>
                          <span className="text-[10px] text-slate-400">Barricade surge & crowd density pressure</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => triggerSOS('security', 'gate-b', 'urgent')}
                          className="flex flex-col items-start gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/30 hover:bg-purple-900/50 p-3 text-left transition group"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600/30 text-purple-300 group-hover:scale-110 transition">
                              <ShieldAlert className="h-4 w-4" />
                            </span>
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono text-amber-300 font-bold">
                              URGENT
                            </span>
                          </div>
                          <span className="font-bold text-xs text-ink">4. Security Threat</span>
                          <span className="text-[10px] text-slate-400">Tactical marshal extraction needed</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => triggerSOS('lost_child', 'gate-b', 'assistance')}
                          className="flex flex-col items-start gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/30 hover:bg-sky-900/50 p-3 text-left transition group"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600/30 text-sky-300 group-hover:scale-110 transition">
                              <Baby className="h-4 w-4" />
                            </span>
                            <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-mono text-sky-300 font-bold">
                              ASSISTANCE
                            </span>
                          </div>
                          <span className="font-bold text-xs text-ink">5. Lost Child</span>
                          <span className="text-[10px] text-slate-400">7-yr-old minor separated from guardian</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => triggerSOS('other', 'gate-b', 'assistance')}
                          className="flex flex-col items-start gap-1.5 rounded-xl border border-slate-700 bg-slate-900/40 hover:bg-slate-800 p-3 text-left transition group"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700 text-slate-300 group-hover:scale-110 transition">
                              <HelpCircle className="h-4 w-4" />
                            </span>
                            <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[9px] font-mono text-slate-300 font-bold">
                              ASSISTANCE
                            </span>
                          </div>
                          <span className="font-bold text-xs text-ink">6. General Assistance</span>
                          <span className="text-[10px] text-slate-400">Custom attendee emergency beacon</span>
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
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Live Incident Status Pipeline:
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        Device ID: <span className="text-slate-200">{activeSOS.deviceId ?? 'ANON-APP'}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col items-center text-center p-2 rounded-lg bg-rose-950/60 border border-rose-500/60">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-bold mb-1">
                          ✓
                        </span>
                        <span className="font-mono text-[10px] font-bold text-rose-300">1. RECEIVED</span>
                        <span className="text-[9px] text-slate-400">Distress Logged</span>
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
                        <span className="text-[9px] text-slate-400">Medkit / Responder</span>
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
                        <span className="text-[9px] text-slate-400">Stabilized</span>
                      </div>
                    </div>
                  </div>

                  {/* Incident Situation & Severity Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Incident Details & Classification */}
                    <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                          <AlertOctagon className="h-4 w-4 text-rose-400" />
                          Incident Report:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {activeSOS.severity === 'critical' && (
                            <span className="rounded bg-rose-500/20 border border-rose-500/60 px-2 py-0.5 text-[10px] font-mono font-black text-rose-300 animate-pulse">
                              CRITICAL
                            </span>
                          )}
                          {activeSOS.severity === 'urgent' && (
                            <span className="rounded bg-amber-500/20 border border-amber-500/60 px-2 py-0.5 text-[10px] font-mono font-black text-amber-300">
                              URGENT
                            </span>
                          )}
                          {activeSOS.severity === 'assistance' && (
                            <span className="rounded bg-sky-500/20 border border-sky-500/60 px-2 py-0.5 text-[10px] font-mono font-black text-sky-300">
                              ASSISTANCE
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-slate-400">
                            {activeSOS.id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink uppercase">
                          {activeSOS.type.replace('_', ' ')}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-xs text-slate-300 font-medium">
                          {activeSOS.zoneName} ({activeSOS.coordinates.x}, {activeSOS.coordinates.y})
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 leading-snug">
                        {activeSOS.description}
                      </p>

                      {activeSOS.note && (
                        <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2 text-xs text-rose-200 font-mono">
                          <span className="text-slate-400">Attendee Note: </span>
                          &quot;{activeSOS.note}&quot;
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
                        {activeSOS.peopleCount && activeSOS.peopleCount > 1 && (
                          <span className="flex items-center gap-1 text-amber-300 font-bold">
                            <Users className="h-3 w-3" />
                            {activeSOS.peopleCount} People Affected
                          </span>
                        )}
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

                    {/* Nearest Medkit & Responder Allocation */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Ambulance className="h-4 w-4 text-emerald-400" />
                          Nearest Medkit & Unit:
                        </span>
                        <span className="font-mono text-[10px] font-bold text-emerald-400">
                          CROWD-WEIGHTED
                        </span>
                      </div>

                      {/* Allocated Medkit Card */}
                      <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-ink flex items-center gap-1.5">
                            <span className="text-base">🚑</span>
                            {activeSOS.medkitAllocated?.medkitName ?? activeSOS.nearestMedName}
                          </span>
                          <span className="font-mono text-[11px] font-black text-emerald-300">
                            ETA: {activeSOS.medkitAllocated?.etaSeconds ?? activeSOS.etaSeconds}s
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300">
                          Speed: 2.0 m/s · Crowd transit penalty factored across active sectors.
                        </p>
                      </div>

                      {/* Available Venue Medkit Posts Status */}
                      <div className="space-y-1.5 pt-1">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Venue Medkit Station Availability:
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          {medkits.map((mk) => {
                            const isInUse = inUseMedkits.includes(mk.id);
                            return (
                              <div
                                key={mk.id}
                                className={`p-1.5 rounded-lg border text-[10px] font-mono ${
                                  isInUse
                                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                    : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                                }`}
                              >
                                <div className="font-bold truncate">{mk.name.split('(')[0]}</div>
                                <div className="text-[9px] font-semibold mt-0.5">
                                  {isInUse ? 'IN-USE' : 'AVAILABLE'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two-Way Attendee Messaging Console */}
                  <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                        <Smartphone className="h-4 w-4 text-sky-400" />
                        Live Message To Attendee Phone (Two-Way Comms)
                      </div>
                      {messageSentFeedback && (
                        <span className="font-mono text-[10px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                          <Check className="h-3 w-3" /> Transmitted to device
                        </span>
                      )}
                    </div>

                    {/* Quick Preset Message Buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_MESSAGES.map((msg, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendMessage(msg)}
                          className="rounded-lg border border-sky-500/30 bg-sky-900/30 hover:bg-sky-800/50 px-2 py-1 text-[10px] text-sky-200 transition text-left"
                        >
                          &quot;{msg}&quot;
                        </button>
                      ))}
                    </div>

                    {/* Custom Text Input */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type direct guidance to attendee screen..."
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-ink placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!messageText.trim()}
                        className="flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-3 py-1.5 text-xs font-mono font-bold text-white transition"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send</span>
                      </button>
                    </form>
                  </div>

                  {/* Crowd-Aware Detour & 30m Volunteer Mesh */}
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
                            <Check className="h-3.5 w-3.5 text-ink" />
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
                <span className="font-bold text-ink">19:42</span>
                <span>SurgeGuard Attendee Companion</span>
                <span>5G · 98%</span>
              </div>

              {/* Attendee Location Header */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rose-400" />
                    <div>
                      <h5 className="text-xs font-bold text-ink">MMRDA Grounds, BKC</h5>
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
                  <p className="text-xs text-ink mt-1">
                    {activeSOS.responder?.name} has been assigned.
                  </p>
                  <p className="text-[11px] text-amber-300 font-mono mt-0.5">
                    {activeSOS.status === 'dispatched'
                      ? `Paramedics En Route (ETA ${activeSOS.etaSeconds}s)`
                      : 'Responder assigned. Stand by.'}
                  </p>
                </div>
              )}

              {/* Configure Simulation */}
              <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-rose-300 block">
                  1. Select Emergency Classification:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimType('medical')}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition ${
                      simType === 'medical'
                        ? 'border-rose-500 bg-rose-950/80 text-rose-200'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <HeartPulse className="h-4 w-4 text-rose-400" />
                    <span className="text-[11px] font-bold">Medical</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimType('fire')}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition ${
                      simType === 'fire'
                        ? 'border-amber-500 bg-amber-950/80 text-amber-200'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <Flame className="h-4 w-4 text-amber-400" />
                    <span className="text-[11px] font-bold">Fire / Smoke</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimType('crush')}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition ${
                      simType === 'crush'
                        ? 'border-rose-500 bg-rose-950/80 text-rose-200'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <AlertOctagon className="h-4 w-4 text-rose-400" />
                    <span className="text-[11px] font-bold">Crowd Crush</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimType('security')}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition ${
                      simType === 'security'
                        ? 'border-purple-500 bg-purple-950/80 text-purple-200'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4 text-purple-400" />
                    <span className="text-[11px] font-bold">Security</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimType('lost_child')}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition ${
                      simType === 'lost_child'
                        ? 'border-sky-500 bg-sky-950/80 text-sky-200'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <Baby className="h-4 w-4 text-sky-400" />
                    <span className="text-[11px] font-bold">Lost Child</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimType('other')}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition ${
                      simType === 'other'
                        ? 'border-slate-500 bg-slate-800 text-slate-200'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <HelpCircle className="h-4 w-4 text-slate-400" />
                    <span className="text-[11px] font-bold">Other</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <label className="font-mono text-[10px] text-slate-400 block mb-1">
                      Severity:
                    </label>
                    <select
                      value={simSeverity}
                      onChange={(e) => setSimSeverity(e.target.value as SOSSeverity)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-ink"
                    >
                      <option value="critical">Critical (Immediate)</option>
                      <option value="urgent">Urgent</option>
                      <option value="assistance">Assistance</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] text-slate-400 block mb-1">
                      People Affected:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={simPeopleCount}
                      onChange={(e) => setSimPeopleCount(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-ink"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => triggerSOS(simType, 'gate-b', simSeverity)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 font-mono text-xs font-bold text-white shadow-lg transition"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Transmit Live SOS Distress Beacon</span>
                </button>
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
            <div className="flex flex-wrap items-center gap-2">
              {isReceived && !isAssigned && (
                <button
                  type="button"
                  onClick={() => acknowledgeSOS(activeSOS.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/50 bg-rose-950/60 hover:bg-rose-900/80 px-3 py-2 font-mono text-xs font-bold text-rose-200 shadow-md transition"
                >
                  <Check className="h-3.5 w-3.5" />
                  Acknowledge SOS
                </button>
              )}

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
                  onClick={() => dispatchParamedics()}
                  className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-5 py-2 font-mono text-xs font-bold text-white shadow-lg shadow-rose-600/40 transition hover:scale-105"
                >
                  <Ambulance className="h-4 w-4" />
                  Deploy Unit & Navigate (Live ETA: {activeSOS.medkitAllocated?.etaSeconds ?? activeSOS.etaSeconds}s) 🚑
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
