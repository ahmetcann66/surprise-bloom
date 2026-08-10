"use client";

import EnvelopeVisual from "@/components/invitation/envelope-visual";
import { EVENT_TYPE_EMOJIS, type EventType } from "@/lib/invitation/types";
import type {
  InvitationAnimation,
  InvitationTheme,
} from "@/lib/invitation/themes";
import { TEXT_FONTS, getTextFont } from "@/lib/fonts";

interface InvitePreviewProps {
  theme: InvitationTheme;
  eventType: EventType;
  animation: InvitationAnimation;
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

// Davetiye oluşturma formundaki canlı önizleme: seçilen zarf rengi,
// animasyon, yazı stili ve boyut ayarları anında görünür.
export default function InvitePreview({
  theme,
  eventType,
  animation,
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

  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 shadow-xl">
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

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{
              color: theme.textColor,
              background: `${theme.centerColor}33`,
              border: `1px solid ${theme.accent}66`,
            }}
          >
            <span aria-hidden>{animation.emoji}</span>
            {animation.label} animasyonu
          </span>
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
      </div>

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
