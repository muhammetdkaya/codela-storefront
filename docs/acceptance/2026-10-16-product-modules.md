# Storefront 0.1.98 — ürün modülleri kabulü

16 Ekim 2026. Kullanıcı son sade ürün tasarımını ve ücretsiz kargo çizgisinin tam içerik genişliğinde olmasını uygulamaya yetkilendirdi.

## Kaynak ve yayın

- Tema kaynağı: e9ea84afba345be111597ae3101eebaab1ab5d74; PR31 ve iki tamamlayıcı düzeltme.
- CI+gerçek FTP: https://github.com/muhammetdkaya/codela-storefront/actions/runs/38844898361 — başarılı.
- Gerçek CI ZIP SHA256: 8866f5171ba0ad964d9e94d5c961c9dfcf7e599275b4a2cbe11a24a6460a7569; source/version/hash aynı paketle gerçek matrise pin'lendi.
- Plugin test kaynağı: 3d658ba41296804a994e84d21099dd2905f26f52; https://github.com/muhammetdkaya/codela/actions/runs/38845599342 — başarılı, attempt2.
- Plugin runtime1.1.1, WordPress.org, kurulum yedeği ve canlı mağaza modül ayarları değişmedi.

## Doğrulanmış davranış

Theme-only adapter yalnız kayıtlı etkin modüllerin public callback'lerini aynı instance ile taşır. Native hesaplar, REST, canlı scriptler ve satıcı metinleri kopyalanmaz. Üründe yedi default CSS handle kaldırılır, product.css tek modül paint sahibidir; diğer sayfalarda plugin CSS'i kalır. Ortak floating materyal ve WhatsApp IconButton ortak components.css deklarasyonlarından gelir.

Galeri içindeki gerçek sayaç DOM-ready'den önce kayan track'in dışına alınır. Gizli/min-display/mobile koşulları korunur; rail ile çakışmaz. Urgency fiyat yanında, teslimat ve shipping summary'de kompakt, trust bilgi bölümlerinin altında ve related'dan önce. Shipping track ikon girintisi olmadan %100 içerik genişliğinde. Native bilgi/review callback'leri, form, keyboard ve hash bağlantıları çalışır. Kapalı modül markup/host/boşluk bırakmaz. Native varyasyon ve tek satın alma formu korunur.

## Testler

| WordPress / Woo | Tarayıcı | Mevcut gerçek akış | Yeni growth kabulü | Sonuç |
|---|---|---:|---:|---|
| 6.5.5 / 9.0.2 | Chromium |16|5|Başarılı|
| 6.5.5 / 9.0.2 | WebKit |16|5|Başarılı|
| 7.1.3 / 11.2.1 | Chromium |16|5|Başarılı|
| 7.1.3 / 11.2.1 | WebKit |16|5|Başarılı|

Toplam84 kabul kaydı. Yeni5: altı gerçek modül/live counter/stock/ETA/tek CSS/tam genişlik320-390-1280; native details/review/keyboard/hash; gerçek Store API $20→$40/$100 ilerleme; cart default shipping CSS izolasyonu; kapalı durum. Mevcut16; native kart/filtre/galeri/varyasyon, cart API yarışları/senkronizasyonu, classic+block checkout/COD, hesap ve medya izinleri dahil eski kabulü korur. Theme CI ayrıca PHP/JS,24 paket ve mevcut browser suite ile beş genişlikte yeni modül yerleşimini geçti.

İlk matris denemesi eski ortam WebKit mevcut block-cart rozet kontrolünde timeout oldu (8 kayda kadar); yeni growth testi başlamadı. Aynı ZIP ve kodla yalnız başarısız job yeniden çalıştırıldı, hepsi geçti. Neden kesinleştirilmedi; bu yeni bir runtime düzeltmesi değildir, assertion atlanmadı. PR ilk fixture denemesinde eski wp hook sırasına bağlı test durdu; native purchase kurulumu eski sırasında tutulup modül taşıması wp100'e ayrıldı. Bir sonraki disclosure fixture görünürlük/toggle yarışı fresh document ve native görünürlük beklemesiyle izole edildi. Final source için bütün testler başarılıdır.

## Canlı kabul

Final live gate'ler başarılı: WebKit38845519073, shell38845518991, gallery38845519057, document38845519422, performance38845519036. Gerçek ürün CSS0.1.98/helper4b6d7bfcc766b685792e, canvas248/247/244, WA31/168/85; eski module CSS linkleri0. Trust bilgi bileşeninin32px altında. Açıklama, ek bilgi/metadata/stock ve native related görüldü. Canlı mağazada yalnız mevcut etkin trust/WhatsApp gözlendi; pasif growth modülleri gerçek izole ürün ve iki WP/Woo neslinde test edildi. Görsellerdeki örnek8 kişi/son3/tarih/fiyat gerçek mağaza verisi olarak yazılmadı.

Fiziksel Safari/safe-area ve kullanıcı görsel kabulü, gerçek gateway/üçüncü taraf medya ve eski JPEG backfill ayrı açık kalır. CI WebKit fiziksel cihaz değildir.
