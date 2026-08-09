import { describe, expect, it } from "vitest";
import {
  musicTracks,
  getMusicTrack,
  trackDuration,
  playOnce,
  createMusicLooper,
  musicLabel,
  isSilentAudio,
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
