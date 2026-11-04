/**
 * WooCommerce Store API cart controller.
 * Session nonce, in-flight requests and updates belong to one instance.
 */
import { escape, decode, safeURL, money } from 'codela-storefront/format';

export function createCartController({ $, config, t, getCurrent, getDialog }) {
    let cartNonce = '', cartData = null, cartPending = null, mutating = false, cartRevision = 0;
    let dirty = false, externalRevision = 0, readAbort = null, bound = false, refreshScheduled = false;
    let wooStore = null, wooSnapshot = '', wooRefresh = null, wooRefreshDirty = false;
    let renderedCart = '', mutationKey = '';
    const disabledBeforeMutation = new Map();

    // Observe only cart contents, not unrelated wp.data updates or customer fields.
    function cartSignature(data) {
        if (!data) return '';
        return JSON.stringify([
            data.items || [], data.totals || {}, data.coupons || [],
            data.itemsCount ?? data.items_count ?? 0,
        ]);
    }
    function bindWooStore() {
        if (wooStore) return;
        const registry = window.wp?.data;
        // Woo 9 registers the public store name without exporting its descriptor.
        const store = window.wc?.wcBlocksData?.cartStore || 'wc/store/cart';
        if (!store || !registry?.select || !registry?.subscribe || !registry?.dispatch || !registry?.resolveSelect) return;
        const selectors = registry.select(store);
        if (!selectors?.getCartData) return;
        const actions = registry.dispatch(store);
        if (!actions?.invalidateResolution) return;
        wooStore = { registry, store };
        wooSnapshot = cartSignature(selectors.getCartData());
        registry.subscribe(() => {
            const next = cartSignature(selectors.getCartData());
            if (next === wooSnapshot) return;
            wooSnapshot = next;
            if (next !== cartSignature(cartData)) invalidate();
        }, store);
    }
    function refreshWooStore() {
        // Use Woo's resolver/normalization pipeline; never assign REST JSON to its store.
        if (!wooStore) return;
        if (wooRefresh) { wooRefreshDirty = true; return; }
        {
            wooRefreshDirty = false;
            const { registry, store } = wooStore;
            wooRefresh = Promise.resolve().then(async () => {
                await registry.dispatch(store).invalidateResolution('getCartData', []);
                await registry.resolveSelect(store).getCartData();
            }).catch(() => {
                // A failed secondary consumer refresh must not retry a successful POST.
            }).finally(() => {
                wooRefresh = null;
                if (wooRefreshDirty) refreshWooStore();
            });
        }
    }
    function notifyWooConsumers() {
        refreshWooStore();
        // Keep third-party event handler errors outside the mutation/recovery path.
        Promise.resolve().then(() => {
            if (!window.jQuery) return;
            const body = window.jQuery(document.body);
            if ($('.woocommerce-cart-form')) body.trigger('wc_update_cart');
            if ($('form.checkout')) body.trigger('update_checkout');
        }).catch(() => {});
    }

    async function requestCart(path = '', payload = null, { signal, acceptNonce = true } = {}) {
        const response = await fetch(config().api + 'cart' + path, {
            method:payload ? 'POST':'GET', credentials:'same-origin', cache:'no-store', signal,
            headers:payload ? {'Content-Type':'application/json', 'Nonce':cartNonce} : {},
            body:payload ? JSON.stringify(payload) : undefined,
        });
        const nonce = response.headers.get('Nonce');
        const data = await response.json();
        if (nonce && (typeof acceptNonce === 'function' ? acceptNonce() : acceptNonce)) cartNonce = nonce;
        if (!response.ok) { const error = new Error(decode(data.message || t('Something went wrong. Please try again.'))); error.code = data.code; error.cart = data.data?.cart; throw error; }
        return data;
    }
    function paintCart(data) {
        cartData = data;
        document.querySelectorAll('.sf-badge').forEach(badge => { badge.textContent = data.items_count || ''; });
        document.querySelectorAll('[data-panel="cart"]').forEach(link => {
            link.setAttribute('aria-label', `${t('Your cart')} (${data.items_count || 0})`);
        });
        renderCart(data);
    }
    function renderCart(data) {
        // Keep the live badge immediate; closed-cart photos/rows do no work.
        if (getCurrent() !== 'cart') return;
        const root = $('#sf-cart-items');
        const signature = cartSignature(data);
        const count = Number(data.items_count) || data.items.reduce((n, item) => n + (Number(item.quantity) || 0), 0);
        const countLabel = t('Items in cart: %d').replace('%d', String(count));
        // An unchanged session refresh preserves rows, decoded photos and focus.
        if (signature !== renderedCart) root.innerHTML = data.items.length ? '<p class="sf-cart-count">' + escape(countLabel) + '</p>' + data.items.map(item => {
            const limits = item.quantity_limits || {minimum:1,maximum:9999,multiple_of:1,editable:true};
            const subtotal = Number(item.totals.line_subtotal) + (config().taxInclusive ? Number(item.totals.line_subtotal_tax) : 0);
            const variants = (item.variation || []).map(v => `${escape(decode(v.attribute))}: ${escape(decode(v.value))}`).join(' · ');
            return `<article class="sf-cart-row" data-cart-key="${escape(item.key)}"><a href="${safeURL(item.permalink)}">${item.images[0] ? `<img class="sf-cart-photo" src="${safeURL(item.images[0].thumbnail || item.images[0].src)}" alt="${escape(decode(item.name))}" width="110" height="140">` : ''}</a><div class="sf-cart-detail"><h3><a href="${safeURL(item.permalink)}">${escape(decode(item.name))}</a></h3>${variants ? `<p class="sf-cart-variation">${variants}</p>` : ''}<p class="sf-cart-price">${escape(money(subtotal,item.totals))}</p><div class="sf-quantity"><div class="sf-stepper sf-ui-surface"><i class="sf-cart-busy" hidden aria-hidden="true"><span class="sf-ui-spinner"></span></i><button class="sf-ui-pressable" data-key="${escape(item.key)}" data-qty="${item.quantity - limits.multiple_of}" aria-label="${escape(t('Decrease quantity'))}" ${!limits.editable || item.quantity - limits.multiple_of < limits.minimum ? 'disabled':''}>−</button><span class="sf-cart-quantity-current" aria-label="${escape(t('Quantity'))}">${item.quantity}</span><button class="sf-ui-pressable" data-key="${escape(item.key)}" data-qty="${item.quantity + limits.multiple_of}" aria-label="${escape(t('Increase quantity'))}" ${!limits.editable || item.quantity + limits.multiple_of > limits.maximum ? 'disabled':''}>+</button></div><button type="button" class="sf-remove sf-ui-icon-button sf-ui-icon-button--clear" data-remove="${escape(item.key)}" aria-label="${escape(t('Remove'))}"><span class="sf-remove-icon" aria-hidden="true"></span></button></div></div></article>`;
        }).join('') : `<div class="sf-empty sf-cart-empty"><span class="sf-cart-empty-mark" aria-hidden="true"></span><h3>${escape(t('Your cart is empty.'))}</h3><p>${escape(t('Discover products and add your favorites here.'))}</p></div>`;
        renderedCart = signature;
        updateCartBusy();
        $('.sf-cart-bottom').hidden = getCurrent() !== 'cart' || !data.items.length;
        const subtotal = Number(data.totals.total_items) + (config().taxInclusive ? Number(data.totals.total_items_tax) : 0);
        $('#sf-subtotal').textContent = money(subtotal,data.totals);
        if (getCurrent() === 'cart') $('#sf-status').textContent = (data.errors || []).map(e => decode(e.message)).join(' ');
    }
    function updateCartBusy() {
        const root = $('#sf-cart');
        root.setAttribute('aria-busy', String(mutating || !cartData && !!cartPending));
        if (!mutating) {
            disabledBeforeMutation.forEach((disabled, button) => { button.disabled = disabled; });
            disabledBeforeMutation.clear();
        } else root.querySelectorAll('button').forEach(button => {
            if (!disabledBeforeMutation.has(button)) disabledBeforeMutation.set(button, button.disabled);
            button.disabled = true;
        });
        root.querySelectorAll('[data-cart-key]').forEach(row => {
            const busy = mutating && row.dataset.cartKey === mutationKey;
            row.setAttribute('aria-busy', String(busy));
            row.querySelector('.sf-cart-busy').hidden = !busy;
        });
        $('.sf-cart-bottom').inert = mutating;
    }
    function showCartLoading() {
        if (cartData || getCurrent() !== 'cart') return;
        const row = '<div class="sf-cart-skeleton-row"><i></i><span><b></b><b></b><b></b></span></div>';
        $('#sf-cart-items').innerHTML = '<div class="sf-cart-skeleton" aria-hidden="true">' + row.repeat(2) + '</div>' +
            '<p class="screen-reader-text">' + escape(t('Loading…')) + '</p>';
        $('#sf-cart').setAttribute('aria-busy', 'true');
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
        if (cartData) renderCart(cartData);
        if (mutating) { dirty = true; return; }
        showCartLoading();
        if (cartPending) return cartPending;
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
                if (cartPending === pending) { cartPending = null; updateCartBusy(); }
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
        mutationKey = key;
        const isRemove = !!button.dataset.remove;
        const payload = isRemove ? {key} : {key, quantity:Number(button.dataset.qty)};
        const focusQuantity = button.dataset.qty;
        updateCartBusy();
        try {
            // A nonce is read fresh from the session GET, never embedded in cacheable HTML.
            if (!cartNonce) await requestCart('', null, {acceptNonce:() => mutating});
            let data;
            try { data = await requestCart(isRemove ? '/remove-item' : '/update-item',payload); }
            catch(error) {
                if (!['woocommerce_rest_invalid_nonce','woocommerce_rest_missing_nonce'].includes(error.code)) throw error;
                await requestCart('', null, {acceptNonce:() => mutating}); data = await requestCart(isRemove ? '/remove-item' : '/update-item',payload);
            }
            paintCart(data); if (getCurrent() === 'cart') $('#sf-status').textContent = t('Cart updated.');
            notifyWooConsumers();
        } catch(error) {
            if (error.cart) paintCart(error.cart);
            else { try { paintCart(await requestCart('', null, {acceptNonce:() => mutating})); } catch { if (cartData) paintCart(cartData); } }
            if (getCurrent() === 'cart') $('#sf-status').textContent = error.message;
        } finally {
            mutating = false; mutationKey = ''; updateCartBusy();
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
        document.body.addEventListener('wc-blocks_removed_from_cart', invalidate);
        if (window.jQuery) {
            window.jQuery(document.body).on(
                'added_to_cart removed_from_cart updated_wc_div updated_checkout', invalidate
            );
        }
        bindWooStore();
        // Classic footer scripts normally precede module init. One load retry
        // supports deferred Woo registration without polling or loading Blocks on Home.
        window.addEventListener('load', bindWooStore, {once:true});
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

