# Codela Storefront — güncel çalışma kuralları

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

