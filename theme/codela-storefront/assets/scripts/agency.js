/* Codela agency reference interaction port.
   React Bits-style Card Swap controls + Aceternity-style Apple Cards deck.
   No global handlers, third-party runtime or cross-page theme mutations. */
(() => {
  const root = document.querySelector('.sf-agency');
  if (!root || root.dataset.agencyInitialized === 'true') return;
  root.dataset.agencyInitialized = 'true';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Reference hero presentation switch. Only the selected variant participates
  // in layout and pointer/keyboard interaction; the shared shell is untouched.
  const cardsHero = root.querySelector('[data-agency-hero-cards]');
  const scrollHero = root.querySelector('[data-agency-container-scroll]');
  const scrollDevice = root.querySelector('[data-agency-scroll-device]');
  const variantButtons = Array.from(root.querySelectorAll('[data-agency-variant]'));
  let scrollFrame = 0;
  const syncScrollDevice = () => {
    scrollFrame = 0;
    if (!scrollHero || !scrollDevice || scrollHero.hidden) return;
    if (reduced.matches) {
      scrollDevice.style.removeProperty('--agency-scroll-rotate');
      scrollDevice.style.removeProperty('--agency-scroll-scale');
      return;
    }
    const bounds = scrollHero.getBoundingClientRect();
    const distance = Math.max(1, bounds.height - window.innerHeight * 0.5);
    const progress = Math.max(0, Math.min(1, (-bounds.top + window.innerHeight * 0.12) / distance));
    scrollDevice.style.setProperty('--agency-scroll-rotate', (16 * (1 - progress)).toFixed(2) + 'deg');
    scrollDevice.style.setProperty('--agency-scroll-scale', (0.94 + progress * 0.06).toFixed(3));
  };
  const requestScrollSync = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(syncScrollDevice);
  };
  const selectVariant = (mode) => {
    if (!cardsHero || !scrollHero || !['cardswap', 'scroll'].includes(mode)) return;
    cardsHero.hidden = mode !== 'cardswap';
    scrollHero.hidden = mode !== 'scroll';
    variantButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.agencyVariant === mode)));
    requestScrollSync();
  };
  variantButtons.forEach(button => {
    button.addEventListener('click', () => selectVariant(button.dataset.agencyVariant));
  });
  window.addEventListener('scroll', requestScrollSync, { passive: true });
  window.addEventListener('resize', requestScrollSync, { passive: true });
  reduced.addEventListener('change', requestScrollSync);
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
  }, { once: true });
  selectVariant('cardswap');

  // Three layered reference cards; clicks, keyboard and tabs select the front card.
  const stage = root.querySelector('[data-agency-swap]');
  const cards = Array.from(root.querySelectorAll('[data-agency-card]'));
  const tabs = Array.from(root.querySelectorAll('[data-agency-swap-to]'));
  let active = 0;
  function selectCard(index) {
    if (!stage || cards.length < 2) return;
    active = ((index % cards.length) + cards.length) % cards.length;
    cards.forEach((card, i) => {
      const position = (i - active + cards.length) % cards.length;
      card.dataset.pos = String(position);
      card.setAttribute('aria-hidden', String(position !== 0));
      card.tabIndex = position === 0 ? 0 : -1;
    });
    tabs.forEach((tab, i) => tab.setAttribute('aria-pressed', String(i === active)));
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectCard(i));
  });
  cards.forEach((card) => {
    card.addEventListener('click', () => selectCard(active + 1));
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      selectCard(active + 1);
      cards[active]?.focus({ preventScroll: true });
    });
  });
  selectCard(0);

  // Native scrollport: touch inertia, swipe and keyboard scrolling work without JS.
  const track = root.querySelector('[data-agency-service-track]');
  const prev = root.querySelector('[data-agency-carousel-prev]');
  const next = root.querySelector('[data-agency-carousel-next]');
  if (track && prev && next) {
    const getStep = () => {
      const card = track.querySelector('.sf-agency-poster');
      if (!card) return 0;
      const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
      return card.getBoundingClientRect().width + gap;
    };
    let frame = 0;
    const syncArrows = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = Math.max(0, track.scrollWidth - track.clientWidth);
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= max - 2;
      });
    };
    const slide = (direction) => {
      const step = getStep();
      if (!step) return;
      track.scrollBy({ left: direction * step, behavior: reduced.matches ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', () => slide(-1));
    next.addEventListener('click', () => slide(1));
    track.addEventListener('scroll', syncArrows, { passive: true });
    window.addEventListener('resize', syncArrows, { passive: true });
    syncArrows();
  }

  // Aceternity-style expanded service detail; all copy belongs to this page.
  const modal = root.querySelector('[data-agency-dialog]');
  const serviceData = {
    web: {
      kicker: 'KURUMSAL WEB & ELEMENTOR',
      title: 'Markanıza özel kurumsal siteler ve modern web deneyimleri.',
      description: 'Markanın kimliğini öne çıkaran, mobil öncelikli ve kolay yönetilebilir WordPress siteleri oluşturuyoruz.',
      bullets: ['Özgün arayüz tasarımı ve özel tema geliştirme', 'Çok dilli yapı ve dinamik içerik alanları', 'Performans, erişilebilirlik ve teknik SEO']
    },
    elementor: {
      kicker: 'ELEMENTOR & ÖZEL WIDGET',
      title: 'Esnek, yönetilebilir ve markanıza özel Elementor mimarileri.',
      description: 'Standart şablonlara bağlı kalmadan Elementor üzerinde sürdürülebilir sayfa sistemleri kuruyoruz.',
      bullets: ['Özel Elementor widget ve bileşenleri', 'Figma tasarımlarının hassas uygulaması', 'ACF ve dinamik içerik entegrasyonu']
    },
    commerce: {
      kicker: 'WOOCOMMERCE & E-TİCARET',
      title: 'Ürün keşfinden ödemeye güçlü WooCommerce mağazaları.',
      description: 'Mağazanın görsel tasarımını, dönüşüm akışını ve operasyonel entegrasyonlarını birlikte ele alıyoruz.',
      bullets: ['WooCommerce mağaza ve ürün deneyimi', 'Sanal POS, kargo ve e-fatura bağlantıları', 'Özelleştirilmiş sepet ve ödeme adımları']
    },
    code: {
      kicker: 'ÖZEL GELİŞTİRME & API',
      title: 'Hazır eklentilerin yetmediği noktada özel WordPress yazılımı.',
      description: 'İş süreçlerine uygun eklentiler, API köprüleri ve yönetim araçları tasarlıyoruz.',
      bullets: ['Sıfırdan eklenti geliştirme', 'ERP/CRM, muhasebe ve üçüncü taraf API entegrasyonları', 'Güvenilir veri akışı ve bakım desteği']
    }
  };
  if (modal && typeof modal.showModal === 'function') {
    let returnFocus = null;
    const kicker = modal.querySelector('[data-agency-dialog-label]');
    const title = modal.querySelector('[data-agency-dialog-title]');
    const description = modal.querySelector('[data-agency-dialog-desc]');
    const list = modal.querySelector('[data-agency-dialog-list]');
    root.querySelectorAll('[data-agency-detail]').forEach(button => {
      button.addEventListener('click', () => {
        const data = serviceData[button.dataset.agencyDetail];
        if (!data) return;
        kicker.textContent = data.kicker;
        title.textContent = data.title;
        description.textContent = data.description;
        list.replaceChildren(...data.bullets.map(value => {
          const li = document.createElement('li');
          li.textContent = value;
          return li;
        }));
        returnFocus = button;
        modal.showModal();
        modal.querySelector('[data-agency-dialog-close]')?.focus({ preventScroll: true });
      });
    });
    modal.querySelector('[data-agency-dialog-close]')?.addEventListener('click', () => modal.close());
    modal.addEventListener('click', event => {
      if (event.target === modal) modal.close();
    });
    modal.addEventListener('close', () => {
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    });
  }
}
  // Reference Services page: filter the six real WordPress service cards and
  // carry checked services to the real contact form; no fake submission.
  const servicePage = document.querySelector('[data-agency-services]');
  if (servicePage) {
    const cards = Array.from(servicePage.querySelectorAll('[data-agency-mod-cat]'));
    const filters = Array.from(servicePage.querySelectorAll('[data-agency-filter]'));
    const checks = Array.from(servicePage.querySelectorAll('.sf-agency-module-check input[type="checkbox"]'));
    const summary = servicePage.querySelector('[data-agency-selection-summary]');
    const cta = servicePage.querySelector('[data-agency-selected-cta]');
    const updateSelection = () => {
      const selected = checks.filter(input => input.checked).map(input => input.value);
      checks.forEach(input => {
        const label = input.closest('label')?.querySelector('[data-agency-check-label]');
        if (label) label.textContent = input.checked ? 'Seçili' : 'Seç';
      });
      if (summary) summary.textContent = selected.length
        ? selected.length + ' hizmet seçildi: ' + selected.join(', ')
        : 'Henüz bir hizmet seçmediniz.';
      if (cta) {
        cta.setAttribute('aria-disabled', String(selected.length === 0));
        cta.tabIndex = selected.length ? 0 : -1;
        const url = new URL(cta.dataset.agencyContactBase || cta.href, window.location.href);
        if (!cta.dataset.agencyContactBase) cta.dataset.agencyContactBase = cta.href;
        if (selected.length) url.searchParams.set('hizmetler', selected.join(', '));
        else url.searchParams.delete('hizmetler');
        cta.href = url.toString();
      }
    };
    filters.forEach(button => button.addEventListener('click', () => {
      const filter = button.dataset.agencyFilter;
      filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      cards.forEach(card => { card.hidden = filter !== 'all' && card.dataset.agencyModCat !== filter; });
    }));
    checks.forEach(input => input.addEventListener('change', updateSelection));
    updateSelection();
  }

  // The public contact page receives selected service names only as editable
  // plain text, never as HTML. The actual POST is handled server-side by WP.
  const contactInput = document.querySelector('[data-agency-contact-services]');
  if (contactInput) {
    const chosen = new URLSearchParams(window.location.search).get('hizmetler');
    if (chosen) contactInput.value = chosen.slice(0, 450);
  }

  // Aceternity-reference Sticky Scroll Reveal: activate from touch/keyboard
  // and viewport visibility. The panel is sticky through native CSS.
  const process = document.querySelector('[data-agency-process]');
  if (process) {
    const steps = Array.from(process.querySelectorAll('[data-agency-step]'));
    const stage = process.querySelector('[data-agency-process-stage]');
    const kicker = process.querySelector('[data-agency-stage-kicker]');
    const badge = process.querySelector('[data-agency-stage-badge]');
    const note = process.querySelector('[data-agency-stage-note]');
    const pane = process.querySelector('[data-agency-stage-rows]');
    const phases = [
      {
        kicker: '01 · ANALİZ & MİMARİ', badge: 'YOL HARİTASI',
        note: 'İhtiyacınızı ve doğru altyapıyı netleştiriyoruz.',
        rows: [['✓ Kurumsal kimlik & sayfa akış planı', 'Planlandı'], ['✓ Elementor / WooCommerce / eklenti kapsamı', 'Netleştirildi']]
      }, {
        kicker: '02 · TASARIM & GELİŞTİRME', badge: 'CANLI TEST',
        note: 'Geliştirme boyunca geri bildirimle ilerliyoruz.',
        rows: [['✓ Özel arayüz ve Elementor bileşenleri', 'Tasarım'], ['✓ WooCommerce / API geliştirme', 'Uygulama']]
      }, {
        kicker: '03 · TEST & YAYIN', badge: 'DESTEK',
        note: 'Yayın sonrasında da gelişimi sürdürüyoruz.',
        rows: [['✓ Mobil, hız & güvenlik kontrolleri', 'Test'], ['✓ Yönetim ve bakım desteği', 'Süreklilik']]
      }
    ];
    const activate = index => {
      const phase = phases[index];
      if (!phase || !stage || !pane) return;
      stage.dataset.step = String(index);
      if (kicker) kicker.textContent = phase.kicker;
      if (badge) badge.textContent = phase.badge;
      if (note) note.textContent = phase.note;
      pane.replaceChildren(...phase.rows.map(([name, status]) => {
        const row = document.createElement('div');
        row.className = 'sf-agency-process-stage-row';
        const label = document.createElement('span');
        label.textContent = name;
        const pill = document.createElement('em');
        pill.textContent = status;
        row.append(label, pill);
        return row;
      }));
      steps.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    };
    steps.forEach((button, i) => {
      button.addEventListener('click', () => activate(i));
      button.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse') activate(i);
      });
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        const candidates = entries.filter(entry => entry.isIntersecting);
        if (!candidates.length) return;
        candidates.sort((a,b) => b.intersectionRatio - a.intersectionRatio);
        const index = Number(candidates[0].target.dataset.agencyStep);
        if (Number.isInteger(index)) activate(index);
      }, { rootMargin: '-18% 0px -38% 0px', threshold: [0.2,0.5,0.8] });
      steps.forEach(button => observer.observe(button));
      window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
    }
    activate(0);
  }
})();
