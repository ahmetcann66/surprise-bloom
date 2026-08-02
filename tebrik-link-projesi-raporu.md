# Proje Raporu: Özelleştirilebilir Animasyonlu Tebrik Linki

## 1. Proje Özeti

Kullanıcı bir link oluşturuyor (örn. "Sevgililer Günü" veya "Doğum Günü" şablonu seçip isim/mesaj giriyor), bu linki WhatsApp veya SMS ile paylaşıyor. Karşı taraf linke tıkladığında Safari/WebView içinde açılan sayfada **çiçek açma, konfeti, parçacık animasyonu** gibi görsel bir şölen oynuyor ve ekranda kişiye özel metin beliriyor.

**Önemli mimari karar:** Bu bir native iOS uygulaması olmak zorunda değil. App Store onayı, güncelleme süreci gibi yükler olmadan, tamamen **web tabanlı** (mobil tarayıcıda tam ekran açılan bir "web app") olarak çok daha hızlı ve esnek şekilde yapılabilir. Native gerekiyorsa alternatif olarak **App Clip** seçeneğini de 9. bölümde ele alıyorum.

---

## 2. Kullanıcı Akışı

1. Gönderen kişi bir "oluşturma" sayfasına girer (veya doğrudan senin app'in içinden).
2. Şablon seçer: Sevgililer Günü / Doğum Günü / Yılbaşı / Özel gün (genişletilebilir).
3. İsim ve isteğe bağlı kısa mesaj yazar.
4. Sistem benzersiz kısa bir link üretir: `senin-domain.com/k/aB3xZ9`
5. Link, iOS paylaşım sayfasından (Share Sheet) WhatsApp/SMS/iMessage/Mail'e gönderilir.
6. Alıcı, mesaj uygulamasında linkin **önizlemesini** (başlık + görsel) görür — bu kısım Open Graph meta etiketleriyle sağlanır.
7. Linke tıklayınca tarayıcı açılır, tam ekran animasyon oynar, en sonunda "Ayşe, Sevgililer Günün Kutlu Olsun 💐" gibi kişiselleştirilmiş metin belirir.

---

## 3. Mimari Katmanlar

### 3.1 Sunum (Frontend) Katmanı
Animasyonun ve metnin gösterildiği asıl sayfa. Mobilde tam ekran, hızlı yüklenen, ağır olmayan bir deneyim olmalı.

### 3.2 Şablon / İçerik Katmanı
Her "tema" (sevgililer günü, doğum günü vb.) için ayrı bir animasyon + renk paleti + varsayılan metin seti. Metin ve isim değişkenleri şablonun içine enjekte edilir.

### 3.3 Link Üretme & Kısaltma Katmanı
Kullanıcının girdiği isim/mesaj/şablon bilgisini bir ID'ye bağlayıp kısa link üretir (`/k/aB3xZ9`). Bilgi ister URL parametresi olarak, ister veritabanında saklanır (bkz. 3.6).

### 3.4 Önizleme (Open Graph) Katmanı
WhatsApp, SMS (iMessage) ve diğer uygulamalar linki paylaşırken önizleme kartı gösterir. Bu kart **sunucu tarafında dinamik olarak üretilen bir görsel + başlık** gerektirir (örn. "Ayşe için özel bir mesajın var 💐").

### 3.5 Backend / Serverless Katmanı
- Kısa linki çözüp ilgili şablon+veriyi sayfaya besler.
- Dinamik OG görseli üretir (sunucu tarafında "canvas" render).
- (Opsiyonel) tıklanma istatistiği tutar.

### 3.6 Veri Katmanı (opsiyonel)
Eğer mesajlar URL parametresiyle taşınmayacaksa (uzun/karmaşık mesajlarda linkin kısa kalması için) küçük bir veritabanına ihtiyaç olur.

### 3.7 Hosting / Altyapı Katmanı
Statik dosyalar + serverless fonksiyonlar barındıran bir platform.

### 3.8 Medya (Fotoğraf/Video) Katmanı — İsteğe Bağlı
Kullanıcı isterse metne ek olarak kendi fotoğrafını veya kısa bir videosunu yükleyip animasyonun içine (örn. çiçeğin ortasına, ya da animasyon bitince beliren bir kart olarak) yerleştirebilir. Bu katman tamamen opsiyonel açılıp kapanabilir bir özellik olarak tasarlanmalı, çünkü hem geliştirme hem depolama açısından ekstra yük getiriyor (detay için 14. bölüme bak).

---

## 4. Önerilen Teknoloji Seti

*Not: Aşağıdaki tüm araçlar ücretsiz katmanlarıyla kullanılacak şekilde seçildi — detaylı ücretsiz yapılandırma için 12. bölüme bakabilirsin.*

| Katman | Teknoloji | Neden |
|---|---|---|
| Framework | **Next.js** (React) | Dinamik route'lar (`/k/[id]`), sunucu taraflı OG görsel üretimi, tek proje içinde frontend+backend |
| Animasyon (ana sahne) | **Three.js** (WebGL) + **React Three Fiber** | 3D uzayda gerçek fizikli (yerçekimi, rüzgar, dönme) çiçek/yaprak/kalp parçacık sistemi — projenin "gösteriş" katmanı, karar bilinçli olarak baştan bu seviyede |
| Animasyon zamanlama/geçiş | **GSAP (GreenSock)** | Sahne geçişleri, kamera hareketi, staggered (art arda gecikmeli) açılışlar; Three.js'in üstüne akıcı zamanlama bindirir |
| Fallback animasyon | **CSS/SVG animasyonları** + **tsParticles** | Düşük performanslı cihazlarda WebGL yerine devreye giren "sade mod" |
| Dinamik önizleme görseli | **@vercel/og (Satori)** veya Next.js `ImageResponse` | Her link için isme özel bir önizleme görseli otomatik üretir |
| Kısa link / veri saklama | **Supabase** veya **Firebase Firestore** (ücretsiz katman yeterli) | Kolay kurulum, ID → içerik eşlemesi |
| Hosting | **Vercel** | Next.js ile birebir uyumlu, serverless fonksiyonlar dahil, ücretsiz başlangıç planı var |
| Kısa ID üretimi | **nanoid** kütüphanesi | 6-8 karakterlik benzersiz kod üretir |

---

## 5. Animasyon Yaklaşımı: "Çiçek Açma" Efekti (Gösterişli / 3D Senaryo)

Karar: Projeye baştan en göz alıcı seviyede başlanacak — sade versiyondan başlayıp sonra yükseltmek yerine, doğrudan **Three.js tabanlı 3D parçacık sahnesi** ana animasyon olarak kuruluyor.

**Sahne kurgusu:**
1. Sayfa açılır açılmaz koyu/gradient bir arka plan belirir (derinlik hissi için hafif blur + parallax katmanlar).
2. Three.js sahnesinde, matematiksel olarak üretilen (gerçek 3D model dosyası değil — geometri tabanlı, böylece dosya boyutu küçük kalır) çiçek yaprağı/kalp parçacıkları GSAP zamanlamasıyla sırayla, gerçek fizik hissi veren bir hareketle (yerçekimi, hafif rüzgar salınımı, dönme) sahneye girer.
3. Kamera GSAP ile hafif bir zoom/hareket yapar, sahneye sinematik bir giriş hissi katar.
4. Parçacıklar yerine oturduğunda/açıldığında, isim ve mesaj metni fade-in + hafif scale animasyonuyla ekrana gelir: `"{isim}, {şablon_mesajı}"`.
5. (Opsiyonel) Kullanıcı ekrana dokunduğunda ek parçacık patlaması tetiklenir — mikro-etkileşim.

**Performans stratejisi (bu seviyede zorunlu):**
- Sayfa yüklendiğinde basit bir cihaz/performans testi (örn. `requestAnimationFrame` ile birkaç karede FPS ölçümü) yapılır.
- Test düşük performans gösterirse, otomatik olarak **fallback moda** geçilir: Three.js sahnesi yerine CSS/SVG + `tsParticles` tabanlı sade animasyon devreye girer. Kullanıcı bunun farkına varmaz, deneyim yine akıcı olur.
- Parçacık sayısı cihaz gücüne göre dinamik ayarlanır (örn. üst segment telefonda 300 parçacık, alt segmentte 60).
- Three.js sahnesi ilk yüklemede mümkün olduğunca küçük tutulur (gerçek 3D model/texture kullanılmaz, geometri + renk ile üretilir) — sayfa açılış hızı feda edilmez.

Bu yaklaşım, "gösteriş" ile "her cihazda çalışma" arasındaki dengeyi korur; asıl risk mobil performans olduğundan fallback mekanizması opsiyonel değil, mimarinin bir parçası olarak kuruluyor.

---

## 6. Link Paylaşıldığında Önizleme Nasıl Çalışır (Kritik Nokta)

WhatsApp ve iMessage, bir link paylaşıldığında o sayfanın HTML `<head>` kısmındaki şu etiketleri okuyup önizleme kartı oluşturur:

```html
<meta property="og:title" content="Ayşe için özel bir mesajın var 💐" />
<meta property="og:description" content="Hemen aç ve gör!" />
<meta property="og:image" content="https://senin-domain.com/api/og/aB3xZ9" />
```

`og:image` adresi, o linke özel (isme göre) **dinamik olarak üretilmiş** bir görsel olmalı — statik bir resim değil, her link için ayrı üretilen bir API endpoint'i.

⚠️ **Önemli not:** WhatsApp ve iMessage önizlemeleri agresif şekilde **cache'ler**. Aynı linki tekrar paylaşırken görsel/metin değişmeyebilir; bu yüzden her mesaj için **benzersiz bir URL** (kısa ID) üretmek şart — aynı ID'yi farklı içerikle tekrar kullanmamak gerekir.

---

## 7. Örnek URL / Parametre Yapısı

```
https://senin-domain.com/k/aB3xZ9
```

Bu ID, veritabanında şuna karşılık gelir:
```json
{
  "id": "aB3xZ9",
  "template": "valentine",
  "name": "Ayşe",
  "message": "Seninle geçen her an bir hediye",
  "createdAt": "2026-08-02T10:00:00Z"
}
```

Basit versiyonda (veritabanı olmadan) aynı bilgi URL parametresiyle de taşınabilir:
```
https://senin-domain.com/k?template=valentine&name=Ayse&msg=Seninle...
```
Ama bu yöntemde link uzar ve Türkçe karakter/emoji encode sorunları çıkabilir — küçük projeler için veritabanlı kısa link daha temiz bir çözüm.

---

## 8. Örnek Kod İskeleti

**Next.js dinamik sayfa** (`app/k/[id]/page.tsx`):
```tsx
export default async function Page({ params }: { params: { id: string } }) {
  const data = await getMessageById(params.id); // Supabase'den çek
  return <GreetingAnimation template={data.template} name={data.name} message={data.message} />;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const data = await getMessageById(params.id);
  return {
    openGraph: {
      title: `${data.name} için özel bir mesajın var 💐`,
      images: [`/api/og/${params.id}`],
    },
  };
}
```

**Dinamik OG görsel üretimi** (`app/api/og/[id]/route.tsx`):
```tsx
import { ImageResponse } from 'next/og';

export async function GET(req, { params }) {
  const data = await getMessageById(params.id);
  return new ImageResponse(
    <div style={{ fontSize: 48, background: '#ffe4ec', padding: 40 }}>
      {data.name} için özel bir mesaj var 💐
    </div>
  );
}
```

**Basit CSS çiçek açma animasyonu (fikir):**
```css
.petal {
  transform: scale(0);
  animation: bloom 1.2s ease-out forwards;
}
@keyframes bloom {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  100% { transform: scale(1) rotate(45deg); opacity: 1; }
}
```

---

## 9. Alternatif: App Clip (Eğer "Gerçek Native His" İsteniyorsa)

iOS'ta **App Clip**, App Store'dan indirmeden çalışan hafif bir native deneyim sunar ve link üzerinden açılabilir. Ama:
- Sadece iOS'ta çalışır (Android kullanıcı deneyim dışı kalır — WhatsApp/SMS her iki platformda da kullanıldığından bu önemli bir kısıt).
- Geliştirme + Apple Developer hesabı + App Clip yapılandırması gerektirir, çok daha ağır bir süreç.
- **Öneri:** İlk versiyon için gerekli değil. Web tabanlı çözüm, hem iOS hem Android'de aynı deneyimi verir ve çok daha hızlı yayına alınır.

---

## 10. Geliştirme Yol Haritası

| Faz | İçerik | Tahmini Süre | Durum |
|---|---|---|---|
| 1 | Tek şablon (örn. sadece Sevgililer Günü), isim parametresi, temel sayfa yapısı | 3-5 gün | ✅ Tamamlandı |
| 2 | Dinamik OG görsel üretimi, kısa link sistemi, veritabanı entegrasyonu | 3-4 gün | ✅ Tamamlandı |
| 3 | Three.js + GSAP tabanlı 3D parçacık sahnesi (ana animasyon) | 6-9 gün | ✅ Tamamlandı |
| 4 | Performans testi + fallback mekanizması (CSS/tsParticles moduna otomatik geçiş) | 3-4 gün | ✅ Tamamlandı |
| 5 | Sürpriz modu + tema/renk seçimi (düşük efor, erken eklenmeli) | 2-3 gün | ✅ Tamamlandı |
| 6 | QR kod üretimi (temaya uyumlu, indirilebilir) | 1-2 gün | ✅ Tamamlandı |
| 7 | Kısa ses/müzik ekleme (hazır klip seçimi + kendi ses kaydı) | 2-3 gün | ✅ Tamamlandı |
| 8 | Çoklu şablon (doğum günü, yılbaşı vb.), link oluşturma arayüzü | 4-6 gün | ✅ Tamamlandı (4 şablon × 3 palet) |
| 9 | Fotoğraf desteği (opsiyonel medya katmanı) | 3-4 gün | ✅ Tamamlandı |
| 10 | Video desteği (opsiyonel, ayrı ve son faz — depolama riski en yüksek kısım) | 3-5 gün | ✅ Tamamlandı (ücretsiz kalma hedefi için data URL + boyut/süre sınırı yaklaşımı) |
| 11 | İstatistik/analitik, paylaşım geçmişi (opsiyonel) | 2-3 gün | ⏳ |

Not: 3D senaryo, sade versiyona göre toplamda yaklaşık 6-9 gün daha fazla geliştirme süresi gerektiriyor — asıl fark Faz 3-4'teki 3D sahne kurulumu ve performans/fallback testlerinden geliyor.

---

## 11. Yapay Zeka ile Görev Dağılımı — Tam Plan

Aşağıdaki tablo, her fazdaki işi kimin (Claude Code / bu sohbet / sen) yapacağını netleştiriyor. Bu, raporla birlikte doğrudan projeye başlarken kullanılacak son plan.

| Faz | Görev | Kim Yapar | Çıktı |
|---|---|---|---|
| 1 | Next.js proje iskeleti, klasör yapısı, temel sayfa (`/k/[id]`), isim parametresi işleme | **Claude Code** | Çalışan temel proje |
| 1 | Vercel + Supabase hesaplarının kurulumu, ortam değişkenlerinin (env) ayarlanması | **Sen** (hesap açma gerektirdiği için) + Claude Code (kod tarafı entegrasyon) | Bağlı, çalışan altyapı |
| 2 | Dinamik OG görsel üretimi (`@vercel/og`), kısa link/ID üretimi (`nanoid`), veritabanı şeması | **Claude Code** | Paylaşılabilir, önizlemeli linkler |
| 3 | Three.js + React Three Fiber sahnesi, GSAP zamanlama, parçacık sistemi | **Claude Code** (kurulum ve mantık) — görsel ince ayar (hız, renk, yoğunluk) için **sen geri bildirim verirsin** | 3D animasyon sahnesi |
| 4 | Performans testi mantığı (FPS ölçümü) ve CSS/tsParticles fallback modu | **Claude Code** | Her cihazda çalışan animasyon |
| 5 | Sürpriz modu (tap-to-open state yönetimi) + tema/renk sistemi (CSS değişkenleri) | **Claude Code** | İki yeni özellik |
| 6 | QR kod üretimi (`qr-code-styling` entegrasyonu, temaya göre renklendirme, indirme butonu) | **Claude Code** | QR üretim özelliği |
| 7 | Ses/müzik: hazır klip seçimi arayüzü + `MediaRecorder` ile kendi ses kaydı, Supabase Storage'a yükleme | **Claude Code** (kod) — telifsiz müzik dosyalarının seçimi için **sen** (Pixabay Music / YouTube Audio Library'den birkaç klip seçip Claude Code'a verirsin) | Ses özelliği |
| 8 | Yeni şablonlar (doğum günü, yılbaşı vb.) ve link oluşturma arayüzü (form) | **Claude Code** (arayüz kodu) — **bu sohbet** her şablon için Türkçe mesaj varyasyonlarını (samimi/esprili/resmi tonlarda) yazar | Çoklu şablon sistemi |
| 9 | Fotoğraf yükleme + kırpma/filtre editörü (`react-easy-crop`) | **Claude Code** | Opsiyonel medya katmanı |
| 10 | Video yükleme + trim arayüzü, sıkıştırma, süre sınırı | **Claude Code** | Opsiyonel video katmanı |
| Tümü | Gerçek cihazda test: WhatsApp/iMessage önizleme cache davranışı, düşük performanslı telefonlarda animasyon akıcılığı, iOS ses otomatik-oynatma kısıtları | **Sen** (bu kısım otomatikleştirilemez, gerçek cihaz/gerçek mesajlaşma uygulaması gerektirir) | Doğrulanmış, gerçek dünyada çalışan ürün |
| Tümü | Kod kalite kontrolü, güvenlik (kullanıcı girdisi sanitizasyonu vb.), hata ayıklama | **Claude Code** | Güvenli, sağlam kod |

**Nasıl başlayacağız:** Bu raporu doğrudan Claude Code'a vererek "Faz 1 ve Faz 2'yi bu rapora göre kur" talimatıyla başlayabiliriz — sonraki mesajında hangi fazdan başlamak istediğini söylemen yeterli, kodu bu ortamda (bash/dosya araçlarıyla) birlikte yazmaya başlayabiliriz.

---

## 12. Maliyet Notu — Tamamen Ücretsiz Yapılandırma

Proje, aşağıdaki seçimlerle **hiçbir ücret ödemeden** kurulup çalıştırılabilir:

| Bileşen | Ücretsiz Seçenek | Not |
|---|---|---|
| Hosting | **Vercel Hobby (ücretsiz) plan** | Kişisel/deneysel projeler için sınırsız süre ücretsiz; belirli bant genişliği/istek limitleri var ama bu ölçekte bir proje için fazlasıyla yeterli |
| Veritabanı | **Supabase Free Tier** | 500MB veritabanı + sınırsız API isteği (adil kullanım sınırları dahilinde), küçük bir proje için gereğinden fazla |
| Alan adı (domain) | **Kendi domain almak yerine Vercel'in verdiği ücretsiz alt alan adı** (`proje-adin.vercel.app`) kullanılabilir | Böylece yıllık domain ücreti de ortadan kalkar; istersen ileride domain alıp bağlarsın, zorunlu değil |
| Three.js | Tamamen açık kaynak, **ücretsiz** | Lisans kısıtı yok |
| GSAP | **Tamamen ücretsiz** (2024 sonrası Webflow tarafından satın alınıp tüm eklentiler dahil ücretsiz yapıldı) | Daha önce "Club GreenSock" üyeliği gerektiren premium eklentiler (MorphSVG, SplitText vb.) artık serbestçe kullanılabiliyor |
| tsParticles / lottie-web | Açık kaynak, **ücretsiz** | — |
| nanoid | Açık kaynak, **ücretsiz** | — |

**Sonuç:** Vercel Hobby + Supabase Free + `.vercel.app` alt alan adı kombinasyonuyla proje **0 TL** maliyetle geliştirilip yayınlanabilir. Tek dikkat edilmesi gereken nokta, Vercel Hobby planının **ticari (gelir amaçlı) kullanım için değil, kişisel/deneysel projeler için** ücretsiz olması — proje ticari bir ürüne dönüşürse (reklam, ücretli abonelik vb.) o zaman ücretli plana geçmek gerekir. Şu anki kapsam (kişisel/arkadaşlara özel paylaşım aracı) için bu bir sorun teşkil etmez.

---

## 13. Medya (Fotoğraf/Video) Desteği — Detaylı Tasarım

**Nasıl çalışır:**
1. Link oluşturma ekranında "İsteğe bağlı: fotoğraf/video ekle" seçeneği çıkar.
2. Kullanıcı galeriden dosya seçer veya tarayıcı üzerinden doğrudan kamera ile çekim/kayıt yapar (`<input type="file" accept="image/*,video/*" capture>` — ek uygulama kurmaya gerek yok).
3. Yükleme öncesi **tamamen editlenebilir**:
   - **Fotoğraf:** kırpma, döndürme, basit filtre (parlaklık/kontrast/sepia vb.) — `react-easy-crop` + CSS/canvas filtreleriyle, tamamen ücretsiz açık kaynak kütüphanelerle yapılır.
   - **Video:** başlangıç/bitiş kırpma (trim), kısa süre sınırı (örn. maksimum 10-15 saniye) — tarayıcı içinde `MediaRecorder` API ve basit bir trim arayüzüyle, sunucuya yük bindirmeden yapılır.
4. Düzenlenen medya, sıkıştırılmış halde (ör. görsel için WebP, video için düşük bitrate) **Supabase Storage**'a yüklenir ve link verisine (isim/mesaj gibi) bağlanır.
5. Animasyon sahnesinde, metnin belirdiği anda fotoğraf/video de (örn. yumuşak bir çerçeve içinde, ya da çiçeğin ortasında) sahneye eklenir.

**Ücretsiz kalma stratejisi (önemli):**
- Supabase Free Tier'da 1GB depolama var — bu görsel için rahat yeterli, video için sınırlı. Bu yüzden:
  - Video süresi baştan kısıtlanmalı (10-15 saniye önerilir).
  - Yükleme öncesi **istemci tarafında (tarayıcıda) sıkıştırma** yapılmalı — sunucuya büyük dosya hiç gitmemeli. Bu hem ücretsiz kalmayı sağlar hem yükleme hızını artırır.
  - Fotoğraf/video, belirli bir süre sonra (örn. 30 gün) otomatik silinecek şekilde ayarlanabilir — depolama dolmasın diye.
- Alternatif olarak sadece **fotoğraf desteği ile başlayıp video'yu ileride** eklemek, ilk fazda riski daha da azaltır (video, depolama ve tarayıcı-uyumluluğu açısından en "pahalı" kısım).

**Öneri:** İlk versiyonda fotoğraf desteğini ekle, video'yu "Faz 7" gibi ayrı ve opsiyonel bir adım olarak planla — bu, ücretsiz kalma hedefini daha güvenli şekilde korur.

**Durum (Faz 9 — Fotoğraf):** ✅ Tamamlandı (video ayrı faz olarak kaldı).
- `lib/image.ts`: istemci tarafında sıkıştırma — max 900px boyut koruması, WebP (JPEG fallback), base64 data URL çıktısı. Sunucuya büyük dosya gitmez.
- `components/photo-upload.tsx`: `accept="image/*"` dosya seçici + önizleme + değiştir/kaldır.
- Form'a "Fotoğraf (opsiyonel)" bölümü eklendi; `photo` alanı `POST /api/k` ile gönderilir (API'de `data:image` doğrulaması, max 1MB sınırı).
- Veri: `photo text` sütunu (Supabase env girilince Storage'a geçilebilir; şimdilik satırda data URL saklanır).
- Görüntüleme: `greeting-animation.tsx` — yazı belirdiğinde fotoğraf yuvarlak, akçe renkli çerçeve + gölgeyle metnin üstünde gösterilir.
- Doğrulama: puppeteer ile gerçek dosya yükleme → WebP data URL → link → sayfada fotoğraf + isim görünüyor, hata yok.

**Durum (Faz 10 — Video):** ✅ Tamamlandı.
- Ücretsiz kalma hedefiyle çelişmemek için depolama stratejisi: video istemci tarafında doğrulanır (en fazla **15 sn**, en fazla **6MB**), base64 data URL olarak satırda saklanır. Büyük video dosyaları için Supabase Storage env girilince geçilebilir.
- `lib/video.ts`: `videoFileToDataUrl()` — tür/boyut/süre kontrolü (`<video>` metadata ile süre okuma).
- `components/video-upload.tsx`: dosya seçici + önizleme + kaldır + MediaRecorder ile kamera kaydı (max 15 sn, vp9→vp8→mp4 fallback). Kayıt kamera gerektirdiği için headless ortamda test edilemedi, kod korumalı.
- API doğrulaması: `data:video/(webm|mp4|ogg);base64,` + max ~4.5MB (6M karakter). Fotoğraf ve ses ile aynı istekte kombinlenebilir (test edildi).
- Görüntüleme: `greeting-animation.tsx` — yazı belirdiğinde çerçeveli `<video controls muted playsInline>` (muted başlar ki ses/konuşma ile çakışmasın, kullanıcı açar).
- Doğrulama: puppeteer ile canvas.captureStream + MediaRecorder'dan gerçek webm üretilip yüklendi → link → sayfada video + isim görünüyor, hata yok. Sunucu tarafı boyut/tür redleri curl ile 400 doğrulandı.

---

## 14. Onaylanan Ek Özellikler — Detaylı Tasarım

Aşağıdaki dört özellik kapsam dahiline alındı, ilk versiyondan itibaren planlanacak:

### 14.1 Sürpriz Modu
Animasyon sayfa açılır açılmaz otomatik başlamaz; alıcı önce kapalı bir çiçek tomurcuğu / hediye kutusu görselini görür, dokununca (tap) Three.js sahnesi ve metin devreye girer.
- **Uygulama:** Ekstra kütüphane gerektirmez — basit bir React state (`açıldı mı?`) ile animasyon tetiklenir.
- **Bonus:** Bu dokunuş anı, aynı zamanda ses/müziğin başlatılacağı an olarak da kullanılabilir (bkz. 14.2 — iOS'ta otomatik ses çalma zaten engellendiği için bu doğal bir çözüm sunuyor).
- **Maliyet:** Yok, tamamen ücretsiz.

### 14.2 Kısa Ses/Müzik Ekleme
Gönderen, hazır kısa müzik parçalarından birini seçebilir veya kendi sesiyle kısa bir mesaj kaydedebilir.
- **Hazır müzik seçeneği:** Telifsiz (royalty-free) kısa klipler statik dosya olarak projeye eklenir (Pixabay Music, YouTube Audio Library gibi ücretsiz/telifsiz kaynaklardan seçilir) — sunucu/depolama maliyeti yok, dosyalar Vercel'de statik olarak barınır.
- **Kendi sesini kaydetme seçeneği:** Tarayıcının `MediaRecorder` API'siyle kısa (örn. max 10 saniye) ses kaydı alınır, sıkıştırılıp Supabase Storage'a yüklenir (fotoğraf/video ile aynı mantık, ses dosyaları çok küçük olduğu için depolama sorunu yaratmaz).
- **Önemli teknik not:** iOS Safari, kullanıcı bir dokunuş yapmadan sesi otomatik çalmaya izin vermez — bu yüzden ses, "Sürpriz modu" açılış dokunuşuyla aynı anda tetiklenmeli. İki özellik birbirini tamamlıyor.
- **Maliyet:** Yok.
- **Durum (Faz 7):** ✅ Tamamlandı.
  - Hazır klipler Web Audio API ile tarayıcıda sentezlenir (`lib/clips.ts`: ninni, konfeti, kar çanı, sihirli an) — harici dosya yok, lisans sorunu yok, offline çalışır.
  - `components/audio-recorder.tsx`: MediaRecorder ile max 10 sn kayıt → base64 data URL (Supabase Storage entegrasyonu env tanımlanınca devreye girer; şimdilik veri satırında saklanır).
  - `components/greeting-audio.tsx`: sağ alt köşede çalma/durdur butonu (iOS gesture uyumlu — kullanıcı dokunuşuyla başlar).
  - Form: "Ses yok" / hazır klip seçimi / ses kaydı; seçilen sesi önizleme butonu. Schema: `audio jsonb` sütunu.
  - Bulunan ve düzeltilen hatalar: (a) bayat sunucu + yeni build → silinen chunk dosyaları 500 döner, hydrate olmaz, butonlar ölü olur (sunucuyu yeniden başlatmak gerekir); (b) `?mode=three` hydration mismatch (React #418) — URL parametresi artık effect'te okunuyor; (c) 3D modda `onBloomComplete` inline arrow her FPS örneğinde (500ms) yeni identity aldığı için GSAP timeline sıfırlanıp `onComplete` hiç ateşlenmiyordu — `useCallback` ile sabitlendi.

### 14.3 QR Kod Üretimi
Oluşturulan her link otomatik olarak, şablonun temasına uyumlu (renk/ikon özelleştirilmiş) bir QR koda dönüştürülür.
- **Kütüphane:** `qr-code-styling` (açık kaynak, ücretsiz) — sadece siyah-beyaz kare değil, temaya göre renklendirilmiş, ortasında küçük bir ikon (kalp, çiçek vb.) olan "markalı" QR kod üretir.
- **Kullanım senaryoları:** Fiziksel kart/hediyeye bastırma, "QR kodu indir" butonuyla PNG olarak kaydedip görsel şeklinde paylaşma, parti/etkinlik masasına yerleştirme.
- **Uygulama:** Tamamen istemci tarafında (tarayıcıda) üretilir, sunucuya ekstra yük bindirmez.
- **Maliyet:** Yok.
- **Durum (Faz 6):** ✅ Tamamlandı. `components/qr-code.tsx` — şablonun emojisi merkez ikon olarak rasterleştirilir (canvas → dataURL), QR nokta rengi palet renklerinden koyuluk (relative luminance) hesabıyla seçilir (tarama garantisi için), köşe iç noktası `theme.accent` kullanır, arka plan şeffaftır. Link oluşturulunca ekranda görünür ve "PNG olarak indir" butonuyla kaydedilir.

### 14.4 Tema / Renk Seçimi
Her şablon için birden fazla renk paleti tanımlanır (örn. pastel pembe, gece mavisi, canlı turuncu); kullanıcı link oluştururken birini seçer.
- **Uygulama:** Renkler CSS değişkenleri / bir "tema nesnesi" olarak tanımlanır; seçim, hem arka plan/parçacık renklerini hem QR kodun rengini hem de metin stilini aynı anda değiştirir — tutarlı bir görsel kimlik sağlar.
- **Maliyet:** Yok, sadece ek CSS/konfigürasyon.

---

## 15. Diğer Değerlendirilen Öneriler (Kapsam Dışı / İleri Aşama)

- **Geri sayım / zamanlı açılış:** İleride eklenebilir, ilk versiyon kapsamına alınmadı.
- **Çoklu dil desteği:** İleride eklenebilir.
- **"Görüntülendi" bildirimi:** Gizlilik hassasiyeti nedeniyle ileri aşamaya bırakıldı.
- **Hazır şablon galerisi:** Proje büyüdükçe organik olarak genişletilecek.

---

## 16. Riskler ve Dikkat Edilmesi Gerekenler

- WhatsApp/iMessage önizleme cache'i: aynı link tekrar paylaşılırsa eski önizleme görünebilir — her mesaj için yeni ID üretmek şart.
- OG görsel üretimi ilk istekte biraz gecikme yaratabilir (cold start) — Vercel Edge Functions ile bu minimize edilebilir.
- Türkçe karakter ve emoji kullanımı URL'lerde sorun çıkarabilir — bu yüzden kısa ID + veritabanı yaklaşımı önerilir, parametre tabanlı uzun URL değil.
- Mobil veri/performans: ağır 3D animasyonlardan (Three.js) ilk versiyonda kaçınmak, düşük performanslı telefonlarda da akıcı deneyim sağlar.

## 17. Yayın (Deployment) Durumu

**Karar:** Vercel (uygulama) + Supabase (veritabanı) — ikisi de ücretsiz katman. Linklerin ve QR kodların **yıllarca yaşaması** için veritabanı ve uygulama bulutta çalışmalı; yerel makinedeki bellekteki fallback yalnızca geliştirme/test içindir (sunucu restart'ında veri sıfırlanır).

**Hazır olanlar:**
- `lib/supabase.ts`: env girilince (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`) otomatik devreye girer; yoksa bellek fallback.
- `supabase/schema.sql`: tablo + RLS politikaları (anon insert/select) + index — SQL Editor'de tek çalıştırma ile kurulur.
- `app/layout.tsx` `metadataBase`: `NEXT_PUBLIC_SITE_URL` ile OG önizlemeleri mutlak URL üretir (WhatsApp/önizleme paylaşımı).
- **Vercel uyumluluğu:** Video base64 limiti ~3MB'ye (4M karakter) indirildi — Vercel sunucusuz fonksiyonların ~4.5MB gövde limiti içinde kalınır; kamera kaydı 1.3Mbps bitrate ile 15 sn'de ~2.4MB hedefi tutar.
- `YAYIN.md`: adım adım rehber (Supabase kurulumu → Vercel deploy → env → doğrulama).

**Kalan (kullanıcı tarafı):** Supabase ücretsiz hesap + Vercel hesabı oluşturmak ve `YAYIN.md`'deki adımları takip etmek.
