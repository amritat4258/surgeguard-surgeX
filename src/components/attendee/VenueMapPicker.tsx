import { useRef, type MouseEvent } from 'react';
import type { RiskLevel, Zone, ZoneId } from '@/types';
import { occupancyToRisk } from '@/config/scenario';
import { VENUE_FACILITIES, type FacilityKind, type VenueFacility } from '@/data/facilities';
import { MAP_H, MAP_W, ZONE_SHAPES, clampToVenue, type Point } from '@/data/venueGeometry';

interface VenueMapPickerProps {
  zones: Zone[];
  position: Point;
  onPick: (p: Point) => void;
  filter: FacilityKind;
  target: VenueFacility | null;
  bestGateId: ZoneId | null;
}

const RISK_COLOR: Record<RiskLevel, { fill: string; stroke: string }> = {
  normal: { fill: 'rgba(16,185,129,0.12)', stroke: '#10b981' },
  warning: { fill: 'rgba(245,158,11,0.16)', stroke: '#f59e0b' },
  high: { fill: 'rgba(249,115,22,0.2)', stroke: '#f97316' },
  critical: { fill: 'rgba(239,68,68,0.25)', stroke: '#ef4444' },
};

export function VenueMapPicker({
  zones,
  position,
  onPick,
  filter,
  target,
  bestGateId,
}: VenueMapPickerProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleTap = (e: MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    onPick(clampToVenue({ x: p.x, y: p.y }));
  };

  const shown = VENUE_FACILITIES.filter((f) => filter === 'all' || f.kind === filter);

  return (
    <div data-theme="dark" className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="block h-auto w-full select-none"
        style={{ touchAction: 'manipulation' }}
        onClick={handleTap}
      >
        {/* Grounds boundary */}
        <rect
          x={40}
          y={25}
          width={720}
          height={480}
          rx={24}
          fill="none"
          stroke="#334155"
          strokeWidth={2}
          strokeDasharray="6 6"
        />

        {/* Stage */}
        <rect x={320} y={188} width={160} height={28} rx={6} fill="#0f172a" stroke="#38bdf8" strokeWidth={2} />
        <text x={400} y={208} textAnchor="middle" fill="#7dd3fc" fontSize={16} fontWeight={800}>
          STAGE
        </text>

        {/* Zones */}
        {zones.map((z) => {
          const s = ZONE_SHAPES[z.id];
          if (!s) return null;
          const pct = Math.round((z.current / z.capacity) * 100);
          const c = RISK_COLOR[occupancyToRisk(pct)];
          const isGate = z.kind === 'gate';
          const isBest = bestGateId === z.id;
          return (
            <g key={z.id} style={{ pointerEvents: 'none' }}>
              {s.ellipse ? (
                <ellipse cx={s.x} cy={s.y} rx={s.w / 2} ry={s.h / 2} fill={c.fill} stroke={c.stroke} strokeWidth={2.5} />
              ) : (
                <rect
                  x={s.x - s.w / 2}
                  y={s.y - s.h / 2}
                  width={s.w}
                  height={s.h}
                  rx={12}
                  fill={c.fill}
                  stroke={isBest ? '#34d399' : c.stroke}
                  strokeWidth={isBest ? 5 : 2.5}
                />
              )}
              {s.ellipse ? (
                <>
                  <text x={s.x} y={s.y - 2} textAnchor="middle" fill="#e2e8f0" fontSize={20} fontWeight={700}>
                    {z.name}
                  </text>
                  <text x={s.x} y={s.y + 22} textAnchor="middle" fill={c.stroke} fontSize={20} fontWeight={800}>
                    {pct}% full
                  </text>
                </>
              ) : (
                <>
                  <text x={s.x} y={s.y - 4} textAnchor="middle" fill="#e2e8f0" fontSize={20} fontWeight={700}>
                    {z.name}
                  </text>
                  <text x={s.x} y={s.y + 20} textAnchor="middle" fill={c.stroke} fontSize={22} fontWeight={800}>
                    {isGate ? `${z.queueMin} min` : `${pct}%`}
                  </text>
                </>
              )}
              {isBest && (
                <text x={s.x} y={s.y - s.h / 2 - 8} textAnchor="middle" fill="#34d399" fontSize={18} fontWeight={800}>
                  BEST
                </text>
              )}
            </g>
          );
        })}

        {/* Stalls and facilities */}
        {shown.map((f) => {
          const isTarget = target?.id === f.id;
          return (
            <g key={f.id} transform={`translate(${f.x}, ${f.y})`} style={{ pointerEvents: 'none' }}>
              <circle
                r={isTarget ? 22 : 17}
                fill={f.color}
                fillOpacity={isTarget ? 0.55 : 0.25}
                stroke={f.color}
                strokeWidth={isTarget ? 3.5 : 1.5}
              />
              <text y={7} textAnchor="middle" fontSize={20}>
                {f.icon}
              </text>
            </g>
          );
        })}

        {/* Route to the chosen stall */}
        {target && (
          <g style={{ pointerEvents: 'none' }}>
            <line
              x1={position.x}
              y1={position.y}
              x2={target.x}
              y2={target.y}
              stroke="#38bdf8"
              strokeWidth={5}
              strokeDasharray="10 8"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* You are here */}
        <g transform={`translate(${position.x}, ${position.y})`} style={{ pointerEvents: 'none' }}>
          <circle r={14} fill="#3b82f6" fillOpacity={0.3}>
            <animate attributeName="r" values="14;30;14" dur="2s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle r={11} fill="#3b82f6" stroke="#ffffff" strokeWidth={4} />
          <rect x={-28} y={-48} width={56} height={24} rx={12} fill="#1d4ed8" stroke="#ffffff" strokeWidth={2} />
          <text y={-31} textAnchor="middle" fill="#ffffff" fontSize={16} fontWeight={800}>
            YOU
          </text>
        </g>
      </svg>
    </div>
  );
}
