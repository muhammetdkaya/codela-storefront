import { store } from '@wordpress/interactivity';
import { createSearchController } from './scripts/search-controller.js';
import { createCartController } from './scripts/cart-controller.js';

let dialog, current = null, opener, savedY = 0, savedBodyStyle = null, savedAdminStyle = null;
let menuPath = [];
let dockNode, dockHome, dockScrollFrame = 0, dockScrollTarget;
let panelMotion = null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const dockScrollPositions = new WeakMap();
const $ = s => document.querySelector(s);
const { state } = store('codela/storefront', {
    actions: {
        menu: event => open('menu', event),
        search: event => open('search', event),
        cart: event => open('cart', event),
        close: () => close(),
    },
});
const config = () => state.config;
const t = key => config().labels[key] || key;
const searchFeature = createSearchController({ $, config, t, getCurrent: () => current });
const cartFeature = createCartController({
    $, config, t, getCurrent: () => current, getDialog: () => dialog,
});
function adminOffset() {
    const bar = $('#wpadminbar');
    const rect = bar?.getBoundingClientRect();
    const visible = bar && getComputedStyle(bar).display !== 'none' && getComputedStyle(bar).visibility !== 'hidden';
    dialog?.style.setProperty('--sf-admin-offset', `${visible ? Math.max(0, Math.min(rect.bottom, rect.height)) : 0}px`);
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
function mobileDock() {
    return dockNode ||= $('.sf-mobile-dock');
}
function setDockCollapsed(collapsed) {
    const dock = mobileDock();
    if (!dock || dock.hidden || dock.classList.contains('is-collapsed') === collapsed) return;
    if (collapsed && dock.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) return;
    dock.classList.toggle('is-collapsed', collapsed);
    const handle = dock.querySelector('.sf-dock-handle');
    if (handle) {
        handle.tabIndex = collapsed ? 0 : -1;
        handle.setAttribute('aria-hidden', String(!collapsed));
    }
    dock.querySelectorAll('.sf-dock-item').forEach(item => { item.inert = collapsed; });
}
// A native modal makes outside nodes inert; move the one real dock into its top layer.
function mountDock() {
    const dock = mobileDock();
    if (dock && dock.parentElement !== dialog) {
        dockHome ||= document.createComment('mobile-navigation');
        dock.before(dockHome);
        dialog.appendChild(dock);
    }
}
function restoreDock() {
    const dock = mobileDock();
    if (!dock) return;
    dock.hidden = false;
    if (dock.parentElement === dialog) dockHome.after(dock);
    setDockCollapsed(false);
    markDockActive(null);
}
function markDockActive(name) {
    const dock = mobileDock();
    if (!dock) return;
    let activeIndex = -1;
    dock.querySelectorAll('.sf-dock-item').forEach((item, index) => {
        const active = name ? item.dataset.dockView === name : item.hasAttribute('aria-current');
        item.classList.toggle('is-active', active);
        if (active) activeIndex = index;
        if (item.dataset.panel) item.setAttribute('aria-expanded', String(item.dataset.panel === name));
    });
    dock.style.setProperty('--sf-dock-index', Math.max(0, activeIndex));
    dock.classList.toggle('has-selection', activeIndex !== -1);
}
// Hit testing uses stable, unscaled layout slots; animated icons cannot move targets.
function dockCandidate(dock, x, y) {
    const bounds = dock.getBoundingClientRect();
    if (x < bounds.left - 16 || x > bounds.right + 16 || y < bounds.top - 26 || y > bounds.bottom + 26) return null;
    const items = [...dock.querySelectorAll('.sf-dock-item')];
    const index = Math.max(0, Math.min(items.length - 1, Math.floor((x - bounds.left) / bounds.width * items.length)));
    return items[index] || null;
}
function handleDockScroll(event) {
    const target = event.target === document ? window : event.target;
    if (target !== window && !(target instanceof Element)) return;
    if (dialog?.open ? (target === window || !dialog.contains(target)) : target !== window) return;
    // A single read/write pass per frame, including nested modal scrollers.
    dockScrollTarget = target;
    if (!dockScrollFrame) dockScrollFrame = requestAnimationFrame(flushDockScroll);
}
function flushDockScroll() {
    dockScrollFrame = 0;
    const dock = mobileDock(), target = dockScrollTarget;
    if (!dock || dock.hidden || !target || window.innerWidth > 700) return;
    const scroller = target === window ? document.scrollingElement : target;
    const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const position = Math.max(0, Math.min(max, target === window ? window.scrollY : target.scrollTop));
    const previous = dockScrollPositions.get(target) || {position, distance:0};
    const delta = position - previous.position;
    let distance = Math.sign(delta) === Math.sign(previous.distance) ? previous.distance + delta : delta;
    if (dock.classList.contains('is-scrubbing') || dock.classList.contains('is-pressing')) distance = 0;
    else if (position < 24) { setDockCollapsed(false); distance = 0; }
    else if (distance >= 18 || distance <= -12) { setDockCollapsed(distance > 0); distance = 0; }
    dockScrollPositions.set(target, {position, distance});
}
function installDockGestures(dock) {
    if (!dock) return;
    const holdMs = 240;
    let press = null;
    let blockUntil = 0;
    const tabs = [...dock.querySelectorAll('.sf-dock-item')];
    const items = () => tabs;
    const clearVisuals = (restoreSelection = true) => {
        dock.classList.remove('is-scrubbing', 'is-pressing');
        if (restoreSelection) markDockActive(current);
        items().forEach(item => item.classList.remove('is-pressed','is-preview'));
    };
    const stop = (restoreSelection = true) => {
        if (press?.timer) clearTimeout(press.timer);
        press = null;
        clearVisuals(restoreSelection);
    };
    const preview = item => {
        items().forEach(el => el.classList.toggle('is-preview', el === item));
        if (press) press.choice = item;
        if (item) dock.style.setProperty('--sf-dock-index', tabs.indexOf(item));
        dock.classList.toggle('has-selection', !!item);
    };
    const activate = () => {
        if (!press || press.dragging) return;
        press.dragging = true;
        if (press.pointer) dock.setPointerCapture(press.id);
        dock.classList.add('is-scrubbing');
        press.item.classList.remove('is-pressed');
        preview(press.choice);
    };
    const begin = (item, x, y, id) => {
        // A new physical press (including the reveal handle) is never a ghost click.
        blockUntil = 0;
        if (!item || dock.classList.contains('is-collapsed')) return;
        stop();
        dock.classList.add('is-pressing');
        press = {id, item, choice:item, x, y, dragging:false, timer:null};
        item.classList.add('is-pressed');
        preview(item);
        const gestureId = id;
        press.timer = setTimeout(() => {
            if (press?.id !== gestureId) return;
            activate();
        }, holdMs);
    };
    const move = (event, x, y, id) => {
        if (!press || press.id !== id) return;
        const dx = Math.abs(x - press.x), dy = Math.abs(y - press.y);
        if (!press.dragging && dy > 18 && dy > dx) { stop(); return; }
        if (!press.dragging && dx > 9) activate();
        if (press?.dragging) {
            if (event.cancelable !== false) event.preventDefault();
            preview(dockCandidate(dock, x, y));
        }
    };
    const finish = (event, x, y, id) => {
        if (!press || press.id !== id) return;
        if (!press.dragging) {
            // Keep the touched capsule while the native click/navigation catches up.
            stop(dockCandidate(dock, x, y) !== press.item);
            return;
        }
        if (event.cancelable !== false) event.preventDefault();
        const item = dockCandidate(dock, x, y);
        stop(!item);
        blockUntil = Date.now() + 700; // Consume browser-generated click.
        if (!item) return;
        const view = item.dataset.dockView;
        if (view === 'search' || view === 'cart') open(view, {currentTarget:item, preventDefault(){}});
        else if (item.href) window.location.assign(item.href);
    };
    // Mobile browsers may cancel pointer capture when the finger leaves an <a>.
    // Track the original touch identifier instead and always receive touchend.
    dock.addEventListener('touchstart', event => {
        if (event.touches.length !== 1) { stop(); return; }
        const touch = event.changedTouches[0];
        begin(event.target.closest('.sf-dock-item'),touch.clientX,touch.clientY,touch.identifier);
    }, {passive:true});
    dock.addEventListener('touchmove', event => {
        const touch = [...event.changedTouches].find(t => t.identifier === press?.id);
        if (touch) move(event,touch.clientX,touch.clientY,touch.identifier);
    }, {passive:false});
    dock.addEventListener('touchend', event => {
        const touch = [...event.changedTouches].find(t => t.identifier === press?.id);
        if (touch) finish(event,touch.clientX,touch.clientY,touch.identifier);
    }, {passive:false});
    dock.addEventListener('touchcancel',stop);
    // Mouse/trackpad and pen also work without generating a second touch navigation.
    dock.addEventListener('pointerdown',event => {
        if (event.pointerType === 'touch' || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        begin(event.target.closest('.sf-dock-item'),event.clientX,event.clientY,event.pointerId);
        if (press) press.pointer = true;
    });
    dock.addEventListener('pointermove',event => {
        if (event.pointerType !== 'touch') move(event,event.clientX,event.clientY,event.pointerId);
    });
    dock.addEventListener('pointerup',event => {
        if (event.pointerType !== 'touch') finish(event,event.clientX,event.clientY,event.pointerId);
    });
    dock.addEventListener('pointercancel',event => { if (event.pointerType !== 'touch') stop(); });
    dock.addEventListener('lostpointercapture',event => { if (event.pointerType !== 'touch') stop(); });
    window.addEventListener('blur',stop);
    window.addEventListener('resize',stop);
    dock.addEventListener('contextmenu',event => { if (press) event.preventDefault(); });
    dock.addEventListener('click',event => {
        if (event.detail === 0 || Date.now() >= blockUntil) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        blockUntil = 0;
    },true);
    dock.querySelector('.sf-dock-handle')?.addEventListener('click',event => {
        setDockCollapsed(false);
        if (event.detail === 0) dock.querySelector('.is-active, .sf-dock-item')?.focus({preventScroll:true});
    });
}
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
function open(name, event) {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    event?.preventDefault();
    dialog ||= $('#sf-panel');
    if (!dialog || typeof dialog.showModal !== 'function') { if (name !== 'menu') location.href = config()[name] || config().shop; return; }
    const opening = !dialog.open;
    if (!opening && current === name) return;
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
    if (name === 'menu') { menuPath = []; paintMenu(); }
    if (name === 'search') searchFeature.start();
    if (name === 'cart') cartFeature.refresh();
    animatePanelContent(name === 'search' ? $('.sf-search-content') : $(`#sf-${name}`), previous === 'cart' && name === 'search' ? -1 : 1);
}
// Animate content, never the full-screen dialog: transforming it changes the
// containing block of the fixed dock in some browsers. Repeated actions cancel cleanly.
function animatePanelContent(element, direction = 1) {
    panelMotion?.cancel();
    panelMotion = null;
    if (reducedMotion.matches || !element?.animate) return;
    panelMotion = element.animate([
        {opacity:0, transform:`translate3d(${direction * 8}px,0,0)`},
        {opacity:1, transform:'translate3d(0,0,0)'},
    ], {duration:160, easing:'cubic-bezier(.2,.8,.2,1)'});
    panelMotion.onfinish = () => { panelMotion = null; };
}
function close() {
    if (!dialog?.open) return;
    panelMotion?.cancel(); panelMotion = null;
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
    dialog = $('#sf-panel'); if (!dialog) return;
    installDockGestures(mobileDock());
    markDockActive(null);
    dockScrollPositions.set(window, {position:window.scrollY, distance:0});
    window.addEventListener('scroll',handleDockScroll,{passive:true});
    dialog.addEventListener('scroll',handleDockScroll,{passive:true,capture:true});
    window.addEventListener('pageshow',() => {
        setDockCollapsed(false);
        dockScrollPositions.set(window, {position:window.scrollY, distance:0});
    });
    window.addEventListener('resize', () => {
        if (dialog.open) adminOffset();
    });
    dialog.addEventListener('cancel',event => {event.preventDefault();close();});
    dialog.addEventListener('keydown',event => {
        if (event.key === 'Tab') {
            dialog.querySelectorAll('.sf-initial-focus').forEach(el => el.classList.remove('sf-initial-focus'));
        }
    });
    searchFeature.bind();
    cartFeature.bind();
    const menu = $('#sf-menu .sf-menu-list');
    menu?.classList.add('enhanced');
    menu?.querySelectorAll('.sub-menu').forEach(sub => {
        const button = document.createElement('button'); button.className = 'sf-submenu-toggle sf-ui-pressable'; button.textContent = '›'; button.setAttribute('aria-label', sub.parentElement.querySelector('a').textContent); button.setAttribute('aria-expanded','false');
        button.addEventListener('click', () => {menuPath.push(sub.parentElement);paintMenu();animatePanelContent($('#sf-menu'));$('#sf-menu .sf-back').focus({preventScroll:true});});
        sub.before(button);
    });
    $('#sf-menu .sf-back').addEventListener('click', () => {const item = menuPath.pop();paintMenu();animatePanelContent($('#sf-menu'),-1);item?.querySelector('.sf-submenu-toggle')?.focus({preventScroll:true});});
    dialog.addEventListener('click',event => {
        const b = event.target.closest('button'); if (!b) return;
        if (b.matches('[data-qty],[data-remove]')) cartFeature.change(b);
        if (b.matches('.sf-retry-cart')) cartFeature.refresh();
        if (b.matches('.sf-retry-search')) searchFeature.retry();
    });

}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();


