import { describe, expect, it } from "vitest";
import {
  musicTracks,
  getMusicTrack,
  trackDuration,
  playOnce,
  createMusicLooper,
  musicLabel,
  isSilentAudio,
  isValidTrim,
  isStorageAudioUrl,
  parseGreetingAudio,
  AUDIO_BUCKET,
  SILENT_CLIP,
} from "@/lib/music";
import type { GreetingAudio } from "@/lib/types";

describe("music tracks", () => {
  it("getMusicTrack bilinen/geçersiz id'yi doğrular", () => {
    expect(getMusicTrack("muzik-kutusu")?.label).toBe("Müzik Kutusu");
    expect(getMusicTrack("sihir")?.label).toBe("Sihirli An");
    expect(getMusicTrack("yok")).toBeUndefined();
  });

  it("parça id'leri benzersizdir", () => {
    const ids = musicTracks.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tüm parçalar geçerli yapıya sahiptir", () => {
    for (const track of musicTracks) {
      expect(track.bpm).toBeGreaterThan(0);
      expect(track.beats).toBeGreaterThan(0);
      expect(track.notes.length).toBeGreaterThan(0);
      expect(trackDuration(track)).toBeGreaterThan(0);
      for (const n of track.notes) {
        expect(n.f).toBeGreaterThan(0);
        expect(n.t).toBeGreaterThanOrEqual(0);
        expect(n.t).toBeLessThan(track.beats);
        expect(n.d).toBeGreaterThan(0);
        expect(n.v ?? 0.15).toBeGreaterThan(0);
      }
    }
  });

  it("parça başına notalar dalga tipi geçerli", () => {
    for (const track of musicTracks) {
      for (const n of track.notes) {
        const type = n.o ?? "triangle";
        expect(["sine", "triangle", "square", "sawtooth"]).toContain(type);
      }
    }
  });

  it("yeni sentez parçalar katalogda mevcut ve çalınabilir sürelidir", () => {
    expect(getMusicTrack("dogum-gunu")?.label).toBe("Doğum Günü");
    expect(getMusicTrack("huzur")?.label).toBe("Huzur");
    for (const id of ["dogum-gunu", "huzur"]) {
      const track = getMusicTrack(id)!;
      expect(trackDuration(track)).toBeGreaterThan(3);
      expect(track.notes.length).toBeGreaterThan(0);
    }
  });
});

describe("musicLabel / isSilentAudio", () => {
  it("çalınabilir parça/legacy clip/recording etiketlerini verir", () => {
    expect(musicLabel({ type: "clip", value: "vals" })).toBe("Aşk Valsi");
    expect(musicLabel({ type: "clip", value: "ninni" })).toBe("Yumuşak Kutu");
    expect(musicLabel({ type: "recording", value: "data:audio/webm" })).toBe(
      "Ses kaydı",
    );
  });

  it("sessiz/boş/geçersiz durumları işaretler", () => {
    expect(musicLabel(null)).toBeNull();
    expect(musicLabel(undefined)).toBeNull();
    expect(musicLabel({ type: "clip", value: SILENT_CLIP })).toBeNull();
    expect(musicLabel({ type: "clip", value: "yok" })).toBe("Müzik");
    expect(isSilentAudio({ type: "clip", value: SILENT_CLIP })).toBe(true);
    expect(isSilentAudio({ type: "clip", value: "vals" })).toBe(false);
    expect(isSilentAudio(null)).toBe(true);
  });

  it("file tipi etiketi ve sessizlik kontrolünü yönetir", () => {
    expect(musicLabel({ type: "file", value: "https://x" })).toBe("Özel müzik");
    expect(isSilentAudio({ type: "file", value: "https://x" })).toBe(false);
  });
});

describe("isStorageAudioUrl / isValidTrim", () => {
  const base = "https://abcd.supabase.co";

  it("yalnızca proje bucket URL'lerini kabul eder", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = base;
    try {
      expect(isStorageAudioUrl(`${base}/storage/v1/object/public/${AUDIO_BUCKET}/uploads/abc.mp3`)).toBe(true);
      expect(isStorageAudioUrl(`${base}/storage/v1/object/public/other/uploads/abc.mp3`)).toBe(false);
      expect(isStorageAudioUrl(`https://evil.com/storage/v1/object/public/${AUDIO_BUCKET}/abc.mp3`)).toBe(false);
      expect(isStorageAudioUrl(`${base}/storage/v1/object/public/${AUDIO_BUCKET}/../etc/passwd`)).toBe(false);
      expect(isStorageAudioUrl(`${base}/storage/v1/object/public/${AUDIO_BUCKET}/abc.mp3?x=1`)).toBe(false);
      expect(isStorageAudioUrl(`${base}/storage/v1/object/public/${AUDIO_BUCKET}/`)).toBe(false);
    } finally {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
  });

  it("config yoksa storage URL geçersiz sayılır", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(isStorageAudioUrl(`${base}/storage/v1/object/public/${AUDIO_BUCKET}/a.mp3`)).toBe(false);
  });

  it("trim penceresi tutarlılığını doğrular", () => {
    expect(isValidTrim({ type: "file", value: "https://x" })).toBe(true);
    expect(isValidTrim({ type: "file", value: "https://x", startTime: 10, endTime: 20 })).toBe(true);
    expect(isValidTrim({ type: "file", value: "https://x", startTime: 10 })).toBe(false);
    expect(isValidTrim({ type: "file", value: "https://x", endTime: 20 })).toBe(false);
    expect(isValidTrim({ type: "file", value: "https://x", startTime: 20, endTime: 10 })).toBe(false);
    expect(isValidTrim({ type: "file", value: "https://x", startTime: -1, endTime: 5 })).toBe(false);
    expect(isValidTrim({ type: "clip", value: "vals" })).toBe(true);
  });
});

describe("parseGreetingAudio", () => {
  const base = "https://abcd.supabase.co";

  it("geçerli clip/recording/file değerlerini üretir", () => {
    expect(parseGreetingAudio({ type: "clip", value: "vals" })).toEqual({
      type: "clip",
      value: "vals",
    });
    expect(parseGreetingAudio({ type: "clip", value: SILENT_CLIP })).toEqual({
      type: "clip",
      value: SILENT_CLIP,
    });
    expect(parseGreetingAudio({ type: "recording", value: "data:audio/webm;base64,abc" })).toEqual({
      type: "recording",
      value: "data:audio/webm;base64,abc",
    });
    process.env.NEXT_PUBLIC_SUPABASE_URL = base;
    try {
      expect(
        parseGreetingAudio({
          type: "file",
          value: `${base}/storage/v1/object/public/${AUDIO_BUCKET}/uploads/abc.mp3`,
          startTime: 15.123,
          endTime: 45.678,
        }),
      ).toEqual({
        type: "file",
        value: `${base}/storage/v1/object/public/${AUDIO_BUCKET}/uploads/abc.mp3`,
        startTime: 15.1,
        endTime: 45.7,
      });
      expect(
        parseGreetingAudio({
          type: "file",
          value: `${base}/storage/v1/object/public/${AUDIO_BUCKET}/uploads/abc.mp3`,
        }),
      ).toEqual({
        type: "file",
        value: `${base}/storage/v1/object/public/${AUDIO_BUCKET}/uploads/abc.mp3`,
      });
    } finally {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
  });

  it("geçersiz girdileri reddeder", () => {
    expect(parseGreetingAudio(null)).toBeUndefined();
    expect(parseGreetingAudio(undefined)).toBeUndefined();
    expect(parseGreetingAudio("string")).toBeUndefined();
    expect(parseGreetingAudio({ type: "clip", value: 42 })).toBeUndefined();
    expect(parseGreetingAudio({ type: "clip", value: "bilinmeyen" })).toBeUndefined();
    expect(parseGreetingAudio({ type: "recording", value: "https://x" })).toBeUndefined();
    expect(parseGreetingAudio({ type: "file", value: "https://evil.com/x" })).toBeUndefined();
    process.env.NEXT_PUBLIC_SUPABASE_URL = base;
    try {
      const url = `${base}/storage/v1/object/public/${AUDIO_BUCKET}/uploads/abc.mp3`;
      expect(parseGreetingAudio({ type: "file", value: url, startTime: "10" })).toBeUndefined();
      expect(parseGreetingAudio({ type: "file", value: url, startTime: 10 })).toBeUndefined();
      expect(parseGreetingAudio({ type: "file", value: url, startTime: 30, endTime: 10 })).toBeUndefined();
      expect(parseGreetingAudio({ type: "file", value: url, startTime: 10, endTime: 1000 })).toBeUndefined();
    } finally {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
  });
});

describe("music engine", () => {
  class FakeContext {
    destination = {};
    currentTime = 0;
    state: AudioContextState = "running";
    createOscillator() {
      return {
        type: "sine",
        frequency: { value: 0 },
        connect() {},
        start() {},
        stop() {},
      };
    }
    createGain() {
      return {
        gain: {
          value: 0,
          setValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
      };
    }
  }

  it("playOnce sahte ctx'te hata vermez", () => {
    const ctx = new FakeContext() as unknown as AudioContext;
    expect(() =>
      playOnce(ctx, getMusicTrack("vals")!, 0.5),
    ).not.toThrow();
  });

  it("looper başlatılır/durdurulur, tekrarlanan start noop'tur", () => {
    const ctx = new FakeContext() as unknown as AudioContext;
    const looper = createMusicLooper(ctx, getMusicTrack("sihir")!);
    expect(() => looper.start()).not.toThrow();
    expect(() => looper.start()).not.toThrow();
    expect(() => looper.stop()).not.toThrow();
    expect(() => looper.stop()).not.toThrow();
  });

  it("sessiz klibin çalınacak parçası yoktur", () => {
    const silent: GreetingAudio = { type: "clip", value: SILENT_CLIP };
    expect(getMusicTrack(silent.value)).toBeUndefined();
  });
});
