// Fake "sensor gateway" so live mode can be tested without real hardware.
//
//   npm install            (installs the "ws" dev dependency)
//   npm run feed           (starts this server on ws://localhost:8080)
//   npm run dev
//
// Sends JSON batches: [{ zoneId, timestamp, count, queueMin, staff, sensorId, sensorType, confidence }, ...]
// Accepts:  {"cmd":"surge"}                            start the Gate B surge
//           {"cmd":"chaos", "type":"turnstile_fail"}   Gate A turnstile jam
//           {"cmd":"chaos", "type":"weather_rush"}     Sudden arena rush
//           {"cmd":"speed", "multiplier": 2}          Speed up sensor time
//           {"cmd":"execute", sourceZoneId, targetZoneId, redirectPeople, staffToDeploy}
//           {"cmd":"reset"}

import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT ?? 8080);
let tickMs = 2000;
let sensorMsPerTick = 60_000;

// Must match src/config/scenario.ts
const START = {
  'gate-a': { count: 2900, cap: 5000, staff: 6, drift: 25, sensorId: 'TURN-GA-01', sensorType: 'optical_turnstile' },
  'gate-b': { count: 3600, cap: 5000, staff: 8, drift: 20, sensorId: 'CAM-GB-03', sensorType: 'stereoscopic_ai' },
  'gate-c': { count: 2100, cap: 5000, staff: 5, drift: 20, sensorId: 'CAM-GC-01', sensorType: 'stereoscopic_ai' },
  'main-arena': { count: 19200, cap: 30000, staff: 40, drift: 60, sensorId: 'LIDAR-AR-04', sensorType: 'overhead_lidar' },
  'food-court': { count: 2200, cap: 4000, staff: 10, drift: 25, sensorId: 'THERM-FC-02', sensorType: 'thermal_grid' },
  parking: { count: 8400, cap: 12000, staff: 15, drift: 40, sensorId: 'RADAR-PK-01', sensorType: 'radar_presence' },
};

const SURGE_PER_MIN = 60; // extra people per sensor-minute at Gate B
const SURGE_TICKS = 40;

let zones, sensorTime, surgeTicks, pending, chaosEffect;
function reset() {
  zones = Object.fromEntries(
    Object.entries(START).map(([id, z]) => [id, { ...z }])
  );
  sensorTime = Date.now();
  surgeTicks = 0;
  pending = null;
  chaosEffect = null;
}
reset();

const wss = new WebSocketServer({ port: PORT });
console.log(`[SurgeGuard Gateway] Mock sensor feed running on ws://localhost:${PORT}`);

let autoSurgeArmed = process.env.AUTO_SURGE !== '0';

wss.on('connection', (ws) => {
  console.log('[SurgeGuard Gateway] Client connected');
  if (autoSurgeArmed) {
    autoSurgeArmed = false;
    setTimeout(() => (surgeTicks = SURGE_TICKS), 15_000);
  }

  ws.on('message', (raw) => {
    let m;
    try {
      m = JSON.parse(String(raw));
    } catch {
      return;
    }

    if (m.cmd === 'surge') {
      console.log('[SurgeGuard Gateway] Command: surge triggered at Gate B');
      surgeTicks = SURGE_TICKS;
    }

    if (m.cmd === 'chaos') {
      console.log(`[SurgeGuard Gateway] Command: chaos event "${m.type}" triggered`);
      chaosEffect = { type: m.type, ticksLeft: 30 };
    }

    if (m.cmd === 'speed') {
      const mult = Number(m.multiplier) || 1;
      sensorMsPerTick = 60_000 * mult;
      console.log(`[SurgeGuard Gateway] Simulation speed set to ${mult}x`);
    }

    if (m.cmd === 'reset') {
      console.log('[SurgeGuard Gateway] Command: reset venue');
      reset();
    }

    if (m.cmd === 'execute' && zones[m.sourceZoneId]) {
      console.log('[SurgeGuard Gateway] Command: execute response plan', m);
      pending = { ...m, ticksLeft: 4 };
      surgeTicks = 0;
      chaosEffect = null;
    }
  });
});

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const noise = (mag) => (Math.random() * 2 - 1) * mag;

setInterval(() => {
  sensorTime += sensorMsPerTick;

  if (surgeTicks > 0) {
    zones['gate-b'].count += SURGE_PER_MIN;
    surgeTicks--;
  }

  // Handle Chaos events
  if (chaosEffect && chaosEffect.ticksLeft > 0) {
    if (chaosEffect.type === 'turnstile_fail') {
      // Gate A queue explodes, count holds high
      zones['gate-a'].count += 35;
    } else if (chaosEffect.type === 'weather_rush') {
      // People rush indoors to main arena from parking
      zones.parking.count = Math.max(1000, zones.parking.count - 80);
      zones['main-arena'].count = Math.min(zones['main-arena'].cap, zones['main-arena'].count + 90);
    }
    chaosEffect.ticksLeft--;
  }

  if (pending && pending.ticksLeft > 0) {
    const src = zones[pending.sourceZoneId];
    const tgt = pending.targetZoneId ? zones[pending.targetZoneId] : null;
    const share = pending.redirectPeople / 4;
    src.count = Math.max(0, src.count - share);
    if (tgt) tgt.count = Math.min(tgt.cap, tgt.count + share);
    if (pending.ticksLeft === 4) src.staff += pending.staffToDeploy ?? 0;
    pending.ticksLeft--;
  }

  const batch = Object.entries(zones).map(([zoneId, z]) => {
    z.count = clamp(z.count + noise(z.drift), 0, z.cap);
    const pct = z.count / z.cap;
    const baseQueue = Math.round(24 * Math.pow(pct, 7));
    const queueMin = chaosEffect?.type === 'turnstile_fail' && zoneId === 'gate-a'
      ? Math.max(baseQueue, 28)
      : baseQueue;

    return {
      zoneId,
      timestamp: sensorTime + Math.round(noise(300)),
      count: Math.round(z.count),
      queueMin,
      staff: z.staff,
      sensorId: z.sensorId,
      sensorType: z.sensorType,
      confidence: Number((0.96 + Math.random() * 0.035).toFixed(3)),
    };
  });

  const payload = JSON.stringify(batch);
  for (const c of wss.clients) {
    if (c.readyState === 1) c.send(payload);
  }
}, tickMs);
