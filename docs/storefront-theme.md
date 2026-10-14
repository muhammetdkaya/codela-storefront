# Codela Storefront — güncel teknik durum

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

## 14 Ekim 2026 / 0.1.80 — canlı native Woo belge geçişi doğrulaması

- [PR #24](https://github.com/muhammetdkaya/codela-storefront/pull/24), [merge commit 7f55ee9](https://github.com/muhammetdkaya/codela-storefront/commit/7f55ee9dd6d15986fcd7a9cbccf11875d2fdd1c3), [CI + **gerçek** FTP dağıtımı 38595615015](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38595615015) başarılı. Version: 0.1.80. Daha önceki 38595265913 'success' olsa da FTP guard'da **skipped**; bu eski çalışma dağıtımı değildir.
- Native sayfa (MPA) WebKit/Chromium View Transitions CSS only, sadece home/statik sayfa/ürün/mağaza/kategori/etiket. Reduced-motion opt-out ve preview/customizer/checkout/cart/account/admin dışında. Native Woo klasik galeri/variation/quantity/add-to-cart normal sayfa açılışında yeniden başlatılır. Header snapshot ve tek visible mobile dock veya purchase bar görünümü paylaşıldı; aynı DOM korunması sadece 0.1.79'un güvenli statik WP router geçişlerinde mümkün.
- [Canlı product browser acceptance 38596429188](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38596429188): Ana Sayfa→demo-20 product, 390px ve 1280px; PageSwap true + PageReveal true; native new document, header shared name, tek native satın alma butonu, 390px'te purchase shared bottom adı ve tek bar, console errors sıfır; native Woo FlexSlider click doğru. Otomatik add-to-cart POST canlıda yapılmadı; sadece izole Chromium CI'da tek POST doğrulandı.
- [Canlı Woo galeri 38596178073](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38596178073), [statik sayfa shell 38596178175](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38596178175) başarılı. [24 sample lab audit 38596178101](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38596178101): home LCP medyan 2436ms; product LCP 1804ms; CLS her ikisinde 0. İki ikincil küçük galeri görselinin toplam transferi 8458B. Yalnız lab (not field CWV).
- **Sınırlar:** gerçek kategori sayfasından ürün listesi/sıralama/filtre/ajax-add-to-cart uçtan uca testi; iPhone Safari/Safari Web Inspector, üçüncü taraf plugin, yavaş ağ, varyasyon/gruplu/dış ürün ve Woo Blocks sepette gerçek entegrasyon açık. Bunları doğrulamadan client-side Woo product router'a geçmeyin.
- CI otomasyonu: tools/document-continuity-live.cjs, workflow document-continuity-live.yml, test scripti sadece top-level frame'e sessionStorage yazar. Canlı HTML/cookie/sepet üzerinde hiçbir mutasyon yapmaz.

## 14 Ekim 2026 / 0.1.80 — Woo ürün/kategori geçişinde native görüntü sürekliliği (test/yayın bekliyor)

- 0.1.79 temel statik-page router korunur; Woo ürün/kategori sayfaları WordPress Core Router'a alınmaz. Header ve alt menü için CSS View Transition ile desteklenen tarayıcıda **görsel süreklilik** sunulur. Tam sayfa yenilemesi ve Woo'nun normal gallery/variation/cart/form başlatması devam eder. Kaynaklar: inc/document-continuity.php, styles/document-continuity.css.
- Yalnız home, izinli statik page, product, shop, product_cat ve product_tag. Checkout/cart/account/admin durumlarında stil yüklenmez. CSS prefers-reduced-motion no-preference; desteklemeyen tarayıcıda doğal yükleme. Mobilde dock ve ürün sayfasının mevcut tek sf-product-purchase alanı aynı görünüm yuvasını paylaşır, ikisi birden görünür yapılmaz.
- Başarının kapsamı: gerçek DOM üzerinde kesintisiz product navigation **değil**; eski document snapshot'ının yeni HTML yüklenirken korunması. Ek JavaScript, ikinci router, prefetch, WooCommerce Store API mutasyonu veya yeni sepet mekanizması yok.
- Tests/document-continuity.php ve tests/document-continuity-browser.cjs ile native navigation, tek POST ve reduced-motion kontrolü; PR CI, canlı ürün/kategori / galeri, mobil/desktop ve perf audit sonuçları **henüz doğrulanmadı**. Sonraki mühendislik fazında gerçek same-DOM Woo için Woo legacy betik ömrü ve WC Blocks davranışı önce izole WordPress/Woo üzerinde test edilmeli.

## 14 Ekim 2026 / 0.1.79 — güvenli sayfalarda kalıcı üst/alt navigasyon (canlıda)

- Tema **0.1.78 → 0.1.79**; [PR #23](https://github.com/muhammetdkaya/codela-storefront/pull/23), [squash commit 551341b](https://github.com/muhammetdkaya/codela-storefront/commit/551341b35be3bef06aff913b09b24b165ea57975), [CI + Deploy 38584666763](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38584666763) başarılı, gerçek FTP dağıtımı doğrulandı. Codela eklenti sürümü/WordPress.org değiştirilmedi.
- `@wordpress/interactivity-router` (WordPress Core) ve yalnız izinli sayfalarda `#sf-content[data-wp-router-region]` ile main yenilenir; header/dock/single dialog aynı DOM öğeleridir. Client Navigation desteklemeyen WP ve Woo ürün/kategori/cart/checkout/account/dinamik formlu sayfalarda normal belge yüklemesi korunur. Kendi SPA ve ikinci fetch/cache/checkout motoru yok.
- Kullanıcı 160ms üzerinde beklerse hedef sayfa tipine göre sade skeleton; hızlı cached geçişte gizli. `prefers-reduced-motion` ve forced-colors uygulanır; shell stylesi tek merkezde. Navigasyonda popup mevcut overlay içinden gecikmesiz kapanır; dock active/aria-current yenilenir ve yeni main klavye odağını alır.
- [Canlı browser acceptance 38586324215](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38586324215): router modülü + region mevcut; ana sayfa URL varyasyonunda header/dialog/dock aynı referanslar; browser back same header; **gerçek Ana Sayfa→/blog/** statik sayfada içerik bölgesi değişir ve header referansı korunur; JS pageerror yok. Hızlı testte skeleton görünmedi; canlı yavaş ağda skeleton ayrı test edilecek.
- [Galeri 38585183010](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38585183010) başarılı. [24 örneklik performance 38585182538](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38585182538) geçti: cold mobil home LCP **2380ms**, product **1692ms**, CLS **0**; ikincil iki thumbnail **8458 bytes**. Gerçek Core Web Vitals değil.
- **Bilinen sınırlar:** Woo legacy gallery/single-product native JS, Blocks checkout, Codela account ve üçüncü taraf kodlar resmi client-navigation uyumluluğu kanıtlanmadan router region'a alınmaz; bu sayfalarda header tam sayfa yenilenebilir. Fiziksel mobil Safari, ters farklı sayfa geçişi, admin bar ve canlı yavaş ağ skeleton testi açık.
- **Sıradaki test/iş:** gerçek telefonda Ana Sayfa → Blog → Ana Sayfa menü navigasyon, UI renk/yükseklik/scroll/focus, 160ms skeleton eşiği (throttle) ve kategori/ürün sayfasında mevcut full navigation fallback. Yalnız kabul sonrası dinamik Woo kapsamını fazlara böl.

## 14 Ekim 2026 / 0.1.79 — kesintisiz shell + koşullu skeleton (CI ve yayın bekliyor)

- **Sürüm:** 0.1.78 → 0.1.79, sadece `codela-storefront` tema. Eklenti/WordPress.org değişmez.
- **Doğru mekanizma:** WordPress `@wordpress/interactivity-router` resmi script module ve `data-wp-router-region="codela/storefront/main"`; URL, history, fetch, cache ve hatada normal belgeye dönme core'a ait. Kendi SPA/router/back-forward/sunucu response parser yapılmaz. Core 6.9+ client navigation support metodu yoksa özellik açılmaz; tema asgari WP 6.5 desteği kalır.
- **Kapsam sınırı:** yalnız ana sayfa ve sade, herkese açık core-blok WordPress `page` içerikleri; PHP shortcode/özel blok, embed form, WC checkout/cart/account, product/archive/taxonomy ve kimlik bağımlı alanlarda tam sayfa yükleme korunur. `wp_interactivity_config('core/router', ['clientNavigationDisabled'=>true])` hedef sayfada zorunlu fallback işaretidir. Ürün galeri, varyasyon ve gateway hazır olma döngüsü router ile yapılmış varsayılmaz. Header/dock **yalnız kapsamdaki geçişlerde** aynı DOM referansı kalır.
- **Görünüm:** 160ms bekleme sonrası içerik alanında skeleton; hızlı geçişte yok. Home hedefi hero/kart, normal sayfa hedefi satır/başlık; header/dock/popup tarafında ikinci katman yok; reduced-motion, forced-colors/klavye odağı. Popup içindeki güvenli link navigasyonu için overlay mevcut `closeForNavigation` ile anında açılır kapanır, scroll konumu geri zıplatmaz.
- **Test/güvenlik:** tests/navigation.php ve tests/shell-navigation-browser.cjs, eski CI testleri. WordPress gerçekte route/back/forward ve eklenti script/katalog uyumu henüz kanıtlanmadı; canlı/saha kabul olmadan kapsam genişletmeyin. Kendi router cache'i yok; müşteri cart, login, POST, ödeme olaylarına müdahale edilmez.
- **Sonraki iş:** PR CI → merge/deploy → gerçek canlı navigasyon DOM kimlikleri, history/scroll/focus, kısa-uzun bekleme, geri/ileri ve WP sayfa düzenleyici ile uyum kontrolü. Ardından yalnız doğrulanmış Woo listelerinde kapsam genişletme planı.

## 14 Ekim 2026 / 0.1.78 — otomatik WebP üretimi, kontrollü eski görsel dönüşümü ve galeri aktarımı (canlıda)

- **Kaynak/yayın:** 0.1.77 → **0.1.78**; [PR #22](https://github.com/muhammetdkaya/codela-storefront/pull/22), [squash c0e5a28](https://github.com/muhammetdkaya/codela-storefront/commit/c0e5a287b1f58a7845c6769761e4efd4199d6c70), [CI + Deploy 38578243841](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38578243841) validate ve Deploy Storefront only başarılı. Eklenti sürümü değişmedi.
- **WebP otomasyonu:** WordPress `image_editor_output_format` mapping ile, sunucu WebP yazabiliyorsa yeni JPEG ara boyutları WebP olur; varsa başka JPEG dönüşüm haritası ezilmez. Full orijinal JPEG ve eski dosyalar korunur. GIF/PNG'ye müdahale yok. AVIF otomatik seçilmez. Sayfa açılışında PHP resim dönüştürmez.
- **Mevcut dosyalar:** Medya → Görsel optimizasyonu `manage_options` + nonce ile bir dosya/istek; yalnız daha küçük WebP ara boyutu WordPress `sizes` metadata'sına alınır. Eski JPEG ara dosyası/fulls silinmez. İşlem yönetici tarafından başlatılır; **codela.dev eski JPEG dosyaları henüz dönüştürülmedi**. Sitede gerçek encode, özel medya ve offload eklentileriyle bütünleşme açık.
- **Galeri:** yalnız hero eager/high; ikincil büyük görseller başlangıçta küçük Woo thumbnail `src` olarak gelir; `srcset/sizes` ve full URL data'da korunur. Native slider aktif sınıfı/thumbnail etkileşimi/touch/klavye ile gerektiğinde gerçek görsel istenir. Woo PhotoSwipe bağlantısı, varyasyon ve satın alma kodu değişmez.
- **Gerçek kabul:** [galeri acceptance 38578622890](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38578622890): 390/1280px native slide seçimleri, PhotoSwipe aç/kapat, galeri ve özet stabil, canlı tokens.css?ver=0.1.78; başarılı.
- [24 örneklik post-deploy audit 38578623047](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38578623047): mobil cold ürün LCP medyan 1592ms (bütçe ≤2500), ana sayfa 2312ms (≤2800), CLS **0** (≤0.1). İki görünmeyen ikincil galeri büyük JPG'inin önceki 223188 byte başlangıç transferi yeni sayfada **8458 byte** küçük thumbnail transferi oldu (yaklaşık **%96.2 daha az**, ikincil grup); bu jpeg→WebP kazancı değil, ilk yüklemede büyük isteklerin ertelenmesidir. Üç cold örnekte aynı. Lab ortamı ile fiziksel Safari/field CWV ayrımı korunur.
- **Açık:** gerçek WordPress sunucusunda yeni JPEG upload'ın codec uyumu; Media admin batch backfill/özellikle çok büyük dosya ve nonlocal medya; gerçek varying/gallery uyumu; görsel kalitesi ve fiziksel cihaz; F3/F4/F5/F6'nın diğer açık kabulleri.
- **Sıradaki iş:** admin backfill'i az sayıda JPG üzerinde doğrula, önce-sonra JPEG/WebP dosya ve WordPress metadata değişimini karşılaştır, sonra kontrollü eski medya gruplarında ilerle. Müşteri/kullanıcıya ait medya işlemi yapmadan önce görsel yedeği al. Native galeriyi ve Safari'yi test etmeye devam et.

## 14 Ekim 2026 / 0.1.78 — otomatik WebP ve ihtiyaç üzerine ürün görseli (doğrulama bekliyor)

**Kapsam:** 0.1.77 → 0.1.78 yalnız medya üretimi, Media bakım aracı ve Woo ürün galerisinde veri aktarımı. Codela eklenti sürümü değişmez. Native Woo slider, cart/checkout, ortak UI ve tam ekran orijinal görseller korunur.

- Yeni JPEG yüklemelerinde WordPress'in `image_editor_output_format` haritasıyla, sunucu WebP encoder destekliyorsa, ara boyutlar WebP yazılır. Bu **her seferinde sayfa açarken yapılan dönüşüm değildir**. Orijinal JPG saklanır. AVIF varsayılan değil (encoding CPU maliyeti/sunucu desteği değişken); PNG ve GIF dönüşmez.
- **Mevcut görseller:** Medya → Image Optimization → Optimize existing images. Bounded admin AJAX (manage_options, nonce, tek JPEG attachment/istek, durdurulabilir). Meta veride JPG ara boyutlar WebP küçükse değiştirilir; JPEG ve full dosyaları silinmez. Bakım işlemi yönetici başlatmadan **otomatik çalışmaz**. Cloud/offload eklentilerinde ve mevcut medya birikiminde ayrıca kabul gerekir.
- Ürünün **ilk görünür görseli eager/high**; diğer büyük slaytlar başlangıçta Woo'nun thumbnail URL'siyle açılır, image/full `src/srcset/sizes` data attribute'unda tutulur. Seçili thumbnail, Woo `flex-active-slide`, gerçek touch/pointer veya klavye yönünde gerektiğinde tam görsel aktif edilir. Woo full-screen bağlantısı ve `data-large_image` hiçbir şekilde değiştirilmez. JS kapalıysa küçük önizleme img kalabilir, bağlantı yine yüksek çözünürlüklüdür.
- Ölçüm hedefi: 0.1.77'de 223188 byte olan ikincil tam JPEG başlangıç aktarımının kullanıcı slayta geçmedikçe oluşmaması; ürün LCP ≤2.5s, CLS ≤0.1, native galeri click/swipe/lightbox ve varyasyon etkilenmemesi. Bu değerler **0.1.78 için ölçülmüş sonuç değildir**.
- CI/browser ve deploy **bekliyor**. Fiziksel Safari, gerçek WordPress yeni medya yükleme, WebP desteklemeyen host, üçüncü taraf medya saklama, varyasyon/gruplu/harici ürün kabulü açık.

## 14 Ekim 2026 / 0.1.77 — canlı doğrulama, medya maliyeti ve post-deploy koruması

- Sürüm **0.1.77** canlıda: [commit 3d16be3](https://github.com/muhammetdkaya/codela-storefront/commit/3d16be31688c51fdf33d0fd7e10764db157c25e5), [deploy 38548542214](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38548542214), [galeri kabulü 38548935704](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38548935704) başarılı. 0.1.77 için önceki “yayın bekliyor” kaydı sürüm anındaki tarihsel nottur.
- [24 canlı performans örneği 38548935685](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38548935685): mobil cold medyan LCP ürün 1488ms, ana sayfa 2220ms; üçer soğuk ölçümde CLS 0. Hero eager/high. LCP adayı bazen metindir; bu sayılar tam görsel ekrana gelme süresi ya da sahadaki Core Web Vitals değildir.
- Tek mobil soğuk ürün örneğinde iki ikincil galeri JPEG'i 120526 + 102662 = **223188 byte** transfer etti, başlangıçları yaklaşık 2151ms. HTML lazy yükleme açık olsa da tarayıcı bunları indirdi. Buna çözüm diye slider'ı devre dışı bırakmak veya tam ekran/orijinal kaliteyi kaybetmek kabul edilmez.
- Sonraki çalışmada sürümü değiştirmeyen **sadece ölçüm aracı değişikliği**: audit cold mobil medyanları CLS ≤0.1 ve ürün LCP ≤2500ms / ana sayfa LCP ≤2800ms ile test eder; eksik veya HTTP hatalı üçlü ölçümü başarısız sayar. Audit ikincil galeri görsellerinin ayrı ağ transferini sonuç dosyasına yazar. Bunlar **dağıtım sonrası alarmdır, üretime çıkmadan önceki engel değildir**. [PR #21](https://github.com/muhammetdkaya/codela-storefront/pull/21) birleştirildi ([commit 8c723e5](https://github.com/muhammetdkaya/codela-storefront/commit/8c723e53e26232ebe0532eee830b62ab481c0e0d)). [PR unit CI 38567752350](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38567752350) ve [main unit CI 38567820947](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38567820947) başarılı. [Yeni 24 ölçümlük canlı audit 38567820984](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38567820984) tamamlandı, **success**: mobil cold medyan ürün LCP 1940ms (2500ms eşik), ana sayfa 2612ms (2800ms eşik), CLS 0 (≤0.1 eşik). SecondaryGallery medyanı **223188 transfer byte** (2 görsel), üç soğuk mobil örnekte aynı. Önceki 0.1.77 ölçümüne göre farklı LCP rakamları oluştu, ancak tema kaynakları değişmedi; laboratuvar koşulları/ağ değişkenliği ayrıştırılmadan değişimi bir hız regresyonu veya kazancı diye yorumlamayın. Bu koruma **deploy sonrası** çalışır; otomatik rollback sunmaz.
- Açık: WebP/AVIF mevcut medya türevlerini opt-in ve güvenli biçimde dönüştürme, görüntü kalitesi/gerçek Woo swipe-lightbox kabulü, fiziksel Safari, stok/kupon/varyasyon/gruplu/harici ürün ve checkout kabulü.

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

- 0.1.73 üretimde, [Actions 38537660826](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38537660826) validate/deploy başarılı. [Canlı 24 ölçüm](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38537975758) product mobile cold LCP'yi 2.940→1.524s, home LCP'yi 2.472→2.240s gösterdi. Hero eager/high ve tokens.css 0.1.73 canlıda; CLS 0.231 kaldı. Detay: [performans raporu](performance/2026-10-14.md).
- 0.1.73'ün min-height önlemi tek başına CLS'yi çözmedi. 0.1.74'te FlexSlider başlangıcından önce wrapper içinde yalnız ilk galeri slaytı yer kaplar; native flex-viewport kurulduğunda diğerleri yeniden görünür. Dört görselli tarayıcı regresyonu ve audit arama X seçici düzeltmesi eklendi.
- [PR #19](https://github.com/muhammetdkaya/codela-storefront/pull/19): Kod/test/doküman aşamasında; CI doğrulaması ve **0.1.74 canlı dağıtımı henüz doğrulanmadı**. Sıradaki: CI → merge → gerçek deploy → 24 cold/warm audit. Beklenen CLS ≤0.1; ulaşmazsa kaymanın başka tetikleyicisi için tekrar teşhis yapılmalı.
- Gerçek Safari, uzun kaydırma, dolu sepet ve Woo ürün türleri için saha kabulü ayrıca açık.

## 0.1.73 performans düzeltmesi — 14 Ekim 2026 (doğrulama/yayın devam ediyor)

- 14 Ekim [ilk ölçümü](performance/2026-10-14.md) esas alındı: mobil ürün cold LCP 2.940s, CLS 0.231. Bu değerler **önceki sürüme** aittir, 0.1.73 için yeni sonuç uydurulmaz.
- 0.1.72 → 0.1.73: Woo ürün galerisinde yalnız öne çıkan görsel eager/high, diğer görseller native davranışta; FlexSlider kurulurken galeri/viewport yüksekliği ayrılıyor. Logonun srcset sizes bilgisi boyut oranına göre düzeltiliyor.
- Tüm tema CSS'leri style.css Version üzerinden aynı cache anahtarını kullanıyor. Codela checkout-pro stil handle'ı sadece katalog/ürün gibi checkout/hesap dışı sayfalarda dequeue edilir; Woo veya sepet/ödeme JS'i değişmedi.
- Tarayıcıda FlexSlider başlangıç kaymasını doğrulayan test ve CI'dan sonra canlı read-only performans audit çalıştıran otomasyon eklendi. İlk PR CI sonucu incelenmeli, ölçümler canlı dağıtım **sonrasında** tekrar alınmalı.
- Kaynak: [PR #18](https://github.com/muhammetdkaya/codela-storefront/pull/18). Sonraki iş: validation başarısını, gerçekten gerçekleşen dağıtımı ve live audit LCP/CLS/hero/CSS URL değerlerini kontrol edip raporlamak. Gerçek mobil Safari ve Woo ödeme/çeşitli ürün tipi kabulü ayrı açık.


## Hız önceliği — 14 Ekim 2026

Kullanıcı yeni özellik/tasarım öncesinde hız testi istedi. Canlı tema değiştirilmeden 24 cold/warm sayfa ölçümü ve üç hedefli mobil teşhis tamamlandı. [Rapor](performance/2026-10-14.md), [ham sonuçlar](performance/2026-10-14-results.json). Mobil cold medyan LCP: ana sayfa 2.472s, ürün 2.940s; ürün CLS 0.231. İlk ürün görseli lazy, ürün özeti ilk yüklemede kayıyor. Popup ilk tepki yaklaşık 34–59ms medyan; ağır JS kilitlenmesi gözlenmedi. Ortak tokens.css hâlâ 0.1.71 URL'siyle ve bir haftalık cache ile servis ediliyor. Sıradaki iş: hero yükleme önceliği + galeri başlangıç geometrisi; ardından koşullu CSS ve tek asset sürüm kaynağı. F6 kapatılmadı; fiziksel Safari/GPU ve gerçek kullanıcı ölçümü hâlâ açık. Bu turda optimizasyon/canlı yayın yapılmadı, tema 0.1.72.

## Son doğrulanmış devam noktası — 14 Ekim 2026 / 0.1.72

- Tema 0.1.71 → 0.1.72: açık zeminde kaybolan ortak cam yüzeyin ayrımı tek dış gölgeyle artırıldı (0 3px 12px / %10). İç üst ışık kaldırıldı; ikinci dolgu, iç çerçeve veya yeni katman eklenmedi. Cam brightness 1.5 → 1.42; 28% tint, blur ve saydam kenar korunur.
- Header, alt menü ve satın alma ortak token değişikliğini tüketir. Ölçüler, etkileşimler ve koyu birincil buton değişmedi.
- Doğrulama: PHP/JS ve 23 paket testi, ortak UI, gezinme, ürün, ödeme ve hesap tarayıcı kontrolleri CI'da başarılı. İlk çalışmadaki eski 0.1.71 test beklentileri 0.1.72'ye güncellendi. Fiziksel mobil görsel kabul henüz yapılmadı.
- Yayın: [kaynak e8f2415](https://github.com/muhammetdkaya/codela-storefront/commit/e8f24154dfe7cf7985ddfa37436b2ade28635dd7); [Actions 38514144873](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38514144873) validate=success, deploy=success. Gerçek Deploy Storefront only adımı ve deploy.py 'Storefront deployed; checks passed.' logu doğrulandı (14 Ekim 2026 05:00 UTC).
- Kalan/sıradaki: fiziksel mobil açık zemin üzerinde tek yüzey görünümünü kontrol et. Önceki safe-area, gerçek Woo ürün türleri, F3/F4/F5/F6 kabulleri açık; slider duraklatıldı.

## Son doğrulanmış devam noktası — 14 Ekim 2026 / 0.1.71

- Tema 0.1.70 → 0.1.71: kullanıcı header'daki cam kapsüllerin çift arka plan/kenar hissini düzelttirdi. Ortak glass shadow üç katmandan hafif dış gölge + 0.5px/35% tek üst ışığa indirildi; koyu alt inset kaldırıldı. Beyaz gradient parlaması ve pressed parlaması azaltıldı. Header'a ayrı kopya yüzey eklenmedi.
- Ortak yüzeyi tüketen kontroller aynı düzeltmeyi alır. Saydam tint, blur, ikon kontrastı, focus/press, fallback, bottom-bar ölçüleri korunur. Logo görsel dosyası değiştirilmedi.
- Doğrulama/yayın: 23 paket testi ve CI ortak UI/ürün/gezinme tarayıcı kontrolleri başarılı. Kaynak [6d9493f](https://github.com/muhammetdkaya/codela-storefront/commit/6d9493fd6f3c745ef2ac2e0856583e4f0a1d6ce3); [Actions 38512337635](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38512337635) validate=success, deploy=success. Gerçek deploy.py logunda 'Storefront deployed; checks passed.' doğrulandı. Canlı Demo 20 menü/marka/araç kapsülleri aynı hafif dış gölge + 0.5px/35% üst ışığı kullanıyor; koyu alt inset yok, blur(8px) ve ortak saydamlık korunuyor. Masaüstü canlı ekran görüntüsü kontrol edildi; fiziksel mobil/beyaz zemin kabulü açık.
- Kalan/sıradaki: fiziksel mobil cam yüzey/beyaz zemin kabulü, tarayıcı araç çubuğu ve klavye/safe-area, gerçek varyasyon/grup/harici ürün kabulü, dönüşüm araçları. Slider duraklatıldı; F3/F4/F5/F6 ve mevcut animasyon CI zamanlaması açık.

## Son doğrulanmış devam noktası — 14 Ekim 2026 / 0.1.70

- Tema 0.1.69 → 0.1.70: kullanıcı satın alma ve genel alt menünün birlikte daha aşağıda olmasını istedi. Ortak `sf-ui-bottom-bar-gap` 12px → 4px; normal dock, dialog dock ve satın alma aynı alt hizayı tüketir. Tam safe-area payı korunur; 58px yükseklik ve 430px azami genişlik değişmez.
- Yalnız ortak ölçü token'ı değişti; yeni JS/istek/cihaz dalı yok. Tarayıcı kontrolü satın alma ve dialog dock'unun alt hizasını karşılaştırır.
- Doğrulama/yayın: 23 paket testi başarılı. CI 5 genişlikte ürün/gezinme kontrolleri ve satın alma/dialog dock alt-kenar eşitliği başarılı. Kaynak 9f06b3f36e4d2f7455515a970c8f047d3bc6c89a / Actions 38511205343 validate=success, deploy=success. Gerçek Deploy Storefront only deploy.py başarı loguyla doğrulandı. Canlı Demo 20 CSSOM: ortak gap=4px, height=58px; navigation ve purchase aynı gap+safe-area formülünü kullanıyor. Fiziksel mobil tarayıcı araç çubuğu kontrolü bu otomatik ölçümün yerine geçmez.
- Kalan/sıradaki: fiziksel mobil tarayıcı araç çubuğu ve klavye/safe-area kabulü, gerçek varyasyon/grup/harici ürün kabulü, dönüşüm araçları bütünlüğü. Slider duraklatıldı; F3/F4/F5/F6 ve mevcut animasyon testinin CI zamanlaması kararlılığı açık.

## Son doğrulanmış devam noktası — 14 Ekim 2026 / 0.1.69

- Tema 0.1.68 → 0.1.69: stok kodu/kategori/etiketler ve genel stok bilgisi native Ek bilgi sekmesine taşındı. Sekme yoksa Woo'nun mevcut additional_information callback'iyle eklenir; var olan sekme/özellik/ağırlık/boyut ve extension hook'ları korunur.
- Native meta summary hook'undan kaldırılır, additional-information action'ında render edilir. Genel stock HTML yalnız bu sekmede; varyasyonun canlı availability HTML'i korunur. İkinci tabs/form/JS/API yok.
- Doğrulama/yayın: PHP hook/sekme/stok kontrolleri ve 23 paket testi başarılı. Mevcut sekme callback'ini koruma, sekme yokken ekleme, genel stok taşıma, varyasyon availability ve diğer sayfalardaki stok HTML'i kontrol edildi. Kaynak a96958760251c7d5f18d2cecd8266d8d215122ad / Actions 38468155710 attempt 2: validate=success, deploy=success; gerçek Deploy Storefront only başarılı (deploy.py ve 'Storefront deployed; checks passed.' log kanıtı). İlk deneme mevcut navigation-browser 55ms animasyon ara-konum kontrolünde durdu; aynı kodla tekrar geçti. Canlı Demo 12: summary meta/stock=0, Ek bilgi meta=1 ve '25 adet stokta', Koleksiyon/Günlük özelliği korundu, satın alma butonu=1. Demo 19: stok yalnız sekmede 'Stokta yok', satın alma alanı=0 ve dock=1. Yeni variation availability guard PHP testinde doğrulandı; gerçek varyasyon kabulü hâlâ açık.
- Kalan/sıradaki: fiziksel mobil klavye/safe-area ve gerçek varyasyon/grup/harici satın alma kabulü, dönüşüm araçları bütünlüğü. Slider duraklatıldı; F3/F4/F5/F6 açık. Mevcut 55ms ara-konum animasyon testinin CI zamanlaması kararlılığı ayrıca takip edilmeli.

## Son doğrulanmış devam noktası — 13 Ekim 2026 / 0.1.68

- Tema 0.1.67 → 0.1.68: kullanıcı ürün sayfasındaki Ana Sayfa / kategori / ürün yol bilgisini istemiyor. Native Woo breadcrumb ürün belgesinde kaldırılır, summary'ye yeniden eklenmez. Başlık/fiyat doğrudan galeri ardından gelir. Kullanıcının ek isteği: satın alma alanı normal alt menüyle aynı 58px yüksekliğe, 430px azami genişliğe, 16px yan ve 12px safe-area alt boşluğa bağlandı. Navigation/purchase tek bottom-bar ölçü token'larını kullanır; 48px iç kontrol hedefleri korunur.
- Doğrulama: mevcut PHP breadcrumb sözleşmesi yeni karara uyarlandı; PHP ve 23 paket testi başarılı. CI 5 genişlikte ürün ve gezinme kontrolleri başarılı; 390px fixture'da satın alma ve dialog dock'u aynı 58px yüksekliği doğrulandı. Kaynak 93d0927b0c0c76a1a7f4479ae0609c53cd94a886 / Actions 38467160794 validate=success, deploy=success. Canlı Demo 20: breadcrumb sayısı=0, başlık mevcut, ortak height=58px/max-width=430px token'ları yüklü. Connector adım metadata'sı boş; yayın ayrıca canlı kaynak/DOM ile doğrulandı.
- Kalan/sıradaki: 0.1.67 satın alma alanının fiziksel mobil klavye/safe-area ve gerçek varyasyon/grup/harici ürün kabulü; dönüşüm araçları bütünlüğü. Slider duraklatıldı; F3/F4/F5/F6 açık.

## Son doğrulanmış devam noktası — 13 Ekim 2026 / 0.1.67

- Tema 0.1.66 → 0.1.67: kullanıcı slider çalışmasına ara verdi; öncelik satın alma. Mobilde Woo'nun gerçek miktar/submit alanı `.sf-product-purchase` olarak aynı form içinde sabit alttadır. Ortak cam yüzey + Button, safe-area, 430px sınır; desktop inline kalır. İkinci form/klon/click proxy/istek/JS yok.
- Codela `codela-sticky-cart.js` incelendi: classic+swipe+layout-ready gate ve scroll-past davranışı bu ekranı karşılamıyor. Onu kopyalamak veya ikinci motor eklemek yerine native Woo hook'larıyla yalnız yerleşim yapıldı. Varyasyon/grup/harici eylem ve stok sahipliği Woo'dadır.
- Satın alma alanı olan belgede alt dock gizlenir; mevcut dialog içine taşınan tek dock görünür, ürün satın alma barı modal açıkken gizlenir ve kapanınca geri gelir. Satın alma formu olmayan stok dışı üründe dock korunur. Ürün header'ı mevcut araçlı düzene geçer; arama/sepet/hesap ulaşılabilir.
- Doğrulama: PHP native hook ve 23 paket testi geçti. Tarayıcı regresyonuna tek submit, doğal min doğrulaması, 5 genişlikte alt yerleşim, dialog sahipliği ve stoksuz fallback eklendi. Yerel Chromium mevcut runtime'da açılamadı; CI tarayıcı kontrolleri başarılı. Kaynak 682d0d5a5cfaa564af305a4b766cb28e1adbfa78; Actions 38465051069 validate=success, deploy=success. Connector job steps verisini boş döndürdüğü için adım düzeyinde sonuç ayrıca doğrulanamadı; canlı yeni PHP/CSS ve formun tek wrapper/tek gerçek buton/quantity alanı doğrulandı. Gerçek Demo 06 tek tıklama: sepet 0→1, popup'ta tek ürün/adet=1, kaldırma sonrası 0; test sepeti temizlendi. Demo 19 stok dışı: satın alma wrapper yok, tek dock korunuyor. Masaüstü native form inline; mobil 320/390/700px yerleşim ve popup sahipliği CI'da geçti.
- Kalan: fiziksel mobil klavye/safe-area, gerçek varyasyonlu/grup/harici ürün örneklemi ve F3/F4/F5/F6. Slider kullanıcı isteğiyle duraklatıldı; sonraki iş satın alma görünümünün cihaz kabulü, ardından dönüşüm araçları bütünlüğü.

## Son doğrulanmış devam noktası — 13 Ekim 2026 / 0.1.66

- Tema 0.1.65 → 0.1.66: canlı Woo 11.2.1 thumbnail `li img` opacity:.5 kuralı adaptörü eziyordu. Ortak galeri seçicisine `li` eklendi; tüm önizlemeler net, seçili görsel yalnız 1px kenarla ayrılır. Fixture gerçek native opacity kuralını içerir.
- Kapsül ortalanmış, içerik kadar geniş, eşit boşluklu; ayrı büyüteç gizli. Native görsel linki/lightbox/slider korunur. Küçük indirim etiketi ortak cam yüzey kullanır. Yeni runtime JS yok.
- Doğrulama/yayın: 23 yerel paket testi ve CI tarayıcı regresyonu başarılı (320/390/700/900/1280px). Yerel Chromium runtime açılmadığı için tarayıcı sonucu CI'dan doğrulandı. Kaynak 655eeaf7c0cf3134eb8886fcd4ed800a2ecd8209 / Actions 38461141925: validate=success, gerçek Deploy Storefront only=success (13 Ekim 2026 20:19:41 UTC). Canlı Demo 06: dört önizleme yüklü ve opacity=1, ayrı büyüteç display:none; 0.1.65'te görsele click ile native lightbox açılma/kapanma doğrulandı. Fiziksel mobil swipe ve F3/F4/F5/F6 açık.
- Sonraki iş: mevcut Codela satın alma barını ürün ekranında alt menü yerine geçirmek; ürün deneyimi planı ile dönüşüm araçlarını bütünleştirmek.


## Son doğrulanmış devam noktası — 13 Ekim 2026 / 0.1.65

- Tema 0.1.64 → 0.1.65: ayrı büyüteç CSS adaptöründe gizlendi; görsel bağlantıları native Woo lightbox açar. 0.1.64 canlı parametrelerinde zoom_enabled hâlâ 1 olduğundan etkisiz zoom filtresi kaldırıldı; Woo yakınlaştırma ayarına müdahale edilmez. Linklere erişilebilir büyütme adı/dialog ipucu eklendi. Slider, swipe, varyasyon ve lightbox motoru Woo'ya aittir.
- Kapsül eşit 6px iç boşluk, 1px seçili kenar ve net (opacity=1) önizlemeler kullanır. Yuvarlak önizleme köşeleri dış kapsülde kırpılmaz; kontrol için ayrılan boş alan kaldırıldı. Uzun liste hâlâ kayar, tek görselde kapsül gizlenir.
- İndirim etiketi küçük metin kapsülü; native ürün etiketi ortak cam/fallback/forced-colors yüzeyine bağlandı. Yeni runtime JS veya kütüphane yok.
- Doğrulama/yayın: 5 genişlikte ürün tarayıcı testi, PHP medya adaptörü ve 23 paket testi geçti. 0.1.64 kaynak d9dbcd84d46ee75313346e9753ca634003c12c26 / Actions 38424850968 validate ve gerçek Deploy Storefront only başarılı. Canlı Demo 06 görsele click/Enter ile lightbox açılması/kapanması doğrulandı. 0.1.65 kaynak 10114fff4744a5a6f24acbdb5ce86ce9ea73e81b / Actions 38426236830 validate, deploy ve gerçek Deploy Storefront only başarılı. Canlı büyüteç display:none; görsele click ile lightbox açılma/kapanma doğrulandı.
- Sonraki iş: mevcut Codela satın alma barını ürün ekranında alt menü yerine geçirmek; dönüşüm araçlarını mevcut planla bütünleştirmek. Fiziksel mobil swipe ve F3/F4/F5/F6 kabulü açık.


## Son doğrulanmış devam noktası — 13 Ekim 2026 / 0.1.63

- Tema 0.1.62 → 0.1.63: gerçek Woo CSS `.woocommerce div.product div.images .flex-control-thumbs` kapsülün 6px iç boşluğunu eziyordu. Native galeri adaptörüne eşdeğer `div.sf-ui-gallery` seçicisi eklendi; ortak yüzey veya thumbnail motoru değişmedi. Regresyon artık bu gerçek Woo kuralını içerir ve 5 genişlikte iç boşluğu doğrular.
- Yüzen cam galeri kapsülü, seçili koyu kenar, en az 44px native img hedefi, uzun listede scroll, tek görselde gizleme hazır. 5 genişlikte ürün testi ve 23 paket testi geçti. 0.1.63 Actions 38423013801: validate=success, deploy=success, gerçek Deploy Storefront only=success; kaynak 0e0bb6e7573bad7e7aa22fe34ea70dff66b3465e. Canlı Demo 06 kapsülü 6px iç boşlukla içerik kadar genişliyor (4 görsel, 256px).
- 0.1.62 yayın kanıtı: kaynak 73016244f4c269c9e530dab9175779238aaa4257; Actions 38422176540 validate=success, deploy=success, gerçek Deploy Storefront only=success. Canlı Demo 20'de ortak glass/blur, üç görsel yüklenmesi, ikinci thumbnail seçimi ve seçili koyu kenar doğrulandı. Başlangıç galeri yüksekliği Woo init sonunda beklenen değere oturuyor; ikinci galeri motoru eklenmedi.
- Sonraki iş: fiziksel telefonda kapsül/swipe görünümü kabulü; ardından mevcut Codela satın alma barını alt menü yerine geçirmek. Test ürünleri zaten eklendi; yeniden üretmeyin. F3/F4/F5/F6 genel kabulü açık.


## Son doğrulanmış devam noktası — 13 Ekim 2026 / 0.1.62

- Tema 0.1.61 → 0.1.62: native Woo thumbnail listesi, galeri alt kenarında ortalanmış yüzen cam kapsüle geçti. Tam genişlikte beyaz thumbnail satırı kaldırıldı. Woo `.flex-active` seçimi koyu çerçeve ile belirgin; diğer önizlemeler sakin. Fotoğraf geçişleri ve lightbox hâlâ native.
- Gallery navigation yerleşimi `gallery.css`; `.sf-ui-gallery-nav` ve native Woo adaptörü `components.css` ortak cam yüzey/opaque fallback/reduced-transparency/forced-colors grubunda. Yeni JS, istek veya slider motoru yok.
- Kapsül 54px mobil/56px geniş ekran thumbnail hedefleriyle içerik kadar genişler; uzun liste yatay kayar. Galeri kontrolünün 44px hedefi sağda ayrı kalır. Tek görselde liste yok/gizli; thumbnail ayarı korunur. Native img hedefinin kullanılabilir boyutu en az 44px.
- Doğrulama: 320/390/700/900/1280px galeri/şerit/zoom çakışması, şerit yatay kaydırması, tek görsel gizlenmesi, seçili kenar, ortak blur ve UI; 23 paket testi başarılı. 0.1.62 CI ve gerçek Deploy Storefront only başarılı (Actions 38422176540). Canlı thumbnail seçimi doğrulandı; aşağıdaki native boşluk uyumu 0.1.63 ile tamamlanır.
- Test ürünleri zaten eklendi: 20 demo + önceki 1; tekrar oluşturmayın. Sonraki iş: fiziksel telefonda şerit/swipe kabulü; ardından mevcut Codela satın alma barının alt menü yerine geçmesi. F3/F4/F5/F6 genel kabulü açık.


## Son doğrulanmış devam noktası — 13 Ekim 2026 / 0.1.61

- Tema 0.1.60 → 0.1.61: canlı Woo blok şablonunda `.woocommerce` sınıfı body üzerindedir; fazladan alt kapsayıcı bekleyen ürün ve ortak satın alma düğmesi seçicileri düzeltildi. Gerçek legacy-template `data-block-name` kapsayıcısının 1200px sınırı kaldırıldı.
- Hero fotoğraf artık ortak `--sf-gallery-fit:cover` ayarıyla alanı doldurur; üst/alt contain boşlukları kalkar. Kenarlardan kırpma olabilir; native lightbox orijinal görseli korur. Diğer galeri kullanımları contain kalır. Büyütme düğmesi header yerine galeri sağ altındadır.
- Doğrulama: canlı DOM incelendi; regresyon fixture artık gerçek body/legacy-template yapısını ve WP genişlik sınırını içerir. 5 genişlikte galeri/geometri, ortak UI ve 23 paket testi başarılı. [Kaynak f5d5247](https://github.com/muhammetdkaya/codela-storefront/commit/f5d5247b41f2ea4ccf4632f62cfc7de1c9f4723b); [Actions 38417125395](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38417125395): validate=success, deploy=success, gerçek Deploy Storefront only=success. Canlı 0.1.61 DOM ölçümü: galeri x=0/y=0, genişlik=1348px viewport; büyütme sağ altta; satın alma düğmesi ortak tasarımda 58px. Fiziksel mobil swipe ve varyasyon kabulü açık; aşağıdaki canlı çok görselli örneklem kontrolü tamamlandı.
- Test ürünleri — 13 Ekim 2026: kullanıcı hazırlanan CSV'yi içe aktardı. Yönetimde 21 yayınlanmış ürün (mevcut 1 + yeni 20) doğrulandı. Demo SKU öneki `CDL-GALLERY-DEMO-20261013-`; 3–4 görselli basit ürünler, 4 indirimli/2 stoksuz/uzun başlık senaryoları. Demo 20 üzerinde 3 görselin yüklenmesi, ikinci thumbnail seçimi, native lightbox açılması (2/3), sonraki görsele geçiş (3/3) ve kapanması doğrulandı. Galeri yatay taşmıyor ve tam genişlikte; oturum açıkken 32px adminbar altında başlıyor. Demo 19 stoksuz/uzun başlık: stok yok mesajı ve satın alma düğmesinin yokluğu doğrulandı. Bu örneklem, tüm ürün türlerinin veya fiziksel mobil swipe kabulünün tamamlandığı anlamına gelmez.
- Sonraki iş: gerçek telefonda galerili üründe swipe/kırpma görünümü kontrolü; mevcut Codela satın alma barının ürün sayfasında alt menü yerine geçmesi ve dönüşüm araçlarıyla birleşmesi. Yeniden test ürünleri oluşturmayın. F3/F4/F5/F6 kabulü açık.


13 Ekim 2026. Canlı tema **0.1.61** (galeri yerleşimi, dağıtım doğrulandı). Bağımsız kaynak: `theme/codela-storefront/`.
[Kalıcı kurallar](../AGENTS.md) · [Tasarım sözleşmesi](design-system.md) · [Tarihçe](storefront-theme-history-2026-10-12.md)

## Tek güncel devam noktası — 13 Ekim 2026 / 0.1.60

- **Tema 0.1.59 → 0.1.60 canlıda:** yeni yön: önce tam genişlikte, header arkasından başlayan galeri; sonra alt menünün yerini alan satın alma barı ve Codela dönüşüm araçlarıyla bütünleşme. [Güncel plan](product-experience-plan.md).
- İlk aşama: ortak gallery.css + inc/media.php; Woo native galeri motoru korunur. Aynı sunum standart Galeri bloğunda “Kaydırılabilir galeri” stiliyle kullanılabilir. Yeni runtime JS/kütüphane/API yok.
- Sonraki iş mevcut codela-sticky-cart.js ve conversion-tools.php sahiplik/yerleşim uyarlamasıdır. İkinci motor kurulmayacak; bu sürüm alt bar/dönüşüm araçlarını değiştirmez.
- Doğrulama: PHP adaptör/ayar, 5 genişlikte üst kenar/tam genişlik, core Gallery klavye kaydırması, ortak UI, mevcut gezinme ve 23 paket testi başarılı. Gerçek Woo çok görselli swipe/varyasyon/lightbox ve fiziksel cihaz kabulü açık.
- Yayın: [kaynak 8f4a2e3](https://github.com/muhammetdkaya/codela-storefront/commit/8f4a2e32c346a04466393cab006e884bf3e785c5); [Actions 38377864718](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38377864718): validate ve deploy başarılı; gerçek **Deploy Storefront only=success**. F3/F4/F5/F6 kapanmadı.

## Ürün detay sayfası — 0.1.59 canlıda

- 13 Ekim 2026: [PR #17](https://github.com/muhammetdkaya/codela-storefront/pull/17) ile native WooCommerce single-product şablonu korunarak ürün özel CSS katmanı eklendi.
- Masaüstü galeri + bilgi sütunları, mobil tek sütun, oran koruyan görseller, küçük resimler, fiyat/açıklama, native varyasyon ve miktar alanları, sekmeler ve ilgili ürünler sade yerleşime geçti.
- Gerçek WooCommerce `single_add_to_cart_button`, merkezi `components.css` Button sunumu/press/focus/disabled/fallback kurallarıyla aynı gruptadır. `product.css` düğme görünümünü kopyalamaz; yeni JS, router, API veya kütüphane yoktur.
- Sürüm: **0.1.58 → 0.1.59** canlıya dağıtıldı. [PR #17](https://github.com/muhammetdkaya/codela-storefront/pull/17), [merge e72d3c1](https://github.com/muhammetdkaya/codela-storefront/commit/e72d3c1e248ee7096c0b167fe163926a653a9cdd), [Actions 38346747050](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38346747050): validate success, deploy success, **gerçek Deploy Storefront only success**.
- Doğrulama: yapısal ürün testi ve mevcut CI tarayıcı/paket testleri başarılı; yeni Playwright ürün düzen testi 320/390/700/900/1280px genişliklerde galeri/sağ kolon/mobil, related grid, doğal submit ve Button durumlarını doğruladı. Gerçek varyasyon, stok, galeri zoom/lightbox, fiziksel cihaz ve üçüncü taraf add-to-cart entegrasyon kabulü hâlâ gerekli.
- İlk sonraki adım: fiziksel cihazda canlı ürün sayfasını ve gerçek Woo simple/variable/grouped/external ürün türlerini kabul et; bulgu varsa native Woo işleyişini bozmadan ürün adaptörünü düzelt. F3/F4 gerçek Woo sepet/checkout çift yönlü kabulü de açık.

## Önceki canlı devam noktası — 13 Ekim 2026 / 0.1.58

- **Tema 0.1.57 → 0.1.58 canlıda:** kullanıcı görsel/sağ sütun yükseklik farkını bildirdi. Sepet görsel kutusu içerik satırının tamamına uzanır; fotoğraf contain ile oranını korur, kesilmez. Uzun adlarda da üst/alt hizalar aynıdır; görselsiz ürün davranışı korunur.
- Beyaz zeminde ortak cam yüzeyin gri/silik görünümü düzeltildi: ortak brightness 1.5, üst kenar ışığı ve alt kenar/gölge biraz güçlendirildi. 28% tint, 8px blur, saydam border, koyu ikonlar, mevcut basma/kayma ve erişilebilirlik tercihleri korunur. Header, soft IconButton ve Dock aynı token'ı kullanır.
- Yeni JS/istek/kütüphane yok; Store API, controller ve eklenti kapsamına değişiklik yok.
- Doğrulama: Chromium 320/390/700/1280px görsel/içerik üst-alt eşitliği ve mevcut sepet/gezinme/UI kontrolleri; 22 paket testi. Beyaz zemin ile metin/renk arkası görsel referansları kontrol edildi. Kaynak [58100c1](https://github.com/muhammetdkaya/codela-storefront/commit/58100c17b807c627adff4066a3779cdc33d5180c); [Actions 38333643801](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38333643801): validate ve deploy başarılı; gerçek **Deploy Storefront only=success**.
- Kalan/ilk sonraki adım: fiziksel cihazda yeni görsel hizası ve beyaz/renkli zemin cam görünümü kabulü. F3/F4 gerçek WP/Woo kabulü, F5 kapsam sınırı ve F6 ölçümü açık.
- Önceki 0.1.57 kanıtı: [1d492fa](https://github.com/muhammetdkaya/codela-storefront/commit/1d492fa7bd4a5cd11502f1b67f207c07a8c7f7b2), [Actions 38332895672](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38332895672), validate ve gerçek Deploy Storefront only başarılı.

## Mimari ve sınırlar

- WordPress 6.5+, PHP 8.0+, WooCommerce 9.0+; gerçek destek kabulünde birbiriyle uyumlu minimum ve üretim sürüm çiftleri sınanır.
- Tema Codela köprüsüne bağımlıdır; eklenti temadan bağımsızdır. Eklenti deposundaki 0.1.1 paketi ilk kurulum yedeğidir, aktif tema kaynağı değildir.
- Script Modules: entry + format/search/cart/overlay/dock kayıtlı kimliklerle import edilir. İçerik hash'i değişen alt modülün URL'sini değiştirir. Test harness'inin importları kaldırması gerçek WP import-map kabulü sayılmaz.
- Tek Interactivity store/dialog/dock; overlay odak, scroll lock, Menu/X ve panel geçişlerini; dock tek gezinme DOM'unu ve gesture'ları yönetir.
- Normal mağaza sayfasında başlangıçta uncached session cart GET'i yapılır; rozet sepete basmadan güncellenir. Cacheable HTML veya localStorage müşteri sepetinin kaynağı değildir.
- Store API fiyat/vergi/stok/miktar için otoritedir. GET/POST yarışları revision/abort/deferred refresh ile korunur. Tema ayrı fiyat veya ödeme motoru kurmaz.
- Guest Account tek mevcut dialog içinde gerçek Woo formudur; signed-in Codela hesabı eklentiye aittir. Google login gerçek yapılandırma gerektirir.
- Checkout tam sayfadır, ortak Header/Footer ve mevcut Woo içerik/gateway akışını kullanır; mobil dock yoktur. Kayıtlı Site Editor şablonlarını kendiliğinden silmeyin.
- Button/IconButton/pressable tasarımı ortak primitives/tokens içindedir; yeni sayfa kopyası yoktur. Eski genel Woo kuralını sınırlama işi F5'tir.

## Bulgular ve sonraki iş

| Bulgu | Durum | Kanıt / kalan |
|---|---|---|
| F1 modül cache | Kod uygulanmış, dağıtılmış | Native kayıt/hash mevcut; gerçek WP sıcak cache kabulü ayrıca doğrulanmalı |
| F2 sepet yarışı | Kod uygulanmış, dağıtılmış | cart-race ve CI başarılı; rehberdeki tüm hata/nonce/gerçek ağ senaryoları tamamlandı denmez |
| F3 Woo senkronizasyonu | 0.1.51 kodu canlıda | PR #16; gerçek iki yönlü WP/Woo kabulü açık |
| F4 gerçek WP/Woo testi | Açık | Güncel standalone ZIP ile izole test kurulumu gerekli |
| F5 ortak Woo düğme sınırı | Açık | Paralel ortak UI çalışmasını koruyarak ele alınmalı |
| F6 performans | Açık | Gerçek cold/warm ölçüm yok; byte hesabı hız kanıtı değildir |
| F7 belge ayrımı | Düzenlendi | Güncel kurallar/teknik durum ayrıldı; tüm önceki içerik tarihçede korundu |

**İlk somut devam adımı:** `docs/cart-sync-acceptance.md` senaryolarını izole gerçek WP/Woo/Codela kurulumu ve güncel standalone ZIP ile çalıştırın. İki yönlü miktar/silme, kupon/stok hatası, yavaş ağ, classic ve Blocks checkout, istek sayıları kontrol edilsin. Gerçek kabul henüz tamamlanmadı.

Mevcut eklenti `tools/test-theme-wordpress.php` aracı `codela_theme_build_zip()` kullanır; bağımsız güncel tema test edildi varsaymayın. Bu oturumun yerel ortamında PHP/WP/Woo/database yoktur. Canlı müşteri verisiyle fixture oluşturulmadı.

## Yayın kapanışı

Kaynak, test, deploy ve fiziksel cihaz kabulü ayrı durumlardır. Dokümantasyon push'u aktif dağıtımın HEAD kontrolünü etkileyebilir; kaynak deploy tamamlanmadan kapanış belgesi göndermeyin. Yalnız belge değişiminde sürüm artırılmaz. Eklenti/WordPress.org yayını bu tema dağıtımının parçası değildir.
