/** Observe native navigation; feedback belongs to navigation-feedback.js. */
(() => {
    const config = window.codelaSFDocument || {};
    let submitting = false;
    // Observe native link activation, never prevent it. The browser still owns
    // redirects, authentication, endpoint scripts, POST and history restoration.
    // Record the actual clicked destination for this tab. A matching, recent
    // activation works even if privacy settings remove or shorten referrers.
    // Accepted return paths are kept separately for reload and history visits.
    const contextKey = 'sf-context-history';
    const pendingKey = 'sf-context-pending';
    const searchRestoreKey = 'sf-search-return-state';
    const scrollRestoreKey = 'sf-context-return-scroll';
    const normalise = value => {
        const url = new URL(value, location.href);
        url.hash = '';
        if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
        for (const key of [...url.searchParams.keys()]) {
            if (/^(utm_.+|gclid|fbclid)$/i.test(key)) url.searchParams.delete(key);
        }
        url.searchParams.sort();
        return url.href;
    };
    const blocked = url => (config.excluded || []).some(value => {
        const excluded = new URL(value, location.href);
        const path = excluded.pathname.replace(/\/$/, '') || '/';
        const actual = url.pathname.replace(/\/$/, '') || '/';
        if (excluded.search) return actual === path && [...excluded.searchParams].every(([key, value]) => url.searchParams.get(key) === value);
        return actual === path || path !== '/' && actual.startsWith(path + '/');
    });
    function safePrevious(previous, target) {
        return previous.origin === target.origin && ['http:', 'https:'].includes(previous.protocol) &&
            normalise(previous.href) !== normalise(target.href) && !blocked(previous) &&
            !['action','add-to-cart','remove_item','_wpnonce','wc-ajax','download_file'].some(key => previous.searchParams.has(key)) &&
            !/\/(wp-admin|wp-login\.php|wp-json|customer-logout|lost-password)(\/|$)/.test(previous.pathname);
    }
    document.addEventListener('click', event => {
        const link = event.target.closest?.('a[href]');
        if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self') || link.closest('form,[contenteditable]') || link.matches('[data-panel],.ajax_add_to_cart')) return;
        try {
            const target = new URL(link.href, location.href), from = new URL(location.href);
            if (target.origin !== from.origin || !['http:','https:'].includes(target.protocol) || normalise(target.href) === normalise(from.href) || target.hash || ['action','add-to-cart','_wpnonce','wc-ajax','remove_item','download_file'].some(k => target.searchParams.has(k))) return;
            const searchPanel = link.closest('#sf-search');
            const searchVisible = searchPanel && !searchPanel.hidden &&
                !!document.querySelector('#sf-panel.is-search-panel[open]');
            const search = searchVisible ? {
                query: document.querySelector('#sf-query')?.value || '',
                scrollTop: searchPanel.querySelector('.sf-search-content')?.scrollTop || 0,
            } : null;
            const saved = JSON.parse(sessionStorage.getItem(contextKey) || '{}');
            const returnRecord = saved[normalise(from.href)];
            if (link.hasAttribute('data-sf-return-search') && returnRecord?.search) {
                // One-shot return intent is consumed only on the exact source URL.
                sessionStorage.setItem(searchRestoreKey, JSON.stringify({
                    url: normalise(target.href), query: returnRecord.search.query,
                    scrollTop: returnRecord.search.scrollTop,
                    pageScroll: returnRecord.scrollY || 0, time: Date.now(),
                }));
            } else if (link.hasAttribute('data-sf-context-back') && returnRecord &&
                Number.isFinite(returnRecord.scrollY)) {
                sessionStorage.setItem(scrollRestoreKey, JSON.stringify({
                    url: normalise(target.href), scrollY: returnRecord.scrollY, time: Date.now(),
                }));
            }
            sessionStorage.setItem(pendingKey, JSON.stringify({
                to: normalise(target.href), from: from.href.split('#')[0],
                menu: !!link.closest('#sf-menu,.sf-desktop-navigation,.sf-mobile-dock'),
                returning: link.hasAttribute('data-sf-context-back'),
                search, scrollY: window.scrollY, time: Date.now(),
            }));
        } catch { /* Server fallback remains usable without storage. */ }
    }, true);
    document.addEventListener('click', event => {
        const link = event.target.closest?.('a[href]');
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey ||
            event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') ||
            (link.target && link.target !== '_self') || link.closest('form,[contenteditable]')) return;
        const url = new URL(link.href, location.href);
        if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)) return;
        try {
            sessionStorage.setItem('sf-previous-page', JSON.stringify({ url: location.href, title: document.querySelector('[data-sf-page-title]')?.dataset.sfPageTitle || document.title }));
        } catch { /* Navigation also works when storage is unavailable. */ }
        // Native browsing only. Commerce mutations, popups and the existing
        // core-router region retain their own handlers and loading lifecycle.
        if (url.href === location.href || url.hash ||
            ['action', 'add-to-cart', 'remove_item', '_wpnonce', 'download_file', 'wc-ajax'].some(key => url.searchParams.has(key)) ||
            /\/(wp-admin|wp-login\.php|wp-json|customer-logout|lost-password)(\/|$)/.test(url.pathname) ||
            /\.[a-z0-9]{2,5}$/i.test(url.pathname) && !/\.(html?|php)$/i.test(url.pathname) ||
            link.matches('[data-panel],.ajax_add_to_cart') ||
            link.hasAttribute('data-sf-route') && document.querySelector('#sf-content[data-wp-router-region]')) return;
        const excluded = (config.excluded || []).some(value => {
                const excluded = new URL(value, location.href);
                const path = excluded.pathname.replace(/\/$/, '');
                return excluded.search ? url.pathname === excluded.pathname &&
                    [...excluded.searchParams].every(([key, value]) => url.searchParams.get(key) === value) :
                    url.pathname === path || url.pathname.startsWith(path + '/');
            });
        // Commerce destinations still use NATIVE document navigation. Only
        // the same inert feedback preview is permitted before the handoff;
        // never intercept checkout forms, order-payment endpoints or POSTs.
        const commerce = [config.cart, config.checkout].some(value => {
            if (!value) return false;
            const target = new URL(value, location.href);
            return target.origin === url.origin &&
                target.pathname.replace(/\/+$/, '') === url.pathname.replace(/\/+$/, '') &&
                [...target.searchParams].every(([key, entry]) => url.searchParams.get(key) === entry);
        });
        if (excluded && !commerce) return;
        const main = document.querySelector('#sf-content');
        if (!main) return;
        window.codelaSFFeedback?.begin({ url: url.href, link });
    });
    document.addEventListener('submit', () => { submitting = true; }, true);
    window.addEventListener('pageshow', () => { submitting = false; });
    function applyTransition(transition, activation) {
        if (!transition || !activation?.from?.url || !activation.entry?.url) return;
        if (submitting) { transition.skipTransition(); return; }
        // Account feedback is already visible in the outgoing document.
        // Replace it in place; never slide or crossfade a late loading snapshot.
        if (window.codelaSFFeedback?.accountDepth(activation.from.url) >= 0 && window.codelaSFFeedback?.accountDepth(activation.entry.url) >= 0) {
            transition.skipTransition();
        }
    }
    let resolvedLink = null, resolvedTarget = '';
    function updateBackLink(event) {
        const link = document.querySelector('[data-sf-context-back]');
        if (!link) return;
        const label = link.parentElement.querySelector('.sf-context-label');
        const root = link.hasAttribute('data-sf-context-root');
        try {
            const target = new URL(event?.detail?.to || location.href, location.href); target.hash = '';
            const key = normalise(target.href);
            if (resolvedLink === link && resolvedTarget === key) return;
            resolvedLink = link; resolvedTarget = key;
            const saved = JSON.parse(sessionStorage.getItem(contextKey) || '{}');
            const pending = JSON.parse(sessionStorage.getItem(pendingKey) || 'null');
            const nav = performance.getEntriesByType('navigation')[0];
            const source = event?.detail?.from || document.referrer;
            const sourceUrl = source ? new URL(source, target) : null;
            // Some WebKit builds report redirectCount as zero. When two URLs
            // share the configured product base, allow a short same-tab hop
            // to cover canonical redirects even with a suppressed referrer.
            const age = pending ? Date.now() - pending.time : -1;
            const productBase = config.productBase ? new URL(config.productBase, target).pathname.replace(/\/$/, '') : '';
            const pendingUrl = pending ? new URL(pending.to, target) : null;
            const productRedirect = age >= 0 && age < 10000 && productBase && productBase !== '/' &&
                pendingUrl?.origin === target.origin && pendingUrl.pathname.startsWith(productBase + '/') && target.pathname.startsWith(productBase + '/');
            const pendingMatches = pending && (pending.to === key || nav?.type === 'navigate' && (nav.redirectCount > 0 || productRedirect)) && age >= 0 && age < 120000 && (!sourceUrl || sourceUrl.origin === target.origin);
            let record = null;
            if (pendingMatches) {
                sessionStorage.removeItem(pendingKey);
                // A back action must not overwrite that page's original parent.
                record = pending.returning ? saved[key] : pending;
                if (!pending.returning) {
                    saved[key] = { from: pending.from, menu: pending.menu, search: pending.search || null,
                        scrollY: Number.isFinite(pending.scrollY) ? pending.scrollY : 0 };
                    const keys = Object.keys(saved); while (keys.length > 30) delete saved[keys.shift()];
                    sessionStorage.setItem(contextKey, JSON.stringify(saved));
                }
            } else if (saved[key] && (nav?.type === 'reload' || nav?.type === 'back_forward' || sourceUrl && normalise(sourceUrl.href) === normalise(saved[key].from))) {
                record = saved[key];
            }
            const previous = record && !record.menu ? new URL(record.from, target) : null;
            const usable = !!(previous && safePrevious(previous, target));
            const hierarchy = link.dataset.sfHierarchyParent && !record?.menu
                ? new URL(link.dataset.sfHierarchyParent, target) : null;
            const structural = !usable && hierarchy && safePrevious(hierarchy, target);
            if (usable) link.href = previous.href;
            else if (structural) link.href = hierarchy.href;
            const showingBack = usable || !!structural;
            link.hidden = root && !showingBack;
            // Product media sits directly under the floating controls: a direct
            // product never paints an empty logo capsule or a long title there.
            const shell = link.closest('.sf-shell');
            const product = !!shell?.classList.contains('has-product-header');
            if (label) label.hidden = product || !link.hidden;
            const homeShortcut = shell?.querySelector('.sf-header .sf-product-home');
            if (homeShortcut) {
                // Home -> product needs only Back; all other entries get Home too.
                const home = new URL(config.home || '/', target);
                homeShortcut.hidden = showingBack && usable && normalise(previous.href) === normalise(home.href);
            }
            if (record?.search && usable && product) link.dataset.sfReturnSearch = '1';
            else delete link.dataset.sfReturnSearch;
        } catch { link.hidden = root; if (label) label.hidden = !root; }
    }
    window.addEventListener('pageswap', event => applyTransition(event.viewTransition, event.activation));
    window.addEventListener('pagereveal', event => {
        applyTransition(event.viewTransition, window.navigation?.activation);
        updateBackLink();
    });
    function restoreListScroll() {
        try {
            const raw = sessionStorage.getItem(scrollRestoreKey);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (!saved || saved.url !== normalise(location.href) ||
                Date.now() - saved.time > 120000) {
                sessionStorage.removeItem(scrollRestoreKey); return;
            }
            sessionStorage.removeItem(scrollRestoreKey);
            if (Number.isFinite(saved.scrollY) && saved.scrollY >= 0) {
                requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, saved.scrollY)));
            }
        } catch { sessionStorage.removeItem(scrollRestoreKey); }
    }
    document.addEventListener('DOMContentLoaded', updateBackLink);
    window.addEventListener('pageshow', restoreListScroll);
    window.addEventListener('codela:route-committed', updateBackLink);
})();

