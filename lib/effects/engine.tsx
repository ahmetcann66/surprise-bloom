"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  EffectConfig,
  MotionPattern,
  ParticleShape,
} from "@/lib/effects/types";
import type { EffectRepeat } from "@/lib/types";

const EMOJI_SHAPES: Partial<Record<ParticleShape, string>> = {
  balloon: "🎈",
  butterfly: "🦋",
  snowflake: "❄️",
  flower: "🌸",
  leaf: "🍃",
  envelope: "💌",
  bubble: "🫧",
  "paper-plane": "🕊️",
  bottle: "🥂",
  candle: "🕯️",
  wave: "🌊",
  moon: "🌙",
  rainbow: "🌈",
  cloud: "💭",
  rocket: "🚀",
  ring: "💍",
  kiss: "💋",
  party: "🥳",
  gift: "🎁",
  car: "🚗",
  motorcycle: "🏍️",
  scooter: "🛵",
  teddy: "🧸",
  bride: "👰",
  groom: "🤵",
};

// ---- SVG tabanlı (gradient + highlight'lı) parçacık şekilleri ----------

interface SvgShapeDef {
  defs: string;
  body: string;
  highlight?: string;
}

function svgUri(kind: "heart" | "star" | "spark" | "confetti" | "circle", base: string, light: string, dark: string): string {
  const g = (id: string, x1: number, y1: number, x2: number, y2: number) =>
    `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${light}"/><stop offset="0.55" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`;
  const h = `<radialGradient id="h" cx="0.35" cy="0.28" r="0.55"><stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`;

  const shapes: Record<string, SvgShapeDef> = {
    heart: {
      defs: g("g", 0, 0, 0, 1),
      body: `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#g)"/>`,
      highlight: `<ellipse cx="8.6" cy="7.4" rx="3.4" ry="2.6" fill="url(#h)"/>`,
    },
    star: {
      defs: g("g", 0, 0, 0, 1),
      body: `<path d="M12 2l2.9 6.26 6.85.56-5.2 4.53 1.55 6.69L12 16.9l-6.1 3.14 1.55-6.69-5.2-4.53 6.85-.56L12 2z" fill="url(#g)"/>`,
      highlight: `<circle cx="9.5" cy="7" r="1.6" fill="url(#h)"/>`,
    },
    spark: {
      defs: g("g", 0, 0, 0, 1),
      body: `<path d="M12 1.5C13 8 16 11 22.5 12 16 13 13 16 12 22.5 11 16 8 13 1.5 12 8 11 11 8 12 1.5z" fill="url(#g)"/>`,
      highlight: `<circle cx="9" cy="7.5" r="1.4" fill="url(#h)"/>`,
    },
    confetti: {
      defs: g("g", 0, 0, 0, 1),
      body: `<rect x="2" y="7" width="20" height="10" rx="2.5" fill="url(#g)"/><rect x="4" y="9" width="5" height="3" rx="1.5" fill="#ffffff" opacity="0.45"/>`,
    },
    circle: {
      defs: g("g", 0, 0, 0, 1),
      body: `<circle cx="12" cy="12" r="9.5" fill="url(#g)"/><circle cx="12" cy="12" r="9.5" fill="none" stroke="${dark}" stroke-opacity="0.4" stroke-width="1"/>`,
      highlight: `<ellipse cx="8.5" cy="7.5" rx="3.6" ry="2.8" fill="url(#h)"/>`,
    },
  };

  const def = shapes[kind];
  const defs = `${def.defs}${h}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${defs}${def.body}${def.highlight ?? ""}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const EASE_MAP: Record<string, string> = {
  "power2.out": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  "power2.inOut": "cubic-bezier(0.65, 0, 0.35, 1)",
  "sine.inOut": "cubic-bezier(0.45, 0.05, 0.55, 0.95)",
  "sine.in": "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
  "sine.out": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  linear: "linear",
};

// Altın Açı sabiti (Kusursuz sarmal için 137.5 değil, 137.508 kullanmalıyız ki o ayrık kollar oluşmasın)
const GOLDEN_ANGLE = 137.508;

interface Particle {
  id: number;
  ang: number;
  dist: number;
  left: number;
  top: number;
  drift: number;
  spin: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  s: number;
  op: number;
}

function generate(config: EffectConfig): Particle[] {
  const count = Math.max(1, config.particleCount);
  const viewportWidth = typeof window === "undefined" ? 1920 : window.innerWidth;
  const n =
    viewportWidth < 480
      ? Math.min(count, 150)
      : viewportWidth < 768
        ? Math.min(count, 200)
        : count;
  const layers = Math.max(1, config.layerCount);
  const spread = config.spread ?? 50;
  const sway = config.sway ?? 24;
  const baseSize = config.size ?? 16;
  const particles: Particle[] = [];
  const radial =
    config.motionPattern === "bloom-spiral" ||
    config.motionPattern === "burst-radial" ||
    config.motionPattern === "swirl";
  const phyllotaxis = config.motionPattern === "bloom-spiral";
  const maxRadius = spread;

  for (let i = 0; i < n; i++) {
    const layer = i % layers;
    let ang: number;
    let dist: number;
    let size: number;

    if (phyllotaxis) {
      const progress = i / Math.max(n - 1, 1);
      // Açı: Her partikül altın açı kadar dönerek yerleşir
      ang = i * GOLDEN_ANGLE;
      // Mesafe: İndeksin (i) karekökünü alıyoruz ki merkez taş gibi dolu olsun, dışa doğru zarifçe açılsın.
      // Spread'i 0.25 gibi bir katsayı ile çarpıyoruz ki yapraklar çok uzağa uçup ortayı boş bırakmasın.
      dist = Math.sqrt(i) * (spread * 0.25);
      // Ekstra Estetik: Merkezdeki yapraklar daha büyük, dıştakiler hafif daha küçük olsun.
      const s = 1 - (i / count) * 0.4;
      size = baseSize * (0.85 + 0.35 * progress) * s * (0.9 + Math.random() * 0.25);
    } else {
      ang = (360 / n) * i + layer * (360 / n) * 0.5;
      dist =
        spread * (0.45 + (0.6 * layer) / Math.max(layers - 1, 1)) +
        (Math.random() * 14 - 7);
      size = baseSize * (0.7 + Math.random() * 0.7);
    }

    const delay =
      config.timing.stagger * i +
      (phyllotaxis ? (dist / maxRadius) * 0.35 : layer * 0.18) +
      Math.random() * 0.15;
    const duration =
      Math.max(0.8, config.timing.duration + (Math.random() * 0.5 - 0.25));

    particles.push({
      id: i,
      ang,
      dist,
      left: 4 + Math.random() * 92,
      top: 4 + Math.random() * 92,
      drift: (Math.random() * 2 - 1) * sway,
      spin: Math.random() * 720 - 360,
      delay: radial ? delay : (config.timing.stagger * i) % 2,
      duration: radial ? duration : duration + Math.random() * 1.5,
      color: config.colorPalette[i % config.colorPalette.length],
      size,
      s: 0.7 + Math.random() * 0.6,
      op: n > 200 ? 0.32 + Math.random() * 0.26 : 0.55 + Math.random() * 0.45,
    });
  }
  return particles;
}

function keyframeName(pattern: MotionPattern): string {
  switch (pattern) {
    case "bloom-spiral":
      return "eff-bloom-spiral";
    case "burst-radial":
      return "eff-burst";
    case "float-up":
      return "eff-float";
    case "fall-down":
      return "eff-fall";
    case "swirl":
      return "eff-swirl";
    case "sparkle-fade":
      return "eff-sparkle";
  }
}

function shapeStyle(
  shape: ParticleShape,
  color: string,
  palette: string[],
  size: number,
  index: number,
): React.CSSProperties | null {
  switch (shape) {
    case "petal": {
      const n = Math.max(palette.length, 1);
      const dark = palette[index % n] ?? color;
      const mid = palette[(index + 1) % n] ?? dark;
      const light = palette[(index + 2) % n] ?? mid;
      return {
        width: size,
        height: size * 1.5,
        background: `radial-gradient(ellipse at 30% 28%, ${light} 0%, ${light} 20%, ${mid} 50%, ${dark} 86%, rgba(22, 3, 12, 0.3) 100%)`,
        borderRadius: "50% 0 50% 0",
        mixBlendMode: "screen",
      };
    }
    case "circle":
    case "firefly":
    case "light": {
      const n = Math.max(palette.length, 1);
      const base = color;
      const light = palette[index % n] ?? "#ffffff";
      const dark = palette[(index + 2) % n] ?? base;
      return {
        width: size,
        height: size,
        backgroundImage: svgUri("circle", base, light, dark),
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
      };
    }
    case "heart": {
      const n = Math.max(palette.length, 1);
      const base = color;
      const light = palette[index % n] ?? "#ffffff";
      const dark = palette[(index + 2) % n] ?? base;
      return {
        width: size,
        height: size,
        backgroundImage: svgUri("heart", base, light, dark),
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
      };
    }
    case "star": {
      const n = Math.max(palette.length, 1);
      const base = color;
      const light = palette[index % n] ?? "#ffffff";
      const dark = palette[(index + 2) % n] ?? base;
      return {
        width: size,
        height: size,
        backgroundImage: svgUri("star", base, light, dark),
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
      };
    }
    case "confetti": {
      const n = Math.max(palette.length, 1);
      const base = color;
      const light = palette[index % n] ?? "#ffffff";
      const dark = palette[(index + 2) % n] ?? base;
      return {
        width: size,
        height: size * 0.6,
        backgroundImage: svgUri("confetti", base, light, dark),
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
      };
    }
    case "spark": {
      const n = Math.max(palette.length, 1);
      const base = color;
      const light = palette[index % n] ?? "#ffffff";
      const dark = palette[(index + 2) % n] ?? base;
      return {
        width: size,
        height: size,
        backgroundImage: svgUri("spark", base, light, dark),
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
      };
    }
    case "aurora":
      return { width: size, height: size, background: color, borderRadius: "50%", filter: "blur(14px)", opacity: 0.35 };
    default:
      return null;
  }
}

interface EffectStageProps {
  config: EffectConfig;
  active: boolean;
  reducedMotion: boolean;
  /** Efekt başlangıç noktası, ekran yüzdesi (varsayılan orta). */
  origin?: { x: number; y: number };
  /** Hız çarpanı (1 = varsayılan; >1 daha hızlı). */
  speed?: number;
  /** Tekrar modu (yoksa preset'in timing.loop değeri kullanılır). */
  repeat?: EffectRepeat;
  /** repeat === "every" iken tekrarlama aralığı, saniye. */
  repeatEvery?: number;
}

export default function EffectStage({
  config,
  active,
  reducedMotion,
  origin = { x: 50, y: 50 },
  speed = 1,
  repeat,
  repeatEvery = 15,
}: EffectStageProps) {
  const particles = useMemo(() => generate(config), [config]);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (repeat !== "every" || !active) return;
    const ms = Math.min(120, Math.max(3, repeatEvery)) * 1000;
    const timer = setInterval(() => setRunId((r) => r + 1), ms);
    return () => clearInterval(timer);
  }, [repeat, repeatEvery, active]);

  if (!active || reducedMotion) return null;

  const ease = EASE_MAP[config.timing.ease] ?? EASE_MAP["power2.out"];
  const loop = Boolean(config.timing.loop);
  const effRepeat = repeat ?? (loop ? "loop" : "once");
  const radial =
    config.motionPattern === "bloom-spiral" ||
    config.motionPattern === "burst-radial" ||
    config.motionPattern === "swirl";
  const name = keyframeName(config.motionPattern);
  const spinVar =
    config.motionPattern === "bloom-spiral"
      ? 240
      : config.motionPattern === "swirl"
        ? 900
        : 0;
  const clampP = (v: number) => Math.min(95, Math.max(5, v));
  const spreadP = (v: number) => clampP(origin.x + (v - 50));
  const spreadTop = (v: number) => clampP(origin.y + (v - 50));
  const inv = speed > 0 ? 1 / speed : 1;

  return (
    <div
      key={runId}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] isolate overflow-hidden"
    >
      {particles.map((p) => {
        const shape = shapeStyle(
          config.particleShape,
          p.color,
          config.colorPalette,
          p.size,
          p.id,
        );
        const base: React.CSSProperties = {
          position: "absolute",
          animationName: name,
          animationDuration: `${p.duration * inv}s`,
          animationDelay: `${p.delay * inv}s`,
          animationIterationCount: effRepeat === "loop" ? "infinite" : 1,
          animationFillMode: "both",
          animationTimingFunction: ease,
        };
        if (radial) {
          base.left = `${origin.x}%`;
          base.top = `${origin.y}%`;
          base.marginLeft = -p.size / 2;
          base.marginTop = -p.size / 2;
          base.animationDuration = `${p.duration * inv}s`;
          (base as Record<string, unknown>)["--ang"] = `${p.ang}deg`;
          (base as Record<string, unknown>)["--dist"] = `${p.dist}vmin`;
          (base as Record<string, unknown>)["--spin"] = `${spinVar}deg`;
        } else if (config.motionPattern === "sparkle-fade") {
          base.left = `${spreadP(p.left)}%`;
          base.top = `${spreadTop(p.top)}%`;
        } else if (config.motionPattern === "float-up") {
          base.left = `${spreadP(p.left)}%`;
          base.top = "102%";
          (base as Record<string, unknown>)["--drift"] = `${p.drift}vmin`;
        } else {
          base.left = `${spreadP(p.left)}%`;
          base.top = "-8%";
          (base as Record<string, unknown>)["--drift"] = `${p.drift}vmin`;
          (base as Record<string, unknown>)["--spin"] = `${p.spin}deg`;
        }
        (base as Record<string, unknown>)["--op"] = p.op.toFixed(2);
        (base as Record<string, unknown>)["--s"] = p.s.toFixed(2);
        (base as Record<string, unknown>).fontSize = `${p.size}px`;

        const emoji = EMOJI_SHAPES[config.particleShape];
        return (
          <span key={p.id} style={base} className="eff-p">
            {emoji ? (
              <span style={{ fontSize: p.size, lineHeight: 1, color: p.color }}>
                {emoji}
              </span>
            ) : shape ? (
              <span className="eff-shape" style={shape} />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
