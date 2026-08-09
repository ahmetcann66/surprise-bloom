import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("limit altında istekleri kabul eder", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("ip-1", 5)).toBe(true);
    }
  });

  it("limit aşıldığında reddeder", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("ip-2", 5);
    expect(checkRateLimit("ip-2", 5)).toBe(false);
  });

  it("pencere dolunca yeniden kabul eder", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("ip-3", 5);
    expect(checkRateLimit("ip-3", 5)).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(checkRateLimit("ip-3", 5)).toBe(true);
  });

  it("anahtar bazlı izolasyon sağlar", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("ip-a", 5);
    expect(checkRateLimit("ip-b", 5)).toBe(true);
  });
});

describe("clientIp", () => {
  it("x-forwarded-for'dan ilk adresi döner", () => {
    const req = new Request("https://x", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientIp(req)).toBe("1.2.3.4");
  });

  it("x-real-ip'e düşer", () => {
    const req = new Request("https://x", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(clientIp(req)).toBe("9.9.9.9");
  });

  it("yoksa unknown döner", () => {
    expect(clientIp(new Request("https://x"))).toBe("unknown");
  });
});
