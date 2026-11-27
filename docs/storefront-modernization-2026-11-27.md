# Storefront internal modernization — 2026-11-27

Theme only; plugin, templates, CSS, payment/auth, database and merchant settings remain unchanged.

- Native shell: optional search return and list scroll recovery tolerate blocked storage, malformed records and invalid timestamps.
- Agency: defer invisible cart session GET while preserving native purchase listeners, eager commerce surfaces and explicit cart intent.
- Assets: resolve duplicate Woo navigation configuration and first-paint context once; guard optional asset hash failure.
- Rebuild the canonical navigation bundle; cover regressions in native-shell and cart-race.
- Keep current native Interactivity API, module graph, style order and first-paint semantics. Larger auth, gateway or DOM changes require measured evidence, not speculative rewrite.

Release only after current CI and visual/functional acceptance; do not bypass the existing live contact validation failure. No version or feed change in this candidate.
