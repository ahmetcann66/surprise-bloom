# surprise-bloom — Kalıcı Bellek

## 🎵 Gelişmiş Müzik Sistemi (09.08.2026 — deployed, bucket doğrulandı)
- **Tip**: `GreetingAudio` → `"clip" | "recording" | "file"`; file için opsiyonel `startTime/endTime` (trim penceresi, sn). Yeni dosya ÜRETİLMEZ — metadata döngüsü.
- **`lib/music.ts`**: +2 sentez parça (dogum-gunu 🎂, huzur 🌙 → toplam 6). `musicLabel` file→"Özel müzik". Yeni: `AUDIO_BUCKET="audio-files"`, `isStorageAudioUrl` (yalnızca proje bucket prefix + `..`/`?`/`#` reddi), `isValidTrim`, `MAX_AUDIO_DURATION=600`, **`parseGreetingAudio(raw)`** (clip/recording/file için ortak sunucu tarafı doğrulama — API route + store'lar kullanır).
- **`lib/music-catalog.ts`**: `musicCategories` (dugun/dogum-gunu/sakin) + `musicCatalog` (6 parça, artist/süre) + `searchMusicCatalog` (Türkçe-duyarsız, kategori/parça/sanatçı).
- **`lib/audio-upload.ts`**: `validateAudioFile` (5 MB, mp3/ogg/wav/m4a), `hashAudioFile` (SHA-256), `uploadAudioFile` (browser→Storage, `uploads/<hash>.<ext>`, list ile dedupe + 409/çakışma → duplicate URL), `publicAudioUrl`. Binary Vercel'den geçmez.
- **UI (ilk modal)**: `music-selector.tsx` (arama + kategori + önizleme [tek seferde tek] + dosya yükleme + telif uyarısı + trim), `audio-trim-editor.tsx` (canvas waveform, `decodeAudioData` peak, pointer sürükleme), `music-field.tsx` (ortak form alanı; greeting silent=null, davetiye silent=`SILENT_CLIP`). create-form'daki iki kopyalanmış ses bloğu MusicField ile değiştirildi.
- **Oynatma**: `use-invitation-music` ve `greeting-audio` file tipini trim penceresiyle çalar; davetiyede file loop'lu (timeupdate ile pencere sıfırlama).
- **`supabase/audio-storage.sql`**: public bucket + RLS (anon insert `uploads/`|`library/`, select; silme kapalı). **✅ Kullanıcı dashboard'dan kurdu + canlı doğrulandı**: supabase-js (publishable key `sb_publishable_...`, JWT değil) ile upload OK, list OK, public URL OK; silme RLS'le engelli (remove `OK []` döner ama dosya kalır). Client bundle'dan çıkarılan gerçek config: URL `https://ejimkbncttyxpkwltnuk.supabase.co`. Dashboard sihirbazı JPG örnek policy adı çakışması üretti → `anon_audio_upload`/`anon_audio_select` adlarıyla kuruldu.
- **Doğrulama**: lint 0 · 81 test (11 dosya) · build temiz. **Deploy başarılı** (auth: `npx vercel whoami` → ahmetcann66, `~/.vercel` yerine `.config`'te auth). Canlı smoke: root 200 + "Müzik seç" UI, `/api/davet` track→RU7AFU (page 200), `/api/k` track→q3xbTN, evil file URL→"Geçersiz ses seçimi" ✓. **Upload smoke: `uploads/_smoke-test.mp3` yüklendi+okundu, silme engelli**. Test kayıtları RU7AFU/q3xbTN veride kaldı (anon silme kapalı). ⚠️ `_smoke-test.mp3` bucket'ta duruyor — kullanıcı dashboard'dan elle silecek.
- **Not**: `.env.local`/`.env.supabase` gizlenmiş snapshot (`[SENSITIVE]`); gerçek supabase URL yalnızca Vercel env'inde.

## ✅ Git Durumu (çözüldü — 03.08.2026)
- Bozuk `1d75363` (çözülmemiş merge conflict işaretli) GitHub'dan silindi. `origin/main` artık temiz **`0505a7a`** (tüm özellikler + renk/palet, yazı stili, per-efekt hız). Tek ana dal: **main**.
- Not: GitHub Desktop `main`'e geçerken otomatik merge/pull yapıp çakışmaları commit edebiliyor (`c4f3ae5` olayı). main'e geçerken merge kabul etme; gerekirse `git reset --hard origin/main` ile düzelt.

## Hız + Tekrar Modu (son görev, deployed)
- **`Greeting.animationSpeed?: number`** (0.4–3, varsayılan 1) — tüm animasyonların hız çarpanı. `EffectPlacement`'e **`repeat?: "once"|"loop"|"every"`** + **`repeatEvery?: number`** (3–120 sn, "every" için). repeat yoksa preset'in `timing.loop` değeri (EffectStage) veya "once" (VectorFormEffect) kullanılır → eski kayıtlar aynı çalışır.
- Veri: `animation_speed` kolonu (schema.sql'de `alter ... add column if not exists animation_speed real;` — **kullanıcı Supabase'te çalıştırmadı HENÜZ**). repeat/repeatEvery `effects jsonb` içinde (şema değişikliği gerekmez).
- **Güvenlik**: store.ts `animation_speed`'i yalnızca sayı geldiğinde insert'e ekler (kolon yokken site bozulmasın). Kolon çalıştırılana kadar hız değeri kaydedilemez ama site çalışır.
- **Uygulama**: `EffectStage` hız = `animationDuration/delay ÷ speed`; tekrar: "loop" → infinite, "every" → `runId` state + interval ile container `key` remount. `VectorFormEffect` hız = `tl.timeScale(speed)`; "loop" → `tl.repeat(-1)`, "every" → interval ile `tl.restart(true)`.
- **layout-editor**: slider grid'e "Animasyon hızı" (×0.4–×3, `display` prop'u ile) + "Efekt boyutları" altında her efekt için tekrar select'i ("Varsayılan"/"Bir kez"/"Sürekli"/"Her N sn'de" + "every" iken sn input'u). create-form `LayoutState.animationSpeed`; `onChange` fonksiyonel update ile hızı korur.
- API `/api/k`: `parseEffects` repeat/repeatEvery clamp'ler; `animationSpeed` validasyonu 0.4–3. Test: animationSpeed'siz POST → `{"id":"T3FpqR"}` + GET 200 ✓; animationSpeed'li POST kolon yokken hata veriyor (beklenen).

## Renk Bug Fixi + Yazı Stili + Per-Efekt Hız (son görev, deployed — kolonlar bekliyor)
- **Renk bug'ı kök nedeni**: `/api/k` gövdeden `paletteId`'yi çıkarmıyor ve `createMessage`'a geçirmiyordu → link her zaman şablonun İLK paletiyle render ediliyordu. Düzeltildi: destructure + `getTemplate(template).palettes.some` ile doğrulama + createMessage'a geçirme. create-form zaten `paletteId` gönderiyordu. Canlı test: geçersiz paletteId → 400 "Geçersiz renk paleti." ✓
- **Yazı stili**: yeni `lib/fonts.ts` → `TEXT_FONTS` (system/zarif/el-yazisi/daktilo; sistem font yığınları, ağ gerektirmez) + `getTextFont(id)`. `Greeting`/`CreateGreetingInput.textFont?: string`; `text_font` kolonu schema.sql'e eklendi. UI: layout-editor "Yazı stili" buton grubu + önizleme `fontFamily`; greeting-animation `fontFamily`. API `TEXT_FONTS.some` ile doğrulama → geçersizde 400 "Geçersiz yazı stili." ✓
- **Per-efekt hız**: `EffectPlacement.speed?: number` (0.4–3, global `animationSpeed`'ten öncelikli). store/API `parseEffects`'e speed clamp eklendi; layout-editor her efektin altına ayrı "Hız" slider'ı (görünen değer `ep.speed ?? animationSpeed`); greeting-animation + layout-editor önizlemesi `speed={ep.speed ?? animationSpeed}`.
- **Durum**: Kullanıcı Supabase'te `animation_speed` + `text_font` kolonlarını çalıştırdı; **her şey uçtan uca test edildi ve çalışıyor** (palet, font, per-efekt hız).

## Kalite Temizliği (Faz A — tamamlandı, deployed'a hazır)
- `globals.css` bloom keyframe duplikasyonu (×2) tek kopyaya indirildi.
- **Atıl 3D kod silindi**: `components/three-scene.tsx`, `components/rose-scene.tsx`, `components/scene-error-boundary.tsx`, `hooks/use-fps-monitor.ts`, `lib/performance.ts`, `lib/rose.ts`. Paketler kaldırıldı: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `@types/three`.
- **`lib/rate-limit.ts`**: `/api/k` POST için süreç-içi IP tabanlı sliding-window (60sn'de 15 istek, aşımda 429). `clientIp` x-forwarded-for/x-real-ip'ten okur. Not: Vercel serverless'ta instance bazlıdır, mutlak engel değildir.
- **`store.ts` ID collision retry**: Supabase insert'te unique violation (23505) → yeni nanoid ile 3 deneme; fallback store'da da çakışma kontrolü.
- **Vitest 4 kuruldu** (`npm run test`): `lib/**/*.test.ts` — flowers (determinizm/id/element limiti), templates, presets, clips, rate-limit, store fallback roundtrip. Toplam 40 test yeşil.
- Doğrulama: `npm run build` temiz (6 route), `npx eslint .` 0 hata.

## 🚀 Canlıya Alındı (09.08.2026)
- Deploy: `VERCEL_TOKEN=<token> npx vercel --prod --yes` (CLI oturumu yoktu; token tek kullanımlık env olarak geçildi, hiçbir dosyaya kaydedilmedi).
- **Canlı:** https://tebrik-mesaj.vercel.app (root 200, production alias). Build'de 7 route.
- Kullanıcı Supabase'te `invitations` tablosunu çalıştırdı → canlı doğrulama: `/api/davet` vals müzik + fotoğraf → `{"id":"i4RR2F"}`; `/davet/i4RR2F` 200 (zarf flap/seal + vals flight data); tema-etkinlik uyuşmazlığı → 400 doğru.
- Not: Vercel CLI yeniden auth isterse aynı token yöntemi kullanılabilir; `~/.vercel` auth kalıcı olarak kurulmadı.

## Müzik Sistemi (tamamlandı — deploy'a hazır)
- **`lib/music.ts`**: davetiye için döngülü Web Audio sentezi. `MusicTrack { id, label, emoji, bpm, beats, notes[], pad? }`; `playOnce(ctx, track, startTime?)` (önizleme), `createMusicLooper(ctx, track)` (lookahead: 0.1 sn'de bir, 0.5 sn pencereye giren döngü başlangıcını planlar → kesintisiz döngü), `trackDuration`, `getMusicTrack`, `musicLabel(audio)` (null = çalınamaz/sessiz), `isSilentAudio`, `SILENT_CLIP = "sessiz"` (bilinçli "müzik yok" sentinel'i).
- **4 parça**: muzik-kutusu 🎼 (C-Am-F-G arpej, 88bpm), vals 💃 (120bpm 3/4, bas+akor+melodi), sihir ✨ (pad+parıltı, 60bpm, varsayılan), zil 🔔 (düğün çanları, 66bpm). Nota sayıları küçük, hepsi testte.
- **`hooks/use-invitation-music.ts`**: `{ playing, start, stop, toggle }`. Parça→looper, legacy clip→duration aralığıyla tekrar, recording→loop'lu `<audio>`; sessiz/geçersiz→çalmaz. `start()` kullanıcı jestinde (zarf açılışı / buton) çağrılır → autoplay politikası aşılır. `stop()` ctx kapatır.
- **`components/invitation/music-player.tsx`**: sağ altta yüzen buton (♪/⏸ + etiket), `aria-pressed`.
- **`invitation-page.tsx`**: `GreetingAudioButton` yerine `MusicPlayer` + hook; `handleOpen` hem `setOpened(true)` hem `start()`. `DEFAULT_AUDIO = sihir`. Buton yalnızca `musicLabel` null değilse (sessiz/boş → yok).
- **`greeting-audio.tsx`**: etiket `musicLabel` üzerinden; playback'te parça varsa `playOnce` (tek sefer önizleme).
- **`/api/davet` parseAudio**: `getClip(value) || getMusicTrack(value) || value === "sessiz"` → artık müzik id'leri + sentinel kabul, diğerleri 400.
- **`create-form.tsx`** davetiye bölümü: müzik seçenekleri `musicTracks`; "🔇 Müzik yok" → `SILENT_CLIP` (gerçekten sessiz; önceki `null` varsayılan sihir'e dönüyordu — bug düzeltildi). Kayıt silinince de sentinel. Önizleme butonu sentinel'de gizlenir. (Greeting bölümü clips + null kullanmaya devam ediyor.)
- **Testler**: `lib/music.test.ts` 9 test (id benzersizliği, yapı, t<beats, dalga tipi, label/sessiz, sahte ctx'te playOnce/looper) → toplam **62 test / 9 dosya yeşil**.
- Smoke: `vals` ve `sessiz` POST kabul → id döner; `yok` → `{"error":"Geçersiz ses seçimi."}`; `/davet/<id>` 200, audio flight data'da doğru. Lint 0, build temiz (7 route).
- **Bilinçli ertelendi**: RSVP/harita/sayaç/OG davetiyesi MVP dışı; müzik kontrolü zarf fazında da var ama müzik zarf açılınca/butonla başlar (otomatik başlatma yok).

## Düğün Davetiyesi (Faz B — MVP, deploy'a hazır)
- **Ürün**: Davetiye 💌 + 4 tebrik şablonu. Davetiye kendi veri katmanında: `TemplateId` union'ına dokunulmadı.
- **Veri**: `lib/invitation/types.ts` (EVENT_TYPES: dugun/nikah/sunnet/kutlama, formatDate TR), `themes.ts` (4 tema, `getThemeForEvent`), `figures.ts` (bride/groom/child SVG leaf üretici, `flowers.ts` `shade`/`VFLeaf`/`GradientDef` sözleşmesini kullanır), `store.ts` (dual-mode Supabase/fallback, tema doğrular).
- **Bileşenler**: `components/invitation/` `figures-svg.tsx`, `envelope.tsx` (GSAP: mühür erir → kapak rotateX -180 → mektup yükselir yPercent -45 → zarf söner; reducedMotion), `couple-reveal.tsx` (heartburst + rose/peony + bilgi blokları), `invitation-page.tsx` (Envelope → CoupleReveal orkestratörü, default müzik "sihir").
- **Rotlar**: `app/api/davet/route.ts` (validasyon + rate limit), `app/davet/[id]/page.tsx` + `not-found.tsx`. `app/api/k` desenini kopyalar.
- **Form**: `components/create-form.tsx` ürün seçimi + davetiye alanları (etkinlik tipi/partner/tarih/saat/mekan/şehir/adres/not/fotoğraf/müzik); QR tema davetiyede invTheme'den.
- **DB**: `supabase/schema.sql` → `invitations` tablosu (theme, event_type, partner_a/b, event_date, time, venue, city, address, message, audio jsonb, photo) + RLS anon insert/select + created_at index.
- **Testler**: +13 → toplam **53 test / 8 dosya yeşil**. `npm run build` temiz (7 route: `/` + davetiye rotaları dahil).
- **Notlar**: API alan adı **`themeId`** (theme değil), tarih **`YYYY-MM-DD`** regex (GG/AA/YYYY değil). `/api/davet` smoke: `{"id":"AR5hGw","url":"/davet/AR5hGw"}` ve sayfada zarf flap/seal + isimler render ✓.
- **Bugün yapılan ince ayar + lint temizliği**: envelope mektup `yPercent -45` + rotasyon waggle (0.8/-0.8/0), kart dikey ortalandı (top-[12%] bottom-[10%], flex center); couple-reveal sahne+bilgi flex yığın düzenine çevrildi (çakışma yok). Lint 0 hata — önceden var olan 5 hatayı da temizledik (layout-editor apostrof×3, vector-form-effect setState×3 queueMicrotask/rAF, preview/flowers atıl import+var).
- **Fotoğraf görüntüleme tamamlandı**: `couple-reveal.tsx` `photo?: string` prop'u aldı; monogramın altında tema aksanıyla çerçeveli polaroid kart (border accent + `rounded-2xl` + gölge; `object-cover h-40 w-32 sm:h-48 sm:w-36`), `details` bloğuyla birlikte fade-in. `invitation-page` `invitation.photo`'yu iletiyor. Smoke: fotoğraflı POST → `{"id":"mTsFeE"}`; SSR'da (flight data) photo data URL doğrulandı, img yalnızca zarf açılınca client'ta render edilir (tasarım gereği). <img> + eslint-disable konvansiyonu (mevcut kodla aynı).
- **Bilinçli ertelendi**: RSVP/harita/sayaç/OG davetiyesi MVP dışı.
- **Sırada**: Müzik sistemi (`lib/clips.ts` Web Audio temeli üzerine davetiye ekranı için geliştirilecek; "sihir" varsayılan zaten bağlı).

## Objektif
Tebrik mesajı projesi. Mimari pivot: çiçek efektleri artık **prosedürel DOM partikül yerine SVG vektör + reveal animasyonu**. 
- **Bloom (çiçek) kategorisi** → `VectorFormEffect` (SVG + GSAP draw/grow-up).
- **Burst & ambient** → mevcut `EffectStage` partikül motoru (şekiller gradient/highlight'lı SVG data-URI'lerine yükseltildi).
- 3D React Three Fiber sahnesi (`rose-scene.tsx`, `three-scene.tsx`, `scene-error-boundary.tsx`) dosyaları duruyor ama artık greeting'e bağlı değil.

## Çoklu Efekt + Başlangıç Noktası (son görev)
- **`Greeting.effects?: EffectPlacement[]`** (`EffectPlacement = { id, x?, y?, scale? }`); `effect` alanı legacy (ilk efektin id'sini tutar; eski kayıtlar tek efekt olarak çalışır). **Her efektin kendi `scale`'i var** (0.4–3); global `effectScale` alanı legacy (placement.scale yoksa fallback).
- Veri akışı: form `effects` dizisi gönderir → `/api/k` her id'yi `hasEffect` ile doğrular, x/y 5–95 clamp → `store.ts` `effects` kolonuna JSON yazar (Supabase'de `effects jsonb`; fallback store'da doğrudan dizi) → `greeting-animation` her placement'ı kendi konumunda render eder.
- **Konumlandırma**: `EffectStage` yeni `origin?: {x,y}` prop'u (radial → tam o nokta; float/fall/sparkle → o nokta çevresine dağılır). `VectorFormEffect` yeni `position?: {x,y}` prop'u (0-boyut wrapper + `translate(-50%,-50%)`, svg ortası o noktada). Ölçek wrapper'ında `transformOrigin: origin yüzdesi` kullanılır ki orijin noktası sabit kalsın.
- **layout-editor**: her seçili efekt için çerçevede sürüklenebilir **emoji marker** (z-40; açma butonu z-50) + **her efekt için ayrı boyut slider'ı** ("Efekt boyutları" bölümü, 0.4–3). Toggle edilebilir çoklu seçim butonları form'da; tek kaynak `LayoutState.effects` (create-form'da ayrı state yok). Efekt konumu/ölçeği "Sıfırla" merkeze/1'e çeker, efekt seçimini silmez.
- **create-form**: efektsiz duruma izin verilir (API boş dizi kabul eder; `effect` null → animasyon render edilmez).

## Ortam / Yollar
- Çalışma dizini: `/mnt/c/Users/ahmet/OneDrive/Belgeler/Local/surprise-bloom`
- Canlı site: `https://tebrik-mesaj.vercel.app` + karşılaştırma sayfası `https://tebrik-mesaj.vercel.app/preview`
- Deploy: `npx vercel --prod --yes`. GitHub push çalışmıyor (kimlik yok). `npm run build` güvenilir doğrulama (ESLint WSL'de timeout).

## Yeni Mimari — Vektör Reveal Sistemi
- **`lib/effects/flowers.ts`**: prosedürel SVG çiçek üreteci. `buildFlower(id, palette)` → `{leaves, defs, revealStyle}`. 
  - 10 çiçek: rose, peony, daisy (draw); tulip, sunflower, lily, daffodil (grow-up); orchid, magnolia, cherryblossom (draw). 
  - `draw` çiçekler: katmanlı petal `path`'leri (fillOpacity 0 + stroke ile kalem çizimi, GSAP strokeDashoffset), `grow-up` çiçekler: sap + yaprak + clip-path büyüme.
  - Katman başına petal sayısı ve fold (iç gölge çizgisi) — eleman limiti ~15-25 doğrulandı (node script ile hepsinde ≤24).
  - Gradient defs: petal (taban koyu→uç açık, userSpaceOnUse), center (radial), highlight (white radial), stem/leaf (yeşil).
  - Yardımcılar: `shade(hex, amt)`, `jitFor(seed,k)` deterministik asimetri, `petalPath(len,width,notch,jit)`, `foldPath`, `leafPath`.
- **`components/vector-form-effect.tsx`**: tek jenerik komponent. Props: `{config, active, reducedMotion, scale}`.
  - draw: petaller sırayla çizilir (stagger 0.07), 0.55s'te fill boyanır, center back.out ile patlar, kök 1.02→1 settle.
  - grow-up: clip-rect alttan açılır + kök y 60→0 back.out + 2.4/-1.6/0 salınım; petaller fade+scale.
  - `mix-blend-mode: screen`; animasyon bitince `vf-ready` class → drop-shadow (animasyon sırasında filter yok). reducedMotion → final durum.
- **`greeting-animation.tsx`**: `isVectorFlower(effect.id)` → VectorFormEffect; değilse scaled EffectStage.

## Ölçek / Konum Sistemi (Önizleme Paneli)
- `lib/types.ts`: `Position` → `{x,y, scale?, fontSize?}`; `Greeting`/`CreateGreetingInput` → `effectScale?`, `videoScale?`.
- `lib/store.ts` + `app/api/k/route.ts`: scale/fontSize korunur, `effect_scale` + `video_scale` kolonları (fallback store aktif — Supabase key yok; `supabase/schema.sql` güncellendi).
- `components/create-form.tsx`: **tek state objesi** `LayoutState { photo: Pos, text: Pos, effectScale, videoScale }` (DEFAULT_LAYOUT sabiti).
- `components/layout-editor.tsx`:
  - **4 slider** (efekt, fotoğraf, yazı, video) — animasyon ölçeğiyle aynı tarz (`ScaleSlider` yardımcı bileşeni).
  - Ekstra: köşe tutamaçlarıyla oran koruyan resize (foto) ve yatay font-size (yazı) sürüklemesi.
  - Fotoğraf base 96px × scale; yazı base 1.5rem × fontSize; video base 20rem × videoScale (kutu 16:9, `pointer-events-none`, yazıyla birlikte sürüklenir).
  - Efekt: range slider 0.5–2; foto/video 0.5–2.5; yazı 0.6–2.2. Sıfırla butonu hepsini resetler.

## Partikül Motoru Güncellemeleri (`lib/effects/engine.tsx`)
- `svgUri(kind, base, light, dark)` → inline SVG data-URI: heart, star, spark, confetti, circle şekilleri linear/radial gradient + beyaz highlight. EMOJI_SHAPES'ten heart/star çıkarıldı (SVG'ye taşındı).
- Phyllotaxis formülü (önceki tur, kullanıcı verdi): `ang = i*137.508`, `dist = sqrt(i)*(spread*0.25)` — dış petaller ~222vmin'e uçabiliyor (bilinen risk).

## Doğrulanmış
- `npm run build` temiz (6 route, /preview dahil). Production deploy `✓ Ready`.
- Çiçek üretici node ile test edildi: 10 çiçek, duplike id yok, eksik d/cx yok, ≤24 eleman.
- Video ölçeği: greeting'de `width: calc(20rem * videoScale)` + maxWidth 100% (önceki sabit `w-full max-w-xs` yerine).

## Bekleyen / Engeller
- Headless tarayıcı yok → ekran görüntüsü üretilemiyor; `/preview` sayfası manuel karşılaştırma için (kullanıcı açıp bakmalı).
- GitHub push kimlik doğrulaması bekliyor. ESLint artık çalışıyor (0 hata) — smoke sunucusu `npx next start -p 3123` + `curl http://127.0.0.1:3123` (localhost resolv etmiyor).
- Davetiye fotoğrafı görüntülenmesi + **müzik sistemi tamamlandı** (döngülü parçalar, sessiz sentinel). Sırada: RSVP/harita/sayaç/OG genişletmeleri istenirse.

## Bağımlılıklar
- GSAP 3.15 (tüm vektör animasyonları), Next 16.2.12, @supabase/supabase-js 2.111.0, nanoid 6, qr-code-styling 1.9.2. Test: vitest (dev).
- 3D paketleri (three, @react-three/*) Faz A'da kaldırıldı — tekrar ekleme gereği doğmadıkça kullanma.
