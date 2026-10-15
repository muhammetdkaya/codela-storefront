# Header Cart/Menu —0.1.87 /15 Ekim2026

## Sebep ve düzeltme

86'da her iki kontrol inc/ui.php IconButton renderer'ını kullanıyordu; Menu soft, Cart ise bare olarak padded sf-actions yüzeyindeydi. Üründe Search/Account mobilde gizlenince grup tek Cart'ı sarmalamaya devam etti. Canlı86 ham WebKit raporunda Cart grubunun dışı52×46, Menu44×44: aynı hit primitive'i kullanmak dış görünüm eşitliğini sağlamıyordu.

87 mevcut soft IconButton'ı Cart'a da bağlar. Ortak components.css içindeki sf-ui-icon-group--single-mobile, mobilde grubun padding/border/materyalini kaldırır; desktop'ta soft çocuğun materyalini kaldırarak eski üç araçlı grubu korur. Yeni paint değerleri, JS, listener/controller, sepet motoru veya kopya düğme yok. Menu/X aynı DOM dönüşümü, logo/menu slotları, tek native dialog/dock, native Woo ve plugin hesap sahipliği korunur.

## Kanıt

- Kaynak: [252b51d5a9574e8ac3073ce9227b5d348dd8107b](https://github.com/muhammetdkaya/codela-storefront/commit/252b51d5a9574e8ac3073ce9227b5d348dd8107b).
- [CI/gerçek FTP38676747269](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38676747269): validate116231979533 ve deploy116232295577 başarılı; gerçek deploy logu2026-10-15T03:35:48.5889670Z “Storefront deployed; checks passed.” Validate içindeki mock deploy mesajı canlı kanıtı sayılmaz.
- CI catalog-browser:320/390/700px, boş/2/99 badge ile Cart/Menu dış44×44, ortak renk/border/radius/shadow/filter/transition; is-pressed tam düğme hareketi eşit; keyboard focus.900/1280 desktop140px üç araçlı grup ve şeffaf iç düğme. Mevcut UI Kit/navigation/checkout/product/cart/account testleri ve24 Python paket testi başarılı.
- [Canlı read-only WebKit38677093388](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38677093388), job116233057524 başarılı. Home/ürün arama/ürün CSS0.1.87. Gerçek ürün Menu/Cart44×44, aynı rgba(247,247,249,.96), tek background, aynı shadow/filter/radius/border. Dış grup44px ve şeffaf/gölgesiz. Kullanıcı sepeti veya içerik değiştirilmedi.
- UI artifact11945609371: storefront-ui-kit-header-single-390.png. Canlı artifact11945734753: gerçek üç sayfa screenshot/report.json; görsel incelendi.
- [Canlı shell38677093317](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38677093317), [gallery38677093323](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38677093323), [native continuity38677093363](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38677093363) başarılı.

## Paket

Version0.1.87; SHA-256 74acd93066dd2cbc428b2a5280a296fdb58f9f65aed19be97d338152399b8f6d; source 252b51d5a9574e8ac3073ce9227b5d348dd8107b. Eklenti deposundaki native workflow aynı ZIP'e pin'lendi ve mevcut native Header kontrolü dış ölçü/materyal eşitliğiyle genişletildi. Eklenti test kaynağıd51f6e13cf84254c913bcd840db0b4fec3882308; runtime1.1.1/WordPress.org/dondurulmuş0.1.1 tema değişmedi.

## Sınırlar

CI WebKit fiziksel iPhone değildir. Fiziksel Safari/GPU/toolbar/safe-area, eski JPEG canlı admin backfill, gerçek ödeme sağlayıcısı ve üçüncü taraf medya/offload kabulü açık.86'nın performans veya52 native kontrol sonucu87 için yeniden kullanılmadı; aşağıda87'ye ait yeni koşum vardır. İlk push-trigger WebKit koşumu38676747373, yayın bitmeden86'yı gördüğünden başarısızdır; yukarıdaki başarılı workflow_run yayın sonrasına aittir.

## Gerçek native kabul —bu87 paketi

[38677123189](https://github.com/muhammetdkaya/codela/actions/runs/38677123189) başarılı; test kaynağıd51f6e13cf84254c913bcd840db0b4fec3882308. WordPress6.5.5/Woo9.0.2 job116233153755 ve WordPress7.1.3/Woo11.2.1 job116233153768. PHP8.3, MariaDB10.11, gerçek Codela1.1.1. Her iki ailede Chromium+WebKit13'er check:4/4 ortam,52 işlev check kaydı.

Dört gerçek runtime raporunda headerIconButtons: Menu ve Cart44×44, aynı renk/image/border/radius/shadow/filter; grup44×44, border0, şeffaf/gölgesiz/filtersiz. Bu yeni genişletilmiş native kontrol mevcut13 akışın içindedir; ayrı ilave check sayısı gibi sayılmadı. Gerçek sepet/search/form/checkout ve signed-in Codela sahipliği regresyonları da geçti. Test COD siparişleri yalnız disposable loopback ortamda; canlı sipariş/mail/dış HTTP yok.

[Canlı performance audit38677093330](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38677093330), job116233057047 başarılı. CSS-only düzeltme için ölçülmemiş hızlanma yüzdesi veya fiziksel Safari sonucu iddia edilmez.
