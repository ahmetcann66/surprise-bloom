import { Fragment } from "react";
import type { FigureOutput } from "@/lib/invitation/figures";
import type { GradientDef, VFLeaf } from "@/lib/effects/flowers";

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
      <radialGradient
        id={def.id}
        cx={def.cx}
        cy={def.cy}
        r={def.r}
        gradientUnits={units}
      >
        {stops}
      </radialGradient>
    );
  }
  return (
    <linearGradient
      id={def.id}
      x1={def.x1}
      y1={def.y1}
      x2={def.x2}
      y2={def.y2}
      gradientUnits={units}
    >
      {stops}
    </linearGradient>
  );
}

function renderLeaf(leaf: VFLeaf) {
  const common = {
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

interface FigureSvgProps {
  figure: FigureOutput;
  /** Görünen yükseklik (px). Genişlik viewBox oranından türetilir. */
  height?: number;
  className?: string;
}

export function FigureSvg({ figure, height = 300, className }: FigureSvgProps) {
  const parts = figure.viewBox.split(" ").map(Number);
  const [, , vbW, vbH] = parts as [number, number, number, number];
  const width = height / (vbH / vbW);
  return (
    <svg
      viewBox={figure.viewBox}
      width={width}
      height={height}
      className={className}
      style={{ overflow: "visible" }}
      aria-hidden
    >
      <defs>
        {figure.defs.map((d) => (
          <Fragment key={d.id}>{renderDef(d)}</Fragment>
        ))}
      </defs>
      {figure.leaves.map((leaf) => (
        <g key={leaf.id} transform={leaf.transform}>
          {renderLeaf(leaf)}
        </g>
      ))}
    </svg>
  );
}
