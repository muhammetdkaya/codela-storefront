# Storefront 0.1.193 — first-load performance

Scope: the standalone theme only, based on main `36b085ba8156daaa62d82803fa0cf1091b4e31a3` (0.1.192). No Codela plugin, Contact Form 7, WooCommerce transaction code, hosting configuration or live-site installation changes.

## Implementation

- Five always-loaded shared CSS sources become one `styles/storefront-base.css`, in their original cascade order. Two document-navigation styles become one `styles/document-navigation.css`. Page-specific product, checkout, account, gallery and section styles keep their existing conditions.
- The two synchronous head navigation scripts become one `scripts/document-navigation.js`. Merchant configuration still prints first; `pagereveal` is still registered before paint. No deferred listener, new router, dependency or duplicate cart state.
- Native WordPress dependency handles remain registered, including source-less aliases for extensions' inline CSS/JS. `SCRIPT_DEBUG` serves separate original sources. The Gallery block's early registration uses the same public bundle; the editor loads only its tokens and gallery styles.
- Horizontal offscreen images no longer promote when they merely touch a clipping boundary. A positive intersection and a vertical-only 200px preload margin preserve scrolling readiness. Existing swipe/keyboard intent, responsive picture selection, no-script fallback and printing remain available.
- Product sections request full native posts so WordPress primes post/meta/term caches before individual Woo product reads, then batch-prime thumbnails with `update_post_thumbnail_cache()`. Request-local memoization retains only IDs; price, visibility and stock remain native and are rechecked. No persistent personalized HTML cache.
- Section variant JSON is read and validated once per PHP request instead of repeatedly during block validation/rendering.
- `python3 scripts/build-assets.py` deterministically regenerates the three committed bundles. Packaging rejects stale outputs. CSS relative URLs retain their original base; moving a relative URL across directories fails the build rather than silently breaking it.

## Measured replay

Public AZ Seramik homepage HTML and same-origin resources were captured on 1 November 2026, then served by an isolated local HTTP fixture. No live cart, login or order submissions occurred. Original and candidate use the same content, third-party assets and compression. Chromium 153; 150ms latency, 1.6 Mbps download, 4× CPU throttle; fresh context per run; 390×844 at DPR 3, and 1280×844 at DPR 1. Mobile order alternated across three samples per version; desktop has one sample per version.

| Metric | 0.1.192 | 0.1.193 candidate |
|---|---:|---:|
| Mobile subresource requests | 53 | 46 |
| Mobile transfer, including HTML | 713,331 bytes | 588,837 bytes |
| Desktop subresource requests | 54 | 47 |
| Desktop transfer, including HTML | 566,117 bytes | 441,623 bytes |
| Mobile median LCP | 1,680ms | 1,572ms |
| Mobile LCP samples | 1,840 / 1,596 / 1,680ms | 1,556 / 1,652 / 1,572ms |
| Desktop LCP (one sample) | 1,540ms | 1,512ms |
| Layout shift score | 0 | 0 |

The deterministic reduction is five CSS requests, one head JS request and one hidden slide image: approximately 124KB / 17.5% less initial mobile transfer. Gzipped critical bundles alone fall from 29,814 to 26,855 bytes. Timing samples are small local lab observations, not a guaranteed live speed percentage. Both viewport screenshots are pixel-identical; measured header, dock, hero, caption and section geometry/typography/surface styles are equal. No missing replay resources or runtime exceptions.

The capture and screenshots remain outside the GitHub source; `tools/first-load-replay.cjs` accepts an explicitly supplied `SF_REPLAY_DIR` and native WordPress core fixture directory. It does not run against a hard-coded live store or submit commerce actions.

## Verification and limits

- Actual WordPress 6.5 dependency/printing classes: eight contexts × debug/production; handle order, inline styles, early configuration, script alias output, editor isolation and conditional assets passed.
- Chromium: horizontal image isolation, keyboard/swipe, responsive/no-JS/print, homepage variants and spacing, real PHP navigation and checkout fixtures, native cross-document navigation and destination skeleton regression passed.
- Old media-loading source fails the new hidden-slide network test by requesting slide 2 before interaction; the candidate passes.
- PHP lint and relevant catalog/homepage/preview/media/product-media/navigation suites, cart race/synchronization, UI Kit, 24 package tests and three deterministic asset tests passed locally.
- The old homepage fixture expected a 12px first-category gap despite the already released 0.1.191 40px spacing. Only that stale expectation was updated; current spacing CSS is unchanged.
- [Focused CI 41327370251](https://github.com/muhammetdkaya/codela-storefront/actions/runs/41327370251) passed on exact candidate `f5ae5c7d66160d3447128d9e58e4d013749c1111`: Chromium and WebKit media/homepage/product-no-dock suites, Chromium navigation/checkout/native continuity, native WordPress asset dependencies and deterministic source/package checks. This does not assert full live WordPress/Woo integration, physical Safari acceptance or a measured server SQL/wall-time improvement.

Earlier public requests showed cache-miss HTML response waits of approximately 2.7–4.5s and warm repeats around 0.4–0.5s after connection establishment. The isolated replay excludes that origin generation time. The theme now avoids unnecessary PHP work, but the remaining live first-response delay must be remeasured after manual installation; these results do not claim it is eliminated.

Next: publish the validated candidate as GitHub-only 0.1.193, then remeasure the manually updated AZ Seramik homepage and native product/cart/account flow.
