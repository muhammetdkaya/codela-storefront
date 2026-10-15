# Codela Storefront — güncel teknik durum

15 Ekim2026: **tema0.1.86→0.1.87 hazırlanıyor**, Codela eklentisi1.1.1 runtime değişmedi. Son doğrulanmış canlı sürüm86.87'nin CI/FTP ve canlı kabulü henüz bekliyor.

## Header IconButton bileşimi düzeltmesi

86'da Menu ve Cart aynı IconButton renderer'ını kullanıyordu, fakat tek mobil Cart eski üç araç grubunun padding/border yüzeyi içinde kalıyordu. Bu, Menu'nün44px dairesiyle farklı dış ölçü oluşturuyordu.

87: Cart mevcut soft IconButton varyantına bağlı. Ortak components.css içindeki sf-ui-icon-group--single-mobile bileşimi mobilde yalnız düğmenin yüzeyini, desktop'ta yalnız grubun yüzeyini bırakır. Mobil dış grup padding/border yok; Menu/Cart aynı44×44 ve ortak materyal/pressed/focus kullanır. İç içe ikinci arka plan, yeni düğme paint'i, JS/listener veya controller yok. Header logo/menu konumları ve native Woo akışları değişmedi.

Regresyonlar:320/390/700px mobilde boş/2/99 rozetle gerçek dış ölçü/materyal eşitliği; aynı press ve keyboard focus;900/1280px desktop üç araçlı eski yüzey korunur. Canlı read-only WebKit de Cart/Menu yüzeylerini birebir karşılaştırır. Test sonuçları yayın sonrası eklenecek.

## Korunan önceki iş ve kanıt

Mobilde logo solda/Menu en sağda sabit. Ürün purchase dock yerine geçtiğinde yalnız Cart menünün solunda; Search/Account menüde. Purchase olmayan ve dock'u açık üründe dock korunur, ikinci Cart yok. Checkout aynı logo/Menu slotlarında, docksuz. Alt menü kapalı ayarda araçlar üstte kalır; desktop ve guest auth düzeni korunur.

Home/shop/category/ürün arama sayfası/related/upsell/cross-sell aynı native Woo content-product.php ve catalog.css kullanır. Görsel4:5 contain, başlık iki satır, native fiyat/indirim/stok, ortak Button; mobil2/orta3/geniş4 sütun. Eski home article ve ürüne özel kart paint'i kaldırıldı. Normal post/page araması core Query, hero high ve home thumbnail lazy aynı. Yeni kart JS/carousel/API yok.

Woo11'in özel Product Search Results template'i85'in gerçek testinde bulundu;86'nın açık product-search-results.html'i onu da native ortak karta bağlar.85'in başarısız matrisi kapatılmış gibi sunulmaz; son kabul86'dır.

## Doğrulama

[15 Ekim kabul/ham sonuçlar](acceptance/2026-10-15.md): CI, beş canlı gate, ek canlı WebKit product-search/görsel yükleme başarılı. İki WP/Woo ailesinde Chromium ve WebKit'in13'er gerçek akışı başarılı (4/4 ortam,52 kontrol).24 lab ölçümünde mobil cold LCP home2352ms/ürün1612ms, CLS0 ve CSS0.1.86. Lab verisi saha CWV/hero boyama veya fiziksel cihaz ölçümü değildir.

Tek Store API/cart controller, tek Interactivity store/dialog/dock, native Woo form/varyasyon/gallery/PhotoSwipe ve Codela plugin-owned hesap izolasyonu korunur. Ortak yüzey96%, tek background/gradient yok. Güvenli home/statik sayfalarda çekirdek router; Woo sayfaları native belge geçişinde, yeni SPA/cache/history motoru yok.

## Kalan ve sonraki iş

87 CI/FTP/canlı kabulünü tamamla, paket/hash/source entegrasyon pin'ini güncelle.86 kabulünü87'nin sonucu gibi sunma. Eski JPEG canlı admin backfill (giriş tamamlanmadı; kullanıcı istemeden yeniden isteme), fiziksel iPhone Safari/GPU/toolbar/safe-area, gerçek ödeme sağlayıcıları ve üçüncü taraf medya/offload kabulü açık. Sonraki somut iş bu erişim/cihaz kabulüdür; canlı medya değişiminden önce yedek+kısa örnek gerekir.

## Kaynaklar

- [Tasarım sözleşmesi](design-system.md), [sepet kabulü](cart-sync-acceptance.md).
- [15 Ekim uygulama aşamaları](releases/2026-10-15-implementation-notes.md), [14 Ekim teknik geçmiş](storefront-theme-history-2026-10-14.md).
- [0.1.84 gerçek kabulü](acceptance/2026-10-14.md); F1–F7 bulgularının önceki kapanışı ve tarihli mimari raporlar bu kanıtlara göre değerlendirilir.
- Yeni sürümde eklenti deposundaki gerçek entegrasyon workflow paket/hash/source pin'ini güncelle. Dondurulmuş eklenti içi0.1.1 temayı değiştirme.
