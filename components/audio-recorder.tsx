"use client";

import { useEffect, useRef, useState } from "react";

const MAX_SECONDS = 10;

interface AudioRecorderProps {
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

export default function AudioRecorder({ onResult }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);

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
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tarayıcı ses kaydını desteklemiyor.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
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
        if (elapsedRef.current >= MAX_SECONDS) stopRecording();
      }, 1000);
    } catch {
      setError("Mikrofon erişimi reddedildi.");
    }
  }

  function clearPreview() {
    setPreview(null);
    onResult(null);
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            recording
              ? "bg-red-600 text-white hover:bg-red-500"
              : "border border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600"
          }`}
        >
          {recording ? "⏹ Kaydı Durdur" : "🎙️ Kendi sesini kaydet"}
        </button>
        {recording && (
          <span className="text-xs text-red-600 dark:text-red-400">
            Kaydediliyor… {elapsed}s / {MAX_SECONDS}s
          </span>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {preview && (
        <div className="mt-3 flex items-center gap-3">
          <audio controls src={preview} className="h-9 max-w-[220px]" />
          <button
            type="button"
            onClick={clearPreview}
            className="text-xs text-zinc-500 underline-offset-4 hover:underline"
          >
            Kaydı kaldır
          </button>
        </div>
      )}
    </div>
  );
}
