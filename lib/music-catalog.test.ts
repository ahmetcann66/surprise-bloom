import { describe, expect, it } from "vitest";
import {
  musicCatalog,
  musicCategories,
  getCatalogItem,
  searchMusicCatalog,
} from "@/lib/music-catalog";

describe("music catalog", () => {
  it("tüm parçalar katalogda kategori ve süreye sahiptir", () => {
    expect(musicCatalog.length).toBeGreaterThanOrEqual(6);
    for (const item of musicCatalog) {
      expect(item.label).toBeTruthy();
      expect(item.duration).toBeGreaterThan(0);
      expect(musicCategories.some((c) => c.id === item.category)).toBe(true);
    }
  });

  it("katalog id'leri benzersizdir ve parçalara karşılık gelir", () => {
    const ids = musicCatalog.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(getCatalogItem(id)).toBeDefined();
    }
  });

  it("getCatalogItem bilinmeyen id için undefined döner", () => {
    expect(getCatalogItem("yok")).toBeUndefined();
  });
});

describe("searchMusicCatalog", () => {
  it("boş sorgu tüm parçaları döndürür", () => {
    expect(searchMusicCatalog("")).toHaveLength(musicCatalog.length);
    expect(searchMusicCatalog("   ")).toHaveLength(musicCatalog.length);
  });

  it("parça adında arar (Türkçe duyarsız)", () => {
    expect(searchMusicCatalog("vals").map((i) => i.id)).toContain("vals");
    expect(searchMusicCatalog("MÜZİK KUTUSU").map((i) => i.id)).toContain(
      "muzik-kutusu",
    );
    expect(searchMusicCatalog("dogum").map((i) => i.id)).toContain(
      "dogum-gunu",
    );
  });

  it("kategori adında arar ve tüm tokenler eşleşmelidir", () => {
    const results = searchMusicCatalog("düğün");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((i) => i.category === "dugun")).toBe(true);
    expect(searchMusicCatalog("vals olmayan").length).toBe(0);
  });
});
