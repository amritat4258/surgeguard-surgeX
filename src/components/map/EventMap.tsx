import { useState } from 'react';
import type { RiskLevel, ZoneId } from '@/types';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import {
  MapPin,
  Layers,
  Info,
  Siren,
  ShieldCheck,
  Crosshair,
  Clock,
  Users,
  Radio,
  Sparkles,
} from 'lucide-react';
import { DroneThermalPatrol } from './DroneThermalPatrol';
import {
  VENUE_FACILITIES,
  getRushColor,
  type VenueFacility,
  type FacilityKind,
  type RushLevel,
} from '@/data/facilities';

export type { VenueFacility, FacilityKind, RushLevel };

interface NodeBox {
  x: number; // center x
  y: number; // center y
  w: number;
  h: number;
  ellipse?: boolean;
}

// Where each zone sits on the MMRDA Grounds map (800 x 530 drawing area)
const NODES: Record<ZoneId, NodeBox> = {
  'gate-a': { x: 140, y: 100, w: 130, h: 60 },
  'gate-c': { x: 400, y: 65, w: 130, h: 60 },
  'gate-b': { x: 660, y: 100, w: 130, h: 60 },
  'main-arena': { x: 400, y: 260, w: 340, h: 165, ellipse: true },
  'food-court': { x: 670, y: 395, w: 140, h: 60 },
  parking: { x: 400, y: 460, w: 190, h: 60 },
};

// Walkways drawn between zones
const LINKS: [ZoneId, ZoneId][] = [
  ['gate-a', 'main-arena'],
  ['gate-b', 'main-arena'],
  ['gate-c', 'main-arena'],
  ['main-arena', 'food-court'],
  ['main-arena', 'parking'],
];

const look: Record<RiskLevel, { fill: string; stroke: string; text: string; glow: string }> = {
  normal: {
    fill: 'fill-risk-normal/10',
    stroke: 'stroke-risk-normal/60',
    text: 'fill-risk-normal',
    glow: 'stroke-risk-normal/40',
  },
  warning: {
    fill: 'fill-risk-warning/15',
    stroke: 'stroke-risk-warning/70',
    text: 'fill-risk-warning',
    glow: 'stroke-risk-warning/50',
  },
  high: {
    fill: 'fill-risk-high/20',
    stroke: 'stroke-risk-high/80',
    text: 'fill-risk-high',
    glow: 'stroke-risk-high/60',
  },
  critical: {
    fill: 'fill-risk-critical/25',
    stroke: 'stroke-risk-critical',
    text: 'fill-risk-critical',
    glow: 'stroke-risk-critical',
  },
};

const legend: { label: string; cls: string }[] = [
  { label: 'Normal', cls: 'bg-risk-normal' },
  { label: 'Warning', cls: 'bg-risk-warning' },
  { label: 'High', cls: 'bg-risk-high' },
  { label: 'Critical', cls: 'bg-risk-critical' },
];

export function EventMap() {
  const { zones, predictions, execution, mode, activeSOS, setIsSOSModalOpen, setIsBroadcastModalOpen } = useCommandCenter();
  const [isDroneView, setIsDroneView] = useState(false);
  const [facilityFilter, setFacilityFilter] = useState<FacilityKind>('all');
  const [selectedFacility, setSelectedFacility] = useState<VenueFacility | null>(null);

  // Filter facilities based on active amenity tab
  const activeFacilities = facilityFilter === 'all'
    ? VENUE_FACILITIES
    : VENUE_FACILITIES.filter((f) => f.kind === facilityFilter);

  // Compute curved reroute path coordinates if execution is active
  const reroutePath = (() => {
    if (!execution || !execution.targetZoneId) return null;
    const src = NODES[execution.sourceZoneId];
    const tgt = NODES[execution.targetZoneId];
    if (!src || !tgt) return null;

    const midX = (src.x + tgt.x) / 2;
    const midY = Math.min(src.y, tgt.y) - 45;
    return {
      d: `M ${src.x} ${src.y} Q ${midX} ${midY} ${tgt.x} ${tgt.y}`,
      labelX: midX,
      labelY: midY - 14,
      people: execution.redirectPeople,
      targetName: zones[execution.targetZoneId]?.name ?? 'Gate C',
    };
  })();

  return (
    <div className="rounded-xl border border-surface-border bg-surface-panel p-4 relative overflow-hidden flex flex-col justify-between">
      {/* Venue Header & Legend */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-rose-400" />
              MMRDA Grounds, BKC (Mumbai)
            </h2>
            <span className="rounded bg-sky-950/80 border border-sky-500/40 px-2 py-0.5 font-mono text-[10px] text-sky-300">
              50,000 CONCERT ARENA
            </span>
            {mode === 'live' && (
              <span className="flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE IoT
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Bandra Kurla Complex · Real-time spatial density & attendee amenity network
          </p>
        </div>

        {/* View Switcher & Legend */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsDroneView((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition shadow-sm ${
              isDroneView
                ? 'border border-rose-500 bg-rose-600 text-white shadow-rose-600/30'
                : 'border border-sky-500/50 bg-sky-950/80 hover:bg-sky-900 text-sky-300'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5 animate-pulse" />
            <span>{isDroneView ? '🔴 EXIT DRONE FEED' : '🛰️ 3D DRONE THERMAL PATROL'}</span>
          </button>

          <div className="hidden md:flex items-center gap-2">
            {legend.map((l) => (
              <span
                key={l.label}
                className="flex items-center gap-1 text-[11px] text-slate-400"
              >
                <span className={`h-2 w-2 rounded-full ${l.cls}`} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Drone View or 2D Tactical Map */}
      {isDroneView ? (
        <div className="mt-1 animate-in fade-in duration-200">
          <DroneThermalPatrol onClose={() => setIsDroneView(false)} />
        </div>
      ) : (
        <>
          {/* CCTV + GPS Sensor Fusion & Privacy-by-Design Bar */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-1.5 text-slate-200 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            CCTV + GPS FUSION:
          </span>
          <span className="text-slate-400">
            Gate A: <span className="text-sky-300">CCTV 3,420</span> / <span className="text-emerald-300">GPS 2,680</span> · Confidence: <span className="text-emerald-400 font-bold">96.4%</span>
          </span>
          <span className="text-slate-400 hidden lg:inline">
            Gate B: <span className="text-sky-300">CCTV 4,890</span> / <span className="text-emerald-300">GPS 3,910</span> · Confidence: <span className="text-emerald-400 font-bold">94.1%</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-slate-300 font-semibold">Privacy-by-Design</span>
          <span className="text-[10px] text-slate-400">(Zero PII · Aggregated Zone Mesh)</span>
        </div>
      </div>

      {/* Amenity / Stall Filter Strip */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 border-y border-slate-800/80 py-2 text-xs">
        <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-400 mr-1">
          <Layers className="h-3 w-3 text-info" />
          Stalls & Safety:
        </span>
        <button
          type="button"
          onClick={() => setFacilityFilter('all')}
          className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
            facilityFilter === 'all'
              ? 'bg-slate-700 text-ink shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({VENUE_FACILITIES.length})
        </button>
        <button
          type="button"
          onClick={() => setFacilityFilter('water')}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
            facilityFilter === 'water'
              ? 'bg-sky-500/30 text-sky-200 border border-sky-500/50 shadow-sm'
              : 'text-slate-400 hover:text-sky-300'
          }`}
        >
          <span>💧 Water Stalls</span>
        </button>
        <button
          type="button"
          onClick={() => setFacilityFilter('medical')}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
            facilityFilter === 'medical'
              ? 'bg-rose-500/30 text-rose-200 border border-rose-500/50 shadow-sm'
              : 'text-slate-400 hover:text-rose-300'
          }`}
        >
          <span>🚑 Med Kits / First Aid</span>
        </button>
        <button
          type="button"
          onClick={() => setFacilityFilter('energy')}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
            facilityFilter === 'energy'
              ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 shadow-sm'
              : 'text-slate-400 hover:text-amber-300'
          }`}
        >
          <span>⚡ Energy Drinks</span>
        </button>
        <button
          type="button"
          onClick={() => setFacilityFilter('restroom')}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
            facilityFilter === 'restroom'
              ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50 shadow-sm'
              : 'text-slate-400 hover:text-purple-300'
          }`}
        >
          <span>🚻 Restrooms</span>
        </button>
        <button
          type="button"
          onClick={() => setFacilityFilter('exit')}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
            facilityFilter === 'exit'
              ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-emerald-300'
          }`}
        >
          <span>🚪 Evacuation Exits</span>
        </button>
      </div>

      {/* Active Attendee Distress Alert Banner */}
      {activeSOS && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/70 bg-gradient-to-r from-rose-950/90 via-slate-900/90 to-rose-950/90 p-3 shadow-lg backdrop-blur animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-md shadow-rose-600/50">
              <Siren className="h-5 w-5 animate-spin" style={{ animationDuration: '3s' }} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-300">
                  🚨 ATTENDEE DISTRESS BEACON ACTIVE: {activeSOS.type.replace('-', ' ').toUpperCase()}
                </span>
                <span className="rounded bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.2 font-mono text-[10px] font-bold text-rose-300">
                  {activeSOS.status === 'dispatched' ? `EN ROUTE (${activeSOS.etaSeconds}s)` : 'PENDING DISPATCH'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                {activeSOS.description} · Assigned: {activeSOS.nearestMedName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSOSModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-lg shadow-rose-600/40 transition hover:scale-105 active:scale-95"
          >
            🚑 DISPATCH CONSOLE {activeSOS.status === 'dispatched' && `(ETA ${activeSOS.etaSeconds}s)`}
          </button>
        </div>
      )}

      {/* SVG Map Canvas (kept dark in both themes) */}
      <div data-theme="dark" className="relative overflow-hidden rounded-xl bg-slate-950">
        <svg viewBox="0 0 800 530" className="h-auto w-full select-none">
          <defs>
            <style>{`
              @keyframes flowDash {
                to { stroke-dashoffset: -28; }
              }
              .animate-reroute-flow {
                animation: flowDash 0.8s linear infinite;
              }
              @keyframes badgePulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.55; }
              }
              .rush-badge-pulse {
                animation: badgePulse 1.1s ease-in-out infinite;
              }
            `}</style>
            <filter id="neon-glow-map" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* MMRDA Grounds Outer Boundary */}
          <rect
            x="40"
            y="25"
            width="720"
            height="480"
            rx="24"
            fill="none"
            stroke="#334155"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x="60"
            y="42"
            fill="#475569"
            fontFamily="monospace"
            fontSize="9"
            fontWeight="bold"
          >
            BKC CONNECTOR ROAD // NORTH PERIMETER
          </text>
          <text
            x="500"
            y="495"
            fill="#475569"
            fontFamily="monospace"
            fontSize="9"
            fontWeight="bold"
          >
            BKC METRO STATION ROAD // SOUTH PERIMETER
          </text>

          {/* Walkways */}
          {LINKS.map(([from, to]) => (
            <line
              key={`${from}-${to}`}
              x1={NODES[from].x}
              y1={NODES[from].y}
              x2={NODES[to].x}
              y2={NODES[to].y}
              className="stroke-surface-border"
              strokeWidth={2}
              strokeDasharray="6 6"
            />
          ))}

          {/* Dynamic Rerouting Vector from Gate B to Gate C */}
          {reroutePath && (
            <g>
              <path
                d={reroutePath.d}
                fill="none"
                stroke="#10b981"
                strokeWidth={8}
                strokeOpacity={0.25}
                filter="url(#neon-glow-map)"
              />
              <path
                d={reroutePath.d}
                fill="none"
                stroke="#34d399"
                strokeWidth={3.5}
                strokeDasharray="8 6"
                className="animate-reroute-flow"
              />
              <g transform={`translate(${reroutePath.labelX}, ${reroutePath.labelY})`}>
                <rect
                  x={-105}
                  y={-12}
                  width={210}
                  height={24}
                  rx={12}
                  fill="#022c22"
                  stroke="#10b981"
                  strokeWidth={1.5}
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  className="fill-emerald-300 font-mono text-[11px] font-bold"
                >
                  ⚡ DIVERSION: {reroutePath.people.toLocaleString()} → {reroutePath.targetName}
                </text>
              </g>
            </g>
          )}

          {/* Main Concert Stage & Lighting Rig */}
          <g>
            <rect
              x="320"
              y="188"
              width="160"
              height="28"
              rx="6"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            <text
              x="400"
              y="206"
              textAnchor="middle"
              className="fill-sky-300 font-display text-[11px] font-extrabold tracking-wider"
            >
              ★ MAIN STAGE ★
            </text>
            {/* Front of House / VIP Enclosure */}
            <rect
              x="355"
              y="275"
              width="90"
              height="20"
              rx="4"
              fill="#1e1b4b"
              stroke="#818cf8"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <text
              x="400"
              y="289"
              textAnchor="middle"
              className="fill-indigo-300 font-mono text-[9px] font-bold"
            >
              VIP ENCLOSURE
            </text>
          </g>

          {/* Six Main Crowd Zones */}
          {(Object.keys(NODES) as ZoneId[]).map((id) => {
            const box = NODES[id];
            const zone = zones[id];
            const risk = predictions[id].riskLevel;
            const s = look[risk];
            const pct = (zone.current / zone.capacity) * 100;
            const isCriticalOrHigh = risk === 'critical' || risk === 'high';

            return (
              <g key={id}>
                {/* Outer Pulsing Ring for High/Critical Zones */}
                {isCriticalOrHigh &&
                  (box.ellipse ? (
                    <ellipse
                      cx={box.x}
                      cy={box.y}
                      rx={box.w / 2 + 10}
                      ry={box.h / 2 + 10}
                      fill="none"
                      className="animate-pulse-slow"
                      stroke={risk === 'critical' ? '#ef4444' : '#f97316'}
                      strokeWidth={2}
                      strokeDasharray={risk === 'critical' ? 'none' : '4 4'}
                    />
                  ) : (
                    <rect
                      x={box.x - box.w / 2 - 10}
                      y={box.y - box.h / 2 - 10}
                      width={box.w + 20}
                      height={box.h + 20}
                      rx={18}
                      fill="none"
                      className="animate-pulse-slow"
                      stroke={risk === 'critical' ? '#ef4444' : '#f97316'}
                      strokeWidth={2}
                      strokeDasharray={risk === 'critical' ? 'none' : '4 4'}
                    />
                  ))}

                {/* Zone Shape */}
                {box.ellipse ? (
                  <ellipse
                    cx={box.x}
                    cy={box.y}
                    rx={box.w / 2}
                    ry={box.h / 2}
                    className={`${s.fill} ${s.stroke}`}
                    strokeWidth={2}
                  />
                ) : (
                  <rect
                    x={box.x - box.w / 2}
                    y={box.y - box.h / 2}
                    width={box.w}
                    height={box.h}
                    rx={12}
                    className={`${s.fill} ${s.stroke}`}
                    strokeWidth={2}
                  />
                )}

                {/* Zone Name */}
                <text
                  x={box.x}
                  y={box.y - 7}
                  textAnchor="middle"
                  className="fill-slate-200 font-display"
                  fontSize={13}
                  fontWeight={600}
                >
                  {zone.name}
                </text>

                {/* Occupancy Percentage */}
                <text
                  x={box.x}
                  y={box.y + 15}
                  textAnchor="middle"
                  className={`${s.text} font-mono`}
                  fontSize={16}
                  fontWeight={700}
                >
                  {pct.toFixed(0)}%
                </text>

                {/* Capacity Counter */}
                <text
                  x={box.x}
                  y={box.y + 27}
                  textAnchor="middle"
                  className="fill-slate-400 font-mono text-[9px]"
                >
                  {zone.current.toLocaleString()} / {zone.capacity.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Interactive Stalls & Public Safety Amenities with Live Rush Badge */}
          {activeFacilities.map((f) => {
            const isSelected = selectedFacility?.id === f.id;
            const rush = getRushColor(f.rushLevel);
            // Badge width: wider for multi-char labels like "14m" vs "1m"
            const badgeW = f.queueMin >= 10 ? 42 : f.queueMin === 0 ? 36 : 32;

            return (
              <g
                key={f.id}
                onClick={() => setSelectedFacility(isSelected ? null : f)}
                style={{ cursor: 'pointer' }}
                transform={`translate(${f.x}, ${f.y})`}
              >
                {/* Selected Outer Glow Ring */}
                {isSelected && (
                  <circle
                    r={22}
                    fill="none"
                    stroke={f.color}
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    opacity={0.7}
                    className="rush-badge-pulse"
                  />
                )}

                {/* Floating Rush Wait Time Badge for non-exit stalls */}
                {f.kind !== 'exit' && (
                  <g transform="translate(0, -26)">
                    <rect
                      x={-(badgeW / 2)}
                      y={-9}
                      width={badgeW}
                      height={17}
                      rx={5}
                      fill={rush.bg}
                      stroke={rush.border}
                      strokeWidth={1.2}
                      className={f.rushLevel === 'critical' ? 'rush-badge-pulse' : ''}
                    />
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontFamily="monospace"
                      fontSize={9}
                      fontWeight="bold"
                    >
                      {f.queueMin === 0 ? 'FAST' : `${f.queueMin}m`}
                    </text>
                  </g>
                )}

                {/* Stall Aura Glow */}
                <circle
                  r={17}
                  fill={f.color}
                  fillOpacity={isSelected ? 0.5 : 0.2}
                  stroke={f.color}
                  strokeWidth={isSelected ? 2.5 : 1.2}
                />
                {/* Stall Icon */}
                <text
                  x={0}
                  y={5}
                  textAnchor="middle"
                  fontSize={14}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {f.icon}
                </text>
                {/* ID Label under Icon */}
                <text
                  x={0}
                  y={29}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontFamily="monospace"
                  fontSize={9}
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {f.id.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Active Attendee Distress SOS Beacon on Venue Map */}
          {activeSOS && (
            <g
              className="cursor-pointer group"
              onClick={() => setIsSOSModalOpen(true)}
              filter="url(#neon-glow-map)"
            >
              {/* Paramedic response vector line (with Smart Crowd-Aware Detour if available) */}
              {activeSOS.crowdRoute ? (
                <>
                  {/* Avoided congested direct path (dashed red, high density chokepoint) */}
                  <line
                    x1={515}
                    y1={110}
                    x2={activeSOS.coordinates.x}
                    y2={activeSOS.coordinates.y}
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    opacity={0.35}
                  />
                  {/* Smart Detour path (curved cyan glowing line bypassing chokepoint) */}
                  <path
                    d={`M 515 110 Q 565 65 ${activeSOS.coordinates.x} ${activeSOS.coordinates.y}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    strokeDasharray="6 3"
                    className="animate-pulse"
                  />
                  {/* Detour Badge */}
                  <g transform={`translate(${555}, ${70})`}>
                    <rect x={-60} y={-9} width={120} height={14} rx={3} fill="#082f49" stroke="#38bdf8" strokeWidth={1} />
                    <text x={0} y={1} textAnchor="middle" fill="#7dd3fc" fontFamily="monospace" fontSize={7.5} fontWeight="bold">
                      SMART DETOUR (-3.5 MIN)
                    </text>
                  </g>
                </>
              ) : (
                <line
                  x1={515}
                  y1={110}
                  x2={activeSOS.coordinates.x}
                  y2={activeSOS.coordinates.y}
                  stroke="#f43f5e"
                  strokeWidth={3}
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              )}

              {/* Pulsing Radar Ring (SOS shockwave) */}
              <circle
                cx={activeSOS.coordinates.x}
                cy={activeSOS.coordinates.y}
                r={26}
                fill="#f43f5e"
                fillOpacity={0.15}
                stroke="#f43f5e"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                className="animate-ping"
                style={{ transformOrigin: `${activeSOS.coordinates.x}px ${activeSOS.coordinates.y}px`, animationDuration: '1.4s' }}
              />

              {/* Beacon Outer Glow Ring */}
              <circle
                cx={activeSOS.coordinates.x}
                cy={activeSOS.coordinates.y}
                r={16}
                fill="#881337"
                fillOpacity={0.8}
                stroke="#fb7185"
                strokeWidth={2}
              />

              {/* Beacon Inner Core */}
              <circle
                cx={activeSOS.coordinates.x}
                cy={activeSOS.coordinates.y}
                r={7}
                fill="#ffffff"
                className="animate-pulse"
              />

              {/* Top Floating Badge */}
              <g transform={`translate(${activeSOS.coordinates.x}, ${activeSOS.coordinates.y - 24})`}>
                <rect
                  x={-60}
                  y={-14}
                  width={120}
                  height={18}
                  rx={5}
                  fill="#9f1239"
                  stroke="#fda4af"
                  strokeWidth={1.5}
                  className="shadow-lg"
                />
                <text
                  x={0}
                  y={-1}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontFamily="monospace"
                  fontSize={8.5}
                  fontWeight="bold"
                >
                  🆘 {activeSOS.status === 'dispatched' ? `DISPATCHED (${activeSOS.etaSeconds}s)` : 'ATTENDEE SOS'}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Selected Stall Info Panel — below map, always visible, never clipped */}
      {selectedFacility && (() => {
        const rush = getRushColor(selectedFacility.rushLevel);
        return (
          <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-900/90 shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl shadow-inner">
                  {selectedFacility.icon}
                </span>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-ink leading-tight truncate">
                    {selectedFacility.name}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs font-bold uppercase tracking-wide" style={{ color: selectedFacility.color }}>
                      {selectedFacility.badge}
                    </span>
                    {selectedFacility.kind !== 'exit' && (
                      <span className={`rounded px-2 py-0.5 font-mono text-xs font-bold uppercase border ${rush.badgeBg}`}>
                        {rush.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedFacility.kind !== 'exit' && (
                  <span className={`font-mono text-sm font-black ${
                    selectedFacility.rushLevel === 'critical' ? 'text-rose-400 animate-pulse' :
                    selectedFacility.rushLevel === 'high' ? 'text-rose-300' :
                    selectedFacility.rushLevel === 'moderate' ? 'text-amber-300' :
                    'text-emerald-400'
                  }`}>
                    {selectedFacility.queueMin === 0 ? '0m wait' : `${selectedFacility.queueMin}m wait`}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedFacility(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-ink transition text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-4 pb-4 pt-3 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">{selectedFacility.desc}</p>

              {/* Queue Metrics Grid */}
              {selectedFacility.kind !== 'exit' && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                      <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                        <Clock className="h-3 w-3 text-info shrink-0" /> Est. Wait
                      </div>
                      <p className={`font-mono text-base font-black leading-none ${
                        selectedFacility.rushLevel === 'critical' ? 'text-rose-400' :
                        selectedFacility.rushLevel === 'high' ? 'text-rose-300' :
                        selectedFacility.rushLevel === 'moderate' ? 'text-amber-300' :
                        'text-emerald-400'
                      }`}>
                        {selectedFacility.queueMin === 0 ? '< 1 min' : `${selectedFacility.queueMin} min`}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                      <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                        <Users className="h-3 w-3 shrink-0" /> In Queue
                      </div>
                      <p className="font-mono text-base font-black text-ink leading-none">
                        {selectedFacility.queueCount}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 col-span-2">
                      <p className="text-xs text-slate-400 mb-1">Throughput / Staff</p>
                      <p className="font-mono text-xs font-bold text-slate-200 leading-snug">
                        {selectedFacility.tapsOrStaff}
                      </p>
                    </div>
                  </div>

                  {/* Concourse Load Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Concourse Load</span>
                      <span className="font-mono font-semibold" style={{ color: rush.bg }}>{rush.label}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${rush.barColor}`}
                        style={{ width: rush.barWidth }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* AI Recommendation */}
              {selectedFacility.recommendation && (
                <div className="rounded-xl border border-sky-500/30 bg-sky-950/40 p-3">
                  <div className="flex items-start gap-2 text-sky-200 mb-2">
                    <Sparkles className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">{selectedFacility.recommendation}</p>
                  </div>
                  {(selectedFacility.rushLevel === 'critical' || selectedFacility.rushLevel === 'high') && (
                    <button
                      type="button"
                      onClick={() => setIsBroadcastModalOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/50 bg-purple-600 hover:bg-purple-500 py-2 text-xs font-bold text-white transition shadow-md"
                    >
                      <Radio className="h-3.5 w-3.5 animate-pulse" />
                      📢 Broadcast Diversion via Stadium PA & Screens
                    </button>
                  )}
                </div>
              )}

              {/* Live Status Footer */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800 pt-2.5">
                <span>Live Telemetry:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {selectedFacility.status}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Footer */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Info className="h-3 w-3 text-info" />
          {selectedFacility
            ? `Viewing: ${selectedFacility.name} — click map icon again to dismiss`
            : 'Click any stall icon (💧 Water · 🚑 Med Kit · ⚡ Energy · 🚻 Restroom · 🚪 Exit) to inspect'}
        </span>
        <span>MMRDA VENUE GRID // BKC SECTOR 4</span>
      </div>
    </>
    )}
  </div>
  );
}