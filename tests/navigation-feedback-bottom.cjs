// Shared DOM ownership contract. Run inside a browser with navigation-feedback
// loaded, or a reflection-only jsdom harness. Layout, actual input suppression,
// image animation and native document replacement need the browser suite.
// Optional window.__feedbackContractResize(width) lets the runner resize its
// real viewport (jsdom explicitly supplies a matchMedia/geometry simulation).
module.exports = async function checkNativeBottomFeedback() {
 const feedback = window.codelaSFFeedback;
 if (!feedback) throw new Error('navigation-feedback.js must be loaded first');
 feedback.end();
 const results = [];
 const check = (condition, message) => { if (!condition) throw new Error(message); results.push(message); };
 // CSSOM may normalize whitespace when the owned offset property is removed.
 // Compare CSS declarations/priority, not serialization bytes; all other
 // attributes retain their exact values, including unusual inert/ARIA values.
 const attrs = node => JSON.stringify([...node.attributes].map(a => [a.name, a.name === 'style' ? Array.from(node.style).map(name => [name, node.style.getPropertyValue(name), node.style.getPropertyPriority(name)]).sort() : a.value]).sort());
 const tick = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
 const savedNodes = [...document.body.childNodes];
 const savedBody = [...document.body.attributes].map(a => [a.name, a.value]);
 const savedHtml = [...document.documentElement.attributes].map(a => [a.name, a.value]);
 const savedWidth = innerWidth;
 const savedUrl = location.href, savedHistoryState = history.state;
 const restoreAttributes = (node, values) => {
  [...node.attributes].forEach(a => node.removeAttribute(a.name));
  values.forEach(([name, value]) => node.setAttribute(name, value));
 };
 const resize = window.__feedbackContractResize;
 let fixture;
 function setup({product = true, panel = 'sheet', dock = true, purchase = true} = {}) {
  feedback.end();
  document.documentElement.classList.toggle('sf-product-sheet-pending', product && panel === 'summary');
  document.body.className = product ? 'single-product' + (panel === 'sheet' ? ' sf-product-sheet-ready' : '') : 'page';
  const cart = purchase ? '<form id="contract-cart" class="cart" method="post"><select name="attribute_color"><option value="cream" selected>Cream</option></select><input type="hidden" name="variation_id" value="123"><div class="sf-product-purchase" style="position:fixed"><input class="qty" name="quantity" type="number" value="3"><button type="submit" name="add-to-cart" value="42">Buy source product</button></div></form>' : '<p class="stock">Unavailable</p>';
  const summary = '<div class="summary" aria-label="Merchant summary"' + (panel === 'summary' ? ' style="position:fixed"' : '') + '><h1 class="product_title">Source product</h1><p class="price">3490</p>' + cart + '</div>';
  const productContent = panel === 'sheet' ? '<section class="sf-product-sheet has-purchase is-expanded" aria-label="Merchant purchase" style="position:fixed;--merchant-color:blue"><header class="sf-product-sheet-header"><button type="button" aria-expanded="true">Details</button></header><div class="sf-product-sheet-body">' + summary + '</div></section>' : panel === 'summary' ? '<div class="sf-product-overview">' + summary + '</div>' : summary;
  document.body.innerHTML = '<div class="sf-shell has-mobile-dock"><header class="sf-header"><a href="/">Brand</a></header>' + (dock ? '<nav class="sf-mobile-dock has-selection is-collapsed" hidden aria-busy="false" style="--sf-dock-index:3;--merchant-color:red"><a data-dock-view="home" href="/">Home</a><a data-dock-view="account" class="is-active merchant-active" aria-current="page" href="/account/">Account</a></nav>' : '') + '</div><main id="sf-content" aria-busy="false"><a id="contract-link" data-sf-skeleton="product" href="/product/new/">New product</a>' + (product ? '<div class="product">' + productContent + '</div>' : '<p>Ordinary source content</p>') + '</main>';
  fixture = {
   main: document.querySelector('main'), link: document.querySelector('#contract-link'),
   dock: document.querySelector('.sf-mobile-dock'), form: document.querySelector('#contract-cart'),
   root: document.querySelector('.sf-product-sheet') || document.querySelector('.sf-product-overview > .summary') || document.querySelector('.sf-product-purchase'),
   product: document.querySelector('div.product'),
  };
  return fixture;
 }
 const start = (type = 'product', owner = 'document') => {
  fixture.link.dataset.sfSkeleton = type;
  return feedback.begin({url:fixture.link.href, link:fixture.link, owner});
 };
 const submit = form => form.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
 const swap = () => {
  let skipped = 0;
  const event = new Event('pageswap');
  Object.defineProperty(event, 'viewTransition', {value:{skipTransition(){ skipped++; }}});
  window.dispatchEvent(event);
  return skipped;
 };
 try {
  feedback.end();
  if (resize) await resize(390);
  check(matchMedia('(max-width:700px)').matches, 'Contract begins in a mobile viewport');
  for (const target of ['product', 'page']) {
   const f = setup();
   const originalRoot = attrs(f.root), originalDock = attrs(f.dock), originalMain = attrs(f.main);
   const form = f.form, quantity = form.querySelector('[name="quantity"]'), button = form.querySelector('button');
   const token = start(target);
   check(feedback.active(token) && document.documentElement.dataset.sfNavigationBottom === 'product', target + ' target retains source product bottom');
   check(document.querySelector('[data-sf-feedback-bottom]') === f.root && document.querySelector('#contract-cart') === form, target + ' target preserves native panel/form identities');
   check(f.root.inert && f.root.getAttribute('aria-busy') === 'true' && f.root.getAttribute('aria-disabled') === 'true' && f.dock.hidden, target + ' target marks one native bottom busy and inert');
   check(form.querySelector('[name="quantity"]') === quantity && quantity.value === '3' && form.querySelector('[name="attribute_color"]').value === 'cream' && !button.disabled, target + ' target leaves native commerce controls and values intact');
   check(document.querySelectorAll('form.cart').length === 1 && document.querySelectorAll('.sf-mobile-dock').length === 1 && !document.querySelector('.sf-skeleton-purchase,.sf-skeleton-summary'), target + ' target creates no duplicate form/dock or fake purchase data');
   check(!submit(form), target + ' target rejects a stale outgoing native submit');
   check(swap() === 1, target + ' target skips stale-price View Transition snapshots');
   check(feedback.end(token) && attrs(f.root) === originalRoot && attrs(f.dock) === originalDock && attrs(f.main) === originalMain, target + ' completion restores exact native attributes');
   check(submit(form) && swap() === 0, target + ' completion removes temporary submit/snapshot guards');
  }
  for (const owner of ['document', 'router']) {
   const f = setup({product:false});
   const before = attrs(f.dock), nativeLink = f.dock.lastElementChild;
   const token = start('product', owner);
   check(document.documentElement.dataset.sfNavigationBottom === 'dock' && !f.dock.hidden && f.dock.inert && f.dock.getAttribute('aria-busy') === 'true', owner + ' normal-to-product keeps the real busy dock until target data arrives');
   check(!document.querySelector('[data-sf-feedback-bottom],form.cart') && f.dock.lastElementChild === nativeLink, owner + ' normal-to-product fabricates no target product panel');
   check(swap() === 0, owner + ' ordinary dock does not skip unrelated View Transitions');
   feedback.end(token);
   check(attrs(f.dock) === before, owner + ' restores hidden/style/selection/ARIA exactly');
  }
  setup({product:false, dock:false});
  start();
  check(document.documentElement.dataset.sfNavigationBottom === 'none' && !document.querySelector('.sf-mobile-dock,[data-sf-feedback-bottom]'), 'Configured dock absence never creates a substitute');
  feedback.end();
  setup({purchase:false});
  start();
  check(document.documentElement.dataset.sfNavigationBottom === 'dock' && !fixture.dock.hidden, 'Product without purchase controls falls back to the existing dock');
  feedback.end();
  for (const panel of ['summary', 'bare']) {
   const f = setup({panel});
   const before = attrs(f.root);
   const token = start();
   check(document.querySelector('[data-sf-feedback-bottom]') === f.root && !submit(f.form), panel + ' native first-paint purchase is retained and guarded');
   feedback.end(token);
   check(attrs(f.root) === before && submit(f.form), panel + ' native first-paint cleanup restores attributes and submit');
  }
  {
   const f = setup();
   f.root.setAttribute('inert', 'merchant');
   f.root.setAttribute('aria-busy', 'merchant-busy');
   f.root.setAttribute('aria-disabled', 'false');
   f.root.setAttribute('data-sf-feedback-bottom', 'merchant-marker');
   const before = attrs(f.root);
   feedback.end(start());
   check(attrs(f.root) === before, 'Pre-existing inert/busy/disabled/marker/style values restore exactly');
  }
  {
   const f = setup();
   f.root.style.setProperty('--sf-feedback-bottom-offset', '17px', 'important');
   const prioritySupported = f.root.style.getPropertyPriority('--sf-feedback-bottom-offset') === 'important';
   const token = start();
   f.root.style.setProperty('--sf-product-closed-height', '177px');
   feedback.end(token);
   check(f.root.style.getPropertyValue('--sf-feedback-bottom-offset') === '17px', 'Original owned CSS offset value restores');
   if (prioritySupported) check(f.root.style.getPropertyPriority('--sf-feedback-bottom-offset') === 'important', 'Original owned CSS offset priority restores');
   else results.push('SKIPPED custom-property priority: harness CSSOM does not support it');
   check(f.root.style.getPropertyValue('--sf-product-closed-height') === '177px', 'Cleanup preserves native measurements changed during pending');
  }
  for (const [property, value] of [['transform','translateZ(0)'], ['contain','paint'], ['willChange','transform'], ['isolation','isolate'], ['zIndex','1'], ['opacity','0.9']]) {
   const f = setup();
   if (property === 'zIndex') f.main.style.position = 'relative';
   f.main.style[property] = value;
   const token = start();
   check(document.documentElement.dataset.sfNavigationBottom === 'dock' && !f.dock.hidden && !f.root.hasAttribute('data-sf-feedback-bottom'), property + ' containing block safely falls back to the existing dock');
   feedback.end(token);
  }
  {
   const f = setup();
   const before = attrs(f.root), dockBefore = attrs(f.dock);
   const old = start('product', 'router'), current = start('page');
   check(!feedback.end(old) && feedback.active(current) && f.root.inert && !submit(f.form), 'Stale completion cannot unlock a newer native bottom');
   feedback.end(current);
   check(attrs(f.root) === before && attrs(f.dock) === dockBefore, 'Repeated begin/end has no accumulated attributes');
   start();
   document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}));
   check(attrs(f.root) === before && attrs(f.dock) === dockBefore && document.activeElement === f.link && submit(f.form), 'Escape restores exact state, focus and native submit');
   for (const persisted of [true, false]) {
    start();
    window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted}));
    check(attrs(f.root) === before && !document.querySelector('.sf-skeleton,[data-sf-navigation-bottom]') && submit(f.form), (persisted ? 'History' : 'Native fallback') + ' pageshow clears owned feedback');
   }
   let expire;
   const timer = window.setTimeout;
   try {
    window.setTimeout = (callback, ms, ...args) => ms === 10000 ? (expire = callback, 0) : timer(callback, ms, ...args);
    start();
   } finally { window.setTimeout = timer; }
   check(typeof expire === 'function', 'Bounded timeout cleanup is registered');
   expire();
   check(attrs(f.root) === before && attrs(f.dock) === dockBefore && submit(f.form), 'Timeout restores exact bottom state and native submit');
  }
  {
   const f = setup({panel:'summary'}), summary = f.root;
   const summaryBefore = attrs(summary), form = f.form;
   const token = start();
   const sheet = document.createElement('section');
   sheet.className = 'sf-product-sheet has-purchase';
   sheet.style.position = 'fixed';
   sheet.setAttribute('aria-label', 'Late native sheet');
   sheet.innerHTML = '<header class="sf-product-sheet-header"></header><div class="sf-product-sheet-body"></div>';
   sheet.querySelector('header').append(summary.querySelector('.product_title'), summary.querySelector('.price'));
   sheet.lastElementChild.append(summary);
   f.product.append(sheet);
   document.body.classList.add('sf-product-sheet-ready');
   document.documentElement.classList.remove('sf-product-sheet-pending');
   const sheetBefore = attrs(sheet);
   await tick();
   check(document.querySelector('[data-sf-feedback-bottom]') === sheet && !summary.hasAttribute('data-sf-feedback-bottom') && attrs(summary) === summaryBefore, 'Late native sheet mount transfers marker and restores old root');
   check(document.querySelector('#contract-cart') === form && !submit(form) && sheet.inert, 'Late mount preserves form identity and stale-submit protection');
   if (resize) {
    await resize(901); await tick();
    check(!document.querySelector('[data-sf-feedback-bottom]') && attrs(sheet) === sheetBefore, 'Desktop breakpoint releases temporary product-panel attributes');
    await resize(390); await tick();
    check(document.querySelector('[data-sf-feedback-bottom]') === sheet && fixture.dock.hidden && !submit(form), 'Returning to mobile reacquires the same native panel');
   } else results.push('SKIPPED real breakpoint resize: runner hook unavailable');
   feedback.end(token);
   check(attrs(sheet) === sheetBefore && attrs(summary) === summaryBefore && submit(form), 'Late-mounted native panel restores without moving or cloning controls');
   const extra = document.createElement('span'); sheet.append(extra);
   window.dispatchEvent(new Event('resize')); await tick();
   check(!sheet.hasAttribute('data-sf-feedback-bottom') && !document.documentElement.hasAttribute('data-sf-navigation-bottom') && !document.querySelector('.sf-skeleton'), 'Ended observers/queued frames cannot resurrect bottom feedback');
  }
  for (const ordering of ['replacement-first', 'commit-first']) {
   const f = setup(), originalRoot = attrs(f.root), originalForm = f.form;
   const token = start('product', 'router');
   const incoming = document.createElement('main');
   incoming.id = 'sf-content';
   incoming.innerHTML = '<div class="product"><section class="sf-product-sheet has-purchase" style="position:fixed"><h1>Committed product</h1><p class="price">87</p><form id="committed-cart" class="cart"><div class="sf-product-purchase" style="position:fixed"><input name="quantity" value="1"><button type="submit" name="add-to-cart" value="87">Buy committed product</button></div></form></section></div>';
   const incomingPanel = incoming.querySelector('.sf-product-sheet');
   const incomingBefore = attrs(incomingPanel), incomingForm = incoming.querySelector('form');
   const commit = () => {
    check(/^https?:$/.test(location.protocol), ordering + ' commit test uses an actual same-origin document');
    history.pushState({nativeBottomContract:ordering}, '', new URL('/product/committed/?order=' + ordering, location.href).href);
    window.dispatchEvent(new CustomEvent('codela:route-committed', {detail:{from:savedUrl,to:location.href}}));
   };
   if (ordering === 'commit-first') {
    commit();
    check(attrs(f.root) === originalRoot && !f.root.hasAttribute('data-sf-feedback-bottom') && f.product.inert, 'Commit-before-replacement retires old panel while ancestor remains inert');
    check(!submit(originalForm), 'Commit-before-replacement still blocks the connected outgoing form submit');
    f.root.append(document.createElement('span'));
    window.dispatchEvent(new Event('resize')); await tick();
    check(!f.root.hasAttribute('data-sf-feedback-bottom') && feedback.active(token), 'Commit-before-replacement cannot reacquire an old panel on queued resize/mutation');
   }
   f.main.replaceWith(incoming);
   await tick();
   check(!f.main.isConnected && attrs(f.root) === originalRoot && f.form === originalForm, ordering + ' removes the marker from detached original nodes without changing identity');
   check(feedback.active(token) && document.documentElement.dataset.sfNavigationBottom === 'dock' && !document.querySelector('[data-sf-feedback-bottom]'), ordering + ' retires the panel without stealing the router owner token');
   check(attrs(incomingPanel) === incomingBefore && incoming.querySelector('form') === incomingForm && incoming.querySelector('.price').textContent === '87', ordering + ' never decorates or substitutes incoming product data under the old token');
   if (ordering === 'replacement-first') commit();
   incomingPanel.append(document.createElement('span'));
   window.dispatchEvent(new Event('resize')); await tick();
   check(!incomingPanel.hasAttribute('data-sf-feedback-bottom') && !f.root.hasAttribute('data-sf-feedback-bottom') && feedback.active(token), ordering + ' late mutation/resize cannot resurrect retired bottom ownership');
   check(swap() === 0 && submit(incomingForm), ordering + ' retirement prevents stale snapshots without blocking the incoming form');
   check(feedback.end(token) && !document.documentElement.hasAttribute('data-sf-navigation-bottom') && attrs(incomingPanel) === incomingBefore, ordering + ' original owner can finish normally after commit');
   const nextToken = feedback.begin({url:new URL('/product/next/', location.href).href});
   check(document.querySelector('[data-sf-feedback-bottom]') === incomingPanel && feedback.active(nextToken), ordering + ' only a new navigation can acquire the committed native panel');
   feedback.end(nextToken);
  }
  return results;
 } finally {
  feedback.end();
  document.body.replaceChildren(...savedNodes);
  restoreAttributes(document.body, savedBody);
  restoreAttributes(document.documentElement, savedHtml);
  if (location.href !== savedUrl) history.replaceState(savedHistoryState, '', savedUrl);
  if (resize) await resize(savedWidth);
 }
};
