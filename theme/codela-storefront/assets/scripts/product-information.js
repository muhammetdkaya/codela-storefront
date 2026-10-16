/** Small native product enhancements; no gallery/cart/tabs controller. */
(function () {
  'use strict';
  // Woo's thumbnails hook is INSIDE its moving track. Move the existing
  // hidden counter once, before gallery/counter DOM-ready initialization,
  // so it stays pinned to the gallery frame when native slides change.
  var counter = document.getElementById('codela-live-visitor-container');
  var gallery = counter && counter.closest('.woocommerce-product-gallery');
  if (gallery && counter.parentElement !== gallery) gallery.appendChild(counter);
  function revealHash() {
    if (!location.hash) return;
    var target;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
    catch (_) { return; }
    if (!target) return;
    var section = target.closest('.sf-product-information-section');
    if (!section) return;
    section.open = true;
    target.scrollIntoView({block: 'start'});
  }
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a.woocommerce-review-link');
    if (!link) return;
    var section = document.getElementById('sf-product-section-reviews');
    if (section) section.open = true;
  });
  window.addEventListener('hashchange', revealHash);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', revealHash);
  else revealHash();
})();
