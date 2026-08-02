# surprise-bloom — Kalıcı Bellek

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
