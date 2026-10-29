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
    function layout(type, url) {
        const shape = name => '<div class="sf-skeleton-shape sf-skeleton-' + name + '"></div>';
        const lines = '<div class="sf-skeleton-lines"><i></i><i></i></div>';
        if (type === 'account') {
            const menu = '<div class="sf-skeleton-account-menu">' + ('<div class="sf-skeleton-account-link">' + shape('account-icon') + shape('account-label') + '</div>').repeat(6) + '</div>';
            const heading = shape('heading');
            const mode = !document.body.matches('.logged-in') ? 'guest' : accountDepth(url.href) === 0 ? 'dashboard' : 'endpoint';
            const form = '<div class="sf-skeleton-account-fields">' + (shape('account-label') + shape('account-input')).repeat(3) + shape('account-button') + '</div>';
            const summary = '<div class="sf-skeleton-account-summary">' + heading + shape('account-stat') + lines + '</div>';
            const content = mode === 'guest' ? heading + form : mode === 'dashboard' ? summary : heading + (/edit-account|edit-address/.test(url.href) ? form : '<div class="sf-skeleton-account-table">' + lines.repeat(4) + '</div>');
            return '<div class="sf-skeleton-account sf-skeleton-account--' + mode + '">' + (mode === 'guest' ? '' : menu) + '<div class="sf-skeleton-account-content">' + content + '</div></div>';
        }
        if (type === 'product') return shape('gallery');
        const hero = '<div class="sf-skeleton-hero">' + shape('hero-image') + '<div class="sf-skeleton-hero-caption">' + shape('hero-title') + '<div class="sf-skeleton-hero-bottom">' + shape('hero-button') + shape('hero-count') + '</div></div></div>';
        if (type === 'home' || type === 'catalog') return (type === 'home' ? hero : shape('heading') + shape('filters')) + '<div class="sf-skeleton-cards">' + ('<div>' + shape('card') + lines + '</div>').repeat(4) + '</div>';
        return shape('heading') + '<div class="sf-skeleton-copy">' + (lines + lines + lines).repeat(2) + '</div>';
    }
    function previewAccountHeader(url) {
        const brand = document.querySelector('.sf-header .sf-brand');
        if (!brand || !config.accountLabel) return;
        pending.brand = { brand, nodes: [...brand.childNodes] };
        pending.snapshots.push(remember(brand, ['class']));
        brand.classList.add('sf-context-brand');
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
        link.append(icon.content.cloneNode(true)); brand.replaceChildren(link);
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
        state.releaseSubmit?.();
        state.surface.remove();
        state.preview?.remove();
        state.snapshots.reverse().forEach(restore);
        if (state.brand?.brand.isConnected) state.brand.brand.replaceChildren(...state.brand.nodes);
        document.documentElement.removeAttribute('data-sf-navigation-pending');
        document.documentElement.removeAttribute('data-sf-navigation-target');
        document.documentElement.removeAttribute('data-sf-navigation-bottom');
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
        // Destination controls are an inert presentation, without outgoing product
        // data, a Woo form or a purchase handler. The next document owns commerce.
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
        shapes.innerHTML = layout(type, target);
        surface.append(label, shapes);
        let statePreview = null;
        if (type === 'product' && config.purchasePreview) {
            const preview = document.createElement('div');
            preview.className = 'sf-navigation-preview';
            preview.setAttribute('aria-hidden', 'true');
            preview.inert = true;
            preview.innerHTML = config.purchasePreview;
            statePreview = preview;
        }
        const state = pending = { token: ++sequence, surface, preview: statePreview, snapshots: [], focus: link || document.activeElement };
        const save = (node, names) => { if (node) state.snapshots.push(remember(node, names)); };
        save(main, ['aria-busy']);
        main.setAttribute('aria-busy', 'true');
        // Preserve pre-existing inert/ARIA values, including on cancelled requests.
        [...main.children, ...document.querySelectorAll('.sf-header,.sf-footer')].forEach(node => {
            save(node, ['inert']); node.inert = true;
        });
        const blockOldSubmit = event => {
            if (main.contains(event.target) && event.target.matches('form.cart')) {
                event.preventDefault(); event.stopImmediatePropagation();
            }
        };
        document.addEventListener('submit', blockOldSubmit, true);
        state.releaseSubmit = () => document.removeEventListener('submit', blockOldSubmit, true);
        if (type === 'account' && document.body.matches('.logged-in')) previewAccountHeader(target);
        const dock = document.querySelector('.sf-shell > .sf-mobile-dock');
        if (dock) {
            save(dock, ['hidden', 'inert', 'aria-busy', 'class', 'style']);
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
            dock.setAttribute('aria-busy', 'true');
            dock.classList.remove('is-collapsed');
        }
        document.documentElement.dataset.sfNavigationPending = owner;
        document.documentElement.dataset.sfNavigationTarget = type;
        document.documentElement.dataset.sfNavigationBottom = type === 'product' ? 'product' : dock ? 'dock' : 'none';
        // Outside transformed/contained outgoing main, including router regions.
        document.body.append(surface);
        if (state.preview) document.body.append(state.preview);
        // iOS Safari already anchors fixed elements to its visible viewport.
        // Reapplying (innerHeight - visualViewport.height) moved the native dock
        // upwards, while setting a second viewport top/height clipped the fake
        // purchase area behind the browser chrome. Use the SAME fixed anchoring
        // as the real product sheet/dock; observe viewport changes only to size
        // non-product content up to the actual rendered dock. Product photos
        // use the native stable large-viewport frame and overlap the sheet.
        const viewport = window.visualViewport;
        let viewportFrame = 0;
        const fitViewport = () => {
            viewportFrame = 0;
            if (pending !== state) return;
            const bottom = type === 'product' ? null : dock;
            if (matchMedia('(max-width:700px)').matches && bottom && bottom.getClientRects().length) {
                const top = surface.getBoundingClientRect().top;
                surface.style.setProperty('--sf-feedback-gallery-height', Math.max(0, bottom.getBoundingClientRect().top - top) + 'px');
            } else surface.style.removeProperty('--sf-feedback-gallery-height');
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
