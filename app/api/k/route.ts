import { NextResponse } from "next/server";
import { createMessage } from "@/lib/store";
import { getClip } from "@/lib/clips";
import { hasEffect } from "@/lib/effects/presets";
import { getTemplate } from "@/lib/templates";
import { TEXT_FONTS } from "@/lib/fonts";
import type { EffectPlacement, GreetingAudio, Position } from "@/lib/types";

function parsePos(raw: unknown): Position | undefined {
  if (
    !raw ||
    typeof raw !== "object" ||
    typeof (raw as Position).x !== "number" ||
    typeof (raw as Position).y !== "number"
  ) {
    return undefined;
  }
  const x = Math.min(95, Math.max(5, (raw as Position).x));
  const y = Math.min(95, Math.max(5, (raw as Position).y));
  const scale = (raw as Position).scale;
  const fontSize = (raw as Position).fontSize;
  return {
    x,
    y,
    ...(typeof scale === "number" && Number.isFinite(scale)
      ? { scale: Math.min(3, Math.max(0.4, scale)) }
      : {}),
    ...(typeof fontSize === "number" && Number.isFinite(fontSize)
      ? { fontSize: Math.min(2, Math.max(0.5, fontSize)) }
      : {}),
  };
}

function parseEffects(raw: unknown): EffectPlacement[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const placements: EffectPlacement[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { id, x, y, scale, speed, repeat, repeatEvery } = item as {
      id?: unknown;
      x?: unknown;
      y?: unknown;
      scale?: unknown;
      speed?: unknown;
      repeat?: unknown;
      repeatEvery?: unknown;
    };
    if (typeof id !== "string" || !hasEffect(id)) continue;
    const parsedRepeat =
      repeat === "once" || repeat === "loop" || repeat === "every"
        ? repeat
        : undefined;
    placements.push({
      id,
      ...(typeof x === "number" && Number.isFinite(x)
        ? { x: Math.min(95, Math.max(5, x)) }
        : {}),
      ...(typeof y === "number" && Number.isFinite(y)
        ? { y: Math.min(95, Math.max(5, y)) }
        : {}),
      ...(typeof scale === "number" && Number.isFinite(scale)
        ? { scale: Math.min(3, Math.max(0.4, scale)) }
        : {}),
      ...(typeof speed === "number" && Number.isFinite(speed)
        ? { speed: Math.min(3, Math.max(0.4, speed)) }
        : {}),
      ...(parsedRepeat ? { repeat: parsedRepeat } : {}),
      ...(parsedRepeat === "every" &&
      typeof repeatEvery === "number" &&
      Number.isFinite(repeatEvery)
        ? { repeatEvery: Math.min(120, Math.max(3, repeatEvery)) }
        : {}),
    });
  }
  return placements.length > 0 ? placements : undefined;
}

function parseAudio(raw: unknown): GreetingAudio | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const { type, value } = raw as { type?: unknown; value?: unknown };
  if (type === "clip") {
    return typeof value === "string" && getClip(value)
      ? { type: "clip", value }
      : undefined;
  }
  if (type === "recording") {
    return typeof value === "string" && value.startsWith("data:audio")
      ? { type: "recording", value }
      : undefined;
  }
  return undefined;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { template, paletteId, name, message, position, effect, effects, photoPos, textPos, effectScale, videoScale, animationSpeed, textFont, audio, photo, video } = (body ?? {}) as {
    template?: string;
    paletteId?: unknown;
    name?: string;
    message?: string;
    position?: string;
    effect?: string;
    effects?: unknown;
    photoPos?: unknown;
    textPos?: unknown;
    effectScale?: unknown;
    videoScale?: unknown;
    animationSpeed?: unknown;
    textFont?: unknown;
    audio?: unknown;
    photo?: unknown;
    video?: unknown;
  };

  if (!template || typeof template !== "string") {
    return NextResponse.json(
      { error: "Şablon seçimi eksik." },
      { status: 400 },
    );
  }

  if (paletteId !== undefined && paletteId !== null) {
    const t = getTemplate(template as Parameters<typeof createMessage>[0]["template"]);
    if (
      typeof paletteId !== "string" ||
      !t ||
      !t.palettes.some((p) => p.id === paletteId)
    ) {
      return NextResponse.json(
        { error: "Geçersiz renk paleti." },
        { status: 400 },
      );
    }
  }

  if (textFont !== undefined && textFont !== null) {
    if (typeof textFont !== "string" || !TEXT_FONTS.some((f) => f.id === textFont)) {
      return NextResponse.json(
        { error: "Geçersiz yazı stili." },
        { status: 400 },
      );
    }
  }

  const parsedAudio = parseAudio(audio);
  if (audio !== undefined && audio !== null && !parsedAudio) {
    return NextResponse.json(
      { error: "Geçersiz ses seçimi." },
      { status: 400 },
    );
  }

  const parsedPosition =
    position === "top" || position === "bottom"
      ? position
      : position === "center"
        ? "center"
        : undefined;
  if (position !== undefined && parsedPosition === undefined) {
    return NextResponse.json(
      { error: "Geçersiz konum seçimi." },
      { status: 400 },
    );
  }

  if (effect !== undefined && effect !== null && !hasEffect(effect)) {
    return NextResponse.json(
      { error: "Geçersiz efekt seçimi." },
      { status: 400 },
    );
  }

  const parsedEffects = parseEffects(effects);
  if (
    effects !== undefined &&
    effects !== null &&
    (!Array.isArray(effects) || (effects.length > 0 && !parsedEffects))
  ) {
    return NextResponse.json(
      { error: "Geçersiz efekt seçimi." },
      { status: 400 },
    );
  }

  if (photoPos !== undefined && photoPos !== null && !parsePos(photoPos)) {
    return NextResponse.json(
      { error: "Geçersiz fotoğraf konumu." },
      { status: 400 },
    );
  }

  if (textPos !== undefined && textPos !== null && !parsePos(textPos)) {
    return NextResponse.json(
      { error: "Geçersiz yazı konumu." },
      { status: 400 },
    );
  }

  if (
    effectScale !== undefined &&
    effectScale !== null &&
    (typeof effectScale !== "number" || !Number.isFinite(effectScale))
  ) {
    return NextResponse.json(
      { error: "Geçersiz efekt ölçeği." },
      { status: 400 },
    );
  }

  if (
    videoScale !== undefined &&
    videoScale !== null &&
    (typeof videoScale !== "number" || !Number.isFinite(videoScale))
  ) {
    return NextResponse.json(
      { error: "Geçersiz video ölçeği." },
      { status: 400 },
    );
  }

  if (
    animationSpeed !== undefined &&
    animationSpeed !== null &&
    (typeof animationSpeed !== "number" || !Number.isFinite(animationSpeed))
  ) {
    return NextResponse.json(
      { error: "Geçersiz animasyon hızı." },
      { status: 400 },
    );
  }

  if (
    photo !== undefined &&
    photo !== null &&
    (typeof photo !== "string" ||
      !photo.startsWith("data:image") ||
      photo.length > 1_000_000)
  ) {
    return NextResponse.json(
      { error: "Geçersiz fotoğraf." },
      { status: 400 },
    );
  }

  if (
    video !== undefined &&
    video !== null &&
    (typeof video !== "string" ||
      !/^data:video\/(webm|mp4|ogg);(?:[a-z0-9_.=,-]+;)*base64,/i.test(video) ||
      video.length > 4_000_000) // ≈3MB — Vercel gövde limiti içinde kalmak için
  ) {
    return NextResponse.json(
      { error: "Geçersiz video (max ~3MB, webm/mp4)." },
      { status: 400 },
    );
  }

  try {
    const greeting = await createMessage({
      template: template as Parameters<typeof createMessage>[0]["template"],
      paletteId: typeof paletteId === "string" ? paletteId : undefined,
      name: typeof name === "string" && name.trim() ? name.trim() : undefined,
      message: typeof message === "string" ? message : undefined,
      position: parsedPosition,
      effect: typeof effect === "string" ? effect : undefined,
      effects: parsedEffects,
      photoPos: parsePos(photoPos),
      textPos: parsePos(textPos),
      effectScale:
        typeof effectScale === "number" ? Math.min(3, Math.max(0.4, effectScale)) : undefined,
      videoScale:
        typeof videoScale === "number" ? Math.min(3, Math.max(0.4, videoScale)) : undefined,
      animationSpeed:
        typeof animationSpeed === "number"
          ? Math.min(3, Math.max(0.4, animationSpeed))
          : undefined,
      textFont: typeof textFont === "string" ? textFont : undefined,
      audio: parsedAudio,
      photo: typeof photo === "string" ? photo : undefined,
      video: typeof video === "string" ? video : undefined,
    });
    return NextResponse.json({ id: greeting.id, url: `/k/${greeting.id}` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bir hata oluştu." },
      { status: 400 },
    );
  }
}
