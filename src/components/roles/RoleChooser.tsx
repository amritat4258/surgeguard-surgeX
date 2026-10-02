import { LayoutDashboard, Smartphone, ShieldCheck } from 'lucide-react';
import { roleHref } from '@/lib/role';

export default function RoleChooser() {
  return (
    <div
      data-theme="dark"
      className="flex min-h-[100dvh] items-center justify-center bg-slate-950 px-4 py-8 font-body text-slate-100"
    >
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">SurgeGuard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Predictive command center for mega events
          </p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Choose how you want to continue
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href={roleHref('organizer')}
            className="group rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center transition hover:border-sky-500/60 hover:bg-slate-800 active:scale-[0.98]"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
              <LayoutDashboard className="h-7 w-7" />
            </div>
            <p className="font-display text-lg font-bold text-ink">Organizer</p>
            <p className="mt-1 text-xs leading-snug text-slate-400">
              Control-room dashboard: monitor crowds, predict surges, dispatch help.
            </p>
          </a>

          <a
            href={roleHref('attendee')}
            className="group rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center transition hover:border-emerald-500/60 hover:bg-slate-800 active:scale-[0.98]"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <Smartphone className="h-7 w-7" />
            </div>
            <p className="font-display text-lg font-bold text-ink">Attendee</p>
            <p className="mt-1 text-xs leading-snug text-slate-400">
              Concert-goer app: gate wait times, nearby stalls, emergency help.
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}