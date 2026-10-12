# Codela Storefront — güncel teknik durum

12 Ekim 2026. Tema **0.1.53**, bağımsız kaynak: `theme/codela-storefront/`.
[Kalıcı kurallar](../AGENTS.md) · [Tasarım sözleşmesi](design-system.md) · [Tarihçe](storefront-theme-history-2026-10-12.md)

## Tek güncel devam noktası — 12 Ekim 2026 / 0.1.53

- **Tema 0.1.52 → 0.1.53 canlıda:** kullanıcının fiziksel cihaz ekran görüntüsünde cam yüzey fazla kapalı bulundu. Header/soft IconButton ve Dock artık aynı ortak yüzey kuralını kullanır: %22 açık dolgu, 6px sabit blur ve daha hafif ışık katmanı. Koyu arka planda ortak koyu ikon/yazıyı korumak için backdrop contrast/brightness tokenları ışığı dağıtır. Kaynak [4eceb9c](https://github.com/muhammetdkaya/codela-storefront/commit/4eceb9cd0ca7d560477cea05b39e61303aa0b870); [Actions 38304265067](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38304265067): `validate=success`, `deploy=success` ve gerçek **Deploy Storefront only=success**.
- Alt menüde mevcut `is-pressing` durumuyla bütün yüzey %1,8 büyür ve esnek geri döner. Ayrı CSS `scale` özelliği, scroll-collapse `transform`unu ve controller'ın sabit dokunma slotlarını değiştirmez. Yeni JS/istek/bağımlılık yok; normal Button/IconButton etkileşimi korunur.
- Yerel Chromium navigation, ortak kontrol, checkout/account ve metin/renk üzerindeki cam yüzey görsel kontrolleri geçti. Node regresyonları ve paket kontrolleri yapıldı. CI gerçek kaynak üzerinde PHP/Node/paket/Chromium doğrulamalarını başarıyla tamamladı. Fiziksel Safari kabulü ve F6 performans ölçümü hâlâ ayrı işlerdir.
- 0.1.51 sepet senkronizasyonu/hash'li WordPress modülleri korunur. Bu çalışma F3/F4/F5/F6'yı kapatmaz. Önceki ortak UI yayını: [Actions 38300950226](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38300950226).
- Sıradaki iş: canlı cihazda yazı/görsel üstündeki geçirgenlik ve bütün Dock tepkisini kontrol edin; ardından gerçek WP/Woo entegrasyon senaryoları, F5 kapsam sınırı ve F6 ölçümü. F5 ortak yüzeyi sayfa CSS'ine kopyalamamalı.

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
