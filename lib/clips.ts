// Hazır telifsiz klipler — Web Audio API ile tarayıcıda sentezlenir.
// Harici ses dosyası yok: depolama/lisans maliyeti sıfır, offline çalışır.

export interface Clip {
  id: string;
  label: string;
  emoji: string;
  duration: number;
  play: (ctx: AudioContext) => void;
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.16,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function padTone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  duration: number,
  volume = 0.12,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.9);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(start + duration + 0.1);
}

function master(ctx: AudioContext, volume = 0.5) {
  const gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(ctx.destination);
  return gain;
}

const NINNI = [
  659.25, 783.99, 1046.5, 783.99, 880.0, 783.99, 659.25, 523.25,
  659.25, 783.99, 1046.5, 880.0, 783.99, 659.25, 587.33, 523.25,
];

const KONFETI = [
  523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1318.51, 1046.5,
  880.0, 783.99, 659.25, 523.25, 659.25, 783.99, 880.0, 1046.5,
];

const KAR_CANI = [
  659.25, 1046.5, 1174.66, 1046.5, 1174.66, 1318.51, 1567.98,
  1318.51, 1174.66, 1046.5, 987.77, 1046.5,
];

export const clips: Clip[] = [
  {
    id: "ninni",
    label: "Yumuşak Kutu",
    emoji: "💖",
    duration: 5.5,
    play(ctx) {
      const out = master(ctx, 0.5);
      const step = 0.32;
      NINNI.forEach((f, i) =>
        tone(ctx, out, f, ctx.currentTime + 0.05 + i * step, step * 0.9, "triangle", 0.16),
      );
    },
  },
  {
    id: "konfeti",
    label: "Neşeli Zıplama",
    emoji: "🎉",
    duration: 4.2,
    play(ctx) {
      const out = master(ctx, 0.5);
      const step = 0.24;
      KONFETI.forEach((f, i) =>
        tone(ctx, out, f, ctx.currentTime + 0.05 + i * step, step * 0.85, "triangle", 0.18),
      );
    },
  },
  {
    id: "kar-cani",
    label: "Kar Çanı",
    emoji: "🔔",
    duration: 4.0,
    play(ctx) {
      const out = master(ctx, 0.45);
      const step = 0.3;
      KAR_CANI.forEach((f, i) =>
        tone(ctx, out, f, ctx.currentTime + 0.05 + i * step, step * 1.2, "sine", 0.2),
      );
    },
  },
  {
    id: "sihir",
    label: "Sihirli An",
    emoji: "✨",
    duration: 5.2,
    play(ctx) {
      const out = master(ctx, 0.4);
      const t0 = ctx.currentTime + 0.05;
      [110.0, 261.63, 329.63].forEach((f) => padTone(ctx, out, f, t0, 4.6, 0.11));
      const spark = [440.0, 523.25, 659.25, 880.0, 1046.5];
      spark.forEach((f, i) =>
        tone(ctx, out, f, t0 + 2.0 + i * 0.18, 1.2, "sine", 0.13),
      );
    },
  },
];

export function getClip(id: string): Clip | undefined {
  return clips.find((c) => c.id === id);
}
