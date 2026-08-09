"use client";

import { useState } from "react";
import EffectStage from "@/lib/effects/engine";
import VectorFormEffect from "@/components/vector-form-effect";
import { getEffect } from "@/lib/effects/presets";

function DemoCard({
  title,
  note,
  effectId,
  variant,
}: {
  title: string;
  note: string;
  effectId: string;
  variant: "legacy" | "vector" | "graded";
}) {
  const [runId, setRunId] = useState(0);
  const [opened, setOpened] = useState(false);
  const config = getEffect(effectId);
  const vector = variant === "vector";

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
      <div className="relative aspect-[3/4] bg-[#1a0b2e]">
        {vector ? (
          <VectorFormEffect
            key={runId}
            config={config}
            active={opened}
            reducedMotion={false}
          />
        ) : (
          <EffectStage
            key={runId}
            config={config}
            active={opened}
            reducedMotion={false}
          />
        )}

        {!opened && (
          <button
            type="button"
            onClick={() => setOpened(true)}
            className="absolute left-1/2 top-1/2 z-20 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full text-2xl shadow-lg transition-transform hover:scale-110"
            style={{ background: "#ff4d6d", boxShadow: "0 0 2rem #ff4d6d66" }}
            aria-label={`${title} oynat`}
          >
            {config.emoji}
          </button>
        )}
        {opened && (
          <button
            type="button"
            onClick={() => setRunId((r) => r + 1)}
            className="absolute right-2 top-2 z-20 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs text-white"
          >
            ↻ Tekrar
          </button>
        )}
      </div>
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-zinc-100">
          {title}
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              variant === "legacy"
                ? "bg-zinc-700 text-zinc-200"
                : "bg-pink-600 text-white"
            }`}
          >
            {variant === "legacy" ? "ESKİ (partikül)" : "YENİ"}
          </span>
        </p>
        <p className="mt-1 text-xs text-zinc-400">{note}</p>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  const cards: {
    title: string;
    note: string;
    effectId: string;
    variant: "legacy" | "vector" | "graded";
  }[] = [
    {
      title: "Gül — draw",
      note: "Eski: rastgele phyllotaxis partiküller (tutarsız).",
      effectId: "rose",
      variant: "legacy",
    },
    {
      title: "Gül — draw",
      note: "Yeni: gradient'lı SVG petaller, kalemle çizilme + boyanma.",
      effectId: "rose",
      variant: "vector",
    },
    {
      title: "Lale — grow-up",
      note: "Yeni: sap üzerinde büyüme + back-ease salınım.",
      effectId: "tulip",
      variant: "vector",
    },
    {
      title: "Kalp Patlaması",
      note: "Yeni: gradient + highlight'lı SVG kalpler.",
      effectId: "heartburst",
      variant: "graded",
    },
    {
      title: "Aurora",
      note: "Yeni: gradient + highlight'lı parıltı şekilleri.",
      effectId: "aurora",
      variant: "graded",
    },
    {
      title: "Ayçiçeği — grow-up",
      note: "Yeni: çift katman petal + sap/yaprak.",
      effectId: "sunflower",
      variant: "vector",
    },
  ];

  return (
    <main className="min-h-dvh bg-zinc-950 px-6 py-10">
      <h1 className="text-center text-2xl font-bold text-white">
        Efekt Sistemi — Eski vs Yeni Karşılaştırma
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-400">
        Her kartta butona bas; animasyonu baştan oynatmak için ↻ kullan. Bu
        sayfa yalnızca geliştirme/doğrulama içindir.
      </p>
      <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <DemoCard key={i} {...c} />
        ))}
      </div>
    </main>
  );
}
