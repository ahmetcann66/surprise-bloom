"use client";

// Fotoğraf istemci tarafında küçültülüp sıkıştırılır (WebP, JPEG fallback).
// Sunucuya büyük dosya hiç gitmez; çıktı base64 data URL olur ve veri satırında saklanır.

export async function fileToDataUrl(file: File, maxDim = 900, quality = 0.82): Promise<string> {
  const image = await loadImage(file);
  const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  ctx.drawImage(image, 0, 0, width, height);

  const supportWebp =
    typeof document !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");

  return supportWebp
    ? canvas.toDataURL("image/webp", quality)
    : canvas.toDataURL("image/jpeg", quality);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}
