/* Independent agency layout widgets. A duplicated block owns its own state. */
(() => {
  const widgets = Array.from(document.querySelectorAll('[data-agency-widget]'));
  if (!widgets.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

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


    if (widget.dataset.agencyWidget === 'bento') {
      if (!reduced.matches && 'IntersectionObserver' in window) {
        widget.dataset.bentoReady = '1';
        const observer = new IntersectionObserver(entries => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            widget.dataset.bentoVisible = '1';
            observer.disconnect();
          }
        }, { threshold: 0.12 });
        observer.observe(widget);
      }
    }

    if (widget.dataset.agencyWidget === 'services') {
      const track = widget.querySelector('[data-agency-widget-track]');
      const prev = widget.querySelector('[data-agency-widget-prev]');
      const next = widget.querySelector('[data-agency-widget-next]');
      const cards = track ? Array.from(track.querySelectorAll('.sf-agency-poster')) : [];
      const counter = widget.querySelector('[data-agency-widget-count]');
      let frame = 0;

      const sync = () => {
        frame = 0;
        if (!track || !cards.length) return;
        // Desktop/tablet are static grids: no carousel, no changing headline.
        if (window.matchMedia('(min-width: 740px)').matches) {
          widget.style.removeProperty('--sf-service-accent');
          widget.dataset.agencyActiveService = '0';
          if (prev) prev.disabled = true;
          if (next) next.disabled = true;
          if (counter) counter.textContent = '01 / ' + String(cards.length).padStart(2, '0');
          return;
        }
        const step = cards.length > 1
          ? cards[1].offsetLeft - cards[0].offsetLeft
          : cards[0].getBoundingClientRect().width;
        const index = Math.max(0, Math.min(cards.length - 1,
          step ? Math.round(track.scrollLeft / step) : 0));
        widget.style.setProperty('--sf-service-accent',
          cards[index].dataset.agencyServiceAccent || '#4452d1');
        widget.dataset.agencyActiveService = String(index);
        if (prev) prev.disabled = index === 0;
        if (next) next.disabled = index === cards.length - 1;
        if (counter) counter.textContent =
          String(index + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
      };
      const scheduleSync = () => {
        if (!frame) frame = window.requestAnimationFrame(sync);
      };
      if (track && prev && next) {
        const slide = dir => {
          const index = Number(widget.dataset.agencyActiveService || 0);
          const target = cards[Math.max(0, Math.min(cards.length - 1, index + dir))];
          if (!target) return;
          track.scrollTo({
            left: target.offsetLeft - cards[0].offsetLeft,
            behavior: reduced.matches ? 'auto' : 'smooth'
          });
        };
        prev.addEventListener('click', () => slide(-1));
        next.addEventListener('click', () => slide(1));
        track.addEventListener('scroll', scheduleSync, { passive: true });
        window.addEventListener('resize', scheduleSync, { passive: true });
        sync();
      }
    }

    if (widget.dataset.agencyWidget === 'process') {
      const steps = [...widget.querySelectorAll('[data-agency-widget-step]')];
      const stage = widget.querySelector('[data-agency-widget-stage]');
      const kicker = widget.querySelector('[data-agency-widget-stage-kicker]');
      const title = widget.querySelector('[data-agency-widget-stage-title]');
      const body = widget.querySelector('[data-agency-widget-stage-body]');
      const activate = index => {
        const step = steps[index];
        if (!step || !stage || !kicker || !title || !body) return;
        stage.dataset.step = String(index);
        kicker.textContent = step.querySelector('.sf-agency-process-count')?.textContent || '';
        title.textContent = step.querySelector('strong')?.textContent || '';
        body.textContent = step.querySelector('span:last-child')?.textContent || '';
        steps.forEach((button,i) => button.setAttribute('aria-pressed', String(i === index)));
      };
      steps.forEach((button,i) => button.addEventListener('click', () => activate(i)));
      activate(0);
    }
  });

})();
