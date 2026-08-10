export type EffectCategory = "bloom" | "burst" | "ambient";

export type ParticleShape =
  | "petal"
  | "heart"
  | "star"
  | "circle"
  | "confetti"
  | "balloon"
  | "butterfly"
  | "snowflake"
  | "spark"
  | "flower"
  | "leaf"
  | "envelope"
  | "bubble"
  | "firefly"
  | "paper-plane"
  | "bottle"
  | "candle"
  | "wave"
  | "moon"
  | "rainbow"
  | "cloud"
  | "rocket"
  | "aurora"
  | "light"
  | "ring"
  | "kiss"
  | "party"
  | "gift"
  | "car"
  | "motorcycle"
  | "scooter"
  | "teddy"
  | "bride"
  | "groom";

export type MotionPattern =
  | "bloom-spiral"
  | "burst-radial"
  | "float-up"
  | "fall-down"
  | "swirl"
  | "sparkle-fade";

export interface EffectTiming {
  duration: number;
  stagger: number;
  ease: string;
  loop?: boolean;
}

export interface EffectConfig {
  id: string;
  label: string;
  emoji: string;
  category: EffectCategory;
  particleShape: ParticleShape;
  particleCount: number;
  colorPalette: string[];
  motionPattern: MotionPattern;
  layerCount: number;
  timing: EffectTiming;
  spread?: number;
  sway?: number;
  size?: number;
}

export type EffectId = string;
