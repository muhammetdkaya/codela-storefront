/**
 * Product search controller: request cancellation, busy state and field events.
 * One instance is created by the storefront entry module.
 */
import { escape, decode, safeURL, money } from 'codela-storefront/format';

export function createSearchController({ $, config, t, getCurrent }) {
    let timer = null, controller = null, sequence = 0;
    let returnScroll = null;
    function restorePanelScroll() {
        if (returnScroll === null) return;
        const content = $('#sf-search .sf-search-content');
        if (content) content.scrollTop = returnScroll;
        returnScroll = null;
    }

    // Discovery extends the existing mobile search panel; no search backend or header is added.
    let discoveryProducts = null, discoveryTerms = null, discoveryRequest = null;
    const mobileDiscovery = () => window.matchMedia('(max-width:900px)').matches;

    // Fit as many stacked suggestions as the viewport permits while keeping
    // the complete Discover card (image, title and price) above the floating dock.
    function fitDiscoveryTerms() {
        if ($('#sf-discovery').hidden || getCurrent() !== 'search' || !mobileDiscovery() || $('#sf-discovery').classList.contains('is-loading')) return;
        const buttons = Array.from($('#sf-popular-list').children);
        const shelf = $('#sf-explore-section');
        if (!shelf.hidden) {
            // Fade only genuinely clipped product titles; short names remain crisp.
            $('#sf-explore-list').querySelectorAll('.sf-explore-name').forEach(label => {
                label.classList.toggle('is-clipped', label.scrollWidth > label.clientWidth + 1);
            });
        }
        if (shelf.hidden || !buttons.length) return;
        // Three suggestions by default; a fourth is only useful on genuinely tall screens.
        // Responsive fitting below may still hide more to keep Discover above the dock.
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const visibleLimit = viewportHeight >= 880 ? 4 : 3;
        buttons.forEach((button, index) => { button.hidden = index >= visibleLimit; });
        const viewportBottom = window.visualViewport
            ? window.visualViewport.offsetTop + window.visualViewport.height
            : window.innerHeight;
        const dock = document.querySelector('#sf-panel .sf-mobile-dock:not([hidden])');
        const dockTop = dock && getComputedStyle(dock).display !== 'none'
            ? dock.getBoundingClientRect().top : viewportBottom;
        const bottom = Math.min(viewportBottom, dockTop) - 14;
        // Never hide the discovery shelf: reduce suggestions, not product visibility.
        for (let visible = Math.min(buttons.length, visibleLimit); visible > 1 && shelf.getBoundingClientRect().bottom > bottom; visible--) {
            buttons[visible - 1].hidden = true;
        }
    }

    // Reserve real discovery geometry immediately, while both Woo Store API
    // requests are pending. No invented suggestions or products are displayed.
    function showDiscoverySkeleton() {
        const discovery = $('#sf-discovery');
        if (discovery.hidden || getCurrent() !== 'search' || !mobileDiscovery()) return;
        discovery.classList.add('is-loading');
        discovery.setAttribute('aria-busy', 'true');
        $('#sf-popular-section').hidden = false;
        $('#sf-explore-section').hidden = false;
        $('#sf-popular-list').innerHTML = [136, 88, 112].map(width =>
            '<span class="sf-discovery-term-skeleton sf-discovery-shimmer" style="width:' + width +
            'px" aria-hidden="true"></span>'
        ).join('') + '<span class="screen-reader-text" role="status">' + escape(t('Loading…')) + '</span>';
        const card = '<div class="sf-explore-card sf-discovery-card-skeleton" aria-hidden="true">' +
            '<span class="sf-explore-photo sf-discovery-shimmer"></span>' +
            '<span class="sf-explore-name sf-discovery-shimmer"></span>' +
            '<span class="sf-explore-price sf-discovery-shimmer"></span></div>';
        $('#sf-explore-list').innerHTML = card.repeat(3);
    }

    function clearDiscoverySkeleton() {
        const discovery = $('#sf-discovery');
        if (!discovery.classList.contains('is-loading')) return;
        discovery.classList.remove('is-loading');
        discovery.setAttribute('aria-busy', 'false');
        $('#sf-popular-list').textContent = '';
        $('#sf-explore-list').textContent = '';
        $('#sf-popular-section').hidden = true;
        $('#sf-explore-section').hidden = true;
    }

    function renderDiscovery() {
        $('#sf-discovery').classList.remove('is-loading');
        $('#sf-discovery').setAttribute('aria-busy', 'false');
        const terms = Array.isArray(discoveryTerms) ? discoveryTerms : [];
        $('#sf-popular-list').innerHTML = terms.slice(0, 4).map(query =>
            '<button type="button" class="sf-popular-term sf-ui-surface sf-ui-pressable" data-search-term="' +
            escape(query) + '">' + escape(query) + '</button>'
        ).join('');
        $('#sf-popular-section').hidden = !terms.length;

        const cards = (Array.isArray(discoveryProducts) ? discoveryProducts : []).map((product, index) => {
            const photo = product?.images?.[0]?.src || product?.images?.[0]?.thumbnail;
            const href = safeURL(product?.permalink);
            const name = decode(product?.name || '').trim();
            // A discovery shelf must not advertise placeholder titles or zero-price test items.
            const amount = Number(product?.prices?.price);
            if (!photo || !href || name.length < 3 || !Number.isFinite(amount) || amount <= 0) return '';
            let price = '';
            try {
                if (product?.prices?.price != null) price = money(product.prices.price, product.prices);
            } catch { /* An invalid currency must not break discovery. */ }
            return '<a class="sf-explore-card sf-ui-pressable" href="' + href +
                '"><span class="sf-explore-photo"><img src="' + safeURL(photo) +
                '" alt="" loading="' + (index < 2 ? 'eager' : 'lazy') + '" decoding="async" width="320" height="320"></span>' +
                '<span class="sf-explore-name">' + escape(name) + '</span>' +
                (price ? '<strong class="sf-explore-price">' + escape(price) + '</strong>' : '') + '</a>';
        }).filter(Boolean).slice(0, 6);
        $('#sf-explore-list').innerHTML = cards.join('');
        $('#sf-explore-section').hidden = !cards.length;
        fitDiscoveryTerms();
        restorePanelScroll();
    }

    async function loadDiscovery() {
        if (discoveryProducts !== null && discoveryTerms !== null) { renderDiscovery(); return; }
        if (discoveryRequest) return;
        const api = config()?.api;
        if (!api) return;
        discoveryRequest = new AbortController();
        const signal = discoveryRequest.signal;
        showDiscoverySkeleton();
        try {
            // Reuse WooCommerce Store API; fetch only when the empty mobile search opens.
            const productsURL = new URL('products', api);
            productsURL.searchParams.set('orderby', 'popularity');
            productsURL.searchParams.set('per_page', '8');
            const categoriesURL = new URL('products/categories', api);
            categoriesURL.searchParams.set('orderby', 'count');
            categoriesURL.searchParams.set('order', 'desc');
            categoriesURL.searchParams.set('per_page', '8');
            const fetchJSON = url => fetch(url, {credentials:'same-origin', signal})
                .then(response => {
                    if (!response.ok) throw new Error('Discovery unavailable');
                    return response.json();
                });
            const [productsResult, categoriesResult] = await Promise.allSettled([
                fetchJSON(productsURL), fetchJSON(categoriesURL),
            ]);
            if (signal.aborted) return;
            const products = productsResult.status === 'fulfilled' && Array.isArray(productsResult.value)
                ? productsResult.value : [];
            const categories = categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value)
                ? categoriesResult.value : [];
            const terms = [], seen = new Set();
            const addTerm = raw => {
                const value = decode(raw || '').trim();
                const key = value.toLocaleLowerCase();
                if (value.length < 2 || value.length > 32 || /^(uncategorized|kategorisiz|genel)$/i.test(value) || seen.has(key)) return;
                seen.add(key);
                terms.push(value);
            };
            categories.forEach(category => addTerm(category?.name));
            if (terms.length < 4) products.forEach(product => (product?.categories || []).forEach(category => addTerm(category?.name)));
            if (terms.length < 4) products.forEach(product => (product?.tags || []).forEach(tag => addTerm(tag?.name)));
            discoveryTerms = terms.slice(0, 5);
            discoveryProducts = products;
            if (getCurrent() === 'search' && mobileDiscovery() && !$('#sf-query').value.trim()) renderDiscovery();
        } catch {
            // An unavailable discovery API must not leave permanent placeholders.
            if (!signal.aborted) clearDiscoverySkeleton();
        } finally { if (discoveryRequest?.signal === signal) discoveryRequest = null; }
    }

    function syncDiscovery() {
        const visible = mobileDiscovery() && getCurrent() === 'search' && !$('#sf-query').value.trim();
        $('#sf-discovery').hidden = !visible;
        if (visible) loadDiscovery();
        else clearDiscoverySkeleton();
    }

    function cancel() {
        clearTimeout(timer);
        controller?.abort();
        discoveryRequest?.abort(); discoveryRequest = null;
        clearDiscoverySkeleton();
        ++sequence;
        $('#sf-results')?.setAttribute('aria-busy','false');
    }

    function bind() {
        $('#sf-query').addEventListener('input', () => {
            returnScroll = null;
            cancel();
            $('#sf-results').textContent = '';
            syncSearchControls();
            syncDiscovery();
            timer = setTimeout(search,180);
        });
        $('#sf-search form').addEventListener('submit',event => {
            event.preventDefault();
            clearTimeout(timer);
            search();
        });
        $('.sf-search-clear').addEventListener('click', () => {
            returnScroll = null;
            $('#sf-query').value = '';
            cancel();
            $('#sf-results').textContent = '';
            syncSearchControls();
            syncDiscovery();
            $('#sf-query').focus({preventScroll:true});
        });
        $('#sf-discovery').addEventListener('click', event => {
            const button = event.target.closest('button[data-search-term]');
            if (!button) return;
            returnScroll = null;
            $('#sf-query').value = button.dataset.searchTerm || '';
            cancel();
            syncSearchControls();
            syncDiscovery();
            search();
        });
        window.addEventListener('resize', fitDiscoveryTerms, {passive:true});
        window.visualViewport?.addEventListener('resize', fitDiscoveryTerms, {passive:true});
    }

    function syncSearchControls() {
        const input = $('#sf-query');
        $('.sf-search-clear').hidden = input.value.length === 0;
    }
    async function search() {
        const query = $('#sf-query').value.trim();
        syncSearchControls();
        const requestId = ++sequence;
        controller?.abort();
        const results = $('#sf-results');
        results.setAttribute('aria-busy','false');
        if (query.length < 2) { results.textContent = ''; return; }
        controller = new AbortController();
        results.setAttribute('aria-busy','true');
        // Static skeleton appears only during a real in-flight product search.
        const row = '<div class="sf-skeleton-row"><i></i><span><b></b><b></b></span></div>';
        results.innerHTML = '<div class="sf-search-skeleton" aria-hidden="true">' + row.repeat(6) + '</div>' +
            '<span class="screen-reader-text">' + escape(t('Loading…')) + '</span>';
        try {
            const url = new URL(config().search); url.searchParams.set('q',query);
            const response = await fetch(url, {credentials:'same-origin', signal:controller.signal, cache:'no-store'});
            if (!response.ok) throw new Error();
            const products = await response.json();
            if (requestId !== sequence || getCurrent() !== 'search') return;
            // price_html is the theme's server-side, price-only KSES allowlist.
            // Native Woo screen-reader text stays hidden visually and readable
            // to assistive technology; old API responses retain a text fallback.
            results.innerHTML = products.length ? products.map(p => `<a class="sf-result" href="${safeURL(p.url)}"><img src="${safeURL(p.image)}" alt="" width="80" height="100"><div><h3>${escape(decode(p.name))}</h3><p>${typeof p.price_html === 'string' ? p.price_html : escape(decode(p.price))}</p><small>${escape(p.sku)}</small></div></a>`).join('') : `<p>${escape(t('No matching products.'))}</p>`;
        } catch (error) {
            if (error.name !== 'AbortError' && requestId === sequence && getCurrent() === 'search') results.innerHTML = `<p>${escape(t('Something went wrong. Please try again.'))}</p><button class="sf-retry-search sf-ui-pressable">${escape(t('Retry'))}</button>`;
        } finally {
            if (requestId === sequence) {
                results.setAttribute('aria-busy','false');
                if (getCurrent() === 'search') restorePanelScroll();
            }
        }
    }

    function restore(state) {
        // Rebuild the same search using the actual Woo endpoint. Never persist
        // opaque result HTML or take a stale product snapshot across documents.
        const query = typeof state?.query === 'string' ? state.query.slice(0, 80) : '';
        returnScroll = Math.max(0, Math.min(100000, Number(state?.scrollTop) || 0));
        cancel();
        $('#sf-query').value = query;
        $('#sf-results').textContent = '';
        syncSearchControls();
        syncDiscovery();
        if (query.trim().length >= 2) return search();
        if (!query.trim() && discoveryProducts !== null) restorePanelScroll();
        return Promise.resolve();
    }

    return {
        bind,
        cancel,
        start() { syncSearchControls(); syncDiscovery(); return search(); },
        retry: search,
        restore,
        syncControls: syncSearchControls,
    };
}
