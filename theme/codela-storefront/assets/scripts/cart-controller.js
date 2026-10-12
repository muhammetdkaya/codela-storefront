/**
 * WooCommerce Store API cart controller.
 * Session nonce, in-flight requests and updates belong to one instance.
 */
import { escape, decode, safeURL, money } from './format.js';

export function createCartController({ $, config, t, getCurrent, getDialog }) {
    let cartNonce = '', cartData = null, cartPending = null, mutating = false, cartRevision = 0;
    let dirty = false, externalRevision = 0, readAbort = null, bound = false, refreshScheduled = false;

    async function requestCart(path = '', payload = null, { signal, acceptNonce = true } = {}) {
        const response = await fetch(config().api + 'cart' + path, {
            method:payload ? 'POST':'GET', credentials:'same-origin', cache:'no-store', signal,
            headers:payload ? {'Content-Type':'application/json', 'Nonce':cartNonce} : {},
            body:payload ? JSON.stringify(payload) : undefined,
        });
        const nonce = response.headers.get('Nonce'); if (nonce && (typeof acceptNonce === 'function' ? acceptNonce() : acceptNonce)) cartNonce = nonce;
        const data = await response.json();
        if (!response.ok) { const error = new Error(decode(data.message || t('Something went wrong. Please try again.'))); error.code = data.code; error.cart = data.data?.cart; throw error; }
        return data;
    }
    function paintCart(data) {
        cartData = data;
        document.querySelectorAll('.sf-badge').forEach(badge => { badge.textContent = data.items_count || ''; });
        document.querySelectorAll('[data-panel="cart"]').forEach(link => {
            link.setAttribute('aria-label', `${t('Your cart')} (${data.items_count || 0})`);
        });
        const root = $('#sf-cart-items');
        root.innerHTML = data.items.length ? data.items.map(item => {
            const limits = item.quantity_limits || {minimum:1,maximum:9999,multiple_of:1,editable:true};
            const subtotal = Number(item.totals.line_subtotal) + (config().taxInclusive ? Number(item.totals.line_subtotal_tax) : 0);
            const variants = (item.variation || []).map(v => `${escape(decode(v.attribute))}: ${escape(decode(v.value))}`).join(' · ');
            return `<article class="sf-cart-row"><a href="${safeURL(item.permalink)}">${item.images[0] ? `<img class="sf-cart-photo" src="${safeURL(item.images[0].thumbnail || item.images[0].src)}" alt="${escape(decode(item.name))}" width="110" height="140">` : ''}</a><div class="sf-cart-detail"><h3><a href="${safeURL(item.permalink)}">${escape(decode(item.name))}</a></h3>${variants ? `<p class="sf-cart-variation">${variants}</p>` : ''}<p class="sf-cart-price">${escape(money(subtotal,item.totals))}</p><div class="sf-quantity"><div class="sf-stepper"><button class="sf-ui-pressable" data-key="${escape(item.key)}" data-qty="${item.quantity - limits.multiple_of}" aria-label="${escape(t('Decrease quantity'))}" ${!limits.editable || item.quantity - limits.multiple_of < limits.minimum ? 'disabled':''}>−</button><span aria-label="${escape(t('Quantity'))}">${item.quantity}</span><button class="sf-ui-pressable" data-key="${escape(item.key)}" data-qty="${item.quantity + limits.multiple_of}" aria-label="${escape(t('Increase quantity'))}" ${!limits.editable || item.quantity + limits.multiple_of > limits.maximum ? 'disabled':''}>+</button></div><button class="sf-remove sf-ui-pressable" data-remove="${escape(item.key)}">${escape(t('Remove'))}</button></div></div></article>`;
        }).join('') : `<div class="sf-empty"><h3>${escape(t('Your cart is empty.'))}</h3></div>`;
        $('.sf-cart-bottom').hidden = getCurrent() !== 'cart' || !data.items.length;
        const subtotal = Number(data.totals.total_items) + (config().taxInclusive ? Number(data.totals.total_items_tax) : 0);
        $('#sf-subtotal').textContent = money(subtotal,data.totals);
        if (getCurrent() === 'cart') $('#sf-status').textContent = (data.errors || []).map(e => decode(e.message)).join(' ');
    }
    function scheduleRefresh() {
        if (refreshScheduled || mutating) return;
        refreshScheduled = true;
        queueMicrotask(() => {
            refreshScheduled = false;
            if (!mutating && dirty) void refreshCart();
        });
    }
    async function refreshCart() {
        if (mutating) { dirty = true; return; }
        if (cartPending) return cartPending;
        if (!cartData) $('#sf-cart-items').textContent = t('Loading…');
        dirty = false;
        const generation = cartRevision;
        const abort = new AbortController();
        readAbort = abort;
        const pending = Promise.resolve().then(async () => {
            try {
                // A GET is never allowed to overwrite a newer write or invalidation.
                const data = await requestCart('', null, {
                    signal: abort.signal,
                    acceptNonce: false,
                });
                if (generation !== cartRevision || mutating || abort.signal.aborted) {
                    dirty = true;
                    return;
                }
                paintCart(data);
            } catch (error) {
                if (generation !== cartRevision || mutating || abort.signal.aborted) {
                    if (!mutating) dirty = true;
                    return;
                }
                if (!cartData) {
                    $('#sf-cart-items').innerHTML = `<p>${escape(t('Something went wrong. Please try again.'))}</p><button class="sf-retry-cart sf-ui-pressable">${escape(t('Retry'))}</button><p><a href="${safeURL(config().cart)}">${escape(t('Your cart'))}</a></p>`;
                    $('.sf-cart-bottom').hidden = true;
                } else if (getCurrent() === 'cart') {
                    $('#sf-status').textContent = t('Something went wrong. Please try again.');
                }
            } finally {
                if (readAbort === abort) readAbort = null;
                if (cartPending === pending) cartPending = null;
                if (dirty && !mutating) scheduleRefresh();
            }
        });
        cartPending = pending;
        return pending;
    }
    async function changeCart(button) {
        if (mutating) return;
        mutating = true;
        cartRevision++;
        readAbort?.abort();
        dirty = false;
        const externalAtStart = externalRevision;
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
            paintCart(data); if (getCurrent() === 'cart') $('#sf-status').textContent = t('Cart updated.');
        } catch(error) {
            if (error.cart) paintCart(error.cart);
            else { try { paintCart(await requestCart()); } catch { if (cartData) paintCart(cartData); } }
            if (getCurrent() === 'cart') $('#sf-status').textContent = error.message;
        } finally {
            mutating = false; $('#sf-cart').setAttribute('aria-busy','false'); $('.sf-cart-bottom').inert = false;
            if (externalRevision !== externalAtStart || dirty) { dirty = true; scheduleRefresh(); }
            if (getCurrent() === 'cart' && getDialog()?.open) {
                const candidate = [...$('#sf-cart').querySelectorAll('[data-key]')].find(b => b.dataset.key === key && b.dataset.qty === focusQuantity && !b.disabled) || $('#sf-cart button:not(:disabled)') || $('.sf-close');
                candidate.focus({preventScroll:true});
            }
        }
    }

    function invalidate() {
        cartRevision++;
        externalRevision++;
        dirty = true;
        if (mutating) return;
        readAbort?.abort();
        if (!cartPending) scheduleRefresh();
    }

    function bind() {
        if (bound) return;
        bound = true;
        document.body.addEventListener('wc-blocks_added_to_cart', invalidate);
        if (window.jQuery) {
            window.jQuery(document.body).on(
                'added_to_cart removed_from_cart updated_wc_div', invalidate
            );
        }
        window.addEventListener('pageshow',event => {
            if (event.persisted) invalidate();
        });
        // Fetch session-specific cart count on every Storefront page, not from cached HTML.
        refreshCart();
    }

    return {
        bind,
        getData: () => cartData,
        refresh: refreshCart,
        change: changeCart,
        invalidate,
    };
}
