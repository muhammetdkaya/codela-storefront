import { store } from '@wordpress/interactivity';
import { createSearchController } from './scripts/search-controller.js';
import { createCartController } from './scripts/cart-controller.js';
import { createOverlayController } from './scripts/overlay-controller.js';

let menuPath = [];
let dockNode, dockHome, dockScrollFrame = 0, dockScrollTarget;
const dockScrollPositions = new WeakMap();
const $ = s => document.querySelector(s);
const { state } = store('codela/storefront', {
    actions: {
        menu: event => overlay.open('menu', event),
        search: event => overlay.open('search', event),
        cart: event => overlay.open('cart', event),
        close: () => overlay.close(),
    },
});
const config = () => state.config;
const t = key => config().labels[key] || key;
const searchFeature = createSearchController({ $, config, t, getCurrent: () => overlay.getCurrent() });
const cartFeature = createCartController({
    $, config, t, getCurrent: () => overlay.getCurrent(), getDialog: () => overlay.getDialog(),
});
const overlay = createOverlayController({
    $, config, t, searchFeature, cartFeature,
    mountDock, restoreDock, setDockCollapsed, markDockActive, mobileDock,
    dockScrollPositions,
    onMenuOpen: () => { menuPath = []; paintMenu(); },
});
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
    const dialog = overlay.getDialog();
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
    if (dock.parentElement === overlay.getDialog()) dockHome.after(dock);
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
    const dialog = overlay.getDialog();
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
        if (restoreSelection) markDockActive(overlay.getCurrent());
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
        if (view === 'search' || view === 'cart') overlay.open(view, {currentTarget:item, preventDefault(){}});
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
    installDockGestures(mobileDock());
    markDockActive(null);
    dockScrollPositions.set(window, {position:window.scrollY, distance:0});
    window.addEventListener('scroll',handleDockScroll,{passive:true});
    dialog.addEventListener('scroll',handleDockScroll,{passive:true,capture:true});
    window.addEventListener('pageshow',() => {
        setDockCollapsed(false);
        dockScrollPositions.set(window, {position:window.scrollY, distance:0});
    });
    searchFeature.bind();
    cartFeature.bind();
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


