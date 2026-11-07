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
