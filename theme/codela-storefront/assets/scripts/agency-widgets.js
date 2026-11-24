/* Independent agency layout widgets. A duplicated block owns its own state. */
(() => {
  const widgets = Array.from(document.querySelectorAll('[data-agency-widget]'));
  if (!widgets.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  widgets.forEach(widget => {
    if (widget.dataset.agencyWidgetInitialized === 'true') return;
    widget.dataset.agencyWidgetInitialized = 'true';

    if (widget.dataset.agencyWidget === 'project') {
      const form = widget.querySelector('[data-project-form]');
      const first = widget.querySelector('[data-project-step="1"]');
      const second = widget.querySelector('[data-project-step="2"]');
      const next = widget.querySelector('[data-project-next]');
      const back = widget.querySelector('[data-project-back]');
      const progress = widget.querySelector('[data-project-progress-bar]');
      const indicator = widget.querySelector('[data-project-progress-label]');
      const summary = widget.querySelector('[data-project-summary]');
      if (form && first && second && next && back && progress && indicator && summary) {
        const detailFields = [...second.querySelectorAll('input,textarea')];
        const selected = name => form.querySelector('input[name="' + name + '"]:checked')?.value || '';
        const show = step => {
          first.hidden = step !== 1;
          second.hidden = step !== 2;
          detailFields.forEach(input => { input.disabled = step !== 2; });
          progress.style.width = step === 1 ? '50%' : '100%';
          indicator.textContent = step === 1 ? '1 / 2' : '2 / 2';
          if (step === 2) {
            summary.textContent = [selected('agency_project_service'),
              selected('agency_project_time'),
              selected('agency_project_scale')].filter(Boolean).join(' · ');
          }
          const heading = (step === 1 ? first : second).querySelector('h1,h2');
          if (heading) {
            heading.tabIndex = -1;
            heading.focus({preventScroll:true});
          }
        };
        next.addEventListener('click', () => show(2));
        back.addEventListener('click', () => show(1));
        form.addEventListener('submit', event => {
          if (!form.checkValidity()) {
            event.preventDefault();
            form.reportValidity();
            return;
          }
          const submit = form.querySelector('[data-project-submit]');
          if (submit) {
            submit.disabled = true;
            submit.setAttribute('aria-busy', 'true');
            submit.firstChild.textContent = 'Gönderiliyor ';
          }
        });
        const requestedError = /(?:[?&])codela_status=(?:invalid|failed|wait)(?:&|$)/.test(window.location.search);
        show(requestedError ? 2 : 1);
      }
    }

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


    if (widget.dataset.agencyWidget === 'contact-bento') {
      const copyButton = widget.querySelector('[data-agency-copy-email]');
      if (copyButton) {
        copyButton.addEventListener('click', async () => {
          const email = copyButton.dataset.email || '';
          const hint = copyButton.querySelector('[data-agency-copy-hint]');
          if (!email || !hint) return;
          try {
            if (!navigator.clipboard?.writeText) throw new Error('unavailable');
            await navigator.clipboard.writeText(email);
            hint.textContent = 'Kopyalandı ✓';
          } catch (_) {
            // Do not claim it was copied when the browser denies clipboard access.
            hint.textContent = 'E-posta uygulamasını açın';
            window.location.href = 'mailto:' + encodeURIComponent(email);
          }
        });
      }
      const formDisclosure = widget.querySelector('details#sf-agency-contact-form');
      const openFromAnchor = () => {
        if (formDisclosure && window.location.hash === '#sf-agency-contact-form') formDisclosure.open = true;
      };
      openFromAnchor();
      window.addEventListener('hashchange', openFromAnchor);
      widget.querySelectorAll('a[href="#sf-agency-contact-form"]').forEach(link => {
        link.addEventListener('click', () => { if (formDisclosure) formDisclosure.open = true; });
      });
      // WordPress redirects after form POST with a status query. The message
      // must be visible without requiring visitors to scroll back down.
      const notice = widget.querySelector('.cdl-contact__notice');
      if (notice && window.location.search.includes('codela_status=')) {
        widget.querySelector('#sf-agency-contact-form')?.scrollIntoView({block:'start'});
      }
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
      const counter = widget.querySelector('[data-agency-widget-counter]');
      const image = widget.querySelector('[data-agency-widget-stage-image]');
      const outcome = widget.querySelector('[data-agency-widget-stage-kicker]');
      const title = widget.querySelector('[data-agency-widget-stage-title]');
      const body = widget.querySelector('[data-agency-widget-stage-body]');
      const previous = widget.querySelector('[data-agency-widget-prev]');
      const next = widget.querySelector('[data-agency-widget-next]');
      const nextLabel = widget.querySelector('[data-agency-widget-next-label]');
      if (steps.length && stage && counter && image && outcome && title && body && previous && next && nextLabel) {
        let active = 0;
        let shown = 0;
        const visual = image.parentElement;
        image.dataset.processImageLayer = '0';
        image.dataset.processImageActive = 'true';
        const layers = new Map([[0, { node: image, ready: Promise.resolve(true) }]]);
        const prepare = (index, priority = 'low') => {
          if (layers.has(index)) return layers.get(index);
          const src = steps[index]?.dataset.agencyStageImage;
          if (!src) return null;
          const node = document.createElement('img');
          node.alt = '';
          node.width = image.width || 1376;
          node.height = image.height || 768;
          node.decoding = 'async';
          node.fetchPriority = priority;
          node.dataset.processImageLayer = String(index);
          node.dataset.processImageActive = 'false';
          const ready = new Promise(resolve => {
            node.addEventListener('load', async () => {
              try { await node.decode(); } catch (_) {}
              resolve(node.naturalWidth > 0);
            }, { once: true });
            node.addEventListener('error', () => resolve(false), { once: true });
          });
          const layer = { node, ready };
          layers.set(index, layer);
          visual.appendChild(node);
          node.src = src;
          ready.then(ok => { if (ok) node.dataset.processImageReady = 'true'; });
          return layer;
        };
        const warm = () => {
          steps.forEach((_, index) => { if (index) prepare(index); });
        };
        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            warm();
            observer.disconnect();
          }, { rootMargin: '800px 0px' });
          observer.observe(widget);
        } else {
          window.addEventListener('load', warm, { once: true });
          if (document.readyState === 'complete') warm();
        }
        widget.addEventListener('pointerenter', warm, { once: true });
        widget.addEventListener('focusin', warm, { once: true });
        const showImage = index => {
          const layer = prepare(index, 'high');
          if (!layer || shown === index) return;
          layer.node.fetchPriority = 'high';
          const commit = () => {
            if (active !== index) return;
            layers.get(shown).node.dataset.processImageActive = 'false';
            layer.node.dataset.processImageActive = 'true';
            shown = index;
          };
          if (layer.node.dataset.processImageReady === 'true' || index === 0) commit();
          else layer.ready.then(ok => { if (ok) commit(); });
        };
        const activate = (index, animate = true) => {
          const step = steps[index];
          if (!step) return;
          active = index;
          stage.dataset.step = String(index);
          counter.textContent = (index + 1) + ' / ' + steps.length;
          showImage(index);
          outcome.textContent = step.dataset.agencyStageOutcome || '';
          title.textContent = step.dataset.agencyStageTitle || '';
          body.textContent = step.dataset.agencyStageBody || '';
          nextLabel.textContent = step.dataset.agencyStageNextLabel || 'Süreci Başlat';
          previous.disabled = index === 0;
          steps.forEach((button, i) => {
            button.setAttribute('aria-pressed', String(i === index));
            button.dataset.complete = String(i <= index);
          });
          if (animate && !reduced.matches && typeof stage.animate === 'function') {
            stage.getAnimations?.().forEach(animation => animation.cancel());
            stage.animate(
              [{ opacity: .9 }, { opacity: 1 }],
              { duration: 150, easing: 'ease-out' }
            );
          }
        };
        steps.forEach((button, i) => button.addEventListener('click', () => activate(i)));
        previous.addEventListener('click', () => { if (active > 0) activate(active - 1); });
        next.addEventListener('click', event => {
          if (active < steps.length - 1) {
            event.preventDefault();
            activate(active + 1);
          }
          // At the final step this is a normal WordPress project-page link.
        });
        activate(0, false);
      }
    }
  });

})();
