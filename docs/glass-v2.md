# Glass V2 — Reference CSS material, v0.1.363

Based on the user-provided **Codela — Dijital Tasarım & Yazılım Stüdyosu**
HTML. The reference's actual CSS material, not the previous Canvas 2D
procedural illustration, is now adapted to the native WordPress site.

## Opt-in and ownership

- Codela > Theme > Appearance > **Glass V2** still controls the effect.
- \`agency-glass.css\` is enqueued only on native Agency pages containing
  Agency patterns/widgets, after the current Agency/Project CSS.
- WooCommerce/cart/checkout/account and the existing mobile dock are unchanged.
- Native header menus, forms, page links, post handlers and content remain
  authoritative. No single-page application or Tailwind runtime is loaded.

## Exact material roles

- **ios-glass** — gradient from translucent white to dark graphite;
  \`blur(18px) saturate(175%) brightness(1.06)\`, thin spectral-rim
  multi-background and paired interior/exterior shadows.
- **ios-glass-primary** — brighter transmittance for CTA links and buttons.
- **bento-box** — darker nearly opaque cards with warmer hover accents.
- **select-chip** — amber selected state and compact choices for Project Start.
- **codela-input** — low-contrast dark fields with amber focus affordance.

Implemented on Agency welcome/Studio, Services Bento, detail CTAs,
Process, Contact Bento and native Project Start forms.

## Removed

The previous \`glass-optical.js\` and its offscreen procedural scene are
retired: it did not refract actual DOM content and needlessly duplicated the
material. \`glass-optical-browser.cjs\` is replaced by the cross-browser
Agency material test. Native CSS-only fallbacks cover Reduce Transparency,
forced colors, lack of backdrop-filter and Reduce Motion.

## Rollback

Turn off **Glass V2**: the stylesheet is not loaded and Agency pages retain
their existing theme appearance. The original native markup is unchanged.
