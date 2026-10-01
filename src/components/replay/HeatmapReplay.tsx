import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ZoneId =
  | "gate-a"
  | "gate-b"
  | "gate-c"
  | "main-arena"
  | "food-court"
  | "parking";

interface ZoneMeta {
  id: ZoneId;
  label: string;
}

interface Snapshot {
  minute: number; // 0 = T-30, 29 = T-0 (LIVE)
  densities: Record<ZoneId, number>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ZONES: ZoneMeta[] = [
  { id: "gate-a", label: "Gate A" },
  { id: "gate-b", label: "Gate B" },
  { id: "gate-c", label: "Gate C" },
  { id: "main-arena", label: "Main Arena" },
  { id: "food-court", label: "Food Court" },
  { id: "parking", label: "Parking" },
];

const TOTAL_FRAMES = 30;
const PLAYBACK_INTERVAL_MS = 600;

// ─── Simulation helpers ───────────────────────────────────────────────────────

/** Linear interpolation clamped to [0, 100] */
const lerp = (start: number, end: number, t: number): number =>
  Math.min(100, Math.max(0, Math.round(start + (end - start) * t)));

/** Add small random jitter so data looks organic */
const jitter = (value: number, amount = 3): number =>
  Math.min(100, Math.max(0, Math.round(value + (Math.random() - 0.5) * amount * 2)));

/**
 * Build all 30 snapshots.
 *
 * Surge story:
 *   gate-b:     45 → 94 peaking at frame 15, then holds ~90-92
 *   main-arena: 55 → 89 peaking at frame 20, then holds ~85-88
 *   Others evolve more modestly.
 */
const buildSnapshots = (): Snapshot[] => {
  const snapshots: Snapshot[] = [];

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const t = i / (TOTAL_FRAMES - 1); // 0..1

    // gate-b: rises steeply to frame 15, then plateau
    const gateBPeak = i <= 15 ? lerp(45, 94, i / 15) : lerp(94, 91, (i - 15) / 14);
    // main-arena: rises to frame 20, then slight ease
    const arenaPeak = i <= 20 ? lerp(55, 89, i / 20) : lerp(89, 86, (i - 20) / 9);

    snapshots.push({
      minute: i,
      densities: {
        "gate-a": jitter(lerp(38, 62, t)),
        "gate-b": jitter(gateBPeak, 2),
        "gate-c": jitter(lerp(30, 54, t)),
        "main-arena": jitter(arenaPeak, 2),
        "food-court": jitter(lerp(50, 73, t)),
        parking: jitter(lerp(25, 48, t)),
      },
    });
  }

  return snapshots;
};

// ─── Colour helpers ───────────────────────────────────────────────────────────

const densityColor = (pct: number): string => {
  if (pct >= 80) return "rose";
  if (pct >= 60) return "amber";
  return "green";
};

const barBg = (pct: number): string => {
  const c = densityColor(pct);
  return c === "rose"
    ? "bg-rose-500"
    : c === "amber"
    ? "bg-amber-400"
    : "bg-green-500";
};

const textColor = (pct: number): string => {
  const c = densityColor(pct);
  return c === "rose"
    ? "text-rose-400"
    : c === "amber"
    ? "text-amber-400"
    : "text-green-400";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SparklineProps {
  values: number[]; // up to 5 values
}

const Sparkline = ({ values }: SparklineProps) => {
  const W = 50;
  const H = 24;
  const barW = 7;
  const gap = 3;

  return (
    <svg width={W} height={H} aria-hidden="true">
      {values.map((v, idx) => {
        const barH = Math.max(2, Math.round((v / 100) * H));
        const x = idx * (barW + gap);
        const y = H - barH;
        const fill =
          v >= 80 ? "#f43f5e" : v >= 60 ? "#fbbf24" : "#22c55e";
        return (
          <rect
            key={idx}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={2}
            fill={fill}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
};

interface ZoneCardProps {
  zone: ZoneMeta;
  density: number;
  sparkValues: number[];
}

const ZoneCard = ({ zone, density, sparkValues }: ZoneCardProps) => {
  const bar = barBg(density);
  const txt = textColor(density);

  return (
    <div className="rounded-xl bg-slate-800/70 border border-slate-700 p-3 flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {zone.label}
        </span>
        <Sparkline values={sparkValues} />
      </div>

      {/* Density bar */}
      <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${density}%` }}
        />
      </div>

      {/* Percentage */}
      <span className={`text-2xl font-bold tabular-nums ${txt}`}>
        {density}
        <span className="text-base font-normal text-slate-400">%</span>
      </span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HeatmapReplay() {
  const [snapshots] = useState<Snapshot[]>(() => buildSnapshots());
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev >= TOTAL_FRAMES - 1) {
          clearTimer();
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, PLAYBACK_INTERVAL_MS);

    return clearTimer;
  }, [isPlaying, clearTimer]);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setCurrentFrame(val);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (currentFrame >= TOTAL_FRAMES - 1 && !isPlaying) {
      // At end — restart
      setCurrentFrame(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  };

  const handleReset = () => {
    clearTimer();
    setCurrentFrame(0);
    setIsPlaying(true);
  };

  const snap = snapshots[currentFrame];
  const minutesAgo = TOTAL_FRAMES - 1 - currentFrame;
  const timeLabel =
    minutesAgo === 0 ? "LIVE NOW" : `T-${minutesAgo}m ago`;
  const isLive = minutesAgo === 0;

  // Sparkline: last 5 frames up to currentFrame
  const sparkStart = Math.max(0, currentFrame - 4);
  const sparkSlice = snapshots.slice(sparkStart, currentFrame + 1);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 flex flex-col gap-4 w-full">
      {/* ── Status bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-semibold text-slate-200 tracking-wide">
          🎬 CROWD DENSITY REPLAY — Last 30 Minutes
        </span>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-widest ${
            isLive
              ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500 animate-pulse"
              : "bg-slate-700 text-slate-400"
          }`}
        >
          {isLive ? "● LIVE" : "REPLAY"}
        </span>
      </div>

      {/* ── Playback controls ── */}
      <div className="flex flex-col gap-2">
        {/* Scrubber */}
        <input
          type="range"
          min={0}
          max={TOTAL_FRAMES - 1}
          step={1}
          value={currentFrame}
          onChange={handleScrub}
          className="w-full accent-slate-400 cursor-pointer h-1.5"
          aria-label="Playback scrubber"
        />

        {/* Controls row */}
        <div className="flex items-center gap-3">
          {/* Play / Pause */}
          <button
            onClick={handlePlayPause}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-base transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          {/* Time label */}
          <span
            className={`text-xs font-mono font-semibold tabular-nums ${
              isLive ? "text-rose-400" : "text-slate-400"
            }`}
          >
            {timeLabel}
          </span>

          {/* Progress ticks */}
          <span className="text-xs text-slate-600 ml-auto">
            {currentFrame + 1} / {TOTAL_FRAMES}
          </span>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="text-xs px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            ↺ Reset &amp; Replay
          </button>
        </div>
      </div>

      {/* ── Zone grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ZONES.map((zone) => {
          const sparkValues = sparkSlice.map((s) => s.densities[zone.id]);
          return (
            <ZoneCard
              key={zone.id}
              zone={zone}
              density={snap.densities[zone.id]}
              sparkValues={sparkValues}
            />
          );
        })}
      </div>
    </div>
  );
}
