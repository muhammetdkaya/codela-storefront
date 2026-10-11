# Codela Storefront — bağımsız tema

10 Ekim 2026: Tema 0.1.1, eklenti 1.1.1. Kaynak `theme/codela-storefront/` altında bu depoya taşındı. Kaynak commit: c4be5baf419b3385a20df4ba898b03d39e6cc361. Tema içeriği bu taşımada değişmedi.

Tema dağıtımı artık eklentinin tamamının yayınlanmasını beklemez. Eklenti tarafında ayarlar ve yükleyici kalır; remote manifest/ZIP köprüsü ayrı codela deposunda tutulur. Eski tema paketi yalnız dondurulmuş 0.1.1 ilk kurulum yedeğidir.

Doğrulama: altı yerel paket/dağıtım testi geçti; kimlik, yanlış FTP mapping, eksik secret, başarılı dağıtım, sağlık kontrolü hatasında geri alma ve tekrarlanabilir ZIP. PHP/JS kontrolleri de CI'da geçti. Kullanıcının eklediği FTP_PASSWORD, FTP_SERVER ve FTP_USERNAME secret adları workflow ve FTPS koduna bağlandı; dağıtım sonucu bekleniyor.

Kalan işler: canlı bağımsız dağıtım; gerçek tarayıcıda admin bar/sepet/menü/arama; Header/Footer alt menülerinin uygulanması; içerik sayfalarını kolay düzenleme; gerçek cihaz hız ölçümleri.

## Taşıma öncesi teknik geçmiş

# Codela Storefront 0.1.0 — first live-test release

## Decisions

Speed first, then stability, usability and styling. The theme requires Codela;
Codela remains independent of the theme. No SPA/headless stack, page builder,
font CDN or animation library. WordPress block templates/theme.json provide the
layout; WordPress Interactivity API activates the header actions. The WooCommerce
Store API owns cart state, stock, quantity limits, tax and money calculations.

Approved header: logo left, search/bag/menu right. All three panels fill the screen,
slide down to open and slide up to close with synchronized icons (340 ms).
Reduced-motion preferences disable animation. Native dialog supplies modality and
keyboard containment; closing restores the original scroll position and focus.

## Installation

Codela > Settings > Theme is part of the existing settings screen (including AJAX
navigation). Install, update, activate, download and save use separate POST actions
with per-action nonces and WordPress capabilities. Installation never activates.
WordPress 6.5+, PHP 8.0+, WooCommerce 9.0+ required. Multisite is intentionally
managed through Network Admin; the site-level installer declines it.

The reviewed source lives in `codela-commerce-toolkit/theme-package/codela-storefront/`.
The plugin builds a temporary ZIP from that fixed folder using WordPress PclZip.
No external package URL or uploaded source is accepted. Theme_Upgrader performs
installation; its upgrade method supplies core temporary-backup/rollback handling.
Temporary archives are removed. The downloadable ZIP supports manual installation.

Codela.dev's existing plugin deployment carries these source files. Its existing
`codela-site` marketing theme/repository is unchanged. The owner can install and
then activate Storefront from Codela settings for a live test. WordPress.org
publication is a separate action; this release does not trigger it.

## Shared settings and data

Brand text, menu and optional featured product ID live in `codela_theme_settings`.
Existing Codela Store Appearance colors and storefront font/corner settings are
reused. A menu selected in Codela or the registered `primary` location is used;
otherwise visible product categories become navigation. Custom logo uses the
standard WordPress custom-logo storage.

A static homepage with content renders that editable content. Otherwise the
server-rendered product selection is the initial homepage. Product and catalog
use WooCommerce's legacy-template block to preserve Codela hooks, variable-product
forms and extensions inside a block theme. Cart/checkout/account pages keep their
existing content/blocks/shortcodes. Their final bespoke designs remain future work.
No products, pages, checkout content, menus or store settings are auto-created.

Search matches titles/content with WordPress search plus exact SKU (including a
variation SKU's parent). It honors search visibility, publication/password and
out-of-stock visibility. Results are bounded to eight. Unicode matching follows
the site's database collation; typo tolerance and a dedicated search index are not
part of this first release. Browser requests are debounced, canceled and sequence
checked. Results/prices are not cached across customers.

Cart is requested on opening, with same-origin cookies and no-store. Nonces come
from the uncached cart GET response, not cacheable page HTML. Mutations are serialized
and authoritative data is reloaded after failures. A cart GET refreshes expired
nonces. Amounts, currency precision, variations and server quantity limits are used.
Checkout links to the real WooCommerce checkout. The first view does not fetch the
cart just to populate its badge; the badge becomes current on the first cart open.

## Validation

- `php tools/test-theme-support.php`: method, nonce, capability, multisite,
  dependencies and package contracts. Included in deployment validation.
- `node --input-type=module --check < codela-commerce-toolkit/theme-package/codela-storefront/assets/storefront.js`
- PHP lint for all changed PHP files (also part of existing deployment validation).
- `tools/test-theme-wordpress.php setup|verify`: isolated real WordPress/WooCommerce
  integration: builds and installs ZIP through Theme_Upgrader, confirms installation
  leaves active theme unchanged, separately activates, checks public/hidden/draft/
  password/SKU visibility, REST argument validation, rendering, cart mutations and
  stock limits. Run only in an empty disposable site, with the theme bridge loaded.

Test harness used WordPress 7.1.3, WooCommerce 11.2.0 and PHP 8.3.6 with SQLite.
The isolated harness loads the actual theme bridge and shared appearance files;
it does not substitute for regression tests of every Codela module. Existing plugin
CI checks still gate deployment. Real-device Safari animation/performance and the
store's payment-provider flow remain live acceptance tests. No purchase was made.


## Icon audit and fix — 10 October 2026

- Root cause: Settings > Theme requested `codela_render_icon('layout')`,
  but `admin-icons.css` had no corresponding mask. Added the layout mask and
  the matching WordPress Dashicon fallback mapping.
- Existing admin approach is local SVG data-URI masks (53,347 bytes before this
  fix), with no icon JavaScript runtime or CDN. It is suitable for the existing
  admin UI; loading that whole stylesheet on the storefront is unnecessary.
- The theme already uses eight local Lucide SVG assets, 309–417 bytes each.
  Keep that selective loading model. Shared visual contract: 24×24 viewBox,
  stroke width 2, round linecaps/joins, monochrome. The new layout icon follows
  that contract. Shared language does not require loading admin assets in the theme.
- Migrate legacy plugin icons incrementally when their screens are changed;
  preserve existing renderer names/aliases. Do not claim the whole plugin now
  uses one icon family: legacy/custom drawings remain.
- Theme stays 0.1.0; this is an admin icon correction, not a new theme package.
- Validation: layout renderer/mask linkage and decoded SVG structure checked.
  Browser rendering could not run: the local Playwright browser is not installed;
  local PHP is also unavailable. Repository CI subsequently passed PHP validation.
  No full plugin regression, real iPhone/Safari or live admin visual check yet.
- Publication: source commit [ab81d02](https://github.com/muhammetdkaya/codela/commit/ab81d02f4faa97965b658fa288530ca71c74afb2).
  [Actions run 38027985553](https://github.com/muhammetdkaya/codela/actions/runs/38027985553)
  passed validation (including PHP lint and existing deployment gates), but both
  deployment attempts stopped at `connect (RuntimeError)` before file transfer.
  The fix is committed, not deployed; WordPress.org was not published. Resolve
  the FTPS connection failure and rerun the deployment before live visual acceptance.
- Next: confirm the Theme icon in live Codela settings, then continue the
  previously recorded mobile panel/search/cart acceptance checks.


## Settings organization and working cadence — 10 October 2026

User-approved requirement: Codela > Settings > Theme must contain separate
submenus for Header (Üst alan), Footer (Alt alan), and other theme sections as
they are developed. Add each section's necessary settings in the same work as
its theme design; do not postpone plugin integration until the theme is finished.
Reuse shared appearance settings instead of duplicating them. This navigation
requirement is recorded, not yet implemented.

Small source changes may continue to trigger the existing codela.dev deployment.
No separate development branch or disabled automatic deployment is requested.
Batch related edits, read relevant files only, and avoid repeatedly polling
workflow status. These preferences do not authorize WordPress.org publication.


## Deployment retry and actual cause — 10 October 2026

The earlier `connect (RuntimeError)` label covered several later operations.
Retry run [38038077634](https://github.com/muhammetdkaya/codela/actions/runs/38038077634)
identified the actual failure as verification of the existing plugin bootstrap.
The script required the old `Codela Commerce Toolkit` display name, while the
last deployed package has the new checkout/shipping/notifications name.

Commit [df06f862](https://github.com/muhammetdkaya/codela/commit/df06f862565b7ddaa7e8f2ac2df34128f163fde1)
accepts the known new name only with the exact `codela-commerce-toolkit` text
domain and retains historical-name support. Unrelated names and wrong text
domains are rejected before writes. Connection diagnostics now report precise
stages without exposing credentials. All 16 offline deployment tests passed;
GitHub validation also passed.

Deployment [38038229863](https://github.com/muhammetdkaya/codela/actions/runs/38038229863)
completed successfully: validate and deploy passed (confirmed 10 October).
This establishes plugin package deployment; it does not establish authenticated
admin visual acceptance. No product version changed for that deployment.


## Storefront 0.1.1 — admin toolbar and panel controls — 10 October 2026

Theme 0.1.0 → 0.1.1; plugin remains 1.1.1. Theme asset versions also move to
0.1.1 so installed updates invalidate browser caches.

- Scroll lock captures the body's rendered top instead of assuming its origin
  equals negative scrollY. This retains WordPress's html admin-toolbar margin.
- The toolbar keeps its current screen position during scroll lock, including
  WordPress's absolute mobile toolbar. Original inline body/toolbar styles and
  page scroll are restored when closing.
- Native dialog starts below the visible toolbar and subtracts that space from
  its height; offscreen/hidden/missing toolbars reserve no panel space. Resize
  recalculates the offset.
- Close/action buttons, search field/container and cart quantity controls reuse
  the existing shared small/box radius variables. Default theme controls use
  12px when no token is available; an explicit square setting still applies.
  No duplicate corner setting was added.
- Validation: JS module syntax passed; six offline admin-bar/scroll scenarios
  passed, including desktop 32px, mobile 46px, scrolled/offscreen, hidden/missing
  toolbar, inline-style restoration and scroll restoration. These are logic
  tests, not a substitute for browser layout tests. Browser download failed.
- Publication: source [11e4f3b2](https://github.com/muhammetdkaya/codela/commit/11e4f3b20799c972f3ab3a9ab1969a94eb563f21);
  [Actions 38049696933](https://github.com/muhammetdkaya/codela/actions/runs/38049696933)
  validation passed and deployment is running. Installed-theme update is
  not yet confirmed. Plugin deployment carries the bundled theme package only.
  Update the installed theme from Codela > Settings > Theme to apply 0.1.1.
- Next: confirm deployment and theme update, then visually check all three
  panels logged in/out and on a scrolled mobile page. Header/Footer settings
  submenus remain required future work.

Eklenti köprü CI: Actions 38051382397 validate başarılı. Eklenti deploy kuyruğa alındı; bağımsız tema deploy eksik secret nedeniyle bekliyor. Secret sonrası main dalında yeni Run workflow başlat; eski run kaynak revizyonu kontrolünde atlanabilir.

## FTP secret adları — 10 Ekim 2026

Workflow artık kullanıcının eklediği FTP_PASSWORD, FTP_SERVER ve FTP_USERNAME secret'larını kullanır. Sunucu ve kullanıcı doğrudan bu secret'lardan gelir; TLS doğrulaması ve sabit tema hedefi korunur. Bu değişiklik bağımsız tema dağıtımını tetikler; sonuç sonradan kaydedilecek.

Dağıtım sonucu: commit 4cbcddcbe3a209220dc2f85f9484f8110bafaa00, [Actions 38051799079](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38051799079). Validate başarılı, secret kontrolü başarılı; deploy connect (gaierror) ile durdu. Sunucu DNS adı çözümlenemedi; kimlik doğrulama ve dosya aktarımı başlamadı. FTP_SERVER hostname'i düzeltilmeli (mevcut altyapı: server38.shared.spaceship.host, ftp:// öneki olmadan). Sonrasında main dalında workflow çalıştırılmalı. Eklenti köprü Actions 38051382397 son kontrolde hâlâ çalışıyordu; başarılı diye kaydedilmedi.

10 Ekim bağlantı farkı: codela-site başarılı Actions 37810396274 workflow'u FTP_SERVER secret'ını kullanmadan server38.shared.spaceship.host adresine bağlanıyor. Storefront workflow da aynı kanıtlanmış adrese sabitlendi; FTP_USERNAME ve FTP_PASSWORD secret'lardan okunur. Önceki connect (gaierror) FTP_SERVER değerinin DNS çözümlemesinde oluştu. Yeni dağıtım sonucu bekleniyor; mevcut FTP_SERVER secret'ının silinmesi gerekmez.

## Bağımsız canlı dağıtım başarılı — 10 Ekim 2026

Commit [4478aef485605e8db5166c7054bddf3a482eaa89](https://github.com/muhammetdkaya/codela-storefront/commit/4478aef485605e8db5166c7054bddf3a482eaa89); [Actions 38052248910](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38052248910). Validate ve deploy başarılı. Tema 0.1.1; sürüm artırılmadı. FTP hesabı temayı doğrudan kökte gösterdiği için klasör adı yerine style.css kimliğiyle mevcut tema kökü tanınır. Boş restricted kök için yalnız 404 halinde, kimlik/izin verilen kök dosyaları ve aynı sabit public probe doğrulamasıyla geri dönüş vardır. Geçici FTP hataları sınırlı yeniden denenir, oturum QUIT ile kapanır.

Dosyalar doğrulanarak yüklendi; public style/CSS/JS/manifest ve mağaza/REST sağlık kontrolleri geçti. Tema etkinliği değişmedi; tüm cihazlarda görsel doğrulama yapıldı denmez. Diğer depoda başarılı bağlantı FTP_SERVER secret'ını kullanmadığından burada da aynı sabit provider hostname'i kullanılır; secret'ın kalması sorun olmaz. Header/Footer alt menüleri hâlâ sonraki geliştirme işidir.


## Storefront 0.1.2 — theme-owned settings (10 October 2026)

- Source version 0.1.1 → 0.1.2. Theme now declares its own settings in `theme/codela-storefront/config/settings.json`; Codela dynamically generates the admin sidebar and form from it.
- Sections: Header (brand and menu), Homepage (featured product), Footer (optional plain-text note). The Footer uses a dynamic server-rendered block. All existing `codela_theme_settings` option keys are retained; values in other sections are preserved on save.
- Companion plugin change: `muhammetdkaya/codela` commit `c5a383df1c8cf786c583e73daf5c93ad95654e34`. The generic settings reader accepts only a theme-installed, local, bounded JSON schema and supported input types; field values are sanitized and permissions/nonce remain enforced.
- Versioned CSS/JS assets move to 0.1.2. Schema/package contract has automated test assertions.
- Publication: source prepared; CI, independent FTPS and real mobile/admin visual verification **must be checked separately**, and the installed theme must be updated to 0.1.2 where necessary.
- Next: verify both repositories' CI and deployment; inspect the installed Theme > Header/Homepage/Footer pages, saved option persistence, Footer display, then actual mobile/desktop menu/search/cart with and without admin bar.


## 0.1.2 doğrulanmış dağıtım — 10 Ekim 2026

- `f8e6200a1b274326ebf516d9da3e3c515945fe38` teması için [Actions 38078468464](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38078468464) **validate + deploy success**; tema kaynakları, ZIP ve manifest sunucuya yüklendi. Bu, WordPress'in temayı etkinleştirdiği veya gerçek cihazda bütün görsellerin doğrulandığı anlamına gelmez.
- Eklenti ayar motoru `muhammetdkaya/codela@c5a383d` için [Actions 38078271353](https://github.com/muhammetdkaya/codela/actions/runs/38078271353) başarılı; yükleme günlüğü 983 dosyanın doğrulandığını bildiriyor. Eklenti sürümü 1.1.1 olarak kaldı.
- Tema kaydetme/şema izole testleri `tools/test-theme-support.php` içine eklendi, [Actions 38078903175](https://github.com/muhammetdkaya/codela/actions/runs/38078903175) başarılı. Alt menünün tema ana sekmesinde açık kalması için eklenti kaynak düzeltmesi `3cded41` yapıldı; **ayrı doğrulama/dağıtımı kontrol edilecek**, tamamlandı denmez.
- Sıradaki ilk iş: Codela 3cded41 kaynak doğrulama/dağıtımının sonucunu al, WordPress içinde aktif tema sürümünü doğrula, tema Header/Homepage/Footer ayarlarını kaydet/yeniden aç ile test et; mobil/admin bar ve sepet-arama-menü canlı tarayıcı kontrollerini ayrıca gerçekleştir.

## Storefront 0.1.3 — fullscreen panel control borders (10 October 2026)

- User screenshots on iPhone show a thick black focus outline around the automatically focused Search input and the Cart/Menu close button. This was caused by a general `:focus-visible` outline combined with programmatic focus in `open()`, not a desired permanent border. The search form's thin, neutral border is intentionally retained.
- Source change: panel-scoped CSS neutralizes button appearance, button borders, control shadows and search-input outlines, without resetting unrelated checkout/cart/other theme controls. `sf-initial-focus` suppresses the initial programmatic focus ring and is removed on Tab so keyboard navigators still get the normal focus indication for panel buttons. Input caret remains visible.
- Version 0.1.2 → 0.1.3; CSS and JS asset versions updated to ensure cache busting. Added static regression checks to `tests/package.py`.
- Status at commit authoring: source prepared, CI/deploy **not yet verified**. Do not claim visually verified on iPhone/Safari; user-supplied screenshots document the old issue.
- After CI and FTP: verify the installed source is 0.1.3; open Search, Cart and Menu on actual iPhone/Safari; check no black auto-focus frames, the subtle search-container border, reduced-motion support, keyboard Tab focus, admin toolbar offset, and panel opening/closing.


## 0.1.3 doğrulanmış dağıtım — 10 Ekim 2026
- Tema 0.1.2 → 0.1.3 kaynak commit'i: [2475210](https://github.com/muhammetdkaya/codela-storefront/commit/24752104aca41fe8e70cfae14537add464bd1d73).
- [GitHub Actions 38080286355](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38080286355) `validate` ve `deploy` başarıyla tamamlandı. CSS/JS sürümleri 0.1.3; yeni ZIP/manifest dağıtımı otomatik yapıldı.
- Gerçek iPhone/Safari'de açılan Search/Cart/Menu görsel testi **henüz tekrar yapılmadı**. Sonraki somut adım: telefonda üç paneli tekrar açıp ilk odakta siyah çerçeve kalmadığını teyit etmek. Klavye Tab odak göstergesinin korunmasını da kontrol et.
- Tema kaynağı bağımsız depoda kalır; Codela eklentisinin tamamının tekrar yayımlanmasına gerek yoktur.

## Storefront 0.1.4 — duplicate copy removed from Search and Cart — 11 October 2026

- Search: use the existing localized "Search products" label as the **sole visible input placeholder** (Turkish UI: "Ürün ara"). Hide the duplicated visible Search panel heading visually, but preserve its text for the dialog's `aria-labelledby`. The minimum-two-characters notice no longer appears in the empty/one-character state; requests still require two characters.
- Cart: remove the "View cart" link from a panel that already shows the cart. Keep the subtotal, shipping/discount explanation, Checkout CTA and the error-state fallback link.
- No changes to menu-panel content, search matching logic, cart calculations or API integration. Asset and theme versions advance 0.1.3 → 0.1.4. `tests/package.py` now checks the labels and UI structure.
- **At implementation:** code staged, CI/deploy confirmation outstanding. Last verified live release was 0.1.3. Real Safari/iPhone view still needs user-side acceptance, including keyboard access, empty search input and checkout.
- **Next:** verify 0.1.4 Actions success, then visually confirm Search/Cart on iPhone; afterwards continue broader Header/Homepage/Footer styling and acceptance.


## Storefront 0.1.4 — doğrulanmış bağımsız yayın (11 Ekim 2026)
- Kaynak commit: [b7445b8](https://github.com/muhammetdkaya/codela-storefront/commit/b7445b8a0e1d39b78f9e1d1be9dc95d51ccd31c9); tema sürümü 0.1.3 → 0.1.4. 8 kaynak/belge/test dosyası güncellendi.
- [Actions 38086088464](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38086088464): **validate ve deploy başarılı**. Kaynak/tema ZIP/manifest bağımsız tema hattıyla codela.dev'e dağıtıldı. Codela eklenti sürümü değişmedi; WordPress.org sürüm yayını yapılmadı.
- Biten: Arama kutusu görünür placeholder'ı "Ürün ara"; görsel tekrarlayan arama başlığı gizli ancak ekran okuyucu başlığı var; başlangıç iki karakter uyarısı kaldırıldı (minimum arama 2 karakter olmaya devam eder); sepet panelindeki "Sepeti görüntüle" bağlantısı kaldırıldı. Testler CI'da başarılı.
- Kalan: Kullanıcı iPhone/Safari'de canlı görsel kontrol ve arama/ödeme tıklama testleri; klavyeyle erişim; WordPress etkin tema bilgisi ayrıca doğrulanmadı.
- Sıradaki somut iş: Canlı iPhone'da arama panelini açıp "Ürün ara" yazısını, ilk durumun boş olmasını, iki harfle sonuç gelmesini; sepet panelinde "Sepeti görüntüle" yerine doğrudan ödemeyi; menü/arama/sepet X çerçevesinin temiz kaldığını doğrula.

## Storefront 0.1.5 — header + expanding fullscreen panels (11 October 2026)

- Supersedes the old brand-left header: grid with Menu left, true centered brand/logo and Search/Cart paired right (44px touch targets, narrow-mobile responsive logo).
- All three existing **native modal dialogs** animate their clipping rectangle from the real tapped launcher coordinates to fullscreen, with rounded corners on entry and reverse contraction on close. Geometry is relative to the dialog viewport and accounts for the WordPress admin bar offset; saved body, toolbar and scroll behavior retained. 420ms CSS/JS durations match; reduced-motion explicitly removes the clip transition; unsupported `clip-path` engines retain the previous top slide.
- Search stays full screen, but its bar is top-aligned, narrower (max 760px), 50px tall and 16px for no iOS auto zoom. "Ürün ara" placeholder and existing 2-character search behavior persist. Search results still appear beneath the bar.
- No changes to WooCommerce Store API cart logic, menu links, settings schema or Codela plugin. Source/asset version 0.1.4 → 0.1.5.
- Validation: existing Python package checks extended for order, anchors and compact search; `tests/panel-origin.cjs` executes actual origin geometry with right action, left menu, admin bar and clamped positions in Node CI.
- **Status at change preparation:** committed code not yet live-verified. Validate + deploy actions and actual iPhone Safari interactions require separate confirmation. No real-device screenshots/test claims until performed.
- Next: verify Actions status and then live header position and panel behavior across iPhone/desktop, scroll/admin bar, focus and reduced motion.


## Storefront 0.1.5 — doğrulanmış dağıtım (11 Ekim 2026)

- Kaynak commit: [f166db8](https://github.com/muhammetdkaya/codela-storefront/commit/f166db8f49e9965ca41f29831948f6b7e704226e). Tema 0.1.4 → 0.1.5; Codela eklenti sürümü ve WordPress.org yayını değişmedi.
- [Actions 38094292898](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38094292898): **validate + deploy başarılı**. PHP lint, JS sözdizimi, Python tema paket/doğrulama ve JS panel köken geometrisi testleri geçti. Bağımsız tema dağıtımı yapıldı.
- Header menü-solda / logo-ortada / arama+sepet-sağda; ikon çıkış noktasından büyüyen tam ekran paneller ve üstte 50px kompakt arama alanı kaynak olarak hazır ve canlıya aktarıldı.
- **Henüz yapılmayanlar:** gerçek iPhone/Safari görsel kabul testi, farklı ekranlarda aktif tema/kurulu sürüm denetimi, admin bar görünürken animasyonun görsel doğrulaması ve klavye/odak navigasyonu manuel testi. Otomatik test ve FTPS dağıtım başarısı bunların yerine geçmez.
- **Sıradaki somut iş:** kullanıcı iPhone'da üç paneli açıp animasyon yönünü, logo hizasını, arama kutusunun ölçüsünü ve panelin açılıp kapanmasını incelesin; gerçek cihazda görülen sorunları bağımsız tema deposunda düzelt. Sayfa ve Footer tasarımına bu kabulden sonra geç.

## Storefront 0.1.6 — no animations, iPhone dark search reference (11 October 2026)

- User rejected the 0.1.5 icon-origin expansion animation for now. Supersedes the 0.1.5 opening/closing specification: no transition or clip-path reveal, no delayed JS close, no launcher geometry calculation. Native dialog, body/admin bar scroll handling and accessible focus remain.
- Search panel follows the most recent dark iOS search screenshot (more specific than the earlier screenshot with the "İptal" cancel button): near-black background, magnifying-glass icon inside dark rounded search field, Turkish placeholder "Ara", separate circular X close at right. An in-input small clear control only appears when there is text.
- The visible menu/cart visuals and the 0.1.5 balanced header layout are unchanged. Search results are live products returned by the existing API: a query suggestion displays only the typed query (2+ characters), a six-row **static** skeleton appears only during a real request, and actual product result rows replace skeleton when the response arrives. Stale-request protection and error/empty responses retained; no fake result entries.
- Version 0.1.5 → 0.1.6; independent theme deployment only. Added Turkish translation for "Clear search", switched visible placeholder from "Search products" to localized "Search", and replaced the old origin-motion CI test with a runtime search-controls test.
- Status: source change planned; check CI and deployment before claiming live. User-provided screenshot shows the target design; no claim of real iPhone visual acceptance. **Next**: verify code checks/deploy and live Safari for search UI, menu/cart and admin bar.


## Storefront 0.1.6 bağımsız dağıtım sonucu — 11 Ekim 2026

- Kaynak commit: [66c6d40](https://github.com/muhammetdkaya/codela-storefront/commit/66c6d40ed962ee267dd4f497ed04f9d73ce4ad43). Tema sürümü 0.1.6, CSS/JS cache anahtarları da 0.1.6.
- [GitHub Actions 38094834292](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38094834292): **validate ve deploy başarılı**. Python paket/doğrulama, PHP lint, JS sözdizimi ve `tests/search-panel.cjs` arama durumu testi geçti; bağımsız FTPS tema dağıtımı tamamlandı. Codela eklentisi yeniden yayımlanmadı.
- Kullanıcının son arama ekranı görseli temel alındı: koyu zemin, sol büyüteç, placeholder "Ara", sağda yuvarlak X, dinamik öneri, gerçek sonuçlar ve istek sürerken statik iskelet satırlar. Üç panelde geçiş animasyonları kaldırıldı. Menu/logo/arama/sepet header sıralaması korunur.
- **Doğrulanması gerekenler:** Canlı WordPress'te etkin tema ve gerçek iPhone Safari görünümü, klavye/odak, admin toolbar ve arama/sepet API etkileşimleri manuel olarak test edilmedi. FTPS deploy ve CI başarısı gerçek tarayıcıda kabul testi değildir.
- **Sıradaki ilk iş:** iPhone'da arama ekranını açarak son referansa uygun görünümü, X kapamayı, sonuçların gelmesini ve animasyonun olmadığını test et. Sonra menü/sepeti kontrol et ve görsel sorun varsa düzelt.

## Storefront 0.1.7 — shared white overlay design (11 October 2026)

- The prior dark Search surface is superseded: Menu/Search/Cart share a white background (#ffffff), ink text and subtle light-gray dividers. Search field is gray (#f3f3f3) rather than dark, while retaining the latest screenshot's inline magnifier, "Ara" placeholder, clear affordance, and separate circular close control.
- Introduced scoped `--sf-overlay-gutter`, `--sf-overlay-toolbar-height:68px`, `--sf-overlay-control-size:44px` shared by the standard Menu/Cart header and the Search toolbar. All close buttons are 44×44px light-gray circles, icon art 19px, borderless and without heavy focus frames; focus-visible is still available to keyboard navigation. Search height reduced 52→46px, magnifier 20px, iOS-safe font-size 16px.
- Result rows, typed-query suggestion and request-time static skeletons use the light palette. No changes to search endpoint, cart API, WordPress administrative offsets, modal scroll lock or reduced-motion behavior. Fullscreen animation remains disabled as requested.
- 0.1.6 → 0.1.7 bumps theme header and cached CSS/JS versions, without any Codela plugin or WordPress.org release. CI regression checks now verify unified white styling and sizes.
- At source authoring: CI / independent FTP deployment result has not yet been observed; real iPhone screenshot acceptance is pending. Next: check Actions deployment success and inspect all three panels on iPhone.


## Storefront 0.1.8 — gereksiz iki tekrar kaldırıldı (11 Ekim 2026)

- **Boş sepet:** "Alışverişe devam et" düğmesi kaldırıldı. Boş sepet mesajı kalır, dolu sepetin ürün satırları, toplam ve ödeme işlevleri değişmez.
- **Arama:** Giriş alanına yazılan sorgunun hemen altında aynen tekrarlandığı `sf-search-suggestion` satırı (ikon+kelime) HTML/JS/CSS'ten tamamen çıkarıldı. Input içindeki temizleme X'i, 2+ karakter sonrası gerçek sonuçlar, sorgu sürerken statik iskelet satırlar korunur.
- Beyaz Menu/Search/Cart tasarım ölçüleri ve animasyonsuz açılış/kapanış değişmez. Tema, CSS ve JS asset sürümü 0.1.7 → 0.1.8; Codela eklentisi değiştirilmez.
- Python paket/testler ve Node arama kontrol testi "öneri satırı ve boş-sepet CTA yok" regresyonlarını içerir.
- **CI/deploy henüz doğrulanmadan canlı yayımlandı kabul edilmez.** Sıradaki iş: Actions doğrula, iPhone'da arama/boş sepeti incele ve arama API / dolu sepet ödeme akışını kontrol et.


## Storefront 0.1.8 — doğrulanmış yayın sonucu (11 Ekim 2026)

- Kaynak commit: [a47d3f9](https://github.com/muhammetdkaya/codela-storefront/commit/a47d3f91668d4028b523873f3d7359412b2f2bdf).
- [Actions 38095656942](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38095656942): **validate + deploy başarılı**. Arama tekrarı ve boş sepet CTA regresyonları geçti; FTP üzerinden bağımsız tema dağıtımı tamamlandı. Eklenti WordPress.org sürümü değiştirilmedi.
- **Geçerli UI:** boş sepet sadece boş mesajını gösterir; arama yazarken aynı sorgu altında yeniden görünmez. Gerçek sonuçlar, arama temizle kontrolü, 2 karakter eşiği ve yükleme iskeleti korunur; ortak beyaz tema ve animasyonsuz paneller değişmedi.
- **Kalan kabul testi:** Kullanıcının iPhone/Safari'de boş sepet ve arama sonucunu görsel olarak tekrar doğrulaması; manuel canlı API testi yapılmadı.


## GEÇERLİ MOBİL NAVİGASYON KARARI — Storefront 0.1.9, 11 Ekim 2026

- Kullanıcı mobil Header'daki Menü düğmesini **sağa** istedi; menü simgesinin dokunma alanı menü/sepet panelindeki **X kapatma düğmesiyle aynı konumda** olmalı. Mobil üstte menü sağda, logo optik/gerçek merkezde; header'ın sağındaki arama ve sepet ikonları mobilde gizli. Masaüstündeki mevcut menü-solda/logo-ortada/arama+sepet-sağda düzeni korunur.
- Mobilde (<=700px) yüzen koyu dört sekmeli alt navigasyon: **Ana Sayfa / Ara / Sepet / Hesabım**. Yerleşim ekranda yatay merkezde, alt safe-area'nın 12px üstünde, 4 eşit genişlikte sekme; aktif sayfa daha açık kapsül. Arama ve Sepet alt düğmeleri eskiden çalışan WP Interactivity dialog açma işlemlerini kullanır, ikinci bir arama/sepet sistemi kurmaz. Erişilebilir etiketler ve 44px+ dokunma alanı vardır.
- Header/Menu X geometrisi: mobil Header yan boşlukları 20px, sağ Menü 44px; panellerde `--sf-overlay-gutter:20px` ve `--sf-overlay-control-size:44px`. Böylece ikon merkezleri aynı x konumundadır.
- Sepet rozeti iki yerde görünürse tüm `.sf-badge` elemanları ve `data-panel="cart"` etiketleri birlikte güncellenir. `is_front_page()` ve `is_account_page()` mevcut sayfayı belirtir.
- WooCommerce `is_checkout()` sırasında alt nav hiç oluşturulmaz; ürün/alt içerik yüzen nav arkasına düşmesin diye mobil body altına safe-area'lı boşluk ayrılır. Masaüstünde nav CSS ile kapalıdır. Bütün ekran panel animasyonları hâlâ **kapalı**.
- Yeni Lucide `house.svg` ve `user-round.svg` ikonları tema içindeki açık lisanslı ikon klasörüne eklenmiştir. Tema/JS/CSS kaynak sürümü 0.1.8 → 0.1.9. `tests/package.py` mobil hiyerarşi, yerleşim, rozeti ve sayfa bağlamını denetler.
- Bu not kaynak sürümü için yazıldı: CI/FTPS sonucu görülmeden canlı yayınlandı sayma. Sıradaki iş: CI/deploy doğrulaması, iPhone Safari'de sağ Header Menü/X hizası, alt dört sekme, safe area, sepet rozeti, arama/sepet açılışı, ödeme gizleme ve masaüstünün değişmediği kontrolleri.


## Storefront 0.1.9 — CI ve bağımsız dağıtım doğrulandı (11 Ekim 2026)

- Uygulama commit'i [b81cb08](https://github.com/muhammetdkaya/codela-storefront/commit/b81cb08042b65a63f28d6d542c07ab703b1d0bfc).
- [GitHub Actions 38107590141](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38107590141): **validate ve deploy success**. PHP lint, JavaScript sözdizimi, Python tema/paket ve Node arama testleri geçti. Tema ZIP/manifest bağımsız tema FTP hattıyla yayımlandı. WordPress.org Codela eklenti yayınına dokunulmadı.
- Son geçerli mobil tasarım: Header Menü **sağda**, orta logo; X kapatma ile sağ kenardan aynı 20px boşluk ve 44px hedef. Arama ve Sepet Header'da mobil gizli, koyu yüzen 4 sekmeli alt menüde. Ana Sayfa/Ara/Sepet/Hesabım tabları, checkout ekranında gizleme; desktop önceki Header ile devam.
- **Gerçek iPhone/Safari manuel kabul testi henüz yapılmadı.** Menü-X hizası, sabit alt bar, ürün ayrıntısı, alt safe-area, sepet rozeti ve giriş/checkout yönlendirmeleri cihazda ayrıca gözden geçirilmeli.


## Storefront 0.1.10 — mobil logo sola, alt menü kısa ve açık (11 Ekim 2026)

- Kullanıcı onayıyla mobil Header'daki **logo sola hizalandı**. Menü sağda kaldı ve açılan panel X ile aynı sağ kenar/tıklama alanını (`20px` kenar boşluğu, `44px` kontrol) paylaşmaya devam ediyor. Masaüstü Header düzenine dokunulmadı.
- Koyu mobil yüzen alt bar önceki `76px` yüksekliğinden `62px` asgari yüksekliğe indirildi; sekme içi minimum yükseklik `66→54px`. Sekme içi boşluk `7→5px`, ikon `22→20px`, yazı `11→10px`. Dört sekme, safe-area ve ödeme ekranında gizlenme korunuyor.
- Alt bar **açık gri** (`#f5f5f6`), aktif sekme hafif koyu gri (`#e2e2e6`), ikon/yazı koyu (`#28282c`); gölge yumuşatıldı. Sepet rozetinin koyu zemini ve beyaz yazısı kontrastı korur.
- Mobil içerik alt boşluğu yeni kısa bara göre `105→90px` olarak ayarlandı. Önceki animasyonsuz panel ve arama/sepet işlevlerine dokunulmadı.
- Tema ve CSS/JS cache sürümü **0.1.10**. Otomatik testler hizalama, alt bar ölçüleri/palet ve sürümü doğrular.
- Bu kayıt kaynak değişikliği içindir. Yeni CI/FTP yayın sonucunu kontrol etmeden canlıda tamamlandı demeyin. Sonraki iş: Actions sonucu, iPhone'da logo solda/menü sağda, X hizası ve açık kompakt alt navigasyonu incelemek; gerçek cihaz kabulü halen gerekli.


## Storefront 0.1.11 — Alt navigasyon modal içinde aktif + iOS sürükleyerek seçim (11 Ekim 2026)

- **Yeni kesin istek:** Kullanıcı arama ve sepet tam ekran panellerindeyken alt dört sekmeli mobil navigasyon görünür ve tıklanabilir olmalı; arama ⇄ sepet geçişi X'e basmadan doğrudan aynı modal içinde yapılmalı. Diğer sayfalarda alt nav mevcut şekilde çalışır; checkout ekranında hâlâ yoktur.
- Önemli teknik gerekçe: `<dialog>.showModal()` dışındaki bütün düğmeleri inert (etkileşime kapalı) yapar. Bu nedenle `mountDock()` ile var olan `.sf-mobile-dock` node'u dialog açılmadan önce **dialog içine taşınır**. Kapanırken `restoreDock()` aynı node'u orijinal yerine (`dialog.before`) koyar. İkinci/duplicate nav üretilmez; WooCommerce badge ve mevcut WordPress Interactivity handler'ları aynı DOM elemanında kalır.
- Arama ve sepet arası mod değişiminde dialog kapanmaz: `open('search'|'cart')` içerik bölümünü değiştirir, `markDockActive` aktif kapsülü günceller. Aramadan ayrılırken eski gecikmiş sorgu iptal edilir; cart mutasyonu/Store API bozulmaz. Menü popup açılınca dock gizlenir; X kapatıldığında asıl sayfa sekmesi geri seçilir.
- iPhone benzeri görsel tepki sadece alt menü sekmelerinde: `pointerdown` anında `.is-pressed` + hafif küçülme, bırakınca normal durum; basılı tutunca (`220ms`) veya yatay 10px üzerinde hareket edince `.is-scrubbing` başlar, parmak altındaki `.is-preview` kapsül büyüyerek/tonlanarak seçimi gösterir. `pointerup` seçilen sekmeyi açar (Ara/Sepet aynı modal, Ana Sayfa/Hesabım navigasyon); basit tıklamada native `<a>` davranışı korunur. `pointercancel`, kaydırma yönü, contextmenu, çift click ve `prefers-reduced-motion` ele alınır.
- Search/Cart içerikleri yüzen alt nav'ın altında gizlenmesin diye mobilde sonuç listesi ve sepet alt toplam/ödeme alanının alt boşluğu güvenli alanla birlikte artırıldı; tab z-index üstte.
- Tema, CSS/JS cache sürümü **0.1.10 → 0.1.11**. `tests/dock-gesture.cjs` ile gerçek JS helper'ları çalıştırılarak mount/restore, aktif sayfa, pointer seçimi, hold, iptal/duplicate click; `tests/package.py` ile statik sözleşme korunur. CI workflow Node testini çalıştırır.
- **Henüz CI/deploy çalıştırılmamış kaynak hazırlığıdır**; test ve üretim durumunu kontrol etmeden başarı iddia etme. Sonraki iş: GitHub Actions doğrulama + FTPS dağıtım sonuçlarını al, iPhone'da Arama ↔ Sepet ve Ana Sayfa/Hesabım bırakma, klavye/safe-area, X/focus, checkout CTA ve gerçek cihaz görünümünü test et.

### Verified 0.1.11 rollout — 11 October 2026
The source implementation is `2db0a69`; the mock DOMRect fixture was corrected in `c99479c`. The [GitHub Actions run 38112420622](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38112420622) completed validation and FTPS deployment successfully. Mobile Search/Cart now share an interactive dock via temporary reparenting into the native modal. Finger press-and-scrub routing has automated coverage. Real iPhone Safari testing of keyboard, safe-area, cart checkout visibility and drag gestures remains pending.
