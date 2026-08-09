import { describe, expect, it } from "vitest";
import {
  ALLOWED_AUDIO_TYPES,
  MAX_AUDIO_SIZE,
  AudioUploadError,
  hashAudioFile,
  validateAudioFile,
} from "@/lib/audio-upload";

describe("validateAudioFile", () => {
  it("desteklenen formatları ve boyutu kabul eder", () => {
    const file = new File([new Uint8Array(1024)], "muzik.mp3", {
      type: "audio/mpeg",
    });
    expect(() => validateAudioFile(file)).not.toThrow();
  });

  it("desteklenmeyen formatı reddeder", () => {
    const file = new File([new Uint8Array(1024)], "muzik.mp4", {
      type: "video/mp4",
    });
    expect(() => validateAudioFile(file)).toThrow(AudioUploadError);
    try {
      validateAudioFile(file);
    } catch (err) {
      expect((err as AudioUploadError).code).toBe("type");
    }
  });

  it("5 MB üzerindeki dosyayı reddeder", () => {
    const file = new File(
      [new Uint8Array(MAX_AUDIO_SIZE + 1)],
      "buyuk.mp3",
      { type: "audio/mpeg" },
    );
    try {
      validateAudioFile(file);
    } catch (err) {
      expect((err as AudioUploadError).code).toBe("size");
    }
    expect(() => validateAudioFile(file)).toThrow();
  });

  it("izinli tipler seti beklenenleri içerir", () => {
    for (const t of ["audio/mpeg", "audio/ogg", "audio/wav", "audio/m4a"]) {
      expect(ALLOWED_AUDIO_TYPES.has(t)).toBe(true);
    }
  });
});

describe("hashAudioFile", () => {
  it("aynı içerik için deterministik hash üretir", async () => {
    const content = new Uint8Array([1, 2, 3, 4, 5]);
    const a = new File([content], "a.mp3", { type: "audio/mpeg" });
    const b = new File([content], "b.mp3", { type: "audio/mpeg" });
    const ha = await hashAudioFile(a);
    const hb = await hashAudioFile(b);
    expect(ha).toBe(hb);
    expect(ha).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(ha)).toBe(true);
  });

  it("farklı içerik için farklı hash üretir", async () => {
    const ha = await hashAudioFile(
      new File([new Uint8Array([1])], "a.mp3", { type: "audio/mpeg" }),
    );
    const hb = await hashAudioFile(
      new File([new Uint8Array([2])], "b.mp3", { type: "audio/mpeg" }),
    );
    expect(ha).not.toBe(hb);
  });
});
