/* Optional pointer depth. Native content, links and details work without JS. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('[data-agency-tilt]').forEach(card => {
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      card.style.removeProperty('--agency-rx');
      card.style.removeProperty('--agency-ry');
    };
    card.addEventListener('pointermove', event => {
      if (reduced.matches || !fine.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = card.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
        const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
        card.style.setProperty('--agency-rx', `${(0.5 - y) * 6}deg`);
        card.style.setProperty('--agency-ry', `${(x - 0.5) * 8}deg`);
      });
    }, { passive: true });
    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointercancel', reset);
    reduced.addEventListener('change', reset);
    fine.addEventListener('change', reset);
    window.addEventListener('pagehide', reset);
  });
})();
