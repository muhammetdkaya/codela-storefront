/* Agency homepage hybrid scrolling: one gesture = one screen-sized stage.
   Taller modules, input fields, horizontal galleries and all other pages
   keep normal native scroll. No overscroll or fixed body locks. */
(() => {
  'use strict';
  if (!document.body.classList.contains('home')) return;
  const root = document.querySelector('.sf-content .codela-page-layout');
  if (!root) return;
  const selector = '.sf-agency-widget--studio,.sf-agency-widget--bento,.sf-agency-widget--process';
  const stages = Array.from(root.children).filter(el => el.matches(selector));
  if (stages.length < 2) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ignore = '[data-agency-widget-track],[data-agency-service-track],input,select,textarea,[contenteditable="true"],[role="dialog"]';
  const excluded = target => target instanceof Element && !!target.closest(ignore);
  const viewport = () => window.innerHeight || document.documentElement.clientHeight;
  const top = element => element.getBoundingClientRect().top + window.scrollY;
  const activeIndex = () => {
    const point = window.scrollY + viewport() * .28;
    let index = 0;
    stages.forEach((element, i) => { if (top(element) <= point) index = i; });
    return index;
  };
  let lockUntil = 0;
  let wheelTotal = 0;
  let touch = null;
  const targetFor = direction => {
    const index = activeIndex();
    const current = stages[index];
    const height = current.getBoundingClientRect().height;
    const screen = viewport();
    // A stage with more content than a phone screen must remain scrollable.
    if (height > screen + 28) {
      const local = window.scrollY - top(current);
      if (direction > 0 && local + screen < height - 24) return null;
      if (direction < 0 && local > 24) return null;
    }
    const next = index + direction;
    return next >= 0 && next < stages.length ? stages[next] : null;
  };
  const move = direction => {
    const target = targetFor(direction);
    if (!target) return false;
    lockUntil = performance.now() + (reduced.matches ? 160 : 620);
    window.scrollTo({ top: Math.max(0, Math.round(top(target))),
      behavior: reduced.matches ? 'instant' : 'smooth' });
    return true;
  };
  document.documentElement.classList.add('sf-agency-stage-nav');
  window.addEventListener('wheel', event => {
    if (!event.cancelable || event.ctrlKey || excluded(event.target) ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (performance.now() < lockUntil) {
      event.preventDefault();
      return;
    }
    const direction = Math.sign(event.deltaY);
    if (!direction || !targetFor(direction)) { wheelTotal = 0; return; }
    event.preventDefault();
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport() : 1);
    if (Math.sign(wheelTotal) !== direction) wheelTotal = 0;
    wheelTotal += pixels;
    if (Math.abs(wheelTotal) < 22) return;
    wheelTotal = 0;
    move(direction);
  }, { passive: false });
  window.addEventListener('touchstart', event => {
    if (event.touches.length !== 1 || excluded(event.target)) { touch = null; return; }
    const p = event.touches[0];
    touch = { x: p.clientX, y: p.clientY, lastY: p.clientY,
      horizontal: false, captured: false, locked: performance.now() < lockUntil };
  }, { passive: true });
  window.addEventListener('touchmove', event => {
    if (!touch || !event.cancelable || event.touches.length !== 1) return;
    const p = event.touches[0];
    const dx = p.clientX - touch.x, dy = p.clientY - touch.y;
    touch.lastY = p.clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 9) {
      touch.horizontal = true;
    }
    if (touch.horizontal || Math.abs(dy) < 9) return;
    const direction = dy < 0 ? 1 : -1;
    if (touch.locked || targetFor(direction)) {
      event.preventDefault();
      touch.captured = true;
    }
  }, { passive: false });
  window.addEventListener('touchend', () => {
    if (!touch) return;
    const delta = touch.y - touch.lastY;
    if (touch.captured && !touch.locked && Math.abs(delta) >= 42 &&
        performance.now() >= lockUntil) {
      move(Math.sign(delta));
    }
    touch = null;
  }, { passive: true });
  window.addEventListener('touchcancel', () => { touch = null; }, { passive: true });
})();
