/**
 * Storefront navigation feedback: one presentation lifecycle for native documents
 * and core/router. No fetching, history, commerce state or duplicate shell nodes.
 * begin() returns an ownership token; stale completions cannot clear newer work.
 */
(() => {
    const config = window.codelaSFDocument || {};
    let sequence = 0;
    let pending = null;
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
        if (['home','catalog','product','account','page'].includes(link?.dataset.sfSkeleton)) return link.dataset.sfSkeleton;
        if (link?.matches('.woocommerce-loop-product__link,.woocommerce-LoopProduct-link,.wc-block-components-product-name,.wc-block-components-product-image a,.sf-result') ||
            matches(config.productBase, true) && new URL(config.productBase, location.href).pathname !== '/') return 'product';
        if (matches(config.home) && !['page_id','p','s'].some(key => url.searchParams.has(key)) || link?.dataset.sfRoute === 'home') return 'home';
        return 'page';
    }
    function layout(type) {
        const shape = name => '<div class="sf-skeleton-shape sf-skeleton-' + name + '"></div>';
        const lines = '<div class="sf-skeleton-lines"><i></i><i></i></div>';
        const rows = ('<div class="sf-skeleton-row"><div class="sf-skeleton-media"></div>' + lines + '</div>').repeat(3);
        if (type === 'account') return rows;
        if (type === 'product') return shape('gallery');
        if (type === 'home' || type === 'catalog') return (type === 'home' ? shape('hero') : shape('heading') + shape('filters')) + '<div class="sf-skeleton-cards">' + ('<div>' + shape('card') + lines + '</div>').repeat(4) + '</div>';
        return shape('heading') + '<div class="sf-skeleton-copy">' + (lines + lines + lines).repeat(2) + '</div>';
    }
    function previewAccountHeader(url) {
        const brand = document.querySelector('.sf-header .sf-brand');
        if (!brand || !config.accountLabel) return;
        pending.brand = { brand, nodes: [...brand.childNodes] };
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

    const remember = (node, names) => ({ node, values: names.map(name => [name, node.getAttribute(name)]) });
    const restore = ({node, values}) => values.forEach(([name, value]) => {
        if (value === null) node.removeAttribute(name); else node.setAttribute(name, value);
    });
    function active(token) { return !!pending && pending.token === token; }
    function end(token, { focus = false } = {}) {
        if (!pending || token !== undefined && !active(token)) return false;
        const state = pending; pending = null;
        clearTimeout(state.timer);
        state.releaseViewport?.();
        state.surface.remove();
        state.snapshots.reverse().forEach(restore);
        if (state.brand?.brand.isConnected) state.brand.brand.replaceChildren(...state.brand.nodes);
        document.documentElement.removeAttribute('data-sf-navigation-pending');
        document.documentElement.removeAttribute('data-sf-navigation-target');
        if (focus && state.focus?.isConnected && !state.focus.closest('[inert]')) state.focus.focus({ preventScroll: true });
        return true;
    }
    function begin({ url, link, owner = 'document' }) {
        end();
        const main = document.querySelector('#sf-content');
        if (!main) return null;
        // The existing overlay closes and returns the one dock before snapshots.
        window.dispatchEvent(new Event('codela:before-route'));
        const target = new URL(url, location.href);
        const type = destination(target, link);
        // Product feedback covers only the gallery. Purchase data and controls
        // belong exclusively to the incoming Woo document.
        const surface = document.createElement('div');
        surface.className = 'sf-skeleton';
        surface.dataset.owner = owner;
        surface.setAttribute('role', 'status');
        surface.setAttribute('aria-live', 'polite');
        const label = document.createElement('span');
        label.className = 'sf-skeleton-status';
        label.textContent = config.loading || 'Loading…';
        const shapes = document.createElement('div');
        shapes.className = 'sf-skeleton-layout';
        shapes.setAttribute('aria-hidden', 'true');
        shapes.innerHTML = layout(type);
        surface.append(label, shapes);
        const state = pending = { token: ++sequence, surface, snapshots: [], focus: link || document.activeElement };
        const save = (node, names) => { if (node) state.snapshots.push(remember(node, names)); };
        save(main, ['aria-busy']);
        main.setAttribute('aria-busy', 'true');
        // Preserve pre-existing inert/ARIA values, including on cancelled requests.
        // The native footer sits outside main, beneath the viewport surface.
        [...main.children, ...document.querySelectorAll('.sf-header,.sf-footer')].forEach(node => {
            save(node, ['inert']); node.inert = true;
        });
        if (type === 'account' && document.body.matches('.logged-in')) previewAccountHeader(target);
        const dock = document.querySelector('.sf-shell > .sf-mobile-dock');
        if (dock) {
            save(dock, ['hidden', 'inert', 'class', 'style']);
            const selected = type === 'home' || type === 'account';
            dock.classList.toggle('has-selection', selected);
            dock.style.setProperty('--sf-dock-index', type === 'account' ? '3' : '0');
            dock.style.removeProperty('--sf-dock-position');
            dock.querySelectorAll('[data-dock-view]').forEach(node => {
                save(node, ['class', 'aria-current']);
                node.classList.toggle('is-active', selected && node.dataset.dockView === type);
                node.removeAttribute('aria-current');
            });
            dock.hidden = type === 'product';
            dock.inert = true;
            dock.classList.remove('is-collapsed');
        }
        document.documentElement.dataset.sfNavigationPending = owner;
        document.documentElement.dataset.sfNavigationTarget = type;
        // Outside transformed/contained outgoing main, including router regions.
        document.body.append(surface);
        // Mobile browser chrome can shrink the visible viewport without resizing
        // the layout viewport that a nested fixed element uses. Size one parent
        // surface to the visible area; all skeleton controls are local to it.
        const viewport = window.visualViewport;
        let viewportFrame = 0;
        const fitViewport = () => {
            viewportFrame = 0;
            if (pending !== state) return;
            if (viewport && viewport.scale === 1 && viewport.height > 0) {
                surface.style.setProperty('--sf-feedback-height', viewport.height + 'px');
                surface.style.setProperty('--sf-feedback-top', viewport.offsetTop + 'px');
            } else {
                // Pinch zoom retains the browser's normal magnification/panning.
                surface.style.removeProperty('--sf-feedback-height');
                surface.style.removeProperty('--sf-feedback-top');
            }
        };
        const scheduleViewport = () => {
            if (!viewportFrame) viewportFrame = requestAnimationFrame(fitViewport);
        };
        viewport?.addEventListener('resize', scheduleViewport);
        viewport?.addEventListener('scroll', scheduleViewport);
        window.addEventListener('resize', scheduleViewport);
        state.releaseViewport = () => {
            cancelAnimationFrame(viewportFrame);
            viewport?.removeEventListener('resize', scheduleViewport);
            viewport?.removeEventListener('scroll', scheduleViewport);
            window.removeEventListener('resize', scheduleViewport);
        };
        fitViewport();
        state.timer = setTimeout(() => end(state.token, { focus: true }), 10000);
        return state.token;
    }
    document.addEventListener('keydown', event => { if (event.key === 'Escape') end(undefined, { focus: true }); });
    window.addEventListener('pageshow', () => end());
    window.codelaSFFeedback = Object.freeze({ begin, end, active, accountDepth });
})();
