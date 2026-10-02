import { useEffect, useRef } from 'react';
import { Activity, ArrowUpRight, Flame, Layers } from 'lucide-react';
import type { Zone, ZonePrediction } from '@/types';

export interface CameraConfig {
  id: string;
  zoneId: string;
  name: string;
  type: string;
  resolution: string;
  fps: number;
}

interface MiniCameraPreviewProps {
  cam: CameraConfig;
  zone: Zone | undefined;
  prediction: ZonePrediction | undefined;
  isSelected: boolean;
  onSelect: () => void;
}

export function MiniCameraPreview({
  cam,
  zone,
  prediction,
  isSelected,
  onSelect,
}: MiniCameraPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isCrit = prediction?.riskLevel === 'critical';
  const isHigh = prediction?.riskLevel === 'high';
  const pct = zone ? (zone.current / zone.capacity) * 100 : 45;
  const isMainVideoCam = cam.id === 'CAM-GB-02';
  const isThermalCam = cam.id === 'CAM-FC-05';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    // Pedestrian particles for simulated preview cams
    const count = Math.min(22, Math.max(8, Math.round((pct / 100) * 20)));
    const peds = Array.from({ length: count }, (_, i) => ({
      id: 200 + i,
      x: 15 + Math.random() * (canvas.width - 30),
      y: 15 + Math.random() * (canvas.height - 30),
      vx: (Math.random() - 0.45) * 0.9,
      vy: (Math.random() - 0.4) * 0.8,
      w: 12 + Math.random() * 8,
      h: 22 + Math.random() * 12,
      conf: 0.92 + Math.random() * 0.07,
    }));

    const render = () => {
      tick++;

      // If this is Gate B, draw the real playing video on the canvas, then draw tracking boxes!
      if (isMainVideoCam && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        // Render synthetic surveillance backdrop
        ctx.fillStyle = isThermalCam ? '#1e1035' : '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = isThermalCam ? '#3b1d6e' : '#1e293b';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 24) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Draw animated silhouettes
        for (const p of peds) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 10 || p.x > canvas.width - 10) p.vx *= -1;
          if (p.y < 10 || p.y > canvas.height - 10) p.vy *= -1;

          ctx.fillStyle = isThermalCam ? '#f59e0b' : '#38bdf8';
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.w * 0.35, p.h * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── DRAW REAL-TIME AI TRACKING BOUNDING BOXES ON PREVIEW ──────────────
      const boxColor = isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#10b981';

      if (isMainVideoCam) {
        // Optical tracking boxes synchronized over the real video
        const videoPeds = [
          { x: canvas.width * 0.28 + Math.sin(tick * 0.04) * 12, y: canvas.height * 0.42 + Math.cos(tick * 0.03) * 8, w: 24, h: 42, id: 101 },
          { x: canvas.width * 0.45 + Math.cos(tick * 0.03) * 15, y: canvas.height * 0.55 + Math.sin(tick * 0.04) * 10, w: 28, h: 48, id: 104 },
          { x: canvas.width * 0.62 + Math.sin(tick * 0.05) * 14, y: canvas.height * 0.38 + Math.cos(tick * 0.02) * 6, w: 22, h: 38, id: 109 },
          { x: canvas.width * 0.74 + Math.cos(tick * 0.04) * 10, y: canvas.height * 0.62 + Math.sin(tick * 0.03) * 8, w: 26, h: 44, id: 112 },
        ];

        for (const vp of videoPeds) {
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(vp.x - vp.w / 2, vp.y - vp.h / 2, vp.w, vp.h);

          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(vp.x - vp.w / 2, vp.y - vp.h / 2 - 10, vp.w + 6, 9);
          ctx.font = '8px monospace';
          ctx.fillStyle = boxColor;
          ctx.fillText(`#${vp.id}`, vp.x - vp.w / 2 + 1, vp.y - vp.h / 2 - 3);
        }
      } else {
        // Draw boxes on animated particles
        for (let i = 0; i < Math.min(5, peds.length); i++) {
          const p = peds[i];
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
        }
      }

      // Scanning line
      const scanY = (tick * 1.5) % canvas.height;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [pct, isCrit, isHigh, isMainVideoCam, isThermalCam]);

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col rounded-xl border-2 bg-black p-2.5 cursor-pointer transition hover:border-cyan-400 hover:scale-[1.01] ${
        isCrit
          ? 'border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
          : isSelected
          ? 'border-cyan-500'
          : 'border-slate-800'
      }`}
    >
      {/* Hidden real video element for Gate B to stream onto canvas */}
      {isMainVideoCam && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          src="/videos/cctv-demo.mp4"
          className="hidden"
        />
      )}

      {/* Card Header */}
      <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1.5">
        <span className="font-bold text-white flex items-center gap-1">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isCrit ? 'bg-rose-500 animate-ping' : isHigh ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          {cam.id}
        </span>
        <span className="flex items-center gap-1 text-[9px] text-cyan-400">
          {isMainVideoCam ? 'REAL VIDEO AI' : `${cam.fps} FPS`}
        </span>
      </div>

      {/* Live Video Canvas Viewport */}
      <div className="relative flex-1 rounded-lg bg-slate-950 min-h-[140px] flex flex-col items-center justify-center overflow-hidden border border-slate-900 shadow-inner">
        <canvas
          ref={canvasRef}
          width={320}
          height={180}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Live HUD Overlay on Thumbnail */}
        <div className="absolute top-1.5 left-2 z-10 font-mono text-[9px] text-white/90 bg-black/60 px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
          <span>REC ● LIVE</span>
        </div>

        <div className="absolute bottom-1.5 inset-x-2 z-10 flex items-center justify-between font-mono text-[9px] text-white bg-black/75 px-2 py-0.5 rounded border border-white/10">
          <span className="truncate max-w-[120px] font-bold">{cam.name}</span>
          <span className={isCrit ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
            {pct.toFixed(0)}% OCC
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono">
        <span className={isCrit ? 'text-rose-400 font-bold' : 'text-slate-400'}>
          {isCrit ? 'CRITICAL INFLUX' : 'AI TRACKING ACTIVE'}
        </span>
        <span className="text-cyan-400 group-hover:underline flex items-center gap-0.5">
          Inspect ↗
        </span>
      </div>
    </div>
  );
}
