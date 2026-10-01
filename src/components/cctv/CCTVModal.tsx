import { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Maximize2,
  X,
  Layers,
  Eye,
  Flame,
  Activity,
  Grid,
  CheckCircle2,
  Video,
  VideoOff,
  AlertCircle,
} from 'lucide-react';
import { useCommandCenter } from '@/state/CommandCenterProvider';
import type { ZoneId } from '@/types';

interface CCTVModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialZoneId?: ZoneId;
}

interface CameraConfig {
  id: string;
  zoneId: ZoneId;
  name: string;
  type: string;
  resolution: string;
  fps: number;
}

const CAMERAS: CameraConfig[] = [
  { id: 'CAM-GA-01', zoneId: 'gate-a', name: 'Gate A Turnstiles', type: 'Stereoscopic Optical', resolution: '1080p', fps: 60 },
  { id: 'CAM-GB-02', zoneId: 'gate-b', name: 'Gate B Main Influx', type: 'Overhead AI Density', resolution: '4K UHD', fps: 60 },
  { id: 'CAM-GC-03', zoneId: 'gate-c', name: 'Gate C Fast-Track', type: 'Optical Flow Matrix', resolution: '1080p', fps: 60 },
  { id: 'CAM-AR-04', zoneId: 'main-arena', name: 'Arena Concourse', type: 'LIDAR Spatial Mesh', resolution: '1440p', fps: 30 },
  { id: 'CAM-FC-05', zoneId: 'food-court', name: 'Food Court North', type: 'Thermal FLIR Grid', resolution: '720p', fps: 30 },
  { id: 'CAM-PK-06', zoneId: 'parking', name: 'Parking Transit Hub', type: 'Perimeter Optical', resolution: '1080p', fps: 30 },
];

export function CCTVModal({ isOpen, onClose, initialZoneId = 'gate-b' }: CCTVModalProps) {
  const { zones, predictions } = useCommandCenter();

  const [selectedCam, setSelectedCam] = useState<CameraConfig>(
    CAMERAS.find((c) => c.zoneId === initialZoneId) ?? CAMERAS[1]
  );
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [showBoxes, setShowBoxes] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [thermalMode, setThermalMode] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [timeStr, setTimeStr] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync selected camera if initialZoneId changes when modal opens
  useEffect(() => {
    if (initialZoneId) {
      const match = CAMERAS.find((c) => c.zoneId === initialZoneId);
      if (match) setSelectedCam(match);
    }
  }, [initialZoneId, isOpen]);

  // Handle webcam stream start/stop
  useEffect(() => {
    if (!isOpen || !useWebcam) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    setWebcamError(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 960, height: 540 } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('Webcam permission or device error:', err);
        setWebcamError('Webcam access was denied or device is not available.');
        setUseWebcam(false);
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, useWebcam]);

  // High-precision clock with milliseconds
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const d = new Date();
      const ms = String(d.getMilliseconds()).padStart(3, '0');
      setTimeStr(`${d.toLocaleTimeString()}.${ms}`);
    }, 50);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Canvas animation for simulated crowd vision + webcam overlay
  useEffect(() => {
    if (!isOpen || viewMode === 'grid') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const currentZone = zones[selectedCam.zoneId];
    const risk = predictions[selectedCam.zoneId].riskLevel;
    const pct = currentZone ? currentZone.current / currentZone.capacity : 0.5;

    // Offscreen canvas for optical motion & head tracking (64x36)
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 64;
    offCanvas.height = 36;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

    let prevData: Uint8ClampedArray | null = null;
    let trackedX = canvas.width / 2;
    let trackedY = canvas.height * 0.45;
    let targetX = canvas.width / 2;
    let targetY = canvas.height * 0.45;
    let targetW = 200;
    let targetH = 260;
    let trackedW = 200;
    let trackedH = 260;
    let frameCount = 0;

    // Generate simulated pedestrian tracks based on occupancy
    const personCount = Math.min(65, Math.max(15, Math.round(pct * 60)));
    const pedestrians = Array.from({ length: personCount }, (_, i) => ({
      id: 1000 + i,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.4 + (selectedCam.zoneId === 'gate-b' ? 0.8 : 0.2),
      vy: (Math.random() - 0.5) * 0.9,
      size: 14 + Math.random() * 8,
      conf: 0.95 + Math.random() * 0.045,
    }));

    const render = () => {
      if (useWebcam && videoRef.current && videoRef.current.readyState >= 2) {
        // Draw real webcam frames
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        if (thermalMode) {
          ctx.fillStyle = 'rgba(147, 51, 234, 0.35)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Live Optical Motion & Head Centroid Tracking
        frameCount++;
        if (offCtx && frameCount % 2 === 0) {
          offCtx.drawImage(videoRef.current, 0, 0, 64, 36);
          const imgData = offCtx.getImageData(0, 0, 64, 36);
          const data = imgData.data;

          let totalWeight = 0;
          let sumX = 0;
          let sumY = 0;
          let minX = 64;
          let maxX = 0;
          let minY = 36;
          let maxY = 0;

          for (let y = 0; y < 36; y++) {
            for (let x = 0; x < 64; x++) {
              const i = (y * 64 + x) * 4;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Motion difference
              let motion = 0;
              if (prevData) {
                const diffR = Math.abs(r - prevData[i]);
                const diffG = Math.abs(g - prevData[i + 1]);
                const diffB = Math.abs(b - prevData[i + 2]);
                motion = diffR + diffG + diffB;
              }

              // Skin/face tone heuristic (RGB color space)
              const isSkin = r > 65 && g > 40 && b > 20 && r > g && (r - b) > 15 && Math.abs(r - g) > 10;

              let weight = 0;
              if (motion > 35) weight += motion * 1.6;
              if (isSkin) weight += 75;

              // Weight upper/middle half more (where the head is in a webcam)
              if (y < 28) weight *= 1.4;

              if (weight > 25) {
                totalWeight += weight;
                sumX += x * weight;
                sumY += y * weight;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          if (totalWeight > 600) {
            const normX = sumX / totalWeight;
            const normY = sumY / totalWeight;
            targetX = (normX / 64) * canvas.width;
            targetY = (normY / 36) * canvas.height;

            const spanX = Math.max(10, maxX - minX);
            const spanY = Math.max(14, maxY - minY);
            targetW = Math.max(150, Math.min(300, (spanX / 64) * canvas.width * 1.5));
            targetH = Math.max(190, Math.min(360, (spanY / 36) * canvas.height * 1.5));
          }

          prevData = new Uint8ClampedArray(data);
        }

        // Smooth physical interpolation to glide the box across the canvas
        trackedX += (targetX - trackedX) * 0.22;
        trackedY += (targetY - trackedY) * 0.22;
        trackedW += (targetW - trackedW) * 0.15;
        trackedH += (targetH - trackedH) * 0.15;

        // Draw live face/human tracking target box over tracked position
        if (showBoxes) {
          const bx = trackedX - trackedW / 2;
          const by = trackedY - trackedH / 2;

          const boxColor = thermalMode ? '#facc15' : '#10b981';
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, trackedW, trackedH);

          // Corner reticles
          const clen = 12;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          // Top-left
          ctx.moveTo(bx, by + clen);
          ctx.lineTo(bx, by);
          ctx.lineTo(bx + clen, by);
          // Top-right
          ctx.moveTo(bx + trackedW - clen, by);
          ctx.lineTo(bx + trackedW, by);
          ctx.lineTo(bx + trackedW, by + clen);
          // Bottom-left
          ctx.moveTo(bx, by + trackedH - clen);
          ctx.lineTo(bx, by + trackedH);
          ctx.lineTo(bx + clen, by + trackedH);
          // Bottom-right
          ctx.moveTo(bx + trackedW - clen, by + trackedH);
          ctx.lineTo(bx + trackedW, by + trackedH);
          ctx.lineTo(bx + trackedW, by + trackedH - clen);
          ctx.stroke();

          // Target reticle crosshair in center of tracked head
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(trackedX, trackedY, 24, 0, Math.PI * 2);
          ctx.moveTo(trackedX - 34, trackedY);
          ctx.lineTo(trackedX + 34, trackedY);
          ctx.moveTo(trackedX, trackedY - 34);
          ctx.lineTo(trackedX, trackedY + 34);
          ctx.stroke();

          ctx.font = '11px monospace';
          ctx.fillStyle = boxColor;
          ctx.fillText(`HUMAN_TRACK // ID#0841 [CONF 99.4%]`, bx, by - 8);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`HEAD_LOCK: ACTIVE [X:${Math.round(trackedX)} Y:${Math.round(trackedY)}]`, bx, by + trackedH + 16);
        }
      } else {
        // Render digital simulation
        ctx.fillStyle = thermalMode ? '#1e1035' : '#080c14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid floor lines
        ctx.strokeStyle = thermalMode ? 'rgba(147, 51, 234, 0.15)' : 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        const step = 40;
        for (let x = 0; x < canvas.width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Density Heatmap
        if (showHeatmap) {
          const chokeX = canvas.width * 0.65;
          const chokeY = canvas.height * 0.5;
          const rad = canvas.width * (0.28 + pct * 0.18);
          const grad = ctx.createRadialGradient(chokeX, chokeY, 10, chokeX, chokeY, rad);

          if (thermalMode) {
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            grad.addColorStop(0.3, 'rgba(239, 68, 68, 0.45)');
            grad.addColorStop(0.7, 'rgba(147, 51, 234, 0.25)');
            grad.addColorStop(1, 'transparent');
          } else if (risk === 'critical') {
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
            grad.addColorStop(0.4, 'rgba(249, 115, 22, 0.35)');
            grad.addColorStop(0.8, 'rgba(234, 179, 8, 0.15)');
            grad.addColorStop(1, 'transparent');
          } else if (risk === 'high' || risk === 'warning') {
            grad.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
            grad.addColorStop(0.5, 'rgba(234, 179, 8, 0.25)');
            grad.addColorStop(1, 'transparent');
          } else {
            grad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
            grad.addColorStop(0.6, 'rgba(56, 189, 248, 0.15)');
            grad.addColorStop(1, 'transparent');
          }

          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Pedestrians & Bounding boxes
        for (const p of pedestrians) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 10) p.x = canvas.width - 20;
          if (p.x > canvas.width - 10) p.x = 20;
          if (p.y < 10) p.y = canvas.height - 20;
          if (p.y > canvas.height - 10) p.y = 20;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2.5, 0, Math.PI * 2);
          ctx.fillStyle = thermalMode
            ? 'rgba(254, 240, 138, 0.85)'
            : risk === 'critical'
            ? 'rgba(252, 165, 165, 0.7)'
            : 'rgba(226, 232, 240, 0.65)';
          ctx.fill();

          if (showBoxes) {
            const w = p.size * 1.8;
            const h = p.size * 2.8;
            const bx = p.x - w / 2;
            const by = p.y - h / 2;

            const boxColor = thermalMode
              ? '#facc15'
              : risk === 'critical'
              ? '#ef4444'
              : risk === 'high'
              ? '#f97316'
              : '#10b981';

            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(bx, by, w, h);

            const clen = 4;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(bx, by + clen);
            ctx.lineTo(bx, by);
            ctx.lineTo(bx + clen, by);
            ctx.stroke();

            ctx.font = '8px monospace';
            ctx.fillStyle = boxColor;
            ctx.fillText(`ID#${p.id} ${(p.conf * 100).toFixed(0)}%`, bx, by - 3);
          }
        }
      }

      // CRT Scanline effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      for (let y = 0; y < canvas.height; y += 3) {
        ctx.fillRect(0, y, canvas.width, 1);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isOpen, viewMode, selectedCam, showBoxes, showHeatmap, thermalMode, useWebcam, zones, predictions]);

  if (!isOpen) return null;

  const activeZone = zones[selectedCam.zoneId];
  const activePred = predictions[selectedCam.zoneId];
  const activePct = activeZone ? (activeZone.current / activeZone.capacity) * 100 : 0;
  const densityVal = (activePct / 32).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md animate-in fade-in duration-200">
      {/* Hidden Video element for real webcam feed ingestion */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info/20 text-info">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-white tracking-wide">
                  SurgeGuard Vision // Automated CCTV Intelligence
                </h2>
                <span className="flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                  REC ● 60 FPS
                </span>
                {useWebcam && (
                  <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE LAPTOP WEBCAM ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Turnstile optical flow & overhead crowd density AI pipeline (YOLOv11-CrowdNet)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real Webcam Toggle */}
            <button
              type="button"
              onClick={() => setUseWebcam((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-mono font-semibold transition ${
                useWebcam
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              {useWebcam ? <Video className="h-3.5 w-3.5 text-emerald-400" /> : <VideoOff className="h-3.5 w-3.5 text-slate-400" />}
              <span>{useWebcam ? 'Disconnect Webcam' : 'Use My Laptop Camera'}</span>
            </button>

            {/* View Switcher */}
            <div className="hidden sm:flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition ${
                  viewMode === 'single' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Maximize2 className="h-3 w-3" />
                Focused Feed
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition ${
                  viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="h-3 w-3" />
                6-Camera Matrix
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {webcamError && (
          <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-5 py-2 text-xs text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{webcamError}</span>
          </div>
        )}

        {/* Camera Selector Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 bg-slate-900/40 px-5 py-2.5 scrollbar-none text-xs">
          <span className="text-[11px] font-mono font-semibold uppercase text-slate-500 shrink-0 mr-1">
            Camera Feeds:
          </span>
          {CAMERAS.map((cam) => {
            const p = predictions[cam.zoneId];
            const isSelected = selectedCam.id === cam.id;
            const isCrit = p.riskLevel === 'critical';
            const isHigh = p.riskLevel === 'high';

            return (
              <button
                key={cam.id}
                type="button"
                onClick={() => {
                  setSelectedCam(cam);
                  setViewMode('single');
                }}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs transition shrink-0 ${
                  isSelected
                    ? 'border-info/60 bg-info/15 text-white font-semibold shadow-sm'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isCrit ? 'bg-rose-500 animate-ping' : isHigh ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span>{cam.name}</span>
                <span className="text-[10px] text-slate-500">({cam.resolution})</span>
              </button>
            );
          })}
        </div>

        {/* Main Feed Viewport */}
        <div className="flex-1 overflow-hidden p-4 flex flex-col">
          {viewMode === 'single' ? (
            <div className="relative flex-1 rounded-2xl border-2 border-slate-800 bg-black overflow-hidden flex flex-col shadow-2xl">
              {/* CCTV HUD Top Bar */}
              <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/80 to-transparent font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-rose-600/90 px-2 py-0.5 font-bold tracking-wider text-white text-[11px]">
                    LIVE // {selectedCam.id}
                  </span>
                  <span className="text-slate-200 font-bold">{selectedCam.name.toUpperCase()}</span>
                  <span className="text-slate-400">· {useWebcam ? 'REAL LAPTOP CAMERA STREAM' : selectedCam.type}</span>
                </div>

                <div className="flex items-center gap-4 text-emerald-400 font-bold">
                  <span>{timeStr}</span>
                  <span className="text-slate-400 font-normal">LATENCY: 14.8ms</span>
                </div>
              </div>

              {/* Interactive Canvas Rendering */}
              <canvas
                ref={canvasRef}
                width={960}
                height={540}
                className="h-full w-full object-cover"
              />

              {/* CCTV HUD Bottom Bar */}
              <div className="absolute bottom-0 inset-x-0 z-20 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent font-mono text-xs">
                <div className="flex items-center gap-4">
                  <div className="rounded bg-slate-900/80 border border-slate-700/80 px-2.5 py-1">
                    <span className="text-slate-400 text-[10px]">CURRENT DENSITY: </span>
                    <strong className={activePred.riskLevel === 'critical' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {densityVal} p/m²
                    </strong>
                    <span className="text-[10px] text-slate-500 ml-1">
                      (Fruin Level {Number(densityVal) > 3.0 ? 'E/F Danger' : Number(densityVal) > 1.8 ? 'C Warning' : 'A Optimal'})
                    </span>
                  </div>

                  <div className="rounded bg-slate-900/80 border border-slate-700/80 px-2.5 py-1">
                    <span className="text-slate-400 text-[10px]">HEADCOUNT IN ZONE: </span>
                    <strong className="text-white">{activeZone.current.toLocaleString()}</strong>
                    <span className="text-slate-400"> / {activeZone.capacity.toLocaleString()}</span>
                  </div>
                </div>

                {/* Video Controls / Layers */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBoxes((prev) => !prev)}
                    className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] transition border ${
                      showBoxes ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    Bounding Boxes
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHeatmap((prev) => !prev)}
                    className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] transition border ${
                      showHeatmap ? 'border-amber-500/50 bg-amber-500/20 text-amber-300' : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Flame className="h-3 w-3" />
                    AI Heatmap
                  </button>

                  <button
                    type="button"
                    onClick={() => setThermalMode((prev) => !prev)}
                    className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] transition border ${
                      thermalMode ? 'border-purple-500/50 bg-purple-500/20 text-purple-300' : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Layers className="h-3 w-3" />
                    FLIR Thermal
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 6-Camera Multi-View Grid */
            <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-3 overflow-y-auto">
              {CAMERAS.map((cam) => {
                const z = zones[cam.zoneId];
                const p = predictions[cam.zoneId];
                const pct = z ? (z.current / z.capacity) * 100 : 0;
                const isCrit = p.riskLevel === 'critical';

                return (
                  <div
                    key={cam.id}
                    onClick={() => {
                      setSelectedCam(cam);
                      setViewMode('single');
                    }}
                    className={`group relative flex flex-col rounded-xl border-2 bg-black p-2.5 cursor-pointer transition hover:border-info ${
                      isCrit ? 'border-rose-500/80 shadow-critical-glow' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1.5">
                      <span className="font-bold text-white flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${isCrit ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                        {cam.id}
                      </span>
                      <span>{cam.resolution}</span>
                    </div>

                    <div className="relative flex-1 rounded bg-slate-950 min-h-[110px] flex flex-col items-center justify-center overflow-hidden border border-slate-900">
                      <div className={`absolute inset-0 opacity-20 ${isCrit ? 'bg-rose-500' : 'bg-sky-500'}`} />
                      <Activity className={`h-6 w-6 mb-1 ${isCrit ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
                      <span className="font-mono text-xs font-bold text-slate-200">{cam.name}</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {pct.toFixed(0)}% Occupancy ({z?.current.toLocaleString()} p)
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono">
                      <span className={isCrit ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                        {isCrit ? 'CRITICAL INFLUX' : 'MONITORING'}
                      </span>
                      <span className="text-info group-hover:underline">Click to Expand ↗</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/60 px-5 py-2.5 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Vision Inference Engine Online
            </span>
            <span>Target Confidence: &gt; 98.4%</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-1 font-semibold text-white hover:bg-slate-700 transition"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
}
