"use client";

import { useMemo } from "react";
import type {
  EffectConfig,
  MotionPattern,
  ParticleShape,
} from "@/lib/effects/types";

const EMOJI_SHAPES: Partial<Record<ParticleShape, string>> = {
  heart: "💗",
  star: "✦",
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
};

const EASE_MAP: Record<string, string> = {
  "power2.out": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  "power2.inOut": "cubic-bezier(0.65, 0, 0.35, 1)",
  "sine.inOut": "cubic-bezier(0.45, 0.05, 0.55, 0.95)",
  "sine.in": "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
  "sine.out": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  linear: "linear",
};

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
  const maxRadius = spread * 1.05;

  for (let i = 0; i < count; i++) {
    const layer = i % layers;
    let ang: number;
    let dist: number;
    let size: number;

    if (phyllotaxis) {
      const progress = i / Math.max(count - 1, 1);
      ang = i * GOLDEN_ANGLE + (Math.random() * 8 - 4);
      dist =
        spread * Math.sqrt((i + 1) / count) * 1.05 +
        (Math.random() * 3 - 1.5);
      size = baseSize * (0.8 + 0.5 * progress) * (0.85 + Math.random() * 0.3);
    } else {
      ang = (360 / count) * i + layer * (360 / count) * 0.5;
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
      op: 0.55 + Math.random() * 0.45,
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
        background: `radial-gradient(ellipse at 30% 28%, ${light} 0%, ${mid} 46%, ${dark} 86%, rgba(22, 3, 12, 0.3) 100%)`,
        borderRadius: "50% 0 50% 0",
        boxShadow: `0 ${size * 0.12}px ${size * 0.45}px -${size * 0.08}px rgba(15, 0, 8, 0.45), 0 0 ${size * 0.7}px ${mid}59`,
        mixBlendMode: "screen",
      };
    }
    case "circle":
    case "firefly":
    case "light":
      return { width: size, height: size, background: color, borderRadius: "50%" };
    case "confetti":
      return { width: size, height: size * 0.6, background: color };
    case "spark":
      return { width: size, height: size, background: color, borderRadius: "50%", clipPath: "polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)" };
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
}

export default function EffectStage({
  config,
  active,
  reducedMotion,
}: EffectStageProps) {
  const particles = useMemo(() => generate(config), [config]);
  if (!active || reducedMotion) return null;

  const ease = EASE_MAP[config.timing.ease] ?? EASE_MAP["power2.out"];
  const loop = Boolean(config.timing.loop);
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

  return (
    <div
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
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          animationIterationCount: loop ? "infinite" : 1,
          animationFillMode: "both",
          animationTimingFunction: ease,
        };
        if (radial) {
          base.left = "50%";
          base.top = "50%";
          base.marginLeft = -p.size / 2;
          base.marginTop = -p.size / 2;
          base.animationDuration = `${p.duration}s`;
          (base as Record<string, unknown>)["--ang"] = `${p.ang}deg`;
          (base as Record<string, unknown>)["--dist"] = `${p.dist}vmin`;
          (base as Record<string, unknown>)["--spin"] = `${spinVar}deg`;
        } else if (config.motionPattern === "sparkle-fade") {
          base.left = `${p.left}%`;
          base.top = `${p.top}%`;
        } else if (config.motionPattern === "float-up") {
          base.left = `${p.left}%`;
          base.top = "102%";
          (base as Record<string, unknown>)["--drift"] = `${p.drift}vmin`;
        } else {
          base.left = `${p.left}%`;
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
