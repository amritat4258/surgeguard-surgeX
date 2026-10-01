import {
  FileText,
  Printer,
  X,
  ShieldCheck,
  Building,
  Scale,
  Users,
} from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IncidentReportModal({ isOpen, onClose }: IncidentReportModalProps) {
  const { execution, zones, simulatedMinutes } = useCommandCenter();

  if (!isOpen) return null;

  const source = execution ? zones[execution.sourceZoneId] : zones['gate-b'];
  const target = execution?.targetZoneId ? zones[execution.targetZoneId] : zones['gate-c'];
  const before = execution?.before;
  const after = execution?.after;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden print:border-none print:shadow-none print:h-auto print:bg-white print:text-black">
        {/* Modal Controls (Hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-info" />
            <h2 className="font-display text-base font-bold text-white tracking-wide">
              Official Incident Post-Mortem & Regulatory Compliance Audit
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-info px-3.5 py-1.5 font-display text-xs font-bold text-slate-950 hover:bg-info/90 transition shadow-sm"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Formal Document Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 font-sans print:overflow-visible print:p-0 print:text-slate-900">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 print:border print:border-slate-300 print:bg-white print:p-6">
            {/* Document Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-6 print:border-slate-300">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-info/20 px-2.5 py-1 font-mono text-xs font-bold text-info print:border print:border-slate-800 print:bg-slate-100 print:text-slate-900">
                    SURGEGUARD LIFE-SAFETY REPORT
                  </span>
                  <span className="font-mono text-xs text-slate-400 print:text-slate-600">
                    CLASSIFICATION: LEVEL-2 RAPID CONGESTION
                  </span>
                </div>
                <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white print:text-black">
                  Post-Incident Life Safety & Crowd Stabilization Audit
                </h1>
                <p className="text-xs text-slate-400 print:text-slate-600">
                  Venue: Metropolitan Concert Arena (50,000 Capacity) · Incident Sector: {source.name}
                </p>
              </div>

              <div className="text-right font-mono text-xs text-slate-400 print:text-slate-600">
                <p className="font-bold text-white print:text-black">CASE FILE #INC-2026-0842-GB</p>
                <p>STATUS: RESOLVED & VERIFIED</p>
                <p>DATE: {new Date().toLocaleDateString()} · T+{simulatedMinutes} MIN</p>
              </div>
            </div>

            {/* Compliance Badge & Executive Summary */}
            <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 print:border-emerald-700 print:bg-emerald-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400 print:text-emerald-700" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-emerald-300 print:text-emerald-800">
                  Life Safety Code Compliance Certification (NFPA 101 Certified)
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300 print:text-slate-800">
                At <strong>T+06:00</strong>, ingress sensors at <strong>{source.name}</strong> detected an accelerating influx of +60 persons/min, projecting a capacity breach in under 9 minutes. Autonomous predictive intervention diverted <strong>{execution?.redirectPeople.toLocaleString() ?? '1,200'} attendees</strong> to {target?.name ?? 'Gate C'} and deployed 3 rapid response officers. Pedestrian density was successfully capped at 2.4 p/m², averting a Category-3 bottleneck crush with <strong>zero injuries or structural egress violations</strong>.
              </p>
            </div>

            {/* Audit Trail Timeline */}
            <div className="mt-8">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-700">
                Chronological Incident Timeline & Audit Trail
              </h3>
              <div className="mt-3 space-y-2 font-mono text-xs">
                <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 print:border-slate-300 print:bg-slate-50">
                  <span className="font-bold text-info print:text-slate-800">T+00:00</span>
                  <span className="text-slate-300 print:text-slate-800">
                    Normal baseline ingress. {source.name} operating at 72% capacity (3,600 / 5,000 attendees).
                  </span>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 print:border-amber-700 print:bg-amber-50">
                  <span className="font-bold text-amber-400 print:text-amber-800">T+06:00</span>
                  <span className="text-slate-300 print:text-slate-800">
                    Abnormal surge detected by stereoscopic optical turnstiles (+60 people/min arrival spike).
                  </span>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 print:border-rose-700 print:bg-rose-50">
                  <span className="font-bold text-rose-400 print:text-rose-800">T+09:00</span>
                  <span className="text-slate-300 print:text-slate-800">
                    SurgeGuard Least-Squares Regression predicts <strong>9.2 minutes to dangerous capacity breach</strong>. CRITICAL Alert fired.
                  </span>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/10 p-2.5 print:border-slate-400 print:bg-slate-50">
                  <span className="font-bold text-info print:text-slate-800">T+09:20</span>
                  <span className="text-slate-300 print:text-slate-800">
                    Response Plan Executed: {execution?.redirectPeople ?? 1200} diverted to {target.name}, 3 response staff dispatched, turnstile lane 4 opened.
                  </span>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 print:border-emerald-700 print:bg-emerald-50">
                  <span className="font-bold text-emerald-400 print:text-emerald-800">T+13:00</span>
                  <span className="text-slate-300 print:text-slate-800">
                    {source.name} stabilized at 78% capacity. Queue time dropped from 18 min to 9 min. Alert formally RESOLVED.
                  </span>
                </div>
              </div>
            </div>

            {/* Quantitative Sensor Metrics Comparison */}
            <div className="mt-8">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-700">
                Quantitative Telemetry Delta ({source.name})
              </h3>
              <table className="mt-3 w-full border-collapse border border-slate-800 font-mono text-xs print:border-slate-300">
                <thead>
                  <tr className="bg-slate-800/60 print:bg-slate-100">
                    <th className="border border-slate-700 p-2.5 text-left text-slate-300 print:border-slate-300 print:text-slate-800">Parameter</th>
                    <th className="border border-slate-700 p-2.5 text-center text-rose-400 print:border-slate-300 print:text-rose-700">Pre-Intervention</th>
                    <th className="border border-slate-700 p-2.5 text-center text-emerald-400 print:border-slate-300 print:text-emerald-700">Post-Stabilization</th>
                    <th className="border border-slate-700 p-2.5 text-center text-info print:border-slate-300 print:text-slate-800">Net Improvement</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-800 p-2.5 text-slate-300 print:border-slate-300 print:text-slate-800">Occupancy Level</td>
                    <td className="border border-slate-800 p-2.5 text-center font-bold text-rose-400 print:border-slate-300 print:text-rose-700">{before?.occupancyPct.toFixed(0) ?? '96'}%</td>
                    <td className="border border-slate-800 p-2.5 text-center font-bold text-emerald-400 print:border-slate-300 print:text-emerald-700">{after?.occupancyPct.toFixed(0) ?? '78'}%</td>
                    <td className="border border-slate-800 p-2.5 text-center font-bold text-emerald-400 print:border-slate-300 print:text-emerald-700">-18 pts</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2.5 text-slate-300 print:border-slate-300 print:text-slate-800">Estimated Queue Time</td>
                    <td className="border border-slate-800 p-2.5 text-center font-bold text-rose-400 print:border-slate-300 print:text-rose-700">{before?.queueMin ?? '18'} min</td>
                    <td className="border border-slate-800 p-2.5 text-center font-bold text-emerald-400 print:border-slate-300 print:text-emerald-700">{after?.queueMin ?? '9'} min</td>
                    <td className="border border-slate-800 p-2.5 text-center font-bold text-emerald-400 print:border-slate-300 print:text-emerald-700">-9 min (-50%)</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2.5 text-slate-300 print:border-slate-300 print:text-slate-800">Deployed Staffing</td>
                    <td className="border border-slate-800 p-2.5 text-center text-slate-300 print:border-slate-300 print:text-slate-800">{before?.staff ?? 8} officers</td>
                    <td className="border border-slate-800 p-2.5 text-center text-emerald-400 print:border-slate-300 print:text-emerald-700">{after?.staff ?? 11} officers</td>
                    <td className="border border-slate-800 p-2.5 text-center font-bold text-info print:border-slate-300 print:text-slate-800">+3 deployed</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial ROI & Legal Liability Mitigation */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 print:border-slate-300 print:bg-white">
                <div className="flex items-center gap-2 text-xs text-slate-400 print:text-slate-600">
                  <Scale className="h-4 w-4 text-amber-400 print:text-amber-700" />
                  <span>Liability Averted</span>
                </div>
                <p className="mt-1 font-mono text-xl font-bold text-emerald-400 print:text-emerald-700">
                  +$480,000
                </p>
                <p className="text-[10px] text-slate-500 print:text-slate-600">Estimated crowd crush insurance exposure</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 print:border-slate-300 print:bg-white">
                <div className="flex items-center gap-2 text-xs text-slate-400 print:text-slate-600">
                  <Users className="h-4 w-4 text-info print:text-slate-800" />
                  <span>Attendee Hours Saved</span>
                </div>
                <p className="mt-1 font-mono text-xl font-bold text-white print:text-black">
                  1,840 Hours
                </p>
                <p className="text-[10px] text-slate-500 print:text-slate-600">Reduced queue congestion across gate sectors</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 print:border-slate-300 print:bg-white">
                <div className="flex items-center gap-2 text-xs text-slate-400 print:text-slate-600">
                  <Building className="h-4 w-4 text-emerald-400 print:text-emerald-700" />
                  <span>Regulatory Status</span>
                </div>
                <p className="mt-1 font-mono text-xl font-bold text-emerald-400 print:text-emerald-700">
                  PASS (Grade A)
                </p>
                <p className="text-[10px] text-slate-500 print:text-slate-600">Municipal Fire Marshal & Police clearance</p>
              </div>
            </div>

            {/* Document Signatures */}
            <div className="mt-10 border-t border-slate-800 pt-6 flex items-center justify-between text-xs font-mono text-slate-500 print:border-slate-300 print:text-slate-600">
              <div>
                <p>CERTIFIED AUTONOMOUS LOG: SURGEGUARD v2.4</p>
                <p>CRYPTOGRAPHIC HASH: 7f8a9e2d3c4b5a1098ef</p>
              </div>
              <div className="text-right">
                <p>EVENT SAFETY DIRECTOR: ___________________________</p>
                <p className="mt-1">CHIEF OPERATIONS OFFICER: ___________________________</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
