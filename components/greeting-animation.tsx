"use client";

/* eslint-disable react-hooks/set-state-in-effect -- matchMedia sonucu durum güncelleme gerekli */

import { useEffect, useState } from "react";
import type { Greeting, Template, Theme } from "@/lib/types";
import GreetingAudioButton from "@/components/greeting-audio";
import EffectStage from "@/lib/effects/engine";
import { getEffect } from "@/lib/effects/presets";

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
  const effect = getEffect(greeting.effect);
  const showText = opened;
  const photoPos = greeting.photoPos ?? { x: 50, y: 50 };
  const textPos = greeting.textPos ?? { x: 50, y: 70 };

  return (
    <div
      className="relative min-h-dvh w-full overflow-hidden"
      style={{ background: theme.background, color: theme.textColor }}
    >
      <EffectStage config={effect} active={opened} reducedMotion={reducedMotion} />

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
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 z-[2] flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-4xl"
            style={{
              background: theme.centerColor,
              boxShadow: `0 0 2.5rem ${theme.accent}66`,
            }}
            aria-hidden
          >
            {effect.emoji}
          </span>

          {greeting.photo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={greeting.photo}
              alt={greeting.name ? `${greeting.name} fotoğrafı` : "Sürpriz fotoğrafı"}
              className="absolute z-10 h-36 w-36 rounded-full border-4 border-white/40 object-cover shadow-2xl"
              style={{
                left: `${photoPos.x}%`,
                top: `${photoPos.y}%`,
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
            }}
          >
            {greeting.name && (
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                {greeting.name}
              </h1>
            )}
            <p className="mt-3 text-lg leading-relaxed opacity-90 sm:text-xl">
              {message}
            </p>
            {greeting.video && (
              <video
                src={greeting.video}
                controls
                playsInline
                muted
                preload="metadata"
                className="mx-auto mt-4 w-full max-w-xs rounded-2xl border-4 border-white/40 bg-black shadow-2xl"
                style={{ boxShadow: `0 0 3rem ${theme.accent}55` }}
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
