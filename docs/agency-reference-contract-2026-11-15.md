# Codela Storefront — agency reference implementation contract (15 November 2026)

## Authoritative design reference

User-supplied file: `codela.dev___WordPress__Elementor__E-Ticaret___Özel_Yazılım_Ajansı(2).html` (94 KB).
The file supplies a complete multi-page agency *visual prototype*. It is an HTML/CSS/JavaScript mockup, **not** an installation of the React Bits or Aceternity UI React components, although it labels its sections with those libraries' names.

**Do not replace its approved layout with a different creative direction or generic design library.** Work by comparing individual reference sections and preserving their visual structure, hierarchy, card proportions, animation behavior, content organization, and responsive intent.

## Implemented in the agency theme branch (PR #176)

- Agency-mode home only; `commerce` and every shared product, cart, checkout, login, account, header/dock file are unchanged.
- Dark hero with two interchangeable variations:
  1. Card Swap-style 3D stack of three WordPress/Elementor, WooCommerce, and custom-development cards; native tab controls, pointer clicks and keyboard.
  2. Container Scroll-style 3D dashboard/tablet with scroll-responsive rotateX and scale; optional UI toggle.
- Four-poster horizontal services carousel with native scrolling, scroll snapping, responsive card sizing, arrow controls, and native service-detail dialog.
- All agency CSS selectors use the `.sf-agency` namespace; scripts enqueue only for the agency front page.
- The contact CTA resolves only to a published real WordPress contact page; otherwise anchors to the on-page contact section. Do **not** invent a public service URL or fake endpoint.
- Native WordPress block pattern and shared Codela UI buttons, system font, keyboard support, and reduced-motion behavior remain intact.

## Upstream licensing and distribution

The current React Bits project declares *MIT + Commons Clause*, which permits site use but prohibits redistribution of the component itself, including ports. Aceternity UI's published license also restricts redistribution of Item source and derivative template products. Codela Storefront is a public and potentially redistributable WordPress theme: do **not** vendor, copy, port, or claim to ship restricted upstream component source without separately verifying redistribution rights.

The provided HTML reference is the implementation source for the independently written vanilla JS/CSS/WordPress version in this PR. Display labels should describe the interaction (e.g., "Kartlı Vitrin" and "3D Kaydırma") rather than assert that an upstream React component was installed. No runtime React/GSAP/Motion CDN is added.

Official reference pages:
- React Bits Card Swap: https://reactbits.dev/components/card-swap
- React Bits license: https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md
- Aceternity Apple Cards: https://ui.aceternity.com/components/apple-cards-carousel
- Aceternity Container Scroll: https://ui.aceternity.com/components/container-scroll-animation
- Aceternity license: https://ui.aceternity.com/licence

## Not yet delivered

- The prototype's independent Services, About/Process, Contact, and customer-portal pages. Existing account is **not** a live agency project-tracking system; do not make that claim.
- A production lead/contact submission workflow or client project-management backend.
- Matching every minor decoration in the source: final visual comparison should use actual screenshots at phone and desktop sizes.

## Acceptance and publication

Run `php tests/agency.php` and `node tests/agency-browser.cjs` (Playwright Chromium), checking at 320, 390, 768 and 1440 px. Also run the repository's broader CI to ensure commerce has not regressed. The test has explicit checks for both hero variants, reduced motion, four poster cards, native service modal, keyboard and no-JS fallback.

Do not merge a failing candidate. Do not deploy to live WordPress, push FTP, publish an official theme release, or update the stable feed as a side effect of a draft PR. Separate approval and a verified release process are needed.
