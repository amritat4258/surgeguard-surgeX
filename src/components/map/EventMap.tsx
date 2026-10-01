import { useState } from 'react';
import type { RiskLevel, ZoneId } from '@/types';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import {
  MapPin,
  Layers,
  Info,
  Siren,
  ShieldCheck,
} from 'lucide-react';

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

export type FacilityKind = 'all' | 'water' | 'medical' | 'energy' | 'restroom' | 'exit';

export interface VenueFacility {
  id: string;
  name: string;
  kind: 'water' | 'medical' | 'energy' | 'restroom' | 'exit';
  x: number;
  y: number;
  desc: string;
  status: string;
  icon: string;
  badge: string;
  color: string;
}

const VENUE_FACILITIES: VenueFacility[] = [
  // Hydration / Water Refill Stalls
  {
    id: 'w1',
    name: 'Water Station #1 (Gate A)',
    kind: 'water',
    x: 235,
    y: 135,
    desc: 'Free filtered water & ORS electrolyte packs',
    status: '100% Supply · Zero Wait',
    icon: '💧',
    badge: 'Hydration',
    color: '#38bdf8',
  },
  {
    id: 'w2',
    name: 'Water Station #2 (Gate C Fast-Track)',
    kind: 'water',
    x: 325,
    y: 105,
    desc: 'Dedicated 8-tap fast refill bar for diverted Gate C arrivals',
    status: 'Active · Fast Refill',
    icon: '💧',
    badge: 'Hydration',
    color: '#38bdf8',
  },
  {
    id: 'w3',
    name: 'Water Point #3 (Arena East)',
    kind: 'water',
    x: 585,
    y: 230,
    desc: 'Arena concourse chilled water station',
    status: 'Operational',
    icon: '💧',
    badge: 'Hydration',
    color: '#38bdf8',
  },

  // Energy Drink & Beverage Kiosks
  {
    id: 'e1',
    name: 'Red Bull Energy Kiosk (West Concourse)',
    kind: 'energy',
    x: 235,
    y: 210,
    desc: 'Chilled energy drinks & electrolyte boosters',
    status: 'Open · Express Lane',
    icon: '⚡',
    badge: 'Energy Drinks',
    color: '#facc15',
  },
  {
    id: 'e2',
    name: 'Monster Energy & Beverage Bar (Food Court)',
    kind: 'energy',
    x: 670,
    y: 335,
    desc: 'Energy drinks, mocktails & refreshments',
    status: 'Open · High Flow',
    icon: '⚡',
    badge: 'Energy Drinks',
    color: '#facc15',
  },

  // Medical / First Aid & Med Kit Posts
  {
    id: 'm1',
    name: 'Emergency Med Kit Post Alpha (Stage/VIP)',
    kind: 'medical',
    x: 290,
    y: 300,
    desc: '2 Paramedics, AED defibrillator, triage med kits, trauma packs',
    status: 'Standing By · Zero Delay',
    icon: '🚑',
    badge: 'First Aid / Med Kit',
    color: '#ef4444',
  },
  {
    id: 'm2',
    name: 'First Aid Tent Bravo (Gate B/C Sector)',
    kind: 'medical',
    x: 515,
    y: 110,
    desc: 'Rapid dehydration treatment, ice packs & heat-stress med kits',
    status: 'Active · 3 Medics',
    icon: '🚑',
    badge: 'First Aid / Med Kit',
    color: '#ef4444',
  },

  // Restrooms
  {
    id: 'r1',
    name: 'Restrooms West Block',
    kind: 'restroom',
    x: 180,
    y: 255,
    desc: 'Wheelchair-accessible washroom facilities',
    status: 'Low Queue (1m)',
    icon: '🚻',
    badge: 'Restroom',
    color: '#a855f7',
  },
  {
    id: 'r2',
    name: 'Restrooms East Concourse',
    kind: 'restroom',
    x: 745,
    y: 285,
    desc: 'Concourse sanitation and washrooms',
    status: 'Moderate Queue (3m)',
    icon: '🚻',
    badge: 'Restroom',
    color: '#a855f7',
  },

  // Emergency Evacuation Exits
  {
    id: 'x1',
    name: 'BKC North Emergency Exit Gate',
    kind: 'exit',
    x: 115,
    y: 45,
    desc: 'Direct wide evacuation passage onto BKC Main Connector',
    status: 'Clear & Unobstructed',
    icon: '🚪',
    badge: 'Evacuation Exit',
    color: '#10b981',
  },
  {
    id: 'x2',
    name: 'BKC South Fire Assembly Gate',
    kind: 'exit',
    x: 660,
    y: 475,
    desc: 'Wide double-gate emergency egress to open assembly grounds',
    status: 'Clear & Unobstructed',
    icon: '🚪',
    badge: 'Evacuation Exit',
    color: '#10b981',
  },
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
  const { zones, predictions, execution, mode, activeSOS, setIsSOSModalOpen } = useCommandCenter();
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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white flex items-center gap-1.5">
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

        {/* Legend */}
        <div className="flex items-center gap-3">
          {legend.map((l) => (
            <span
              key={l.label}
              className="flex items-center gap-1.5 text-[11px] text-slate-400"
            >
              <span className={`h-2 w-2 rounded-full ${l.cls}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

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
              ? 'bg-slate-700 text-white shadow-sm'
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
                {activeSOS.details} · Assigned: {activeSOS.assignedPost}
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

      {/* SVG Map Canvas */}
      <div className="relative">
        <svg viewBox="0 0 800 530" className="h-auto w-full select-none">
          <defs>
            <style>{`
              @keyframes flowDash {
                to {
                  stroke-dashoffset: -28;
                }
              }
              .animate-reroute-flow {
                animation: flowDash 0.8s linear infinite;
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

          {/* Interactive Stalls & Public Safety Amenities */}
          {activeFacilities.map((f) => {
            const isSelected = selectedFacility?.id === f.id;
            return (
              <g
                key={f.id}
                onClick={() => setSelectedFacility(isSelected ? null : f)}
                className="cursor-pointer transition-transform hover:scale-125"
                transform={`translate(${f.x}, ${f.y})`}
              >
                {/* Stall Aura Glow */}
                <circle
                  r={16}
                  fill={f.color}
                  fillOpacity={isSelected ? 0.45 : 0.2}
                  stroke={f.color}
                  strokeWidth={isSelected ? 2 : 1}
                />
                {/* Stall Icon */}
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  fontSize={13}
                  className="select-none pointer-events-none"
                >
                  {f.icon}
                </text>
                {/* Tiny Label under Icon */}
                <text
                  x={0}
                  y={23}
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontFamily="monospace"
                  fontSize={8}
                  fontWeight="bold"
                  className="pointer-events-none drop-shadow"
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

        {/* Selected Stall Tooltip Card */}
        {selectedFacility && (
          <div className="absolute top-4 right-4 z-20 w-72 rounded-xl border border-slate-700 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in duration-150">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-base">
                  {selectedFacility.icon}
                </span>
                <div>
                  <h4 className="font-semibold text-xs text-white">
                    {selectedFacility.name}
                  </h4>
                  <span
                    className="font-mono text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: selectedFacility.color }}
                  >
                    {selectedFacility.badge}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFacility(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-[11px] text-slate-300 leading-snug">
              {selectedFacility.desc}
            </p>

            <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] font-mono">
              <span className="text-slate-400">Live Status:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                {selectedFacility.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Info className="h-3 w-3 text-info" />
          Click any stall icon (💧 Water, 🚑 Med Kit, ⚡ Energy Drink, 🚪 Exit) on the map for real-time status.
        </span>
        <span>MMRDA VENUE GRID // BKC SECTOR 4</span>
      </div>
    </div>
  );
}