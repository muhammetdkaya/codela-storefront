import { store } from '@wordpress/interactivity';

let dialog, current = null, opener, savedY = 0, savedBodyStyle = null, savedAdminStyle = null;
let searchTimer, searchController, searchSequence = 0;
let cartNonce = '', cartData = null, cartPending = null, mutating = false;
let menuPath = [];
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
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode = value => { const e = document.createElement('textarea'); e.innerHTML = String(value ?? ''); return e.value; };
const safeURL = value => { try { const url = new URL(value, location.href); return ['http:','https:'].includes(url.protocol) ? escape(url.href) : ''; } catch { return ''; } };
const money = (amount, meta) => {
    const digits = Number(meta.currency_minor_unit || 0);
    const n = Number(amount) / 10 ** digits;
    return new Intl.NumberFormat(document.documentElement.lang || 'en', {style:'currency', currency:meta.currency_code, minimumFractionDigits:digits, maximumFractionDigits:digits}).format(n);
};
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
function open(name, event) {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    event?.preventDefault();
    dialog ||= $('#sf-panel');
    if (!dialog || typeof dialog.showModal !== 'function') { if (name !== 'menu') location.href = config()[name] || config().shop; return; }
    if (!dialog.open) {
        opener = document.activeElement; savedY = window.scrollY;
        const bodyRect = document.body.getBoundingClientRect();
        savedBodyStyle = rememberStyle(document.body, ['position', 'top', 'width']);
        const bar = $('#wpadminbar');
        if (bar) {
            const barRect = bar.getBoundingClientRect();
            savedAdminStyle = rememberStyle(bar, ['position', 'top']);
            // Mobile WordPress uses an absolute toolbar; keep its visible position
            // when the body becomes a new containing block.
            bar.style.position = 'fixed'; bar.style.top = `${barRect.top}px`;
        }
        // Preserve the rendered body origin, including WordPress's html top margin.
        document.body.style.position = 'fixed'; document.body.style.top = `${bodyRect.top}px`; document.body.style.width = `${bodyRect.width}px`;
        adminOffset();
        dialog.showModal();
    }
    current = name;
    dialog.classList.toggle('is-search-panel', name === 'search');
    const menuTrigger = document.querySelector('[data-panel="menu"]');
    dialog.setAttribute('aria-label', name === 'menu' ? (menuTrigger?.getAttribute('aria-label') || 'Menu') : name === 'search' ? t('Search products') : t('Your cart'));
    dialog.removeAttribute('aria-labelledby');
    for (const section of ['menu','search','cart']) $(`#sf-${section}`).hidden = name !== section;
    $('.sf-cart-bottom').hidden = true;
    $('#sf-status').textContent = '';
    $('#sf-panel-title').textContent = name === 'menu' ? '' : name === 'search' ? t('Search products') : t('Your cart');
    document.querySelectorAll('[data-panel]').forEach(el => el.setAttribute('aria-expanded', String(el.dataset.panel === name)));
    dialog.classList.add('is-open');
    // Automatically focused controls should not display a giant focus ring
    // when opening a panel; keyboard navigation must still show its indicator.
    dialog.querySelectorAll('.sf-initial-focus').forEach(el => el.classList.remove('sf-initial-focus'));
    const initialFocus = name === 'search' ? $('#sf-query') : $('.sf-close');
    initialFocus.classList.add('sf-initial-focus');
    initialFocus.focus({preventScroll:true});
    if (name === 'menu') { menuPath = []; paintMenu(); }
    if (name === 'search') { syncSearchControls(); search(); }
    if (name === 'cart') refreshCart();
}
function close() {
    if (!dialog?.open) return;
    dialog.classList.remove('is-open');
    document.querySelectorAll('[data-panel]').forEach(el => el.setAttribute('aria-expanded','false'));
    searchController?.abort(); ++searchSequence; clearTimeout(searchTimer);
    dialog.close(); current = null;
    restoreStyle(document.body, savedBodyStyle); savedBodyStyle = null;
    const bar = $('#wpadminbar'); if (bar) restoreStyle(bar, savedAdminStyle);
    savedAdminStyle = null; dialog.style.removeProperty('--sf-admin-offset');
    window.scrollTo(0, savedY); opener?.focus({preventScroll:true});
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
function syncSearchControls() {
    const input = $('#sf-query');
    const query = input.value.trim();
    $('.sf-search-clear').hidden = input.value.length === 0;
    $('.sf-search-suggestion').hidden = query.length < 2;
    $('.sf-search-term').textContent = query;
}
async function search() {
    const query = $('#sf-query').value.trim();
    syncSearchControls();
    const sequence = ++searchSequence;
    searchController?.abort();
    const results = $('#sf-results');
    results.setAttribute('aria-busy','false');
    if (query.length < 2) { results.textContent = ''; return; }
    searchController = new AbortController();
    results.setAttribute('aria-busy','true');
    // Skeleton appears only during a real in-flight product search; never invent suggestions or products.
    const row = '<div class="sf-skeleton-row"><i></i><span><b></b><b></b></span></div>';
    results.innerHTML = '<div class="sf-search-skeleton" aria-hidden="true">' + row.repeat(6) + '</div>' +
        '<span class="screen-reader-text">' + escape(t('Loading…')) + '</span>';
    try {
        const url = new URL(config().search); url.searchParams.set('q',query);
        const response = await fetch(url, {credentials:'same-origin', signal:searchController.signal, cache:'no-store'});
        if (!response.ok) throw new Error();
        const products = await response.json();
        if (sequence !== searchSequence || current !== 'search') return;
        results.innerHTML = products.length ? products.map(p => `<a class="sf-result" href="${safeURL(p.url)}"><img src="${safeURL(p.image)}" alt="" width="80" height="100"><div><h3>${escape(decode(p.name))}</h3><p>${escape(decode(p.price))}</p><small>${escape(p.sku)}</small></div></a>`).join('') : `<p>${escape(t('No matching products.'))}</p>`;
    } catch (error) {
        if (error.name !== 'AbortError' && sequence === searchSequence && current === 'search') results.innerHTML = `<p>${escape(t('Something went wrong. Please try again.'))}</p><button class="sf-retry-search">${escape(t('Retry'))}</button>`;
    } finally { if (sequence === searchSequence) results.setAttribute('aria-busy','false'); }
}
async function requestCart(path = '', payload = null) {
    const response = await fetch(config().api + 'cart' + path, {
        method:payload ? 'POST':'GET', credentials:'same-origin', cache:'no-store',
        headers:payload ? {'Content-Type':'application/json', 'Nonce':cartNonce} : {},
        body:payload ? JSON.stringify(payload) : undefined,
    });
    const nonce = response.headers.get('Nonce'); if (nonce) cartNonce = nonce;
    const data = await response.json();
    if (!response.ok) { const error = new Error(decode(data.message || t('Something went wrong. Please try again.'))); error.code = data.code; error.cart = data.data?.cart; throw error; }
    return data;
}
function paintCart(data) {
    cartData = data;
    const badge = $('.sf-badge'); if (badge) badge.textContent = data.items_count || '';
    const cartLink = $('[data-panel="cart"]'); if (cartLink) cartLink.setAttribute('aria-label', `${t('Your cart')} (${data.items_count || 0})`);
    const root = $('#sf-cart-items');
    root.innerHTML = data.items.length ? data.items.map(item => {
        const limits = item.quantity_limits || {minimum:1,maximum:9999,multiple_of:1,editable:true};
        const subtotal = Number(item.totals.line_subtotal) + (config().taxInclusive ? Number(item.totals.line_subtotal_tax) : 0);
        const variants = (item.variation || []).map(v => `${escape(decode(v.attribute))}: ${escape(decode(v.value))}`).join(' · ');
        return `<article class="sf-cart-row"><a href="${safeURL(item.permalink)}">${item.images[0] ? `<img class="sf-cart-photo" src="${safeURL(item.images[0].thumbnail || item.images[0].src)}" alt="${escape(decode(item.name))}" width="110" height="140">` : ''}</a><div><h3><a href="${safeURL(item.permalink)}">${escape(decode(item.name))}</a></h3>${variants ? `<p>${variants}</p>` : ''}<p>${escape(money(subtotal,item.totals))}</p><div class="sf-quantity"><div class="sf-stepper"><button data-key="${escape(item.key)}" data-qty="${item.quantity - limits.multiple_of}" aria-label="${escape(t('Decrease quantity'))}" ${!limits.editable || item.quantity - limits.multiple_of < limits.minimum ? 'disabled':''}>−</button><span aria-label="${escape(t('Quantity'))}">${item.quantity}</span><button data-key="${escape(item.key)}" data-qty="${item.quantity + limits.multiple_of}" aria-label="${escape(t('Increase quantity'))}" ${!limits.editable || item.quantity + limits.multiple_of > limits.maximum ? 'disabled':''}>+</button></div><button class="sf-remove" data-remove="${escape(item.key)}">${escape(t('Remove'))}</button></div></div></article>`;
    }).join('') : `<div class="sf-empty"><h3>${escape(t('Your cart is empty.'))}</h3><a class="sf-primary" href="${safeURL(config().shop)}">${escape(t('Continue shopping'))}</a></div>`;
    $('.sf-cart-bottom').hidden = current !== 'cart' || !data.items.length;
    const subtotal = Number(data.totals.total_items) + (config().taxInclusive ? Number(data.totals.total_items_tax) : 0);
    $('#sf-subtotal').textContent = money(subtotal,data.totals);
    if (current === 'cart') $('#sf-status').textContent = (data.errors || []).map(e => decode(e.message)).join(' ');
}
async function refreshCart() {
    if (mutating) return;
    if (cartPending) return cartPending;
    if (!cartData) $('#sf-cart-items').textContent = t('Loading…');
    cartPending = (async () => {
        try { paintCart(await requestCart()); }
        catch { $('#sf-cart-items').innerHTML = `<p>${escape(t('Something went wrong. Please try again.'))}</p><button class="sf-retry-cart">${escape(t('Retry'))}</button><p><a href="${safeURL(config().cart)}">${escape(t('Your cart'))}</a></p>`; $('.sf-cart-bottom').hidden = true; }
        finally { cartPending = null; }
    })();
    return cartPending;
}
async function changeCart(button) {
    if (mutating) return;
    mutating = true;
    const key = button.dataset.remove || button.dataset.key;
    const isRemove = !!button.dataset.remove;
    const payload = isRemove ? {key} : {key, quantity:Number(button.dataset.qty)};
    const focusQuantity = button.dataset.qty;
    $('#sf-cart').setAttribute('aria-busy','true');
    $('#sf-cart').querySelectorAll('button').forEach(b => b.disabled = true);
    $('.sf-cart-bottom').inert = true;
    try {
        // A nonce is read fresh from the session GET, never embedded in cacheable HTML.
        if (!cartNonce) await requestCart();
        let data;
        try { data = await requestCart(isRemove ? '/remove-item' : '/update-item',payload); }
        catch(error) {
            if (!['woocommerce_rest_invalid_nonce','woocommerce_rest_missing_nonce'].includes(error.code)) throw error;
            await requestCart(); data = await requestCart(isRemove ? '/remove-item' : '/update-item',payload);
        }
        paintCart(data); $('#sf-status').textContent = t('Cart updated.');
    } catch(error) {
        if (error.cart) paintCart(error.cart);
        else { try { paintCart(await requestCart()); } catch { if (cartData) paintCart(cartData); } }
        $('#sf-status').textContent = error.message;
    } finally {
        mutating = false; $('#sf-cart').setAttribute('aria-busy','false'); $('.sf-cart-bottom').inert = false;
        if (current === 'cart' && dialog.open) {
            const candidate = [...$('#sf-cart').querySelectorAll('[data-key]')].find(b => b.dataset.key === key && b.dataset.qty === focusQuantity && !b.disabled) || $('#sf-cart button:not(:disabled)') || $('.sf-close');
            candidate.focus({preventScroll:true});
        }
    }
}
function init() {
    dialog = $('#sf-panel'); if (!dialog) return;
    window.addEventListener('resize', () => {
        if (dialog.open) adminOffset();
    });
    dialog.addEventListener('cancel',event => {event.preventDefault();close();});
    dialog.addEventListener('keydown',event => {
        if (event.key === 'Tab') {
            dialog.querySelectorAll('.sf-initial-focus').forEach(el => el.classList.remove('sf-initial-focus'));
        }
    });
    $('#sf-query').addEventListener('input', () => {
        clearTimeout(searchTimer); searchController?.abort(); ++searchSequence;
        $('#sf-results').textContent = '';
        $('#sf-results').setAttribute('aria-busy','false');
        syncSearchControls();
        searchTimer = setTimeout(search,180);
    });
    $('#sf-search form').addEventListener('submit',event => {event.preventDefault();clearTimeout(searchTimer);search();});
    $('.sf-search-clear').addEventListener('click', () => {
        $('#sf-query').value = '';
        clearTimeout(searchTimer); searchController?.abort(); ++searchSequence;
        $('#sf-results').textContent = '';
        $('#sf-results').setAttribute('aria-busy','false');
        syncSearchControls();
        $('#sf-query').focus({preventScroll:true});
    });
    $('.sf-search-suggestion').addEventListener('click', () => {
        clearTimeout(searchTimer); search();
        $('#sf-query').focus({preventScroll:true});
    });
    const menu = $('#sf-menu .sf-menu-list');
    menu?.classList.add('enhanced');
    menu?.querySelectorAll('.sub-menu').forEach(sub => {
        const button = document.createElement('button'); button.className = 'sf-submenu-toggle'; button.textContent = '›'; button.setAttribute('aria-label', sub.parentElement.querySelector('a').textContent); button.setAttribute('aria-expanded','false');
        button.addEventListener('click', () => {menuPath.push(sub.parentElement);paintMenu();$('#sf-menu .sf-back').focus();});
        sub.before(button);
    });
    $('#sf-menu .sf-back').addEventListener('click', () => {const item = menuPath.pop();paintMenu();item?.querySelector('.sf-submenu-toggle')?.focus();});
    dialog.addEventListener('click',event => {
        const b = event.target.closest('button'); if (!b) return;
        if (b.matches('[data-qty],[data-remove]')) changeCart(b);
        if (b.matches('.sf-retry-cart')) refreshCart();
        if (b.matches('.sf-retry-search')) search();
    });
    // Listen to both legacy WooCommerce and Store API block add-to-cart events.
    document.body.addEventListener('wc-blocks_added_to_cart', () => { cartData = null; if(current === 'cart') refreshCart(); });
    if (window.jQuery) window.jQuery(document.body).on('added_to_cart removed_from_cart updated_wc_div', () => {cartData=null;if(current === 'cart')refreshCart();});
    window.addEventListener('pageshow',event => {if(event.persisted){cartData=null;if(current === 'cart')refreshCart();}});
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
