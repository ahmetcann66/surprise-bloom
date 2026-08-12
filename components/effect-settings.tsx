"use client";

import type { EffectRepeat } from "@/lib/types";

// Özel Mesaj (layout-editor) ve Davetiye (invite-preview) panellerinin
// ortak "Efekt ayarları" bloğu: her efekt için boyut (%), hız (×) ve
// tekrar modu. İki panel de aynı arayüzü kullanır; state'leri kendi
// üst bileşenlerinde kalır.

export interface EffectSettingsItem {
  id: string;
  label: string;
  emoji: string;
  /** Görüntülenen boyut çarpanı (varsayılan uygulanmış). */
  scale: number;
  /** Görüntülenen hız çarpanı (varsayılan uygulanmış). */
  speed: number;
  /** Depolanan tekrar modu; undefined = "Varsayılan". */
  repeat: EffectRepeat | undefined;
  /** repeat === "every" iken aralık (sn). */
  repeatEvery: number | undefined;
}

interface EffectSettingsProps {
  items: EffectSettingsItem[];
  onScaleChange: (id: string, scale: number) => void;
  onSpeedChange: (id: string, speed: number) => void;
  /** undefined = "Varsayılan"; çağıran ayrıca repeatEvery'yi temizlemeli. */
  onRepeatChange: (id: string, repeat: EffectRepeat | undefined) => void;
  onRepeatEveryChange: (id: string, seconds: number) => void;
}

export default function EffectSettings({
  items,
  onScaleChange,
  onSpeedChange,
  onRepeatChange,
  onRepeatEveryChange,
}: EffectSettingsProps) {
  if (items.length === 0) return null;

  return (
    <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Efekt ayarları
      </p>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {it.emoji} {it.label}
              </span>
              <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                %{Math.round(it.scale * 100)}
              </span>
            </div>
            <input
              id={`effect-scale-${it.id}`}
              type="range"
              min={0.4}
              max={3}
              step={0.05}
              value={it.scale}
              onChange={(e) =>
                onScaleChange(it.id, Number.parseFloat(e.target.value))
              }
              className="mt-2 w-full accent-pink-500"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <label
                htmlFor={`effect-speed-${it.id}`}
                className="text-[11px] text-zinc-500 dark:text-zinc-400"
              >
                Hız
              </label>
              <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                ×{it.speed.toFixed(2)}
              </span>
            </div>
            <input
              id={`effect-speed-${it.id}`}
              type="range"
              min={0.4}
              max={3}
              step={0.05}
              value={it.speed}
              onChange={(e) =>
                onSpeedChange(it.id, Number.parseFloat(e.target.value))
              }
              className="mt-1 w-full accent-pink-500"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                aria-label={`${it.label} tekrar modu`}
                value={it.repeat ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  onRepeatChange(
                    it.id,
                    v === "" ? undefined : (v as EffectRepeat),
                  );
                }}
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 outline-none transition-colors focus:border-pink-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <option value="">Varsayılan</option>
                <option value="once">Bir kez</option>
                <option value="loop">Sürekli</option>
                <option value="every">Her N sn&apos;de</option>
              </select>
              {it.repeat === "every" && (
                <label className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  her
                  <input
                    type="number"
                    min={3}
                    max={120}
                    step={1}
                    value={it.repeatEvery ?? 15}
                    onChange={(e) =>
                      onRepeatEveryChange(
                        it.id,
                        Math.min(120, Math.max(3, Number(e.target.value) || 15)),
                      )
                    }
                    className="w-14 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 outline-none transition-colors focus:border-pink-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  />
                  saniyede bir
                </label>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
