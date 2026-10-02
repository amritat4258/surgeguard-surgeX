import { X, MapPin, Clock, Navigation, Shield, Zap } from 'lucide-react';
import { VENUE_FACILITIES, getRushColor } from '@/data/facilities';

interface AttendeeAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NEARBY_STALL_IDS: { id: string; distanceM: number }[] = [
  { id: 'w2', distanceM: 40 },
  { id: 'e2', distanceM: 85 },
  { id: 'r1', distanceM: 120 },
];

export default function AttendeeAppModal({ isOpen, onClose }: AttendeeAppModalProps) {
  if (!isOpen) return null;

  const nearbyStalls = NEARBY_STALL_IDS.map(({ id, distanceM }) => {
    const facility = VENUE_FACILITIES.find((f) => f.id === id)!;
    const rush = getRushColor(facility.rushLevel);
    return { facility, distanceM, rush };
  });

  return (
    <div
      data-theme="dark"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Phone card */}
      <div
        className="relative w-full max-w-sm rounded-3xl bg-slate-900 shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Notch / camera bar */}
        <div className="flex justify-center pt-3 pb-1 bg-slate-950">
          <div className="w-24 h-[6px] rounded-full bg-slate-700" />
        </div>

        {/* Status bar */}
        <div className="bg-emerald-600 px-4 py-1.5 flex items-center justify-between text-[10px] font-bold text-white tracking-wide">
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE · BKC SECTOR 4
          </span>
          <span>28°C · SurgeGuard v2.0</span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-10 right-3 z-10 rounded-full bg-slate-700/80 p-1.5 text-slate-300 hover:bg-slate-600 hover:text-ink transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 px-4 pb-4 space-y-4 pt-3">

          {/* App header */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 shadow">
              <Shield size={16} className="text-ink" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink leading-tight">SurgeGuard Attendee</p>
              <p className="text-[10px] text-slate-400">Your safety companion</p>
            </div>
          </div>

          {/* Current zone */}
          <div className="rounded-2xl bg-slate-800 border border-slate-700/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-blue-400" />
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Your Zone</span>
            </div>
            <p className="text-base font-bold text-ink">Main Arena – Zone B</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                <Zap size={9} />
                72% capacity · MODERATE
              </span>
            </div>
          </div>

          {/* QR code placeholder */}
          <div className="rounded-2xl bg-slate-800 border border-slate-700/50 p-3 flex flex-col items-center gap-2">
            <div className="w-full rounded-xl bg-slate-700/60 border border-slate-600/50 flex flex-col items-center justify-center py-5 gap-1">
              {/* Fake QR grid */}
              <div className="grid grid-cols-7 gap-[2px] opacity-40">
                {Array.from({ length: 49 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[7px] h-[7px] rounded-[1px]"
                    style={{
                      backgroundColor:
                        Math.random() > 0.45 ? '#94a3b8' : 'transparent',
                    }}
                  />
                ))}
              </div>
              <p className="mt-2 text-[10px] font-semibold text-slate-400">Scan QR at Gate Entry</p>
            </div>
          </div>

          {/* Nearby stalls */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Nearby Stalls
            </p>
            <div className="space-y-2">
              {nearbyStalls.map(({ facility, distanceM, rush }) => (
                <div
                  key={facility.id}
                  className="rounded-2xl bg-slate-800 border border-slate-700/50 p-3 flex items-center gap-3"
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-xl">
                    {facility.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink truncate leading-tight">
                      {facility.name}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {/* Wait time badge */}
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${rush.badgeBg}`}
                      >
                        <Clock size={8} />
                        {facility.queueMin}m · {rush.label}
                      </span>
                      {/* Distance */}
                      <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
                        <MapPin size={8} />
                        {distanceM}m
                      </span>
                    </div>
                  </div>

                  {/* Navigate button */}
                  <button className="shrink-0 flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all px-2.5 py-1.5 text-[10px] font-bold text-white shadow">
                    <Navigation size={10} />
                    Navigate&nbsp;→
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SOS Button */}
          <button className="w-full rounded-2xl bg-red-600 hover:bg-red-500 active:scale-[0.98] transition-all py-4 text-sm font-black text-white shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 tracking-wide">
            🆘 Send Distress Signal
          </button>
        </div>

        {/* Bottom home indicator */}
        <div className="flex justify-center py-2 bg-slate-950">
          <div className="w-20 h-1 rounded-full bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
