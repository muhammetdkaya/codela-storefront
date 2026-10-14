/**
 * Progressive enhancement of marked links using WordPress's *native* router.
 * Not a second router or SPA: unsupported destinations use real document loads.
 */
import { store, watch } from '@wordpress/interactivity';
const { state: routerState } = store('core/router');
const REGION = '#sf-content[data-wp-router-region="codela/storefront/main"]';
const DELAY_MS = 160;
let timer = 0;
let busy = false;
let desired = 'content';
let previousUrl = routerState.url || location.href;

function sameDocument(url) {
    const here = new URL(location.href);
    return url.origin === here.origin && url.pathname === here.pathname && url.search === here.search;
}
function allowedClick(event, link) {
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.target && link.target !== '_self' || link.hasAttribute('download') ||
        link.closest('[contenteditable],form') || !document.querySelector(REGION)) return false;
    let url;
    try { url = new URL(link.href, location.href); } catch { return false; }
    return ['http:', 'https:'].includes(url.protocol) && url.origin === location.origin &&
        !url.hash && !sameDocument(url);
}
function renderPlaceholder() {
    const main = document.querySelector(REGION);
    if (!main || main.querySelector(':scope > .sf-route-skeleton')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'sf-route-skeleton';
    wrapper.setAttribute('aria-hidden', 'true');
    // Layout adapted to the destination, but never reproduces a real product
    // title or stale customer information.
    if (desired === 'home') {
        wrapper.innerHTML = '<div class="sf-route-hero"></div><div class="sf-route-line"></div><div class="sf-route-cards">' +
            '<div></div>'.repeat(4) + '</div>';
    } else {
        wrapper.innerHTML = '<div class="sf-route-heading"></div>' +
            '<div class="sf-route-entry"><i></i><div><span></span><span></span></div></div>'.repeat(3);
    }
    main.prepend(wrapper);
    main.classList.add('sf-route-loading');
}
function clearPlaceholder() {
    document.querySelectorAll('.sf-route-skeleton').forEach(el => el.remove());
    document.querySelectorAll('.sf-route-loading').forEach(el => el.classList.remove('sf-route-loading'));
}
function applyLocation() {
    const main = document.querySelector(REGION);
    if (!main) return;
    const home = document.querySelector('.sf-dock-item[data-dock-view="home"]');
    const here = new URL(routerState.url || location.href, location.href);
    const homeUrl = home && new URL(home.href);
    const isHome = !!homeUrl && homeUrl.origin === here.origin &&
        homeUrl.pathname.replace(/\/$/, '') === here.pathname.replace(/\/$/, '');
    if (home) {
        if (isHome) home.setAttribute('aria-current', 'page');
        else home.removeAttribute('aria-current');
    }
    document.querySelectorAll('.sf-shell').forEach(shell => {
        shell.dataset.sfCurrentPage = main.dataset.sfRouteType || 'page';
    });
    // These few classes are used by WordPress/theme styles; native router
    // regions do not promise that document.body is replaced.
    document.body.classList.toggle('home', isHome);
    document.body.classList.toggle('front-page', isHome);
    document.body.classList.toggle('page', !isHome);
    window.dispatchEvent(new Event('codela:route-committed'));
}
watch(() => {
    const navigating = !!routerState.navigating;
    const url = routerState.url || location.href;
    if (navigating && !busy) {
        busy = true;
        timer = window.setTimeout(renderPlaceholder, DELAY_MS);
    } else if (!navigating && busy) {
        busy = false;
        window.clearTimeout(timer);
        clearPlaceholder();
        if (previousUrl !== url && document.querySelector(REGION)) {
            previousUrl = url;
            applyLocation();
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            const main = document.querySelector(REGION);
            main.setAttribute('tabindex', '-1');
            main.focus({ preventScroll: true });
        }
    }
});
// Document delegation survives successive region replacements. Route only
// explicitly marked links: ordinary Woo/product/auth/checkout links stay native.
document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-sf-route]');
    if (!allowedClick(event, link)) return;
    event.preventDefault();
    desired = link.dataset.sfRoute === 'home' ? 'home' : 'content';
    if (document.querySelector('#sf-panel[open]')) {
        window.dispatchEvent(new Event('codela:before-route'));
    }
    const url = link.href;
    // Dynamic import means the router is paid for only on actual navigation.
    import('@wordpress/interactivity-router').then(({actions}) =>
        actions.navigate(url, { timeout: 7000, loadingAnimation: false })
    ).catch(() => {
        // No custom fetch/caching: if the router module cannot load, restore
        // normal navigation for this click.
        window.location.assign(url);
    });
});
