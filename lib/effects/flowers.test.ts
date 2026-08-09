import { describe, expect, it } from "vitest";
import { buildFlower, shade, isVectorFlower } from "@/lib/effects/flowers";

const BUILDER_IDS = [
  "rose",
  "peony",
  "daisy",
  "tulip",
  "orchid",
  "sunflower",
  "lily",
  "magnolia",
  "daffodil",
  "cherryblossom",
];

describe("buildFlower", () => {
  it.each(BUILDER_IDS)("%s deterministik ve tutarlı üretir", (id) => {
    const a = buildFlower(id, ["#fda4af", "#fb7185", "#fecdd3"]);
    const b = buildFlower(id, ["#fda4af", "#fb7185", "#fecdd3"]);
    expect(a.leaves).toEqual(b.leaves);
    expect(a.defs).toEqual(b.defs);
    expect(a.leaves.length).toBeGreaterThan(0);
    expect(a.viewBox).toMatch(/^-?\d+(\.\d+)? /);
  });

  it("yaprak id'leri benzersizdir", () => {
    for (const id of BUILDER_IDS) {
      const flower = buildFlower(id, ["#ff7aa2"]);
      const ids = flower.leaves.map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("her yaprak kendi tag'ine göre zorunlu alanları içerir", () => {
    for (const id of BUILDER_IDS) {
      const flower = buildFlower(id, ["#ff7aa2", "#ffc2d4"]);
      for (const leaf of flower.leaves) {
        expect(leaf.id).toBeTruthy();
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

  it("eleman sayısı performans limitinde kalır (<= 26)", () => {
    for (const id of BUILDER_IDS) {
      const flower = buildFlower(id, ["#ff7aa2"]);
      expect(
        flower.leaves.length,
        `${id} ${flower.leaves.length} eleman üretti`,
      ).toBeLessThanOrEqual(26);
    }
  });

  it("bilinmeyen id gül'e düşer", () => {
    expect(buildFlower("olmayan", []).id).toBe("rose");
  });

  it("isVectorFlower bilinen id'leri doğrular", () => {
    expect(isVectorFlower("rose")).toBe(true);
    expect(isVectorFlower("heartburst")).toBe(false);
    expect(isVectorFlower(null)).toBe(false);
  });
});

describe("shade", () => {
  it("pozitif amt açar, negatif karartır", () => {
    expect(shade("#888888", 1)).toBe("#ffffff");
    expect(shade("#888888", -1)).toBe("#000000");
  });

  it("3 haneli hex'i de çözer", () => {
    expect(shade("#f00", 0)).toBe("#ff0000");
  });
});
