# 🚀 Yayın Rehberi — Vercel + Supabase

Bu rehber uygulamayı **ücretsiz** ve **kalıcı** şekilde internete yayınlar.
Bittiğinde arkadaşlarına vereceğin linkler ve QR kodlar **yıllarca çalışır**
(veritabanı ve uygulama bulutta olduğu için bilgisayarının açık olması gerekmez).

Süre: ~20 dakika. Toplam maliyet: 0 ₺ (ücretsiz katmanlar).

---

## Genel bakış

```
Arkadaşının telefonu
        │  https://projen.vercel.app/k/XXXXXX  (QR da bunu gösterir)
        ▼
   Vercel (uygulama, 7/24 açık — ücretsiz)
        │  veriyi çeker/yazar
        ▼
   Supabase (veritabanı, 7/24 açık — ücretsiz)
```

## ADIM 1 — Supabase hesabı ve veritabanı (10 dk)

1. [supabase.com](https://supabase.com) adresine git → **Start your project** → Google/GitHub ile giriş yap.
2. **New project** → İsim ver (örn. `tebrik`), şifre koy (otomatik üretilen şifreyi kopyala, bir yere sakla).
3. **Region** → `Frankfurt` (Avrupa — Türkiye'ye en yakın ücretsiz bölge).
4. Proje oluşturulunca sol menüde **SQL Editor** → **New query** aç.
5. `supabase/schema.sql` dosyasının **tüm içeriğini** kopyala, editor'e yapıştır → **Run**.
   (Tablo, satır güvenliği politikaları ve index bu komutla kurulur.)
6. Sol menüde **Project Settings** → **API** sayfasını aç:
   - **Project URL** → kopyala (örn. `https://xyz.supabase.co`)
   - **anon / public** anahtar → kopyala (`eyJhbGciOi...` ile başlar)

## ADIM 2 — Vercel'e yükleme (10 dk)

Seçenek A (kolay, tavsiye edilen — git gerekmez):

1. Proje klasöründe bir terminal aç ve çalıştır:

   ```bash
   npx vercel
   ```

2. Sorulara cevap ver:
   - Login → **Continue with GitHub/Google**
   - Set up and deploy → **Yes**
   - Which scope → kendi hesabın
   - Link to existing project? → **No**
   - What's your project name? → `tebrik-mesaj`
   - Directory → **Enter** (varsayılan)
   - Override settings → **No**
   - İlk deploy otomatik başlar.
3. Deploy bitince **Production URL** verilir (örn. `https://tebrik-mesaj-abc.vercel.app`).
   Not: şu an Supabase ayarları girilmediği için bu ilk sürüm **bellek fallback** ile çalışır;
   adım 3'teki anahtarları girdikten sonra tekrar deploy et.

Seçenek B (git ile — ileride otomatik güncelleme istersen):

1. GitHub'da yeni **private** repo aç.
2. Proje klasöründe:

   ```bash
   git init && git add -A && git commit -m "ilk sürüm"
   git branch -M main && git remote add origin https://github.com/KULLANICI/tebrik-mesaj.git
   git push -u origin main
   ```

3. [vercel.com/new](https://vercel.com/new) → GitHub repo'yu import et → **Deploy**.

## ADIM 3 — Ortam anahtarlarını gir (5 dk)

Terminalde (A seçeneğinde) veya Vercel panelinden:

**Vercel panelinden:** Proje → **Settings** → **Environment Variables** → 3 değişken ekle:

| İsim | Değer |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Adım 1.6'daki Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Adım 1.6'daki anon anahtar |
| `NEXT_PUBLIC_SITE_URL` | `https://projenin-adresi.vercel.app` |

**CLI ile:**
```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add NEXT_PUBLIC_SITE_URL
```
Her biri için değeri yapıştır ve **production** ortamını seç.

Sonra tekrar yayınla:
```bash
npx vercel --prod
```

## ADIM 4 — Doğrulama

1. `https://projen.vercel.app/` aç → şablon seç, isim gir → **Linki Oluştur**.
2. Oluşan linki yeni bir sekmede/telefonda aç → sürpriz animasyonu, ses, fotoğraf/video çalışmalı.
3. Link sayfasını WhatsApp'a at → **önizleme görseli (OG)** görünmeli.
4. Sunucuyu kapatıp yarın tekrar açtığında da link **hâlâ çalışmalı** (Supabase'te saklanıyor).
5. QR kodu arkadaşın telefonuyla okut → aynı link açılmalı.

---

## Sınırlar (ücretsiz katman)

- **Video:** en fazla 15 sn ve ~3MB (telefon kamerayla kaydedilen uzun/4K videolar reddedilir).
  Büyük video desteği için Supabase Storage entegrasyonu gerekir (ileriki faz).
- **Fotoğraf:** otomatik sıkıştırılır (~900px, WebP), ~750KB'ı geçmez.
- **Supabase ücretsiz:** 500MB veritabanı, 1GB depolama — tebrik başına ortalama ~1-2MB ile
  binlerce tebrik sığar.

## Sık karşılaşılan sorunlar

- **"Mesaj veritabanına kaydedilemedi"** → Adım 1.5'teki SQL çalıştırılmadı ya da anahtar yanlış.
  Anahtarların production ortamına eklendiğinden emin ol (`npx vercel env pull` ile kontrol edebilirsin).
- **OG önizleme yok** → `NEXT_PUBLIC_SITE_URL` yanlış; tam `https://...vercel.app` olmalı.
- **Yerel sunucuda linkler kayboluyor** → Normaldir; yerelde (env'siz) veri bellekte saklanır.
  Kalıcılık için Adım 1-3'ü tamamla.

## Güncelleme (kod değişince)

```bash
npx vercel --prod
```
