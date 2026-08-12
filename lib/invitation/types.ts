import type { EffectRepeat, GreetingAudio } from "@/lib/types";

// Davetiye ürün hattı (Faz B): düğün / nikah / sünnet / kutlama.
// Tebrik (greeting) modelinden bağımsız, kendi alanlarıyla saklanır.

export const EVENT_TYPES = ["dugun", "nikah", "sunnet", "kutlama"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  dugun: "Düğün",
  nikah: "Nikah",
  sunnet: "Sünnet",
  kutlama: "Kutlama",
};

export const EVENT_TYPE_EMOJIS: Record<EventType, string> = {
  dugun: "💍",
  nikah: "🌿",
  sunnet: "👑",
  kutlama: "🎊",
};

export function isEventType(value: unknown): value is EventType {
  return (
    typeof value === "string" &&
    (EVENT_TYPES as readonly string[]).includes(value)
  );
}

export interface InvitationDetails {
  eventType: EventType;
  /** Ana isim (gelin / damat / çocuk / kutlama sahibi). */
  partnerA: string;
  /** İkinci isim (nikah/düğün; tek kişilik etkinliklerde yok). */
  partnerB?: string;
  /** ISO tarihi (YYYY-MM-DD). */
  date: string;
  /** HH:MM */
  time?: string;
  venue: string;
  city?: string;
  address?: string;
  message?: string;
}

/** Davetiyedeki bir öğenin (yazı / fotoğraf / animasyon) konumu ve boyutu. */
export interface InvitationLayoutPos {
  /** Ekran yüzdesi, 0-100 (varsayılan 50). */
  x?: number;
  /** Ekran yüzdesi, 0-100. */
  y?: number;
  /** Boyut çarpanı (varsayılan 1). */
  scale?: number;
  /** Sadece animasyon yerleşimlerinde: hız çarpanı (varsayılan 1). */
  speed?: number;
  /** Sadece animasyon yerleşimlerinde: tekrar modu (undefined = davetiye varsayılanı "loop"). */
  repeat?: EffectRepeat;
  /** repeat === "every" iken tekrar aralığı (sn, varsayılan 15). */
  repeatEvery?: number;
}

/** Kullanıcı tarafından seçilen davetiye özelleştirmeleri. */
export interface InvitationOptions {
  /** Tema içinden seçilen renk paleti id'si (varsayılan: tema id'si). */
  paletteId?: string;
  /** Eski (tekli) açılış animasyonu id'si — `animations` yokken kullanılır. */
  animation?: string;
  /** Seçilen açılış animasyonları (birden fazla; en fazla 4). */
  animations?: string[];
  /** Zarf açılış animasyonu kapalıysa false (varsayılan: true). */
  envelopeAnimation?: boolean;
  /** Monogram/davetiye yazısı font id'si (varsayılan: "zarif"). */
  textFont?: string;
  /** Davetiye yazısı boyut çarpanı (varsayılan: 1). */
  textSize?: number;
  /** Açılış animasyonu hız çarpanı (varsayılan: 1). */
  animationSpeed?: number;
  /** Açılış animasyonu boyut çarpanı (varsayılan: 1). */
  animationScale?: number;
  /** Davetiye bilgileri bloğunun konumu (yüzde). */
  textPos?: InvitationLayoutPos;
  /** Fotoğrafın konumu ve boyutu (yüzde). */
  photoPos?: InvitationLayoutPos;
  /** Animasyon başına konum/boyut; anahtar animasyon id'si. */
  animationPlacements?: Record<string, InvitationLayoutPos>;
}

export interface Invitation {
  id: string;
  themeId: string;
  /** Alıcı ismi ("Sevgili Ayşe"). */
  name: string | null;
  details: InvitationDetails;
  audio?: GreetingAudio;
  photo?: string;
  options?: InvitationOptions;
  createdAt: string;
}

export interface CreateInvitationInput {
  themeId: string;
  name?: string;
  details: InvitationDetails;
  audio?: GreetingAudio;
  photo?: string;
  options?: InvitationOptions;
}

const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

/** "2026-08-15" → "15 Ağustos 2026". Geçersiz tarihte girdiyi olduğu gibi döner. */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, y, m, d] = match;
  const month = Number(m);
  if (month < 1 || month > 12) return iso;
  return `${Number(d)} ${MONTHS_TR[month - 1]} ${y}`;
}
