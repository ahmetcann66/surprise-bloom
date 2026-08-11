"use client";

import { useState } from "react";
import EnvelopeVisual from "@/components/invitation/envelope-visual";
import EffectStage from "@/lib/effects/engine";
import VectorFormEffect from "@/components/vector-form-effect";
import { getEffect } from "@/lib/effects/presets";
import { EVENT_TYPE_EMOJIS, type EventType } from "@/lib/invitation/types";
import type { InvitationTheme } from "@/lib/invitation/themes";
import {
  getInvitationAnimation,
  type InvitationAnimationId,
} from "@/lib/invitation/themes";
import { TEXT_FONTS, getTextFont } from "@/lib/fonts";

interface InvitePreviewProps {
  theme: InvitationTheme;
  eventType: EventType;
  /** Seçilen açılış animasyonları (en fazla 4). */
  animations: InvitationAnimationId[];
  onAnimationsChange: (ids: InvitationAnimationId[]) => void;
  envelopeAnimated: boolean;
  partnerA: string;
  partnerB?: string;
  recipientName?: string;
  textFont: string;
  textSize: number;
  animationSpeed: number;
  animationScale: number;
  onFontChange: (f: string) => void;
  onTextSizeChange: (v: number) => void;
  onAnimationSpeedChange: (v: number) => void;
  onAnimationScaleChange: (v: number) => void;
}

// Davetiye oluşturma formundaki canlı önizleme: seçilen animasyonlar burada
// gerçekten oynar, böylece kullanıcı katkısını görür. Zarf rengi, yazı stili
// ve boyut ayarları da anında yansır.
export default function InvitePreview({
  theme,
  eventType,
  animations,
  onAnimationsChange,
  envelopeAnimated,
  partnerA,
  partnerB,
  recipientName,
  textFont,
  textSize,
  animationSpeed,
  animationScale,
  onFontChange,
  onTextSizeChange,
  onAnimationSpeedChange,
  onAnimationScaleChange,
}: InvitePreviewProps) {
  const monogram = [partnerA.trim(), partnerB?.trim()]
    .filter(Boolean)
    .join(" & ") || "İsim & İsim";
  const [burstRun, setBurstRun] = useState(0);

  const selected = animations
    .map((id) => getInvitationAnimation(id))
    .filter((a): a is NonNullable<typeof a> => !!a);
  const ambients = selected
    .map((a) => getEffect(a.ambient))
    .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i);
  const bursts = selected
    .map((a) => getEffect(a.burst))
    .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i);
  const flowersOn = selected.some((a) => a.flowers);

  function toggle(id: InvitationAnimationId) {
    const active = animations.includes(id);
    if (active) {
      onAnimationsChange(animations.filter((x) => x !== id));
    } else if (animations.length < 4) {
      onAnimationsChange([...animations, id]);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 shadow-xl">
      {/* statik zarf + seçili animasyonlar */}
      <div
        className="relative flex flex-col items-center px-5 py-6"
        style={{ background: theme.background }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: theme.accent }}
        >
          Canlı önizleme
        </p>
        <div className="envelope-float relative mt-4 w-[min(74%,240px)]">
          <EnvelopeVisual
            theme={theme}
            recipientName={recipientName?.trim() || undefined}
            monogram={monogram}
            className="relative w-full drop-shadow-[0_14px_28px_rgba(0,0,0,0.4)]"
          />
        </div>
        <p
          className="mt-3 text-sm font-semibold"
          style={{ color: theme.textColor, fontFamily: getTextFont(textFont) }}
        >
          {monogram}
        </p>
        <p className="text-xs opacity-70" style={{ color: theme.textColor }}>
          {EVENT_TYPE_EMOJIS[eventType]} {theme.label}
        </p>

        {selected.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {selected.map((a) => (
              <span
                key={a.id}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                style={{
                  color: theme.textColor,
                  background: `${theme.centerColor}33`,
                  border: `1px solid ${theme.accent}66`,
                }}
              >
                <span aria-hidden>{a.emoji}</span>
                {a.label}
              </span>
            ))}
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{
                color: theme.textColor,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              {envelopeAnimated ? "✨ Zarf animasyonlu" : "🚫 Zarf animasyonsuz"}
            </span>
          </div>
        )}
      </div>

      {/* canlı animasyon sahnesi */}
      <div
        className="relative aspect-[16/10] w-full overflow-hidden"
        style={{ background: theme.background }}
      >
        {ambients.map((fx) => (
          <div
            key={fx.id}
            className="pointer-events-none absolute inset-0"
            style={{
              transform: `scale(${animationScale})`,
              transformOrigin: "50% 42%",
            }}
          >
            <EffectStage
              config={fx}
              active
              reducedMotion={false}
              origin={{ x: 50, y: 42 }}
              repeat="loop"
              speed={animationSpeed}
            />
          </div>
        ))}
        {flowersOn && (
          <>
            <VectorFormEffect
              config={getEffect("rose")}
              active
              reducedMotion={false}
              position={{ x: 20, y: 44 }}
              scale={1.3 * animationScale}
              speed={animationSpeed}
              repeat="loop"
            />
            <VectorFormEffect
              config={getEffect("peony")}
              active
              reducedMotion={false}
              position={{ x: 80, y: 44 }}
              scale={1.3 * animationScale}
              speed={animationSpeed}
              repeat="loop"
            />
          </>
        )}
        {burstRun > 0 &&
          bursts.map((fx) => (
            <div
              key={`${burstRun}-${fx.id}`}
              className="pointer-events-none absolute inset-0"
              style={{
                transform: `scale(${animationScale})`,
                transformOrigin: "50% 30%",
              }}
            >
              <EffectStage
                config={fx}
                active
                reducedMotion={false}
                origin={{ x: 50, y: 30 }}
                speed={animationSpeed}
              />
            </div>
          ))}
        <p
          className="absolute left-3 top-2 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80"
          style={{ color: theme.textColor }}
        >
          Canlı animasyon
        </p>
        <button
          type="button"
          onClick={() => setBurstRun((r) => r + 1)}
          className="absolute bottom-2 right-2 rounded-full border border-white/30 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
        >
          ▶ Patlamayı izle
        </button>
      </div>

      {/* animasyon seçimi */}
      <div className="border-t border-white/10 bg-zinc-50 p-4 dark:bg-zinc-900">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Animasyonlar{" "}
          <span className="font-normal normal-case">
            ({animations.length}/4 — önizlemede canlı izlenir)
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {selected.length === 0 && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Henüz seçim yok — yukarıdan ekle.
            </span>
          )}
          {selected.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              className="flex items-center gap-1.5 rounded-full border border-pink-500 bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-700 transition-colors hover:bg-pink-100 dark:bg-pink-500/10 dark:text-pink-200 dark:hover:bg-pink-500/20"
            >
              <span aria-hidden>{a.emoji}</span>
              {a.label}
              <span aria-hidden>✕</span>
            </button>
          ))}
        </div>
      </div>

      {/* yazı + animasyon ayarları */}
      <div className="space-y-4 border-t border-white/10 bg-zinc-50 p-4 dark:bg-zinc-900">
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
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                  style={{ fontFamily: f.family }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <SliderRow
          id="invite-text-size"
          label="Yazı boyutu"
          value={textSize}
          min={0.5}
          max={2.5}
          onChange={onTextSizeChange}
        />
        <SliderRow
          id="invite-anim-speed"
          label="Animasyon hızı"
          value={animationSpeed}
          min={0.4}
          max={3}
          onChange={onAnimationSpeedChange}
          display={(v) => `×${v.toFixed(2)}`}
        />
        <SliderRow
          id="invite-anim-scale"
          label="Animasyon boyutu"
          value={animationScale}
          min={0.4}
          max={3}
          onChange={onAnimationScaleChange}
        />
      </div>
    </div>
  );
}

function SliderRow({
  id,
  label,
  value,
  min,
  max,
  onChange,
  display,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  display?: (v: number) => string;
}) {
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
