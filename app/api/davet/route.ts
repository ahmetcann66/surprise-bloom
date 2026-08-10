import { NextResponse } from "next/server";
import { createInvitation } from "@/lib/invitation/store";
import {
  getTheme,
  invitationPalettes,
  isInvitationAnimation,
} from "@/lib/invitation/themes";
import { isEventType } from "@/lib/invitation/types";
import { parseGreetingAudio } from "@/lib/music";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { isTextFontId } from "@/lib/fonts";
import type { GreetingAudio } from "@/lib/types";

const clampNumber = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(max, Math.max(min, v))
    : undefined;

function parseAudio(raw: unknown): GreetingAudio | undefined {
  return parseGreetingAudio(raw);
}

export async function POST(request: Request) {
  if (!checkRateLimit(clientIp(request))) {
    return NextResponse.json(
      { error: "Çok fazla istek gönderdin. Lütfen biraz sonra tekrar dene." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const {
    themeId,
    paletteId,
    animation,
    envelopeAnimation,
    textFont,
    textSize,
    animationSpeed,
    animationScale,
    name,
    eventType,
    partnerA,
    partnerB,
    date,
    time,
    venue,
    city,
    address,
    message,
    audio,
    photo,
  } = (body ?? {}) as {
    themeId?: unknown;
    paletteId?: unknown;
    animation?: unknown;
    envelopeAnimation?: unknown;
    textFont?: unknown;
    textSize?: unknown;
    animationSpeed?: unknown;
    animationScale?: unknown;
    name?: unknown;
    eventType?: unknown;
    partnerA?: unknown;
    partnerB?: unknown;
    date?: unknown;
    time?: unknown;
    venue?: unknown;
    city?: unknown;
    address?: unknown;
    message?: unknown;
    audio?: unknown;
    photo?: unknown;
  };

  if (typeof themeId !== "string" || !getTheme(themeId)) {
    return NextResponse.json(
      { error: "Geçersiz davetiye teması." },
      { status: 400 },
    );
  }

  if (!isEventType(eventType)) {
    return NextResponse.json(
      { error: "Geçersiz etkinlik tipi." },
      { status: 400 },
    );
  }

  if (getTheme(themeId)!.eventType !== eventType) {
    return NextResponse.json(
      { error: "Etkinlik tipi ile tema eşleşmiyor." },
      { status: 400 },
    );
  }

  const paletteOptions = invitationPalettes(eventType);
  if (
    paletteId !== undefined &&
    paletteId !== null &&
    (typeof paletteId !== "string" ||
      !paletteOptions.some((p) => p.id === paletteId))
  ) {
    return NextResponse.json(
      { error: "Geçersiz renk paleti." },
      { status: 400 },
    );
  }

  if (
    animation !== undefined &&
    animation !== null &&
    !isInvitationAnimation(animation)
  ) {
    return NextResponse.json(
      { error: "Geçersiz animasyon seçimi." },
      { status: 400 },
    );
  }

  if (
    envelopeAnimation !== undefined &&
    envelopeAnimation !== null &&
    typeof envelopeAnimation !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Geçersiz zarf animasyonu seçimi." },
      { status: 400 },
    );
  }

  if (
    textFont !== undefined &&
    textFont !== null &&
    !isTextFontId(textFont)
  ) {
    return NextResponse.json(
      { error: "Geçersiz yazı stili." },
      { status: 400 },
    );
  }

  const parsedTextSize = clampNumber(textSize, 0.5, 2.5);
  const parsedAnimationSpeed = clampNumber(animationSpeed, 0.4, 3);
  const parsedAnimationScale = clampNumber(animationScale, 0.4, 3);
  if (
    (textSize !== undefined &&
      textSize !== null &&
      parsedTextSize === undefined) ||
    (animationSpeed !== undefined &&
      animationSpeed !== null &&
      parsedAnimationSpeed === undefined) ||
    (animationScale !== undefined &&
      animationScale !== null &&
      parsedAnimationScale === undefined)
  ) {
    return NextResponse.json(
      { error: "Geçersiz boyut/hız değeri." },
      { status: 400 },
    );
  }

  if (
    typeof partnerA !== "string" ||
    !partnerA.trim() ||
    partnerA.trim().length > 80
  ) {
    return NextResponse.json(
      { error: "Geçerli bir isim girin." },
      { status: 400 },
    );
  }

  if (
    partnerB !== undefined &&
    partnerB !== null &&
    (typeof partnerB !== "string" || partnerB.trim().length > 80)
  ) {
    return NextResponse.json(
      { error: "Geçerli bir isim girin." },
      { status: 400 },
    );
  }

  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return NextResponse.json(
      { error: "Geçerli bir tarih girin (GG/AA/YYYY)." },
      { status: 400 },
    );
  }

  if (
    time !== undefined &&
    time !== null &&
    (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
  ) {
    return NextResponse.json(
      { error: "Geçerli bir saat girin (HH:MM)." },
      { status: 400 },
    );
  }

  if (typeof venue !== "string" || !venue.trim() || venue.trim().length > 160) {
    return NextResponse.json(
      { error: "Geçerli bir mekan girin." },
      { status: 400 },
    );
  }

  const optionalText = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() && v.trim().length <= max
      ? v.trim()
      : v === undefined || v === null || (typeof v === "string" && v.trim() === "")
        ? undefined
        : null;

  if (optionalText(city, 80) === null || optionalText(address, 240) === null) {
    return NextResponse.json(
      { error: "Şehir/adres çok uzun." },
      { status: 400 },
    );
  }

  if (optionalText(message, 2000) === null) {
    return NextResponse.json(
      { error: "Mesaj çok uzun." },
      { status: 400 },
    );
  }

  if (
    name !== undefined &&
    name !== null &&
    (typeof name !== "string" || name.trim().length > 80)
  ) {
    return NextResponse.json(
      { error: "Geçerli bir isim girin." },
      { status: 400 },
    );
  }

  const parsedAudio = parseAudio(audio);
  if (audio !== undefined && audio !== null && !parsedAudio) {
    return NextResponse.json(
      { error: "Geçersiz ses seçimi." },
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

  try {
    const invitation = await createInvitation({
      themeId,
      name: typeof name === "string" && name.trim() ? name.trim() : undefined,
      details: {
        eventType,
        partnerA: partnerA.trim(),
        ...(partnerB !== undefined && partnerB !== null && partnerB.trim()
          ? { partnerB: partnerB.trim() }
          : {}),
        date,
        ...(time !== undefined && time !== null ? { time } : {}),
        venue: venue.trim(),
        ...(optionalText(city, 80) ? { city: optionalText(city, 80) as string } : {}),
        ...(optionalText(address, 240)
          ? { address: optionalText(address, 240) as string }
          : {}),
        ...(optionalText(message, 2000)
          ? { message: optionalText(message, 2000) as string }
          : {}),
      },
      audio: parsedAudio,
      photo: typeof photo === "string" ? photo : undefined,
      options: {
        ...(typeof paletteId === "string" ? { paletteId } : {}),
        ...(typeof animation === "string" ? { animation } : {}),
        ...(typeof envelopeAnimation === "boolean"
          ? { envelopeAnimation }
          : {}),
        ...(typeof textFont === "string" ? { textFont } : {}),
        ...(parsedTextSize !== undefined ? { textSize: parsedTextSize } : {}),
        ...(parsedAnimationSpeed !== undefined
          ? { animationSpeed: parsedAnimationSpeed }
          : {}),
        ...(parsedAnimationScale !== undefined
          ? { animationScale: parsedAnimationScale }
          : {}),
      },
    });
    return NextResponse.json({
      id: invitation.id,
      url: `/davet/${invitation.id}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bir hata oluştu." },
      { status: 400 },
    );
  }
}
