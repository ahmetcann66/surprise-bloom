"use client";

import { useRef, useState } from "react";
import { fileToDataUrl } from "@/lib/image";

interface PhotoUploadProps {
  onResult: (dataUrl: string | null) => void;
}

export default function PhotoUpload({ onResult }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Lütfen bir fotoğraf dosyası seç.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      onResult(dataUrl);
    } catch {
      setError("Fotoğraf işlenemedi.");
    } finally {
      setProcessing(false);
    }
  }

  function clear() {
    setPreview(null);
    onResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600"
        >
          📷 Fotoğraf ekle
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {processing && <span className="text-xs text-zinc-500">İşleniyor…</span>}
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {preview && (
        <div className="mt-3 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Önizleme"
            className="h-24 w-24 rounded-xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-300"
            >
              Değiştir
            </button>
            <button
              type="button"
              onClick={clear}
              className="text-xs text-zinc-500 underline-offset-4 hover:underline"
            >
              Fotoğrafı kaldır
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
