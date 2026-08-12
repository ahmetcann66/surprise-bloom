"use client";

/* eslint-disable react-hooks/set-state-in-effect -- matchMedia sonucu durum güncelleme gerekli */

import { useEffect, useState } from "react";
import type { Greeting, Template, Theme } from "@/lib/types";
import GreetingAudioButton from "@/components/greeting-audio";
import VectorFormEffect from "@/components/vector-form-effect";
import EffectStage from "@/lib/effects/engine";
import { resolveEffectFor } from "@/lib/animations";
import { isVectorFlower } from "@/lib/effects/flowers";
import { getTextFont } from "@/lib/fonts";

interface GreetingAnimationProps {
  greeting: Greeting;
  template: Template;
  theme: Theme;
}

export default function GreetingAnimation({
  greeting,
  template,
  theme,
}: GreetingAnimationProps) {
  const [opened, setOpened] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const message = greeting.message || template.messages[0];
  const placements =
    greeting.effects && greeting.effects.length > 0
      ? greeting.effects
      : greeting.effect
        ? [{ id: greeting.effect }]
        : [];
  const showText = opened;
  const photoPos = greeting.photoPos ?? { x: 50, y: 50 };
  const textPos = greeting.textPos ?? { x: 50, y: 70 };
  const effectScale = greeting.effectScale ?? 1;
  const videoScale = greeting.videoScale ?? 1;
  const animationSpeed = greeting.animationSpeed ?? 1;
  const photoScale = photoPos.scale ?? 1;
  const fontSize = textPos.fontSize ?? 1;

  return (
    <div
      className="relative min-h-dvh w-full overflow-hidden"
      style={{ background: theme.background, color: theme.textColor }}
    >
      {placements.map((placement, index) => {
        const cfg = resolveEffectFor(placement.id);
        const pos = { x: placement.x ?? 50, y: placement.y ?? 50 };
        const scale = placement.scale ?? effectScale;
        if (isVectorFlower(placement.id)) {
          return (
            <VectorFormEffect
              key={`${index}-${placement.id}`}
              config={cfg}
              active={opened}
              reducedMotion={reducedMotion}
                scale={scale}
                position={pos}
                speed={placement.speed ?? animationSpeed}
                repeat={placement.repeat}
                repeatEvery={placement.repeatEvery}
              />
          );
        }
        return (
          <div
            key={`${index}-${placement.id}`}
            className="absolute inset-0 z-[1]"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: `${pos.x}% ${pos.y}%`,
            }}
          >
            <EffectStage
              config={cfg}
              active={opened}
              reducedMotion={reducedMotion}
              origin={pos}
              speed={placement.speed ?? animationSpeed}
              repeat={placement.repeat}
              repeatEvery={placement.repeatEvery}
            />
          </div>
        );
      })}

      {!opened && (
        <button
          type="button"
          onClick={() => setOpened(true)}
          aria-label="Sürprizi aç"
          className="absolute left-1/2 top-1/2 z-20 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-5xl shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95"
          style={{
            background: theme.centerColor,
            boxShadow: `0 0 3rem ${theme.accent}66`,
          }}
        >
          <span className="bud" aria-hidden>
            {template.emoji}
          </span>
        </button>
      )}

      {showText && (
        <>
          {greeting.photo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={greeting.photo}
              alt={greeting.name ? `${greeting.name} fotoğrafı` : "Sürpriz fotoğrafı"}
              className="absolute z-10 rounded-full border-4 border-white/40 object-cover"
              style={{
                left: `${photoPos.x}%`,
                top: `${photoPos.y}%`,
                width: `calc(9rem * ${photoScale})`,
                height: `calc(9rem * ${photoScale})`,
                transform: "translate(-50%, -50%)",
                boxShadow: `0 0 3rem ${theme.accent}55`,
              }}
            />
          )}

          <div
            className="absolute z-10 w-[80%] max-w-md text-center drop-shadow-lg"
            style={{
              left: `${textPos.x}%`,
              top: `${textPos.y}%`,
              transform: "translate(-50%, -50%)",
              fontSize: `${2.25 * fontSize}rem`,
              fontFamily: getTextFont(greeting.textFont),
            }}
          >
            {greeting.name && (
              <h1 className="text-[1em] font-bold leading-tight">
                {greeting.name}
              </h1>
            )}
            <p className="mt-3 text-[0.5em] leading-relaxed opacity-90">
              {message}
            </p>
            {greeting.video && (
              <video
                src={greeting.video}
                controls
                playsInline
                muted
                preload="metadata"
                className="mx-auto mt-4 rounded-2xl border-4 border-white/40 bg-black shadow-2xl"
                style={{
                  width: `calc(20rem * ${videoScale})`,
                  maxWidth: "100%",
                  boxShadow: `0 0 3rem ${theme.accent}55`,
                }}
              >
                Tarayıcın videoyu desteklemiyor.
              </video>
            )}
          </div>
        </>
      )}

      <div className="absolute bottom-3 right-3 z-30">
        <GreetingAudioButton audio={greeting.audio ?? null} />
      </div>
    </div>
  );
}
