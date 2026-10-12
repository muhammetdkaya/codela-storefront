# Codela Storefront — sağlamlaştırma uygulama rehberi

Tarih: 12 Ekim 2026  
Dayanak: [mimari inceleme raporu](architecture-review-2026-10-12.md)  
Kontrol edilen HEAD: `f4c8ad68d9b228c5c4ea3a4823fbf8d7a6fc6f0d`; uygulama kodu 0.1.49.

Bu belge, uygulamayı devralan yapay zekâ için dosya bazlı görev ve kabul sözleşmesidir. **Bu çalışmada yalnız rehber yazıldı; aşağıdaki düzeltmeler uygulanmış değildir.** Kullanıcının diğer çalışmada verdiği uygulama yetkisini ve en güncel talimatlarını esas alın. Rapor ya da bu rehber tek başına yeni yayın yetkisi oluşturmaz.

## 0. Başlangıç ve çalışma sınırı

1. Güncel AGENTS.md, mimari rapor, bu rehber ve docs/design-system.md dosyalarını okuyun. Sonra HEAD, çalışma ağacı ve açık değişiklikleri kontrol edin. Rapor tarihinden sonra kapanmış bulguyu tekrar uygulamayın.
2. İlgili dosyalardaki eşzamanlı değişiklikleri inceleyin. Yerel çalışma varsa koruyun; gerekiyorsa ayrı worktree kullanın. Eski rapor SHA'sını main'e zorla yazmayın.
3. Aşağıdaki işleri tek büyük tasarım değişikliğinde birleştirmeyin. Modül/sepetteki doğruluk düzeltmeleri, CSS düzenlemesi ve performans optimizasyonu ayrı incelenebilir adımlar olsun.
4. Tek Interactivity store, tek dialog, tek dock ve mevcut controller sahipliği korunacak. SPA, router, yeni framework, ikinci sepet servisi, yeni WP eklentisi eklenmeyecek.
5. Kullanıcının onayladığı Header/Menu-X hareketi, alt menü, guest Account popup'ı ve checkout yerleşimi bu çalışmada yeniden tasarlanmayacak. Signed-in Codela account/orders/addresses ekranları eklentiye ait kalacak.
6. Store API fiyat, vergi, stok ve miktar sınırlarının kaynağıdır. İstemcide tahmini finansal hesap veya müşteri sepetini ortak cache'e yazma yok.
7. Dokümantasyon düzenlemesinde sürüm yükseltmeyin. Uygulama sürümü çıkarırken mevcut sürüm/CI/deploy kayıt kurallarını izleyin.

### Önerilen iş paketleri

| Paket | Kapsam | Ana dosyalar | Tamamlanma kapısı |
|---|---|---|---|
| A | F1: Modül kayıtları ve cache | functions.php; assets/storefront.js; scripts altındaki importlar; ilgili testler | Gerçek import map ve sıcak cache testi |
| B | F2: Sepet işlem sırası | assets/scripts/cart-controller.js; controller testleri | Eski GET, mutasyon, hata ve dış olay yarışları |
| C | F3 + F4: Woo senkronizasyonu ve entegrasyon | cart-controller; gerekiyorsa küçük adapter; tests; CI | Gerçek WP/Woo Cart/Checkout iki yönlü doğrulama |
| D | F5: Ortak düğme sınırı | assets/storefront.css; styles/components.css; ilgili browser testleri | Tema düğmeleri tutarlı, plugin düğmeleri etkilenmiyor |
| E | F6: Hız | Ölçümün işaret ettiği dosyalar | Önce/sonra aynı koşulda ölçüm, işlev kaybı yok |
| F | F7: Güncel belge düzeni | AGENTS.md; docs | Tek güncel özet, korunan tarihçe ve kapanış kanıtı |

Tema yollarının kökü `theme/codela-storefront/` dizinidir.

## A. F1 — WordPress Script Modules üzerinden tam bağımlılık kaydı

### Uygulanacak değişiklik

functions.php içindeki tek giriş kaydını, **mevcut dosyaları değiştirmeden tanımlayan** küçük bir kayıt tablosuyla genişletin. Dosyalar yine ayrı modüller olsun. Önerilen kimlikler:

| Modül kimliği | Dosya | Statik bağımlılıklar |
|---|---|---|
| codela-storefront/format | assets/scripts/format.js | Yok |
| codela-storefront/search | assets/scripts/search-controller.js | codela-storefront/format |
| codela-storefront/cart | assets/scripts/cart-controller.js | codela-storefront/format |
| codela-storefront/overlay | assets/scripts/overlay-controller.js | Yok; controller nesneleri mevcut callback sözleşmesiyle gelir |
| codela-storefront/dock | assets/scripts/dock-controller.js | Yok |
| codela-storefront | assets/storefront.js | @wordpress/interactivity ve dört controller kimliği |

- Her yerel modülü `wp_register_script_module()` ile kaydedin; bağımlılık listesini gerçek importlarla eşleştirin. Yalnız giriş modülünü enqueue etmek yeterli olmalı.
- Girişteki relative controller importlarını ilgili kayıt kimlikleriyle değiştirin. Search/cart içindeki format importu da kayıtlı kimliğe geçmeli. Sadece PHP kayıt ekleyip relative importu bırakmak F1'i çözmez.
- Örnek hedef import: `import { createCartController } from 'codela-storefront/cart';`. WordPress çekirdek modülünün kimliğini değiştirmeyin.
- Yerel modül URL'leri içerik değişince değişen deterministik version taşımalı. **Bu küçük dosya kümesinde öneri:** mevcut SVG sürümlemesine benzer, izinli sabit dosya yollarının içerik hash'ini istek içinde bir kez hesaplayan küçük helper. `hash_file('sha256', $path)` sonucunun yeterli uzunlukta kısmı kullanılabilir. Aynı dosyanın hash'ini aynı istekte tekrar hesaplamayın; kullanıcı girdisinden dosya yolu oluşturmayın.
- Değişmeyen parent modülün import ettiği child değişince child URL'sini güncellemek için import map yeterlidir: parent zaten sabit kimlik kullanır. Parent'ın query parametresini child'a elle taşıyan bir çözüm kurmayın.
- Hash hesaplamasının PHP maliyetini ölçün. Sorun olursa mevcut Python paketleme hattında deterministik hash manifest üretmek sonraki optimizasyon olabilir; F1 için yeni bundler/webpack altyapısı gerekmez.
- WordPress 6.5 alt sınırını korurken desteklenmeyen yeni fonksiyon argümanlarını koşulsuz eklemeyin. Giriş ve transitive bağımlılıkların frontend çıktısını gerçek WordPress üzerinde kontrol edin.
- Cache ömrü boyunca açık kalan eski sayfanın import map'i kendiliğinden yenilenmez. A→B kabul testi yeni HTML belgesiyle yapılmalı; CDN/page-cache invalidation politikası ayrıca doğrulanmalı.

### Test güncellemesi

Mevcut unit/fixture testleri relative import kalıplarını siliyor. Yeni kimlikleri tanıyacak şekilde yalnız test harness'ini güncelleyin; gerçek modülleri kopyalayıp ikinci bir uygulama yazmayın. Bu hızlı testler gerçek import-map testinin yerine geçmez.

**Kabul senaryosu:**
1. Aynı tarayıcı profilinde A HTML'ini ve modüllerini yükle; HTTP cache açık olsun. Cache testinde istekleri cache'i devre dışı bırakan route interception ile sahteleme; yerel HTTP sunucusu veya izole WP üzerinde gerçek Cache-Control kullan.
2. Sadece cart-controller içeriğini B'ye değiştir ve yeni HTML/import map üret.
3. Cache temizlemeden normal gezinmeyle B belgesine git.
4. Network kaydında cart modül URL'sinin değiştiğini ve B kodunun çalıştığını doğrula. Format değişmediyse URL'si aynı kalmalı.
5. Format'ı değiştirerek aynı testi tekrarla: search/cart importları yeni format URL'sini kullanmalı.
6. Bare-specifier çözümleme hatası, çift controller kurulumu veya eski/new karışımı olmamalı.

**Yapılmayacak:** random/time cache-buster, bütün sitede no-store, kullanıcıya cache temizletmeyi çözüm sayma, yalnız storefront.js sürümünü yükseltme.

## B. F2 — Sepet controller'ında tek işlem düzeni

### Korunacak dış sözleşme

Mevcut `bind/getData/refresh/change/invalidate` API'si mümkün olduğunca korunsun. Overlay/dock kendi ikinci cart state'ini oluşturmasın. UI tıklamaları miktar hesaplamasını sunucuya gönderir; sunucu cevabı tek otoritedir.

### Durum ve kurallar

Mevcut değişkenleri düzenleyin; aşağıdaki anlamlar açık olsun. İsimlerin aynen kullanılması zorunlu değil.

- `lastGoodCart`: son kabul edilen veri; invalidation geldi diye silinmez.
- `generation`: eski okuma sonuçlarının geçerliliği.
- `readPromise/readAbort`: tek devam eden GET.
- `writePromise` veya eşdeğer writing işareti: tek devam eden mutasyon.
- `dirty`: yeniden sunucu okuması gerekiyor.
- `externalRevision`: dış olayların mutasyon sırasında artıp artmadığı.
- İsteğe bağlı `scheduledRefresh`: aynı anda gelen olayları bir yenilemeye toplar; polling değildir.

**Temel invariants:**
- Mutasyon başladıktan sonra eski GET ne veri, ne nonce, ne hata UI'si yazabilir.
- Bir GET'in `finally` bloğu kendisinden sonra kurulmuş başka readPromise'i temizleyemez; request kimliği karşılaştırılsın.
- Mutasyon sürerken UI okuması başlatılmaz. Nonce alma ve mutasyon sonrası hata toparlama GET'leri yalnız o mutasyonun kontrollü akışında yapılır.
- Dış invalidation kaybolmaz. Writing sürerken dirty bırakılır; sonunda gerektiğinde bir yenileme planlanır.
- Son iyi sepet loading ekranıyla silinmez. İlk veri yoksa loading gösterilir; eski veri gösteriliyorsa yanlışlıkla güncel/kesinmiş gibi işlem yapılmasına izin verilmez.
- Her çıkış yolunda busy/inert/disabled durumu çözülür; miktar sınırına göre gerçekten devre dışı olması gereken butonlar korunur.

### Akışın uygulanması

1. **refresh:** writing varsa dirty işaretle ve ertelenmiş yenileme isteği olarak dön. GET zaten varsa ona katıl. Yeni GET başlarken generation/externalRevision'ı kaydet. Yanıt yalnız hâlâ aynı generation'a aitse ve writing başlamamışsa kabul edilir.
2. **GET geçersizleşirse:** eski başarıyı veya hata metnini boyama. Mutasyon beklemiyorsa ve dirty ise tamamlandıktan sonra tek yeni GET planla. Mevcut sınırsız `while(true)` ağ döngüsünü kuyruk mantığına çevir.
3. **change:** hemen writing işaretle, generation artır, mevcut GET'in paint yetkisini kaldır ve mümkünse GET'i abort et. Abort'un hata paneli oluşturmasını engelle. Ardından mutasyon akışını başlat.
4. **nonce:** request fonksiyonu cevabı ve nonce'u birlikte döndürebilir; nonce'u kontrolsüz biçimde her eski yanıtın global state'e yazmasına izin verme. Mevcut eksik/geçersiz nonce yenilemesi en fazla bir kontrollü tekrar olsun.
5. **POST başarılı:** yeni sunucu verisini kabul et. Mutasyon sırasında dış olay olduysa dirty temizlenmesin. İlgili Woo tüketicilerine C paketindeki bildirim bir kez gönderilsin.
6. **POST başarısız:** sunucunun geçerli cart snapshot'ını veya kontrollü recovery GET'ini kullan. Bunlar da başarısızsa son iyi görüntüyü koru, anlaşılır hata ve retry sun. Otomatik yeni POST üretme.
7. **finally:** writing/busy/inert çöz; dirty ise tek GET planla. Restore focus yalnız cart hâlâ açıkken yapılsın.
8. Yazma isteğini istemcide abort edip “sunucuda yapılmadı” varsayma. Kullanıcıdan aynı mutasyonu tekrar göndermesini otomatik olarak isteme. Ağ hatasından sonra önce sunucu durumunu uzlaştır.

### Zorunlu controller regresyonları

| Test | Beklenen sonuç |
|---|---|
| GET A bekler → POST miktar 2 → GET A miktar 1 ile döner | Son veri 2; eski nonce/hata da geri yazılmaz |
| GET A bekler → POST başlar → GET A hata verir | Başarılı mutasyon ekranı eski GET hatasıyla bozulmaz |
| POST sırasında 3 dış invalidation | Sonunda tek planlı refresh; son sunucu durumu |
| Ardışık jQuery/native eş olay | Aynı işlem için gereksiz ikinci GET yok |
| 403 geçersiz nonce → GET nonce → POST | En fazla bir retry; busy çözülür |
| POST hata + recovery GET hata | Sonsuz döngü yok; son iyi veri ve retry |
| Sepet boşalır | Rozet/alt toplam/checkout görünürlüğü doğru |
| Cart'tan Search'e geçerken POST biter | Search status/focus bozulmaz |
| bind iki kez çağrılır | Dinleyiciler ve ilk GET çoğalmaz |

Ağ yanıtlarının sırasını deferred promise ile kontrol edin; gerçek controller kaynaklarını çalıştırın. Sadece kod içinde “generation++ var mı” arayan test yeterli değildir.

## C. F3 — WooCommerce tüketicileriyle iki yönlü senkronizasyon

**Amaç:** Tema popup'ı, aynı sayfadaki Woo Cart/Checkout ve rozet aynı sunucu sepetini göstermeli. Her görünüm kendi ayrı sepet mantığını kurmamalı.

### Dışarıdan temaya

- Native added ve removed olaylarını dinleyin. Classic added_to_cart / removed_from_cart / updated_wc_div desteğini koruyun.
- Tüm yollar B paketindeki tek invalidation girişine yönlensin.
- jQuery olayının native karşılığı aynı işlemi temsil edebilir. Kısa scheduler/debounce ile eş olayları birleştirin; sırf ikinci sinyal geldi diye devam eden GET'i kesinlikle yeniden başlatmayın. Ancak GET başladıktan sonra gerçekten yeni bir işlem olursa yeni revision kaybolmamalı.
- Native add olayındaki preserveCartData, Woo'nun kendi store'una ilişkindir; tema snapshot'ının otomatik güncel olduğu anlamına gelmez. Tema verisini mevcut store'dan güvenle almadıysanız bu bayrağı körlemesine “refresh yok” diye yorumlamayın.
- Woo Blocks içindeki tüm quantity değişikliklerinin bu DOM olaylarını yaydığını varsaymayın. İlgili Woo sürümündeki cart store güncellemelerini gözlemleyen koşullu adaptör gerekebilir. Yalnız ilgili sepet alanları değişince çalışsın; her wp.data bildirimi ağ isteği başlatmasın.

### Temadan WooCommerce'e

- Sadece gerçek sunucu başarısından sonra diğer tüketicilere haber verin.
- Remove işlemini native removal olayıyla bildirmek uygundur; quantity değişikliğini “ürün eklendi” diye sahte olaya çevirmeyin.
- Woo cart store zaten mevcutsa resmi, kurulu sürümde doğrulanmış yenileme/stale akışını kullanın. Belgelerde `cartStore`, `setIsCartDataStale`, `receiveCartContents` gibi yüzeyler vardır; eylemin kendisinin fetch başlatıp başlatmadığını gerçek sürüm kodu/testiyle doğrulayın.
- **Ham Store API JSON'unu doğrudan setCartData'ya basmayın:** REST snake_case alanları ile store'un normalize ettiği alanlar aynı kontrat değildir. Adres, kupon, extension ve totals kaybına yol açmayın. En güvenli ilk entegrasyon, doğrulanmış store yenileme yoludur.
- Kaynak işareti/scope guard ile temanın kendi bildirimini tekrar işleyip GET→bildirim→GET döngüsü kurmasını engelleyin. Başka tüketicilerin ihtiyacı olan bildirimi engellemeyin.
- Classic Cart/Checkout için o sayfanın desteklediği refresh/recalculation girişini doğrulayın ve yalnız o bağlamda çalıştırın; bütün mağazada cart-fragments refresh yaymayın.
- Woo global/store henüz yüklenmediyse başlangıç sırasını desteklenen asset bağımlılıklarıyla çözün. `setInterval` ile sonsuz global araması yapmayın.
- Blocks store'unu yalnız kullanmak için Home'a yeni ağır bundle yüklemeyin. Mevcut Woo scripts varsa adaptör kullanın; yoksa hafif Store API yolu sürsün.

Küçük adaptör controller içinde açık bir bölüm olabilir; boyut/sorumluluk gerektirirse ayrı dosya yapın. Ayrı dosyada yeni sepet state'i/POST motoru bulunmasın.

**Kabul:** Gerçek Woo Cart block, Checkout block ve classic sayfalarda iki taraftan miktar/silme; coupon/stock hata durumu; yavaş ağ; aynı anda dış add; JS konsolu ve istek sayısı. Ağ profilinde ilk sayfa GET'i, kullanıcı işlemi POST'u ve gerekçeli refresh ayrı sayılmalı. Otomatik sürekli istek veya event döngüsü varsa F3 kapanmaz.

## D. F4 — Gerçek WP/Woo testi, mevcut testlerin yanına

### Kurulum

- Eklenti deposundaki `tools/test-theme-wordpress.php` harness'ini önce okuyun; güncel standalone tema ZIP'ini gerçekten kurup kurmadığını doğrulayın. Dondurulmuş 0.1.1 paketini test edip 0.1.49+ için başarı yazmayın.
- İzole/geçici WP + Woo + uyumlu Codela ile kurulum hazırlayın. Canlı siteyi test verisi üretmek için kullanmayın.
- Eklenti referansı/paket kaynağı ve WP/Woo sürümleri kayda alınsın. Destek iddiası için minimum uyumlu WP/Woo çifti ve güncel dağıtım çifti sınansın; birbiriyle uyumsuz rastgele sürüm kombinasyonu seçilmesin.
- Test hesapları/ürünler fixture olsun. Gerçek müşteri şifresi, Google secret veya banka ödeme bilgisi gerektirmeyen test gateway kullanın.
- Gerçek Interactivity runtime, import map, Woo frontend CSS/JS ve Store API yüklensin. Bu testte store/action bağını stub'lamak yok.

### Asgari smoke kapsamı

| Akış | Kontrol |
|---|---|
| Home açılışı | Modüller doğru URL, tek store/dialog/dock, açmadan doğru rozet |
| Search | Gerçek REST, görünür/gizli ürün, geç yanıtın elenmesi |
| Cart | Session cookie, nonce, quantity/remove, sunucu limitleri |
| Cart/Checkout birlikte | F3 senkronizasyonu, eski totals kalmaması |
| Guest Account | Gerçek Woo login/register/reset; aynı sayfada duplicate ID/form çakışması yok |
| Signed-in Codela | Orders/addresses tasarımı tema CSS'iyle bozulmuyor |
| Checkout | Gerçek block ve classic yerleşimi, gerekli alanlar, test gateway hata/success |
| Cache | F1 sıcak cache; uzun ömürlü guest form nonce; login sonrası cache ayrımı |
| Site Editor override | Kullanıcı kayıtlı template varsa tespit; otomatik silme yok |

Hızlı fixture/browser testleri korunmalı. Gerçek smoke ilk aşamada lokal/staging çalışabilir; CI'ye eklendiğinde deploy ona bağımlı olsun. Özel eklenti kaynağına CI erişimi yoksa bunu açık engel yazın; mock test sonucunu entegrasyon başarısı diye göstermeyin.

**Hata sınıflaması:** Eski Site Editor template'i tema şablonunu eziyorsa CSS yamalamak yerine kaynağı teşhis edin. Kullanıcı düzenlemesini kendiliğinden silmeyin. Üçüncü taraf gateway hatasıyla tema markup hatasını ayrı raporlayın.

## E. F5 — Düğmelerin tek tasarım kaynağına taşınması

1. assets/storefront.css içindeki genel `.woocommerce a.button / button.button / input.button` kuralının kullanıldığı sayfaları envanterleyin.
2. styles/components.css içinde zaten bulunan guest submit ve checkout adaptörlerini bulun. Yeni paralel button tarifi yerine aynı primitive'in selector kapsamını genişletin.
3. Ürün add-to-cart, cart action ve diğer tema sahipliğindeki native kontrolleri semantik rollerine göre primary/secondary/quiet eşleyin. “Bütün Woo butonlarını primary yap” yaklaşımı kullanmayın.
4. Plugin signed-in account scope'unu açıkça dışlayın. Eklentinin DOM'una sf-ui sınıfı ekleyerek sahipliği temaya taşımayın.
5. Paint/typography/radius/pressed/focus/disabled merkezi kalsın; sayfa dosyaları yerleşim, genişlik ve gerektiğinde mevcut token override'larını tutsun.
6. Genel kuralı ancak tüm hedef görünümler karşılandıktan sonra kaldırın; bir anda silip Woo varsayılanına düşürmeyin.
7. Woo'nun loading/spinner ve native disabled anlamlarını koruyun. input[type=submit] ile button aynı iç markup'a sahip değildir; adapter bunu dikkate alsın.
8. Hesap alanlarındaki mevcut label/input düzenini bu pakete karıştırmayın. Aynı ekranda yeni sorun kanıtı varsa ayrı kaydedin.

**Kabul:** Home CTA, header/X, ürün ekleme, cart checkout, guest login/Google ve gerçek checkout butonları için normal/hover/focus/pressed/disabled; Codela signed-in account düğmeleri için önce/sonra computed style ve ekran karşılaştırması. Farklı semantik varyantlar aynı renk olmak zorunda değil; aynı varyantın sözleşmesi aynı olmalı.

## F. F6 — Ölçümden sonra küçük hız düzeltmeleri

### İlk ölçüm

Aynı cihaz, tarayıcı, viewport ve ağ profili; aynı ürün/görseller/eklenti ayarları; en az 3 tekrar. Cold ve warm cache ayrı. Boş sepet, 1 ürün ve temsilî büyük sepet (örneğin 20 satır) ayrı.

Home/Product/Guest Account/Checkout için: TTFB, LCP, CLS, toplam transfer, tema JS/CSS transferi, request sayısı, başlangıç cart GET süresi, menu/cart açılış süresi ve uzun main-thread işleri. Fiziksel Safari ölçümü ayrıca kaydedilsin. Laboratuvar click süresini saha INP diye adlandırmayın.

### Ölçümle gerekçelendirilmiş ilk adaylar

- Guest My Account'ta özel sade header var ve dialog yok: burada storefront entry enqueue edilmesini kaldırmak değerlendirilebilir. Ancak preventInitialAccountAutoFocus şu an entry içinde; gerekli guest davranışını mevcut auth.js sahipliğine taşıyıp aynı testi korumadan modülü kesmeyin. Gerçek Codela signed-in sayfasında header/dock gerekli olduğu için bu koşul ona uygulanmaz.
- Rozet güncellemesini satır çiziminden ayırın. Cart verisi + badge hemen güncellenir; kapalı panelin satırları dirty işaretlenebilir. Açılışta son snapshot çizilir, gerekiyorsa background refresh sürer. Overlay getData/refresh sözleşmesini açıkça güncelleyin; boş panel veya stale checkout yaratmayın.
- Açılış cart GET'ini kaldırmayın; kullanıcı sepeti açmadan rozetin doğru olmasını özellikle istedi. Server-session verisini cacheable HTML veya localStorage'daki eski değerle kesinmiş gibi göstermeyin.
- CSS/JS ayırma/birleştirme/lazy-import kararını waterfall ve kullanıcı etkileşimiyle verin. İlk Menu/Cart tıklamasına ağ beklemesi eklemek hız hedefini bozabilir.
- Blur yüzeylerini ancak gerçek cihazda compositor/paint maliyeti görülürse sadeleştirin; onaylı tasarımı tahmine dayanarak değiştirmeyin.

**Kabul:** Önce/sonra aynı senaryo, ölçülen iyileşme veya nötr sonuç, tüm işlev testleri. Başlangıç ölçümü olmadan keyfî “%30 hızlandı” iddiası yok. Regresyon bütçesi ölçüm gürültüsünü ve mağaza bağımlılıklarını dikkate alarak ayrıca kaydedilmeli.

## G. F7 — Belgeleri diğer yapay zekâların doğru devam edeceği hale getirme

- AGENTS.md: kalıcı kurallar, tek güncel sürüm/devam noktası, sahiplik sınırları, rapor/rehber ve aktif iş bağlantıları.
- docs/storefront-theme.md: güncel teknik durum ve açık işler; ayrıntılı eski sürümler gerektiğinde ayrı changelog'a taşınabilir.
- docs/design-system.md: güncel primitives/controller sahipliği; tamamlanmış extract/playground işleri aktif görev diye kalmasın.
- Tarihçe taşınırken hiçbir karar silinmesin; kaynak/sürüm bağlantıları korunsun. Eski notların yeni onayı geçersiz kılmadığı açık olsun.
- Aynı anda başka ajan belgeyi güncelliyorsa fresh read + SHA kontrolüyle yalnız kendi ekini birleştirin; eski tam dosya kopyasını overwrite etmeyin.
- Dokümantasyon push'u, deploy workflow'un “HEAD değiştiyse atla” kontrolünü etkileyebilir. Aktif source deployment varken kapanış notunu doğru sırayla ekleyin; sadece workflow üst seviye success'e değil gerçek deploy adımına bakın.

### Bulgu kapanış formatı

Her bulgu için aynı küçük kayıt tutulmalı:

| Alan | Yazılacak bilgi |
|---|---|
| Bulgu | F1…F7 |
| Durum | Açık / devam / uygulandı-test bekliyor / kapandı |
| Kaynak | Gerçek uygulama commit'i |
| Değişiklik | 1–3 cümle davranış farkı |
| Doğrulama | Test adı + senaryo + sonuç + sürümler |
| Yayın | Yapılmadı / gerçek workflow ve deploy adımı |
| Kalan | Fiziksel cihaz, gateway veya erişim nedeniyle eksik kabul |

Raporu sonradan “zaten sorun yoktu” diye yeniden yazmayın. Tarihli bulguyu ve hangi commit ile kapandığını koruyun. P1 bulgular yalnız kod yazıldı diye kapanmaz.

## Devralan ajanın ilk somut görevi

**A paketinden başlayın:** Güncel functions.php ve tüm JS importlarını yeniden kontrol edin; F1 hâlâ açıksa native Script Modules kayıtlarını ve deterministik asset version'larını ekleyin. Var olan fixture testlerini uyarlayın ve gerçek HTTP-cache/import-map testini gösterin. Sonra B'nin yarış testini önce mevcut kaynakta başarısız üretip fix'i uygulayın. C/F4 entegrasyon kapısı doğrulanmadan “tüm altyapı tamam” demeyin. UI tasarımını bu sırada değiştirmeyin.

## Resmî referanslar

Aşağıdaki API yüzeyleri 12 Ekim 2026'da kontrol edildi. Uygulayıcı, desteklenen kurulu sürümle eşleştirmeli.

- [WordPress Script Modules kayıt API'si](https://developer.wordpress.org/reference/functions/wp_register_script_module/)
- [WooCommerce native/classic DOM olayları](https://developer.woocommerce.com/docs/block-development/extensible-blocks/cart-and-checkout-blocks/dom-events/)
- [WooCommerce Cart Store kontratı](https://developer.woocommerce.com/docs/block-development/reference/data-store/cart/)

Bu belgedeki işlem sırası ve kabul ölçütleri projeye özel mühendislik önerisidir; resmî kaynaklardan alınmış hazır bir uygulama değildir.
