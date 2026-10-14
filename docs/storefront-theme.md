# Codela Storefront — güncel teknik durum

## 15 Ekim2026 / 0.1.84 → 0.1.85 — ortak Header ve ürün kartı (kabul/yayın bekliyor)

Mobilde Header'ın logo ve menü slotları sabittir: logo solda, menü en sağda. Ürün purchase alanı dock'u değiştirince sepet menünün hemen solunda görünür; arama/hesap tam ekran menü üzerinden erişilir. Purchase olmayan ve dock'u açık üründe dock korunur, üstte ikinci sepet gösterilmez. Dock kapalı ayarda araçlar üstte kalır. Checkout logo/menu aynı slotlarda, docksuz; masaüstü düzeni aynı. Guest login'in ayrı sessiz header'ı ve plugin-owned hesap sınırı korunur.

Ana sayfa ayrı article kartı yerine native Woo content-product döngüsünü kullanır. Mağaza/kategori/related/upsell/cross-sell zaten bu native şablondadır; görünümü tek catalog.css belirler. Kart:4:5 contain görsel, iki satır başlık, native fiyat/indirim/stok, ortak Button. Mobil2, orta genişlik3, geniş ekran4 sütun. Ürün araması da aynı kart, native ordering/result-count/pagination kullanır; normal post/page araması core Query'de kalır. Yeni slider, kart JS'i, sorgu motoru veya API yok. Native Woo add-to-cart ve varyasyon semantiği korunur.

Native helper iç içe WP post/product/Woo loop context'ini başarıda ve extension hatasında geri yükler. Home koleksiyon thumbnail'leri lazy, hero önceliği aynı. Eski related kart paint'i product.css'ten çıkarıldı; product.css yalnız ürün ekranı yerleşimini yönetir. Tek96% yüzen materyal korunur.

**Doğrulama:** tests/catalog.php context/error/search sınırları; tests/catalog-browser.cjs beş yüzey/beş viewport + Header slotları; mevcut product/checkout/navigation/native Button regression'ları. CI/gerçek FTP/canlı ve gerçek WP-Woo kabulü henüz bekliyor. Eski0.1.84 sonuçları aşağıda tarihlidir; yeni sürümün kabulü gibi sunulmaz.

**Kalan/ilk iş:** CI ve gerçek deploy sonuçlarını kapat; canlı kart/header, galeri ve performans regresyonlarını kontrol et; gerçek WP/Woo suite paket/hash/source pin'ini0.1.85'e güncelleyip ilgili kabulü çalıştır. Codela eklentisi1.1.1 runtime/WordPress.org yayını değişmez. Eski JPEG canlı dönüşümü (yönetici girişi tamamlanmadı) ve fiziksel iPhone kabulü açık.

## Önceki doğrulanmış0.1.84 — tarihli kayıt

14 Ekim 2026: tema **0.1.84 canlı**, Codela eklentisi **1.1.1**. [Kaynak ae1f412](https://github.com/muhammetdkaya/codela-storefront/commit/ae1f412794cb9c24be3dbd944d603e149e2e2344), [validate + gerçek FTP](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38616608720) başarılı. Eklentide yalnız test/workflow/docs değişti; runtime ve WordPress.org yayını değişmedi.

## Bitenler

Ortak yüzen yüzey `rgba(247,247,249,.96)`, tek background, gradient yok; blur10px/saturate115%/contrast1/brightness1. İkinci renk katmanı ekleme. Header, dock, purchase ve soft ikonlarda tek shared primitive; kullanıcının arka arkaya iki renk görünmemesi tercihi korunur.

0.1.82 native Woo düğmelerini mevcut tokens/components Button sözleşmesine uyarladı; global eski Woo button paint'i kaldırıldı. Adaptör .sf-content içindedir, secondary/quiet varyantları ve Codela oturum içi hesap alanı dışlanır.

0.1.83–84 gerçek entegrasyonda bulunan iki uyumluluk sorununu giderdi: descriptor sunmayan Woo9 için kayıtlı public wc/store/cart kullanılır; kurulu eski WordPress router'ında olmayan state.navigating yerine mevcut actions.navigate() promise'i skeleton'ı yönetir. Explicit tık focus/scroll-top yapar; history scroll sahipliği browser/core'da kalır. Eski promise'in bitişi daha yeni geçişi kapatmaz.

## Mimari ve sınırlar

Tek tema cart controller, Store API, tek subscription ve load retry; polling, ikinci sepet motoru veya ek Blocks bundle yok. Woo normalized store'una ham REST JSON atanmaz; native invalidate/resolve kullanılır. Tek store/dialog/dock korunur.

Çekirdek client router yalnız uygun home/statik blok sayfalarındadır. Woo ürün/kategori/sepet/ödeme/hesap native belge gezinmesinde kalır; bu sayfalar boyunca header DOM'unun hiç yenilenmediği iddia edilmez. Desteksiz WP native fallback kullanır. Yeni SPA/history/cache motoru yok.

Native Woo galeri ve PhotoSwipe korunur. Hero eager/high, ikincil büyük kaynaklar ihtiyaç halinde yüklenir. Sunucu destekliyorsa yeni JPEG yüklemelerinde WebP türevleri oluşur; orijinaller korunur. Eski medya kendiliğinden dönüştürülmez.

## Mimari kabul durumu

| Bulgu | Güncel durum |
|---|---|
| F1 modül invalidation | Gerçek WP import map ve warm-browser alt modül değişikliği kabulde. |
| F2 cart yarışı | Gerçek gecikmiş GET → yeni başarılı POST ve controller race/error/nonce sözleşme testleri. |
| F3 Woo senkronizasyonu | Cart/Checkout block, classic cart/checkout, alan koruma ve yerel COD; İki WP/Woo ailesinde Chromium ve WebKit'in 11'er gerçek akışı başarılı (4/4 ortam). |
| F4 gerçek entegrasyon | WP7.1.3/Woo11.2.1 + WP6.5.5/Woo9.0.2, PHP8.3/MariaDB10.11, gerçek Codela1.1.1 + bağımsız0.1.84 ZIP. Yayın sonrası kabul workflow'u; otomatik deploy ön koşulu değil. |
| F5 ortak UI | Native Woo adaptörü ortak tokens/components kullanır; eski global paint kaldırıldı; press/disabled/plugin izolasyonu CI'da. |
| F6 performans | 24 canlı lab örneği: cold mobil home LCP2468ms, ürün1768ms, CLS0; bütçe geçti. Saha CWV/hero boyama veya fiziksel cihaz ölçümü değil. |
| F7 devamlılık | Tek güncel AGENTS devam noktası; eski notlar silinmeden arşivlendi. |

[Ayrıntılı kabul ve sınırlar](acceptance/2026-10-14.md). [12 Ekim mimari raporu](architecture-review-2026-10-12.md) ve [rehber](architecture-remediation-guide-2026-10-12.md) tarihli bulgulardır. [Teknik tarihçe](storefront-theme-history-2026-10-14.md) güncel yapılacak iş listesi değildir. [Tasarım sözleşmesi](design-system.md), [sepet kabulü](cart-sync-acceptance.md).

## Kalan ve sonraki iş

Canlı eski JPEG backfill **yapılmadı**. WordPress yönetici giriş ekranı görüldü; güvenli giriş isteği kullanıcı tarafından iptal edildi, yönetici oturumu doğrulanmadı. Tekrar giriş isteme; kullanıcı devam etmek isterse metadata/dosya yedeği ve küçük örnekten sonra native Medya → Image Optimization batch'ini doğrula. İzole CI encoder başarısı canlı host desteğini kanıtlamaz. Fiziksel iPhone Safari GPU/toolbar/safe-area kabulü ayrıca açık; CI WebKit fiziksel cihaz değildir.

Gerçek ödeme sağlayıcıları, tüm Codela modülleri ve üçüncü taraf medya/offload kombinasyonları bu kabulün kapsamı dışındadır. Yeni tema sürümünde eklenti deposundaki tools/storefront-integration ve workflow paket/hash/source pin'leri birlikte güncellenir; dondurulmuş eklenti içi0.1.1 tema kopyası değiştirilmez.
