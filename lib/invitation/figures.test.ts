import { describe, expect, it } from "vitest";
import { buildFigure, figuresFor } from "@/lib/invitation/figures";
import { getTheme, getThemeForEvent, INVITATION_THEMES } from "@/lib/invitation/themes";
import { formatDate, EVENT_TYPES, isEventType } from "@/lib/invitation/types";

const THEME = getTheme("dugun-altin")!;

describe("figures", () => {
  it("her persona tanımlı yapraklarla çizilir", () => {
    for (const persona of ["bride", "groom", "child"] as const) {
      const f = buildFigure(persona, THEME);
      expect(f.persona).toBe(persona);
      expect(f.leaves.length).toBeGreaterThan(10);
      expect(f.viewBox).toMatch(/^0 0 200 \d+$/);
    }
  });

  it("yaprak id'leri benzersizdir", () => {
    for (const persona of ["bride", "groom", "child"] as const) {
      const f = buildFigure(persona, THEME);
      const ids = f.leaves.map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("her yaprak kendi tag'ine göre zorunlu alanları içerir", () => {
    for (const persona of ["bride", "groom", "child"] as const) {
      const f = buildFigure(persona, THEME);
      for (const leaf of f.leaves) {
        if (leaf.tag === "path") expect(leaf.d).toBeTruthy();
        if (leaf.tag === "circle") {
          expect(typeof leaf.cx).toBe("number");
          expect(typeof leaf.r).toBe("number");
        }
        if (leaf.tag === "ellipse") {
          expect(typeof leaf.rx).toBe("number");
          expect(typeof leaf.ry).toBe("number");
        }
      }
    }
  });

  it("gradient id'leri figure id'siyle eşleşir", () => {
    const f = buildFigure("bride", THEME);
    const ids = f.defs.map((d) => d.id);
    expect(ids).toContain("fig-bride-dress");
    expect(ids).toContain("fig-bride-veil");
  });

  it("figuresFor olay tipine göre karakter döner", () => {
    expect(figuresFor("sunnet")).toEqual(["child"]);
    expect(figuresFor("dugun")).toEqual(["bride", "groom"]);
    expect(figuresFor("nikah")).toEqual(["bride", "groom"]);
    expect(figuresFor("kutlama")).toEqual(["bride", "groom"]);
  });
});

describe("themes", () => {
  it("her olay tipi için tema vardır", () => {
    for (const et of EVENT_TYPES) {
      const theme = getThemeForEvent(et);
      expect(theme.eventType).toBe(et);
      expect(theme.envelope.body).toBeTruthy();
      expect(theme.couple.skin).toBeTruthy();
    }
  });

  it("getTheme bilinmeyen id'de undefined döner", () => {
    expect(getTheme("yok")).toBeUndefined();
  });

  it("tüm temalar renk alanlarını içerir", () => {
    for (const t of INVITATION_THEMES) {
      expect(t.background).toBeTruthy();
      expect(t.ogBackground).toBeTruthy();
      expect(t.petalColors.length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("types", () => {
  it("isEventType doğrular", () => {
    expect(isEventType("dugun")).toBe(true);
    expect(isEventType("balo")).toBe(false);
    expect(isEventType(5)).toBe(false);
  });

  it("formatDate Türkçe tarih üretir", () => {
    expect(formatDate("2026-08-15")).toBe("15 Ağustos 2026");
    expect(formatDate("2026-01-01")).toBe("1 Ocak 2026");
    expect(formatDate("geçersiz")).toBe("geçersiz");
    expect(formatDate("2026-13-01")).toBe("2026-13-01");
  });
});
