# Codela Storefront UI Kit — source of truth

**Status:** Current shared architecture; theme source 0.1.58. Dated release notes below are historical. Use this before making any new
Header, dock, cart, search, account-login or storefront screen.

## One design, not one enormous universal widget

There are three distinct layers:

1. **Tokens** (`assets/styles/tokens.css`): semantic colour, spacing/hit targets, icons,
   radii, motion/easing. Theme-specific `--sf-ui-*` variables compose with the
   existing theme palette and the existing Codela appearance integration.
2. **Primitives** (`inc/ui.php` and `assets/styles/components.css`): one HTML
   contract, accessibility contract and pressed/focus/disabled presentation.
3. **Features** (`inc/render.php`, `assets/storefront.js`, `assets/storefront.css`):
   page layout and domain behavior only. Menu and cart API calls, tab selection,
   modal lifecycle and storefront routing belong here, not in a generic Button.

Dependencies load in this order: tokens → storefront layout → overlay → navigation →
shared components → guest account CSS (only on the My Account page).
Shared component styles take precedence over transitional page rules. The
account stylesheet is always scoped to guests or the vanilla Woo fallback;
Codela's authenticated account remains plugin-owned.

## Current primitives and contracts

| Primitive | Use | States | Semantics |
|---|---|---|---|
| `codela_sf_ui_icon_button()` | Header Menu/Ara/Sepet/Hesabım, popup X, search clear | bare/soft/clear, pressed, focus, disabled | `<a>` for links; `<button type=button>` for actions |
| `codela_sf_ui_button()` | Any primary/secondary/quiet action or link | pressed, focus, disabled, loading | Real `<button>` or `<a>`; type submit/button/reset |
| `codela_sf_ui_primary_link()` | Existing checkout / hero discovery | pressed, keyboard focus | Compatibility wrapper around the Button component |
| `.sf-ui-pressable` | Quantity +/−, cart removal, retry, submenu toggle | pressed/disabled/focus | Applied to existing semantic buttons |
| `.sf-ui-nav-tab` | Floating gesture-enabled mobile navigation | selected, pressing, scrubbing, collapsed | Existing `Navigation Controller` owns touch and page routing |

Rules: don't attach global `button` or `.woocommerce button` rules to the kit.
Never duplicate a semantic control's animation, icon size or hitbox in page CSS.
Feature-specific overrides must be strictly about layout or genuinely different
behavior. Add a documented variant when necessary, with a regression test.

The currently *intentional* distinct interactions are: native dialog focus
and close; the mobile dock's touch-and-scrub preview, scroll hide/reveal and
selected capsule; form field input/selection; and disabled cart actions.
Do not replace this entire specialized behavior with a generic tap animation.

## Reuse examples

```php
echo codela_sf_ui_icon_button(
    'x',
    __( 'Close', 'codela-storefront' ),
    [
        'variant' => 'soft',
        'class' => 'sf-close',
        'attributes' => [ 'data-wp-on--click' => 'actions.close' ],
    ]
);
echo codela_sf_ui_primary_link(
    wc_get_checkout_url(),
    __( 'Checkout', 'codela-storefront' )
);
echo codela_sf_ui_button(
    __( 'Save', 'codela-storefront' ),
    [ 'variant' => 'primary', 'type' => 'submit' ]
);
echo codela_sf_ui_button(
    __( 'Cancel', 'codela-storefront' ),
    [ 'variant' => 'secondary', 'disabled' => true ]
);
echo codela_sf_ui_button(
    __( 'Continue', 'codela-storefront' ),
    [ 'variant' => 'quiet', 'loading' => true ]
);
```

Allowed icon controls `bare` (default), `soft` (filled circular),
`clear` (small circular indicator). The icon is rendered by the existing
allowlisted `codela_sf_icon()`, accessible names are mandatory, attributes
are allowlisted and escaped and URLs pass through `esc_url()`.
The extra HTML argument is *internal trusted decoration only* (e.g. cart badge)
and must not contain user-generated markup.

The Button primitive accepts `href`, `type`, `variant`, `icon`,
`icon_position`, `class`, `attributes`, `disabled`, `loading`.
It sanitizes CSS classes, escapes content/attributes/URLs, disables real
buttons and makes a disabled link non-navigable. Loading sets `aria-busy`
and uses a CSS indicator that honours reduced motion.

No fake clicks: `<button>` for actions, `<a>` for navigation. Prefer
CSS `:active` for ordinary press feedback. No individual listener is needed
for normal buttons. The dock is a gesture controller, not an icon button.

## Theme vs plugin ownership

The theme owns Header, mobile dock, fullscreen Menu/Search/Cart overlays, guest
login presentation and the theme's storefront controls. The **Codela plugin**
owns the signed-in My Account dashboard, orders, addresses, shipments and
its module UI. Do not add `sf-ui-*` to Codela plugin content; do not rewrite
the Codela account using the theme's UI Kit. Plugin tokens
(`--cdl-ct-radius`, `--cdl-sf-*`) are integration inputs only where intended,
not a reason for global CSS overrides.

## Design tokens

Edit the tokens, not copied values in individual pages:

- `--sf-ui-hit` = 44px; icon size `--sf-ui-icon` = 22px
- `--sf-ui-icon-close` = 19px; clear glyph = 12px
- `--sf-ui-motion-press` = 140ms
- `--sf-ui-motion-selection` = 220ms
- `--sf-ui-motion-dock` = 480ms
- `--sf-ui-action-height` = 54px; corner radius honours `--cdl-ct-radius`
- `prefers-reduced-motion` disables component transitions

Do not equate pressed, selected, focused, loading and disabled states.
Each is independently verifiable; animations must not be required for
functionality or keyboard accessibility.

## Shared control feedback and material (0.1.52)

- Whole Button/pressable expands to 1.025; IconButton to 1.08. Engage is
  110ms; release is 360ms with a small elastic settling curve. Native `:active`
  drives ordinary controls; the browser owns touch activation timing. There
  is no delayed click, synthetic activation, timer or new event listener.
- Only transform transitions. Static gradients, inset light and 6px backdrop
  blur provide depth; blur, filter and shadow are not animated. Dark actions
  keep a 90% ink tint for readable white text; secondary controls keep 78%
  surface tint. Floating header and dock surfaces use the shared 22% light tint.
  Shared static contrast/brightness filters diffuse dark sampled content so
  the dark foreground retains contrast without an opaque white fill.
- Keep 44px IconButton and 54px default action hit/layout dimensions. Motion
  does not affect document flow. Existing compact size tokens remain valid.
- Reduced motion turns expansion off. Reduced transparency and unsupported
  backdrop filtering use opaque surfaces; forced colors keep native system
  colors. Disabled/busy controls cannot expand. Native Woo submit semantics
  and spinner pseudo-elements are preserved.
- Dock gesture/selected capsule and Menu/X glyph transformation remain owned
  by their existing controllers. No page-specific button animation or vendor
  names in source identifiers. F5 must extend these adapters, not duplicate them.
- Research references: [material interaction](https://developer.apple.com/videos/play/wwdc2025/219/)
  and [control scale/bounce](https://developer.apple.com/videos/play/wwdc2025/284/).
  This is a restrained web interpretation, not an implementation of native physics.
- `tests/ui-kit-browser.cjs` exercises real pointer, keyboard and touch
  activation, layout stability, settling, focus and accessibility preferences.
  Physical-device Safari feel and F6 cold/warm/GPU measurements remain open;
  CSS-only does not imply zero rendering cost.

## Floating surface correction (0.1.53)

- The physical-device screenshot exposed that 72% Header tint, 76% Dock tint
  and strong blur hid the backdrop too much. Header/soft IconButton and Dock
  now share the material in `components.css`; remove page-owned material copies.
- The whole Dock scales to 1.018 from its existing `is-pressing` state.
  CSS `scale` has independent engage/release timing; its collapse `transform`,
  stable parent hit slots, selected capsule and controller remain intact.
  Reduced motion sets the whole-dock scale to 1; opaque transparency and
  forced-color fallbacks apply to Dock through the same surface primitive.
- Browser navigation tests verify whole-surface expansion and cancellation
  as well as existing selection/scrub/collapse. Private CI references include
  actual Header/Dock over text and colors (`storefront-ui-kit-glass-*.png`),
  because a white background alone cannot demonstrate translucency.
- No new runtime script, listener, request or library. Physical Safari visual
  acceptance and measured rendering cost remain to be checked.

## Reference edge refinement (0.1.54)

- User references and the actual device screenshot showed the solid white
  perimeter and broad shadow made the floating controls look outlined.
  The shared glass border is now transparent (layout footprint unchanged).
  A half-pixel top/bottom light edge and a weaker diffuse shadow provide depth.
- Header, soft IconButton and Dock consume the same tokens. Do not add
  per-page border/shadow overrides. Keep form-secondary borders, keyboard
  focus outlines and forced-colors accessibility boundaries independent.
- Existing translucency, backdrop, press/release and dock gestures remain.
  UI/navigation browser checks verify the floating perimeter is transparent;
  private text/color backdrop references support visual review.

## Accepted material readability (0.1.55)

- User accepted the borderless appearance; preserve that design. Current
  shared floating material uses 28% tint and 8px static blur, slightly
  separating foreground from detailed images without making it opaque.
- `--sf-ui-glass-ink` is #1c1c1e. Dock labels use shared navigation typography
  tokens (11px, weight 600); all dock items inherit the same glass ink.
  Geometry, touch targets and gestures remain unchanged.
- Browser checks verify label size, weight, color and available slot width;
  private references place real fixed controls over text/color backgrounds.
  Test physical-device readability separately from automated source checks.

## Continuous Dock selection (0.1.56)

- Keep routing/gesture ownership in the one existing Dock controller. During
  scrubbing the capsule follows a fractional position across stable parent
  layout slots; icons do not move their hit targets. Preview/activation still
  chooses an actual item. Release settles to its center, including reselection.
- Direct finger tracking has no transform transition; taps, release and cancel
  use the existing selection transition. Opening/closing a popup remains instant.
- Reparenting into/out of a native modal resets CSS transitions. Carry the
  currently rendered capsule position in a temporary CSS variable, resolve it
  in the new layer, then remove that override next frame so CSS slides to the
  target. Cancel obsolete frame callbacks; reduced motion bypasses the carry.
- Browser regressions measure intermediate positions on modal open/return,
  continuous positions within the same item slot, release and cancellation;
  server-rendered initial selection must still appear directly with no hydration
  sweep. Existing gesture, ghost-click and scroll behavior stays authoritative.

## Cart composition (0.1.57)

- Cart list, feedback and summary inherit the dialog gutter. Item rows and
  summary content share a centered 780px maximum width; the checkout link
  participates in block layout so auto margins center it on wide screens.
- Keep quantity/removal controls at least 44px, aligned on one action row
  where space permits. Long names, variations and totals may wrap. An item
  without an image must not retain an empty thumbnail column.
- The list is the scroll container; the summary and existing dock clearance
  stay outside it. Keep shared Button/pressable paint and motion unchanged.
- Responsive browser coverage checks 320–1280px, long unbroken names,
  short-screen list scrolling and checkout/dock separation. Real Woo
  integration and physical-device acceptance remain separate gates.

## Cart image and light backdrop refinement (0.1.58)

- The cart image link stretches to the detail column height. Its image fills
  that box using contain, preserving the entire product and its aspect ratio.
  Shared neutral surface fills any letterboxing. Avoid a fixed image ratio
  that becomes shorter than quantity controls or long product content.
- Floating glass retains 28% tint and 8px blur. Brightness is 1.5 so sampled
  white remains white; stronger top light, lower edge and diffuse shadow
  separate the surface on white. Border remains transparent.
- Apply material changes through shared tokens, never cart/header/dock copies.
  Keep reduced-transparency/forced-color and motion behavior unchanged.
  Private visual references now include plain white and text/color backdrops.

## Contribution checklist

1. Locate an existing primitive *before* writing HTML/CSS/JS.
2. If it's the same behavior with different content, reuse the primitive.
3. If genuinely different appearance is needed, introduce a named variant
   centrally, with normal/pressed/focus/disabled coverage.
4. Keep public Codela account UI and plugin modules untouched.
5. Run PHP lint, `node tests/ui-kit.cjs`, search/cart/dock regressions, 15+
   Python package checks, Chromium navigation/login layouts.
6. Increment theme + CSS/JS versions, commit to this repo, confirm **both**
   GitHub Actions `validate` and `deploy` success before claiming live.
7. Manual mobile browser acceptance is separate from CI. Test dock touch,
   scroll animations, focus and safe area on device.

## Current follow-up (12 October 2026)

- Controller extraction and private CI UI Kit previews are already implemented; do not repeat them.
- F5: move the remaining generic Woo button paint into scoped shared adapters, preserving the parallel Button/IconButton work and plugin account ownership.
- F3 synchronization source was deployed in 0.1.51; real WP/Woo acceptance remains open (F3/F4).
- F6: measure cold/warm and interaction performance before changing asset loading or blur.
- Current state and deployment evidence live in AGENTS.md and docs/storefront-theme.md; dated notes below preserve prior decisions.

## Feature stylesheet isolation (0.1.25)

Overlay toolbar, close-focus, search input, product results and placeholder rows are maintained in `assets/styles/overlay.css`. The new load order is tokens → layout → overlay → navigation → shared controls → conditional account. UI behavior, popup routing and all legacy selectors remain unchanged; avoid introducing duplicate layout rules into the core sheet. No platform-specific product name belongs in new filenames, functions, classes, tests or comments: use technical behavior descriptions such as touch navigation, hold gesture, scroll collapse, and safe area.


## Storefront 0.1.26 — shared JavaScript format module

- The reusable HTML escape, HTML decode, URL safety and currency formatting functions are extracted from the storefront main module into `assets/scripts/format.js`. The main ES module imports their named exports. Function behavior and Store API search/cart logic are deliberately unchanged.
- Relative module import is browser-native; WordPress registers the entry module as before and packages the referenced local file. The browser integration fixture inlines the actual helper module when injecting a test-only WordPress API stub; it does not maintain a second copy.
- `tests/format.cjs` asserts escaping, protocol rejection and currency formatting. PHP/theme/package tests and JavaScript syntax checks cover the new dependency.
- Source naming is intentionally device/vendor/OS-neutral. Continue extracting modal/search/cart controllers in later guarded versions; maintain a single navigation state and preserve registered WordPress action semantics.
- Validation/deployment must be verified after this source release; test automation is not physical-device acceptance.


## 0.1.27 — Search and cart controllers

The main `assets/storefront.js` module is now the single owner of dialog
routing, WordPress Interactivity actions, modal focus, floating navigation,
scroll position and panel transitions. Independent feature controllers are
instantiated once with explicit dependencies (query selector, config, labels,
active view, dialog):

- `assets/scripts/search-controller.js`: input/debounce/clear, stale-result
  invalidation via request sequence, abort, skeleton, endpoint data, empty/error
  messages. Public API: `bind()`, `cancel()`, `start()`, `retry()`.
- `assets/scripts/cart-controller.js`: Store API nonce handling, GET/POST,
  quantity and remove mutations, retry, active footer, subtotal and cart badges,
  external cart invalidation events. Public API: `bind()`, `getData()`,
  `refresh()`, `change()`, `invalidate()`.
- `assets/scripts/format.js`: the same shared escaping, safe URL, decoding and
  currency formatting used by both feature controllers.

Every controller is created once. No duplicate dialog, dock or event listener
is added. Pending searches are aborted when leaving search; repeated cart GET
requests coalesce; nonce refresh and the original Store API integration remain
unchanged. The browser fixture runs the actual module sources and the existing
end-to-end search/cart/nav checks. The signed-in account UI remains plugin-owned.

Platform-neutral identifiers are mandatory. Keep the modal/dock ownership
unified while considering future extraction of the overlay controller; never
create parallel stores or second navigation listeners.


## Storefront 0.1.28 — Single overlay controller extraction

- `assets/scripts/overlay-controller.js` is the **one** owner of the active modal name, native `<dialog>`, initial focus, panel transitions, admin toolbar offsets, document scroll lock and exact scroll/focus restoration. The only exported factory is `createOverlayController()`; it is instantiated **once** by the main entry module.
- The entry module continues to own **one** floating navigation element and touch/scrub/scroll listeners. The overlay accesses navigation using callbacks `mountDock`, `restoreDock`, `setDockCollapsed`, `markDockActive`, `mobileDock`. Search and cart controllers keep their separate request/nonce states and ask the overlay for its active view and dialog, without parallel state.
- The controller exposes `bind()`, `open()`, `close()`, `animateContent()`, `getCurrent()`, and `getDialog()`. Menu nesting remains in the entry module and is reset via `onMenuOpen`; native `cancel`, keyboard focus clearing, and viewport offset updates are installed once in `bind()`.
- Regression fixtures load the **actual** overlay module alongside format/search/cart modules; no separate browser-only implementation. Component names remain platform-neutral. Signed-in Codela account UI remains plugin-owned.
- This source change is **pending validation/deployment** until GitHub Actions confirms both stages; manual mobile acceptance remains a separate check. Next: make a controller-level lifecycle regression for open/switch/close/focus if needed, then consider isolating navigation gestures while preserving one DOM element and event installation.


## 0.1.28 release verified — 11 October 2026

- Implementation: [441fdb5](https://github.com/muhammetdkaya/codela-storefront/commit/441fdb5dda012535781969ddd665e3512bc51c10); test-only contract corrections: [2b67742](https://github.com/muhammetdkaya/codela-storefront/commit/2b677425c7a5d34299fc271819d5219f663d65d5), [448d8fe](https://github.com/muhammetdkaya/codela-storefront/commit/448d8fe0763b2e61311e0d0bf28439e2ab26b325).
- [GitHub Actions 38151165256](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38151165256) finished with **validate success and standalone FTPS deploy success**. Native panel open/switch/close, focus restoration, dock touch/scroll/navigation, cart and search requests, compact UI rendering and account ownership passed the existing tests.
- `assets/scripts/overlay-controller.js` is the single owner of modal name and dialog lifecycle; `assets/storefront.js` keeps one dock node and one navigation gesture handler. The search/cart controllers remain independent; signed-in customer account remains owned by the Codela plugin. No platform-specific UI identity was introduced.
- Real mobile device acceptance of scroll/focus/touch remains pending; passing automated browser tests does not prove a physical device test. Next controlled task, if needed: isolate the dock gesture controller under an explicit lifecycle contract while preserving the single DOM node and current behavior, or expand controller-level tests before further changes.


## 0.1.29 — Mobile dock controller isolated (11 October 2026)

- Implementation commit [ff74ca8](https://github.com/muhammetdkaya/codela-storefront/commit/ff74ca82061ca18d3096bb23ae0093be5d1e5460); [GitHub Actions 38152743058](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38152743058) completed **validate success and independent Storefront deploy success**.
- `assets/scripts/dock-controller.js` now exclusively owns the **single existing** `.sf-mobile-dock` DOM element, dialog mount/restore, tab active indicator, scroll collapse/reveal, 240ms long-press, touch/pointer scrubbing, release navigation and ghost-click suppression. Its `init(dialog)` is idempotent; no duplicate listeners. Public methods: `init`, `mobileDock`, `setDockCollapsed`, `mountDock`, `restoreDock`, `markDockActive`, and shared `dockScrollPositions`.
- `assets/storefront.js` is the composition root for the one WP Interactivity store, search, cart, overlay and dock. The dock receives only callbacks to the overlay (`getDialog`, `getCurrent`, `open`); the overlay receives dock methods. There is no second active panel state and no duplicated navigation DOM. Main entry shrank from 15,005 to 5,263 bytes.
- `tests/dock-gesture.cjs` exercises the real extracted module and asserts one-time listener installation; the browser fixture uses the real dock, overlay, search and cart modules. `tests/package.py` validates the new module boundaries. No Codela plugin files changed.
- Automated tests are not physical iPhone/Safari acceptance. **Next:** verify on a real iPhone: home→search→cart switching, hold-and-scrub across tabs, down/up scroll collapse, reveal handle, keyboard focus, safe-area and checkout CTA. Fix only evidenced regressions, and keep design system/module ownership documented here.


## Storefront 0.1.30 — separated header surfaces and shared controls (11 October 2026)

- Header menu now uses the **same `sf-ui-icon-button--soft` variant** as both panel close controls; formerly the header was `bare` while X was `soft`. Both inherit the 44px hit target, 999px radius, press scaling, keyboard focus and reduced-motion contract from `assets/styles/components.css` and `assets/styles/tokens.css`.
- `assets/styles/navigation.css` composes three independent soft header surfaces: brand/logo pill, menu circle and (when dock is disabled or on desktop) one grouped search/cart/account tools pill. The full header bar is transparent, without the old divider. Surface, border and shadow use shared `--sf-ui-header-*` tokens, with blur fallback and reduced-transparency handling.
- Mobile dock enabled: preserve approved brand-left/menu-right order, with the menu/X hit target at the same coordinates; dock disabled: menu-left/brand-center/tools-right. Desktop retains centered brand. No new icon implementations or duplicated JavaScript handlers. The Codela plugin is untouched.
- Regression coverage: `tests/ui-kit.cjs` validates the common soft variant and surface tokens; `tests/navigation-browser.cjs` validates geometry, brand/menu shared surface, 44px hit target, transparent shell and pre-existing menu/X alignment across widths.
- Reference image is a visual direction rather than a dark-mode mandate: storefront uses its own light theme palette. Physical mobile-device review remains pending.


## Storefront 0.1.31 — Shared floating header surfaces (11 October 2026)

- The user reference calls for **separate** logo and menu surfaces rather than one filled header strip. Brand and optional desktop tool group use the `sf-ui-surface` primitive. Menu and dialog X use the **same** `sf-ui-icon-button--soft` variant: shared 44px hit target, 22px icon, pill radius, translucent graphite surface, white icon, elevation, press transform, keyboard focus and reduced-motion/transparency fallback. Search clear remains the intentional smaller `clear` variant.
- Source of truth: `assets/styles/tokens.css` owns glass color/border/shadow and control metrics; `assets/styles/components.css` owns shared paint and interaction; `assets/styles/navigation.css` owns **only header layout**, not separate menu paint. `assets/styles/overlay.css` must not reset common button chrome. Preserve custom logo visibility and high-contrast white brand text.
- Mobile with bottom navigation enabled retains logo left/menu right; desktop and bottom-navigation-disabled mobile retain their established layouts. No redundant header cart/search icons were introduced when the bottom dock is active. The reference screenshot is a visual inspiration, not a request to copy unrelated controls.
- Automated tests include comparing menu/X computed background, border radius, icon size and elevation across 320/390/700/1024px, UI Kit rendering, and existing navigation/overlay regressions. [Actions 38154258333](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38154258333): **validate success / standalone deploy success**. Implementation [eb83ea4](https://github.com/muhammetdkaya/codela-storefront/commit/eb83ea43ead07a0270956bb504addd5cc9d19e63), follow-up CSS/test fixes [2057f87](https://github.com/muhammetdkaya/codela-storefront/commit/2057f878735eeff4c933f4180cfc3e765b063e47), [6390cae](https://github.com/muhammetdkaya/codela-storefront/commit/6390cae3c950975d3e536fcdb39e66394c4198c7), [9dd80f1](https://github.com/muhammetdkaya/codela-storefront/commit/9dd80f1bb753348f5dc58ad348b77bfe02fba82a).
- Physical mobile browser acceptance remains pending. Future work: do not reintroduce per-page button styles; extend shared variants/tokens only when there is a real semantic distinction.


## Storefront 0.1.32 — fixed light header (11 October 2026)

- User request: home product hero reaches the top behind a fixed header; logo is vertically centered; logo/menu/X use light surfaces. This supersedes the 0.1.31 dark surface decision.
- Shared glass tokens now provide light translucent surfaces and dark controls. Custom logo colors are preserved; block image and centered flex link remove baseline misalignment. Header stays fixed during scrolling; its transparent empty area does not block content interaction.
- Home hero has no header spacer; text-led pages retain 76px/68px clearance. Existing overlay controller synchronizes fixed header position with visible WordPress toolbar height. Dock and plugin-owned account remain unchanged.
- Validation/deployment pending. Next: verify CI and independent deployment, then physical mobile acceptance of hero, logo alignment and fixed header.

## Storefront 0.1.33 — compact dock and menu motion (11 October 2026)

- Dock surface reduced by 6px, with 48px tab targets (above the 44px minimum); icon and label sizes unchanged. Shared menu glyph is a clean two-line 1.8px stroke.
- Menu opens with a 220ms surface fade and 260ms vertical content reveal; closes with a 180ms fade/lift before restoring scroll and focus. The dialog is never transformed. Reopening cancels pending closure; reduced-motion closes immediately. Search/cart behavior is unchanged.
- Validation and deployment pending. Next: confirm CI/FTPS release, then physical-device acceptance of compact dock and menu open/close.

## Storefront 0.1.34 — icon cache invalidation (11 October 2026)

- User still saw the old menu glyph after 0.1.33. SVG source was updated, but shared icon URLs lacked a cache version. Shared renderer now appends a content-derived CRC32 fingerprint, cached per icon within the request. All theme icons refresh when their bytes change; no manual browser cache clearing should be needed after fresh HTML loads.
- Browser fixture resolves the URL pathname separately from its query. UI Kit contract checks the fingerprint and two-line menu asset.
- Verified: [Actions 38156858978](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38156858978) validate and standalone deploy succeeded for `d9a3f2aecd09269abf36a9528c8f68d24c139031`. Initial validation caught a fingerprint path error, corrected before deployment. Next: confirm user's visible two-line menu after a fresh page load.

## Storefront 0.1.35 — single-position Menu/X (11 October 2026)

- The same real header menu IconButton is reparented to the native dialog's top layer at its measured viewport x/y. Menu uses two animated CSS strokes rotating to X (280ms); closing rotates back. Its previous duplicate close X is hidden only for Menu, while Search/Cart keep their controls.
- The header button is restored before focus returns; aria-expanded and accessible label track the actual state. Reduced-motion skips the transition. Styles still belong to shared navigation/UI Kit, not copied per page.
- Browser regression checks 320/390/700/1024px, DOM-node identity, the same x/y, reverse click, reopen and reduced motion. GitHub validation/deployment and real-device acceptance are separate milestones.

## Storefront 0.1.36 — current-page dock actions dismiss overlays (11 October 2026)

- Home and Account are document links; Search and Cart are overlays. If the current document already matches the tapped Home or Account tab (`aria-current="page"` from WordPress, including account subpages), dismiss the open overlay without navigation/reload. Reselecting the same tab without an overlay is a no-op; selecting a different page keeps full navigation.
- `dock-controller.js` owns both native click and hold/scrub release routing; it calls the existing overlay `close()` through an injected callback, never installs a second overlay listener or state. Existing scroll restoration, focus restoration, selected indicator, rapid Search/Cart switches and dock ghost-click handling are preserved.
- Tests: native tap, current-page reselect, swipe to Home, Home/Search and Home/Cart, Account subpage/Search and Account subpage/Cart, selected tab and same-document markers. Theme + JS/CSS versions 0.1.36. Validate, FTPS deploy and physical-device acceptance must be confirmed independently.

## Storefront 0.1.37 — compact logo and steady scroll navigation (11 October 2026)

- Fixed header logo pill horizontal padding reduced **18px → 8px** (mobile dock disabled: **10px → 7px**). The shared floating glass surface, custom logo colour, vertical centering, 44px minimum control height, menu/X position and responsive header layouts remain intact.
- Dock scroll state now needs **44px downward** or **28px upward** cumulative travel and at least **650ms between hide/reveal transitions**. If the rest interval has not elapsed, one deferred change is scheduled and genuine reverse movement (12px) cancels it. Scroll jitter does not continuously bounce the bar. When near the top, opening a panel, touching reveal handle or starting a dock gesture, pending changes are cancelled; keyboard/safe-area/scroll restoration remain unchanged.
- Only `dock-controller.js` owns the scroll state; no separate navigation listeners, page changes or reimplementation of the shared 480ms CSS motion. Node and rendered-browser tests cover dwell, cumulative scroll, reversals, stable top position and compact brand. Theme/CSS/JS versions raised to 0.1.37. GitHub Actions validation and independent Storefront deploy must be verified; real physical touch acceptance remains separate.

## Storefront 0.1.38 — guest sign-in composed from shared UI Kit (11 October 2026)

- Redesigned ONLY guest My Account login, optional Woo registration and native password reset presentation in `assets/styles/account.css`: centered, restrained layout, light outlined inputs/cards, mobile stacking, no heavy shadows or duplicated brand header. Woo renders and processes the original login/register/password reset forms: nonces, validation, redirects, hooks and third-party social-login inserts are left intact. Registration appears only if the existing Woo setting permits it; no fabricated social login buttons or custom auth endpoints.
- Reuse the **existing** semantic `sf-ui-button` primary control, including shared `--sf-ui-action-height`, `--sf-ui-control-radius`, color, pressed/disabled/reduced-motion rules. `assets/styles/components.css` targets native Woo guest submit buttons as an adapter to that same Button primitive: **no page-specific button appearance/hover/active design**. Existing Woo inputs use the existing UI Kit tokens and their existing markup. Account CSS only owns field placement, surface and responsive layout.
- `body.woocommerce-account:not(.logged-in):not(.codela-my-account-layout)` tightly scopes guest adapters. All logged-in Codela account/dashboard/navigation/orders remain plugin-owned; original vanilla Woo signed-in fallback is preserved. No Codela plugin code or core WooCommerce template override.
- Browser regression extends guest login and registration at 390/1280px, computed UI Kit Button style parity, mobile field sizes, no autofocus, registration layout, and absence of theme styles in the authenticated Codela dashboard. 0.1.38 theme/assets/cache versions. Verify Actions validation + independent FTPS deploy and inspect real mobile before user acceptance.

## Storefront 0.1.39 — reference-based LIGHT login page (11 October 2026)

- User's dark auth screenshot is a **layout reference**, not permission to use dark/orange/tan surfaces. Implemented the actual theme, never generated an image: neutral white/gray UI, black/charcoal shared primary Button, gray input fills, dark neutral text, no orange-like accent. Guest-only CSS variables override store accent locally; store design elsewhere remains unchanged.
- Guest account gets dedicated lightweight header from `inc/render.php`: live custom logo/brand at left, `Back to store` link at right, thin bottom divider. Standard header/menu, search/cart dialogs and mobile dock do not render on guest account pages. Logged-in user uses the original header and Codela-owned account.
- Native WooCommerce login/register/reset forms retain all real server functionality, nonce and hook slots. The intro reads "My account / Manage your orders and account details." Existing common `sf-ui-button` serves submit, while existing navigation/press classes serve segmented Log in/Register tabs. `auth.js` adds accessible tabs only when both native forms exist, with click/keyboard support; otherwise no tab. Without JS both forms remain available. No fake Apple/Google authentication: extension UI can render only when correctly configured by its actual integration.
- Updated `tr_TR.l10n.php` for the new English translation keys. Tests cover the dedicated guest header, no dock, neutral palette, native Woo forms, responsive layout, tabs and logged-in plugin isolation. 0.1.39 script/style package versions. Verify GitHub Actions validation, standalone Storefront FTPS deploy and real-device acceptance separately.

## Storefront 0.1.41 — no-plugin Google customer login (11 October 2026)

- Single theme-owned `inc/google-auth.php` module, no extra WP plugin, no Google SDK, no page-wide Google JavaScript. Only guest WooCommerce My Account page, once fully configured over HTTPS, shows **Google ile devam et** beneath a neutral “veya” divider; reuses the shared `sf-ui-button--secondary` component. No Apple option.
- Authentication: Google's OAuth 2.0 authorization-code flow + S256 PKCE, cryptographically random browser-bound state (`HttpOnly; Secure; SameSite=Lax` cookie + single-use 10-min server transient), Google's fixed TLS token exchange and UserInfo endpoints (email_verified + immutable sub). No refresh/access tokens persisted. Fail closed on network/configuration errors. Never send the client secret to browsers or GitHub.
- WooCommerce customer account only: resolve by stored provider `sub`; create customer if new; existing customer Gmail/Google-hosted mail may be bound if unbound, but **do not automatically link third-party, externally hosted emails** based only on Google's old verification. Deny admin, editor, shop manager and conflicting identities; use existing WP auth cookie, existing WooCommerce orders and Codela plugin-owned logged-in account.
- Setup under **Appearance → Google login** (WordPress admin): Google Cloud OAuth **Web application** Client ID and Client secret, exact callback URI shown in page. Credentials also support optional `CODELA_SF_GOOGLE_CLIENT_ID` / `CODELA_SF_GOOGLE_CLIENT_SECRET` constants in wp-config. Without credentials or site HTTPS, the button is omitted. OAuth user must register the site's authorized domain/redirect URI and publish Google consent screen as applicable. Do not paste secret into conversations or commit to repo. **Feature is coded but not live-operational until the site's actual Google credentials are entered.**
- PHP/Node security regression tests for verified user identity, existing links, customer isolation and no fake-button fallback; Google client not contacted except real initiation. CI validate and independent Storefront FTPS deploy still need to be verified, and Google end-to-end login will only be verifiable once credentials are configured.

## Storefront 0.1.42 — guest Account uses existing full-screen overlay (11 October 2026)

- The **one native Storefront dialog** now has a fourth view: `account`, alongside Menu, Search, and Cart. On **signed-out users**, both header Account IconButton and mobile dock Account tab open this view *immediately*, without navigation. Menu's secondary Account link switches the open dialog to the account view. Signed-in Account links remain ordinary WP/WooCommerce navigation to the existing Codela account dashboard. A plain Account URL fallback remains for JS-disabled clients.
- The account view renders the authentic `wc_get_template('myaccount/form-login.php')` WooCommerce login and conditional registration forms (real username/email/password, Woo nonces, real form handlers, forgot-password link). `codela_sf_account_intro` and Google OAuth provider Button are allowed in the explicitly delimited overlay render context. Submit form action is set to the genuine Woo My Account URL before submission. No iframe, separate authentication backend, fake login endpoint, new modal manager or Codela plugin changes.
- The existing `assets/scripts/overlay-controller.js` owns showModal/close, scroll and focus restoration, form and panel switching; `dock-controller.js` scrubbing includes the guest-only data-panel=account. Home from Account closes without reload, Search/Cart can switch instantly and dock selection follows `account`. Existing logged-in Page and cart/search UX untouched.
- Guest-only `account-overlay.css` supplies layout, Woo field controls and mobile safe-area spacing, while `components.css` maps native Woo submit to **the SAME shared UI Kit primary Button** (no new CTA style). Existing tiny `auth.js` handles optional Register tabs, loaded on guest pages. Google integration is reused rather than duplicated; Google Cloud credentials still required before button is shown.
- Tests: real PHP header guest/signed-in variants and real browser modal/dock gesture/close/section switch/form destination regressions; theme and assets 0.1.42. CI validate/standalone FTPS deploy must be checked. Physical iPhone Safari and production Woo login remain separate acceptance checks.

## Storefront 0.1.43 — minimalist guest authentication from existing UI Kit (11 October 2026)

- Keep real Google **secondary UI Kit Button** visible on guest login and guest Account dialog even before Cloud credentials are configured. When configured, it remains the existing safe OAuth link. When not configured, it is a `type=button` with **native HTML Popover API** (`popovertarget`) showing a brief localized “Google sign-in is not configured yet.” notice, dismissable by tapping elsewhere or Escape. No fake OAuth redirect, custom JavaScript, extra library, plugin, or new button/notification controller.
- Removed “Manage your orders and account details.” subtitle from `codela_sf_account_intro` at its source; popup hides its now-empty intro when Woo registration tabs are not available, the fallback My Account page keeps its title.
- Existing `components.css` is the **single shared adapter** for native Woo guest form fields in both Account page and fullscreen popup: actual `label[for]` moves **inside its input box** with an always-visible compact label line and typed value below; existing UI Kit height/radius/color tokens are used, no extra form HTML/JS. CSS grid over the real Woo login markup puts **Remember me** left and **Lost password** right on the **same row**, with existing shared primary UI Kit login submit below. Native Register form also inherits inset field labels and shared submit styles. Removed competing page/popup-only layout rules.
- Existing Woo validation, login/registration nonces, username/email/password semantics, toggle-password and reset links, and Codela's authenticated dashboard are unchanged. Chrome/browser/Node tests added for label geometry, aligned link row, Button parity, true/false Google configuration and native popover opening/dismissal. Version 0.1.43. Validate and independent theme deploy before announcing live; physical iPhone Safari acceptance remains to be checked.

## Storefront 0.1.44 — real iPhone guest Account screenshot polish (11 October 2026)

- The latest mobile screenshot revealed excess space between native modal header and segmented login/register tabs, generous input/control spacing and a faint or absent outline on the Google secondary button. Reuse the existing UI Kit, Woo forms and one native dialog. No generated image, invented button or Codela plugin changes.
- Guest-only account-overlay.css reduces panel top padding, removes redundant tab top margin, and compacts field and Google-divider vertical rhythm while keeping dock navigation unchanged. Common components.css keeps the 54px input-action token and the existing inset labels; Google secondary Button gets the identical existing CSS with an additional WooCommerce specificity bridge for the light border.
- Browser regressions check actual compact Account modal form start relative to toolbar, field height, and secondary Google Button border, palette and radius. Theme, CSS and JS versions 0.1.44. Validate in GitHub Actions and independent FTPS deploy before announcing live. Physical iPhone Safari acceptance remains user-side.

## Storefront 0.1.45 — compact guest login approved by user (11 October 2026)

- Implement approved minimalist Account dialog composition in the actual theme: guest Account header 23px, existing rounded Login/Register tabs 44px with lighter active elevation, real WooCommerce input fields remain 54px with inset static labels, vertical row gaps 12px, Remember me and password-reset native elements stay on the same row, and original UI Kit primary login/register and secondary Google Buttons target 52px with 15px typography. White/light-gray/charcoal only; no orange.
- Do not create per-page Button components, form HTML or new animations. Extend existing shared components.css Button with optional --sf-ui-button-height, --sf-ui-button-padding-y, --sf-ui-button-padding-x and --sf-ui-button-font-size tokens; originals remain unchanged where not overridden. Only guest Account dialog (account-overlay.css) and fallback guest My Account layout (account.css) supply compact overrides; signed-in Codela account, Menu/Search/Cart, common header/dock, Google OAuth verification, native Google setup notice and actual Woo login/register/reset backend are unchanged.
- Browser regression checks added for 44px tabs, 52px shared CTA and Google, 54px inputs, 23px popup title, input label inside field, compact toolbar spacing and account login/registration behavior; package/enqueues theme version 0.1.45. CI validation and independent FTPS deploy must be confirmed; real physical iPhone Safari acceptance is separate.

## 0.1.47 — Shared cart badge and composed cart screen

- The existing cart controller initializes via an uncached Woo Store API
  session read on every normal Storefront page. Cached HTML stays session
  independent. The same invalidation path handles Woo add/remove and BFCache.
- Header and dock use one `sf-ui-icon-badged` glyph-relative adornment with
  centralized `components.css` badge geometry.
- Cart rows and footer change only page composition and typography.
  Checkout remains `sf-ui-button--primary`; quantity is `sf-ui-pressable`.
  Woo totals, stock limits, taxes and plugin Account remain authoritative.
- Browser checks cover off-cart counts, other pages, event updates, badge
  position and full-width checkout. [Actions 38173704424](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38173704424) passed both validate and standalone deployment for `e0be1f9`. Physical iPhone/Safari acceptance remains separate.

## 0.1.48 — WooCommerce Checkout composition

- The WooCommerce-specific `page-checkout` template takes precedence over generic
  `page.html`. Supply theme-owned `templates/page-checkout.html`, with the
  **same** Header/Footer parts and Woo `page-content-wrapper` + `post-content`
  (do not embed a checkout block or rewrite native payment processing).
  The `checkout-header` part references the original header for Woo fallback.
- No mobile dock during checkout, via the existing `is_checkout()` behavior.
  Checkout form remains a full page, never a modal.
- Enqueue `styles/checkout.css` only on checkout. It composes layout and
  existing tokens for Woo's block/classic native form and order summary.
  Append native Place Order selectors to **shared** Button component rules in
  `components.css`; normal, pressed, disabled and focus states remain common.
- Real PHP header fixture and browser tests cover 320–1360px. A Site Editor
  database-customized Woo checkout template can override theme files; do
  not overwrite customized templates without inspection or user confirmation.
- [GitHub Actions 38174815133](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38174815133) passed validate (PHP, JS, browser layout) and independent theme deploy for source `2d45345`. Actual Safari/checkout gateway testing remains outstanding; automation does not prove a real order placement.

## 0.1.49 — Shared Header composition with Checkout

- A checkout page has no mobile dock (intentional). It nevertheless uses
  precisely the mobile compact Header layout from ordinary dock-enabled pages:
  logo left and Menu on the right. This is a **mode**, not a second header.
- In `codela_sf_header()`, the checkout-only `has-checkout-header` mode is
  selected when `is_checkout()` is true and the existing `has-mobile-dock`
  mode is false; both modes share the **same** mobile header selector rules in
  `navigation.css`. No new logo, menu, icons, buttons, or overlay controllers.
- On desktop, normal header search/cart/account tools remain available;
  manually disabling the mobile dock on other pages continues to show its
  existing alternate layout.
- Checkout browser regression compares Home and Checkout **computed header
  geometry** at 320, 390, 700, 1024 and 1360px, including icon visibility.
  Woo checkout native markup and gateway mechanics remain untouched.
- [GitHub Actions 38202574916](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38202574916) verified both browser tests and independent FTPS deployment at `c015e9c`. Physical Safari acceptance still required.


## Product detail adapter (0.1.59)

The product screen uses the existing WooCommerce legacy single-product template
rather than replacing its hooks or request lifecycle. `assets/styles/product.css`
owns only the gallery/summary composition, variations/quantity **layout**,
description tabs, and related-products responsive grid, scoped to
`body.single-product`. It is enqueued only when `is_product()`.

The native WooCommerce `single_add_to_cart_button` is added to the shared
Button selector groups in `assets/styles/components.css`, including primary
appearance, focus, pressed, disabled and accessibility fallbacks. Product CSS
may change its width and size tokens but must not clone button paint or
animations. The product form keeps native variation switching, stock checks,
validation, third-party hooks and WooCommerce add-to-cart submission.
Gallery zoom/lightbox/slider come from registered WooCommerce supports; no
new runtime, AJAX request or product-price calculation is introduced.

Checkout and authenticated Codela account are outside this selector scope.
A Site Editor override of the product template may require separate acceptance;
the bundled default targets the native legacy template.
