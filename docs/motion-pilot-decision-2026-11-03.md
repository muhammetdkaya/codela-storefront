# Motion sepet pilotu: üretime alınmıyor

3 Kasım 2026. Planın “kullanım/kalite faydası göstermeden ilk yükü artıran motor kabul edilmez” kapısı uygulandı. **Düzeltilmiş native Web Animations yolu korunur; Motion bu alan için dağıtılmaz.** Bu sonuç Motion'ın genel olarak kötü veya yavaş olduğu iddiası değildir.

## Karşılaştırmanın kanıtı

Kaynak: `e059f0adeb509f874bb6afb7eb3ff4778e6a080e`, [test koşusu 41643623735](https://github.com/muhammetdkaya/codela-storefront/actions/runs/41643623735). Motion pilot adımı Chromium, WebKit ve Firefox'ta geçti. Koşunun bütünü yeşil değildir: bağımsız Embla ve eski test-loader sorunları ayrıca ele alınıyor.

Aynı gerçek tema PHP kabuğu/CSS/controller, 240ms giriş ve 180ms çıkış, aynı boş/stub sepet içeriği kullanıldı. 195 baseline, Motion, düzeltilmiş native, gecikmiş/404/abort/geçersiz export/runtime hata ve WAAPI-yok yolları ayrı sınandı. Sekiz genişlikte geometri, hızlı tersine dönüş, eski callback, resize, reduced-motion, panel değiştirme, Escape/Tab, odak/scroll dönüşü ve navigation kontrol edildi.

- 195'in kontrollü tersine dönüşünde yaklaşık **79,29px** sıçrama yeniden üretildi.
- Chromium'da Motion ve düzeltilmiş native için en büyük ölçülen tersine dönüş farkı **0,000245px altında** kaldı. WebKit'te bu iki yolun ölçülen sıçraması sıfırdı.
- Chromium'un 390 ve 1280px açık panel görüntülerinde Motion ile düzeltilmiş native **RGB piksel farkı yoktu**. Bu iki görüntü boş/stub sepet kabuğudur; gerçek içerik veya bütün mağaza kabulü değildir.
- Native kontrol sıfır Motion isteği yaptı. Aynı sıçrama düzeltmesi kütüphane olmadan çalıştı.
- Beş tekrarın başlatma/kare örnekleri yalnız tanısaldır. Toplam süre kontrollü 300ms bekleme içerir; bu sonuçlar hız, INP, LCP, parse/execute veya saha performansı üstünlüğü/denkliği kanıtı değildir. Desteklenmeyen long-task ölçümü null olarak tutuldu.

Sonuç: Motion'a özgü yarar gösterilmedi. Kazanç controller'ın o anda çizilmiş transform'u örneklemesi ve native tamamlanma/iptal sahipliğinin düzeltilmesinden geliyor. Sırf kütüphane eklemek için ek runtime maliyeti tutulmuyor.

## Kaynak ve dağıtım ayrımı

- Production `panel-motion.js`, aynı `animatePanelTransform` sınırında yalnız native WAAPI kullanır. Optional import, readiness veya Motion kaydı yoktur. Overlay'in aynı dialog/state/focus/scroll sahipliği ve tersine dönüş düzeltmesi değişmez.
- Motion 14.9.0 yalnız geliştirme/araştırma bağımlılığıdır. Deney helper'ı, sabitlenmiş vendor çıktısı, ayrı hash manifesti ve MIT notices `tests/fixtures/motion-pilot/` altındadır. WordPress tema ZIP'ine girmez.
- `scripts/build-vendor.mjs` runtime ve araştırma çıktısını ayrı üretir. `check-vendor.py` tema vendor klasöründe kayıt dışı/araştırma dosyası bulunursa fail eder.
- Browser karşılaştırması sürer: native-only doğrudan production helper'ın değişmemiş baytlarını; Motion/fallback deneyleri açıkça araştırma fixture'ını kullanır. Eski 195 referansı korunur.
- Warm-cache testi artık gerçek native helper'ın tek başına değişmesini, parent URL'leri sabitken yeni hash'in yüklenmesini doğrular.

Bu değişiklikle deneysel adayın konservatif toplam runtime farkı **14.821 → 10.848 gzip bayt** oldu (tek tek gzip level9 çıktılarının toplamı). 15kB eşiği açıkça **15.000 bayt** olarak uygulanır. Bu sayı aynı anda/ardışık route'larda biriken değişmiş grafiği içerir; gerçek HTTP aktarma veya performans ölçümü değildir. Hero hâlâ ayrı Embla kabul kapısındadır.

## Son kabul

Önceki başarılı araştırma adımı, yeni native-only son SHA'nın kabulünün yerine geçmez. Son SHA için tüm yeni sözleşmeler, üç motorlu karşılaştırma, eski regresyon grupları, paket/hash ve görsel kanıt tekrar çalıştırılmalıdır. Fiziksel iPhone Safari, gerçek Woo ödeme/sipariş, canlı kurulum ve kurulu mağaza cache/performance kabulü bu fixture sonuçlarından çıkarılmaz.
