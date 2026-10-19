/**
 * Single overlay controller. Owns the responsive search slot, native dialog, active view,
 * focus, scroll locking/restoration and content transitions.
 * The navigation element is passed by callback and is never duplicated.
 */
export function createOverlayController({
    $, config, t, searchFeature, cartFeature,
    mountDock, restoreDock, setDockCollapsed, markDockActive, mobileDock,
    dockScrollPositions, onMenuOpen,
}) {
    let dialog = null, current = null, opener = null, savedY = 0;
    let savedBodyStyle = null, savedAdminStyle = null, panelMotion = null;
    let surfaceMotion = null, closing = false, restoreScrollFrame = 0;
    let menuTrigger = null, menuHome = null, menuLabel = '';
    const desktop = window.matchMedia('(min-width:901px)');
    let inlineSearch = false, searchHome = null, searchSlot = null, hiddenHeaderControl = null;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function adminOffset() {
        const bar = $('#wpadminbar');
        const rect = bar?.getBoundingClientRect();
        const visible = bar && getComputedStyle(bar).display !== 'none' && getComputedStyle(bar).visibility !== 'hidden';
        const offset = `${visible ? Math.max(0, Math.min(rect.bottom, rect.height)) : 0}px`;
        document.querySelector('.sf-header')?.style.setProperty('--sf-header-offset', offset);
        dialog?.style.setProperty('--sf-admin-offset', offset);
    }
    function rememberStyle(element, properties) {
        return properties.map(name => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
    }
    function restoreStyle(element, values) {
        for (const [name, value, priority] of values || []) {
            if (value) element.style.setProperty(name, value, priority);
            else element.style.removeProperty(name);
        }
    }

    function searchSemantics() {
        document.querySelectorAll('[data-panel="search"]').forEach(trigger => {
            trigger.setAttribute('aria-controls', desktop.matches ? 'sf-search' : 'sf-panel');
            if (desktop.matches) trigger.removeAttribute('aria-haspopup');
            else trigger.setAttribute('aria-haspopup', 'dialog');
        });
    }
    function syncInlineHeaderControl() {
        if (!inlineSearch) return;
        const header = searchSlot.closest('.sf-header');
        const navigation = header.querySelector('.sf-desktop-navigation');
        const control = navigation && getComputedStyle(navigation).display !== 'none' ? navigation : header.querySelector('.sf-brand');
        if (hiddenHeaderControl !== control) {
            if (hiddenHeaderControl) hiddenHeaderControl.inert = false;
            hiddenHeaderControl = control;
            hiddenHeaderControl.inert = true;
        }
    }
    function openInlineSearch(event) {
        if (inlineSearch) { $('#sf-query').focus({preventScroll:true}); return; }
        if (dialog.open) finishClose();
        opener = event?.target?.closest?.('[data-panel]') || event?.currentTarget || document.activeElement;
        current = 'search'; inlineSearch = true;
        const header = searchSlot.closest('.sf-header');
        syncInlineHeaderControl();
        header.classList.add('is-search-expanded');
        searchSlot.hidden = false;
        searchSlot.appendChild($('#sf-search'));
        $('#sf-search').hidden = false;
        $('.sf-search-content').classList.add('sf-ui-surface');
        document.querySelectorAll('[data-panel="search"]').forEach(el => el.setAttribute('aria-expanded','true'));
        document.querySelectorAll('.sf-desktop-submenu:popover-open').forEach(menu => menu.hidePopover());
        if (!reducedMotion.matches && searchSlot.animate) {
            surfaceMotion = searchSlot.animate([{clipPath:'inset(0 0 0 100%)'},{clipPath:'inset(0 0 0 0)'}], {duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});
            surfaceMotion.onfinish = () => { surfaceMotion = null; };
        }
        searchFeature.start();
        $('#sf-query').focus({preventScroll:true});
    }
    function closeInlineSearch(restoreFocus = true) {
        surfaceMotion?.cancel(); surfaceMotion = null;
        searchFeature.cancel();
        const search = $('#sf-search');
        search.hidden = true;
        searchHome.after(search);
        $('.sf-search-content').classList.remove('sf-ui-surface');
        searchSlot.hidden = true;
        searchSlot.closest('.sf-header').classList.remove('is-search-expanded');
        if (hiddenHeaderControl) hiddenHeaderControl.inert = false;
        hiddenHeaderControl = null;
        document.querySelectorAll('[data-panel="search"]').forEach(el => el.setAttribute('aria-expanded','false'));
        inlineSearch = false; current = null;
        if (restoreFocus && opener?.isConnected) opener.focus({preventScroll:true});
        opener = null;
    }
    function animateDrawer(out = false) {
        if (reducedMotion.matches || !dialog.animate) return false;
        surfaceMotion?.cancel();
        surfaceMotion = dialog.animate([
            {transform:out ? 'translateX(0)' : 'translateX(100%)'},
            {transform:out ? 'translateX(100%)' : 'translateX(0)'},
        ], {duration:out ? 220 : 280,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});
        surfaceMotion.onfinish = () => {
            if (out) finishClose();
            else { surfaceMotion.cancel(); surfaceMotion = null; }
        };
        return true;
    }

    // One focusable menu trigger is reparented above the native dialog backdrop.
    function findMenuTrigger() {
        if (!menuTrigger) {
            menuTrigger = document.querySelector('.sf-header-menu [data-panel="menu"]');
            menuHome = menuTrigger?.parentElement || null;
            menuLabel = menuTrigger?.getAttribute('aria-label') || 'Menu';
        }
        return menuTrigger;
    }
    function positionMenuTrigger() {
        const trigger = findMenuTrigger();
        if (!trigger?.classList.contains('is-in-panel')) return;
        const nav = menuHome.getBoundingClientRect();
        const header = document.querySelector('.sf-header')?.getBoundingClientRect();
        dialog.style.setProperty('--sf-menu-control-x', nav.left + 'px');
        dialog.style.setProperty('--sf-menu-control-y', (header ? header.top + (header.height - 44) / 2 : nav.top) + 'px');
    }
    function mountMenuTrigger() {
        const trigger = findMenuTrigger();
        if (!trigger || trigger.classList.contains('is-in-panel')) return;
        const rect = trigger.getBoundingClientRect();
        dialog.style.setProperty('--sf-menu-control-x', rect.left + 'px');
        dialog.style.setProperty('--sf-menu-control-y', rect.top + 'px');
        dialog.appendChild(trigger);
        trigger.classList.add('is-in-panel');
    }
    function restoreMenuTrigger() {
        if (!menuTrigger?.classList.contains('is-in-panel')) return;
        menuTrigger.classList.remove('is-in-panel');
        menuTrigger.setAttribute('aria-label', menuLabel);
        menuTrigger.setAttribute('aria-expanded', 'false');
        menuHome.appendChild(menuTrigger);
        dialog?.style.removeProperty('--sf-menu-control-x');
        dialog?.style.removeProperty('--sf-menu-control-y');
    }
    function toggleMenu(event) {
        if (dialog?.open && current === 'menu' && !closing) {
            event?.preventDefault();
            close();
        } else open('menu', event);
    }
    function open(name, event) {
        if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
        event?.preventDefault();
        dialog ||= $('#sf-panel');
        if (!dialog || typeof dialog.showModal !== 'function') { if (name !== 'menu') location.href = config()[name] || config().shop; return; }
        if (name === 'search' && desktop.matches && searchSlot) { openInlineSearch(event); return; }
        if (inlineSearch) closeInlineSearch(false);
        const wasClosing = closing;
        if (closing) {
            surfaceMotion?.cancel(); surfaceMotion = null;
            panelMotion?.cancel(); panelMotion = null;
            closing = false;
            dialog.classList.remove('is-closing');
        }
        const opening = !dialog.open;
        if (!opening && current === name && !wasClosing) return;
        surfaceMotion?.cancel(); surfaceMotion = null;
        const previous = current;
        if (opening) {
            cancelAnimationFrame(restoreScrollFrame);
            document.documentElement.classList.add('sf-overlay-scroll-locked');
            opener = event?.target?.closest?.('[data-panel]') || event?.currentTarget || document.activeElement; savedY = window.scrollY;
            const bodyRect = document.body.getBoundingClientRect();
            savedBodyStyle = rememberStyle(document.body, ['position', 'top', 'width', 'padding-right']);
            const bar = $('#wpadminbar');
            if (bar) {
                const barRect = bar.getBoundingClientRect();
                savedAdminStyle = rememberStyle(bar, ['position', 'top']);
                // Mobile WordPress uses an absolute toolbar; keep its visible position
                // when the body becomes a new containing block.
                bar.style.position = 'fixed'; bar.style.top = `${barRect.top}px`;
            }
            const scrollbar = window.innerWidth - document.documentElement.clientWidth;
            if (scrollbar > 0) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`;
            // Preserve the rendered body origin, including WordPress's html top margin.
            document.body.style.position = 'fixed'; document.body.style.top = `${bodyRect.top}px`; document.body.style.width = '100%';
            adminOffset();
            mountDock();
        }
        if (current === 'search' && name !== 'search') searchFeature.cancel();
        current = name;
        if (name === 'menu') mountMenuTrigger();
        else restoreMenuTrigger();
        setDockCollapsed(false);
        dialog.classList.toggle('is-menu-panel', name === 'menu');
        dialog.classList.toggle('is-search-panel', name === 'search');
        dialog.classList.toggle('is-cart-panel', name === 'cart');
        dialog.classList.toggle('is-account-panel', name === 'account');
        dialog.classList.toggle('is-filters-panel', name === 'filters');
        const dock = mobileDock();
        if (dock && dock.parentElement === dialog) dock.hidden = name === 'menu';
        markDockActive(name);
        const menuTrigger = findMenuTrigger();
        dialog.setAttribute('aria-label', name === 'menu' ? menuLabel : name === 'search' ? t('Search products') : name === 'account' ? t('My account') : name === 'filters' ? t('Filters') : t('Your cart'));
        $('.sf-panel-top .sf-close').hidden = name === 'menu';
        dialog.removeAttribute('aria-labelledby');
        for (const section of ['menu','search','cart','account','filters']) {
            const panel = $(`#sf-${section}`);
            if (panel) panel.hidden = name !== section;
        }
        $('.sf-cart-bottom').hidden = name !== 'cart' || !cartFeature.getData()?.items.length;
        $('#sf-status').textContent = '';
        $('#sf-panel-title').textContent = name === 'menu' ? '' : name === 'search' ? t('Search products') : name === 'account' ? t('My account') : name === 'filters' ? t('Filters') : t('Your cart');
        document.querySelectorAll('[data-panel]').forEach(el => el.setAttribute('aria-expanded', String(el.dataset.panel === name && name !== 'menu')));
        dialog.classList.add('is-open');
        // Automatically focused controls should not display a giant focus ring
        // when opening a panel; keyboard navigation must still show its indicator.
        dialog.querySelectorAll('.sf-initial-focus').forEach(el => el.classList.remove('sf-initial-focus'));
        const initialFocus = name === 'menu' ? (menuTrigger || $('.sf-close')) : name === 'search' ? $('.sf-search-cancel') : $('.sf-panel-top .sf-close');
        initialFocus.classList.add('sf-initial-focus');
        // Native dialog focuses this button even when a previous session focused the query.
        dialog.querySelectorAll('[autofocus]').forEach(el => el.removeAttribute('autofocus'));
        initialFocus.setAttribute('autofocus', '');
        if (opening) dialog.showModal();
        if (name === 'menu' && menuTrigger) {
            // Resolve initial line transforms before transitioning to an X.
            menuTrigger.getBoundingClientRect();
            menuTrigger.setAttribute('aria-label', t('Close'));
            menuTrigger.setAttribute('aria-expanded', 'true');
        }
        initialFocus.focus({preventScroll:true});
        if (name === 'menu') onMenuOpen();
        if (name === 'search') searchFeature.start();
        if (name === 'cart') cartFeature.refresh();
        if (name === 'account') {
            // Native Woo forms submit to My Account, not the page under the dialog.
            // Their login/registration handlers and nonces remain WooCommerce-owned.
            dialog.querySelectorAll('#sf-account form.woocommerce-form').forEach(form => {
                form.action = config().account;
            });
        }
        if (name === 'cart' && desktop.matches) animateDrawer();
        else animatePanelContent(name === 'search' ? $('.sf-search-content') : $(`#sf-${name}`), previous === 'cart' && name === 'search' ? -1 : 1);
    }
    // Mobile transitions animate content only: transforming the dialog changes the
    // containing block of the fixed dock in some browsers. Repeated actions cancel cleanly.
    function animatePanelContent(element, direction = 1) {
        panelMotion?.cancel();
        panelMotion = null;
        if (reducedMotion.matches || !element?.animate) return;
        const menu = element.id === 'sf-menu';
        panelMotion = element.animate([
            {opacity:0, transform:menu ? 'translate3d(0,-16px,0)' : `translate3d(${direction * 8}px,0,0)`},
            {opacity:1, transform:'translate3d(0,0,0)'},
        ], {duration:menu ? 260 : 160, easing:'cubic-bezier(.2,.8,.2,1)'});
        panelMotion.onfinish = () => { panelMotion = null; };
    }
    function close() {
        if (inlineSearch) { closeInlineSearch(); return; }
        if (!dialog?.open || closing) return;
        panelMotion?.cancel(); panelMotion = null;
        surfaceMotion?.cancel(); surfaceMotion = null;
        if (current === 'menu') {
            findMenuTrigger()?.setAttribute('aria-expanded', 'false');
            menuTrigger?.setAttribute('aria-label', menuLabel);
        }
        if (current === 'cart' && desktop.matches && animateDrawer(true)) {
            closing = true;
            dialog.classList.add('is-closing');
            return;
        }
        if (current === 'menu' && !reducedMotion.matches && $('#sf-menu')?.animate) {
            closing = true;
            panelMotion = $('#sf-menu').animate([
                {opacity:1,transform:'translate3d(0,0,0)'},
                {opacity:0,transform:'translate3d(0,-12px,0)'},
            ], {duration:280,easing:'ease-in',fill:'forwards'});
            panelMotion.onfinish = () => finishClose();
            return;
        }
        finishClose();
    }
    function finishClose(navigating = false) {
        surfaceMotion?.cancel(); surfaceMotion = null;
        panelMotion?.cancel(); panelMotion = null;
        closing = false;
        dialog.classList.remove('is-open', 'is-closing');
        document.querySelectorAll('[data-panel]').forEach(el => el.setAttribute('aria-expanded','false'));
        searchFeature.cancel();
        dialog.close(); restoreMenuTrigger(); current = null;
        restoreDock();
        restoreStyle(document.body, savedBodyStyle); savedBodyStyle = null;
        const bar = $('#wpadminbar'); if (bar) restoreStyle(bar, savedAdminStyle);
        savedAdminStyle = null; dialog.style.removeProperty('--sf-admin-offset');
        if (!navigating) {
            window.scrollTo({top:savedY, left:0, behavior:'instant'});
            dockScrollPositions.set(window, {position:savedY, distance:0});
            if (opener?.isConnected) opener.focus({preventScroll:true});
        }
        cancelAnimationFrame(restoreScrollFrame);
        // Restore layout/position while native root snapping is still suspended.
        // Re-enable it only after the original product anchor is back in layout.
        document.documentElement.getBoundingClientRect();
        if (navigating) document.documentElement.classList.remove('sf-overlay-scroll-locked');
        else restoreScrollFrame = requestAnimationFrame(() => {
            restoreScrollFrame = 0;
            if (!dialog.open) document.documentElement.classList.remove('sf-overlay-scroll-locked');
        });
        opener = null;
    }
    
    function closeForNavigation() {
        // Closing the menu before a router click must not jump to the old
        // scroll position, restore focus to stale content, or wait 280ms.
        if (inlineSearch) { closeInlineSearch(false); return; }
        if (!dialog?.open) return;
        panelMotion?.cancel(); panelMotion = null;
        surfaceMotion?.cancel(); surfaceMotion = null;
        finishClose(true);
    }

    function bind(element) {
        if (dialog && dialog !== element) throw new Error('Overlay controller already bound');
        if (dialog) return;
        dialog = element;
        searchSlot = $('.sf-header-search');
        searchHome = document.createComment('Search mobile slot');
        $('#sf-search').before(searchHome);
        searchSemantics();
        desktop.addEventListener('change', () => {
            if (inlineSearch) closeInlineSearch();
            else if (dialog.open && current === 'search') finishClose();
            else if (dialog.open && current === 'cart') {
                // Keep the same cart, focus and scroll area while CSS changes
                // between drawer and fullscreen; the one dock is already inside.
                if (closing) finishClose();
                else {
                    surfaceMotion?.cancel(); surfaceMotion = null;
                    panelMotion?.cancel(); panelMotion = null;
                }
            }
            searchSemantics();
        });
        document.addEventListener('keydown', event => {
            if (inlineSearch && event.key === 'Escape') { event.preventDefault(); closeInlineSearch(); }
        });
        document.addEventListener('pointerdown', event => {
            if (inlineSearch && !searchSlot.contains(event.target) && !event.target.closest('[data-panel="search"]')) closeInlineSearch(false);
        });
        let backdropDown = false;
        const outsideDrawer = event => {
            const rect = dialog.getBoundingClientRect();
            return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
        };
        dialog.addEventListener('pointerdown', event => { backdropDown = outsideDrawer(event); });
        dialog.addEventListener('click', event => {
            if (current === 'cart' && desktop.matches && backdropDown && outsideDrawer(event)) close();
            backdropDown = false;
        });
        adminOffset();
        window.addEventListener('resize', () => { adminOffset(); positionMenuTrigger(); syncInlineHeaderControl(); });
        let offsetFrame = 0;
        window.addEventListener('scroll', () => {
            if (!offsetFrame) offsetFrame = requestAnimationFrame(() => {
                offsetFrame = 0;
                adminOffset();
            });
        }, {passive:true});
        dialog.addEventListener('cancel', event => {
            event.preventDefault();
            close();
        });
        dialog.addEventListener('keydown', event => {
            if (event.key === 'Tab') {
                dialog.querySelectorAll('.sf-initial-focus').forEach(el => el.classList.remove('sf-initial-focus'));
            }
        });
    }

    return {
        bind,
        open,
        toggleMenu,
        close,
        closeForNavigation,
        animateContent: animatePanelContent,
        getCurrent: () => current,
        getDialog: () => dialog,
    };
}
