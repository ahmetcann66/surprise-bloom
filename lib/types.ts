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

export interface Greeting {
  id: string;
  template: TemplateId;
  paletteId: string;
  name: string;
  message?: string;
  audio?: GreetingAudio;
  photo?: string;
  video?: string;
  createdAt: string;
}

export interface CreateGreetingInput {
  template: TemplateId;
  paletteId?: string;
  name: string;
  message?: string;
  audio?: GreetingAudio;
  photo?: string;
  video?: string;
}

// Ses: hazır klip (clip) veya kullanıcı kaydı (recording).
// - clip: value = lib/clips.ts içindeki hazır klip id'si.
// - recording: value = tarayıcıda kaydedilmiş base64 data URL'i (data:audio/...).
export interface GreetingAudio {
  type: "clip" | "recording";
  value: string;
}
