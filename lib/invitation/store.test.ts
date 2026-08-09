import { afterAll, describe, expect, it } from "vitest";
import {
  createInvitation,
  getInvitationById,
} from "@/lib/invitation/store";

// Yalnızca bellek içi fallback katmanını test eder; Supabase env'ini sıfırlar.
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

describe("invitation store fallback", () => {
  it("oluşturma + okuma yuvarlak testi alanları korur", async () => {
    withoutSupabaseEnv();
    const created = await createInvitation({
      themeId: "dugun-altin",
      name: "Ayşe",
      details: {
        eventType: "dugun",
        partnerA: "Merve",
        partnerB: "Kerem",
        date: "2026-08-15",
        time: "18:30",
        venue: "Yalı Konakları Düğün Salonu",
        city: "İzmir",
        address: "Sahil Cad. No:12",
        message: "Sizi aramızda görmek bizi mutlu eder.",
      },
      audio: { type: "clip", value: "sihir" },
    });

    expect(created.id).toMatch(/^[A-Za-z0-9]{6}$/);
    expect(created.themeId).toBe("dugun-altin");
    expect(created.name).toBe("Ayşe");
    expect(created.details.partnerB).toBe("Kerem");
    expect(created.details.time).toBe("18:30");
    expect(created.details.city).toBe("İzmir");
    expect(created.audio).toEqual({ type: "clip", value: "sihir" });

    const fetched = await getInvitationById(created.id);
    expect(fetched).toBeDefined();
    expect(fetched?.details.eventType).toBe("dugun");
    expect(fetched?.details.venue).toBe("Yalı Konakları Düğün Salonu");
    expect(fetched?.details.message).toContain("mutlu");
  });

  it("bilinmeyen id için undefined döner", async () => {
    withoutSupabaseEnv();
    expect(await getInvitationById("yok1yok")).toBeUndefined();
  });

  it("geçersiz tema hata fırlatır", async () => {
    withoutSupabaseEnv();
    await expect(
      createInvitation({
        themeId: "yok",
        details: {
          eventType: "dugun",
          partnerA: "Merve",
          date: "2026-08-15",
          venue: "Salon",
        },
      }),
    ).rejects.toThrow("Geçersiz davetiye teması");
  });
});
