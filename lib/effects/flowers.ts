// Prosedürel SVG çiçek üreteci.
// Her çiçek; deterministik jitter'lı (organik/asimetrik) petal katmanları, iç gölge (fold) çizgileri,
// radial merkez, sap/yapraklar ve gradient dolgulardan oluşur. Kod tekrarını önlemek için tüm
// katmanlar ortak yerleşim yardımcılarından geçer.
//
// Kısıt: çiçek başına toplam eleman ~15-25'i geçmez (performans).

export type RevealStyle = "draw" | "grow-up";

export interface GradientStop {
  offset: number;
  color: string;
  opacity?: number;
}

export interface GradientDef {
  id: string;
  kind: "linear" | "radial";
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  r?: number;
  userSpace?: boolean;
  stops: GradientStop[];
}

export interface VFLeaf {
  id: string;
  transform?: string;
  tag: "path" | "ellipse" | "circle";
  d?: string;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  r?: number;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: "round" | "butt";
  /** draw reveal'ine katılan yapraklar (petaller). */
  draw?: boolean;
  /** Animasyon başladıktan kaç sn sonra fade-in olacağı (boyama katmanları). */
  paintDelay?: number;
  /** grow-up saplı mı (başlığı alta öteleyen shift). */
  headShift?: number;
}

export interface FlowerOutput {
  id: string;
  label: string;
  revealStyle: RevealStyle;
  viewBox: string;
  size: number;
  defs: GradientDef[];
  leaves: VFLeaf[];
}

// ---- Renk yardımcıları -------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [200, 200, 200];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** amt: -1..1 (negatif karartır, pozitif açartır). */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (v: number) => (amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  return rgbToHex(f(r), f(g), f(b));
}

/** Deterministik sahte-rastgele [0,1). */
function jitFor(seed: number, k: number): number {
  const x = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// ---- Geometri -----------------------------------------------------------

/** Yukarı bakan, tabanı (0,0)'da olan kapalı petal path'i. */
function petalPath(
  len: number,
  width: number,
  notch: number,
  jit: number,
): string {
  const tipX = (jit - 0.5) * width * 0.3;
  const wl = width * (0.8 + jit * 0.35);
  const tipY = -len;
  if (notch > 0) {
    const nx = notch * 0.5;
    const dip = notch * 0.45;
    return [
      `M 0 0`,
      `C ${(-wl * 0.6).toFixed(1)} ${(-len * 0.34).toFixed(1)} ${(-wl * 0.42).toFixed(1)} ${(-len * 0.74).toFixed(1)} ${(tipX - nx).toFixed(1)} ${tipY}`,
      `C ${(tipX - nx * 0.6).toFixed(1)} ${(tipY + dip).toFixed(1)} ${(tipX + nx * 0.6).toFixed(1)} ${(tipY + dip).toFixed(1)} ${(tipX + nx).toFixed(1)} ${tipY}`,
      `C ${(wl * 0.42).toFixed(1)} ${(-len * 0.74).toFixed(1)} ${(wl * 0.6).toFixed(1)} ${(-len * 0.34).toFixed(1)} 0 0`,
      `Z`,
    ].join(" ");
  }
  return [
    `M 0 0`,
    `C ${(-wl * 0.6).toFixed(1)} ${(-len * 0.34).toFixed(1)} ${(-wl * 0.42).toFixed(1)} ${(-len * 0.74).toFixed(1)} ${tipX.toFixed(1)} ${tipY}`,
    `C ${(wl * 0.42).toFixed(1)} ${(-len * 0.74).toFixed(1)} ${(wl * 0.6).toFixed(1)} ${(-len * 0.34).toFixed(1)} 0 0`,
    `Z`,
  ].join(" ");
}

/** Petalın bir kenarını izleyen iç kıvrım çizgisi (3B derinlik hissi). */
function foldPath(len: number, width: number, jit: number, side: 1 | -1): string {
  const fx = width * 0.18 * (0.5 + jit);
  const s = side;
  return [
    `M ${(s * fx).toFixed(1)} ${(-len * 0.16).toFixed(1)}`,
    `Q ${(s * fx * 1.8).toFixed(1)} ${(-len * 0.42).toFixed(1)} ${(s * fx * 0.7).toFixed(1)} ${(-len * 0.66).toFixed(1)}`,
  ].join(" ");
}

/** Sap yaprağı. */
function leafPath(len: number, width: number, side: "l" | "r"): string {
  const s = side === "l" ? -1 : 1;
  return [
    `M 0 0`,
    `Q ${(s * width * 0.9).toFixed(1)} ${(-len * 0.4).toFixed(1)} ${(s * width * 1.15).toFixed(1)} ${(-len).toFixed(1)}`,
    `Q ${(s * width * 0.35).toFixed(1)} ${(-len * 0.7).toFixed(1)} 0 0`,
    `Z`,
  ].join(" ");
}

// ---- Yerleşim yardımcıları ---------------------------------------------

interface PetalLayerOpts {
  id: string;
  layer: number;
  count: number;
  radius: number;
  len: number;
  width: number;
  notch?: number;
  rotationOffset?: number;
  seed?: number;
  palette: string[];
  gradA: string;
  gradB?: string;
  strokeColor: string;
  folds?: number;
  shift?: number;
  draw?: boolean;
  paintDelay?: number;
}

/** Bir petal katmanını yapraklara dönüştürür (petaller + iç kıvrımlar + highlight). */
function placePetalLayer(o: PetalLayerOpts): VFLeaf[] {
  const leaves: VFLeaf[] = [];
  const shiftTx = o.shift ? `translate(0 ${-o.shift}) ` : "";
  const rot = o.rotationOffset ?? 0;
  const count = o.count;
  const seed = o.seed ?? 7;
  const foldCount = o.folds ?? 0;

  for (let k = 0; k < count; k++) {
    const jit = jitFor(seed, k);
    const angle = rot + (360 / count) * k + (jit - 0.5) * 4;
    const tx = `${shiftTx}rotate(${angle.toFixed(2)}) translate(0 ${o.radius})`;
    const grad = o.gradB && k % 2 === 1 ? o.gradB : o.gradA;
    leaves.push({
      id: `${o.id}-p${o.layer}-${k}`,
      transform: tx,
      tag: "path",
      d: petalPath(o.len, o.width, o.notch ?? 0, jit),
      fill: `url(#${grad})`,
      fillOpacity: 0,
      stroke: o.strokeColor,
      strokeWidth: 1.4,
      strokeLinecap: "round",
      draw: o.draw ?? true,
      paintDelay: o.paintDelay,
      headShift: o.shift,
    });
    if (k < foldCount) {
      const side: 1 | -1 = k % 2 === 0 ? -1 : 1;
      leaves.push({
        id: `${o.id}-f${o.layer}-${k}`,
        transform: tx,
        tag: "path",
        d: foldPath(o.len, o.width, jit, side),
        fill: "none",
        stroke: shade(o.strokeColor, -0.5),
        strokeWidth: 3,
        strokeLinecap: "round",
        paintDelay: o.paintDelay ?? 0.5,
        headShift: o.shift,
      });
    }
  }

  return leaves;
}

interface CenterOpts {
  id: string;
  r: number;
  fill: string;
  gradId: string;
  shift?: number;
  popDelay?: number;
}

function placeCenter(o: CenterOpts): VFLeaf[] {
  const tx = o.shift ? `translate(0 ${-o.shift})` : undefined;
  return [
    {
      id: `${o.id}-c`,
      transform: tx,
      tag: "circle",
      cx: 0,
      cy: 0,
      r: o.r,
      fill: `url(#${o.gradId})`,
      paintDelay: o.popDelay ?? 0.6,
      headShift: o.shift,
    },
  ];
}

interface StemOpts {
  id: string;
  len: number;
  gradId: string;
  leafGradId: string;
  shift: number;
  leafLen: number;
  leafWidth: number;
  paintDelay?: number;
}

function placeStem(o: StemOpts): VFLeaf[] {
  const leaves: VFLeaf[] = [];
  leaves.push({
    id: `${o.id}-stem`,
    transform: `translate(0 ${-o.shift})`,
    tag: "path",
    d: `M 0 5 C ${(-3).toFixed(1)} ${(o.len * 0.35).toFixed(1)} ${(2).toFixed(1)} ${(o.len * 0.7).toFixed(1)} 0 ${o.len.toFixed(1)}`,
    fill: "none",
    stroke: `url(#${o.gradId})`,
    strokeWidth: 6,
    strokeLinecap: "round",
    paintDelay: o.paintDelay ?? 0.45,
    headShift: o.shift,
  });
  leaves.push(
    {
      id: `${o.id}-leaf-l`,
      transform: `translate(0 ${-o.shift}) translate(-1 ${o.len * 0.3}) rotate(-14)`,
      tag: "path",
      d: leafPath(o.leafLen, o.leafWidth, "l"),
      fill: `url(#${o.leafGradId})`,
      paintDelay: o.paintDelay ?? 0.5,
      headShift: o.shift,
    },
    {
      id: `${o.id}-leaf-r`,
      transform: `translate(0 ${-o.shift}) translate(2 ${o.len * 0.58}) rotate(18)`,
      tag: "path",
      d: leafPath(o.leafLen * 0.85, o.leafWidth * 0.9, "r"),
      fill: `url(#${o.leafGradId})`,
      paintDelay: o.paintDelay ?? 0.55,
      headShift: o.shift,
    },
  );
  return leaves;
}

function placeStamens(
  id: string,
  count: number,
  len: number,
  color: string,
  shift: number,
): VFLeaf[] {
  const out: VFLeaf[] = [];
  for (let k = 0; k < count; k++) {
    const angle = (360 / count) * k + 12;
    out.push({
      id: `${id}-st-${k}`,
      transform: `translate(0 ${-shift}) rotate(${angle.toFixed(1)})`,
      tag: "path",
      d: `M 0 -1.5 L 0 ${(-len).toFixed(1)}`,
      fill: "none",
      stroke: color,
      strokeWidth: 1.6,
      strokeLinecap: "round",
      paintDelay: 0.68,
      headShift: shift,
    });
    out.push({
      id: `${id}-std-${k}`,
      transform: `translate(0 ${-shift}) rotate(${angle.toFixed(1)}) translate(0 ${(-len).toFixed(1)})`,
      tag: "circle",
      cx: 0,
      cy: 0,
      r: 1.7,
      fill: color,
      paintDelay: 0.72,
      headShift: shift,
    });
  }
  return out;
}

// ---- Ortak defs (gradientler) ------------------------------------------

interface FlowerDefsOptions {
  id: string;
  petal: string;
  petalAlt?: string;
  center: string;
  stemGreen?: boolean;
}

function flowerDefs(o: FlowerDefsOptions): GradientDef[] {
  const defs: GradientDef[] = [
    {
      id: `vf-${o.id}-petal`,
      kind: "linear",
      userSpace: true,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: -30,
      stops: [
        { offset: 0, color: shade(o.petal, -0.28) },
        { offset: 0.55, color: o.petal },
        { offset: 1, color: shade(o.petal, 0.3) },
      ],
    },
    {
      id: `vf-${o.id}-center`,
      kind: "radial",
      cx: 0.38,
      cy: 0.32,
      r: 0.72,
      stops: [
        { offset: 0, color: shade(o.center, 0.35) },
        { offset: 0.65, color: o.center },
        { offset: 1, color: shade(o.center, -0.3) },
      ],
    },
    {
      id: `vf-${o.id}-hl`,
      kind: "radial",
      cx: 0.5,
      cy: 0.5,
      r: 0.5,
      stops: [
        { offset: 0, color: "#ffffff", opacity: 0.9 },
        { offset: 1, color: "#ffffff", opacity: 0 },
      ],
    },
  ];
  if (o.petalAlt) {
    defs.push({
      id: `vf-${o.id}-petal-alt`,
      kind: "linear",
      userSpace: true,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: -30,
      stops: [
        { offset: 0, color: shade(o.petalAlt, -0.28) },
        { offset: 0.55, color: o.petalAlt },
        { offset: 1, color: shade(o.petalAlt, 0.3) },
      ],
    });
  }
  if (o.stemGreen) {
    defs.push(
      {
        id: `vf-${o.id}-stem`,
        kind: "linear",
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 1,
        stops: [
          { offset: 0, color: "#2f9e44" },
          { offset: 1, color: "#2b8a3e" },
        ],
      },
      {
        id: `vf-${o.id}-leaf`,
        kind: "linear",
        x1: 0,
        y1: 0,
        x2: 1,
        y2: 1,
        stops: [
          { offset: 0, color: "#40c057" },
          { offset: 0.6, color: "#2f9e44" },
          { offset: 1, color: "#2b8a3e" },
        ],
      },
    );
  }
  return defs;
}

// ---- Çiçek tanımları ----------------------------------------------------

function buildRose(palette: string[]): FlowerOutput {
  const main = palette[0] ?? "#e0396b";
  const alt = palette[1] ?? "#ff7aa2";
  const center = palette[1] ?? "#ff7aa2";
  const shift = 0;
  const leaves: VFLeaf[] = [];
  leaves.push(
    ...placePetalLayer({
      id: "rose",
      layer: 0,
      count: 5,
      radius: 27,
      len: 36,
      width: 26,
      rotationOffset: 18,
      seed: 11,
      palette,
      gradA: `vf-rose-petal`,
      gradB: `vf-rose-petal-alt`,
      strokeColor: shade(main, 0.35),
      folds: 2,
      shift,
      paintDelay: 0.55,
    }),
    ...placePetalLayer({
      id: "rose",
      layer: 1,
      count: 5,
      radius: 16,
      len: 30,
      width: 24,
      rotationOffset: 54,
      seed: 23,
      palette,
      gradA: `vf-rose-petal`,
      gradB: `vf-rose-petal-alt`,
      strokeColor: shade(main, 0.3),
      folds: 2,
      shift,
      paintDelay: 0.62,
    }),
    ...placePetalLayer({
      id: "rose",
      layer: 2,
      count: 4,
      radius: 6,
      len: 23,
      width: 21,
      rotationOffset: 90,
      seed: 31,
      palette,
      gradA: `vf-rose-petal`,
      strokeColor: shade(main, 0.22),
      folds: 2,
      shift,
      paintDelay: 0.7,
    }),
  );
  leaves.push({
    id: "rose-hl",
    transform: `rotate(18) translate(0 27)`,
    tag: "ellipse",
    cx: 4,
    cy: -26,
    rx: 2.6,
    ry: 4.6,
    fill: `url(#vf-rose-hl)`,
    paintDelay: 0.85,
  });
  leaves.push(...placeCenter({ id: "rose", r: 5, fill: center, gradId: `vf-rose-center`, shift, popDelay: 0.78 }));
  return { id: "rose", label: "Gül", revealStyle: "draw", viewBox: "-100 -140 200 280", size: 230, defs: flowerDefs({ id: "rose", petal: main, petalAlt: alt, center }), leaves };
}

function buildPeony(palette: string[]): FlowerOutput {
  const main = palette[0] ?? "#f9a8d4";
  const alt = palette[1] ?? "#f472b6";
  const center = palette[1] ?? "#ec4899";
  const shift = 0;
  const leaves: VFLeaf[] = [];
  leaves.push(
    ...placePetalLayer({
      id: "peony",
      layer: 0,
      count: 6,
      radius: 31,
      len: 32,
      width: 30,
      rotationOffset: 0,
      seed: 5,
      palette,
      gradA: `vf-peony-petal`,
      gradB: `vf-peony-petal-alt`,
      strokeColor: shade(main, 0.3),
      folds: 2,
      shift,
      paintDelay: 0.55,
    }),
    ...placePetalLayer({
      id: "peony",
      layer: 1,
      count: 6,
      radius: 19,
      len: 27,
      width: 28,
      rotationOffset: 30,
      seed: 13,
      palette,
      gradA: `vf-peony-petal`,
      gradB: `vf-peony-petal-alt`,
      strokeColor: shade(main, 0.26),
      folds: 2,
      shift,
      paintDelay: 0.62,
    }),
    ...placePetalLayer({
      id: "peony",
      layer: 2,
      count: 5,
      radius: 9,
      len: 22,
      width: 24,
      rotationOffset: 72,
      seed: 29,
      palette,
      gradA: `vf-peony-petal`,
      strokeColor: shade(main, 0.2),
      folds: 1,
      shift,
      paintDelay: 0.7,
    }),
  );
  leaves.push({
    id: "peony-hl",
    transform: `rotate(24) translate(0 31)`,
    tag: "ellipse",
    cx: 4,
    cy: -24,
    rx: 3,
    ry: 5,
    fill: `url(#vf-peony-hl)`,
    paintDelay: 0.85,
  });
  leaves.push(...placeCenter({ id: "peony", r: 6, fill: center, gradId: `vf-peony-center`, shift, popDelay: 0.78 }));
  return { id: "peony", label: "Şakayık", revealStyle: "draw", viewBox: "-100 -140 200 280", size: 250, defs: flowerDefs({ id: "peony", petal: main, petalAlt: alt, center }), leaves };
}

function buildDaisy(palette: string[]): FlowerOutput {
  const main = palette[0] ?? "#ffffff";
  const center = palette[2] ?? "#fde047";
  const shift = 0;
  const leaves: VFLeaf[] = [];
  leaves.push(
    ...placePetalLayer({
      id: "daisy",
      layer: 0,
      count: 12,
      radius: 12,
      len: 40,
      width: 13,
      rotationOffset: 0,
      seed: 9,
      palette,
      gradA: `vf-daisy-petal`,
      strokeColor: shade(main, -0.1),
      folds: 3,
      shift,
      paintDelay: 0.55,
    }),
  );
  leaves.push({
    id: "daisy-hl",
    transform: `rotate(0) translate(0 12)`,
    tag: "ellipse",
    cx: 1.5,
    cy: -30,
    rx: 1.8,
    ry: 3.4,
    fill: `url(#vf-daisy-hl)`,
    paintDelay: 0.85,
  });
  leaves.push(...placeCenter({ id: "daisy", r: 11, fill: center, gradId: `vf-daisy-center`, shift, popDelay: 0.6 }));
  return { id: "daisy", label: "Papatya", revealStyle: "draw", viewBox: "-100 -140 200 280", size: 210, defs: flowerDefs({ id: "daisy", petal: main, center }), leaves };
}

function buildTulip(palette: string[]): FlowerOutput {
  const main = palette[0] ?? "#fb7185";
  const alt = palette[1] ?? "#fda4af";
  const center = palette[1] ?? "#fecdd3";
  const shift = 30;
  const leaves: VFLeaf[] = [];
  leaves.push(
    ...placePetalLayer({
      id: "tulip",
      layer: 0,
      count: 3,
      radius: 8,
      len: 42,
      width: 20,
      rotationOffset: 0,
      seed: 17,
      palette,
      gradA: `vf-tulip-petal`,
      strokeColor: shade(main, 0.3),
      folds: 2,
      shift,
      paintDelay: 0.3,
      draw: false,
    }),
    ...placePetalLayer({
      id: "tulip",
      layer: 1,
      count: 3,
      radius: 6,
      len: 40,
      width: 19,
      rotationOffset: 60,
      seed: 21,
      palette,
      gradA: `vf-tulip-petal`,
      gradB: `vf-tulip-petal-alt`,
      strokeColor: shade(main, 0.24),
      folds: 2,
      shift,
      paintDelay: 0.4,
      draw: false,
    }),
  );
  leaves.push(
    ...placeStem({ id: "tulip", len: 74, gradId: `vf-tulip-stem`, leafGradId: `vf-tulip-leaf`, shift, leafLen: 26, leafWidth: 12 }),
    ...placeCenter({ id: "tulip", r: 4, fill: center, gradId: `vf-tulip-center`, shift, popDelay: 0.55 }),
  );
  return { id: "tulip", label: "Lale", revealStyle: "grow-up", viewBox: "-100 -140 200 280", size: 190, defs: flowerDefs({ id: "tulip", petal: main, petalAlt: alt, center, stemGreen: true }), leaves };
}

function buildOrchid(palette: string[]): FlowerOutput {
  const main = palette[0] ?? "#c084fc";
  const alt = palette[1] ?? "#a855f7";
  const center = palette[1] ?? "#7e22ce";
  const shift = 0;
  const leaves: VFLeaf[] = [];
  leaves.push(
    ...placePetalLayer({
      id: "orchid",
      layer: 0,
      count: 2,
      radius: 6,
      len: 44,
      width: 24,
      rotationOffset: 0,
      seed: 3,
      palette,
      gradA: `vf-orchid-petal`,
      strokeColor: shade(main, 0.3),
      folds: 1,
      shift,
      paintDelay: 0.55,
    }),
    ...placePetalLayer({
      id: "orchid",
      layer: 1,
      count: 3,
      radius: 8,
      len: 34,
      width: 22,
      rotationOffset: 40,
      seed: 19,
      palette,
      gradA: `vf-orchid-petal`,
      gradB: `vf-orchid-petal-alt`,
      strokeColor: shade(main, 0.26),
      folds: 2,
      shift,
      paintDelay: 0.62,
    }),
    ...placePetalLayer({
      id: "orchid",
      layer: 2,
      count: 1,
      radius: 10,
      len: 30,
      width: 26,
      rotationOffset: 0,
      seed: 37,
      palette,
      gradA: `vf-orchid-petal-alt`,
      strokeColor: shade(alt, -0.1),
      folds: 1,
      shift,
      paintDelay: 0.7,
    }),
  );
  leaves.push({
    id: "orchid-hl",
    transform: `rotate(0) translate(0 6)`,
    tag: "ellipse",
    cx: 3,
    cy: -32,
    rx: 2.6,
    ry: 4.4,
    fill: `url(#vf-orchid-hl)`,
    paintDelay: 0.85,
  });
  leaves.push(...placeCenter({ id: "orchid", r: 6, fill: center, gradId: `vf-orchid-center`, shift, popDelay: 0.78 }));
  return { id: "orchid", label: "Orkide", revealStyle: "draw", viewBox: "-100 -140 200 280", size: 230, defs: flowerDefs({ id: "orchid", petal: main, petalAlt: alt, center }), leaves };
}

function buildSunflower(palette: string[]): FlowerOutput {
  const main = palette[0] ?? "#fbbf24";
  const alt = palette[1] ?? "#f59e0b";
  const center = "#5b3a1e";
  const shift = 30;
  const leaves: VFLeaf[] = [];
  leaves.push(
    ...placePetalLayer({
      id: "sunflower",
      layer: 0,
      count: 10,
      radius: 12,
      len: 32,
      width: 12,
      rotationOffset: 0,
      seed: 7,
      palette,
      gradA: `vf-sunflower-petal`,
      strokeColor: shade(main, 0.25),
      folds: 2,
      shift,
      paintDelay: 0.3,
      draw: false,
    }),
    ...placePetalLayer({
      id: "sunflower",
      layer: 1,
      count: 6,
      radius: 14,
      len: 30,
      width: 12,
      rotationOffset: 15,
      seed: 15,
      palette,
      gradA: `vf-sunflower-petal`,
      gradB: `vf-sunflower-petal-alt`,
      strokeColor: shade(alt, 0.22),
      folds: 1,
      shift,
      paintDelay: 0.42,
      draw: false,
    }),
  );
  leaves.push(
    ...placeStem({ id: "sunflower", len: 72, gradId: `vf-sunflower-stem`, leafGradId: `vf-sunflower-leaf`, shift, leafLen: 24, leafWidth: 11 }),
    ...placeCenter({ id: "sunflower", r: 15, fill: center, gradId: `vf-sunflower-center`, shift, popDelay: 0.5 }),
  );
  return { id: "sunflower", label: "Ayçiçeği", revealStyle: "grow-up", viewBox: "-100 -140 200 280", size: 210, defs: flowerDefs({ id: "sunflower", petal: main, petalAlt: alt, center, stemGreen: true }), leaves };
}

function buildLily(palette: string[]): FlowerOutput {
  const main = palette[0] ?? "#fef08a";
  const alt = palette[1] ?? "#fde047";
  const center = palette[2] ?? "#f59e0b";
  const shift = 30;
  const leaves: VFLeaf[] = [];
  leaves.push(
    ...placePetalLayer({
      id: "lily",
      layer: 0,
      count: 3,
      radius: 8,
      len: 42,
      width: 15,
      rotationOffset: 0,
      seed: 11,
      palette,
      gradA: `vf-lily-petal`,
      strokeColor: shade(main, 0.2),
      folds: 2,
      shift,
      paintDelay: 0.32,
      draw: false,
    }),
    ...placePetalLayer({
      id: "lily",
      layer: 1,
      count: 3,
      radius: 7,
      len: 40,
      width: 14,
      rotationOffset: 60,
      seed: 27,
      palette,
      gradA: `vf-lily-petal`,
      gradB: `vf-lily-petal-alt`,
      strokeColor: shade(alt, 0.18),
      folds: 2,
      shift,
      paintDelay: 0.42,
      draw: false,
    }),
    ...placeStamens("lily", 4, 26, "#f59e0b", shift),
    ...placeStem({ id: "lily", len: 76, gradId: `vf-lily-stem`, leafGradId: `vf-lily-leaf`, shift, leafLen: 25, leafWidth: 10 }),
    ...placeCenter({ id: "lily", r: 5, fill: center, gradId: `vf-lily-center`, shift, popDelay: 0.55 }),
  );
  return { id: "lily", label: "Zambak", revealStyle: "grow-up", viewBox: "-100 -140 200 280", size: 195, defs: flowerDefs({ id: "lily", petal: main, petalAlt: alt, center, stemGreen: true }), leaves };
}

function buildMagnolia(palette: string[]): FlowerOutput {
  const main = palette[0] ?? "#fef3c7";
  const alt = palette[1] ?? "#fde68a";
  const center = palette[2] ?? "#f8fafc";
  const shift = 0;
  const leaves: VFLeaf[] = [];
  leaves.push(
    ...placePetalLayer({
      id: "magnolia",
      layer: 0,
      count: 3,
      radius: 16,
      len: 38,
      width: 27,
      rotationOffset: 0,
      seed: 6,
      palette,
      gradA: `vf-magnolia-petal`,
      gradB: `vf-magnolia-petal-alt`,
      strokeColor: shade(main, 0.12),
      folds: 2,
      shift,
      paintDelay: 0.55,
    }),
    ...placePetalLayer({
      id: "magnolia",
      layer: 1,
      count: 3,
      radius: 10,
      len: 34,
      width: 25,
      rotationOffset: 60,
      seed: 14,
      palette,
      gradA: `vf-magnolia-petal`,
      gradB: `vf-magnolia-petal-alt`,
      strokeColor: shade(main, 0.1),
      folds: 2,
      shift,
      paintDelay: 0.62,
    }),
    ...placePetalLayer({
      id: "magnolia",
      layer: 2,
      count: 3,
      radius: 5,
      len: 28,
      width: 22,
      rotationOffset: 30,
      seed: 22,
      palette,
      gradA: `vf-magnolia-petal`,
      strokeColor: shade(main, 0.08),
      folds: 1,
      shift,
      paintDelay: 0.7,
    }),
  );
  leaves.push({
    id: "magnolia-hl",
    transform: `rotate(60) translate(0 10)`,
    tag: "ellipse",
    cx: 3,
    cy: -25,
    rx: 2.8,
    ry: 5,
    fill: `url(#vf-magnolia-hl)`,
    paintDelay: 0.85,
  });
  leaves.push(...placeCenter({ id: "magnolia", r: 8, fill: center, gradId: `vf-magnolia-center`, shift, popDelay: 0.78 }));
  return { id: "magnolia", label: "Manolya", revealStyle: "draw", viewBox: "-100 -140 200 280", size: 230, defs: flowerDefs({ id: "magnolia", petal: main, petalAlt: alt, center }), leaves };
}

function buildDaffodil(palette: string[]): FlowerOutput {
  const main = palette[0] ?? "#fde047";
  const alt = palette[1] ?? "#fef08a";
  const center = palette[2] ?? "#f59e0b";
  const shift = 30;
  const leaves: VFLeaf[] = [];
  leaves.push(
    ...placePetalLayer({
      id: "daffodil",
      layer: 0,
      count: 6,
      radius: 12,
      len: 32,
      width: 14,
      rotationOffset: 0,
      seed: 12,
      palette,
      gradA: `vf-daffodil-petal`,
      gradB: `vf-daffodil-petal-alt`,
      strokeColor: shade(main, 0.2),
      folds: 2,
      shift,
      paintDelay: 0.32,
      draw: false,
    }),
  );
  leaves.push(
    {
      id: "daffodil-corona",
      transform: `translate(0 ${-shift})`,
      tag: "ellipse",
      cx: 0,
      cy: -1,
      rx: 9,
      ry: 12,
      fill: `url(#vf-daffodil-center)`,
      paintDelay: 0.5,
      headShift: shift,
    },
    {
      id: "daffodil-corona-rim",
      transform: `translate(0 ${-shift})`,
      tag: "path",
      d: `M -9 -1 A 9 12 0 0 1 9 -1`,
      fill: "none",
      stroke: shade(center, -0.25),
      strokeWidth: 2.5,
      strokeLinecap: "round",
      paintDelay: 0.6,
      headShift: shift,
    },
    ...placeStem({ id: "daffodil", len: 74, gradId: `vf-daffodil-stem`, leafGradId: `vf-daffodil-leaf`, shift, leafLen: 26, leafWidth: 9 }),
  );
  return { id: "daffodil", label: "Nergis", revealStyle: "grow-up", viewBox: "-100 -140 200 280", size: 195, defs: flowerDefs({ id: "daffodil", petal: main, petalAlt: alt, center, stemGreen: true }), leaves };
}

function buildCherryBlossom(palette: string[]): FlowerOutput {
  const main = palette[0] ?? "#fda4af";
  const alt = palette[1] ?? "#fb7185";
  const center = palette[1] ?? "#fb7185";
  const shift = 0;
  const leaves: VFLeaf[] = [];
  leaves.push(
    ...placePetalLayer({
      id: "cherry",
      layer: 0,
      count: 5,
      radius: 12,
      len: 27,
      width: 25,
      notch: 8,
      rotationOffset: 0,
      seed: 8,
      palette,
      gradA: `vf-cherry-petal`,
      gradB: `vf-cherry-petal-alt`,
      strokeColor: shade(main, 0.25),
      folds: 2,
      shift,
      paintDelay: 0.55,
    }),
    ...placeStamens("cherry", 6, 12, "#f59e0b", shift),
  );
  leaves.push({
    id: "cherry-hl",
    transform: `rotate(18) translate(0 12)`,
    tag: "ellipse",
    cx: 3,
    cy: -19,
    rx: 2.4,
    ry: 4,
    fill: `url(#vf-cherry-hl)`,
    paintDelay: 0.85,
  });
  leaves.push(...placeCenter({ id: "cherry", r: 3.4, fill: center, gradId: `vf-cherry-center`, shift, popDelay: 0.7 }));
  return { id: "cherry", label: "Kiraz Çiçeği", revealStyle: "draw", viewBox: "-100 -140 200 280", size: 215, defs: flowerDefs({ id: "cherry", petal: main, petalAlt: alt, center }), leaves };
}

const BUILDERS: Record<string, (palette: string[]) => FlowerOutput> = {
  rose: buildRose,
  peony: buildPeony,
  daisy: buildDaisy,
  tulip: buildTulip,
  orchid: buildOrchid,
  sunflower: buildSunflower,
  lily: buildLily,
  magnolia: buildMagnolia,
  daffodil: buildDaffodil,
  cherryblossom: buildCherryBlossom,
};

/** Bilinen çiçek efekt id'leri. */
export function isVectorFlower(id: string | undefined | null): boolean {
  return !!id && id in BUILDERS;
}

/** Efekt id + renk paleti için çiçek üret. Bilinmeyen id'de gül'e düşer. */
export function buildFlower(id: string, palette: string[]): FlowerOutput {
  const builder = BUILDERS[id] ?? buildRose;
  return builder(palette);
}
