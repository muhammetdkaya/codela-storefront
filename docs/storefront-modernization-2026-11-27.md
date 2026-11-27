# Storefront internal modernization — 2026-11-27

Theme only; plugin, templates, CSS, payment/auth, database and merchant settings remain unchanged.

- Native shell: optional search return and list scroll recovery tolerate blocked storage, malformed records and invalid timestamps.
- Agency: defer invisible cart session GET while preserving native purchase listeners, eager commerce surfaces and explicit cart intent.
- Assets: resolve duplicate Woo navigation configuration and first-paint context once; guard optional asset hash failure.
- Rebuild the canonical navigation bundle; cover regressions in native-shell and cart-race.
- Keep current native Interactivity API, module graph, style order and first-paint semantics. Larger auth, gateway or DOM changes require measured evidence, not speculative rewrite.

Release only after current CI and visual/functional acceptance; do not bypass the existing live contact validation failure. No version or feed change in this candidate.

## Phase 2 — capability-owned module graph (0.1.444)

The existing native shell is retained. On Woo-disabled sites, its stable search/cart module IDs resolve to one inert adapter rather than the two commerce controllers and formatter. No new account provider, theme framework, CSS or transaction implementation. On Woo-enabled sites (including mixed Agency pages) the original graph is unchanged. The inactive panel guard prevents an unavailable commerce action from opening empty UI. Static source saving is not a measured live performance gain; confirm browser and network behavior before closing the broader audit. Existing native-shell and site-mode regression suites now assert both graphs and adapter behavior.

## Phase 3 — shared request-local block parsing (0.1.445)

Agency assets, layout capabilities and route eligibility reuse the native parsed tree by exact content (bounded, request-local; custom parsers bypass it). Validation, authorization, editor preview selection and rendering remain unchanged. Route eligibility runs only for the actual navigation region and eligible page links, not every rendered block. Added regression assertions for repeated calls, changed content, custom parser, memory bound and irrelevant blocks. This is not a measured live speed claim. Stage in parallel without merging until 0.1.444 deployment and stable publication have completed.

CI follow-up: the existing Contact override test deliberately changes enabled state independently of its parser input. Keep the validated Contact rendering path on fresh native parsing rather than extending a presentation-only cache into it. The existing enabled/disabled/password/editor regression remains unchanged.
