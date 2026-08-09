"use client";

/* eslint-disable react-hooks/refs -- sürükleme durumu sadece event handler'larında yazılıyor */

import { useRef, useState } from "react";
import type { EffectPlacement, Theme } from "@/lib/types";
import EffectStage from "@/lib/effects/engine";
import VectorFormEffect from "@/components/vector-form-effect";
import { getEffect } from "@/lib/effects/presets";
import { isVectorFlower } from "@/lib/effects/flowers";
import { TEXT_FONTS, getTextFont } from "@/lib/fonts";

export interface Pos {
  x: number;
  y: number;
  scale?: number;
  fontSize?: number;
}

interface LayoutEditorProps {
  photo?: string;
  video?: string;
  name: string;
  message: string;
  theme: Theme;
  effects: EffectPlacement[];
  photoPos: Pos;
  textPos: Pos;
  videoScale: number;
  animationSpeed: number;
  textFont: string;
  onSpeedChange: (v: number) => void;
  onFontChange: (f: string) => void;
  onChange: (
    photoPos: Pos,
    textPos: Pos,
    videoScale: number,
    effects: EffectPlacement[],
  ) => void;
}

const PHOTO_BASE = 96;
const VIDEO_BASE = 20;
const clampScale = (v: number) => Math.min(2.5, Math.max(0.5, v));
const clampFs = (v: number) => Math.min(2.2, Math.max(0.6, v));

interface ScaleSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  display?: (v: number) => string;
}

function ScaleSlider({ id, label, value, min, max, onChange, display }: ScaleSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-medium text-zinc-600 dark:text-zinc-300"
        >
          {label}
        </label>
        <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
          {display ? display(value) : `%${Math.round(value * 100)}`}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
        className="mt-2 w-full accent-pink-500"
      />
    </div>
  );
}

export default function LayoutEditor({
  photo,
  video,
  name,
  message,
  theme,
  effects,
  photoPos,
  textPos,
  videoScale,
  animationSpeed,
  textFont,
  onSpeedChange,
  onFontChange,
  onChange,
}: LayoutEditorProps) {
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [opened, setOpened] = useState(false);
  const [runId, setRunId] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<
    "photo" | "text" | "photo-resize" | "text-resize" | "effect" | null
  >(null);
  const startRef = useRef<{
    x: number;
    y: number;
    scale?: number;
    fontSize?: number;
    index?: number;
  }>({ x: 0, y: 0 });

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

  function onEffectDragStart(index: number) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = "effect";
      startRef.current = { x: e.clientX, y: e.clientY, index };
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // yok say
      }
    };
  }

  function onResizeStart(which: "photo" | "text") {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = which === "photo" ? "photo-resize" : "text-resize";
      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        scale: which === "photo" ? photoPos.scale ?? 1 : undefined,
        fontSize: which === "text" ? textPos.fontSize ?? 1 : undefined,
      };
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // yok say
      }
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const frame = frameRef.current;
    if (!frame || !dragRef.current) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width === 0) return;
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100);

    switch (dragRef.current) {
      case "photo":
        onChange({ ...photoPos, x, y }, textPos, videoScale, effects);
        break;
      case "text":
        onChange(photoPos, { ...textPos, x, y }, videoScale, effects);
        break;
      case "effect": {
        const index = startRef.current.index;
        if (index === undefined) break;
        onChange(
          photoPos,
          textPos,
          videoScale,
          effects.map((ep, i) => (i === index ? { ...ep, x, y } : ep)),
        );
        break;
      }
      case "photo-resize": {
        const cx = (photoPos.x / 100) * rect.width;
        const cy = (photoPos.y / 100) * rect.height;
        const d0 = Math.hypot(startRef.current.x - cx, startRef.current.y - cy) || 1;
        const d1 = Math.hypot(e.clientX - cx, e.clientY - cy);
        onChange(
          { ...photoPos, scale: clampScale((startRef.current.scale ?? 1) * (d1 / d0)) },
          textPos,
          videoScale,
          effects,
        );
        break;
      }
      case "text-resize": {
        const dx = (e.clientX - startRef.current.x) / rect.width;
        onChange(
          photoPos,
          { ...textPos, fontSize: clampFs((startRef.current.fontSize ?? 1) * (1 + dx)) },
          videoScale,
          effects,
        );
        break;
      }
    }
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  const deviceFrame =
    device === "phone"
      ? "aspect-[9/16] max-h-[60vh]"
      : "aspect-video max-h-[48vh]";

  const photoScale = photoPos.scale ?? 1;
  const fontSize = textPos.fontSize ?? 1;
  const photoSize = PHOTO_BASE * photoScale;

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
        {effects.map((ep, index) => {
          const cfg = getEffect(ep.id);
          const pos = { x: ep.x ?? 50, y: ep.y ?? 50 };
          const scale = ep.scale ?? 1;
          if (isVectorFlower(ep.id)) {
            return (
              <VectorFormEffect
                key={`${runId}-v-${index}`}
                config={cfg}
                active={opened}
                reducedMotion={false}
                scale={scale}
                position={pos}
                speed={ep.speed ?? animationSpeed}
                repeat={ep.repeat}
                repeatEvery={ep.repeatEvery}
              />
            );
          }
          return (
            <div
              key={`${runId}-p-${index}`}
              className="absolute inset-0 z-[1]"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: `${pos.x}% ${pos.y}%`,
              }}
            >
              <EffectStage
                config={cfg}
                active={opened}
                reducedMotion={false}
                origin={pos}
                speed={ep.speed ?? animationSpeed}
                repeat={ep.repeat}
                repeatEvery={ep.repeatEvery}
              />
            </div>
          );
        })}

        {effects.map((ep, index) => {
          const cfg = getEffect(ep.id);
          return (
            <span
              key={`marker-${index}`}
              role="button"
              tabIndex={0}
              aria-label={`${cfg.label} başlangıç konumunu sürükle`}
              onPointerDown={onEffectDragStart(index)}
              className="absolute z-40 flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-full border border-white bg-black/50 text-sm shadow-lg backdrop-blur-sm transition-transform hover:scale-110"
              style={{
                left: `${ep.x ?? 50}%`,
                top: `${ep.y ?? 50}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {cfg.emoji}
            </span>
          );
        })}

        {!opened && (
          <button
            type="button"
            onClick={() => setOpened(true)}
            aria-label="Önizlemede sürprizi aç"
            className="absolute left-1/2 top-1/2 z-50 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-3xl shadow-lg transition-transform hover:scale-110 active:scale-95"
            style={{
              background: theme.centerColor,
              boxShadow: `0 0 2rem ${theme.accent}66`,
            }}
          >
            <span aria-hidden>{effects[0]?.id ? getEffect(effects[0].id).emoji : "🎁"}</span>
          </button>
        )}

        {photo && (
          <div
            className="absolute z-10"
            style={{
              left: `${photoPos.x}%`,
              top: `${photoPos.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- sürüklenebilir önizleme */}
            <img
              src={photo}
              alt=""
              onPointerDown={onPointerDown("photo")}
              draggable={false}
              className="touch-none rounded-full border-4 border-white/50 object-cover shadow-xl"
              style={{
                width: photoSize,
                height: photoSize,
                cursor: "grab",
                boxShadow: `0 0 1.5rem ${theme.accent}66`,
              }}
            />
            <span
              role="button"
              tabIndex={0}
              aria-label="Fotoğrafı büyüt/küçült"
              onPointerDown={onResizeStart("photo")}
              className="absolute -bottom-1 -right-1 z-30 block h-3.5 w-3.5 cursor-nwse-resize rounded-sm border border-white bg-pink-500 shadow"
            />
          </div>
        )}

        <div
          onPointerDown={onPointerDown("text")}
          className="absolute z-10 w-[70%] cursor-grab touch-none text-center drop-shadow-lg"
          style={{
            left: `${textPos.x}%`,
            top: `${textPos.y}%`,
            transform: "translate(-50%, -50%)",
            fontSize: `${1.5 * fontSize}rem`,
            fontFamily: getTextFont(textFont),
          }}
        >
          <p className="text-[1em] font-bold leading-tight">
            {name || "İsim burada"}
          </p>
          <p className="mt-1 text-[0.583em] leading-snug opacity-90">
            {message || "Mesajın burada görünecek."}
          </p>
          {video && (
            <video
              src={video}
              muted
              playsInline
              preload="metadata"
              className="mx-auto mt-2 pointer-events-none rounded-xl object-cover shadow-lg"
              style={{
                width: `${VIDEO_BASE * videoScale}rem`,
                maxWidth: "100%",
                aspectRatio: "16/9",
              }}
            />
          )}
          <span
            role="button"
            tabIndex={0}
            aria-label="Yazıyı büyüt/küçült"
            onPointerDown={onResizeStart("text")}
            className="absolute -bottom-1 -right-1 z-30 block h-3.5 w-3.5 cursor-ew-resize rounded-sm border border-white bg-pink-500 shadow"
          />
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

      <div className="mt-3 space-y-4 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Yazı stili
          </p>
          <div className="flex flex-wrap gap-2">
            {TEXT_FONTS.map((f) => {
              const active = textFont === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onFontChange(f.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                    active
                      ? "border-pink-500 ring-2 ring-pink-500/30"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                  }`}
                  style={{ fontFamily: f.family }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ScaleSlider
            id="photo-scale"
            label="Fotoğraf boyutu"
            value={photoPos.scale ?? 1}
            min={0.5}
            max={2.5}
            onChange={(v) => onChange({ ...photoPos, scale: v }, textPos, videoScale, effects)}
          />
          <ScaleSlider
            id="text-scale"
            label="Yazı boyutu"
            value={textPos.fontSize ?? 1}
            min={0.6}
            max={2.2}
            onChange={(v) => onChange(photoPos, { ...textPos, fontSize: v }, videoScale, effects)}
          />
          <ScaleSlider
            id="video-scale"
            label="Video boyutu"
            value={videoScale}
            min={0.5}
            max={2.5}
            onChange={(v) => onChange(photoPos, textPos, v, effects)}
          />
          <ScaleSlider
            id="animation-speed"
            label="Animasyon hızı"
            value={animationSpeed}
            min={0.4}
            max={3}
            onChange={onSpeedChange}
            display={(v) => `×${v.toFixed(2)}`}
          />
        </div>
        {effects.length > 0 && (
          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Efekt boyutları
            </p>
            <div className="space-y-3">
              {effects.map((ep, index) => {
                const cfg = getEffect(ep.id);
                const val = ep.scale ?? 1;
                const patch = (p: Partial<EffectPlacement>) =>
                  onChange(
                    photoPos,
                    textPos,
                    videoScale,
                    effects.map((x, i) => (i === index ? { ...x, ...p } : x)),
                  );
                return (
                  <div key={ep.id}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {cfg.emoji} {cfg.label}
                      </span>
                      <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                        %{Math.round(val * 100)}
                      </span>
                    </div>
                    <input
                      id={`effect-scale-${ep.id}`}
                      type="range"
                      min={0.4}
                      max={3}
                      step={0.05}
                      value={val}
                      onChange={(e) =>
                        patch({ scale: Number.parseFloat(e.target.value) })
                      }
                      className="mt-2 w-full accent-pink-500"
                    />
                    <div className="mt-1.5 flex items-center justify-between">
                      <label
                        htmlFor={`effect-speed-${ep.id}`}
                        className="text-[11px] text-zinc-500 dark:text-zinc-400"
                      >
                        Hız
                      </label>
                      <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                        ×{(ep.speed ?? animationSpeed).toFixed(2)}
                      </span>
                    </div>
                    <input
                      id={`effect-speed-${ep.id}`}
                      type="range"
                      min={0.4}
                      max={3}
                      step={0.05}
                      value={ep.speed ?? animationSpeed}
                      onChange={(e) =>
                        patch({ speed: Number.parseFloat(e.target.value) })
                      }
                      className="mt-1 w-full accent-pink-500"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`${cfg.label} tekrar modu`}
                        value={ep.repeat ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          patch(
                            v === ""
                              ? { repeat: undefined, repeatEvery: undefined }
                              : { repeat: v as EffectPlacement["repeat"] },
                          );
                        }}
                        className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 outline-none transition-colors focus:border-pink-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                      >
                        <option value="">Varsayılan</option>
                        <option value="once">Bir kez</option>
                        <option value="loop">Sürekli</option>
                        <option value="every">Her N sn&apos;de</option>
                      </select>
                      {ep.repeat === "every" && (
                        <label className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                          her
                          <input
                            type="number"
                            min={3}
                            max={120}
                            step={1}
                            value={ep.repeatEvery ?? 15}
                            onChange={(e) =>
                              patch({
                                repeatEvery: Math.min(
                                  120,
                                  Math.max(3, Number(e.target.value) || 15),
                                ),
                              })
                            }
                            className="w-14 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 outline-none transition-colors focus:border-pink-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                          />
                          saniyede bir
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Fotoğraf/yazıyı sürükle • emoji marker&apos;larını sürükleyerek her animasyonun
        başlangıç noktasını ayarla • her efektin boyutunu kendi slider&apos;ından değiştir
      </p>

      {(photoPos.x !== 50 ||
        photoPos.y !== 50 ||
        textPos.x !== 50 ||
        textPos.y !== 75 ||
        photoScale !== 1 ||
        fontSize !== 1 ||
        videoScale !== 1 ||
        textFont !== "system" ||
        effects.some(
          (e) => e.x !== 50 || e.y !== 50 || (e.scale ?? 1) !== 1,
        )) && (
        <button
          type="button"
          onClick={() => {
            onFontChange("system");
            onChange(
              { x: 50, y: 50, scale: 1 },
              { x: 50, y: 75, fontSize: 1 },
              1,
              effects.map((e) => ({ ...e, x: 50, y: 50, scale: 1 })),
            );
          }}
          className="mt-2 w-full text-center text-xs text-zinc-500 underline-offset-4 hover:underline"
        >
          Konum ve boyutları sıfırla
        </button>
      )}
    </div>
  );
}
