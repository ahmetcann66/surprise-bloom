import { afterAll, describe, expect, it } from "vitest";
import { createMessage, getMessageById } from "@/lib/store";

// Bu testler yalnızca bellekteki fallback katmanını kapsar.
// Supabase env'i bu süreçte varsa bile tabloya yazmamak için sıfırlıyoruz.
const BACKUP_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const BACKUP_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function withoutSupabaseEnv() {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

afterAll(() => {
  if (BACKUP_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = BACKUP_SUPABASE_URL;
  }
  if (BACKUP_SUPABASE_ANON_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = BACKUP_SUPABASE_ANON_KEY;
  }
});

describe("store fallback", () => {
  it("oluşturma + okuma yuvarlak testi alanları korur", async () => {
    withoutSupabaseEnv();
    const created = await createMessage({
      template: "birthday",
      paletteId: "mor-solen",
      name: "Ayşe",
      message: "Doğum günün kutlu olsun!",
      position: "bottom",
      effects: [
        {
          id: "confetti",
          x: 60,
          y: 40,
          scale: 1.5,
          speed: 2,
          repeat: "every",
          repeatEvery: 10,
        },
      ],
      photoPos: { x: 50, y: 40, scale: 1.2 },
      textPos: { x: 50, y: 75, fontSize: 1.1 },
      videoScale: 1.4,
      animationSpeed: 1.5,
      textFont: "el-yazisi",
      audio: { type: "clip", value: "ninni" },
    });

    expect(created.id).toMatch(/^[A-Za-z0-9]{6}$/);
    expect(created.paletteId).toBe("mor-solen");
    expect(created.position).toBe("bottom");
    expect(created.effects?.[0]).toMatchObject({
      id: "confetti",
      x: 60,
      y: 40,
      scale: 1.5,
      speed: 2,
      repeat: "every",
      repeatEvery: 10,
    });
    expect(created.photoPos?.scale).toBe(1.2);
    expect(created.animationSpeed).toBe(1.5);
    expect(created.textFont).toBe("el-yazisi");
    expect(created.audio).toEqual({ type: "clip", value: "ninni" });

    const fetched = await getMessageById(created.id);
    expect(fetched?.name).toBe("Ayşe");
    expect(fetched?.message).toBe("Doğum günün kutlu olsun!");
    expect(fetched?.effects?.[0]?.repeatEvery).toBe(10);
    expect(fetched?.videoScale).toBe(1.4);
  });

  it("bilinmeyen id için undefined döner", async () => {
    withoutSupabaseEnv();
    expect(await getMessageById("yok1yok")).toBeUndefined();
  });

  it("geçersiz şablon hata fırlatır", async () => {
    withoutSupabaseEnv();
    // @ts-expect-error bilinçli geçersiz şablon
    await expect(createMessage({ template: "yok" })).rejects.toThrow(
      "Geçersiz şablon",
    );
  });
});
