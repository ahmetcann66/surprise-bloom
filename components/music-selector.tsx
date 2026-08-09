"use client";

// Müzik seçim modalı — hazır parçalar (katalog), kısa efektler, dosya yükleme
// ve "müzik yok" seçeneklerini tek ekranda sunar. Aynı anda tek önizleme çalar.

import { useCallback, useEffect, useRef, useState } from "react";
import { getClip } from "@/lib/clips";
import { getMusicTrack, playOnce } from "@/lib/music";
import {
  musicCategories,
  searchMusicCatalog,
  type MusicCategoryId,
} from "@/lib/music-catalog";
import {
  uploadAudioFile,
  validateAudioFile,
  AudioUploadError,
} from "@/lib/audio-upload";
import AudioTrimEditor from "@/components/audio-trim-editor";
import type { GreetingAudio } from "@/lib/types";

interface MusicSelectorProps {
  open: boolean;
  initial: GreetingAudio | null;
  /** "Müzik yok" butonunun üreteceği değer (greeting: null, davetiye: sessiz sentinel). */
  silentValue: GreetingAudio | null;
  onClose: () => void;
  onSelect: (audio: GreetingAudio | null) => void;
}

function resolveAudioContext(): typeof AudioContext {
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  );
}

function useSinglePreview() {
  const ctxRef = useRef<AudioContext | null>(null);
  const elRef = useRef<HTMLAudioElement | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const stopAll = useCallback(() => {
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    elRef.current?.pause();
    elRef.current = null;
    setPreviewing(null);
  }, []);

  const preview = useCallback(
    (audio: GreetingAudio) => {
      stopAll();
      if (audio.type === "file" || audio.type === "recording") {
        const el = new Audio(audio.value);
        elRef.current = el;
        el.onended = () => setPreviewing(null);
        if (audio.type === "file" && audio.startTime !== undefined) {
          el.currentTime = audio.startTime;
        }
        if (audio.type === "file" && audio.endTime !== undefined) {
          el.ontimeupdate = () => {
            if (elRef.current && el.currentTime >= audio.endTime!) {
              el.pause();
              setPreviewing(null);
            }
          };
        }
        el.play()
          .then(() => setPreviewing(audio.value))
          .catch(() => {
            elRef.current = null;
          });
        return;
      }
      const clip = getClip(audio.value);
      const track = getMusicTrack(audio.value);
      if (!clip && !track) return;
      const Ctor = resolveAudioContext();
      const ctx = new Ctor();
      ctxRef.current = ctx;
      ctx
        .resume()
        .then(() => {
          if (clip) clip.play(ctx);
          else if (track) playOnce(ctx, track);
          setPreviewing(audio.value);
        })
        .catch(() => {
          ctxRef.current?.close().catch(() => {});
          ctxRef.current = null;
        });
    },
    [stopAll],
  );

  useEffect(() => () => stopAll(), [stopAll]);

  return { previewing, preview, stopAll };
}

export default function MusicSelector({
  open,
  initial,
  silentValue,
  onClose,
  onSelect,
}: MusicSelectorProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MusicCategoryId | "all">("all");
  const [selected, setSelected] = useState<GreetingAudio | null>(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [trim, setTrim] = useState<{ start?: number; end?: number }>({});
  const { previewing, preview, stopAll } = useSinglePreview();

  const isSelected = (audio: GreetingAudio | null) => {
    if (selected === null && audio === null) return true;
    if (selected === null || audio === null) return false;
    return selected.type === audio.type && selected.value === audio.value;
  };

  const commit = (audio: GreetingAudio | null) => {
    stopAll();
    onSelect(audio);
  };

  const commitFile = () => {
    if (!uploadedUrl) return;
    const audio: GreetingAudio = {
      type: "file",
      value: uploadedUrl,
      ...(trim.start !== undefined ? { startTime: trim.start } : {}),
      ...(trim.end !== undefined ? { endTime: trim.end } : {}),
    };
    commit(audio);
  };

  const pickFile = async (file: File) => {
    setUploadError("");
    try {
      validateAudioFile(file);
    } catch (err) {
      setUploadError(
        err instanceof AudioUploadError ? err.message : "Geçersiz dosya.",
      );
      return;
    }
    setUploading(true);
    setUploadedUrl(null);
    setTrim({});
    try {
      const { url } = await uploadAudioFile(file);
      setUploadedUrl(url);
    } catch (err) {
      setUploadError(
        err instanceof AudioUploadError
          ? err.message
          : "Dosya yüklenemedi, tekrar dene.",
      );
    } finally {
      setUploading(false);
    }
  };

  const items = searchMusicCatalog(query).filter(
    (item) => category === "all" || item.category === category,
  );

  /* eslint-disable react-hooks/set-state-in-effect -- modal açılınca durum sıfırlama gerekli */
  useEffect(() => {
    if (!open) return;
    setSelected(initial);
    setQuery("");
    setCategory("all");
    setUploading(false);
    setUploadError("");
    setUploadedUrl(null);
    setTrim({});
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, initial, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Müzik seç"
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Müzik Seç
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Müzik ara…"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />

          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                category === "all"
                  ? "border-pink-500 ring-2 ring-pink-500/30"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              }`}
            >
              Tümü
            </button>
            {musicCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  category === c.id
                    ? "border-pink-500 ring-2 ring-pink-500/30"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Kendi müziğini yükle
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              MP3, OGG, WAV veya M4A — en fazla 5 MB.
            </p>
            <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              Yüklediğiniz müziğin kullanım ve yayınlama haklarına sahip
              olduğunuzdan emin olun.
            </p>
            <label className="mt-3 inline-block cursor-pointer rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
              {uploading ? "Yükleniyor…" : "Dosya seç"}
              <input
                type="file"
                accept="audio/*,.mp3,.ogg,.wav,.m4a"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickFile(f);
                  e.target.value = "";
                }}
              />
            </label>
            {uploadError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                {uploadError}
              </p>
            )}
            {uploadedUrl && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      preview({ type: "file", value: uploadedUrl, ...trim })
                    }
                    className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    {previewing === uploadedUrl ? "⏹ Durdur" : "▶ Önizle"}
                  </button>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    Yüklendi ✓
                  </span>
                </div>
                <AudioTrimEditor
                  url={uploadedUrl}
                  startTime={trim.start}
                  endTime={trim.end}
                  onChange={(start, end) =>
                    setTrim({ ...(start !== undefined ? { start } : {}), ...(end !== undefined ? { end } : {}) })
                  }
                />
                <button
                  type="button"
                  onClick={commitFile}
                  className="w-full rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pink-500"
                >
                  Bu parçayı kullan
                </button>
              </div>
            )}
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Hazır parçalar
          </p>
          <ul className="mt-2 space-y-1">
            {items.map((item) => {
              const audio: GreetingAudio = { type: "clip", value: item.id };
              const cat = musicCategories.find((c) => c.id === item.category);
              const active = isSelected(audio);
              return (
                <li key={item.id}>
                  <div
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                      active
                        ? "border-pink-500 ring-2 ring-pink-500/30"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => preview(audio)}
                      aria-label={`${item.label} önizle`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      {previewing === item.id ? "⏹" : "▶"}
                    </button>
                    <button
                      type="button"
                      onClick={() => commit(audio)}
                      className="flex-1 text-left"
                    >
                      <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {item.emoji} {item.label}
                      </span>
                      <span className="block text-xs text-zinc-400">
                        {cat?.label} · {item.artist}
                      </span>
                    </button>
                    {active && (
                      <span
                        className="shrink-0 text-emerald-500"
                        aria-hidden
                      >
                        ✓
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
            {items.length === 0 && (
              <li className="py-3 text-center text-sm text-zinc-400">
                Sonuç bulunamadı.
              </li>
            )}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => commit(silentValue)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              isSelected(silentValue)
                ? "border-zinc-500 ring-2 ring-zinc-500/30 dark:border-zinc-300"
                : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
            }`}
          >
            🔇 Müzik yok
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
