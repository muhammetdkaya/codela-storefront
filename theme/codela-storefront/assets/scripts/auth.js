/**
 * Progressive enhancement of the two native WooCommerce account forms.
 * No login, registration, social sign-in or password-reset logic lives here.
 * With JS disabled, both native forms remain available.
 */
(function () {
    'use strict';
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
    // Enhance genuine Woo fields; never replace their labels, nonces or handlers.
    // A placeholder is visual help, not the accessible field name.
    function applyAuthPlaceholders() {
        const intro = document.querySelector('.sf-account-intro');
        if (!intro) return;
        const copy = intro.dataset;
        document.querySelectorAll('.woocommerce form:is(.woocommerce-form-login,.woocommerce-form-register)')
            .forEach(form => {
                const registering = form.classList.contains('woocommerce-form-register');
                form.querySelectorAll('input.input-text').forEach(input => {
                    const label = [...form.querySelectorAll('label[for]')]
                        .find(item => item.htmlFor === input.id);
                    if (!label) return;
                    const name = (input.name || '').toLowerCase();
                    const kind = (input.type || '').toLowerCase();
                    let placeholder = '';
                    if (kind === 'password' || name.includes('password')) placeholder = copy.authPasswordPlaceholder;
                    else if (kind === 'email' || name.includes('email')) placeholder = registering ? copy.authEmailPlaceholder : copy.authLoginPlaceholder;
                    else if (name.includes('username')) placeholder = registering ? copy.authUsernamePlaceholder : copy.authLoginPlaceholder;
                    else placeholder = label.textContent.replaceAll('*', '').trim();
                    if (!placeholder) return;
                    if (!input.placeholder) input.placeholder = placeholder;
                    input.closest('.form-row')?.classList.add('sf-auth-placeholder-ready');
                });
            });
    }
    /**
     * Keep the instant dialog fast without trusting stale form nonces embedded
     * in a cached Home/Shop document. WooCommerce still submits its own forms.
     * A read-only no-store AJAX call refreshes both nonce fields on each open.
     */
    function initInstantAccountFreshness() {
        const root = document.querySelector('#sf-account .sf-overlay-auth');
        const accountSection = document.querySelector('#sf-account');
        if (!root || !accountSection || !root.dataset.authStateUrl) return;
        const forms = [...root.querySelectorAll('form.woocommerce-form-login,form.woocommerce-form-register')];
        if (!forms.length) return;
        const buttons = forms.flatMap(form => [...form.querySelectorAll('button[type="submit"],input[type="submit"]')]);
        let ready = false;
        let pending = null;
        const account = root.querySelector('form.woocommerce-form-login')?.action
            || document.querySelector('.sf-account-link')?.href || '/my-account/';
        const goToFreshAccount = () => {
            const target = new URL(account, window.location.href);
            if (target.origin !== window.location.origin) return;
            target.searchParams.set('sf_quick_auth', Date.now().toString(36));
            window.location.replace(target.href);
        };
        const setWaiting = waiting => {
            buttons.forEach(button => { button.disabled = waiting; });
            root.setAttribute('aria-busy', String(waiting));
        };
        forms.forEach(form => {
            // Browser native form cannot submit while a cached nonce is being
            // refreshed. No duplicate auth handler or credentials API is used.
            form.addEventListener('submit', event => {
                if (!ready) event.preventDefault();
            }, true);
        });
        accountSection.addEventListener('codela:account-open', () => {
            if (pending) return;
            ready = false;
            setWaiting(true);
            const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
                ? AbortSignal.timeout(8000) : undefined;
            pending = fetch(root.dataset.authStateUrl, {
                method:'POST', credentials:'same-origin', cache:'no-store',
                headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
                body:'action=codela_sf_account_form_state', signal
            }).then(async response => {
                if (!response.ok) throw Error('Account session refresh failed');
                const state = await response.json();
                if (state.authenticated) {
                    goToFreshAccount();
                    return;
                }
                if (!state.login_nonce || !state.register_nonce) {
                    throw Error('Account form verification unavailable');
                }
                const fields = {
                    'woocommerce-login-nonce':state.login_nonce,
                    'woocommerce-register-nonce':state.register_nonce
                };
                for (const form of forms) {
                    for (const [name,nonce] of Object.entries(fields)) {
                        const input = form.querySelector('input[name="' + name + '"]');
                        if (input) input.value = nonce;
                    }
                }
                ready = true;
                setWaiting(false);
            }).catch(() => {
                // Fail closed for cached Woo nonces. A fresh full My Account
                // document is the safe fallback when the lightweight request
                // cannot be completed, rather than silently submitting a stale
                // public-page form and claiming login succeeded.
                goToFreshAccount();
            }).finally(() => { pending = null; });
        });
    }
    function init() {
        preventInitialAccountAutoFocus();
        applyAuthPlaceholders();
        initInstantAccountFreshness();
        const tabs = document.querySelector('.sf-account-intro .sf-auth-tabs');
        const container = document.querySelector('#customer_login');
        if (!tabs || !container) return;
        const login = container.querySelector('.u-column1');
        const register = container.querySelector('.u-column2');
        if (!login?.querySelector('form.woocommerce-form-login')
            || !register?.querySelector('form.woocommerce-form-register')) return;

        const buttons = [...tabs.querySelectorAll('[data-auth-tab]')];
        const panels = {login, register};
        const heading = tabs.closest('.sf-account-intro');
        const headingText = heading?.querySelector('.sf-auth-heading-text');
        const headingWave = heading?.querySelector('.sf-auth-heading-wave');
        const description = heading?.querySelector('.sf-auth-description');
        // The native Woo forms and their server-side validation stay intact.
        // Do not move tabs into the modal footer: the very same sliding selector
        // is rendered above the heading on the fast panel and /my-account/.
        login.id = 'sf-auth-login';
        register.id = 'sf-auth-register';

        function select(view, focus) {
            const active = view === 'register' ? 'register' : 'login';
            tabs.dataset.active = active;
            for (const button of buttons) {
                const selected = button.dataset.authTab === active;
                button.setAttribute('aria-selected', String(selected));
                button.tabIndex = selected ? 0 : -1;
                if (selected && focus) button.focus({preventScroll:true});
            }
            if (heading) {
                if (headingText) headingText.textContent = active === 'register'
                    ? heading.dataset.authRegisterTitle : heading.dataset.authLoginTitle;
                if (description) description.textContent = active === 'register'
                    ? heading.dataset.authRegisterDescription : heading.dataset.authLoginDescription;
                if (headingWave) headingWave.hidden = active === 'register';
            }
            for (const [key, panel] of Object.entries(panels)) {
                panel.hidden = key !== active;
                panel.setAttribute('aria-labelledby', 'sf-auth-tab-' + key);
            }
        }

        buttons.forEach(button => {
            const view = button.dataset.authTab;
            button.id = 'sf-auth-tab-' + view;
            button.setAttribute('aria-controls', panels[view].id);
            button.addEventListener('click', () => select(view, false));
            button.addEventListener('keydown', event => {
                if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
                event.preventDefault();
                select(event.key === 'Home' ? 'login'
                    : event.key === 'End' ? 'register'
                    : (view === 'login' ? 'register' : 'login'), true);
            });
        });

        // The remembered-account chooser requests a native Woo registration
        // tab rather than navigating to a different form or route.
        container.addEventListener('codela:auth-select', event => {
            select(event.detail?.view === 'register' ? 'register' : 'login', false);
        });

        // Add the selected-tab class before hiding anything: without JS, Woo
        // retains the full two-form fallback (including registration).
        container.classList.add('sf-auth-ready');
        tabs.hidden = false;
        select(window.location.hash === '#sf-auth-register' ? 'register' : 'login', false);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
    else init();
}());
