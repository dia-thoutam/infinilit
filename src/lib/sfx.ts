// Lightweight Web Audio sound effects (no assets, no deps).
let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = "sine", gain = 0.18) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export function playCorrect() {
  tone(660, 0, 0.18, "triangle", 0.18);
  tone(990, 0.09, 0.22, "triangle", 0.16);
}

export function playWrong() {
  tone(220, 0, 0.18, "sawtooth", 0.14);
  tone(165, 0.1, 0.25, "sawtooth", 0.12);
}

export function playXp() {
  tone(880, 0, 0.1, "sine", 0.14);
  tone(1320, 0.07, 0.12, "sine", 0.12);
}

// Winner fanfare — short ascending arpeggio with a bell topper.
export function playFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((f, i) => tone(f, i * 0.12, 0.35, "triangle", 0.18));
  tone(1567.98, 0.55, 0.6, "sine", 0.14); // G6 bell
  tone(2093, 0.55, 0.7, "sine", 0.1);     // C7 shimmer
}