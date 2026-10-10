# Codela Storefront — bağımsız tema

10 Ekim 2026: Tema 0.1.1, eklenti 1.1.1. Kaynak `theme/codela-storefront/` altında bu depoya taşındı. Kaynak commit: c4be5baf419b3385a20df4ba898b03d39e6cc361. Tema içeriği bu taşımada değişmedi.

Tema dağıtımı artık eklentinin tamamının yayınlanmasını beklemez. Eklenti tarafında ayarlar ve yükleyici kalır; remote manifest/ZIP köprüsü ayrı codela deposunda tutulur. Eski tema paketi yalnız dondurulmuş 0.1.1 ilk kurulum yedeğidir.

Doğrulama: altı yerel paket/dağıtım testi geçti; kimlik, yanlış FTP mapping, eksik secret, başarılı dağıtım, sağlık kontrolü hatasında geri alma ve tekrarlanabilir ZIP. PHP/JS kontrolleri ve ZIP üretimi de CI'da geçti. Canlı yayın için yeni depo secret'ı CODELA_FTP_PASSWORD gereklidir; yayın başarılı sayılmadı.

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

## Taşıma kanıtı

Tema commit: 3c6fabf3684aca41997c1df1ddaf63baec10941a; Actions 38051320461 validate başarılı, deploy eksik CODELA_FTP_PASSWORD adımında durdu. Eklenti remote paket köprüsü commit: 564761563339c268fc3a1a8e07a0fbb51fc05969. Canlı tema dağıtımı yapılmış sayılmadı.
