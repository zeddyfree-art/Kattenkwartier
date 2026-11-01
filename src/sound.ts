/** Soft synthesized sounds (no audio files). Off by default. */

let ctx: AudioContext | null = null;
let enabled = false;
let voiceKind: 'meow' | 'squeak' = 'meow';

/** Cats meow; red pandas make a little high squeak. */
export function setVoice(v: 'meow' | 'squeak') {
  voiceKind = v;
}

export function setSound(on: boolean) {
  enabled = on;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, to: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** A little "miauw": a buzzy tone through a moving filter. */
function meow(delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const f = c.createBiquadFilter();
  const g = c.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(420, t);
  o.frequency.linearRampToValueAtTime(620, t + 0.18);
  o.frequency.linearRampToValueAtTime(380, t + 0.5);
  f.type = 'bandpass';
  f.Q.value = 4;
  f.frequency.setValueAtTime(700, t);
  f.frequency.linearRampToValueAtTime(1500, t + 0.2);
  f.frequency.linearRampToValueAtTime(800, t + 0.5);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  o.connect(f).connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.6);
}

function squeak(delay = 0) {
  tone(1300, 1900, 0.09, 'sine', 0.1, delay);
  tone(1500, 2200, 0.08, 'sine', 0.08, delay + 0.13);
  tone(1400, 1700, 0.12, 'triangle', 0.05, delay + 0.26);
}

function voice(delay = 0) {
  if (voiceKind === 'squeak') squeak(delay);
  else meow(delay);
}

export const sound = {
  cross: () => tone(1100, 900, 0.05, 'triangle', 0.05),
  clear: () => tone(700, 500, 0.06, 'triangle', 0.04),
  cat: () => { tone(520, 780, 0.09, 'sine', 0.12); tone(780, 1040, 0.08, 'sine', 0.06, 0.06); },
  wrong: () => tone(260, 170, 0.22, 'sine', 0.14),
  hint: () => tone(880, 1320, 0.12, 'sine', 0.06),
  solved: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.22, 'sine', 0.1, i * 0.11));
    voice(0.55);
  },
  voice: () => voice(),
};
