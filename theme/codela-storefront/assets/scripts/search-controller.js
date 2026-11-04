/**
 * Product search controller: request cancellation, busy state and field events.
 * One instance is created by the storefront entry module.
 */
import { escape, decode, safeURL, money } from 'codela-storefront/format';

export function createSearchController({ $, config, t, getCurrent }) {
    let timer = null, controller = null, sequence = 0;

    // Discovery extends the existing mobile search panel; no search backend or header is added.
    let discoveryProducts = null, discoveryTerms = null, discoveryRequest = null;
    const mobileDiscovery = () => window.matchMedia('(max-width:900px)').matches;

    function renderDiscovery() {
        const terms = Array.isArray(discoveryTerms) ? discoveryTerms : [];
        $('#sf-popular-list').innerHTML = terms.map(query =>
            '<button type="button" class="sf-popular-term sf-ui-surface sf-ui-pressable" data-search-term="' +
            escape(query) + '">' + escape(query) + '</button>'
        ).join('');
        $('#sf-popular-section').hidden = !terms.length;

        const cards = (Array.isArray(discoveryProducts) ? discoveryProducts : []).map(product => {
            const photo = product?.images?.[0]?.src || product?.images?.[0]?.thumbnail;
            const href = safeURL(product?.permalink);
            const name = decode(product?.name || '').trim();
            if (!photo || !href || !name) return '';
            let price = '';
            try {
                if (product?.prices?.price != null) price = money(product.prices.price, product.prices);
            } catch { /* An invalid currency must not break discovery. */ }
            return '<a class="sf-explore-card sf-ui-pressable" href="' + href +
                '"><span class="sf-explore-photo"><img src="' + safeURL(photo) +
                '" alt="" loading="lazy" decoding="async" width="320" height="320"></span>' +
                '<span class="sf-explore-name">' + escape(name) + '</span>' +
                (price ? '<strong class="sf-explore-price">' + escape(price) + '</strong>' : '') + '</a>';
        }).filter(Boolean).slice(0, 6);
        $('#sf-explore-list').innerHTML = cards.join('');
        $('#sf-explore-section').hidden = !cards.length;
    }

    async function loadDiscovery() {
        if (discoveryProducts !== null && discoveryTerms !== null) { renderDiscovery(); return; }
        if (discoveryRequest) return;
        const api = config()?.api;
        if (!api) return;
        discoveryRequest = new AbortController();
        const signal = discoveryRequest.signal;
        try {
            // Reuse WooCommerce Store API; fetch only when the empty mobile search opens.
            const productsURL = new URL('products', api);
            productsURL.searchParams.set('orderby', 'popularity');
            productsURL.searchParams.set('per_page', '6');
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
            discoveryTerms = terms.slice(0, 4);
            discoveryProducts = products;
            if (getCurrent() === 'search' && mobileDiscovery() && !$('#sf-query').value.trim()) renderDiscovery();
        } catch { /* Optional discovery must never block normal search. */ }
        finally { if (discoveryRequest?.signal === signal) discoveryRequest = null; }
    }

    function syncDiscovery() {
        const visible = mobileDiscovery() && getCurrent() === 'search' && !$('#sf-query').value.trim();
        $('#sf-discovery').hidden = !visible;
        if (visible) loadDiscovery();
    }

    function cancel() {
        clearTimeout(timer);
        controller?.abort();
        discoveryRequest?.abort(); discoveryRequest = null;
        ++sequence;
        $('#sf-results')?.setAttribute('aria-busy','false');
    }

    function bind() {
        $('#sf-query').addEventListener('input', () => {
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
            $('#sf-query').value = button.dataset.searchTerm || '';
            cancel();
            syncSearchControls();
            syncDiscovery();
            search();
        });
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
        } finally { if (requestId === sequence) results.setAttribute('aria-busy','false'); }
    }

    return {
        bind,
        cancel,
        start() { syncSearchControls(); syncDiscovery(); return search(); },
        retry: search,
        syncControls: syncSearchControls,
    };
}
