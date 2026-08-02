import { NextResponse } from "next/server";
import { createMessage } from "@/lib/store";
import { getClip } from "@/lib/clips";
import type { GreetingAudio } from "@/lib/types";

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

  const { template, name, message, audio, photo, video } = (body ?? {}) as {
    template?: string;
    name?: string;
    message?: string;
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
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "Alıcının ismi gerekli." },
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
      name,
      message: typeof message === "string" ? message : undefined,
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
