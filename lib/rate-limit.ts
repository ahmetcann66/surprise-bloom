// Basit, süreç-içi (in-memory) istek sınırlayıcı.
// Vercel sunucusuzda her instance kendi kopyasını tutar; bu yüzden mutlak bir
// engel değil, "iyi niyetli kötüye kullanım" ve spam korumasıdır.

interface Bucket {
  timestamps: number[];
}

const WINDOW_MS = 60_000;
const DEFAULT_MAX = 15;
const MAX_BUCKETS = 10_000;

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  max = DEFAULT_MAX,
  windowMs = WINDOW_MS,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= max) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.timestamps.length === 0) buckets.delete(k);
    }
  }
  return true;
}

export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
