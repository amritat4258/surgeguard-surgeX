import { LayoutDashboard, Smartphone, ShieldCheck, Camera } from 'lucide-react';
import { roleHref } from '@/lib/role';

export default function RoleChooser() {
  return (
    <div
      data-theme="dark"
      className="flex min-h-[100dvh] items-center justify-center bg-slate-950 px-4 py-6 sm:py-8 font-body text-slate-100"
      style={{
        paddingTop: 'calc(1.5rem + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Content */}
      <div className="w-full max-w-lg">
        <div className="mb-6 sm:mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">SurgeGuard</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Predictive crowd command center for mega events
          </p>
          <p className="mt-4 sm:mt-6 text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-slate-500">
            Choose how you want to continue
          </p>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-3">
          <a
            href={roleHref('organizer')}
            className="group rounded-2xl border border-slate-700 bg-slate-900 p-5 text-center transition hover:border-sky-500/60 hover:bg-slate-800 active:scale-[0.98]"
          >
            <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <p className="font-display text-base font-bold text-ink">Organizer</p>
            <p className="mt-1 text-xs leading-snug text-slate-400">
              Control-room dashboard: live telemetry, 3D drone, surge dispatch.
            </p>
          </a>

          <a
            href={roleHref('attendee')}
            className="group rounded-2xl border border-slate-700 bg-slate-900 p-5 text-center transition hover:border-emerald-500/60 hover:bg-slate-800 active:scale-[0.98]"
          >
            <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <Smartphone className="h-6 w-6" />
            </div>
            <p className="font-display text-base font-bold text-ink">Attendee</p>
            <p className="mt-1 text-xs leading-snug text-slate-400">
              Mobile companion: wait-weighted navigation, stalls, and 1-tap SOS.
            </p>
          </a>

          <a
            href={roleHref('camera')}
            className="group rounded-2xl border border-cyan-500/40 bg-slate-900/90 p-5 text-center transition hover:border-cyan-400 hover:bg-slate-800 active:scale-[0.98]"
          >
            <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Camera className="h-6 w-6" />
            </div>
            <p className="font-display text-base font-bold text-white flex items-center justify-center gap-1.5">
              <span>CCTV Vision</span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </p>
            <p className="mt-1 text-xs leading-snug text-slate-400">
              Optical flow surveillance: 6-cam matrix, turnstiles, and YOLO vision AI.
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}