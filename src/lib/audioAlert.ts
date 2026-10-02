/**
 * Synthesizes a clean, high-tech command center alert chime and a looping
 * siren using the Web Audio API.
 * Zero external audio files required, runs 100% locally.
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;

let sirenNodes: {
  osc: OscillatorNode;
  lfo: OscillatorNode;
  master: GainNode;
} | null = null;

export function setAlertMuted(muted: boolean) {
  isMuted = muted;
  if (muted) stopSiren();
  try {
    localStorage.setItem('surgeguard_alert_muted', String(muted));
  } catch {
    // Ignore localStorage restrictions
  }
}

export function getAlertMuted(): boolean {
  try {
    const val = localStorage.getItem('surgeguard_alert_muted');
    if (val !== null) isMuted = val === 'true';
  } catch {
    // Ignore localStorage restrictions
  }
  return isMuted;
}

export function playEmergencyAlertSound() {
  if (isMuted) return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Dual-tone high-tech tactical chime: D5 (587 Hz) -> A5 (880 Hz)
    const playTone = (freq: number, start: number, duration: number) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(587.33, now, 0.16);
    playTone(880.00, now + 0.18, 0.32);
  } catch {
    // AudioContext blocked before first user gesture
  }
}

/** Starts a continuous "wail" siren (pitch sweeps up and down). No-op if muted or already playing. */
export function startSiren() {
  if (isMuted || sirenNodes) return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    const ctx = audioCtx;

    // Browsers block audio until the page has had a click or key press.
    const resume = () => {
      if (ctx.state === 'suspended') void ctx.resume();
    };
    resume();
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 850; // centre pitch

    // Slow oscillator that sweeps the pitch between ~550 and ~1150 Hz
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.7; // sweeps per second
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 300;

    // Soften the harsh sawtooth edge
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2200;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.12, now + 0.3);

    lfo.connect(lfoDepth);
    lfoDepth.connect(osc.frequency);
    osc.connect(filter);
    filter.connect(master);
    master.connect(ctx.destination);

    osc.start(now);
    lfo.start(now);
    sirenNodes = { osc, lfo, master };
  } catch {
    // Audio blocked or unsupported
  }
}

/** Fades out and stops the siren. Safe to call when it isn't playing. */
export function stopSiren() {
  if (!sirenNodes || !audioCtx) {
    sirenNodes = null;
    return;
  }
  const { osc, lfo, master } = sirenNodes;
  sirenNodes = null;
  try {
    const now = audioCtx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.stop(now + 0.25);
    lfo.stop(now + 0.25);
  } catch {
    // Already stopped
  }
}