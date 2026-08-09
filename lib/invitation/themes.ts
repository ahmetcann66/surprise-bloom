import type { Theme } from "@/lib/types";
import type { EventType } from "@/lib/invitation/types";

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
