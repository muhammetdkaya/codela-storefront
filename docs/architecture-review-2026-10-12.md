# Codela Storefront — mimari, WordPress API ve hız incelemesi

Tarih: 12 Ekim 2026 (Europe/Istanbul)  
Kapsam: yalnız inceleme ve dokümantasyon; uygulama kodunda düzeltme yapılmadı.

**Uygulama için:** [Dosya bazlı çözüm rehberi, iş paketleri ve kabul testleri](architecture-remediation-guide-2026-10-12.md). 12 Ekim'de kullanıcı isteğiyle eklendi; henüz düzeltme uygulandığı anlamına gelmez.

## Karar

**Mevcut temel korunmalı. Yeni sayfa/özellik geliştirmesinden önce kısa bir sağlamlaştırma aşaması yapılmalı; temayı yeniden yazmak gerekmiyor.** Öncelik: alt JS modüllerinin önbellek sürümlemesi, sepet GET/POST yarışının giderilmesi ve WooCommerce'in diğer sepet arayüzleriyle senkronizasyon. Bunları gerçek WordPress/WooCommerce üzerinde doğrulayıp geliştirmeye devam etmek uygun.

Bu rapor düzeltmelerin yapıldığı veya kullanıcının yeni uygulama çalışmasını başlattığı anlamına gelmez. Devam eden başka çalışmanın dosyaları geri alınmamalı. Bulguları uygulamadan önce güncel HEAD üzerinde tekrar kontrol edin.

## İncelenen sürüm ve kanıt sınırı

- Tema: **0.1.49**, uygulama anlık görüntüsü [c015e9cd3efa8fcf2ef94d98216952615955d2e2](https://github.com/muhammetdkaya/codela-storefront/commit/c015e9cd3efa8fcf2ef94d98216952615955d2e2).
- Rapor hazırlanırken HEAD [51f0fdc83f4b227e7d7f7cd897b9cdf7559d4540](https://github.com/muhammetdkaya/codela-storefront/commit/51f0fdc83f4b227e7d7f7cd897b9cdf7559d4540) oldu. Karşılaştırmada yalnız AGENTS.md ve docs/design-system.md değişmişti; incelenen uygulama kodu aynıydı. Yeni doğrulama notları korundu.
- AGENTS.md, docs/storefront-theme.md ve docs/design-system.md kararları; tema PHP/JS/CSS, şablonlar, ayar şeması, testler ve dağıtım akışı incelendi.
- Arama ve ayar sahipliğini doğrulamak için Codela eklentisinin `codela-commerce-toolkit/includes/theme-support.php` dosyası ayrıca okundu; eklenti referansı **563286133c14f37e3f9411448020cf40a402916e**. Eklenti değiştirilmedi; tüm eklenti için kapsamlı denetim yapılmış sayılmaz.
- [Actions 38202574916](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38202574916) için yalnız üst seviye sonuç değil, **validate** ve **Deploy Storefront only** adımlarının başarı durumu da doğrulandı.
- Yerelde 22 Python paket/dağıtım testi, mevcut Node search-panel/format/dock-gesture kontrolleri ve 7 JS dosyasının syntax kontrolü geçti. Paket testlerindeki FTP işlemleri mock'tur; bu inceleme canlı FTP çalıştırmadı.
- Üretim cart-controller ve format koduyla, yalnız DOM/ağ sınırları taklit edilerek gecikmiş GET / başarılı POST sırası ayrıca üretildi: **yeni miktar 2 iken eski GET sonrasında 1'e döndü**.
- Yerelde PHP bulunmadığı için PHP lint ve Chromium/PHP fixture testleri yeniden çalıştırılmadı; bunlar için yukarıdaki aynı kaynak commit'inin CI kanıtı kullanıldı.
- Canlı mağazada oturum, gerçek ödeme, fiziksel iPhone Safari, gerçek cache başlıkları ve Core Web Vitals ölçülmedi. Aşağıda kodla doğrulanan kusurlar ile canlıda doğrulanması gereken riskler ayrıdır.

Dosya/satır numaraları incelenen kaynak commit'ine aittir. Kısaltılmış tema yollarının kökü `theme/codela-storefront/` dizinidir.

## Kararlara uyum: doğru kurulmuş parçalar

| Karar | Kodda görülen karşılık | Değerlendirme |
|---|---|---|
| Hız → sağlam altyapı → kullanım kolaylığı → tasarım | Sunucu HTML'i, blok şablonlar, küçük yerel modüller; tema kaynaklarında SPA/framework, font CDN veya animasyon kütüphanesi yok | Temel yön doğru; gerçek hız sonucu henüz ölçülmüş değil |
| Modern WordPress blok tema ve Interactivity API | functions.php:30–35; blok API v3, wp_register_script_module, @wordpress/interactivity; render.php içindeki data-wp-* bağları | Gerçek API kullanımı var; yalnız isimlendirme değil |
| Tek panel ve tek gezinme durumu | storefront.js bileşim noktası; birer overlay/dock/search/cart controller; tek native dialog | Sorumluluk ayrımı yerinde, ikinci modal sistemi gerekmiyor |
| WooCommerce parasal/stok kurallarının sahibi | cart-controller.js: Store API GET/POST, sunucu miktar sınırları ve toplamları, oturum GET'inden nonce | Doğru; istemci sadece sunucu tutarını seçip biçimliyor, fiyat/stock motoru kurmuyor |
| Ortak tasarım | inc/ui.php, tokens.css, components.css; checkout/account için yerel Woo markup adaptörleri | Önemli ölçüde uygulanmış; tüm eski Woo button CSS'i henüz bu sınırda değil |
| Tema ayarlarının tema şemasında, motorun Codela'da olması | config/settings.json; eklentide codela_theme_settings_sections/save_section | Header/Home/Footer için doğru ayrım |
| Aramanın hızlı ve doğru sonuç sırası | 180ms debounce, AbortController, sequence kontrolü; backend 8 sonuç, no_found_rows, görünürlük kontrolleri | İlk sürüm için makul; typo-tolerant arama veya büyük katalog benchmark'ı değil |
| Eklentinin giriş sonrası Hesabım sahipliği | account.php guest guard; account.css içinde codela-my-account-layout istisnaları | Bilinçli sahiplik ayrımı var; genel stylesheet ayrıca sınırlandırılmalı |
| Checkout'ta mevcut Woo işleyişi | page-checkout.html mevcut post-content'i koruyor; ayrı ödeme motoru oluşturulmuyor | Doğru, gerçek ödeme sağlayıcısı kabulü ayrıca gerekli |

**“Yeni WordPress API” yorumu:** Native dialog, DOM olayları ve controller kullanılması Interactivity API'ye aykırılık kanıtı değildir. Tüm DOM/state işlemlerini yeniden yazmak veya sırf yeni olduğu için router/SPA eklemek önerilmiyor. `theme.json` v2 ve WordPress 6.5 alt sınırı da tek başına hata değildir. Daha yeni API kullanımı gerekiyorsa desteklenen asgari sürümle birlikte ele alınmalı. Ürün/arşivdeki `woocommerce/legacy-template` blokları belgede eklenti hook'ları ve varyasyon uyumluluğu için bilinçli seçilmiş; “tamamen modern Woo bloklarına geçmiş” diye sunulmamalı, ölçüm/uyumluluk kanıtı olmadan değiştirilmemeli.

## Bulgular

### F1 — P1: Alt JavaScript modüllerinde cache sürümlemesi eksik

**Kanıt:** functions.php:32 yalnız `assets/storefront.js?ver=0.1.49` girişini sürümlüyor. storefront.js:2–5 controller'ları `./scripts/...js` yollarıyla; search/cart-controller:5 ise `./format.js` yoluyla alıyor. Alt modüller WordPress'e ayrı kayıtlı değil ve URL'lerinde hash/sürüm yok.

URL çözümlemesiyle doğrulandı: `storefront.js?ver=0.1.48` ve `storefront.js?ver=0.1.49` içinden aynı import, **aynı** `/assets/scripts/cart-controller.js` URL'sine gidiyor. Üst dosyanın query parametresi alt importa aktarılmıyor.

**Etki:** Alt dosyanın cache'i hâlâ tazeyse yeni HTML/CSS/giriş JS'si eski controller ile çalışabilir. Kullanıcının “güncelleme geldi ama değişmedi” türü sorunlarını doğurabilecek yapısal eksik. Canlı sunucunun bu dosyalara verdiği cache süresi ölçülmedi; her ziyaretçide şu anda oluştuğu iddia edilmiyor.

**Öneri:** Küçük modülleri WordPress Script Modules API ile sürümlü kimlikler/import-map bağımlılıkları olarak kaydetmek veya içerik hash'li dosya/import üretimi kullanmak. Bütün bağımlılık zinciri, format.js dahil kapsanmalı. Rastgele cache-buster, site genelinde no-cache veya ağır framework eklemeyin.

**Kabul:** A sürümünü tarayıcı cache'ine al; bir controller'ı değiştirip B'yi yayınla; cache temizlemeden B controller'ının çalıştığını ve dokunulmamış varlıkların gereksiz yenilenmediğini doğrula. Fixture'da import satırlarını kaldırmak bu testi karşılamaz.

### F2 — P1: Eski sepet GET'i başarılı mutasyon sonucunu ezebiliyor

**Kanıt:** cart-controller.js:39–57 GET kontrolü yalnız cartRevision'a bakıyor. changeCart:59–89 mutasyonu bu revision'ı artırmıyor; önceki GET'i iptal etmiyor/beklemiyor. `mutating` yeni GET başlamasını engellese de başlamış GET'in sonucunu engellemiyor.

**Tekrarlanan sıra:**
1. Sepet verisi 1 adet olarak yüklü.
2. Bir refresh GET'i başlar ve bekletilir.
3. Aynı anda miktar POST'u 2 adetle başarıyla sonuçlanır; arayüz 2'yi çizer.
4. Önceden başlamış GET, 1 adetlik eski cevabıyla gelir.
5. Arayüz/sepet belleği tekrar 1 olur.

Bu sonuç gerçek controller kaynaklarıyla yerel kontrollü ağ sıralamasında üretildi. Sunucunun siparişi yanlış hesapladığı iddia edilmiyor; sorun istemci tutarlılığıdır.

Aynı sahiplik sınırında `invalidate()` mutasyon sırasında çalışırsa refresh erken döner; mutasyon sonrasında biriken dış değişikliği yeniden okuma garantisi de yok (92–95, 40, 84).

**Öneri:** GET ve mutasyonları kapsayan tek revision/iş sırası; mutasyon öncesindeki GET'in paint yetkisini kaldırma; mutasyon sırasında gelen invalidation'ı “yeniden oku” olarak saklama ve işlem sonunda tek yenileme. Sadece revision artırıp mutasyon sürerken sonsuz GET döngüsü yaratmayın.

**Kabul:** Eski GET → yeni POST → geç eski GET, POST hatası, nonce yenilenmesi ve mutasyon sırasında dış sepet olayı senaryolarında en son sunucu durumu korunmalı; gereksiz çift istek oluşmamalı.

### F3 — P2: WooCommerce sepet senkronizasyonu iki yönlü tamamlanmamış

**Kanıt:** cart-controller.js:98–109 native `wc-blocks_added_to_cart` ve bazı jQuery olaylarını dinliyor; native `wc-blocks_removed_from_cart` dinlenmiyor. Dinleyici yokluğu yerel bind kontrolüyle doğrulandı. Tema update/remove başarı yolunda (73–78) yalnız kendi DOM'unu boyuyor; Woo Blocks veri deposuna invalidation/senkronizasyon bildirimi görünmüyor.

**Etki:** Native remove olayı yayan bir eklenti/blokta tema rozeti eski kalabilir. Tema popup'ından yapılan işlemin aynı belgedeki Woo Cart/Checkout görünümüne yansımaması riski var. Her Woo sürümündeki her işlem bu olayları yayar varsayımı yapılmamalı; gerçek entegrasyon testi gerekli.

**Öneri:** Desteklenen Woo sürümleri için native/classic olayları ve mevcut Blocks cart store'u kullanan küçük, tek entegrasyon adaptörü. Tema POST'u sonrasında diğer tüketicileri uygun şekilde geçersiz kılma. jQuery + native çift olayda istek çoğalmasını ve kendi bildirimini tekrar işleyip döngüye girmeyi önleyin. Sırf bunun için mağazanın her sayfasına ağır Blocks bağımlılıkları taşımayın.

**Kabul:** Aynı sayfada Woo Cart block + tema popup'ı; iki taraftan remove/quantity; classic add-to-cart; rozet, sepet, toplam ve checkout tutarlılığı; ağ istek sayısı kontrolü.

### F4 — P2: Testler başarılı, fakat gerçek WordPress modül/checkout entegrasyonu bu depoda yayın kapısı değil

**Kanıt:** tests/navigation-browser.cjs:17–36 importları kaldırıyor, gerçek modülleri inline ediyor ve `store()` fonksiyonunu taklit ediyor. tests/render-header.php WordPress/Woo fonksiyonlarını stub'lıyor; gerçek Woo login şablonu yerine fixture basıyor. tests/checkout-browser.cjs başlangıcında checkout alanları elle tanımlı; gerçek ödeme sağlayıcısı JS'si veya Woo block runtime'ı çalışmıyor. deploy.py:108–111 bazı ana varlıkların bytes'ını ve HTTP sağlığını kontrol ediyor.

Bunlar değerli DOM/controller regresyon testleri; **başarısız sayılmıyorlar**. Fakat import-map, modül cache'i, gerçek Woo CSS cascade'i, REST oturumu veya checkout yeniden hesaplamasını doğrulamıyorlar. Eski eklenti belgesinde bir WordPress entegrasyon harness'i geçmesi, güncel bağımsız tema CI'sının onu çalıştırdığı anlamına gelmiyor.

**Öneri:** Aynı tema ZIP'ini ve uyumlu Codela köprüsünü kuran izole WordPress/Woo smoke testi: gerçek Script Modules/Interactivity, Store API nonce+cart, guest login/register, Checkout block ve classic checkout. Mevcut hızlı testleri koruyun; gerçek entegrasyon testini kritik sınırlar için ekleyin.

**Kabul:** Gerçek PHP/WP/Woo kaynaklarıyla misafir + giriş yapmış kullanıcı, cache açık/kapalı, mevcut Site Editor template override'ı ve bir test gateway'i. Ödeme smoke testi gerçek müşteriden tahsilat gerektirmez. Fiziksel Safari kabulü ayrı kayıt olsun.

**Ek doğrulama riski:** Guest Woo login/register formu artık çoğu mağaza sayfasının HTML'inde render ediliyor (render.php + account.php). Uzun ömürlü sayfa cache'inde nonce yaşı ve eklentilerin forma eklediği kullanıcıya özel alanlar gerçek cache konfigürasyonunda sınanmalı. Bu inceleme bir nonce sızıntısı veya kesin login hatası tespit etmiş değildir; hız için körlemesine tüm sayfaları cache dışına çıkarmayın.

### F5 — P2: Ortak tasarım sınırı eski genel WooCommerce button kuralında delinmiş

**Kanıt:** assets/storefront.css:89:
`.woocommerce a.button,.woocommerce button.button,.woocommerce input.button`
hâlâ background/color/padding/radius tanımlıyor. Bu selector guest/tema kapsamıyla veya `:not(.codela-my-account-layout)` ile sınırlı değil. docs/design-system.md genel Woo button kurallarını yasaklıyor. Yeni UI Kit merkezi olsa da bu eski kural ürün, sepet ve eklenti Hesabım kapsamına aday olabiliyor.

**Etki:** Ortak düğmenin görünümünü değiştirince tüm native Woo düğmeleri aynı sözleşmeyi izlemeyebilir; plugin button görünümüne cascade etkisi mümkün. Gerçek canlı plugin ekranında hangi kuralın kazandığı ölçülmedi; “Hesabım kesin bozuk” sonucu çıkarılmamalı.

**Öneri:** Eski kuralı kontrollü biçimde paylaşılan native Woo adaptörüne taşıyıp tema sahipliğindeki bağlamlarla sınırlandırmak; plugin Hesabım'ı açıkça dışlamak. Sayfa başına kopya button veya daha fazla `!important` eklemeyin.

**Kabul:** Tema CTA ve native ürün/sepet/login/checkout normal-focus-pressed-disabled durumları; Codela signed-in orders/addresses düğmelerinin plugin stilini koruması. Görsel değişiklik yaratmadan sınırı kapatmak hedeflenmeli.

### F6 — P2 ölçüm / P3 optimizasyon: “Hız öncelikli” kararının ölçülebilir kabul sınırı eksik

**Koddan ölçülen tema varlıkları (0.1.49):**

| Grup | Dosya | Ham byte | Yerelde dosya başına gzip toplamı |
|---|---:|---:|---:|
| Giriş + 4 controller + format modülü | 6 | 44.585 | 13.528 |
| Ortak CSS zinciri | 5 | 43.028 | 11.461 |
| Normal misafir sayfada ek auth.js + account-overlay.css | 2 | 9.087 | 2.762 |
| Normal misafir toplamı | 13 | 96.700 | 27.751 |

Bunlar **gerçek transfer ölçümü değil**; WordPress/Woo/Codela runtime'ı, görseller, HTML, HTTP başlıkları ve diğer eklentiler dahil değil. Bu sayılardan site “hızlı/yavaş” veya PageSpeed puanı üretilemez.

**Somut fırsatlar:**
- functions.php:60 tüm sayfalarda ana modülü yüklüyor. Guest My Account header'ında dialog hiç yok (render.php guest erken dönüş), fakat alt modüller statik import nedeniyle yine yükleniyor; init'teki erken dönüş indirmeyi engellemez.
- Normal sayfalarda badge için başlangıç cart GET'i son kullanıcı talebiyle bilinçli eklendi. Bunu eski “yalnız açılışta getir” kuralına geri çevirmeyin. Ancak paintCart rozetle beraber kapalı panelin tüm satırlarını ve resim markup'ını da oluşturuyor. Büyük sepette DOM/olası görsel yükü ayrıca ölçülsün; önce sayı/veri güncelleme, panel açılınca satır çizme seçeneği incelenebilir.
- Statik relative import zincirinin preload/version bilgisi WordPress'e bildirilmemiş; F1 çözümüyle birlikte ağ zinciri de incelenmeli.
- Guest auth formunun tüm sayfalarda hazır olması anlık açılmayı sağlıyor; lazyleştirme kararı açılış gecikmesi ve nonce/caching ile birlikte değerlendirilmeli.
- Birden fazla glass yüzey ve scroll geometrisi gerçek cihazda profillenmeli; salt CSS'te blur görmek tek başına performans hatası değildir.

**Öneri:** Aynı cihaz/ağda soğuk-sıcak cache, boş/dolu sepet, Home/Product/Account/Checkout için başlangıç istek sayısı/byte, TTFB, LCP/CLS ve etkileşim gecikmesini kaydedin. Saha INP ile laboratuvar tıklama süresini karıştırmayın. Ölçülen başlangıca göre regresyon bütçesi belirleyin; “her modülü lazy yap” ya da “hepsini tek dosya yap” peşin kararı vermeyin.

### F7 — P2 dokümantasyon: Güncel kurallar ve tarihçe birbirine karışmış

**Kanıt:** AGENTS.md yaklaşık 107 KB ve çok sayıda eski “sıradaki iş” kaydı içeriyor. docs/storefront-theme.md başında hâlâ 0.1.26/0.1.1 durumları ve tamamlanmış bağımsız deploy/header-footer işleri “kalan” olarak görünüyor. Eski açıklama cart'ın yalnız açılınca getirildiğini söylüyor; 0.1.47 kodu her normal sayfada badge'i yüklüyor. Kalıcı bölüm “kapatma bekletmez” derken daha yeni onaylı Menu/X animasyonunun kapanışı 280ms; son kullanıcı kararının geri alınmaması gerekir. design-system.md başındaki extract-controller/playground işleri de sonraki tarihçede tamamlanmış.

**Etki:** Başka bir yapay zekâ yapılmış işi tekrar yapabilir veya yeni onaylı davranışı eski kurala döndürebilir. Kullanıcının devam eden eşzamanlı çalışma uyarısı nedeniyle özellikle önemli.

**Öneri:** Ayrı bir dokümantasyon düzenlemesinde AGENTS'i kısa güncel kurallar + tek devam noktası + rapor bağlantısına dönüştürmek; tarihçeyi silmeden sürüm günlüğüne taşımak. Bu incelemede büyük dosyalar yeniden düzenlenmedi; yalnız rapor okuma notu eklenerek mevcut kayıtlar korundu.

**Kabul:** Yeni ajan tek sayfalık güncel özetten geçerli API, UI sahipliği, 0.1.49 durumu, açık bulgular ve sonraki işi ayırt edebilmeli. Eski tarihli talimatlar güncel talimat diye uygulanmamalı.

## Diğer mimari notlar

- Google login için yeni bir eklenti/SDK eklenmemiş; yerel modül içinde state, PKCE, sabit provider endpoint'leri ve yetkili kullanıcı korumaları var. Bu inceleme tam OAuth güvenlik sertifikasyonu değildir; gerçek yapılandırılmış Google girişi test edilmedi.
- `inc/google-auth.php` ayar ekranını Appearance → Google login altında oluşturuyor. Bu, genel “tema ayarları Codela panelinde” kuralından farklı; 0.1.41 tarihçesinde açıkça belgelenmiş. Bu incelemede onaylı entegrasyon sökülmemeli. Bir sonraki ayar düzenlemesinde bunun kalıcı istisna mı yoksa mevcut Codela paneline taşınacak tema bölümü mü olduğu net kaydedilmeli; yeni eklenti zorunluluğu çıkarılmamalı.
- Statik ayarların Interactivity state yerine config ile ifade edilmesi semantik bir iyileştirme olabilir; tek başına hata veya yeniden yazım gerekçesi değil.
- Tema bağımlılık kontrolü ve fail-closed 503 davranışı mevcut ürün kararıyla uyumlu. Eklentinin tema bağımsızlığı korunmalı.
- Kaynak kodda tema asset kapsamı küçük; asıl toplam maliyet WordPress, WooCommerce, Codela ve mağaza içeriğiyle birlikte ölçülmeli.

## Önerilen ilerleme sırası

1. **F1 + F2:** sürümlü module dependency zinciri ve sepetin tek tutarlı işlem sırası. Ürün/UI yeniden tasarlamadan düzeltin.
2. **F3 + F4:** Woo/native/classic sepet tüketicilerinin senkronizasyonu ve gerçek WP/Woo smoke kabulü.
3. **F5 + F6:** genel button sızıntısını sınırlandırın; gerçek cihaz/ağ ölçümünü kaydedin; yalnız ölçülen maliyeti optimize edin.
4. **F7:** güncel kural/tarihçe ayrımını küçük bir dokümantasyon işi olarak tamamlayın.
5. Sonra ürün/mağaza/içerik düzenleme geliştirmelerine mevcut mimari üzerinde devam edin.

Diğer çalışma kendi kapsamındaki düzeltmeyi bitirebilir; rapor nedeniyle tüm depoyu geri sarmayın. Bu listenin amacı sonraki büyük özellik turundan önce ortak temeli sağlamlaştırmaktır. Rapor bulguları kaynak commit'e bağlıdır; düzeltildikçe commit/test kanıtıyla “kapandı” olarak işaretlenmelidir.

## Resmî referanslar

12 Ekim 2026 tarihinde kontrol edildi; kod bulgularının yerine geçmezler.

- [WordPress wp_register_script_module](https://developer.wordpress.org/reference/functions/wp_register_script_module/): sürüm parametresi kayıtlı modül URL'sinin cache-busting query'sidir; modül kimliği import map'te kullanılır.
- [WordPress Interactivity state/context/config](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/core-concepts/understanding-global-state-local-context-derived-state-and-config/): state ve config ayrımı için.
- [WooCommerce DOM events](https://developer.woocommerce.com/docs/block-development/extensible-blocks/cart-and-checkout-blocks/dom-events/): native added/removed olayları, jQuery çevirisi ve preserveCartData davranışı.

## Bu incelemede yapılan değişiklik

Yalnız bu rapor ve AGENTS.md / docs/storefront-theme.md içindeki yönlendirme notları. Tema/eklenti kodu, test kaynakları, sürüm, workflow ve mağaza ayarları değiştirilmedi. Dokümantasyon dosyaları mevcut deploy workflow path filtresinin dışındadır; bu rapor için yeni tema yayını başlatılmamalı.
