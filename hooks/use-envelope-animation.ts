"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface UseEnvelopeAnimationOptions {
  /** Zarf açılış animasyonu çalınsın mı (false ise doğrudan onOpen). */
  enabled: boolean;
  /** Açılış animasyonu hız çarpanı. */
  speed: number;
  /** Açılış tamamlanınca çağrılır (davetiye göründüğü an). */
  onOpen?: () => void;
  /** Açılıştan sonra zarf gizli kalsın mı (tam akış: davetiye görünür kalır). */
  keepHidden?: boolean;
}

/**
 * Zarf açılış animasyonu — yeniden kullanılabilir.
 * - Gerçek davetiye (components/invitation/envelope.tsx ile aynı akış).
 * - Formdaki küçük zarf önizlemesi (keepHidden: false → tekrar kapanır).
 * - Geniş "Davetiye Önizlemesi" tam akışı (keepHidden: true → davetiye kalır).
 */
export function useEnvelopeAnimation({
  enabled,
  speed,
  onOpen,
  keepHidden = false,
}: UseEnvelopeAnimationOptions) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const onOpenRef = useRef(onOpen);
  const enabledRef = useRef(enabled);
  const speedRef = useRef(speed);
  const keepHiddenRef = useRef(keepHidden);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    keepHiddenRef.current = keepHidden;
  }, [keepHidden]);

  useEffect(() => {
    return () => {
      tlRef.current?.kill();
    };
  }, []);

  function reset() {
    tlRef.current?.kill();
    const wrap = wrapRef.current;
    const flap = flapRef.current;
    const seal = sealRef.current;
    const letter = letterRef.current;
    if (!wrap || !flap || !seal || !letter) return;
    gsap.set(flap, { transformOrigin: "50% 0%", rotateX: 0 });
    gsap.set(letter, { yPercent: 130, opacity: 0, scale: 0.92 });
    gsap.set(seal, { scale: 1, opacity: 1 });
    gsap.set(wrap, { opacity: 1, y: 0 });
  }

  function play() {
    tlRef.current?.kill();
    reset();
    const wrap = wrapRef.current;
    const flap = flapRef.current;
    const seal = sealRef.current;
    const letter = letterRef.current;
    if (!wrap || !flap || !seal || !letter) return;

    if (!enabledRef.current) {
      onOpenRef.current?.();
      return;
    }

    const tl = gsap.timeline();
    if (speedRef.current > 0) tl.timeScale(speedRef.current);
    tl.to(
      seal,
      { scale: 0.4, opacity: 0, duration: 0.22, ease: "power2.in" },
      0.08,
    );
    tl.to(flap, { rotateX: -180, duration: 0.62, ease: "power2.inOut" }, 0);
    tl.to(
      letter,
      { yPercent: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)" },
      0.32,
    );
    tl.to(letter, { yPercent: -45, duration: 0.55, ease: "power2.out" }, ">0.12");
    tl.to(
      wrap,
      { opacity: 0, y: -16, duration: 0.45, ease: "power2.in" },
      ">0.2",
    );
    tl.add(() => onOpenRef.current?.(), ">");
    if (!keepHiddenRef.current) {
      // önizleme: zarf yeniden kapanır, tekrar oynatılabilir
      tl.set(wrap, { opacity: 1, y: 0 }, ">0.15");
      tl.set(flap, { rotateX: 0 }, ">");
      tl.set(seal, { opacity: 1, scale: 1 }, ">");
      tl.set(letter, { yPercent: 130, opacity: 0, scale: 0.92 }, ">");
    }
    tlRef.current = tl;
  }

  return { wrapRef, flapRef, sealRef, letterRef, play, reset };
}
