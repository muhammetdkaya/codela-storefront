# Woo cart synchronization — outstanding acceptance

The production deployment of `71fa373` is verified in Actions 38262389955.
The adapter was released as 0.1.51 by explicit user instruction, after the outstanding acceptance limitation was disclosed. Source `62fe44d444fe440a7970ea2c8e11078a8011158a`; Actions 38266829194 validated and deployed it successfully. Real WP/Woo acceptance remains outstanding. Do not close F3/F4
based on the controller contract tests or the PHP/Chromium fixture suite.

## Implemented boundary

- The existing cart controller remains the only theme cart owner and POST client.
- If `window.wc.wcBlocksData.cartStore` and `window.wp.data` already exist, observe
  only changes to items, totals, coupons and count. No new Blocks bundle is enqueued.
- On successful theme POST, invalidate `getCartData` and resolve it using Woo's
  own data pipeline. Do not assign REST JSON to the normalized store, send fake
  added-to-cart events for quantity changes, or notify consumers after failed POST.
- A second successful theme write while the Woo refresh is pending requests a
  trailing Woo refresh. GET/notification feedback does not form a loop.
- Classic cart/checkout refresh events are sent only when their actual forms
  are present. Native/classic completion events use the existing invalidation queue.
- Bind once; one `load` retry handles delayed global availability. No polling.

## Source inspection

Official API documentation:
https://developer.woocommerce.com/docs/block-development/reference/data-store/cart/
https://developer.woocommerce.com/docs/block-development/extensible-blocks/cart-and-checkout-blocks/dom-events/

WooCommerce 9.0.0 source inspected:
- `plugins/woocommerce-blocks/assets/js/data/cart/resolvers.ts`: `getCartData`
  performs a no-store GET and hands the response to `receiveCart`.
- `plugins/woocommerce-blocks/assets/js/data/cart/selectors.ts`: selector returns
  the store cart data; do not subscribe to all unrelated registry updates.
- `plugins/woocommerce/client/legacy/js/frontend/cart.js`: `wc_update_cart`
  invokes the classic cart update flow.

These sources do not prove compatibility with the currently installed production
Woo version. Confirm the actual WP/Woo/Codela versions in an isolated installation.

## Outstanding real integration acceptance

1. Install the ZIP built by **this standalone repository**, assert the active
   theme version and SHA, then activate it with actual compatible Codela and Woo.
   The existing plugin `tools/test-theme-wordpress.php` calls
   `codela_theme_build_zip()`; its old bundled theme is not proof for this branch.
2. Test Cart block and Checkout block: both directions of quantity/removal,
   coupon changes, stock errors, delayed network, and external add during a write.
   Check theme badge, panel, Woo rows and totals against the actual Store API.
3. Repeat with classic cart and checkout. In particular confirm `update_checkout`
   recalculates the real order review without resetting entered gateway fields.
4. Capture network requests and console: one initial theme GET; one POST per
   action (except one permitted nonce retry); no feedback loop or repeated polling.
5. Check late script registration and confirm Home does not gain Blocks bundles.
   Test the declared minimum compatible WP/Woo pair and the production pair.
6. Preserve the approved header/dock/buttons and Codela signed-in account ownership.

## Verified here / limitations

`node tests/cart-race.cjs`, `node tests/cart-sync.cjs`: passed locally.
The latter covers store-to-theme updates, theme-to-store refresh, removal,
same-snapshot echo prevention, classic scope, event coalescing, failed POST,
secondary refresh failure, delayed registration and idempotent subscription.
It mocks only DOM/network/registry boundaries and runs the real controller.

The execution environment has no PHP, WordPress, WooCommerce or database runtime.
No live customer cart, payment or site settings were changed for testing. CI's
existing PHP/Chromium fixtures are useful regressions but are not this gate.
Physical mobile Safari acceptance and performance measurements remain separate.
