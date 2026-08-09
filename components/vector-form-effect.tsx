"use client";

import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  buildFlower,
  type GradientDef,
  type VFLeaf,
} from "@/lib/effects/flowers";
import type { EffectConfig } from "@/lib/effects/types";
import type { EffectRepeat } from "@/lib/types";

interface VectorFormEffectProps {
  config: EffectConfig;
  active: boolean;
  reducedMotion: boolean;
  scale?: number;
  /** Çiçek merkezinin başlangıç noktası, ekran yüzdesi (varsayılan orta). */
  position?: { x: number; y: number };
  /** Hız çarpanı (1 = varsayılan; >1 daha hızlı). */
  speed?: number;
  /** Tekrar modu (varsayılan: bir kez). */
  repeat?: EffectRepeat;
  /** repeat === "every" iken tekrarlama aralığı, saniye. */
  repeatEvery?: number;
}

function renderDef(def: GradientDef) {
  const units = def.userSpace ? "userSpaceOnUse" : "objectBoundingBox";
  const stops = def.stops.map((s, i) => (
    <stop
      key={i}
      offset={s.offset}
      stopColor={s.color}
      stopOpacity={s.opacity ?? 1}
    />
  ));
  if (def.kind === "radial") {
    return (
      <radialGradient id={def.id} cx={def.cx} cy={def.cy} r={def.r} gradientUnits={units}>
        {stops}
      </radialGradient>
    );
  }
  return (
    <linearGradient id={def.id} x1={def.x1} y1={def.y1} x2={def.x2} y2={def.y2} gradientUnits={units}>
      {stops}
    </linearGradient>
  );
}

export default function VectorFormEffect({
  config,
  active,
  reducedMotion,
  scale = 1,
  position,
  speed = 1,
  repeat,
  repeatEvery = 15,
}: VectorFormEffectProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rootRef = useRef<SVGGElement>(null);
  const clipRectRef = useRef<SVGRectElement>(null);
  const refs = useRef(new Map<string, SVGGraphicsElement>());
  const [ready, setReady] = useState(false);

  const flower = useMemo(
    () => buildFlower(config.id, config.colorPalette),
    [config.id, config.colorPalette],
  );

  const register = (id: string) => (node: SVGGraphicsElement | null) => {
    if (node) refs.current.set(id, node);
    else refs.current.delete(id);
  };

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const root = rootRef.current;
    if (!svg || !root || !active) return;

    const el = (id: string) => refs.current.get(id);

    const headShift =
      flower.leaves.find((l) => l.headShift)?.headShift ?? 0;
    const rootOrigin = { x: 0, y: -headShift };

    if (reducedMotion) {
      for (const leaf of flower.leaves) {
        const node = el(leaf.id);
        if (node) gsap.set(node, { opacity: 1, fillOpacity: 1, clearProps: "transform" });
      }
      gsap.set(root, { clearProps: "transform" });
      if (clipRectRef.current) {
        gsap.set(clipRectRef.current, { attr: { y: -140, height: 280 } });
      }
      requestAnimationFrame(() => setReady(true));
      return;
    }

    const tl = gsap.timeline({ onComplete: () => setReady(true) });

    if (flower.revealStyle === "draw") {
      const drawable = flower.leaves
        .filter((l) => l.draw)
        .map((l) => el(l.id))
        .filter((n): n is SVGPathElement => !!n);
      for (const node of drawable) {
        const L = node.getTotalLength();
        gsap.set(node, {
          opacity: 0,
          fillOpacity: 0,
          strokeDasharray: L,
          strokeDashoffset: L,
          svgOrigin: "0 0",
          scale: 0.94,
        });
      }
      tl.to(drawable, {
        opacity: 1,
        strokeDashoffset: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.07,
        ease: "power2.inOut",
      }, 0);
      tl.to(drawable, {
        fillOpacity: 1,
        duration: 0.28,
        stagger: 0.04,
        ease: "power1.out",
      }, 0.55);

      const paints = flower.leaves
        .filter((l) => !l.draw && !l.id.endsWith("-c"))
        .map((l) => el(l.id))
        .filter((n): n is SVGGraphicsElement => !!n);
      for (const node of paints) gsap.set(node, { opacity: 0 });
      tl.to(paints, { opacity: 1, duration: 0.3, stagger: 0.06, ease: "power1.out" }, 0.58);

      const center = el(flower.leaves.find((l) => l.id.endsWith("-c"))?.id ?? "");
      if (center) {
        gsap.set(center, { opacity: 0, svgOrigin: "0 0", scale: 0.55 });
        tl.to(center, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, 0.66);
      }

      gsap.set(root, { svgOrigin: `${rootOrigin.x} ${rootOrigin.y}`, scale: 1 });
      tl.to(root, { scale: 1.02, duration: 0.45, ease: "power1.out" }, 0.92);
      tl.to(root, { scale: 1, duration: 0.4, ease: "power1.inOut" }, ">0.08");
    } else {
      const clipRect = clipRectRef.current;
      if (clipRect) gsap.set(clipRect, { attr: { y: 140, height: 0 } });
      gsap.set(root, {
        y: 60,
        rotation: 0,
        scale: 1,
        svgOrigin: `${rootOrigin.x} ${rootOrigin.y}`,
      });

      const petals = flower.leaves
        .filter((l) => l.draw === false)
        .map((l) => el(l.id))
        .filter((n): n is SVGGraphicsElement => !!n);
      for (const node of petals) gsap.set(node, { opacity: 0, svgOrigin: "0 0", scale: 0.7 });
      tl.to(petals, { opacity: 1, scale: 1, duration: 0.45, stagger: 0.05, ease: "back.out(1.4)" }, 0.15);

      const fades = flower.leaves
        .filter((l) => l.draw === undefined && !l.id.endsWith("-c"))
        .map((l) => el(l.id))
        .filter((n): n is SVGGraphicsElement => !!n);
      for (const node of fades) gsap.set(node, { opacity: 0 });
      tl.to(fades, { opacity: 1, duration: 0.3, stagger: 0.06, ease: "power1.out" }, 0.45);

      const center = el(flower.leaves.find((l) => l.id.endsWith("-c"))?.id ?? "");
      if (center) {
        gsap.set(center, { opacity: 0, svgOrigin: "0 0", scale: 0.6 });
        tl.to(center, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, 0.55);
      }

      if (clipRect) {
        tl.to(clipRect, { attr: { y: -140, height: 280 }, duration: 0.7, ease: "power2.out" }, 0);
      }
      tl.to(root, { y: 0, duration: 0.55, ease: "back.out(1.5)" }, 0);
      tl.to(root, { rotation: 2.4, duration: 0.4, ease: "sine.inOut" }, 0.85);
      tl.to(root, { rotation: -1.6, duration: 0.35, ease: "sine.inOut" }, ">");
      tl.to(root, { rotation: 0, duration: 0.3, ease: "sine.inOut" }, ">");
    }

    if (speed > 0) tl.timeScale(speed);

    const effRepeat = repeat ?? "once";
    let timer: ReturnType<typeof setInterval> | undefined;
    if (effRepeat === "loop") {
      tl.repeat(-1);
      queueMicrotask(() => setReady(true));
    } else if (effRepeat === "every") {
      queueMicrotask(() => setReady(true));
      timer = setInterval(
        () => tl.restart(true),
        Math.min(120, Math.max(3, repeatEvery)) * 1000,
      );
    }

    return () => {
      if (timer) clearInterval(timer);
      tl.kill();
      setReady(false);
    };
  }, [active, reducedMotion, flower, speed, repeat, repeatEvery]);

  const width = flower.size * scale;
  const clipId = `vf-${flower.id}-clip`;

  if (!active) return null;

  const positioned = position !== undefined;
  const containerStyle: React.CSSProperties = positioned
    ? {
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: 0,
        height: 0,
        overflow: "visible",
        transform: "translate(-50%, -50%)",
      }
    : {};

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute z-[1] ${
        positioned
          ? ""
          : "inset-0 flex items-center justify-center"
      } ${ready ? "vf-ready" : ""}`}
      style={{ mixBlendMode: "screen", ...containerStyle }}
    >
      <svg
        ref={svgRef}
        viewBox={flower.viewBox}
        width={width}
        height={width * (280 / 200)}
        style={{
          overflow: "visible",
          transform: positioned ? "translate(-50%, -50%)" : undefined,
        }}
      >
        <defs>
          {flower.defs.map((d) => (
            <Fragment key={d.id}>{renderDef(d)}</Fragment>
          ))}
          <clipPath id={clipId}>
            <rect ref={clipRectRef} x={-100} y={-140} width={200} height={0} />
          </clipPath>
        </defs>
        <g
          ref={rootRef}
          clipPath={flower.revealStyle === "grow-up" ? `url(#${clipId})` : undefined}
        >
          {flower.leaves.map((leaf) => (
            <g key={leaf.id} transform={leaf.transform}>
              {renderLeaf(leaf, register)}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function renderLeaf(
  leaf: VFLeaf,
  register: (id: string) => (node: SVGGraphicsElement | null) => void,
) {
  const common = {
    "data-vf": leaf.id,
    ref: register(leaf.id),
    fill: leaf.fill,
    fillOpacity: leaf.fillOpacity,
    stroke: leaf.stroke,
    strokeWidth: leaf.strokeWidth,
    strokeLinecap: leaf.strokeLinecap,
  };
  switch (leaf.tag) {
    case "ellipse":
      return <ellipse {...common} cx={leaf.cx} cy={leaf.cy} rx={leaf.rx} ry={leaf.ry} />;
    case "circle":
      return <circle {...common} cx={leaf.cx} cy={leaf.cy} r={leaf.r} />;
    default:
      return <path {...common} d={leaf.d} />;
  }
}
