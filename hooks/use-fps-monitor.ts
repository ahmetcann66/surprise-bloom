"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity -- FPS ölçümü ve durum senkronizasyonu gerekli */

import { useEffect, useRef, useState } from "react";

// Rapor §5: 3D sahne devredeyken gerçek FPS'i ölçer; düşük performansta
// fallback'e geçmek için kullanılır. Her sampleMs'te bir güncellenen değer döner.
export function useFpsMonitor(active: boolean, sampleMs = 500): number | null {
  const [fps, setFps] = useState<number | null>(null);
  const frames = useRef(0);
  const windowStart = useRef(performance.now());

  useEffect(() => {
    if (!active) {
      setFps(null);
      return;
    }
    let raf = 0;
    let cancelled = false;
    frames.current = 0;
    windowStart.current = performance.now();

    const loop = (now: number) => {
      if (cancelled) return;
      frames.current++;
      if (now - windowStart.current >= sampleMs) {
        const measured = Math.round(
          (frames.current * 1000) / (now - windowStart.current),
        );
        setFps(measured);
        frames.current = 0;
        windowStart.current = now;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [active, sampleMs]);

  return fps;
}
