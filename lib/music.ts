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
    id: "dogum-gunu",
    label: "Doğum Günü",
    emoji: "🎂",
    bpm: 96,
    beats: 8,
    pad: { f: 196.0, v: 0.06 },
    notes: [
      { f: 523.25, t: 0, d: 0.5, v: 0.16 },
      { f: 523.25, t: 1, d: 0.5, v: 0.16 },
      { f: 659.25, t: 2, d: 0.5, v: 0.16 },
      { f: 523.25, t: 3, d: 0.5, v: 0.16 },
      { f: 783.99, t: 4, d: 0.9, v: 0.16 },
      { f: 659.25, t: 6, d: 0.5, v: 0.16 },
      { f: 587.33, t: 7, d: 1.2, v: 0.16 },
    ],
  },
  {
    id: "huzur",
    label: "Huzur",
    emoji: "🌙",
    bpm: 70,
    beats: 8,
    pad: { f: 130.81, v: 0.08 },
    notes: [
      ...chordNotes(0, [220.0, 261.63, 329.63], 1.6, "sine", 0.1),
      { f: 440.0, t: 1, d: 2.0, v: 0.1, o: "sine" },
      ...chordNotes(4, [174.61, 220.0, 261.63], 1.6, "sine", 0.1),
      { f: 349.23, t: 5, d: 2.0, v: 0.1, o: "sine" },
    ],
  },
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
  if (audio.type === "file") return "Özel müzik";
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

/** Supabase Storage'taki ses dosyası bucket adı. */
export const AUDIO_BUCKET = "audio-files";

/**
 * Yüklenen dosya (file) sesinin public URL'sini doğrular.
 * Yalnızca bu projenin Supabase Storage bucket'ından gelen URL'ler kabul edilir.
 */
export function isStorageAudioUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  const prefix = `${base}/storage/v1/object/public/${AUDIO_BUCKET}/`;
  if (!url.startsWith(prefix)) return false;
  // path traversal / sorgu parametresi ile manipülasyon engelle
  const rest = url.slice(prefix.length);
  return rest.length > 0 && !rest.includes("..") && !rest.includes("?") && !rest.includes("#");
}

/** Trim penceresi tutarlı mı? (startTime < endTime, her ikisi de varsa). */
export function isValidTrim(audio: GreetingAudio): boolean {
  if (audio.type !== "file") return true;
  const { startTime, endTime } = audio;
  if (startTime === undefined && endTime === undefined) return true;
  if (startTime === undefined || endTime === undefined) return false;
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return false;
  if (startTime < 0 || endTime <= startTime) return false;
  return true;
}

/** Trim uygulanabilecek azami süre (sn). */
export const MAX_AUDIO_DURATION = 600;

/**
 * Ham değerden güvenli GreetingAudio üretir (API + veri katmanı ortak).
 * - clip: bilinen parça/klip id'si veya SILENT_CLIP.
 * - recording: data:audio... base64 URL.
 * - file: yalnızca bu projenin Supabase Storage bucket'ından gelen public URL;
 *   startTime/endTime ikisi birden varsa sayısal, 0 ≤ start < end ≤ azami süre.
 * Geçersiz girdi undefined döner (kayıt düşer).
 */
export function parseGreetingAudio(raw: unknown): GreetingAudio | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const { type, value, startTime, endTime } = raw as {
    type?: unknown;
    value?: unknown;
    startTime?: unknown;
    endTime?: unknown;
  };

  if (type === "clip") {
    if (typeof value !== "string") return undefined;
    const known =
      getMusicTrack(value) !== undefined ||
      getClip(value) !== undefined ||
      value === SILENT_CLIP;
    return known ? { type: "clip", value } : undefined;
  }

  if (type === "recording") {
    return typeof value === "string" && value.startsWith("data:audio")
      ? { type: "recording", value }
      : undefined;
  }

  if (type === "file") {
    if (typeof value !== "string" || !isStorageAudioUrl(value)) return undefined;
    if (startTime === undefined && endTime === undefined) {
      return { type: "file", value };
    }
    if (typeof startTime !== "number" || typeof endTime !== "number") {
      return undefined;
    }
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      return undefined;
    }
    if (
      startTime < 0 ||
      endTime <= startTime ||
      endTime > MAX_AUDIO_DURATION
    ) {
      return undefined;
    }
    return {
      type: "file",
      value,
      startTime: Math.round(startTime * 10) / 10,
      endTime: Math.round(endTime * 10) / 10,
    };
  }

  return undefined;
}
