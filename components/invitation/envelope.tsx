"use client";

/* eslint-disable react-hooks/set-state-in-effect -- matchMedia sonucu durum güncelleme gerekli */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import EnvelopeVisual from "@/components/invitation/envelope-visual";
import type { InvitationTheme } from "@/lib/invitation/themes";

interface EnvelopeProps {
  theme: InvitationTheme;
  recipientName?: string | null;
  monogram: string;
  onOpen: () => void;
  reducedMotion: boolean;
  /** Zarf açılış animasyonu çalınsın mı (varsayılan true). */
  animated?: boolean;
  /** Açılış animasyonu hız çarpanı (varsayılan 1). */
  speed?: number;
}

export default function Envelope({
  theme,
  recipientName,
  monogram,
  onOpen,
  reducedMotion,
  animated = true,
  speed = 1,
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

    if (reduced || !animated) {
      // Zarf animasyonu kapalı / azaltılmış hareket: zarifçe kaybolup açılır.
      tlRef.current = gsap.timeline({ paused: true });
      tlRef.current.to(wrap, {
        opacity: 0,
        y: -14,
        scale: 0.98,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => onOpenRef.current(),
      });
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
    if (speed > 0) tl.timeScale(speed);
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
  }, [reduced, animated, speed]);

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
          style={{ perspective: "1000px" }}
        >
          <EnvelopeVisual
            theme={theme}
            recipientName={recipientName}
            monogram={monogram}
            className="relative w-full"
            flapRef={flapRef}
            sealRef={sealRef}
            letterRef={letterRef}
          />
        </div>
        <span className="mt-6 block text-center text-sm font-medium opacity-90">
          {animated ? "Zarfı açmak için dokun" : "Davetiyeyi görüntülemek için dokun"}
        </span>
      </button>
    </div>
  );
}
