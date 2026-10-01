/**
 * Synthesizes a clean, high-tech command center alert chime using the Web Audio API.
 * Zero external audio files required, runs 100% locally.
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;

export function setAlertMuted(muted: boolean) {
  isMuted = muted;
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
