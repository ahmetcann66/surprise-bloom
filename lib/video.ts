"use client";

// Video istemci tarafında doğrulanır ve base64 data URL olarak döndürülür.
// Yeniden kodlama yapılmaz; boyut ve süre kısıtları doğrudan data URL'e çevrilir.

export const MAX_VIDEO_SECONDS = 15;
// Vercel sunucusuz fonksiyonların istek gövdesi limiti (~4.5MB) içinde kalmak için
// base64'e çevrilmiş hali ~4M karakteri (≈3MB) aşmayan videolar kabul edilir.
export const MAX_VIDEO_BYTES = 2_800_000;

export async function videoFileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("video/")) {
    throw new Error("Lütfen bir video dosyası seç.");
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(
      `Video en fazla ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))}MB olabilir.`,
    );
  }
  const seconds = await videoDuration(file);
  if (seconds > MAX_VIDEO_SECONDS) {
    throw new Error(
      `Video en fazla ${MAX_VIDEO_SECONDS} saniye olabilir (bu: ${Math.round(seconds)}sn).`,
    );
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Video okunamadı."));
    reader.readAsDataURL(file);
  });
}

function videoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const d = video.duration;
      URL.revokeObjectURL(url);
      if (Number.isFinite(d)) resolve(d);
      else reject(new Error("Süre okunamadı."));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video dosyası bozuk olabilir."));
    };
    video.src = url;
  });
}
