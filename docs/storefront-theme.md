# Codela Storefront — güncel teknik durum

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
