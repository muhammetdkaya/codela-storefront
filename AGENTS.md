# Codela Storefront — güncel çalışma kuralları

## Son doğrulanmış durum — 16 Ekim 2026 / 0.1.98 ürün modülleri canlı ve kabul tamam

Tema **0.1.97→0.1.98 canlı**. Codela eklentisi **1.1.1 runtime değişmedi**, WordPress.org ve dondurulmuş0.1.1 tema paketi değişmedi. Kullanıcının onayladığı sade modül düzeni: ziyaretçi galeri köşesinde, urgency fiyat yanında, kompakt teslimat/WhatsApp, ücretsiz kargo çizgisi içerik genişliğinin tamamında, güven vaatleri bilgi bölümlerinin altında ve önerilerden önce. Native Woo tab callback'leri details/summary içinde; açıklama açık, diğerleri kapalı. Mevcut modül ayarları/mesajları korunur; canlıda kapalı modüller açılmadı, sahte değer eklenmedi.

**Tek sahiplik:** yalnız ürün sayfasında yedi bilinen module CSS handle'ı kaldırılır; görünüm product.css ve mevcut ortak primitives'tadır. Orijinal plugin callback instance'ları, veri/REST/sayaç/ETA/kargo scriptleri ve şartları korunur. Galeri hook'u kayan track'in içinde olduğundan aynı gizli visitor host küçük mevcut ürün enhancement scriptiyle native galeri dış çerçevesine, DOM-ready başlangıcından önce taşınır; galeri/satın alma motoru kopyalanmaz. Script içerik hash'iyle cache'lenir. Ortak köşe/font token'ları korunur; opsiyonel global WhatsApp ortak IconButton kullanır. Sepet/ödeme ve diğer temalarda plugin CSS'i korunur.

**Yayın:** [PR31](https://github.com/muhammetdkaya/codela-storefront/pull/31), son kaynak [e9ea84af](https://github.com/muhammetdkaya/codela-storefront/commit/e9ea84afba345be111597ae3101eebaab1ab5d74); [CI+gerçek FTP38844898361](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38844898361) başarılı. Gerçek CI ZIP SHA256 **8866f5171ba0ad964d9e94d5c961c9dfcf7e599275b4a2cbe11a24a6460a7569**. Önceki10e55669 koşusunda güncel kaynak superseded olduğu için gerçek deploy adımı atlandı; bu final koşu gerçek deploy yaptı. Source01a9475f ara paketi final kabul kaynağı değildir.

**Kabul:** mevcut PHP/JS/24 paket ve bütün browser regresyonları, yeni callback sahipliği testi ve beş genişlikte tam genişlik/taşma/visitor-rail/keyboard/hash/kapalı durum testi geçti. Beş final canlı gate başarılı: WebKit38845519073, shell38845518991, gallery38845519057, document38845519422, performance38845519036. [Gerçek WP/Woo38845599342](https://github.com/muhammetdkaya/codela/actions/runs/38845599342) başarılı: WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1 × Chromium/WebKit; ortam başına16 mevcut akış +5 growth kabulü, **4/4 ortam ve84 başarılı kayıt**. Test kaynağı 3d658ba41296804a994e84d21099dd2905f26f52; aynı final98 ZIP/source/hash'e pin'li. İlk denemede eski ortam WebKit mevcut sepet rozet testinde timeout oldu ve growth kısmına ulaşmadı; kod/paket değişmeden failed job yeniden çalıştırıldı (attempt2) ve tüm kontroller geçti. İlk timeout'un nedeni kesinleştirilmedi; test kaldırılmadı/zayıflatılmadı.

**Canlı ölçüm:** product.css0.1.98; product-information.js hash4b6d7bfcc766b685792e; default trust/WhatsApp/conversion CSS linkleri yok, WhatsApp ikonu rgb(31,168,85), ortak canvas rgb(248,247,244). Trust bilgi bileşeninin32px altında. Gerçek açıklama/ek bilgi açılımı, metadata/native stock ve ilgili ürünler görüldü. Canlıdaki pasif ziyaretçi/ETA/free-shipping koşulları gerçek hesapla CI'da test edildi; canlıda tüm modüller açıkmış gibi sunulmaz. [Ayrıntılı kabul](docs/acceptance/2026-10-16-product-modules.md).

**Kalan / sıradaki:** bu tasarımın kod/yayın/otomatik kabulü tamam; yeniden uygulama veya varsayılan modül ayarlarını kendiliğinden değiştirme. Kullanıcının görsel kabulü ve fiziksel Safari/toolbar/safe-area kontrolü; gerçek ödeme sağlayıcısı/üçüncü taraf medya ve yetkili eski JPEG backfill ayrı kalır. Önceki97 matris38779779538 attempt2 ve performance38780472484 de başarılı doğrulandı; tarihî pending notlar kapanmıştır ve bu kanıtlar98'e mal edilmez.


## Önceki hazırlık kaydı — 16 Ekim 2026 / 0.1.98 ürün modülleri

Tema **0.1.97 → 0.1.98** hazırlanıyor. Codela eklentisi **1.1.1 runtime değişmedi**; WordPress.org yayını yok. Kullanıcı son sade ürün tasarımını ve ücretsiz kargo ilerleme çizgisinin içerik alanının tamamına yayılmasını uygulamaya yetkilendirdi.

- Etkin modüllerin mevcut public render callback'leri aynı instance ile yeniden konumlanır: ziyaretçi native galeri içinde köşede (önizlemelerin üzerinde çakışmasız), urgency fiyat satırında, teslimat/kargo/WhatsApp native satın alma formundan sonra, güven vaatleri ürün bilgi bölümlerinin altında ve upsell/related'dan önce. Kapalı modül örneklenmez veya zorla açılmaz; boş host eklenmez.
- Ürün sayfasında yedi bilinen Conversion Tools stil handle'ı dequeue edilir. **Tek modül görünüm sahibi product.css**; scriptler, REST, gerçek sayaç/stok/tarih/kargo hesabı ve satıcı mesajları eklentide kalır. Sepet/ödeme/diğer temalar değişmez. İsteğe bağlı global WhatsApp aynı shared IconButton ile çalışır.
- Tam genişlik `.cdl-fsb-track`: ikon sütunu/girinti/max-width olmadan kendi summary içerik genişliğinde %100. Boş sepetin gerçek eşik mesajı korunur; olmayan ilerleme veya sahte değer üretilmez.
- Woo tab callback'leri native details/summary içinde; açıklama açık, ek bilgi/yorumlar kapalı. Native yorum formu ve extension callback argümanları korunur. Hash/review bağlantısı ilgili bölümü açar. İkinci başlıklar sadece bu bileşende kaldırılır. Yeni sepet/galeri/SPA controller yok.
- Header/dock/galeri seçim-swipe/satın alma kontrolleri mevcut ortak altyapıda kalır. Galeri önizleme kapsülü bu işte yeniden tasarlanmadı; ziyaretçi onun üstünde konumlanır. Tema kodu modül özel ayarlarını okumaz.

**Doğrulanan:** yerelde JS sözdizimi, 24 paket testi, cart-race/cart-sync/format geçti. PHP ve tarayıcı executable'ları yerelde yok; PHP/Chromium ve yeni callback/yerleşim kabulü CI'da çalıştırılacak. Native Woo matrisi ve canlı kabul henüz tamamlanmadı; kod/yayın başarılı sayılmaz.

**Sıradaki:** PR CI, gerçek FTP; canlı gerçek trust/WhatsApp/accordion düzenini ve güncel asset sürümünü kontrol et. Yeni sürümün gerçek CI ZIP hash/source'una pin'li WP/Woo Chromium+WebKit kabulü gerekir. Tüm modüller açık/kapalı, uzun metin, 320px, gerçek script güncellemeleri ve kargo %100 hizası testlerle doğrulanmalı. Fiziksel Safari, gerçek gateway ve eski JPEG backfill ayrı kalır.

## Son doğrulanmış durum — 0.1.97 ortak sayfa zemini canlı

15 Ekim2026: Tema **0.1.96→0.1.97 canlı**, Codela eklentisi **1.1.1 değişmedi**. Kullanıcının kategori/ürün screenshot farkının kaynağı ürün main, checkout body, guest hesap, footer ve dialog/search/account canvas'larının kart beyazını kullanmasıydı. Tek `--sf-ui-page:var(--wp--preset--color--base,#f8f7f4)` token'ı WordPress base paletini izler. Body, sayfa/panel/footer ve route-loading zeminleri onu kullanır; `--sf-ui-surface` beyaz kart/input/control yüzeyi olarak kalır. Header/dock materyali ve plugin-owned hesap içeriği değişmedi. JS/PHP/Woo davranışında değişiklik yok.

**Kod/yayın:** [PR30](https://github.com/muhammetdkaya/codela-storefront/pull/30), [kaynak327f090d](https://github.com/muhammetdkaya/codela-storefront/commit/327f090dac39b9078731cbf6372e7d734b647919). [PR CI38779124869](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38779124869) ve [main CI+gerçek FTP38779434836](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38779434836) başarılı; mevcut PHP/JS/24 paket ve browser regresyonları geçti. Önceki white-canvas assertion'ları yeni ortak canvas sözleşmesine uyarlandı; input/card beyaz assertion'ları korundu. Gerçek CI ZIP SHA256 `b895ba0a4a4a192f082c5e1f58776b1fc29479f3804f9a5a899247bb19bf9f67`.

**Canlı tarayıcı kabulü:** Önce ürün body rgb(248,247,244), main/footer rgb(255,255,255) idi. Yayın sonrası ürün body/main/footer **rgb(248,247,244)** ve product.css0.1.97 doğrulandı. Ana sayfa, /magaza/, /urun-kategori/product/, /hesabim/ ve boş /sepet/ body/footer aynı renkte; main şeffaf olduğu yerlerde bu canvas görünür. Menu/Search/Cart/Account paneli ve Search content aynı rgb(248,247,244). /odeme/ boş sepet nedeniyle /sepet/'e yönlendi: canlı gerçek checkout formu incelenmiş sayılmaz; checkout CSS/browser fixture kontrolü CI'da geçti. Plugin signed-in account CSS'i dış body zemini tanımlamıyor; iç yüzey sahipliği korunur.

**Ek kontroller:** Canlı WebKit38780472718, shell38780472708, document38780472803, gallery38780473310 başarılı. Performance38780472484 ve [gerçek Woo matrisi38779779538](https://github.com/muhammetdkaya/codela/actions/runs/38779779538) ek doğrulaması takip edilecek. Matrisin ilk denemesi FTP henüz bitmeden paket URL'si404 olduğu için kurulumda durdu; tema testi çalışmadı. Dağıtım başarılı olduktan sonra aynı paketle başarısız job'lar yeniden başlatıldı (attempt2). Workflow0.1.97 gerçek hash/source'a pin'li. Önceki0.1.96 64 kontrol bu sürüme mal edilmez.

**Kalan:** Ortak zemin kodu/yayın ve canlı renk kabulü tamam. Ek matris/performance sonucu belgeye işlenecek; fiziksel Safari/görsel kabul, gerçek payment-provider/üçüncü taraf medya ve yetkili/yedekli eski JPEG backfill ayrı kalır.

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

## Güncel çalışma — 0.1.95 ürün kartı tam yüzey bağlantısı (kabul bekliyor)

15 Ekim 2026: 0.1.94 CI+gerçek FTP [38723030129](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38723030129), beş canlı gate ve gerçek WP/Woo [38723703294](https://github.com/muhammetdkaya/codela/actions/runs/38723703294) başarılıdır. Kullanıcı ürün kartına dokunmanın tutarsız olduğunu bildirdi. Mevcut tek Woo link yalnız görsel+başlık alanını kapsıyor; fiyat/alt boşluk hit target değil.

0.1.95: `catalog.css` mevcut Woo detail anchor'ı `::after` ile tüm kartın şeffaf tıklama alanı olacak şekilde genişletir; native Woo add-to-cart/Options/View Cart ve footer'daki diğer kontroller `z-index` ile üstte kalır. Yeni nested link, JS listener/router, HTML değişikliği, ürün kartı kopyası, renk veya animasyon yok. Klavye focus ring'i kart çevresine de yansır. `catalog-browser.cjs` gerçek mouse/touch noktalarını (görsel, başlık, fiyat, boşluk, stoksuz kart, ikon/Options/View Cart) 320/390/1280 ve farklı kataloglarda dener. Tema 0.1.94→0.1.95; eklenti 1.1.1 değişmez.

**Sıradaki iş:** PR CI, gerçek FTP ve beş canlı gate; yeni paket/hash/source'a pin'li gerçek WP6.5/Woo9 ile WP7.1/Woo11 Chromium+WebKit matrisinde fiyat ve boş alandan ürün açılışı ve native AJAX checkout doğrulaması. Sonra kanıtla AGENTS ve teknik durumu kapat; fiziksel iPhone Safari testi, gerçek ödeme sağlayıcısı ve eski JPEG backfill ayrı açık kalır.

## Güncel çalışma — 0.1.94 native IconButton flex önceliği (CI ve gerçek kabul bekliyor)

15 Ekim 2026: 0.1.93 [CI+gerçek FTP 38720668607](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38720668607) ve beş canlı denetim başarılı; Codela eklentisi 1.1.1 değişmedi. Ancak [0.1.93 gerçek WP/Woo matrisi 38721596389](https://github.com/muhammetdkaya/codela/actions/runs/38721596389) ikon merkezleme kontrolünde başarısız: ikon SVG 22px ve margin=0 olmasına rağmen button sol üstünde kalıyor (centerX/Y=-10px). Gerçek WooCommerce `.woocommerce ul.products li.product a.button{display:inline-block}` seçicisi merkezi `inline-flex` kuralını eziyor. Ayrıca ayrı lazy testinde ürün görseli ile buton SVG'si ayırt edildi (test-only, Codela eklenti runtime değişmedi).

0.1.94: yeni buton veya paint kopyalamadan **aynı ortak** `components.css` IconButton deklarasyonuna yüksek özgüllüklü native Woo katalog seçicisi ekle. `tests/catalog-browser.cjs` Woo button `display:inline-block` kuralını da fixture'da simüle eder; Header/kart 44px & glyph merkez/22px regresyonu bunu kapsar. Sürüm yükseltmesi teknik notlarla takip ediliyor. **Bu commit CI, gerçek FTP, beş canlı denetim ve güncel kaynak+ZIP hash bağlı gerçek WP6.5/Woo9 ile WP7.1/Woo11 Chromium+WebKit matrisinden geçene kadar tamamlandı demeyin.** Fiziksel iPhone Safari ve gerçek ödeme sağlayıcısı ayrı kabul.

## Güncel çalışma — 0.1.93 düzeltmesi CI bekliyor

15 Ekim 2026: 0.1.92 kaynak fae7ca4 [CI+FTP](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38716613763), beş canlı kontrol ve WebKit ekran görüntüsüyle gerçekten canlıya alındı. Ancak 0.1.92 için yeni açılan [gerçek WP/Woo matrisi](https://github.com/muhammetdkaya/codela/actions/runs/38719692867), Chromium'da **native ikon merkezi hizası** kontrolünde başarısız oldu. WooCommerce'in ul.products a img kuralındaki 1em alt margin ortak SVG'ye de uygulanıyordu; sentetik browser CSS bu native kuralı içermiyordu.

0.1.93 çalışması: yeni buton/painter/JS kurmadan mevcut components.css IconButton glyph kuralında margin:0, display:block, flex:none. Katalog fixture'ına gerçek Woo genel resim margin kuralı ve 0px glyph-margin regresyonu eklendi. Header/dock/format/galeri yerleşimi, Woo AJAX/URL/ARIA değişmez. **CI, gerçek FTP, canlı WebKit ve 0.1.93 ZIP kaynak/hash pin'li yeni WP6.5/Woo9 ile WP7.1/Woo11 Chromium+WebKit testleri tamamlanmadan kapatma.** Plugin Codela 1.1.1 değişmedi.

## Güncel çalışma —0.1.92 test/yayın bekliyor

15 Ekim2026: tema0.1.91→0.1.92 hazırlanıyor; Codela1.1.1 değişmedi. Katalog simple/variable native düğmesi artık Header ile aynı IconButton sınıf/içerik yardımcılarını ve components.css deklarasyonlarını kullanır. Karttaki ::before SVG ve ayrı44px/ikon geometrisi kaldırıldı; native URL/AJAX/data/ARIA korunur. Ortak glyph22px, hedef44px,soft yüzey,scale1.08,focus/disabled/erişilebilirlik aynı. Native loading/added göstergesi ortak glyph slotunda; grouped/external metinli Button kalır. Yeni JS yok. CI,gerçek FTP,canlı ve yeni paket native kabulü bekliyor.

Sıradaki iş: CI/gerçek FTP ve canlı IconButton merkez kontrolü; yeni paketle native Woo matrisi; ardından bu kaydı kanıtlarla kapat.

## Önceki doğrulanmış devam noktası —0.1.91 canlı

15 Ekim2026: **tema0.1.90→0.1.91 canlı**, Codela1.1.1 değişmedi. [Kaynak eadd2c55](https://github.com/muhammetdkaya/codela-storefront/commit/eadd2c55043b31083a7c209271946db5b32daee7), [CI+gerçek FTP38712509087](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38712509087) başarılı; gerçek deploy09:26:31Z.

Ürün adları temanın sans-serif ailesi13/14px500, fiyat16/17px500. Tek beyaz kartta dış çizgi kaldırıldı; footer ayırıcı surface-muted. Native secondary Button mevcut sf-ui-surface ortak materyaline bağlandı; açık dolgu, saydam kenar, inset olmayan gölge ve opaque/forced-colors fallback'leri aynı deklarasyonlardan gelir.44px, native SVG/Woo URL/AJAX/ARIA ve1360px katalog korunur; yeni JS/bağımlılık yok.

CI PHP/JS/paket ve tüm Chromium regresyonları başarılı; katalog5 bağlam×5 genişlikte sans-serif/500/ince ayırıcı/tek düğme yüzeyi doğrulandı. Canlı WebKit38712961618, shell38712961983, galeri38712961912, belge38712961878, performans38712962046 başarılı. Gerçek Türkçe ürün arama görüntüsü incelendi; home/search/product CSS0.1.91 doğrulandı. Hız artış yüzdesi iddia edilmez.

Gerçek WP/Woo yeni91 matrisi: [38713426329](https://github.com/muhammetdkaya/codela/actions/runs/38713426329) başarılı: WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1, Chromium/WebKit13'er check (4/4 ortam52 kayıt). Test kaynağı597f6b2260d3e581e4e1899fac4a07d2fe71bb8c;91 ZIP SHA25646a31a2e34ccb3e52ea07440dce6ef56e5042706dbb93382e97e2bd1075bfa7e. İlk38713073692 çalışması gruplu ürünün90'dan beri tam satırda olan metinli aksiyonunu yanlış biçimde kompakt düğme saydı; test kompakt/simple-variable ve metinli/grouped-external yerleşimlerini ayrı doğrulayacak şekilde düzeltildi, aynı91 tema paketi yeniden başarılı sınandı..
Kalan: kullanıcının yeni fiziksel cihaz görsel kabulü, gerçek ödeme sağlayıcısı/üçüncü taraf medya ve kullanıcı istemeden yeniden giriş istenmeyecek eski JPEG backfill.

## Önceki doğrulanmış devam noktası —15 Ekim2026 /0.1.90 canlı

- **0.1.90 canlı:** [kaynak 104b853d](https://github.com/muhammetdkaya/codela-storefront/commit/104b853d62ee73099923ecf0b35a0e79ebb8008f); [CI ve gerçek FTP 38709075916](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709075916) başarılı (ikinci test denemesi); canlı WebKit [38709787224](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787224), galeri [38709787332](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787332), shell [38709787200](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787200), belge [38709787245](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787245), performans [38709787212](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38709787212) başarılı. Codela eklentisi1.1.1 değişmedi.
- Ortak katalog için koyu ürün başlıkları, fiyat üstünde1px ayırıcı, native Button üzerinde mevcut shopping-bag.svg 44px yuvarlak aksiyon, varyasyon için mevcut arrow-right.svg; Woo AJAX/data/ARIA, sepet, stok kontrolü ve tek native kart korundu. 1360px üst sınır, mobil kenarda12px. 320px dahil fiyat/buton sütun hizası kalıcı browser testinde doğrulandı. Yeni JavaScript, çift kart, ikinci görsel zemini yok.
- **Kalan:** fiziksel iPhone Safari (ikonun gerçek dokunma/renk/toolbar kabulü), gerçek ödeme sağlayıcısı ve üçüncü taraf görsel ortamı; eski JPEG admin backfill ancak yetkili oturum ve yedekle. Sıradaki tasarım işi için0.1.90 kart altyapısını yeniden kurma.


- Tema0.1.88→0.1.89 **canlı**: [son kaynak 4f162237](https://github.com/muhammetdkaya/codela-storefront/commit/4f162237ae5f323c50f3720582de82591cde92fb); [CI+gerçek FTP 38688395197](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38688395197) başarılı. Beş canlı denetim: WebKit, navigasyon, galeri, performans, belge sürekliliği başarılı. Eklenti1.1.1 değişmedi.
- Ortak native ürün kartı: **tek beyaz 20px yüzey**, hafif tek sınır/gölge, şeffaf kare görsel, içeride başlık+native fiyat+ortak secondary Button kapsül. 320px dahil mobilde fiyat ve aksiyon yan yana, minimum44px dokunma alanı; yeni JS/HTML/yeni paint primitive yok. Home/shop/category/product search/related/upsell/cross-sell tek CSS. Stoksuz ve native varyasyon/indirim/sepete ekleme davranışı korunur. Fiziksel iPhone kabulü ve eski JPEG admin backfill ayrı.


- Tema0.1.87→0.1.88; [kaynakd64106c4](https://github.com/muhammetdkaya/codela-storefront/commit/d64106c4d12e58e57d459eb802d5238c7a5a568b), [CI+gerçek FTP38678440344](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38678440344) başarılı; deploy03:54:21.1422094Z. Eklenti1.1.1 runtime/WordPress.org değişmedi.
- Ortak native kart home/shop/category/ürün arama/related/upsell/cross-sell:1:1 contain/şeffaf dış yüzey, küçük iki satır normal başlık, native fiyat+mevcut44px secondary Button aynı footer'da. Simple Ekle, variable Seçenekler; grouped/external native metinleri korunur. Stoksuz badge var, satın alma/Read more aksiyonu yok. Sahte renk noktası/puan yok.
- Tek content-product.php ve native hook/URL/AJAX/data/ARIA korunur. components.css aynı Button deklarasyonlarını sf-content'e bağlar; catalog.css boyut/hiza. Google grid aynı primitive specialization içinde korunur; signed-in Codela hesap dışlanır. Yeni JS/kopya paint/controller yok. Header87 Cart/Menu44×44 ve tek store/dialog/dock değişmedi.
- [88 kabul/ham sonuç](docs/acceptance/2026-10-15-catalog.md): tüm CI/beş canlı gate başarılı. Gerçek Türkçe WebKit ekranı incelendi; yeni kart/stockless/secondary ve Header eşitliği doğrulandı. Yeni gerçek WP6.5.5/Woo9.0.2 ile WP7.1.3/Woo11.2.1, Chromium/WebKit13'er check (4/4 ortam,52 kayıt). Test kaynağıb684671cfad86573043da579a32760e25d395e1f; paket/hash/source pin'i güncel.87 kanıtı88 sayılmadı.
- Bu uygulama/yayın/test tamamlandı; yeniden başlatma. Sonraki iş kullanıcının görsel beğeni onayı ve fiziksel iPhone Safari/GPU/toolbar/safe-area kabulü. Eski JPEG canlı admin backfill (kullanıcı istemeden giriş isteme), gerçek payment-provider ve üçüncü taraf medya kabulü açık. Dondurulmuş0.1.1 tema değişmez.

## Başlangıçta okunacaklar

1. Bu dosya ve [güncel teknik durum](docs/storefront-theme.md).
2. [Ortak tasarım sözleşmesi](docs/design-system.md).
3. [Mimari rapor](docs/architecture-review-2026-10-12.md) ve [uygulama rehberi](docs/architecture-remediation-guide-2026-10-12.md). Bunlar tarihli bulgulardır; güncel kaynakta yeniden doğrulayın.
4. Açık PR'lar, HEAD ve ilgili testler. Yerel/eşzamanlı değişiklikleri koruyun; eski SHA'yı zorla main'e taşımayın.

## Sahiplik ve ortak tasarım

- Tek Interactivity store, tek native dialog, tek dock. `assets/storefront.js` bileşim noktası; search/cart/overlay/dock ayrı controller'lardır. Yeni controller/SPA/router veya ikinci sepet motoru kurmayın.
- Tüm tema düğmeleri `inc/ui.php`, `assets/styles/tokens.css`, `assets/styles/components.css` içindeki Button/IconButton/pressable sözleşmesini kullanır. Sayfa CSS'i yerleşim ve mevcut token override'larını sağlar; yeni kopya paint/pressed/focus kuralları eklemeyin.
- Tema guest hesabı ve mağaza görünümünü yönetir. Oturum açmış Codela hesap/sipariş/adres/kargo paneli eklentiye aittir; `.codela-my-account-layout` kapsamına ortak tema form/card/nav stilleri taşımayın.
- Kaynak isimleri platform/cihaz adlarından bağımsızdır. Standart semantik HTML, reduced-motion, 44px hedefler ve erişilebilir isimler korunur.
- **Ortak UI kapsamı:** 0.1.52 Button/IconButton büyüme, esnek bırakma ve saydam yüzey kuralları tokens/components içinde uygulanmıştır. Güncel HEAD kontrolü yapın; F5 için bu stilleri geri almayın veya sayfa CSS’ine kopyalamayın. Yayın kanıtı üstteki devam noktasında tutulur.

## Her yeni tema çalışmasına başlarken

1. Bu dosyayı ve `docs/storefront-theme.md` dosyasını oku.
2. Güncel dalı, son commitleri ve ilgili kodu incele. Belgelerdeki tarihli durumun hâlâ geçerli olduğunu doğrula; tamamlanmış işleri yeniden yapma.
3. Kullanıcıdan burada kayıtlı tercihleri tekrar anlatmasını isteme. “Codela temasına devam” talebinde aşağıdaki sıradaki işlerden ve güncel durumdan devam et.
4. Her anlamlı çalışma sonunda `docs/storefront-theme.md` içindeki durum, testler, eksikler ve sonraki adımı güncelle. Kalıcı ürün kararları değişirse bu dosyayı da güncelle. Yapıldı, test edildi ve canlıya dağıtıldı durumlarını birbirine karıştırma.

## Her gerçek sürüm yükseltmesinde zorunlu kapanış

Bu kural tema ve eklentinin gerçek sürüm yükseltmeleri için geçerlidir; kullanıcının hatırlatmasını bekleme.

- Sürüm koduyla birlikte bu dosyanın **Son doğrulanmış devam noktası** bölümünü ve ilgili teknik durum belgesini güncelle. Tema için belge `docs/storefront-theme.md` dosyasıdır.
- Tarih, ilgili bileşen ve eski → yeni sürüm numarasını yaz. Tema ile eklenti sürümlerini ayrı belirt.
- **Biten işler:** bu sürümde gerçekten tamamlanan değişiklikleri somut olarak yaz; bitenleri sıradaki iş listesinden çıkar.
- **Doğrulama:** yapılan testleri ve sonuçlarını, yapılmayan kontrollerden ayır.
- **Yayın durumu:** kodun commit/tag bağlantısını ve varsa dağıtım/yayın sonucunun kanıtını kaydet. Kodun hazırlanması, paketin yüklenmesi, temanın etkinleşmesi ve WordPress.org yayını farklı durumlardır.
- **Kalanlar:** bilinen eksikleri, hataları ve engelleri açıkça yaz.
- **Sıradaki iş:** bir sonraki sohbetin doğrudan başlayabileceği somut ilk işi ve tamamlanma ölçütünü belirt.
- Sürüm commit'inde yalnız o anda doğrulanmış bilgileri yaz. Commit SHA veya dağıtım sonucu sonradan belli olursa belgeleri takip eden bir dokümantasyon commit'iyle tamamla; bekleyen ya da başarısız yayını başarılı gösterme.
- Bu iki durum kaydı güncellenmeden sürüm çalışmasını tamamlandı diye kapatma. Çalışma yarıda kalırsa mevcut aşamayı ve devam adımını kaydet.
- Ayrıntılı sürüm geçmişini teknik belgede koru; AGENTS.md içindeki devam noktası en güncel durumu kısa ve tutarlı biçimde göstermeli.
- Yalnız dokümantasyon değişikliği için ürün sürümünü artırma veya yeni ürün yayını başlatma. Bu kayıtlar yeni bir yayın yetkisi vermez.

## Tema için kalıcı ürün kararları

- Öncelik sırası: **hız → sağlam altyapı → kullanım kolaylığı → görsel tasarım**. Renkler ve görünüm değişebilir; altyapı bu önceliklere göre kurulmalı.
- Mobil uygulama hissi; hızlı tepki, tutarlı gezinme ve düzgün geçişler demektir. Bu his için gereksiz kod, ağır bağımlılık veya SPA/headless mimarisi ekleme.
- Modern WordPress blok tema, theme.json ve Interactivity API kullanılır. Sepet işlemlerinde WooCommerce Store API esas alınır; para, stok ve miktar hesabının kaynağı sunucudur.
- **Tema Codela eklentisine bağımlıdır; eklenti temadan bağımsız çalışır.**
- Tema ayarları mevcut Codela ayar sayfasında yönetilir. Ortak görünüm ayarları yeniden oluşturulmaz.
- Tema ayarlarının altında Header (Üst alan), Footer (Alt alan) ve geliştirilen diğer bölümler için ayrı alt menüler bulunmalı; tüm ayarları tek uzun forma yığma. Bir tema bölümü geliştirilirken gerekli ayarları aynı çalışmada ilgili alt menüye ekle; temanın tamamlanmasını bekleme.
- Küçük değişikliklerde de mevcut codela.dev otomatik dağıtımı açık kalır. Bağlantılı değişiklikleri topluca yap, yalnız ilgili dosyaları incele ve dağıtım sonuçlarını gereksiz tekrarlarla sorgulama. WordPress.org yayını ayrı yetki gerektirir.
- Tasarım sade ve ürün odaklıdır. Kullanıcının aradığı özgünlük, karmaşık veya bilim kurgu dekorları eklemek anlamına gelmez. Sayfaları kullanım amacı ve örneklerle değerlendirerek tek tek geliştir.
- Header: mobilde logo solda, Menü en sağda sabit konumdadır. Alt menü varsayılan açık, Header ayarından kapatılabilir. Üründe satın alma alanı dock yerini aldığında sepet menünün hemen solunda görünür; arama ve hesap menüden erişilir. Satın alma formu olmayan üründe açık dock korunur. Alt menü kapalıysa mevcut araçlar üstte kalır; masaüstü menü/orta marka/sağ araçlar düzeni korunur.
- Menü, arama ve sepet aynı görsel/etkileşim dilinde **tam ekran** açılır. Onaylanan yön Apple örneğindeki tam ekran menüdür; sayfayı yana iten menü önceki alternatifti.
- Menü/arama/sepet aynı native dialog içinde açılır. Güncel kaynakta dialog geometrisi sabit kalır; overlay controller içerik geçişlerini ve Menu/X açma-kapama zamanlamasını yönetir. 0.1.35 ile gelen aynı DOM düğmesinin animasyonlu Menu/X dönüşümü korunur; eski “kapatma bekletmez” notuna dönülmez. Dialog'a ikon kökenli büyüme uygulanmaz. Hareket azaltma tercihi, klavye, odak ve kaydırma konumu korunur.
- Arama hızlı ve doğru olmalı; gecikmiş eski sonuç yeni sorguyu ezmemeli. Mevcut sürümün yazım hatası toleransı olmayan aramasını gelişmiş arama gibi tanıtma.
- Tutarlı ikon dili: Lucide temelli 24×24 çizim alanı, 2 birim çizgi, yuvarlatılmış uç/köşe ve tek renk. Temada yalnız kullanılan yerel SVG dosyaları yüklenir; tüm paketi, ikon fontunu, CDN veya ikon JavaScript çalışma zamanını ekleme. Eklentinin mevcut SVG maskeleri korunur; yeni/değişen ikonlar bu standarda kademeli geçirilir. Yönetim ikon CSS dosyasını mağazaya yükleme.
- Ana sayfa, hakkımızda ve iletişim içerikleri kullanıcı tarafından rahatça düzenlenebilmelidir. İçerik düzenleme deneyimi henüz kesinleşmedi; mevcut WordPress metin/blok alanının tek başına kullanıcı ihtiyacını çözdüğünü varsayma. Elementor veya başka ağır bir sayfa oluşturucuyu kendiliğinden ekleme.
- Ürün, mağaza, sepet ve ödeme sayfalarının standart tasarımını tema yönetir; bunlar için kullanıcıya sayfa oluşturucu düzenleme zorunluluğu getirme.

## Depo ve yayın sınırları

- Güncel tema kaynağı bu depoda: `theme/codela-storefront/`.
- Eklenti ayarları, REST köprüsü ve yükleyici `muhammetdkaya/codela` deposunda kalır.
- Eski eklenti paketindeki 0.1.1 tema kopyası yalnız dondurulmuş ilk kurulum yedeğidir; tema değişikliklerini oraya tekrar yazma.
- `muhammetdkaya/codela-site` tanıtım temasını değiştirme.
- Küçük tema değişiklikleri bu deponun bağımsız dağıtımıyla canlıya gidebilir. Gerekli ayarları ilgili eklenti alt menüsüne aynı geliştirme kapsamında GitHub'da ekle; eklenti ayar değişikliklerini ara ara toplu yayınla.
- Şifreleri kodda, belgede veya günlükte tutma.

