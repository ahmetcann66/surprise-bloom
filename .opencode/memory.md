# surprise-bloom — Kalıcı Bellek

## ⚠️ Git Durumu (kritik — 03.08.2026)
- GitHub Desktop main'i bozuk bir şekilde birleştirdi: `origin/main` = `1d75363` ("new") — `lib/effects/engine.tsx`'te **çözülmemiş merge conflict işaretleri** var, çoklu efekt/vektör çiçek/preview işleri de bu HEAD'te YOK.
- Önceki tüm işler temiz şekilde **`404b74a`** commit'inde (`.opencode/memory.md` dahil). `76f3902` ayrı bir dal (video konum/boyut); `404b74a` onun süperseti.
- Şu anki çalışma branch'i: **`feature/animation-speed-repeat`** (= `404b74a` + hız/tekrar özelliği). Ana dala birleştirme/deploy öncesi dikkat: main'i `404b74a`'ya al ya da bu branch'i main yap.

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
- GitHub push kimlik doğrulaması bekliyor. ESLint timeout çözülmedi.

## Bağımlılıklar
- GSAP 3.15 (tüm vektör animasyonları), three/fiber/drei/postprocessing (kullanılmıyor ama yüklü), Next 16.2.12.
