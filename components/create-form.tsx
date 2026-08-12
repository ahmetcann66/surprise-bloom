"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { getPalette, templates } from "@/lib/templates";
import type { EffectPlacement, GreetingAudio, TemplateId } from "@/lib/types";
import {
  EFFECT_CATEGORIES,
  EFFECTS,
  DEFAULT_EFFECT_BY_TEMPLATE,
} from "@/lib/effects/presets";
import {
  applyPalette,
  getThemeForEvent,
  invitationPalettes,
  INVITATION_ANIMATIONS,
  INVITATION_ANIMATION_CATEGORIES,
  type InvitationAnimationId,
} from "@/lib/invitation/themes";
import {
  EVENT_TYPE_EMOJIS,
  EVENT_TYPE_LABELS,
  type EventType,
  type InvitationLayoutPos,
} from "@/lib/invitation/types";
import QrCode from "@/components/qr-code";
import MusicField from "@/components/music-field";
import PhotoUpload from "@/components/photo-upload";
import VideoUpload from "@/components/video-upload";
import LayoutEditor, { type Pos } from "@/components/layout-editor";
import InvitePreview from "@/components/invitation/invite-preview";

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

interface InviteState {
  eventType: EventType;
  partnerA: string;
  partnerB: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  address: string;
  /** Tema renk paleti ("" = tema varsayılanı). */
  paletteId: string;
  /** Seçilen açılış animasyonları (en fazla 4). */
  animations: InvitationAnimationId[];
  envelopeAnimation: boolean;
  textFont: string;
  textSize: number;
  animationSpeed: number;
  animationScale: number;
  /** Bilgiler bloğu konumu (yüzde). */
  textPos: InvitationLayoutPos;
  /** Fotoğraf konumu/boyutu. */
  photoPos: InvitationLayoutPos;
  /** Animasyon başına konum/boyut. */
  animationPlacements: Record<string, InvitationLayoutPos>;
}

const DEFAULT_INVITE: InviteState = {
  eventType: "dugun",
  partnerA: "",
  partnerB: "",
  date: "",
  time: "",
  venue: "",
  city: "",
  address: "",
  paletteId: "",
  animations: ["cicekler"],
  envelopeAnimation: true,
  textFont: "zarif",
  textSize: 1,
  animationSpeed: 1,
  animationScale: 1,
  textPos: { x: 50, y: 88 },
  photoPos: { x: 50, y: 72, scale: 1 },
  animationPlacements: {},
};

function partnerLabels(et: EventType): { a: string; b?: string } {
  switch (et) {
    case "dugun":
    case "nikah":
      return { a: "Gelinin adı", b: "Damadın adı" };
    case "sunnet":
      return { a: "Çocuğun adı" };
    default:
      return { a: "Kutlanan isim", b: "İkinci isim (opsiyonel)" };
  }
}

interface CreateFormProps {
  initialMode?: "greeting" | "invitation";
  hideProductSelect?: boolean;
  animated?: boolean;
}

function FadeUp({
  children,
  animated,
  delay = 0,
  className,
}: {
  children: ReactNode;
  animated: boolean;
  delay?: number;
  className?: string;
}) {
  if (!animated) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function CreateForm({
  initialMode = "greeting",
  hideProductSelect = false,
  animated = false,
}: CreateFormProps) {
  const [mode, setMode] = useState<"greeting" | "invitation">(initialMode);
  const [templateId, setTemplateId] = useState<TemplateId>(templates[0].id);
  const [paletteId, setPaletteId] = useState<string>(templates[0].palettes[0].id);
  const [invite, setInvite] = useState<InviteState>(DEFAULT_INVITE);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [layout, setLayout] = useState<LayoutState>(DEFAULT_LAYOUT);
  const [audio, setAudio] = useState<GreetingAudio | null>(null);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [video, setVideo] = useState<string | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedLink | null>(null);
  const [openCategories, setOpenCategories] = useState<string[]>([
    INVITATION_ANIMATION_CATEGORIES[0].id,
  ]);

  const selectedTemplate = templates.find((t) => t.id === templateId)!;
  const invTheme = getThemeForEvent(invite.eventType);
  const appliedTheme = applyPalette(invTheme, invite.paletteId || undefined);
  const invitePaletteOptions = invitationPalettes(invite.eventType);
  const labels = partnerLabels(invite.eventType);

  function selectGreeting(id: TemplateId) {
    setMode("greeting");
    setTemplateId(id);
    const t = templates.find((x) => x.id === id)!;
    setPaletteId(t.palettes[0].id);
  }

  function selectInvitation() {
    setMode("invitation");
  }

  function setInviteField<K extends keyof InviteState>(key: K, value: InviteState[K]) {
    setInvite((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      if (mode === "invitation") {
        const res = await fetch("/api/davet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            themeId: invTheme.id,
            paletteId: invite.paletteId || undefined,
            animations: invite.animations,
            envelopeAnimation: invite.envelopeAnimation,
            textFont: invite.textFont,
            textSize: invite.textSize,
            animationSpeed: invite.animationSpeed,
            animationScale: invite.animationScale,
            textPos: invite.textPos,
            photoPos: invite.photoPos,
            animationPlacements: invite.animationPlacements,
            eventType: invite.eventType,
            name: name.trim() || undefined,
            partnerA: invite.partnerA.trim(),
            partnerB: invite.partnerB.trim() || undefined,
            date: invite.date,
            time: invite.time || undefined,
            venue: invite.venue.trim(),
            city: invite.city.trim() || undefined,
            address: invite.address.trim() || undefined,
            message: message.trim() || undefined,
            audio: audio ?? undefined,
            photo: photo,
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
        return;
      }

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
    setMode("greeting");
    setName("");
    setMessage("");
    setLayout(DEFAULT_LAYOUT);
    setInvite(DEFAULT_INVITE);
    setAudio(null);
    setPhoto(undefined);
    setVideo(undefined);
  }

  const qrTheme =
    mode === "invitation" ? appliedTheme : getPalette(selectedTemplate, paletteId);
  const qrEmoji = mode === "invitation" ? appliedTheme.emoji : selectedTemplate.emoji;

  return (
    <>
      <h1 className="text-center text-3xl font-bold sm:text-4xl">
        {mode === "invitation"
          ? "Animasyonlu Davetiye Oluştur"
          : "Animasyonlu Tebrik Linki Oluştur"}
      </h1>
      <p className="mt-3 text-center text-zinc-500 dark:text-zinc-400">
        {mode === "invitation"
          ? "Olay tipini seç, isim ve tarihi gir, paylaşmaya hazır zarf linkini al."
          : "Şablon seç, isim ve mesajı yaz, paylaşmaya hazır özel linkini al."}
      </p>

      {created ? (
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {mode === "invitation" ? "Davetiyen hazır!" : "Linkin hazır!"}
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
            <QrCode value={created.fullUrl} theme={qrTheme} emoji={qrEmoji} />
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-4 w-full text-center text-sm text-zinc-500 underline-offset-4 hover:underline"
          >
            Yeni oluştur
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          {!hideProductSelect && (
            <fieldset>
              <legend className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                Ürün seç
              </legend>
            <div className="mt-3 grid gap-2 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
              <button
                type="button"
                onClick={selectInvitation}
                className={`rounded-xl border p-4 text-left transition-all ${
                  mode === "invitation"
                    ? "border-pink-500 ring-2 ring-pink-500/30"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                }`}
                style={
                  mode === "invitation"
                    ? { background: `${invTheme.centerColor}1a` }
                    : undefined
                }
              >
                <span className="block text-2xl">💌</span>
                <span className="mt-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Davetiye
                </span>
                <span className="mt-2 flex gap-1">
                  {invTheme.petalColors.slice(0, 4).map((c, i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full"
                      style={{ background: c }}
                    />
                  ))}
                </span>
              </button>
              {templates.map((t) => {
                const active = mode === "greeting" && t.id === templateId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectGreeting(t.id)}
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
          )}

          {mode === "greeting" ? (
            <>
              <FadeUp animated={animated} delay={0.05}>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  Renk paleti
                </span>
                <div className="mt-3 grid gap-2 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
                  {selectedTemplate.palettes.map((pal) => {
                    const active = pal.id === paletteId;
                    return (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => setPaletteId(pal.id)}
                        className={`flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-all ${
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
              </FadeUp>

              <FadeUp animated={animated} delay={0.1}>
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
              </FadeUp>

              <FadeUp animated={animated} delay={0.15}>
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
              </FadeUp>

              <FadeUp animated={animated} delay={0.2}>
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
                        <div className="mt-2 grid gap-2 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
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
                                className={`flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-all ${
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
              </FadeUp>

              <FadeUp animated={animated} delay={0.25}>
                <MusicField
                  value={audio}
                  onChange={setAudio}
                  variant="greeting"
                />
              </FadeUp>

              <FadeUp animated={animated} delay={0.3}>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  Fotoğraf{" "}
                  <span className="font-normal text-zinc-400">(opsiyonel)</span>
                </span>
                <PhotoUpload onResult={(url) => setPhoto(url ?? undefined)} />
              </FadeUp>

              <FadeUp animated={animated} delay={0.35}>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  Video{" "}
                  <span className="font-normal text-zinc-400">
                    (opsiyonel, en fazla 15 sn)
                  </span>
                </span>
                <VideoUpload onResult={(url) => setVideo(url ?? undefined)} />
              </FadeUp>

              <FadeUp animated={animated} delay={0.4}>
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
              </FadeUp>
            </>
          ) : (
            <>
              <FadeUp animated={animated} delay={0.05}>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  Etkinlik tipi
                </span>
                <div className="mt-3 grid gap-2 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
                  {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((et) => {
                    const active = invite.eventType === et;
                    return (
                      <button
                        key={et}
                        type="button"
                        onClick={() =>
                          setInvite((prev) => ({
                            ...prev,
                            eventType: et,
                            paletteId: "",
                          }))
                        }
                        className={`flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-all ${
                          active
                            ? "border-pink-500 ring-2 ring-pink-500/30"
                            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                        }`}
                      >
                        <span aria-hidden>{EVENT_TYPE_EMOJIS[et]}</span>
                        {EVENT_TYPE_LABELS[et]}
                      </button>
                    );
                  })}
                </div>
              </FadeUp>

              <FadeUp animated={animated} delay={0.1}>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  Zarf rengi &amp; tema
                </span>
                <div className="mt-3 grid gap-2 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
                  {invitePaletteOptions.map((pal) => {
                    const active =
                      invite.paletteId === ""
                        ? pal.id === invTheme.id
                        : invite.paletteId === pal.id;
                    return (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() =>
                          setInviteField(
                            "paletteId",
                            pal.id === invTheme.id ? "" : pal.id,
                          )
                        }
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-all ${
                          active
                            ? "border-pink-500 ring-2 ring-pink-500/30"
                            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-white dark:border-zinc-900"
                          style={{
                            background: pal.envelope.seal,
                          }}
                        />
                        <span className="truncate">{pal.label}</span>
                      </button>
                    );
                  })}
                </div>
              </FadeUp>

              <FadeUp animated={animated} delay={0.15}>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  Açılış animasyonları{" "}
                  <span className="font-normal text-zinc-400">
                    (birden fazla seçebilirsin, en fazla 4 — hangi havayı
                    kattığını önizlemede canlı izle)
                  </span>
                </span>
                <div className="mt-3 space-y-2">
                  {INVITATION_ANIMATION_CATEGORIES.map((cat) => {
                    const items = INVITATION_ANIMATIONS.filter(
                      (a) => a.category === cat.id,
                    );
                    if (items.length === 0) return null;
                    const opened = openCategories.includes(cat.id);
                    const selectedCount = items.filter((a) =>
                      invite.animations.includes(a.id),
                    ).length;
                    return (
                      <div
                        key={cat.id}
                        className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <button
                          type="button"
                          aria-expanded={opened}
                          onClick={() =>
                            setOpenCategories((prev) =>
                              opened
                                ? prev.filter((x) => x !== cat.id)
                                : [...prev, cat.id],
                            )
                          }
                          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                        >
                          <span className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            <span aria-hidden>{cat.emoji}</span>
                            {cat.label}
                            {selectedCount > 0 && (
                              <span className="rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {selectedCount}
                              </span>
                            )}
                          </span>
                          <span
                            aria-hidden
                            className={`text-zinc-400 transition-transform ${
                              opened ? "rotate-180" : ""
                            }`}
                          >
                            ▾
                          </span>
                        </button>
                        {opened && (
                          <div className="grid gap-2 border-t border-zinc-100 p-3 dark:border-zinc-800 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
                            {items.map((a) => {
                              const active = invite.animations.includes(a.id);
                              const disabled =
                                !active &&
                                invite.animations.length >= 4;
                              return (
                                <button
                                  key={a.id}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() =>
                                    setInvite((prev) => ({
                                      ...prev,
                                      animations: active
                                        ? prev.animations.filter(
                                            (x) => x !== a.id,
                                          )
                                        : [...prev.animations, a.id],
                                    }))
                                  }
                                  className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-all ${
                                    active
                                      ? "border-pink-500 ring-2 ring-pink-500/30"
                                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                                  } ${disabled ? "opacity-40" : ""}`}
                                >
                                  <span
                                    aria-hidden
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] text-white ${
                                      active
                                        ? "border-pink-500 bg-pink-500"
                                        : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
                                    }`}
                                  >
                                    {active ? "✓" : ""}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                      <span aria-hidden>{a.emoji}</span>
                                      {a.label}
                                    </span>
                                    <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                                      {a.description}
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </FadeUp>

              <FadeUp animated={animated} delay={0.2}>
                <button
                  type="button"
                  onClick={() =>
                    setInviteField(
                      "envelopeAnimation",
                      !invite.envelopeAnimation,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span>
                    <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                      Zarf açılış animasyonu
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {invite.envelopeAnimation
                        ? "Zarf animasyonlu açılır (önerilir)"
                        : "Zarf sabit görünür, doğrudan davetiyeye geçer"}
                    </span>
                  </span>
                  <span
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      invite.envelopeAnimation ? "bg-pink-500" : "bg-zinc-300 dark:bg-zinc-600"
                    }`}
                    aria-hidden
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        invite.envelopeAnimation
                          ? "translate-x-[22px]"
                          : "translate-x-0.5"
                      }`}
                    />
                  </span>
                </button>
              </FadeUp>

              <FadeUp animated={animated} delay={0.25}>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  Önizleme
                </span>
                <div className="mt-3">
                  <InvitePreview
                    theme={appliedTheme}
                    eventType={invite.eventType}
                    animations={invite.animations}
                    onAnimationsChange={(ids) =>
                      setInviteField("animations", ids)
                    }
                    envelopeAnimated={invite.envelopeAnimation}
                    partnerA={invite.partnerA}
                    partnerB={invite.partnerB}
                    recipientName={name}
                    photo={photo}
                    textFont={invite.textFont}
                    textSize={invite.textSize}
                    animationSpeed={invite.animationSpeed}
                    animationScale={invite.animationScale}
                    textPos={invite.textPos}
                    photoPos={invite.photoPos}
                    animationPlacements={invite.animationPlacements}
                    onFontChange={(f) => setInviteField("textFont", f)}
                    onTextSizeChange={(v) => setInviteField("textSize", v)}
                    onAnimationSpeedChange={(v) =>
                      setInviteField("animationSpeed", v)
                    }
                    onAnimationScaleChange={(v) =>
                      setInviteField("animationScale", v)
                    }
                    onTextPosChange={(p) => setInviteField("textPos", p)}
                    onPhotoPosChange={(p) => setInviteField("photoPos", p)}
                    onAnimationPosChange={(id, p) =>
                      setInviteField("animationPlacements", {
                        ...invite.animationPlacements,
                        [id]: p,
                      })
                    }
                  />
                </div>
              </FadeUp>

              <FadeUp animated={animated} delay={0.3}>
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
              </FadeUp>

              <FadeUp animated={animated} delay={0.35} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="partnerA"
                    className="text-sm font-medium text-zinc-600 dark:text-zinc-300"
                  >
                    {labels.a}
                  </label>
                  <input
                    id="partnerA"
                    type="text"
                    required
                    value={invite.partnerA}
                    onChange={(e) => setInviteField("partnerA", e.target.value)}
                    placeholder="örn. Merve"
                    maxLength={80}
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
                {labels.b && (
                  <div>
                    <label
                      htmlFor="partnerB"
                      className="text-sm font-medium text-zinc-600 dark:text-zinc-300"
                    >
                      {labels.b}
                    </label>
                    <input
                      id="partnerB"
                      type="text"
                      value={invite.partnerB}
                      onChange={(e) => setInviteField("partnerB", e.target.value)}
                      placeholder="örn. Kerem"
                      maxLength={80}
                      className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                )}
              </FadeUp>

              <FadeUp animated={animated} delay={0.4} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="date"
                    className="text-sm font-medium text-zinc-600 dark:text-zinc-300"
                  >
                    Tarih
                  </label>
                  <input
                    id="date"
                    type="date"
                    required
                    value={invite.date}
                    onChange={(e) => setInviteField("date", e.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-colors focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="time"
                    className="text-sm font-medium text-zinc-600 dark:text-zinc-300"
                  >
                    Saat{" "}
                    <span className="font-normal text-zinc-400">(opsiyonel)</span>
                  </label>
                  <input
                    id="time"
                    type="time"
                    value={invite.time}
                    onChange={(e) => setInviteField("time", e.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-colors focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </FadeUp>

              <FadeUp animated={animated} delay={0.45}>
                <label
                  htmlFor="venue"
                  className="text-sm font-medium text-zinc-600 dark:text-zinc-300"
                >
                  Mekan
                </label>
                <input
                  id="venue"
                  type="text"
                  required
                  value={invite.venue}
                  onChange={(e) => setInviteField("venue", e.target.value)}
                  placeholder="örn. Yalı Konakları Düğün Salonu"
                  maxLength={160}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </FadeUp>

              <FadeUp animated={animated} delay={0.5} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="city"
                    className="text-sm font-medium text-zinc-600 dark:text-zinc-300"
                  >
                    Şehir{" "}
                    <span className="font-normal text-zinc-400">(opsiyonel)</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={invite.city}
                    onChange={(e) => setInviteField("city", e.target.value)}
                    placeholder="örn. İzmir"
                    maxLength={80}
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="address"
                    className="text-sm font-medium text-zinc-600 dark:text-zinc-300"
                  >
                    Adres{" "}
                    <span className="font-normal text-zinc-400">(opsiyonel)</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={invite.address}
                    onChange={(e) => setInviteField("address", e.target.value)}
                    placeholder="örn. Sahil Cad. No:12"
                    maxLength={240}
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </FadeUp>

              <FadeUp animated={animated} delay={0.55}>
                <label
                  htmlFor="message"
                  className="text-sm font-medium text-zinc-600 dark:text-zinc-300"
                >
                  Not{" "}
                  <span className="font-normal text-zinc-400">(opsiyonel)</span>
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Davetlilere kişisel bir not ekleyebilirsin"
                  rows={3}
                  maxLength={2000}
                  className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </FadeUp>

              <FadeUp animated={animated} delay={0.6}>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  Fotoğraf{" "}
                  <span className="font-normal text-zinc-400">(opsiyonel)</span>
                </span>
                <PhotoUpload onResult={(url) => setPhoto(url ?? undefined)} />
              </FadeUp>

              <FadeUp animated={animated} delay={0.65}>
                <MusicField
                  value={audio}
                  onChange={setAudio}
                  variant="invitation"
                  description="Seçmezsen davetiyede sihirli melodi çalar."
                />
              </FadeUp>
            </>
          )}

          {error && (
            <FadeUp animated={animated} delay={0.5}>
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {error}
              </p>
            </FadeUp>
          )}

          <FadeUp animated={animated} delay={0.5}>
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-full bg-pink-600 px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating
                ? "Oluşturuluyor…"
                : mode === "invitation"
                  ? "Davetiyeyi Oluştur"
                  : "Linki Oluştur"}
            </button>
          </FadeUp>
        </form>
      )}
    </>
  );
}
