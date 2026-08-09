export type TemplateId = "valentine" | "birthday" | "newyear" | "special";

export interface Theme {
  id: string;
  label: string;
  background: string;
  ogBackground: string;
  accent: string;
  centerColor: string;
  textColor: string;
  petalColors: string[];
}

export interface Template {
  id: TemplateId;
  label: string;
  emoji: string;
  messages: string[];
  palettes: Theme[];
}

export interface Position {
  x: number;
  y: number;
  /** Fotoğraf için boyut çarpanı (1 = varsayılan). */
  scale?: number;
  /** Yazı için font-size yüzdesi (1 = varsayılan). */
  fontSize?: number;
}

export type EffectRepeat = "once" | "loop" | "every";

export interface EffectPlacement {
  id: string;
  /** Efekt başlangıç noktası, ekran yüzdesi (varsayılan 50/50 = orta). */
  x?: number;
  y?: number;
  /** Bu efektin boyut çarpanı (1 = varsayılan). */
  scale?: number;
  /** Bu efektin hız çarpanı (1 = varsayılan; global animationSpeed'e göre öncelikli). */
  speed?: number;
  /** Tekrar modu: bir kez / sürekli / her N sn'de bir. (yoksa preset varsayılanı) */
  repeat?: EffectRepeat;
  /** repeat === "every" iken tekrarlama aralığı, saniye (varsayılan 15). */
  repeatEvery?: number;
}

export interface Greeting {
  id: string;
  template: TemplateId;
  paletteId: string;
  name: string | null;
  message?: string;
  audio?: GreetingAudio;
  photo?: string;
  video?: string;
  position?: "top" | "center" | "bottom";
  /** Eski tek-efekt alanı (legacy); yeni kayıtlarda ilk efekti tutar. */
  effect?: string;
  /** Çoklu efekt yerleşimi (yoksa `effect`'e geri düşer). */
  effects?: EffectPlacement[];
  photoPos?: Position;
  textPos?: Position;
  effectScale?: number;
  videoScale?: number;
  /** Tüm animasyonların hız çarpanı (1 = varsayılan, örn. 2 = iki kat hızlı). */
  animationSpeed?: number;
  /** Yazı fontu id'si (lib/fonts.ts; yoksa varsayılan). */
  textFont?: string;
  createdAt: string;
}

export interface CreateGreetingInput {
  template: TemplateId;
  paletteId?: string;
  name?: string;
  message?: string;
  audio?: GreetingAudio;
  photo?: string;
  video?: string;
  position?: "top" | "center" | "bottom";
  effect?: string;
  effects?: EffectPlacement[];
  photoPos?: Position;
  textPos?: Position;
  effectScale?: number;
  videoScale?: number;
  animationSpeed?: number;
  textFont?: string;
}

// Ses: hazır klip (clip), kullanıcı kaydı (recording) veya yüklenen dosya (file).
// - clip: value = lib/clips.ts içindeki hazır klip id'si.
// - recording: value = tarayıcıda kaydedilmiş base64 data URL'i (data:audio/...).
// - file: value = Supabase Storage'taki public URL; startTime/endTime isteğe bağlı
//   trim penceresidir (saniye; yoksa tüm dosya çalınır).
export interface GreetingAudio {
  type: "clip" | "recording" | "file";
  value: string;
  /** file tipinde: çalınacak pencerenin başlangıcı (sn). */
  startTime?: number;
  /** file tipinde: çalınacak pencerenin bitişi (sn). */
  endTime?: number;
}
