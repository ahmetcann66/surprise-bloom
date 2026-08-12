"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { FigureSvg } from "@/components/invitation/figures-svg";
import { buildFigure, figuresFor } from "@/lib/invitation/figures";
import { getEffect } from "@/lib/effects/presets";
import { isVectorFlower } from "@/lib/effects/flowers";
import EffectStage from "@/lib/effects/engine";
import VectorFormEffect from "@/components/vector-form-effect";
import { getTextFont } from "@/lib/fonts";
import { getAnimation, resolveAnimations, type UnifiedAnimation } from "@/lib/animations";
import {
  formatDate,
  type EventType,
  type InvitationLayoutPos,
} from "@/lib/invitation/types";
import type { InvitationTheme } from "@/lib/invitation/themes";

interface CoupleRevealProps {
  theme: InvitationTheme;
  eventType: EventType;
  partnerA: string;
  partnerB?: string;
  message?: string;
  date: string;
  time?: string;
  venue: string;
  city?: string;
  address?: string;
  photo?: string;
  recipientName?: string | null;
  reducedMotion: boolean;
  /** Açılış animasyonları (varsayılan: ["cicekler"]). */
  animations?: string[];
  /** Davetiye yazısı font id'si (varsayılan: "zarif"). */
  textFont?: string;
  /** Davetiye yazısı boyut çarpanı (varsayılan: 1). */
  textSize?: number;
  /** Açılış animasyonu hız çarpanı (varsayılan: 1). */
  animationSpeed?: number;
  /** Açılış animasyonu boyut çarpanı (varsayılan: 1). */
  animationScale?: number;
  /** Bilgiler bloğu konumu (yüzde). */
  textPos?: InvitationLayoutPos;
  /** Fotoğraf konumu/boyutu. */
  photoPos?: InvitationLayoutPos;
  /** Animasyon başına konum/boyut. */
  animationPlacements?: Record<string, InvitationLayoutPos>;
}

const DEFAULT_TEXT_POS = { x: 50, y: 88 };
const DEFAULT_PHOTO_POS = { x: 50, y: 72, scale: 1 };
const DEFAULT_ANIM_POS = { x: 50, y: 42 };

export default function CoupleReveal({
  theme,
  eventType,
  partnerA,
  partnerB,
  message,
  date,
  time,
  venue,
  city,
  address,
  photo,
  recipientName,
  reducedMotion,
  animations,
  textFont = "zarif",
  textSize = 1,
  animationSpeed = 1,
  animationScale = 1,
  textPos,
  photoPos,
  animationPlacements,
}: CoupleRevealProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const figARef = useRef<HTMLDivElement>(null);
  const figBRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const [burst, setBurst] = useState(reducedMotion);

  const personas = figuresFor(eventType);
  const figures = personas.map((p) => buildFigure(p, theme));
  const single = personas.length === 1;
  const monogram = partnerB ? `${partnerA} & ${partnerB}` : partnerA;
  const fontFamily = getTextFont(textFont);

  useLayoutEffect(() => {
    const figA = figARef.current;
    const figB = figBRef.current;
    const details = detailsRef.current;
    if (!sceneRef.current) return;

    const nodes = [figA, figB].filter((n): n is HTMLDivElement => !!n);

    if (reducedMotion) {
      return;
    }

    const tl = gsap.timeline();

    for (const node of nodes) {
      gsap.set(node, { y: 130, opacity: 0, scale: 0.6 });
    }
    tl.to(nodes, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.9,
      stagger: 0.18,
      ease: "back.out(1.6)",
    });
    tl.to(nodes, { rotation: 1.2, duration: 0.35, ease: "sine.inOut" }, ">");
    tl.to(nodes, { rotation: -1, duration: 0.32, ease: "sine.inOut" }, ">");
    tl.to(nodes, { rotation: 0, duration: 0.28, ease: "sine.inOut" }, ">");
    tl.add(() => setBurst(true), ">0.15");

    if (details) {
      gsap.set(details, { opacity: 0 });
      tl.to(details, { opacity: 1, duration: 0.55, ease: "power2.out" }, ">0.1");
    }

    return () => {
      tl.kill();
      setBurst(false);
    };
  }, [reducedMotion, personas.length]);

  const resolvedAnims: UnifiedAnimation[] = resolveAnimations(animations)
    .map((id) => getAnimation(id))
    .filter((a): a is UnifiedAnimation => !!a);
  const activeAnims =
    resolvedAnims.length > 0
      ? resolvedAnims
      : [getAnimation("cicekler") as UnifiedAnimation];
  const bursts = activeAnims
    .map((a) => getEffect(a.burst))
    .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i);
  const flowersOn = activeAnims.some((a) => a.flowers);
  const tx = textPos?.x ?? DEFAULT_TEXT_POS.x;
  const ty = textPos?.y ?? DEFAULT_TEXT_POS.y;
  const px = photoPos?.x ?? DEFAULT_PHOTO_POS.x;
  const py = photoPos?.y ?? DEFAULT_PHOTO_POS.y;
  const photoScale = photoPos?.scale ?? DEFAULT_PHOTO_POS.scale!;

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col overflow-hidden"
      style={{ background: theme.background, color: theme.textColor }}
    >
      {/* ambiyans (her animasyon kendi konumunda); çiçekler vektör player'la çizilir */}
      {activeAnims.map((a) => {
        const fx = getEffect(a.ambient);
        const p = animationPlacements?.[a.id] ?? {};
        const origin = { x: p.x ?? DEFAULT_ANIM_POS.x, y: p.y ?? DEFAULT_ANIM_POS.y };
        const scale = animationScale * (p.scale ?? 1);
        const speed = p.speed ?? animationSpeed;
        if (isVectorFlower(a.id)) {
          return (
            <VectorFormEffect
              key={a.id}
              config={fx}
              active
              reducedMotion={reducedMotion}
              position={origin}
              scale={scale}
              speed={speed}
              repeat={p.repeat}
            />
          );
        }
        return (
          <div
            key={a.id}
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: `${origin.x}% ${origin.y}%`,
            }}
          >
            <EffectStage
              config={fx}
              active
              reducedMotion={reducedMotion}
              origin={origin}
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
            reducedMotion={reducedMotion}
            position={{ x: 14, y: 48 }}
            scale={1.5 * animationScale}
            speed={animationSpeed}
          />
          <VectorFormEffect
            config={getEffect("peony")}
            active
            reducedMotion={reducedMotion}
            position={{ x: 86, y: 48 }}
            scale={1.5 * animationScale}
            speed={animationSpeed}
          />
        </>
      )}

      {burst && (
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            transform: `scale(${animationScale})`,
            transformOrigin: "50% 30%",
          }}
        >
          {bursts.map((fx) => (
            <EffectStage
              key={fx.id}
              config={fx}
              active
              reducedMotion={reducedMotion}
              origin={{ x: 50, y: 30 }}
              speed={animationSpeed}
            />
          ))}
        </div>
      )}

      {/* karakter sahnesi */}
      <div
        ref={sceneRef}
        className="relative z-10 flex flex-1 items-end justify-center gap-2 px-6 pt-16"
      >
        {figures.map((fig, i) => (
          <div
            key={fig.id}
            ref={i === 0 ? figARef : figBRef}
            className={single ? "" : "w-[42%] max-w-[190px]"}
          >
            <FigureSvg
              figure={fig}
              height={single ? 320 : 300}
              className="drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
            />
          </div>
        ))}
      </div>

      {/* fotoğraf */}
      {photo && (
        <div
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
            className="rounded-xl object-cover"
            style={{ width: `${128 * photoScale}px`, maxWidth: "60vw" }}
          />
        </div>
      )}

      {/* bilgiler */}
      <div
        ref={detailsRef}
        className="absolute z-10 w-[86%] max-w-md text-center"
        style={{
          left: `${tx}%`,
          top: `${ty}%`,
          transform: "translate(-50%, -50%)",
          maxHeight: "82%",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.28em]"
          style={{ color: theme.accent }}
        >
          {recipientName ? `Sevgili ${recipientName}` : "Davetlisin"}
        </p>
        <h1
          className="mt-2 font-bold"
          style={{
            fontFamily,
            fontSize: `clamp(${(1.7 * textSize).toFixed(2)}rem, ${
              4 * textSize
            }vw, ${(2.4 * textSize).toFixed(2)}rem)`,
          }}
        >
          {monogram}
        </h1>
        <div
          className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 text-sm opacity-90 sm:gap-3"
          style={{ fontFamily }}
        >
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5">
            {formatDate(date)}
          </span>
          {time && (
            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5">
              {time}
            </span>
          )}
        </div>
        <p className="mt-3 text-base sm:text-lg" style={{ fontFamily }}>
          {venue}
          {city && (
            <span className="ml-1 text-sm opacity-75">· {city}</span>
          )}
        </p>
        {address && (
          <p className="mt-1 text-xs opacity-70" style={{ fontFamily }}>
            {address}
          </p>
        )}
        {message && (
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed opacity-85" style={{ fontFamily }}>
            {message}
          </p>
        )}
        {eventType === "sunnet" && (
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] opacity-70">
            Sünnet davetidir, teşrifinizle şeref duyarız
          </p>
        )}
      </div>
    </div>
  );
}
