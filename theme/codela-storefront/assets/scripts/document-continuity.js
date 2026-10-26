/** Native document navigation with immediate feedback; no fetch or history interception. */
(() => {
    const config = window.codelaSFDocument || {};
    let submitting = false;
    let pendingTimer = 0;
    let savedBrand = null;
    let savedDock = null;
    function destination(url, link) {
        const matches = (value, children = false) => {
            if (!value) return false;
            const base = new URL(value, location.href);
            const path = base.pathname.replace(/\/$/, '');
            return url.origin === base.origin &&
                (url.pathname.replace(/\/$/, '') === path || children && path && url.pathname.startsWith(path + '/')) &&
                [...base.searchParams].every(([key, value]) => url.searchParams.get(key) === value);
        };
        if (accountDepth(url.href) >= 0) return 'account';
        if (url.searchParams.get('post_type') === 'product' && (url.searchParams.has('p') || url.searchParams.has('product'))) return 'product';
        if (url.searchParams.has('product')) return 'product';
        if (url.searchParams.has('product_cat') || url.searchParams.has('product_tag') ||
            url.searchParams.get('post_type') === 'product' && url.searchParams.has('s')) return 'catalog';
        const shopPagination = config.shop && /\/page\/\d+\/?$/.test(url.pathname) &&
            url.pathname.replace(/page\/\d+\/?$/, '').replace(/\/$/, '') === new URL(config.shop, location.href).pathname.replace(/\/$/, '');
        if (matches(config.shop) || shopPagination || (config.catalogBases || []).some(base => matches(base, true))) return 'catalog';
        if (link.dataset.sfSkeleton) return link.dataset.sfSkeleton;
        if (link.matches('.woocommerce-loop-product__link,.woocommerce-LoopProduct-link,.wc-block-components-product-name,.wc-block-components-product-image a,.sf-result') ||
            matches(config.productBase, true) && new URL(config.productBase, location.href).pathname !== '/') return 'product';
        if (matches(config.home) && !['page_id','p','s'].some(key => url.searchParams.has(key)) || link.dataset.sfRoute === 'home') return 'home';
        return 'page';
    }
    function layout(type) {
        const shape = name => '<div class="sf-document-shape sf-document-' + name + '"></div>';
        const lines = '<div class="sf-document-loading-lines"><i></i><i></i></div>';
        const rows = ('<div class="sf-document-loading-row"><div class="sf-document-loading-media"></div>' + lines + '</div>').repeat(3);
        if (type === 'account') return rows;
        if (type === 'product') return '<div class="sf-document-product-layout">' + shape('gallery') + '<div>' + shape('heading') + lines + shape('text') + '</div></div><div class="sf-document-purchase sf-ui-surface">' + lines + shape('quantity') + shape('button') + '</div>';
        if (type === 'home' || type === 'catalog') return (type === 'home' ? shape('hero') : shape('heading') + shape('filters')) + '<div class="sf-document-cards">' + ('<div>' + shape('card') + lines + '</div>').repeat(4) + '</div>';
        return shape('heading') + shape('text') + shape('text');
    }
    function previewAccountHeader(url) {
        const brand = document.querySelector('.sf-header .sf-brand');
        if (!brand || !config.accountLabel) return;
        savedBrand = { brand, nodes: [...brand.childNodes] };
        const root = new URL(config.account, location.href);
        const isRoot = url.pathname.replace(/\/$/, '') === root.pathname.replace(/\/$/, '') && url.search === root.search;
        let parent = { back: config.account, label: config.accountLabel };
        for (const candidate of config.accountParents || []) {
            const target = new URL(candidate.url, location.href);
            const path = target.pathname.replace(/\/$/, '');
            const key = [...target.searchParams.keys()].find(k => !root.searchParams.has(k));
            const matches = key ? url.searchParams.has(key) && (!candidate.childOnly || !!url.searchParams.get(key)) :
                (url.pathname.replace(/\/$/, '') === path && !candidate.childOnly) || url.pathname.startsWith(path + '/') && (!candidate.childOnly || url.pathname.slice(path.length + 1).replace(/\/$/, '') !== '');
            if (matches) { parent = candidate; break; }
        }
        const label = document.createElement('span');
        label.textContent = isRoot ? config.accountLabel : parent.label;
        if (isRoot) { label.className = 'sf-context-label'; brand.replaceChildren(label); return; }
        const link = document.createElement('a');
        link.className = 'sf-ui-pressable'; link.href = parent.back;
        link.dataset.sfAccountBack = ''; link.setAttribute('aria-label', parent.label);
        const icon = document.createElement('template'); icon.innerHTML = config.backIcon || '';
        link.append(icon.content.cloneNode(true), label); brand.replaceChildren(link);
    }
    function clearPending() {
        window.clearTimeout(pendingTimer);
        document.documentElement.removeAttribute('data-sf-document-pending');
        document.documentElement.removeAttribute('data-sf-document-target');
        if (savedDock) {
            savedDock.node.hidden = savedDock.hidden;
            savedDock.node.inert = savedDock.inert;
            savedDock.node.classList.toggle('is-collapsed', savedDock.collapsed);
            savedDock.node.classList.toggle('has-selection', savedDock.selection);
            if (savedDock.style === null) savedDock.node.removeAttribute('style');
            else savedDock.node.setAttribute('style', savedDock.style);
            savedDock.items.forEach(({node, active, current}) => {
                node.classList.toggle('is-active', active);
                if (current === null) node.removeAttribute('aria-current');
                else node.setAttribute('aria-current', current);
            });
            savedDock = null;
        }
        if (savedBrand) { savedBrand.brand.replaceChildren(...savedBrand.nodes); savedBrand = null; }
        document.querySelector('.sf-document-loading')?.remove();
        const main = document.querySelector('#sf-content[data-sf-document-pending]');
        if (main) {
            main.removeAttribute('data-sf-document-pending');
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
        clearPending();
        window.dispatchEvent(new Event('codela:before-route'));
        if (accountDepth(url.href) >= 0 && document.body.matches('.logged-in')) previewAccountHeader(url);
        const type = destination(url, link);
        document.documentElement.dataset.sfDocumentPending = '';
        document.documentElement.dataset.sfDocumentTarget = type;
        const dock = document.querySelector('.sf-shell > .sf-mobile-dock');
        if (dock) {
            savedDock = { node: dock, hidden: dock.hidden, inert: dock.inert, collapsed: dock.classList.contains('is-collapsed'),
                selection: dock.classList.contains('has-selection'), style: dock.getAttribute('style'),
                items: [...dock.querySelectorAll('[data-dock-view]')].map(node => ({node, active: node.classList.contains('is-active'), current: node.getAttribute('aria-current')})) };
            const selected = type === 'home' || type === 'account';
            dock.classList.toggle('has-selection', selected);
            dock.style.setProperty('--sf-dock-index', type === 'account' ? '3' : '0');
            dock.style.removeProperty('--sf-dock-position');
            savedDock.items.forEach(({node}) => {
                const active = selected && node.dataset.dockView === type;
                node.classList.toggle('is-active', active);
                node.removeAttribute('aria-current');
            });
            dock.hidden = type === 'product';
            dock.inert = true;
            dock.classList.remove('is-collapsed');
        }
        main.dataset.sfDocumentPending = '';
        main.setAttribute('aria-busy', 'true');
        // Existing content remains in the DOM for BFCache/cancel restoration.
        [...main.children].forEach(el => {
            if (!el.inert) { el.inert = true; el.dataset.sfPendingInert = ''; }
        });
        const placeholder = document.createElement('div');
        placeholder.className = 'sf-document-loading';
        placeholder.setAttribute('role', 'status');
        const label = document.createElement('span');
        label.className = 'sf-document-loading-status';
        label.textContent = config.loading || 'Loading…';
        placeholder.append(label);
        const silhouettes = document.createElement('div');
        silhouettes.className = 'sf-document-layout';
        silhouettes.setAttribute('aria-hidden', 'true');
        silhouettes.innerHTML = layout(type);
        placeholder.append(silhouettes);
        // Outside main: product transforms, containment and backgrounds must
        // never trap the fixed feedback or keep the old sheet above it.
        document.body.append(placeholder);
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
        // Account feedback is already visible in the outgoing document.
        // Replace it in place; never slide or crossfade a late loading snapshot.
        if (accountDepth(activation.from.url) >= 0 && accountDepth(activation.entry.url) >= 0) {
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

