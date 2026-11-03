# Kütüphane dönüşümü: 0.1.195 başlangıç kaydı

Tarih: 3 Kasım 2026. Aşama 0, mevcut temanın envanteri ve kabul sınırları.

## 1. Sabit kaynak ve sonuç

- İncelenen ana dal: [`687ef83e13621f6117264d04f220fa13c8836bb4`](https://github.com/muhammetdkaya/codela-storefront/tree/687ef83e13621f6117264d04f220fa13c8836bb4), tema **0.1.195**.
- Güncel çalışma dalındaki eşzamanlı değişiklikler test sonucuna karışmasın diye bu SHA `git archive` ile ayrı geçici dizine çıkarıldı. Aşağıdaki sonuçlar aday kütüphane koduna değil, bu sabit başlangıca aittir.
- Deterministik tema ZIP'i **208.367 bayt**; SHA256 **`bfddc47fccaebe2b56fc141b87756ab560206d3d09ed8b074dd1f15d9bd3c41f`**. Depoda kaydedilmiş [v0.1.195](https://github.com/muhammetdkaya/codela-storefront/releases/tag/v0.1.195) paketinin hash'iyle aynıdır. Bu işlem yerel yeniden üretimdir, yayın veya kurulum değildir.
- **Başarılı:** 27 Python testi; 9 Node sözleşme giriş noktası; ayrıca gerçek WordPress 6.5 bağımlılık sınıflarıyla 13 bağlam × debug/production asset testi; 13 PHP sözleşme/fixture giriş noktası; 26 PHP dosyasında lint; 17 JS dosyasında sözdizimi.
- **Yerel tarayıcı kabulü çalışmadı:** Chromium işlemi test başlamadan ortamın `socket() failed: Operation not permitted` hatasıyla durdu. Yetkili bir genişletilmiş çalıştırma denemesi de aynı işletim sistemi kısıtına takıldı. Kaynak assertion hatası değildir. Bu çalıştırmada yeni ekran görüntüsü, geometri, odak veya etkileşim başarısı iddia edilmez.
- **Aşama 0 görsel karşılaştırma kapısı açık:** gerçek tema PHP/CSS/controller'larını kullanan, sabit kaynak hash'ini doğrulayan `tests/fixtures/library-baseline/capture-cart.cjs` hazırdır; izinli CI/tarayıcı ortamında çalıştırılması gerekir. Test ve hash envanteri tamamlandı, yeni görsel başlangıç kaydı henüz tamamlanmadı.

Ham yerel kanıtlar: `qa/library-migration/baseline-2026-11-03/`. `qa/` çalışma ağacında yok sayılır; CI artefaktı olarak saklanabilir. Kaynak ve test sonuçlarının okunabilir özeti bu belgede kalır. Eski kardeş çalışma kopyaları, runtime dosyaları, diğer PR'lar ve canlı mağaza değiştirilmedi.

## 2. Korunacak sahiplik sınırları

| Sahip | Bugünkü sorumluluk | Kütüphane geçişinde değişmeyecek sınır |
|---|---|---|
| `assets/storefront.js` | Tek Interactivity store, eylem bileşimi ve mevcut controller bağlantıları | İkinci store, dialog veya router kurulmaz |
| `inc/ui.php`, `tokens.css`, `components.css` | Button/IconButton üretimi, 44px hedefler, ortak materyal, focus/pressed/disabled | Sayfa başına düğme boyası veya ikinci primitive sistemi eklenmez |
| `overlay-controller.js` | Aynı native dialog, aktif görünüm, odak, scroll kilidi/dönüşü, breakpoint ve iptal | Motion yalnız hareket aracı olabilir; controller ve dialog sahibi olamaz |
| `cart-controller.js` | Store API nonce/veri, tek mutasyon kilidi, revision/abort, Woo senkronizasyonu | Fiyat, stok, miktar ve toplam için sunucu otoritesi korunur |
| `dock-controller.js` | Uzun basma, touch scrub, yön/scroll, route bağlamı | Üründe dock her durumda gizli kalır; ikinci dock eklenmez |
| `gallery-horizontal.js` | Bağımsız native yatay track, sayaç/klavye, caption ölçümü, medya niyeti | Hero pilotunda bir track'in tek hareket sahibi olur; no-JS kaydırma korunur |
| `product-information.js`, `gallery-defer.js` | Gerçek Woo düğümlerini taşıma/geri koyma, native form, sheet, native galeri/zoom | Tek form, yerel validasyon/varyasyon ve belge scroll'u korunur |
| `functions.php` | WordPress Script Modules kayıtları, koşullu yükleme, dosya hash'li sürümleme | Çözülemeyen npm import'u, runtime CDN veya WordPress sunucusunda Node gereksinimi olmaz |
| WordPress/Woo/Codela eklentisi | İçerik, native şablonlar, ürün/sepet/ödeme ve eklenti REST/modülleri | Tema hareket pilotu bu sahipliği veya eklenti runtime'ını değiştirmez |

Güncel 195/194/192 sözleşmeleri eski tarihli notlardan üstündür. Özellikle eski “satın alınamayan üründe dock kalsın” ve “hedef beklerken eski fiyat/panel görünür kalsın” kayıtları bugünkü kabul olarak geri alınmaz.

## 3. Bileşen ve durum kataloğu

| Bileşen | Başlangıç durumları / değişkenleri | Mevcut test dayanağı |
|---|---|---|
| Ortak kontrol | primary/secondary/bare/soft; ikon/metin; hover/pressed/focus-visible/disabled/loading; forced-colors ve reduced-motion | `ui-kit.cjs`, `ui-kit-browser.cjs`, `native-woo-buttons.cjs`, `catalog-browser.cjs` |
| Header ve menü | Menü tanımlı/tanımsız, kısa/uzun/alt menü; 1100px menü eşiği; header offset; aynı Menu/X düğümü; hedef başlık/geri ikonu | `desktop-header-browser.cjs`, `context-header-browser.cjs`, `header-routing-browser.cjs`, `mobile-controls-browser.cjs` |
| Search | Mobil tam ekran / ≥901px header içi aynı form; boş/yükleniyor/sonuç/hata/tekrar; eski istek; native fiyat aralığı/indirim | `search-panel.cjs`, `search-price.php`, `desktop-tools-browser.cjs`, `panel-presentation-browser.cjs` |
| Cart | İlk GET skeleton; boş/dolu; adet alt/üst/sabit sınır; satır spinner; kaldırma; GET/mutasyon yarışı; hata sonrası disabled/focus; değişmeyen GET'te düğüm kimliği | `cart-race.cjs`, `cart-sync.cjs`, `interaction-browser.cjs` |
| Cart yüzeyi | ≤900px normal sayfada tam ekran; üründe aynı dialog kompakt; ≥901px sağ drawer; aç/kapat/yeniden aç; Escape/dış tıklama; breakpoint sırasında açık kalma | `desktop-tools-browser.cjs`, `navigation-browser.cjs`, `panel-presentation-browser.cjs`, `mobile-controls-browser.cjs` |
| Panel hareketi | Giriş 240ms / çıkış 180ms; eski finish callback; hızlı ters yön; bir başka panele geçiş; navigation iptali; çalışma sırasında reduced-motion değişimi | `panel-presentation-browser.cjs`, `desktop-tools-browser.cjs`; yeni Motion pilotu için ek doğrudan karşılaştırma gerekir |
| Dock | Açık/kapalı ayar, normal/ürün route'u; uzun basma/scrub/scroll; pointer release; mobil dialog'a taşıma ve geri koyma | `dock-gesture.cjs`, `navigation-browser.cjs`, `product-no-dock-browser.cjs` |
| Hero / yatay galeri | Tek/çok slayt; mobil/desktop kadraj; uzun kısa copy; sayaç/progress; Home/End/ok tuşları; native swipe; gizli medya; resize; no-JS/print | `showcase-caption.cjs`, `showcase-viewport-browser.cjs`, `homepage-browser.cjs`, `media-loading-browser.cjs` |
| Ürün sheet | Kapalı/açık/sürükleniyor; basit/varyasyonlu/stoksuz/fiyatsız; validasyon/hash; tek native form; iptal/blur/resize; mobil→tablet→desktop düğüm geri dönüşü | `product-sheet-browser.cjs`, `product-drag-frame-browser.cjs`, `product-no-dock-browser.cjs`, `product-first-paint-browser.cjs` |
| Ürün medya / discovery | Mobil dikey / desktop yatay; inline zoom; üç preview; ayrı mobil ürün görseli; keşif alt alanı; lazy/deferred/cache/error | `gallery-defer-browser.cjs`, `product-mobile-media-browser.cjs`, `product-desktop-browser.cjs`, `media-presentation-browser.cjs` |
| Navigation / skeleton | Home/catalog/account/page/product hedefi; doğru alt alan; eski fiyatın gizlenmesi; inert/iptal/timeout/pageshow; native belge ve core router; Back/Forward | `shell-navigation-browser.cjs`, `document-continuity-browser.cjs`, `navigation-viewport-browser.cjs`, `navigation-feedback-bottom-browser.cjs` |
| Header/product skeleton | Gerçek kontrolle aynı ölçü, tek sepet; ≥901px 1.2:1 ürün grid'i; 701–900px tek sütun; mobil panel | `catalog-header-skeleton-browser.cjs`, `desktop-product-skeleton-browser.cjs`, `product-skeleton-geometry-browser.cjs` |
| Native katalog / filtre | Mağaza/kategori/etiket/arama/related; tam kart linki; native satın alma; tek tek aktif filtre kaldırma; bağımsız filtre rozeti; korunacak bilinmeyen parametreler | `catalog.php`, `catalog-browser.cjs`, `catalog-filters-browser.cjs`, `interaction-browser.cjs` |
| Hesap / checkout / form | Guest/signed-in/endpoint/boş durum; native form/nonces; error/focus; sekme sırası; ödeme ayrı belge geçişi | `account-browser.cjs`, `account-dashboard-browser.cjs`, `account-skeleton-browser.cjs`, `checkout-browser.cjs`, `google-auth.cjs` |
| Footer / içerik / ilk yük | Mobil footer ayarı, yasal linkler; sayfa bölümleri/native karışık içerik; tek LCP görseli; koşullu katalog CSS; SCRIPT_DEBUG | `footer.cjs`, `homepage.php`, `section-priority-browser.cjs`, `asset-loading.cjs`, `media-loading-browser.cjs` |

Bu tablo testlerin varlığını ve hedefini gösterir; her tarayıcı senaryosunun bu oturumda çalıştığı anlamına gelmez. Makinece okunabilir envanterde **84 dosya**, bunlardan doğrudan Playwright kullanan **45 fixture** var. Yardımcı modül import'ları ek PHP bağımlılığı getirebilir. Statik envanter bir satır/kapsama yüzdesi ölçümü değildir.

## 4. Açık PR'larla çakışma

3 Kasım 2026 12:46 UTC'de GitHub metadata'sı ve yerel branch diff'leri karşılaştırıldı. Hiçbir PR birleştirilmedi veya kapatılmadı.

### PR #84: özellik ana dalda zaten var

- [PR #84](https://github.com/muhammetdkaya/codela-storefront/pull/84), açık, taslak değil; head `f00393edd11b0aeb4674cb8cddb1b7852448d306`, `fix/desktop-product-skeleton`.
- Merge-base farkı: 5 dosya, +58/−2. Masaüstü ürün skeleton markup'ı ve 901px+ 1.2:1 grid'i ekliyor; ayrıca test/workflow/belge.
- **`tests/desktop-product-skeleton-browser.cjs` bu head ile güncel main arasında byte-identical.** Runtime'ın eklediği ürün skeleton markup'ı ve CSS kuralları güncel main'de de var. Ana dal geçmişi bunları `a917037`/0.1.188 hazırlığında içeriyor.
- Güncel runtime dosyalarının tamamı eski PR head'iyle aynı değil; sonraki sürümlerin değişiklikleri var. “Dosya farklı” sonucu özelliğin eksik olduğu anlamına gelmez. Eski dalı topluca taşımak yeni navigation/ürün korumalarını geri götürebilir.
- Karar: yeniden implementasyon veya cherry-pick yok. Yeni pilot mevcut skeleton testini regresyon olarak kullanır. PR housekeeping bu işin yerel kabul kapsamı değildir.

### PR #81: kalan değişiklik test/workflow ve eski sözleşmeye bağlı

- [PR #81](https://github.com/muhammetdkaya/codela-storefront/pull/81), açık taslak; head `3aa141cd2def729e55d85327334b106ac1f303ae`, `fix/native-mobile-bottom-feedback-20261027`.
- Merge-base farkı: yalnız `.github/workflows/deploy.yml` ve `tests/document-continuity-browser.cjs`, +18/−12; runtime değişikliği yok.
- Workflow mevcut testleri daha erkene alır. Test farkı UTF-8 response header, kaynak URL'si/pending durumunun aynı click task'te okunması ve teşhis çıktısıdır.
- **Eski fiyat beklentisi güncel sözleşmeyle uyuşmaz:** PR'de ürün hedefinde `price === '42 ₺'`; main'de hedef için preview görünürlüğü ve **`!oldPriceVisible`** doğrulanır. 174 sonrası hedefe ait statik preview, eski canlı ürün fiyatı değildir.
- Karar: eski test dosyası/PR doğrudan alınmaz. UTF-8 ve daha iyi snapshot teşhisi gerekirse güncel hedef-skeleton sözleşmesine yeniden uyarlanır. Bu yalnız Aşama 0 tespiti; burada test değişikliği yapılmadı.

Ham merge-base patch'leri ve karşılaştırma özeti QA klasöründedir.

## 5. Kaynak ve boyut başlangıcı

Gzip ölçümü her dosyaya ayrı **level 9, mtime=0** uygulanarak yapıldı. Sunucunun gerçek `Content-Encoding`, HTTP başlıkları, cache, ağ transferi, parse/execute veya toplam sayfa maliyeti ölçülmedi. WordPress/Woo/eklenti bağımlılıkları aşağıdaki toplamda yoktur.

| Dosya / kapsam | Ham bayt | Gzip bayt |
|---|---:|---:|
| Global storefront entry + format/search/cart/overlay/dock (6 dosya toplamı) | 64.091 | 18.018 |
| `overlay-controller.js` | 22.359 | 5.435 |
| `cart-controller.js` | 14.338 | 4.284 |
| `dock-controller.js` | 18.412 | 4.941 |
| `gallery-horizontal.js` | 4.461 | 1.706 |
| `product-information.js` | 20.441 | 5.732 |
| `gallery-defer.js` | 15.549 | 4.643 |
| Üretilmiş `document-navigation.js` | 26.068 | 7.218 |
| `navigation-controller.js` | 4.933 | 1.903 |
| `media-loading.js` | 3.282 | 1.371 |
| Üretilmiş `storefront-base.css` | 88.109 | 16.639 |
| `product.css` | 50.209 | 10.149 |
| `sections.css` | 18.477 | 4.122 |
| Tema ZIP (99 kaynak/asset dosyası) | 208.367 | Uygulanmaz |

Tema klasöründeki tüm dosyalar toplam **718.958 ham bayt**. Bu sayı kaynak + üretilmiş çıktıları birlikte içerir; sayfa yükü olarak sunulmaz. Örneğin üretimde birleşik navigation JS kullanılırken debug kaynaklarının ayrıca toplam içine katılması çift sayım olur. `tests/fixtures/library-baseline/source-sizes.json` her dosyanın boyutunu ve SHA256'sını verir.

İlk pilotun plan eşiği **sayfa başına +15 kB gzip yeni runtime JS**. Adayda aynı altı modül ve yeni statik/dinamik import zinciri birlikte karşılaştırılmalı; yalnız vendor dosyasının boyutu yeterli değil. Yalnız gerçekten kaldırılmış native kod tasarruf sayılabilir. Global import varsa mobil veya hiç sepet açmayan sayfa için “sıfır maliyet” denmez. Başlangıçta 240/180ms ve mevcut geometri korunur; motor, görünüm ve süre aynı anda değiştirilmez.

## 6. Bu oturumdaki çalıştırmalar

Ortam: Node **24.22.1**, Python **3.12.14**, PHP **8.4.26** (resmî Debian paketinden geçici dizine çıkarılan runtime), Playwright **1.62.1**, sistem Chromium **155.0.8059.79**. Playwright'in beklenen binary yolunu yazdırması kurulumu kanıtlamaz; yerel WebKit/Firefox binary'leri bulunmadı. Sistem Chromium mevcut olsa da işletim sistemi kısıtı nedeniyle açılamadı.

| Kontrol | Yeni yerel sonuç |
|---|---|
| `python3 tests/build-assets.py` | 3 test geçti |
| `python3 tests/package.py` | 24 test geçti; deployment bölümleri mock, gerçek FTP bağlantısı yok |
| `cart-race`, `cart-sync`, `search-panel`, `format`, `dock-gesture`, `showcase-caption` Node | 6 giriş noktası geçti; showcase 28 adapter/observer/keyboard assertion |
| `ui-kit`, `google-auth`, `footer` Node + PHP | 3 giriş noktası geçti |
| `asset-loading.cjs` + resmî WordPress 6.5 sınıfları | 13 bağlam × debug/production geçti |
| `catalog`, `product-composition`, `homepage`, `front-page-source`, `sections-preview`, `media`, `product-mobile-media`, `media-optimization`, `navigation`, `document-continuity`, `media-presentation`, `search-price`, `section-priority` PHP | 13 giriş noktası geçti |
| PHP lint / JS syntax | 26 / 17 dosya geçti |
| `desktop-product-skeleton-browser.cjs` | Test başlamadan Chromium launch engeli; assertion çalışmadı |
| Diğer browser testleri, yeni cart görüntüleri | Bu oturumda çalıştırılmadı; aynı launch engeli nedeniyle ardışık tekrar yapılmadı |
| Gerçek WP/Woo, fiziksel Safari, gerçek ödeme | Bu oturumda çalıştırılmadı |

`wordpress-fixtures.json` 11 resmî `WordPress/WordPress/6.5/wp-includes/` dosyasının URL/hash kaydını içerir. Bu gerçek core sınıflarıyla izole testtir; tam WordPress kurulumu veya Woo veritabanı kabulü değildir. Eski sürüm/CI başarıları yeni adayın başarı kaydı yerine kullanılmaz.

## 7. İlk pilot için eksik / yeni kabul senaryoları

### Motion ve aynı gerçek cart drawer

1. Sabit 195 ve aday, aynı gerçek PHP header, CSS, iki ürünlü Store API fixture ve aynı font ortamıyla **320, 390, 700, 701, 900, 901, 1280, 1440px** karşılaştırılacak. İlk veri bekleme, boş/dolu, mutation busy ve hata sonrası görünüm ayrı kaydedilecek.
2. ≥901px dialog sağ kenarı, genişliği, close/checkout hedefi ve satır konumu değişmeyecek. ≤900px fullscreen/ürün compact davranışı aynı kalacak; mobil native dialog transform edilmeyecek.
3. Giriş sırasında close; çıkış sırasında reopen; enter finish olayı kuyruğa girdikten sonra exit; ardışık cart→search→menu→cart; aynı frame içinde tekrar. Eski callback yeni motion referansını veya açık durumunu temizlemeyecek.
4. Escape, dış tıklama, navigation, pageshow/BFCache, kullanıcı Back/Forward ve breakpoint geçişinde bekleyen promise/animation temizlenecek. Kapatınca doğru mevcut opener'a odak, aynı scroll konumu ve tek dialog kalacak.
5. Reduced-motion baştan açık ve animasyon sürerken açılmış iki ayrı durum. Animasyon atlandığında kapanış/mutasyon/focus tamamlanacak. Eski token'lar CSS backdrop ile uyumlu kalacak.
6. Runtime bundle import başarısız/gecikmişken temel native akış ve görünür içerik korunacak. Statik bare import'u bırakıp “fallback” var sayılmayacak; gerçek dosya isteği bloklanarak sınanacak.
7. İptal edilen motion'un handler/promise birikimi, tekrar route init/destroy ve çift listener/instance negatif kontrolü. Heap/listener sayısı veya açık bir lifecycle gözlemiyle kanıtlanacak.
8. Aynı içerik/ağ/CPU koşulunda en az 5 tekrar; yeni istekler, gzip transfer, parse/execute ve etkileşim uzun görevleri kaydedilecek. Yalnız package boyutuyla hız kabulü kapanmayacak.

### Sonraki aşamalar için açık kabul boşlukları

- **Firefox:** mevcut `tests/` içinde Firefox çalıştıran giriş bulunmadı. Chromium/WebKit sonucu Firefox yerine geçmez.
- **Fiziksel iPhone Safari:** browser toolbar, safe-area, yazılım klavyesi, gerçek touch/pointer capture ve GPU/scroll davranışı hâlâ ayrı cihaz kapısı.
- **Embla:** mevcut native gallery testleri yeni motorun init/destroy/router lifecycle, transform/native-snap devri, tek slayt, loop/autoplay kapalı, gerçek touch yatay/dikey ayrımı ve gizli slayt ağ maliyetini otomatik kanıtlamaz. Bunlar yeni pilotta açık assertion olmalı.
- **Ürün hareketi:** mevcut rAF drag testi `up/cancel/blur/resize` içerir; `lostpointercapture` için ayrı doğrudan sürükleme sonlandırma assertion'ı eklenmeli. Tek form/variation/native validity korunmalı; yalnız Motion cart geçişinin başarısı bu riskli yüzeye kabul sağlamaz.
- **Form/Basecoat denemesi:** password manager, yazılım klavyesi, native error focus, login/registration interruption ve gerçek Woo checkout ayrı kabul. Yeni CSS kapsamı başka tema/plugin-owned account yüzeyine yayılmamalı.
- **Tam platform:** gerçek WordPress/Woo sürüm matrisi ve test ödeme sağlayıcısında onaylı alışveriş; gerçek mağazaya kurulum ve saha LCP/INP/CLS ayrı sonuçlar. Bu baseline için böyle işlem yapılmadı.

## 8. Yeniden üretim ve tamamlanma kapısı

1. Sabit SHA'yı temiz bir geçici dizine `git archive` ile çıkarın. Eski kardeş checkout'ları temizlemeyin veya resetlemeyin.
2. Aday checkout'taki sürüm kontrollü `tests/fixtures/library-baseline/capture-cart.cjs` ve aynı klasördeki `source-sizes.json` dosyalarını kullanın. Harness kaynak SHA256'larını kontrol eder; değişmiş aday kaynağını yanlışlıkla başlangıç olarak çekmez.
3. Uygun ortamda `PHP_BIN` ve Playwright'i sağlayın. Gerekirse sistem tarayıcısı için `CHROMIUM_BIN` verin. Baseline kökü `CODELA_BASELINE_ROOT`, çıktı yeri `CODELA_BASELINE_OUTPUT` ile seçilebilir.
4. `CODELA_BASELINE_ROOT=/tmp/codela-baseline CODELA_BASELINE_OUTPUT="$PWD/qa/library-baseline" node tests/fixtures/library-baseline/capture-cart.cjs` 8 genişlik × loading/empty/populated olmak üzere **24** PNG ve `metrics.json` üretmek üzere hazırlandı. Şu anda yalnız sözdizimi kontrolünden geçti; browser çalıştırması bekliyor. `.github/workflows/library-migration.yml` bunu sabit SHA arşivinde Chromium ile çalıştıracak şekilde düzenlendi; workflow tanımlanmış olması geçtiği anlamına gelmez. Görseller fixture olarak etiketlenir, gerçek mağaza ekranı denmez.
5. Adayın pilot testleri ve aynı içerikli karşılaştırması ayrıca çalıştırılır. Yeni Motion davranışı, toplam paket farkı, erişilebilirlik/iptal ve görsel eşleşme kanıtları olmadan pilot “kabul edildi” sayılmaz.
6. Kütüphane seçimi fayda göstermiyorsa mevcut sağlam davranış korunur. Bu belge tüm 12–20 günlük planın tamamlandığı veya tema/stable/canlı güncellendiği anlamına gelmez.
