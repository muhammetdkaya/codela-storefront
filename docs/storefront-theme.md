# Codela Storefront — güncel teknik durum

## 17 Ekim 2026 — 0.1.130 ürün galerisi ziyaretçi metni ilk fotoğrafla birlikte kayar (CI bekliyor)

0.1.129 hâlâ `position:fixed` olduğundan ziyaretçi satırı sabit kalıyordu. Orijinal canlı Codela plugin elemanı, önceki `product-information.js` hareketi yerine native `.woocommerce-product-gallery__wrapper > .woocommerce-product-gallery__image:first-child` içine taşınıyor. Görseliyle scroll olur; `sf-product-gallery-count` `1 / 5` ise zaten canlı mevcut nesnedir, tekrar yaratılmaz, kendi güncellenmesi korunur. İlk fotoğraftaki ziyaretçi sayısı x=72px, görselin alt hizasında indeksle tek satır ve 12px/18px aynı stil; **background:none**, gölgesiz/çizgisiz/butonsuz, ayrıca ikon gizli. Mobil CSS viewport-fixed tamamen kaldırıldı; desktop/no-js rail çakışması engellendi. Detay açıkken gizli ve ilgili ürün geçişinde fotoğrafa bağlı zaten görünmez. 320/390/700 gerçek 3-foto browser düzeni ve scroll-test eklendi; Codela API ya da ek kod yok. PR CI ve canlı FTPS henüz doğrulanmadı.


## 17 Ekim 2026 — 0.1.129 küçük ziyaretçi bilgi etiketi (canlı doğrulandı)

Safari ekranındaki ziyaretçi sayısı, `components.css` ortak buton GlassSurface yüzeyi yüzünden ürün görseline hakim beyaz/gölgeli kapsül halinde görünüyordu. Bu **etkileşimsiz bilgi öğesi** ortak buton yüzeyinden çıkarılıp `product.css` altında 24px civarında, düşük opaklıklı saydam yüzey, gölge/border/blur olmadan, 11px yazı ve 13px gözle tanımlandı. `cdl-lv` gerçek plugin HTML'i ve AJAX canlı sayaç korunur, header/gallery/panel geometrisi ve görsel kaydırma kodu değişmez, açık sheet'te görünmez. 320/390/700/900/1280px Playwright CSS kontrolü eklendi. PR CI, main CI ve gerçek FTPS başarılı. Fiziksel Safari son görsel kabulü ayrıca gerekli.



**Doğrulanmış yayın:** [PR #47](https://github.com/muhammetdkaya/codela-storefront/pull/47) ana dala [48dca650](https://github.com/muhammetdkaya/codela-storefront/commit/48dca650395ab25ad60fa56f86de89d8f165f88d) ile birleştirildi. [PR CI #39052714898](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39052714898) ve [main CI + FTP #39052882271](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39052882271) başarılı; dağıtım 2026-10-17 17:18:14Z `Storefront deployed; checks passed.` mesajını üretti. Plugin değişmedi. Son kontrol: gerçek iPhone Safari görüntüsü.

## 17 Ekim 2026 — 0.1.128 dönüşüm modülleri ile kapalı panel kompaktlığı (canlı doğrulandı)

Gerçek Safari fotoğrafında `sf-product-price-row` içinde bulunan native `.cdl-ub` stok ve sayaç mesajları fiyat sağ sütununu dikey uzatıyor, title aşağıya kayıyor ve satın alma butonları üzerinde fazla boşluk oluşuyor. Mobil panelde orijinal `.sf-product-price-row` yalnız görsel düzende `display:contents` yapılıyor: ürün adı + Woo satış fiyatı birinci CSS grid satırında, stok ve canlı countdown ikinci kompakt satırda; countdown metnindeki opsiyonel uzun prefix sadece görselde gizli, gerçek DOM/veri/ekran okuyucu içeriği korunuyor. Bu düzen prepaint native summary ve JS ile taşınan başlıkta aynı, forma ve galerinin baş/son geometri bağına dokunmadan. Demo testine iki araç birden, tek stok, tek timer, 320/390/700 px, gecikmiş async mount ile ilk/son yükseklik ve geri sayım değişimi eklendi. PR #46 ve ana dal testleri geçti; **0.1.128 gerçek FTPS canlı yayında**. Fiziksel Safari görsel doğrulaması ayrıca gerekli.



**Doğrulanmış kapanış:** [PR #46](https://github.com/muhammetdkaya/codela-storefront/pull/46) [475cf0c9](https://github.com/muhammetdkaya/codela-storefront/commit/475cf0c9243c943347aee841bc83634c1e15eb97) ana dala birleştirildi. [PR tarayıcı + paket CI #39046339730](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39046339730) başarılı; `PRODUCT_FIRST_PANEL` ilk/son aynı `166px`, `PRODUCT_PREPAINT_FRAME` kayma `0px`; stok+sayaç, yalnız stok, yalnız sayaç 320/390/700 kabulü başarılı. [Main CI + gerçek FTPS #39046507763](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39046507763) başarılı; canlı log 2026-10-17 15:49:59Z `Storefront deployed; checks passed.` dedi. Codela eklentisi 1.1.1 değişmedi. **Sıradaki iş:** kullanıcı gerçek Safari görsel onayı; başka bir alanda yeni iş gelmedikçe bu modülleri yeniden tasarlama.

## 17 Ekim 2026 — 0.1.127 WhatsApp iletişim ve sipariş güvencesi düzeni (canlı)

Kullanıcının ürün detay paneli Safari görüntüsünde WhatsApp bağlantısı ayrı ikon/etiket ve mavi emoji ok, güvence öğeleri ise havada duran 2×2 sütunlar olarak görünüyor. Tek orijinal plugin WhatsApp `<a>` öğesi 64px tam genişlikli temas satırı, ortak soft IconButton ve mevcut `arrow-right.svg` maskeli çıkış oku ile düzenlendi. Güvence modülü özgün merchant label/SVG/resim ayarları, dinamik açılıp-kapanma ve sıra korunarak tek `cdl-tb` kapsayıcıda ince çerçeve ve iç çizgilerle toplandı (mobil iki, desktop dört sütun). Product sheet içindeki 20px kenar payı, ikinci yüzey yerine hafif token temelli tint, 44px özgün IconButton, galeri, Woo native form, kapalı ilk kare aynı. Yeni eklenti kodu/JS/üçüncü parti bağımlılık yok. Mobil 320/390/700px expanded-sheet regresyonu test dosyasına eklendi. **PR CI, main CI ve gerçek FTPS doğrulandı.** Fiziksel Safari görsel kabulü ayrıca kullanıcıdan beklenecek.



**Yayın kapanışı (17 Ekim 2026):** [PR #45](https://github.com/muhammetdkaya/codela-storefront/pull/45) ana dala squash birleştirildi ([5ea321f3](https://github.com/muhammetdkaya/codela-storefront/commit/5ea321f3c45cc17f76553a0dbff470553d9eadc5)). [PR CI #39044005642](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39044005642) tüm paket/PHP/JS ve browser ürün görünümü testleri başarılı. [Main CI + gerçek FTP #39044160532](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39044160532) başarılı; deploy günlüğü 2026-10-17 15:19:26Z `Storefront deployed; checks passed.` dedi. Kullanıcının fiziksel mobil Safari görsel onayı ayrı kaldı. **Sıradaki iş:** Kullanıcı yeni görsel istek gönderirse canlı fiziksel Safari görüntüsü ile doğrula; bu uygulamayı yeniden çoğaltma.

## 17 Ekim 2026 — 0.1.126 mobil ürün galerisi üç çember önizleme

Mevcut JS 5 görsel içinden aynı anda üç adet sağ dikey native IconButton gösteriyor. İstenen görünüm yalnız küçük önizlemelerde tam çemberdir; galerinin resim kaydırma/geçiş motoru değiştirilmez. `gallery.css` tek mobil product gallery selector'ında `border-radius:50%`, `aspect-ratio:1` uygular. Var olan 44px kontrol ölçüleri, `overflow:hidden`, `object-fit:cover`, alt bar, header ve materyaller korunur. `product-sheet-browser.cjs` üç kontrolün eş çapta kare geometri/50% yarıçap/kırpmaya sahip olduğunu 320/390/700'de doğrular. CI ve canlı galeri/WebKit geçmeden canlı tamamlandı denmez.


## 17 Ekim 2026 — 0.1.125 dinamik ürün paneli ilk kare yüksekliği

Önceki aşamada panel tasarım eşitliği sağlandı, ancak native prepaint CSS'te 157px sabit yükseklik var; JS finalinde gerçek heading (urgency badge bulunan/bulunmayan), Woo footer ve 8px üzerinden dinamik height hesaplanıyor. Gerçek Kavis gibi badge olmayan ürünlerde başlangıç yüksek ve mount sonrası kısa görünmesi olası. Çözüm ilk panelin yüksekliğini gerçek DOM içerik ölçülerinden intrinsic CSS grid ile hesaplamak (magic height yok); son JS ölçümü varlığını korur. CI: 320/390/700 genişlik, iki farklı price badge durumu ve kısa başlıkta 3px altı yükseklik/Y farkı, gecikmiş async, görsel ve kontrol tasarım eşitliği. GitHub canlı doğrulama ve kullanıcı Safari gözlemi olmadan bitmiş kabul etme.


## 17 Ekim 2026 — 0.1.124 ilk-kare cam yüzey ayrışması

0.1.123'te orijinal Woo satın alma formu ilk kareden itibaren gösterildi ancak fiziksel Safari 12:24 ekranında yeni sorun ortaya çıktı: ilk `.summary` paneli 999px pill biçiminde ve `.sf-product-purchase` ikinci beyaz cam katmanıyla; nihai `.sf-product-sheet` ise 20px normal köşeli, footer şeffaf. Tek kaynak `components.css` generic glass primitive selector grubuna native `.summary` ve footer'ın eklenmesiydi; 0.1.123'te tasarım gerçekte tek kaynak değildi. 0.1.124'ta generic pill yüzeyinden pending summary ve gerçek sheet ayrılıp ortak tek panel surface/material tanımında buluşturuldu; doğal `.sf-product-purchase` sadece panelin içinde, pending ve mounted hâlde tek kural ile şeffaf. Yineleyen `product.css` radius kaldırıldı. İlk/son malzemenin CSS computed style değerleri, panel geometrisi ve tek form Playwright testi ile kabul edilmelidir. Özellik/HTML/ürün galerisi değiştirilmez. Fiziksel Safari ve canlı performans ayrı doğrulanır.


## 17 Ekim 2026 — 0.1.123 gerçek ürün panelinin ilk çizimi

Önceki 0.1.122 tasarımı yenilemede hâlâ boş alt alan gösteriyordu. Nedeni template içeriğinin JS olmadan görünür olmaması ve orijinal Woo summary ve formun gizlenmesiydi. 0.1.123 gerçek server Woo başlık/fiyat/cart formunu pending ilk kareden itibaren aynı sabit panelde gösterir, JS gelince zaten var olan tek düğüm kümesini mevcut galeri/panel sistemine taşır. Dummy CTA/form/başlık veya ayrı overlay eklenmez. Mevcut cam malzeme merkezi shared surface CSS üzerinden kullanılır; desktop/no-JS doğal davranış değişmez. Gecikmiş klasik(4.3s) ve async adaptörde gerçek ilk panel title/form görünürlüğü CI ile doğrulandı; ilk/final panel y farkı0.078px, quantity genişliği aynı122px, CTA196→198px. PR#41 CI39019636478, ana dal+FTP39019817450 başarılı. Canlı WebKit39020037025, galeri39020037036, shell39020037013, continuity39020037024 başarılı; gerçek Kavis ürününde CSS0.1.123 ve tek native form tespit edildi. Canlı performans sonucu ve fiziksel Safari yenilemesi ayrı kabul kriteri olarak açık tutulmalı.


## 17 Ekim 2026 — Canlı performans son kabul eksik
Canlı mobile product medyan LCP 3.528s (önceki PNG15.668s), cold CLS 0.1763 (warm0); home cold LCP14.096s. [39017705647](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39017705647) bütçesi başarısız. **İlk karede raw Woo flash'ı önleyen 0.1.122 tek başına bütün CLS kaymasını düzeltmiş sayılmaz.** Belirsiz CLS kaynağını source-node/önce-sonra geometrisiyle açıklamadan yama uygulama; [Issue #40](https://github.com/muhammetdkaya/codela-storefront/issues/40) kabul gereksinimi. Mevcut tasarım, tek native form, WebP media ve galeri geçişleri korunsun.

## 17 Ekim 2026 — 0.1.122 ürün ilk kare sürekliliği

Kullanıcının iki mobil Safari ekran görüntüsü: yenileme sırasında native Woo ürün başlığı/fiyat/özet formu görünüyor, JS gecikince panel ve dikey galeri yeniden yerleşiyor. Kök sebep bootstrap'ın DOMContentLoaded'da koşulsuz sınıf kaldırması; mount olmadan ilk karede farklı native galeri geometrisi. İlk karede aynı galeri CSS'si pending ve ready için paylaştırıldı; script öncesi başlık ve satın alma alanı kapalı kalır. Mount DOM ve özgün formu tek kez taşır. Başlangıç koruması sadece mount, gerçek script hatası veya load güvenli fallback'ında sonlanır; Woo template yoksa DOMContentLoaded'da native görünür. Hiç JS olmayan tarayıcıda Woo native sayfa çalışmaya devam eder. CSS/panel renk/ölçü/token/işlev değişikliği hedeflenmez. Yeni async adapter sonrası DOMContentLoaded yarış testi eklendi; PR #39/69e607ce ana dal CI+FTPS [39017375492](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39017375492) başarılı; gerçek ürün [galeri39017705845](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39017705845) ve WebKit/shell/continuity postdeploy kontrolleri başarılı. Galeri CSS0.1.122 ve WebP kaynağını kullanıyor. Geç async senaryosunda fotoğraf ölçü farkı 42.9px→0.078125px; orijinal Woo başlık/CTA hiç görünmüyor ve tek native form korunuyor. Mobil Safari fiziksel cihazda yenileme kullanıcı kabulü ayrıca bekliyor; [canlı performans39017705647](https://github.com/muhammetdkaya/codela-storefront/actions/runs/39017705647) sonucu ayrı okunmalıdır.


## 17 Ekim 2026 — 0.1.121 tasarımı koruyan medya teslimi (canlı doğrulandı)

Önceki ürün sayfası mimari incelemesinde ayrı ürün sheet (satın alma) ve genel dock arasında farklı etkileşim sistemleri, galeri discovery kök scroll-snap sınırı ve canlı PNG kaynaklı yükleme dar boğazı görüldü. 121 kapsamı **görünümü değiştirmeyen** minimal düzeltmeyle sınırlı: ürün grip'i paylaşılan basma motion token'ını kullanır, mevcut 44px native kontroller/hiyerarşi/galeri aynı kalır. PNG ürün fotoğrafları için güvenli WebP bakım yolu eklendi. JPEG mevcut rutinleri korunur; PNG'de orijinal ve Woo zoom-linki korunur, yalnız yöneticinin bakım işlemi sonrası WebP srcset uygulanır. WebP yüklenemezse mevcut PNG üzerinden çalışır. Var olan geçmiş medya otomatik dönüştürülmez; WordPress Media > Image Optimization çalıştırılmalı. Bu işlem henüz canlıda çalıştırıldığı doğrulanmamıştır. PR #38 ana dala birleştirildi (e2d9c3b4); CI+gerçek FTP 38991005586 başarılı. Yayın sonrası canlı galeri38991335384, WebKit38991335489, shell38991335499 ve document38991335405 başarıyla tamamlandı. Ürün galerisi gerçek CSS0.1.121/5 görselle geçti, geçiş drift0/reverse0; kod ve canlı tema dağıtımı kabul edildi. PNG optimizasyonu, bekleyen ayrı yönetici bakım adımıdır. 120 canlı LCP soğuk mobil medyan15668ms, orijinal PNG ~2.13MB; 121 üzerine ölçülmüş iyileşme sayılmaz. Büyük kod temizliği/değişiklikleri ayrıca fonksiyonel test ve cihaz kabulü gerektirir.


## Son doğrulanmış devam noktası — 17 Ekim 2026 / Storefront 0.1.117 → 0.1.120

**120 canlı:** ürün sheet köşeleri ortak control radius+8px; üst tutma çizgisi ve alt satın alma kontrolü kenar payları12px. Chevron kaldırıldı; erişilebilir gerçek70×44px tutma çizgisi toggle'ı ve doğrudan sürükleme korunur. Native Sepete Ekle44px yüksekliğe/200px azami hedefe, qty input44px/32px ölçüye küçüldü; −/+44px dokunma hedefleri aynı. Galeri/ilgili ürün geçişinde başlık, stok ve header sıkıştırması kaldırıldı; başlık–satın alma mesafesi ve kapalı panel yüksekliği sabit. Tek native form, özgün qty/submit, Footer dışarıda, ortak yüzey ve galeri akışı korunur. Eklenti **1.1.1 runtime/WordPress.org değişmedi**.

**Kaynak/yayın:** [120 kaynak9edae45b](https://github.com/muhammetdkaya/codela-storefront/commit/9edae45b07a605daf64df03952efd84105760eae), [CI+gerçek FTP38986579521](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38986579521) başarılı. ZIP SHA256 `24318e848d4c206f8014e2397c63fd85790c6e2013907f67c194c74911ae8da2`; source/version manifest aynı. PHP/JS/24 paket ve bütün theme browser kontrolleri geçti.320/390/700'de eşit panel yüksekliği ve başlık–purchase aralığı,44px CTA, ok yokluğu, dengeli12px purchase padding; gerçek touch drag/resize, native variation/validation, no-JS/prepaint ve responsive restoration geçti.

**120 yayın sonrası kabul:** [Galeri38986844272](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38986844272), [WebKit38986844259](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38986844259), [shell38986844242](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38986844242), [document38986844219](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38986844219) başarılı. Gerçek120 CSS,390px tek form/qty, sabit başlık–kontrol boşluğu,44px CTA/chevron yokluğu;390/1280 native galeri ve inline zoom geçti. WebKit kapalı sheet358×142px, açık/kapalı alpha.78, compact header/qty.96;120 açık panel ekran görüntüsü incelendi. Footer dışarıda ve alt sınır/geometri regresyonları geçti. Push anında eski119'u gören38986579464 final kabul yerine sayılmaz.

**118–119 kapanışı:** önceki117 quantity düzeltmesi BÜYÜK panel talebini karşılamıyordu.118 ortak sf-ui-surface--glass-panel varyantıyla tüm panel tint'ini .96→.78 yaptı; compact dock/header.96 kaldı. Bu kasıtlı yoğunluk farkıdır, birebir alpha eşitliği veya kullanıcı görsel kabulü iddia edilmez.119 contain:layout yerine dock ile aynı identity translate3d+isolation yolunu kullandı; bu katman uyumu bir mitigasyondur, kanıtlanmış WebKit motor hatası değildir.119 [kaynakc745ee3a](https://github.com/muhammetdkaya/codela-storefront/commit/c745ee3aaaea5c5bdd3598ab691d003cafec3985), [CI+FTP38985771362](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38985771362), dört final canlı fonksiyon38986242775/38986242766/38986242816/38986242790 başarılı;119 açık WebKit görüntüsü de incelendi.119 ZIP `d5a2af7fd9702d42055b7142048c1dd114c56e9a47285c89dc71b80c4d476921`.120 bu materyali değiştirmez.

**Kalan/sıradaki:** bu kullanıcı isteğinin kod/yayın/otomatik fonksiyonel kabulü tamam. Yeni talep gelmedikçe paneli tekrar geliştirmeye başlama; güncel main'den devam et. Fiziksel iPhone Safari/GPU/toolbar ve algısal materyal kabulü ayrıca yapılmadı. Yeni izole gerçek WP/Woo matrisi çalıştırılmadı;114 runner/cross-repo engeli ve eski ağır PNG cold-LCP işi kullanıcı kapattığı kapsamdan tekrar açılmadı.119 performance audit38986242780 başarısızdı;120 ayrı audit fonksiyonel kabulden bağımsız, tüm gate'ler geçti denmez. Gerçek ödeme sağlayıcısı ayrıca test edilmedi.

## Son doğrulanmış devam noktası — 17 Ekim 2026 / Storefront 0.1.114 → 0.1.117

**İstenen düzenleme canlı:** ürün paneli açık/kapalı aynı ortak dock16px yan boşluk,430px azami genişlik ve4px alt mesafe+safe-area token'larını kullanır. Tek ortak components cam materyali korunur. Footer artık ürün paneline taşınmaz; özgün sayfa sonunda kalır, linkleri panelin arkasına düşmez. Hidden dock'un ikinci90px body reserve'i kaldırıldı. Yeni motor/form/bağımlılık yok. Eklenti **1.1.1 runtime/WordPress.org değişmedi**.

**Son kullanıcı görseliyle düzeltme:** ana sayfa/header/sheet canlıda aynı rgba(247,247,249,.96),blur10px,saturation1.15 almasına rağmen native quantity kapsülü product.css'ten ayrı #fff alıyordu.117'de o dolgu kaldırıldı. Quantity mevcut sf-ui-surface ile AYNI components selector grubunu (opaque/reduced-transparency/forced-colors dahil) kullanır; sheet de sf-ui-surface sınıfını taşır. Kopya paint veya ikinci purchase yüzeyi eklenmedi. Desktop quantity görünümü değişmez. CSS property eşitliği, farklı fotoğraf arka planlarında fiziksel Safari'de algılanan rengin birebir kanıtı değildir; bunun için kullanıcı görsel kabulü ayrı kalır.

**Kaynak/yayın:** [117 kaynak5869aa48](https://github.com/muhammetdkaya/codela-storefront/commit/5869aa4857a746179719b14af40477458d47cbe9), [CI+gerçek FTP38983793003](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38983793003) **başarılı**. Deterministik117 ZIP SHA256 `53a7ef613c98388a5049ebaf5c9b74dd31b25471888d1492fdbc9da1936f8cfb`. PHP/JS,24 paket ve bütün theme browser suite geçti.320/390/700 dock materyal/merkez/genişlik/bottom-gap, native qty/sheet renk eşitliği, gerçek navigation.css+hidden dock ile Footer tail0–28px ve geç Footer'ın panel dışında tek kalması sınandı; mevcut no-JS/slow-prepaint/touch/variation/validation/desktop restoration regresyonları korundu.

**117 yayın sonrası kabul:** [Galeri38984057891](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38984057891), [WebKit38984057791](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38984057791), [shell38984057798](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38984057798), [document38984057909](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38984057909) **başarılı**. Gerçek117 CSS,390/1280 tek form/native qty ve inline galeri; quantity ile sheet renk+blur eşitliği geçti. Mobil WebKit home dock/header ve product header/sheet aynı .96/blur10/shadow0 3px12 rgba(.1); panel358px×130px. Footer dışarıda ve son link–panel **24.234375px**;60-frame belge alt sınırı stabil, drift0/reverse0 ve native top refresh korunur. Push anı eski116'yı gören38983793158 final kabul yerine kullanılmaz.

**Ara paketler/kalanlar:**115 genişlik/Footer kodu CI+FTP geçti, native hidden dock90px fazlalığı canlıda yakalandı;116 düzeltmesi dört canlı fonksiyon testini geçti. Kullanıcının yeni fotoğrafı üzerine117'de ayrı quantity beyaz zemini kaldırıldı; eski115/116 kabulü117 yerine sayılmaz. [117 performans38984057919](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38984057919) son sorguda çalışıyordu; önceden açık ağır PNG cold-LCP bütçesi bu görsel işte düzeltildi denmez. Bu sınırlı görünüm değişikliği için yeni izole gerçek WP/Woo matrisi çalıştırılmadı;114 runner/cross-repo erişim engeli bu istekle yeniden başlatılmadı. Fiziksel iPhone Safari/ödeme sağlayıcısı ayrı.

**Sıradaki iş:** bu görünüm kodu, CI ve canlı fonksiyonel kabul tamam. Kullanıcının yeni görsel geri bildiriminden güncel HEAD/ortak UI sözleşmesiyle devam et; sırf dokümantasyon için sürüm yükseltme/yayın başlatma. Ayrı quantity beyaz dolgusu veya Footer'ı sheet içine taşıyan listener'ı geri getirme.

## Çalışma — 16 Ekim 2026 / 0.1.113 → 0.1.114 tekrar yenileme ve tutma düzeltmesi

Kullanıcı113 sonrası yenilemede eski düzeni ve panel tutarken yukarı/aşağı tepkiyi tekrar bildirdi.113 kabulü fiziksel cihaz için yeterli değildi. Head guard provisional mobil viewport genişliğine bağlı olmadan işaretlenir; CSS media query karar verir.4s zaman aşımı kaldırıldı; parsing tamamlanınca veya adapter script error'ında native fail-open. Uzun ağ beklemesinde eski summary/purchase yeniden açılmaz. Header64px (discovery52px), user-select/touch-callout:none;8px jitter eşiği, pointerdown'da mevcut animasyon yüksekliğini dondurma ve capture, gecikmiş release-click engeli (yeni kasıtlı press/klavye serbest), height-only toolbar resize sırasında drag iptal edilmez. Yeni bağımlılık/form/motor yok. Eklenti1.1.1 değişmedi.

Yerel JS syntax/24 paket kontrolü geçti. Yeni CI regresyonları4.3s bekletilen adapter, meta viewport öncesi gerçek mobile context, CDP gerçek touchStart/move/end jitter/ters yön/toolbar-resize ve gecikmiş click'i içerir. CI/gerçek FTP/canlı ve güncel paketli Woo kabulü henüz bekleniyor. Önceki113 kanıtı114 kabulü değildir. GitHub runner'a son retry'da ortam atandı; yeni çalışma sonucu ayrıca doğrulanacak.

## Son doğrulanmış devam noktası — 16 Ekim 2026 / Storefront 0.1.111 → 0.1.113

**Uygulandı ve canlıya aktarıldı:** yenilemede geçici native büyük başlık/açıklama/satın alma görünümü için erken, tek WordPress-queued adapter mount'u ve mobil pending/fail-open; native galeri ilk fotoğrafının opacity beklemesi kaldırıldı. Galeri→ilgili ürünlerde 15px başlık override'ı kaldırıldı. Mevcut alt panel pointermove sırasında parmağı cached sınırlar içinde anlık izler; ters yön ve bırakınca mesafe/hız snap'i, cancel/lostcapture/blur/resize/Escape temizliği, ilk mount transition engeli var. Kapalı panelde kargo/contact gizliliği korunur. Yeni bağımlılık, form/sepet/galeri motoru yok. Eklenti **1.1.1 runtime/WordPress.org değişmedi**.

**Yayın kanıtı:** [kaynak 3bb6f4cf](https://github.com/muhammetdkaya/codela-storefront/commit/3bb6f4cfb3985c3926b11fbf5ddeff5f546f36d2), [CI + gerçek FTP 38946967028](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38946967028) başarılı. Final ZIP SHA256 `0f7027824068190974822966c4a2e2893a766ecbd4600eda046f206e05738602`. Canlı ürün tarayıcısında CSS **0.1.113** ve tek `codela-storefront-product-information-js` doğrulandı (1363px desktop; bu mobil gesture kabulü değildir). Ara 112 sürümü final kabul yerine kullanılmaz.

**Geçen doğrulama:** final113 CI PHP/JS/24 paket ve bütün theme browser suite başarılı. Üretim PHP bootstrap/template streaming senaryoları, yavaş adapter/footer sırasında eski summary/purchase gizliliği, parser loading iken mount ve geç footer'ın tek taşınması, no-JS native purchase ve 4s fail-open; 320/390/700 genişlikte held-pointer100px/geri50px ve font paritesi mevcut native form/validation/variation/responsive/reduced-motion regresyonlarıyla geçti.

**Açık doğrulama engeli:** final FTP sonrası beş canlı koşu 38948170221 (WebKit), 38948170196 (shell), 38948170188 (document), 38948170176 (gallery), 38948170170 (performance) GitHub tarafından failure sonuçlandı; hepsinde runner_id=0 ve steps=[]: testler hiç başlamadı. Gerçek WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1 × Chromium/WebKit [matrisi 38947909603](https://github.com/muhammetdkaya/codela/actions/runs/38947909603), test-only kaynak [d5b6ac78](https://github.com/muhammetdkaya/codela/commit/d5b6ac78e8e6d0826c31ab653c4d1769841468b9), ilk ve yeniden denemede aynı biçimde runner atanmadan durdu; hiçbir113 Woo assertion'ı çalışmadı. Kesin GitHub nedeni mevcut connector'dan görülemedi; billing/quota diye tahmin edilmez. Tarayıcıdaki özel GitHub koşusu oturumsuz404 verdi; sırf ek teşhis için kullanıcıdan giriş istenmedi. Eski111 veya113 FTP öncesi canlı koşuları final113 kabulü sayılmaz.

**Sıradaki iş:** GitHub runner engeli çözüldüğünde aynı kaynak/hash ile yukarıdaki final FTP sonrası canlı koşular ve 38947909603 failed job'ları yeniden çalıştır; test loglarında113 paketini ve yeni held-pointer/font/parser-loading assertion'larını doğrula, sonra kabulü kapat. Kod ve dağıtım tamam; geniş canlı/Woo kabulü engelli. Fiziksel iPhone Safari toolbar/gesture ve önceden bilinen ağır PNG cold-LCP işi ayrıca açık. Yalnız bu belgeleri güncellemek için sürüm yükseltme/yeni dağıtım yapma.

## Önceki sürüm kaydı (111)

## Son doğrulanmış devam noktası — 16 Ekim2026 /0.1.111 satın alma paneli canlı

Tema **0.1.110→0.1.111 canlı**, eklenti **1.1.1 runtime/WordPress.org değişmedi**. Kullanıcının son görseli uygulandı: kapalı mobil panelde ücretsiz kargo metni/çubuğu ve inline WhatsApp yok. Tek native Woo qty + ortak quiet44px −/+ ve kompakt CTA; stok/min/max/readonly ve input/change olayları native input üzerinde. Açık panelde özgün ETA ve live shipping düğümleri native Teslimat ve kargo disclosure'ına, özgün WhatsApp linki ayrı bilgi satırına taşınır. Etkin taksit/native bilgi/yorum callback'leri aynı, kapalı modül üretilmez. Mobil bilgi bölümleri başlangıçta kapalı; desktop'a dönüşte özgün node/form/konumlar geri gelir. Örnek tarih/stok/iade metni veya yeni modül hesabı eklenmedi.

**Yayın:** [PR37](https://github.com/muhammetdkaya/codela-storefront/pull/37), [kaynak5ddad40c](https://github.com/muhammetdkaya/codela-storefront/commit/5ddad40caea54dc1ad84bd8145534e3451d80db8), [CI+gerçek FTP38941485667](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38941485667) başarılı. Gerçek indirilen111 ZIP SHA256 **6fe33f03b6c20bdea9bd5c5fe72b1f91c96c95394c31e9f5d36cd2efc4a76a0e** iki WP/Woo kurulumunda doğrulandı; public CSS111 ayrıca tarayıcıda görüldü. PHP/JS/24 paket ve bütün theme browser suite geçti.

**Canlı kabul:** [Galeri38942389017](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38942389017), [WebKit38942388870](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38942388870), [shell38942388684](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38942388684), [document38942389028](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38942389028) başarılı.390px tek form/qty/submit, kapalı kargo/contact yokluğu, native stepping, açık contact satırı; fotoğraf drift0px/reverse0px/birer geçiş ve son kart–panel **7.3125px**.1280 native galeri/zoom da geçti. Push anındaki38941485652 eski110'u gördüğü için başarısızdı; yayın sonrası111 kabulü38942389017'dir.

**Gerçek Woo:** Test-only kaynak [12285649](https://github.com/muhammetdkaya/codela/commit/122856496d0951c323babcff65244d39de7ba47a), aynı111 ZIP/hash/theme kaynağı. [38943731140](https://github.com/muhammetdkaya/codela/actions/runs/38943731140) **başarılı**: WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1 × Chromium/WebKit, ortam başına7 panel+16 native+5 modül, **4/4 ortam ve112 başarılı kayıt**. Gerçek native miktar stepping/variation POST/grouped, etkin ETA/live shipping disclosure ve ayrı WhatsApp satırı, kapalı kargo/contact yokluğu, server cart değişince40% progress, disabled modül yokluğu ve cart CSS izolasyonu geçti.

Önceki38941565704 attempt1 FTP öncesi paket404'tü. Attempt2/3 yeni ortam WebKit initial-loop product navigation networkidle30s timeout'unda kaldı; eski ortam aynı111 paketle56 kaydı geçti. Kesin timeout nedeni belirlenmedi. Test-only12285649 navigasyonu load+görünür panel+galeri hazır kontrolüne bağladı; işlev assertion'ları kaldırılmadı, tema paketi değiştirilmedi. Yeni38943731140 ile bütün ortamlar geçti; eski başarısız koşular başarılı diye gösterilmez.

**Kalan/sıradaki:**İstenen panel kod/yayın/canlı ve gerçek WP/Woo fonksiyonel kabulü tamam. Yeni taleplerde güncel HEAD'den devam et; bu düzenlemeyi yeniden başlatma. [Performans38942388850](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38942388850) eski ağır PNG cold-LCP bütçesinde başarısız: home14500ms/product15784ms, ürünCLS0.019287; secondary232507byte eski106/107 ile aynı. Bu ayrı açık performans işidir; tüm gate'ler geçti denmez. Fiziksel Safari/GPU/toolbar ve gerçek harici gateway ayrıca doğrulanmadı.

## Çalışma — 16 Ekim 2026 / 0.1.110 → 0.1.111 sade satın alma ve açık panel modülleri

Kullanıcı son görselin siteye uygulanmasını, kapalıyken ücretsiz kargo bilgisinin hiç görünmemesini istedi. Kapalı mobil panel yalnız ürün başlığı/fiyat ve native adet/Sepete Ekle içerir. Mevcut etkin ETA ve ücretsiz kargo DOM düğümleri açık panelde native **Teslimat ve kargo** disclosure'ına taşınır; WhatsApp aynı özgün linkle bilgi bölümlerinden sonra ayrı satırdır. Native taksit/ürün/yorum callback'leri, canlı shipping scripti ve sunucu hesapları korunur; örnek tarih/stok/iade metni veya kapalı modül üretilmez. Mobil bilgi bölümleri başlangıçta kapalıdır, masaüstüne dönüşte özgün düğüm konumları/açık durumları geri gelir.

Native Woo miktar girişinin iki yanında ortak quiet Button ile44px −/+; input.stepUp/stepDown, input/change olayları ve güncel min/max/disabled/readonly sınırları korunur. Tek form, tek qty ve tek submit vardır. Satın alma düğmesi220px üst hedefle esner;320px'de aynı satırda kalır. Plugin1.1.1 runtime, ayarlar ve WordPress.org değişmedi.

Yerel JS sözdizimi ve24 paket kontrolü başarılı. Bu ortamda PHP ve tarayıcı binary'si bulunmadığından gerçek template/browser kontrolü CI'ye bırakıldı; browser indirme ağı kullanılamadı. Güncel PHP template'ini kullanan320/390/700 testleri kapalı kargo yokluğu, native disclosure, qty sınırları ve masaüstü geri taşımayı kapsar. CI/gerçek FTP ve111 kaynaklı canlı kabul **bekleniyor**; tamamlandı/canlı denmez. Önceki110 alt boşluk/geometri kabulü korunmalı. Ağır PNG cold-LCP, fiziksel Safari ve gerçek gateway ayrı açık.

## Son doğrulanmış durum — 16 Ekim 2026 / 0.1.110 mobil ilgili ürünler alt sınır

**Biten:** Kullanıcının mobil ekran görüntüsündeki ilgili ürün listesinin altında boşluk kaldırıldı. İlk 0.1.109 canlı QA **başarısızdı**: son kart ile kapalı ürün satın alma paneli arasında138.3125px vardı (98.9219px discovery padding, native32px ul.products margin ve doğal mesafe). 0.1.110, yalnız mobil discovery için fazla rezervi kaldırdı, native Woo grid alt marjını bu alan özelinde sıfırladı; cihaz safe-area korundu. Katalog kart boya sistemi, native formlar, galeri, fotoğraf snap ve galeri/panel geçişleri değiştirilmedi. Eklenti1.1.1 aynı.

**Yayın/doğrulama:** Kaynak [c7330ebc](https://github.com/muhammetdkaya/codela-storefront/commit/c7330ebcc54e1817abc46b7c1df6a5c79ef07b57), [CI, paket ve gerçek FTP 38917382329](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38917382329) başarılı. [Yayın sonrası canlı galeri 38918273286](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38918273286) başarılı: 390px son native ürün kartından sabit panele **7.3125px**, 0px alt padding/grid marjı, 60 kare alt sınır sabit, related içinden yukarı dönüşte kayma0px/ters hareket0px, birer state geçişi, root photo snap ve tepedeki overscroll auto geri gelir. 390/1280 görüntü kalitesi/üç önizleme ve inline zoom kabul edildi. [WebKit](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38918273299), [shell](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38918273322), [document](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38918273292) canlı testleri başarılı.

**Kalan:** 0.1.110 performans audit bekliyor; ağır PNG cold-LCP önceki sürümlerde bütçeyi karşılamadı. Fiziksel iPhone Safari elastik kaydırma/toolbar ve gerçek ödeme/üçüncü taraf medya ayrı kabul gerektirir. Bu alt boşluk işi otomatik işlevsel kabul ve canlı dağıtım yönünden tamam; bundan sonra yeni talepler için HEAD'den devam et.

## Çalışma — 16 Ekim 2026 / 0.1.109 → 0.1.110 son boşluğun kaldırılması

0.1.109 test/gerçek FTP [38915360148](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38915360148) başarılı; fakat [canlı galeri 38916374019](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38916374019) **başarısız**: 390px mobilde son kart ile kapalı satın alma paneli **138.3125px** ayrı (kalan `padding-bottom:98.9219px` ve native `ul.products margin-bottom:32px`). Önceki 0.1.109 'tamam' sayılmaz.

0.1.110: Mobil discovery altında ekstra panel rezervi yerine yalnız gerçek `env(safe-area-inset-bottom)` korunur; native Woo katalog gridinin 32px alt marjı yalnız discovery kapsamında sıfırlanır. Aynı native kart, 3 önizleme, ilk dokunmada inline zoom, 0.1.108 snap/overscroll sınırları ve fotoğraf koordinatları korunur. Genişlik başına normal fotoğraf hesapları değişmez. Canlı QA artık gerçek son kart ile sabit panel mesafesini ve grid marginini ölçüp uygun aralığı zorunlu kılıyor. Bu sürüm için CI, gerçek FTP, yayın sonrası galeri ve diğer canlı kontroller **henüz bekleniyor**. Eklenti1.1.1 değişmedi, ağır PNG cold-LCP ve fiziksel Safari/gerçek ödeme sağlayıcısı ayrı açık.

## Çalışma — 16 Ekim 2026 / 0.1.108 → 0.1.109 öneri listesi son boşluk

Kullanıcı ekran görüntüsündeki son ilgili ürün kartı ile sabit satın alma paneli arasındaki boşluğun kaldırılmasını istedi. Mobil discovery `min-height:100svh` tabanı kaldırıldı, son `.related/.upsells` marjı sıfırlandı; sabit alt alan için ölçülmüş normal yükseklikten 24px az pay bırakıldı (kompakt panelin örtmesini önleme). Fotoğraf boyutları, 0.1.108 snap/overscroll sınırları ve native Woo form, ürün/kartlar değişmedi. Fixture bölüm yüksekliği ve alt payı kontrol ediyor; canlı galeri QA son kart–panel mesafesini doğrudan ölçüyor. CI/FTP/canlı sonuçları henüz bekleniyor; eski 0.1.108 başarılı koşular 0.1.109 kabulü değildir. Eklenti 1.1.1 değişmedi; fiziksel Safari, gerçek ödeme sağlayıcısı ve PNG cold-LCP ayrı açık.

## Çalışma —16 Ekim2026 /0.1.107→0.1.108 küçük resim ve alt sınır

Tema0.1.108 hazırlanıyor; Codela1.1.1 runtime değişmedi. Seçili native thumbnail'ın siyah outline'ı kaldırılır; shared klavye focus-visible korunur. İlgili ürünler görünürken root/body overscroll-y:none, galeride auto: alt uç esneme/boşluk ve bırakma geri sekmesi engellenir, tepedeki native yenileme yolu korunur. 0.1.108 ilk CI uzun ilgili ürün listesinde root mandatory snap yüzünden en alta ulaşamadı; öneriler `.is-discovering` iken root snap devre dışı, galeriye dönüldüğünde mandatory yeniden etkin. Fotoğraf koordinatları, fotoğraf snap hedefleri ve normal panel rezervi değişmedi. Yeni touch/wheel engelleyici veya scroll motoru yok.

Fixture ve canlı QA artık üç alt sınır wheel hareketinin ardından60 frame boyunca scrollHeight/scrollY sabitliğini, öneriler içinde geri kaydırmayı ve galeriye dönünce auto politikasını sınar. Fiziksel Safari rubber-band/toolbar hareketi wheel otomasyonunda birebir üretilemez; cihaz kabulü açık. CI/gerçek FTP,108 paket/hash pin'li WP/Woo matrisi ve canlı sonuçlar bekleniyor. Önceki ağır PNG cold-LCP sorunu ayrı açık.


## Son doğrulanmış devam noktası — 16 Ekim2026 / 0.1.107 inline zoom ve üç önizleme canlı

Tema **0.1.106→0.1.107 canlı**, eklenti **1.1.1 runtime ve frozen0.1.1 değişmedi**. Kullanıcı “Uygula” ile popup kaldırma/üç önizleme önerisini onayladı ve uygulandı. Product PhotoSwipe theme support/flag kapalı; ayrı popup yerine Woo'nun mevcut jQuery Zoom plugin'i ilk dokunma/tıklamada özgün fotoğrafın içinde başlar. Yeni zoom/pan/galeri motoru, dialog veya satın alma kopyası yok. Native responsive fotoğraf, form/variation ve106 sabit fotoğraf/snap/keşif geometrisi korunur. İlk istekten önce zoom orijinali/zoomImg yok; ikinci tıklama, Escape ve belge scroll zoom'u kapatır. Enter/Space, aria-pressed, dekoratif zoomImg aria-hidden, yerel Türkçe kontrol adı; touch scroll prevent edilmez. Modern wc-zoom veya legacy zoom handle kayıt durumuna göre seçilir, varyasyonda eski native zoom instance temizlenir.

**Önizlemeler:** en fazla3 özgün shared IconButton görünür; seçili fotoğraf yakınındaki pencere kayar. Gizli kontroller focus/AX akışından çıkar,1/5 toplam sayacı ve tüm fotoğraflara doğal scroll/keyboard erişimi kalır. Mobilde gerçek thumbnail, mevcut seçili outline ve4px yerleşim aralığı; yeni paint/renk yok. Doğru oranlı medium önizleme ve gerçek niyette komşu fotoğraf defer'i aynı; ürün verisi/medya/settings değiştirilmedi.

**Yayın:** [kaynak5bed7a8b](https://github.com/muhammetdkaya/codela-storefront/commit/5bed7a8bf08172879f1d0782d38e7a634a7e2e75); [CI+gerçek FTP38901747977](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38901747977) başarılı,12:43:20Z. Gerçek CI ZIP, public manifest/source ve public ZIP SHA256 **39857d4b72d49523589cbc1cd7048aad15a6200e0dae33fae3a6ecca3ff1d3a7** eşleşir. Sonraki QA/dokümantasyon commitleri runtime paketini değiştirmez.

**Fonksiyonel kabul:** PHP/JS/24 paket ve bütün browser regresyonları geçti. Beş resimli fixture ilk/son konumda üç görünür kontrol ve current öğenin görünürlüğünü, cold secondary defer'i korur. [Gerçek WP/Woo38902232031](https://github.com/muhammetdkaya/codela/actions/runs/38902232031) **başarılı**: WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1 × Chromium/WebKit, ortam başına7 panel/zoom+16 mevcut+5 modül, **4/4 ortam ve112 başarılı kayıt**. Test kaynağıb77b2148cf2352e4a7bc07e3f6f85a1cadaccfed, aynı107 source/hash/ZIP. Yeni WebKit ilk denemede ürün sayfasına networkidle navigasyonunda30s timeout oldu; assert kaldırılmadan ve kod/paket değiştirilmeden yalnız failed job yeniden çalıştırıldı (attempt2) ve tüm kontroller geçti. Timeout'un kesin nedeni belirlenmedi; runtime hatası olarak sunulmaz.

**Canlı:** [Sıkı galeri/zoom38902609902](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38902609902) başarılı; QA kaynağıe803f3d644f13c89dd2f596ddc1b6750e6656a28. Gerçek5 fotoğraflı Kavis390/1280: popup false, previewCount3, nativeZoom true. Gerçek touch tap, boyanmış zoom opacity1, Escape/Space/ikinci tıklama, mobil scroll ile kapanma, aynı URL/native satın alma ve değişmeyen fotoğraf koordinatları doğrulandı.90'ar frame gidiş/dönüşte drift0px/reverse0px/flips1, hedef sapması<0.4px. Normal görünüm ve aktif inline zoom390px ekranları artefact'tan incelendi;3 resimli pencere, seçili outline, yerinde büyütme ve görünür satın alma doğrulandı. WebKit38902533909, document38902533758 ve shell38902533402 başarılı. İlk38901748242 QA FTP öncesi eski106 sürümünü test etti;107 kabulü sayılmaz. Yayın sonrası38902534440 temel zoom/galeri kabulü de başarılı.

**Performans:** [38902533700](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38902533700) cold mobil lab bütçesi başarısız: home14240ms/ürün15836ms, CLS0/0.02130; secondary median232507byte (106 ile aynı). İlk isteğe kadar zoom orijinali eklenmez; bütün büyük PNG'lerin başlangıçta indirilmesi regresyonu geri gelmedi. Önceki ağır PNG cold-LCP işi ayrı açık; tüm gate'ler geçti denmez.

**Kalan/sıradaki:** kullanıcıdan yeni istek gelmedikçe popup/3 önizlemeyi tekrar uygulama; bu işin kod/yayın/otomatik işlevsel kabulü tamam. Fiziksel Safari/GPU/toolbar/native yenileme ve gerçek harici gateway ayrıca kontrol edilmedi. Pinch motoru eklenmedi; bu sürüm aynı görselde dokunma/tıklama zoom'u sağlar. Kullanıcıdan tekrar uygulama izni isteme; kod/yayın/canlı işlevsel uygulama tamamdır.

## Çalışma — 16 Ekim 2026 / 0.1.107 aynı görselde zoom ve üç önizleme

Tema **0.1.106 → 0.1.107 hazırlanıyor**; eklenti **1.1.1 runtime değişmedi**. Kullanıcı önceki popup kaldırma/üç önizleme önerisini “Uygula” ile onayladı. Product PhotoSwipe desteği ve enabled filtresi kapalı; ayrı popup yerine mevcut Woo jQuery Zoom eklentisi ilk dokunma/tıklamada aynı native fotoğrafta başlatılır. Yeni zoom/galeri motoru, dialog veya resim gezinme kopyası yok. Native kaynak, form/variation ve fotoğraf snap geometrisi korunur. Zoom kaynakları yalnız istek üzerine indirilir; ikinci dokunma, Escape ve belge kaydırması zoom'u kapatır. Enter/Space ve aria-pressed; doğal touch scroll engellenmez. Woo9 zoom / Woo11 wc-zoom handle'ı runtime kayıt durumuna göre seçilir. Varyasyon değişiminde eski native zoom instance'ı temizlenir.

Aynı anda en fazla3 özgün preview kontrolü görünür; seçili fotoğraf yakınındaki pencereyi kaydırır,1/5 sayacı ve bütün fotoğraflara doğal gezinme korunur. Gizlenen kontroller klavye/erişilebilirlik akışından da çıkar. Mobilde gerçek küçük resimler, seçili outline ve4px aralık; shared Button/IconButton boyama sistemi korunur. Ürün verisi/medya/settings ve önceki106 stable viewport/snap/keşif akışı değişmedi.

Yerel JS sözdizimi ve24 paket testi başarılı. Native gallery fixture beş fotoğrafın ilk/son konumunda üç görünür preview ve soğuk secondary defer kontrolünü kapsar. Gerçek Woo ve canlı kabul popup olmamasını, inline zoom'un aynı fotoğrafta açılıp kapanmasını, klavye/URL/satın alma ve geometriyi doğrulayacak.107 CI/FTP, gerçek ZIP/hash/source pin'li yeni WP/Woo ve canlı sonuçlar bekleniyor. Önceki106 testleri107 kabulü değildir. Ağır PNG cold-LCP bütçesi ve fiziksel Safari/GPU/toolbar/pinch davranışı ayrıca açık; pinch motoru eklenmedi.


## Son doğrulanmış devam noktası — 16 Ekim 2026 / 0.1.106 galeri ve geçiş canlı

Tema **0.1.104→0.1.105→0.1.106 canlı**, eklenti **1.1.1 runtime değişmedi**. İkinci ve sonraki fotoğrafların100×100 kare thumbnail kaynağına düşmesi native `woocommerce_gallery_image_size=woocommerce_single` ile giderildi; bütün fotoğraflar doğru intrinsic oran ve responsive kaynaklarını korur. Galeri mevcut native Woo düğümleri, PhotoSwipe, variation ve form sahibi olarak kalır. Doğru oranlı medium önizleme, gerçek galeri niyeti/görünürlükte özgün kaynağa mevcut adapter üzerinden geçer; komşu fotoğraf hazırlanır, tüm büyük PNG'ler başlangıçta indirilmez.

**Titreme düzeltmesi:** fotoğraf blokları100lvh tabanında sabit; `scroll-margin-bottom:100svh - 100lvh` yalnız snap alanını küçültür, root scroll-padding mevcut/küçük viewport farkı+normal panel payını karşılar. Normal fotoğraf payı genişlik başına ölçülür; panel compaction/height-only toolbar resize fotoğraf/snap koordinatlarını değiştirmez. Keşif rezervi normal panel yüksekliğinde sabit, track overflow-anchor:none. Keşif55/65% hysteresis ve tek rAF, IO yalnız genişlik değişince yeniden kurulur. Native belge overscroll:auto/pull-to-refresh yolu, açık panel root lock/bağımsız scroll ve gapless fotoğraflar korunur.

**Yayın:** kaynak [cf07ccff](https://github.com/muhammetdkaya/codela-storefront/commit/cf07ccff52ddfe24d050a4a6fbcf9a78ed5d4479); [CI+gerçek FTP38897448536](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38897448536) başarılı,12:06:06Z. Gerçek CI ZIP, public manifest/source ve indirilen public ZIP SHA256 **b0f7713511ede4cbdf3bf823ad7d24c6ee7f5ca60c05f8377ac2e1d59ebfbdb4** aynı. Sonraki yalnız QA/dokümantasyon commitleri runtime paketini değiştirmez.

**Kabul:** PHP/JS/24 paket ve bütün browser regresyonları geçti. Üretim fixture'ı üç tekrarlı keşif gidiş/dönüş ve toolbar yükseklik simülasyonunda TÜM fotoğraf mutlak koordinatlarını ve keşif rezervini doğrular. [Gerçek WP/Woo38897793510](https://github.com/muhammetdkaya/codela/actions/runs/38897793510) iki nesil × Chromium/WebKit: ortam başına7 panel+16 mevcut+5 modül, **4/4 ortam ve112 başarılı kayıt**. Test kaynağı915a1b19f65b084eafe843fe560aaa928cb3c542, aynı106 ZIP/hash/source'a pin'li. Native form/variation POST/cart/checkout/account ve modüller geçti.

**Canlı:** WebKit38898205430, document38898205493 ve shell38898205482 başarılı. Sıkı [galeri38899177570](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38899177570) gerçek beş fotoğraflı Kavis ürünü390/1280 kalite, doğru oran, decoded currentSrc, PhotoSwipe ve paneli doğruladı.90'ar animation frame ölçümünde keşfe gidiş/dönüşte **fotoğraf konum kayması0px, ters scroll düzeltmesi0px, durum geçişi1**, hedef sapması<0.4px. QA kaynağı0dc395aa0448cee73956fe99a5f5bd7e0d65c769. İlk canlı QA yanlışlıkla180px kısa çekiş kullanıyor, doğal ilk fotoğrafa geri oturmayı hata sayıyordu; yalnız harness gerçek fotoğraf yüksekliğinin%80'i olan kısmi harekete uyarlandı. Çıktı/konum assertion'ları kaldırılmadı ve runtime bu nedenle değiştirilmedi.

**Performans sınırı:** [38898205318](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38898205318) cold mobil lab bütçesi hâlâ başarısız: home14448ms/ürün15884ms; ürün CLS0.02130.105'te tüm secondary orijinallerin başlangıçta indirilmesiyle oluşan53428ms/8184988byte regresyonu giderildi:106 secondary median **232507byte** (üç örnekte aynı), eski15s düzeyine döndü. Önceki ağır PNG cold-LCP işi ayrı açık; bütün gate'ler başarılı denmez. Medya dosyası/metadata'sı, ürünler, para birimi veya modül ayarları değiştirilmedi.

**Kalan/sıradaki:** bu kalite ve koordinat düzeltmesi kod/yayın/otomatik işlevsel kabul açısından tamam. Fiziksel Safari/GPU/toolbar/native yenileme hareketi cihazda ayrıca kontrol edilmeli; simülasyon gerçek cihaz kanıtı değildir. Gerçek harici gateway ve medya optimizasyonu ayrı açık. Kullanıcının son popup ve önizleme sayısı sorusuna öneri: aynı alanda yakınlaştırma, ayrı popup gerekmeyebilir; aynı anda3 önizleme veya yalnız1/5 sayacı. Bu yalnız öneridir; PhotoSwipe kaldırma/3 önizleme henüz uygulanmadı.


## Çalışma — 16 Ekim 2026 / 0.1.106 sabit galeri ve keşif geçişi

Tema **0.1.105 → 0.1.106 hazırlanıyor**, eklenti **1.1.1 değişmedi**. Kullanıcı ilgili ürünlere girip çıkarken ve bazen fotoğraflarda titreme bildirdi. Fotoğraf blokları dinamik100dvh yerine stabil büyük viewport'a dayanır; negatif scroll-margin sadece snap alanını küçük viewport'a indirir, root padding dinamik toolbar farkını karşılar. Böylece native fotoğraf adımları korunurken Safari toolbar'ı bütün önceki fotoğraf konumlarını değiştirmez. Panelin normal fotoğraf payı genişlik başına ölçülür; keşif compaction ve height-only resize galeri/snap geometrisini yeniden yazmaz. Keşif alt rezervi normal panel yüksekliğinde sabit; scroll anchoring kapalı. Keşif sınırında55/65% hysteresis, passive scroll başına tek rAF; IO yalnız genişlik değiştiğinde yeniden kurulur.

105 kalite düzeltmesi canlı ve dört canlı fonksiyonel gate başarılı; kaynak458a1140638f28d780cf09a2f2f436b17b528c5a, gerçek ZIP d71669ab1bb096dc3ca0691e1ea0ee6b98ece03e9037877b5ad2dc996eae6d6f.105 gerçek Woo38896666300 dört ortam ürün panel/kalite kabulünü geçti, matrisin yeni WebKit ortamı mevcut block-checkout badge timeout'unda kaldı; tüm matris başarılı denmez.105 performans38896392681 başarısız: ürün cold median53428ms, secondary8184988bytes (home14604ms). Native lazy heuristics dört orijinal PNG'yi başlangıçta indiriyordu.106 doğru oranlı medium önizlemeyi kullanıp özgün responsive kaynağı gerçek galeri niyetinde/görünürlükte mevcut adapter ile yükseltir; komşu fotoğraf önceden hazırlanır, hepsi başlangıçta indirilmez. Orijinal medya/data/ayarlar değiştirilmez.

Yerel JS/24 paket başarılı. Yeni üç tekrar keşif gidiş/dönüş ve toolbar yüksekliği simülasyonu bütün fotoğraf mutlak koordinatlarını ve keşif rezervini kontrol eder.106 CI/FTP, yeni ZIP/hash/source pin'li gerçek Woo ve canlı/performance kabulü bekleniyor. Fiziksel Safari/GPU/toolbar hareketi ayrıca açık; önceki performans bütçesi geçti diye sunulmaz.


## Çalışma — 16 Ekim 2026 / 0.1.105 galeri kalitesi ve fotoğraf adımları

Tema **0.1.104 → 0.1.105 hazırlanıyor**, eklenti **1.1.1 değişmedi**. Canlı HTML incelemesi ikinci ve sonraki img kaynaklarının100×100 kare Woo thumbnail olduğunu kanıtladı: FlexSlider kapalıyken Woo secondary image size seçimi thumbnail'a düşüyordu. Ürün belgesindeki native `woocommerce_gallery_image_size` artık `woocommerce_single`; bütün fotoğrafların doğru oranlı responsive src/srcset/width/height bilgisi korunur. Kare thumbnail ile değiştirme kaldırılır; ilk fotoğraf eager/high, diğerleri native lazy/low. Orijinal medya, thumbnail rail ve PhotoSwipe büyük görseli değişmez.

Mobil root snap proximity yerine mandatory; snapport alt payı normal fotoğraf inset ve safe-area ile eşleşir. Ardışık fotoğraflar arasında boşluk yok; native belge scroll ve overscroll:auto, ilgili ürünlerin uzun normal akışı ve açık panel kilidi korunur. Yeni küçük wheel hareketi testi fotoğrafın tam üst kenarına oturmasını doğrular. Kaynak boyutu filtresi unit kabulüne eklenir. Kod/CI/gerçek FTP, yeni gerçek ZIP hash/source pin'li WP/Woo matrisi ve canlı kalite/kaydırma kontrolü henüz bekleniyor. Fiziksel Safari çekerek yenileme ve önceki ağır PNG cold-LCP sorunu ayrıca açık.


## Son doğrulanmış durum — 16 Ekim2026 / 0.1.104 fotoğraf ve native kaydırma canlı

Tema **0.1.101→0.1.104 canlı**; eklenti **1.1.1 runtime değişmedi**. Fotoğraf/panel arasındaki rezerv padding şeridi kaldırıldı. Native Woo'nun ikinci ve sonraki fotoğraflara verdiği inline-block düzeni mobilde açık block/float:none ile uyarlanır; bütün ardışık kenarlar bitişiktir. Fotoğraf blokları100dvh'den normal kapalı panel payı düşülerek ölçülür ve yaklaşık24px yuvarlak köşelerin arkasına uzanır. Böylece boşluk olmadan görünür ürün kadrajı korunur. Normal photo-inset keşif compaction sırasında değiştirilmez; önceki fotoğraflar yer değiştirmez. Safe-area CSS'te hesaba katılır.

**Kaydırma:** kapalı panelde belge normal scroll sahibidir; html/body overscroll-y:auto, galeri wrapper overflow:visible. Özel refresh/reload veya touchmove engellemesi eklenmedi. Açık detaylarda root kilidi ve inert galeri/bağımsız panel scroll korunur. Mobil IO viewport'u ve paneli dışlayan rootMargin'i, desktop özgün yatay track'i kullanır; resize/mode change yeniden gözlemler. Native image/PhotoSwipe/variation/form/quantity ve aynı kartlar korunur. **Fiziksel Safari toolbar çekerek yenileme hareketi bu otomasyonla test edilmedi**; root scroll/overscroll yolu kanıtlandı. Tarayıcının native davranışı uygulamaya bırakılır, özel yenileme taklidi yoktur.

**Materyal:** panel, Menu/Cart IconButton'larıyla aynı components.css shared yüzeyidir: rgba(247,247,249,0.96), aynı blur/shadow/fallback. Renk değişmedi; fotoğraf artık panel arkasında da devam eder. Form footer'ı şeffaf, ikinci cam katmanı yok.

**Yayın:** kaynak68046d532d315e085c6a3037714dad44c41960bf; [CI+gerçek FTP38890740099](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38890740099) başarılı; deploy11:07:01Z. Gerçek CI ZIP ve public manifest SHA256 **a35e64aa80a3031f56e143a9cc482003fc514e0516408f31db7268b39409495c** aynı; version/source/hash public doğrulandı.104 önceki hazırlık commitleri final kaynak değildir. Son QA/dokümantasyon commitleri runtime paketini değiştirmez.

**Kabul:** PHP/JS/24 paket ve bütün browser regresyonları geçti. Fixture gerçek Woo images/inline-block kuralını içerir;320/390/700'de TÜM fotoğraf aralıkları0px, padding0, görsel/panel örtüşmesi, görünür ürün alanı, root sahipliği, closed overscroll auto/open lock, native form/hash/desktop restorasyonu doğrulanır. [Gerçek WP/Woo38891126955](https://github.com/muhammetdkaya/codela/actions/runs/38891126955) iki nesil × Chromium/WebKit:6 panel+16 mevcut+5 modül, **4/4 ortam ve108 başarılı kayıt**. Test kaynağıe9392a4053d079508342e1eaccff6bf3e56c4e6c;104 gerçek CI ZIP/hash/source'a pin'li. Native varyasyon POST/cart/grouped/checkout/account ve modül sahipliği geçti.

**Canlı:** gallery38891661366, document38891661378, shell38891661466 ve sıkı WebKit [38892115514](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38892115514) başarılı. Gerçek **Kavis5 fotoğraflı** üründe390/1280 fotoğraf/lightbox/keşif kontrolü; WebKit'te gerçek tüm kenarlar ve opacity1/decoded image sonrası kadraj/panel ekranı incelendi. Önceki WebKit yüzey kontrolü38891661404 renk/pariteyi geçti fakat screenshot fade bitmeden alınabiliyordu; QA artık görüntünün gerçekten boyanmasını ve kenarları da bekler. Bu test düzeltmesi runtime değişikliği değildir. Canlı çoklu galeri artık vardır;101'deki tek görsel notu tarihîdir.

**Açık performans:** [38891661397](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38891661397) lab bütçesi başarısız: cold mobil median home14612ms/ürün15548ms; CLS0/0.02062; secondary median379937bytes. Büyük PNG medya/performance işi ayrı açık; tüm gate'ler başarılı denmez. Medya, ürün verisi, para birimi veya modül ayarları değiştirilmedi. Bu lab ölçümüdür, fiziksel cihaz/saha CWV değildir.

**Sıradaki:** kullanıcı görsel kabulü ve fiziksel Safari native yenileme/toolbar/safe-area kontrolü. Yetkili/yedekli medya optimizasyonu ve gerçek harici gateway ayrıca açık. Bu boşluk/root-scroll tasarımının kod/yayın/fonksiyonel kabulü tamam; kendiliğinden yeniden uygulama veya modül açma.

## Ara sürüm hazırlığı — 0.1.103 native Woo ikinci görsel satır boşluğu

102 native belge scroll ve padding kaldırma canlıya geçti;103 hazırlanıyor. Gerçek Woo CSS ikinci ve sonraki .woocommerce-product-gallery__image için display:inline-block verir.103 mobil akışta özgün görsel düğümlerini açık display:block/float:none yapar; satırın baseline boşluğu oluşmaz. Fixture artık gerçek Woo images sınıfını/inline-block kuralını içerir ve yalnız ilk çifti değil TÜM ardışık fotoğraf kenarlarını ölçer. Plugin1.1.1 değişmedi. Yerel JS/24 paket başarılı;103 CI/FTP ve103 ZIP/source/hash ile gerçek Woo/canlı kabulü bekleniyor. Native Safari pull-to-refresh fiziksel toolbar otomasyonu değildir; root scroll ve overscroll-auto yolu otomatik doğrulanır. Ağır PNG medya konusu ayrıca açık.


## Ara sürüm hazırlığı — 16 Ekim2026 / 0.1.102 kesintisiz fotoğraf ve native belge scroll

Tema0.1.101→0.1.102 hazırlanıyor; eklenti1.1.1 değişmedi. Kullanıcı fotoğraf/panel ve ardışık fotoğraflardaki beyaz boşluğu, tepedeki aşağı çekişin Safari yenilemesine ulaşmamasını bildirdi. Mobil fotoğraflardaki panel rezerv padding'i kaldırıldı; gerçek img altına kadar uzanır, fotoğraflar bitişik100svh bloklardır. Kapalı üründe scroll sahibi normal belgedir: wrapper overflow visible; html/body overscroll-y auto. Özel refresh/reload/touchmove engelleme eklenmedi. Açık panelde html/body lock, inert galeri ve bağımsız panel scroll korunur. Görünür slayt IO root'u mobilde viewport, desktop'ta özgün track; medya sorgusunda yeniden bağlanır. Sabit nav/count/visitor ve keyboard/variation native belge koordinatını kullanır. İlgili ürünler aynı akışta kalır. Panel ve soft Button aynı components.css materyalini kullanmaya devam eder; renk değişmedi.

Yerel JS/24 paket başarılı. Yeni browser ve gerçek Woo kabulü root scroll sahipliği,0px fotoğraf aralığı/padding, görselin panel altına uzanması, kapalıda overscroll auto/açıkta root lock ve desktop restorasyonunu doğrulayacak. CI/FTP/native Woo/canlı sonucu bekleniyor. Native Safari toolbar pull-to-refresh gerçek cihazda otomatik test edilemez; sadece browser scroll yolu/ayarı kanıtlanabilir. Önceki ağır PNG cold-LCP bulgusu ayrı açık, medya/ayarlar değişmedi.


## Son doğrulanmış durum — 16 Ekim 2026 / 0.1.101 ürün keşfi canlı ve kabul tamam

Tema **0.1.99 → 0.1.101 canlı**; Codela eklentisi **1.1.1 runtime değişmedi**. Mobil related/upsell bölümleri özgün Woo kart/link/AJAX düğümleriyle son fotoğrafın ardından aynı dikey kaydırma alanındadır. Detay paneli yalnız mevcut ürün bilgilerini taşır. Kapalı panelde başlık/fiyat ve sağda44px açma kontrolü, altta aynı native quantity/submit vardır.320px'te yan yana kalırlar. İlgili ürünlerde panel daha da kısalır; fotoğraflara dönünce normal kapalı yüksekliğine döner. Ortak soft Button materyali kullanılır; satın alma footer'ı şeffaftır. Form/kart/sepet/galeri motoru kopyalanmadı; masaüstünde özgün DOM konumları geri gelir. Mevcut ürün sale etiketi keşifte gizlenir.

**Yayın:** [PR33](https://github.com/muhammetdkaya/codela-storefront/pull/33) ve101 düzeltme kaynağı **a449a0229b2608e950ae01747f05b327570e0dd0**. [CI+gerçek FTP38861617638](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38861617638) başarılı; gerçek deploy06:37:24Z. CI ZIP ve public manifest SHA256 **23a0da00b07d1b6760dd8a1b96681263cd2418af5ef4ec34fc629ce31958aaab** aynı; public101/source/hash doğrulandı. WordPress.org veya dondurulmuş0.1.1 paket yayını yok.

**Kabul:** PHP/JS/24 paket ve bütün mevcut browser regresyonları;320/390/700 panel, kısa başlık/modülsüz padding-only değişim, keyboard End ile keşif, native doğrulama, desktop restorasyon geçti. [Gerçek WP/Woo38861942257](https://github.com/muhammetdkaya/codela/actions/runs/38861942257) başarılı: WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1 × Chromium/WebKit; her ortam16 mevcut+5 modül+6 panel = **4/4 ortam,108 başarılı kayıt**.101 gerçek CI ZIP/source/hash'e pin'li; native varyasyon POST/cart, grouped ve bütün önceki akışlar geçti. Test kaynağı 0d78ded6a58787e70e759d8de61785fa3435be68.

**Canlı:** sıkı galeri/keşif yüksekliği38862269759, WebKit38862269755, document38862269865, shell38862269737 başarılı. Gerçek Luna ürününün390px WebKit normal paneli yaklaşık115px; keşifte yeni hedef yüksekliğine varış ayrıca assert edildi. Panel ve menü soft Button zemini aynı rgba(247,247,249,0.96). Gerçek kapalı panel/ilgili kartlar ekranları incelendi. Canlı katalogda birer fotoğraf var; çoklu fotoğraf izolasyondaki gerçek3 görselli Woo ürününde doğrulandı. Ayarlar, ürünler, para birimi ve medya değiştirilmedi.

**100 ara sürüm bulgusu:** iki gerçek Woo koşusu38860958607/38861293775 ve sıkı canlı38861323763 başarısızdır. İlk ölçüm eski CSS değişkenini animasyon bitmiş sanabiliyordu; yeni hedef beklenince kısa başlıklarda gerçek hata ortaya çıktı: varsayılan ResizeObserver content-box, yalnız header padding değişince tetiklenmiyor ve dış yükseklik eski kalıyordu.101 keşfe giriş/çıkış sınırında açık ölçüm yapar. Assertion kaldırılmadı; kısa başlık/modülsüz fixture ve gerçek/live yeni hedef-height kabulü geçti.

**Açık performans:** [38862269849](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38862269849) lab bütçesi başarısız: cold mobil median LCP home14572ms/ürün14468ms; CLS0/0.02062. Önceden de açık olan büyük PNG medya konusu ayrı kalır; bütün gate'ler geçti denmez. Bu lab ölçümüdür, saha CWV değildir.

**Sıradaki:** kullanıcı görsel kabulü; fiziksel Safari/toolbar/safe-area, gerçek harici ödeme sağlayıcısı ve yetkili/yedekli medya optimizasyonu ayrıca açık. Bu tasarımın kod/yayın/fonksiyonel kabulü tamamdır; kendiliğinden yeniden uygulama veya modül açma.

## Güncel çalışma — 16 Ekim 2026 / 0.1.100 ürün keşif akışı

Tema **0.1.99 → 0.1.100 hazırlanıyor**, eklenti **1.1.1 değişmedi**. Kullanıcı onayıyla native related/upsell düğümleri panelden çıkıp dikey fotoğrafların ardından aynı scroll alanına taşındı. Kart/URL/AJAX kopyalanmaz; masaüstünde özgün konumlarına döner. İlgili ürünler görünürken kapalı panel bir satır başlığa küçülür, fotoğraflarda normal kapalı düzene döner. Kapalı panelde başlık/fiyat yan yana, açma kontrolü sağda44px; gereksiz ayrı kontrol satırı kaldırıldı. Aynı shared soft Button zemin/materiali kullanılır; native satın alma footer'ı şeffaftır.320px'te quantity ve submit yan yana kalır.

**Doğrulama:** yerel JS sözdizimi ve24 paket testi başarılı. Yeni browser kabulü related erişimi, panel küçülmesi/geri dönüş, desktop restorasyonu ve native formu kontrol eder; CI/canlı sonucu henüz bekleniyor. Önceki99 testleri100 kabulü olarak sunulmaz. Önceki ağır PNG cold-LCP bulgusu ayrı açık; medya/ayarlar değiştirilmedi.

**Sıradaki:** CI browser kabulü, gerçek FTP, canlı sürüm ve görsel kontrolü. Fiziksel Safari ve gerçek gateway kabulü ayrıca açık.



## Son doğrulanmış durum — 16 Ekim 2026 / 0.1.99 ürün paneli canlı

Tema **0.1.98 → 0.1.99 canlı**; Codela eklentisi **1.1.1 runtime değişmedi**. Mobil fotoğraflar dikey native scroll-snap ile gezilir. Alt panel kapalıyken özgün başlık/fiyat/urgency ve aynı native satın alma kontrolleri görünür. Ortak Button veya başlığı sürükleyerek açılır; seçenekler, etkin modüller, Woo bilgi/yorum callback'leri, trust, öneriler ve footer bağlantıları bağımsız kayar. Açık panelde galeri inert/sabit; satın alma hep altta. Eksik varyasyon, grouped seçim ve native invalid input orijinal alanı açar. Escape/hash, global dialog/PhotoSwipe gizleme, reduced motion ve masaüstünde özgün DOM'a dönüş doğrulandı. Form/quantity/submit/variation_id kopyası veya ikinci cart/store/router yok. JS yoksa orijinal belge/yatay galeri kullanılabilir.

**Yayın:** [PR32](https://github.com/muhammetdkaya/codela-storefront/pull/32), runtime kaynak **6e0f24bc142225b5520ebc65ab65343a648fe9df**; [CI+gerçek FTP38856773404](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38856773404) başarılı. CI ZIP ve canlı manifest SHA256 **729406f2c749ccb0df0fc2c23527727f9a09cfe1b1a5930db8e384dd87ec322f** aynı. Product helper hash1942e9d5f7d3030f2e1d ve product/gallery99 asset'leri gerçek Türkçe Luna ürününde doğrulandı. Sonraki QA-only commit'ler runtime paketini değiştirmedi.

**Fonksiyonel kabul:** PHP/JS/24 paket ve önceki bütün browser regresyonları + yeni gerçek-template panel fixture'ı320/390/700 geçti. [Gerçek WP/Woo38857752496](https://github.com/muhammetdkaya/codela/actions/runs/38857752496) başarılı: WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1 × Chromium/WebKit; her ortam16 mevcut+5 growth+6 panel, **4/4 ortam ve108 başarılı kayıt**. Test kaynağı68870d15344e9b614e178f600d8611db10af0fe7; aynı99 ZIP/hash/source. İlk test variation_id atandığı anda Woo disabled sınıfı kalkmadan tıkladığı için POST beklerken durdu. Gerçek hazır durumunu bekleyen test düzeltildi; assertion kaldırılmadı, runtime/paket değişmedi.

**Canlı:** WebKit38857865372, galeri/lightbox/panel38857865412, document continuity38857663132 ve shell38857375207 başarılı. Gerçek390px Luna WebKit ekranı incelendi. Eski demo ürünleri silindiğinden read-only QA public Store API'den güncel ürünü bulur; tek sonuçlu aramanın native ürüne yönlendirmesi katalog yüzeyi testinde önlendi. Canlıdaki10 dekorasyon ürününde **birer fotoğraf** var: canlı multi-image kabulü yapılamaz; çoklu gezinti izole gerçek3 görselli Woo ürününde4 ortamda geçti. Modüller, para birimi, ürünler ve satıcı ayarları değiştirilmedi.

**Açık performans bulgusu:** [38857662928](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38857662928) tamamlandı; lab bütçesi **BAŞARISIZ**. Yeni mevcut PNG medya ile1.6Mbps/150ms/4x CPU koşulunda cold mobil median LCP home14708ms, ürün14772ms; CLS0 ve0.00806. Warm ürün örneği564ms. Bu saha/fiziksel cihaz ölçümü değildir; performansın geçtiği iddia edilmez. Ağır PNG türevlerini küçültme ayrı açık iş; orijinaller veya medya metadata'sı kendiliğinden değiştirilmedi.

**Sıradaki:** kullanıcı görsel kabulü ve fiziksel Safari/toolbar/safe-area kontrolü. Performans iyileştirmesi istenirse PNG türevleri için yedekli optimizasyon değerlendirilmeli; gerçek gateway/üçüncü taraf medya ve yetkili eski JPEG backfill ayrıca açık. Paneli yeniden uygulama/yayınlama veya canlı modülleri kendiliğinden açma. [Kabul kaydı](https://github.com/muhammetdkaya/codela-storefront/blob/main/docs/acceptance/2026-10-16-product-sheet.md).

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


