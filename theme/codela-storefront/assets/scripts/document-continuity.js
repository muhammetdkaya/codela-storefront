/** Native document navigation with immediate feedback; no fetch or history interception. */
(() => {
    const config = window.codelaSFDocument || {};
    let submitting = false;
    let pendingTimer = 0;
    function clearPending() {
        window.clearTimeout(pendingTimer);
        document.querySelector('.sf-account-loading')?.remove();
        const main = document.querySelector('#sf-content[data-sf-account-pending]');
        if (main) {
            main.removeAttribute('data-sf-account-pending');
            main.removeAttribute('aria-busy');
            main.querySelectorAll('[data-sf-pending-inert]').forEach(el => {
                el.inert = false;
                el.removeAttribute('data-sf-pending-inert');
            });
        }
    }
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
        if (accountDepth(location.href) < 0 || accountDepth(url.href) < 0 ||
            url.href === location.href || url.hash || url.searchParams.has('action') ||
            url.searchParams.has('add-to-cart') || url.searchParams.has('remove_item')) return;
        const main = document.querySelector('#sf-content');
        if (!main || !document.body.matches('.woocommerce-account.logged-in')) return;
        clearPending();
        main.dataset.sfAccountPending = '';
        main.setAttribute('aria-busy', 'true');
        // Existing content remains in the DOM for BFCache/cancel restoration.
        [...main.children].forEach(el => {
            if (!el.inert) { el.inert = true; el.dataset.sfPendingInert = ''; }
        });
        const placeholder = document.createElement('div');
        placeholder.className = 'sf-account-loading';
        placeholder.setAttribute('role', 'status');
        const label = document.createElement('span');
        label.textContent = config.loading || 'Loading…';
        placeholder.append(label);
        for (let i = 0; i < 3; i++) {
            const row = document.createElement('div');
            row.setAttribute('aria-hidden', 'true');
            placeholder.append(row);
        }
        main.append(placeholder);
        // A cancelled/stalled document request must never strand inert content.
        pendingTimer = window.setTimeout(clearPending, 10000);
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') clearPending(); });
    document.addEventListener('submit', () => { submitting = true; }, true);
    window.addEventListener('pageshow', () => { submitting = false; clearPending(); });
    function accountDepth(value) {
        if (!value || !config.account) return -1;
        const url = new URL(value, location.href), root = new URL(config.account, location.href);
        if (url.origin !== root.origin || url.searchParams.has('_wpnonce')) return -1;
        const path = url.pathname.replace(/\/$/, ''), base = root.pathname.replace(/\/$/, '');
        // Support both pretty and plain WordPress permalinks.
        if (root.searchParams.has('page_id')) {
            if (url.searchParams.get('page_id') !== root.searchParams.get('page_id')) return -1;
            if (url.searchParams.has('customer-logout') || url.searchParams.has('lost-password')) return -1;
            return [...url.searchParams.keys()].some(key => key !== 'page_id') ? 1 : 0;
        }
        if (path !== base && !path.startsWith(base + '/')) return -1;
        const rest = path.slice(base.length).split('/').filter(Boolean);
        if (rest.some(part => ['customer-logout','lost-password'].includes(part))) return -1;
        return rest.length;
    }
    function applyTransition(transition, activation) {
        if (!transition || !activation?.from?.url || !activation.entry?.url) return;
        if (submitting) { transition.skipTransition(); return; }
        if (!window.matchMedia('(max-width:800px)').matches) return;
        const from = accountDepth(activation.from.url), to = accountDepth(activation.entry.url);
        if (from < 0 || to < 0 || activation.from.url === activation.entry.url) return;
        let direction = to < from ? 'back' : 'forward';
        if (activation.navigationType === 'traverse') {
            direction = activation.entry.index < activation.from.index ? 'back' : 'forward';
        }
        document.documentElement.dataset.sfAccountTransition = direction;
        transition.finished.finally(() => {
            delete document.documentElement.dataset.sfAccountTransition;
        }).catch(() => {});
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

