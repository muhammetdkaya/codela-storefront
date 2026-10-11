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


## Storefront 0.1.12 — iPhone klavye, sürükleme, kayan alt bar (11 Ekim 2026)

- Kullanıcı arama paneli ve Hesabım sayfası açılınca klavyenin **otomatik açılmamasını** istedi. Aramada ilk odak artık `#sf-query` yerine metin girişi olmayan `.sf-search-cancel` X düğmesidir; kullanıcı alana dokununca normal klavye çalışır. WooCommerce Hesabım giriş/kayıt alanlarındaki otomatik odak, ilk kullanıcı etkileşiminden önce kısa süreli (`1600ms`) ve yalnızca hesap sayfası kapsamıyla sınırlandırılan `preventInitialAccountAutoFocus()` korumasıyla engellenir; manuel dokunma/klavye ile odak kaldırılmaz.
- iPhone'da önceki yalnız `pointer` yaklaşımı sürüklemede çalışmıyordu. 0.1.12 `touchstart/touchmove/touchend/touchcancel` ile doğrudan Safari dokunma akışını takip eder; 240ms basılı tutma veya 9px yatay hareket sürüklemeyi başlatır. Parmak altındaki dört sekme görünür önizleme olur ve bırakınca ilgili sekme/panel açılır. Mouse/pen için pointer yolu korunur; sentetik click engeli ve dikey sayfa kaydırması ayrıştırılır.
- Aşağı kaydırıldığında yüzen alt menü `260ms` yumuşak kayarak ekranın altına gizlenir; altta ince `42×4px` çizgi kalır. Yukarı kaydırınca veya çizgiye dokununca geri görünür. Ana sayfa, Hesabım ve içeriği kaydırılabilen Arama/Sepet modalının scroll olayları desteklenir. Gizli sekmeler inert; çizgi klavyeyle açılabilir; `prefers-reduced-motion` geçişi devre dışı bırakır. Nav açık gri kalır ve ödeme sayfasında hiç render edilmez.
- Kaynak sürüm 0.1.11 → **0.1.12**; CSS/JS asset sürümleri de yükseldi. `tests/dock-gesture.cjs` touch, hold, scroll hide/show ve odak davranışını test edecek şekilde güncellendi; Python tema testleri ve Türkçe `Show navigation` çevirisi eklendi.
- Kaynağın commit'i ve CI/FTP sonucu ayrıca doğrulanacak. Gerçek iPhone Safari klavye/gesture/safe-area manuel kabulü henüz yapılmadı. Sıradaki iş CI testleri ve deploy, sonra üç kullanım durumunun gerçek cihaz kontrolü.

### Verified 0.1.12 release (2026-10-11)
Source changes were committed in `181290a` with a test-only fixture correction in `7b8966b`. [Actions #38112985514](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38112985514) successfully validated and deployed the standalone theme, including Node touch/scroll/hold simulations, PHP lint and package checks. The search modal now focuses a non-text close button rather than the query on opening; initial WooCommerce account auto-focus receives a narrow guard until the first explicit user action. The dock uses Safari touch events for drag selection, scroll-aware animated hiding, and a keyboard-accessible thin reveal handle. Real iPhone Safari input, pointer cancellation, keyboard, scroll and bottom safe-area acceptance remain pending.



## Son doğrulanmış devam noktası — 11 Ekim 2026 / Storefront 0.1.13

- Kullanıcının header, alt menü, hız ve geçiş kalitesini iyileştirme isteği uygulandı. Tema **0.1.12 → 0.1.13**; eklenti sürümü değişmez.
- Biten: gerçek PHP alt menü bağlantılarındaki eksik `data-dock-view` kimlikleri eklendi. Sürükleyip Ara/Sepet'e bırakmak artık tam ekran paneli açar; seçili kapsül doğru sekmeyi izler. Alan dışında bırakma iptal edilir, mouse/pen sürüklemesi capture ile izlenir; normal link tıklaması korunur.
- Alt menü: tek kayan kapsül, yalnız transform/opacity animasyonu; dokunma hedefleri yer değiştirmez. Kaydırma her karede bir kez işlenir, küçük hareketler birikir, bounce sınırlandırılır. Safe-area dahil gerçek gizlenme mesafesi ve ayrı sabit 44px erişilebilir çizgi hedefi; yalnız durum değişiminde DOM güncellenir.
- Header: mobil logo solda/menü sağda; 68px ortak yükseklik, 20px yan boşluk ve 44px kontrolle Menu/Search/Cart X hizası. Masaüstü ortalı logo korunur. Eski CSS geçiş yama blokları azaltıldı.
- **Güncel hareket kararı:** kullanıcının bu talebiyle içerik geçişi 160ms/8px, alt kapsül 220ms, gizlenme 240ms. Tam ekran dialog dönüştürülmez, ikon kökenli büyüme yoktur. Kapatma anında; hızlı geçiş önceki animasyonu iptal eder; reduced-motion hareketi kapatır. Önceki tamamen animasyonsuz içerik kararı bu kapsamda güncellenmiştir.
- Native dialog açılmadan önce görünür bölüm ve metin dışı autofocus hazırlanır; aramayı tekrar açarken geçici input odağı engellenir. Aktif sekmeye tekrar dokunmak ağ isteği başlatmaz. Sepete dönüşte mevcut toplam kaybolmaz; arka plandaki sepet mutasyonu mesajı başka panele sızmaz. Body kilidi/scroll/admin bar ve dock'un asıl DOM yeri geri yüklenir.
- Doğrulama: PHP lint, JS syntax, 12 Python paket/dağıtım testi, Node arama/dokunma testleri geçti. Yeni Chromium testi gerçek PHP çıktısı + tam JS ile 320/390/700/1024px, sekme tap/touch/hold/outside cancel, safe-area, yavaş ve modal scroll, focus/reopen, gecikmiş arama, hızlı geçiş, reduced-motion ve WordPress toolbar konumunu sınar. WP action bağlama ve API yanıtları test sınırında simüledir; gerçek WP/Woo entegrasyon kabulü değildir.
- **Yayın doğrulandı:** kaynak `fe5d8104a0b102bce5fd899bd9195a011e6f39a3`, gesture düzeltmesi `b43479da9d52e5e08f7dca34a8eb35534da295e0`; [Actions 38114065497](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38114065497) validate (browser dahil) ve deploy **success**. Bağımsız FTPS tema 0.1.13 dağıtımı tamamlandı. Gerçek iPhone/Safari ve gerçek ödeme akışı bu ortamda test edilmedi.
- Sıradaki iş: canlı iPhone'da sekmeler arası sürükleme, klavye/safe-area ve geçiş hissini kontrol et. Otomatik Chromium başarısını iPhone/Safari kabulü veya gerçek cihaz hız ölçümü olarak sunma.

### 0.1.13 review evidence

Root cause of failed scrub navigation: production PHP had no `data-dock-view` attributes, while the old Node fixture invented them. It therefore tested an impossible DOM and passed. The new browser gate renders `inc/render.php` through `tests/render-header.php`, then runs the full JS with only WP action binding/API stubs. It also verifies checkout omits the dock. Node/Python contracts now assert actual routing attributes.

Other concrete failures: per-event >7px scroll threshold ignored slow movement; collapsed translation omitted the dock's safe-area offset; all tab boxes were measured after visual writes; release outside fell back to the previous tab; search was exposed only after `showModal()` had performed autofocus; repeated current-tab clicks refetched/reset content. Tests cover the changed boundaries rather than claiming real device FPS improvements.

Run locally: `node tests/dock-gesture.cjs`, `node tests/search-panel.cjs`, `python3 tests/package.py`; with PHP and Playwright Chromium installed, `node tests/navigation-browser.cjs`. `PHP_BIN`, `PLAYWRIGHT_MODULE`, `CHROMIUM_BIN` optionally select existing executables. Browser dependencies are CI-only and are not in the theme ZIP. Static screenshot review checks the light dock/selection and shared search toolbar; real iOS gesture arbitration, virtual keyboard and accessibility remain manual acceptance tasks.

### 0.1.13 CI edge-case correction — 11 October 2026
Source `fe5d8104a0b102bce5fd899bd9195a011e6f39a3`; Actions 38113974270 passed PHP/Node/Python but browser test stopped deployment: a reveal-handle press within 700ms of a canceled scrub was swallowed by the synthetic-click guard. New physical presses now reset that guard even when the target is the handle, with a deterministic regression test. Theme stays 0.1.13; deploy remains pending until the corrected run succeeds.

### Verified 0.1.13 deployment — 11 October 2026
[Source b43479d](https://github.com/muhammetdkaya/codela-storefront/commit/b43479da9d52e5e08f7dca34a8eb35534da295e0), [Actions 38114065497](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38114065497): validate and deploy completed successfully. PHP/JS/Node/Python and the new real-rendered-markup Chromium suite passed. Standalone FTPS theme/ZIP/manifest distribution completed; no Codela plugin release. This supersedes the pending status in the CI correction note. Real iPhone Safari and live checkout acceptance remain unverified; next work starts with that device check, not repeating the implemented navigation refactor.


## 0.1.14 — Tek satırlık minimal Storefront footer (11 Ekim 2026)

- Kullanıcının istediği tek satırlık, sade/kullanışlı footer hazırlandı: solda **© geçerli yıl + mağaza adı**, sağda yalnızca WordPress'te mevcut/published olan **Gizlilik** ve WooCommerce **Koşullar** sayfaları. Sahte bağlantı veya sabit yıl yok. Mağaza adı ana sayfaya gider.
- Eski `footer_text` tema ayarı korunur; kısa not masaüstünde aynı satır içinde gösterilip uzun metin kesilir, mobilde tek satırı ve gerekli yasal bağlantıları korumak için gizlenir. WordPress Custom Logo/brand tercihi bozulmaz.
- Beyaz, ince ayırıcı çizgili, düşük yükseklikte footer; masaüstü ve mobilde `flex-wrap:nowrap` ile bir sıra, marka fazla uzunsa ellipsis; mobilde 11px gövde/bağlantı. Diğer tema bölgeleri ve dört sekmeli alt nav değiştirilmedi.
- Sürüm **0.1.13 → 0.1.14** (theme + CSS/JS cache). Türkçe `Terms=Koşullar`, `Legal links=Yasal bağlantılar`. Var olan schema field ID'leri değiştirilmedi, footer not açıklaması güncellendi.
- Test: `tests/render-footer.php` gerçek render callback'i WordPress stub'larıyla çalıştırır; `tests/footer.cjs` boş vs yayımlanmış legal linkleri ve HTML/satır sözleşmesini kontrol eder; `tests/navigation-browser.cjs` gerçek HTML/CSS ile 390px mobilde aynı satırı kontrol eder; Python regresyon ve CI Node footer testi eklendi.
- Kaynak kaydedilirken CI/deploy henüz doğrulanmış sayılmaz. Sıradaki iş: Actions validate + deploy status, canlı iPhone Safari footer düzeni ve uzun mağaza adları.

### 0.1.14 deployment verified — 11 October 2026
Source [8308f35](https://github.com/muhammetdkaya/codela-storefront/commit/8308f354808c813a88c2163f4a3586eb2d89327a), footer test assertion corrected in `b55b14f`. [Actions 38123576016](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38123576016): **validate and independent FTPS deploy success**. PHP output, footer legal link visibility, Python contract and real Chromium 390px one-line layout passed. Current version 0.1.14. Footer is copyright year/store name left; published Privacy and Terms links right; theme footer note kept on desktop, hidden on mobile to remain single row. Existing bottom dock untouched. Live Safari visual review is still pending; do not represent CI as an iPhone device test.


## Storefront 0.1.15 — WooCommerce Hesabım giriş, kayıt ve oturum içi arayüz (11 Ekim 2026)

- Kullanıcının isteği: mobil alt menü **Hesabım** bağlantısının açtığı gerçek WordPress/WooCommerce müşteri sayfasına sade, minimal, güvenli bir giriş tasarımı. Codela Site tema arayüzünün beyaz/monokrom, düşük yoğunluklu görsel dilini kullan.
- Temaya `inc/account.php` eklendi. WooCommerce'nin **mevcut** `woocommerce_before_customer_login_form` ve `woocommerce_before_account_navigation` hook'larında; yalnız `is_account_page()` sırasında kısa, erişilebilir, çevrilebilir başlık+alt açıklama basılır. Oturum açma, hesap oluşturma, şifre sıfırlama, CAPTCHA/üçüncü parti hook'ları, nonce ve WooCommerce kendi form şablonları korunur; kendi giriş endpoint'i veya yeni eklenti bağımlılığı eklenmedi.
- Giriş sayfasında ortalı `Welcome back` girişi, beyaz 500px max genişlikte tek kart, 48px açık gri input, siyah tam genişlik giriş düğmesi, sade remember-me/lost-password. WordPress/WooCommerce kayıt açıksa mevcut `#customer_login` login/register paneli masaüstünde 2 sütun, mobilde alt alta. Hesap kurtarma, profil düzenleme ve hesap metinleri aynı CSS paletiyle tasarlandı.
- Oturum açmış müşteride WooCommerce kendi `.woocommerce-MyAccount-navigation` menüsü ve `.woocommerce-MyAccount-content` mevcut kalır; masaüstü ince açık gri kenarlıklı sidebar+kart, mobil yatay kaydırılabilir menü+tam genişlikte içerik. WordPress post-title, `.sf-account-intro` mevcutsa gizlenir; gereksiz iki başlık olmaz. Otomatik mobil klavye engellemesi korunur.
- Sürüm **0.1.14 → 0.1.15**, CSS ve JS asset versiyonları aynı. TR metin çevirileri eklendi. Tema haricinde WordPress.org Codela eklentisi değiştirilmedi; ana header/mobile alt navigasyon/footer korunur.
- Doğrulama: `tests/render-account.php` gerçek account hook çıktılarını üretir. `tests/account-browser.cjs` Woo native login/register/dashboard sınıf-kontratlarının stilini 390px/1280px Chromium'da ve giriş alanının otomatik odağı olmamasını test eder. Python package tests ve GitHub Actions browser stage güncellendi.
- Kaynak oluşturma notu: Actions validate/deploy bitmeden canlı denmez. Sonraki iş: CI, standalone FTPS deploy kontrolü, gerçek iPhone Safari + codela.dev My Account'ta kullanıcı login/kayıt/şifre sıfırlama/oturum açma kabul testi.

### Verified Storefront 0.1.15 release — 11 October 2026
- Implementation [8e6786e](https://github.com/muhammetdkaya/codela-storefront/commit/8e6786ea9d461dfd66ef3e4b523fa0902aa80f2c). [GitHub Actions 38128015885](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38128015885): **validate and deploy success**. PHP lint, Node unit tests, Python package tests, existing mobile navigation browser checks, and new 390px/1280px account login/register/dashboard Chromium layout tests passed. Independent FTPS theme deployment completed.
- The design customizes the WooCommerce customer account experience only through theme CSS and display hooks. Authentication, registration enablement, WooCommerce nonce handling, lost-password workflows, and endpoint links remain WooCommerce-owned. The Codela plugin is unchanged.
- Manual acceptance still needed on live iPhone Safari: verify My Account login, login error notice, lost password, optional registration, and after-login orders/addresses dashboard. No live user credentials were used in automated tests.


## Storefront 0.1.16 — Codela My Account çatışmasının giderilmesi (11 Ekim 2026)

- Kullanıcının iPhone ekran görüntüsünde, Storefront 0.1.15'in `HESABINIZ / Hesabım / Siparişlerinizi...` giriş ekranı başlığını **giriş yapmış Codela hesap panelinin ÜSTÜNE** yerleştirdiği gözlendi; Codela'nın kendi Hesabım başlığı, avatar, son sipariş, gönderi takibi ve modül bağlantıları zaten mevcut. Kullanıcı bunların bozulmamasını istiyor.
- Gerçek kodla doğrulama: bağımsız plugin `muhammetdkaya/codela` içinde `codela-commerce-toolkit/includes/my-account-layout.php` yerleşik `Codela\Includes\MyAccountLayout` sınıfı, login durumunda `codela-my-account-layout` body class'ı ve kendi CSS/JS'i, Woo navigation/dashboard hook'ları, mobil uygulama tarzı hesap paneli, sipariş/kargo vb. sağlıyor. `woocommerce_before_account_navigation` hook'unu çağırdığı için temanın hesap başlığı ekleniyordu. `assets/css/codela-my-account.css` plugin'ın stil kaynağı. Plugin'e müdahale edilmedi.
- Temada `inc/account.php` artık **yalnız giriş yapmamış kullanıcı** için `woocommerce_before_customer_login_form` hook'una bağlı; `woocommerce_before_account_navigation` hook'u tamamen kaldırıldı; ayrıca `is_user_logged_in()` koruması var. Oturum açmış kullanıcıda tema girişi artık yok.
- 0.1.15 ile eklenen 90 `body.woocommerce-account` CSS seçicisinin tamamı `body.woocommerce-account:not(.codela-my-account-layout)` ile sınırlandırıldı: Codela'nın authenticated account görünümü, sipariş listeleri, adres kayıtları ve tab/kargo/diğer modülleri tema CSS'iyle yeniden tasarlanmıyor. Sadece Codela sayfasındaki varsayılan WordPress block post title `body.codela-my-account-layout .sf-content > .wp-block-post-title` gizlenerek mevcut panelde ikinci sayfa başlığı engelleniyor. Giriş/kayıt/şifre sıfırlama tasarımı ve Codela devre dışıyken temel WooCommerce hesap teması devam ediyor.
- `tests/render-account.php` signed-in ve guest davranışı ile fixture'ı güncelledi; `tests/account-browser.cjs` 390/1280px Chromium'da guest auth, vanilla Woo hesap fallback ve Codela signed-in örneğinde başlık/uygulama menüsü/çakışmayan stilleri doğruluyor. Python testleri guest-only hook'u ve CSS isolation guard'larını denetler.
- Sürüm **0.1.15 → 0.1.16**, theme / JS+CSS cache. Codela eklentisi değiştirilmedi. Kaynağı kaydetmek CI veya canlı dağıtım kanıtı değildir; sonraki adım Actions validate+deploy başarısını görmek, gerçek iPhone Safari'de Codela Hesabım, adresler ve siparişler için manuel kabul.

### Codela My Account ownership fix deployed (0.1.16, 2026-10-11)
The plugin's `Codela\Includes\MyAccountLayout` is the source of truth for authenticated account UI, including order dashboard, profile, cargo tracking and custom menu links. The theme must **never** register an authenticated heading on WooCommerce's `before_account_navigation` hook or style account components when the `codela-my-account-layout` body class is present. Only the guest login UI remains themed; the site's WordPress post-title is hidden on the plugin-owned signed-in page to avoid duplicate headings. [GitHub Actions 38129810982](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38129810982) completed validation and standalone FTPS deployment successfully. Do not change the independent Codela plugin for this theme-only issue. Live authenticated iPhone UI still needs device acceptance.



## Son doğrulanmış devam noktası — 11 Ekim 2026 / Storefront 0.1.17

- Güncel `c35e0ea` / 0.1.16 üzerine çalışıldı: tek satır footer, guest login ve Codela oturum içi Hesabım sahipliği/izolasyonu aynen korunur. Tema **0.1.16 → 0.1.17**, CSS/JS cache beraber yükseldi.
- Header şemasında `mobile_dock_enabled` checkbox, varsayılan açık. **Codela > Ayarlar > Tema > Header > Mobil alt menü** kapatılınca alt nav HTML'si üretilmez; boş alt padding/checkout clearance kalmaz. Kapalı mobil mod ve desktop aynı arama/sepet/hesap linklerini kullanır. Desktop'a mevcut yerel user-round ikonu ile Hesabım eklendi. Mobil kapalı mod desktop sırasını (menü/marka/ara-sepet-hesap) dar ekrana sığdırır; açık modda logo solda/menü sağda düzeni korunur. Ödeme ekranında dock hâlâ yoktur.
- Alt barın ikonları, yüzeyi ve seçili kapsülü tek `.sf-dock-surface` içinde beraber hareket eder. Sabit nav ve 44px çizgi hedefi korunur. Aşağı kaydırırken 380ms boyunca aşağı iner ve %58 ölçeğe küçülür; opaklık ancak son 100ms'de söner. Yukarıda/çizgiye dokununca büyüyerek geri gelir. Dokunma, scrub, aktif kapsül ve reduced-motion korunur.
- Ayar motorunda generic checkbox desteği için bağımsız Codela köprüsü `07418c938e2d099e330e6c03d332a826e3c3b67f`. Eklenti 1.1.1; WordPress.org yayını yok. Tema seçeneğinin tanımı hâlâ tema şemasındadır.
- Doğrulama: PHP lint, Node arama/dock/footer, 14 Python testi ve gerçek PHP çıktısı kullanan Chromium nav testi geçti. 320/390/700/1024px açık/kapalı header, arama/sepet, hesabım URL'si, varsayılan ayar, checkout, phantom padding ve görünür ara-kare küçülme/büyüme kontrol edildi. GitHub CI içinde güncel account/footer testleri de geçti; canlı Safari kabulü yapılmadı.
- Yayın: tema kaynak `5679b4a6ef9f24b1eb7fa0ac7d3fb9555c76dca8`, [Actions 38130928343](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38130928343) validate + FTPS deploy başarılı; log: `Storefront deployed; checks passed.` Köprü `07418c938e2d099e330e6c03d332a826e3c3b67f`, [Actions 38130707958](https://github.com/muhammetdkaya/codela/actions/runs/38130707958) validate + deploy başarılı: 983 dosya checksum ile doğrulandı, bootstrap geçişi ve public sağlık kontrolleri geçti. Free edition [38130707988](https://github.com/muhammetdkaya/codela/actions/runs/38130707988) başarılı. Sıradaki iş: canlı Header ayarını kapat/aç ve iPhone Safari'de bar küçülme/büyüme hissini kontrol et. Canlı müşterilerin ayarı bu çalışma sırasında kendiliğinden kapatılmadı.


## Son doğrulanmış devam noktası — 11 Ekim 2026 / Storefront 0.1.18

- Tema 0.1.17 → 0.1.18: gizlenince kalan çizgi 12px aşağı taşındı; sabit 44px dokunma hedefi ekran içinde kaldı.
- Barın aşağı kayıp küçülmesi / yukarı çıkıp büyümesi 380ms → 480ms. Daha yavaş başlangıçlı easing ve %48 son ölçek; opaklık son 100ms'de söner. Çizgi 320ms gecikmeyle belirir. Reduced-motion değişmez; yalnız transform/opacity hareket eder.
- Doğrulama: 14 Python paket/dağıtım testi ve gerçek PHP çıktılı Chromium nav regresyonu geçti (ara-kare küçülme/büyüme, safe-area, 44px çizgi hedefi, dokunma, paneller ve dört ekran genişliği). Gerçek iPhone Safari hissi elle doğrulanmadı.
- Yayın: kaynak `b84badc875b7da4af38efe65ccf942211e91a3a4`, [Actions 38133847797](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38133847797) validate (nav/account browser dahil) + bağımsız tema FTPS deploy başarılı; log: `Storefront deployed; checks passed.` Eklenti değişmedi. Sıradaki iş: iPhone'da çizgi konumu ve belirginleşen geçişi kontrol et.


## Son doğrulanmış devam noktası — 11 Ekim 2026 / Storefront 0.1.19

- Tema 0.1.18 → 0.1.19. Kullanıcının App Store görseline göre alt bar hafif saydam açık yüzey, tek 20px backdrop blur + doygunluk, ince aydınlık kenar ve yumuşak gölge kullanır. Blur desteklenmiyorsa opak fallback; reduced-transparency tercihi de opak yüzeyi seçer. Blur/gölge animasyonu yok.
- Dokunmada seçili arka plan kapsülü %6 büyür; dokunulan sekme touchstart/pointerdown anında önizlenir, basılı tutma/sürükleme boyunca parmağı izler. İptalde doğru aktif sekme ve normal ölçek geri gelir. İkonlar 20 → 22px; ikon dokunma tepkisi hafif büyüme. 44px hedefler ve 0.1.18 gizleme/çizgi davranışı korunur.
- Doğrulama: 14 Python testi, Node arama/footer/dock gesture, JS syntax ve gerçek PHP çıktılı Chromium navigation geçti. Yeni gerçek DOM touch testi: kapsül büyümesi, gezinmeden anında önizleme, cancel sonrası ölçek/aktif sekme geri dönüşü. Mobil görüntü incelendi; iPhone Safari'de native hissin birebir eşitliği veya performans ölçümü yapılmadı.
- Yayın: kaynak `214ca8fc5b458984377a0c0e5dd995a2c0da4a85`, [Actions 38135019365](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38135019365) validate (nav/account browser dahil) + bağımsız tema FTPS deploy başarılı; log: `Storefront deployed; checks passed.` Eklenti değişmedi. Sıradaki iş: gerçek iPhone'da ürün görseli/metin üstünde barın okunurluğu, dokunma ve sürükleme hissini kontrol et.


## Son doğrulanmış devam noktası — 11 Ekim 2026 / Storefront 0.1.20

- Tema 0.1.19 → 0.1.20: touchend/pointerup sırasında kapsülün eski aktif sekmeye dönüp click ile tekrar hedefe kayması düzeltildi. Geçerli tap/scrub bırakışında sadece basılı görünüm temizlenir; hedef kapsül native click veya sayfa geçişine kadar korunur. İptal/dışarı bırakma eski aktif sekmeyi geri getirir.
- Doğrulama: JS syntax, Node dock gesture, 14 Python testi ve gerçek PHP çıktılı Chromium navigation geçti. Regresyon: Ana Sayfa → Sepet (sağ), Sepet → Ara (sol); touchend sonrası click 100ms geciktirilince hedef indeks korunur, panel açıldığında aynı hedef kalır. Mevcut cancel/hold/scrub/safe-area/reduced-motion testleri geçti. Gerçek iPhone Safari elle test edilmedi.
- Yayın: kaynak `581e70edb0eccd541e6a55f12181181758ea57bf`, [Actions 38138481833](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38138481833) validate (nav/account browser dahil) + bağımsız tema FTPS deploy başarılı; log: `Storefront deployed; checks passed.` Eklenti değişmedi. Sıradaki iş: iPhone'da sekmelerde dokun-bırak ve sayfa geçişinde geri sıçrama olmadığını kontrol et.


## Son doğrulanmış devam noktası — 11 Ekim 2026 / Storefront 0.1.21

- Tema 0.1.20 → 0.1.21: tam sayfa gezinmesinde kapsülün önce solda oluşup aktif sekmeye kayması düzeltildi. Header PHP çıktısı `has-selection` ve doğru `--sf-dock-index` değerini ilk HTML'de verir; Hesabım index 3, Ana Sayfa index 0. JS başlangıcı aynı konumu korur, kullanıcı sekme değiştirdiğinde mevcut animasyon çalışır.
- Doğrulama: render PHP lint, 14 Python testi ve gerçek PHP çıktılı Chromium navigation geçti. Ana Sayfa/Hesabım yeni belge yüklemesinde JS öncesi doğru konum + görünürlük ve JS sonrası transform geçişi olmaması sınandı. Önceki touchend/cancel/scrub/panel testleri geçti. Gerçek iPhone Safari elle test edilmedi.
- Yayın: kaynak `fd3b57ec608ea877e2299b3985369506aa9af929`, [Actions 38139646274](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38139646274) validate (nav/account browser dahil) + bağımsız tema FTPS deploy başarılı; log: `Storefront deployed; checks passed.` Eklenti değişmedi. Sıradaki iş: iPhone'da Hesabım ve Ana Sayfa tam sayfa geçişlerinde soldan gelişin olmadığını kontrol et.



## Theme 0.1.22 — Codela UI Kit shared foundation (pending validation)

The design-system contract is documented in [`docs/design-system.md`](design-system.md). New source `inc/ui.php` renders shared accessible IconButton and PrimaryLink controls; new styles `assets/styles/tokens.css` and `assets/styles/components.css` own size, motion, colors and variant states. Header Menu/Search/Cart/Account triggers, both panel X controls, search clear, cart checkout and homepage hero use shared renderers. Native mobile dock links opt into the navigation token class; Store API cart qty/remove/retry and submenu button use the shared press behavior. Search/cart/menu events, one floating dock controller, checkout no-dock, footers and Codela signed-in account are kept intact. The independent plugin is NOT modified.

Test additions: `tests/render-ui.php` and `tests/ui-kit.cjs` exercise markup reuse, aria/escaping, real PHP header output and shared classes. Browser fixtures load tokens → layout → components in production order, and Python assertions check ownership and package contents. Manual iPhone acceptance remains required; do not mark this version deployed until GitHub Actions validation and FTPS deploy are successful. The next approved work is modularizing JS state/control, migrating legacy feature-only CSS and adding a non-public component playground, with visual equivalence tests.

## 0.1.23 stylesheet isolation — pending CI / deployment

The v0.1.22 shared UI Kit remains the source of control design. Mobile responsive header and floating dock are now `assets/styles/navigation.css`, while guest/vanilla Woo account styling is `assets/styles/account.css` and only loads on `is_account_page()`. Shared control CSS stays in `assets/styles/components.css`; page/layout CSS remains in `assets/storefront.css`. The existing 480ms dock movement, capsule, Safari touch handlers, bottom safe area, and Codela plugin account ownership are unchanged.

Test fixtures load CSS in production order and 16 Python assertions cover file ownership. Do not claim a new live release until the GitHub Actions validate + standalone FTPS deploy both succeed. Next controlled refactor: overlay/search/cart CSS isolation, then JS controller separation with tests.

## 0.1.24 — complete shared Button behavior (pending CI + FTP)

`inc/ui.php` now includes the general `codela_sf_ui_button()` for true button or anchor semantics, with primary/secondary/quiet variants, submit/button/reset, optional icon placement, loading, disabled, escaped attributes, and disabled-link navigation suppression. The previous `codela_sf_ui_primary_link()` becomes a compatibility wrapper using this one renderer. `styles/components.css` owns every variant, pressed/focus/disabled/loading presentation and reduced-motion handling. Existing Head/Nav/Cart/X contract and plugin-owned logged-in account remain unchanged.

`tests/render-ui.php` and `tests/ui-kit.cjs` cover accessible output; new Chromium `tests/ui-kit-browser.cjs` verifies shared sizes, visuals, semantic attributes, responsiveness and reduced-motion indicator. Workflow/16 Python assertions updated. Source creation is NOT deployment proof. Verify GitHub Actions validation and independent FTPS deployment; real Safari acceptance remains outstanding.
