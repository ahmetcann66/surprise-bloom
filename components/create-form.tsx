"use client";

import { useState } from "react";
import { getPalette, templates } from "@/lib/templates";
import { clips } from "@/lib/clips";
import type { EffectPlacement, GreetingAudio, TemplateId } from "@/lib/types";
import {
  EFFECT_CATEGORIES,
  EFFECTS,
  DEFAULT_EFFECT_BY_TEMPLATE,
} from "@/lib/effects/presets";
import QrCode from "@/components/qr-code";
import AudioRecorder from "@/components/audio-recorder";
import GreetingAudioButton from "@/components/greeting-audio";
import PhotoUpload from "@/components/photo-upload";
import VideoUpload from "@/components/video-upload";
import LayoutEditor, { type Pos } from "@/components/layout-editor";

interface CreatedLink {
  url: string;
  fullUrl: string;
}

interface LayoutState {
  photo: Pos;
  text: Pos;
  videoScale: number;
  animationSpeed: number;
  textFont: string;
  effects: EffectPlacement[];
}

const DEFAULT_LAYOUT: LayoutState = {
  photo: { x: 50, y: 50, scale: 1 },
  text: { x: 50, y: 75, fontSize: 1 },
  videoScale: 1,
  animationSpeed: 1,
  textFont: "system",
  effects: [{ id: DEFAULT_EFFECT_BY_TEMPLATE[templates[0].id], scale: 1 }],
};

export default function CreateForm() {
  const [templateId, setTemplateId] = useState<TemplateId>(templates[0].id);
  const [paletteId, setPaletteId] = useState<string>(templates[0].palettes[0].id);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [layout, setLayout] = useState<LayoutState>(DEFAULT_LAYOUT);
  const [audio, setAudio] = useState<GreetingAudio | null>(null);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [video, setVideo] = useState<string | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedLink | null>(null);

  const selectedTemplate = templates.find((t) => t.id === templateId)!;

  function selectTemplate(id: TemplateId) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id)!;
    setPaletteId(t.palettes[0].id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/k", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: templateId,
          paletteId,
          name: name.trim() || undefined,
          message: message.trim() || undefined,
          effect: layout.effects[0]?.id,
          effects: layout.effects.map((e) => ({
            id: e.id,
            x: e.x ?? 50,
            y: e.y ?? 50,
            scale: e.scale ?? 1,
            ...(typeof e.speed === "number" ? { speed: e.speed } : {}),
            ...(e.repeat ? { repeat: e.repeat } : {}),
            ...(e.repeat === "every"
              ? { repeatEvery: e.repeatEvery ?? 15 }
              : {}),
          })),
          photoPos: layout.photo,
          textPos: layout.text,
          videoScale: layout.videoScale,
          animationSpeed: layout.animationSpeed,
          textFont: layout.textFont,
          audio: audio ?? undefined,
          photo: photo,
          video: video,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Bir hata oluştu.");
        return;
      }
      setCreated({
        url: data.url as string,
        fullUrl: `${window.location.origin}${data.url}`,
      });
    } catch {
      setError("Bağlantı kurulamadı, tekrar dene.");
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.fullUrl);
    } catch {
      // iOS gibi kısıtlı ortamlar için güvenli düşüş
    }
  }

  function reset() {
    setCreated(null);
    setName("");
    setMessage("");
    setLayout(DEFAULT_LAYOUT);
    setAudio(null);
    setPhoto(undefined);
    setVideo(undefined);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-12 sm:py-16">
      <h1 className="text-center text-3xl font-bold sm:text-4xl">
        Animasyonlu Tebrik Linki Oluştur
      </h1>
      <p className="mt-3 text-center text-zinc-500 dark:text-zinc-400">
        Şablon seç, isim ve mesajı yaz, paylaşmaya hazır özel linkini al.
      </p>

      {created ? (
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Linkin hazır!
          </p>
          <p className="mt-2 break-all rounded-lg bg-zinc-100 p-3 text-center text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {created.fullUrl}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={copyLink}
              className="flex-1 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Linki Kopyala
            </button>
            <a
              href={created.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-full bg-pink-600 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-pink-500"
            >
              Önizlemeyi Aç
            </a>
          </div>
          <div className="mt-6 flex justify-center">
            <QrCode
              value={created.fullUrl}
              theme={getPalette(selectedTemplate, paletteId)}
              emoji={selectedTemplate.emoji}
            />
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-4 w-full text-center text-sm text-zinc-500 underline-offset-4 hover:underline"
          >
            Yeni link oluştur
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <fieldset>
            <legend className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Şablon seç
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {templates.map((t) => {
                const active = t.id === templateId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTemplate(t.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      active
                        ? "border-pink-500 ring-2 ring-pink-500/30"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                    style={
                      active
                        ? { background: `${t.palettes[0].centerColor}1a` }
                        : undefined
                    }
                  >
                    <span className="block text-2xl">{t.emoji}</span>
                    <span className="mt-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {t.label}
                    </span>
                    <span className="mt-2 flex gap-1">
                      {t.palettes[0].petalColors.slice(0, 4).map((c, i) => (
                        <span
                          key={i}
                          className="h-2 w-2 rounded-full"
                          style={{ background: c }}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Renk paleti
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedTemplate.palettes.map((pal) => {
                const active = pal.id === paletteId;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => setPaletteId(pal.id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-all ${
                      active
                        ? "border-pink-500 ring-2 ring-pink-500/30"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                  >
                    <span className="flex -space-x-1">
                      {pal.petalColors.slice(0, 3).map((c, i) => (
                        <span
                          key={i}
                          className="h-3.5 w-3.5 rounded-full border border-white dark:border-zinc-900"
                          style={{ background: c }}
                        />
                      ))}
                    </span>
                    {pal.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="name"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300"
            >
              Alıcının ismi{" "}
              <span className="font-normal text-zinc-400">(opsiyonel)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="örn. Ayşe"
              maxLength={80}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300"
            >
              Mesaj{" "}
              <span className="font-normal text-zinc-400">(opsiyonel)</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Kişisel bir not ekleyebilirsin"
              rows={3}
              maxLength={2000}
              className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Efekt seç{" "}
              <span className="font-normal text-zinc-400">
                (birden fazla seçebilirsin — her biri kendi başlangıç
                noktasından başlar)
              </span>
            </span>
            <div className="mt-3 space-y-4">
              {EFFECT_CATEGORIES.map((cat) => {
                const list = Object.values(EFFECTS).filter(
                  (e) => e.category === cat.id,
                );
                return (
                  <div key={cat.id}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      {cat.label}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {list.map((ef) => {
                        const active = layout.effects.some(
                          (e) => e.id === ef.id,
                        );
                        return (
                          <button
                            key={ef.id}
                            type="button"
                            onClick={() =>
                              setLayout((prev) => ({
                                ...prev,
                                effects: active
                                  ? prev.effects.filter((e) => e.id !== ef.id)
                                  : [...prev.effects, { id: ef.id, scale: 1 }],
                              }))
                            }
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                              active
                                ? "border-pink-500 ring-2 ring-pink-500/30"
                                : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                            }`}
                          >
                            <span aria-hidden>{ef.emoji}</span>
                            {ef.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Ses ekle{" "}
              <span className="font-normal text-zinc-400">(opsiyonel)</span>
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAudio(null)}
                className={`rounded-full border px-3 py-2 text-xs font-medium transition-all ${
                  audio === null
                    ? "border-zinc-500 ring-2 ring-zinc-500/30 dark:border-zinc-300"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                }`}
              >
                🔇 Ses yok
              </button>
              {clips.map((c) => {
                const active = audio?.type === "clip" && audio.value === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAudio({ type: "clip", value: c.id })}
                    className={`rounded-full border px-3 py-2 text-xs font-medium transition-all ${
                      active
                        ? "border-pink-500 ring-2 ring-pink-500/30"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                  >
                    {c.emoji} {c.label}
                  </button>
                );
              })}
            </div>
            <AudioRecorder
              onResult={(dataUrl) =>
                setAudio(dataUrl ? { type: "recording", value: dataUrl } : null)
              }
            />
            {audio && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Seçilen ses:
                </span>
                <GreetingAudioButton audio={audio} />
              </div>
            )}
          </div>

          <div>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Fotoğraf{" "}
              <span className="font-normal text-zinc-400">(opsiyonel)</span>
            </span>
            <PhotoUpload onResult={(url) => setPhoto(url ?? undefined)} />
          </div>

          <div>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Video{" "}
              <span className="font-normal text-zinc-400">
                (opsiyonel, en fazla 15 sn)
              </span>
            </span>
            <VideoUpload onResult={(url) => setVideo(url ?? undefined)} />
          </div>

          <LayoutEditor
            photo={photo}
            video={video}
            name={name}
            message={message}
            theme={getPalette(selectedTemplate, paletteId)}
            effects={layout.effects}
            photoPos={layout.photo}
            textPos={layout.text}
            videoScale={layout.videoScale}
            animationSpeed={layout.animationSpeed}
            onSpeedChange={(v) =>
              setLayout((prev) => ({ ...prev, animationSpeed: v }))
            }
            textFont={layout.textFont}
            onFontChange={(f) =>
              setLayout((prev) => ({ ...prev, textFont: f }))
            }
            onChange={(p, t, v, e) =>
              setLayout((prev) => ({
                ...prev,
                photo: p,
                text: t,
                videoScale: v,
                effects: e,
              }))
            }
          />

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-full bg-pink-600 px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Oluşturuluyor…" : "Linki Oluştur"}
          </button>
        </form>
      )}
    </div>
  );
}
