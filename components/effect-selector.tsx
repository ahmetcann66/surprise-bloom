"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ANIMATION_CATALOG,
  ANIMATION_CATEGORIES,
  getAnimation,
} from "@/lib/animations";

interface EffectSelectorProps {
  /** Seçili animasyon id'leri. */
  selected: string[];
  onChange: (ids: string[]) => void;
  /** En fazla seçilebilen animasyon sayısı (yoksa sınırsız). */
  max?: number;
}

export default function EffectSelector({
  selected,
  onChange,
  max,
}: EffectSelectorProps) {
  const [openCats, setOpenCats] = useState<string[]>(() => {
    const first = selected[0];
    return [getAnimation(first)?.category ?? ANIMATION_CATEGORIES[0].id];
  });

  return (
    <div className="mt-3 space-y-2">
      {ANIMATION_CATEGORIES.map((cat) => {
        const items = ANIMATION_CATALOG.filter(
          (a) => a.category === cat.id,
        );
        if (items.length === 0) return null;
        const opened = openCats.includes(cat.id);
        const selectedCount = items.filter((a) =>
          selected.includes(a.id),
        ).length;
        return (
          <div
            key={cat.id}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          >
            <button
              type="button"
              aria-expanded={opened}
              onClick={() =>
                setOpenCats((prev) =>
                  opened
                    ? prev.filter((x) => x !== cat.id)
                    : [...prev, cat.id],
                )
              }
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                <span aria-hidden>{cat.emoji}</span>
                {cat.label}
                {selectedCount > 0 && (
                  <span className="rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {selectedCount}
                  </span>
                )}
              </span>
              <span
                aria-hidden
                className={`text-zinc-400 transition-transform duration-300 ${
                  opened ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>
            <AnimatePresence initial={false}>
              {opened && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="grid gap-2 border-t border-zinc-100 p-3 dark:border-zinc-800 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
                    {items.map((a) => {
                      const active = selected.includes(a.id);
                      const disabled =
                        !active && max !== undefined && selected.length >= max;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            onChange(
                              active
                                ? selected.filter((x) => x !== a.id)
                                : [...selected, a.id],
                            )
                          }
                          className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-all ${
                            active
                              ? "border-pink-500 ring-2 ring-pink-500/30"
                              : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                          } ${disabled ? "opacity-40" : ""}`}
                        >
                          <span
                            aria-hidden
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] text-white ${
                              active
                                ? "border-pink-500 bg-pink-500"
                                : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
                            }`}
                          >
                            {active ? "✓" : ""}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                              <span aria-hidden>{a.emoji}</span>
                              {a.label}
                            </span>
                            {a.description && (
                              <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                                {a.description}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
