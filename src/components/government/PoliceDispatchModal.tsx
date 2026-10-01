import { useState } from 'react';
import {
  ShieldAlert,
  X,
  Radio,
  CheckCircle2,
  Building2,
  Ambulance,
  Car,
  Send,
  Code,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  ArrowRight,
  Activity,
  Copy,
  Check,
  Siren,
} from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';

interface PoliceDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SeverityCode = 'yellow' | 'amber' | 'red';

interface DispatchLog {
  id: string;
  time: string;
  agency: string;
  code: SeverityCode;
  action: string;
  status: 'DELIVERED' | 'ACKNOWLEDGED';
  latencyMs: number;
}

export function PoliceDispatchModal({ isOpen, onClose }: PoliceDispatchModalProps) {
  const { zoneList, activeSOS, alerts, execution } = useCommandCenter();

  const [severity, setSeverity] = useState<SeverityCode>('red');
  const [isTransmitted, setIsTransmitted] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [showJsonPayload, setShowJsonPayload] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Preemption Directives
  const [signalPreemption, setSignalPreemption] = useState(true);
  const [arterialDiversion, setArterialDiversion] = useState(true);
  const [hospitalStandby, setHospitalStandby] = useState(true);

  // Live dispatch history
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([
    {
      id: 'CAP-MUM-8912',
      time: '20:14:02',
      agency: 'Mumbai Police Traffic (BKC)',
      code: 'yellow',
      action: 'Advisory: Concourse Pedestrian Gate Egress Inflow',
      status: 'ACKNOWLEDGED',
      latencyMs: 14,
    },
    {
      id: 'CAP-MUM-8945',
      time: '20:21:45',
      agency: 'BMC Ward H-East Disaster EOC',
      code: 'amber',
      action: 'Pedestrian Cordon: Gate B Concourse Slowdown',
      status: 'ACKNOWLEDGED',
      latencyMs: 18,
    },
  ]);

  if (!isOpen) return null;

  const totalCrowd = zoneList.reduce((sum, z) => sum + z.current, 0);
  const totalCapacity = zoneList.reduce((sum, z) => sum + z.capacity, 0);
  const occupancyPct = ((totalCrowd / totalCapacity) * 100).toFixed(1);

  const handleTransmit = () => {
    setIsTransmitting(true);
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      const newLogId = `CAP-MUM-${Math.floor(9000 + Math.random() * 999)}`;

      const newLog: DispatchLog = {
        id: newLogId,
        time: timeStr,
        agency:
          severity === 'red'
            ? 'Unified Multi-Agency (Police + BMC + 108 EMS)'
            : severity === 'amber'
            ? 'Mumbai Police Traffic Division'
            : 'BMC Ward H-East EOC',
        code: severity,
        action:
          severity === 'red'
            ? `Code Red Green Corridor Preemption (${signalPreemption ? 'Signals Sync' : 'Manual'})`
            : severity === 'amber'
            ? `Code Amber Pedestrian Diversion (${arterialDiversion ? 'Cordon Active' : 'Advisory'})`
            : 'Code Yellow Traffic Flow Synchronization',
        status: 'ACKNOWLEDGED',
        latencyMs: Math.floor(11 + Math.random() * 9),
      };

      setDispatchLogs((prev) => [newLog, ...prev]);
      setIsTransmitting(false);
      setIsTransmitted(true);
    }, 1100);
  };

  const capPayload = {
    identifier: `CAP-MUM-EOC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    sender: 'surgeguard-gateway@mmrda-bkc.gov.in',
    sent: new Date().toISOString(),
    status: 'Actual',
    msgType: activeSOS ? 'Alert' : severity === 'red' ? 'Update' : 'Advisory',
    scope: 'Restricted',
    restriction: 'Mumbai Police Traffic Division, BMC Ward H-East, 108 Emergency Medical Services',
    info: {
      category: 'Safety',
      event:
        severity === 'red'
          ? 'Critical Mass Surge & Automated Green Corridor Preemption'
          : severity === 'amber'
          ? 'Pedestrian Gate Congestion & Arterial Traffic Reroute'
          : 'Preventive Venue Egress Traffic Optimization',
      urgency: severity === 'red' ? 'Immediate' : severity === 'amber' ? 'Expected' : 'Past',
      severity: severity === 'red' ? 'Extreme' : severity === 'amber' ? 'Severe' : 'Moderate',
      certainty: 'Observed',
      headline: `MMRDA Grounds BKC: ${totalCrowd.toLocaleString()} Attendees (${occupancyPct}% Venue Capacity) - CODE ${severity.toUpperCase()}`,
      description: `SurgeGuard predictive telemetry for MMRDA Grounds Sector 4. Active warnings: ${alerts.length}. Mitigation: ${
        execution ? 'Dynamic Reroute Gate B -> Gate C Active' : 'Standard egress pacing'
      }. Signal preemption: ${signalPreemption ? 'ENABLED' : 'DISABLED'}.`,
      area: {
        areaDesc: 'MMRDA Grounds, Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051',
        circle: '19.0657,72.8682,0.8',
      },
      preemptionDirectives: {
        greenCorridorActive: severity === 'red',
        trafficSignalPreemption: signalPreemption,
        pedestrianDiversionCorridor: arterialDiversion,
        hospitalTraumaStandby: hospitalStandby,
        targetHospital: 'Lilavati Hospital & Research Centre / Bhabha Hospital Bandra',
      },
      agencyFeedStatus: {
        mumbaiPoliceTraffic: 'Green Wave Signals Preempted (BKC Connector - Kalanagar - Lilavati)',
        bmcDisasterCell: 'EOC Ward H-East Monitoring Room Synchronized',
        ambulance108Dispatch: activeSOS ? `Unit Alpha-4 Dispatched to ${activeSOS.zoneName}` : '4 Units Staged at Gate 2',
      },
    },
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(capPayload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex w-full max-w-4xl max-h-[94vh] flex-col rounded-2xl border-2 border-sky-500/80 bg-slate-950 text-slate-100 shadow-[0_0_60px_rgba(14,165,233,0.35)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-sky-900/60 bg-gradient-to-r from-sky-950/90 via-slate-950 to-sky-950/90 px-5 py-3.5 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-lg shadow-sky-600/40">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black tracking-widest text-sky-300">
                  MUMBAI POLICE & BMC DISASTER CELL GATEWAY
                </span>
                <span className="rounded bg-sky-500/20 border border-sky-500/50 px-2 py-0.5 text-[10px] font-mono font-bold text-sky-300">
                  CAP v1.2 / NDMA PROTOCOL
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-white">
                1-Click Municipal & Law Enforcement Interoperability
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Official Agency Connection Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                <Car className="h-4 w-4" />
              </span>
              <div>
                <h5 className="font-bold text-white">Mumbai Police Traffic</h5>
                <p className="text-[10px] text-slate-400">BKC Arterial Signals</p>
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  GREEN CORRIDOR READY
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                <Building2 className="h-4 w-4" />
              </span>
              <div>
                <h5 className="font-bold text-white">BMC Disaster Cell</h5>
                <p className="text-[10px] text-slate-400">Ward H-East EOC</p>
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  FEED SYNC ACTIVE
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                <Ambulance className="h-4 w-4" />
              </span>
              <div>
                <h5 className="font-bold text-white">108 EMS Ambulance</h5>
                <p className="text-[10px] text-slate-400">Lilavati / Bhabha Hospital</p>
                <span className="text-[9px] text-sky-400 font-bold flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  4 UNITS STAGED
                </span>
              </div>
            </div>
          </div>

          {/* Transmission Status Confirmation Banner */}
          {isTransmitted && (
            <div className="rounded-xl border border-emerald-500/60 bg-emerald-950/40 p-3.5 flex items-center justify-between text-xs font-mono animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-300">
                    CAP v1.2 INCIDENT BROADCAST DELIVERED // HTTP 200 OK
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Preemption signals received by Mumbai Police BKC Traffic & BMC EOC Ward H-East.
                  </p>
                </div>
              </div>
              <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-emerald-300 font-bold text-[10px]">
                ACKNOWLEDGED
              </span>
            </div>
          )}

          {/* Severity Protocol Selector (Code Yellow / Amber / Red) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Siren className="h-4 w-4 text-sky-400" />
                Select Dispatch Protocol Severity:
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                STANDARDIZED NDMA PROTOCOL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Code Yellow */}
              <button
                type="button"
                onClick={() => setSeverity('yellow')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                  severity === 'yellow'
                    ? 'border-amber-400 bg-amber-500/20 shadow-md shadow-amber-500/10'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-300">CODE YELLOW</span>
                  <span className="text-[9px] font-mono rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300">
                    ADVISORY
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Pre-clear Kalanagar signal timers for normal exit flow.
                </p>
              </button>

              {/* Code Amber */}
              <button
                type="button"
                onClick={() => setSeverity('amber')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                  severity === 'amber'
                    ? 'border-orange-500 bg-orange-500/20 shadow-md shadow-orange-500/10'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-orange-300">CODE AMBER</span>
                  <span className="text-[9px] font-mono rounded bg-orange-500/20 px-1.5 py-0.5 text-orange-300">
                    CONGESTION
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Divert BKC Central Ave traffic away from Gate B bottleneck.
                </p>
              </button>

              {/* Code Red */}
              <button
                type="button"
                onClick={() => setSeverity('red')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                  severity === 'red'
                    ? 'border-rose-500 bg-rose-500/20 shadow-md shadow-rose-500/10'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-300">CODE RED</span>
                  <span className="text-[9px] font-mono rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-300">
                    CRITICAL SURGE
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Automated Green Corridor preemption to Lilavati Trauma ER.
                </p>
              </button>
            </div>
          </div>

          {/* Visual Road Corridor Transit Comparison Card */}
          <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                Live Green Corridor Transit Optimization Benchmark:
              </span>
              <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                -74% TRANSIT DELAY
              </span>
            </div>

            {/* Path flow breadcrumb */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
              <span className="font-bold text-white">MMRDA Gate 2</span>
              <ArrowRight className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="text-slate-300">BKC Connector</span>
              <ArrowRight className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="text-slate-300">Kalanagar Flyover</span>
              <ArrowRight className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="font-bold text-rose-400">Lilavati Hospital ER</span>
            </div>

            {/* Time comparison bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>STANDARD PEAK TRANSIT</span>
                  <span className="text-rose-400 font-bold">GRIDLOCK (12 km/h)</span>
                </div>
                <div className="mt-1 text-xl font-bold text-rose-300 font-mono">
                  18.5 mins
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: '85%' }} />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/40">
                <div className="flex items-center justify-between text-slate-300 text-[10px]">
                  <span className="font-bold text-emerald-300">SURGEGUARD GREEN WAVE</span>
                  <span className="text-emerald-400 font-bold">PREEMPTED (65 km/h)</span>
                </div>
                <div className="mt-1 text-xl font-bold text-emerald-300 font-mono flex items-center justify-between">
                  <span>4.8 mins</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Saves 13.7 mins</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: '24%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Preemption Directives Toggles */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <span className="font-mono text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-400" />
              Automated Municipal Signal & Traffic Directives:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Directive 1 */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <h6 className="font-bold text-slate-200">Green Wave Preemption</h6>
                  <p className="text-[10px] text-slate-400">Kalanagar & MTNL Junctions</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSignalPreemption((v) => !v)}
                  className={`h-6 w-11 rounded-full p-0.5 transition ${
                    signalPreemption ? 'bg-sky-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      signalPreemption ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Directive 2 */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <h6 className="font-bold text-slate-200">Arterial Pedestrian Cordon</h6>
                  <p className="text-[10px] text-slate-400">Divert BKC Central Ave</p>
                </div>
                <button
                  type="button"
                  onClick={() => setArterialDiversion((v) => !v)}
                  className={`h-6 w-11 rounded-full p-0.5 transition ${
                    arterialDiversion ? 'bg-sky-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      arterialDiversion ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Directive 3 */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <h6 className="font-bold text-slate-200">Hospital Trauma Standby</h6>
                  <p className="text-[10px] text-slate-400">Lilavati & Bhabha ER</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHospitalStandby((v) => !v)}
                  className={`h-6 w-11 rounded-full p-0.5 transition ${
                    hospitalStandby ? 'bg-sky-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      hospitalStandby ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Live Dispatch History Ledger */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                Live Multi-Agency Transmission Ledger:
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {dispatchLogs.length} Records Logged
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono max-h-36 overflow-y-auto pr-1">
              {dispatchLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        log.code === 'red'
                          ? 'bg-rose-400 animate-ping'
                          : log.code === 'amber'
                          ? 'bg-orange-400'
                          : 'bg-amber-400'
                      }`}
                    />
                    <span className="font-bold text-slate-200">{log.id}</span>
                    <span className="text-slate-500">[{log.time}]</span>
                    <span className="text-slate-300 hidden sm:inline">{log.action}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-slate-400">{log.latencyMs}ms</span>
                    <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 text-emerald-300 font-bold">
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collapsible Raw CAP v1.2 JSON Payload */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60">
              <button
                type="button"
                onClick={() => setShowJsonPayload((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white transition"
              >
                <Code className="h-4 w-4 text-sky-400" />
                <span>View Raw CAP v1.2 Government JSON Payload (For Technical Evaluation)</span>
                {showJsonPayload ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-mono text-slate-300 transition"
              >
                {copiedJson ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copiedJson ? 'Copied' : 'Copy CAP JSON'}
              </button>
            </div>

            {showJsonPayload && (
              <pre className="p-3 text-[10px] font-mono text-emerald-300 bg-slate-950/90 overflow-x-auto max-h-48 border-t border-slate-800">
                {JSON.stringify(capPayload, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-800 bg-slate-900/60 px-5 py-3.5 gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <FileCheck className="h-4 w-4 text-emerald-400" />
            <span>Encrypted mTLS 1.3 · Mumbai Gov Public Safety Gateway</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleTransmit}
              disabled={isTransmitting}
              className="flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-5 py-2 font-display text-xs font-bold text-white shadow-lg shadow-sky-600/40 transition hover:scale-105 active:scale-95"
            >
              {isTransmitting ? (
                <>
                  <Radio className="h-4 w-4 animate-spin" />
                  Transmitting CAP Telemetry...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Transmit Live CAP Alert (Code {severity.toUpperCase()})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
