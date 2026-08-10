"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import CreateForm from "@/components/create-form";
import PanelLayout from "@/components/panel-layout";

type PanelKey = "invitation" | "greeting";

const SPRING: Transition = { type: "spring", stiffness: 90, damping: 15 };
const EASE = [0.22, 1, 0.36, 1] as const;

interface PanelDef {
  key: PanelKey;
  emoji: string;
  title: string;
  subtitle: string;
  cta: string;
  baseClass: string;
  glow: string;
  blobs: { color: string; size: string; left: string; top: string }[];
}

const PANEL_DEFS: Record<PanelKey, PanelDef> = {
  invitation: {
    key: "invitation",
    emoji: "💌",
    title: "Davetiye Oluştur",
    subtitle:
      "Düğün, nişan, kına… hayatının en özel anına animasyonlu, müzikli bir davetiye hazırla.",
    cta: "Hemen Oluştur",
    baseClass: "panel-base-invitation",
    glow: "rgba(255, 160, 225, 0.55)",
    blobs: [
      { color: "#ff7ad9", size: "46%", left: "8%", top: "6%" },
      { color: "#a855f7", size: "42%", left: "58%", top: "18%" },
      { color: "#f472b6", size: "38%", left: "30%", top: "62%" },
    ],
  },
  greeting: {
    key: "greeting",
    emoji: "✨",
    title: "Özel Mesajlar",
    subtitle:
      "Sevdiklerine sürpriz dolu, animasyonlu özel bir tebrik linki gönder.",
    cta: "Mesaj Gönder",
    baseClass: "panel-base-greeting",
    glow: "rgba(139, 92, 246, 0.6)",
    blobs: [
      { color: "#6d28d9", size: "46%", left: "52%", top: "4%" },
      { color: "#4f46e5", size: "42%", left: "6%", top: "24%" },
      { color: "#7e22ce", size: "40%", left: "36%", top: "60%" },
    ],
  },
};

interface SplitPanelProps {
  def: PanelDef;
  active: PanelKey | null;
  onOpen: (key: PanelKey) => void;
  onClose: () => void;
  isDesktop: boolean;
}

function SplitPanel({
  def,
  active,
  onOpen,
  onClose,
  isDesktop,
}: SplitPanelProps) {
  const isActive = active === def.key;
  const isLeft = def.key === "invitation";
  const orientation = isDesktop ? "row" : "col";

  const splitPos = {
    row: isLeft
      ? { left: "0%", right: "50%", top: 0, bottom: 0 }
      : { left: "50%", right: "0%", top: 0, bottom: 0 },
    col: isLeft
      ? { top: "0%", bottom: "50%", left: 0, right: 0 }
      : { top: "50%", bottom: "0%", left: 0, right: 0 },
  }[orientation];

  const corners = isActive
    ? { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
    : orientation === "row"
      ? isLeft
        ? { borderTopLeftRadius: 28, borderBottomLeftRadius: 28, borderTopRightRadius: 0, borderBottomRightRadius: 0 }
        : { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 28, borderBottomRightRadius: 28 }
      : isLeft
        ? { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
        : { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 };

  const offset = !isActive && active !== null
    ? orientation === "row"
      ? { x: isLeft ? "-100%" : "100%" }
      : { y: isLeft ? "-100%" : "100%" }
    : {};

  return (
    <motion.div
      className="absolute overflow-hidden"
      style={{ zIndex: isActive ? 20 : 10 }}
      animate={{
        ...(isActive ? { left: 0, right: 0, top: 0, bottom: 0 } : splitPos),
        scale: !isActive && active !== null ? 0.95 : 1,
        opacity: !isActive && active !== null ? 0 : 1,
        ...corners,
        ...offset,
      }}
      transition={SPRING}
      onClick={() => {
        if (active === null) onOpen(def.key);
      }}
    >
      <div className={`absolute inset-0 ${def.baseClass}`} />
      <div className="absolute inset-0 overflow-hidden">
        {def.blobs.map((b, i) => (
          <div
            key={i}
            className="mesh-blob"
            style={{
              background: b.color,
              width: b.size,
              height: b.size,
              left: b.left,
              top: b.top,
              animationDelay: `${i * 3.5}s`,
              animationDuration: `${13 + i * 3}s`,
            }}
          />
        ))}
        <div className="mesh-vignette" />
      </div>

      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="form"
            className="relative z-10 h-full overflow-y-auto"
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <PanelLayout background={null}>
              <CreateForm
                initialMode={def.key}
                hideProductSelect
                animated
              />
            </PanelLayout>
          </motion.div>
        ) : (
          <motion.div
            key="hero"
            className="split-hero-group relative z-10 flex h-full flex-col items-center justify-center p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <button
              type="button"
              onClick={() => onOpen(def.key)}
              className="group flex flex-col items-center outline-none"
              aria-label={def.title}
            >
              <span className="split-hero-glow" aria-hidden />
              <span className="split-hero-card flex flex-col items-center px-10 py-12 sm:px-14 sm:py-16">
                <motion.span
                  className="text-5xl sm:text-6xl"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 18 }}
                >
                  {def.emoji}
                </motion.span>
                <span className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {def.title}
                </span>
                <span className="mt-4 max-w-xs text-sm leading-relaxed text-white/80 sm:text-base">
                  {def.subtitle}
                </span>
                <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-zinc-900 shadow-lg transition-transform duration-300 group-hover:scale-105">
                  {def.cta}
                  <span aria-hidden>→</span>
                </span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isActive && (
        <motion.button
          type="button"
          onClick={onClose}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease: EASE }}
          className="absolute left-4 top-4 z-30 flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/30 sm:left-6 sm:top-6"
        >
          <span aria-hidden>←</span> Geri Dön
        </motion.button>
      )}
    </motion.div>
  );
}

const subscribeDesktop = (onChange: () => void) => {
  const mq = window.matchMedia("(min-width: 768px)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

const getDesktopSnapshot = () => window.matchMedia("(min-width: 768px)").matches;

const subscribeNothing = () => () => {};

export default function SplitScreen() {
  const [active, setActive] = useState<PanelKey | null>(null);
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    () => false,
  );

  if (!mounted) return null;

  return (
    <div className="h-dvh w-full overflow-hidden bg-zinc-950">
      <div className="relative h-full w-full">
        {Object.values(PANEL_DEFS).map((def) => (
          <SplitPanel
            key={def.key}
            def={def}
            active={active}
            onOpen={setActive}
            onClose={() => setActive(null)}
            isDesktop={isDesktop}
          />
        ))}
      </div>
    </div>
  );
}
