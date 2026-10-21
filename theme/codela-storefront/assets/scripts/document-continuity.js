/** Native document animation only. No fetch, router, form or history interception. */
(() => {
    const config = window.codelaSFDocument || {};
    let submitting = false;
    document.addEventListener('submit', () => { submitting = true; }, true);
    window.addEventListener('pageshow', () => { submitting = false; });
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
                link.href = url.href;
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
