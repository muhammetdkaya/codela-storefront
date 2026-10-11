# Codela Storefront UI Kit — source of truth

**Status:** Theme 0.1.22 initial shared foundation. Use this before making any new
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

## Next refactoring steps (do not regress production)

- Extract the isolated dock gesture controller, fullscreen modal lifecycle,
  Store API cart and search into separately tested JavaScript modules, *without*
  loading duplicate listeners or separate navigation states.
- Continue extracting feature-only overlay, search and cart rules from the
  remaining storefront layout stylesheet using visual equivalence tests.
  The shared component stylesheet stays the sole source for control design.
- Add an admin-only or development-only UI Kit playground preview showing
  real controls in default, pressed, focus, disabled and loading states;
  do not ship test content on public store pages.

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
