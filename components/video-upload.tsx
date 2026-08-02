"use client";

import { useEffect, useRef, useState } from "react";
import { videoFileToDataUrl, MAX_VIDEO_SECONDS } from "@/lib/video";

interface VideoUploadProps {
  onResult: (dataUrl: string | null) => void;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

export default function VideoUpload({ onResult }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (mediaRef.current && mediaRef.current.state === "recording") {
        mediaRef.current.stop();
      }
    },
    [],
  );

  function stopRecording() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
    setElapsed(0);
    if (mediaRef.current && mediaRef.current.state === "recording") {
      mediaRef.current.stop();
    }
  }

  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Tarayıcı video kaydını desteklemiyor.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
          : MediaRecorder.isTypeSupported("video/mp4")
            ? "video/mp4"
            : "";
      const rec = new MediaRecorder(
        stream,
        mime
          ? {
              mimeType: mime,
              // 15 sn için ~2.4MB hedefi: hem dosya sınırına hem Vercel gövde limitine sığar
              videoBitsPerSecond: 1_300_000,
              audioBitsPerSecond: 96_000,
            }
          : undefined,
      );
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" });
        mediaRef.current = null;
        if (blob.size > 0) {
          try {
            const dataUrl = await blobToDataUrl(blob);
            setPreview(dataUrl);
            onResult(dataUrl);
          } catch {
            setError("Kayıt işlenemedi.");
          }
        }
      };
      mediaRef.current = rec;
      elapsedRef.current = 0;
      setElapsed(0);
      rec.start();
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
        if (elapsedRef.current >= MAX_VIDEO_SECONDS) stopRecording();
      }, 1000);
    } catch {
      setError("Kamera/mikrofon erişimi reddedildi.");
    }
  }

  async function handleFile(file: File | undefined) {
    setError("");
    if (!file) return;
    setProcessing(true);
    try {
      const dataUrl = await videoFileToDataUrl(file);
      setPreview(dataUrl);
      onResult(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Video işlenemedi.");
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setProcessing(false);
    }
  }

  function clear() {
    setPreview(null);
    onResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600"
        >
          📹 Video ekle
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            recording
              ? "bg-red-600 text-white hover:bg-red-500"
              : "border border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600"
          }`}
        >
          {recording ? "⏹ Kaydı Durdur" : "🎥 Kendini kaydet"}
        </button>
        {recording && (
          <span className="text-xs text-red-600 dark:text-red-400">
            Kaydediliyor… {elapsed}s / {MAX_VIDEO_SECONDS}s
          </span>
        )}
        {processing && <span className="text-xs text-zinc-500">İşleniyor…</span>}
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {preview && (
        <div className="mt-3 flex items-start gap-3">
          <video
            controls
            playsInline
            src={preview}
            className="h-32 w-52 rounded-xl bg-black object-contain ring-1 ring-zinc-200 dark:ring-zinc-700"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-300"
            >
              Değiştir
            </button>
            <button
              type="button"
              onClick={clear}
              className="text-xs text-zinc-500 underline-offset-4 hover:underline"
            >
              Videoyu kaldır
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
