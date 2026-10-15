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
function preventInitialAccountAutoFocus() {
    const account = document.body.classList.contains('woocommerce-account')
        || !!document.querySelector('.woocommerce-MyAccount-navigation, .woocommerce-form-login, .woocommerce-form-register');
    if (!account) return;
    let guarding = true;
    const inputSelector = 'input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=submit]),textarea,[contenteditable="true"]';
    document.querySelectorAll('[autofocus]').forEach(el => {
        if (el.matches(inputSelector)) el.removeAttribute('autofocus');
    });
    const dismiss = el => {
        if (guarding && el?.matches?.(inputSelector)) el.blur();
    };
    const onFocus = event => dismiss(event.target);
    const release = () => {
        if (!guarding) return;
        guarding = false;
        document.removeEventListener('focusin',onFocus,true);
        document.removeEventListener('touchstart',release,true);
        document.removeEventListener('pointerdown',release,true);
        document.removeEventListener('keydown',release,true);
    };
    document.addEventListener('focusin',onFocus,true);
    for (const type of ['touchstart','pointerdown','keydown']) document.addEventListener(type,release,{capture:true,once:true});
    dismiss(document.activeElement);
    setTimeout(release,1600);
}
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
    preventInitialAccountAutoFocus();
    const dialog = $('#sf-panel'); if (!dialog) return;
    overlay.bind(dialog);
    dock.init(dialog);
    searchFeature.bind();
    $('#sf-filters form')?.addEventListener('submit', event => {
        event.target.querySelectorAll('input[type="number"]').forEach(input => {
            input.disabled = input.value === '';
        });
    });
    cartFeature.bind();
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
    dialog.addEventListener('click',event => {
        const b = event.target.closest('button'); if (!b) return;
        if (b.matches('[data-qty],[data-remove]')) cartFeature.change(b);
        if (b.matches('.sf-retry-cart')) cartFeature.refresh();
        if (b.matches('.sf-retry-search')) searchFeature.retry();
    });

}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
