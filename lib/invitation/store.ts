import { customAlphabet } from "nanoid";
import type {
  CreateInvitationInput,
  Invitation,
  InvitationDetails,
} from "@/lib/invitation/types";
import { getTheme } from "@/lib/invitation/themes";
import { isEventType } from "@/lib/invitation/types";
import type { GreetingAudio } from "@/lib/types";
import { supabase } from "@/lib/supabase";

// Davetiye veri katmanı — tebrik store'uyla aynı çift modlu desen
// (Supabase varsa PostgreSQL, yoksa bellek içi fallback).

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
  if (parsed && typeof parsed === "object" && "type" in parsed && "value" in parsed) {
    const t = (parsed as { type: unknown }).type;
    const v = (parsed as { value: unknown }).value;
    if ((t === "clip" || t === "recording") && typeof v === "string") {
      return { type: t, value: v };
    }
  }
  return undefined;
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
  return {
    id: row.id,
    themeId: row.theme,
    name: row.name,
    details,
    ...(parseAudio(row.audio) ? { audio: parseAudio(row.audio) } : {}),
    ...(row.photo ? { photo: row.photo } : {}),
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
    theme: input.themeId,
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
