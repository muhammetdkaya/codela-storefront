/** Observe native navigation; feedback belongs to navigation-feedback.js. */
(() => {
    const config = window.codelaSFDocument || {};
    let submitting = false;
    // Observe native link activation, never prevent it. The browser still owns
    // redirects, authentication, endpoint scripts, POST and history restoration.
    // Save only an explicit same-site navigation, scoped to its destination.
    // Menu entries start a new section; account hierarchy remains server-owned.
    document.addEventListener('click', event => {
        const link = event.target.closest?.('a[href]');
        if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self') || link.closest('form,[contenteditable]') || link.matches('[data-panel],.ajax_add_to_cart')) return;
        try {
            const target = new URL(link.href, location.href), from = new URL(location.href);
            if (target.origin !== from.origin || !['http:','https:'].includes(target.protocol) || target.href === from.href || target.hash || ['action','add-to-cart','_wpnonce','wc-ajax','remove_item'].some(k => target.searchParams.has(k))) return;
            const isMenu = !!link.closest('#sf-menu,.sf-desktop-navigation,.sf-mobile-dock');
            const clean = u => { u.hash = ''; return u.href; };
            const saved = JSON.parse(sessionStorage.getItem('sf-context-history') || '{}');
            saved[clean(target)] = { from: clean(from), menu: isMenu };
            const keys = Object.keys(saved); while (keys.length > 30) delete saved[keys.shift()];
            sessionStorage.setItem('sf-context-history', JSON.stringify(saved));
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
            link.hasAttribute('data-sf-route') && document.querySelector('#sf-content[data-wp-router-region]') ||
            (config.excluded || []).some(value => {
                const excluded = new URL(value, location.href);
                const path = excluded.pathname.replace(/\/$/, '');
                return excluded.search ? url.pathname === excluded.pathname &&
                    [...excluded.searchParams].every(([key, value]) => url.searchParams.get(key) === value) :
                    url.pathname === path || url.pathname.startsWith(path + '/');
            })) return;
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
    function updateBackLink(event) {
        const link = document.querySelector('[data-sf-context-back]');
        if (!link) return;
        const label = link.parentElement.querySelector('.sf-context-label');
        // A hidden link denotes a top-level page; visible links have a stable
        // Woo/blog parent supplied by the server when no in-site path exists.
        const root = link.dataset.sfContextRoot === 'true' || link.hasAttribute('data-sf-context-root');
        try {
            const target = new URL(event?.detail?.to || location.href, location.href); target.hash = '';
            const saved = JSON.parse(sessionStorage.getItem('sf-context-history') || '{}')[target.href];
            const nav = performance.getEntriesByType('navigation')[0];
            const source = event?.detail?.from || document.referrer;
            const sameSource = source && saved && new URL(source, target).href.split('#')[0] === saved.from;
            let previous = saved && !saved.menu && (sameSource || nav?.type === 'reload') ? new URL(saved.from, target) : null;
            if (previous && ((config.excluded || []).some(value => { const excluded = new URL(value, target); const path = excluded.pathname.replace(/\/$/, ''); return previous.pathname === path || previous.pathname.startsWith(path + '/'); }) || previous.origin !== target.origin || previous.href === target.href || ['_wpnonce','action','add-to-cart','wc-ajax'].some(k => previous.searchParams.has(k)) || /\/(wp-admin|wp-login\.php|customer-logout|lost-password)(\/|$)/.test(previous.pathname))) previous = null;
            if (previous) link.href = previous.href;
            link.hidden = root && !previous;
            if (label) label.hidden = !link.hidden;
        } catch { link.hidden = root; if (label) label.hidden = !root; }
    }
    window.addEventListener('pageswap', event => applyTransition(event.viewTransition, event.activation));
    window.addEventListener('pagereveal', event => {
        applyTransition(event.viewTransition, window.navigation?.activation);
        updateBackLink();
    });
    document.addEventListener('DOMContentLoaded', updateBackLink);
    window.addEventListener('codela:route-committed', updateBackLink);
})();

