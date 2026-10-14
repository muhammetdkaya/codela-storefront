> Tarihli arşiv. Bekliyor/açık ifadeleri yazıldıkları aşamayı gösterir; güncel kaynak AGENTS.md ve docs/storefront-theme.md.

# Codela Storefront — güncel çalışma kuralları

## 14 Ekim 2026 / 0.1.84 — navigasyon yükleme geri bildirimi ve history sahipliği (yayın bekliyor)

- 0.1.83'ün cart store fallback'i ve native navigate promise düzeltmesi korunur. Aynı URL watcher explicit tık ve history dönüşünü ayırır: yalnız explicit geçiş yeni main'e focus/scroll-top yapar; geri/ileri tarayıcı/WordPress scroll ve focus sahipliğini korur.
- Eski kurulu WordPress router'ı state.navigating sunmuyor ve loadingAnimation=false halinde kendi eski hasStarted bayrağını da yayımlamıyor; 160ms skeleton mevcut controller'ın native navigate promise'inden başlar. Yeni router/cache/history motoru eklenmedi.
- Descriptor olmayan Woo store ve lifecycle anahtarı olmayan router regresyonları eklendi; history URL değişiminin scroll-top yapmadığı ayrıca kontrol edilir.
- CI, gerçek FTP, current/minimum WP-Woo Chromium/WebKit matrisi ve canlı post-deploy sonuçları kapanışta kaydedilecek. 0.1.83 ara çalışma; son hedef 0.1.84. Canlı admin backfill ve fiziksel cihaz erişimi aynı engellerdir.

## 14 Ekim 2026 / 0.1.83 — gerçek WP/Woo kabulünde bulunan uyumluluk düzeltmeleri (yayın bekliyor)

- 0.1.82 canlıda; native Woo Button adaptörü ve plugin account dışlaması CI'da geçti, gerçek FTP 38613631082 başarılı. Canlı galeri/shell/native continuity ve WebKit 38614373732 başarılı. 24 lab audit 38614000776: mobil cold medyan home LCP 2496ms, product 1816ms, CLS 0. İlk WebKit kontrolü eski sürüm sabiti nedeniyle yanlış alarm verdi; test >=0.1.81 için düzeltildi ve tekrar geçti.
- Gerçek WP 7.1.3 / Woo 11.2.1 / Codela 1.1.1 kabulü: yeni WebP encoder/eski batch orijinal koruma, kategori fiyat filtre/sıralama/AJAX ekleme, simple/variable/stoksuz/grouped/external formlar, gerçek modül-cache güncellemesi, gecikmiş GET→yeni POST yarışı, Cart block çift yönlü miktar/silme/kupon, classic cart çift yönlü miktar ve classic checkout native COD siparişi, Checkout block güncellemesi geçti.
- Açılan iki gerçek kusur: (1) Woo 9 global cartStore descriptor sunmuyor, public wc/store/cart adıyla kayıtlı store'a bağlanma gerekir. (2) Kurulu router JS'inde state.navigating alanı yok; loadingAnimation=false iken eski navigation.hasStarted da yayınlanmaz. Yavaş ağda skeleton bu yüzden hiç başlamıyor. Kaynak kurulu /wp-includes/js/dist/script-modules/interactivity-router/index.min.js ile doğrulandı; yeni dokümantasyon kurulu runtime yerine varsayılmamalı.
- 0.1.83 aynı cart controller'da descriptor veya public store adına bağlanır; bilinmeyen store dispatch edilmez, load retry ve tek subscription korunur. Mevcut navigation controller 160ms feedback'i native actions.navigate() promise'ine bağlar, URL watcher history/focus'u günceller; ikinci fetch/cache/router yok. Eskimiş hızlı navigasyonun cleanup'ı yenisini ezmez.
- Unit regresyonu descriptor olmayan ve geç gelen store'u; shell fixture lifecycle state anahtarı hiç olmadan slow/fast davranışı kontrol eder. Gerçek current/minimum WP-Woo matrisinde ve canlıda son kabul bekliyor. Admin backfill için gerçek sitede yönetici oturumu, fiziksel Safari için cihaz erişimi ayrı engel.

## 14 Ekim 2026 / 0.1.82 — ortak native Woo Button sınırı (doğrulama/yayın bekliyor)

- 0.1.81 canlı kaynak korunarak F5'in hâlâ mevcut genel `.woocommerce ... .button` paint kuralı storefront.css içinden kaldırıldı. Tema içerik alanındaki native Woo link/button/input düğmeleri mevcut components.css Button gruplarına bağlandı; focus, disabled, press, reduced-motion ve erişilebilirlik aynı primitive'dir.
- Giriş yapılmış `.codela-my-account-layout` bu adaptörün dışında; açık secondary/quiet variant'ları ezilmez. Header/dock cam yüzeyi ve Woo form/nonce/POST sahipliği değişmez. Yeni runtime JS yok.
- Yeni browser regresyonu native Woo ve ortak Button computed paint/ölçü, dokunma, disabled ve plugin account dışlamasını kontrol eder. Gerçek WP/Woo/Codela kabul otomasyonu eklenti deposundaki tools/storefront-integration içinde hazırlanıyor; yayımlanan bağımsız tema ZIP'i SHA-256 ile kuruluyor, donmuş 0.1.1 yedeği kullanılmıyor.
- Şu ana kadar gerçek WordPress 7.1.3 / Woo 11.2.1 / Codela 1.1.1 / tema 0.1.81 üzerinde gerçek WebP encoder, kategori fiyat filtre/sıralama/AJAX ekleme, tüm ürün form türleri ve iki yönlü Cart block miktarı doğrulandı. Test altyapısındaki boş blok seed'i ve native/tema POST sayımlarının karışması düzeltildi; tam suite henüz geçmedi.
- CI → gerçek FTP → yeni paketle izolasyon suite ve canlı perf/galeri/shell/WebKit kontrolleri bekliyor. Canlı eski medya backfill'i WordPress admin oturumu olmadan yapılamıyor; giriş ekranı gözlendi. Fiziksel Safari manuel kabulü ayrıca açık.

## 14 Ekim 2026 / 0.1.81 — canlı yüzen yüzey görünürlüğü düzeltmesi TAMAMLANDI

- Kullanıcı iPhone ekranında header ve alt menünün arkasından ürün metninin görünmesini bildirdi. Önceki ortak token `--sf-ui-glass-surface:rgba(250,250,252,.28)` idi; şeffaflık yüksekti ve kontrast/brightness filtreleri arka planı ağartıyordu.
- 0.1.81 [PR #25](https://github.com/muhammetdkaya/codela-storefront/pull/25), [merge ecc2f936](https://github.com/muhammetdkaya/codela-storefront/commit/ecc2f936504385a4ef0b13822155249261309fbe): tek ortak yüzey `rgba(247,247,249,.96)`, yalnız tek `background` (ikinci gradient katmanı yok), `blur(10px)`, saturate(115%), contrast(1), brightness(1). Header logo/menu/actions, dock, Woo purchase ve soft iconlar aynı shared primitive; gölge, safe-area, dokunma ve layout korunur. Görünür veya gizli kontrolleri mobil/ürün modunda ayrıca kontrol et.
- [CI + **gerçek FTP** 38599841201](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38599841201) başarıyla bitti (deploy step success).
- [Canlı WebKit 390px 38600552295](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38600552295) **başarılı**: home .sf-brand/menu/dock ve ürün brand/menu/actions/purchase `alpha=.96`, `backgroundImage=none`, `blur(10px)`, gölge mevcut, header ve bar ölçüleri korunuyor. QA PNG'ler workflow artifact içinde, fiziksel iPhone manuel ekran testi ayrı.
- [Native ürün geçişi 38600548198](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38600548198), [galeri 38600245107](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38600245107), [kalıcı shell 38600245164](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38600245164), [perf 38600245123](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38600245123) hepsi başarıyla bitti. Mobil cold medyan LCP ana sayfa **2364ms**, ürün **1628ms**, CLS **0**, iki galeri thumbnail 8458 byte.
- **Sıradaki** fiziksel iPhone Safari ekranında header/dock bir kez doğrulama ve önceki ürün/kategori kapsamının Woo varyasyon/filtre/kategori uçtan uca kontrolü. Bu görsel sorun kaynakta çözülüp live WebKit ile doğrulandı; gerçek donanım görsel farkı bildirilirse screenshot üzerinden dar kapsamlı ayar yap.

## 14 Ekim 2026 / 0.1.81 — yüzen yüzeylerin opaklık/okunurluk düzeltmesi (CI ve canlı doğrulama bekliyor)

- Kullanıcı gerçek iPhone Safari ekran görüntüsünde **header arkasındaki ürün metni ve alt menü içinden sayfa metni okunuyor**. Kaynak: tek merkezde tokens.css `--sf-ui-glass-surface:rgba(250,250,252,.28)` ve çok güçlü arka plan filtresi `contrast(.35) brightness(1.42)`. Bu yüzeyler header brand/actions/menu, mobil dock, product purchase, gallery ve soft icon kontrolünde ortak kullanılıyor.
- 0.1.81 tek CSS primitive ile `rgba(247,247,249,.96)`, 10px blur, 115% saturation, doğal contrast/brightness (1), **ek beyaz gradient katmanı olmadan** tek background. Mevcut pill, gölge, animasyon, offset, tek dock/tek purchase bar, iOS safe-area ve Woo davranışları değişmez. Reduced-transparency ve no-filter fallback opaque kalır.
- tests/navigation-browser.cjs, product-browser.cjs ve ui-kit-browser.cjs gerçek computed opacity ve tek arka plan katmanını doğrular; WebKit/iPhone benzeri canlı kontrol ayrıca çalıştırılmalı. CI→deploy FTP adımını kontrol et; sonrasında live Safari/WebKit ve LCP/CLS ölçümüyle kapat. Görünüm devreye girene kadar 0.1.80'i düzeltildi sayma.

## 14 Ekim 2026 / 0.1.80 — canlı dağıtıldı, Woo native belge geçişi doğrulandı

- **Sürüm 0.1.80** [PR #24](https://github.com/muhammetdkaya/codela-storefront/pull/24), [merge 7f55ee9](https://github.com/muhammetdkaya/codela-storefront/commit/7f55ee9dd6d15986fcd7a9cbccf11875d2fdd1c3), [canlı dağıtım 38595615015](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38595615015) **validate ve gerçek FTP adımı başarılı**. Daha önceki 38595265913 run'ında deploy latest-main kontrolü nedeniyle atlanmıştı; bunu canlıya alındı sanmayın. Sonraki 91c757f commit'inde FTP gerçekten çalıştı.
- **Gerçek browser native süreklilik kabulü** [38596429188](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38596429188) **başarılı** (mobil 390, desktop 1280). Ana Sayfa→demo-20 Woo ürünü **yeni gerçek HTML belgesi**; pageswap/pagereveal viewTransition true; paylaşılan header; mobil tek purchase bar, gizli dock, native tek add-to-cart button, Woo FlexSlider galeri seçimi, JS pageerror yok. Ürün/kategori halen same-DOM router *değil*, sadece native cross-document snapshot. Gerçek kategori slug ve fiziksel Safari görsel testi ayrıca açık.
- [Galeri kabulü 38596178073](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38596178073) başarılı. [Statik WP Core Router shell kabulü 38596178175](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38596178175) başarılı. [24 performans audit 38596178101](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38596178101) geçti: mobil cold medyan ana sayfa **2436ms LCP**, ürün **1804ms LCP**, CLS 0, iki ikincil thumbnail transferi 8458 byte. Bunlar lab değerleri, saha CWV değildir.
- Checkout/cart/account/admin native tam belge ve görünüm geçişi devre dışı. Reduced motion tarayıcı testi mevcut; iOS Safari WebKit cross-document View Transitions desteği 18.2+; cihaz kabulü yapılmadı.
- **Sıradaki:** gerçek canlı Woo kategori geçişi için category URL + Woo legacy product-loop/AJAX davranışı read-only doğrulaması; fiziksel Safari alt bar/scroll testi; ancak gerçek WP/Woo E2E varyasyon, stok, grouped ve sepet uyumu sağlanırsa aynı-DOM routing için ayrı küçük prototip. Yüksek performans ve checkout stabilitesi korunmalı.

## 14 Ekim 2026 / 0.1.80 — Woo sayfaları için native görsel süreklilik (test/yayın bekliyor)

- WooCommerce kategori/ürün sayfaları mevcut WordPress Router bölgesine eklenmiyor. Legacy FlexSlider, varyasyon ve sepete ekle betikleri gerçek sayfa açılışına ihtiyaç duyduğu için ürün ve kategoride **tam belge yükleme korunuyor**. Yeni CSS cross-document View Transitions yalnız destekleyen tarayıcıda header ve mobil alt bar/purchase görüntüsünün kısa süreli sürekliliğini sağlar; DOM kalıcılığı iddia edilmez.
- Kod: inc/document-continuity.php koşul kapısı; styles/document-continuity.css native view-transition, prefers-reduced-motion no-preference. Home/statik WP sayfa ile Woo product/shop/product_cat/product_tag izinli; checkout/cart/account/admin hariç. Woo Store API/cart, gateway, form ve JS'e müdahale yok, ek fetch/router motoru yok.
- Test: tests/document-continuity.php ve tests/document-continuity-browser.cjs (gerçek HTTP document navigation, tek native form POST, reduced motion), eski tüm Woo browser regresyonları. CI→deployment→read-only canlı QA ve mobil LCP/CLS sonucunu doğrula. Fiziksel Safari ve gerçek same-DOM Woo routing **açık**.

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



# Codela Storefront — güncel çalışma kuralları

## Son doğrulanmış devam noktası — 14 Ekim 2026 / 0.1.84

- Tema **0.1.81 → 0.1.84 canlıda**; kaynak `ae1f412794cb9c24be3dbd944d603e149e2e2344`, [validate + gerçek FTP](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38616608720) başarılı. Codela eklentisi **1.1.1**; eklenti runtime/WordPress.org yayını değiştirilmedi.
- Ortak yüzen yüzey `rgba(247,247,249,.96)`, tek background, gradient yok; blur10px/saturate115%/contrast1/brightness1. İkinci renk katmanı ekleme.
- Native Woo düğmeleri ortak Button'a uyarlandı, eski global paint kaldırıldı; Codela oturum içi hesap dışlanır. Woo9 public `wc/store/cart` fallback'i aynı controller'da, yeni motor/polling/bundle yok.
- Native navigate promise'i160ms skeleton'ı yönetir; kurulu router'da olmayan `state.navigating` alanına bağımlılık kaldırıldı. Explicit tık focus/scroll-top yapar; history konumunu browser/core yönetir. Güvenli home/statik kapsamını Woo sayfalarına SPA olarak genişletme.
- Native PhotoSwipe, hero eager/high, ihtiyaç halinde ikincil görsel yükleme ve yeni JPEG WebP türevleri korunur.
- [Kabul kaydı](docs/acceptance/2026-10-14.md): canlı beş gate başarılı; mobil cold lab medyan LCP home2468ms/ürün1768ms, CLS0. İki WP/Woo ailesinde Chromium ve WebKit'in 11'er gerçek akışı başarılı (4/4 ortam).
- **Kalan / ilk iş:** Canlı eski JPEG backfill **yapılmadı**. WordPress yönetici giriş ekranı görüldü; güvenli giriş isteği kullanıcı tarafından iptal edildi, yönetici oturumu doğrulanmadı. Tekrar giriş isteme; kullanıcı devam etmek isterse metadata/dosya yedeği ve küçük örnekten sonra native Medya → Image Optimization batch'ini doğrula. İzole CI encoder başarısı canlı host desteğini kanıtlamaz. Fiziksel iPhone Safari GPU/toolbar/safe-area kabulü ayrıca açık; CI WebKit fiziksel cihaz değildir.
- [Devam noktası tarihçesi](AGENTS-history-2026-10-14.md), [teknik tarihçe](docs/storefront-theme-history-2026-10-14.md). Tamamlanan yayınları yeniden yapma. Yeni tema sürümünde gerçek entegrasyon workflow paket/hash/source pin'ini güncelle.

