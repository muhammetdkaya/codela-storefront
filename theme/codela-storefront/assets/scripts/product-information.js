/** Native product composition. Existing Woo forms and gallery nodes stay intact. */
(function () {
  'use strict';
  // Woo's thumbnails hook emits the original Codela visitor AFTER the
  // gallery. Reparent that single native host to the gallery FRAME, not to
  // photo one: this informational companion must stay beside the live 1/N
  // photo index while images scroll. The plugin keeps sole ownership of
  // REST count, minimum threshold, hidden state and update interval.
  var counter = document.getElementById('codela-live-visitor-container');
  var product = counter && counter.closest('div.product');
  var gallery = counter && (counter.closest('.woocommerce-product-gallery') ||
    (product && product.querySelector('.woocommerce-product-gallery.sf-ui-gallery')));
  if (gallery && counter.parentElement !== gallery) gallery.appendChild(counter);
  function setupQuantities() {
    document.querySelectorAll('div.product .sf-product-purchase .quantity').forEach(function (quantity) {
      var input = quantity.querySelector('input.qty');
      var buttons = quantity.querySelectorAll('[data-quantity-step]');
      if (!input || !buttons.length) return;
      quantity.classList.add('sf-product-quantity', 'sf-ui-surface');
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
    var summary = product && product.querySelector('.sf-product-overview > .summary, :scope > .summary');
    if (!template || !media || !summary) return;
    var sheet = template.content.firstElementChild.cloneNode(true);
    var scrim = document.createElement('div');
    scrim.className = 'sf-product-sheet-scrim';
    scrim.setAttribute('aria-hidden', 'true');
    var heading = sheet.querySelector('.sf-product-sheet-heading');
    var content = sheet.querySelector('.sf-product-sheet-body');
    var toggle = sheet.querySelector('.sf-product-sheet-toggle');
    var handlePath = toggle.querySelector('.sf-product-sheet-handle path');
    var handleProgress = 0;
    var title = summary.querySelector('.product_title');
    var price = summary.querySelector('.sf-product-price-row, :scope > .price');
    var purchase = summary.querySelector('.sf-product-purchase');
    var mobile = matchMedia('(max-width:700px)');
    var description = summary.querySelector('#sf-product-section-description');
    var descriptionHome = null;
    var descriptionOpen = false;
    var track = media.querySelector('.woocommerce-product-gallery__wrapper');
    var discovery = document.createElement('div');
    discovery.className = 'sf-product-discovery';
    var originals = [];
    var mounted = false;
    var expanded = false;
    var drag = null;
    var dragFrame = 0;
    var settleFrame = 0;
    var settling = false;
    var focusFrame = 0;
    var focusGeneration = 0;
    var suppressClickUntil = 0;
    var photoWidth = 0;
    var discoveryFrame = 0;
    var delivery = null;
    var shippingSummary = null;
    var shippingObserver = null;
    var endTouch = null;
    var endWheel = null;
    var endWheelTimer = 0;
    var openSections = [];
    function move(node, target) {
      if (!node) return;
      var marker = document.createComment('sf-product-position');
      node.before(marker);
      originals.push([node, marker]);
      target.appendChild(node);
    }
    function measure() {
      if (!mounted || drag || settling) return;
      var footerHeight = purchase ? purchase.getBoundingClientRect().height : 0;
      sheet.style.setProperty('--sf-product-footer-height', footerHeight + 'px');
      sheet.style.setProperty('--sf-product-closed-height', (sheet.querySelector('.sf-product-sheet-header').getBoundingClientRect().height + footerHeight + 8) + 'px');
      var height = sheet.querySelector('.sf-product-sheet-header').getBoundingClientRect().height + footerHeight + 16;
      // CSS owns photo framing before and after mount. Only cache the sheet
      // height for annotations; never feed measured sheet size into photos.
      if (!expanded && !sheet.classList.contains('is-discovering') && photoWidth !== media.clientWidth) {
        media.style.setProperty('--sf-product-normal-height', height + 'px');
        photoWidth = media.clientWidth;
      }
      media.style.setProperty('--sf-product-collapsed-height', height + 'px');
      document.body.style.setProperty('--sf-product-collapsed-height', height + 'px');
    }
    function cancelPendingFocus() {
      if (focusFrame) cancelAnimationFrame(focusFrame);
      focusFrame = 0;
      focusGeneration++;
    }
    function paintHandle(progress) {
      handleProgress = Math.max(0, Math.min(1, progress));
      if (handlePath) handlePath.setAttribute('d', 'M2 7 L14 ' + (7 + 8 * handleProgress).toFixed(2) + ' L26 7');
    }
    /* The sheet, scrim and SVG are all painted from ONE progress value.
       Keep the Woo form in place: its fixed purchase button must never
       acquire a new transformed containing block. */
    function sheetLimits() {
      var style = getComputedStyle(sheet);
      var min = parseFloat(style.getPropertyValue('--sf-product-closed-height'));
      if (!Number.isFinite(min)) min = heading.parentElement.getBoundingClientRect().height + parseFloat(style.paddingBottom);
      var max = parseFloat(style.maxHeight);
      if (!Number.isFinite(max)) max = innerHeight - 84;
      return {min:min, max:Math.max(min + 1,max)};
    }
    function paintSheet(height, limits) {
      var value = Math.max(limits.min,Math.min(limits.max,height));
      var progress = (value - limits.min) / (limits.max - limits.min);
      sheet.style.height = value + 'px';
      scrim.style.opacity = String(progress);
      paintHandle(progress);
    }
    function cancelSettle() {
      cancelAnimationFrame(settleFrame);
      settleFrame = 0;
      settling = false;
    }
    function finishSettle(open, limits) {
      cancelSettle();
      paintSheet(open ? limits.max : limits.min, limits);
      sheet.classList.remove('is-settling','is-holding','is-dragging');
      sheet.style.removeProperty('--sf-product-drag-body-height');
      sheet.style.removeProperty('height');
      scrim.style.removeProperty('opacity');
      if (!open) document.body.classList.remove('sf-product-sheet-open');
      media.inert = open;
      measure();
    }
    function settleSheet(open, limits, from) {
      cancelSettle();
      settling = true;
      sheet.classList.add('is-settling');
      /* The body is allotted its final open space from the FIRST frame.
         No scroll height, heading or form geometry is destroyed on release. */
      sheet.style.setProperty('--sf-product-drag-body-height',Math.max(0,limits.max - limits.min) + 'px');
      sheet.classList.remove('is-holding','is-dragging');
      scrim.classList.remove('is-dragging');
      var target = open ? limits.max : limits.min;
      paintSheet(from,limits);
      var distance = Math.abs(target - from) / (limits.max - limits.min);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || distance < .002) {
        finishSettle(open,limits);
        return;
      }
      var duration = 320 * Math.max(.32,Math.min(1,distance));
      var start = performance.now();
      function frame(now) {
        var time = Math.min(1,(now - start) / duration);
        var eased = 1 - Math.pow(1 - time,3);
        paintSheet(from + (target - from) * eased,limits);
        if (time < 1) settleFrame = requestAnimationFrame(frame);
        else finishSettle(open,limits);
      }
      settleFrame = requestAnimationFrame(frame);
    }
    function setOpen(open, focusTarget, preservePhoto, fromDrag) {
      cancelPendingFocus();
      if (!mounted) return;
      /* Capture geometry BEFORE changing semantic classes; a swipe release
         therefore continues at the exact pixel last painted by the finger. */
      var limits = sheetLimits();
      var from = sheet.getBoundingClientRect().height;
      cancelSettle();
      /* Freeze body BEFORE toggling is-expanded: discovery/heading queries
         below can flush layout synchronously on Safari. */
      if (!sheet.classList.contains('is-mounting')) {
        sheet.classList.add('is-settling');
        sheet.style.setProperty('--sf-product-drag-body-height',Math.max(0,limits.max - limits.min) + 'px');
      }
      expanded = open;
      if (open && !preservePhoto && !sheet.classList.contains('is-discovering')) {
        var photos = Array.from(media.querySelectorAll('.woocommerce-product-gallery__image,.woocommerce-product-gallery__image--placeholder')).filter(node=>node.getClientRects().length);
        var nearest = photos.reduce(function (best, node) { return !best || Math.abs(node.getBoundingClientRect().top) < Math.abs(best.getBoundingClientRect().top) ? node : best; }, null);
        if (nearest) window.scrollTo({top:window.scrollY + nearest.getBoundingClientRect().top, behavior:'instant'});
      }
      sheet.classList.toggle('is-expanded', open);
      /* Lock document scrolling until the CLOSE animation actually ends. */
      if (open || fromDrag || sheet.classList.contains('is-settling')) document.body.classList.add('sf-product-sheet-open');
      scrim.classList.toggle('is-visible', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? template.dataset.closeLabel : template.dataset.openLabel);
      media.inert = true;
      sheet.classList.toggle('is-discovering', !open && isDiscovering());
      if (!open && content.contains(document.activeElement) && !purchase?.contains(document.activeElement)) toggle.focus({preventScroll:true});
      if (open && focusTarget) {
        var generation = focusGeneration;
        focusFrame = requestAnimationFrame(function () {
          if (generation !== focusGeneration) return;
          focusFrame = 0;
          if (!mounted || !expanded || !focusTarget.isConnected || !sheet.contains(focusTarget)) return;
          focusTarget.scrollIntoView({block:'nearest'});
          focusTarget.focus({preventScroll:true});
        });
      }
      if (sheet.classList.contains('is-mounting')) {
        /* First paint is already the correct collapsed native geometry.
           Never animate an empty skeleton into the real Woo product. */
        paintHandle(open ? 1 : 0);
        document.body.classList.toggle('sf-product-sheet-open',open);
        media.inert = open;
        measure();
      } else {
        settleSheet(open, limits, from);
      }
    }
    function isDiscovering() {
      return mounted && discovery.children.length > 0 && track &&
        discovery.getBoundingClientRect().top < window.innerHeight * (media.classList.contains('is-discovering') ? .65 : .55);
    }
    function atPageEnd() {
      // Compensate for Safari browser chrome and safe-area changes.
      return document.documentElement.scrollHeight - (window.scrollY + window.innerHeight) <=
        Math.max(28, window.innerHeight * .035);
    }
    function endPullAllowed(target) {
      return mounted && !expanded && !drag && !endWheel &&
        !document.documentElement.classList.contains('sf-overlay-scroll-locked') &&
        (!discovery.children.length || isDiscovering()) &&
        !(target instanceof Element && target.closest('.sf-product-sheet,.sf-product-gallery-rail,#sf-panel,.pswp'));
    }
    function updateDiscovery() {
      if (!mounted || drag || document.documentElement.classList.contains('sf-overlay-scroll-locked')) return;
      var active = isDiscovering();
      media.classList.toggle('is-discovering', active);
      var compact = active && !expanded;
      var changed = sheet.classList.contains('is-discovering') !== compact;
      sheet.classList.toggle('is-discovering', compact);
      if (changed) measure();
    }
    window.addEventListener('scroll', function () {
      if (!mounted || discoveryFrame) return;
      discoveryFrame = requestAnimationFrame(function () { discoveryFrame = 0; updateDiscovery(); });
    }, {passive:true});
    // At the bottom, an ongoing upward swipe is passed directly to the sheet.
    // No page-end timer or synthetic scrolling can open it.
    window.addEventListener('touchstart', function (event) {
      endTouch = null;
      if (event.touches.length !== 1 || !endPullAllowed(event.target)) return;
      var t = event.touches[0];
      endTouch = {id:t.identifier, x:t.clientX, y:t.clientY, lastY:t.clientY, active:false, tail:document.documentElement.scrollHeight-scrollY-innerHeight < innerHeight*.7};
    }, {passive:true});
    window.addEventListener('touchmove', function (event) {
      if (!endTouch || event.touches.length !== 1) return;
      var t = event.touches[0];
      if (t.identifier !== endTouch.id) return;
      var previousY = endTouch.lastY;
      endTouch.lastY = t.clientY;
      if (!endTouch.active) {
        var dy = previousY - t.clientY;
        if (Math.abs(t.clientX-endTouch.x)>Math.abs(t.clientY-endTouch.y)) {endTouch=null;return;}
        if (dy <= 1 || !endPullAllowed(event.target)) return;
        // Own the final viewport from its first move, so Safari cannot take
        // the same vertical gesture away before it reaches the sheet.
        if (endTouch.tail && event.cancelable) {
          event.preventDefault();
          var remaining=Math.max(0,document.documentElement.scrollHeight-scrollY-innerHeight);
          var consumed=Math.min(remaining,dy);
          if(consumed) window.scrollTo({top:scrollY+consumed,behavior:'instant'});
          dy-=consumed;
          if(dy<=0)return;
          previousY=t.clientY+dy;
        }
        if (!atPageEnd() || !event.cancelable) return;
        // Inherit the LAST touch position, not the initial scroll position.
        if (!beginDrag(t.clientX, previousY, null, null)) return;
        endTouch.active = true;
      }
      event.preventDefault();
      updateDrag(t.clientX, t.clientY);
    }, {passive:false});
    window.addEventListener('touchend', function (event) {
      if (!endTouch || !Array.from(event.changedTouches).some(function (t) { return t.identifier === endTouch.id; })) return;
      var active = endTouch.active;
      endTouch = null;
      if (active && drag && drag.id === null) finishDrag(false);
    }, {passive:true});
    window.addEventListener('touchcancel', function () {
      if (!endTouch) return;
      var active = endTouch.active;
      endTouch = null;
      if (active && drag && drag.id === null) finishDrag(true);
    }, {passive:true});
    // Trackpad/mouse wheel delta is a virtual continuation of the same page.
    // The delay here only settles the end of an ACTIVE wheel gesture.
    window.addEventListener('wheel', function (event) {
      if (!endWheel) {
        if (event.deltaY <= 0 || !atPageEnd() || !endPullAllowed(event.target)) return;
        if (!beginDrag(0, 0, null, null)) return;
        endWheel = {distance:0};
      }
      event.preventDefault();
      var unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      endWheel.distance = Math.max(0, endWheel.distance + Math.max(-180, Math.min(180, event.deltaY * unit)));
      updateDrag(0, -endWheel.distance);
      clearTimeout(endWheelTimer);
      endWheelTimer = setTimeout(function () {
        endWheelTimer = 0;
        var active = !!endWheel;
        endWheel = null;
        if (active && drag && drag.id === null) finishDrag(false);
      }, 160);
    }, {passive:false});
    function mount() {
      if (mounted) return;
      mounted = true;
      sheet.classList.add('is-mounting');
      move(title, heading);
      move(price, heading);
      // Only an unavailable product needs an availability row in the purchase summary.
      var unavailable = summary.querySelector(':scope > .stock.out-of-stock');
      if (unavailable) move(unavailable, heading);
      var notices = document.querySelector('.woocommerce-notices-wrapper');
      if (notices && !product.contains(notices)) move(notices, content);
      // Keep the original summary/form hierarchy, extension inputs, native
      // quantity and submit button. The fixed purchase escapes body clipping.
      Array.from(product.children).forEach(function (node) {
        if (node.classList.contains('sf-product-overview')) { move(summary, content); return; }
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
        var eta = body.querySelector('.cdl-de');
        if (eta) {
          shippingSummary = document.createElement('p');
          shippingSummary.className = 'sf-product-shipping-summary';
          heading.appendChild(shippingSummary);
          var syncShipping = function () {
            var day = eta.querySelector('.cdl-de-line strong:not(.cdl-de-timer)');
            shippingSummary.textContent = day ? template.dataset.shippingLabel.replace('%s', day.textContent.trim()) : '';
            shippingSummary.hidden = !day;
            measure();
          };
          shippingObserver = new MutationObserver(syncShipping);
          shippingObserver.observe(eta, {childList:true, subtree:true, characterData:true});
          syncShipping();
        }
      }
      // Desktop owns the original reassurance inside summary; the SAME node
      // joins the mobile information panel and returns to its exact marker.
      var reassurance = summary.querySelector(':scope > .cdl-tb');
      if (reassurance) move(reassurance, content);
      var contact = summary.querySelector('.cdl-wa');
      if (contact) {
        move(contact, content);
        var trust = content.querySelector(':scope > .cdl-tb');
        if (trust) trust.before(contact);
      }
      if (track && discovery.children.length) track.appendChild(discovery);
      product.appendChild(sheet);
      document.body.appendChild(scrim);
      document.body.classList.add('sf-product-sheet-ready');
      if (purchase) sheet.classList.add('has-purchase');
      measure();
      setOpen(false);
      document.documentElement.classList.remove('sf-product-sheet-pending');
      // Validation and server messages must never be stranded behind a sheet.
      if (location.hash || document.querySelector('.woocommerce-error,.woocommerce-message')) setOpen(true);
      sheet.getBoundingClientRect();
      sheet.classList.remove('is-mounting');
    }
    function unmount() {
      clearTimeout(endWheelTimer);
      endWheelTimer = 0;
      endWheel = null;
      endTouch = null;
      cancelPendingFocus();
      if (!mounted) return;
      finishDrag(true);
      cancelSettle();
      sheet.style.removeProperty('height');
      sheet.style.removeProperty('--sf-product-drag-body-height');
      sheet.classList.remove('is-settling','is-holding','is-dragging');
      paintHandle(0);
      media.inert = false;
      // Restore containers before their children using the exact anchor nodes.
      originals.slice().reverse().forEach(function (entry) { entry[1].replaceWith(entry[0]); });
      originals = [];
      openSections.forEach(function (section) { section.open = true; });
      openSections = [];
      if (shippingObserver) { shippingObserver.disconnect(); shippingObserver = null; }
      if (shippingSummary) { shippingSummary.remove(); shippingSummary = null; }
      if (delivery) { delivery.remove(); delivery = null; }
      discovery.remove();
      media.classList.remove('is-discovering');
      sheet.classList.remove('is-discovering');
      sheet.remove();
      scrim.remove();
      scrim.className = 'sf-product-sheet-scrim';
      scrim.style.removeProperty('opacity');
      sheet.classList.remove('is-expanded');
      document.body.classList.remove('sf-product-sheet-ready', 'sf-product-sheet-open');
      media.style.removeProperty('--sf-product-collapsed-height');
      media.style.removeProperty('--sf-product-normal-height');
      photoWidth = 0;
      cancelAnimationFrame(discoveryFrame);
      discoveryFrame = 0;
      document.body.style.removeProperty('--sf-product-collapsed-height');
      mounted = false;
    }
    function adaptDescription() {
      var home = product.querySelector('[data-sf-description-home]');
      if (mobile.matches && description && home && !descriptionHome) {
        // Capture the user's disclosure state before the mobile sheet mounts.
        // Desktop/tablet need no hydration-time layout change.
        descriptionOpen = description.open;
        descriptionHome = document.createComment('sf-product-description-position');
        description.before(descriptionHome);
        home.before(description);
      } else if (!mobile.matches && descriptionHome) {
        descriptionHome.replaceWith(description);
        descriptionHome = null;
        description.open = descriptionOpen;
      }
    }
    function adapt() {
      // Restore description BEFORE the mobile sheet captures its children and
      // disclosure states; unmount that same sheet BEFORE desktop composition.
      if (mobile.matches) { adaptDescription(); mount(); }
      else { unmount(); adaptDescription(); }
    }
    toggle.addEventListener('click', function (event) {
      // Touch browsers can synthesize click well after pointerup. Keep that
      // release from toggling the snap state again; keyboard clicks stay usable.
      if (event.detail !== 0 && performance.now() < suppressClickUntil) { event.preventDefault(); return; }
      setOpen(!expanded);
    });
    var header = sheet.querySelector('.sf-product-sheet-header');
    // Native body scrolling wins unless a downward swipe begins at its top.
    function beginDrag(x, y, id, capture) {
      if (!mounted || drag) return false;
      suppressClickUntil=0;
      var height = sheet.getBoundingClientRect().height;
      cancelSettle();
      sheet.style.setProperty('--sf-product-drag-body-height', content.getBoundingClientRect().height+'px');
      sheet.classList.add('is-holding');
      sheet.style.height = height + 'px';
      var style = getComputedStyle(sheet);
      var min = parseFloat(style.getPropertyValue('--sf-product-closed-height'));
      if (!Number.isFinite(min)) min = header.getBoundingClientRect().height + parseFloat(style.paddingBottom);
      var max = parseFloat(style.maxHeight);
      if (!Number.isFinite(max)) max = innerHeight - 84;
      sheet.style.setProperty('--sf-product-drag-body-height', Math.max(0,max-min)+'px');
      drag = {id:id, x:x, y:y, lastY:y, start:height, height:height,
        min:min, max:Math.max(min+1,max), open:expanded,
        time:performance.now(), active:false, width:innerWidth, capture:capture||null};
      if (capture && id !== null) capture.setPointerCapture(id);
      return true;
    }
    function updateDrag(x, y) {
      if (!drag) return;
      var dy=y-drag.y, dx=x-drag.x;
      if (!drag.active) {
        if (Math.max(Math.abs(dy),Math.abs(dx))<8) return;
        if (Math.abs(dx)>Math.abs(dy)) {finishDrag(true);return;}
        drag.active=true;
        sheet.classList.add('is-dragging');
        scrim.classList.add('is-dragging');
        document.body.classList.add('sf-product-sheet-open');
        media.inert=true;
      }
      drag.lastY=y;
      drag.height=Math.max(drag.min,Math.min(drag.max,drag.start-dy));
      if (!dragFrame) dragFrame=requestAnimationFrame(paintDrag);
    }
    header.addEventListener('pointerdown', function (event) {
      if (!mounted||drag||event.button!==0||event.isPrimary===false||
          event.target.closest('a,input,select,textarea')) return;
      suppressClickUntil=0;
      beginDrag(event.clientX,event.clientY,event.pointerId,event.target.closest('button')||header);
    });
    // Desktop pointer drag works on noninteractive content too.
    content.addEventListener('pointerdown',function(event){
      if(!mounted||!expanded||drag||event.pointerType==='touch'||event.button!==0||
         content.scrollTop>2||
         event.target.closest('input,select,textarea,[contenteditable="true"]'))return;
      beginDrag(event.clientX,event.clientY,event.pointerId,event.target.closest('a,button,summary,[role="button"]')||content);
    });
    window.addEventListener('pointermove',function(event){
      if(!drag||event.pointerId!==drag.id)return;
      updateDrag(event.clientX,event.clientY);
      if(drag?.active)event.preventDefault();
    },{passive:false});
    function paintDrag(){
      dragFrame=0;
      if(!drag?.active)return;
      paintSheet(drag.height,drag);
    }
    function finishDrag(cancelled){
      if(!drag)return;
      cancelAnimationFrame(dragFrame);paintDrag();
      var gesture=drag;drag=null;
      if(gesture.capture&&gesture.id!==null&&gesture.capture.hasPointerCapture(gesture.id))
        gesture.capture.releasePointerCapture(gesture.id);
      if(!gesture.active){
        /* Even an interrupted settle resumes from its exact current height;
           no early body collapse or height property removal. */
        setOpen(gesture.open,null,true,true);
        return;
      }
      suppressClickUntil=performance.now()+700;
      var dy=gesture.lastY-gesture.y;
      var speed=Math.abs(dy)/Math.max(1,performance.now()-gesture.time);
      var progress=(gesture.height-gesture.min)/(gesture.max-gesture.min);
      var open=cancelled?gesture.open:
        (Math.abs(dy)>35&&speed>.35?dy<0:progress>(gesture.open?.65:.18));
      setOpen(open,null,true,true);
    }
    window.addEventListener('pointerup',function(event){
      if(drag&&event.pointerId===drag.id)finishDrag(false);
    });
    // Safari: an open sheet can be grabbed from descriptive body text.
    // Do not hijack inputs, disclosures, horizontal swipes or detail scrolling.
    var bodyTouch=null;
    content.addEventListener('touchstart',function(event){
      bodyTouch=null;
      if(!mounted||!expanded||drag||event.touches.length!==1||
        event.target.closest('input,select,textarea,[contenteditable="true"]'))return;
      var t=event.touches[0],scrollers=[];
      for(var node=event.target;node&&content.contains(node);node=node.parentElement){
        if(node.scrollHeight>node.clientHeight+1&&/auto|scroll/.test(getComputedStyle(node).overflowY))scrollers.push(node);
      }
      bodyTouch={id:t.identifier,x:t.clientX,y:t.clientY,lastY:t.clientY,scrollers:scrollers};
      suppressClickUntil=0;
    },{passive:true});
    content.addEventListener('touchmove',function(event){
      if(!bodyTouch||event.touches.length!==1)return;
      var t=event.touches[0];if(t.identifier!==bodyTouch.id)return;
      if(!drag){
        var dy=t.clientY-bodyTouch.y,dx=t.clientX-bodyTouch.x;
        if(Math.max(Math.abs(dx),Math.abs(dy))<10)return;
        if(dy<=0||Math.abs(dx)>Math.abs(dy)){
          bodyTouch=null;return;
        }
        if(!event.cancelable){bodyTouch=null;return;}
        event.preventDefault();
        var remaining=t.clientY-bodyTouch.lastY;
        bodyTouch.scrollers.forEach(function(node){
          var consumed=Math.min(Math.max(0,node.scrollTop),Math.max(0,remaining));
          node.scrollTop-=consumed;remaining-=consumed;
        });
        bodyTouch.lastY=t.clientY;
        if(remaining<=0)return;
        if(!beginDrag(bodyTouch.x,t.clientY-remaining,null,null))return;
      }
      if(drag.id!==null)return;
      event.preventDefault();
      updateDrag(t.clientX,t.clientY);
    },{passive:false});
    window.addEventListener('touchend',function(event){
      if(!bodyTouch)return;
      if(!Array.from(event.changedTouches).some(function(t){return t.identifier===bodyTouch.id;}))return;
      bodyTouch=null;
      if(drag&&drag.id===null)finishDrag(false);
    },{passive:true});
    window.addEventListener('touchcancel',function(){
      bodyTouch=null;
      if(drag&&drag.id===null)finishDrag(true);
    },{passive:true});
    window.addEventListener('pointercancel', function (event) { if (drag && event.pointerId === drag.id) finishDrag(true); });
    sheet.addEventListener('lostpointercapture', function (event) { if (drag && event.pointerId === drag.id) finishDrag(true); });
    window.addEventListener('blur', function () { finishDrag(true); });
    sheet.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drag) { event.preventDefault(); finishDrag(true); return; }
      if (event.key === 'Escape' && expanded) { event.preventDefault(); setOpen(false); }
    });
    // Dragging a link/disclosure must not activate the release click.
    sheet.addEventListener('click',function(event){
      if(event.detail!==0&&performance.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}
    },true);
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
    window.addEventListener('resize', function () {
      // Browser chrome changes height while a finger is held. It must not
      // cancel the gesture and snap the panel out from under that finger.
      if (drag && innerWidth === drag.width) return;
      finishDrag(true); measure();
    });
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

