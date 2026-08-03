import { customAlphabet } from "nanoid";
import type {
  CreateGreetingInput,
  EffectPlacement,
  Greeting,
  GreetingAudio,
  Position,
} from "@/lib/types";
import { getPalette, getTemplate } from "@/lib/templates";
import { hasEffect } from "@/lib/effects/presets";
import { supabase } from "@/lib/supabase";

// Veri katmanı.
// - NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlıysa Supabase kullanılır.
// - Tanımlı değilse geliştirme/test için bellekte çalışan fallback devreye girer
//   (sunucu yeniden başlayınca veriler sıfırlanır).

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const nanoid = customAlphabet(ALPHABET, 6);

// Next.js route'ları ayrı bundle'larda derlenebildiği için, tek bir Map örneğini
// süreç boyunca globalThis üzerinde paylaşıyoruz.
const globalThisWithStore = globalThis as typeof globalThis & {
  __greetingStore?: Map<string, Greeting>;
};

const fallbackStore =
  globalThisWithStore.__greetingStore ??
  (globalThisWithStore.__greetingStore = new Map<string, Greeting>());

const TABLE = "greetings";

interface GreetingRow {
  id: string;
  template: string;
  palette: string | null;
  name: string | null;
  message: string | null;
  audio: unknown;
  photo: string | null;
  video: string | null;
  position: string | null;
  effect: string | null;
  effects: unknown;
  photo_pos: unknown;
  text_pos: unknown;
  effect_scale: unknown;
  video_scale: unknown;
  animation_speed: unknown;
  text_font: string | null;
  created_at: string;
}

function parsePosition(value: unknown): Position | undefined {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    typeof (parsed as Position).x === "number" &&
    typeof (parsed as Position).y === "number"
  ) {
    const x = Math.min(95, Math.max(5, (parsed as Position).x));
    const y = Math.min(95, Math.max(5, (parsed as Position).y));
    const scale = (parsed as Position).scale;
    const fontSize = (parsed as Position).fontSize;
    return {
      x,
      y,
      ...(typeof scale === "number" && Number.isFinite(scale)
        ? { scale: Math.min(3, Math.max(0.4, scale)) }
        : {}),
      ...(typeof fontSize === "number" && Number.isFinite(fontSize)
        ? { fontSize: Math.min(2, Math.max(0.5, fontSize)) }
        : {}),
    };
  }
  return undefined;
}

function parseEffects(value: unknown): EffectPlacement[] | undefined {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(parsed)) return undefined;
  const placements: EffectPlacement[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const { id, x, y, scale, speed, repeat, repeatEvery } = item as {
      id?: unknown;
      x?: unknown;
      y?: unknown;
      scale?: unknown;
      speed?: unknown;
      repeat?: unknown;
      repeatEvery?: unknown;
    };
    if (typeof id !== "string" || !hasEffect(id)) continue;
    const parsedRepeat =
      repeat === "once" || repeat === "loop" || repeat === "every"
        ? repeat
        : undefined;
    placements.push({
      id,
      ...(typeof x === "number" && Number.isFinite(x)
        ? { x: Math.min(95, Math.max(5, x)) }
        : {}),
      ...(typeof y === "number" && Number.isFinite(y)
        ? { y: Math.min(95, Math.max(5, y)) }
        : {}),
      ...(typeof scale === "number" && Number.isFinite(scale)
        ? { scale: Math.min(3, Math.max(0.4, scale)) }
        : {}),
      ...(typeof speed === "number" && Number.isFinite(speed)
        ? { speed: Math.min(3, Math.max(0.4, speed)) }
        : {}),
      ...(parsedRepeat ? { repeat: parsedRepeat } : {}),
      ...(parsedRepeat === "every" &&
      typeof repeatEvery === "number" &&
      Number.isFinite(repeatEvery)
        ? { repeatEvery: Math.min(120, Math.max(3, repeatEvery)) }
        : {}),
    });
  }
  return placements.length > 0 ? placements : undefined;
}

function parseAudio(value: unknown): GreetingAudio | undefined {
  if (!value) return undefined;
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    "type" in parsed &&
    "value" in parsed
  ) {
    const t = (parsed as { type: unknown }).type;
    const v = (parsed as { value: unknown }).value;
    if ((t === "clip" || t === "recording") && typeof v === "string") {
      return { type: t, value: v };
    }
  }
  return undefined;
}

function rowToGreeting(row: GreetingRow): Greeting {
  return {
    id: row.id,
    template: row.template as Greeting["template"],
    paletteId: row.palette ?? "",
    name: row.name,
    message: row.message ?? undefined,
    audio: parseAudio(row.audio),
    photo: row.photo ?? undefined,
    video: row.video ?? undefined,
    position:
      row.position === "top" || row.position === "bottom"
        ? row.position
        : "center",
    effect: row.effect ?? undefined,
    effects: parseEffects(row.effects),
    photoPos: parsePosition(row.photo_pos),
    textPos: parsePosition(row.text_pos),
    effectScale:
      typeof row.effect_scale === "number" && Number.isFinite(row.effect_scale)
        ? Math.min(3, Math.max(0.4, row.effect_scale))
        : undefined,
    videoScale:
      typeof row.video_scale === "number" && Number.isFinite(row.video_scale)
        ? Math.min(3, Math.max(0.4, row.video_scale))
        : undefined,
    animationSpeed:
      typeof row.animation_speed === "number" &&
      Number.isFinite(row.animation_speed)
        ? Math.min(3, Math.max(0.4, row.animation_speed))
        : undefined,
    textFont: row.text_font ?? undefined,
    createdAt: row.created_at,
  };
}

export async function createMessage(
  input: CreateGreetingInput,
): Promise<Greeting> {
  const template = getTemplate(input.template);
  if (!template) {
    throw new Error("Geçersiz şablon seçildi.");
  }

  const palette = getPalette(template, input.paletteId);

  const row = {
    id: nanoid(),
    template: input.template,
    palette: palette.id,
    name: input.name?.trim().slice(0, 80) || null,
    message: input.message?.trim().slice(0, 280) || null,
    audio: input.audio ? JSON.stringify(input.audio) : null,
    photo: input.photo?.slice(0, 1_000_000) || null,
    video: input.video?.slice(0, 4_000_000) || null,
    position: input.position ?? "center",
    effect:
      input.effects && input.effects.length > 0
        ? input.effects[0].id
        : input.effect ?? null,
    effects: input.effects?.length
      ? JSON.stringify(
          input.effects.map((e) => ({
            id: e.id,
            x: e.x ?? 50,
            y: e.y ?? 50,
            scale: e.scale ?? 1,
            ...(typeof e.speed === "number" ? { speed: e.speed } : {}),
            ...(e.repeat ? { repeat: e.repeat } : {}),
            ...(e.repeat === "every"
              ? { repeatEvery: e.repeatEvery ?? 15 }
              : {}),
          })),
        )
      : null,
    photo_pos: input.photoPos ? JSON.stringify(input.photoPos) : null,
    text_pos: input.textPos ? JSON.stringify(input.textPos) : null,
    effect_scale:
      typeof input.effectScale === "number" ? input.effectScale : null,
    video_scale:
      typeof input.videoScale === "number" ? input.videoScale : null,
    // animation_speed + text_font kolonları schema.sql güncellemesiyle geliyor;
    // yokken insert'i bozmamak için yalnızca değer geldiğinde gönderiyoruz.
    ...(typeof input.animationSpeed === "number"
      ? { animation_speed: input.animationSpeed }
      : {}),
    ...(typeof input.textFont === "string" ? { text_font: input.textFont } : {}),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select()
      .single();
    if (error) {
      throw new Error(`Mesaj veritabanına kaydedilemedi. (${error.message})`);
    }
    return rowToGreeting(data as GreetingRow);
  }

  const greeting: Greeting = {
    id: row.id,
    template: input.template,
    paletteId: palette.id,
    name: row.name,
    message: row.message ?? undefined,
    audio: input.audio,
    photo: input.photo,
    video: input.video,
    position: row.position as "top" | "center" | "bottom",
    effect: input.effects?.length ? input.effects[0].id : input.effect,
    effects: input.effects,
    photoPos: input.photoPos,
    textPos: input.textPos,
    effectScale: input.effectScale,
    videoScale: input.videoScale,
    animationSpeed: input.animationSpeed,
    textFont: input.textFont,
    createdAt: new Date().toISOString(),
  };
  fallbackStore.set(greeting.id, greeting);
  return greeting;
}

export async function getMessageById(
  id: string,
): Promise<Greeting | undefined> {
  if (supabase) {
    const { data } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? rowToGreeting(data as GreetingRow) : undefined;
  }
  return fallbackStore.get(id);
}
