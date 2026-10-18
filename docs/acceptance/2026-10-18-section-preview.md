# Sayfa bölümleri: responsive medya ve gerçek önizleme kabulü

18 Ekim 2026. Tema 0.1.135 → 0.1.136; Codela 1.1.3 → 1.1.4; editör varlık sürümü 1.0.1 → 1.0.2.

## Değişiklikler

- Mobil picture/source, ait olduğu bölümün sizes sözleşmesini kullanır. Dar kategori fotoğrafına zorunlu 100vw bildirimi kaldırıldı. Galeri/kart/UI, tek yüksek öncelikli vitrin fotoğrafı ve lazy davranışı korunur.
- Tema yetenek taraması, native önizlemedeki queried post içeriğini okur. Yayındaki sade sayfaya henüz yayımlanmamış bölümler eklendiğinde de doğru CSS/galeri/Woo dosyaları yüklenir.
- Mevcut kompakt Codela editörü gerçek mobil/masaüstü önizleme sunar. WordPress taslağı taslak olarak kaydeder; yayımlanmış sayfa için autosave oluşturur. Aynı native önizleme belgesi iframe'de açılır. İkinci renderer, içerik deposu, özel kayıt endpoint'i veya ziyaretçiye yeni editör JavaScript'i yoktur.
- Önizleme yenilenebilir; hatalı/kilitli kayıtlar engellenir; iframe içindeki Escape ana önizlemeyi kapatır, açık native mağaza dialog'una öncelik verir. Görseller, Woo ve ortak tema tasarımı gerçek frontend'den gelir.

## Testler ve kaynak bağları

- Yerel PHP renderer/yetenek/medya/gezinme testleri, eklenti şema/geçiş testi ve 24 tema paket testi geçti. PHP/JS sözdizimi kontrol edildi. Yerel tarayıcı paketi indirilemedi; tarayıcı kabulü GitHub Actions'ta yapıldı.
- Tema PR #54, son kaynak `7eaa323c61ea101d3ec61acf6fc5191046de1854`, [CI 39119705579](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39119705579) başarılı. Ana dal squash `4a8e1a613b2d4df09693559ca209186210855bf3`.
- Eklenti PR #5, son kaynak `afa6cfc0e697f7a11ed2fe8b5337b960c5d43afe`; [gerçek WP/Woo kabulü 39120406821](https://github.com/muhammetdkaya/codela/actions/runs/39120406821) başarılı. WP6.5.5/Woo9.0.2 ve güncel WP/Woo; Chromium/WebKit: güncel önizleme içeriği, mobil/masaüstü genişliği, yenileme, yayımdaki içeriğe dokunmama, yeni eklenmiş layout dosyaları, taslak durumunun korunması, Escape, limit/undo ve migration rollback. Tema kaynağı 7eaa323c'ye pin'lidir; squash tema aynı runtime ağacını taşır. Ana dal squash `2eebd29d58122a2420a3d270aef922e5e4b914fa`.
- İlk kabul denemesinde iframe içindeki Escape'in parent Modal'a ulaşmadığı bulundu ve düzeltildi. Sonraki test, DOM görünmesini iframe load/klavye hazırlığı sanıyordu; yeni belge ve hazır listener beklenir. Güncel WP admin gezinmesinde tüm ilgisiz load kaynakları yerine DOM ve gerçek form kontrolleri beklenir; uygulama assertions kaldırılmadı.
- 10 bölümlü izole WP testi gerçek sunucu renderer'ını çalıştırır; medya sentetik fixture'dır. Bu sonuç üretim içerikli mobil performans veya fiziksel Safari kabulü değildir.

## Yayın ve canlı kontroller

- Tema [39119945493](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39119945493): validate + gerçek FTP başarılı. Log: **10:42:32 UTC Storefront deployed; checks passed.**
- Canlı galeri [39120320672](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39120320672) ve WebKit [39120320645](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39120320645) başarılı.
- Test araçları `5a130aedf204f15ee0cf850c104684048c1e126f`: yönetilen ana sayfada kasten seçilen native belge geçişi sınanır; boş/kısa ana sayfada test linki sabit header'ın altında kalmaz. Ürün/runtime değişmedi. [Shell 39120476562](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39120476562) ve [document continuity 39120476584](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39120476584) başarılı. Önceki iki test hatası saklanmadı; router kullanmaması gereken ana sayfa için eski router varsayımı ve QA linkinin header altında kalması düzeltildi.
- Eklenti [39120685260](https://github.com/muhammetdkaya/codela/actions/runs/39120685260): validate + delta FTP başarılı. **10:49:35 UTC** sabit 2eebd29d kaynağı; **991 dosya doğrulandı, 5 aktarıldı, 986 sunucuda korundu**. Ana dal free-edition doğrulaması [39120685203](https://github.com/muhammetdkaya/codela/actions/runs/39120685203) başarılı.

## Canlı performans: açık ürün bütçesi

[Gerçek canlı laboratuvar denetimi 39120320650](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39120320650) **başarısız**; eşik gevşetilmedi. Üç bağımsız soğuk Chromium bağlamı, 390px / DPR3, 4× CPU, +150ms gecikme, 1.6Mbps indirme. Bu saha p75 veya fiziksel Safari değildir.

| Bağlam | Medyan LCP | CLS | Sonuç |
|---|---:|---:|---|
| Mevcut canlı ana sayfa | 1372ms | 0 | Mevcut 2800ms bütçesinde; sayfa şu anda boş bölüm kökü içerdiğinden dolu yeni ana sayfanın kabulü sayılmaz |
| Gerçek ürün: kavis-dekoratif-obje | 3616ms | 0.0187 | 2500ms bütçesinin üzerinde |

Ürün ilk fotoğrafı `codela-sf-1513-1024.webp` yaklaşık 110KB; dört ikincil medium PNG yaklaşık 232.5KB ve iki ilgili ürün görseli ana LCP görseli bitmeden istenmiş. Ağ kaydı bu eşzamanlılığı gösterir; yalnız bu kayıtla toplam gecikmenin tamamının nedeni veya belirli bir düzeltmenin kazancı iddia edilmez. Ürün galerisinin soğuk medya yükleme bütçesi ayrı açık iş olarak kalır. Bu sürüm ürün galeri yükleme kodunu değiştirmedi.

## Kalanlar ve sıradaki iş

Bu iki kod düzeltmesinin kaynak/test/FTP zinciri kapandı. Gerçek içerikle yönetici kayıt/önizleme turu ve fiziksel mobil Safari ayrıca doğrulanmalı; kullanıcı içeriği veya ana sayfa ataması otomatik değiştirilmedi. Ürün soğuk mobil LCP bütçesini kaynak/ağ ölçümüyle iyileştir; kaliteyi ve native/no-JS davranışı koru, aynı cihaz/ağ/içerikle üç tekrar ölç. Yeni dolu sayfa düzeninin LCP/CLS/INP kabulü ve saha p75 verisi ayrıca gereklidir. WordPress.org yayımlanmadı.
