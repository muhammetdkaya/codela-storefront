/**
 * One mobile dock: native-dialog relocation, scroll collapse and touch/pointer
 * scrubbing. Uses callbacks to the sole overlay controller, never a second view
 * state. Instantiated once from the Storefront entrypoint.
 */
export function createDockController({ getDialog, getCurrent, open, close }) {
    let dockNode, dockHome, dockScrollFrame = 0, dockScrollTarget;
    const dockScrollPositions = new WeakMap();
    const $ = s => document.querySelector(s);
    let initialized = false;

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
        const dialog = getDialog();
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
        if (dock.parentElement === getDialog()) dockHome.after(dock);
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
    // Home/Account are actual pages, but tapping the page already underneath a
    // popup should only dismiss the popup. WordPress renders aria-current on the
    // matching page; never infer it from a URL (account subroutes also match).
    function activateCurrentPage(item, event) {
        const view = item?.dataset.dockView;
        if (view !== 'home' && view !== 'account') return false;
        if (!item.hasAttribute('aria-current')) return false;
        if (event?.metaKey || event?.ctrlKey || event?.shiftKey || event?.altKey || event?.button > 0) return false;
        event?.preventDefault?.();
        if (getDialog()?.open) close();
        else markDockActive(null);
        return true;
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
        const dialog = getDialog();
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
            if (restoreSelection) markDockActive(getCurrent());
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
            else if (!activateCurrentPage(item, event) && item.href) window.location.assign(item.href);
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
            if (event.detail !== 0 && Date.now() < blockUntil) {
                event.preventDefault();
                event.stopImmediatePropagation();
                blockUntil = 0;
                return;
            }
            // A native tap or keyboard activation on the current page must not
            // perform a full document navigation just to close Search/Cart.
            activateCurrentPage(event.target?.closest?.('.sf-dock-item'), event);
        },true);
        dock.querySelector('.sf-dock-handle')?.addEventListener('click',event => {
            setDockCollapsed(false);
            if (event.detail === 0) dock.querySelector('.is-active, .sf-dock-item')?.focus({preventScroll:true});
        });
    }
    function init(dialog) {
        if (initialized) return;
        initialized = true;
        installDockGestures(mobileDock());
        markDockActive(null);
        dockScrollPositions.set(window, {position:window.scrollY, distance:0});
        window.addEventListener('scroll',handleDockScroll,{passive:true});
        dialog.addEventListener('scroll',handleDockScroll,{passive:true,capture:true});
        window.addEventListener('pageshow',() => {
            setDockCollapsed(false);
            dockScrollPositions.set(window, {position:window.scrollY, distance:0});
        });
    }

    return {
        init, mobileDock, setDockCollapsed, mountDock, restoreDock,
        markDockActive, dockScrollPositions,
    };
}
