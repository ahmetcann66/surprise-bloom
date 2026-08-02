import { customAlphabet } from "nanoid";
import type {
  CreateGreetingInput,
  Greeting,
  GreetingAudio,
  Position,
} from "@/lib/types";
import { getPalette, getTemplate } from "@/lib/templates";
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
  photo_pos: unknown;
  text_pos: unknown;
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
    return { x, y };
  }
  return undefined;
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
    photoPos: parsePosition(row.photo_pos),
    textPos: parsePosition(row.text_pos),
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
    effect: input.effect ?? null,
    photo_pos: input.photoPos ? JSON.stringify(input.photoPos) : null,
    text_pos: input.textPos ? JSON.stringify(input.textPos) : null,
  };

  if (supabase) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select()
      .single();
    if (error) {
      throw new Error("Mesaj veritabanına kaydedilemedi.");
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
    effect: input.effect,
    photoPos: input.photoPos,
    textPos: input.textPos,
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
