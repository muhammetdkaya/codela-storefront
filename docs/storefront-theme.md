# Codela Storefront — güncel teknik durum

15 Ekim2026: **tema0.1.87→0.1.88 hazırlanıyor**. Son doğrulanmış canlı87; Codela eklentisi1.1.1 runtime/WordPress.org değişmedi.88 CI/gerçek FTP/canlı ve native matris henüz bekliyor.

## Ortak ürün kartı —onaylı tasarım yönü

Everlane ürün odaklı görsel ve Aesop düzenli bilgi yaklaşımı: tek kare1:1 contain görsel, ikinci gri letterbox yüzeyi yok; daha küçük iki satır başlık; native fiyat solda ve mevcut secondary Button sağda.44px hedef korunur. Simple kısa Add, variable Options; external/grouped native eylem metinleri korunur. Stoksuz badge görselde; Read more/satın alma düğmesi yok. Veri olmayan renk noktaları/yorumlar/dekoratif özellikler eklenmez.

Home/shop/category/ürün search/related/upsell/cross-sell aynı native content-product.php ve catalog.css kullanır. inc/catalog.php yalnız native hook bileşimi ve Button class adapter'ı sağlar; Woo URL, AJAX, data/ARIA, fiyat/indirim ve form sahipliği korunur. Button görseli/state'leri components.css'teki aynı primitive'dir; yeni kopya paint veya JS yok. Signed-in Codela hesabı dışlanır.

## Doğrulama ve sonraki iş

Güncellenen hızlı kontroller: PHP hook/bağlam/stock/action/account sınırı;320–1280 ortak kart 5 bağlam,1:1/tek yüzey/fiyat-aksiyon hiza,44px ve stockless/variable ayrımı. Canlı WebKit native footer ve secondary Button kontrolü. Sonuçlar henüz bekliyor;88 paket/hash/source native pin'i yayın sonrası güncellenecek. Header87 ortak44×44, native Woo akışları ve hesap izolasyonu korunmalı.

Fiziksel iPhone Safari/GPU/toolbar/safe-area, eski JPEG canlı admin backfill, gerçek payment-provider/üçüncü taraf medya kabulü açık. Kullanıcı istemeden admin girişi isteme.

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
