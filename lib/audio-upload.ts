// Ses dosyası yükleme yardımcıları — tarayıcıdan Supabase Storage'a.
// Binary, Vercel/API üzerinden ASLA geçmez; doğrudan client → Storage.
// Yüklenen müziğin kullanım/yayınlama haklarına sahip olduğu kullanıcıya
// ayrıca hatırlatılır (telif uyarısı MusicField'da gösterilir).

import { supabase } from "@/lib/supabase";
import { AUDIO_BUCKET } from "@/lib/music";

export const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/m4a",
  "audio/x-m4a",
]);

export interface UploadAudioResult {
  /** Supabase Storage public URL. */
  url: string;
  /** Aynı dosya daha önce yüklenmişse mevcut URL (dedupe). */
  duplicate: boolean;
}

export class AudioUploadError extends Error {
  code: "size" | "type" | "network" | "storage";
  constructor(code: AudioUploadError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export function validateAudioFile(file: File): void {
  if (file.size > MAX_AUDIO_SIZE) {
    throw new AudioUploadError(
      "size",
      "Ses dosyası en fazla 5 MB olabilir.",
    );
  }
  if (!ALLOWED_AUDIO_TYPES.has(file.type)) {
    throw new AudioUploadError(
      "type",
      "Desteklenen formatlar: MP3, OGG, WAV, M4A.",
    );
  }
}

export async function hashAudioFile(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * Dosyayı `uploads/<hash>.<ext>` altına yükler. Aynı hash daha önce
 * kaydedilmişse mevcut URL döner (aynı müzik için 1 dosya + N referans).
 */
export async function uploadAudioFile(file: File): Promise<UploadAudioResult> {
  validateAudioFile(file);
  if (!supabase) {
    throw new AudioUploadError(
      "network",
      "Ses yükleme şu anda kullanılamıyor.",
    );
  }

  const hash = await hashAudioFile(file);
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
  const path = `uploads/${hash}.${ext}`;

  const { error: listError, data } = await supabase.storage
    .from(AUDIO_BUCKET)
    .list("uploads", { limit: 1, search: `${hash}.${ext}` });
  if (listError) {
    throw new AudioUploadError(
      "storage",
      "Dosya kontrol edilemedi, tekrar deneyin.",
    );
  }
  const exists = data?.some((item) => item.name === `${hash}.${ext}`);
  if (exists) {
    return {
      url: publicAudioUrl(path),
      duplicate: true,
    };
  }

  const { error: uploadError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) {
    // Eşzamanlı iki yükleme aynı dosyayı denedi — ikincisi çakışma döner.
    if (
      String(uploadError.statusCode) === "409" ||
      uploadError.message?.includes("already exists")
    ) {
      return { url: publicAudioUrl(path), duplicate: true };
    }
    throw new AudioUploadError(
      "storage",
      "Ses dosyası yüklenemedi, tekrar deneyin.",
    );
  }

  return { url: publicAudioUrl(path), duplicate: false };
}

export function publicAudioUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("Supabase yapılandırılmamış.");
  return `${base}/storage/v1/object/public/${AUDIO_BUCKET}/${path}`;
}
