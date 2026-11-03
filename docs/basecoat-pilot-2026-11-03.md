# Basecoat field/card pilot: retain the native Codela implementation

Date: 3 November 2026. Codela baseline: `687ef83e13621f6117264d04f220fa13c8836bb4` / theme 0.1.195. Scope: the conditional Stage 4 field-group and order-summary-card evaluation in the library migration plan. This is a source-backed comparison and isolated fixture, not a deployed redesign.

## Decision

**Reject Basecoat production adoption for these two components.** Keep Codela's current shared tokens, Button/field/notice styling, native Woo forms and order-summary markup. Basecoat supplies useful semantic examples, but no missing form or card behavior here. Preserving the existing appearance leaves no production implementation that can be removed in exchange for its added classes, style mapping and maintenance.

The conditional evaluation is complete. At exact source `65158f74d4b33114b1d16366335bbf7d176bd4b6`, [run41648726152](https://github.com/muhammetdkaya/codela-storefront/actions/runs/41648726152) passed this fixture in Chromium, WebKit and Firefox:20 document/width cases plus4 no-JavaScript cases per engine. The complete workflow was not green because the independent, rejected Embla Chromium pilot failed. Later source changes still require exact-final-SHA checks. No Basecoat/Tailwind dependency, runtime, stylesheet, reset, PHP override, theme version change or production adapter was added by this pilot. The comparison artifacts live under `tests/basecoat-pilot*` and this document only.

## Precisely what was evaluated

The official repository was read at [commit `6769c83`](https://github.com/hunvreus/basecoat/tree/6769c83c9644ec4195ed30af028a9e66fe670215), whose [package manifest](https://github.com/hunvreus/basecoat/blob/6769c83c9644ec4195ed30af028a9e66fe670215/package.json) identifies `basecoat-css` 1.1.0. The documentation currently displays the same version. This identifies the inspected source; it is not a claim that every change on that commit is in the npm release.

- [Field structure](https://github.com/hunvreus/basecoat/blob/6769c83c9644ec4195ed30af028a9e66fe670215/src/css/components/field.css), blob `ba6f866aef0d3198579476bcf33cafedab1046d2`.
- [Input structure](https://github.com/hunvreus/basecoat/blob/6769c83c9644ec4195ed30af028a9e66fe670215/src/css/components/input.css), blob `5753913b908a7af7d049026b6e547be641deb649`.
- [Card structure](https://github.com/hunvreus/basecoat/blob/6769c83c9644ec4195ed30af028a9e66fe670215/src/css/components/card.css), blob `477fb45ca7d4101f726b496f9f22c54b0d3657fa`.
- [Vega visual rules](https://github.com/hunvreus/basecoat/blob/6769c83c9644ec4195ed30af028a9e66fe670215/src/css/styles/vega.css), blob `b50b8a3d9a9ed83ad227ab7362de32be03425fee`.
- [License](https://github.com/hunvreus/basecoat/blob/6769c83c9644ec4195ed30af028a9e66fe670215/LICENSE.md): MIT, copyright 2025 Ronan Berder. Retain its copyright and permission notice for copied substantial source. The full notice accompanies the research snapshot. No licensing restriction motivated this rejection.

`tests/basecoat-pilot-upstream.json` retains the three small component sources, package metadata, license and only the three relevant Vega excerpts. Complete-source entries are verified against their Git blob hashes. The Vega hash identifies the full upstream file, not a hash of the excerpts. This snapshot is evidence, never imported into the fixture's stylesheet or production assets.

The official [Field examples](https://basecoatui.com/components/field/), [Input examples](https://basecoatui.com/components/input/), [Card examples](https://basecoatui.com/components/card/) and [installation instructions](https://basecoatui.com/installation/) were also inspected. Field/Input/Card are CSS/native-HTML components, not a validation, checkout or account engine. Their sources contain Tailwind `@apply` instructions; importing those files into Codela's current concatenation pipeline would not compile them. The default visual bundle and reset are outside the approved appearance-preserving pilot.

## Existing ownership and observable differences

The current rules were checked in `AGENTS.md`, `docs/design-system.md`, `inc/ui.php`, `inc/account.php`, `woocommerce/myaccount/dashboard.php`, `assets/styles/{tokens,components,account,account-overlay,checkout}.css` and existing account/checkout regressions. The newest account/commerce contracts take precedence over historical design-system entries.

| Concern | Current Codela/native Woo | Basecoat contribution and adaptation cost |
| --- | --- | --- |
| Field group | Classic billing groups retain Woo's wrappers and field names. Account password/detail groups use native fieldset/legend. Guest forms have existing inset labels. | `.fieldset`/`.field` provide flex composition and optional orientation. Keeping current placement means retaining Codela's layout; no controller is replaced. |
| Actual field node | Classic checkout inputs sit inside `.woocommerce-input-wrapper`; account text fields can be direct children. | The automatic `.field > input` selector does not reach the classic wrapper. Explicit `.input` mapping or selector rewriting is necessary. Removing the wrapper to match an example is not acceptable. |
| Label and error | Real `label[for]`, native input names, `required`, nonce fields, notices and endpoint handlers stay authoritative. | The examples correctly connect errors with `aria-describedby` and put `aria-invalid` on the control. Those semantics can be checked directly without shipping a library. Classes do not create an error, validate input or repair missing relationships. |
| Invalid/disabled state | Browser/Woo owns `disabled` and `aria-invalid`; the native submission excludes disabled controls. Codela owns existing state paint. | `.field[data-invalid]` and `data-disabled` are extra visual-state inputs. A one-time mirror becomes stale when Woo changes the original state. Omitting the mirror avoids that cost but also removes its claimed advantage. |
| Focus/geometry | Shared 54px action-height token, current border/radius tokens and 2px focus outlines. Account/guest compositions have their own already-established layout. | The structural Input source includes `outline-none`; its style pack supplies a ring. Vega adds `h-9`, its radius, shadow and a different ring treatment. A structural-only import cannot be assumed to supply Codela focus paint; a full import requires override/layer review. No claim is made that it would beat the current selectors in every cascade. |
| Account order card | Actual template already uses a labelled section, header/h2, native order total/status and shared View order link. It performs one bounded current-customer Woo query and preserves module hooks. | `.card` adds a flex container; direct header styling is grid-based; section/footer slots carry the visual spacing. Existing Codela header is flex and content rows are direct divs. Mapping those slots means wrappers, selector exceptions or retaining existing CSS. No domain code disappears. |
| Checkout summary | Classic `#order_review` is one painted surface around native review table/payment. Block checkout paints the sidebar, with its inner summary transparent. | A nested Basecoat card would add a second surface. Mapping `.card` onto the existing root avoids that but leaves its table/payment structure and all existing CSS. Native table headers and monetary markup must not be replaced by a copied card demo. |
| Fragment ownership | Woo replaces native review/payment fragments; block checkout owns its render tree. Codela styles the stable native selectors. | A new renderer/controller or field cloning is rejected. Class/state mapping requires integration with whichever native nodes actually change, while current selector-based styling continues without that mapping. |
| Scope/isolation | Theme styles use `sf-*` contracts and protect the independent `.codela-my-account-layout` mode. | Generic `.card`, `.field`, `.input` and style tokens introduce another naming/scope contract. Prefixing and preserving the plugin guard become local maintenance. |

The summary is not a measured speed comparison. Both existing components need **zero new JavaScript behavior**. The selected outcome adds **zero production bytes and zero runtime requests**. It does not establish a numerical performance improvement. There is no legitimate code-reduction claim when all current native behavior and paint must remain.

## Reviewable minimal candidate

`tests/basecoat-pilot-fixture.cjs` creates four small documents:

1. Classic checkout: native-style field wrappers, associated inline error, disabled field, country select, separate coupon form, one checkout form, payment radio, hidden fixture nonce and the actual submit semantics.
2. Block checkout boundary: native-style field and validation wrappers plus one sidebar/transparent summary. This is representative HTML, not a mounted Woo React application.
3. Account with order: the **actual Codela dashboard PHP template and UI Button renderer** through the existing deterministic test harness, plus a representative native edit-account fieldset.
4. Account without order: the actual existing empty-summary branch, not invented order data.

The fixture reads current Codela source styles. Its small host stylesheet supplies only the missing WordPress typography and representative Woo layout baseline. It is neither an upstream CSS compatibility test nor a pixel baseline of a live merchant site.

The mapped candidate adds Basecoat class names to those **same nodes**, and mirrors invalid/disabled attributes once. It does not create, reparent or clone fields/cards, install listeners, import any Basecoat paint/reset, or intercept Woo submission. This deliberately exposes the minimum cost of mapping while retaining the existing appearance. Identical visuals with inert classes are **not** evidence that importing Basecoat's stylesheet is safe. They show that preserving Codela wholesale offers no new visual capability; the source comparison above establishes why importing its actual rules creates more work.

The browser test also demonstrates the stale invalid-state mirror, resynchronizes it explicitly, and checks idempotence. That resync belongs only to the research fixture. It is not proposed production code. For classic checkout, a simulated server review-table replacement changes the displayed total while preserving the same customer input/form and transparent payment section. This is a fragment-boundary test, not a real Woo recalculation or transaction.

## Reproduce and verify

Source check, no browser/server/network needed:

```sh
PHP_BIN=/path/to/php node tests/basecoat-pilot-source.cjs
node --check tests/basecoat-pilot-fixture.cjs
node --check tests/basecoat-pilot-browser.cjs
```

Generate review documents outside the distributable theme, then open locally:

```sh
PHP_BIN=/path/to/php node tests/basecoat-pilot-fixture.cjs checkout > /tmp/basecoat-pilot-checkout-native.html
PHP_BIN=/path/to/php node tests/basecoat-pilot-fixture.cjs checkout --mapped > /tmp/basecoat-pilot-checkout-mapped.html
PHP_BIN=/path/to/php node tests/basecoat-pilot-fixture.cjs account --mapped > /tmp/basecoat-pilot-account-mapped.html
```

Run in the dedicated no-deploy CI after its existing Playwright/browser install:

```sh
PHP_BIN=php SF_ENGINE=chromium BASECOAT_REPORT_DIR=qa/basecoat-pilot/chromium node tests/basecoat-pilot-browser.cjs
PHP_BIN=php SF_ENGINE=webkit BASECOAT_REPORT_DIR=qa/basecoat-pilot/webkit node tests/basecoat-pilot-browser.cjs
PHP_BIN=php SF_ENGINE=firefox BASECOAT_REPORT_DIR=qa/basecoat-pilot/firefox node tests/basecoat-pilot-browser.cjs
```

Each engine covers 4 documents × 5 widths (320/390/700/1024/1360), plus 4 no-JavaScript cases. Assertions compare geometry/paint, actual Tab/Shift+Tab keyboard focus and `:focus-visible`, accessible input snapshots, native node identity and handlers, input values, form serialization, unique IDs, correctly associated nonempty visible errors, disabled exclusion, one surface, actual account order/empty output and native submitter. Empty required and malformed email submissions must be blocked by the browser before the same native form can submit valid input. No fixture action is a real checkout.

Paired native/mapped screenshots at 390/1360 and a JSON report go into `BASECOAT_REPORT_DIR` (highest priority), `SF_REPORT_DIR` if supplied instead, or `qa/basecoat-pilot/<engine>` by default. Relative paths resolve from the invoking working directory. CI should invoke from the repository root and upload that engine's directory. No screenshots or results from different engines overwrite one another. Browser support is configured, not claimed passed before execution.

These checks validate the fixture's accessible naming/state boundaries and keyboard behavior. They do not run a screen reader, prove live announcements, measure text contrast, mount real Woo Blocks validation, or establish an accessibility conformance claim. Error cleanup and review fragments are explicitly simulated by the harness. Inert class parity alone cannot show a Basecoat stylesheet is accessible or compatible.

### Verification status at handoff

- **Passed locally:** all fixture/source syntax checks; pinned upstream complete-source hash/license checks; four deterministic fixture generations; actual account-template hook and order/empty branching; no Basecoat/Tailwind dependency; class-only mapping source guard.
- **Prepared, not run locally:** Chromium/WebKit/Firefox computed appearance, keyboard/DOM and submission checks. The current executor's browser socket sandbox is already known to block launch. This pilot did not retry that denied operation. The coordinator must record exact CI results before calling browser checks passed.
- **Not performed:** live WP/Woo integration, actual payment, production deployment, physical Safari/device visuals or performance measurement. The fixture is not a substitute for those acceptance gates.

## When to reconsider

Revisit only for a concrete missing component or semantic defect that cannot be fixed more simply in the existing native/shared component. Require the proposed adapter to demonstrate removable Codela code or a user-visible improvement, bounded additional bytes, preserved appearance, upstream/license tracking and native Woo lifecycle tests. General interest in using a library is not sufficient reason to adopt another stylesheet.

If a later accessibility audit finds an unassociated native error, fix that relationship at its real owner and test it. Do not infer from this fixture that every live plugin-generated field already has complete error semantics, or that importing Basecoat would repair one.

## Recorded visual/geometry review

The same run supplied24 paired native/mapped screenshots across the three engines.23 pairs were RGB-identical; one Chromium account pair differed at10 pixels within the field area, so exact pixel equality is not claimed for that pair. Firefox390 checkout and WebKit1360 account screenshots were visually inspected: labels, error/focus indications, inputs and card content remained contained. These inert-class comparisons do not test the upstream Basecoat stylesheet.

Firefox's earlier54px assertion failure was protocol rounding: captured `getBoundingClientRect().height` and CSS height/min-height were exactly54, while Playwright's protocol bounding box reported53.999969482421875. The final test still requires the54px token/min-height/border-box contract and allows only0.001px protocol precision difference; it does not reduce the design target.
