/** Observe native navigation; feedback belongs to navigation-feedback.js. */
(() => {
    const config = window.codelaSFDocument || {};
    let submitting = false;
    // Observe native link activation, never prevent it. The browser still owns
    // redirects, authentication, endpoint scripts, POST and history restoration.
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
        try {
            const previous = event?.detail?.from || window.navigation?.activation?.from?.url || document.referrer;
            if (!previous) return;
            const url = new URL(previous, location.href);
            const blocked = (config.excluded || []).some(value => {
                const excluded = new URL(value, location.href);
                return url.pathname === excluded.pathname && (!excluded.search || url.search === excluded.search);
            });
            if (url.origin === location.origin && url.href !== location.href && !blocked &&
                !url.searchParams.has('_wpnonce') && !url.searchParams.has('action') &&
                !/\/(wp-admin|wp-login\.php|customer-logout)(\/|$)/.test(url.pathname)) {
                let title = '';
                try {
                    const saved = JSON.parse(sessionStorage.getItem('sf-previous-page') || 'null');
                    if (saved?.url === url.href && typeof saved.title === 'string') title = saved.title;
                } catch { /* Storage is optional. */ }
                // An unknown referrer must not be paired with this page's name.
                // Keep the truthful server-rendered Home fallback if its title is unknown.
                if (!title) return;
                link.href = url.href;
                const label = link.querySelector('span');
                if (label) label.textContent = title;
                link.setAttribute('aria-label', title);
            }
        } catch { /* Direct links keep the server-rendered home fallback. */ }
    }
    window.addEventListener('pageswap', event => applyTransition(event.viewTransition, event.activation));
    window.addEventListener('pagereveal', event => {
        applyTransition(event.viewTransition, window.navigation?.activation);
        updateBackLink();
    });
    document.addEventListener('DOMContentLoaded', updateBackLink);
    window.addEventListener('codela:route-committed', updateBackLink);
})();

