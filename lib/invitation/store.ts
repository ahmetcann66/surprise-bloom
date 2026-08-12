import { customAlphabet } from "nanoid";
import type {
  CreateInvitationInput,
  Invitation,
  InvitationDetails,
  InvitationLayoutPos,
  InvitationOptions,
} from "@/lib/invitation/types";
import { getTheme } from "@/lib/invitation/themes";
import { isEventType } from "@/lib/invitation/types";
import type { EffectRepeat, GreetingAudio } from "@/lib/types";
import { parseGreetingAudio } from "@/lib/music";
import { supabase } from "@/lib/supabase";

// Davetiye veri katmanı — tebrik store'uyla aynı çift modlu desen
// (Supabase varsa PostgreSQL, yoksa bellek içi fallback).

// Özelleştirmeler (palet, animasyon, zarf animasyonu) DB şemasına
// dokunmadan `theme` sütununa JSON olarak kodlanır. Eski satırlar düz tema
// id'si olarak okunur ve varsayılan ayarlarla döner — migration gerekmez.

function readPos(value: unknown): InvitationLayoutPos | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const o = value as Record<string, unknown>;
  const result: InvitationLayoutPos = {};
  if (typeof o.x === "number") result.x = o.x;
  if (typeof o.y === "number") result.y = o.y;
  if (typeof o.scale === "number") result.scale = o.scale;
  if (typeof o.speed === "number") result.speed = o.speed;
  if (
    typeof o.repeat === "string" &&
    (o.repeat === "once" || o.repeat === "loop" || o.repeat === "every")
  ) {
    result.repeat = o.repeat as EffectRepeat;
  }
  if (typeof o.repeatEvery === "number") result.repeatEvery = o.repeatEvery;
  return Object.keys(result).length > 0 ? result : undefined;
}

function readPlacements(
  value: unknown,
): Record<string, InvitationLayoutPos> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const result: Record<string, InvitationLayoutPos> = {};
  for (const [key, p] of Object.entries(value as Record<string, unknown>)) {
    const pos = readPos(p);
    if (pos) result[key] = pos;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function serializeTheme(
  themeId: string,
  options?: InvitationOptions,
): string {
  if (!options) return themeId;
  const cleaned: InvitationOptions = {};
  if (options.paletteId) cleaned.paletteId = options.paletteId;
  if (options.animations && options.animations.length > 0) {
    cleaned.animations = [...options.animations];
  } else if (options.animation) {
    cleaned.animation = options.animation;
  }
  if (typeof options.envelopeAnimation === "boolean") {
    cleaned.envelopeAnimation = options.envelopeAnimation;
  }
  if (options.textFont) cleaned.textFont = options.textFont;
  if (typeof options.textSize === "number") cleaned.textSize = options.textSize;
  if (typeof options.animationSpeed === "number") {
    cleaned.animationSpeed = options.animationSpeed;
  }
  if (typeof options.animationScale === "number") {
    cleaned.animationScale = options.animationScale;
  }
  if (options.textPos && Object.keys(options.textPos).length > 0) {
    cleaned.textPos = { ...options.textPos };
  }
  if (options.photoPos && Object.keys(options.photoPos).length > 0) {
    cleaned.photoPos = { ...options.photoPos };
  }
  if (
    options.animationPlacements &&
    Object.keys(options.animationPlacements).length > 0
  ) {
    cleaned.animationPlacements = Object.fromEntries(
      Object.entries(options.animationPlacements).filter(
        ([, p]) => p && Object.keys(p).length > 0,
      ),
    );
  }
  if (Object.keys(cleaned).length === 0) return themeId;
  return JSON.stringify({ v: 1, id: themeId, ...cleaned });
}

function deserializeTheme(raw: string): {
  themeId: string;
  options?: InvitationOptions;
} {
  if (!raw.startsWith("{")) return { themeId: raw };
  try {
    const parsed = JSON.parse(raw) as {
      id?: unknown;
      paletteId?: unknown;
      animation?: unknown;
      animations?: unknown;
      envelopeAnimation?: unknown;
      textFont?: unknown;
      textSize?: unknown;
      animationSpeed?: unknown;
      animationScale?: unknown;
      textPos?: unknown;
      photoPos?: unknown;
      animationPlacements?: unknown;
    };
    if (typeof parsed.id !== "string" || !getTheme(parsed.id)) {
      return { themeId: raw };
    }
    const options: InvitationOptions = {};
    if (typeof parsed.paletteId === "string") {
      options.paletteId = parsed.paletteId;
    }
    if (Array.isArray(parsed.animations)) {
      const ids = parsed.animations.filter(
        (a): a is string => typeof a === "string",
      );
      if (ids.length > 0) options.animations = ids;
    } else if (typeof parsed.animation === "string") {
      options.animation = parsed.animation;
    }
    if (typeof parsed.envelopeAnimation === "boolean") {
      options.envelopeAnimation = parsed.envelopeAnimation;
    }
    if (typeof parsed.textFont === "string") {
      options.textFont = parsed.textFont;
    }
    if (typeof parsed.textSize === "number") {
      options.textSize = parsed.textSize;
    }
    if (typeof parsed.animationSpeed === "number") {
      options.animationSpeed = parsed.animationSpeed;
    }
    if (typeof parsed.animationScale === "number") {
      options.animationScale = parsed.animationScale;
    }
    const pos = readPos(parsed.textPos);
    if (pos) options.textPos = pos;
    const photoPos = readPos(parsed.photoPos);
    if (photoPos) options.photoPos = photoPos;
    const placements = readPlacements(parsed.animationPlacements);
    if (placements) options.animationPlacements = placements;
    return { themeId: parsed.id, options };
  } catch {
    return { themeId: raw };
  }
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const nanoid = customAlphabet(ALPHABET, 6);

const globalThisWithStore = globalThis as typeof globalThis & {
  __invitationStore?: Map<string, Invitation>;
};

const fallbackStore =
  globalThisWithStore.__invitationStore ??
  (globalThisWithStore.__invitationStore = new Map<string, Invitation>());

const TABLE = "invitations";

interface InvitationRow {
  id: string;
  theme: string;
  name: string | null;
  event_type: string;
  partner_a: string;
  partner_b: string | null;
  event_date: string;
  time: string | null;
  venue: string;
  city: string | null;
  address: string | null;
  message: string | null;
  audio: unknown;
  photo: string | null;
  created_at: string;
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
  return parseGreetingAudio(parsed);
}

function rowToInvitation(row: InvitationRow): Invitation | undefined {
  if (!isEventType(row.event_type)) return undefined;
  const details: InvitationDetails = {
    eventType: row.event_type,
    partnerA: row.partner_a,
    ...(row.partner_b ? { partnerB: row.partner_b } : {}),
    date: row.event_date,
    ...(row.time ? { time: row.time } : {}),
    venue: row.venue,
    ...(row.city ? { city: row.city } : {}),
    ...(row.address ? { address: row.address } : {}),
    ...(row.message ? { message: row.message } : {}),
  };
  const theme = deserializeTheme(row.theme);
  return {
    id: row.id,
    themeId: theme.themeId,
    name: row.name,
    details,
    ...(parseAudio(row.audio) ? { audio: parseAudio(row.audio) } : {}),
    ...(row.photo ? { photo: row.photo } : {}),
    ...(theme.options ? { options: theme.options } : {}),
    createdAt: row.created_at,
  };
}

export async function createInvitation(
  input: CreateInvitationInput,
): Promise<Invitation> {
  if (!getTheme(input.themeId)) {
    throw new Error("Geçersiz davetiye teması seçildi.");
  }

  const row = {
    id: nanoid(),
    theme: serializeTheme(input.themeId, input.options),
    name: input.name?.trim().slice(0, 80) || null,
    event_type: input.details.eventType,
    partner_a: input.details.partnerA.trim().slice(0, 80),
    partner_b: input.details.partnerB?.trim().slice(0, 80) || null,
    event_date: input.details.date,
    time: input.details.time || null,
    venue: input.details.venue.trim().slice(0, 160),
    city: input.details.city?.trim().slice(0, 80) || null,
    address: input.details.address?.trim().slice(0, 240) || null,
    message: input.details.message?.trim().slice(0, 2000) || null,
    audio: input.audio ? JSON.stringify(input.audio) : null,
    photo: input.photo?.slice(0, 1_000_000) || null,
  };

  if (supabase) {
    for (let attempt = 0; attempt < 3; attempt++) {
      row.id = nanoid();
      const { data, error } = await supabase
        .from(TABLE)
        .insert(row)
        .select()
        .single();
      if (!error) {
        const parsed = rowToInvitation(data as InvitationRow);
        if (parsed) return parsed;
        throw new Error("Davetiye verileri okunamadı.");
      }
      if (error.code === "23505") continue;
      throw new Error(`Davetiye veritabanına kaydedilemedi. (${error.message})`);
    }
    throw new Error(
      "Davetiye veritabanına kaydedilemedi. (tekrar deneme limitine ulaşıldı)",
    );
  }

  do {
    row.id = nanoid();
  } while (fallbackStore.has(row.id));

  const invitation: Invitation = {
    id: row.id,
    themeId: input.themeId,
    name: row.name,
    details: {
      eventType: input.details.eventType,
      partnerA: input.details.partnerA.trim(),
      ...(input.details.partnerB ? { partnerB: input.details.partnerB.trim() } : {}),
      date: input.details.date,
      ...(input.details.time ? { time: input.details.time } : {}),
      venue: input.details.venue.trim(),
      ...(input.details.city ? { city: input.details.city.trim() } : {}),
      ...(input.details.address ? { address: input.details.address.trim() } : {}),
      ...(input.details.message ? { message: input.details.message.trim() } : {}),
    },
    ...(input.audio ? { audio: input.audio } : {}),
    ...(input.photo ? { photo: input.photo } : {}),
    ...(input.options ? { options: input.options } : {}),
    createdAt: new Date().toISOString(),
  };
  fallbackStore.set(invitation.id, invitation);
  return invitation;
}

export async function getInvitationById(
  id: string,
): Promise<Invitation | undefined> {
  if (supabase) {
    const { data } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? rowToInvitation(data as InvitationRow) : undefined;
  }
  return fallbackStore.get(id);
}
