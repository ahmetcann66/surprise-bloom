"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import EnvelopeVisual from "@/components/invitation/envelope-visual";
import EffectStage from "@/lib/effects/engine";
import VectorFormEffect from "@/components/vector-form-effect";
import EffectSettings, {
  type EffectSettingsItem,
} from "@/components/effect-settings";
import { getEffect } from "@/lib/effects/presets";
import { isVectorFlower } from "@/lib/effects/flowers";
import { getAnimation, type UnifiedAnimation } from "@/lib/animations";
import { useEnvelopeAnimation } from "@/hooks/use-envelope-animation";
import {
  EVENT_TYPE_EMOJIS,
  type EventType,
  type InvitationLayoutPos,
} from "@/lib/invitation/types";
import type { InvitationTheme } from "@/lib/invitation/themes";
import { TEXT_FONTS, getTextFont } from "@/lib/fonts";

interface InvitePreviewProps {
  theme: InvitationTheme;
  eventType: EventType;
  /** Seçilen açılış animasyonları (en fazla 4). */
  animations: string[];
  onAnimationsChange: (ids: string[]) => void;
  envelopeAnimated: boolean;
  partnerA: string;
  partnerB?: string;
  recipientName?: string;
  photo?: string;
  textFont: string;
  textSize: number;
  animationSpeed: number;
  animationScale: number;
  textPos: InvitationLayoutPos;
  photoPos: InvitationLayoutPos;
  animationPlacements: Record<string, InvitationLayoutPos>;
  onFontChange: (f: string) => void;
  onTextSizeChange: (v: number) => void;
  onAnimationSpeedChange: (v: number) => void;
  onAnimationScaleChange: (v: number) => void;
  onTextPosChange: (p: InvitationLayoutPos) => void;
  onPhotoPosChange: (p: InvitationLayoutPos) => void;
  onAnimationPosChange: (
    id: string,
    p: InvitationLayoutPos,
  ) => void;
}

const DEFAULT_TEXT_POS = { x: 50, y: 88 };
const DEFAULT_PHOTO_POS = { x: 50, y: 72, scale: 1 };
const DEFAULT_ANIM_POS = { x: 50, y: 42 };

const clampPct = (v: number) => Math.min(100, Math.max(0, v));

// Davetiye oluşturma formundaki canlı önizleme. İki panel:
// 1) Zarf önizlemesi — zarf her zaman görünür; "Zarfı aç" ile açılışı izlenir.
// 2) Davetiye sayfası — tam akış: kapalı zarf → açılır → davetiye çıkar → seçili
//    tüm efektler oynar. Yazı, fotoğraf ve animasyon pinleri sürüklenip
//    ölçeklenebilir; seçimler gerçek davetiyeye aynen yansır.
export default function InvitePreview({
  theme,
  eventType,
  animations,
  onAnimationsChange,
  envelopeAnimated,
  partnerA,
  partnerB,
  recipientName,
  photo,
  textFont,
  textSize,
  animationSpeed,
  animationScale,
  textPos,
  photoPos,
  animationPlacements,
  onFontChange,
  onTextSizeChange,
  onAnimationSpeedChange,
  onAnimationScaleChange,
  onTextPosChange,
  onPhotoPosChange,
  onAnimationPosChange,
}: InvitePreviewProps) {
  const placeholder =
    eventType === "dugun" || eventType === "nikah"
      ? "Gelin & Damat"
      : "İsim & İsim";
  const monogram = [partnerA.trim(), partnerB?.trim()]
    .filter(Boolean)
    .join(" & ") || placeholder;
  const [burstRun, setBurstRun] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);

  const selected = animations
    .map((id) => getAnimation(id))
    .filter((a): a is UnifiedAnimation => !!a);
  const bursts = selected
    .map((a) => getEffect(a.burst))
    .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i);
  const flowersOn = selected.some((a) => a.flowers);

  // Üstteki küçük zarf paneli — açılınca tekrar kapanır (tekrar izlenebilir).
  const {
    wrapRef: topWrapRef,
    flapRef: topFlapRef,
    sealRef: topSealRef,
    letterRef: topLetterRef,
    play: topPlay,
    reset: topReset,
  } = useEnvelopeAnimation({
    enabled: envelopeAnimated,
    speed: animationSpeed,
  });

  // Alttaki geniş davetiye paneli — tam akış: kapalı zarf → açıl → davetiye → efektler.
  const {
    wrapRef: wideWrapRef,
    flapRef: wideFlapRef,
    sealRef: wideSealRef,
    letterRef: wideLetterRef,
    play: widePlay,
    reset: wideReset,
  } = useEnvelopeAnimation({
    enabled: envelopeAnimated,
    speed: animationSpeed,
    keepHidden: true,
    onOpen: () => {
      setRevealed(true);
      setBurstRun((r) => r + 1);
    },
  });

  function restartPreview() {
    setRevealed(false);
    wideReset();
  }

  function toggle(id: string) {
    const active = animations.includes(id);
    if (active) {
      onAnimationsChange(animations.filter((x) => x !== id));
    } else if (animations.length < 4) {
      onAnimationsChange([...animations, id]);
    }
  }

  const effectSettingsItems: EffectSettingsItem[] = selected.map((a) => {
    const p = animationPlacements[a.id] ?? {};
    return {
      id: a.id,
      label: a.label,
      emoji: a.emoji,
      scale: p.scale ?? 1,
      speed: p.speed ?? animationSpeed,
      repeat: p.repeat,
      repeatEvery: p.repeatEvery,
    };
  });

  function updateAnimationSettings(
    id: string,
    patch: Partial<InvitationLayoutPos>,
  ) {
    onAnimationPosChange(id, { ...(animationPlacements[id] ?? {}), ...patch });
  }

  const tx = textPos.x ?? DEFAULT_TEXT_POS.x;
  const ty = textPos.y ?? DEFAULT_TEXT_POS.y;
  const px = photoPos.x ?? DEFAULT_PHOTO_POS.x;
  const py = photoPos.y ?? DEFAULT_PHOTO_POS.y;
  const photoScale = photoPos.scale ?? DEFAULT_PHOTO_POS.scale;
  const fontFamily = getTextFont(textFont);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 shadow-xl">
      {/* zarf önizlemesi (her zaman görünür) */}
      <div
        className="relative flex flex-col items-center px-5 py-6"
        style={{ background: theme.background }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: theme.accent }}
        >
          Zarf önizlemesi
        </p>
        <div className="envelope-float relative mt-4 w-[min(74%,220px)]">
          <div
            ref={topWrapRef}
            className="relative w-full"
            style={{ perspective: "1000px" }}
          >
            <EnvelopeVisual
              theme={theme}
              recipientName={recipientName?.trim() || undefined}
              monogram={monogram}
              className="relative w-full drop-shadow-[0_14px_28px_rgba(0,0,0,0.4)]"
              flapRef={topFlapRef}
              sealRef={topSealRef}
              letterRef={topLetterRef}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={topPlay}
            className="rounded-full border border-pink-500 bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-700 transition-colors hover:bg-pink-100 dark:bg-pink-500/10 dark:text-pink-200 dark:hover:bg-pink-500/20"
          >
            ▶ Zarfı aç
          </button>
          <button
            type="button"
            onClick={topReset}
            className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            ↺ Sıfırla
          </button>
        </div>
        <p
          className="mt-3 text-xs opacity-70"
          style={{ color: theme.textColor }}
        >
          {envelopeAnimated
            ? "Zarf açılışını burada izle — davetiyeyi aşağıda düzenle."
            : "Zarf animasyonu kapalı, davetiyeyi aşağıda düzenle."}
        </p>
      </div>

      {/* davetiye sayfası önizlemesi — kapalı zarftan başlayan tam akış */}
      <div
        ref={stageRef}
        className="relative aspect-[16/10] w-full overflow-hidden"
        style={{ background: theme.background }}
      >
        <p
          className="pointer-events-none absolute left-3 top-2 z-40 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80"
          style={{ color: theme.textColor }}
        >
          Davetiye önizlemesi
        </p>

        {!revealed ? (
          /* 1) kapalı zarf — akışın başlangıcı */
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <div
              ref={wideWrapRef}
              className="relative w-[min(46%,230px)]"
              style={{ perspective: "1000px" }}
            >
              <EnvelopeVisual
                theme={theme}
                recipientName={recipientName?.trim() || undefined}
                monogram={monogram}
                className="relative w-full drop-shadow-[0_14px_28px_rgba(0,0,0,0.4)]"
                flapRef={wideFlapRef}
                sealRef={wideSealRef}
                letterRef={wideLetterRef}
              />
            </div>
            <button
              type="button"
              onClick={widePlay}
              className="mt-6 rounded-full border border-pink-500 bg-pink-50 px-5 py-2 text-sm font-medium text-pink-700 transition-colors hover:bg-pink-100 dark:bg-pink-500/10 dark:text-pink-200 dark:hover:bg-pink-500/20"
            >
              ▶ Davetiyeyi izle
            </button>
            <p
              className="mt-3 max-w-sm text-center text-xs opacity-70"
              style={{ color: theme.textColor }}
            >
              {envelopeAnimated
                ? "Kapalı zarftan başlar — zarf açılır, davetiye çıkar, seçili tüm efektler patlar."
                : "Zarf animasyonu kapalı — butona basınca doğrudan davetiyeye geçer."}
            </p>
          </div>
        ) : (
          <>
            {/* 2) açılış sonrası: davetiye + tüm seçili efektler */}
            {/* animasyonlar — pin konumunu takip eder; çiçekler vektör player'la çizilir */}
            {selected.map((a) => {
              const p = animationPlacements[a.id] ?? {};
              const ax = p.x ?? DEFAULT_ANIM_POS.x;
              const ay = p.y ?? DEFAULT_ANIM_POS.y;
              const scale = animationScale * (p.scale ?? 1);
              const speed = p.speed ?? animationSpeed;
              if (isVectorFlower(a.id)) {
                return (
                  <VectorFormEffect
                    key={`${a.id}-${Math.round(ax)}-${Math.round(ay)}`}
                    config={getEffect(a.ambient)}
                    active
                    reducedMotion={false}
                    position={{ x: ax, y: ay }}
                    scale={scale}
                    speed={speed}
                    repeat={p.repeat}
                  />
                );
              }
              return (
                <div
                  key={a.id}
                  className="pointer-events-none absolute inset-0"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: `${ax}% ${ay}%`,
                  }}
                >
                  <EffectStage
                    key={`${a.id}-${Math.round(ax)}-${Math.round(ay)}`}
                    config={getEffect(a.ambient)}
                    active
                    reducedMotion={false}
                    origin={{ x: ax, y: ay }}
                    repeat={p.repeat ?? "loop"}
                    repeatEvery={p.repeatEvery ?? 15}
                    speed={speed}
                  />
                </div>
              );
            })}
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

            {photo && (
              <DraggableItem
                stageRef={stageRef}
                x={px}
                y={py}
                onChange={(p) => onPhotoPosChange({ ...photoPos, ...p })}
                className="absolute z-20 rounded-2xl border-2 p-1.5"
                style={{
                  left: `${px}%`,
                  top: `${py}%`,
                  transform: "translate(-50%, -50%)",
                  borderColor: `${theme.accent}99`,
                  background: `${theme.accent}22`,
                  boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`${monogram} fotoğrafı`}
                  className="pointer-events-none rounded-xl object-cover"
                  style={{
                    width: `${128 * photoScale}px`,
                    maxWidth: "40%",
                    maxHeight: "70%",
                  }}
                />
              </DraggableItem>
            )}

            <DraggableItem
              stageRef={stageRef}
              x={tx}
              y={ty}
              onChange={(p) => onTextPosChange({ ...textPos, ...p })}
              className="absolute z-10 w-[80%] max-w-sm text-center"
              style={{
                left: `${tx}%`,
                top: `${ty}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.28em]"
                style={{ color: theme.accent }}
              >
                {recipientName?.trim()
                  ? `Sevgili ${recipientName.trim()}`
                  : "Davetlisin"}
              </p>
              <h1
                className="mt-1 font-bold"
                style={{
                  fontFamily,
                  fontSize: `clamp(${(1.4 * textSize).toFixed(2)}rem, ${
                    4 * textSize
                  }vw, ${(1.9 * textSize).toFixed(2)}rem)`,
                }}
              >
                {monogram}
              </h1>
              <div
                className="mx-auto mt-2 flex max-w-sm items-center justify-center gap-2 text-[11px] opacity-90"
                style={{ fontFamily }}
              >
                <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1">
                  {EVENT_TYPE_EMOJIS[eventType]} {theme.label}
                </span>
              </div>
            </DraggableItem>

            {/* animasyon odakları (sürüklenebilir pinler) */}
            {selected.map((a) => {
              const p = animationPlacements[a.id] ?? {};
              const ax = p.x ?? DEFAULT_ANIM_POS.x;
              const ay = p.y ?? DEFAULT_ANIM_POS.y;
              return (
                <DraggableItem
                  key={a.id}
                  stageRef={stageRef}
                  x={ax}
                  y={ay}
                  onChange={(np) => onAnimationPosChange(a.id, { ...p, ...np })}
                  className="absolute z-30 flex h-6 w-6 items-center justify-center rounded-full border border-white/60 bg-black/40 text-xs backdrop-blur-sm"
                  style={{
                    left: `${ax}%`,
                    top: `${ay}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <span aria-hidden>{a.emoji}</span>
                </DraggableItem>
              );
            })}

            <button
              type="button"
              onClick={() => setBurstRun((r) => r + 1)}
              className="absolute bottom-2 right-24 rounded-full border border-white/30 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
            >
              ↻ Tekrar patlat
            </button>
            <button
              type="button"
              onClick={restartPreview}
              className="absolute bottom-2 right-2 rounded-full border border-white/30 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
            >
              ↺ Baştan
            </button>
          </>
        )}
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

      {/* yazı + fotoğraf + animasyon ayarları */}
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

        <p className="text-xs text-zinc-400">
          ✋ Yazıyı, fotoğrafı ve animasyon simgelerini (emoji pinlerini)
          sürükleyerek yerini değiştir — gerçek davetiyeye aynen yansır.
        </p>

        <SliderRow
          id="invite-text-size"
          label="Yazı boyutu"
          value={textSize}
          min={0.5}
          max={2.5}
          onChange={onTextSizeChange}
        />
        {photo && (
          <SliderRow
            id="invite-photo-scale"
            label="Fotoğraf boyutu"
            value={photoScale}
            min={0.4}
            max={3}
            onChange={(v) => onPhotoPosChange({ ...photoPos, scale: v })}
          />
        )}
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
        {effectSettingsItems.length > 0 && (
          <EffectSettings
            items={effectSettingsItems}
            onScaleChange={(id, v) =>
              updateAnimationSettings(id, { scale: v })
            }
            onSpeedChange={(id, v) =>
              updateAnimationSettings(id, { speed: v })
            }
            onRepeatChange={(id, repeat) =>
              updateAnimationSettings(
                id,
                repeat === undefined
                  ? { repeat: undefined, repeatEvery: undefined }
                  : { repeat },
              )
            }
            onRepeatEveryChange={(id, v) =>
              updateAnimationSettings(id, { repeatEvery: v })
            }
          />
        )}
      </div>
    </div>
  );
}

// Sürüklenebilir öğe: pointer olaylarıyla yüzde konumunu günceller.
function DraggableItem({
  stageRef,
  x,
  y,
  onChange,
  children,
  className,
  style,
}: {
  stageRef: RefObject<HTMLDivElement | null>;
  x: number;
  y: number;
  onChange: (p: InvitationLayoutPos) => void;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const infoRef = useRef<{
    px: number;
    py: number;
    startX: number;
    startY: number;
  } | null>(null);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    const stage = stageRef.current;
    if (!stage) return;
    e.preventDefault();
    infoRef.current = {
      px: x,
      py: y,
      startX: e.clientX,
      startY: e.clientY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const info = infoRef.current;
    const stage = stageRef.current;
    if (!info || !stage) return;
    const rect = stage.getBoundingClientRect();
    onChange({
      x: clampPct(info.px + ((e.clientX - info.startX) / rect.width) * 100),
      y: clampPct(info.py + ((e.clientY - info.startY) / rect.height) * 100),
    });
  }

  function onPointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    infoRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  return (
    <div
      className={`cursor-grab touch-none select-none active:cursor-grabbing ${className ?? ""}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      {children}
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
