"use client";

/* eslint-disable react-hooks/set-state-in-effect -- matchMedia/ölçüm sonucu durum güncelleme gerekli */

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Greeting, Template, Theme } from "@/lib/types";
import {
  detectPerformance,
  MIN_FPS_FOR_3D,
  particleCountFor,
  type PerfResult,
} from "@/lib/performance";
import { useFpsMonitor } from "@/hooks/use-fps-monitor";
import SceneErrorBoundary from "@/components/scene-error-boundary";
import GreetingAudioButton from "@/components/greeting-audio";

const ThreeScene = dynamic(
  () => import("@/components/three-scene"),
  { ssr: false, loading: () => null },
);

interface GreetingAnimationProps {
  greeting: Greeting;
  template: Template;
  theme: Theme;
}

const PETALS = 12;
const PETAL_STAGGER = 0.08;
const OPEN_DELAY = 0.35;

const PARTICLES = [
  { left: "8%", bottom: "-5%", size: 14, duration: 9, delay: 0, color: "accent" },
  { left: "22%", bottom: "-15%", size: 10, duration: 11, delay: 1.5, color: "petal" },
  { left: "38%", bottom: "-8%", size: 16, duration: 8, delay: 0.8, color: "petal" },
  { left: "55%", bottom: "-20%", size: 9, duration: 12, delay: 2.2, color: "accent" },
  { left: "70%", bottom: "-10%", size: 13, duration: 10, delay: 0.4, color: "petal" },
  { left: "85%", bottom: "-16%", size: 11, duration: 9.5, delay: 1.1, color: "petal" },
  { left: "94%", bottom: "-6%", size: 15, duration: 8.5, delay: 2.8, color: "accent" },
  { left: "48%", bottom: "-25%", size: 8, duration: 13, delay: 3.5, color: "accent" },
];

export default function GreetingAnimation({
  greeting,
  template,
  theme,
}: GreetingAnimationProps) {
  const [opened, setOpened] = useState(false);
  const [perf, setPerf] = useState<PerfResult | null>(null);
  const [bloomed, setBloomed] = useState(false);
  const [downgraded, setDowngraded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Test amaçlı: /k/[id]?mode=css veya ?mode=three — modu zorla belirler.
  // Hydration uyumu için URL parametresi mount sonrası (effect) okunur;
  // ilk render'da sunucu ve istemci aynı (null → CSS) çıktıyı üretir.
  const [forcedMode, setForcedMode] = useState<"css" | "three" | null>(null);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("mode");
    setForcedMode(value === "css" || value === "three" ? value : null);
  }, []);

  const message = greeting.message || template.messages[0];

  useEffect(() => {
    let cancelled = false;
    detectPerformance().then((result) => {
      if (!cancelled) setPerf(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const detectedThree =
    perf !== null && perf.webgl && perf.fps >= MIN_FPS_FOR_3D;

  const mode: "css" | "three" =
    forcedMode ?? (downgraded || reducedMotion || !detectedThree ? "css" : "three");
  const particleCount = perf ? particleCountFor(perf.fps) : 60;

  // Sabit identity: FPS izleyici her 500ms'de yeniden render tetiklendiğinde
  // inline arrow'lar Flower'daki GSAP timeline'ının onComplete'ini bozmasın.
  const handleBloomComplete = useCallback(() => setBloomed(true), []);

  // 3D sahne açıkken gerçek FPS'i izle; uzun süre düşükse fark ettirmeden fallback'e geç.
  const fps = useFpsMonitor(mode === "three");
  useEffect(() => {
    if (mode !== "three" || fps === null) return;
    if (fps < MIN_FPS_FOR_3D) setDowngraded(true);
  }, [mode, fps]);

  const petals = useMemo(
    () =>
      Array.from({ length: PETALS }, (_, i) => ({
        rot: (360 / PETALS) * i,
        color: theme.petalColors[i % theme.petalColors.length],
        delay: OPEN_DELAY + i * PETAL_STAGGER,
      })),
    [theme.petalColors],
  );

  const cssTextDelay = OPEN_DELAY + PETALS * PETAL_STAGGER + 0.45;
  const showText = opened && (mode === "css" || bloomed);
  const cssPetalsVisible = mode === "css" && opened && !reducedMotion;

  return (
    <div
      className="relative min-h-dvh w-full overflow-hidden"
      style={{ background: theme.background, color: theme.textColor }}
    >
      {mode === "three" && (
        <div className="absolute inset-0">
          <SceneErrorBoundary onError={() => setDowngraded(true)}>
            <ThreeScene
              theme={theme}
              particleCount={particleCount}
              opened={opened}
              onBloomComplete={handleBloomComplete}
            />
          </SceneErrorBoundary>
        </div>
      )}

      {mode === "css" &&
        !reducedMotion &&
        PARTICLES.map((p, i) => (
          <span
            key={i}
            className="particle"
            style={
              {
                left: p.left,
                bottom: p.bottom,
                width: p.size,
                height: p.size,
                background: p.color === "accent" ? theme.accent : theme.petalColors[0],
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}

      <main className="relative z-10 flex min-h-dvh flex-col items-center overflow-y-auto px-6 text-center">
        <div className="m-auto flex w-full flex-col items-center py-6">
          <div className="relative h-80 w-80">
          {cssPetalsVisible &&
            petals.map((p, i) => (
              <span
                key={i}
                className="petal"
                style={
                  {
                    "--rot": `${p.rot}deg`,
                    "--delay": `${p.delay}s`,
                    background: p.color,
                  } as React.CSSProperties
                }
              />
            ))}

          {!opened && (
            <button
              type="button"
              onClick={() => setOpened(true)}
              aria-label="Sürprizi aç"
              className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-5xl shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95"
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

          {mode === "css" && opened && !reducedMotion && (
            <span
              className="flower-center"
              style={
                {
                  "--delay": `${OPEN_DELAY + PETALS * PETAL_STAGGER}s`,
                  background: theme.centerColor,
                } as React.CSSProperties
              }
            >
              {template.emoji}
            </span>
          )}

          {opened && reducedMotion && (
            <span
              className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-5xl"
              style={{
                background: theme.centerColor,
                boxShadow: `0 0 3rem ${theme.accent}66`,
              }}
              aria-hidden
            >
              {template.emoji}
            </span>
          )}
        </div>

        {!opened && (
          <p
            className="mt-2 cursor-pointer select-none text-sm font-medium tracking-wide opacity-80"
            onClick={() => setOpened(true)}
          >
            Sürprizin için dokun 👆
          </p>
        )}

        {showText && (
          <div
            className={`mt-4 flex max-w-md flex-col items-center ${reducedMotion ? "" : "greeting-text"}`}
            style={
              !reducedMotion && mode === "css"
                ? { animationDelay: `${cssTextDelay}s` }
                : undefined
            }
          >
            {greeting.photo && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={greeting.photo}
                alt={`${greeting.name} fotoğrafı`}
                className="mb-5 h-36 w-36 rounded-full border-4 border-white/40 object-cover shadow-2xl"
                style={{ boxShadow: `0 0 3rem ${theme.accent}55` }}
              />
            )}
            <h1 className="text-4xl font-bold leading-tight drop-shadow-lg sm:text-5xl">
              {greeting.name}
            </h1>
            <p className="mt-4 text-lg leading-relaxed opacity-90 sm:text-xl">
              {message}
            </p>
            {greeting.video && (
              <video
                src={greeting.video}
                controls
                playsInline
                muted
                preload="metadata"
                className="mt-6 w-full max-w-xs rounded-2xl border-4 border-white/40 bg-black shadow-2xl"
                style={{ boxShadow: `0 0 3rem ${theme.accent}55` }}
              >
                Tarayıcın videoyu desteklemiyor.
              </video>
            )}
          </div>
        )}
        </div>
      </main>

      <div className="absolute bottom-3 right-3 z-20">
        <GreetingAudioButton audio={greeting.audio ?? null} />
      </div>

      <span className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 text-[10px] uppercase tracking-widest opacity-40">
        {mode === "three" ? "3D" : "CSS"}
      </span>
    </div>
  );
}
