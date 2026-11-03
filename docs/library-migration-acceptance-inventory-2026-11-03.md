# Kütüphane dönüşümü: final aday kabul envanteri

3 Kasım 2026. Bu kayıt testlerin kapsamını ve çalıştırma sınırlarını açıklar. Yerel browser socket kısıtı devam eder; gerçek tarayıcılar izinli no-deploy GitHub Actions job'larında çalıştırılır. Final kabul, aşağıdaki giriş noktalarının **aynı final commit SHA'sında** izinli, deploy içermeyen CI'da çalışması ve ekranların incelenmesiyle kapanır.

## 1. Mevcut kapsam ve final CI kapısı

Depodaki 49 üst düzey Playwright giriş noktasından 47'si izole fixture testidir. Gerçek ve ayrıca hazırlanmış localhost WordPress/Woo gerektiren iki test ayrıdır. 47 fixture'ın **47'si Chromium, 30'u WebKit, yalnız 4 yeni kabul/araştırma giriş noktası Firefox** seçimini açıkça destekler. Bir Chromium-only teste `TEST_FIREFOX=1` vermek Firefox kapsamı sağlamaz. `tests/asset-loading.cjs` browser testi değildir; PHP dependency/koşullu asset sözleşmesidir.

Dört yeni pilot ve önceki yedi regresyon dosyası tek başına tam Aşama 5 kabulü sayılmaz. Özellikle tam ürün sheet'i, ilk çizim, frame bazlı sürükleme, skeleton geometrisi, medya lazy/defer/cache/error, belge sürekliliği/router guard'ları, native Woo-benzeri checkout/account ve ana sayfa galeri regresyonları ayrıca çalıştırılmalıdır.

Makine tarafından okunabilir allowlist: **`scripts/regression-suites.json`**. Aşağıdaki dosya adlarının hepsi `tests/` altındadır; `-browser.cjs` eki belirtilmedikçe aşağıda eklenmiş kabul edilir.

| Grup | Chromium / WebKit / Firefox | Giriş noktaları ve sınır |
|---|---|---|
| `pilots` | 4 / 4 / 4 | `panel-motion`, `native-showcase`, `dock-sheet-lifecycle`, `basecoat-pilot`. Production native panel ile araştırma-only Motion karşılaştırması; native hero için değişmez195 karşılaştırması ve sıfır vendor isteği. Reddedilen Embla pilotu yalnız `tests/fixtures/embla-pilot/` altında, zorunlu kabul allowlist'i dışındadır. |
| `panels` | 4 / 4 / 0 | `panel-presentation`, `desktop-tools`, `mobile-controls`, `interaction`. Mevcut header/dialog/controller; odak, scroll, hareket, loading ve cart/filter fixture davranışı. |
| `product` | 9 / 6 / 0 | `product-sheet`, `product-desktop`, `product-drag-frame`, `product-first-paint`, `product-menu-scroll`, `product-no-dock`, `product-modules`, `product-browser.cjs`, `product-skeleton-geometry`. Chromium-only: sheet, modules, product-browser. Gerçek tema PHP'si ve Woo-benzeri tek form; gerçek Woo sunucusu değildir. |
| `media` | 5 / 3 / 0 | `media-loading`, `media-presentation`, `gallery-defer`, `product-mobile-media`, `product-mobile-media-admin`. Chromium-only: gallery-defer ve admin. Native/deferred/cache/error, ilk ekran ve galerinin medya sahipliği. |
| `navigation` | 6 / 2 / 0 | `navigation-browser.cjs`, `shell-navigation`, `document-continuity`, `navigation-viewport`, `navigation-feedback-bottom`, `catalog-context-return`. Yalnız son ikisi WebKit destekler. Belgeler arası geçiş, scroll/geri dönüş, yükleme/focus ve route guard'ları. |
| `header` | 5 / 5 / 0 | `desktop-header`, `context-header`, `header-routing`, `desktop-product-skeleton`, `catalog-header-skeleton`. Bağlamsal başlık, ürün/katalog geçiş iskeleti ve dock görünürlüğü. |
| `commerce` | 6 / 2 / 0 | `catalog-browser.cjs`, `catalog-filters`, `checkout-browser.cjs`, `account-browser.cjs`, `account-dashboard`, `account-skeleton`. Yalnız dashboard/skeleton WebKit destekler. Native formlar ve tema sunumu; gerçek stok/ödeme/sipariş kabulü değildir. |
| `content` | 4 / 4 / 0 | `homepage`, `showcase-viewport`, `section-priority`, `journal`. Responsive bölüm/hero, caption/counter, fold önceliği ve içerik yerleşimi. |
| `ui` | 3 / 0 / 0 | `ui-kit`, `native-woo-buttons.cjs`, `ui-kit-preview.cjs`. Primitive stilleri ve Woo/plugin sınırı; preview yalnız referans ekran teslimidir. |
| `cache` | 1 / 0 / 0 | `script-module`. Gerçek PHP kayıtları ve yerel HTTP warm cache ile child/native-helper-only revizyon değişimi; geçici kopyadaki asset'ler değiştirilir, aday kaynak ağacı değişmez. |

`document-continuity-browser.cjs` ayrıca `navigation-feedback-bottom-browser.cjs` fonksiyonunu çağırır. Ayrı giriş noktası yine tutuldu; Chromium'da kısmi tekrar olması coverage boşluğunu saklamaktan daha güvenlidir.

## 2. Fixture bağımlılıkları ve import geçişi riskleri

- Her CI job'u aynı SHA'yı checkout etmeli, `npm ci --ignore-scripts --no-audit --no-fund` çalıştırmalı ve lockfile'daki **Playwright 1.62.1** browser'ını kurmalıdır. `esbuild` dev dependency'si vendor yeniden üretimi ve araştırma-only Motion Node sözleşmesi için gerekir; normal storefront inline fixture'ı artık vendor/esbuild içermez.
- PHP renderer kullanan testler PHP CLI ister. `catalog-browser`, `catalog-context-return`, `context-header`, `catalog-header-skeleton` bazı çağrılarda doğrudan `php` çalıştırır. Yalnız `PHP_BIN` vermek yetmez; runner mutlak PHP_BIN klasörünü PATH başına ekler.
- `panel-presentation` KSES, `media-presentation` ve `section-priority` HTML Tag Processor ister. Mevcut no-deploy workflow'un indirdiği **WordPress 6.5** fixture'ları `WP_CORE_INCLUDES` ile verilmelidir. Fixture sürümü ve kaynak URL'si CI logunda görünür kalmalı; güncel WordPress diye sunulmamalıdır.
- `panel-motion` karşılaştırması için `PANEL_BASELINE_SOURCE`, `687ef83e13621f6117264d04f220fa13c8836bb4` içindeki overlay controller'ın birebir kopyası olmalıdır. Runner bunun byte eşitliğini denetler.
- Overlay tüketen sekiz eski fixture artık `tests/helpers/inline-storefront.cjs` kullanır. Yardımcı vendor içermeyen gerçek native `panel-motion.js` helper'ını inline eder. Motion yalnız `tests/fixtures/motion-pilot/` ve `inline-motion-pilot.cjs` araştırma yolundadır. Helper'ı dahil etmeden doğrudan eski `strip(import)` yaklaşımına geri dönmek eksik `animatePanelTransform` hatası üretir. Ayrıca `names.map(moduleSource)` sayısal ikinci parametresini dosya yolu sanmamalıdır; `tests/inline-storefront.cjs` bu regresyonu sınar. Bunlar production bug ile fixture entegrasyon hatası ayrılarak raporlanmalıdır.
- `homepage`, `showcase-viewport`, `media-loading` ve yeni `native-showcase` artık gerçek üretim native galeriyi sınar. Production graph'ında Embla import'u veya vendor URL kaydı bulunmaz. Eski Embla başarısızlığını silerek yeşil göstermeyin: araştırma kodu ve reddetme kanıtı ayrı korunur.
- Eski `showcase-caption.cjs` fake DOM'u yeni lifecycle'ın `MutationObserver` gereksinimini taşımıyordu. Statik inceleme sırasında güvenli Node testi bu noktada başarısız oldu; düzeltme fixture'a yapılmalı, önceki caption/counter assertion'ları korunmalı ve Node contract job'una eklenmelidir. Final SHA'da tekrar çalıştırılmadan kapatılmış sayılmaz.
- `product-menu-scroll` legacy launch kodu `CHROMIUM_BIN` varsa WebKit'e de aktarır. Runner WebKit/Firefox için hem `CHROMIUM_BIN` hem `CHROME_BIN` değerini temizler. Bir sistem Chromium binary'sini WebKit testi diye çalıştırmaz.
- Bazı eski testler kaynak/CSS değiştiren veya yalnız altküme/ekran çalıştıran environment seçenekleri taşır. Runner bunları temizler; eski CSS negatif kontrolü, `SHOWCASE_SCREENSHOTS_ONLY` veya scope filtresi final kabul sonucunu daraltamaz.

## 3. Sınırlandırılmış runner ve önerilen CI parçaları

Yeni yardımcı **`scripts/run-regression-suite.cjs`** yalnız allowlist giriş noktalarını çalıştırır; dışarıdan komut/test yolu kabul etmez. Workflow aynı kaynaktaki yeni kabul testlerini ve13 legacy shard'ı bağımsız çalıştırır; deployment adımı yoktur.

Önce salt envanter:

```sh
node scripts/run-regression-suite.cjs --list
node scripts/run-regression-suite.cjs --list --engine webkit --group product
node tests/regression-runner.cjs
```

Son test runner komutu yalnız zararsız Node alt süreçleriyle **19 runner sözleşmesini** doğrular; browser açmaz. Başarı, hata, timeout, cancellation, eksik executable, devam etme, engine normalizasyonu, sınırlı log davranışı, geçici temiz Git ağacında tam CLI sonucu ve kirli kaynak reddini sınar.

İzinli CI'da, temiz ve tam SHA ile örnek:

```sh
node scripts/run-regression-suite.cjs \
  --engine chromium --group product \
  --expect-sha "$GITHUB_SHA" --budget-ms 900000
```

- `--expect-sha` tam 40 karakterli SHA zorunludur. HEAD eşit olmalı; theme/scripts/tests/tools/package dosyalarında izlenmiş veya yeni değişiklik olmamalıdır. Çalıştırma sonunda kaynak bütünlüğü tekrar kontrol edilir.
- Her test için 120–300 saniye timeout, her çağrı için varsayılan 15 dakika toplam bütçe vardır. Bütçe 1 saniye–1 saat aralığında açıkça değiştirilebilir. Bir test başarısız olunca bağımsız sonrakiler çalışır. Bütçeye yetişmeyenler `not_run_budget` olarak kalır ve suite başarısız döner; sessizce passed olmaz.
- `passed`, `failed`, `timed_out`, `blocked`, `cancelled`, `unsupported_engine`, `not_run_budget` sonuçları ayrı yazılır. Sadece unsupported girdilerden oluşan bir çağrı başarılı kabul edilmez.
- Ara/final JSON ve her testin stdout/stderr logu `qa/regression-suite/<SHA>/<engine>/<group>-<run>/` altındadır. Sonuç, süre, Node/Playwright sürümü ve kaynak bütünlüğü kaydedilir. Her log en çok 8 MiB (+ truncation notu) saklar.
- Timeout/iptal yalnız runner'ın açtığı kendi process group'unu kapatır. Diğer işçilerin browser'larına dokunmaz.
- Runner bir güvenlik sandbox'ı veya ağ firewall'u değildir. Allowlist testlerinin izole fixture niteliği korunmalıdır; localhost ve route-fulfilled `*.test` senaryoları kullanılır, canlı mağaza hedefi eklenmez.

Önerilen job matrix: Chromium'da on grubun hepsi; WebKit'te `pilots, panels, product, media, navigation, header, commerce, content`; Firefox'ta yalnız `pilots`. Aynı gruptaki dosyalar sıralı çalıştırılmalı, gruplar ayrı temiz job'larda paralellenmelidir. Böylece legacy sabit `qa/` ekran adları çakışmaz ve bir grubun hatası diğer grubun kanıtını engellemez. Pilotlar mevcut bağımsız step'lerle korunuyorsa aynı job'da runner pilotlarını tekrar çalıştırmayın. Browser kurulumu başarılı olduktan sonra her gerekli job ve artifact upload'ı hata olsa da bağımsız ilerlemelidir. Job timeout, browser setup + suite bütçesi + artifact upload süresini karşılamalıdır; tek 20 dakikalık job içine 47 testi yığmayın.

## 4. Final kabul kapıları ve dürüst kapsam

1. Aynı final SHA'da vendor determinism, bütçeler, PHP/Node sözleşmeleri, paket testleri ve yukarıdaki bütün desteklenen fixture grupları çalışır. Başarısız/çalışmamış testler liste halinde açık kalır. Final ZIP yalnız bu SHA'dan üretilir.
2. Chromium/WebKit/Firefox kabulünde üretim native panel/hero ve araştırma-only Motion karşılaştırması, reduced motion, hızlı tersine dönüş, pointercancel/resize/navigation cleanup, odak ve scroll sahipliği geçer. Referans ve aday ekranları gerçek görüntüler olarak incelenir; yalnız dosyanın oluşması görsel kabul değildir.
3. Ürün formu ve aynı native DOM kimliği korunur; variation/quantity/stock-benzeri fixture yolları, menu/sheet açıkken scroll ve ürün sayfasında dock gizliliği doğrulanır. Mock toplam/fiyat yanıtları sunucu doğruluğu iddiası değildir.
4. Medya ve cache grupları hem native ilk görüntüyü/lazy fallback'i hem de native hero lifecycle düzeltmelerini sınar. Storefront gerçek import map, module registration ve native-helper-only cache güncellemesi hatasızdır. Production graph'ında Motion/Embla kaydı veya isteği yokluğu ayrıca doğrulanır. Aynı 195 CSS sürüm numarasıyla canlı cache güvenliği bu testten çıkarsanamaz.
5. Motion'ın kabul gerekçesi düzeltilmiş native kontrolle karşılaştırılmalıdır. Eski tersine-dönüş hatasının düzelmesi tek başına Motion faydası değildir; `native-only` kontrol aynı helper/controller davranışını kullanır ve vendor istemez. Desteklenmeyen `longtask` ölçümü sıfır değil bilinmiyor olarak kalmalıdır. Son çalışma ağacında Motion production'dan çıkarılmış, yalnız araştırma fixture'ında tutulmuştur. Final kabul bu vendor-free production sınırını test etmelidir; sırf kütüphane tercihiyle yeniden eklemeyin.

**Kapanmayan entegrasyon sınırları:** `shell-navigation` gerçek WordPress router modülünü fixture ile değiştirir. `script-module` gerçek PHP kayıtlarını kullanır fakat WordPress Interactivity store'u stub'dır. `checkout` native HTML form/submit ve tema düzenini sınar; gerçek Woo Store API, nonce, kupon, stok, ödeme sağlayıcısı veya sipariş doğrulamaz. Bunlar ayrı, disposable ve localhost'a kilitli WordPress+Woo+Codela kurulumu olmadan tamamlandı diye raporlanamaz.

`tests/wordpress-layout.php` site ayarları, kullanıcılar, ürünler, siparişler ve kuponlar oluşturur; salt okunur değildir. `tests/wordpress-layout.cjs` ve `tests/wordpress-commerce.cjs` onun seed sonucunu ve `SF_REPORT_DIR` ister. Üçü de bu runner'dan **bilerek hariçtir**. Mevcut `tools/*live*.cjs`, canlı site veya deploy workflow'u kabul testi için kullanılmaz. Fiziksel iPhone Safari ve gerçek mağaza satış akışı ayrıca açık sınırdır.

## Ara koşu kaydı

`65158f74d4b33114b1d16366335bbf7d176bd4b6` için [CI41648726152](https://github.com/muhammetdkaya/codela-storefront/actions/runs/41648726152): contracts ve13 legacy shard geçti; WebKit/Firefox pilot job'ları geçti; Chromium yalnız Embla ilk-wheel parity testinde başarısızdı.16/17 job başarılı olması tüm kabulün yeşil olduğu anlamına gelmez. Bu bulgu Embla'yı üretimden çıkarmanın kanıtıdır. Yeni native hero ve sonraki fixture değişiklikleriyle final kaynak tekrar bütün kapılardan geçmelidir.
