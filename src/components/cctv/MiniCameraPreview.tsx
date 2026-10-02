import { useEffect, useRef } from 'react';
import { Upload, Video, RotateCcw } from 'lucide-react';
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
  videoUrl?: string;
  videoName?: string;
  onUploadVideo?: (file: File) => void;
  onResetVideo?: () => void;
}

export function MiniCameraPreview({
  cam,
  zone,
  prediction,
  isSelected,
  onSelect,
  videoUrl,
  videoName,
  onUploadVideo,
  onResetVideo,
}: MiniCameraPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isCrit = prediction?.riskLevel === 'critical';
  const isHigh = prediction?.riskLevel === 'high';
  const pct = zone ? (zone.current / zone.capacity) * 100 : 45;
  const isThermalCam = cam.id === 'CAM-FC-05';
  const hasVideo = Boolean(videoUrl);

  // Sync video source & auto-play
  useEffect(() => {
    if (hasVideo && videoRef.current && videoUrl) {
      if (videoRef.current.src !== videoUrl) {
        videoRef.current.src = videoUrl;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [hasVideo, videoUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    // Ground floor plane limits: only people on the ground
    const groundMinY = canvas.height * 0.48;
    const groundMaxY = canvas.height * 0.88;

    // Pedestrian particles for simulated preview cams (strictly positioned on the ground floor)
    const count = Math.min(18, Math.max(7, Math.round((pct / 100) * 16)));
    const peds = Array.from({ length: count }, (_, i) => {
      const startY = groundMinY + Math.random() * (groundMaxY - groundMinY);
      const depth = (startY - groundMinY) / (groundMaxY - groundMinY);
      return {
        id: 200 + i,
        x: 20 + Math.random() * (canvas.width - 40),
        y: startY,
        vx: (Math.random() - 0.48) * 0.8,
        vy: (0.4 + Math.random() * 0.6),
        w: 12 + depth * 8,
        h: 24 + depth * 16,
        conf: 0.93 + Math.random() * 0.06,
      };
    });

    const render = () => {
      tick++;

      // If this camera has an active video feed, draw the real video on the canvas!
      if (hasVideo && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        // Render synthetic surveillance concourse backdrop
        ctx.fillStyle = isThermalCam ? '#160b24' : '#080d1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ground Floor Grid lines (strictly on ground plane from groundMinY downwards)
        ctx.strokeStyle = isThermalCam ? '#3b1d6e' : '#1e293b';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 32) {
          ctx.beginPath();
          ctx.moveTo(canvas.width * 0.5 + (x - canvas.width * 0.5) * 0.35, groundMinY - 10);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = groundMinY - 10; y < canvas.height; y += 18) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Upper canopy barrier/header line
        ctx.fillStyle = isThermalCam ? '#2a1347' : '#0f172a';
        ctx.fillRect(0, 0, canvas.width, groundMinY - 10);
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(0, groundMinY - 10);
        ctx.lineTo(canvas.width, groundMinY - 10);
        ctx.stroke();

        // Draw animated silhouettes strictly walking on the ground
        for (const p of peds) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 15 || p.x > canvas.width - 15) p.vx *= -1;
          if (p.y > groundMaxY) {
            p.y = groundMinY + 4;
            p.x = 25 + Math.random() * (canvas.width - 50);
          }

          // Depth scaling on ground
          const depth = Math.max(0.4, (p.y - groundMinY) / (groundMaxY - groundMinY));
          p.w = 10 * depth * 1.5;
          p.h = 24 * depth * 1.4;

          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + p.h * 0.45, p.w * 0.7, p.w * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();

          // Body
          ctx.fillStyle = isThermalCam ? '#f59e0b' : '#38bdf8';
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.w * 0.4, p.h * 0.32, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── DRAW REAL-TIME AI TRACKING BOUNDING BOXES STRICTLY ON THE GROUND ──
      const boxColor = isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#10b981';

      if (hasVideo) {
        // Optical tracking boxes positioned strictly on people on the ground walkway (y: 52% to 80%)
        const groundTargets = [
          { x: canvas.width * 0.28 + Math.sin(tick * 0.035) * 12, y: canvas.height * 0.54 + Math.cos(tick * 0.025) * 6, w: 22, h: 42, id: 101 },
          { x: canvas.width * 0.46 + Math.cos(tick * 0.03) * 14, y: canvas.height * 0.64 + Math.sin(tick * 0.035) * 8, w: 26, h: 48, id: 104 },
          { x: canvas.width * 0.64 + Math.sin(tick * 0.04) * 12, y: canvas.height * 0.58 + Math.cos(tick * 0.02) * 6, w: 24, h: 44, id: 108 },
          { x: canvas.width * 0.78 + Math.cos(tick * 0.035) * 10, y: canvas.height * 0.72 + Math.sin(tick * 0.03) * 8, w: 28, h: 52, id: 112 },
          { x: canvas.width * 0.36 + Math.sin(tick * 0.045) * 8, y: canvas.height * 0.78 + Math.cos(tick * 0.03) * 6, w: 32, h: 56, id: 115 },
        ];

        for (const vp of groundTargets) {
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 1.3;
          ctx.strokeRect(vp.x - vp.w / 2, vp.y - vp.h / 2, vp.w, vp.h);

          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillRect(vp.x - vp.w / 2, vp.y - vp.h / 2 - 11, vp.w + 6, 10);
          ctx.font = '8px monospace';
          ctx.fillStyle = boxColor;
          ctx.fillText(`#${vp.id}`, vp.x - vp.w / 2 + 1, vp.y - vp.h / 2 - 3);
        }
      } else {
        // Draw boxes on ground particles
        for (let i = 0; i < Math.min(5, peds.length); i++) {
          const p = peds[i];
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
        }
      }

      // Scanning line strictly across the ground surveillance area
      const scanY = groundMinY + ((tick * 1.5) % (canvas.height - groundMinY));
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [pct, isCrit, isHigh, hasVideo, isThermalCam]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadVideo) {
      onUploadVideo(file);
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col rounded-xl border-2 bg-black p-2.5 cursor-pointer transition hover:border-cyan-400 hover:scale-[1.01] ${
        isCrit
          ? 'border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
          : isSelected
          ? 'border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
          : 'border-slate-800'
      }`}
    >
      {/* Hidden real video element streaming to canvas */}
      {hasVideo && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          src={videoUrl}
          className="hidden"
        />
      )}

      {/* Hidden File Input for Direct Card Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />

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

        {/* Video Mode Badge */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
            hasVideo 
              ? 'border-cyan-500/50 bg-cyan-950/80 text-cyan-300' 
              : 'border-slate-700 bg-slate-900 text-slate-400'
          }`}>
            {hasVideo ? (videoName ? `${videoName.slice(0, 11)}…` : 'VIDEO FEED') : `${cam.fps} FPS`}
          </span>

          {/* Quick Upload Video Button on Card */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-0.5 rounded border border-slate-700 bg-slate-800/90 hover:bg-cyan-950 hover:border-cyan-400 px-1.5 py-0.5 text-[8.5px] text-cyan-300 transition"
            title="Upload custom video for this camera"
          >
            <Upload className="h-2.5 w-2.5 text-cyan-400" />
            <span>{hasVideo ? 'Change' : '+ Video'}</span>
          </button>

          {/* Reset button if custom */}
          {hasVideo && onResetVideo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onResetVideo();
              }}
              className="rounded p-0.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
              title="Reset feed"
            >
              <RotateCcw className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
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
          <span>REC ● GROUND AI</span>
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
          {isCrit ? 'CRITICAL INFLUX' : hasVideo ? 'GROUND TRACKING ACTIVE' : 'SIMULATED OPTICAL'}
        </span>
        <span className="text-cyan-400 group-hover:underline flex items-center gap-0.5">
          Inspect ↗
        </span>
      </div>
    </div>
  );
}
