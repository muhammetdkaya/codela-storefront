# 0.1.95 — WooCommerce ürün kartı tam tıklama alanı, 15 Ekim 2026

## Sorun ve kapsam

Native Woo loop kartındaki `a.woocommerce-loop-product__link` yalnız ürün görseli ve başlığı içermekteydi. Fiyat, link ile footer arasındaki boşluk ve stoksuz kartın alt alanı tıklanabilir değildi. Kullanıcı bazı dokunuşların ürüne gitmediğini bildirdi.

Tek mevcut ürün linkinin `::after` saydam mutlak yüzeyi `li.product` boyunca uzatıldı; kartta `position:relative`, linkte `position:static` var. Footer'ın native `a/button/input/select/textarea` kontrolleri `position:relative; z-index:2` ile bu hit yüzeyinin üzerinde bağımsız tutulur. Native Woo add-to-cart, varyasyon, grouped/external, View Cart aksiyonları ve data/ARIA/URL/hook sözleşmeleri değişmedi. Tek kart şablonu home, shop, category, product search, related, upsell, cross-sell bağlamlarında geçerli. Codela oturumlu hesap sayfası dışlandı. Yeni JS/router, ek bağımlılık veya yeni HTML link yok; tasarım rengi/çerçevesi değişmedi. Focus-visible için bütün kart çevresine odak çizgisi verildi.

## Kod, CI ve canlı

- Kod: [2adf5c16](https://github.com/muhammetdkaya/codela-storefront/commit/2adf5c16d91f47fe8fa2ac3953437cde33f24b83)
- Sürüm: **0.1.95 tema**, **1.1.1 Codela plugin** (değişmedi)
- [CI + gerçek FTPS 38732771167](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38732771167) başarılı. Paket URL: `https://codela.dev/wp-content/themes/codela-storefront/support/packages/codela-storefront-0.1.95.zip`; SHA256 `4b0c754887f031f861298b7d48a79381eb86c6891e69a3d858d35b74a8083c3b`.
- Beş canlı read-only gate: [WebKit](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38733587291), [shell navigation](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38733587240), [document continuity](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38733587219), [gallery](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38733587322), [performance](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38733587209) başarılı.

## Otomatik etkileşim kabulü

Yerel Playwright Chromium: ürün kartı görünümü ve 44px ortak IconButton 320/390/700/900/1280px + beş bağlamda korunur. Fareyle görsel, başlık, fiyat, gap, alt boşluk, stokta olmayan kart; action/Options/View Cart bağımsız hit-testleri ve ayrı 390px touchscreen testi başarılı. WC buttons'ın gerçek CSS `display:inline-block` ve image margin kuralını simüle eden fixture kullanılır. Klavye `:focus-visible` testi fare/touch girişinden ayrı tutulur.

[Gerçek WP/Woo matrisi 38734453585](https://github.com/muhammetdkaya/codela/actions/runs/38734453585): WP6.5.5/Woo9.0.2 ile WP7.1.3/Woo11.2.1 × Chromium/WebKit, dört browser/stack ortamında 15 kontrol, **toplam 60 passed**. Native ürün kartı fiyatını gerçek pointer tıklayarak gerçek ürün permalinkine navigasyon; home/shop/category/search/related hit/eylem önceliği; Woo native AJAX/cart/checkout/variation, Google/guest/account izolasyonu ve eski fonksiyon regresyonları doğrulandı. Test pin'i tema SHA/ZIP hash'ini doğrular, daha eski 0.1.94 paketiyle karıştırılmaz.

İlk gerçek testte [38733644050](https://github.com/muhammetdkaya/codela/actions/runs/38733644050) hata çıktı. Tanıda fiyat hit'i gerçek ürün linkine gidiyordu; fakat `scrollIntoViewIfNeeded` kartı viewport altına yaslıyor ve **sabit mobil dock** düğmenin üzerini kaplıyordu. Testi sayfa içindeki gerçek görünür orta konuma getirip tekrar koşmak gerekiyordu. [38733998567](https://github.com/muhammetdkaya/codela/actions/runs/38733998567) teşhisi ve başarılı 38734453585 aynı 0.1.95 temasıyla yapıldı, tema davranışını gizleyen sahte bir JS/router eklenmedi.

## Kalan manuel kabul

Fiziksel cihazda Safari safe-area, GPU/animasyon hissi ve kullanıcı tasarım kabulü; gerçek ödeme sağlayıcısı, üçüncü taraf medya ve yetkili sunucuda eski JPEG backfill henüz ayrı kontrollerdir. Bunlar bu sürümün otomatik kabulü olarak sunulmaz.
