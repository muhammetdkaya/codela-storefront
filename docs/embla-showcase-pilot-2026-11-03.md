# Embla hero pilotu: üretimde reddedildi

3 Kasım 2026. Referans native kaynak: `687ef83e13621f6117264d04f220fa13c8836bb4`, tema 0.1.195. Karar, kütüphaneyi benimseme zorunluluğuna değil mevcut erişimi koruma şartına dayanır. Canlı kurulum yapılmadı.

## Kanıt ve karar

Pilot yalnız çok slaytlı hero'da Embla 8.6.0 kullandı. Promo/kategori, ürün galerisi, zoom ve Woo verisi devralınmadı. Loop/autoplay/klon yoktu. İlk görsel önceliği, caption/kadraj, klavye, lazy medya ve router temizliği sınandı.

Üç motorda aynı masaüstü mouse sürüklemesi native'i `01 / 03` konumunda bırakırken Embla'yı `02 / 03` konumuna taşıdı. Bu gerçek bir kullanım faydasıdır, ancak hız ölçümü veya genel kabul değildir. Firefox CI3'te bütün pilot suite'ini geçti. Chromium'da izole context ile dokunma kontrolü de geçti.

**Reddetme nedeni:** Chromium [CI3](https://github.com/muhammetdkaya/codela-storefront/actions/runs/41646668363) ve [CI4](https://github.com/muhammetdkaya/codela-storefront/actions/runs/41648726152)'te ilk gerçek yatay wheel deltası kayboldu. Beş slaytlı kontrol kolu 390px / `02 / 05` konumundan 780px / `03 / 05` konumuna geçti. Pilot native'e dönmesine rağmen 390px / `02 / 05` konumunda kaldı. CI4'te olayın hedef atası ve odak korunmuş, transform temizlenmiş, overflow/snap ve başlangıç offset'i default işlemden önce doğruydu; olay iptal edilmemişti. Wrapper'ı tutmak çözmedi. İlk input kaybı kabul edilmedi; delta yeniden üretilmedi ve test zayıflatılmadı.

WebKit'te Shift+wheel'in native sonucu dikey sayfa hareketi olabilir. Testler platformun kendi native sonucunu kullanır; bütün motorlarda zorla yatay hareket beklenmez. Bu platform farkı, Chromium'un gerçek ilk-delta kaybından ayrıdır.

## Alternatif değerlendirmesi

- Sürekli scrollable bir native viewport ile Embla transform'unu birlikte tutmak scrollLeft, odak, resize ve hareket için iki sahibi koordine etmeyi gerektirir. Bu pilot için ek hibrit motor karmaşıklığı reddedildi.
- [Resmî Embla v8 belgesi](https://www.embla-carousel.com/docs/v8/plugins/wheel-gestures) bağımsız Wheel Gestures eklentisini listeler. Registry'den bütünlüğü doğrulanan `embla-carousel-wheel-gestures@8.1.0` + `wheel-gestures@2.3.0` MIT lisanslıdır. Aynı esbuild ayarlarında ayrı araştırma derlemesi 8.285 ham / **3.417 gzip bayt** çıktı; o andaki 10.969 bayta eklenince 14.386 / 15.000 bütçeye sığıyordu.
- Ancak [8.1.0 kaynak kodu](https://github.com/xiel/embla-carousel-wheel-gestures/blob/v8.1.0/embla-carousel-wheel-gestures/src/WheelGesturesPlugin.ts) ve 2.3.0 normalizer Shift'i yatay eksene çevirmiyor. Chromium'un `deltaX=0, deltaY=350, shiftKey=true` olayı yatay motoru başlatmıyor. Y eksenini zorlamak sıradan dikey sayfa scroll'unu devralır. Modifier/önceden tüketilmiş olay ve varsayılan viewport sınırları ayrıca özel uyarlama ister. Eklenti kurulmadı; yeni wheel bağımlılığı yoktur.

Boyut tek başına engel değildi. Gerekli davranış eşitliği ve bakım maliyeti ölçülen mouse faydasını karşılamadı. Hero native kalır; promo/kategoriye genişleme yapılmaz.

## Üretimde kalan kapsam

`gallery-horizontal.js`, 0.1.195 native scroll-snap, DOM, sayaç/progress, klavye, reduced-motion, `codela:media-intent` ve caption ölçüm davranışını korur. Reduced-motion seçimi ve medya-intent hazırlığı exact 195 kaynağında zaten vardır; pilot kazanımı sayılmaz. Yalnız gerekçeli yerel düzeltmeler kalır: tekrar script çalıştırmada tek sahip, router/track/slayt değişiminde eski observer/listener/rAF temizliği ve değişmeyen sayaç için tekrar live-region yazmama. Wheel dinleyicisi, transform sahibi, ek viewport, dinamik import ve vendor konfigürasyonu yoktur.

Embla ve Motion bağımlılıkları yalnız geliştirme/araştırma fixture'larındadır. Dağıtılan tema hiçbir vendor runtime içermez. Bu çalışma ağacında toplam sayfa farkı **1.564 / 15.000 gzip bayt**, hero native lifecycle farkı **650 bayt**, üretim vendor maliyeti **0 bayt**. Kanonik son sayfa farkı `node tests/library-budget.cjs` ile her dosyanın ayrı gzip level9 toplamından hesaplanır; gerçek transfer, parse, INP/LCP veya hız iddiası değildir. Son dondurma sırasında tekrar ölçülür.

## Arşiv ve doğrulama

- `tests/fixtures/embla-pilot/`: tam reddedilen adapter, özgün test/vendor/manifest arşivi, kilitli yeniden üretilebilir araştırma vendor'ı, CI4 JSON/ekran kanıtı ve üç motor mouse karşılaştırması. `README.md` açık araştırma komutlarını verir. Reddedilen gerçek browser testi gerekli yeşil CI'dan çıkarılmıştır; assertion'ları başarı gibi yeniden etiketlenmemiştir.
- Yerelde başarılı: `tests/native-showcase.cjs` ve mevcut `tests/showcase-caption.cjs`; deterministik vendor kontrolü, 7 vendor / 3 asset / 24 paket / 11 paket inceleme testi; gerçek WordPress loader'da 13 bağlam × debug/production ve sıfır vendor config/import/registration; PHP/JS syntax. Native wheel'in gerçek hareketi VM testiyle kanıtlanmış sayılmaz.
- Yeni zorunlu üç motor kabulü: `tests/native-showcase-browser.cjs`. Aynı gerçek PHP/CSS ile immutable 195 native kontrolü; ilk wheel/Shift platform sonucu, ters yön, odak, klavye, medya, geometri, no-script, tek slayt ve router lifecycle. Chromium gerçek dokunması ayrı context'lerde; Firefox/WebKit için fiziksel dokunma iddiası yoktur.
- Yeni native adayın gerçek browser CI sonucu **bekliyor**. Yerel Chromium OS socket kısıtı nedeniyle başlatılamaz. Eski pilotun başarısızlığı, yeni native adayın başarı sonucu olarak gösterilmez. Fiziksel Safari/trackpad ve canlı mağaza ölçümü ayrıca kalır.
