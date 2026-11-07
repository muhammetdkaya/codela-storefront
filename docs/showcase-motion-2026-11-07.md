# Showcase motion acceptance, 7 November 2026

## Scope and cause

AZ Seramik's live 0.1.228 homepage has five hero slides. The counter stayed at `01 / 05` while idle and after a real desktop mouse drag. Current `main` was verified at `8a95f7c48486cb682bd86aeb584a9a12f930782a`. The adapter prepared neighboring media on pointer-down but had no mouse-drag implementation and no autoplay timer. Earlier no-autoplay behavior is superseded only for hero sections by this request.

## Implementation

- Hero-only six-second idle timer advances the existing native scrollport and wraps without clones or another carousel engine. Promo/category and product galleries do not rotate automatically.
- Shared UI Kit pause/start button with Turkish translations, a 44px target, keyboard access and silent automatic counter updates. Keyboard focus inside slide content stops rotation until explicitly restarted. Hover, hidden document, offscreen gallery and drag suspend the timer. Reduced-motion starts paused and preference changes stop motion; an explicit start remains possible with instant transitions.
- Primary left-button mouse drag follows the original scrollport, locks only after horizontal intent, temporarily disables snap and settles one slide on release. Short drags and cancellation return to the original slide. A drag cannot activate its CTA, while ordinary and keyboard clicks survive. Native touch and wheel remain browser-owned.
- Timers, document/window listeners, observer and pointer capture are disposed on route replacement. Images, responsive sources, focal points, caption height and Woo ownership remain unchanged.

## Passed locally

- `tests/showcase-motion.cjs`: automatic advance/wrap; hover, focus, explicit restart, hidden/offscreen, reduced-motion; LTR/RTL mouse drag, short drag/cancel/click, native touch exclusion; repeated initialization and cleanup. Original main fails this test at the missing autoplay timer.
- `tests/showcase-motion-browser.cjs` in Chromium 151: real mouse image drag both ways, short drag, CTA drag/click distinction, automatic three-slide cycle, hover pause/resume, manual pause, keyboard start/navigation, changed and initial reduced-motion, removal cleanup, and 320/390/700/1280 layout/44px target/CTA clearance. Screenshots inspected at 390 and 1280.
- Existing `homepage-browser.cjs`, `showcase-viewport-browser.cjs` (107 scenarios) and `native-showcase-browser.cjs` in Chromium, including native mobile touch, first wheel/Shift/reverse routing, media geometry, no-JS/single-slide, gallery isolation, silent count and router replacement.
- PHP section renderer and syntax; UI Kit; caption and native lifecycle contracts; generated asset consistency; 24 package tests and three build-asset tests. Package test deployment log text comes from mocked offline tests, not a real deployment.

## Pending and publication boundary

The original candidate was 0.1.228. The test branch now includes the independently released 0.1.229 from main `c3b1207`, preserving all concurrent account/login changes; this slider task does not create a release. Source test branch and draft PR only are authorized. No main merge, tag/release, stable-feed publication, FTP, cache purge, live content/settings change or AZ theme installation was performed. The live site still needs an authorized theme update before this fix can take effect.

Chromium and WebKit showcase CI passed on the original candidate `a5c966e` (run 42377612640), as did quick-login security/browser checks (42377612667). General validation was cancelled before jobs started because a concurrent main run shares its global concurrency group. The reconciled candidate is being retested. Physical Safari/live installation remains a separate acceptance stage. New motion browser coverage is integrated into the existing no-deployment showcase workflow and isolated regression manifest. The initial desktop Chromium process could not launch in this executor; the official Chrome-for-Testing headless-shell runs correctly and was used for local acceptance. The available UI browser was used only to reproduce the live issue.

## Reconciled CI and baseline test repair

On `e880f184`, showcase motion/viewport Chromium and WebKit passed ([42378158840](https://github.com/muhammetdkaya/codela-storefront/actions/runs/42378158840)); quick-login/security passed ([42378158842](https://github.com/muhammetdkaya/codela-storefront/actions/runs/42378158842)). General validation/build passed, but its browser step stopped at `catalog-browser.cjs:131`, where a stale assertion expected a 24px cart glyph. Clean main `c3b1207` reproduces the identical 18-versus-24 failure. The catalog production CSS and this fixture are unchanged by the slider implementation. Commit `e46c8775` explicitly introduced the 18px glyph, 36px disc and retained 44px hit area. Only the outdated glyph expectation is corrected here; production catalog behavior is preserved. Full CI is being rerun. Deployment was skipped.

After correcting that first assertion, clean main also reproduces the next outdated check: direct product pages deliberately hide the empty Back/brand island, so its zero-width box cannot be compared to the Menu position. The current context-header regression explicitly requires that hidden island. The catalog fixture now verifies that exact direct-product condition while preserving Menu-before-brand ordering elsewhere and all shared 44px target/press/keyboard checks. No production catalog or header code is changed.

## Approved GitHub release candidate

All final implementation checks passed on `32e62acb`: full validation/navigation 42379052119, Chromium/WebKit showcase 42379052124, and quick-login/security 42379052118. Deployment was skipped. The user subsequently approved merging PR #122 and publishing a new GitHub theme release. The 0.1.230 candidate changes only the version, package assertions and release notes/documentation relative to that validated implementation. Its exact-head CI will be checked before merging. Release publication will explicitly use `publish_feed:false`, leaving stable-feed auto-update offers, FTP and AZ installation unchanged. Physical Safari and live installation acceptance remain outstanding.
