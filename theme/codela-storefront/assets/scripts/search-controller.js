/**
 * Product search controller: request cancellation, busy state and field events.
 * One instance is created by the storefront entry module.
 */
import { escape, decode, safeURL } from 'codela-storefront/format';

export function createSearchController({ $, config, t, getCurrent }) {
    let timer = null, controller = null, sequence = 0;

    function cancel() {
        clearTimeout(timer);
        controller?.abort();
        ++sequence;
        $('#sf-results')?.setAttribute('aria-busy','false');
    }

    function bind() {
        $('#sf-query').addEventListener('input', () => {
            cancel();
            $('#sf-results').textContent = '';
            syncSearchControls();
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
            $('#sf-query').focus({preventScroll:true});
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
            results.innerHTML = products.length ? products.map(p => `<a class="sf-result" href="${safeURL(p.url)}"><img src="${safeURL(p.image)}" alt="" width="80" height="100"><div><h3>${escape(decode(p.name))}</h3><p>${escape(decode(p.price))}</p><small>${escape(p.sku)}</small></div></a>`).join('') : `<p>${escape(t('No matching products.'))}</p>`;
        } catch (error) {
            if (error.name !== 'AbortError' && requestId === sequence && getCurrent() === 'search') results.innerHTML = `<p>${escape(t('Something went wrong. Please try again.'))}</p><button class="sf-retry-search sf-ui-pressable">${escape(t('Retry'))}</button>`;
        } finally { if (requestId === sequence) results.setAttribute('aria-busy','false'); }
    }

    return {
        bind,
        cancel,
        start() { syncSearchControls(); return search(); },
        retry: search,
        syncControls: syncSearchControls,
    };
}
