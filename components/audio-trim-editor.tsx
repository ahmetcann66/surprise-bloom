"use client";

// Yüklenen ses dosyası için waveform tabanlı trim editörü.
// Yeni dosya ÜRETMEZ; yalnızca { startTime, endTime } metadata'sını bildirir.
// Audio/waveform kütüphanesi yok — canvas + AudioContext.decodeAudioData peak.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const PEAK_COUNT = 220;

interface AudioTrimEditorProps {
  url: string;
  startTime?: number;
  endTime?: number;
  onChange: (start: number | undefined, end: number | undefined) => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function loadPeaks(
  url: string,
): Promise<{ peaks: number[]; duration: number } | null> {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const ctx = new Ctor();
    const audio = await ctx.decodeAudioData(buffer);
    const data = audio.getChannelData(0);
    const duration = audio.duration;
    ctx.close().catch(() => {});
    const block = Math.max(1, Math.floor(data.length / PEAK_COUNT));
    const peaks: number[] = [];
    for (let i = 0; i < PEAK_COUNT; i++) {
      let sum = 0;
      const end = Math.min((i + 1) * block, data.length);
      for (let j = i * block; j < end; j++) sum += Math.abs(data[j]);
      peaks.push(sum / Math.max(1, end - i * block));
    }
    const max = Math.max(...peaks, 0.0001);
    return { peaks: peaks.map((p) => p / max), duration };
  } catch {
    return null;
  }
}

export default function AudioTrimEditor({
  url,
  startTime,
  endTime,
  onChange,
}: AudioTrimEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const dragRef = useRef<"start" | "end" | null>(null);

  const start = startTime ?? 0;
  const end = endTime ?? duration ?? 0;

  /* eslint-disable react-hooks/set-state-in-effect -- url değişince yükleme durumunu senkronlamak gerekli */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadPeaks(url).then((result) => {
      if (cancelled) return;
      if (result) {
        setPeaks(result.peaks);
        setDuration(result.duration);
      } else {
        setPeaks(null);
        setDuration(null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks || !duration) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);
    const startX = (start / duration) * w;
    const endX = (end / duration) * w;

    // Trim dışı alanı karart, iç alanı vurgula.
    ctx.fillStyle = "rgba(148, 163, 184, 0.22)";
    ctx.fillRect(0, 0, startX, h);
    ctx.fillRect(endX, 0, w - endX, h);

    const barW = Math.max(1, w / peaks.length);
    peaks.forEach((p, i) => {
      const x = i * barW;
      const inRange = x >= startX && x <= endX;
      const barH = Math.max(2, p * (h - 10));
      ctx.fillStyle = inRange
        ? "rgb(236, 72, 153)"
        : "rgba(100, 116, 139, 0.7)";
      ctx.fillRect(x + 0.5, (h - barH) / 2, Math.max(0.5, barW - 1), barH);
    });

    // Tutamaç çizgileri.
    ctx.fillStyle = "#ffffff";
    const drawHandle = (x: number) => {
      ctx.fillRect(x - 1, 0, 2, h);
    };
    drawHandle(startX);
    drawHandle(endX);
  }, [peaks, duration, start, end]);

  const timeFromEvent = useCallback(
    (e: React.PointerEvent | PointerEvent): number => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      return ratio * duration!;
    },
    [duration],
  );

  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v));

  const commitStart = (v: number) => {
    const next = clamp(v, 0, (endTime ?? duration ?? v) - 1);
    onChange(
      next > 0 ? Math.round(next * 10) / 10 : undefined,
      endTime,
    );
  };

  const commitEnd = (v: number) => {
    const next = clamp(v, (startTime ?? 0) + 1, duration ?? v);
    onChange(startTime, next < duration! ? Math.round(next * 10) / 10 : undefined);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!peaks || !duration) return;
    const t = timeFromEvent(e);
    if (Math.abs(t - start) < Math.abs(t - end)) dragRef.current = "start";
    else dragRef.current = "end";
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || !duration) return;
    const t = timeFromEvent(e);
    if (dragRef.current === "start") commitStart(t);
    else commitEnd(t);
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  if (loading) {
    return (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Ses dalgası yükleniyor…
      </p>
    );
  }

  if (!peaks || !duration) {
    return (
      <p className="text-xs text-red-600 dark:text-red-400">
        Ses çözümlenemedi, farklı bir dosya dene.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>Başlangıç: {formatTime(start)}</span>
        <button
          type="button"
          onClick={() => onChange(undefined, undefined)}
          className="text-pink-600 underline-offset-4 hover:underline dark:text-pink-400"
        >
          Kırpmayı sıfırla
        </button>
        <span>Bitiş: {formatTime(end)}</span>
      </div>
      <canvas
        ref={canvasRef}
        className="mt-2 h-24 w-full cursor-ew-resize touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="Ses kırpma penceresi"
      />
      <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
        İki ucu sürükleyerek çalınacak bölümü seç. Bu, dosyayı değiştirmez.
      </p>
    </div>
  );
}
