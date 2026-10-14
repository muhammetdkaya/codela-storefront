# Codela Storefront — güncel çalışma kuralları

## 14 Ekim 2026 / 0.1.79 — canlıda, çekirdek router shell kabulü

- **0.1.78 → 0.1.79:** [PR #23](https://github.com/muhammetdkaya/codela-storefront/pull/23), [merge 551341b](https://github.com/muhammetdkaya/codela-storefront/commit/551341b35be3bef06aff913b09b24b165ea57975). [CI + Deploy 38584666763](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38584666763) başarılı; gerçek Deploy Storefront only adımı başarılı.
- [Canlı shell kabulü 38586324215](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38586324215) başarılı. WP Core router: home URL varyasyonu ve **gerçek Ana Sayfa → /blog/** statik sayfa geçişi; header/dialog/dock referansları değişmedi; geri navigasyonda aynı header; konsol pageerror yok. Sorgu parametreli hızlı cache geçişinde skeleton görünmedi (doğru); **yavaş ağda skeleton 160 ms** yalnız browser fixture'ında doğrulandı, canlı slow-path hâlâ açık. Bu sürüm ürün/kategori/cart/checkout/account için kesintisizliği iddia etmez.
- [Galeri canlı kabulü 38585183010](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38585183010) başarılı. [24 performans ölçümü 38585182538](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38585182538) geçti: mobil cold medyan ana sayfa LCP **2380ms**, ürün **1692ms**, CLS her iki sayfada **0**, iki ikincil thumbnail transferi **8458B**. Laboratuvar ölçümü; gerçek kullanıcı saha CWV değil.
- **Açık:** fiziksel Safari/safe-area, canlı yavaş ağ skeleton ve gerçek iki yönlü farklı sayfa history/refresh, WP/Woo tüm ürün türleri, kart/sepet/ödeme uyumu. Mevcut Woo klasik ürün ve işlem sayfalarını tam sayfa gezinmeye bırakmaya devam et. 
- **Sıradaki:** gerçek mobil cihazda kapsamdaki home/blog menü geçişi ve kötü ağ skeleton kabulü; dinamik Woo navigasyonunun gerçek entegrasyon testleri olmadan kapsama alınması yasak. 0.1.79'un kodu ve yayını tekrar yapılmamalı.

## 14 Ekim 2026 / 0.1.79 — kesintisiz güvenli sayfa geçişleri (test ve yayın bekliyor)

- 0.1.78 → 0.1.79 **WordPress çekirdeğinin Interactivity Router** modülüne seçmeli entegrasyon. Yeni SPA, fetch/historical cache motoru veya ikinci header/dock/dialog yaratılmaz. Destekleyen WP (script module client navigation API mevcut) ve **güvenli** yerel ana sayfa/statik WordPress blok sayfalarında `sf-content` router region olur; dok header/popup sabit DOM'dadır.
- WordPress'in kendi `navigate` / tarihçe / hata halinde tam sayfa fallback işleyişi kullanılır. Yalnız `data-sf-route` işaretli header logo, dock Home ve güvenli menü page bağlantıları yakalanır. WooCommerce **ürün, kategori, sepet, ödeme, hesap, formlar, özel blok/shortcode** sayfalarında tam belge navigasyonu kalır. Bunlarda header'ın hiç kaybolmaması **bu sürümde garanti edilmez**. WP 6.5-6.8 gibi client-navigation script desteği eksik ortamlarda da tam yükleme korunur.
- Core router navigasyon 160ms üzerindeyse yalnız içerikte hedefsiz veri göstermeyen uyarlanmış skeleton (home/content), hızlı geçişte sıfır flash, reduced-motion destekli. Eski menü modalını 280ms gecikme/scroll restore olmadan kapatmak için **mevcut overlay**'e küçük `closeForNavigation` metodu eklendi. Route sonrası home aria-current ve dock highlight yenilenir, ana içeriğe focus verilir; WC checkout/cart oturumuna dokunulmaz.
- Test: tests/navigation.php karar ve işaretleme; tests/shell-navigation-browser.cjs gecikme, tek header/dock, focus ve güvenli link. **Gerçek WP router/back-forward ve canlı Safari kabulü ayrıca gerekli; unit/browser fixture gerçek router değildir.**
- **Sıradaki:** PR/CI ve deploy kontrolü; canlıda gerçek iki statik sayfa ile router DOM kimliği + geri/ileri doğrula. Tam WooCommerce ürün ve kategori geçişlerini ancak ilgili JS sürümleriyle *gerçek uçtan uca* testten sonra kapsama al.

## 14 Ekim 2026 / 0.1.78 — canlı doğrulandı: otomatik WebP ve ihtiyaç halinde galeri tam görseli

- **0.1.77 → 0.1.78** [PR #22](https://github.com/muhammetdkaya/codela-storefront/pull/22), [merge c0e5a28](https://github.com/muhammetdkaya/codela-storefront/commit/c0e5a287b1f58a7845c6769761e4efd4199d6c70). [CI + gerçek deploy 38578243841](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38578243841) başarılı; [mobil/masaüstü canlı native galeri kabulü 38578622890](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38578622890) başarılı; [24 örneklik canlı performans 38578623047](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38578623047) bütçe **geçti**.
- Soğuk mobil medyan LCP: ürün **1592ms**, ana sayfa **2312ms**; cold CLS **0**. Görünmeyen iki büyük galeri JPEG transferi ilk sayfa açılışında **223188 byte → 8458 byte thumbnail** (aynı iki kaynak grubunun tarayıcı transferi); yaklaşık %96 düşüş. Bu gerçek kullanıcı CWV, genel bant genişliği veya WebP dönüşüm kazancı değildir; ana tasarruf **istek ertelemesi** kaynaklıdır.
- JPEG yeni yüklemelerinde sunucu WebP encoder destekliyorsa WordPress native `image_editor_output_format` ile otomatik WebP ara boyutları, orijinaller korunur. Mevcut JPEG'ler **kendiliğinden dönüştürülmedi**. Yönetici Medya → Görsel optimizasyonu aracından kontrollü toplu işlemi başlatabilir; Codela.dev mevcut JPEG'ler için henüz admin backfill çalıştırılmadı. AVIF varsayılan değil. PNG/GIF etkilenmez. Başka format dönüşüm eklentisi mevcutsa onun JPEG haritası ezilmez.
- Woo'nun hero eager/high, FlexSlider, varyasyon ve native PhotoSwipe linkleri korunur; gallery JS sadece ikincil görselleri seçildiğinde ister. Ürün dışı sayfalara yüklenmez. Farklı Woo/medya eklentisi, fiziksel Safari, gerçek sunucuda yeni JPG yükleme ve mevcut görsel optimizasyonunun yönetici testi açık.
- **Sıradaki somut iş:** Medya ekranındaki batch optimizasyonunun canlı sunucu encoding sonucunu ve farklı ürün türlerini (varyasyon, stoksuz, grouped/external), Safari safe-area ve tam ekran fotoğrafları gerçek cihazda kabul et. Performans ölçümünü yeni sürümde regressions üzerinden takip et. Bu sürümün CI/yayın işi kapatıldı, tekrar yapma.

## 14 Ekim 2026 / 0.1.78 — native WebP türevleri ve ikincil galeri yükleme (CI/yayın bekliyor)

- 0.1.77 canlı durumu korunur; 0.1.78 kaynak geliştirme dalında hazırlanıyor. Tema yüklü mağazalarda, sunucu destekliyorsa yeni JPEG yüklemelerinin WordPress ara boyutları native `image_editor_output_format` ile WebP üretilir. PNG/GIF/animasyon ve orijinal dosyalar değiştirilmez. Format sunucu desteklemiyorsa otomatik eski işleyiş devam eder; AVIF varsayılan değil.
- Eski JPEG'ler Medya → Image Optimization yönetici aracında bir görsel/istek işlenir; istenirse durdurulur. Mevcut türevlerin JPEG dosyaları ve full/orijinal tutulur; yalnız küçülen WebP ara boyutlarının metadata kaydı değiştirilir. Bu işlem önceden yüklenen görsellere **kendiliğinden uygulanmaz**; yöneticinin başlatması gerekir. Medya yüklemeleri harici depolama/özel WordPress medya eklentileriyle ayrıca test edilmeli.
- Ürün galerisinde ana görsel eager/high kalır; diğer Woo HTML img'leri native `data-thumb` önizlemesiyle çıkar, tam `src/srcset/sizes` seçildiğinde ürün sayfasına özel hafif JS ile yüklenir. Native Woo FlexSlider, href/lightbox ve varyasyon bağlantıları değiştirilmez. Tam görüntü için WebP kullanımını garanti etmez; PhotoSwipe tam kaynak JPEG kalır.
- Yeni tests/media-optimization.php ve tests/gallery-defer-browser.cjs CI'da; gerçek WordPress/Woo/cihaz ve canlı LCP/CLS/galeri kabulü henüz doğrulanmadı. 0.1.77 canlıda kalır, CI→deploy→24 örnek audit→galeri kabulü olmadan yayında denmez.
- Sıradaki: yeni sürümün CI sonuçlarını incele; canlı çıktıda full img gereksiz istekleri ve full-screen/swap testini doğrula. Sonrasında yönetici işlemiyle eski dosyalar kontrollü optimize edilebilir; otomatik dönüşen yeni dosya için gerçek yükleme testi gerekli.

## 14 Ekim 2026 / 0.1.77 — doğrulanmış canlı durum ve hız koruması

- 0.1.77 kaynak [3d16be3](https://github.com/muhammetdkaya/codela-storefront/commit/3d16be31688c51fdf33d0fd7e10764db157c25e5); [deploy 38548542214](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38548542214) başarılı. [Galeri kabulü 38548935704](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38548935704) başarılı. [24 canlı ölçüm 38548935685](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38548935685) tamamlandı.
- Son mobil cold medyan LCP: ürün 1.488s, ana sayfa 2.220s; mobil cold CLS her iki sayfada 0 (Chromium lab, fiziksel Safari/field CWV değil). İki görünmeyen büyük galeri görseli bir örnekte 223188 transfer byte; dosyalar JPEG, mevcut lazy loading buna rağmen ağ transferini engellemiyor.
- Devam: tema sürümü **değişmeden** performans auditine cold mobil LCP/CLS başarısızlık eşiği ve ikincil galeri transfer raporu ekleniyor. Bu iş üretim hızını artırdığı iddiasında değildir; regrese olmuş yayını sonradan fark etmek içindir. [PR #21](https://github.com/muhammetdkaya/codela-storefront/pull/21) main'e alındı ([merge 8c723e5](https://github.com/muhammetdkaya/codela-storefront/commit/8c723e53e26232ebe0532eee830b62ab481c0e0d)); [PR birim kontrolü 38567752350](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38567752350) ve [main birim kontrolü 38567820947](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38567820947) başarılı. [Yeni canlı audit 38567820984](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38567820984) tamamlandı ve bütçe **geçti**: mobil cold medyan LCP ürün 1.940s, ana sayfa 2.612s, CLS her iki sayfada 0; ikincil galeride medyan 223188 transfer byte. 24 örneklik lab ölçümü, aynı tema 0.1.77; yeni hızlandırma iddiası değil. WebP/AVIF dönüştürme, gerçek Woo ürün türleri ve fiziksel Safari kabulü açık.
- Sıradaki somut iş: koruma testini doğrula ve gözlemlenen JPEG transferini azaltacak medya türevlerini **önce bağımsız ölçüm ve Woo lightbox/swipe testiyle** değerlendir. Yeni galeri motoru/JS kopyası ekleme.

## 14 Ekim 2026 / 0.1.77 — native büyütme dokunma düzeltmesi (yayın bekliyor)

- 0.1.76 [deploy 38547199284](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38547199284) gerçek dağıtım adımı başarılı. [24 canlı ölçüm 38547572075](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38547572075): mobil ürün CLS tüm cold/warm örneklerde 0; cold LCP medyan 1.596s (artık ürün başlığı), ana sayfa cold 2.268s. Önceki 1.504s ürün LCP logosuydu; doğrudan görsel hız karşılaştırması değildir.
- Ek canlı test önceden var olan inline zoom/tam ekran galeri çakışmasını yakaladı: zoomImg bağlantıyı örter; pointer-events:none tek başına yetmez, touch zoom click handler da olayı durdurur. İlk iki aday testi başarısız kayıtlıdır.
- [Aday test 38548314033](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38548314033) yalnız test yanıtında zoom_enabled=false ile mobil/masaüstü görsel seçimi, gerçek bağlantı tıklaması, PhotoSwipe aç/kapat ve sabit özet konumu geçti.
- 0.1.77 ürün sayfasında inline zoom'u native filtreyle kapatır; native slider/variation/PhotoSwipe korunur. ClassicTemplate priority 10 ile zoom'u zorla açtığı için filtre priority 100'dedir. Tam ekran galeri tek büyütme eylemidir; ürün dışında ayar korunur. Yeni JS yok.
- CI, canlı dağıtım, canlı galeri kabulü ve performans yeniden ölçümü bekliyor. Medya WebP/AVIF dönüşümü ve görünmeyen tam görsellerin ertelenmesi açık; fiziksel Safari kabulü açık.

## 14 Ekim 2026 / 0.1.76 — galeri yerleşimi ve önizleme indirmeleri (yayın bekliyor)

- 0.1.75 canlı audit 38540948506: mobil ürün cold LCP 1.504s, CLS 0.231; deploy 38540669202 başarılı.
- Canlı teşhis [38546872117](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38546872117): Woo başlangıcında sonraki slaytlar ikinci satırda; galeri 984→487.5px, özet y=1008→511.5px. Üç baseline örnekte CLS 0.231; aynı sayfaya sabit yükseklik/overflow uygulanan üç örnekte CLS 0.
- 0.1.76: galeri dış alanı mevcut responsive yükseklikte tutulur; slaytlar gizlenmez, native track/zoom/lightbox değiştirilmez. Önizleme sizes 100px yerine gerçek 46–48px alana uygun 48px; mevcut srcset korunur.
- Çok görselli başlangıç regresyonu eklendi. CI, canlı deploy ve standart 24 cold/warm ölçüm henüz bekliyor. Teşhiste LCP adayı eski sayfada logo, düzeltilmiş sayfada ürün başlığı: bunu ürün görselinin görünme süresi olarak yorumlamayın.
- Kalan: WebP/AVIF mevcut medya türevlerini dönüştürme, görünmeyen tam galeri görselleri, gerçek Safari/ürün türü kabulü. Önce bu sürümün canlı CLS ve native galeri kontrollerini doğrula.

## 14 Ekim 2026 / 0.1.75 — 0.1.74 CLS regresyonu geri alma (dağıtım bekliyor)

- 0.1.74 [24 canlı performans ölçümünde](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38539801980) mobil ürün soğuk CLS'yi **0.231'den 0.462'ye yükseltti**; LCP 1.620s, galeri CSS geçici slayt gizleme hipotezi başarısız. Bu sürümün [deploy](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38539458112) başarılı olsa da **performans kabulü başarısız**. Ölçüm testindeki arama cleanup hataları giderildi, checkout-pro.css katalogda yüklenmiyor, tokens.css 0.1.74.
- 0.1.75'te yalnız 0.1.74'ün CLS regresyonuna neden olan slayt gizleme CSS kuralı ve bunu yanlış güvenle onaylayan dört görselli fixture geri alınıyor; 0.1.73'ün LCP/asset iyileştirmeleri kalır. Önceki 0.1.73 CLS 0.231 idi; **0.1.75 CLS değeri canlı ölçümle yeniden doğrulanmalı**. Hâlâ kabul hedefi ≤0.1 altında değil; sorunun gerçek tetikleyicisi belirlenmeden yeni CSS varsayımı yapılmamalı.
- Sıradaki: 0.1.75 test + deploy → canlı audit; derin yükleme/CLS teşhisi (Woo galerinin başlangıç CSS ve JS koşulları, kullanıcıya görünen özet alanı). Saha Safari ve gerçek ürün türü kabulü ayrı açık.

## 14 Ekim 2026 / 0.1.74 — CLS takip düzeltmesi (CI ve canlı onayı bekliyor)

- 0.1.73 üretimde, [Actions 38537660826](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38537660826) validate/deploy başarılı. [Canlı 24 ölçüm](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38537975758) product mobile cold LCP'yi 2.940→1.524s, home LCP'yi 2.472→2.240s gösterdi. Hero eager/high ve tokens.css 0.1.73 canlıda; CLS 0.231 kaldı. Detay: [performans raporu](docs/performance/2026-10-14.md).
- 0.1.73'ün min-height önlemi tek başına CLS'yi çözmedi. 0.1.74'te FlexSlider başlangıcından önce wrapper içinde yalnız ilk galeri slaytı yer kaplar; native flex-viewport kurulduğunda diğerleri yeniden görünür. Dört görselli tarayıcı regresyonu ve audit arama X seçici düzeltmesi eklendi.
- [PR #19](https://github.com/muhammetdkaya/codela-storefront/pull/19): Kod/test/doküman aşamasında; CI doğrulaması ve **0.1.74 canlı dağıtımı henüz doğrulanmadı**. Sıradaki: CI → merge → gerçek deploy → 24 cold/warm audit. Beklenen CLS ≤0.1; ulaşmazsa kaymanın başka tetikleyicisi için tekrar teşhis yapılmalı.
- Gerçek Safari, uzun kaydırma, dolu sepet ve Woo ürün türleri için saha kabulü ayrıca açık.

## 0.1.73 performans düzeltmesi — 14 Ekim 2026 (doğrulama/yayın devam ediyor)

- 14 Ekim [ilk ölçümü](docs/performance/2026-10-14.md) esas alındı: mobil ürün cold LCP 2.940s, CLS 0.231. Bu değerler **önceki sürüme** aittir, 0.1.73 için yeni sonuç uydurulmaz.
- 0.1.72 → 0.1.73: Woo ürün galerisinde yalnız öne çıkan görsel eager/high, diğer görseller native davranışta; FlexSlider kurulurken galeri/viewport yüksekliği ayrılıyor. Logonun srcset sizes bilgisi boyut oranına göre düzeltiliyor.
- Tüm tema CSS'leri style.css Version üzerinden aynı cache anahtarını kullanıyor. Codela checkout-pro stil handle'ı sadece katalog/ürün gibi checkout/hesap dışı sayfalarda dequeue edilir; Woo veya sepet/ödeme JS'i değişmedi.
- Tarayıcıda FlexSlider başlangıç kaymasını doğrulayan test ve CI'dan sonra canlı read-only performans audit çalıştıran otomasyon eklendi. İlk PR CI sonucu incelenmeli, ölçümler canlı dağıtım **sonrasında** tekrar alınmalı.
- Kaynak: [PR #18](https://github.com/muhammetdkaya/codela-storefront/pull/18). Sonraki iş: validation başarısını, gerçekten gerçekleşen dağıtımı ve live audit LCP/CLS/hero/CSS URL değerlerini kontrol edip raporlamak. Gerçek mobil Safari ve Woo ödeme/çeşitli ürün tipi kabulü ayrı açık.


## Hız önceliği — 14 Ekim 2026

Kullanıcı yeni özellik/tasarım öncesinde hız testi istedi. Canlı tema değiştirilmeden 24 cold/warm sayfa ölçümü ve üç hedefli mobil teşhis tamamlandı. [Rapor](docs/performance/2026-10-14.md), [ham sonuçlar](docs/performance/2026-10-14-results.json). Mobil cold medyan LCP: ana sayfa 2.472s, ürün 2.940s; ürün CLS 0.231. İlk ürün görseli lazy, ürün özeti ilk yüklemede kayıyor. Popup ilk tepki yaklaşık 34–59ms medyan; ağır JS kilitlenmesi gözlenmedi. Ortak tokens.css hâlâ 0.1.71 URL'siyle ve bir haftalık cache ile servis ediliyor. Sıradaki iş: hero yükleme önceliği + galeri başlangıç geometrisi; ardından koşullu CSS ve tek asset sürüm kaynağı. F6 kapatılmadı; fiziksel Safari/GPU ve gerçek kullanıcı ölçümü hâlâ açık. Bu turda optimizasyon/canlı yayın yapılmadı, tema 0.1.72.

## Son doğrulanmış devam noktası — 14 Ekim 2026 / 0.1.72

- Tema 0.1.71 → 0.1.72: açık zeminde kaybolan ortak cam yüzeyin ayrımı tek dış gölgeyle artırıldı (0 3px 12px / %10). İç üst ışık kaldırıldı; ikinci dolgu, iç çerçeve veya yeni katman eklenmedi. Cam brightness 1.5 → 1.42; 28% tint, blur ve saydam kenar korunur.
- Header, alt menü ve satın alma ortak token değişikliğini tüketir. Ölçüler, etkileşimler ve koyu birincil buton değişmedi.
- Doğrulama: PHP/JS ve 23 paket testi, ortak UI, gezinme, ürün, ödeme ve hesap tarayıcı kontrolleri CI'da başarılı. İlk çalışmadaki eski 0.1.71 test beklentileri 0.1.72'ye güncellendi. Fiziksel mobil görsel kabul henüz yapılmadı.
- Yayın: [kaynak e8f2415](https://github.com/muhammetdkaya/codela-storefront/commit/e8f24154dfe7cf7985ddfa37436b2ade28635dd7); [Actions 38514144873](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38514144873) validate=success, deploy=success. Gerçek Deploy Storefront only adımı ve deploy.py 'Storefront deployed; checks passed.' logu doğrulandı (14 Ekim 2026 05:00 UTC).
- Kalan/sıradaki: fiziksel mobil açık zemin üzerinde tek yüzey görünümünü kontrol et. Önceki safe-area, gerçek Woo ürün türleri, F3/F4/F5/F6 kabulleri açık; slider duraklatıldı.

## Başlangıçta okunacaklar

1. Bu dosya ve [güncel teknik durum](docs/storefront-theme.md).
2. [Ortak tasarım sözleşmesi](docs/design-system.md).
3. [Mimari rapor](docs/architecture-review-2026-10-12.md) ve [uygulama rehberi](docs/architecture-remediation-guide-2026-10-12.md). Bunlar tarihli bulgulardır; güncel kaynakta yeniden doğrulayın.
4. Açık PR'lar, HEAD ve ilgili testler. Yerel/eşzamanlı değişiklikleri koruyun; eski SHA'yı zorla main'e taşımayın.

## Sahiplik ve ortak tasarım

- Tek Interactivity store, tek native dialog, tek dock. `assets/storefront.js` bileşim noktası; search/cart/overlay/dock ayrı controller'lardır. Yeni controller/SPA/router veya ikinci sepet motoru kurmayın.
- Tüm tema düğmeleri `inc/ui.php`, `assets/styles/tokens.css`, `assets/styles/components.css` içindeki Button/IconButton/pressable sözleşmesini kullanır. Sayfa CSS'i yerleşim ve mevcut token override'larını sağlar; yeni kopya paint/pressed/focus kuralları eklemeyin.
- Tema guest hesabı ve mağaza görünümünü yönetir. Oturum açmış Codela hesap/sipariş/adres/kargo paneli eklentiye aittir; `.codela-my-account-layout` kapsamına ortak tema form/card/nav stilleri taşımayın.
- Kaynak isimleri platform/cihaz adlarından bağımsızdır. Standart semantik HTML, reduced-motion, 44px hedefler ve erişilebilir isimler korunur.
- **Ortak UI kapsamı:** 0.1.52 Button/IconButton büyüme, esnek bırakma ve saydam yüzey kuralları tokens/components içinde uygulanmıştır. Güncel HEAD kontrolü yapın; F5 için bu stilleri geri almayın veya sayfa CSS’ine kopyalamayın. Yayın kanıtı üstteki devam noktasında tutulur.

## Her yeni tema çalışmasına başlarken

1. Bu dosyayı ve `docs/storefront-theme.md` dosyasını oku.
2. Güncel dalı, son commitleri ve ilgili kodu incele. Belgelerdeki tarihli durumun hâlâ geçerli olduğunu doğrula; tamamlanmış işleri yeniden yapma.
3. Kullanıcıdan burada kayıtlı tercihleri tekrar anlatmasını isteme. “Codela temasına devam” talebinde aşağıdaki sıradaki işlerden ve güncel durumdan devam et.
4. Her anlamlı çalışma sonunda `docs/storefront-theme.md` içindeki durum, testler, eksikler ve sonraki adımı güncelle. Kalıcı ürün kararları değişirse bu dosyayı da güncelle. Yapıldı, test edildi ve canlıya dağıtıldı durumlarını birbirine karıştırma.

## Her gerçek sürüm yükseltmesinde zorunlu kapanış

Bu kural tema ve eklentinin gerçek sürüm yükseltmeleri için geçerlidir; kullanıcının hatırlatmasını bekleme.

- Sürüm koduyla birlikte bu dosyanın **Son doğrulanmış devam noktası** bölümünü ve ilgili teknik durum belgesini güncelle. Tema için belge `docs/storefront-theme.md` dosyasıdır.
- Tarih, ilgili bileşen ve eski → yeni sürüm numarasını yaz. Tema ile eklenti sürümlerini ayrı belirt.
- **Biten işler:** bu sürümde gerçekten tamamlanan değişiklikleri somut olarak yaz; bitenleri sıradaki iş listesinden çıkar.
- **Doğrulama:** yapılan testleri ve sonuçlarını, yapılmayan kontrollerden ayır.
- **Yayın durumu:** kodun commit/tag bağlantısını ve varsa dağıtım/yayın sonucunun kanıtını kaydet. Kodun hazırlanması, paketin yüklenmesi, temanın etkinleşmesi ve WordPress.org yayını farklı durumlardır.
- **Kalanlar:** bilinen eksikleri, hataları ve engelleri açıkça yaz.
- **Sıradaki iş:** bir sonraki sohbetin doğrudan başlayabileceği somut ilk işi ve tamamlanma ölçütünü belirt.
- Sürüm commit'inde yalnız o anda doğrulanmış bilgileri yaz. Commit SHA veya dağıtım sonucu sonradan belli olursa belgeleri takip eden bir dokümantasyon commit'iyle tamamla; bekleyen ya da başarısız yayını başarılı gösterme.
- Bu iki durum kaydı güncellenmeden sürüm çalışmasını tamamlandı diye kapatma. Çalışma yarıda kalırsa mevcut aşamayı ve devam adımını kaydet.
- Ayrıntılı sürüm geçmişini teknik belgede koru; AGENTS.md içindeki devam noktası en güncel durumu kısa ve tutarlı biçimde göstermeli.
- Yalnız dokümantasyon değişikliği için ürün sürümünü artırma veya yeni ürün yayını başlatma. Bu kayıtlar yeni bir yayın yetkisi vermez.

## Tema için kalıcı ürün kararları

- Öncelik sırası: **hız → sağlam altyapı → kullanım kolaylığı → görsel tasarım**. Renkler ve görünüm değişebilir; altyapı bu önceliklere göre kurulmalı.
- Mobil uygulama hissi; hızlı tepki, tutarlı gezinme ve düzgün geçişler demektir. Bu his için gereksiz kod, ağır bağımlılık veya SPA/headless mimarisi ekleme.
- Modern WordPress blok tema, theme.json ve Interactivity API kullanılır. Sepet işlemlerinde WooCommerce Store API esas alınır; para, stok ve miktar hesabının kaynağı sunucudur.
- **Tema Codela eklentisine bağımlıdır; eklenti temadan bağımsız çalışır.**
- Tema ayarları mevcut Codela ayar sayfasında yönetilir. Ortak görünüm ayarları yeniden oluşturulmaz.
- Tema ayarlarının altında Header (Üst alan), Footer (Alt alan) ve geliştirilen diğer bölümler için ayrı alt menüler bulunmalı; tüm ayarları tek uzun forma yığma. Bir tema bölümü geliştirilirken gerekli ayarları aynı çalışmada ilgili alt menüye ekle; temanın tamamlanmasını bekleme.
- Küçük değişikliklerde de mevcut codela.dev otomatik dağıtımı açık kalır. Bağlantılı değişiklikleri topluca yap, yalnız ilgili dosyaları incele ve dağıtım sonuçlarını gereksiz tekrarlarla sorgulama. WordPress.org yayını ayrı yetki gerektirir.
- Tasarım sade ve ürün odaklıdır. Kullanıcının aradığı özgünlük, karmaşık veya bilim kurgu dekorları eklemek anlamına gelmez. Sayfaları kullanım amacı ve örneklerle değerlendirerek tek tek geliştir.
- Header: mobil alt menü varsayılan açık ve Header ayarından kapatılabilir. Açıkken logo solda/menü sağda; kapalıyken desktop ile ortak menü/marka/arama-sepet-hesap düzeni. Masaüstünde alt menü yok, Hesabım dahil araçlar header içinde.
- Menü, arama ve sepet aynı görsel/etkileşim dilinde **tam ekran** açılır. Onaylanan yön Apple örneğindeki tam ekran menüdür; sayfayı yana iten menü önceki alternatifti.
- Menü/arama/sepet aynı native dialog içinde açılır. Güncel kaynakta dialog geometrisi sabit kalır; overlay controller içerik geçişlerini ve Menu/X açma-kapama zamanlamasını yönetir. 0.1.35 ile gelen aynı DOM düğmesinin animasyonlu Menu/X dönüşümü korunur; eski “kapatma bekletmez” notuna dönülmez. Dialog'a ikon kökenli büyüme uygulanmaz. Hareket azaltma tercihi, klavye, odak ve kaydırma konumu korunur.
- Arama hızlı ve doğru olmalı; gecikmiş eski sonuç yeni sorguyu ezmemeli. Mevcut sürümün yazım hatası toleransı olmayan aramasını gelişmiş arama gibi tanıtma.
- Tutarlı ikon dili: Lucide temelli 24×24 çizim alanı, 2 birim çizgi, yuvarlatılmış uç/köşe ve tek renk. Temada yalnız kullanılan yerel SVG dosyaları yüklenir; tüm paketi, ikon fontunu, CDN veya ikon JavaScript çalışma zamanını ekleme. Eklentinin mevcut SVG maskeleri korunur; yeni/değişen ikonlar bu standarda kademeli geçirilir. Yönetim ikon CSS dosyasını mağazaya yükleme.
- Ana sayfa, hakkımızda ve iletişim içerikleri kullanıcı tarafından rahatça düzenlenebilmelidir. İçerik düzenleme deneyimi henüz kesinleşmedi; mevcut WordPress metin/blok alanının tek başına kullanıcı ihtiyacını çözdüğünü varsayma. Elementor veya başka ağır bir sayfa oluşturucuyu kendiliğinden ekleme.
- Ürün, mağaza, sepet ve ödeme sayfalarının standart tasarımını tema yönetir; bunlar için kullanıcıya sayfa oluşturucu düzenleme zorunluluğu getirme.

## Depo ve yayın sınırları

- Güncel tema kaynağı bu depoda: `theme/codela-storefront/`.
- Eklenti ayarları, REST köprüsü ve yükleyici `muhammetdkaya/codela` deposunda kalır.
- Eski eklenti paketindeki 0.1.1 tema kopyası yalnız dondurulmuş ilk kurulum yedeğidir; tema değişikliklerini oraya tekrar yazma.
- `muhammetdkaya/codela-site` tanıtım temasını değiştirme.
- Küçük tema değişiklikleri bu deponun bağımsız dağıtımıyla canlıya gidebilir. Gerekli ayarları ilgili eklenti alt menüsüne aynı geliştirme kapsamında GitHub'da ekle; eklenti ayar değişikliklerini ara ara toplu yayınla.
- Şifreleri kodda, belgede veya günlükte tutma.

