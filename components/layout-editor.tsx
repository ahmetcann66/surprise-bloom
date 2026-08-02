"use client";

/* eslint-disable react-hooks/refs -- sürükleme durumu sadece event handler'larında yazılıyor */

import { useRef, useState } from "react";
import type { Theme } from "@/lib/types";
import type { EffectConfig } from "@/lib/effects/types";
import EffectStage from "@/lib/effects/engine";

export interface Pos {
  x: number;
  y: number;
}

interface LayoutEditorProps {
  photo?: string;
  name: string;
  message: string;
  theme: Theme;
  effect: EffectConfig;
  photoPos: Pos;
  textPos: Pos;
  onChange: (photoPos: Pos, textPos: Pos) => void;
}

export default function LayoutEditor({
  photo,
  name,
  message,
  theme,
  effect,
  photoPos,
  textPos,
  onChange,
}: LayoutEditorProps) {
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [opened, setOpened] = useState(false);
  const [runId, setRunId] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<"photo" | "text" | null>(null);

  const clamp = (v: number) => Math.min(95, Math.max(5, v));

  function onPointerDown(which: "photo" | "text") {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      dragRef.current = which;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // sentetik/eksik pointer durumunda yok say
      }
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width === 0) return;
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100);
    if (dragRef.current === "photo") {
      onChange({ x, y }, textPos);
    } else {
      onChange(photoPos, { x, y });
    }
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  const deviceFrame =
    device === "phone"
      ? "aspect-[9/16] max-h-[60vh]"
      : "aspect-video max-h-[48vh]";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Önizleme ve konum
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDevice("phone")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              device === "phone"
                ? "border-pink-500 ring-2 ring-pink-500/30"
                : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
            }`}
          >
            📱 Telefon
          </button>
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              device === "desktop"
                ? "border-pink-500 ring-2 ring-pink-500/30"
                : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
            }`}
          >
            💻 Web
          </button>
        </div>
      </div>

      <div
        ref={frameRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`relative mx-auto mt-3 w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl select-none ${deviceFrame}`}
        style={{ background: theme.background, color: theme.textColor, touchAction: "none" }}
      >
        <EffectStage
          key={runId}
          config={effect}
          active={opened}
          reducedMotion={false}
        />

        {!opened && (
          <button
            type="button"
            onClick={() => setOpened(true)}
            aria-label="Önizlemede sürprizi aç"
            className="absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-3xl shadow-lg transition-transform hover:scale-110 active:scale-95"
            style={{
              background: theme.centerColor,
              boxShadow: `0 0 2rem ${theme.accent}66`,
            }}
          >
            <span aria-hidden>{effect.emoji}</span>
          </button>
        )}

        {photo && (
          /* eslint-disable-next-line @next/next/no-img-element -- sürüklenebilir önizleme */
          <img
            src={photo}
            alt=""
            onPointerDown={onPointerDown("photo")}
            className="absolute z-10 h-24 w-24 touch-none rounded-full border-4 border-white/50 object-cover shadow-xl"
            style={{
              left: `${photoPos.x}%`,
              top: `${photoPos.y}%`,
              transform: "translate(-50%, -50%)",
              cursor: "grab",
              boxShadow: `0 0 1.5rem ${theme.accent}66`,
            }}
            draggable={false}
          />
        )}

        <div
          onPointerDown={onPointerDown("text")}
          className="absolute z-10 w-[70%] cursor-grab touch-none text-center drop-shadow-lg"
          style={{
            left: `${textPos.x}%`,
            top: `${textPos.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <p className="text-2xl font-bold leading-tight">{name || "İsim burada"}</p>
          <p className="mt-1 text-sm leading-snug opacity-90">
            {message || "Mesajın burada görünecek."}
          </p>
        </div>

        {opened && (
          <button
            type="button"
            onClick={() => setRunId((r) => r + 1)}
            className="absolute right-2 top-2 z-20 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs text-white backdrop-blur-md"
          >
            ↻ Tekrar oynat
          </button>
        )}
      </div>

      <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Fotoğrafı ve yazıyı istediğin yere sürükle • ortadaki butona basarak
        animasyonu izle
      </p>

      {(photoPos.x !== 50 || photoPos.y !== 50 || textPos.x !== 50 || textPos.y !== 75) && (
        <button
          type="button"
          onClick={() => onChange({ x: 50, y: 50 }, { x: 50, y: 75 })}
          className="mt-2 w-full text-center text-xs text-zinc-500 underline-offset-4 hover:underline"
        >
          Konumları sıfırla
        </button>
      )}
    </div>
  );
}
