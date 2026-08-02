"use client";

import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import type { Theme } from "@/lib/types";

function relativeLuminance(hex: string): number {
  const full =
    hex.replace("#", "").length === 3
      ? hex
          .replace("#", "")
          .split("")
          .map((c) => c + c)
          .join("")
      : hex.replace("#", "");
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const lin = (v: number) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function darkest(colors: string[]): string {
  return colors.reduce((a, b) =>
    relativeLuminance(b) < relativeLuminance(a) ? b : a,
  );
}

function emojiToDataUrl(emoji: string, size = 96): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.font = `${Math.round(size * 0.72)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.06);
  return canvas.toDataURL("image/png");
}

interface QrCodeProps {
  value: string;
  theme: Theme;
  emoji: string;
  fileName?: string;
}

export default function QrCode({
  value,
  theme,
  emoji,
  fileName = "tebrik-qr.png",
}: QrCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const dotColor = darkest([theme.centerColor, theme.accent, "#1f2937"]);
    const qr = new QRCodeStyling({
      width: 220,
      height: 220,
      type: "canvas",
      data: value,
      image: emojiToDataUrl(emoji),
      margin: 4,
      qrOptions: { errorCorrectionLevel: "H" },
      imageOptions: { margin: 5, imageSize: 0.38, hideBackgroundDots: true },
      dotsOptions: { color: dotColor, type: "rounded" },
      cornersSquareOptions: { color: dotColor, type: "extra-rounded" },
      cornersDotOptions: { color: theme.accent, type: "dot" },
      backgroundOptions: { color: "transparent" },
    });
    qr.append(container);
    qrRef.current = qr;
    return () => {
      container.replaceChildren();
      qrRef.current = null;
    };
  }, [value, theme, emoji]);

  function downloadPng() {
    qrRef.current?.download({
      name: fileName.replace(/\.png$/, ""),
      extension: "png",
    });
  }

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        className="h-[220px] w-[220px] rounded-xl bg-white p-2 shadow-sm"
      />
      <button
        type="button"
        onClick={downloadPng}
        className="mt-3 rounded-full border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
      >
        PNG olarak indir
      </button>
    </div>
  );
}
