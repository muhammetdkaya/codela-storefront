# Codela Storefront — güncel teknik durum


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
