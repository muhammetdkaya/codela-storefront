/* Independent agency layout widgets. A duplicated block owns its own state. */
(() => {
  const widgets = Array.from(document.querySelectorAll('[data-agency-widget]'));
  if (!widgets.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scrollWidgets = [];

  widgets.forEach(widget => {
    if (widget.dataset.agencyWidgetInitialized === 'true') return;
    widget.dataset.agencyWidgetInitialized = 'true';

    if (widget.dataset.agencyWidget === 'cards') {
      const cards = Array.from(widget.querySelectorAll('[data-agency-card]'));
      const tabs = Array.from(widget.querySelectorAll('[data-agency-swap-to]'));
      let active = 0;
      const select = index => {
        if (!cards.length) return;
        active = ((index % cards.length) + cards.length) % cards.length;
        cards.forEach((card, i) => {
          const position = (i - active + cards.length) % cards.length;
          card.dataset.pos = String(position);
          card.setAttribute('aria-hidden', String(position !== 0));
          card.tabIndex = position === 0 ? 0 : -1;
        });
        tabs.forEach((tab, i) => tab.setAttribute('aria-pressed', String(i === active)));
      };
      tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i)));
      cards.forEach(card => {
        card.addEventListener('click', () => select(active + 1));
        card.addEventListener('keydown', event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          select(active + 1);
          cards[active]?.focus({ preventScroll: true });
        });
      });
      select(0);
    }

    if (widget.dataset.agencyWidget === 'scroll') {
      const container = widget.querySelector('[data-agency-container-scroll]');
      const device = widget.querySelector('[data-agency-scroll-device]');
      if (container && device) scrollWidgets.push({ container, device });
    }
  });

  if (!scrollWidgets.length) return;
  let frame = 0;
  const sync = () => {
    frame = 0;
    scrollWidgets.forEach(({ container, device }) => {
      if (reduced.matches) {
        device.style.removeProperty('--agency-scroll-rotate');
        device.style.removeProperty('--agency-scroll-scale');
        return;
      }
      const bounds = container.getBoundingClientRect();
      const distance = Math.max(1, bounds.height - window.innerHeight * 0.5);
      const progress = Math.max(0, Math.min(1, (-bounds.top + window.innerHeight * 0.12) / distance));
      device.style.setProperty('--agency-scroll-rotate', (16 * (1 - progress)).toFixed(2) + 'deg');
      device.style.setProperty('--agency-scroll-scale', (0.94 + progress * 0.06).toFixed(3));
    });
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(sync);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  reduced.addEventListener('change', schedule);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; }, { once: true });
  schedule();
})();
