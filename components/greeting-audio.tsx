"use client";

import { useEffect, useRef, useState } from "react";
import { getClip } from "@/lib/clips";
import { getMusicTrack, playOnce, musicLabel } from "@/lib/music";
import type { GreetingAudio } from "@/lib/types";

function resolveAudioContext(): typeof AudioContext {
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  );
}

interface GreetingAudioProps {
  audio: GreetingAudio | null;
}

export default function GreetingAudioButton({ audio }: GreetingAudioProps) {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const elRef = useRef<HTMLAudioElement | null>(null);

  useEffect(
    () => () => {
      ctxRef.current?.close().catch(() => {});
      elRef.current?.pause();
    },
    [],
  );

  if (!audio) return null;

  const currentAudio = audio;

  const label =
    musicLabel(currentAudio) ?? (currentAudio.type === "clip" ? "Müzik" : "Ses kaydı");

  function stop() {
    if (currentAudio.type === "clip") {
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    } else {
      elRef.current?.pause();
      elRef.current = null;
    }
    setPlaying(false);
  }

  function play() {
    if (currentAudio.type === "clip") {
      const clip = getClip(currentAudio.value);
      const track = getMusicTrack(currentAudio.value);
      if (!clip && !track) return;
      ctxRef.current?.close().catch(() => {});
      const Ctor = resolveAudioContext();
      const ctx = new Ctor();
      ctxRef.current = ctx;
      ctx.resume().then(() => {
        if (clip) clip.play(ctx);
        else if (track) playOnce(ctx, track);
        setPlaying(true);
        const duration = (clip?.duration ?? 0) || (track ? track.beats * (60 / track.bpm) : 0);
        window.setTimeout(() => setPlaying(false), duration * 1000);
      });
    } else {
      const el = new Audio(currentAudio.value);
      elRef.current = el;
      el.onended = () => setPlaying(false);
      el.play();
      setPlaying(true);
    }
  }

  return (
    <button
      type="button"
      onClick={playing ? stop : play}
      className="flex items-center gap-2 rounded-full border border-white/30 bg-black/30 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/50"
    >
      <span aria-hidden>{playing ? "⏸" : "🔊"}</span>
      {playing ? "Durdur" : label}
    </button>
  );
}
