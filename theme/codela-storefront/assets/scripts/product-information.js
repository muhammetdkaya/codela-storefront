/** Native product composition. Existing Woo forms and gallery nodes stay intact. */
(function () {
  'use strict';
  // Woo's thumbnails hook is INSIDE its moving track. Move the existing
  // hidden counter once, before gallery/counter DOM-ready initialization,
  // so it stays pinned to the gallery frame when native slides change.
  var counter = document.getElementById('codela-live-visitor-container');
  var gallery = counter && counter.closest('.woocommerce-product-gallery');
  if (gallery && counter.parentElement !== gallery) gallery.appendChild(counter);
  var sheetState = null;
  function setupSheet() {
    var template = document.getElementById('sf-product-sheet-template');
    var product = template && template.closest('div.product');
    var media = product && product.querySelector('.woocommerce-product-gallery');
    var summary = product && product.querySelector(':scope > .summary');
    if (!template || !media || !summary) return;
    var sheet = template.content.firstElementChild.cloneNode(true);
    var heading = sheet.querySelector('.sf-product-sheet-heading');
    var content = sheet.querySelector('.sf-product-sheet-body');
    var toggle = sheet.querySelector('.sf-product-sheet-toggle');
    var title = summary.querySelector('.product_title');
    var price = summary.querySelector('.sf-product-price-row, :scope > .price');
    var purchase = summary.querySelector('.sf-product-purchase');
    var mobile = matchMedia('(max-width:700px)');
    var track = media.querySelector('.woocommerce-product-gallery__wrapper');
    var discovery = document.createElement('div');
    discovery.className = 'sf-product-discovery';
    var originals = [];
    var mounted = false;
    var expanded = false;
    var downY = null;
    var downX = null;
    var dragged = false;
    function move(node, target) {
      if (!node) return;
      var marker = document.createComment('sf-product-position');
      node.before(marker);
      originals.push([node, marker]);
      target.appendChild(node);
    }
    function measure() {
      if (!mounted) return;
      var footerHeight = purchase ? purchase.getBoundingClientRect().height : 0;
      sheet.style.setProperty('--sf-product-footer-height', footerHeight + 'px');
      sheet.style.setProperty('--sf-product-closed-height', (sheet.querySelector('.sf-product-sheet-header').getBoundingClientRect().height + footerHeight + 8) + 'px');
      var dockHeight = !purchase ? (document.querySelector('.sf-mobile-dock')?.getBoundingClientRect().height || 0) : 0;
      var height = sheet.querySelector('.sf-product-sheet-header').getBoundingClientRect().height + footerHeight + dockHeight + 16;
      // Preserve the visible product framing with a corner-sized overlap.
      // Discovery compaction must not resize all preceding photographs.
      if (!expanded && !sheet.classList.contains('is-discovering')) media.style.setProperty('--sf-product-photo-inset', Math.max(0, height - 32) + 'px');
      media.style.setProperty('--sf-product-collapsed-height', height + 'px');
      document.body.style.setProperty('--sf-product-collapsed-height', height + 'px');
    }
    function setOpen(open, focusTarget) {
      if (!mounted) return;
      expanded = open;
      if (open && !sheet.classList.contains('is-discovering')) {
        var photos = Array.from(media.querySelectorAll('.woocommerce-product-gallery__image,.woocommerce-product-gallery__image--placeholder'));
        var nearest = photos.reduce(function (best, node) { return !best || Math.abs(node.getBoundingClientRect().top) < Math.abs(best.getBoundingClientRect().top) ? node : best; }, null);
        if (nearest) window.scrollTo({top:window.scrollY + nearest.getBoundingClientRect().top, behavior:'instant'});
      }
      sheet.classList.toggle('is-expanded', open);
      document.body.classList.toggle('sf-product-sheet-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      media.inert = open;
      sheet.classList.toggle('is-discovering', !open && isDiscovering());
      if (!open && content.contains(document.activeElement) && !purchase?.contains(document.activeElement)) toggle.focus({preventScroll:true});
      if (open && focusTarget) requestAnimationFrame(function () {
        focusTarget.scrollIntoView({block:'nearest'});
        focusTarget.focus({preventScroll:true});
      });
      measure();
    }
    function isDiscovering() {
      return mounted && discovery.children.length > 0 && track &&
        discovery.getBoundingClientRect().top < window.innerHeight * .6;
    }
    function updateDiscovery() {
      if (!mounted) return;
      var active = isDiscovering();
      media.classList.toggle('is-discovering', active);
      var compact = active && !expanded;
      var changed = sheet.classList.contains('is-discovering') !== compact;
      sheet.classList.toggle('is-discovering', compact);
      // Padding-only changes do not resize the observer's content box.
      // Measure this state boundary explicitly, including short product names.
      if (changed) measure();
    }
    window.addEventListener('scroll', updateDiscovery, {passive:true});
    function mount() {
      if (mounted) return;
      mounted = true;
      move(title, heading);
      move(price, heading);
      var notices = document.querySelector('.woocommerce-notices-wrapper');
      if (notices && !product.contains(notices)) move(notices, content);
      // Keep the original summary/form hierarchy, extension inputs, native
      // quantity and submit button. The fixed purchase escapes body clipping.
      Array.from(product.children).forEach(function (node) {
        // Reuse native recommendation cards after the last photograph.
        if (track && node.matches('.related,.upsells')) { move(node, discovery); return; }
        if (node !== media && node !== template && !node.classList.contains('onsale')) move(node, content);
      });
      var footer = document.querySelector('.sf-footer');
      if (footer) move(footer, content);
      if (track && discovery.children.length) track.appendChild(discovery);
      product.appendChild(sheet);
      document.body.classList.add('sf-product-sheet-ready');
      if (purchase) sheet.classList.add('has-purchase');
      measure();
      setOpen(false);
      // Validation and server messages must never be stranded behind a sheet.
      if (location.hash || document.querySelector('.woocommerce-error,.woocommerce-message')) setOpen(true);
    }
    function unmount() {
      if (!mounted) return;
      media.inert = false;
      // Restore containers before their children using the exact anchor nodes.
      originals.slice().reverse().forEach(function (entry) { entry[1].replaceWith(entry[0]); });
      originals = [];
      discovery.remove();
      media.classList.remove('is-discovering');
      sheet.classList.remove('is-discovering');
      sheet.remove();
      sheet.classList.remove('is-expanded');
      document.body.classList.remove('sf-product-sheet-ready', 'sf-product-sheet-open');
      media.style.removeProperty('--sf-product-collapsed-height');
      media.style.removeProperty('--sf-product-photo-inset');
      document.body.style.removeProperty('--sf-product-collapsed-height');
      mounted = false;
    }
    function adapt() { if (mobile.matches) mount(); else unmount(); }
    toggle.addEventListener('click', function (event) {
      if (dragged) { event.preventDefault(); dragged = false; return; }
      setOpen(!expanded);
    });
    var header = sheet.querySelector('.sf-product-sheet-header');
    header.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || event.target.closest('a,input,select,textarea')) return;
      downY = event.clientY;
      downX = event.clientX;
    });
    window.addEventListener('pointerup', function (event) {
      if (downY === null) return;
      var dy = event.clientY - downY;
      var dx = event.clientX - downX;
      downY = null;
      if (Math.abs(dy) > 35 && Math.abs(dy) > Math.abs(dx)) {
        dragged = true;
        setOpen(dy < 0);
        setTimeout(function () { dragged = false; }, 0);
      }
    });
    window.addEventListener('pointercancel', function () { downY = null; });
    sheet.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && expanded) { event.preventDefault(); setOpen(false); }
    });
    // A disabled native variation button still receives capture-phase clicks.
    // Open the original selector instead of proxying or submitting the form.
    sheet.addEventListener('click', function (event) {
      var button = event.target.closest('.single_add_to_cart_button');
      var grouped = button && button.closest('form.grouped_form');
      if (grouped && !expanded) {
        event.preventDefault(); event.stopImmediatePropagation();
        setOpen(true, grouped.querySelector('.group_table input.qty'));
        return;
      }
      var form = button && button.closest('form.variations_form');
      if (!form) return;
      var missing = Array.from(form.querySelectorAll('.variations select')).find(function (select) { return !select.value; });
      if (missing) { event.preventDefault(); event.stopImmediatePropagation(); setOpen(true, missing); }
    }, true);
    sheet.addEventListener('invalid', function (event) { setOpen(true, event.target); }, true);
    sheet.addEventListener('focusin', function (event) {
      if (!expanded && content.contains(event.target) && !purchase?.contains(event.target)) setOpen(true);
    });
    if ('ResizeObserver' in window) {
      var resize = new ResizeObserver(measure);
      resize.observe(header);
      if (purchase) resize.observe(purchase);
    }
    window.addEventListener('resize', measure);
    mobile.addEventListener('change', adapt);
    sheetState = {open: function () { setOpen(true); }};
    adapt();
  }
  function revealHash() {
    if (!location.hash) return;
    var target;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
    catch (_) { return; }
    if (!target) return;
    var section = target.closest('.sf-product-information-section');
    if (!section) return;
    if (sheetState) sheetState.open();
    section.open = true;
    target.scrollIntoView({block: 'start'});
  }
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a.woocommerce-review-link');
    if (!link) return;
    var section = document.getElementById('sf-product-section-reviews');
    if (sheetState) sheetState.open();
    if (section) section.open = true;
  });
  window.addEventListener('hashchange', revealHash);
  function start() { setupSheet(); revealHash(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

