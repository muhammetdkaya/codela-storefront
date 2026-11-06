import { store } from '@wordpress/interactivity';
import { createSearchController } from 'codela-storefront/search';
import { createCartController } from 'codela-storefront/cart';
import { createOverlayController } from 'codela-storefront/overlay';
import { createDockController } from 'codela-storefront/dock';

let menuPath = [];
const $ = s => document.querySelector(s);
const { state } = store('codela/storefront', {
    actions: {
        menu: event => overlay.toggleMenu(event),
        search: event => overlay.open('search', event),
        cart: event => overlay.open('cart', event),
        filters: event => overlay.open('filters', event),
        account: event => overlay.open('account', event),
        close: () => overlay.close(),
    },
});
const config = () => state.config;
const t = key => config().labels[key] || key;
const searchFeature = createSearchController({ $, config, t, getCurrent: () => overlay.getCurrent() });
const cartFeature = createCartController({
    $, config, t, getCurrent: () => overlay.getCurrent(), getDialog: () => overlay.getDialog(),
});
const dock = createDockController({
    getDialog: () => overlay.getDialog(),
    getCurrent: () => overlay.getCurrent(),
    open: (name, event) => overlay.open(name, event),
    close: () => overlay.close(),
});
const overlay = createOverlayController({
    $, config, t, searchFeature, cartFeature,
    mountDock: dock.mountDock, restoreDock: dock.restoreDock,
    setDockCollapsed: dock.setDockCollapsed, markDockActive: dock.markDockActive,
    mobileDock: dock.mobileDock, dockScrollPositions: dock.dockScrollPositions,
    onMenuOpen: () => { menuPath = []; paintMenu(); },
});
function paintMenu() {
    const root = $('#sf-menu .sf-menu-list');
    if (!root) return;
    root.querySelectorAll('li,a,.sf-submenu-toggle').forEach(el => el.hidden = false);
    root.querySelectorAll('.sf-submenu-toggle').forEach(el => el.setAttribute('aria-expanded','false'));
    root.querySelectorAll('.sub-menu').forEach(el => el.hidden = true);
    let level = root;
    for (const item of menuPath) {
        item.querySelector(':scope > .sf-submenu-toggle')?.setAttribute('aria-expanded','true');
        for (const sibling of level.children) sibling.hidden = sibling !== item;
        for (const child of item.children) child.hidden = !child.classList.contains('sub-menu');
        level = item.querySelector(':scope > .sub-menu');
    }
    $('#sf-menu .sf-back').hidden = !menuPath.length;
    $('#sf-menu .sf-menu-secondary').hidden = !!menuPath.length;
}
function init() {
    const dialog = $('#sf-panel'); if (!dialog) return;
    overlay.bind(dialog);
    dock.init(dialog);
    searchFeature.bind();
    cartFeature.bind();
    // The Back link from a product entered through Search navigates to the
    // original document and carries a one-shot Search return intent.
    // Apply only on that exact same-tab, same-origin source, never on arbitrary
    // page visits or browser history from an external website.
    function restoreSearchReturn() {
        const key = 'sf-search-return-state';
        let saved;
        try { saved = JSON.parse(sessionStorage.getItem(key) || 'null'); }
        catch { sessionStorage.removeItem(key); return; }
        if (!saved || !saved.url || Date.now() - saved.time > 120000) {
            if (saved) sessionStorage.removeItem(key);
            return;
        }
        const canonical = value => {
            const url = new URL(value, location.href);
            url.hash = '';
            if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
            for (const key of [...url.searchParams.keys()]) {
                if (/^(utm_.+|gclid|fbclid)$/i.test(key)) url.searchParams.delete(key);
            }
            url.searchParams.sort();
            return url.origin + url.pathname + url.search;
        };
        if (canonical(saved.url) !== canonical(location.href)) return;
        sessionStorage.removeItem(key);
        if (!window.matchMedia('(max-width:700px)').matches) return;
        if (Number.isFinite(saved.pageScroll)) window.scrollTo(0, Math.max(0, saved.pageScroll));
        overlay.open('search');
        searchFeature.restore(saved);
    }
    restoreSearchReturn();
    window.addEventListener('pageshow', event => {
        if (event.persisted) restoreSearchReturn();
    });
    // Core Router navigation keeps the one real header/dialog/dock mounted.
    // Never create a second navigation controller or dock instance.
    window.addEventListener('codela:before-route', () => overlay.closeForNavigation());
    window.addEventListener('codela:route-committed', () => dock.markDockActive(null));
    const menu = $('#sf-menu .sf-menu-list');
    menu?.classList.add('enhanced');
    menu?.querySelectorAll('.sub-menu').forEach(sub => {
        const button = document.createElement('button'); button.className = 'sf-submenu-toggle sf-ui-pressable'; button.textContent = '›'; button.setAttribute('aria-label', sub.parentElement.querySelector('a').textContent); button.setAttribute('aria-expanded','false');
        button.addEventListener('click', () => {menuPath.push(sub.parentElement);paintMenu();overlay.animateContent($('#sf-menu'));$('#sf-menu .sf-back').focus({preventScroll:true});});
        sub.before(button);
    });
    $('#sf-menu .sf-back').addEventListener('click', () => {const item = menuPath.pop();paintMenu();overlay.animateContent($('#sf-menu'),-1);item?.querySelector('.sf-submenu-toggle')?.focus({preventScroll:true});});
    dialog.closest('.sf-shell').addEventListener('click',event => {
        const b = event.target.closest('button'); if (!b) return;
        if (b.matches('[data-qty],[data-remove]')) cartFeature.change(b);
        if (b.matches('.sf-retry-cart')) cartFeature.refresh();
        if (b.matches('.sf-retry-search')) searchFeature.retry();
    });

}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
