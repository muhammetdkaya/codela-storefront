## 0.1.51 yayın hazırlığı — 12 Ekim 2026

Kullanıcı, gerçek WP/Woo kabul testinin henüz yapılmadığı açıklandıktan sonra **“Canlıya al”** talimatını verdi. Bu açık yayın talimatıyla PR #16 yayıma hazırlanıyor; önceki taslak bekletme notu yayın engeli değildir. Gerçek entegrasyon/Safari kabulü yapılmış sayılmaz ve F4 açık kalır.

- Tema 0.1.50 → **0.1.51**; eklenti değişmedi. Koşullu Woo Blocks store gözlemi, başarılı tema mutasyonu sonrası Woo resolver yenilemesi ve yalnız gerçek classic formlarda yenileme eklendi.
- Yerel cart-race/cart-sync ve önceki PR CI doğrulaması başarılı. Sürüm commit'inin CI ve gerçek FTP dağıtımı henüz bekleniyor; canlı başarısı takip eden kayıtta yazılacak.
- Sıradaki iş: yeni source workflow validate + gerçek Deploy Storefront only adımını doğrulamak; sonra iki yönlü gerçek WP/Woo kabulü, ortak düğme kapsamı ve performans ölçümü.

# Codela Storefront — güncel teknik durum

12 Ekim 2026. Tema **0.1.50**, bağımsız kaynak: `theme/codela-storefront/`.
[Kalıcı kurallar](../AGENTS.md) · [Tasarım sözleşmesi](design-system.md) · [Tarihçe](storefront-theme-history-2026-10-12.md)

## Doğrulanmış üretim

`71fa37312ed60de0b390320174391d0365ec220a` — [Actions 38262389955](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38262389955).
PHP/Node/paket ve Chromium fixture kontrolleri başarılı. **Gerçek Deploy Storefront only** adımı başarılı; FTPS logu `Storefront deployed; checks passed.`.
PR #15 sepet yarış kodu bu yayında vardır. `21d97ef` yayını başarısız kalmıştı; tireli native olay anahtarları testte köşeli parantezle erişilerek düzeltildi.

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
| F3 Woo senkronizasyonu | Taslak uygulama | [PR #16](https://github.com/muhammetdkaya/codela-storefront/pull/16), `61ee2da`; henüz main/canlıda değil |
| F4 gerçek WP/Woo testi | Açık | Güncel standalone ZIP ile izole test kurulumu gerekli |
| F5 ortak Woo düğme sınırı | Açık | Paralel ortak UI çalışmasını koruyarak ele alınmalı |
| F6 performans | Açık | Gerçek cold/warm ölçüm yok; byte hesabı hız kanıtı değildir |
| F7 belge ayrımı | Düzenlendi | Güncel kurallar/teknik durum ayrıldı; tüm önceki içerik tarihçede korundu |

Taslak PR doğrulaması: [Actions 38263298445](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38263298445) validate başarılı; deploy PR olduğu için atlandı. Bu gerçek entegrasyon kabulü değildir.

**İlk somut devam adımı:** PR #16'daki `docs/cart-sync-acceptance.md` kapısını gerçek, izole WP/Woo/Codela kurulumu üzerinde çalıştırın. İki yönlü miktar/silme, kupon/stok hatası, yavaş ağ, classic ve Blocks checkout, istek sayıları kontrol edilsin. Gerçek kabul geçince release metadata'yı güncel HEAD'e göre yükseltin, birleştirin ve gerçek FTP adımını doğrulayın.

Mevcut eklenti `tools/test-theme-wordpress.php` aracı `codela_theme_build_zip()` kullanır; bağımsız güncel tema test edildi varsaymayın. Bu oturumun yerel ortamında PHP/WP/Woo/database yoktur. Canlı müşteri verisiyle fixture oluşturulmadı.

## Yayın kapanışı

Kaynak, test, deploy ve fiziksel cihaz kabulü ayrı durumlardır. Dokümantasyon push'u aktif dağıtımın HEAD kontrolünü etkileyebilir; kaynak deploy tamamlanmadan kapanış belgesi göndermeyin. Yalnız belge değişiminde sürüm artırılmaz. Eklenti/WordPress.org yayını bu tema dağıtımının parçası değildir.
