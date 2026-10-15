# Codela Storefront — güncel teknik durum


## Son doğrulanmış durum — 0.1.96 mağaza/kategori filtreleri canlı
15 Ekim 2026: Tema **0.1.95→0.1.96 canlı**, Codela eklentisi **1.1.1 değişmedi**. Mağaza ve kategori/etiket arşivlerinde ortak kompakt başlık/sonuç sayısı, breadcrumbsız düzen; sıralama mevcut tek tam ekran dialog içindeki Filters görünümüne taşındı. Header'ın mevcut tools slotunda ortak soft IconButton ve yerel sliders-horizontal SVG kullanılır; mobilde Menu'nün hemen solunda. Kategori bağlantıları, native Woo GET fiyat aralığı/sıralama, kategori kapsamını koruyan Uygula ve Temizle. Empty bounds native Woo sorgusundan önce normalize edilir; açık 0 fiyatı korunur. Yeni filtre API'si, modal/controller, kart kopyası veya satın alma motoru yok. Kategori/etiket template'leri aynı native archive-product bloğunu kullanır.

**Yayın:** [PR29](https://github.com/muhammetdkaya/codela-storefront/pull/29), [kaynak 5ba4c0cd](https://github.com/muhammetdkaya/codela-storefront/commit/5ba4c0cd6394ffd6e407f74dcd2db8ffbc574dca), [CI+gerçek FTP 38775799204](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38775799204) başarılı. Paket SHA256: `17999f0f5c366303d4131ba15355c1348a7b787f64ac81ea1de92ed15d2b5405`. PR CI38775481494 PHP/JS/24 paket ve bütün browser regresyonları başarılı; yeni filtre fixture'ı shop/category × dock açık/kapalı × 320/390/700/1280, 44px hedef/overflow, tek dialog, Escape/focus ve kapsamlı GET gönderimini doğruladı. Beş canlı gate başarılı: WebKit38776225733, shell38776225658, document38776225974, gallery38776225923, performance38776226144.

**Canlı kabul:** Gerçek Türkçe mağaza /magaza/ ve /urun-kategori/codela-demo/ tarayıcıda incelendi; CSS0.1.96 ve yeni panel doğrulandı. Kategoride min20/max30 + price-desc gerçek sonuçları27,25,23.20,21 şeklinde4 ürün; kategori URL'si korundu. Mobil native WP/Woo screenshot'ında Header Filter/Menu44px eşitliği ve panel yerleşimi incelendi. **Gerçek Woo kabulü:** [38776765741](https://github.com/muhammetdkaya/codela/actions/runs/38776765741) başarılı: WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1 × Chromium/WebKit, her ortam16 kontrol, toplam64 başarılı. Test kaynağı4874d0e43724466d511cde641955b11b0048813f; yeni0.1.96 ZIP/source/hash doğrulandı. İlk38775916948 hash pin'i yerel ZIP yeniden üretiminden geldiği için kurulumda durdu; pin doğrudan gerçek CI paket manifestinden düzeltildi. İkinci38776229914 yeni Filters/price/reset kontrollerini geçti ancak eski testi kaldırılmış select.orderby aradığı için durdu; o test aynı yeni panelden sıralama seçip Uygula kullanacak şekilde güncellendi. Son başarılı koşu aynı yayınlanmış0.1.96 tema paketidir; test düzeltmeleri yeni runtime/eklenti yayını değildir.

**Kalan / sıradaki iş:** Bu mağaza/kategori geliştirmesini yeniden kurma. Kullanıcının görsel kabulü ve fiziksel Safari/GPU/toolbar/safe-area kontrolü; gerçek ödeme sağlayıcısı ve üçüncü taraf medya; eski JPEG backfill (yetkili oturum+yedek; kullanıcı istemeden yeniden giriş isteme) ayrı açık kalır.

## Son doğrulanmış durum — 0.1.95 ürün kartı tıklaması canlı ve kabul tamam

15 Ekim 2026: **Codela Storefront 0.1.94→0.1.95 canlı, gerçek WP/Woo kabulü tamam.** Mevcut Woo ürün linkinin `::after` hit alanı görsel, başlık, fiyat, kart içi boşluk ve stoksuz kartı kapsar; native `Sepete ekle`, `Seçenekler`, grouped/external ve `Sepeti Görüntüle` ayrı tıklanır. `catalog.css` düzeni dışında yeni JS, nested anchor, kart kopyası veya ikinci sepet motoru yok. Codela eklentisi **1.1.1 değişmedi**. Erişilebilir isim/Tab focus korunur.

**Kaynak ve dağıtım:** [2adf5c16](https://github.com/muhammetdkaya/codela-storefront/commit/2adf5c16d91f47fe8fa2ac3953437cde33f24b83), [CI + gerçek FTP 38732771167](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38732771167) başarılı. 0.1.95 ZIP SHA256: `4b0c754887f031f861298b7d48a79381eb86c6891e69a3d858d35b74a8083c3b`. Beş canlı denetim (WebKit [38733587291](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38733587291), shell [38733587240](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38733587240), document [38733587219](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38733587219), gallery [38733587322](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38733587322), performance [38733587209](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38733587209)) başarılı. Sentetik Chromium fare/dokunma hit tests ve eski regression suite geçti.

**Gerçek kabul:** [38734453585](https://github.com/muhammetdkaya/codela/actions/runs/38734453585) başarılı: WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1, Chromium/WebKit, **4/4 ortam × 15 kontrol = 60 başarılı**. Her ortamda home/shop/category/search/related hit target, gerçek fiyat→ürün URL navigasyonu, native AJAX/variation/cart/checkout/account ve önceki testler doğrulandı. İlk denemede (`38733644050`) kart test için viewport altına getirilince fixed mobil dock tıklamayı kapatıyordu; test navigasyon barının üstündeki görünür kartı merkezleyerek 0.1.95 **aynı ZIP** ile yeniden başarılı koşuldu. Test sonucu yeni bir tema CSS değişikliği değildir. [Ayrıntılı kabul](docs/acceptance/2026-10-15-card-hit-area.md). Önceki "bekliyor" başlıkları artık tarihî kayıttır.

**Sıradaki iş:** Fiziksel iPhone Safari/GPU/toolbar ve kullanıcı görsel kabulü; gerçek ödeme sağlayıcısı ve üçüncü taraf medya; eski JPEG backfill yetkili yönetici oturumu/yedek gerektirir. Tamamlanmış 0.1.95 düzeltmesini yeniden tasarlama.

## Güncel — 0.1.95 tam ürün kartı tıklama yüzeyi (CI/yayın bekliyor)

15 Ekim 2026: 0.1.94 [CI+canlı FTP 38723030129](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38723030129), beş canlı gate ve [gerçek WP/Woo matrisi 38723703294](https://github.com/muhammetdkaya/codela/actions/runs/38723703294) başarılı. Yeni şikâyet: görsel+başlık native Woo link, ancak fiyat/alt kart boşlukları link dışı. `catalog.css` tek native detail link'in transparent `::after` click hitbox'ını `li.product` tüm boyuna yayar; footer native Woo actions/eklenti kontrolleri üst z-index'te bağımsız kalır. Ek JS, başlık/görsel ikinci anchor'ı, fiyat için DOM/anchor değişimi, yeni cart/controller yok. Focus ring kart çevresine de eklenir. `catalog-browser.cjs` mouse/touch hit tests 320/390/1280, home/shop/category/search/related bağlamlarında çalışacak. Eklenti 1.1.1 ve native Woo add-to-cart semantiği değişmez.

**Kalan kabul:** 0.1.95 CI + gerçek FTP + canlı WebKit/galeri/shell/navigasyon/perf; yeni ZIP/hash ve source ile gerçek WP/Woo Chromium+WebKit native dokunma, fiyat → product URL ve AJAX aksiyon kontrolü. Fiziksel Safari ve üretim ödeme kabulü ayrı.

## Güncel — 0.1.94 ortak IconButton native Woo yerleşimi (test bekliyor)

15 Ekim 2026: 0.1.93 kaynak [4e4a8be5](https://github.com/muhammetdkaya/codela-storefront/commit/4e4a8be5366dea67e9a3ac534508604b19577240) [CI+gerçek FTP 38720668607](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38720668607) ve beş canlı gate başarıyla yayınlandı. Bununla birlikte [gerçek WP/Woo 0.1.93 matrisi 38721596389](https://github.com/muhammetdkaya/codela/actions/runs/38721596389) hatayı yakaladı. `margin:0` ve 22×22 ikon doğru, ama Woo `a.button` genel selector'ü daha spesifik `display:inline-block` verdiği için 44px kapsayıcıda glif (−10px,−10px) kayıyordu. Tek merkezi `components.css` IconButton flex kuralına daha spesifik native Woo katalog selector'ü ekleniyor; ikon veya kart için bağımsız paint/pressed/controller oluşturulmuyor. Katalog Chromium fixture'ına bu gerçek native `display` kuralı ekleniyor.

**Kalan kabul:** 0.1.94 CI, gerçek FTP, beş canlı denetim, 0.1.94 ZIP SHA256 ve kaynak piniyle iki gerçek WP/Woo nesli × Chromium/WebKit. Sürüm ve eklenti ayrı; Codela1.1.1 değişmedi. Fiziksel cihaz, gerçek ödeme sağlayıcısı, üçüncü taraf medya ve onaylı eski JPEG backfill açık.

## Güncel: 0.1.93 native Woo ikon merkezi (CI bekliyor)

15 Ekim 2026: 0.1.92 [commit fae7ca4](https://github.com/muhammetdkaya/codela-storefront/commit/fae7ca4ba2ebe77bfe009fbe230302ff76786194) ve [gerçek FTP dağıtımı 38716613763](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38716613763) başarılı; beş canlı kabul ve WebKit 0.1.92 çalıştı. Önceden eksik olan yeni [gerçek WP/Woo 0.1.92 matrisi 38719692867](https://github.com/muhammetdkaya/codela/actions/runs/38719692867) **başarısız**: Woo'nun `.woocommerce ul.products li.product a img` kuralındaki 1em resim alt marjı shared IconButton'ın native glyph'ine de etki ederek merkezden kaydırdı. İlk sentetik test Woo kuralını taklit etmiyordu. Bu sonuçlar 0.1.91 başarısıyla karıştırılmamalı.

0.1.93: `components.css` ortak glyph deklarasyonuna yalnız Woo image margin reseti ekle; katalog testinde gerçek Woo kuralını simüle et ve computed margin=0 doğrula. Ortak Button/IconButton / header / Woo varsayılan URL, AJAX, data ve ARIA bozulmasın. CI+FTP+canlı + yeni sürüme sabitlenmiş iki WordPress/Woo ve iki browser native matrisi ayrı doğrulanacak. Codela 1.1.1 runtime değişmedi. Fiziksel iPhone Safari/GPU ve ödeme sağlayıcısı/üçüncü taraf görsel kabulü açık.

15 Ekim2026: tema0.1.91→0.1.92 hazırlanıyor; Codela1.1.1 değişmedi. Katalog simple/variable native düğmesi artık Header ile aynı IconButton sınıf/içerik yardımcılarını ve components.css deklarasyonlarını kullanır. Karttaki ::before SVG ve ayrı44px/ikon geometrisi kaldırıldı; native URL/AJAX/data/ARIA korunur. Ortak glyph22px, hedef44px,soft yüzey,scale1.08,focus/disabled/erişilebilirlik aynı. Native loading/added göstergesi ortak glyph slotunda; grouped/external metinli Button kalır. Yeni JS yok. CI,gerçek FTP,canlı ve yeni paket native kabulü bekliyor.

## Önceki0.1.91

15 Ekim2026: **tema0.1.90→0.1.91 canlı**, Codela1.1.1 değişmedi. [Kaynak eadd2c55](https://github.com/muhammetdkaya/codela-storefront/commit/eadd2c55043b31083a7c209271946db5b32daee7), [CI+gerçek FTP38712509087](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38712509087) başarılı; gerçek deploy09:26:31Z.

Ürün adları temanın sans-serif ailesi13/14px500, fiyat16/17px500. Tek beyaz kartta dış çizgi kaldırıldı; footer ayırıcı surface-muted. Native secondary Button mevcut sf-ui-surface ortak materyaline bağlandı; açık dolgu, saydam kenar, inset olmayan gölge ve opaque/forced-colors fallback'leri aynı deklarasyonlardan gelir.44px, native SVG/Woo URL/AJAX/ARIA ve1360px katalog korunur; yeni JS/bağımlılık yok.

CI PHP/JS/paket ve tüm Chromium regresyonları başarılı; katalog5 bağlam×5 genişlikte sans-serif/500/ince ayırıcı/tek düğme yüzeyi doğrulandı. Canlı WebKit38712961618, shell38712961983, galeri38712961912, belge38712961878, performans38712962046 başarılı. Gerçek Türkçe ürün arama görüntüsü incelendi; home/search/product CSS0.1.91 doğrulandı. Hız artış yüzdesi iddia edilmez.

Gerçek WP/Woo yeni91 matrisi: [38713426329](https://github.com/muhammetdkaya/codela/actions/runs/38713426329) başarılı: WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1, Chromium/WebKit13'er check (4/4 ortam52 kayıt). Test kaynağı597f6b2260d3e581e4e1899fac4a07d2fe71bb8c;91 ZIP SHA25646a31a2e34ccb3e52ea07440dce6ef56e5042706dbb93382e97e2bd1075bfa7e. İlk38713073692 çalışması gruplu ürünün90'dan beri tam satırda olan metinli aksiyonunu yanlış biçimde kompakt düğme saydı; test kompakt/simple-variable ve metinli/grouped-external yerleşimlerini ayrı doğrulayacak şekilde düzeltildi, aynı91 tema paketi yeniden başarılı sınandı..
Kalan: kullanıcının yeni fiziksel cihaz görsel kabulü, gerçek ödeme sağlayıcısı/üçüncü taraf medya ve kullanıcı istemeden yeniden giriş istenmeyecek eski JPEG backfill.

## Önceki0.1.90 — tarihli kayıt

15 Ekim2026: **tema0.1.89→0.1.90 canlı**, Codela1.1.1 eklenti sürümü değişmedi. [Kaynak 104b853d](https://github.com/muhammetdkaya/codela-storefront/commit/104b853d62ee73099923ecf0b35a0e79ebb8008f), [CI / gerçek FTP 38709075916](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709075916) başarılı.

## Yapılan — referans ürün kartına eşleme

Geniş (1360px üst sınır / mobil12px içerik kenarı) katalog; koyu ürün başlığı/fiyat; gerçek ayırıcı çizgi; native Woo Button üzerinde yerel shopping-bag SVG yuvarlak 44px aksiyon. Varyasyon ürünü seçenek okunu kullanır, stoksuz üründe sahte satın alma düğmesi yoktur. Aynı native kart her katalogda kullanılır. JavaScript veya ikinci stil yüzeyi eklenmedi.

## Yayın durumu ve kalan kabul

CI paket, PHP, JS, katalog (320/390/700/900/1280), ortak Button ve header, galeri, checkout, shell/navigasyon browser regresyonları başarılı. Tek geçici CI press zamanlama hatası üzerine aynı commit'in ikinci çalışması tam geçti. Gerçek FTP dağıtımı ve public source/store sağlık doğrulaması başarılı. Canlı [WebKit](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787224), [shell](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787200), [galeri](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787332), [belge](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787245), [performans](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787212) testleri başarılı.

Kalanlar: fiziksel iPhone/Safari dokunma-görsel kabulü, üretim ödeme sağlayıcısı, eski JPEG toplu dönüşüm (yetkili oturum/yedek gerekir) ve üçüncü taraf medya. Bundan sonra yeni görsel revizyon yapılacaksa mevcut ortak kart ve UI Button sistemini kullan; checkout/header/sepete ait ayrı yeni bileşen kurma.

---



15 Ekim2026: **tema0.1.88→0.1.89 canlı**; Codela eklentisi1.1.1 değişmedi. [Son kaynak 4f162237](https://github.com/muhammetdkaya/codela-storefront/commit/4f162237ae5f323c50f3720582de82591cde92fb), [CI+gerçek FTP 38688395197](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38688395197) başarılı.

## Açık ürün kartı güncellemesi

Tek Woo native kartına bütünleşik beyaz yüzey, hafif tek sınır/gölge, saydam kare ürün görseli, içeride iki satır başlık ve fiyat/ortak secondary kapsül düğme eklendi. Aynı catalog.css home/shop/category/search/related alanlarını yönetir; farklı kart JS veya HTML yok. Müşteri hesabı, sepet API ve Header etkilenmez.

## Doğrulama bekliyor

GitHub Actions doğrulama, gerçek FTP yayını ve canlı görsel/ürün akışı sonuçları gelmeden 0.1.89'u canlı kabul etme. Fiziksel cihaz, eski medya arşivi ve üçüncü taraf ödeme kontrolleri ayrıca açıktır.

---



15 Ekim2026: **tema0.1.87→0.1.88 canlı**, Codela1.1.1 runtime/WordPress.org değişmedi. [Kaynakd64106c4](https://github.com/muhammetdkaya/codela-storefront/commit/d64106c4d12e58e57d459eb802d5238c7a5a568b), [CI+gerçek FTP38678440344](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38678440344) başarılı; deploy03:54:21.1422094Z.

## Biten iş

Tek native content-product.php bütün kart bağlamlarının sahibi.1:1 contain/şeffaf dış görsel yüzeyi, küçük iki satır başlık, native fiyat ve mevcut secondary Button aynı footer'da.44px hedef, simple Ekle/variable Seçenekler; grouped/external native metinleri korunur. Stoksuz badge ve aksiyonsuz kart. Veri olmayan renk noktaları/puan yok.

catalog.php native link kapandıktan sonra mevcut hook'ları birleştirir, Woo URL/AJAX/data/ARIA/fiyat/indirim korunur. components.css aynı Button primitive'ini tema sf-content'e bağlar; catalog.css kart/ölçü/hiza. Google grid specialization korunur; Codela signed-in hesap dışlanır. Yeni JS/carousel/listener/controller/paint kopyası yok. Header87 eşitliği, native Woo form/gallery, tek dialog/dock/store değişmedi.

## Doğrulama

[88 kabul/ham sonuç](acceptance/2026-10-15-catalog.md): tüm PHP/JS/24 paket ve Chromium regresyonları; beş canlı gate başarılı. Gerçek Türkçe ürün arama screenshot'ı incelendi;1:1/tek yüzey, fiyat/Ekle, stockless/native footer ve header44×44 doğrulandı. İki WP/Woo ailesinde Chromium/WebKit13'er gerçek check (4/4 ortam,52 kayıt), yeni5 bağlam kart alt kontrolleri dahil; test kaynağıb684671cfad86573043da579a32760e25d395e1f. Paket/hash/source pin'i güncel; önceki87 sonuçları88 diye sunulmadı.

## Kalan / sıradaki iş

88 kod/yayın/otomatik kabul tamamlandı; yeniden uygulama/yayın başlatma. Kullanıcının görsel beğeni onayı ve fiziksel iPhone Safari/GPU/toolbar/safe-area ayrıdır. Eski JPEG canlı admin backfill (kullanıcı istemeden giriş isteme), gerçek ödeme sağlayıcısı ve üçüncü taraf medya kabulü açık. Canlı medya işlemi öncesi yedek ve küçük örnek gerekir.

## Önceki87 teknik kayıt —tarihli

15 Ekim2026: **tema0.1.86→0.1.87 canlı**, eklenti1.1.1 runtime/WordPress.org yayını değişmedi. [Kaynak252b51d5](https://github.com/muhammetdkaya/codela-storefront/commit/252b51d5a9574e8ac3073ce9227b5d348dd8107b), [CI+gerçek FTP38676747269](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38676747269) başarılı; deploy2026-10-15T03:35:48.5889670Z.

## Biten iş

Mobil Cart/Menu aynı mevcut soft IconButton44×44. Önceden Cart'ın52×46 dış araç grubu yüzeyi vardı; şimdi ortak components.css responsive grup bileşimi tek kontrolün padding/border/dış materyalini kaldırır. Desktop üç araçlı grup korunur. Yeni paint/JS/listener/controller veya kopya düğme yok; tek arka plan ve ortak pressed/focus/erişilebilirlik korunur. Logo/Menu slotları, native Woo kartlar/form/gallery, tek dialog/dock/store ve plugin-owned hesap değişmedi.

## Doğrulama

[87 kabul kaydı](acceptance/2026-10-15-icon-buttons.md): CI (320/390/700 mobil,900/1280 desktop, boş/2/99 badge, pressed/focus dahil), gerçek FTP ve beş canlı gate başarılı. Canlı WebKit gerçek Cart/Menu dış44×44 ve materyal eşitliğini doğruladı; CSS0.1.87. Yeni gerçek WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1 matrisinde Chromium/WebKit13'er check başarılı (4/4 ortam,52 kayıt); native Header eşitlik kontrolü de bu pakete eklendi. Eklenti workflow paket/hash/source pin'i güncel; kaynakd51f6e13cf84254c913bcd840db0b4fec3882308. Eski86 sonucu yeni sürüme mal edilmedi.

## Kalan / sıradaki iş

Bu boyut düzeltmesi, yayın ve otomatik kabul tamamlandı; tekrar uygulama/yayın başlatma. Fiziksel iPhone Safari/GPU/toolbar/safe-area, eski JPEG canlı admin backfill, gerçek payment-provider ve üçüncü taraf medya/offload kabulü açık. Kullanıcı istemeden yeni admin giriş isteği açma. Sonraki cihaz kabulünde Cart/Menu eşitliği ve Menu/X hareketini fiziksel tarayıcıda kontrol et. Canlı medya değişiminden önce yedek ve küçük örnek gerekir.

## Önceki0.1.86 teknik kayıt —tarihli

15 Ekim2026: **tema0.1.86 canlı**, Codela eklentisi1.1.1. [Kaynak86681e46](https://github.com/muhammetdkaya/codela-storefront/commit/86681e46cb43e072ce556b7e1a0575557a11eb3a), [CI+gerçek FTP38654572606](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38654572606) başarılı. Eklenti runtime/WordPress.org yayını değişmedi.

## Header ve ortak ürün kartı tamamlandı

Mobilde logo solda/Menu en sağda sabit. Ürün purchase dock yerine geçtiğinde yalnız Cart menünün solunda; Search/Account menüde. Purchase olmayan ve dock'u açık üründe dock korunur, ikinci Cart yok. Checkout aynı logo/Menu slotlarında, docksuz. Alt menü kapalı ayarda araçlar üstte kalır; desktop ve guest auth düzeni korunur.

Home/shop/category/ürün arama sayfası/related/upsell/cross-sell aynı native Woo content-product.php ve catalog.css kullanır. Görsel4:5 contain, başlık iki satır, native fiyat/indirim/stok, ortak Button; mobil2/orta3/geniş4 sütun. Eski home article ve ürüne özel kart paint'i kaldırıldı. Normal post/page araması core Query, hero high ve home thumbnail lazy aynı. Yeni kart JS/carousel/API yok.

Woo11'in özel Product Search Results template'i85'in gerçek testinde bulundu;86'nın açık product-search-results.html'i onu da native ortak karta bağlar.85'in başarısız matrisi kapatılmış gibi sunulmaz; son kabul86'dır.

## Doğrulama

[15 Ekim kabul/ham sonuçlar](acceptance/2026-10-15.md): CI, beş canlı gate, ek canlı WebKit product-search/görsel yükleme başarılı. İki WP/Woo ailesinde Chromium ve WebKit'in13'er gerçek akışı başarılı (4/4 ortam,52 kontrol).24 lab ölçümünde mobil cold LCP home2352ms/ürün1612ms, CLS0 ve CSS0.1.86. Lab verisi saha CWV/hero boyama veya fiziksel cihaz ölçümü değildir.

Tek Store API/cart controller, tek Interactivity store/dialog/dock, native Woo form/varyasyon/gallery/PhotoSwipe ve Codela plugin-owned hesap izolasyonu korunur. Ortak yüzey96%, tek background/gradient yok. Güvenli home/statik sayfalarda çekirdek router; Woo sayfaları native belge geçişinde, yeni SPA/cache/history motoru yok.

## Kalan ve sonraki iş

Bu Header/katalog kodu, yayın ve otomatik kabul işi tamamlandı. Aynı yayını/testleri yeniden başlatma. Eski JPEG canlı admin backfill (giriş tamamlanmadı; kullanıcı istemeden yeniden isteme), fiziksel iPhone Safari/GPU/toolbar/safe-area, gerçek ödeme sağlayıcıları ve üçüncü taraf medya/offload kabulü açık. Sonraki somut iş bu erişim/cihaz kabulüdür; canlı medya değişiminden önce yedek+kısa örnek gerekir.

## Kaynaklar

- [Tasarım sözleşmesi](design-system.md), [sepet kabulü](cart-sync-acceptance.md).
- [15 Ekim uygulama aşamaları](releases/2026-10-15-implementation-notes.md), [14 Ekim teknik geçmiş](storefront-theme-history-2026-10-14.md).
- [0.1.84 gerçek kabulü](acceptance/2026-10-14.md); F1–F7 bulgularının önceki kapanışı ve tarihli mimari raporlar bu kanıtlara göre değerlendirilir.
- Yeni sürümde eklenti deposundaki gerçek entegrasyon workflow paket/hash/source pin'ini güncelle. Dondurulmuş eklenti içi0.1.1 temayı değiştirme.
