// Prosedürel SVG davetiye karakterleri (gelin / damat / sünnet çocuğu).
// Çiçek üreteciyle aynı çıktı sözleşmesini (GradientDef + VFLeaf) kullanır;
// böylece aynı render yardımcılarıyla çizilebilirler. Deterministik — jitter yok.

import { shade, type GradientDef, type VFLeaf } from "@/lib/effects/flowers";
import type { InvitationTheme } from "@/lib/invitation/themes";
import type { EventType } from "@/lib/invitation/types";

export type Persona = "bride" | "groom" | "child";

export interface FigureOutput {
  id: string;
  persona: Persona;
  viewBox: string;
  defs: GradientDef[];
  leaves: VFLeaf[];
}

// ---- Küçük üreticiler ----------------------------------------------------

function P(id: string, d: string, extra: Partial<VFLeaf> = {}): VFLeaf {
  return { id, tag: "path", d, ...extra };
}

function E(
  id: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  extra: Partial<VFLeaf> = {},
): VFLeaf {
  return { id, tag: "ellipse", cx, cy, rx, ry, ...extra };
}

function C(
  id: string,
  cx: number,
  cy: number,
  r: number,
  extra: Partial<VFLeaf> = {},
): VFLeaf {
  return { id, tag: "circle", cx, cy, r, ...extra };
}

interface FaceOpts {
  cx: number;
  cy: number;
  r: number;
  skin: string;
  hair: string;
  hairDown: boolean;
}

function face(o: FaceOpts): VFLeaf[] {
  const { cx, cy, r, skin, hair, hairDown } = o;
  const cap =
    hairDown
      ? [
          "M 76 58",
          "C 76 36 124 36 124 58",
          "C 124 68 120 74 112 76",
          "C 112 66 108 60 100 60",
          "C 92 60 88 66 88 76",
          "C 80 74 76 68 76 58 Z",
        ].join(" ")
      : [
          "M 76 58",
          "C 76 36 124 36 124 58",
          "C 124 66 120 70 112 70",
          "C 112 60 106 54 100 54",
          "C 94 54 88 60 88 70",
          "C 80 70 76 66 76 58 Z",
        ].join(" ");
  const eo = r * 0.32;
  return [
    C("head", cx, cy, r, { fill: skin }),
    P("hair", cap, { fill: hair }),
    C("eye-l", cx - eo, cy - r * 0.12, 1.9, { fill: "#2b2320" }),
    C("eye-r", cx + eo, cy - r * 0.12, 1.9, { fill: "#2b2320" }),
    P("smile", `M ${cx - r * 0.3} ${cy + r * 0.2} Q ${cx} ${cy + r * 0.45} ${cx + r * 0.3} ${cy + r * 0.2}`, {
      fill: "none",
      stroke: "#7a4a33",
      strokeWidth: 2,
      strokeLinecap: "round",
    }),
    E("blush-l", cx - r * 0.42, cy + r * 0.12, 3, 1.8, { fill: "#f4b8a0", fillOpacity: 0.55 }),
    E("blush-r", cx + r * 0.42, cy + r * 0.12, 3, 1.8, { fill: "#f4b8a0", fillOpacity: 0.55 }),
  ];
}

function bouquet(cx: number, cy: number, petals: string[]): VFLeaf[] {
  return [
    P("bk-stems", `M ${cx - 6} ${cy + 12} L ${cx - 1} ${cy + 26} M ${cx + 6} ${cy + 12} L ${cx + 1} ${cy + 27}`, {
      fill: "none",
      stroke: "#3f7d3f",
      strokeWidth: 3,
      strokeLinecap: "round",
    }),
    C("bk-b0", cx - 6, cy - 6, 7, { fill: petals[0] }),
    C("bk-b1", cx + 7, cy - 4, 6.5, { fill: petals[1] }),
    C("bk-b2", cx, cy - 11, 8, { fill: petals[2] }),
    C("bk-b3", cx - 4, cy + 3, 6, { fill: petals[3] }),
    C("bk-b4", cx + 5, cy + 4, 6.5, { fill: petals[4] }),
    C("bk-c", cx, cy - 6, 3, { fill: "#fde047" }),
    E("bk-hl", cx - 2, cy - 10, 2.4, 3.4, { fill: "#ffffff", fillOpacity: 0.85 }),
  ];
}

// ---- Kişi inşacıları -----------------------------------------------------

function bride(theme: InvitationTheme): VFLeaf[] {
  const { dressAccent, veil, skin, hair } = theme.couple;
  const petals = theme.petalColors;
  return [
    // arka duvak
    P("veil", "M 74 44 C 48 66 42 132 54 190 C 62 230 74 246 88 250 L 90 232 C 78 226 70 208 66 178 C 58 128 64 76 84 52 Z", {
      fill: `url(#fig-bride-veil)`,
    }),
    P("veil-edge", "M 88 250 C 98 254 110 252 118 244 L 116 226 C 108 234 98 236 90 232 Z", {
      fill: veil,
      fillOpacity: 0.9,
    }),
    E("bun", 100, 34, 9, 7, { fill: hair }),
    ...face({ cx: 100, cy: 62, r: 24, skin, hair, hairDown: true }),
    P("neck", "M 94 86 L 106 86 L 108 102 L 92 102 Z", { fill: skin }),
    // A kesim elbise
    P("dress", "M 88 102 C 76 130 62 190 58 252 C 56 280 60 300 70 322 L 130 322 C 140 300 144 280 142 252 C 138 190 124 130 112 102 Z", {
      fill: `url(#fig-bride-dress)`,
    }),
    P("bodice", "M 92 108 L 100 126 L 108 108 Z", {
      fill: "none",
      stroke: dressAccent,
      strokeWidth: 3,
      strokeLinecap: "round",
    }),
    P("sash", "M 62 232 C 82 240 118 240 138 232 L 138 246 C 118 254 82 254 62 246 Z", { fill: dressAccent }),
    E("skirt-fold-l", 78, 276, 5, 16, { fill: shade(dressAccent, -0.14), fillOpacity: 0.5, transform: "rotate(20 78 276)" }),
    E("skirt-fold-r", 122, 276, 5, 16, { fill: shade(dressAccent, -0.14), fillOpacity: 0.5, transform: "rotate(-20 122 276)" }),
    // kollar
    P("arm-l", "M 90 104 C 78 118 74 132 78 144 C 80 150 84 152 88 150 C 86 140 88 128 96 120", {
      fill: "none",
      stroke: skin,
      strokeWidth: 9,
      strokeLinecap: "round",
    }),
    P("arm-r", "M 110 104 C 122 118 126 132 122 144 C 120 150 116 152 112 150 C 114 140 112 128 104 120", {
      fill: "none",
      stroke: skin,
      strokeWidth: 9,
      strokeLinecap: "round",
    }),
    P("sleeve-l", "M 88 102 C 78 108 76 116 78 122 C 82 118 86 116 92 116 Z", { fill: dressAccent }),
    P("sleeve-r", "M 112 102 C 122 108 124 116 122 122 C 118 118 114 116 108 116 Z", { fill: dressAccent }),
    ...bouquet(100, 150, petals),
  ];
}

function groom(theme: InvitationTheme): VFLeaf[] {
  const { suit, suitAccent, skin, hair } = theme.couple;
  return [
    ...face({ cx: 100, cy: 62, r: 24, skin, hair, hairDown: false }),
    P("neck", "M 94 86 L 106 86 L 108 100 L 92 100 Z", { fill: skin }),
    P("shirt", "M 92 100 L 100 108 L 108 100 L 108 122 L 92 122 Z", { fill: "#fdfdfb" }),
    P("tie-l", "M 100 108 L 90 100 L 90 112 Z", { fill: theme.accent }),
    P("tie-r", "M 100 108 L 110 100 L 110 112 Z", { fill: theme.accent }),
    C("tie-k", 100, 109, 2.6, { fill: theme.accent }),
    P("jacket", "M 86 96 C 82 122 82 150 84 178 L 116 178 C 118 150 118 122 114 96 C 110 100 106 100 100 100 C 94 100 90 100 86 96 Z", {
      fill: `url(#fig-groom-suit)`,
    }),
    P("lapel-l", "M 94 100 L 100 112 L 92 126", {
      fill: "none",
      stroke: shade(suitAccent, 0.25),
      strokeWidth: 2.5,
      strokeLinecap: "round",
    }),
    P("lapel-r", "M 106 100 L 100 112 L 108 126", {
      fill: "none",
      stroke: shade(suitAccent, 0.25),
      strokeWidth: 2.5,
      strokeLinecap: "round",
    }),
    C("btn-1", 100, 132, 2, { fill: suitAccent }),
    C("btn-2", 100, 152, 2, { fill: suitAccent }),
    C("boutonniere", 92, 110, 3, { fill: theme.accent }),
    C("boutonniere-c", 92, 110, 1.4, { fill: "#ffffff" }),
    // kollar
    P("arm-l", "M 86 100 C 74 116 70 138 74 156 C 76 164 82 168 86 166 C 84 158 84 150 88 142", {
      fill: "none",
      stroke: suit,
      strokeWidth: 12,
      strokeLinecap: "round",
    }),
    C("hand-l", 85, 168, 5, { fill: skin }),
    P("arm-r", "M 114 100 C 126 116 130 138 126 156 C 124 164 118 168 114 166 C 116 158 116 150 112 142", {
      fill: "none",
      stroke: suit,
      strokeWidth: 12,
      strokeLinecap: "round",
    }),
    C("hand-r", 115, 168, 5, { fill: skin }),
    // pantolon + ayakkabı
    P("leg-l", "M 84 178 L 98 178 L 98 256 L 90 256 L 90 296 L 78 296 L 78 260 C 78 220 80 192 84 178 Z", {
      fill: shade(suit, -0.12),
    }),
    P("leg-r", "M 102 178 L 116 178 C 120 192 122 220 122 260 L 122 296 L 110 296 L 110 256 L 102 256 Z", {
      fill: shade(suit, -0.12),
    }),
    E("shoe-l", 82, 300, 11, 5, { fill: "#1c1c1c" }),
    E("shoe-r", 118, 300, 11, 5, { fill: "#1c1c1c" }),
  ];
}

function child(theme: InvitationTheme): VFLeaf[] {
  const { dress, skin, hair } = theme.couple;
  return [
    ...face({ cx: 100, cy: 64, r: 23, skin, hair, hairDown: false }),
    // veliaht tacı
    P("crown", "M 82 58 L 84 40 L 93 50 L 100 36 L 107 50 L 116 40 L 118 58 Z", { fill: theme.accent }),
    P("crown-band", "M 82 58 L 118 58 L 118 64 L 82 64 Z", { fill: shade(theme.accent, -0.15) }),
    C("jewel-l", 93, 47, 2, { fill: "#ffffff" }),
    C("jewel-m", 100, 43, 2.4, { fill: "#ffffff" }),
    C("jewel-r", 107, 47, 2, { fill: "#ffffff" }),
    P("neck", "M 94 87 L 106 87 L 107 100 L 93 100 Z", { fill: skin }),
    // pelerin (arkada kalır)
    P("cape", "M 84 96 C 70 130 68 190 76 228 C 82 254 92 266 100 270 C 108 266 118 254 124 228 C 132 190 130 130 116 96 Z", {
      fill: `url(#fig-child-cape)`,
    }),
    P("shirt", "M 94 102 L 100 110 L 106 102 L 106 124 L 94 124 Z", { fill: "#fdfdfb" }),
    P("vest", "M 88 98 C 84 128 84 158 88 182 L 112 182 C 116 158 116 128 112 98 C 108 102 106 102 100 102 C 94 102 92 102 88 98 Z", {
      fill: `url(#fig-child-vest)`,
    }),
    P("sash", "M 88 148 L 112 148 L 112 164 L 88 164 Z", { fill: theme.accent }),
    C("btn-1", 100, 120, 2, { fill: theme.accent }),
    C("btn-2", 100, 138, 2, { fill: theme.accent }),
    // kollar
    P("arm-l", "M 88 102 C 78 116 74 136 78 150 C 80 156 84 158 88 156 C 86 146 88 134 94 126", {
      fill: "none",
      stroke: dress,
      strokeWidth: 10,
      strokeLinecap: "round",
    }),
    C("hand-l", 87, 158, 4.5, { fill: skin }),
    P("arm-r", "M 112 102 C 122 116 126 136 122 150 C 120 156 116 158 112 156 C 114 146 112 134 106 126", {
      fill: "none",
      stroke: dress,
      strokeWidth: 10,
      strokeLinecap: "round",
    }),
    C("hand-r", 113, 158, 4.5, { fill: skin }),
    // şort + bacaklar + ayakkabı
    P("shorts-l", "M 86 182 L 100 182 L 100 224 L 84 224 C 82 208 83 194 86 182 Z", { fill: dress }),
    P("shorts-r", "M 100 182 L 114 182 C 117 194 118 208 116 224 L 100 224 Z", { fill: shade(dress, -0.08) }),
    P("leg-l", "M 88 224 L 100 224 L 100 264 L 86 264 L 86 244 C 86 234 87 228 88 224 Z", { fill: skin }),
    P("leg-r", "M 100 224 L 112 224 L 114 244 C 115 250 114 258 114 264 L 100 264 Z", { fill: skin }),
    E("sock-l", 90, 262, 7, 4, { fill: "#ffffff" }),
    E("sock-r", 108, 262, 7, 4, { fill: "#ffffff" }),
    E("shoe-l", 87, 268, 9, 4.5, { fill: "#1c1c1c" }),
    E("shoe-r", 113, 268, 9, 4.5, { fill: "#1c1c1c" }),
    E("cape-shine", 70, 130, 4, 22, { fill: "#ffffff", fillOpacity: 0.18, transform: "rotate(14 70 130)" }),
  ];
}

// ---- Gradientler ---------------------------------------------------------

interface FigureDefsOpts {
  id: string;
  dress: string;
  dressAccent: string;
  veil: string;
  suit: string;
  suitAccent: string;
}

function figureDefs(o: FigureDefsOpts): GradientDef[] {
  return [
    {
      id: `fig-${o.id}-dress`,
      kind: "linear",
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 1,
      stops: [
        { offset: 0, color: shade(o.dress, 0.06) },
        { offset: 0.55, color: o.dress },
        { offset: 1, color: shade(o.dress, -0.12) },
      ],
    },
    {
      id: `fig-${o.id}-veil`,
      kind: "linear",
      x1: 0,
      y1: 0,
      x2: 1,
      y2: 1,
      stops: [
        { offset: 0, color: o.veil, opacity: 0.95 },
        { offset: 1, color: o.veil, opacity: 0.45 },
      ],
    },
    {
      id: `fig-${o.id}-suit`,
      kind: "linear",
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 1,
      stops: [
        { offset: 0, color: shade(o.suit, 0.12) },
        { offset: 0.5, color: o.suit },
        { offset: 1, color: shade(o.suit, -0.18) },
      ],
    },
    {
      id: `fig-${o.id}-cape`,
      kind: "linear",
      x1: 0,
      y1: 0,
      x2: 1,
      y2: 1,
      stops: [
        { offset: 0, color: shade(o.suit, 0.16) },
        { offset: 1, color: shade(o.suit, -0.14) },
      ],
    },
    {
      id: `fig-${o.id}-vest`,
      kind: "linear",
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 1,
      stops: [
        { offset: 0, color: shade(o.dress, 0.14) },
        { offset: 0.5, color: o.dress },
        { offset: 1, color: shade(o.dress, -0.16) },
      ],
    },
    {
      id: `fig-${o.id}-trim`,
      kind: "radial",
      cx: 0.5,
      cy: 0.5,
      r: 0.5,
      stops: [
        { offset: 0, color: o.dressAccent },
        { offset: 1, color: shade(o.dressAccent, -0.2) },
      ],
    },
  ];
}

// ---- Dış API -------------------------------------------------------------

function prefixLeaves(pref: string, leaves: VFLeaf[]): VFLeaf[] {
  return leaves.map((l) => ({ ...l, id: `${pref}-${l.id}` }));
}

export function buildFigure(
  persona: Persona,
  theme: InvitationTheme,
): FigureOutput {
  const leaves =
    persona === "bride"
      ? bride(theme)
      : persona === "groom"
        ? groom(theme)
        : child(theme);

  const viewBox =
    persona === "bride" ? "0 0 200 340" : persona === "groom" ? "0 0 200 320" : "0 0 200 290";

  return {
    id: persona,
    persona,
    viewBox,
    defs: figureDefs({
      id: persona,
      dress: theme.couple.dress,
      dressAccent: theme.couple.dressAccent,
      veil: theme.couple.veil,
      suit: theme.couple.suit,
      suitAccent: theme.couple.suitAccent,
    }),
    leaves: prefixLeaves(persona, leaves),
  };
}

/** Olay tipine göre sahneye çıkacak karakterler. */
export function figuresFor(eventType: EventType): Persona[] {
  if (eventType === "sunnet") return ["child"];
  return ["bride", "groom"];
}
