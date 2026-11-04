# Shared UI adoption — 4 November 2026

Status: **published GitHub-only** as Codela Storefront **v0.1.197**. Merged [PR #88](https://github.com/muhammetdkaya/codela-storefront/pull/88), source/tag commit `dff4f9286ad818591b34ac49f649192b82e1c7d4`. Release verified in [Actions 41826002816](https://github.com/muhammetdkaya/codela-storefront/actions/runs/41826002816); 215,679-byte ZIP with SHA256 `e5aae1cb1b55256da8b324da776ea004dc0444fe6bfea3931921708bd4be8868`. No FTP, stable-feed advancement, plugin change, or live deployment.

## What changes

Framework7 9.3.0's selected iOS CSS sources are adapted into the existing shared
theme primitives. Fifteen Framework7 Icons SVGs replace the used local glyphs.
The menu/X two-line morph remains the existing accessible control. No framework
runtime, router, icon font, CDN, new store or second dialog is installed.

| Source | Production adaptation |
| --- | --- |
| `app-vars.less`, `mixins.less` | White 75% glass, 16px blur / 180% saturation, layered light edge and thumb shadow; smaller shadow for compact controls; panel tint 85% |
| `button.less`, `button-vars.less`, `button-ios.less` | Capsule Button radius, neutral tonal/pressed variants, 100ms engagement and 220ms release; existing 44px/54px targets |
| `toolbar-ios.less`, `toolbar-vars.less` | Normal/pressed indicator paints share the existing 4px inset, continuous position and dialog relocation; 240ms release selection |
| Fifteen original SVGs | Original filled paths/viewBoxes preserved, neutral filenames retained, 24px rendered boxes and content-hashed URLs |
| `tabbar-highlight.js` | Reference only; no JS copied. Existing controller already owns pointer identity, cancellation, scrub and modal relocation |

Original sources live in `third-party/`. The full commit, original SHA256,
source-to-target mapping and per-file adaptation notes are recorded in
`scripts/ui-upstream-manifest.json`. Full MIT notices ship in
`theme/codela-storefront/THIRD-PARTY-NOTICES.txt`; the retained menu asset's Lucide
notice remains. Run `python3 scripts/check-ui-upstream.py` to verify provenance.

## Ownership and compatibility

Editable paint is in `tokens.css` and `components.css`; navigation owns geometry.
`--sf-ui-button-radius` is independent of the unchanged 12px field/card radius.
Account icons and navigation silhouettes share `--sf-ui-icon`. The inline back
arrow bootstrap now explicitly supplies the shared class and 24px dimensions.
Generated production CSS is rebuilt with `python3 scripts/build-assets.py`.

The dock's `::before` remains the controller's computed position source; both
normal and pressed paints use the same transform. Scrubbing has no transform
transition. Neither blur nor shadow is animated. Existing reduced-motion,
reduced-transparency and unsupported-backdrop fallbacks remain; forced colors
adds an explicit selection outline. Existing 700/901/1100px breakpoints, native
Woo forms/Store API and product no-dock ownership are preserved.

## Verification record

Passed locally before the runtime reset: UI Kit pointer/keyboard/touch/loading/
disabled/focus/reduced-motion/transparency/forced-colors; real PHP navigation and
desktop tools; account and checkout; 15 delayed-product first-paint cases;
24 no-dock product configurations; product/skeleton geometry; dock cancellation
and lifecycle; cart race/sync and search contracts. The browser was Chromium
134.0.6998.35 through a local runner override, not the package's default browser.

Current source/provenance, deterministic build and 24 package tests pass.
The conservative all-route CSS/JS/SVG union grows by **3,516 gzip bytes** including
the separately inlined back arrow, below 15,000 bytes. Bundled source files are
excluded to avoid double counting. This is not a live transfer/INP/LCP measurement.

New acceptance: `node tests/framework7-ui-browser.cjs` checks nine widths and
captures actual PHP/header/home, search, cart, account and product at 390/1280px.
Run the same script from the unchanged baseline checkout with `UI_BASELINE=1`
for comparison. Existing tests' visual expectations change only where intentional
(tint, radius, icon box, light edge, timing); functional assertions remain.

The new nine-width Chromium acceptance and baseline capture runs now pass, as do
catalog/header parity and the complete product-sheet regression. Paired mobile
home, search, cart and product captures were generated and visually reviewed. The initial translucent tonal CTA lost contrast over the
dark hero; the shared tonal fill is now opaque #ededed (pressed #dedede), with a
regression assertion on the actual hero control.
Final three-engine [0.1.197 acceptance CI](https://github.com/muhammetdkaya/codela-storefront/actions/runs/41825158082) passed in Chromium, WebKit and Firefox. [Chromium/WebKit showcase CI](https://github.com/muhammetdkaya/codela-storefront/actions/runs/41825165090) and earlier [full theme CI](https://github.com/muhammetdkaya/codela-storefront/actions/runs/41824254347) on identical production UI passed. Generic tests on the version-only 0.1.197 candidate are tracked at [Actions 41825164822](https://github.com/muhammetdkaya/codela-storefront/actions/runs/41825164822). The WebKit stuck pressed thumb was corrected via scoped instant pressed-layer paint; source and deterministic joined CSS match. Release-only PHP/package CI passed separately. Five-repeat live performance traces, complete physical contrast/zoom, iPhone Safari and real WordPress/Woo checkout remain independent acceptance work and are not claimed completed. This is a tested GitHub-only artifact, not a live-site acceptance.

The dedicated `Shared UI adoption (no deployment)` workflow runs on the work
branch and uploads evidence. It does not deploy. Merge and GitHub-only release were completed; this workflow did not deploy.
