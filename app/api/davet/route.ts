import { NextResponse } from "next/server";
import { createInvitation } from "@/lib/invitation/store";
import { getTheme } from "@/lib/invitation/themes";
import { isEventType } from "@/lib/invitation/types";
import { getClip } from "@/lib/clips";
import { getMusicTrack, SILENT_CLIP } from "@/lib/music";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import type { GreetingAudio } from "@/lib/types";

function parseAudio(raw: unknown): GreetingAudio | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const { type, value } = raw as { type?: unknown; value?: unknown };
  if (type === "clip") {
    return typeof value === "string" &&
      (getClip(value) || getMusicTrack(value) || value === SILENT_CLIP)
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
