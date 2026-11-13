# Codela Storefront 0.1.305 — Guest account asset ownership

The initial store document should not fetch and execute the guest Account enhancements until the account panel is requested.

- On guest Home/Shop/Product: only the small `auth-loader.js` (footer) is enqueued. `account-overlay.css`, `auth-smart.css`, `quick-login.css`, `auth.js`, `auth-smart.js`, `quick-login.js`, and `passkeys.js` are fetched and mounted only when the account panel is opened. Hover/focus prefetches at low priority; pointerdown begins ordered downloads before the panel transition.
- On direct My Account: keep the native eager CSS/JS and Woo form behavior, including quick-login security verification and passkeys.
- PIN and passkey configurations are attached to the loader in the original PHP hooks, not embedded in an unauthenticated document or duplicated in client code. No Woo form processing, REST authorization, navigation, cart, skeleton, animation, or core modules were changed.
- Dynamic classic scripts use `async=false` to preserve authentication dependency execution order without serial network fetches. The Account-open event is replayed after DOM readiness if the panel opened while scripts were still loading; native nonce freshness and quick-login status checks remain owned by the original implementations.
- The loading area is a neutral, temporary status surface. If an asset fails, an explicit link navigates to the normal Account page instead of leaving a permanently empty panel.
- Release test: `node tests/auth-lazy.cjs` plus the unchanged PHP, Playwright, and build tests. A live phone test is still required to establish actual FCP/LCP improvement and first-tap Account usability. Server TTFB and third-party plugin cost are not measured by this change.

No external font, tracking script, third-party dependency, or additional network service was introduced.
