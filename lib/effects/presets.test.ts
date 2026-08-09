import { describe, expect, it } from "vitest";
import {
  DEFAULT_EFFECT_BY_TEMPLATE,
  EFFECTS,
  getEffect,
  hasEffect,
} from "@/lib/effects/presets";

describe("presets", () => {
  it("hasEffect bilinen/geçersiz id'leri doğrular", () => {
    expect(hasEffect("rose")).toBe(true);
    expect(hasEffect("envelope")).toBe(true);
    expect(hasEffect("yok")).toBe(false);
    expect(hasEffect(null)).toBe(false);
    expect(hasEffect(42)).toBe(false);
  });

  it("getEffect bilinmeyen/null id'de gül'e düşer", () => {
    expect(getEffect("yok").id).toBe("rose");
    expect(getEffect(null).id).toBe("rose");
    expect(getEffect(undefined).id).toBe("rose");
  });

  it("her efekt zorunlu alanlara sahiptir", () => {
    for (const effect of Object.values(EFFECTS)) {
      expect(effect.id).toBeTruthy();
      expect(effect.emoji).toBeTruthy();
      expect(effect.particleCount).toBeGreaterThan(0);
      expect(effect.colorPalette.length).toBeGreaterThan(0);
      expect(effect.timing.duration).toBeGreaterThan(0);
    }
  });

  it("her şablon için varsayılan efekt bilinen bir id'dir", () => {
    for (const effectId of Object.values(DEFAULT_EFFECT_BY_TEMPLATE)) {
      expect(hasEffect(effectId)).toBe(true);
    }
  });
});
