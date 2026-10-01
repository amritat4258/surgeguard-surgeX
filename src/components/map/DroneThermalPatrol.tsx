import { useState, useEffect, useRef } from 'react';
import {
  Crosshair,
  Compass,
  Camera,
  Radio,
  Wind,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';

interface DroneThermalPatrolProps {
  onClose: () => void;
}

type ThermalPalette = 'ironbow' | 'whitehot' | 'nvg';
type DroneWaypoint = 'orbit' | 'gate-b' | 'gate-c' | 'arena';

interface LaserProbe {
  x: number;
  y: number;
  temp: number;
  label: string;
}

export function DroneThermalPatrol({ onClose }: DroneThermalPatrolProps) {
  const { zoneList, execution, activeSOS } = useCommandCenter();

  const [palette, setPalette] = useState<ThermalPalette>('ironbow');
  const [pitch, setPitch] = useState(32);
  const [yaw, setYaw] = useState(-4);
  const [zoom, setZoom] = useState(1.05);
  const [activeWaypoint, setActiveWaypoint] = useState<DroneWaypoint>('gate-b');
  const [showAIBoundingBoxes, setShowAIBoundingBoxes] = useState(true);
  const [showFlowVectors, setShowFlowVectors] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [isCinematicOrbit, setIsCinematicOrbit] = useState(false);
  const [snapshotTaken, setSnapshotTaken] = useState(false);
  const [altitudeDrift, setAltitudeDrift] = useState(86.4);
  const [laserProbe, setLaserProbe] = useState<LaserProbe | null>(null);

  // Mouse drag orbit controls
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, pitch: 32, yaw: -4 });

  // Subtle barometric altitude drift simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setAltitudeDrift(+(86.2 + Math.random() * 0.5).toFixed(1));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Autonomous Cinematic 3D Flyover Figure-8 Sweep
  useEffect(() => {
    if (!isCinematicOrbit) return;
    let t = 0;
    const interval = setInterval(() => {
      t += 0.03;
      setYaw(+(Math.sin(t) * 18).toFixed(1));
      setPitch(+(32 + Math.cos(t * 0.7) * 8).toFixed(1));
      setAltitudeDrift(+(85.5 + Math.sin(t * 0.5) * 1.5).toFixed(1));
    }, 50);
    return () => clearInterval(interval);
  }, [isCinematicOrbit]);

  const totalCrowd = zoneList.reduce((sum, z) => sum + z.current, 0);
  const gateB = zoneList.find((z) => z.id === 'gate-b');
  const gateC = zoneList.find((z) => z.id === 'gate-c');
  const gateBOccupancy = gateB ? gateB.current / gateB.capacity : 0.82;
  const gateBTemp = (31.5 + gateBOccupancy * 6.8).toFixed(1);
  const gateBDensity = (gateBOccupancy * 4.5).toFixed(1);
  const gateCOccupancy = gateC ? gateC.current / gateC.capacity : 0.42;
  const gateCTemp = (24.8 + gateCOccupancy * 4.0).toFixed(1);

  const handleWaypointSelect = (wp: DroneWaypoint) => {
    setActiveWaypoint(wp);
    setIsCinematicOrbit(false);
    if (wp === 'gate-b') {
      setPitch(38);
      setYaw(-8);
      setZoom(1.3);
    } else if (wp === 'gate-c') {
      setPitch(26);
      setYaw(6);
      setZoom(1.22);
    } else if (wp === 'arena') {
      setPitch(22);
      setYaw(0);
      setZoom(1.12);
    } else {
      setPitch(32);
      setYaw(-4);
      setZoom(1.05);
    }
  };

  const handleSnapshot = () => {
    setSnapshotTaken(true);
    setTimeout(() => {
      setSnapshotTaken(false);
    }, 3500);
  };

  // Mouse Drag Handlers for 3D Orbit
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY, pitch, yaw };
    setIsCinematicOrbit(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const newYaw = Math.min(50, Math.max(-50, dragStartRef.current.yaw + deltaX * 0.25));
      const newPitch = Math.min(60, Math.max(12, dragStartRef.current.pitch - deltaY * 0.25));
      setYaw(+newYaw.toFixed(1));
      setPitch(+newPitch.toFixed(1));
    }

    // Laser Thermal Probe calculation relative to 800x520 map coordinates
    const target = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - target.left) / target.width) * 800;
    const relY = ((e.clientY - target.top) / target.height) * 520;

    // Distances to landmarks
    const distGateB = Math.hypot(relX - 660, relY - 100);
    const distArena = Math.hypot(relX - 400, relY - 260);
    const distGateC = Math.hypot(relX - 400, relY - 65);
    const distGateA = Math.hypot(relX - 140, relY - 100);

    let temp = 24.8;
    let label = 'Concourse Ambient';
    if (distGateB < 85) {
      temp = +(38.6 - (distGateB / 85) * 5).toFixed(1);
      label = 'Gate B Surge Core (Extreme Heat)';
    } else if (distArena < 140) {
      temp = +(33.2 - (distArena / 140) * 4).toFixed(1);
      label = 'Arena Concourse (High Density)';
    } else if (distGateA < 75) {
      temp = +(29.4 - (distGateA / 75) * 3).toFixed(1);
      label = 'Gate A Turnstiles';
    } else if (distGateC < 75) {
      temp = +(26.4 - (distGateC / 75) * 2).toFixed(1);
      label = 'Gate C Egress (Cool Flow)';
    }

    setLaserProbe({ x: relX, y: relY, temp, label });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const newZoom = Math.min(2.5, Math.max(0.85, zoom - e.deltaY * 0.0015));
    setZoom(+newZoom.toFixed(2));
  };

  // Color schemes for thermal palettes
  const paletteStyles = {
    ironbow: {
      bg: 'bg-[#060216]',
      border: 'border-amber-500/50',
      canvasBg: 'from-[#0a0324] via-[#1a0736] to-[#080218]',
      grid: '#441477',
      concourse: '#2a084e',
      coolZone: '#1e1b4b',
      hotZone: '#e11d48',
      superHotZone: '#f59e0b',
      incandescent: '#ffffff',
      hudText: 'text-amber-400',
      badge: 'border-amber-500/60 bg-amber-500/20 text-amber-300',
    },
    whitehot: {
      bg: 'bg-[#08080a]',
      border: 'border-slate-500/50',
      canvasBg: 'from-[#0b0c0f] via-[#15161c] to-[#08080a]',
      grid: '#27272a',
      concourse: '#18181b',
      coolZone: '#27272a',
      hotZone: '#71717a',
      superHotZone: '#e4e4e7',
      incandescent: '#ffffff',
      hudText: 'text-slate-200',
      badge: 'border-slate-400/60 bg-slate-500/20 text-slate-100',
    },
    nvg: {
      bg: 'bg-[#011208]',
      border: 'border-emerald-500/50',
      canvasBg: 'from-[#02180c] via-[#042814] to-[#010e06]',
      grid: '#064e26',
      concourse: '#064e26',
      coolZone: '#042f17',
      hotZone: '#10b981',
      superHotZone: '#34d399',
      incandescent: '#ecfdf5',
      hudText: 'text-emerald-400',
      badge: 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300',
    },
  }[palette];

  return (
    <div className={`relative rounded-xl border ${paletteStyles.border} ${paletteStyles.bg} overflow-hidden font-mono shadow-2xl transition-colors duration-500 select-none`}>
      {/* Visual Camera Flash Effect on Snapshot */}
      {snapshotTaken && (
        <div className="absolute inset-0 z-50 bg-white/95 pointer-events-none animate-out fade-out duration-500" />
      )}

      {/* Top Avionics HUD Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-2 text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600/30 text-rose-400 border border-rose-500/50">
            <Radio className="h-4 w-4 animate-pulse" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-white">
                UAV-SURGE-1 · DJI MATRICE 300 RTK // FLIR ZENMUSE H20T
              </span>
              <span className="rounded bg-rose-500/20 border border-rose-500/50 px-1.5 py-0.2 text-[10px] font-bold text-rose-300 animate-pulse">
                AIRSPACE FLIR SENSOR
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
              <span>LAT/LONG: 19.0657°N, 72.8682°E</span>
              <span>·</span>
              <span>GIMBAL: PITCH {pitch}° / YAW {yaw}° / ZOOM {zoom}x</span>
              <span>·</span>
              <span>LINK: 5.8GHz O3 1080P60 (14ms)</span>
            </div>
          </div>
        </div>

        {/* Flight Avionics Metrics */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
          <div className="flex items-center gap-1 text-sky-300">
            <Compass className="h-3.5 w-3.5 text-sky-400" />
            <span>ALT: {altitudeDrift}m AGL</span>
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <Wind className="h-3.5 w-3.5 text-slate-400" />
            <span>WIND: 3.2 m/s NW</span>
          </div>

          <div className="flex items-center gap-1 text-emerald-400">
            <span>🔋 BAT: 87% (28 MIN)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-700 px-3 py-1 font-bold text-slate-200 transition"
          >
            ✕ Exit Drone Feed
          </button>
        </div>
      </div>

      {/* Main 3D Viewport with Interactive Drag Orbit & Laser Probe */}
      <div
        className="relative overflow-hidden p-3 sm:p-5 cursor-grab active:cursor-grabbing"
        style={{ perspective: '1200px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          isDraggingRef.current = false;
          setLaserProbe(null);
        }}
        onWheel={handleWheel}
      >
        {/* Subtle Scanlines effect overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20 opacity-15"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.6) 2px, rgba(0, 0, 0, 0.6) 4px)',
          }}
        />

        {/* Center Optical Target Reticle & Crosshair */}
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
          <div className="relative h-48 w-48 border border-dashed border-amber-400/25 rounded-full flex items-center justify-center">
            <div className="absolute top-0 h-4 w-0.5 bg-amber-400/70" />
            <div className="absolute bottom-0 h-4 w-0.5 bg-amber-400/70" />
            <div className="absolute left-0 w-4 h-0.5 bg-amber-400/70" />
            <div className="absolute right-0 w-4 h-0.5 bg-amber-400/70" />
            <Crosshair className="h-6 w-6 text-amber-400/60" />

            <div className="absolute bottom-2 text-[9px] font-mono text-amber-300/80 bg-black/70 px-1.5 py-0.5 rounded border border-amber-500/30">
              GIMBAL: {pitch}° / {yaw}° · ZOOM {zoom}x
            </div>
          </div>
        </div>

        {/* Floating Laser Thermal Probe (Follows Mouse Cursor) */}
        {laserProbe && (
          <div
            className="absolute z-30 pointer-events-none flex flex-col gap-0.5 bg-slate-950/90 border border-amber-400/80 p-1.5 rounded-lg text-[10px] text-amber-300 font-mono shadow-xl backdrop-blur-sm -translate-x-1/2 -translate-y-12"
            style={{
              left: `${(laserProbe.x / 800) * 100}%`,
              top: `${(laserProbe.y / 520) * 100}%`,
            }}
          >
            <div className="flex items-center gap-1 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>SPOT T: {laserProbe.temp}°C</span>
            </div>
            <span className="text-[8.5px] text-slate-300">{laserProbe.label}</span>
          </div>
        )}

        {/* Instructions Overlay Badge */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none rounded-lg bg-black/60 border border-slate-800 px-2 py-1 text-[10px] text-slate-400">
          <span>🖱️ Click & Drag to Orbit 3D Gimbal · Scroll to Zoom</span>
        </div>

        {/* 3D Tilted Map Container */}
        <div
          className="relative mx-auto max-w-4xl transition-transform duration-200 ease-out origin-center"
          style={{
            transform: `rotateX(${pitch}deg) rotateZ(${yaw}deg) scale(${zoom})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Ground Gridlines Plane */}
          <div
            className={`w-full rounded-2xl border-2 ${paletteStyles.border} bg-gradient-to-br ${paletteStyles.canvasBg} p-4 sm:p-6 shadow-[0_35px_80px_rgba(0,0,0,0.85)]`}
          >
            {/* SVG Visual Map in FLIR Thermal Rendering */}
            <svg viewBox="0 0 800 520" className="w-full h-auto select-none overflow-visible">
              <defs>
                {/* FLIR Thermal Hotspot Radial Gradient */}
                <radialGradient id="flir-super-hot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="25%" stopColor="#ffea00" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#ff3300" stopOpacity="0.85" />
                  <stop offset="85%" stopColor="#b70068" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#25004d" stopOpacity="0.1" />
                </radialGradient>

                <radialGradient id="flir-moderate-hot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffb300" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#d91a60" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#1e0847" stopOpacity="0.1" />
                </radialGradient>

                <radialGradient id="flir-cool-zone" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
                  <stop offset="60%" stopColor="#1e1b4b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#080218" stopOpacity="0" />
                </radialGradient>

                <style>{`
                  @keyframes vectorFlow {
                    to { stroke-dashoffset: -32; }
                  }
                  .animate-vector-flow {
                    animation: vectorFlow 1.1s linear infinite;
                  }
                  @keyframes particleMove {
                    0% { offset-distance: 0%; opacity: 0; }
                    10% { opacity: 0.9; }
                    90% { opacity: 0.9; }
                    100% { offset-distance: 100%; opacity: 0; }
                  }
                `}</style>
              </defs>

              {/* 3D Coordinate Grid */}
              <pattern id="thermal-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke={paletteStyles.grid} strokeWidth="0.8" opacity="0.4" />
              </pattern>
              <rect x="0" y="0" width="800" height="520" fill="url(#thermal-grid)" />

              {/* Concourse Walkways with Thermal Footprint */}
              <path
                d="M 140 100 L 400 260 M 660 100 L 400 260 M 400 65 L 400 260 M 400 260 L 670 395 M 400 260 L 400 460"
                stroke={paletteStyles.concourse}
                strokeWidth="26"
                strokeLinecap="round"
                opacity="0.75"
              />

              {/* Moving Thermal Crowd Particles */}
              {showParticles && (
                <g>
                  {/* Crowd particles moving toward Gate B */}
                  {[0, 0.2, 0.4, 0.6, 0.8].map((delay, i) => (
                    <circle
                      key={`pt-b-${i}`}
                      r={3.5}
                      fill="#ff3b00"
                      className="animate-pulse"
                      style={{
                        offsetPath: 'path("M 400 260 L 660 100")',
                        animation: `particleMove 3s linear infinite`,
                        animationDelay: `${delay * 3}s`,
                      }}
                    />
                  ))}
                  {/* Crowd particles moving toward Gate C */}
                  {[0, 0.33, 0.66].map((delay, i) => (
                    <circle
                      key={`pt-c-${i}`}
                      r={3}
                      fill="#10b981"
                      style={{
                        offsetPath: 'path("M 400 260 L 400 65")',
                        animation: `particleMove 3.5s linear infinite`,
                        animationDelay: `${delay * 3.5}s`,
                      }}
                    />
                  ))}
                  {/* Crowd diversion particles when active */}
                  {execution &&
                    [0, 0.25, 0.5, 0.75].map((delay, i) => (
                      <circle
                        key={`pt-div-${i}`}
                        r={3.5}
                        fill="#34d399"
                        style={{
                          offsetPath: 'path("M 640 100 Q 520 40 420 65")',
                          animation: `particleMove 2.6s linear infinite`,
                          animationDelay: `${delay * 2.6}s`,
                        }}
                      />
                    ))}
                </g>
              )}

              {/* Crowd Flow Velocity Vectors */}
              {showFlowVectors && (
                <g>
                  <line
                    x1="450"
                    y1="220"
                    x2="630"
                    y2="120"
                    stroke="#ff3300"
                    strokeWidth="4.5"
                    strokeDasharray="8 6"
                    className="animate-vector-flow"
                  />
                  <line
                    x1="400"
                    y1="200"
                    x2="400"
                    y2="85"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeDasharray="6 4"
                    className="animate-vector-flow"
                  />
                  {execution && (
                    <path
                      d="M 640 100 Q 520 40 420 65"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="5.5"
                      strokeDasharray="8 6"
                      className="animate-vector-flow"
                    />
                  )}
                </g>
              )}

              {/* Zone Hotspot Radiations */}
              <circle cx="140" cy="100" r="55" fill="url(#flir-moderate-hot)" />
              <circle cx="400" cy="65" r="50" fill="url(#flir-cool-zone)" />
              <ellipse cx="400" cy="260" rx="160" ry="85" fill="url(#flir-moderate-hot)" />
              <circle cx="660" cy="100" r="80" fill="url(#flir-super-hot)" />
              <circle cx="660" cy="100" r="32" fill="#ffffff" opacity="0.85" className="animate-pulse" />

              {/* 3D Elevated Architectural Wireframes */}
              {/* Gate A Tower */}
              <g transform="translate(140, 100)">
                <rect x="-65" y="-30" width="130" height="60" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" opacity="0.9" />
                <text x="0" y="-8" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">GATE A</text>
                <text x="0" y="10" textAnchor="middle" fill="#38bdf8" fontSize="10">29.4°C · LOS B</text>
              </g>

              {/* Gate C Portal (Safe Egress) */}
              <g transform="translate(400, 65)">
                <rect x="-65" y="-30" width="130" height="60" rx="8" fill="#022c22" stroke="#10b981" strokeWidth="2.5" opacity="0.9" />
                <text x="0" y="-8" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="bold">GATE C (SAFE)</text>
                <text x="0" y="10" textAnchor="middle" fill="#a7f3d0" fontSize="10">{gateCTemp}°C · CLEAR</text>
              </g>

              {/* Gate B Chokepoint (Critical Thermal Core) */}
              <g transform="translate(660, 100)">
                <rect x="-65" y="-30" width="130" height="60" rx="8" fill="#4c0519" stroke="#f43f5e" strokeWidth="3.5" opacity="0.95" />
                <text x="0" y="-8" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">GATE B (SURGE)</text>
                <text x="0" y="10" textAnchor="middle" fill="#fda4af" fontSize="10">{gateBTemp}°C · CHOKEPOINT</text>
              </g>

              {/* Main Stage Elevated Rig */}
              <g transform="translate(400, 185)">
                <rect x="-80" y="-14" width="160" height="28" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">★ CONCERT MAIN STAGE ★</text>
              </g>

              {/* Main Arena */}
              <g transform="translate(400, 260)">
                <ellipse cx="0" cy="0" rx="140" ry="70" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2.5" opacity="0.85" />
                <text x="0" y="-10" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">MAIN ARENA BOWL</text>
                <text x="0" y="10" textAnchor="middle" fill="#a5b4fc" fontSize="10">{totalCrowd.toLocaleString()} ATTENDEES · 32.1°C</text>
              </g>

              {/* Food Court */}
              <g transform="translate(670, 395)">
                <rect x="-65" y="-25" width="130" height="50" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">FOOD COURT</text>
                <text x="0" y="12" textAnchor="middle" fill="#94a3b8" fontSize="9">30.2°C · QUEUE 4m</text>
              </g>

              {/* Parking Sector */}
              <g transform="translate(400, 460)">
                <rect x="-90" y="-25" width="180" height="50" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">PARKING & SHUTTLE</text>
                <text x="0" y="12" textAnchor="middle" fill="#94a3b8" fontSize="9">27.5°C · EGRESS STEADY</text>
              </g>

              {/* AI YOLO-v8 Target Brackets */}
              {showAIBoundingBoxes && (
                <g>
                  {/* Gate B Critical Chokepoint Bracket */}
                  <g transform="translate(660, 100)">
                    <path d="M -80 -45 L -80 -35 M -80 -45 L -70 -45" stroke="#f43f5e" strokeWidth="2.5" fill="none" />
                    <path d="M 80 -45 L 80 -35 M 80 -45 L 70 -45" stroke="#f43f5e" strokeWidth="2.5" fill="none" />
                    <path d="M -80 45 L -80 35 M -80 45 L -70 45" stroke="#f43f5e" strokeWidth="2.5" fill="none" />
                    <path d="M 80 45 L 80 35 M 80 45 L 70 45" stroke="#f43f5e" strokeWidth="2.5" fill="none" />

                    <rect x="-80" y="-68" width="180" height="20" rx="4" fill="#881337" stroke="#f43f5e" strokeWidth="1" />
                    <text x="-74" y="-54" fill="#ffffff" fontSize="9" fontWeight="bold">
                      [AI-01] GATE B · {gateBDensity} p/m² · SURGE
                    </text>
                  </g>

                  {/* Gate C Safe Egress Bracket */}
                  <g transform="translate(400, 65)">
                    <path d="M -75 -40 L -75 -30 M -75 -40 L -65 -40" stroke="#10b981" strokeWidth="2.5" fill="none" />
                    <path d="M 75 -40 L 75 -30 M 75 -40 L 65 -40" stroke="#10b981" strokeWidth="2.5" fill="none" />
                    <path d="M -75 40 L -75 30 M -75 40 L -65 40" stroke="#10b981" strokeWidth="2.5" fill="none" />
                    <path d="M 75 40 L 75 30 M 75 40 L 65 40" stroke="#10b981" strokeWidth="2.5" fill="none" />

                    <rect x="-75" y="-62" width="165" height="19" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                    <text x="-70" y="-48" fill="#34d399" fontSize="9" fontWeight="bold">
                      [AI-02] GATE C · 1.4 p/m² · CLEAR
                    </text>
                  </g>
                </g>
              )}

              {/* Active SOS Beacon on Drone Feed if Present */}
              {activeSOS && (
                <g transform={`translate(${activeSOS.coordinates.x}, ${activeSOS.coordinates.y})`}>
                  <circle r="30" fill="none" stroke="#f43f5e" strokeWidth="2.5" className="animate-ping" />
                  <circle r="8" fill="#f43f5e" />
                  <rect x="-55" y="-32" width="110" height="18" rx="4" fill="#9f1239" stroke="#fda4af" strokeWidth="1" />
                  <text x="0" y="-20" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                    🚨 SOS: {activeSOS.type.toUpperCase()}
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Snapshot Toast Feedback */}
      {snapshotTaken && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-xl border border-emerald-500/80 bg-emerald-950/90 px-4 py-2 text-xs font-mono text-emerald-300 shadow-2xl backdrop-blur animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>
            THERMAL SNAPSHOT TRANSMITTED TO MUMBAI POLICE & BMC (RECORD #TRF-DRONE-{Math.floor(8000 + Math.random() * 999)})
          </span>
        </div>
      )}

      {/* Interactive Drone Mission Controls Bottom Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-800 bg-slate-950/95 px-4 py-3 gap-3 text-xs">
        {/* Thermal Palette Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">FLIR Palette:</span>
          <button
            type="button"
            onClick={() => setPalette('ironbow')}
            className={`px-2.5 py-1 rounded-lg border transition text-[11px] ${
              palette === 'ironbow' ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🔥 Ironbow
          </button>
          <button
            type="button"
            onClick={() => setPalette('whitehot')}
            className={`px-2.5 py-1 rounded-lg border transition text-[11px] ${
              palette === 'whitehot' ? 'border-slate-300 bg-slate-300/20 text-white font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ⚪ White-Hot
          </button>
          <button
            type="button"
            onClick={() => setPalette('nvg')}
            className={`px-2.5 py-1 rounded-lg border transition text-[11px] ${
              palette === 'nvg' ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🟢 NVG Phosphor
          </button>
        </div>

        {/* 3D Waypoint Orbit Locks */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Gimbal:</span>
          <button
            type="button"
            onClick={() => handleWaypointSelect('gate-b')}
            className={`px-2 py-1 rounded-lg border transition text-[11px] ${
              activeWaypoint === 'gate-b' ? 'border-rose-500 bg-rose-500/20 text-rose-300 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🎯 Gate B Lock
          </button>
          <button
            type="button"
            onClick={() => handleWaypointSelect('gate-c')}
            className={`px-2 py-1 rounded-lg border transition text-[11px] ${
              activeWaypoint === 'gate-c' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🚪 Gate C Egress
          </button>
          <button
            type="button"
            onClick={() => setIsCinematicOrbit((v) => !v)}
            className={`px-2 py-1 rounded-lg border transition text-[11px] flex items-center gap-1 ${
              isCinematicOrbit ? 'border-purple-500 bg-purple-500/20 text-purple-300 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isCinematicOrbit ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{isCinematicOrbit ? 'Pause Sweep' : '🎥 3D Flyover'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPitch(32);
              setYaw(-4);
              setZoom(1.05);
              setIsCinematicOrbit(false);
            }}
            title="Reset 3D Gimbal to Default"
            className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>

        {/* AI & Particle Toggles */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowParticles((v) => !v)}
            className={`px-2 py-1 rounded-lg border text-[11px] transition ${
              showParticles ? 'border-rose-500/80 bg-rose-500/20 text-rose-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            Crowd Particles
          </button>

          <button
            type="button"
            onClick={() => setShowFlowVectors((v) => !v)}
            className={`px-2 py-1 rounded-lg border text-[11px] transition ${
              showFlowVectors ? 'border-amber-500/80 bg-amber-500/20 text-amber-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            Flow Vectors
          </button>

          <button
            type="button"
            onClick={() => setShowAIBoundingBoxes((v) => !v)}
            className={`px-2 py-1 rounded-lg border text-[11px] transition ${
              showAIBoundingBoxes ? 'border-sky-500/80 bg-sky-500/20 text-sky-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            YOLO AI Brackets
          </button>

          <button
            type="button"
            onClick={handleSnapshot}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-1 font-bold text-white shadow-lg shadow-sky-600/30 transition hover:scale-105 active:scale-95"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Transmit Thermal Evidence</span>
          </button>
        </div>
      </div>
    </div>
  );
}
