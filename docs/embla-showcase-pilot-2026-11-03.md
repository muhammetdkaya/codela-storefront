# Embla hero pilotu — kabul bekleyen aday

3 Kasım 2026. Referans: `687ef83e13621f6117264d04f220fa13c8836bb4`, tema 0.1.195. Bu belge uygulanan pilotu ve açık kabul kapısını kaydeder; tarayıcı kabulü, üretime benimseme veya canlı kurulum iddiası değildir.

## Uygulanan sınır

- Yalnız birden fazla slaytı olan **hero** için yerel, sürümü kilitli **Embla 8.6.0** dinamik yüklenir. PHP'nin içerik hash'li vendor URL'si kullanılır; runtime CDN yoktur. Tek slaytta motor indirilmez/kurulmaz. Loop, autoplay ve klon yoktur.
- `gallery-horizontal.js` mevcut track ve slayt düğümlerini korur. Başarılı kurulumda geri alınabilir bir viewport eklenir; native scroll-snap kapatılır, hareketin tek sahibi Embla olur. Caption ölçümü, kadraj, gerçek sayaç/progress ve Codela görünümü korunur.
- İlk eager/high görsel motora bağlanmaz. Diğer görseller mevcut `codela:media-intent` ve görünürlük yoluyla hazırlanır; bütün gizli slaytlar baştan yüklenmez.
- Klavye odağı transform edilen track yerine sabit viewport'ta görünür kalır. İçerideki gerçek CTA düğümleri korunur. Odakla slayt gösterme anlıktır; hareket tercihi değişmesi devam eden hareketi bitirir.
- Eksik/başarısız vendor veya kurulumda doğal yatay kaydırma korunur. Geciken import kaldırılmış DOM'u tekrar kurmaz. Router değişimi eski motoru, dinleyicileri ve caption gözlemcisini bir kez temizler; yeni içerik bir kez kurulur. Ürün/Woo galerisinin sahibi değişmez.
- **Promo ve kategori carousel'leri native kalır.** Grid/mozaik, ürün galerisi, zoom, router, Woo formu ve alışveriş verisi bu pilotun kapsamı değildir. Hero kabul edilmeden kapsam genişlemez.

## Native wheel dönüşü ve bedeli

Embla v8 çekirdeği wheel/trackpad motoru sağlamaz. İlk yatay wheel veya Shift+wheel, ilgili bileşeni seçili slayt konumunda kalıcı olarak native scroll'a döndürür; yeniden Embla kurulumu ancak yeni DOM ile mümkündür. Dikey wheel ve pinch zoom bu dönüşü tetiklemez. Import sürerken native wheel başlamışsa geç gelen motor da kurulmaz.

Dönüşte Embla'nın `destroy()` işlemi transform ve animasyonu eşzamanlı temizler. DOM/stiller/tab sırası geri alınır, gerçek geometri okunur ve native konum `instant` olarak ayarlanır. İlk wheel deltası elle uygulanmaz veya iptal edilmez; tarayıcının aynı olayın varsayılan kaydırmasını bir kez yapması beklenir. **Bu son davranış üç motorda gerçek wheel testiyle doğrulanmadan parity kabul edilmez.**

Bu çözüm ek wheel eklentisi veya özel delta fiziği getirmez, fakat native fallback kodunu ve iki sahip arasında geçişi muhafaza eder. İndirilmiş vendor maliyetini geri almaz; wheel kullanan ziyaretçi ek motoru ödemiş olabilir ve o bileşen daha sonra native davranışla sürer. Bu bakım/transfer bedeli, Embla'nın pointer faydasıyla birlikte değerlendirilmelidir.

## Yapılan ve bekleyen doğrulama

**Yerelde başarılı:**

- `node tests/embla-showcase.cjs`: gerçek adaptörün VM harness'inde sahiplik, geciken/başarısız import, klavye, reduced-motion, odak, wheel sırasında geç import, değişmeyen düğümler, idempotent kurulum ve tam/bölgesel router temizliği. Harness motor fiziğinin kanıtı değildir.
- `tests/embla-showcase-fixture.php`: gerçek tema renderer'ları ve WordPress HTML parser'ı ile üç/beş/tek slayt, native promo/kategori, öncelikli ve ertelenmiş görseller. PHP lint ve JavaScript sözdizimi/whitespace kontrolleri.
- `node tests/library-budget.cjs`: aşağıdaki mevcut çalışma ağacı boyut kontrolü.

**Hazır fakat tarayıcı sonucu bekliyor:** `tests/embla-showcase-browser.cjs`, gerçek derlenmiş Embla ile `TEST_BROWSER=chromium`, `firefox` ve `webkit` seçer. Beş genişlikte düzeltilmiş native kol ile geometri/kadraj; ilk/gizli medya; gerçek mouse sürükleme ve ters yön; klavye/CTA odağı; canlı reduced-motion/resize; import/no-script/tek slayt fallback; router temizliği sınanır. Gerçek dokunma/CDP alt testi yalnız Chromium'dur, diğer motorlara dokunma sonucu olarak yazılmaz.

Wheel matrisi beş slaytla sınırdan uzakta native ve pilotu karşılaştırır: yatay wheel/Shift+wheel × viewport/CTA odağı. Document-bubble anında, varsayılan scroll'dan önce gerçek olayın güvenilirliği, sıfır transform, native overflow/snap, tam seçili konum ve korunan odak kaydedilir; ardından ilk delta ve ters yön sonucu karşılaştırılır.

Yerel Chromium test başlamadan `socket() failed: Operation not permitted` ortam kısıtına takıldı. Yeni tarayıcı geçişi, görsel ekran karşılaştırması, fiziksel Safari/trackpad veya canlı LCP/INP sonucu henüz yoktur.

## Boyut ve karar kapısı

Aşağıdaki değerler 3 Kasım çalışma ağacında **Node zlib, her dosyada ayrı gzip level 9** ile ölçüldü. Kanonik kontrol `tests/library-budget.cjs` ve vendor manifestidir; farklı gzip uygulamalarının birkaç bayt farklı sonuçları karıştırılmamalıdır.

| Kapsam | Ham bayt | Gzip bayt |
|---|---:|---:|
| 0.1.195 native adaptör | 4.461 | 1.706 |
| Pilot adaptör | 11.957 | 3.954 |
| Embla vendor | 18.386 | 7.686 |
| Hero'ya ait net ek runtime | — | **9.934** |
| Mevcut birleşik etkilenen sayfa farkı | — | **14.721 / 15.360 bütçe** |

Birleşik fark, o andaki Motion tarafının 4.787 bayt farkını da içerir. Eşzamanlı dock çalışması ve sonraki düzeltmeler nedeniyle bunlar son dondurma değerleri değildir; son commit'te tekrar hesaplanmalıdır. Bu ölçüm gerçek ağ transferi, parse/execute, INP, LCP veya hız kazanımı değildir.

**Karar açık:** davranış karşılaştırmasının kontrol kolu, aynı caption/lifecycle/odak düzeltmelerine sahip **native** adaptördür; bilinen hatalı eski kodun aleyhine kazanım sayılmaz. Üç motorun geometri, medya, wheel/odak ve temizleme kapıları; mevcut regresyonlar; nihai sayfa bütçesi ve gerçek cihaz kabulü tamamlanmadan Embla benimsenmiş sayılmaz. Native'e karşı somut pointer/erişilebilirlik/bakım faydası bu ek maliyeti haklı çıkarmıyorsa hero native kalır; promo/kategoriye yayılım yapılmaz.
