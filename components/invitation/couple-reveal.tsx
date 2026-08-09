"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { FigureSvg } from "@/components/invitation/figures-svg";
import { buildFigure, figuresFor } from "@/lib/invitation/figures";
import { getEffect } from "@/lib/effects/presets";
import EffectStage from "@/lib/effects/engine";
import VectorFormEffect from "@/components/vector-form-effect";
import { getTextFont } from "@/lib/fonts";
import { formatDate, type EventType } from "@/lib/invitation/types";
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
}

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
  const fontFamily = getTextFont("zarif");

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
      gsap.set(details, { opacity: 0, y: 26 });
      tl.to(details, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, ">0.1");
    }

    return () => {
      tl.kill();
      setBurst(false);
    };
  }, [reducedMotion, personas.length]);

  const gold = getEffect("goldsparkle");

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col overflow-hidden"
      style={{ background: theme.background, color: theme.textColor }}
    >
      {/* ambiyans + yan çiçekler */}
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <EffectStage
          config={gold}
          active
          reducedMotion={reducedMotion}
          origin={{ x: 50, y: 42 }}
          repeat="loop"
        />
      </div>
      <VectorFormEffect
        config={getEffect("rose")}
        active
        reducedMotion={reducedMotion}
        position={{ x: 14, y: 48 }}
        scale={1.5}
      />
      <VectorFormEffect
        config={getEffect("peony")}
        active
        reducedMotion={reducedMotion}
        position={{ x: 86, y: 48 }}
        scale={1.5}
      />

      {burst && (
        <div className="pointer-events-none absolute inset-0 z-[1]">
          <EffectStage
            config={getEffect("heartburst")}
            active
            reducedMotion={reducedMotion}
            origin={{ x: 50, y: 30 }}
          />
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

      {/* bilgiler */}
      <div
        ref={detailsRef}
        className="relative z-10 px-6 pb-10 pt-4 text-center"
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.28em]"
          style={{ color: theme.accent }}
        >
          {recipientName ? `Sevgili ${recipientName}` : "Davetlisin"}
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl" style={{ fontFamily }}>
          {monogram}
        </h1>
        {photo && (
          <div
            className="mx-auto mt-4 inline-block rounded-2xl border-2 p-1.5"
            style={{
              borderColor: `${theme.accent}99`,
              background: `${theme.accent}22`,
              boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={`${monogram} fotoğrafı`}
              className="h-40 w-32 rounded-xl object-cover sm:h-48 sm:w-36"
            />
          </div>
        )}
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
