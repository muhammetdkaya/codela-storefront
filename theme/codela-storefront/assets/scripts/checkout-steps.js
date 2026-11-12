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
            scope.querySelector('.sf-checkout-stepper')) return;

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
        const error = stepper.querySelector('.sf-checkout-step-error');
        const progress = Array.from(stepper.querySelectorAll('.sf-checkout-step-track > span'));
        const next = footer.querySelector('.sf-checkout-next');
        const nextLabel = footer.querySelector('.sf-checkout-next-label');
        const totalLabel = footer.querySelector('.sf-checkout-total-label');
        const totalValue = footer.querySelector('.sf-checkout-total-value');
        const shippingSection = review.querySelector('.woocommerce-checkout-review-order-table');
        let step = 1;

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
            back.textContent = read('back', 'Back');
            next.hidden = step === 3;
            if (step !== 3) nextLabel.textContent = nextNames[step - 1];
            totalLabel.textContent = step === 3 ? read('total', 'Total') : read('estimated', 'Estimated total');
            progress.forEach((node, i) => node.classList.toggle('is-complete', i < step));
            error.hidden = true;
            error.textContent = '';
            syncTotal();
            if (scroll) {
                const top = stepper.getBoundingClientRect().top + window.scrollY - 76;
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
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
    else start();
})();
