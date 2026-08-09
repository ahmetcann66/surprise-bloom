// Hazır müzik kataloğu — sentezlenmiş döngülü parçalar (lib/music.ts) için
// kategori + arama sunar. Yüklenen kullanıcı dosyaları katalogda yer almaz;
// MusicSelector bunları Storage'tan ayrı listeler.

import { musicTracks, trackDuration } from "@/lib/music";

export type MusicCategoryId = "dugun" | "dogum-gunu" | "sakin";

export interface MusicCategory {
  id: MusicCategoryId;
  label: string;
  emoji: string;
}

export interface MusicCatalogItem {
  /** lib/music.ts'teki parça id'si. */
  id: string;
  label: string;
  emoji: string;
  category: MusicCategoryId;
  /** Kaynak/sanatçı bilgisi (metadata görünümü için). */
  artist: string;
  /** Saniye. */
  duration: number;
}

export const musicCategories: MusicCategory[] = [
  { id: "dugun", label: "Düğün", emoji: "💍" },
  { id: "dogum-gunu", label: "Doğum Günü", emoji: "🎂" },
  { id: "sakin", label: "Sakin & Huzurlu", emoji: "🌙" },
];

const CATEGORY_BY_TRACK: Record<string, MusicCategoryId> = {
  "muzik-kutusu": "dugun",
  vals: "dugun",
  sihir: "dugun",
  zil: "dugun",
  "dogum-gunu": "dogum-gunu",
  huzur: "sakin",
};

const ARTIST = "Surprise Bloom (sentez)";

export const musicCatalog: MusicCatalogItem[] = musicTracks.map((track) => ({
  id: track.id,
  label: track.label,
  emoji: track.emoji,
  category: CATEGORY_BY_TRACK[track.id] ?? "sakin",
  artist: ARTIST,
  duration: trackDuration(track),
}));

export function getCatalogItem(id: string): MusicCatalogItem | undefined {
  return musicCatalog.find((item) => item.id === id);
}

function normalize(text: string): string {
  return text
    .toLocaleLowerCase("tr")
    .replaceAll("i", "i")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ç", "c")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u")
    .replaceAll("î", "i");
}

/**
 * Katalogda arama: parça adı, kategori adı veya sanatçıda arar.
 * Boş sorgu tüm parçaları döndürür.
 */
export function searchMusicCatalog(query: string): MusicCatalogItem[] {
  const q = normalize(query.trim());
  if (!q) return musicCatalog;
  return musicCatalog.filter((item) => {
    const category = musicCategories.find((c) => c.id === item.category);
    const haystack = normalize(
      [item.label, item.artist, category?.label ?? ""].join(" "),
    );
    return q.split(/\s+/).every((token) => haystack.includes(token));
  });
}
