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

Dependencies load in this order: tokens → storefront layout → navigation →
shared components → guest account CSS (only on the My Account page).
Shared component styles take precedence over transitional page rules. The
account stylesheet is always scoped to guests or the vanilla Woo fallback;
Codela's authenticated account remains plugin-owned.

## Current primitives and contracts

| Primitive | Use | States | Semantics |
|---|---|---|---|
| `codela_sf_ui_icon_button()` | Header Menu/Ara/Sepet/Hesabım, popup X, search clear | bare/soft/clear, pressed, focus, disabled | `<a>` for links; `<button type=button>` for actions |
| `codela_sf_ui_primary_link()` | Checkout / hero discovery | pressed, keyboard focus | True `<a href>`; redirects without JavaScript |
| `.sf-ui-pressable` | Quantity +/−, cart removal, retry, submenu toggle | pressed/disabled/focus | Applied to existing semantic buttons |
| `.sf-ui-nav-tab` | Floating iOS-style mobile navigation | selected, pressing, scrubbing, collapsed | Existing `Navigation Controller` owns touch and page routing |

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
```

Allowed icon controls `bare` (default), `soft` (filled circular),
`clear` (small circular indicator). The icon is rendered by the existing
allowlisted `codela_sf_icon()`, accessible names are mandatory, attributes
are allowlisted and escaped and URLs pass through `esc_url()`.
The extra HTML argument is *internal trusted decoration only* (e.g. cart badge)
and must not contain user-generated markup.

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
7. Manual iPhone Safari acceptance is separate from CI. Test dock touch,
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
