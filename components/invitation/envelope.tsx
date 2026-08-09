"use client";

/* eslint-disable react-hooks/set-state-in-effect -- matchMedia sonucu durum güncelleme gerekli */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { InvitationTheme } from "@/lib/invitation/themes";

interface EnvelopeProps {
  theme: InvitationTheme;
  recipientName?: string | null;
  monogram: string;
  onOpen: () => void;
  reducedMotion: boolean;
}

export default function Envelope({
  theme,
  recipientName,
  monogram,
  onOpen,
  reducedMotion,
}: EnvelopeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const onOpenRef = useRef(onOpen);
  const startedRef = useRef(false);
  const [reduced, setReduced] = useState(reducedMotion);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    setReduced(reducedMotion);
  }, [reducedMotion]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const flap = flapRef.current;
    const seal = sealRef.current;
    const letter = letterRef.current;
    if (!wrap || !flap || !seal || !letter) return;

    if (reduced) {
      tlRef.current = gsap.timeline({ paused: true });
      tlRef.current.to(wrap, { opacity: 0, duration: 0.3, onComplete: () => onOpenRef.current() });
      return;
    }

    const idle = gsap.to(seal, {
      scale: 1.07,
      repeat: -1,
      yoyo: true,
      duration: 1.3,
      ease: "sine.inOut",
    });

    const tl = gsap.timeline({ paused: true });
    tlRef.current = tl;

    tl.set(flap, { transformOrigin: "50% 0%", rotateX: 0 }, 0);
    tl.set(letter, { yPercent: 130, opacity: 0, scale: 0.92 }, 0);
    tl.set(seal, { scale: 1, opacity: 1 }, 0);

    tl.to(seal, { scale: 0.4, opacity: 0, duration: 0.22, ease: "power2.in" }, 0.08);
    tl.to(flap, { rotateX: -180, duration: 0.62, ease: "power2.inOut" }, 0);
    tl.to(
      letter,
      { yPercent: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)" },
      0.32,
    );
    tl.to(letter, { yPercent: -45, duration: 0.55, ease: "power2.out" }, ">0.12");
    tl.to(letter, { rotation: 0.8, duration: 0.3, ease: "sine.inOut" }, ">");
    tl.to(letter, { rotation: -0.8, duration: 0.28, ease: "sine.inOut" }, ">");
    tl.to(letter, { rotation: 0, duration: 0.24, ease: "sine.inOut" }, ">");
    tl.to(
      wrap,
      { opacity: 0, y: -16, duration: 0.45, ease: "power2.in" },
      ">0.2",
    );
    tl.add(() => onOpenRef.current(), ">");

    return () => {
      idle.kill();
      tl.kill();
      startedRef.current = false;
    };
  }, [reduced]);

  function play() {
    if (startedRef.current || !tlRef.current) return;
    startedRef.current = true;
    tlRef.current.play();
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-6"
      style={{ background: theme.background, color: theme.textColor }}
    >
      <button
        type="button"
        onClick={play}
        aria-label="Zarfı aç"
        className="group block w-[min(82vw,380px)] cursor-pointer"
        style={{ perspective: "1000px" }}
      >
        <div
          ref={wrapRef}
          className="relative w-full"
          style={{ aspectRatio: "3 / 2", transformStyle: "preserve-3d" }}
        >
          {/* arka iç yüz */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{ background: theme.envelope.body }}
          />
          {/* mektup */}
          <div
            ref={letterRef}
            className="absolute left-[10%] right-[10%] top-[12%] bottom-[10%] flex flex-col items-center justify-center rounded-xl border px-4 py-3 text-center shadow-lg"
            style={{
              background: theme.envelope.letter,
              borderColor: `${theme.accent}55`,
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: theme.centerColor }}
            >
              Davet
            </p>
            <p
              className="mt-1 text-lg font-bold leading-tight"
              style={{ color: theme.couple.suit }}
            >
              {monogram}
            </p>
            <p className="mt-1 text-xs" style={{ color: theme.couple.suit }}>
              Birlikte kutlamak üzere
            </p>
          </div>
          {/* ön cep */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: theme.envelope.pocket,
              clipPath: "polygon(0 0, 50% 46%, 100% 0, 100% 100%, 0 100%)",
            }}
          />
          {recipientName && (
            <p
              className="absolute inset-x-0 bottom-[7%] text-center text-sm italic"
              style={{ color: theme.couple.suit }}
            >
              Sevgili {recipientName}
            </p>
          )}
          {/* mühür */}
          <div
            ref={sealRef}
            className="absolute left-1/2 top-[49%] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xl shadow-lg"
            style={{ background: theme.envelope.seal }}
          >
            {theme.emoji}
          </div>
          {/* kapak */}
          <div
            ref={flapRef}
            className="absolute inset-x-0 top-0 h-[52%] rounded-t-2xl"
            style={{
              background: theme.envelope.flap,
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              transformOrigin: "50% 0%",
              transformStyle: "preserve-3d",
            }}
          />
        </div>
        <span className="mt-6 block text-center text-sm font-medium opacity-90">
          Zarfı açmak için dokun
        </span>
      </button>
    </div>
  );
}
