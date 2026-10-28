# Codela Storefront UI Kit — source of truth

## Showcase background — 0.1.183 correction candidate

The image covers the **entire existing slide**, including behind caption/controls. Keep the native responsive picture and focal point, absolute full-frame cover, transparent caption and a nonopaque readability gradient. Never fix image coverage by increasing slider height. Restore the 0.1.181 frame: desktop clamp(680px,86svh,900px), mobile max(560px,100svh - 68px). Caption/dock/safe-area reserve stays inside this frame; extreme copy scrolls within its overlay. This supersedes 182’s full-viewport/separate-band interpretation. Real-browser before/after photo evidence is pending; static tests are not design acceptance.

## Product feedback geometry — 28 October 2026 candidate

The product preview uses native fixed anchoring and the shared product-panel gap, independent of the outgoing body's dock gap. The pulsing photo uses the same stable large-viewport frame/inset as native product photos and extends behind the glass sheet. Native first-paint/mounted heading and preview reserve the same two-line minimum; optional destination urgency, sale/stock/variation rows remain native and content-driven. Never copy outgoing product data to estimate them. Browser regressions compare all four coordinates of the real PHP/adapter photo, panel, quantity and CTA at 320–700px, short/long titles and normal/product sources. Physical Safari acceptance remains separate. Supersedes historical gallery-ending-at-panel and absolute-preview instructions below.

## Destination bottom chrome — 0.1.174 (current)

The destination determines the loading bottom surface. Home/catalog/account/page show the existing normal dock; product shows a static, inert quantity/Add to cart preview using the shared PHP Button and panel material. Only content/gallery shapes pulse. The preview has no price, product identity, form or commerce handler; the incoming native Woo document owns actual availability and purchase data. Never retain the outgoing product panel for a normal destination. Never keep the normal dock for a product destination. Cancel/timeout/pageshow restore the original dock and native form; configured dock absence is respected. This supersedes the retained-current-bottom behavior of 0.1.173 below. Native products and desktop composition remain document-owned.


## Native current bottom continuity — unpublished local candidate, 27 October 2026

The clarified mobile bottom means the source document’s **real contextual surface**: one global dock on normal pages, or its original native purchase sheet on a purchasable product. Keep that surface visible but inert/aria-busy while navigation is pending. Normal → product cannot invent a destination panel before Woo HTML arrives: keep the existing dock until native replacement. Never display both bars, clone a form, substitute destination title/price from link metadata or keep the old CTA interactive. The global status announces loading; the outgoing form’s async submit is blocked only during this bounded state.

Only the gallery pulses; stop its animated shape above the real translucent bottom. CSS may temporarily mask an expanded native sheet as compact, but must not rewrite its underlying open state or reveal hidden details/variation fields. Restore only feedback-owned CSS properties, preserving native measurements updated during pending. Pending observers handle late native mount and breakpoints and disconnect on end or source-region retirement. Main replacement / route commit retires source-panel ownership without stealing the router’s completion token; native product pageswap skips old-price cross-document snapshots. A native panel trapped by an ancestor containing/stacking context falls back to the existing real shell dock, never a cloned/moved surface.

This supersedes the old 0.1.171 prohibition on showing the outgoing panel: its **busy source-document appearance** is permitted, but no stale price/form is adopted by the committed target. 700px mobile-bottom boundary and desktop product adapter/CSS remain unchanged. No-dock configuration never gains fabricated navigation. Browser geometry/input, real Woo and physical Safari acceptance remain pending; source/DOM-only checks are not visual acceptance. Version metadata remains 0.1.171 for review only, not distribution.


## Historical gallery-only product feedback — 0.1.171 (superseded by candidate above)

## Desktop description and page scrolling — unreleased review

At 901px+, reuse the single native Woo description disclosure in the existing summary immediately before enabled delivery output; keep it readable on entry. Preserve its original marker and open state and restore both before the unchanged mobile sheet mounts. Additional information/reviews remain in the original below-overview information container; callbacks, IDs, forms and content are never duplicated. Missing description/delivery never creates invented content. The existing product gallery retains horizontal containment, but allows vertical scroll chaining on desktop only. At <=900px all previous CSS and composition remain; no-JS keeps the original server-rendered information fallback. This is an unreleased draft, not a new installable version or visual/native-device acceptance.

## Gallery-only product feedback — 0.1.171

User clarification supersedes 0.1.170: product destinations keep animated gallery feedback, full visible viewport on mobile and left gallery on desktop. No skeleton summary, title, price, quantity, purchase panel or submit. The incoming native Woo document owns actual product information and the purchase form. Never reveal an outgoing product form while waiting. Existing header cart is shown and dock hidden for product destinations; other targets retain their own feedback and dock. Use the shared token animation, reduced-motion and viewport lifecycle.

## Historical product controls decision — 0.1.170 (superseded)

## Historical product controls decision — 0.1.170 (superseded)

Product destinations use native document navigation without synthetic product/purchase UI. Price, stock, title, quantity and submit belong to the incoming Woo document. Do not reuse an outgoing product form under a destination skeleton. Home/catalog/account/page feedback keeps the shared package and viewport cleanup. This supersedes prior product-silhouette instructions.

## Visible viewport ownership — 0.1.169

The pending surface is the sole viewport owner: VisualViewport height/offsetTop at scale 1, otherwise CSS 100dvh/native zoom. Purchase silhouette is absolute inside that surface, never another fixed descendant. Counter and thumbnail geometry uses the same parent. Resize/scroll callbacks are coalesced and removed when feedback ends; stale frames cannot resize another request. The real product sheet remains native and content-measured. Controlled viewport regressions do not substitute for physical Safari/browser-toolbar acceptance.

## Navigation feedback package — 0.1.168

`assets/scripts/navigation-feedback.js` and `assets/styles/navigation-feedback.css` own all pending presentation. `window.codelaSFFeedback.begin({url, link, owner})` returns a monotonically increasing ownership token. `end(token)` only clears that request; `active(token)` guards late callbacks. The native document observer and existing core/router controller are adapters, not competing renderers. No loading HTML/CSS belongs in either adapter; the retired navigation-loading stylesheet must not return.

The package selects home, catalog, product, account or page silhouettes. Shapes use `--sf-ui-skeleton` and `--sf-ui-skeleton-duration`; shared components owns purchase surface paint. Header/dock stay as their original nodes. The one overlay closes before state capture; hidden old controls become inert. Target product uses the purchase silhouette and existing header cart; configured no-dock pages never gain a fabricated dock. Pending controls are intentionally unavailable until commit or Escape/timeout restores the previous document. This is feedback cancellation, not cancellation of the browser's request.

One body-level viewport surface escapes old product transforms and router region replacement. ARIA/inert values, dock selection/style and account back nodes restore on cancellation/pageshow. Router success clears presentation before committing active dock state/focus; fallback leaves it until the native document arrives. No artificial minimum loading duration. Reduced motion disables pulse/snapshots; forced colors retains shape outlines. Never animate header or bottom-bar geometry, clone purchase controls, intercept Woo POST, or claim lower server TTFB from this package.

Acceptance owners: `document-continuity-browser.cjs` (native HTTP/history/POST), `shell-navigation-browser.cjs` (core boundary/races/fallback/lifecycle), `navigation-browser.cjs` (real PHP header + overlay/dock, 320–1440px), `dock-gesture.cjs` (pending collapse guard). Full WordPress core-router integration and physical-device acceptance remain separate from deterministic fixtures.



Navigation feedback (0.1.165 candidate): ordinary native browsing links render the existing static circle/line skeleton synchronously across eligible storefront documents, anchored to the viewport even after scrolling. Header and the existing bottom surface stay visible. Transactional, external, download, popup and core-router-owned links keep their original lifecycle. The core-router skeleton also starts synchronously with no 160ms delay or minimum display time. No new navigation/data owner. Native delayed-HTTP and core-router Chromium tests passed in run 40329604002. Full-suite acceptance remains pending after an unrelated WebKit mobile-gallery timeout; retry is running.

Account dashboard summary (0.1.164): Order summary heading and bag icon above a thin divider; centered empty-state copy without shopping CTA or all-orders duplicate. Existing single-column navigation remains ungrouped and has no Account actions heading. Populated summaries keep native order data and the View order action.

Account navigation (0.1.163): replace content in place without horizontal transitions. Immediate static circle-and-line skeleton follows the shared muted surface token; loading status is screen-reader-only. Header/dock remain visible and the back control updates synchronously.

## Account hierarchy and immediate document feedback — 0.1.161

Back controls name their parent destination at every width; current endpoint titles belong in main content. Order details return to Orders and address forms to Addresses. Information-page history labels and URLs update together only for a known previous title, otherwise retain the truthful Home fallback. The account hub uses one shared surface for the recent-order/empty card, single-column mobile destinations, and one desktop sidebar. Keep native hooks, query ownership and shared Button paint.

Native account GET links paint a main-only skeleton immediately; header/dock remain visible. No extra router/fetch/cache or form interception. Hidden old content is inert until pageshow, Escape or timeout restores it. This improves feedback while waiting and does not claim lower server response time. Supersedes the previous borderless single-column mobile hub presentation.

## Centered desktop menu capsule — 0.1.158

At 1100px and above, the assigned primary menu capsule is only as wide as its links and existing inline padding. Center it on the viewport using equal side tracks that reserve space for the left brand and right tools. Constrain long menus to the available middle track and keep native horizontal scrolling, keyboard reachability and browser popovers. Expanded inline search uses its existing wide grid. Shared UI Kit paint, 44px height and mobile navigation remain unchanged.

## Approved account hub and contextual header — 0.1.155

Use the existing native Woo account navigation as a borderless mobile hub, with recent order content first; endpoint pages return through the brand capsule. Desktop retains one sidebar. Reuse the shared font, surfaces and Button primitives. Header title and arrow occupy the same 44px brand capsule; ordinary information pages use their native titles, with a same-origin previous-page link and home fallback. Store/product/catalog retain the logo. Do not repeat a generated page title in the content. Merchant-authored headings remain unchanged.

Account navigation remains full-document Woo navigation. Native cross-document transitions move content in the hierarchy direction while the header/dock use their existing named layers. Respect reduced motion; no custom fetch/cache/router, no form interception. Native module links, notices, account permissions and logout nonces remain intact.



## Commerce consistency and first-paint geometry — 0.1.152

Native classic/block coupon and order review keep Woo handlers and fragment ownership. Shared components owns Button, field and native notice paint; checkout/account CSS owns arrangement. Unconfigured OAuth providers are absent from shopper UI; admin-only setup preserves the existing Google web OAuth flow. Do not claim configured Google acceptance without actual credentials/provider login.

Mobile menu is centered through native sublevels; redundant Search/Account text links below it are removed. Existing dock remains; no-dock compositions expose shared tool icons above the menu. Mobile photo frame reserve is CSS-owned before/after sheet mount, including optional urgency. Measurement only positions sheet annotations, never resizes photos. Desktop inline search has no whole-slot outline.

Guest account needs auth.js but no storefront controller graph. Closed cart still fetches its session count and publishes the badge immediately; render cached rows synchronously on open before revalidation. Never defer badge correctness or add a separate cart state. Journal CSS loads only in journal contexts. Compare actual lab samples, not invented speed percentages.

## Product cart and catalog feedback — 0.1.151

On mobile product pages the same native dialog/cart controller renders a compact header-adjacent cart. Hide the navigation dock there only. Preserve Escape, focus, body scroll restoration, API state, errors and checkout. Other mobile pages retain fullscreen cart. Catalog icons remain visible after Woo AJAX success; only the duplicate View cart link is hidden. Successful add banners are suppressed; validation/errors remain native.


## Responsive tools and journal — 0.1.150

At 901px+, move the one existing search section into the header slot; never duplicate its form, request controller or result IDs. It does not make the page inert or lock scrolling. Restore its original slot on close, navigation and breakpoint changes. Desktop cart is the one native dialog styled as a right drawer, with cancellable entrance/exit motion and reduced-motion handling. Modal focus and Woo API ownership stay intact; mobile remains fullscreen. Do not transform the mobile dialog because its real dock is fixed inside it.

Native desktop parent links and disclosure buttons stay adjacent and independently keyboard accessible, within one continuous pill selection. Header and mobile dock consume the same selection tint/radius; no active-link underline. Native popovers still own dismissal and nesting. Page-section horizontal galleries allow vertical scroll chaining; product gallery policy stays separate.

Journal is native inherited Query/Post Template/featured image/title/excerpt/read-more/pagination. Home/archives/single consume theme patterns and core blocks. No additional content store, fabricated posts, filters or JS router. Card paint is shared UI Kit; journal CSS owns layout/typography. Test long titles, missing images, narrow screens and bounded prose/code/table widths. Saved Site Editor templates and physical Android/Safari remain distinct acceptance checks.

## Page headings and category bands — 0.1.148 review

The standard page and checkout templates start with native post content, without an automatically inserted post-title block. Merchant-authored content headings, document titles and product/post/archive headings stay unchanged. Saved Site Editor template overrides need separate verification before deployment.

Category visual bands (variant C) use four columns from 1024px, two at 701–1023px, and the existing single full-width band at 700px and below. Additional cards wrap in their saved order. Multi-column captions stay in flow so long merchant copy grows the card instead of clipping. The existing section renderer and shared tokens remain authoritative; image slot sizes follow the layout.

## Manual0.1.148 package

Combines the approved account/desktop product contract and critical media delivery without changing merchant data or the native updater. Native Theme_Upgrader overwrite handles the uploaded single-root theme ZIP. A manual install does not publish a stable feed; do not offer an unpublished ZIP through the updater or claim remote CI/LCP success. Preserve this integrated source when reconciling older146/147 branches.

## Approved desktop product / 0.1.147 candidate

Keep one bounded native gallery + summary with a44–80px gutter; source images retain contain/no crop. Media height follows its own column, not the full viewport. Reserve the below-frame three circular controls before enhancement. Shared PHP IconButtons feed the existing gallery adapter's select/IO state. Product information spans both columns above native recommendations. Original enabled trust output lives in summary after contact on desktop; the existing mobile adapter moves/restores that exact node. Central components own the plain desktop purchase/rail/contact variant; mobile glass, native form/data/zoom and Woo card ownership remain. Do not fabricate trust items or change merchant media/settings to match a mockup.

## Compact signed-in account — 0.1.147 candidate

The approved account starts directly with native navigation and content. No visible page title, greeting or support lead-in. One Woo endpoint list becomes a no-script native disclosure on narrow screens and a sidebar on desktop; preserve all module destinations and nonce-bearing logout URLs. Overview uses one customer-bound latest-order query, real status/price/date, a native order-detail link and registered address/account shortcuts. Empty/deleted-product/multiple-item states must remain truthful. UI Kit owns CTA paint/foreground/focus/press; account CSS owns layout. No new browser script, independent form engine or duplicated plugin dashboard. Native navigation/dashboard hooks remain. Guest authentication and checkout are separate unchanged surfaces.


## Theme appearance and desktop layout — 0.1.145 (acceptance pending)

Use the plugin's existing Theme appearance mode for account. Native Woo navigation/forms/endpoints stay authoritative; independent Codela modules retain their hooks. The optional plugin standalone account layout/assets/fullscreen are not loaded. Do not duplicate its dashboard/controller or mutate saved preferences. Classic checkout owns only its native page composition; Codela checkout module cards/modals keep their current presentation. Product sticky belongs to the media slot inside the overview; the gallery retains native relative positioning. Mobile reuses/restores its original summary. Desktop primary menu exposes every native depth through browser popovers and excludes the hamburger while visible; narrow screens retain the existing dialog. Shared UI Kit owns buttons, native popovers own dismissal, and the existing dock controller only anchors them.


## Desktop composition — 0.1.143

At901px+ the original Woo gallery and summary share one bounded two-column grid; desktop photos use contain, mobile sheet ownership stays unchanged. At1100px+ the native primary menu top level is projected into a bounded, natively scrollable header slot using shared pressable links; the existing Menu exposes all nested destinations. Empty locations stay empty. The same filter dialog/form becomes a right panel at901px+, mobile remains full screen; shared controller owns focus, Escape and locking. No second menu configuration, catalog query, purchase form or cart engine.

## Native preview and responsive slots — 0.1.136

Mobile picture sources share the section's sizes contract with the img fallback. Preview asset decisions read the queried autosave instead of the published original. The editor previews the real WordPress draft document in mobile/desktop view; it never copies theme rendering or shopper assets. Product cold-load performance remains an open measured budget (3616ms median LCP); do not equate functional CI with performance acceptance.


## Page-owned sections — 0.1.135 (released; performance acceptance tracked separately)

One native block layout; variants only change composition. Reuse shared Button/IconButton, native Woo product grid, responsive attachment images and horizontal native gallery. Page CSS owns layout only. Hero text stays small over the photo; category choices: compact, editorial rows, bands, mosaic, carousel and grid. Promo choices: inset, split, editorial and banner. Editor JavaScript never reaches shoppers; page capabilities load the horizontal adapter only when needed. Products keep their own native gallery adapter and zoom dependencies. Only the first hero image gets high priority. Existing body lock/product dock geometry is unchanged.

## Managed homepage and overlay scroll contract — 0.1.134

Homepage sections use the same native horizontal gallery track and existing gallery adapter, shared Button/IconButton and native Woo product grid. No autoplay, cloned carousel, Woo zoom dependency on home or second catalog card. Theme schema declares fields; the plugin only validates/renders bounded generic rows. Legacy/static content is preserved until the sections mode is explicitly selected. Product-only bottom gap is12px including the same token for its overlay dock, plus safe-area once. Pause root snap and product discovery/visibility reactions while the existing overlay fixes the body; restore position before releasing the pause. Physical Safari remains distinct from browser fixture acceptance.


## Stable product sheet spacing —0.1.120

Keep identical collapsed heading metrics over photographs and recommendations; discovery still controls native scrolling but never compacts the header. Round only this sheet by shared control radius+8px. Grip top and purchase bottom insets are12px; CTA44px (max200px), qty44px input with existing44px step targets. Remove the chevron, preserving the real accessible70×44px grip toggle and direct dragging.

## Whole large glass panel —0.1.118

User correction targets the entire expandable panel background, not quantity controls. Reuse the common glass paint with sf-ui-surface--glass-panel and the shared panel-tint token (.78 alpha), preserving compact dock/header (.96), filter/shadow and opaque accessibility fallbacks. This intentional density adjustment makes the photo backdrop visible across the large area in both states. Do not claim alpha equality with compact controls or use computed CSS equality alone as physical visual acceptance.

## Quantity soft surface —0.1.117

The native mobile quantity capsule carries existing sf-ui-surface and participates in the same components glass selector group as dock/header/sheet, including accessibility fallbacks. Remove its independent product.css white fill; do not copy paint rules. Keep desktop unchanged. Matching CSS values alone does not prove identical perceived color over different photo backdrops; actual native quantity must be included in checks.

## Product sheet dock geometry —0.1.115

Use the existing dock inset/max-width/bottom-gap tokens for the same floating width in closed and open states. Retain the one shared components surface; the purchase inside remains transparent. Device safe-area is outside this floating sheet, counted once. The native site Footer remains at document end and never moves into expanded product content; reserve overlay space at its final links. Footer content after recommendations is real content, not empty tail padding.

## Product prepaint and touch grip —0.1.114

Do not sample a provisional viewport width in the head bootstrap; CSS owns the mobile breakpoint. Keep the prepaint guard until enhancement, parser completion or script failure, never a wall-clock expiry during loading. Freeze the visual sheet height when re-grabbed, tolerate8px jitter, disable text selection on its64px header (52px discovery), preserve deliberate button/keyboard presses and suppress only stale release clicks. Height-only browser chrome resizing cannot cancel a held gesture. Use true touch events and a pre-meta mobile context in regressions.

## Direct product sheet manipulation —0.1.112

Print the dependency-free adapter once through the WordPress queue beside the completed product template; do not wait for unrelated footer scripts or DOMContentLoaded. A small mobile prepaint guard prevents the transient native summary, fails open if enhancement fails, and never blocks no-JS purchase. Native gallery opacity is visible from first paint. Keep one title font across discovery and photos. Header pointer movement directly updates this same sheet height with no transition while held, original photo geometry untouched; release/cancel restores native expanded/closed states and clears capture/inline styles. No new controller, form, scroll or cart engine.

## Product sheet modules — 0.1.111

Collapsed mobile purchase contains no shipping message, progress or contact. Existing live ETA/shipping nodes move into one native Delivery and shipping disclosure inside the expanded information region; existing WhatsApp link is a separate row after information. No copied plugin data, extra form or new module instance. Mobile native information starts closed, desktop restores its original state/position. Native quantity receives shared quiet44px step buttons; min/max/step and Woo input/change stay authoritative. Purchase CTA is capped at220px where space permits, with natural shrinking at320px. Original gallery/snap/discovery geometry rules stay in place.

## Native recommendation tail — 0.1.110 correction

Live 0.1.109 measured 138px between the final product card and fixed purchase sheet. The 99px leftover section padding plus the native shared grid's 32px bottom margin were redundant. The mobile discovery section now reserves only the device's safe area and scopes a 0px bottom margin for existing `ul.products` inside `.related`/`.upsells`; the shared catalog margin is unchanged everywhere else. Preserve photo coordinates, scroll snap/overscroll rules, and the native purchase UI; live acceptance enforces a small positive final card-to-sheet gap.

## Native recommendation tail — 0.1.109

Use content-driven height for mobile recommendation groups, no forced `100svh` minimum and no last-child external margin. Keep only an inset derived from the cached normal purchase bar (minus 24px) to prevent the final card hiding behind the fixed compact sheet without producing a bottom whitespace strip. Retain existing native photo scroll snapping, discovery overscroll policy, photo geometry and Woo card markup. Live acceptance checks the last card against the fixed purchase panel.

## Recommendation boundary and previews —0.1.108

Selected previews add no outline; shared keyboard focus-visible remains. While the existing gallery is discovering recommendations, root and body overscroll-y:none suppress bottom boundary rubber-band. Photographs retain auto for native top refresh. Because the long recommendations snap to their heading under the root's mandatory photo snap, the root switches to `scroll-snap-type:none` only in `.woocommerce-product-gallery.is-discovering`, restoring `y mandatory` over photographs. The policy changes no photo frame coordinates, snap targets, padding or reserved panel space and adds no touch/wheel interception. Physical Safari gesture paint requires device acceptance.

## Inline product zoom and three previews —0.1.107 (live; functional acceptance tracked below)

The user approved removing the separate PhotoSwipe popup. Product PhotoSwipe support and enabled flag are off. The existing Woo jQuery Zoom plugin initializes only on the first user request inside the original photo node; the adapter adds no zoom/pan engine or modal. Tap/click, Enter/Space, Escape, natural document scroll, variation cleanup and aria-pressed belong to this small adapter. Touch scroll is never prevented. The dependency chooses registered wc-zoom or legacy zoom. Only up to three original preview controls are shown around the current index; hidden controls are absent from focus/AX. The total image counter and original gallery navigation remain intact. Cold original-image defer and0.1.106 stable photo/snap/discovery geometry remain the baseline. Deployment/acceptance is tracked in storefront-theme.md; older PhotoSwipe notes below describe prior versions.

## Product sheet composition — 0.1.106 (live; functional acceptance passed)

Since0.1.106 mobile photo frames use stable100lvh minus a cached normal panel inset. Negative scroll-margin-bottom (100svh - 100lvh) limits their snap area; root padding includes current/small viewport difference and the inset. Toolbar movement and panel compaction must never move the preceding photo coordinates. The normal inset is measured per width, discovery bottom reserve uses that stable normal height, and the track excludes scroll anchoring. Discovery state has55/65% hysteresis and one rAF per scroll; IO reconnects only on width changes. The native document remains the scroll owner with overscroll:auto; expanded details alone lock it. Physical Safari toolbar/pull-to-refresh is separate hardware acceptance. On mobile the original Woo gallery scrolls vertically; a persistent bottom sheet exposes native product information on demand. product-information.js only reparents the original nodes and restores exact comment anchors on desktop. The native form and all original fields/submit controls remain descendants of their original form. The shared surface owns sheet material; the purchase footer is transparent inside it. No second store/dialog/cart engine. Header dragging and a real shared Button both toggle the sheet, Escape closes, missing variation/native validity/hash targets expose their original content. Open content makes the gallery inert; global dialog/PhotoSwipe hide the sheet. Footer/legal links stay reachable inside details. Since 0.1.100 native related/upsell sections follow the last photo in the same mobile scroll track; they are excluded from sheet content and restored exactly on desktop. Discovery compacts the closed header to one title line; returning to photos restores its usual size. The toggle keeps a 44px target beside the title/price, removing the separate toggle row. Since0.1.101 discovery boundaries explicitly measure header border-box height, because default ResizeObserver content-box observations miss padding-only changes on short titles. Acceptance awaits the NEW smaller target and the animated height. Sheet and soft Button share the same components.css surface token and transparency fallbacks. Stockless products retain the existing navigation dock and have no fabricated purchase.

Native gallery scrolling replaces FlexSlider while retaining Woo image/variation ownership. Desktop is horizontal and mobile vertical. All frames retain uncropped woocommerce_single sources and intrinsic dimensions. On the cold path, uncropped medium previews keep the frame ratio; the existing adapter restores native responsive sources when selected/visible and prepares adjacent photos after browsing intent. Square thumbnails remain rail-only. Native document mandatory snap uses the stable0.1.106 large/small viewport geometry described above. Since0.1.107 PhotoSwipe is disabled, inline zoom uses only the existing Woo jQuery Zoom plugin on request, and the original preview controls form a three-item visible window. Without enhancement the original document/forms and image links remain usable. Historical FlexSlider/PhotoSwipe rules below describe earlier releases.

**Status:** Current shared architecture; theme source 0.1.107 (product information; deployment tracked in storefront-theme.md). Dated release notes below are historical. Use this before making any new
Header, dock, cart, search, account-login or storefront screen.

## Product growth module ownership — 0.1.98

On the single-product page the theme owns presentation of the six enabled growth modules. `inc/product.php` moves only registered known public render callbacks, preserving instance/settings/conditions and accepted arguments. No disabled module is instantiated. Seven default module stylesheet handles are removed at wp_print_styles; plugin REST, live cart/counter/countdown scripts remain owners of data. Other themes and cart/checkout retain default CSS.

Visitor uses the same shared floating surface (components.css) within native gallery, above the existing thumbnail rail. Stock/urgency sits beside price; delivery and the free-shipping host are compact unboxed summary content. The shipping track spans 100% of its content width with no icon-column inset. Trust promises are below all product information and before recommendations. WhatsApp uses the same soft IconButton material with the original escaped link/SVG; optional floating contact is retained above the purchase dock.

Woo filtered tab callbacks render in native disclosure sections through the small tabs.php override. No tab controller or second review form. Product hash links open their containing details. Native quantity/add-to-cart/variation/gallery and shared Header/dock behavior stay intact. Closed modules must leave no placeholder rows; empty-cart shipping shows its true threshold message, never fabricated progress. See storefront-theme.md for actual CI/deployment acceptance.

## Common page canvas — 0.1.97

`--sf-ui-page` follows the WordPress `base` palette (default #f8f7f4). Body, product/checkout/guest account page canvases, shared dialog and search/account views, footer and route-loading canvas consume this same token. `--sf-ui-surface` remains the separate white card/input surface. Do not use card white as a page background or add per-page canvas colours. Shared Header/dock glass and plugin-owned account interiors keep their own component material.

## One full-card native product-link hit area — 0.1.95

The existing `a.woocommerce-loop-product__link` still owns Woo image/title, product URL, and keyboard semantics. A transparent absolute `::after` layer spans the native `li.product` card, including price, footer whitespace, and out-of-stock cards; this is **one native anchor, not a click proxy/JS router/new nested link**. The actual Woo footer `a.button`, `.added_to_cart`, and any other interactive controls are positioned above the detail hit layer via one layout-only rule. Keep their Woo URL/AJAX/data/ARIA and keyboard operation. No new paint or event listeners. Plugin-owned account explicitly excluded. Browser acceptance probes actual pointer and touch hit targets across contexts/widths.

## Native Woo button display specificity — 0.1.94

On real WooCommerce the native `ul.products li.product a.button { display:inline-block }` declaration overrides the lower-specificity shared IconButton `display:inline-flex`. The 22px glyph aligns top-left inside the 44px button despite margin reset. Extend the ONE `components.css` shared IconButton selector group with `body:not(.codela-my-account-layout) .sf-content ul.products > li.product a.sf-ui-icon-button` so it wins native Woo specificity; this is not a new paint/control or per-page layout rule. Browser fixtures must include native Woo `a.button` display and assert the shared Header/card paint, geometry, glyph center and pressing.

## Native Woo image margin isolation — 0.1.93

The generic Woo loop selector `.woocommerce ul.products li.product a img` also matches SVG icon images nested in native catalog anchors. Its native `margin-bottom:1em` moves the glyph away from the center despite the common 44px IconButton target and 22px icon. The **existing** `.sf-ui-icon-button .sf-icon` declaration now resets `margin:0` and removes image baseline/flex effects; no catalog-page repaint or duplicated button geometry. The Chromium fixture includes Woo's native image rule, and the real WP/Woo Chromium+WebKit matrix must verify the glyph center before acceptance.

## Native catalog IconButton adapter —0.1.92

Header and native Woo catalog simple/variable actions share codela_sf_ui_icon_button_classes/content and the exact IconButton declaration groups. Native Woo anchors retain URL,AJAX,data,ARIA and translated screen-reader text. The content scope explicitly excludes Codela signed-in accounts. Native primary Button adapters exclude IconButton; grouped/external remain text Buttons. catalog.css has no pseudo-icon,icon sizing or duplicated control geometry; only card/grid placement. Native loading/added ::after occupies the shared glyph slot. No new JS. Five-width tests compare Header/card44px material,22px centered glyph and pressed scale.

## Catalog typography and surface refinement —0.1.91

Product names use the theme system sans-serif family (13px mobile/14px desktop,500 weight), prices16/17px500. Keep the single white card without a perimeter stroke and the subtle surface-muted footer rule. Native secondary Buttons also use existing sf-ui-surface; shared components declarations extend that material to theme-owned content, including reduced transparency/forced colors. Do not duplicate button paint in catalog.css. The90 native icon/44px/grid/wide-container architecture stays intact. No new JS or dependencies.

## Reference-faithful wide catalog —0.1.90 (live, verified)

The existing single Woo card now uses dark readable headings, a fine internal rule above the native price/action row, and a true round 44px action that renders the existing local shopping-bag SVG (simple products) or arrow-right SVG (variation choices) via ::before. Native Woo button/link markup, accessible link name, busy spinner and data/AJAX semantics are unchanged. No extra image layer, duplicate controls or JS. Stockless products do not expose fake purchase controls. Catalog containers are allowed up to 1360px with tighter mobile gutters; product/checkout and plugin-owned account layout remain independent.

## Integrated light catalog card —0.1.89 (live, verified)

One white 20px-radius card with only a hairline/shadow; square transparent contain media sits flush at the top, then the two-line title and native price/secondary Button share padded space inside the same card. The Button uses the existing shared paint, focus and interaction, with only pill geometry overridden. No second card color, dark panel, Woo template fork or new JavaScript. Out-of-stock and variable/product-type semantics remain native.

## Refined native catalog card —0.1.88

One native content-product.php remains the owner across all catalog contexts. inc/catalog.php moves the native price callback into a footer after Woo closes the product link (priority5); footer opens6, native add-to-cart stays10, closes99. Existing secondary Button classes are appended through Woo args without replacing its HTML/URL/AJAX/data/ARIA. Stale/out-of-stock actions disappear; stock badge remains. Simple Add and variable Options use translated core labels; external/grouped keep native wording. Signed-in Codela account bypasses adapters.

catalog.css composes1:1 contain images with transparent outer fill, small two-line titles and aligned native price/compact44px secondary action. The shared Button primitive now also scopes to theme sf-content outside sf-shell, explicitly excluding plugin-owned account; paint/state/a11y declarations are not copied. No fake swatches or new JS. Historical4:5 card ratio below is superseded for catalog cards only; product-gallery geometry stays unchanged.

## Single mobile control inside a desktop group —0.1.87

Use the existing soft IconButton for a tool that stands alone on mobile. The shared sf-ui-icon-group--single-mobile composition removes the group's material/border/padding at <=700px, leaving the same44px soft control as Menu. Above700px the group retains its material and the nested soft control becomes bare. Never retain group padding around one visible tool or paint two nested surfaces. This is a composition of existing primitives, not a second Cart button, page-specific paint or new interaction.

## Shared Header and native product cards —15 October2026

All mobile store headers anchor Logo left and Menu at the far right. Product purchase replaces the document dock; only Cart appears immediately before Menu. Without purchase, an enabled dock remains the cart entry. Checkout has the same anchors, no dock. Dock-disabled mode retains the existing tools before Menu. Desktop stays Menu/centered Logo/tools; guest auth retains its quiet header.

Woo product search uses the explicit templates/product-search-results.html override as well as the normal search.html renderer; Woo11 otherwise substitutes its own Product Collection template. Native Woo content-product.php is the card owner for home, shop, category, product search, related/upsell/cross-sell. catalog.css owns their one card/grid presentation; product.css owns only product-detail placement.4:5 contain image, two-line title, native price/sale/availability, shared Button;2/3/4 responsive columns. Product search keeps Woo toolbar/pagination; post/page search stays core Query. No new card JS/carousel/API. A single update changes every native card surface. Historical page-specific Header/card notes below are superseded.

## Current material — 14 October2026

Current shared floating surface: `rgba(247,247,249,.96)`, single background, no gradient; blur10px/saturate115%/contrast1/brightness1. Historical28% alpha/contrast-brightness notes below are superseded; do not add a second visible colour layer.

Native Woo controls under theme .sf-content use the existing shared Button presentation, excluding explicit quiet/secondary variants and body.codela-my-account-layout. Legacy global Woo button paint was removed in0.1.82; signed-in Codela account remains plugin-owned. [Current acceptance](acceptance/2026-10-14.md).

## One design, not one enormous universal widget

There are three distinct layers:

1. **Tokens** (`assets/styles/tokens.css`): semantic colour, spacing/hit targets, icons,
   radii, motion/easing. Theme-specific `--sf-ui-*` variables compose with the
   existing theme palette and the existing Codela appearance integration.
2. **Primitives** (`inc/ui.php` and `assets/styles/components.css`): one HTML
   contract, accessibility contract and pressed/focus/disabled presentation.
3. **Features** (`inc/render.php`, `assets/storefront.js`, `assets/storefront.css`):
   page layout and domain behavior only. Menu and cart API calls, tab selection,
   modal lifecycle and storefront routing belong here, not in a generic Button.

Dependencies load in this order: tokens → storefront layout → overlay → navigation →
shared components → guest account CSS (only on the My Account page).
Shared component styles take precedence over transitional page rules. The
account stylesheet is always scoped to guests or the vanilla Woo fallback;
Codela's authenticated account remains plugin-owned.

## Current primitives and contracts

| Primitive | Use | States | Semantics |
|---|---|---|---|
| `codela_sf_ui_icon_button()` | Header Menu/Ara/Sepet/Hesabım, popup X, search clear | bare/soft/clear, pressed, focus, disabled | `<a>` for links; `<button type=button>` for actions |
| `codela_sf_ui_button()` | Any primary/secondary/quiet action or link | pressed, focus, disabled, loading | Real `<button>` or `<a>`; type submit/button/reset |
| `codela_sf_ui_primary_link()` | Existing checkout / hero discovery | pressed, keyboard focus | Compatibility wrapper around the Button component |
| `.sf-ui-pressable` | Quantity +/−, cart removal, retry, submenu toggle | pressed/disabled/focus | Applied to existing semantic buttons |
| `.sf-ui-nav-tab` | Floating gesture-enabled mobile navigation | selected, pressing, scrubbing, collapsed | Existing `Navigation Controller` owns touch and page routing |

Rules: don't attach global `button` or `.woocommerce button` rules to the kit.
Never duplicate a semantic control's animation, icon size or hitbox in page CSS.
Feature-specific overrides must be strictly about layout or genuinely different
behavior. Add a documented variant when necessary, with a regression test.

The currently *intentional* distinct interactions are: native dialog focus
and close; the mobile dock's touch-and-scrub preview, scroll hide/reveal and
selected capsule; form field input/selection; and disabled cart actions.
Do not replace this entire specialized behavior with a generic tap animation.

## Reuse examples

```php
echo codela_sf_ui_icon_button(
    'x',
    __( 'Close', 'codela-storefront' ),
    [
        'variant' => 'soft',
        'class' => 'sf-close',
        'attributes' => [ 'data-wp-on--click' => 'actions.close' ],
    ]
);
echo codela_sf_ui_primary_link(
    wc_get_checkout_url(),
    __( 'Checkout', 'codela-storefront' )
);
echo codela_sf_ui_button(
    __( 'Save', 'codela-storefront' ),
    [ 'variant' => 'primary', 'type' => 'submit' ]
);
echo codela_sf_ui_button(
    __( 'Cancel', 'codela-storefront' ),
    [ 'variant' => 'secondary', 'disabled' => true ]
);
echo codela_sf_ui_button(
    __( 'Continue', 'codela-storefront' ),
    [ 'variant' => 'quiet', 'loading' => true ]
);
```

Allowed icon controls `bare` (default), `soft` (filled circular),
`clear` (small circular indicator). The icon is rendered by the existing
allowlisted `codela_sf_icon()`, accessible names are mandatory, attributes
are allowlisted and escaped and URLs pass through `esc_url()`.
The extra HTML argument is *internal trusted decoration only* (e.g. cart badge)
and must not contain user-generated markup.

The Button primitive accepts `href`, `type`, `variant`, `icon`,
`icon_position`, `class`, `attributes`, `disabled`, `loading`.
It sanitizes CSS classes, escapes content/attributes/URLs, disables real
buttons and makes a disabled link non-navigable. Loading sets `aria-busy`
and uses a CSS indicator that honours reduced motion.

No fake clicks: `<button>` for actions, `<a>` for navigation. Prefer
CSS `:active` for ordinary press feedback. No individual listener is needed
for normal buttons. The dock is a gesture controller, not an icon button.

## Theme vs plugin ownership

The theme owns Header, mobile dock, fullscreen Menu/Search/Cart overlays, guest
login presentation and the theme's storefront controls. The **Codela plugin**
owns the signed-in My Account dashboard, orders, addresses, shipments and
its module UI outside the explicitly theme-owned single-product growth adapter described above. Do not add `sf-ui-*` to Codela plugin content; do not rewrite
the Codela account using the theme's UI Kit. Plugin tokens
(`--cdl-ct-radius`, `--cdl-sf-*`) are integration inputs only where intended,
not a reason for global CSS overrides.

## Design tokens

Edit the tokens, not copied values in individual pages:

- `--sf-ui-hit` = 44px; icon size `--sf-ui-icon` = 22px
- `--sf-ui-icon-close` = 19px; clear glyph = 12px
- `--sf-ui-motion-press` = 140ms
- `--sf-ui-motion-selection` = 220ms
- `--sf-ui-motion-dock` = 480ms
- `--sf-ui-action-height` = 54px; corner radius honours `--cdl-ct-radius`
- `prefers-reduced-motion` disables component transitions

Do not equate pressed, selected, focused, loading and disabled states.
Each is independently verifiable; animations must not be required for
functionality or keyboard accessibility.

## Shared control feedback and material (0.1.52)

- Whole Button/pressable expands to 1.025; IconButton to 1.08. Engage is
  110ms; release is 360ms with a small elastic settling curve. Native `:active`
  drives ordinary controls; the browser owns touch activation timing. There
  is no delayed click, synthetic activation, timer or new event listener.
- Only transform transitions. Static gradients, inset light and 6px backdrop
  blur provide depth; blur, filter and shadow are not animated. Dark actions
  keep a 90% ink tint for readable white text; secondary controls keep 78%
  surface tint. Floating header and dock surfaces use the shared 22% light tint.
  Shared static contrast/brightness filters diffuse dark sampled content so
  the dark foreground retains contrast without an opaque white fill.
- Keep 44px IconButton and 54px default action hit/layout dimensions. Motion
  does not affect document flow. Existing compact size tokens remain valid.
- Reduced motion turns expansion off. Reduced transparency and unsupported
  backdrop filtering use opaque surfaces; forced colors keep native system
  colors. Disabled/busy controls cannot expand. Native Woo submit semantics
  and spinner pseudo-elements are preserved.
- Dock gesture/selected capsule and Menu/X glyph transformation remain owned
  by their existing controllers. No page-specific button animation or vendor
  names in source identifiers. F5 must extend these adapters, not duplicate them.
- Research references: [material interaction](https://developer.apple.com/videos/play/wwdc2025/219/)
  and [control scale/bounce](https://developer.apple.com/videos/play/wwdc2025/284/).
  This is a restrained web interpretation, not an implementation of native physics.
- `tests/ui-kit-browser.cjs` exercises real pointer, keyboard and touch
  activation, layout stability, settling, focus and accessibility preferences.
  Physical-device Safari feel and F6 cold/warm/GPU measurements remain open;
  CSS-only does not imply zero rendering cost.

## Floating surface correction (0.1.53)

- The physical-device screenshot exposed that 72% Header tint, 76% Dock tint
  and strong blur hid the backdrop too much. Header/soft IconButton and Dock
  now share the material in `components.css`; remove page-owned material copies.
- The whole Dock scales to 1.018 from its existing `is-pressing` state.
  CSS `scale` has independent engage/release timing; its collapse `transform`,
  stable parent hit slots, selected capsule and controller remain intact.
  Reduced motion sets the whole-dock scale to 1; opaque transparency and
  forced-color fallbacks apply to Dock through the same surface primitive.
- Browser navigation tests verify whole-surface expansion and cancellation
  as well as existing selection/scrub/collapse. Private CI references include
  actual Header/Dock over text and colors (`storefront-ui-kit-glass-*.png`),
  because a white background alone cannot demonstrate translucency.
- No new runtime script, listener, request or library. Physical Safari visual
  acceptance and measured rendering cost remain to be checked.

## Reference edge refinement (0.1.54)

- User references and the actual device screenshot showed the solid white
  perimeter and broad shadow made the floating controls look outlined.
  The shared glass border is now transparent (layout footprint unchanged).
  A half-pixel top/bottom light edge and a weaker diffuse shadow provide depth.
- Header, soft IconButton and Dock consume the same tokens. Do not add
  per-page border/shadow overrides. Keep form-secondary borders, keyboard
  focus outlines and forced-colors accessibility boundaries independent.
- Existing translucency, backdrop, press/release and dock gestures remain.
  UI/navigation browser checks verify the floating perimeter is transparent;
  private text/color backdrop references support visual review.

## Accepted material readability (0.1.55)

- User accepted the borderless appearance; preserve that design. Current
  shared floating material uses 28% tint and 8px static blur, slightly
  separating foreground from detailed images without making it opaque.
- `--sf-ui-glass-ink` is #1c1c1e. Dock labels use shared navigation typography
  tokens (11px, weight 600); all dock items inherit the same glass ink.
  Geometry, touch targets and gestures remain unchanged.
- Browser checks verify label size, weight, color and available slot width;
  private references place real fixed controls over text/color backgrounds.
  Test physical-device readability separately from automated source checks.

## Continuous Dock selection (0.1.56)

- Keep routing/gesture ownership in the one existing Dock controller. During
  scrubbing the capsule follows a fractional position across stable parent
  layout slots; icons do not move their hit targets. Preview/activation still
  chooses an actual item. Release settles to its center, including reselection.
- Direct finger tracking has no transform transition; taps, release and cancel
  use the existing selection transition. Opening/closing a popup remains instant.
- Reparenting into/out of a native modal resets CSS transitions. Carry the
  currently rendered capsule position in a temporary CSS variable, resolve it
  in the new layer, then remove that override next frame so CSS slides to the
  target. Cancel obsolete frame callbacks; reduced motion bypasses the carry.
- Browser regressions measure intermediate positions on modal open/return,
  continuous positions within the same item slot, release and cancellation;
  server-rendered initial selection must still appear directly with no hydration
  sweep. Existing gesture, ghost-click and scroll behavior stays authoritative.

## Cart composition (0.1.57)

- Cart list, feedback and summary inherit the dialog gutter. Item rows and
  summary content share a centered 780px maximum width; the checkout link
  participates in block layout so auto margins center it on wide screens.
- Keep quantity/removal controls at least 44px, aligned on one action row
  where space permits. Long names, variations and totals may wrap. An item
  without an image must not retain an empty thumbnail column.
- The list is the scroll container; the summary and existing dock clearance
  stay outside it. Keep shared Button/pressable paint and motion unchanged.
- Responsive browser coverage checks 320–1280px, long unbroken names,
  short-screen list scrolling and checkout/dock separation. Real Woo
  integration and physical-device acceptance remain separate gates.

## Cart image and light backdrop refinement (0.1.58)

- The cart image link stretches to the detail column height. Its image fills
  that box using contain, preserving the entire product and its aspect ratio.
  Shared neutral surface fills any letterboxing. Avoid a fixed image ratio
  that becomes shorter than quantity controls or long product content.
- Floating glass retains 28% tint and 8px blur. Brightness is 1.5 so sampled
  white remains white; stronger top light, lower edge and diffuse shadow
  separate the surface on white. Border remains transparent.
- Apply material changes through shared tokens, never cart/header/dock copies.
  Keep reduced-transparency/forced-color and motion behavior unchanged.
  Private visual references now include plain white and text/color backdrops.

## Reusable media presentation (0.1.60)

- inc/media.php and styles/gallery.css bind native Woo gallery markup and
  the standard core/gallery style sf-media-slider to one media surface.
  Woo keeps its carousel/variation/lightbox engine; core Gallery uses
  native scrolling and scroll snap. Never install a second engine on Woo.
- Product gallery spans the viewport behind the fixed header; native breadcrumb
  moves below the gallery before the title. Images use contain and an 82svh cap;
  preserve responsive sources and native loading.
- Core Gallery style is reusable in page content/templates, keyboard focusable,
  and registered with shared tokens for editor and frontend.
- Native Woo gallery trigger joins common IconButton declarations. Append
  separate selectors; raising specificity with :is() can break Menu/X placement.
- Read [the phased product plan](product-experience-plan.md) before purchase-bar
  or conversion-widget work. Existing Codela implementations own those behaviors.

## Contribution checklist

1. Locate an existing primitive *before* writing HTML/CSS/JS.
2. If it's the same behavior with different content, reuse the primitive.
3. If genuinely different appearance is needed, introduce a named variant
   centrally, with normal/pressed/focus/disabled coverage.
4. Keep public Codela account UI and plugin modules untouched.
5. Run PHP lint, `node tests/ui-kit.cjs`, search/cart/dock regressions, 15+
   Python package checks, Chromium navigation/login layouts.
6. Increment theme + CSS/JS versions, commit to this repo, confirm **both**
   GitHub Actions `validate` and `deploy` success before claiming live.
7. Manual mobile browser acceptance is separate from CI. Test dock touch,
   scroll animations, focus and safe area on device.

## Current follow-up (12 October 2026)

- Controller extraction and private CI UI Kit previews are already implemented; do not repeat them.
- F5: move the remaining generic Woo button paint into scoped shared adapters, preserving the parallel Button/IconButton work and plugin account ownership.
- F3 synchronization source was deployed in 0.1.51; real WP/Woo acceptance remains open (F3/F4).
- F6: measure cold/warm and interaction performance before changing asset loading or blur.
- Current state and deployment evidence live in AGENTS.md and docs/storefront-theme.md; dated notes below preserve prior decisions.

## Feature stylesheet isolation (0.1.25)

Overlay toolbar, close-focus, search input, product results and placeholder rows are maintained in `assets/styles/overlay.css`. The new load order is tokens → layout → overlay → navigation → shared controls → conditional account. UI behavior, popup routing and all legacy selectors remain unchanged; avoid introducing duplicate layout rules into the core sheet. No platform-specific product name belongs in new filenames, functions, classes, tests or comments: use technical behavior descriptions such as touch navigation, hold gesture, scroll collapse, and safe area.


## Storefront 0.1.26 — shared JavaScript format module

- The reusable HTML escape, HTML decode, URL safety and currency formatting functions are extracted from the storefront main module into `assets/scripts/format.js`. The main ES module imports their named exports. Function behavior and Store API search/cart logic are deliberately unchanged.
- Relative module import is browser-native; WordPress registers the entry module as before and packages the referenced local file. The browser integration fixture inlines the actual helper module when injecting a test-only WordPress API stub; it does not maintain a second copy.
- `tests/format.cjs` asserts escaping, protocol rejection and currency formatting. PHP/theme/package tests and JavaScript syntax checks cover the new dependency.
- Source naming is intentionally device/vendor/OS-neutral. Continue extracting modal/search/cart controllers in later guarded versions; maintain a single navigation state and preserve registered WordPress action semantics.
- Validation/deployment must be verified after this source release; test automation is not physical-device acceptance.


## 0.1.27 — Search and cart controllers

The main `assets/storefront.js` module is now the single owner of dialog
routing, WordPress Interactivity actions, modal focus, floating navigation,
scroll position and panel transitions. Independent feature controllers are
instantiated once with explicit dependencies (query selector, config, labels,
active view, dialog):

- `assets/scripts/search-controller.js`: input/debounce/clear, stale-result
  invalidation via request sequence, abort, skeleton, endpoint data, empty/error
  messages. Public API: `bind()`, `cancel()`, `start()`, `retry()`.
- `assets/scripts/cart-controller.js`: Store API nonce handling, GET/POST,
  quantity and remove mutations, retry, active footer, subtotal and cart badges,
  external cart invalidation events. Public API: `bind()`, `getData()`,
  `refresh()`, `change()`, `invalidate()`.
- `assets/scripts/format.js`: the same shared escaping, safe URL, decoding and
  currency formatting used by both feature controllers.

Every controller is created once. No duplicate dialog, dock or event listener
is added. Pending searches are aborted when leaving search; repeated cart GET
requests coalesce; nonce refresh and the original Store API integration remain
unchanged. The browser fixture runs the actual module sources and the existing
end-to-end search/cart/nav checks. The signed-in account UI remains plugin-owned.

Platform-neutral identifiers are mandatory. Keep the modal/dock ownership
unified while considering future extraction of the overlay controller; never
create parallel stores or second navigation listeners.


## Storefront 0.1.28 — Single overlay controller extraction

- `assets/scripts/overlay-controller.js` is the **one** owner of the active modal name, native `<dialog>`, initial focus, panel transitions, admin toolbar offsets, document scroll lock and exact scroll/focus restoration. The only exported factory is `createOverlayController()`; it is instantiated **once** by the main entry module.
- The entry module continues to own **one** floating navigation element and touch/scrub/scroll listeners. The overlay accesses navigation using callbacks `mountDock`, `restoreDock`, `setDockCollapsed`, `markDockActive`, `mobileDock`. Search and cart controllers keep their separate request/nonce states and ask the overlay for its active view and dialog, without parallel state.
- The controller exposes `bind()`, `open()`, `close()`, `animateContent()`, `getCurrent()`, and `getDialog()`. Menu nesting remains in the entry module and is reset via `onMenuOpen`; native `cancel`, keyboard focus clearing, and viewport offset updates are installed once in `bind()`.
- Regression fixtures load the **actual** overlay module alongside format/search/cart modules; no separate browser-only implementation. Component names remain platform-neutral. Signed-in Codela account UI remains plugin-owned.
- This source change is **pending validation/deployment** until GitHub Actions confirms both stages; manual mobile acceptance remains a separate check. Next: make a controller-level lifecycle regression for open/switch/close/focus if needed, then consider isolating navigation gestures while preserving one DOM element and event installation.


## 0.1.28 release verified — 11 October 2026

- Implementation: [441fdb5](https://github.com/muhammetdkaya/codela-storefront/commit/441fdb5dda012535781969ddd665e3512bc51c10); test-only contract corrections: [2b67742](https://github.com/muhammetdkaya/codela-storefront/commit/2b677425c7a5d34299fc271819d5219f663d65d5), [448d8fe](https://github.com/muhammetdkaya/codela-storefront/commit/448d8fe0763b2e61311e0d0bf28439e2ab26b325).
- [GitHub Actions 38151165256](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38151165256) finished with **validate success and standalone FTPS deploy success**. Native panel open/switch/close, focus restoration, dock touch/scroll/navigation, cart and search requests, compact UI rendering and account ownership passed the existing tests.
- `assets/scripts/overlay-controller.js` is the single owner of modal name and dialog lifecycle; `assets/storefront.js` keeps one dock node and one navigation gesture handler. The search/cart controllers remain independent; signed-in customer account remains owned by the Codela plugin. No platform-specific UI identity was introduced.
- Real mobile device acceptance of scroll/focus/touch remains pending; passing automated browser tests does not prove a physical device test. Next controlled task, if needed: isolate the dock gesture controller under an explicit lifecycle contract while preserving the single DOM node and current behavior, or expand controller-level tests before further changes.


## 0.1.29 — Mobile dock controller isolated (11 October 2026)

- Implementation commit [ff74ca8](https://github.com/muhammetdkaya/codela-storefront/commit/ff74ca82061ca18d3096bb23ae0093be5d1e5460); [GitHub Actions 38152743058](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38152743058) completed **validate success and independent Storefront deploy success**.
- `assets/scripts/dock-controller.js` now exclusively owns the **single existing** `.sf-mobile-dock` DOM element, dialog mount/restore, tab active indicator, scroll collapse/reveal, 240ms long-press, touch/pointer scrubbing, release navigation and ghost-click suppression. Its `init(dialog)` is idempotent; no duplicate listeners. Public methods: `init`, `mobileDock`, `setDockCollapsed`, `mountDock`, `restoreDock`, `markDockActive`, and shared `dockScrollPositions`.
- `assets/storefront.js` is the composition root for the one WP Interactivity store, search, cart, overlay and dock. The dock receives only callbacks to the overlay (`getDialog`, `getCurrent`, `open`); the overlay receives dock methods. There is no second active panel state and no duplicated navigation DOM. Main entry shrank from 15,005 to 5,263 bytes.
- `tests/dock-gesture.cjs` exercises the real extracted module and asserts one-time listener installation; the browser fixture uses the real dock, overlay, search and cart modules. `tests/package.py` validates the new module boundaries. No Codela plugin files changed.
- Automated tests are not physical iPhone/Safari acceptance. **Next:** verify on a real iPhone: home→search→cart switching, hold-and-scrub across tabs, down/up scroll collapse, reveal handle, keyboard focus, safe-area and checkout CTA. Fix only evidenced regressions, and keep design system/module ownership documented here.


## Storefront 0.1.30 — separated header surfaces and shared controls (11 October 2026)

- Header menu now uses the **same `sf-ui-icon-button--soft` variant** as both panel close controls; formerly the header was `bare` while X was `soft`. Both inherit the 44px hit target, 999px radius, press scaling, keyboard focus and reduced-motion contract from `assets/styles/components.css` and `assets/styles/tokens.css`.
- `assets/styles/navigation.css` composes three independent soft header surfaces: brand/logo pill, menu circle and (when dock is disabled or on desktop) one grouped search/cart/account tools pill. The full header bar is transparent, without the old divider. Surface, border and shadow use shared `--sf-ui-header-*` tokens, with blur fallback and reduced-transparency handling.
- Mobile dock enabled: preserve approved brand-left/menu-right order, with the menu/X hit target at the same coordinates; dock disabled: menu-left/brand-center/tools-right. Desktop retains centered brand. No new icon implementations or duplicated JavaScript handlers. The Codela plugin is untouched.
- Regression coverage: `tests/ui-kit.cjs` validates the common soft variant and surface tokens; `tests/navigation-browser.cjs` validates geometry, brand/menu shared surface, 44px hit target, transparent shell and pre-existing menu/X alignment across widths.
- Reference image is a visual direction rather than a dark-mode mandate: storefront uses its own light theme palette. Physical mobile-device review remains pending.


## Storefront 0.1.31 — Shared floating header surfaces (11 October 2026)

- The user reference calls for **separate** logo and menu surfaces rather than one filled header strip. Brand and optional desktop tool group use the `sf-ui-surface` primitive. Menu and dialog X use the **same** `sf-ui-icon-button--soft` variant: shared 44px hit target, 22px icon, pill radius, translucent graphite surface, white icon, elevation, press transform, keyboard focus and reduced-motion/transparency fallback. Search clear remains the intentional smaller `clear` variant.
- Source of truth: `assets/styles/tokens.css` owns glass color/border/shadow and control metrics; `assets/styles/components.css` owns shared paint and interaction; `assets/styles/navigation.css` owns **only header layout**, not separate menu paint. `assets/styles/overlay.css` must not reset common button chrome. Preserve custom logo visibility and high-contrast white brand text.
- Mobile with bottom navigation enabled retains logo left/menu right; desktop and bottom-navigation-disabled mobile retain their established layouts. No redundant header cart/search icons were introduced when the bottom dock is active. The reference screenshot is a visual inspiration, not a request to copy unrelated controls.
- Automated tests include comparing menu/X computed background, border radius, icon size and elevation across 320/390/700/1024px, UI Kit rendering, and existing navigation/overlay regressions. [Actions 38154258333](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38154258333): **validate success / standalone deploy success**. Implementation [eb83ea4](https://github.com/muhammetdkaya/codela-storefront/commit/eb83ea43ead07a0270956bb504addd5cc9d19e63), follow-up CSS/test fixes [2057f87](https://github.com/muhammetdkaya/codela-storefront/commit/2057f878735eeff4c933f4180cfc3e765b063e47), [6390cae](https://github.com/muhammetdkaya/codela-storefront/commit/6390cae3c950975d3e536fcdb39e66394c4198c7), [9dd80f1](https://github.com/muhammetdkaya/codela-storefront/commit/9dd80f1bb753348f5dc58ad348b77bfe02fba82a).
- Physical mobile browser acceptance remains pending. Future work: do not reintroduce per-page button styles; extend shared variants/tokens only when there is a real semantic distinction.


## Storefront 0.1.32 — fixed light header (11 October 2026)

- User request: home product hero reaches the top behind a fixed header; logo is vertically centered; logo/menu/X use light surfaces. This supersedes the 0.1.31 dark surface decision.
- Shared glass tokens now provide light translucent surfaces and dark controls. Custom logo colors are preserved; block image and centered flex link remove baseline misalignment. Header stays fixed during scrolling; its transparent empty area does not block content interaction.
- Home hero has no header spacer; text-led pages retain 76px/68px clearance. Existing overlay controller synchronizes fixed header position with visible WordPress toolbar height. Dock and plugin-owned account remain unchanged.
- Validation/deployment pending. Next: verify CI and independent deployment, then physical mobile acceptance of hero, logo alignment and fixed header.

## Storefront 0.1.33 — compact dock and menu motion (11 October 2026)

- Dock surface reduced by 6px, with 48px tab targets (above the 44px minimum); icon and label sizes unchanged. Shared menu glyph is a clean two-line 1.8px stroke.
- Menu opens with a 220ms surface fade and 260ms vertical content reveal; closes with a 180ms fade/lift before restoring scroll and focus. The dialog is never transformed. Reopening cancels pending closure; reduced-motion closes immediately. Search/cart behavior is unchanged.
- Validation and deployment pending. Next: confirm CI/FTPS release, then physical-device acceptance of compact dock and menu open/close.

## Storefront 0.1.34 — icon cache invalidation (11 October 2026)

- User still saw the old menu glyph after 0.1.33. SVG source was updated, but shared icon URLs lacked a cache version. Shared renderer now appends a content-derived CRC32 fingerprint, cached per icon within the request. All theme icons refresh when their bytes change; no manual browser cache clearing should be needed after fresh HTML loads.
- Browser fixture resolves the URL pathname separately from its query. UI Kit contract checks the fingerprint and two-line menu asset.
- Verified: [Actions 38156858978](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38156858978) validate and standalone deploy succeeded for `d9a3f2aecd09269abf36a9528c8f68d24c139031`. Initial validation caught a fingerprint path error, corrected before deployment. Next: confirm user's visible two-line menu after a fresh page load.

## Storefront 0.1.35 — single-position Menu/X (11 October 2026)

- The same real header menu IconButton is reparented to the native dialog's top layer at its measured viewport x/y. Menu uses two animated CSS strokes rotating to X (280ms); closing rotates back. Its previous duplicate close X is hidden only for Menu, while Search/Cart keep their controls.
- The header button is restored before focus returns; aria-expanded and accessible label track the actual state. Reduced-motion skips the transition. Styles still belong to shared navigation/UI Kit, not copied per page.
- Browser regression checks 320/390/700/1024px, DOM-node identity, the same x/y, reverse click, reopen and reduced motion. GitHub validation/deployment and real-device acceptance are separate milestones.

## Storefront 0.1.36 — current-page dock actions dismiss overlays (11 October 2026)

- Home and Account are document links; Search and Cart are overlays. If the current document already matches the tapped Home or Account tab (`aria-current="page"` from WordPress, including account subpages), dismiss the open overlay without navigation/reload. Reselecting the same tab without an overlay is a no-op; selecting a different page keeps full navigation.
- `dock-controller.js` owns both native click and hold/scrub release routing; it calls the existing overlay `close()` through an injected callback, never installs a second overlay listener or state. Existing scroll restoration, focus restoration, selected indicator, rapid Search/Cart switches and dock ghost-click handling are preserved.
- Tests: native tap, current-page reselect, swipe to Home, Home/Search and Home/Cart, Account subpage/Search and Account subpage/Cart, selected tab and same-document markers. Theme + JS/CSS versions 0.1.36. Validate, FTPS deploy and physical-device acceptance must be confirmed independently.

## Storefront 0.1.37 — compact logo and steady scroll navigation (11 October 2026)

- Fixed header logo pill horizontal padding reduced **18px → 8px** (mobile dock disabled: **10px → 7px**). The shared floating glass surface, custom logo colour, vertical centering, 44px minimum control height, menu/X position and responsive header layouts remain intact.
- Dock scroll state now needs **44px downward** or **28px upward** cumulative travel and at least **650ms between hide/reveal transitions**. If the rest interval has not elapsed, one deferred change is scheduled and genuine reverse movement (12px) cancels it. Scroll jitter does not continuously bounce the bar. When near the top, opening a panel, touching reveal handle or starting a dock gesture, pending changes are cancelled; keyboard/safe-area/scroll restoration remain unchanged.
- Only `dock-controller.js` owns the scroll state; no separate navigation listeners, page changes or reimplementation of the shared 480ms CSS motion. Node and rendered-browser tests cover dwell, cumulative scroll, reversals, stable top position and compact brand. Theme/CSS/JS versions raised to 0.1.37. GitHub Actions validation and independent Storefront deploy must be verified; real physical touch acceptance remains separate.

## Storefront 0.1.38 — guest sign-in composed from shared UI Kit (11 October 2026)

- Redesigned ONLY guest My Account login, optional Woo registration and native password reset presentation in `assets/styles/account.css`: centered, restrained layout, light outlined inputs/cards, mobile stacking, no heavy shadows or duplicated brand header. Woo renders and processes the original login/register/password reset forms: nonces, validation, redirects, hooks and third-party social-login inserts are left intact. Registration appears only if the existing Woo setting permits it; no fabricated social login buttons or custom auth endpoints.
- Reuse the **existing** semantic `sf-ui-button` primary control, including shared `--sf-ui-action-height`, `--sf-ui-control-radius`, color, pressed/disabled/reduced-motion rules. `assets/styles/components.css` targets native Woo guest submit buttons as an adapter to that same Button primitive: **no page-specific button appearance/hover/active design**. Existing Woo inputs use the existing UI Kit tokens and their existing markup. Account CSS only owns field placement, surface and responsive layout.
- `body.woocommerce-account:not(.logged-in):not(.codela-my-account-layout)` tightly scopes guest adapters. All logged-in Codela account/dashboard/navigation/orders remain plugin-owned; original vanilla Woo signed-in fallback is preserved. No Codela plugin code or core WooCommerce template override.
- Browser regression extends guest login and registration at 390/1280px, computed UI Kit Button style parity, mobile field sizes, no autofocus, registration layout, and absence of theme styles in the authenticated Codela dashboard. 0.1.38 theme/assets/cache versions. Verify Actions validation + independent FTPS deploy and inspect real mobile before user acceptance.

## Storefront 0.1.39 — reference-based LIGHT login page (11 October 2026)

- User's dark auth screenshot is a **layout reference**, not permission to use dark/orange/tan surfaces. Implemented the actual theme, never generated an image: neutral white/gray UI, black/charcoal shared primary Button, gray input fills, dark neutral text, no orange-like accent. Guest-only CSS variables override store accent locally; store design elsewhere remains unchanged.
- Guest account gets dedicated lightweight header from `inc/render.php`: live custom logo/brand at left, `Back to store` link at right, thin bottom divider. Standard header/menu, search/cart dialogs and mobile dock do not render on guest account pages. Logged-in user uses the original header and Codela-owned account.
- Native WooCommerce login/register/reset forms retain all real server functionality, nonce and hook slots. The intro reads "My account / Manage your orders and account details." Existing common `sf-ui-button` serves submit, while existing navigation/press classes serve segmented Log in/Register tabs. `auth.js` adds accessible tabs only when both native forms exist, with click/keyboard support; otherwise no tab. Without JS both forms remain available. No fake Apple/Google authentication: extension UI can render only when correctly configured by its actual integration.
- Updated `tr_TR.l10n.php` for the new English translation keys. Tests cover the dedicated guest header, no dock, neutral palette, native Woo forms, responsive layout, tabs and logged-in plugin isolation. 0.1.39 script/style package versions. Verify GitHub Actions validation, standalone Storefront FTPS deploy and real-device acceptance separately.

## Storefront 0.1.41 — no-plugin Google customer login (11 October 2026)

- Single theme-owned `inc/google-auth.php` module, no extra WP plugin, no Google SDK, no page-wide Google JavaScript. Only guest WooCommerce My Account page, once fully configured over HTTPS, shows **Google ile devam et** beneath a neutral “veya” divider; reuses the shared `sf-ui-button--secondary` component. No Apple option.
- Authentication: Google's OAuth 2.0 authorization-code flow + S256 PKCE, cryptographically random browser-bound state (`HttpOnly; Secure; SameSite=Lax` cookie + single-use 10-min server transient), Google's fixed TLS token exchange and UserInfo endpoints (email_verified + immutable sub). No refresh/access tokens persisted. Fail closed on network/configuration errors. Never send the client secret to browsers or GitHub.
- WooCommerce customer account only: resolve by stored provider `sub`; create customer if new; existing customer Gmail/Google-hosted mail may be bound if unbound, but **do not automatically link third-party, externally hosted emails** based only on Google's old verification. Deny admin, editor, shop manager and conflicting identities; use existing WP auth cookie, existing WooCommerce orders and Codela plugin-owned logged-in account.
- Setup under **Appearance → Google login** (WordPress admin): Google Cloud OAuth **Web application** Client ID and Client secret, exact callback URI shown in page. Credentials also support optional `CODELA_SF_GOOGLE_CLIENT_ID` / `CODELA_SF_GOOGLE_CLIENT_SECRET` constants in wp-config. Without credentials or site HTTPS, the button is omitted. OAuth user must register the site's authorized domain/redirect URI and publish Google consent screen as applicable. Do not paste secret into conversations or commit to repo. **Feature is coded but not live-operational until the site's actual Google credentials are entered.**
- PHP/Node security regression tests for verified user identity, existing links, customer isolation and no fake-button fallback; Google client not contacted except real initiation. CI validate and independent Storefront FTPS deploy still need to be verified, and Google end-to-end login will only be verifiable once credentials are configured.

## Storefront 0.1.42 — guest Account uses existing full-screen overlay (11 October 2026)

- The **one native Storefront dialog** now has a fourth view: `account`, alongside Menu, Search, and Cart. On **signed-out users**, both header Account IconButton and mobile dock Account tab open this view *immediately*, without navigation. Menu's secondary Account link switches the open dialog to the account view. Signed-in Account links remain ordinary WP/WooCommerce navigation to the existing Codela account dashboard. A plain Account URL fallback remains for JS-disabled clients.
- The account view renders the authentic `wc_get_template('myaccount/form-login.php')` WooCommerce login and conditional registration forms (real username/email/password, Woo nonces, real form handlers, forgot-password link). `codela_sf_account_intro` and Google OAuth provider Button are allowed in the explicitly delimited overlay render context. Submit form action is set to the genuine Woo My Account URL before submission. No iframe, separate authentication backend, fake login endpoint, new modal manager or Codela plugin changes.
- The existing `assets/scripts/overlay-controller.js` owns showModal/close, scroll and focus restoration, form and panel switching; `dock-controller.js` scrubbing includes the guest-only data-panel=account. Home from Account closes without reload, Search/Cart can switch instantly and dock selection follows `account`. Existing logged-in Page and cart/search UX untouched.
- Guest-only `account-overlay.css` supplies layout, Woo field controls and mobile safe-area spacing, while `components.css` maps native Woo submit to **the SAME shared UI Kit primary Button** (no new CTA style). Existing tiny `auth.js` handles optional Register tabs, loaded on guest pages. Google integration is reused rather than duplicated; Google Cloud credentials still required before button is shown.
- Tests: real PHP header guest/signed-in variants and real browser modal/dock gesture/close/section switch/form destination regressions; theme and assets 0.1.42. CI validate/standalone FTPS deploy must be checked. Physical iPhone Safari and production Woo login remain separate acceptance checks.

## Storefront 0.1.43 — minimalist guest authentication from existing UI Kit (11 October 2026)

- Keep real Google **secondary UI Kit Button** visible on guest login and guest Account dialog even before Cloud credentials are configured. When configured, it remains the existing safe OAuth link. When not configured, it is a `type=button` with **native HTML Popover API** (`popovertarget`) showing a brief localized “Google sign-in is not configured yet.” notice, dismissable by tapping elsewhere or Escape. No fake OAuth redirect, custom JavaScript, extra library, plugin, or new button/notification controller.
- Removed “Manage your orders and account details.” subtitle from `codela_sf_account_intro` at its source; popup hides its now-empty intro when Woo registration tabs are not available, the fallback My Account page keeps its title.
- Existing `components.css` is the **single shared adapter** for native Woo guest form fields in both Account page and fullscreen popup: actual `label[for]` moves **inside its input box** with an always-visible compact label line and typed value below; existing UI Kit height/radius/color tokens are used, no extra form HTML/JS. CSS grid over the real Woo login markup puts **Remember me** left and **Lost password** right on the **same row**, with existing shared primary UI Kit login submit below. Native Register form also inherits inset field labels and shared submit styles. Removed competing page/popup-only layout rules.
- Existing Woo validation, login/registration nonces, username/email/password semantics, toggle-password and reset links, and Codela's authenticated dashboard are unchanged. Chrome/browser/Node tests added for label geometry, aligned link row, Button parity, true/false Google configuration and native popover opening/dismissal. Version 0.1.43. Validate and independent theme deploy before announcing live; physical iPhone Safari acceptance remains to be checked.

## Storefront 0.1.44 — real iPhone guest Account screenshot polish (11 October 2026)

- The latest mobile screenshot revealed excess space between native modal header and segmented login/register tabs, generous input/control spacing and a faint or absent outline on the Google secondary button. Reuse the existing UI Kit, Woo forms and one native dialog. No generated image, invented button or Codela plugin changes.
- Guest-only account-overlay.css reduces panel top padding, removes redundant tab top margin, and compacts field and Google-divider vertical rhythm while keeping dock navigation unchanged. Common components.css keeps the 54px input-action token and the existing inset labels; Google secondary Button gets the identical existing CSS with an additional WooCommerce specificity bridge for the light border.
- Browser regressions check actual compact Account modal form start relative to toolbar, field height, and secondary Google Button border, palette and radius. Theme, CSS and JS versions 0.1.44. Validate in GitHub Actions and independent FTPS deploy before announcing live. Physical iPhone Safari acceptance remains user-side.

## Storefront 0.1.45 — compact guest login approved by user (11 October 2026)

- Implement approved minimalist Account dialog composition in the actual theme: guest Account header 23px, existing rounded Login/Register tabs 44px with lighter active elevation, real WooCommerce input fields remain 54px with inset static labels, vertical row gaps 12px, Remember me and password-reset native elements stay on the same row, and original UI Kit primary login/register and secondary Google Buttons target 52px with 15px typography. White/light-gray/charcoal only; no orange.
- Do not create per-page Button components, form HTML or new animations. Extend existing shared components.css Button with optional --sf-ui-button-height, --sf-ui-button-padding-y, --sf-ui-button-padding-x and --sf-ui-button-font-size tokens; originals remain unchanged where not overridden. Only guest Account dialog (account-overlay.css) and fallback guest My Account layout (account.css) supply compact overrides; signed-in Codela account, Menu/Search/Cart, common header/dock, Google OAuth verification, native Google setup notice and actual Woo login/register/reset backend are unchanged.
- Browser regression checks added for 44px tabs, 52px shared CTA and Google, 54px inputs, 23px popup title, input label inside field, compact toolbar spacing and account login/registration behavior; package/enqueues theme version 0.1.45. CI validation and independent FTPS deploy must be confirmed; real physical iPhone Safari acceptance is separate.

## 0.1.47 — Shared cart badge and composed cart screen

- The existing cart controller initializes via an uncached Woo Store API
  session read on every normal Storefront page. Cached HTML stays session
  independent. The same invalidation path handles Woo add/remove and BFCache.
- Header and dock use one `sf-ui-icon-badged` glyph-relative adornment with
  centralized `components.css` badge geometry.
- Cart rows and footer change only page composition and typography.
  Checkout remains `sf-ui-button--primary`; quantity is `sf-ui-pressable`.
  Woo totals, stock limits, taxes and plugin Account remain authoritative.
- Browser checks cover off-cart counts, other pages, event updates, badge
  position and full-width checkout. [Actions 38173704424](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38173704424) passed both validate and standalone deployment for `e0be1f9`. Physical iPhone/Safari acceptance remains separate.

## 0.1.48 — WooCommerce Checkout composition

- The WooCommerce-specific `page-checkout` template takes precedence over generic
  `page.html`. Supply theme-owned `templates/page-checkout.html`, with the
  **same** Header/Footer parts and Woo `page-content-wrapper` + `post-content`
  (do not embed a checkout block or rewrite native payment processing).
  The `checkout-header` part references the original header for Woo fallback.
- No mobile dock during checkout, via the existing `is_checkout()` behavior.
  Checkout form remains a full page, never a modal.
- Enqueue `styles/checkout.css` only on checkout. It composes layout and
  existing tokens for Woo's block/classic native form and order summary.
  Append native Place Order selectors to **shared** Button component rules in
  `components.css`; normal, pressed, disabled and focus states remain common.
- Real PHP header fixture and browser tests cover 320–1360px. A Site Editor
  database-customized Woo checkout template can override theme files; do
  not overwrite customized templates without inspection or user confirmation.
- [GitHub Actions 38174815133](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38174815133) passed validate (PHP, JS, browser layout) and independent theme deploy for source `2d45345`. Actual Safari/checkout gateway testing remains outstanding; automation does not prove a real order placement.

## 0.1.49 — Shared Header composition with Checkout

- A checkout page has no mobile dock (intentional). It nevertheless uses
  precisely the mobile compact Header layout from ordinary dock-enabled pages:
  logo left and Menu on the right. This is a **mode**, not a second header.
- In `codela_sf_header()`, the checkout-only `has-checkout-header` mode is
  selected when `is_checkout()` is true and the existing `has-mobile-dock`
  mode is false; both modes share the **same** mobile header selector rules in
  `navigation.css`. No new logo, menu, icons, buttons, or overlay controllers.
- On desktop, normal header search/cart/account tools remain available;
  manually disabling the mobile dock on other pages continues to show its
  existing alternate layout.
- Checkout browser regression compares Home and Checkout **computed header
  geometry** at 320, 390, 700, 1024 and 1360px, including icon visibility.
  Woo checkout native markup and gateway mechanics remain untouched.
- [GitHub Actions 38202574916](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38202574916) verified both browser tests and independent FTPS deployment at `c015e9c`. Physical Safari acceptance still required.


## Product detail adapter (0.1.59)

The product screen uses the existing WooCommerce legacy single-product template
rather than replacing its hooks or request lifecycle. `assets/styles/product.css`
owns only the gallery/summary composition, variations/quantity **layout**,
description tabs, and related-products responsive grid, scoped to
`body.single-product`. It is enqueued only when `is_product()`.

The native WooCommerce `single_add_to_cart_button` is added to the shared
Button selector groups in `assets/styles/components.css`, including primary
appearance, focus, pressed, disabled and accessibility fallbacks. Product CSS
may change its width and size tokens but must not clone button paint or
animations. The product form keeps native variation switching, stock checks,
validation, third-party hooks and WooCommerce add-to-cart submission.
Gallery zoom/lightbox/slider come from registered WooCommerce supports; no
new runtime, AJAX request or product-price calculation is introduced.

Checkout and authenticated Codela account are outside this selector scope.
A Site Editor override of the product template may require separate acceptance;
the bundled default targets the native legacy template.

## Gallery navigation — 0.1.62

The native Woo thumbnail list adapts to the reusable `.sf-ui-gallery-nav` layout: content-sized floating rail at the gallery bottom, with space for the separate lightbox target. Shared surface paint, transparency preferences and forced colors stay in components.css; gallery.css owns geometry and native `.flex-active` selection. Mobile cells are 54px with at least 44px usable image target; wide-screen cells are 56px. Overflow scrolls horizontally, single-image rails hide. Keep previews recognizable and do not replace the Woo track, variation updates, thumbnail activation or lightbox with another carousel. The core Gallery block retains its own native scroll adapter; it does not gain a duplicated thumbnail strip in this release.

Native Woo thumbnail adapter uses `div.sf-ui-gallery` specificity so Woo `div.images` spacing does not override the rail. This is verified with the native padding rule in the regression fixture.

### Gallery refinement — 0.1.67

The image link opens the native Woo lightbox; the optional native magnifier is hidden by the gallery CSS adapter. Woo retains its zoom configuration; the live site kept zoom_enabled=1 despite the filter, so that ineffective filter was removed. PHP labels the existing image link for keyboard/screen-reader access. The rail no longer reserves space for a separate control: equal insets, clear previews, rounded cells and a 1px active outline. Sale badges on the main product use the existing floating-surface material and accessibility fallbacks, with compact placement in product.css. No new gallery runtime.

Native thumbnail image selectors include `li img` so Woo 11.2.1 opacity rules cannot fade unselected previews. The browser fixture includes the native rule and verifies all previews remain opacity=1.

### Native product purchase surface — 0.1.67

Woo before/after add-to-cart-button hooks wrap its original quantity and submit inside the existing form. `sf-product-purchase` uses common floating material in components.css, while product.css owns layout. On <=700px it replaces the document dock at the bottom; desktop remains inline. The single dock still moves into the native dialog, where it is available; the document purchase hides while that dialog or the Woo lightbox is open. No clone/proxy/new purchase runtime. Header tools use the existing non-dock layout. A product without the wrapper retains its dock.

### Shared bottom-bar geometry — 0.1.68

Navigation and mobile purchase share `sf-ui-bottom-bar-*` tokens: height 58px, inner controls 48px, padding 4px, maximum width 430px, side inset 16px, bottom gap 12px plus safe area. Geometry belongs to tokens; product and navigation compositions consume it. The purchase remains the original Woo quantity/submit inside its form.

### Native product information — 0.1.69

SKU/category/tags use Woo's existing metadata template inside the native Additional information action, alongside attributes/weight/dimensions. A missing native tab is added with Woo's existing callback; an existing callback is preserved. General stock markup is rendered there; Woo variation availability HTML bypasses the placement filter so live selection remains informative. No separate tab system, data calculation or runtime is introduced.

### Lower shared baseline — 0.1.70

The common bottom-bar gap is 4px (previously 12px), plus the full safe-area inset. Navigation, popup navigation and native product purchase consume the same token; height/width/hit targets stay as defined by the shared geometry. Physical mobile browser toolbar acceptance remains open.

### Single subtle glass edge — 0.1.71

Shared glass uses a soft outer shadow and one half-pixel white inset highlight at 35% opacity. The dark lower inset is removed; static and pressed white gradients are softer. This avoids a second perimeter/raised-rim appearance across header islands and other shared floating surfaces. Material/contrast, focus and press behavior remain in the shared primitives; never add an independent header surface or paint a nested logo/link background to reproduce this material.

## Single-surface light backdrop separation (0.1.72)

Floating controls retain one shared tint and transparent perimeter. Use one diffuse outer shadow (0 3px 12px at 10% black), with no inset edge; backdrop brightness is 1.42. Do not add a second fill, nested frame, or page-specific material to improve visibility. Geometry, press states and accessibility fallbacks remain unchanged.


## Product enlargement ownership (0.1.77)

The product image link opens native Woo PhotoSwipe directly. Disable inline zoom on the product document with the native zoom-enabled filter at priority 100: ClassicTemplate forces it on at priority 10, and its touch click handler intercepts the lightbox link. Other contexts keep their own setting. This supersedes the 0.1.65 note about retaining product inline zoom. Native slider, variation updates and fullscreen zoom remain owned by Woo; do not add a second gallery engine.



