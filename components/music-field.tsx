"use client";

// Ortak müzik/ses form alanı — tebrik ve davetiye formlarındaki çift kopyalanmış
// ses bloklarının yerini alır. Seçim MusicSelector modalıyla yapılır; kayıt,
// önizleme ve temizleme bu alan içinde sunulur.

import { useState } from "react";
import { isSilentAudio, SILENT_CLIP } from "@/lib/music";
import type { GreetingAudio } from "@/lib/types";
import MusicSelector from "@/components/music-selector";
import GreetingAudioButton from "@/components/greeting-audio";
import AudioRecorder from "@/components/audio-recorder";

interface MusicFieldProps {
  value: GreetingAudio | null;
  onChange: (audio: GreetingAudio | null) => void;
  variant: "greeting" | "invitation";
  description?: string;
}

export default function MusicField({
  value,
  onChange,
  variant,
  description,
}: MusicFieldProps) {
  const [open, setOpen] = useState(false);
  const silentValue: GreetingAudio | null =
    variant === "invitation"
      ? { type: "clip", value: SILENT_CLIP }
      : null;

  const selected = value !== null && !isSilentAudio(value);

  return (
    <div>
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
        {variant === "invitation" ? "Müzik" : "Ses ekle"}{" "}
        <span className="font-normal text-zinc-400">(opsiyonel)</span>
      </span>
      {description && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-all hover:border-pink-500 hover:text-pink-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-pink-500 dark:hover:text-pink-400"
        >
          🎵 Müzik seç
        </button>
        {selected && (
          <>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Seçilen:
            </span>
            <GreetingAudioButton audio={value} />
            <button
              type="button"
              onClick={() => onChange(silentValue)}
              className="rounded-full px-2 py-1 text-xs text-zinc-400 underline-offset-4 hover:text-red-500 hover:underline"
            >
              Kaldır
            </button>
          </>
        )}
        {!selected && (
          <span className="text-xs text-zinc-400">
            {variant === "invitation"
              ? "Seçilmedi — davetiyede sihirli melodi çalar."
              : "Ses yok"}
          </span>
        )}
      </div>

      <AudioRecorder
        onResult={(dataUrl) => {
          if (dataUrl) {
            onChange({ type: "recording", value: dataUrl });
          } else {
            onChange(silentValue);
          }
        }}
      />

      <MusicSelector
        open={open}
        initial={value}
        silentValue={silentValue}
        onClose={() => setOpen(false)}
        onSelect={(audio) => {
          onChange(audio);
          setOpen(false);
        }}
      />
    </div>
  );
}
