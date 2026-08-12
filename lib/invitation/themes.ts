import type { Theme } from "@/lib/types";
import type { EventType } from "@/lib/invitation/types";
import type { EffectId } from "@/lib/effects/types";

// Davetiye temaları: her olay tipine karşılık gelen tek tema (MVP).
// B-2'de aynı olay tipi için birden fazla tema çeşitlendirilebilir.

export interface CoupleColors {
  /** Gelin elbisesi / çocuk yeleği rengi. */
  dress: string;
  dressAccent: string;
  /** Gelin duvağı / kutlama detay rengi. */
  veil: string;
  /** Damat takımı / çocuk pelerini rengi. */
  suit: string;
  suitAccent: string;
  skin: string;
  hair: string;
}

export interface InvitationTheme extends Theme {
  eventType: EventType;
  emoji: string;
  envelope: {
    body: string;
    flap: string;
    pocket: string;
    seal: string;
    letter: string;
  };
  couple: CoupleColors;
}

export const INVITATION_THEMES: InvitationTheme[] = [
  {
    id: "dugun-altin",
    label: "Klasik Düğün",
    eventType: "dugun",
    emoji: "💍",
    background:
      "radial-gradient(1200px 900px at 50% -10%, #6b4a1f 0%, #2e1c0c 55%, #140b04 100%)",
    ogBackground: "linear-gradient(135deg, #6b4a1f 0%, #2e1c0c 60%, #140b04 100%)",
    accent: "#d4a94e",
    centerColor: "#c9972f",
    textColor: "#faf0d7",
    petalColors: ["#f7e8c3", "#d4a94e", "#fdf6e3", "#a87c2f", "#fff0cf", "#8a5a24"],
    envelope: {
      body: "#f2dfb6",
      flap: "#e6cb93",
      pocket: "#f6e8c6",
      seal: "#c9972f",
      letter: "#fffaf0",
    },
    couple: {
      dress: "#ffffff",
      dressAccent: "#f2e2c0",
      veil: "#fffaf0",
      suit: "#3a2c1c",
      suitAccent: "#6b4f2a",
      skin: "#f2c49b",
      hair: "#2e2420",
    },
  },
  {
    id: "nikah-bahce",
    label: "Bahçe Nikahı",
    eventType: "nikah",
    emoji: "🌿",
    background:
      "radial-gradient(1200px 900px at 50% -10%, #35563a 0%, #1d3022 55%, #0d1a10 100%)",
    ogBackground: "linear-gradient(135deg, #35563a 0%, #1d3022 60%, #0d1a10 100%)",
    accent: "#a3d39a",
    centerColor: "#7fae7f",
    textColor: "#eef6ea",
    petalColors: ["#cde8c4", "#7fae7f", "#f2f6e6", "#4e7a54", "#e3f0dc", "#9cc3a0"],
    envelope: {
      body: "#e4efd9",
      flap: "#cfdfc2",
      pocket: "#ecf3e2",
      seal: "#6f9a70",
      letter: "#fdfbf2",
    },
    couple: {
      dress: "#fdfbf4",
      dressAccent: "#e4ead2",
      veil: "#f4f6e8",
      suit: "#31403a",
      suitAccent: "#54706a",
      skin: "#f2c49b",
      hair: "#2e2420",
    },
  },
  {
    id: "sunnet-mavi",
    label: "Sünnet Daveti",
    eventType: "sunnet",
    emoji: "👑",
    background:
      "radial-gradient(1200px 900px at 50% -10%, #1f4e8c 0%, #0d2a52 55%, #051025 100%)",
    ogBackground: "linear-gradient(135deg, #1f4e8c 0%, #0d2a52 60%, #051025 100%)",
    accent: "#f5c518",
    centerColor: "#e0ae12",
    textColor: "#eef5ff",
    petalColors: ["#f5c518", "#a5c8f0", "#ffe28a", "#5a87c9", "#fdf6df", "#7aa7e0"],
    envelope: {
      body: "#d7e6f7",
      flap: "#bcd4ee",
      pocket: "#e2edf9",
      seal: "#2f5dab",
      letter: "#f4f8ff",
    },
    couple: {
      dress: "#22529e",
      dressAccent: "#3d6fbf",
      veil: "#fdf6df",
      suit: "#c9a227",
      suitAccent: "#e0bc3f",
      skin: "#f2c49b",
      hair: "#2e2420",
    },
  },
  {
    id: "kutlama-canli",
    label: "Neşeli Kutlama",
    eventType: "kutlama",
    emoji: "🎊",
    background:
      "radial-gradient(1200px 900px at 50% -10%, #7a2a4e 0%, #3a1233 55%, #150817 100%)",
    ogBackground: "linear-gradient(135deg, #7a2a4e 0%, #3a1233 60%, #150817 100%)",
    accent: "#f9a8d4",
    centerColor: "#f472b6",
    textColor: "#fdf0f7",
    petalColors: ["#f9a8d4", "#f472b6", "#a78bfa", "#fde047", "#67e8f9", "#fb923c"],
    envelope: {
      body: "#f7d9e8",
      flap: "#efc3d8",
      pocket: "#fbe5ee",
      seal: "#e05a9e",
      letter: "#fff6fb",
    },
    couple: {
      dress: "#fdf4f8",
      dressAccent: "#f7d3e0",
      veil: "#fdf0f7",
      suit: "#4b3fae",
      suitAccent: "#6f62c9",
      skin: "#f2c49b",
      hair: "#2e2420",
    },
  },
];

export function getTheme(themeId: string): InvitationTheme | undefined {
  return INVITATION_THEMES.find((t) => t.id === themeId);
}

/** Olay tipi → tema (MVP: bire bir eşleşme). */
export function getThemeForEvent(eventType: EventType): InvitationTheme {
  return (
    INVITATION_THEMES.find((t) => t.eventType === eventType) ??
    INVITATION_THEMES[0]
  );
}

// ---- Renk paletleri -------------------------------------------------------
// Her etkinlik tipinin kendi teması (arka plan figürleri) + seçilebilir
// renk paletleri (zarf, vurgu ve çift renklerini değiştirir).

export interface InvitationPalette {
  id: string;
  label: string;
  eventType: EventType;
  accent: string;
  centerColor: string;
  envelope: InvitationTheme["envelope"];
  couple?: Partial<CoupleColors>;
}

export const INVITATION_PALETTES: InvitationPalette[] = [
  {
    id: "gul-gumus",
    label: "Gül & Gümüş",
    eventType: "dugun",
    accent: "#f0b7c8",
    centerColor: "#e08ba6",
    envelope: {
      body: "#f8e3ea",
      flap: "#f0c8d8",
      pocket: "#fbeef2",
      seal: "#d4697f",
      letter: "#fffafb",
    },
    couple: { veil: "#fdf0f5", dressAccent: "#f7dbe3" },
  },
  {
    id: "lila-tozu",
    label: "Lila Tozu",
    eventType: "dugun",
    accent: "#c4a6e0",
    centerColor: "#9d6fd0",
    envelope: {
      body: "#f0e6fa",
      flap: "#ddc8f2",
      pocket: "#f7eefd",
      seal: "#7e4fae",
      letter: "#fdf9ff",
    },
    couple: { veil: "#f3ecfd", dressAccent: "#eadcf8" },
  },
  {
    id: "deniz-kumu",
    label: "Deniz & Kum",
    eventType: "nikah",
    accent: "#6fb7d9",
    centerColor: "#4a93b8",
    envelope: {
      body: "#d9ecf4",
      flap: "#bfe0ee",
      pocket: "#e8f4fa",
      seal: "#2f79a3",
      letter: "#f6fcff",
    },
    couple: { dressAccent: "#e3eef2", suit: "#234e5e", suitAccent: "#3f6d7d" },
  },
  {
    id: "lavanta-bahce",
    label: "Lavanta",
    eventType: "nikah",
    accent: "#b5a4e8",
    centerColor: "#8d74d4",
    envelope: {
      body: "#e9e2fa",
      flap: "#d8cbf6",
      pocket: "#f2ecfd",
      seal: "#6a4fb0",
      letter: "#fbf8ff",
    },
    couple: { dressAccent: "#ece5f7", suit: "#3a3a63", suitAccent: "#5a5a8c" },
  },
  {
    id: "kraliyet-altini",
    label: "Kraliyet Altını",
    eventType: "sunnet",
    accent: "#f0c35a",
    centerColor: "#e0ac2f",
    envelope: {
      body: "#f3e2ae",
      flap: "#e8cf8b",
      pocket: "#f8ecc2",
      seal: "#b8860b",
      letter: "#fffbe8",
    },
    couple: { dressAccent: "#3d6fbf", veil: "#fff3cf" },
  },
  {
    id: "gokyuzu",
    label: "Gökyüzü",
    eventType: "sunnet",
    accent: "#a8d4f0",
    centerColor: "#5aa8dd",
    envelope: {
      body: "#e0f0fb",
      flap: "#c6e2f5",
      pocket: "#ecf6fd",
      seal: "#3b82b8",
      letter: "#f6fbfe",
    },
    couple: { dressAccent: "#2a67b0", veil: "#e6f4ff" },
  },
  {
    id: "seker-neon",
    label: "Şeker & Neon",
    eventType: "kutlama",
    accent: "#8ee6ff",
    centerColor: "#4cc9f0",
    envelope: {
      body: "#ffe3f0",
      flap: "#ffd0e8",
      pocket: "#fff0f7",
      seal: "#f04f9a",
      letter: "#fff9fb",
    },
    couple: { dressAccent: "#ffd9ea", suit: "#4b3fae", suitAccent: "#6f62c9" },
  },
  {
    id: "gumus-gece",
    label: "Gümüş Gece",
    eventType: "kutlama",
    accent: "#e5e7eb",
    centerColor: "#c3c8d0",
    envelope: {
      body: "#eef0f4",
      flap: "#d9dde4",
      pocket: "#f5f7fa",
      seal: "#8a93a5",
      letter: "#fbfcfe",
    },
    couple: { dressAccent: "#f0f1f5", suit: "#2b2f3a", suitAccent: "#4a5060" },
  },
];

/** Bir olay tipi için seçilebilir paletler (varsayılan tema paleti dahil). */
export function invitationPalettes(eventType: EventType): InvitationPalette[] {
  const base = getThemeForEvent(eventType);
  return [
    {
      id: base.id,
      label: base.label,
      eventType,
      accent: base.accent,
      centerColor: base.centerColor,
      envelope: base.envelope,
    },
    ...INVITATION_PALETTES.filter((p) => p.eventType === eventType),
  ];
}

/** Paleti (envelope + accent + couple) temanın üzerine uygular. */
export function applyPalette(
  theme: InvitationTheme,
  paletteId?: string,
): InvitationTheme {
  const palette = INVITATION_PALETTES.find((p) => p.id === paletteId);
  if (!palette) return theme;
  return {
    ...theme,
    accent: palette.accent,
    centerColor: palette.centerColor,
    envelope: palette.envelope,
    couple: palette.couple
      ? { ...theme.couple, ...palette.couple }
      : theme.couple,
  };
}

// ---- Açılış / gösterim animasyonları ---------------------------------------
// Kullanıcı davetiye sayfasındaki animasyon tarzını seçebilir.

export const INVITATION_ANIMATION_IDS = [
  "cicekler",
  "kalpler",
  "parilti",
  "konfeti",
  "kuslar",
  "kelebek",
  "gul-yagmuru",
  "yuzukler",
  "opucuk",
  "parti",
  "hediyeler",
  "mumlar",
  "gelin-damat",
  "arabalar",
  "motosikletler",
  "ayiciklar",
] as const;

export type InvitationAnimationId = (typeof INVITATION_ANIMATION_IDS)[number];

export type InvitationAnimationCategory =
  | "cicekler"
  | "romantik"
  | "kutlama"
  | "zarif"
  | "araclar"
  | "diger";

export const INVITATION_ANIMATION_CATEGORIES: {
  id: InvitationAnimationCategory;
  label: string;
  emoji: string;
}[] = [
  { id: "cicekler", label: "Çiçekler", emoji: "🌸" },
  { id: "romantik", label: "Romantik", emoji: "💖" },
  { id: "kutlama", label: "Kutlama", emoji: "🎉" },
  { id: "zarif", label: "Zarif", emoji: "✨" },
  { id: "araclar", label: "Araçlar", emoji: "🚗" },
  { id: "diger", label: "Diğer", emoji: "🧸" },
];

export interface InvitationAnimation {
  id: InvitationAnimationId;
  label: string;
  emoji: string;
  description: string;
  /** Seçici gruplaması için kategori. */
  category: InvitationAnimationCategory;
  /** Sayfa boyunca dönen ortam efekti. */
  ambient: EffectId;
  /** Çiftler belirdiğinde patlayan efekt. */
  burst: EffectId;
  /** Yan çiçekler (rose + şakayık) gösterilsin mi. */
  flowers: boolean;
}

export const INVITATION_ANIMATIONS: InvitationAnimation[] = [
  {
    id: "cicekler",
    label: "Çiçekler",
    emoji: "🌸",
    description: "Altın ışıltı ve yan çiçekler",
    category: "cicekler",
    ambient: "goldsparkle",
    burst: "heartburst",
    flowers: true,
  },
  {
    id: "kelebek",
    label: "Kelebekler",
    emoji: "🦋",
    description: "Süzülen kelebekler",
    category: "cicekler",
    ambient: "butterfly",
    burst: "stardust",
    flowers: false,
  },
  {
    id: "gul-yagmuru",
    label: "Gül Yağmuru",
    emoji: "🌹",
    description: "Süzülen gül yaprakları",
    category: "cicekler",
    ambient: "petalrain",
    burst: "stardust",
    flowers: false,
  },
  {
    id: "kalpler",
    label: "Kalpler",
    emoji: "💖",
    description: "Uçuşan kalp bulutu",
    category: "romantik",
    ambient: "heartburst",
    burst: "heartburst",
    flowers: false,
  },
  {
    id: "yuzukler",
    label: "Nişan Yüzükleri",
    emoji: "💍",
    description: "Uçuşan yüzükler",
    category: "romantik",
    ambient: "rings",
    burst: "heartburst",
    flowers: false,
  },
  {
    id: "opucuk",
    label: "Aşk Öpücükleri",
    emoji: "💋",
    description: "Uçuşan öpücükler",
    category: "romantik",
    ambient: "kisses",
    burst: "heartburst",
    flowers: false,
  },
  {
    id: "gelin-damat",
    label: "Gelin & Damat",
    emoji: "👰🤵",
    description: "Düğün havası — gelin ve damat uçuşuyor",
    category: "romantik",
    ambient: "bridal",
    burst: "rings",
    flowers: false,
  },
  {
    id: "konfeti",
    label: "Konfeti",
    emoji: "🎉",
    description: "Neşeli konfeti patlaması",
    category: "kutlama",
    ambient: "sparkledust",
    burst: "confetti",
    flowers: false,
  },
  {
    id: "parti",
    label: "Parti",
    emoji: "🥳",
    description: "Eğlenceli parti suratları",
    category: "kutlama",
    ambient: "partyfaces",
    burst: "confetti",
    flowers: false,
  },
  {
    id: "hediyeler",
    label: "Hediyeler",
    emoji: "🎁",
    description: "Uçuşan hediyeler",
    category: "kutlama",
    ambient: "gifts",
    burst: "confetti",
    flowers: false,
  },
  {
    id: "parilti",
    label: "Işıltı",
    emoji: "✨",
    description: "Zarif yıldız parıltısı",
    category: "zarif",
    ambient: "goldsparkle",
    burst: "stardust",
    flowers: false,
  },
  {
    id: "kuslar",
    label: "Kuşlar",
    emoji: "🕊️",
    description: "Uçan kağıt kuşlar",
    category: "zarif",
    ambient: "goldsparkle",
    burst: "paperbirds",
    flowers: false,
  },
  {
    id: "mumlar",
    label: "Mum Işığı",
    emoji: "🕯️",
    description: "Sakin mum parıltısı",
    category: "zarif",
    ambient: "candle",
    burst: "goldsparkle",
    flowers: false,
  },
  {
    id: "arabalar",
    label: "Araba Konvoyu",
    emoji: "🚗",
    description: "Yolda araba konvoyu",
    category: "araclar",
    ambient: "cars",
    burst: "confetti",
    flowers: false,
  },
  {
    id: "motosikletler",
    label: "Motosikletler",
    emoji: "🏍️",
    description: "Motosiklet konvoyu",
    category: "araclar",
    ambient: "motorcycles",
    burst: "confetti",
    flowers: false,
  },
  {
    id: "ayiciklar",
    label: "Oyuncak Ayılar",
    emoji: "🧸",
    description: "Sevimli oyuncak ayılar",
    category: "diger",
    ambient: "teddy",
    burst: "stardust",
    flowers: false,
  },
];

export function getInvitationAnimation(
  id: string,
): InvitationAnimation | undefined {
  return INVITATION_ANIMATIONS.find((a) => a.id === id);
}

export function isInvitationAnimation(
  value: unknown,
): value is InvitationAnimationId {
  return (
    typeof value === "string" &&
    (INVITATION_ANIMATION_IDS as readonly string[]).includes(value)
  );
}

/** En fazla seçilebilen açılış animasyonu sayısı. */
export const MAX_INVITATION_ANIMATIONS = 4;

/**
 * Seçilen animasyonları çözümler: geçerli olanları alır, tekilleştirir,
 * fazlalıkları sınırlar. `animations` yoksa eski tekli `animation` kullanılır.
 */
export function resolveInvitationAnimations(
  animations?: string[],
  legacyAnimation?: string,
): InvitationAnimationId[] {
  const raw = Array.isArray(animations) && animations.length > 0
    ? animations
    : legacyAnimation
      ? [legacyAnimation]
      : ["cicekler"];
  const valid = raw.filter((a): a is InvitationAnimationId =>
    isInvitationAnimation(a),
  );
  return [...new Set(valid)].slice(0, MAX_INVITATION_ANIMATIONS);
}
