import { describe, expect, it } from "vitest";
import { getPalette, getTemplate, templates } from "@/lib/templates";

describe("getTemplate", () => {
  it("bilinen şablonu döner", () => {
    expect(getTemplate("valentine")?.label).toBe("Sevgililer Günü");
  });

  it("bilinmeyen şablonda undefined", () => {
    // @ts-expect-error bilinçli geçersiz id
    expect(getTemplate("yok")).toBeUndefined();
  });
});

describe("getPalette", () => {
  const template = getTemplate("birthday")!;

  it("eşleşen paleti döner", () => {
    expect(getPalette(template, "mor-solen").id).toBe("mor-solen");
  });

  it("eşleşme yoksa ilk palete düşer", () => {
    expect(getPalette(template, "olmayan-palet").id).toBe(
      template.palettes[0].id,
    );
  });

  it("şablon yoksa fallback palete düşer", () => {
    const theme = getPalette(undefined, "x");
    expect(theme.id).toBe("fallback");
    expect(theme.petalColors.length).toBeGreaterThan(0);
  });
});

describe("templates", () => {
  it("tüm şablonların benzersiz id ve en az bir paleti vardır", () => {
    const ids = templates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of templates) {
      expect(t.palettes.length).toBeGreaterThan(0);
      const palIds = t.palettes.map((p) => p.id);
      expect(new Set(palIds).size).toBe(palIds.length);
    }
  });
});
