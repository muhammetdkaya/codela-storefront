# Codela web-platform coding instructions

Use the project-local Modern Web Guidance skill at `.agents/skills/modern-web-guidance/SKILL.md` when editing HTML, CSS, accessibility, animations, responsive layouts, forms or browser-side JavaScript. If shell access exists, search/retrieve the relevant official guides before changing code; don't invent guide IDs or claim CLI execution when unavailable.

Prefer native supported platform features with measured performance and feature detection; preserve iPhone Safari / WebKit compatibility and accessibility. Keep regressions out of login, cart, checkout, product UI and theme/plugin interoperability. Do not replace working WooCommerce semantics with purely visual or experimental browser patterns.

This repository's production source is `theme/codela-storefront/`. Read `docs/modern-web-guidance.md` for the audit workflow, scope, safe fallbacks and manual review instructions. Scanner results are advisory, never a reason for automatic rewrites, version changes, releases or deployment.

The canonical theme source is `theme/codela-storefront/`; leave generated styles/JS consistent with their sources and do not trigger release feeds or FTP deployment for audit-only work.
