"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createMusicLooper,
  getMusicTrack,
  isSilentAudio,
} from "@/lib/music";
import { getClip } from "@/lib/clips";
import type { GreetingAudio } from "@/lib/types";

function resolveAudioContext(): typeof AudioContext {
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  );
}

/**
 * Davetiye arka plan müziği. Kullanıcı etkileşimi (zarf açılışı / buton) ile
 * `start()` çağrılır — tarayıcı autoplay politikası bu sayede aşılır.
 * - Parça (lib/music.ts) → kesintisiz döngü (lookahead scheduler).
 * - Legacy klip (lib/clips.ts) → süresi kadar arayla tekrarlanır.
 * - Kayıt (recording) → loop'lu HTMLAudioElement.
 * - Dosya (file) → loop'lu HTMLAudioElement; startTime/endTime penceresi
 *   uygulanır (fiziksel kesme yok, metadata döngüsü).
 * - Sessiz / çalınamaz seçim → hiçbir şey çalmaz.
 */
export function useInvitationMusic(audio: GreetingAudio | null | undefined) {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const looperRef = useRef<ReturnType<typeof createMusicLooper> | null>(null);
  const clipTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    setPlaying(false);
    looperRef.current?.stop();
    looperRef.current = null;
    if (clipTimerRef.current) {
      clearInterval(clipTimerRef.current);
      clipTimerRef.current = null;
    }
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    elRef.current?.pause();
    elRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(() => {
    if (!audio || isSilentAudio(audio)) return;
    if (ctxRef.current || elRef.current) return;

    if (audio.type === "recording") {
      const el = new Audio(audio.value);
      el.loop = true;
      el.volume = 0.7;
      elRef.current = el;
      el.play()
        .then(() => setPlaying(true))
        .catch(() => {
          elRef.current = null;
        });
      return;
    }

    if (audio.type === "file") {
      const el = new Audio(audio.value);
      el.loop = true;
      el.volume = 0.7;
      elRef.current = el;
      if (audio.startTime !== undefined) {
        el.currentTime = audio.startTime;
      }
      if (audio.endTime !== undefined) {
        el.ontimeupdate = () => {
          if (elRef.current && el.currentTime >= audio.endTime!) {
            el.currentTime = audio.startTime ?? 0;
          }
        };
      }
      el.play()
        .then(() => setPlaying(true))
        .catch(() => {
          elRef.current = null;
        });
      return;
    }

    const track = getMusicTrack(audio.value);
    if (track) {
      const Ctor = resolveAudioContext();
      const ctx = new Ctor();
      ctxRef.current = ctx;
      const looper = createMusicLooper(ctx, track);
      looperRef.current = looper;
      ctx
        .resume()
        .then(() => {
          looper.start();
          setPlaying(true);
        })
        .catch(() => stop());
      return;
    }

    const clip = getClip(audio.value);
    if (!clip) return;
    const Ctor = resolveAudioContext();
    const ctx = new Ctor();
    ctxRef.current = ctx;
    clipTimerRef.current = setInterval(() => {
      if (ctx.state === "suspended") return;
      clip.play(ctx);
    }, clip.duration * 1000);
    ctx
      .resume()
      .then(() => {
        clip.play(ctx);
        setPlaying(true);
      })
      .catch(() => stop());
  }, [audio, stop]);

  const toggle = useCallback(() => {
    if (playing) stop();
    else start();
  }, [playing, start, stop]);

  return { playing, start, stop, toggle };
}
