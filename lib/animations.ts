// Birleşik animasyon kataloğu (tek doğruluk kaynağı).
//
// Greeting ("Özel Mesajlar") efektleri (lib/effects/presets) ile davetiye
// açılış animasyonları (lib/invitation/themes) tek bir listede birleştirilir.
// İki panel de accordion listesini yalnızca bu katalogdan türetir; hiçbir
// animasyon kaybedilmez (union), her öğe kendi kategorisinde korunur.
//
// - Greeting render: `resolveEffectFor(id)` → EffectConfig
// - Davetiye render: `resolveAnimations(...)` + `getAnimation(id)` → ambient/burst/flowers
import type { EffectConfig, EffectId } from "@/lib/effects/types";
import { isVectorFlower } from "@/lib/effects/flowers";
import {
  EFFECTS,
  EFFECT_CATEGORIES,
  getEffect,
} from "@/lib/effects/presets";
import {
  INVITATION_ANIMATIONS,
  INVITATION_ANIMATION_CATEGORIES,
  type InvitationAnimation,
} from "@/lib/invitation/themes";

export interface AnimationCategory {
  id: string;
  label: string;
  emoji: string;
}

export interface UnifiedAnimation {
  id: string;
  label: string;
  emoji: string;
  description?: string;
  category: string;
  /** Kaynak: greeting efekti mi, davetiye animasyonu mu. */
  source: "effect" | "invitation";
  /** Greeting render ederken kullanılan efekt config. */
  effect: EffectConfig;
  /** Davetiye ambiyans efekti. */
  ambient: EffectId;
  /** Davetiye patlama efekti. */
  burst: EffectId;
  /** Davetiye yan çiçekleri (rose + şakayık) gösterilsin mi. */
  flowers: boolean;
}

/**
 * Seçim sınırsızdır (katalogdaki animasyon sayısıyla sınırlıdır); bu değer
 * yalnızca kullanıcıya önerilen performans dostu sayıdır. Fazla animasyon
 * aynı anda çalıştığından eski cihazlarda akıcılığı etkileyebilir.
 */
export const RECOMMENDED_ANIMATIONS = 6;

/** Kategori birleşimi: greeting (bloom/burst/ambient) + davetiye kategorileri. */
export const ANIMATION_CATEGORIES: AnimationCategory[] = [
  ...EFFECT_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    emoji: c.emoji,
  })),
  ...INVITATION_ANIMATION_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    emoji: c.emoji,
  })),
];

function fromEffect(effect: EffectConfig): UnifiedAnimation {
  return {
    id: effect.id,
    label: effect.label,
    emoji: effect.emoji,
    category: effect.category,
    source: "effect",
    effect,
    ambient: effect.id,
    // Çiçek (vektör) efektleri önizleme/gerçek sayfada VectorFormEffect ile
    // çizilir; açılış patlaması rolü ise kendi petal sarmalı yerine nötr bir
    // ışıltıya çözümlenir (yoksa çiçeğin partikülleri ikinci kez saçılırdı).
    burst: isVectorFlower(effect.id) ? "goldsparkle" : effect.id,
    flowers: false,
  };
}

function fromInvitation(a: InvitationAnimation): UnifiedAnimation {
  return {
    id: a.id,
    label: a.label,
    emoji: a.emoji,
    description: a.description,
    category: a.category,
    source: "invitation",
    effect: getEffect(a.ambient),
    ambient: a.ambient,
    burst: a.burst,
    flowers: a.flowers,
  };
}

export const ANIMATION_CATALOG: UnifiedAnimation[] = [
  ...Object.values(EFFECTS).map(fromEffect),
  ...INVITATION_ANIMATIONS.map(fromInvitation),
];

export function getAnimation(id: string): UnifiedAnimation | undefined {
  return ANIMATION_CATALOG.find((a) => a.id === id);
}

export function isAnimation(value: unknown): value is string {
  return typeof value === "string" && getAnimation(value) !== undefined;
}

/** Greeting render: bir unified id'yi render edilebilir EffectConfig'e çözer. */
export function resolveEffectFor(id: string): EffectConfig {
  return getAnimation(id)?.effect ?? getEffect(id);
}

/**
 * Davetiye seçimlerini çözümler: geçerli olanları alır, tekilleştirir,
 * sıralamayı korur. Seçim sayısı sınırlanmaz (tekilleştirme zaten katalog
 * boyutuyla üstten sınırlar). Seçim yoksa varsayılan ["cicekler"].
 */
export function resolveAnimations(
  animations?: string[],
  legacy?: string,
): string[] {
  const raw =
    Array.isArray(animations) && animations.length > 0
      ? animations
      : legacy
        ? [legacy]
        : ["cicekler"];
  const valid = raw.filter(isAnimation);
  return [...new Set(valid)];
}
