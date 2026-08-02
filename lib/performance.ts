export interface PerfResult {
  webgl: boolean;
  fps: number;
}

export const HIGH_FPS_THRESHOLD = 40;
export const MIN_FPS_FOR_3D = 20;

const PROBE_MS = 600;

// Rapor §5: sayfa açıldığında kısa bir performans testi (requestAnimationFrame ile
// birkaç karede FPS ölçümü) yapılır; düşük performansta fallback moda geçilir.
export function detectPerformance(): Promise<PerfResult> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ webgl: false, fps: 0 });
      return;
    }

    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    if (!gl) {
      resolve({ webgl: false, fps: 0 });
      return;
    }

    let frames = 0;
    const start = performance.now();

    function tick(now: number) {
      frames++;
      const elapsed = now - start;
      if (elapsed >= PROBE_MS) {
        const fps = Math.round((frames * 1000) / elapsed);
        resolve({ webgl: true, fps });
        return;
      }
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

export function sceneQuality(fps: number): "high" | "low" {
  return fps >= HIGH_FPS_THRESHOLD ? "high" : "low";
}

export function particleCountFor(fps: number): number {
  // Rapor §5: üst segmentte 300 parçacık, alt segmentte 60.
  return sceneQuality(fps) === "high" ? 300 : 60;
}
