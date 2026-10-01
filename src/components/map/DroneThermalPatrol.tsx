import { useState, useEffect } from 'react';
import {
  Crosshair,
  Compass,
  Camera,
  Radio,
  Wind,
  CheckCircle2,
} from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';

interface DroneThermalPatrolProps {
  onClose: () => void;
}

type ThermalPalette = 'ironbow' | 'whitehot' | 'nvg';
type DroneWaypoint = 'orbit' | 'gate-b' | 'gate-c' | 'arena';

export function DroneThermalPatrol({ onClose }: DroneThermalPatrolProps) {
  const { zoneList, execution, activeSOS } = useCommandCenter();

  const [palette, setPalette] = useState<ThermalPalette>('ironbow');
  const [tilt, setTilt] = useState(30);
  const [zoom, setZoom] = useState(1.0);
  const [activeWaypoint, setActiveWaypoint] = useState<DroneWaypoint>('gate-b');
  const [showAIBoundingBoxes, setShowAIBoundingBoxes] = useState(true);
  const [showFlowVectors, setShowFlowVectors] = useState(true);
  const [snapshotTaken, setSnapshotTaken] = useState(false);
  const [altitudeDrift, setAltitudeDrift] = useState(86.4);

  // Subtle barometric altitude drift simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setAltitudeDrift(+(86.2 + Math.random() * 0.5).toFixed(1));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const totalCrowd = zoneList.reduce((sum, z) => sum + z.current, 0);
  const gateB = zoneList.find((z) => z.id === 'gate-b');
  const gateC = zoneList.find((z) => z.id === 'gate-c');
  const gateBOccupancy = gateB ? gateB.current / gateB.capacity : 0.8;
  const gateBTemp = (31.5 + gateBOccupancy * 6.5).toFixed(1);
  const gateBDensity = (gateBOccupancy * 4.5).toFixed(1);
  const gateCOccupancy = gateC ? gateC.current / gateC.capacity : 0.42;
  const gateCTemp = (24.8 + gateCOccupancy * 4.0).toFixed(1);

  const handleWaypointSelect = (wp: DroneWaypoint) => {
    setActiveWaypoint(wp);
    if (wp === 'gate-b') {
      setTilt(34);
      setZoom(1.25);
    } else if (wp === 'gate-c') {
      setTilt(28);
      setZoom(1.2);
    } else if (wp === 'arena') {
      setTilt(24);
      setZoom(1.1);
    } else {
      setTilt(30);
      setZoom(1.0);
    }
  };

  const handleSnapshot = () => {
    setSnapshotTaken(true);
    setTimeout(() => {
      setSnapshotTaken(false);
    }, 3500);
  };

  // Color schemes for thermal palettes
  const paletteStyles = {
    ironbow: {
      bg: 'bg-[#08031a]',
      border: 'border-amber-500/40',
      canvasBg: 'from-[#0b0424] via-[#1a0736] to-[#080218]',
      grid: '#3a1369',
      concourse: '#2a084e',
      coolZone: '#1e1b4b',
      hotZone: '#e11d48',
      superHotZone: '#f59e0b',
      incandescent: '#ffffff',
      hudText: 'text-amber-400',
      badge: 'border-amber-500/60 bg-amber-500/20 text-amber-300',
    },
    whitehot: {
      bg: 'bg-[#0a0a0c]',
      border: 'border-slate-500/40',
      canvasBg: 'from-[#0c0d10] via-[#14151a] to-[#08080a]',
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
      bg: 'bg-[#02140a]',
      border: 'border-emerald-500/40',
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
    <div className={`relative rounded-xl border ${paletteStyles.border} ${paletteStyles.bg} overflow-hidden font-mono shadow-2xl transition-colors duration-500`}>
      {/* Visual Camera Flash Effect on Snapshot */}
      {snapshotTaken && (
        <div className="absolute inset-0 z-50 bg-white/90 pointer-events-none animate-out fade-out duration-500" />
      )}

      {/* Top Avionics HUD Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2.5 text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600/30 text-rose-400 border border-rose-500/50">
            <Radio className="h-4 w-4 animate-pulse" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-white">
                UAV-SURGE-1 · DJI MATRICE 300 RTK
              </span>
              <span className="rounded bg-rose-500/20 border border-rose-500/50 px-1.5 py-0.2 text-[10px] font-bold text-rose-300 animate-pulse">
                LIVE THERMAL AIRSPACE
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
              <span>SENSOR: FLIR ZENMUSE H20T (640×512 30Hz · NETD &lt;50mK)</span>
              <span>·</span>
              <span>LINK: 5.8GHz O3 AES-256 (14ms)</span>
            </div>
          </div>
        </div>

        {/* Flight Avionics Metrics */}
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1 text-sky-300">
            <Compass className="h-3.5 w-3.5 text-sky-400" />
            <span>ALT: {altitudeDrift}m AGL</span>
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <Wind className="h-3.5 w-3.5 text-slate-400" />
            <span>WIND: 3.2 m/s NW</span>
          </div>

          <div className="flex items-center gap-1 text-emerald-400">
            <span>🔋 BAT: 87% (TB60 DUAL)</span>
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

      {/* Main 3D Viewport with Realistic Perspective Tilt */}
      <div className="relative overflow-hidden p-4 sm:p-6" style={{ perspective: '1100px' }}>
        {/* Subtle Scanlines effect overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20 opacity-15"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.6) 2px, rgba(0, 0, 0, 0.6) 4px)',
          }}
        />

        {/* Center Target Reticle & Crosshairs */}
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
          <div className="relative h-44 w-44 border border-dashed border-amber-400/30 rounded-full flex items-center justify-center">
            {/* Crosshair tick marks */}
            <div className="absolute top-0 h-4 w-0.5 bg-amber-400/70" />
            <div className="absolute bottom-0 h-4 w-0.5 bg-amber-400/70" />
            <div className="absolute left-0 w-4 h-0.5 bg-amber-400/70" />
            <div className="absolute right-0 w-4 h-0.5 bg-amber-400/70" />
            <Crosshair className="h-6 w-6 text-amber-400/60" />

            <div className="absolute bottom-2 text-[9px] font-mono text-amber-300/80 bg-black/60 px-1 rounded">
              PITCH: -{tilt}° · RNG: 88.4m
            </div>
          </div>
        </div>

        {/* 3D Tilted Map Container */}
        <div
          className="relative mx-auto max-w-4xl transition-transform duration-700 ease-out origin-center"
          style={{
            transform: `rotateX(${tilt}deg) rotateZ(-3deg) scale(${zoom})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Ground Gridlines Plane */}
          <div
            className={`w-full rounded-2xl border-2 ${paletteStyles.border} bg-gradient-to-br ${paletteStyles.canvasBg} p-4 sm:p-6 shadow-[0_30px_70px_rgba(0,0,0,0.8)]`}
          >
            {/* SVG Visual Map in FLIR Thermal Rendering */}
            <svg viewBox="0 0 800 520" className="w-full h-auto select-none">
              <defs>
                {/* FLIR Thermal Hotspot Radial Gradient */}
                <radialGradient id="flir-super-hot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="25%" stopColor="#ffea00" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#ff3300" stopOpacity="0.8" />
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

                {/* Animated Dash Array for thermal flow vectors */}
                <style>{`
                  @keyframes vectorFlow {
                    to { stroke-dashoffset: -32; }
                  }
                  .animate-vector-flow {
                    animation: vectorFlow 1.2s linear infinite;
                  }
                `}</style>
              </defs>

              {/* 3D Coordinate Grid */}
              <pattern id="thermal-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke={paletteStyles.grid} strokeWidth="0.8" opacity="0.4" />
              </pattern>
              <rect x="0" y="0" width="800" height="520" fill="url(#thermal-grid)" />

              {/* Concourse Walkways with Thermal Radiation Footprint */}
              <path
                d="M 140 100 L 400 260 M 660 100 L 400 260 M 400 65 L 400 260 M 400 260 L 670 395 M 400 260 L 400 460"
                stroke={paletteStyles.concourse}
                strokeWidth="24"
                strokeLinecap="round"
                opacity="0.7"
              />

              {/* Crowd Flow Velocity Vectors (3D Animated Arrows) */}
              {showFlowVectors && (
                <g>
                  {/* Flow from Main Arena toward Gate B (Critical Choke) */}
                  <line
                    x1="450"
                    y1="220"
                    x2="630"
                    y2="120"
                    stroke="#ff3300"
                    strokeWidth="4"
                    strokeDasharray="8 6"
                    className="animate-vector-flow"
                  />
                  {/* Flow toward Gate C (Diversion / Clear) */}
                  <line
                    x1="400"
                    y1="200"
                    x2="400"
                    y2="85"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    className="animate-vector-flow"
                  />
                  {/* Diverted Corridor from Gate B to Gate C */}
                  {execution && (
                    <path
                      d="M 640 100 Q 520 40 420 65"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="5"
                      strokeDasharray="8 6"
                      className="animate-vector-flow"
                    />
                  )}
                </g>
              )}

              {/* Zone Hotspot Radiations */}
              {/* Gate A */}
              <circle cx="140" cy="100" r="55" fill="url(#flir-moderate-hot)" />
              {/* Gate C (Cool Egress) */}
              <circle cx="400" cy="65" r="50" fill="url(#flir-cool-zone)" />
              {/* Main Arena Concert Center */}
              <ellipse cx="400" cy="260" rx="160" ry="85" fill="url(#flir-moderate-hot)" />
              {/* Gate B: High Density Thermal Core (Incandescent White-Hot) */}
              <circle cx="660" cy="100" r="75" fill="url(#flir-super-hot)" />
              <circle cx="660" cy="100" r="30" fill="#ffffff" opacity="0.8" className="animate-pulse" />

              {/* Zone Buildings & Structures Wireframes */}
              {/* Gate A Box */}
              <g transform="translate(140, 100)">
                <rect x="-65" y="-30" width="130" height="60" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" opacity="0.85" />
                <text x="0" y="-8" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">GATE A</text>
                <text x="0" y="10" textAnchor="middle" fill="#38bdf8" fontSize="10">29.4°C · LOS B</text>
              </g>

              {/* Gate C Box (Safe Egress) */}
              <g transform="translate(400, 65)">
                <rect x="-65" y="-30" width="130" height="60" rx="8" fill="#022c22" stroke="#10b981" strokeWidth="2.5" opacity="0.9" />
                <text x="0" y="-8" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="bold">GATE C (SAFE)</text>
                <text x="0" y="10" textAnchor="middle" fill="#a7f3d0" fontSize="10">{gateCTemp}°C · CLEAR</text>
              </g>

              {/* Gate B Box (Critical Surge) */}
              <g transform="translate(660, 100)">
                <rect x="-65" y="-30" width="130" height="60" rx="8" fill="#4c0519" stroke="#f43f5e" strokeWidth="3" opacity="0.95" />
                <text x="0" y="-8" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">GATE B (SURGE)</text>
                <text x="0" y="10" textAnchor="middle" fill="#fda4af" fontSize="10">{gateBTemp}°C · CHOKEPOINT</text>
              </g>

              {/* Main Arena */}
              <g transform="translate(400, 260)">
                <ellipse cx="0" cy="0" rx="140" ry="70" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" opacity="0.85" />
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

              {/* AI Computer Vision Bounding Boxes (YOLO-v8 Target Brackets) */}
              {showAIBoundingBoxes && (
                <g>
                  {/* Bounding Box 1: Gate B Critical Chokepoint */}
                  <g transform="translate(660, 100)">
                    {/* Corner Target Brackets */}
                    <path d="M -80 -45 L -80 -35 M -80 -45 L -70 -45" stroke="#f43f5e" strokeWidth="2.5" fill="none" />
                    <path d="M 80 -45 L 80 -35 M 80 -45 L 70 -45" stroke="#f43f5e" strokeWidth="2.5" fill="none" />
                    <path d="M -80 45 L -80 35 M -80 45 L -70 45" stroke="#f43f5e" strokeWidth="2.5" fill="none" />
                    <path d="M 80 45 L 80 35 M 80 45 L 70 45" stroke="#f43f5e" strokeWidth="2.5" fill="none" />

                    {/* AI Tag Flag */}
                    <rect x="-80" y="-68" width="175" height="20" rx="4" fill="#881337" stroke="#f43f5e" strokeWidth="1" />
                    <text x="-74" y="-54" fill="#ffffff" fontSize="9" fontWeight="bold">
                      [AI-01] GATE B · {gateBDensity} p/m² · SURGE
                    </text>
                  </g>

                  {/* Bounding Box 2: Gate C Optimal Egress */}
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
                  <circle r="28" fill="none" stroke="#f43f5e" strokeWidth="2" className="animate-ping" />
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
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-xl border border-emerald-500/80 bg-emerald-950/90 px-4 py-2 text-xs font-mono text-emerald-300 shadow-2xl backdrop-blur animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>
            THERMAL SNAPSHOT TRANSMITTED TO MUMBAI POLICE & BMC (RECORD #TRF-DRONE-{Math.floor(8000 + Math.random() * 999)})
          </span>
        </div>
      )}

      {/* Interactive Drone Mission Controls Bottom Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-800 bg-slate-950/90 px-4 py-3 gap-3 text-xs">
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
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Gimbal Focus:</span>
          <button
            type="button"
            onClick={() => handleWaypointSelect('gate-b')}
            className={`px-2 py-1 rounded-lg border transition text-[11px] ${
              activeWaypoint === 'gate-b' ? 'border-rose-500 bg-rose-500/20 text-rose-300 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🎯 Gate B Surge Lock
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
            onClick={() => handleWaypointSelect('orbit')}
            className={`px-2 py-1 rounded-lg border transition text-[11px] ${
              activeWaypoint === 'orbit' ? 'border-sky-500 bg-sky-500/20 text-sky-300 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🔄 Full Concourse Orbit
          </button>
        </div>

        {/* 3D Perspective Tilt & AI Toggles */}
        <div className="flex items-center gap-2">
          {/* AI Bounding Boxes Toggle */}
          <button
            type="button"
            onClick={() => setShowAIBoundingBoxes((v) => !v)}
            className={`px-2 py-1 rounded-lg border text-[11px] transition ${
              showAIBoundingBoxes ? 'border-sky-500/80 bg-sky-500/20 text-sky-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            YOLO AI Target Brackets
          </button>

          {/* Flow Vectors Toggle */}
          <button
            type="button"
            onClick={() => setShowFlowVectors((v) => !v)}
            className={`px-2 py-1 rounded-lg border text-[11px] transition ${
              showFlowVectors ? 'border-amber-500/80 bg-amber-500/20 text-amber-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            Flow Vectors
          </button>

          {/* Capture Thermal Snapshot */}
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
