# Rejected Embla hero research

This fixture is deliberately **not production code and not an accepted improvement**. CI4's Chromium wheel input moved native from `02 / 05` to `03 / 05`, but the enhanced component remained at `02 / 05`. Retaining the wrapper did not repair first-delta routing. See `rejection.json` and immutable JSON/screens under `evidence/ci4-chromium/`.

`gallery-horizontal.js` is the exact rejected runtime adapter. `archive/` retains the original test files and vendor build metadata/output before migration to research scope. Root vendor output is rebuilt from pinned development-only Embla 8.6.0 via `npm run build:vendor`; `npm run check:vendor` verifies it. No wheel plugin is installed.

Explicit research reproduction from the repository root:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check:vendor
node tests/fixtures/embla-pilot/embla-showcase.cjs
WP_CORE_INCLUDES=/path/to/pinned/wp6.5/includes TEST_BROWSER=chromium \
  node tests/fixtures/embla-pilot/embla-showcase-browser.cjs
```

The browser command retains the strict native-versus-pilot wheel assertions and is expected to expose the rejection on affected Chromium builds. It is outside the required green acceptance workflow. The VM command only tests lifecycle and ownership bookkeeping; its success does not establish wheel movement. Use `TEST_BROWSER=webkit` or `firefox` for explicit cross-engine research. Browser/PHP fixture prerequisites match `.github/workflows/library-migration.yml`.

Production acceptance is `tests/native-showcase-browser.cjs`, which compares the vendor-free candidate with immutable native source `687ef83e13621f6117264d04f220fa13c8836bb4`. `evidence/*-mouse-comparison.json` records the pilot's genuine desktop-drag advantage, not broad adoption or a performance win. No live deployment or physical-device acceptance is implied.
