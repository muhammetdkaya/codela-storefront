/**
 * WooCommerce Store API cart controller.
 * Session nonce, in-flight requests and updates belong to one instance.
 */
import { escape, decode, safeURL, money } from 'codela-storefront/format';

export function createCartController({ $, config, t, getCurrent, getDialog, openCart }) {
    let cartNonce = '', cartData = null, cartPending = null, mutating = false, cartRevision = 0;
    let dirty = false, externalRevision = 0, readAbort = null, bound = false, refreshScheduled = false;
    let wooStore = null, wooSnapshot = '', wooRefresh = null, wooRefreshDirty = false;
    let renderedCart = '', mutationKey = '';
    const disabledBeforeMutation = new Map();
    // The popup and /cart/ use the SAME DOM nodes and the SAME Store API
    // controller. Reparent the one rendered cart instead of cloning it.
    let pageHost = null, pageNative = null, originalCartHomes = null;
    const pageActive = () => !!pageHost?.isConnected && pageHost.contains($('#sf-cart'));
    const cartVisible = () => getCurrent() === 'cart' || pageActive();

    function unmountPage() {
        if (!pageHost) return;
        // Reverse order restores the original nextSibling anchors in the dialog.
        for (const {node,parent,next} of [...(originalCartHomes || [])].reverse()) {
            if (parent?.isConnected) parent.insertBefore(node, next?.parentNode === parent ? next : null);
        }
        if (pageNative?.isConnected) {
            pageNative.hidden = false;
            pageNative.removeAttribute('aria-hidden');
            pageNative.classList.remove('sf-cart-page-native');
        }
        document.body.classList.remove('sf-cart-page-enhanced');
        document.documentElement.classList.remove('sf-cart-awaiting', 'sf-cart-fallback');
        pageHost.remove();
        pageHost = null; pageNative = null; originalCartHomes = null;
    }

    function syncPage() {
        // A Site Editor template can replace page-cart.html, so also recognize
        // the assigned native Woo post-content on the real Cart document.
        const native = document.body.classList?.contains('woocommerce-cart') &&
            (document.querySelector('.sf-cart-page .wp-block-post-content') ||
             document.querySelector('main .wp-block-post-content') ||
             document.querySelector('.wp-block-woocommerce-cart') ||
             document.querySelector('.woocommerce-cart-form')?.closest('.woocommerce'));
        if (!native) { unmountPage(); return; }
        // The Site Editor may nest post-content inside multiple Group blocks;
        // insert beside the actual native container, never a distant <main>.
        const parent = native.parentElement;
        if (!parent) return;
        if (pageHost?.isConnected && pageNative === native && pageHost.parentElement === parent) return;
        unmountPage();
        const dialog = getDialog();
        const items = dialog?.querySelector('#sf-cart');
        const footer = dialog?.querySelector('.sf-cart-bottom');
        const status = dialog?.querySelector('#sf-status');
        if (!items || !footer || !status) return;
        pageNative = native;
        originalCartHomes = [items, footer, status].map(node => ({
            node, parent:node.parentNode, next:node.nextSibling
        }));
        pageHost = document.createElement('section');
        pageHost.className = 'sf-cart-page-panel';
        pageHost.setAttribute('role', 'region');
        pageHost.setAttribute('aria-label', t('Your cart'));
        parent.insertBefore(pageHost, native);
        for (const {node} of originalCartHomes) pageHost.append(node);
        items.hidden = false;
        // Never discard the native Woo cart until the shared Store API view
        // has successfully painted. It stays usable if JS/REST fails.
        if (cartData) paintCart(cartData);
        if (bound) void refreshCart();
    }

    function focusPage() {
        if (!pageActive()) return false;
        pageHost.scrollIntoView({block:'start',behavior:'auto'});
        return true;
    }

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
            // A hidden native Woo Cart form still exists as the safe fallback
            // on /sepet/. Triggering wc_update_cart there POSTs stale quantity
            // fields immediately after our successful Store API remove/update,
            // potentially resurrecting deleted items. The live Woo store is
            // already invalidated above; never submit the hidden form.
            if ($('.woocommerce-cart-form') && !pageActive()) body.trigger('wc_update_cart');
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
        if (pageActive()) {
            pageHost.hidden = false;
            pageHost.removeAttribute('aria-hidden');
            pageHost.classList.add('is-ready');
            pageHost.setAttribute('aria-busy', 'false');
            pageNative.hidden = true;
            pageNative.setAttribute('aria-hidden', 'true');
            pageNative.classList.add('sf-cart-page-native');
            document.body.classList.add('sf-cart-page-enhanced');
            document.body.classList.remove('sf-cart-page-fallback');
            window.codelaSFCartBoot?.ready();
            document.documentElement.classList.remove('sf-cart-awaiting', 'sf-cart-fallback');
        }
    }
    function showPageFallback() {
        if (!pageActive() || pageHost.classList.contains('is-ready')) return;
        // The native Woo view is only a recovery surface, not a first paint.
        pageHost.hidden = true;
        pageHost.setAttribute('aria-hidden', 'true');
        pageNative.hidden = false;
        pageNative.removeAttribute('aria-hidden');
        document.body.classList.add('sf-cart-page-fallback');
        window.codelaSFCartBoot?.fallback();
        document.documentElement.classList.remove('sf-cart-awaiting');
    }
    function renderCartProgress(data) {
        const host = $('#sf-cart-progress');
        if (!host) return;
        // Theme Store API extension delegates the full cart bar to the
        // original plugin's render_cart(), with its own active settings and
        // WooCommerce zone/discount logic. The theme has no threshold logic.
        const markup = data.extensions?.['codela-storefront-shipping']?.html;
        if (!data.items?.length || typeof markup !== 'string' || !markup) {
            host.innerHTML = '';
            host.hidden = true;
            return;
        }
        host.innerHTML = markup;
        host.hidden = false;
        // Use ONLY the original Codela module's percentage and merchant copy:
        // the theme draws a compact 40px circular progress indicator around the
        // plugin's existing truck / check / warning icon. No threshold math.
        const bar = host.querySelector?.('.cdl-fsb');
        const text = bar?.querySelector('.cdl-fsb-text');
        const icon = text?.querySelector('.cdl-fsb-ico');
        const fill = bar?.querySelector('.cdl-fsb-fill');
        if (bar && text && icon) {
            const rawPercent = Number.parseFloat(fill?.style.width || '');
            const percent = Number.isFinite(rawPercent) ? Math.max(0, Math.min(100, rawPercent)) : 0;
            const ring = document.createElement('span');
            ring.className = 'sf-cart-shipping-ring';
            ring.setAttribute('aria-hidden', 'true');
            ring.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle class="sf-cart-shipping-track" cx="20" cy="20" r="17"/><circle class="sf-cart-shipping-arc" cx="20" cy="20" r="17"/></svg>';
            icon.before(ring);
            ring.append(icon);
            ring.style.setProperty('--sf-cart-shipping-offset', (106.814 * (1 - percent / 100)).toFixed(3));
            // The module already marks a completed goal or selected paid rate.
            bar.classList.toggle('sf-cart-shipping-complete',bar.classList.contains('is-done'));
        }
    }
    function renderCart(data) {
        // Keep the live badge immediate; closed-cart photos/rows do no work.
        if (!cartVisible()) return;
        const root = $('#sf-cart-items');
        const signature = cartSignature(data);
        const count = Number(data.items_count) || data.items.reduce((n, item) => n + (Number(item.quantity) || 0), 0);
        const countLabel = t('Items in cart: %d').replace('%d', String(count));
        const countElement = $('#sf-cart-count');
        if (countElement) {
            countElement.hidden = !data.items.length;
            countElement.textContent = countLabel;
        }
        renderCartProgress(data);
        // An unchanged session refresh preserves rows, decoded photos and focus.
        if (signature !== renderedCart) root.innerHTML = data.items.length ? data.items.map(item => {
            const limits = item.quantity_limits || {minimum:1,maximum:9999,multiple_of:1,editable:true};
            const subtotal = Number(item.totals.line_subtotal) + (config().taxInclusive ? Number(item.totals.line_subtotal_tax) : 0);
            const variants = (item.variation || []).map(v => `${escape(decode(v.attribute))}: ${escape(decode(v.value))}`).join(' · ');
            return `<article class="sf-cart-row" data-cart-key="${escape(item.key)}"><a href="${safeURL(item.permalink)}">${item.images[0] ? `<img class="sf-cart-photo" src="${safeURL(item.images[0].thumbnail || item.images[0].src)}" alt="${escape(decode(item.name))}" width="110" height="140">` : ''}</a><div class="sf-cart-detail"><h3><a href="${safeURL(item.permalink)}">${escape(decode(item.name))}</a></h3>${variants ? `<p class="sf-cart-variation">${variants}</p>` : ''}<p class="sf-cart-price">${escape(money(subtotal,item.totals))}</p><div class="sf-quantity"><div class="sf-stepper sf-ui-surface"><i class="sf-cart-busy" hidden aria-hidden="true"><span class="sf-ui-spinner"></span></i><button type="button" class="sf-ui-pressable" data-key="${escape(item.key)}" data-qty="${item.quantity - limits.multiple_of}" aria-label="${escape(t('Decrease quantity'))}" ${!limits.editable || item.quantity - limits.multiple_of < limits.minimum ? 'disabled':''}>−</button><span class="sf-cart-quantity-current" aria-label="${escape(t('Quantity'))}">${item.quantity}</span><button type="button" class="sf-ui-pressable" data-key="${escape(item.key)}" data-qty="${item.quantity + limits.multiple_of}" aria-label="${escape(t('Increase quantity'))}" ${!limits.editable || item.quantity + limits.multiple_of > limits.maximum ? 'disabled':''}>+</button></div><button type="button" class="sf-remove sf-ui-icon-button sf-ui-icon-button--clear" data-remove="${escape(item.key)}" aria-label="${escape(t('Remove'))}"><span class="sf-remove-icon" aria-hidden="true"></span></button></div></div></article>`;
        }).join('') : `<div class="sf-empty sf-cart-empty"><span class="sf-cart-empty-mark" aria-hidden="true"></span><h3>${escape(t('Your cart is empty.'))}</h3><p>${escape(t('Discover products and add your favorites here.'))}</p></div>`;
        renderedCart = signature;
        updateCartBusy();
        $('.sf-cart-bottom').hidden = !cartVisible() || !data.items.length;
        const subtotal = Number(data.totals.total_items) + (config().taxInclusive ? Number(data.totals.total_items_tax) : 0);
        $('#sf-subtotal').textContent = money(subtotal,data.totals);
        if (cartVisible()) $('#sf-status').textContent = (data.errors || []).map(e => decode(e.message)).join(' ');
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
        // While the API is loading the assigned native Woo cart remains the
        // visible, accessible fallback rather than flashing duplicate rows.
        if (cartData || !cartVisible() || pageActive() && !pageHost.classList.contains('is-ready')) return;
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
                if (!cartData && pageActive()) showPageFallback();
                if (!cartData && !pageActive()) {
                    $('#sf-cart-items').innerHTML = `<p>${escape(t('Something went wrong. Please try again.'))}</p><button class="sf-retry-cart sf-ui-pressable">${escape(t('Retry'))}</button><p><a href="${safeURL(config().cart)}">${escape(t('Your cart'))}</a></p>`;
                    $('.sf-cart-bottom').hidden = true;
                } else if (cartVisible() && !pageActive()) {
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
            paintCart(data); if (cartVisible()) $('#sf-status').textContent = t('Cart updated.');
            notifyWooConsumers();
        } catch(error) {
            if (error.cart) paintCart(error.cart);
            else { try { paintCart(await requestCart('', null, {acceptNonce:() => mutating})); } catch { if (cartData) paintCart(cartData); } }
            if (cartVisible()) $('#sf-status').textContent = error.message;
        } finally {
            mutating = false; mutationKey = ''; updateCartBusy();
            if (externalRevision !== externalAtStart || dirty) { dirty = true; scheduleRefresh(); }
            if (cartVisible() && (getDialog()?.open || pageActive())) {
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

    const feedbackOriginal = new WeakMap();
    const feedbackTimers = new WeakMap();
    function feedback(button, phase) {
        if (!button) return;
        // A quantity/variation change must cancel the delayed confirmation.
        const pending = feedbackTimers.get(button);
        if (pending) { clearTimeout(pending); feedbackTimers.delete(button); }
        if (!feedbackOriginal.has(button)) feedbackOriginal.set(button, {
            html:button.innerHTML, label:button.getAttribute('aria-label')
        });
        const original = feedbackOriginal.get(button);
        button.classList.add('sf-cart-feedback');
        button.dataset.sfCartState = phase;
        button.setAttribute('aria-busy', String(phase === 'loading'));
        const label = phase === 'loading' ? t('Adding…')
            : phase === 'confirmed' ? t('Added to cart')
            : phase === 'success' ? t('View cart') : null;
        // Icon cards keep their geometry; their accessible label changes too.
        if (button.classList.contains('sf-ui-icon-button')) {
            button.querySelector('.screen-reader-text')?.replaceChildren(document.createTextNode(label || original.label || t('Add to cart')));
        } else button.innerHTML = label ? escape(label) : original.html;
        if (label) button.setAttribute('aria-label', label);
        else if (original.label) button.setAttribute('aria-label', original.label);
        else button.removeAttribute('aria-label');
    }
    function purchaseStatus(form, message) {
        let status = form.querySelector('.sf-purchase-status');
        if (!status) {
            status = document.createElement('p'); status.className = 'sf-purchase-status';
            status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
            (form.querySelector('.sf-product-purchase') || form).appendChild(status);
        }
        status.classList.toggle('screen-reader-text', message === t('Item added to cart.'));
        status.textContent = message;
        status.hidden = !message;
    }
    async function submitProduct(form, button) {
        if (mutating) return;
        // Preserve ALL Woo/plugin fields and native validation. The existing
        // server form handler remains the only writer for product additions.
        const payload = new FormData(form);
        if (button.name) payload.set(button.name, button.value);
        payload.set('codela_sf_cart_async', '1');
        mutating = true; cartRevision++; readAbort?.abort(); dirty = false;
        const externalAtStart = externalRevision;
        feedback(button, 'loading'); purchaseStatus(form, ''); updateCartBusy();
        const controls = [...form.querySelectorAll('input,select,button,textarea')].map(node => [node,node.disabled]);
        controls.forEach(([node]) => { node.disabled = true; });
        try {
            const response = await fetch(form.action || location.href, {
                method:'POST', body:payload, credentials:'same-origin', cache:'no-store'
            });
            const body = await response.text();
            let result = null;
            try { result = JSON.parse(body); } catch (_) { /* Cached older theme fallback below. */ }
            let confirmed = false, errorMessage = '';
            if (result?.codela_cart_result === true) {
                confirmed = result.added === true;
                errorMessage = result.message || '';
            } else {
                const html = new DOMParser().parseFromString(body, 'text/html');
                const errors = html.querySelector('.woocommerce-error,[role="alert"].wc-block-components-notice-banner');
                confirmed = response.headers?.get?.('X-Codela-Sf-Cart-Added') === '1'
                    || Boolean(html.querySelector('[data-sf-cart-added]'));
                errorMessage = errors?.textContent.trim() || '';
            }
            if (!response.ok || !confirmed) {
                throw new Error(errorMessage || t('Could not confirm the addition. Check your cart before trying again.'));
            }
            if (window.jQuery) {
                // The native form has already added the item. Passing this
                // product button to Woo's catalog AJAX listener makes Woo
                // append an extra .added_to_cart.wc-forward link ("Sepetim")
                // beside our single stateful purchase button. Signal cart
                // consumers without a catalog button; do not issue a second POST.
                try { window.jQuery(document.body).trigger('added_to_cart', [{}, '', null]); } catch (_) { /* A consumer must not retry a successful write. */ }
            }
            // A short, visible success confirmation precedes the permanent
            // View cart action. Neither state can POST the same item twice.
            feedback(button, 'confirmed');
            feedbackTimers.set(button, setTimeout(() => {
                if (button.isConnected && button.dataset.sfCartState === 'confirmed') feedback(button, 'success');
            }, 1350));
            purchaseStatus(form, t('Item added to cart.'));
            // Never repeat the POST if the secondary session read fails.
            dirty = true;
            notifyWooConsumers();
            document.body.dispatchEvent(new CustomEvent('wc-blocks_added_to_cart', {bubbles:true}));
        } catch (error) {
            feedback(button, 'idle');
            purchaseStatus(form, error.message || t('Something went wrong. Please try again.'));
            // Keep the compact purchase sheet closed on network/stock errors.
            // The status belongs to the visible purchase surface above the CTA;
            // only actual missing variations/native validation open details.
        } finally {
            controls.forEach(([node, disabled]) => { node.disabled = disabled; });
            mutating = false; updateCartBusy();
            if (externalRevision !== externalAtStart || dirty) { dirty = true; scheduleRefresh(); }
        }
    }
    function bindPurchaseFeedback() {
        document.addEventListener('click', event => {
            const button = event.target.closest('.single_add_to_cart_button,.ajax_add_to_cart');
            if (!button) return;
            if (button.dataset.sfCartState === 'loading') { event.preventDefault(); event.stopImmediatePropagation(); return; }
            if (!['confirmed', 'success'].includes(button.dataset.sfCartState)) return;
            event.preventDefault(); event.stopImmediatePropagation();
            if (openCart) openCart(event); else location.assign(config().cart);
        }, true);
        document.addEventListener('submit', event => {
            const form = event.target;
            if (!form.matches('form.cart') || form.classList.contains('grouped_form')) return;
            const button = event.submitter || form.querySelector('.single_add_to_cart_button');
            if (!button || button.disabled || button.classList.contains('disabled') || new URL(form.action || location.href).origin !== location.origin) return;
            // External/extension-only actions without a Woo product ID stay native.
            if (!form.querySelector('[name="add-to-cart"]')) return;
            event.preventDefault();
            if (['confirmed', 'success'].includes(button.dataset.sfCartState)) {
                if (openCart) openCart(event); else location.assign(config().cart);
                return;
            }
            if (!mutating) void submitProduct(form, button);
        });
        document.addEventListener('change', event => {
            const form = event.target.closest('form.cart');
            if (!form || mutating) return;
            const button = form.querySelector('.single_add_to_cart_button');
            if (button && feedbackOriginal.has(button)) { feedback(button, 'idle'); purchaseStatus(form, ''); }
        });
        if (window.jQuery) {
            const body = window.jQuery(document.body);
            body.on('adding_to_cart', (event, button) => feedback(button?.[0], 'loading'));
            body.on('added_to_cart', (event, fragments, hash, button) => feedback(button?.[0], 'success'));
            // Woo owns catalog AJAX errors/navigation. Remove pending feedback
            // when its request fails, without claiming the item was added.
            window.jQuery(document).ajaxError((event, xhr, settings) => {
                if (!String(settings?.url).includes('wc-ajax=add_to_cart')) return;
                document.querySelectorAll('.ajax_add_to_cart[data-sf-cart-state="loading"]').forEach(button => {
                    button.classList.remove('loading'); feedback(button, 'idle');
                    button.setAttribute('aria-label', t('Something went wrong. Please try again.'));
                });
            });
        }
    }

    function bind() {
        if (bound) return;
        bound = true;
        // The ONE cart element is reparented between popup and /sepet/.
        // Handle controls on that persistent element in the capture phase:
        // external Woo handlers and delegated document listeners can no longer
        // swallow clicks on the nested trash glyph or trigger duplicate writes.
        $('#sf-cart')?.addEventListener('click', event => {
            const button = event.target.closest?.('button[data-remove],button[data-qty],button.sf-retry-cart');
            if (!button || !event.currentTarget.contains(button)) return;
            event.preventDefault();
            event.stopPropagation();
            if (button.disabled || button.closest('[inert]')) return;
            if (button.matches('.sf-retry-cart')) void refreshCart();
            else void changeCart(button);
        }, true);
        bindPurchaseFeedback();
        document.body.addEventListener('wc-blocks_added_to_cart', invalidate);
        document.body.addEventListener('wc-blocks_removed_from_cart', invalidate);
        if (window.jQuery) {
            window.jQuery(document.body).on(
                'added_to_cart removed_from_cart updated_wc_div updated_checkout', invalidate
            );
        }
        bindWooStore();
        syncPage();
        document.addEventListener('codela:before-route', unmountPage);
        window.addEventListener('codela:route-committed', syncPage);
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
        syncPage,
        unmountPage,
        isPageActive: pageActive,
        focusPage,
    };
}

