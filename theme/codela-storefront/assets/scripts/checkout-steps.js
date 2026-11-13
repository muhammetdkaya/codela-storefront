/* Codela native classic checkout stepper.
 * Presentation only: WooCommerce owns the one form, all input names,
 * validation, coupon requests, shipping fragments and the REAL #place_order.
 * No form cloning, synthetic order submission, or checkout API replacement.
 */
(function () {
    'use strict';

    function start() {
        const scope = document.querySelector('.sf-checkout-page');
        const form = scope?.querySelector('form.checkout.woocommerce-checkout');
        const customer = form?.querySelector('#customer_details');
        const billing = customer?.querySelector('.col-1');
        const delivery = customer?.querySelector('.col-2');
        const review = form?.querySelector('#order_review');
        const nativeSubmit = review?.querySelector('#place_order');
        if (!scope || !form || !billing || !delivery || !review || !nativeSubmit ||
            scope.querySelector('.sf-checkout-stepper')) {
            // Block checkout / unsupported fields keep Woo's native fallback.
            window.codelaSFCheckoutBoot?.fallback();
            return;
        }

        const labels = window.codelaSFCheckoutSteps || {};
        const read = (key, fallback) => typeof labels[key] === 'string' && labels[key] ? labels[key] : fallback;
        const stepNames = [read('details', 'Details'), read('delivery', 'Delivery'), read('payment', 'Payment')];
        const nextNames = [read('continue', 'Continue'), read('toPayment', 'Continue to payment')];
        const stepper = document.createElement('section');
        stepper.className = 'sf-checkout-stepper';
        stepper.setAttribute('aria-label', read('steps', 'Checkout progress'));
        stepper.innerHTML =
            '<div class="sf-checkout-stepper-line">' +
                '<div class="sf-checkout-stepper-caption">' +
                    '<span class="sf-checkout-step-index"></span>' +
                    '<strong class="sf-checkout-step-title"></strong>' +
                '</div>' +
                '<button type="button" class="sf-checkout-step-back" hidden></button>' +
            '</div>' +
            '<div class="sf-checkout-step-track" aria-hidden="true">' +
                '<span></span><span></span><span></span>' +
            '</div>' +
            '<p class="sf-checkout-step-error" role="alert" hidden></p>';

        const footer = document.createElement('div');
        footer.className = 'sf-checkout-fixed-footer';
        footer.setAttribute('role', 'group');
        footer.setAttribute('aria-label', read('next', 'Checkout action'));
        footer.innerHTML =
            '<span class="sf-checkout-total">' +
                '<small class="sf-checkout-total-label"></small>' +
                '<strong class="sf-checkout-total-value" aria-live="polite">—</strong>' +
            '</span>' +
            '<button type="button" class="sf-checkout-next">' +
                '<span class="sf-checkout-next-label"></span>' +
                '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7"/></svg>' +
            '</button>';

        // Insert outside the native form: neither a new form nor a cloned field.
        const woo = form.closest('.woocommerce') || form.parentElement;
        woo.insertBefore(stepper, woo.firstChild);
        scope.appendChild(footer);

        const headerTitle = stepper.querySelector('.sf-checkout-step-title');
        const index = stepper.querySelector('.sf-checkout-step-index');
        const back = stepper.querySelector('.sf-checkout-step-back');
        const backIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        backIcon.setAttribute('viewBox', '0 0 24 24');
        backIcon.setAttribute('aria-hidden', 'true');
        const backPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        backPath.setAttribute('d', 'm14.5 6-6 6 6 6');
        backIcon.append(backPath);
        const backCopy = document.createElement('span');
        back.append(backIcon, backCopy);
        const error = stepper.querySelector('.sf-checkout-step-error');
        const progress = Array.from(stepper.querySelectorAll('.sf-checkout-step-track > span'));
        const next = footer.querySelector('.sf-checkout-next');
        const nextLabel = footer.querySelector('.sf-checkout-next-label');
        const totalLabel = footer.querySelector('.sf-checkout-total-label');
        const totalValue = footer.querySelector('.sf-checkout-total-value');
        let step = 1;

        // Keep Woo's ORIGINAL coupon form and AJAX application, but own the
        // disclosure click so an unhandled href="#" never jumps/reloads the page.
        function refineCoupon() {
            const toggle = woo.querySelector('.woocommerce-form-coupon-toggle');
            const link = toggle?.querySelector('.showcoupon');
            if (!link) return;
            const notice = link.closest('.woocommerce-info') || link.parentElement;
            if (!notice) return;
            if (!notice.classList.contains('sf-checkout-coupon-ready')) {
                // Woo's existing text nodes contain the repetitive prompt.
                // Keep links, notices, fields and coupon behavior unchanged.
                for (const child of Array.from(notice.childNodes)) {
                    if (child.nodeType === Node.TEXT_NODE) child.textContent = '';
                }
                notice.classList.add('sf-checkout-coupon-ready');
            }
            link.textContent = read('coupon', 'Add discount code');
            link.setAttribute('aria-label', read('coupon', 'Add discount code'));
            // A single, legible disclosure row is enough: the hint made a
            // two-line card before the customer had even opened the coupon.
            notice.querySelector('.sf-checkout-coupon-hint')?.remove();
            const coupon = woo.querySelector('form.checkout_coupon');
            // Group Woo's original toggle and ORIGINAL coupon form so theme
            // or Gutenberg block spacing cannot split them into two cards.
            // The form, input names and Woo AJAX handlers are not recreated.
            if (coupon && toggle && !form.contains(coupon) && !form.contains(toggle)) {
                let shell = toggle.closest('.sf-checkout-coupon-shell');
                if (!shell) {
                    shell = document.createElement('div');
                    shell.className = 'sf-checkout-coupon-shell';
                    toggle.parentNode.insertBefore(shell, toggle);
                    shell.append(toggle);
                }
                // Some Woo templates add notice wrappers between these nodes.
                // Re-parent the ORIGINAL coupon form; Woo's own AJAX and native
                // .showcoupon handler continue to target the same form element.
                if (coupon.parentElement !== shell) shell.append(coupon);
            }
            const field = coupon?.querySelector('input[name="coupon_code"]');
            if (field) {
                field.placeholder = read('couponField', 'Discount code');
                field.setAttribute('aria-label', read('couponField', 'Discount code'));
            }
            const apply = coupon?.querySelector('button[name="apply_coupon"],button[type="submit"],button.button');
            if (apply) {
                apply.textContent = read('couponApply', document.documentElement.lang.toLowerCase().startsWith('tr') ? 'Uygula' : 'Apply');
                // Keep button name, type and the original Woo AJAX handler.
            }
            // Observe the original form display; the disclosure itself is
            // handled locally without submitting any form or navigating.
            if (coupon && toggle && !coupon.dataset.sfCheckoutDisclosureObserved) {
                coupon.dataset.sfCheckoutDisclosureObserved = '1';
                const sync = () => {
                    // CSS collapses the form aggressively to avoid a ghost
                    // strip; read Woo's INLINE display state instead of the
                    // computed style so the form can reopen on its own.
                    const inline = coupon.style.display;
                    const visible = inline ? inline !== 'none' : getComputedStyle(coupon).display !== 'none';
                    toggle.classList.toggle('sf-checkout-coupon-open', visible);
                    toggle.closest('.sf-checkout-coupon-shell')?.classList.toggle('sf-checkout-coupon-open', visible);
                    link.setAttribute('aria-expanded', String(visible));
                };
                if (!coupon.id) coupon.id = 'sf-checkout-coupon-form';
                link.setAttribute('aria-controls', coupon.id);
                // Handle the click before Woo's delegated anchor listener to
                // prevent double toggles and the default "#" page jump.
                link.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    const wasOpen = coupon.style.display
                        ? coupon.style.display !== 'none'
                        : getComputedStyle(coupon).display !== 'none';
                    coupon.style.display = wasOpen ? 'none' : 'block';
                    sync();
                    if (!wasOpen) field?.focus({preventScroll:true});
                }, true);
                link.addEventListener('keydown', event => {
                    if (event.key === ' ') {
                        event.preventDefault();
                        link.click();
                    }
                });
                new MutationObserver(sync).observe(coupon, {attributes:true,attributeFilter:['style','class']});
                sync();
            }
        }

        // The free-shipping extension already supplies threshold, progress,
        // completion and warning states. Never duplicate that arithmetic.
        // Woo replaces .cdl-fsb-slot on updated_checkout, so redecorate it.
        function decorateShippingProgress() {
            const slot = review.querySelector('.cdl-fsb-slot');
            const bar = slot?.querySelector('.cdl-fsb');
            const text = bar?.querySelector('.cdl-fsb-text');
            const icon = text?.querySelector('.cdl-fsb-ico');
            if (!bar || !text || !icon) return;
            if (bar.classList.contains('is-done') && !bar.classList.contains('is-warn')) {
                const message = text.querySelector(':scope > span:last-child');
                if (message) message.textContent =
                    document.documentElement.lang.toLowerCase().startsWith('tr') ? 'Ücretsiz kargo' : 'Free shipping';
            }
            if (text.querySelector('.sf-checkout-shipping-ring')) return;
            const pct = Number.parseFloat(bar.querySelector('.cdl-fsb-fill')?.style.width || '0');
            const fraction = Number.isFinite(pct) ? Math.max(0, Math.min(1, pct / 100)) : 0;
            const ring = document.createElement('span');
            ring.className = 'sf-checkout-shipping-ring';
            ring.setAttribute('aria-hidden', 'true');
            ring.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle class="sf-checkout-shipping-track" cx="20" cy="20" r="17"/><circle class="sf-checkout-shipping-arc" cx="20" cy="20" r="17"/></svg>';
            ring.style.setProperty('--sf-checkout-shipping-offset', (106.814 * (1 - fraction)).toFixed(3));
            icon.before(ring);
            ring.append(icon);
        }

        // Note switch is a disclosure for Woo's ORIGINAL optional order_comments
        // textarea. When closed, keep the value in memory but exclude it from
        // Woo's submitted checkout form until the customer opts in again.
        function refineDeliveryNote() {
            const section = delivery.querySelector('.woocommerce-additional-fields');
            const textarea = section?.querySelector('textarea[name="order_comments"]');
            const fields = section?.querySelector('.woocommerce-additional-fields__field-wrapper');
            if (!section || !textarea || !fields || section.querySelector('.sf-checkout-note-row')) return;
            // Never collapse unrelated extension controls inserted into the additional-fields area.
            if (Array.from(fields.querySelectorAll('input,select,textarea')).some(node =>
                node !== textarea && node.type !== 'hidden')) return;
            const row = document.createElement('label');
            row.className = 'sf-checkout-note-row';
            row.innerHTML =
                '<span class="sf-checkout-note-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8.5h8M8 12.5h8M8 16.5h5"/></svg></span>' +
                '<span class="sf-checkout-note-copy"><strong></strong>' +
                '<small class="sf-checkout-note-status"></small></span>';
            row.querySelector('.sf-checkout-note-copy strong').textContent = read('orderNote', 'Sipariş notu');
            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.className = 'sf-checkout-note-switch';
            toggle.setAttribute('aria-label', read('orderNote', 'Sipariş notu'));
            toggle.setAttribute('aria-controls', 'sf-checkout-note-fields');
            row.append(toggle);
            fields.id = 'sf-checkout-note-fields';
            fields.classList.add('sf-checkout-note-fields');
            section.prepend(row);
            toggle.checked = Boolean(textarea.value.trim());
            const sync = () => {
                section.dataset.sfNoteOpen = toggle.checked ? 'true' : 'false';
                toggle.setAttribute('aria-expanded', String(toggle.checked));
                textarea.disabled = !toggle.checked;
                row.querySelector('.sf-checkout-note-status').textContent =
                    toggle.checked && textarea.value.trim()
                        ? read('noteAdded', 'Not eklendi')
                        : read('noteOptional', 'İsteğe bağlı');
            };
            toggle.addEventListener('change', sync);
            textarea.addEventListener('input', sync);
            sync();
        }

        // Customer details can render address summaries while the edit forms stay
        // hidden. Render the short notice AFTER #customer_details (not inside
        // the hidden billing fields), using the store's configured policy URL.
        // Keep Woo's own source text mounted for a no-JS/unsupported fallback.
        function refinePrivacyNotice() {
            const original = review.querySelector('.woocommerce-privacy-policy-text');
            const nativeLink = original?.querySelector('a[href]');
            const policyUrl = read('privacyUrl', '') || nativeLink?.getAttribute('href') || '';
            let brief = form.querySelector('.sf-checkout-privacy-brief');
            if (!brief) {
                brief = document.createElement('p');
                brief.className = 'sf-checkout-privacy-brief';
                brief.setAttribute('role', 'note');
                customer.insertAdjacentElement('afterend', brief);
            }
            brief.replaceChildren();
            const isTR = document.documentElement.lang.toLowerCase().startsWith('tr');
            const lead = document.createElement('span');
            lead.textContent = isTR
                ? 'Kişisel verilerinizin işlenmesi hakkında bilgi için '
                : 'For information about how we process your personal data, see ';
            brief.append(lead);
            if (policyUrl) {
                const anchor = document.createElement('a');
                anchor.href = policyUrl;
                anchor.textContent = isTR ? 'Gizlilik Politikası' : 'Privacy Policy';
                if (nativeLink?.hasAttribute('target')) anchor.setAttribute('target', nativeLink.getAttribute('target'));
                if (nativeLink?.hasAttribute('rel')) anchor.setAttribute('rel', nativeLink.getAttribute('rel'));
                brief.append(anchor);
            } else {
                // Do not invent a destination when WordPress has no privacy
                // page configured. The native payment explanation remains.
                const fallback = document.createElement('span');
                fallback.textContent = isTR
                    ? 'gizlilik bilgilendirmesini inceleyin.'
                    : 'the privacy information.';
                brief.append(fallback);
            }
            if (original) original.dataset.sfCheckoutPrivacyMoved = policyUrl ? '1' : '0';
        }

        // The selected rate is editable only in Delivery. Keep its original
        // Woo fields mounted and enabled so checkout totals and submission
        // remain Woo-owned, while Payment shows a compact read-only receipt.
        function syncPaymentShipping() {
            const rows = review.querySelectorAll('.woocommerce-checkout-review-order-table tfoot tr.shipping, .woocommerce-checkout-review-order-table tfoot tr.woocommerce-shipping-totals');
            rows.forEach(row => {
                const cell = row.querySelector('td');
                const rates = cell?.querySelector('#shipping_method, .woocommerce-shipping-methods');
                const selected = rates?.querySelector('input[type="radio"]:checked, option:checked, input[type="hidden"]');
                const label = selected?.id ? rates?.querySelector('label[for="' + CSS.escape(selected.id) + '"]') : null;
                const fallback = selected?.closest('li')?.querySelector('label') || rates?.querySelector('li:has(input:checked) label, li:has(input[type="hidden"]) label');
                const text = (label?.textContent || fallback?.textContent || (selected?.tagName === 'OPTION' ? selected.textContent : '') || '').replace(/\s+/g, ' ').trim();
                let summary = cell?.querySelector('.sf-checkout-selected-shipping');
                if (!rates || !text) {
                    summary?.remove();
                    row.classList.remove('sf-checkout-shipping-summary-ready');
                    return;
                }
                if (!summary) {
                    summary = document.createElement('span');
                    summary.className = 'sf-checkout-selected-shipping';
                    summary.setAttribute('aria-label', read('shippingSelected', document.documentElement.lang.toLowerCase().startsWith('tr') ? 'Seçilen kargo' : 'Selected shipping'));
                    cell.append(summary);
                }
                summary.textContent = text;
                row.classList.add('sf-checkout-shipping-summary-ready');
            });
        }

        function syncTotal() {
            const table = form.querySelector('#order_review .woocommerce-checkout-review-order-table');
            const amount = table?.querySelector('.order-total .woocommerce-Price-amount, .order-total .amount, .order-total td:last-child');
            if (amount) totalValue.textContent = (amount.textContent || '').replace(/\s+/g, ' ').trim() || '—';
        }

        // Only classify recognized Woo/Codela content hooks. Unknown checkout
        // extension nodes MUST remain visible and mounted in every phase:
        // payment SDKs and anti-fraud integrations sometimes add direct siblings.
        function categorizeExtras() {
            for (const node of form.children) {
                if (node.matches('.woocommerce-billing-fields')) node.dataset.sfCheckoutExtraStep = '1';
                else if (node.matches('.woocommerce-shipping-fields,.woocommerce-additional-fields,.codela-gift-wrap,#codela-gift-wrap-wrapper'))
                    node.dataset.sfCheckoutExtraStep = '2';
            }
        }

        function showStep(value, scroll = true) {
            step = Math.max(1, Math.min(3, value));
            document.body.classList.add('sf-checkout-steps-active');
            for (const n of [1, 2, 3]) document.body.classList.toggle('sf-checkout-step-' + n, n === step);
            headerTitle.textContent = stepNames[step - 1];
            index.textContent = read('step', 'Step') + ' ' + step + ' / 3';
            back.hidden = step === 1;
            backCopy.textContent = read('backCompact',
                document.documentElement.lang.toLowerCase().startsWith('tr') ? 'Önceki' : 'Previous');
            back.setAttribute('aria-label', read('back', 'Previous step'));
            next.hidden = step === 3;
            if (step !== 3) nextLabel.textContent = nextNames[step - 1];
            totalLabel.textContent = step === 3 ? read('total', 'Total') : read('estimated', 'Estimated total');
            progress.forEach((node, i) => node.classList.toggle('is-complete', i < step));
            error.hidden = true;
            error.textContent = '';
            syncTotal();
            refineCoupon();
            refineDeliveryNote();
            refinePrivacyNotice();
            decorateShippingProgress();
            syncPaymentShipping();
            if (scroll) {
                const header = document.querySelector('.sf-shell .sf-header');
                const headerHeight = header ? header.getBoundingClientRect().height : 68;
                const top = stepper.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
                window.scrollTo({top: Math.max(0, top), behavior: 'instant'});
            }
            // Reactivate native gateway/shipping initialization on entering
            // payment; the live Woo totals are always read AFTER AJAX fragments.
            if (step === 3 && window.jQuery) window.jQuery(document.body).trigger('update_checkout');
        }

        function visibleControl(control) {
            if (control.disabled || control.type === 'hidden' || control.type === 'submit' ||
                control.type === 'button' || control.type === 'reset') return false;
            const row = control.closest('.form-row');
            // Conditional invoice fields, collapsed saved addresses and the
            // native 'ship to a different address' wrapper remain authoritative.
            const target = row || control;
            const controlVisible = !!control.getClientRects().length ||
                control.classList.contains('select2-hidden-accessible');
            return controlVisible && !!target.getClientRects().length &&
                getComputedStyle(target).visibility !== 'hidden';
        }

        function validateContainer(root) {
            if (!root) return true;
            const controls = root.querySelectorAll('input,select,textarea');
            for (const control of controls) {
                if (!visibleControl(control)) continue;
                const row = control.closest('.form-row');
                const required = control.required || control.getAttribute('aria-required') === 'true' ||
                    (row?.classList.contains('validate-required') && control.type !== 'checkbox');
                if (!required && !(control.value && !control.checkValidity())) continue;
                const missing = control.type === 'checkbox' ? !control.checked :
                    control.type === 'radio' ? !form.querySelector('input[name="' + CSS.escape(control.name) + '"]:checked') :
                    !String(control.value || '').trim();
                if (missing || !control.checkValidity()) {
                    error.textContent = read('required', 'Please check the required fields before continuing.');
                    error.hidden = false;
                    row?.classList.add('woocommerce-invalid');
                    control.focus({preventScroll: true});
                    control.scrollIntoView({block:'center',behavior:'smooth'});
                    return false;
                }
            }
            return true;
        }

        function canAdvance() {
            if (step === 1) return validateContainer(billing);
            if (step === 2) {
                if (!validateContainer(delivery)) return false;
                // Native shipping rates can be radios or selects; Woo controls
                // and validates rate availability. We do not invent a method.
                return true;
            }
            return false;
        }

        next.addEventListener('click', function () {
            if (step < 3 && canAdvance()) showStep(step + 1);
        });
        back.addEventListener('click', function () { showStep(step - 1); });
        // If an address field becomes required after Woo changes the customer
        // type or shipping destination, native constraint validation must
        // reveal its original phase instead of targeting a hidden control.
        form.addEventListener('invalid', function (event) {
            const invalid = event.target;
            const phase = invalid.closest('#customer_details .col-1') ? 1 :
                invalid.closest('#customer_details .col-2') ? 2 : 3;
            if (phase !== step) {
                event.preventDefault();
                showStep(phase);
                requestAnimationFrame(function () {
                    if (invalid.isConnected) invalid.focus({preventScroll:false});
                });
            }
        }, true);

        // Woo fragments replace #order_review without replacing the form.
        // Re-read totals and classify native hook output after each refresh.
        if (window.jQuery) {
            window.jQuery(document.body).on('updated_checkout.codelaSteps', function () {
                categorizeExtras();
                syncTotal();
                decorateShippingProgress();
                syncPaymentShipping();
                refineCoupon();
                refineDeliveryNote();
                refinePrivacyNotice();
            });
            window.jQuery(document.body).on('checkout_error.codelaSteps', function () {
                const invalid = form.querySelector('.woocommerce-invalid');
                if (invalid?.closest('#customer_details .col-1')) showStep(1);
                else if (invalid?.closest('#customer_details .col-2')) showStep(2);
            });
        }

        // Yield ONLY to a real mobile software keyboard, not ordinary focus.
        // A desktop/touch-automation focused field must not make the fixed
        // checkout button untappable. Safari reports keyboard occlusion via
        // visualViewport; normal page scrolling does not meet this threshold.
        const keyboardField = 'input:not([type="checkbox"]):not([type="radio"]),textarea,select';
        function syncKeyboard() {
            const active = document.activeElement;
            const focused = form.contains(active) && active.matches(keyboardField);
            const view = window.visualViewport;
            const occluded = view && window.innerHeight - view.height - view.offsetTop > 140;
            document.body.classList.toggle('sf-checkout-editing',
                !!(focused && occluded && window.matchMedia('(max-width:900px)').matches));
        }
        form.addEventListener('focusin', syncKeyboard);
        form.addEventListener('focusout', function () { window.setTimeout(syncKeyboard, 0); });
        window.visualViewport?.addEventListener('resize', syncKeyboard, {passive:true});
        window.visualViewport?.addEventListener('scroll', syncKeyboard, {passive:true});
        // The fields' own change handlers continue to drive Woo checkout AJAX.
        categorizeExtras();
        showStep(1, false);
        // Release the shared skeleton only AFTER native Woo fields and the
        // stepper/fixed footer are in their final live positions.
        window.codelaSFCheckoutBoot?.ready();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
    else start();
})();
