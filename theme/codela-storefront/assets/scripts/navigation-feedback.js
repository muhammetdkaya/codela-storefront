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
        state.releaseBottom?.();
        state.releaseSubmit?.();
        state.surface.remove();
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
        // Never invent the destination's purchase data. Until the native document
        // replaces this one, keep only its existing bottom surface, busy/inert.
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
        [...main.children, ...document.querySelectorAll('.sf-header')].forEach(node => {
            save(node, ['inert']); node.inert = true;
        });
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
            dock.inert = true;
            dock.setAttribute('aria-busy', 'true');
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
        let bottom = null;
        let bottomSnapshot = null;
        let releaseBottomOffset = null;
        let bottomReleased = false;
        const guardedForms = new Set();
        const bottomResize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => scheduleViewport()) : null;
        const viewportFixed = node => {
            if (!node || getComputedStyle(node).position !== 'fixed') return false;
            for (let parent = node.parentElement; parent; parent = parent.parentElement) {
                const style = getComputedStyle(parent);
                if (['transform', 'perspective', 'filter', 'backdropFilter'].some(key => style[key] && style[key] !== 'none') ||
                    /(?:layout|paint|strict|content)/.test(style.contain) ||
                    /(?:transform|perspective|filter)/.test(style.willChange)) return false;
                // A nested stacking context may trap the panel below the body-level
                // skeleton even when its fixed geometry is otherwise correct.
                if (parent !== document.body && parent !== document.documentElement &&
                    (style.isolation === 'isolate' || Number.parseFloat(style.opacity) < 1 ||
                    style.zIndex && style.zIndex !== 'auto' || style.mixBlendMode && style.mixBlendMode !== 'normal')) return false;
            }
            return true;
        };
        const syncBottom = () => {
            // The same native form stays in place. In particular, normal -> product
            // keeps the real dock until the new Woo document owns a purchase panel.
            const purchase = !bottomReleased && matchMedia('(max-width:700px)').matches && document.body.matches('.single-product') ?
                main.querySelector('form.cart .sf-product-purchase') : null;
            const candidate = purchase && (purchase.closest('.sf-product-sheet') ||
                document.documentElement.classList.contains('sf-product-sheet-pending') && purchase.closest('.sf-product-overview > .summary') ||
                purchase);
            // A transformed/contained outgoing main cannot host a viewport-fixed
            // panel safely. Keep the existing shell dock instead; never clone/move it.
            const nativePanel = viewportFixed(candidate) ? candidate : null;
            if (nativePanel !== bottom) {
                bottomResize?.disconnect();
                if (bottomSnapshot) restore(bottomSnapshot);
                releaseBottomOffset?.();
                bottom = nativePanel || null;
                bottomSnapshot = bottom ? remember(bottom, ['data-sf-feedback-bottom', 'inert', 'aria-busy', 'aria-disabled']) : null;
                releaseBottomOffset = null;
                if (bottom) {
                    guardedForms.add(purchase.closest('form.cart'));
                    // Restore only our property, not native sheet measurements that
                    // may legitimately change while fonts/viewport finish loading.
                    const node = bottom, name = '--sf-feedback-bottom-offset';
                    const originalStyle = node.getAttribute('style');
                    const value = node.style.getPropertyValue(name), priority = node.style.getPropertyPriority(name);
                    releaseBottomOffset = () => {
                        if (value) node.style.setProperty(name, value, priority); else node.style.removeProperty(name);
                        if (originalStyle === null && !node.style.cssText) node.removeAttribute('style');
                    };
                    bottom.setAttribute('data-sf-feedback-bottom', '');
                    bottom.inert = true;
                    bottom.setAttribute('aria-busy', 'true');
                    bottom.setAttribute('aria-disabled', 'true');
                    bottomResize?.observe(bottom);
                }
            }
            document.documentElement.dataset.sfNavigationBottom = bottom ? 'product' : dock ? 'dock' : 'none';
            state.hasProductBottom = !!bottom;
            if (dock) dock.hidden = !!bottom;
        };
        // Inert blocks real pointer/keyboard input; also reject an async requestSubmit
        // against the outgoing form. Do not rewrite its controls, values or callbacks.
        const blockOldSubmit = event => {
            if (event.target.isConnected && guardedForms.has(event.target)) {
                event.preventDefault(); event.stopImmediatePropagation();
            }
        };
        document.addEventListener('submit', blockOldSubmit, true);
        state.releaseSubmit = () => {
            document.removeEventListener('submit', blockOldSubmit, true); guardedForms.clear();
        };
        // Late native sheet mount and breakpoint restoration can reparent the real
        // nodes while a response is pending. Observe only for this bounded lifetime.
        const retireBottom = () => { state.releaseBottom(); syncBottom(); };
        const bottomMount = new MutationObserver(() => {
            if (!main.isConnected) retireBottom(); else scheduleViewport();
        });
        bottomMount.observe(main, { childList: true, subtree: true });
        bottomMount.observe(main.parentElement, { childList: true });
        window.addEventListener('codela:route-committed', retireBottom);
        state.releaseBottom = () => {
            bottomMount.disconnect(); bottomResize?.disconnect();
            window.removeEventListener('codela:route-committed', retireBottom);
            if (bottomSnapshot) restore(bottomSnapshot);
            releaseBottomOffset?.();
            bottom = null; bottomSnapshot = null; releaseBottomOffset = null;
            bottomReleased = true; state.hasProductBottom = false;
        };
        const fitViewport = () => {
            viewportFrame = 0;
            if (pending !== state) return;
            syncBottom();
            const nativeViewport = viewport && viewport.scale === 1 && viewport.height > 0;
            const bottomOffset = nativeViewport ? Math.max(0, innerHeight - viewport.height - viewport.offsetTop) : 0;
            [bottom, dock].filter(Boolean).forEach(node => node.style.setProperty('--sf-feedback-bottom-offset', bottomOffset + 'px'));
            if (viewport && viewport.scale === 1 && viewport.height > 0) {
                surface.style.setProperty('--sf-feedback-height', viewport.height + 'px');
                surface.style.setProperty('--sf-feedback-top', viewport.offsetTop + 'px');
            } else {
                // Pinch zoom retains the browser's normal magnification/panning.
                surface.style.removeProperty('--sf-feedback-height');
                surface.style.removeProperty('--sf-feedback-top');
            }
            // A translucent native bottom must not pulse with the gallery behind it.
            const visibleBottom = bottom || dock;
            if (matchMedia('(max-width:700px)').matches && visibleBottom) {
                const top = nativeViewport ? viewport.offsetTop : 0;
                surface.style.setProperty('--sf-feedback-gallery-height', Math.max(0, visibleBottom.getBoundingClientRect().top - top) + 'px');
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
    // Cross-document snapshots must not display the outgoing price under the
    // destination URL after commit. Keep native replacement, without crossfade.
    window.addEventListener('pageswap', event => {
        if (pending?.hasProductBottom) event.viewTransition?.skipTransition();
    });
    window.addEventListener('pageshow', () => end());
    window.codelaSFFeedback = Object.freeze({ begin, end, active, accountDepth });
})();
