/**
 * Single fullscreen overlay controller. Owns native dialog, active view,
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
    let surfaceMotion = null, closing = false;
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
    function open(name, event) {
        if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
        event?.preventDefault();
        dialog ||= $('#sf-panel');
        if (!dialog || typeof dialog.showModal !== 'function') { if (name !== 'menu') location.href = config()[name] || config().shop; return; }
        if (closing) {
            surfaceMotion?.cancel(); surfaceMotion = null;
            panelMotion?.cancel(); panelMotion = null;
            closing = false;
        }
        const opening = !dialog.open;
        if (!opening && current === name) return;
        surfaceMotion?.cancel(); surfaceMotion = null;
        const previous = current;
        if (opening) {
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
        setDockCollapsed(false);
        dialog.classList.toggle('is-search-panel', name === 'search');
        dialog.classList.toggle('is-cart-panel', name === 'cart');
        const dock = mobileDock();
        if (dock && dock.parentElement === dialog) dock.hidden = name === 'menu';
        markDockActive(name);
        const menuTrigger = document.querySelector('[data-panel="menu"]');
        dialog.setAttribute('aria-label', name === 'menu' ? (menuTrigger?.getAttribute('aria-label') || 'Menu') : name === 'search' ? t('Search products') : t('Your cart'));
        dialog.removeAttribute('aria-labelledby');
        for (const section of ['menu','search','cart']) $(`#sf-${section}`).hidden = name !== section;
        $('.sf-cart-bottom').hidden = name !== 'cart' || !cartFeature.getData()?.items.length;
        $('#sf-status').textContent = '';
        $('#sf-panel-title').textContent = name === 'menu' ? '' : name === 'search' ? t('Search products') : t('Your cart');
        document.querySelectorAll('[data-panel]').forEach(el => el.setAttribute('aria-expanded', String(el.dataset.panel === name)));
        dialog.classList.add('is-open');
        // Automatically focused controls should not display a giant focus ring
        // when opening a panel; keyboard navigation must still show its indicator.
        dialog.querySelectorAll('.sf-initial-focus').forEach(el => el.classList.remove('sf-initial-focus'));
        const initialFocus = name === 'search' ? $('.sf-search-cancel') : $('.sf-close');
        initialFocus.classList.add('sf-initial-focus');
        // Native dialog focuses this button even when a previous session focused the query.
        dialog.querySelectorAll('[autofocus]').forEach(el => el.removeAttribute('autofocus'));
        initialFocus.setAttribute('autofocus', '');
        if (opening) dialog.showModal();
        initialFocus.focus({preventScroll:true});
        if (name === 'menu') onMenuOpen();
        if (name === 'search') searchFeature.start();
        if (name === 'cart') cartFeature.refresh();
        animatePanelContent(name === 'search' ? $('.sf-search-content') : $(`#sf-${name}`), previous === 'cart' && name === 'search' ? -1 : 1);
        if (name === 'menu' && !reducedMotion.matches && dialog.animate) {
            surfaceMotion = dialog.animate([{opacity:0},{opacity:1}], {duration:220,easing:'ease-out'});
        }
    }
    // Animate content, never the full-screen dialog: transforming it changes the
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
        if (!dialog?.open || closing) return;
        panelMotion?.cancel(); panelMotion = null;
        surfaceMotion?.cancel(); surfaceMotion = null;
        if (current === 'menu' && !reducedMotion.matches && dialog.animate) {
            closing = true;
            panelMotion = $('#sf-menu').animate([
                {opacity:1,transform:'translate3d(0,0,0)'},
                {opacity:0,transform:'translate3d(0,-12px,0)'},
            ], {duration:180,easing:'ease-in',fill:'forwards'});
            surfaceMotion = dialog.animate([{opacity:1},{opacity:0}], {duration:180,easing:'ease-in',fill:'forwards'});
            surfaceMotion.onfinish = finishClose;
            return;
        }
        finishClose();
    }
    function finishClose() {
        surfaceMotion?.cancel(); surfaceMotion = null;
        panelMotion?.cancel(); panelMotion = null;
        closing = false;
        dialog.classList.remove('is-open');
        document.querySelectorAll('[data-panel]').forEach(el => el.setAttribute('aria-expanded','false'));
        searchFeature.cancel();
        dialog.close(); current = null;
        restoreDock();
        restoreStyle(document.body, savedBodyStyle); savedBodyStyle = null;
        const bar = $('#wpadminbar'); if (bar) restoreStyle(bar, savedAdminStyle);
        savedAdminStyle = null; dialog.style.removeProperty('--sf-admin-offset');
        window.scrollTo({top:savedY, left:0, behavior:'instant'});
        dockScrollPositions.set(window, {position:savedY, distance:0});
        if (opener?.isConnected) opener.focus({preventScroll:true});
    }
    
    function bind(element) {
        if (dialog && dialog !== element) throw new Error('Overlay controller already bound');
        if (dialog) return;
        dialog = element;
        adminOffset();
        window.addEventListener('resize', adminOffset);
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
        close,
        animateContent: animatePanelContent,
        getCurrent: () => current,
        getDialog: () => dialog,
    };
}

