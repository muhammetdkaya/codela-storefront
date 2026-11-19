# Glass V2 — opt-in header material (0.1.361)

## Scope

Appearance > Glass V2 is **off by default**. Enabling it attaches the `sf-glass-v2` body class and conditionally loads `assets/styles/glass-v2.css` after the normal Storefront stylesheet bundle.

Only the floating header brand, desktop primary navigation, icon controls, desktop submenu, and the menu trigger/toolbar moved into the native menu dialog are adapted. Dock, product gallery/sheet, purchase, cart, checkout, account content, geometry, hit targets and JavaScript interactions are deliberately unchanged.

Agency content has the existing `.sf-agency-widget` marker; CSS `:has()` selects the dark graphite material without JavaScript. Other pages retain a light optical variant. This is a page-level material decision; it does not attempt continuous per-section scroll luminance detection.

No external library is loaded. The existing Framework7-derived shared UI Kit remains the source of blur and control behavior, with new original V2 color/rim tokens only. Reduce Transparency, forced colors and missing-backdrop-filter receive opaque material.

## Acceptance

- Toggle off: no extra CSS request and no body class; V1 unchanged.
- Toggle on: separate light/dark material, mobile header not 91% white.
- Menu moved to the native light dialog keeps readable black glyphs.
- Custom logos are not filtered; native dark-surface action glyphs invert.
- Theme settings saved as an allowlisted `checkbox`; user can disable without reinstalling.
- Run `python3 tests/package.py`, `node tests/glass-v2-browser.cjs`, and existing UI Kit and navigation tests.

## Approved Canvas optical preview, 0.1.362

The preview is translated into a one-time static Canvas 2D lens for the
floating Agency header. It reuses the real brand, menu, account and search
controls (no duplicated controls and no layout change). Its local virtual
scene is displaced through the capsule edges, with subtle dispersion and
specular light. It **does not capture or refract the real page DOM**:
Safari does not reliably support SVG displacement through backdrop-filter.

The JS is enqueued only for Glass V2, initializes only on Agency pages,
does not run a continuous render loop, and redraws on resize/pageshow.
If Canvas cannot initialize or the user prefers reduced transparency,
the original V2 CSS remains active. This change does not alter the
mobile dock, any commerce surface, or header control positions.
