export interface TextFontOption {
  id: string;
  label: string;
  family: string;
}

// Google Fonts'a bağımlılık yok: yaygın desteklenen sistem font yığınları
// kullanılıyor ki build/çalışma sırasında ağ gerektirmesin.
export const TEXT_FONTS: TextFontOption[] = [
  { id: "system", label: "Sistem", family: "inherit" },
  {
    id: "zarif",
    label: "Zarif",
    family: "Georgia, 'Times New Roman', serif",
  },
  {
    id: "el-yazisi",
    label: "El Yazısı",
    family: "'Segoe Script', 'Brush Script MT', 'Comic Sans MS', cursive",
  },
  { id: "daktilo", label: "Daktilo", family: "'Courier New', Courier, monospace" },
];

export function getTextFont(id?: string | null): string {
  return TEXT_FONTS.find((f) => f.id === id)?.family ?? "inherit";
}
