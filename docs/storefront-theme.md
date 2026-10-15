# Codela Storefront — güncel teknik durum

15 Ekim2026: **tema0.1.90→0.1.91 canlı**, Codela1.1.1 değişmedi. [Kaynak eadd2c55](https://github.com/muhammetdkaya/codela-storefront/commit/eadd2c55043b31083a7c209271946db5b32daee7), [CI+gerçek FTP38712509087](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38712509087) başarılı; gerçek deploy09:26:31Z.

Ürün adları temanın sans-serif ailesi13/14px500, fiyat16/17px500. Tek beyaz kartta dış çizgi kaldırıldı; footer ayırıcı surface-muted. Native secondary Button mevcut sf-ui-surface ortak materyaline bağlandı; açık dolgu, saydam kenar, inset olmayan gölge ve opaque/forced-colors fallback'leri aynı deklarasyonlardan gelir.44px, native SVG/Woo URL/AJAX/ARIA ve1360px katalog korunur; yeni JS/bağımlılık yok.

CI PHP/JS/paket ve tüm Chromium regresyonları başarılı; katalog5 bağlam×5 genişlikte sans-serif/500/ince ayırıcı/tek düğme yüzeyi doğrulandı. Canlı WebKit38712961618, shell38712961983, galeri38712961912, belge38712961878, performans38712962046 başarılı. Gerçek Türkçe ürün arama görüntüsü incelendi; home/search/product CSS0.1.91 doğrulandı. Hız artış yüzdesi iddia edilmez.

Gerçek WP/Woo yeni91 matrisi: [38713426329](https://github.com/muhammetdkaya/codela/actions/runs/38713426329) başarılı: WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1, Chromium/WebKit13'er check (4/4 ortam52 kayıt). Test kaynağı597f6b2260d3e581e4e1899fac4a07d2fe71bb8c;91 ZIP SHA25646a31a2e34ccb3e52ea07440dce6ef56e5042706dbb93382e97e2bd1075bfa7e. İlk38713073692 çalışması gruplu ürünün90'dan beri tam satırda olan metinli aksiyonunu yanlış biçimde kompakt düğme saydı; test kompakt/simple-variable ve metinli/grouped-external yerleşimlerini ayrı doğrulayacak şekilde düzeltildi, aynı91 tema paketi yeniden başarılı sınandı..
Kalan: kullanıcının yeni fiziksel cihaz görsel kabulü, gerçek ödeme sağlayıcısı/üçüncü taraf medya ve kullanıcı istemeden yeniden giriş istenmeyecek eski JPEG backfill.

## Önceki0.1.90 — tarihli kayıt

15 Ekim2026: **tema0.1.89→0.1.90 canlı**, Codela1.1.1 eklenti sürümü değişmedi. [Kaynak 104b853d](https://github.com/muhammetdkaya/codela-storefront/commit/104b853d62ee73099923ecf0b35a0e79ebb8008f), [CI / gerçek FTP 38709075916](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709075916) başarılı.

## Yapılan — referans ürün kartına eşleme

Geniş (1360px üst sınır / mobil12px içerik kenarı) katalog; koyu ürün başlığı/fiyat; gerçek ayırıcı çizgi; native Woo Button üzerinde yerel shopping-bag SVG yuvarlak 44px aksiyon. Varyasyon ürünü seçenek okunu kullanır, stoksuz üründe sahte satın alma düğmesi yoktur. Aynı native kart her katalogda kullanılır. JavaScript veya ikinci stil yüzeyi eklenmedi.

## Yayın durumu ve kalan kabul

CI paket, PHP, JS, katalog (320/390/700/900/1280), ortak Button ve header, galeri, checkout, shell/navigasyon browser regresyonları başarılı. Tek geçici CI press zamanlama hatası üzerine aynı commit'in ikinci çalışması tam geçti. Gerçek FTP dağıtımı ve public source/store sağlık doğrulaması başarılı. Canlı [WebKit](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787224), [shell](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787200), [galeri](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787332), [belge](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787245), [performans](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787212) testleri başarılı.

Kalanlar: fiziksel iPhone/Safari dokunma-görsel kabulü, üretim ödeme sağlayıcısı, eski JPEG toplu dönüşüm (yetkili oturum/yedek gerekir) ve üçüncü taraf medya. Bundan sonra yeni görsel revizyon yapılacaksa mevcut ortak kart ve UI Button sistemini kullan; checkout/header/sepete ait ayrı yeni bileşen kurma.

---



15 Ekim2026: **tema0.1.88→0.1.89 canlı**; Codela eklentisi1.1.1 değişmedi. [Son kaynak 4f162237](https://github.com/muhammetdkaya/codela-storefront/commit/4f162237ae5f323c50f3720582de82591cde92fb), [CI+gerçek FTP 38688395197](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38688395197) başarılı.

## Açık ürün kartı güncellemesi

Tek Woo native kartına bütünleşik beyaz yüzey, hafif tek sınır/gölge, saydam kare ürün görseli, içeride iki satır başlık ve fiyat/ortak secondary kapsül düğme eklendi. Aynı catalog.css home/shop/category/search/related alanlarını yönetir; farklı kart JS veya HTML yok. Müşteri hesabı, sepet API ve Header etkilenmez.

## Doğrulama bekliyor

GitHub Actions doğrulama, gerçek FTP yayını ve canlı görsel/ürün akışı sonuçları gelmeden 0.1.89'u canlı kabul etme. Fiziksel cihaz, eski medya arşivi ve üçüncü taraf ödeme kontrolleri ayrıca açıktır.

---



15 Ekim2026: **tema0.1.87→0.1.88 canlı**, Codela1.1.1 runtime/WordPress.org değişmedi. [Kaynakd64106c4](https://github.com/muhammetdkaya/codela-storefront/commit/d64106c4d12e58e57d459eb802d5238c7a5a568b), [CI+gerçek FTP38678440344](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38678440344) başarılı; deploy03:54:21.1422094Z.

## Biten iş

Tek native content-product.php bütün kart bağlamlarının sahibi.1:1 contain/şeffaf dış görsel yüzeyi, küçük iki satır başlık, native fiyat ve mevcut secondary Button aynı footer'da.44px hedef, simple Ekle/variable Seçenekler; grouped/external native metinleri korunur. Stoksuz badge ve aksiyonsuz kart. Veri olmayan renk noktaları/puan yok.

catalog.php native link kapandıktan sonra mevcut hook'ları birleştirir, Woo URL/AJAX/data/ARIA/fiyat/indirim korunur. components.css aynı Button primitive'ini tema sf-content'e bağlar; catalog.css kart/ölçü/hiza. Google grid specialization korunur; Codela signed-in hesap dışlanır. Yeni JS/carousel/listener/controller/paint kopyası yok. Header87 eşitliği, native Woo form/gallery, tek dialog/dock/store değişmedi.

## Doğrulama

[88 kabul/ham sonuç](acceptance/2026-10-15-catalog.md): tüm PHP/JS/24 paket ve Chromium regresyonları; beş canlı gate başarılı. Gerçek Türkçe ürün arama screenshot'ı incelendi;1:1/tek yüzey, fiyat/Ekle, stockless/native footer ve header44×44 doğrulandı. İki WP/Woo ailesinde Chromium/WebKit13'er gerçek check (4/4 ortam,52 kayıt), yeni5 bağlam kart alt kontrolleri dahil; test kaynağıb684671cfad86573043da579a32760e25d395e1f. Paket/hash/source pin'i güncel; önceki87 sonuçları88 diye sunulmadı.

## Kalan / sıradaki iş

88 kod/yayın/otomatik kabul tamamlandı; yeniden uygulama/yayın başlatma. Kullanıcının görsel beğeni onayı ve fiziksel iPhone Safari/GPU/toolbar/safe-area ayrıdır. Eski JPEG canlı admin backfill (kullanıcı istemeden giriş isteme), gerçek ödeme sağlayıcısı ve üçüncü taraf medya kabulü açık. Canlı medya işlemi öncesi yedek ve küçük örnek gerekir.

## Önceki87 teknik kayıt —tarihli

15 Ekim2026: **tema0.1.86→0.1.87 canlı**, eklenti1.1.1 runtime/WordPress.org yayını değişmedi. [Kaynak252b51d5](https://github.com/muhammetdkaya/codela-storefront/commit/252b51d5a9574e8ac3073ce9227b5d348dd8107b), [CI+gerçek FTP38676747269](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38676747269) başarılı; deploy2026-10-15T03:35:48.5889670Z.

## Biten iş

Mobil Cart/Menu aynı mevcut soft IconButton44×44. Önceden Cart'ın52×46 dış araç grubu yüzeyi vardı; şimdi ortak components.css responsive grup bileşimi tek kontrolün padding/border/dış materyalini kaldırır. Desktop üç araçlı grup korunur. Yeni paint/JS/listener/controller veya kopya düğme yok; tek arka plan ve ortak pressed/focus/erişilebilirlik korunur. Logo/Menu slotları, native Woo kartlar/form/gallery, tek dialog/dock/store ve plugin-owned hesap değişmedi.

## Doğrulama

[87 kabul kaydı](acceptance/2026-10-15-icon-buttons.md): CI (320/390/700 mobil,900/1280 desktop, boş/2/99 badge, pressed/focus dahil), gerçek FTP ve beş canlı gate başarılı. Canlı WebKit gerçek Cart/Menu dış44×44 ve materyal eşitliğini doğruladı; CSS0.1.87. Yeni gerçek WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1 matrisinde Chromium/WebKit13'er check başarılı (4/4 ortam,52 kayıt); native Header eşitlik kontrolü de bu pakete eklendi. Eklenti workflow paket/hash/source pin'i güncel; kaynakd51f6e13cf84254c913bcd840db0b4fec3882308. Eski86 sonucu yeni sürüme mal edilmedi.

## Kalan / sıradaki iş

Bu boyut düzeltmesi, yayın ve otomatik kabul tamamlandı; tekrar uygulama/yayın başlatma. Fiziksel iPhone Safari/GPU/toolbar/safe-area, eski JPEG canlı admin backfill, gerçek payment-provider ve üçüncü taraf medya/offload kabulü açık. Kullanıcı istemeden yeni admin giriş isteği açma. Sonraki cihaz kabulünde Cart/Menu eşitliği ve Menu/X hareketini fiziksel tarayıcıda kontrol et. Canlı medya değişiminden önce yedek ve küçük örnek gerekir.

## Önceki0.1.86 teknik kayıt —tarihli

15 Ekim2026: **tema0.1.86 canlı**, Codela eklentisi1.1.1. [Kaynak86681e46](https://github.com/muhammetdkaya/codela-storefront/commit/86681e46cb43e072ce556b7e1a0575557a11eb3a), [CI+gerçek FTP38654572606](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38654572606) başarılı. Eklenti runtime/WordPress.org yayını değişmedi.

## Header ve ortak ürün kartı tamamlandı

Mobilde logo solda/Menu en sağda sabit. Ürün purchase dock yerine geçtiğinde yalnız Cart menünün solunda; Search/Account menüde. Purchase olmayan ve dock'u açık üründe dock korunur, ikinci Cart yok. Checkout aynı logo/Menu slotlarında, docksuz. Alt menü kapalı ayarda araçlar üstte kalır; desktop ve guest auth düzeni korunur.

Home/shop/category/ürün arama sayfası/related/upsell/cross-sell aynı native Woo content-product.php ve catalog.css kullanır. Görsel4:5 contain, başlık iki satır, native fiyat/indirim/stok, ortak Button; mobil2/orta3/geniş4 sütun. Eski home article ve ürüne özel kart paint'i kaldırıldı. Normal post/page araması core Query, hero high ve home thumbnail lazy aynı. Yeni kart JS/carousel/API yok.

Woo11'in özel Product Search Results template'i85'in gerçek testinde bulundu;86'nın açık product-search-results.html'i onu da native ortak karta bağlar.85'in başarısız matrisi kapatılmış gibi sunulmaz; son kabul86'dır.

## Doğrulama

[15 Ekim kabul/ham sonuçlar](acceptance/2026-10-15.md): CI, beş canlı gate, ek canlı WebKit product-search/görsel yükleme başarılı. İki WP/Woo ailesinde Chromium ve WebKit'in13'er gerçek akışı başarılı (4/4 ortam,52 kontrol).24 lab ölçümünde mobil cold LCP home2352ms/ürün1612ms, CLS0 ve CSS0.1.86. Lab verisi saha CWV/hero boyama veya fiziksel cihaz ölçümü değildir.

Tek Store API/cart controller, tek Interactivity store/dialog/dock, native Woo form/varyasyon/gallery/PhotoSwipe ve Codela plugin-owned hesap izolasyonu korunur. Ortak yüzey96%, tek background/gradient yok. Güvenli home/statik sayfalarda çekirdek router; Woo sayfaları native belge geçişinde, yeni SPA/cache/history motoru yok.

## Kalan ve sonraki iş

Bu Header/katalog kodu, yayın ve otomatik kabul işi tamamlandı. Aynı yayını/testleri yeniden başlatma. Eski JPEG canlı admin backfill (giriş tamamlanmadı; kullanıcı istemeden yeniden isteme), fiziksel iPhone Safari/GPU/toolbar/safe-area, gerçek ödeme sağlayıcıları ve üçüncü taraf medya/offload kabulü açık. Sonraki somut iş bu erişim/cihaz kabulüdür; canlı medya değişiminden önce yedek+kısa örnek gerekir.

## Kaynaklar

- [Tasarım sözleşmesi](design-system.md), [sepet kabulü](cart-sync-acceptance.md).
- [15 Ekim uygulama aşamaları](releases/2026-10-15-implementation-notes.md), [14 Ekim teknik geçmiş](storefront-theme-history-2026-10-14.md).
- [0.1.84 gerçek kabulü](acceptance/2026-10-14.md); F1–F7 bulgularının önceki kapanışı ve tarihli mimari raporlar bu kanıtlara göre değerlendirilir.
- Yeni sürümde eklenti deposundaki gerçek entegrasyon workflow paket/hash/source pin'ini güncelle. Dondurulmuş eklenti içi0.1.1 temayı değiştirme.
