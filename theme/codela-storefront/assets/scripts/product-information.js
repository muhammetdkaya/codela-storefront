/** Native product composition. Existing Woo forms and gallery nodes stay intact. */
(function () {
  'use strict';
  // Woo's thumbnails hook is INSIDE its moving track. Move the existing
  // hidden counter once, before gallery/counter DOM-ready initialization,
  // so it stays pinned to the gallery frame when native slides change.
  var counter = document.getElementById('codela-live-visitor-container');
  var gallery = counter && counter.closest('.woocommerce-product-gallery');
  if (gallery && counter.parentElement !== gallery) gallery.appendChild(counter);
  function setupQuantities() {
    document.querySelectorAll('div.product .sf-product-purchase .quantity').forEach(function (quantity) {
      var input = quantity.querySelector('input.qty');
      var buttons = quantity.querySelectorAll('[data-quantity-step]');
      if (!input || !buttons.length) return;
      quantity.classList.add('sf-product-quantity');
      function update() {
        quantity.classList.toggle('is-fixed', input.type !== 'number' || input.hidden);
        buttons.forEach(function (button) {
          var down = Number(button.dataset.quantityStep) < 0;
          var limit = input.getAttribute(down ? 'min' : 'max');
          button.disabled = input.disabled || input.readOnly || (limit !== null && limit !== '' &&
            (down ? input.valueAsNumber <= Number(limit) : input.valueAsNumber >= Number(limit)));
        });
      }
      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          try {
            if (Number(button.dataset.quantityStep) < 0) input.stepDown(); else input.stepUp();
          } catch (_) { return; }
          input.dispatchEvent(new Event('input', {bubbles:true}));
          input.dispatchEvent(new Event('change', {bubbles:true}));
          update();
        });
      });
      input.addEventListener('input', update);
      input.addEventListener('change', update);
      new MutationObserver(update).observe(input, {attributes:true, attributeFilter:['min','max','step','disabled','readonly','type','value']});
      update();
    });
  }
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
    var drag = null;
    var settleFrame = 0;
    var dragged = false;
    var photoWidth = 0;
    var discoveryFrame = 0;
    var delivery = null;
    var openSections = [];
    function move(node, target) {
      if (!node) return;
      var marker = document.createComment('sf-product-position');
      node.before(marker);
      originals.push([node, marker]);
      target.appendChild(node);
    }
    function measure() {
      if (!mounted || drag?.active) return;
      var footerHeight = purchase ? purchase.getBoundingClientRect().height : 0;
      sheet.style.setProperty('--sf-product-footer-height', footerHeight + 'px');
      sheet.style.setProperty('--sf-product-closed-height', (sheet.querySelector('.sf-product-sheet-header').getBoundingClientRect().height + footerHeight + 8) + 'px');
      var dockHeight = !purchase ? (document.querySelector('.sf-mobile-dock')?.getBoundingClientRect().height || 0) : 0;
      var height = sheet.querySelector('.sf-product-sheet-header').getBoundingClientRect().height + footerHeight + dockHeight + 16;
      // Preserve the visible product framing with a corner-sized overlap.
      // Cache normal geometry per width: panel state and browser toolbar
      // resizing must never move preceding photographs or snap positions.
      if (!expanded && !sheet.classList.contains('is-discovering') && photoWidth !== media.clientWidth) {
        var inset = Math.max(0, height - 32) + 'px';
        media.style.setProperty('--sf-product-photo-inset', inset);
        document.documentElement.style.setProperty('--sf-product-photo-inset', inset);
        media.style.setProperty('--sf-product-normal-height', height + 'px');
        photoWidth = media.clientWidth;
      }
      media.style.setProperty('--sf-product-collapsed-height', height + 'px');
      document.body.style.setProperty('--sf-product-collapsed-height', height + 'px');
    }
    function setOpen(open, focusTarget, preservePhoto) {
      if (!mounted) return;
      expanded = open;
      if (open && !preservePhoto && !sheet.classList.contains('is-discovering')) {
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
        discovery.getBoundingClientRect().top < window.innerHeight * (media.classList.contains('is-discovering') ? .65 : .55);
    }
    function updateDiscovery() {
      if (!mounted || drag?.active) return;
      var active = isDiscovering();
      media.classList.toggle('is-discovering', active);
      var compact = active && !expanded;
      var changed = sheet.classList.contains('is-discovering') !== compact;
      sheet.classList.toggle('is-discovering', compact);
      // Padding-only changes do not resize the observer's content box.
      // Measure this state boundary explicitly, including short product names.
      if (changed) measure();
    }
    window.addEventListener('scroll', function () {
      if (!mounted || discoveryFrame) return;
      discoveryFrame = requestAnimationFrame(function () { discoveryFrame = 0; updateDiscovery(); });
    }, {passive:true});
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
      // Compose the existing, live plugin nodes inside a native disclosure.
      // The collapsed sheet has no shipping text/track or contact action.
      var information = content.querySelector('.sf-product-information');
      if (information) {
        openSections = Array.from(information.querySelectorAll('details[open]'));
        openSections.forEach(function (section) { section.open = false; });
      }
      var shipping = summary.querySelectorAll('.cdl-de,.cdl-fsb-live--product,.cdl-fsb--product:not(.cdl-fsb-live--product .cdl-fsb--product)');
      if (shipping.length) {
        delivery = document.createElement('details');
        delivery.className = 'sf-product-information-section sf-product-delivery';
        var label = document.createElement('summary');
        label.textContent = template.dataset.deliveryLabel;
        var body = document.createElement('div');
        body.className = 'sf-product-information-content';
        delivery.append(label, body);
        if (information) {
          var next = information.querySelector('#sf-product-section-codela_taksit,#sf-product-section-reviews');
          information.insertBefore(delivery, next);
        } else content.appendChild(delivery);
        shipping.forEach(function (node) { move(node, body); });
      }
      var contact = summary.querySelector('.cdl-wa');
      if (contact) {
        move(contact, content);
        var trust = content.querySelector(':scope > .cdl-tb');
        if (trust) trust.before(contact);
      }
      placeFooter();
      if (track && discovery.children.length) track.appendChild(discovery);
      product.appendChild(sheet);
      document.body.classList.add('sf-product-sheet-ready');
      if (purchase) sheet.classList.add('has-purchase');
      measure();
      setOpen(false);
      document.documentElement.classList.remove('sf-product-sheet-pending');
      // Validation and server messages must never be stranded behind a sheet.
      if (location.hash || document.querySelector('.woocommerce-error,.woocommerce-message')) setOpen(true);
    }
    function unmount() {
      if (!mounted) return;
      finishDrag(true);
      cancelAnimationFrame(settleFrame);
      sheet.style.removeProperty('height');
      media.inert = false;
      // Restore containers before their children using the exact anchor nodes.
      originals.slice().reverse().forEach(function (entry) { entry[1].replaceWith(entry[0]); });
      originals = [];
      openSections.forEach(function (section) { section.open = true; });
      openSections = [];
      if (delivery) { delivery.remove(); delivery = null; }
      discovery.remove();
      media.classList.remove('is-discovering');
      sheet.classList.remove('is-discovering');
      sheet.remove();
      sheet.classList.remove('is-expanded');
      document.body.classList.remove('sf-product-sheet-ready', 'sf-product-sheet-open');
      media.style.removeProperty('--sf-product-collapsed-height');
      media.style.removeProperty('--sf-product-photo-inset');
      media.style.removeProperty('--sf-product-normal-height');
      photoWidth = 0;
      cancelAnimationFrame(discoveryFrame);
      discoveryFrame = 0;
      document.documentElement.style.removeProperty('--sf-product-photo-inset');
      document.body.style.removeProperty('--sf-product-collapsed-height');
      mounted = false;
    }
    function adapt() { if (mobile.matches) mount(); else unmount(); }
    function placeFooter() {
      var footer = document.querySelector('.sf-footer');
      if (mounted && footer && !content.contains(footer)) move(footer, content);
    }
    // The adapter can run before the parser reaches the document footer.
    document.addEventListener('DOMContentLoaded', placeFooter, {once:true});
    toggle.addEventListener('click', function (event) {
      if (dragged) { event.preventDefault(); dragged = false; return; }
      setOpen(!expanded);
    });
    var header = sheet.querySelector('.sf-product-sheet-header');
    header.addEventListener('pointerdown', function (event) {
      if (!mounted || drag || event.button !== 0 || event.isPrimary === false || event.target.closest('a,input,select,textarea')) return;
      cancelAnimationFrame(settleFrame);
      var style = getComputedStyle(sheet);
      var height = sheet.getBoundingClientRect().height;
      drag = {id:event.pointerId, x:event.clientX, y:event.clientY, lastY:event.clientY,
        start:height, height:height, min:header.getBoundingClientRect().height + parseFloat(style.paddingBottom),
        max:parseFloat(style.maxHeight), open:expanded, time:performance.now(), active:false};
    });
    window.addEventListener('pointermove', function (event) {
      if (!drag || event.pointerId !== drag.id) return;
      var dy = event.clientY - drag.y, dx = event.clientX - drag.x;
      if (!drag.active) {
        if (Math.max(Math.abs(dy), Math.abs(dx)) < 4) return;
        if (Math.abs(dx) > Math.abs(dy)) { drag = null; return; }
        drag.active = true;
        sheet.classList.add('is-dragging');
        document.body.classList.add('sf-product-sheet-open');
        media.inert = true;
        header.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      drag.lastY = event.clientY;
      drag.height = Math.max(drag.min, Math.min(drag.max, drag.start - dy));
      sheet.style.height = drag.height + 'px';
    }, {passive:false});
    function finishDrag(cancelled) {
      if (!drag) return;
      var gesture = drag;
      drag = null;
      if (header.hasPointerCapture(gesture.id)) header.releasePointerCapture(gesture.id);
      if (!gesture.active) return;
      dragged = true;
      var dy = gesture.lastY - gesture.y;
      var speed = Math.abs(dy) / Math.max(1, performance.now() - gesture.time);
      var progress = (gesture.height - gesture.min) / Math.max(1, gesture.max - gesture.min);
      var open = cancelled ? gesture.open : (Math.abs(dy) > 35 && speed > .35 ? dy < 0 : progress > (gesture.open ? .65 : .18));
      sheet.classList.remove('is-dragging');
      // Establish the released height before transitioning to its snap state.
      // No per-frame gallery measurement or document scroll correction.
      sheet.getBoundingClientRect();
      setOpen(open, null, true);
      settleFrame = requestAnimationFrame(function () { sheet.style.removeProperty('height'); });
      setTimeout(function () { dragged = false; }, 0);
    }
    window.addEventListener('pointerup', function (event) {
      if (drag && event.pointerId === drag.id) finishDrag(false);
    });
    window.addEventListener('pointercancel', function (event) { if (drag && event.pointerId === drag.id) finishDrag(true); });
    header.addEventListener('lostpointercapture', function (event) { if (drag && event.pointerId === drag.id) finishDrag(true); });
    window.addEventListener('blur', function () { finishDrag(true); });
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
    window.addEventListener('resize', function () { finishDrag(true); measure(); });
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
  function start() { setupQuantities(); setupSheet(); revealHash(); }
  // The production template is printed before footer scripts. Its entire
  // product subtree is already available, even while the parser is loading.
  if (document.getElementById('sf-product-sheet-template') || document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();

