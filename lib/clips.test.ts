import { describe, expect, it } from "vitest";
import { clips, getClip } from "@/lib/clips";

describe("clips", () => {
  it("getClip bilinen/geçersiz id'yi doğrular", () => {
    expect(getClip("ninni")?.label).toBe("Yumuşak Kutu");
    expect(getClip("yok")).toBeUndefined();
  });

  it("tüm klipler sentezlenebilir süre ve play fonksiyonuna sahiptir", () => {
    for (const clip of clips) {
      expect(clip.duration).toBeGreaterThan(0);
      expect(typeof clip.play).toBe("function");
      expect(clip.emoji).toBeTruthy();
    }
  });

  it("klip id'leri benzersizdir", () => {
    const ids = clips.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
