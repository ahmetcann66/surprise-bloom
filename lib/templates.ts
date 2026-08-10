import type { Template, TemplateId, Theme } from "@/lib/types";

const FALLBACK_PALETTE: Theme = {
  id: "fallback",
  label: "Varsayılan",
  background:
    "radial-gradient(1200px 800px at 20% -10%, #8e2a5b 0%, #3d0f3e 45%, #1a0b2e 100%)",
  ogBackground: "linear-gradient(135deg, #8e2a5b 0%, #3d0f3e 45%, #1a0b2e 100%)",
  accent: "#ff7eb3",
  centerColor: "#ff4d6d",
  textColor: "#ffe9f0",
  petalColors: ["#ff7eb3", "#ff4d6d", "#ff9ebc", "#ff6b8b", "#ff8fb3", "#ff5c77"],
};

export const templates: Template[] = [
  {
    id: "valentine",
    label: "Sevgililer Günü",
    emoji: "💖",
    messages: [
      "Sevgililer Günün kutlu olsun!",
      "Seninle geçen her an bir hediye.",
      "İyi ki varsın, iyi ki benimlesin.",
    ],
    palettes: [
      {
        id: "pastel-pembe",
        label: "Pastel Pembe",
        background:
          "radial-gradient(1200px 800px at 20% -10%, #8e2a5b 0%, #3d0f3e 45%, #1a0b2e 100%)",
        ogBackground: "linear-gradient(135deg, #8e2a5b 0%, #3d0f3e 45%, #1a0b2e 100%)",
        accent: "#ff7eb3",
        centerColor: "#ff4d6d",
        textColor: "#ffe9f0",
        petalColors: ["#ff7eb3", "#ff4d6d", "#ff9ebc", "#ff6b8b", "#ff8fb3", "#ff5c77"],
      },
      {
        id: "kizil-ask",
        label: "Kızıl Aşk",
        background:
          "radial-gradient(1200px 800px at 20% -10%, #7f1d1d 0%, #450a0a 55%, #1c0a0a 100%)",
        ogBackground: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 50%, #2b0a0a 100%)",
        accent: "#fca5a5",
        centerColor: "#ef4444",
        textColor: "#fee2e2",
        petalColors: ["#ef4444", "#dc2626", "#f87171", "#b91c1c", "#fca5a5", "#991b1b"],
      },
      {
        id: "gece-pembesi",
        label: "Gece Pembesi",
        background:
          "radial-gradient(1200px 800px at 80% -10%, #701a5e 0%, #2d0b36 50%, #0d0416 100%)",
        ogBackground: "linear-gradient(135deg, #701a5e 0%, #2d0b36 50%, #0d0416 100%)",
        accent: "#e879f9",
        centerColor: "#c026d3",
        textColor: "#fae8ff",
        petalColors: ["#d946ef", "#c026d3", "#e879f9", "#a21caf", "#f0abfc", "#86198f"],
      },
      {
        id: "gul-altin",
        label: "Gül Altını",
        background:
          "radial-gradient(1200px 800px at 80% -10%, #6d2a33 0%, #35121c 55%, #17090f 100%)",
        ogBackground: "linear-gradient(135deg, #6d2a33 0%, #35121c 55%, #17090f 100%)",
        accent: "#f3c78b",
        centerColor: "#e8a94f",
        textColor: "#fdf3e3",
        petalColors: ["#f3c78b", "#e8a94f", "#f9d0a0", "#d99a56", "#f6e3c8", "#c47f3a"],
      },
      {
        id: "gundogumu",
        label: "Gün Doğumu",
        background:
          "radial-gradient(1200px 800px at 20% -10%, #b45309 0%, #7c2d12 50%, #2b1105 100%)",
        ogBackground: "linear-gradient(135deg, #b45309 0%, #7c2d12 50%, #2b1105 100%)",
        accent: "#ffb88c",
        centerColor: "#ff9a6b",
        textColor: "#fff1e6",
        petalColors: ["#ffb88c", "#ff9a6b", "#ffd1a9", "#f97316", "#ffe4d1", "#ea580c"],
      },
    ],
  },
  {
    id: "birthday",
    label: "Doğum Günü",
    emoji: "🎂",
    messages: [
      "Doğum günün kutlu olsun!",
      "Yeni yaşın sana mutluluklar getirsin.",
      "Nice güzel yıllara!",
    ],
    palettes: [
      {
        id: "mor-solen",
        label: "Mor Şölen",
        background:
          "radial-gradient(1200px 800px at 80% -10%, #3d1a7a 0%, #1a1a3e 45%, #0f1035 100%)",
        ogBackground: "linear-gradient(135deg, #3d1a7a 0%, #1a1a3e 45%, #0f1035 100%)",
        accent: "#ffd93d",
        centerColor: "#ffd93d",
        textColor: "#fff7e6",
        petalColors: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff9f43", "#c780fa"],
      },
      {
        id: "canli-turuncu",
        label: "Canlı Turuncu",
        background:
          "radial-gradient(1200px 800px at 20% -10%, #9a3412 0%, #431407 55%, #1c0d02 100%)",
        ogBackground: "linear-gradient(135deg, #ea580c 0%, #9a3412 50%, #431407 100%)",
        accent: "#fdba74",
        centerColor: "#fb923c",
        textColor: "#fff7ed",
        petalColors: ["#fb923c", "#f97316", "#fdba74", "#ea580c", "#fed7aa", "#c2410c"],
      },
      {
        id: "pastel-seker",
        label: "Pastel Şeker",
        background:
          "radial-gradient(1200px 800px at 50% -10%, #155e75 0%, #0c3a4a 50%, #082f36 100%)",
        ogBackground: "linear-gradient(135deg, #155e75 0%, #0c3a4a 50%, #082f36 100%)",
        accent: "#f472b6",
        centerColor: "#f9a8d4",
        textColor: "#f0fdfa",
        petalColors: ["#f472b6", "#fb7185", "#38bdf8", "#fde047", "#a3e635", "#c084fc"],
      },
      {
        id: "cicek-bahcesi",
        label: "Çiçek Bahçesi",
        background:
          "radial-gradient(1200px 800px at 50% -10%, #14532d 0%, #1a3a25 50%, #0a1f12 100%)",
        ogBackground: "linear-gradient(135deg, #166534 0%, #14532d 50%, #0a1f12 100%)",
        accent: "#86efac",
        centerColor: "#4ade80",
        textColor: "#f0fdf4",
        petalColors: ["#86efac", "#4ade80", "#fde047", "#f472b6", "#fb923c", "#a3e635"],
      },
      {
        id: "cikolata-luks",
        label: "Çikolata Lüks",
        background:
          "radial-gradient(1200px 800px at 50% -10%, #5c3a1e 0%, #3a2412 50%, #1c1108 100%)",
        ogBackground: "linear-gradient(135deg, #6d4524 0%, #4a2f16 50%, #1c1108 100%)",
        accent: "#e8b57f",
        centerColor: "#c98f4e",
        textColor: "#fdf6ec",
        petalColors: ["#e8b57f", "#c98f4e", "#f3d2a5", "#a06a35", "#8a5a2b", "#f9e3c4"],
      },
    ],
  },
  {
    id: "newyear",
    label: "Yılbaşı",
    emoji: "🎄",
    messages: [
      "Yeni yılın kutlu olsun!",
      "Yeni yılda sana sağlık ve mutluluk dilerim.",
      "Mutlu seneler!",
    ],
    palettes: [
      {
        id: "kar-gecesi",
        label: "Kar Gecesi",
        background:
          "radial-gradient(1200px 800px at 50% -10%, #1b4332 0%, #0b132b 55%, #050a1a 100%)",
        ogBackground: "linear-gradient(135deg, #1b4332 0%, #0b132b 55%, #050a1a 100%)",
        accent: "#e63946",
        centerColor: "#ffd166",
        textColor: "#eef7ef",
        petalColors: ["#e63946", "#ffd166", "#2a9d8f", "#a8dadc", "#e9c46a", "#f4a261"],
      },
      {
        id: "kirmizi-altin",
        label: "Kırmızı & Altın",
        background:
          "radial-gradient(1200px 800px at 50% -10%, #7f1d1d 0%, #3b0a0a 55%, #140404 100%)",
        ogBackground: "linear-gradient(135deg, #7f1d1d 0%, #450a0a 50%, #140404 100%)",
        accent: "#fbbf24",
        centerColor: "#f59e0b",
        textColor: "#fef9c3",
        petalColors: ["#fbbf24", "#ef4444", "#f59e0b", "#fde68a", "#b91c1c", "#fca5a5"],
      },
      {
        id: "buz-mavisi",
        label: "Buz Mavisi",
        background:
          "radial-gradient(1200px 800px at 50% -10%, #0c4a6e 0%, #082f49 55%, #061a2e 100%)",
        ogBackground: "linear-gradient(135deg, #0c4a6e 0%, #082f49 55%, #061a2e 100%)",
        accent: "#7dd3fc",
        centerColor: "#e0f2fe",
        textColor: "#e0f2fe",
        petalColors: ["#7dd3fc", "#38bdf8", "#a5f3fc", "#e0f2fe", "#0284c7", "#bae6fd"],
      },
      {
        id: "zengin-mor",
        label: "Zengin Mor",
        background:
          "radial-gradient(1200px 800px at 50% -10%, #4a1a8c 0%, #251148 55%, #120a28 100%)",
        ogBackground: "linear-gradient(135deg, #5b21b6 0%, #3b1369 55%, #120a28 100%)",
        accent: "#c084fc",
        centerColor: "#a855f7",
        textColor: "#f5f3ff",
        petalColors: ["#c084fc", "#a855f7", "#f0abfc", "#e9d5ff", "#8b5cf6", "#d8b4fe"],
      },
      {
        id: "karamel-ates",
        label: "Karamel Ateş",
        background:
          "radial-gradient(1200px 800px at 50% -10%, #7c2d12 0%, #431407 55%, #1c0d02 100%)",
        ogBackground: "linear-gradient(135deg, #b45309 0%, #7c2d12 55%, #1c0d02 100%)",
        accent: "#ffd166",
        centerColor: "#ff9f43",
        textColor: "#fff8e6",
        petalColors: ["#ffd166", "#ff9f43", "#fcd34d", "#f97316", "#ffe2a8", "#ea580c"],
      },
    ],
  },
  {
    id: "special",
    label: "Özel Gün",
    emoji: "✨",
    messages: [
      "Bu özel günün kutlu olsun!",
      "Senin için güzel bir sürprizim var.",
      "İyi ki varsın.",
    ],
    palettes: [
      {
        id: "mor-ihtisam",
        label: "Mor İhtişam",
        background:
          "radial-gradient(1200px 800px at 20% -10%, #4c1d95 0%, #2d1b69 50%, #1e1b4b 100%)",
        ogBackground: "linear-gradient(135deg, #4c1d95 0%, #2d1b69 50%, #1e1b4b 100%)",
        accent: "#f0abfc",
        centerColor: "#e879f9",
        textColor: "#f5f3ff",
        petalColors: ["#f0abfc", "#c084fc", "#a78bfa", "#818cf8", "#e9d5ff", "#d8b4fe"],
      },
      {
        id: "altin-isilti",
        label: "Altın Işıltı",
        background:
          "radial-gradient(1200px 800px at 20% -10%, #78350f 0%, #451a03 55%, #1a0a02 100%)",
        ogBackground: "linear-gradient(135deg, #92400e 0%, #78350f 50%, #451a03 100%)",
        accent: "#fcd34d",
        centerColor: "#fbbf24",
        textColor: "#fef3c7",
        petalColors: ["#fcd34d", "#fbbf24", "#f59e0b", "#fde68a", "#d97706", "#fef9c3"],
      },
      {
        id: "gul-kurusu",
        label: "Gül Kurusu",
        background:
          "radial-gradient(1200px 800px at 20% -10%, #9f1239 0%, #4a0e2a 55%, #1c0a16 100%)",
        ogBackground: "linear-gradient(135deg, #be123c 0%, #9f1239 50%, #4a0e2a 100%)",
        accent: "#fda4af",
        centerColor: "#fb7185",
        textColor: "#fff1f2",
        petalColors: ["#fda4af", "#fb7185", "#f43f5e", "#fecdd3", "#e11d48", "#ffe4e6"],
      },
      {
        id: "turkuaz",
        label: "Turkuaz",
        background:
          "radial-gradient(1200px 800px at 20% -10%, #115e59 0%, #134e4a 50%, #062a28 100%)",
        ogBackground: "linear-gradient(135deg, #0d9488 0%, #115e59 50%, #062a28 100%)",
        accent: "#5eead4",
        centerColor: "#2dd4bf",
        textColor: "#f0fdfa",
        petalColors: ["#5eead4", "#2dd4bf", "#99f6e4", "#14b8a6", "#ccfbf1", "#0f766e"],
      },
      {
        id: "fildisi",
        label: "Fildişi Şıklık",
        background:
          "radial-gradient(1200px 800px at 20% -10%, #6b3f1d 0%, #42240f 55%, #1e1006 100%)",
        ogBackground: "linear-gradient(135deg, #8a5a2b 0%, #5c3416 55%, #1e1006 100%)",
        accent: "#f4d3a5",
        centerColor: "#e3bc7d",
        textColor: "#fdf6e9",
        petalColors: ["#f4d3a5", "#e3bc7d", "#fbe6c4", "#c99a5b", "#e0c39a", "#a97c42"],
      },
    ],
  },
];

export function getTemplate(id: TemplateId): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function isTemplateId(value: string): value is TemplateId {
  return templates.some((t) => t.id === value);
}

export function getPalette(
  template: Template | undefined,
  paletteId?: string,
): Theme {
  const palettes = template?.palettes ?? [];
  return palettes.find((p) => p.id === paletteId) ?? palettes[0] ?? FALLBACK_PALETTE;
}
