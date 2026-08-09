// Davetiye arka plan müziği — Web Audio ile sentezlenen, kesintisiz döngülü parçalar.
// Harici ses dosyası yok: depolama/lisans maliyeti sıfır, offline çalışır.
// `clips.ts` tek seferlik klipleri, bu modül davetiye ekranı için döngülü parçaları üretir.

import type { GreetingAudio } from "@/lib/types";
import { getClip } from "@/lib/clips";

export interface MusicNote {
  /** Frekans (Hz). */
  f: number;
  /** Beat cinsinden başlangıç (0 ≤ t < beats). */
  t: number;
  /** Beat cinsinden süre. */
  d: number;
  /** Ses şiddeti (varsayılan 0.15). */
  v?: number;
  /** Dalga tipi (varsayılan "triangle"). */
  o?: OscillatorType;
}

export interface MusicTrack {
  id: string;
  label: string;
  emoji: string;
  bpm: number;
  /** Döngü uzunluğu (beat). */
  beats: number;
  notes: MusicNote[];
  /** Her döngüde basılı tutulan alt/pedal ses. */
  pad?: { f: number; v?: number };
}

function toneAt(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = "triangle",
  volume = 0.15,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.03);
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
  volume = 0.07,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.8);
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

function chordNotes(
  rootBeat: number,
  chord: number[],
  dur = 0.85,
  o: OscillatorType = "triangle",
  v = 0.06,
): MusicNote[] {
  return chord.map((f) => ({ f, t: rootBeat, d: dur, o, v }));
}

/** Döngüdeki tüm notaları/pedalı absolute `startTime`'dan planlar. */
function scheduleCycle(
  ctx: AudioContext,
  dest: AudioNode,
  track: MusicTrack,
  startTime: number,
) {
  const beatDur = 60 / track.bpm;
  if (track.pad) {
    padTone(
      ctx,
      dest,
      track.pad.f,
      startTime,
      track.beats * beatDur * 1.05,
      track.pad.v ?? 0.07,
    );
  }
  for (const n of track.notes) {
    toneAt(
      ctx,
      dest,
      n.f,
      startTime + n.t * beatDur,
      n.d * beatDur,
      n.o ?? "triangle",
      n.v ?? 0.15,
    );
  }
}

/** Parçayı bir kez çalar (önizleme için). */
export function playOnce(
  ctx: AudioContext,
  track: MusicTrack,
  startTime = ctx.currentTime,
) {
  const out = master(ctx, 0.5);
  scheduleCycle(ctx, out, track, startTime);
}

/**
 * Kesintisiz döngü: 0.1 sn'de bir bakar, bir sonraki döngü başlangıcı
 * 0.5 sn'lik pencereye girdiğinde tüm notaları planlar. Böylece döngü
 * sınırlarında boşluk/örtüşme olmaz.
 */
export function createMusicLooper(ctx: AudioContext, track: MusicTrack) {
  const out = master(ctx, 0.5);
  const cycleDur = track.beats * (60 / track.bpm);
  let nextCycleTime = ctx.currentTime + 0.15;
  let timer: ReturnType<typeof setInterval> | undefined;
  let running = false;

  function tick() {
    while (nextCycleTime < ctx.currentTime + 0.5) {
      scheduleCycle(ctx, out, track, nextCycleTime);
      nextCycleTime += cycleDur;
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      tick();
      timer = setInterval(tick, 100);
    },
    stop() {
      running = false;
      if (timer) clearInterval(timer);
      timer = undefined;
    },
  };
}

export function trackDuration(track: MusicTrack): number {
  return (track.beats * 60) / track.bpm;
}

export const musicTracks: MusicTrack[] = [
  {
    id: "muzik-kutusu",
    label: "Müzik Kutusu",
    emoji: "🎼",
    bpm: 88,
    beats: 16,
    pad: { f: 130.81, v: 0.06 },
    notes: [
      { f: 659.25, t: 0, d: 0.9, v: 0.16 },
      { f: 783.99, t: 1, d: 0.9, v: 0.16 },
      { f: 1046.5, t: 2, d: 0.9, v: 0.16 },
      { f: 783.99, t: 3, d: 0.9, v: 0.16 },
      { f: 659.25, t: 4, d: 0.9, v: 0.16 },
      { f: 880.0, t: 5, d: 0.9, v: 0.16 },
      { f: 1046.5, t: 6, d: 0.9, v: 0.16 },
      { f: 880.0, t: 7, d: 0.9, v: 0.16 },
      { f: 698.46, t: 8, d: 0.9, v: 0.16 },
      { f: 880.0, t: 9, d: 0.9, v: 0.16 },
      { f: 1046.5, t: 10, d: 0.9, v: 0.16 },
      { f: 880.0, t: 11, d: 0.9, v: 0.16 },
      { f: 587.33, t: 12, d: 0.9, v: 0.16 },
      { f: 783.99, t: 13, d: 0.9, v: 0.16 },
      { f: 987.77, t: 14, d: 0.9, v: 0.16 },
      { f: 1174.66, t: 15, d: 0.9, v: 0.16 },
    ],
  },
  {
    id: "vals",
    label: "Aşk Valsi",
    emoji: "💃",
    bpm: 120,
    beats: 12,
    pad: { f: 196.0, v: 0.05 },
    notes: [
      { f: 130.81, t: 0, d: 1, v: 0.2 },
      { f: 659.25, t: 0, d: 1, v: 0.12, o: "sine" },
      ...chordNotes(1, [261.63, 329.63, 392.0]),
      ...chordNotes(2, [261.63, 329.63, 392.0]),
      { f: 110.0, t: 3, d: 1, v: 0.2 },
      { f: 440.0, t: 3, d: 1, v: 0.12, o: "sine" },
      ...chordNotes(4, [220.0, 261.63, 329.63]),
      ...chordNotes(5, [220.0, 261.63, 329.63]),
      { f: 87.31, t: 6, d: 1, v: 0.2 },
      { f: 698.46, t: 6, d: 1, v: 0.12, o: "sine" },
      ...chordNotes(7, [174.61, 220.0, 261.63]),
      ...chordNotes(8, [174.61, 220.0, 261.63]),
      { f: 98.0, t: 9, d: 1, v: 0.2 },
      { f: 587.33, t: 9, d: 1, v: 0.12, o: "sine" },
      ...chordNotes(10, [196.0, 246.94, 293.66]),
      ...chordNotes(11, [196.0, 246.94, 293.66]),
    ],
  },
  {
    id: "sihir",
    label: "Sihirli An",
    emoji: "✨",
    bpm: 60,
    beats: 5,
    pad: { f: 261.63, v: 0.08 },
    notes: [
      { f: 440.0, t: 2.0, d: 1.2, v: 0.12, o: "sine" },
      { f: 523.25, t: 2.18, d: 1.2, v: 0.12, o: "sine" },
      { f: 659.25, t: 2.36, d: 1.2, v: 0.12, o: "sine" },
      { f: 880.0, t: 2.54, d: 1.4, v: 0.12, o: "sine" },
      { f: 1046.5, t: 2.72, d: 1.5, v: 0.1, o: "sine" },
    ],
  },
  {
    id: "zil",
    label: "Düğün Zili",
    emoji: "🔔",
    bpm: 66,
    beats: 8,
    pad: { f: 130.81, v: 0.06 },
    notes: [
      { f: 523.25, t: 0, d: 2.2, v: 0.2, o: "sine" },
      { f: 659.25, t: 1, d: 2.0, v: 0.12, o: "sine" },
      { f: 783.99, t: 2, d: 2.0, v: 0.12, o: "sine" },
      { f: 1046.5, t: 3, d: 2.4, v: 0.2, o: "sine" },
      { f: 1046.5, t: 4, d: 1.5, v: 0.1, o: "sine" },
      { f: 1318.51, t: 5, d: 1.5, v: 0.1, o: "sine" },
      { f: 1567.98, t: 6, d: 1.8, v: 0.12, o: "sine" },
      { f: 1046.5, t: 7, d: 1.5, v: 0.1, o: "sine" },
    ],
  },
];

export function getMusicTrack(id: string): MusicTrack | undefined {
  return musicTracks.find((t) => t.id === id);
}

/** "Müzik yok" bilinçli seçiminin sentinel klip id'si. */
export const SILENT_CLIP = "sessiz";

/**
 * Sesin etiketi; çalınamıyorsa (bilinmeyen id / "sessiz") null döner.
 */
export function musicLabel(
  audio: GreetingAudio | null | undefined,
): string | null {
  if (!audio) return null;
  if (audio.type === "recording") return "Ses kaydı";
  if (audio.value === SILENT_CLIP) return null;
  return (
    getMusicTrack(audio.value)?.label ??
    getClip(audio.value)?.label ??
    "Müzik"
  );
}

export function isSilentAudio(
  audio: GreetingAudio | null | undefined,
): boolean {
  return (
    audio === null ||
    audio === undefined ||
    (audio.type === "clip" && audio.value === SILENT_CLIP)
  );
}
