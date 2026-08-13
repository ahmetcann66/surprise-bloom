import { describe, expect, it } from "vitest";
import {
  ANIMATION_CATALOG,
  ANIMATION_CATEGORIES,
  getAnimation,
  isAnimation,
  resolveAnimations,
  resolveEffectFor,
} from "@/lib/animations";
import { EFFECTS, getEffect, hasEffect } from "@/lib/effects/presets";
import { isVectorFlower } from "@/lib/effects/flowers";
import { INVITATION_ANIMATIONS } from "@/lib/invitation/themes";

describe("animations (birleşik katalog)", () => {
  it("union hiçbir animasyonu kaybetmez (efekt + davetiye)", () => {
    const effectIds = new Set(Object.keys(EFFECTS));
    const invitationIds = new Set(INVITATION_ANIMATIONS.map((a) => a.id));
    const catalogIds = new Set(ANIMATION_CATALOG.map((a) => a.id));

    for (const id of effectIds) expect(catalogIds.has(id)).toBe(true);
    for (const id of invitationIds) expect(catalogIds.has(id)).toBe(true);
    expect(catalogIds.size).toBe(effectIds.size + invitationIds.size);
  });

  it("her katalog öğesi bir kategoriye bağlıdır", () => {
    const categoryIds = new Set(ANIMATION_CATEGORIES.map((c) => c.id));
    for (const a of ANIMATION_CATALOG) {
      expect(categoryIds.has(a.category)).toBe(true);
    }
  });

  it("katalog key'leri animasyon motorunun beklediği key'lerle eşleşir", () => {
    // resolveEffectFor, katalog id'sini motorun tanıdığı bir EffectConfig'e
    // çözmeli; hiçbir seçenek 'undefined' config üretmemeli.
    for (const a of ANIMATION_CATALOG) {
      const config = resolveEffectFor(a.id);
      expect(config, `${a.id} için config bulunamadı`).toBeTruthy();
      expect(hasEffect(config.id)).toBe(true);
      expect(getEffect(config.id).id).toBe(config.id);
    }
  });

  it("isAnimation katalog üyesi olmayan id'leri reddeder", () => {
    for (const a of ANIMATION_CATALOG) expect(isAnimation(a.id)).toBe(true);
    expect(isAnimation("yok")).toBe(false);
    expect(isAnimation(null)).toBe(false);
    expect(isAnimation(42)).toBe(false);
  });

  it("çiçek (bloom) efektleri davetiyede vektör çiçeğe + nötr ışıltı patlamasına çözülür", () => {
    const blooms = ["rose", "peony", "daisy", "tulip"];
    for (const id of blooms) {
      expect(isVectorFlower(id)).toBe(true);
      const a = getAnimation(id);
      expect(a?.source).toBe("effect");
      expect(a?.ambient).toBe(id);
      expect(getEffect(a!.ambient).id).toBe(id);
      expect(a?.burst).toBe("goldsparkle");
      expect(getEffect(a!.burst).id).toBe("goldsparkle");
    }
  });

  it("greeting efektleri davetiye önizlemesinde de çözümlenir (state kaybı yok)", () => {
    // Katalog greeting + davetiye animasyonlarını birleştirir; davetiye
    // panelinde greeting kökenli bir efekt (örn. "Gelin" 👰) seçilse de
    // ambient/burst motor config'ine çözümlenmeli — önizleme ve gerçek sayfa
    // onu çizebilmelidir.
    const mixed = ["bridal", "gelin-damat", "cicekler"];
    const resolved = resolveAnimations(mixed);
    expect(resolved).toEqual(mixed);
    for (const id of resolved) {
      const unified = getAnimation(id);
      expect(unified, `${id} katalogda bulunamadı`).toBeTruthy();
      expect(getEffect(unified!.ambient).id).toBe(unified!.ambient);
      expect(getEffect(unified!.burst).id).toBe(unified!.burst);
    }
  });

  it("resolveAnimations tekrarları süzer, sıralamayı korur ve sınırlamaz", () => {
    const ids = [
      "bridal",
      "cicekler",
      "bridal",
      "konfeti",
      "gelin-damat",
      "kalpler",
    ];
    expect(resolveAnimations(ids)).toEqual([
      "bridal",
      "cicekler",
      "konfeti",
      "gelin-damat",
      "kalpler",
    ]);
    expect(resolveAnimations(ids).length).toBe(5);
    expect(
      resolveAnimations(ids).length,
    ).toBeLessThanOrEqual(ANIMATION_CATALOG.length);
  });

  it("resolveAnimations bilinmeyen id'leri atar, boşta varsayılan cicekler döner", () => {
    expect(resolveAnimations(["bilinmeyen"])).toEqual([]);
    expect(resolveAnimations([])).toEqual(["cicekler"]);
    expect(resolveAnimations(undefined)).toEqual(["cicekler"]);
  });
});
