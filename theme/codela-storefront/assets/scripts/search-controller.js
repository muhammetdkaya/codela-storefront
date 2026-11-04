/**
 * Product search controller: request cancellation, busy state and field events.
 * One instance is created by the storefront entry module.
 */
import { escape, decode, safeURL } from 'codela-storefront/format';

export function createSearchController({ $, config, t, getCurrent }) {
    let timer = null, controller = null, sequence = 0;

    // Mobile discovery is an extension of the existing search panel.
    const recentKey = 'codela-sf-recent-searches-v1';
    let popularProducts = null, popularRequest = null;
    const mobileDiscovery = () => window.matchMedia('(max-width:900px)').matches;

    function recentItems() {
        try {
            const data = JSON.parse(localStorage.getItem(recentKey) || '[]');
            return Array.isArray(data) ? data.filter(q => typeof q === 'string' && q.trim().length > 1).slice(0, 3) : [];
        } catch { return []; }
    }
    function renderRecent() {
        const items = recentItems();
        $('#sf-recent-section').hidden = !items.length;
        $('#sf-recent-list').innerHTML = items.map(q => '<button type="button" class="sf-recent-query sf-ui-pressable" data-search-term="' +
            escape(q) + '">' + escape(q) + '</button>').join('');
    }
    function saveRecent(query) {
        const q = query.trim().slice(0, 80);
        if (q.length < 2) return;
        const items = [q, ...recentItems().filter(item => item.toLocaleLowerCase() !== q.toLocaleLowerCase())].slice(0, 3);
        try { localStorage.setItem(recentKey, JSON.stringify(items)); } catch { /* Storage can be denied in private mode. */ }
        renderRecent();
    }
    function renderPopular() {
        const products = Array.isArray(popularProducts) ? popularProducts : [];
        const cards = products.map(product => {
            const query = decode(product?.name || '').trim().slice(0, 80);
            const photo = product?.images?.[0]?.thumbnail || product?.images?.[0]?.src;
            if (!query || !photo) return '';
            return '<button type="button" class="sf-popular-query sf-ui-pressable" data-search-term="' + escape(query) +
                '"><span class="sf-popular-photo"><img src="' + safeURL(photo) +
                '" alt="" loading="lazy" decoding="async" width="110" height="110"></span><span class="sf-popular-name">' +
                escape(query) + '</span></button>';
        }).filter(Boolean).slice(0, 3);
        $('#sf-popular-list').innerHTML = cards.join('');
        $('#sf-popular-section').hidden = !cards.length;
    }
    async function loadPopular() {
        if (popularProducts !== null) { renderPopular(); return; }
        if (popularRequest) return;
        const api = config()?.api;
        if (!api) return;
        popularRequest = new AbortController();
        const signal = popularRequest.signal;
        try {
            // WooCommerce Store API is already used elsewhere in this theme.
            const url = new URL('products', api);
            url.searchParams.set('orderby', 'popularity');
            url.searchParams.set('per_page', '3');
            const response = await fetch(url, {credentials:'same-origin', signal});
            if (!response.ok) throw new Error('Popular products unavailable');
            const data = await response.json();
            if (signal.aborted) return;
            popularProducts = Array.isArray(data) ? data : [];
            if (getCurrent() === 'search' && mobileDiscovery() && !$('#sf-query').value.trim()) renderPopular();
        } catch { /* Discovery is optional; never block search. */ }
        finally { if (popularRequest?.signal === signal) popularRequest = null; }
    }
    function syncDiscovery() {
        const visible = mobileDiscovery() && getCurrent() === 'search' && !$('#sf-query').value.trim();
        $('#sf-discovery').hidden = !visible;
        if (visible) { renderRecent(); loadPopular(); }
    }

    function cancel() {
        clearTimeout(timer);
        controller?.abort();
        popularRequest?.abort(); popularRequest = null;
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
            saveRecent($('#sf-query').value);
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
            if (event.target.closest('.sf-recent-clear')) {
                try { localStorage.removeItem(recentKey); } catch {}
                renderRecent();
                return;
            }
            const button = event.target.closest('[data-search-term]');
            if (!button) return;
            const query = button.dataset.searchTerm || '';
            $('#sf-query').value = query;
            saveRecent(query);
            cancel();
            syncSearchControls();
            syncDiscovery();
            search();
        });
        $('#sf-results').addEventListener('click', event => {
            if (event.target.closest('a.sf-result')) saveRecent($('#sf-query').value);
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
