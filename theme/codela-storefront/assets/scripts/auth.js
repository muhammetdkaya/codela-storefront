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
    /**
     * Normal Woo login focus mode. Keep the REAL form (including Remember me,
     * password recovery and submit) above a scrim identical to quick PIN.
     * Secondary registration/Google actions remain behind it.
     *
     * The mode is purely visual. It never auto-focuses a credential field,
     * reads credentials or replaces Woo's native authentication.
     */
    function initAccountFormFocusMode() {
        const roots = [...document.querySelectorAll('.woocommerce')]
            .filter(root => root.querySelector('form.woocommerce-form-login')
                && root.querySelector('.sf-account-intro'));
        for (const root of roots) {
            if (root.querySelector(':scope > .sf-auth-focus-scrim')) continue;
            const loginForm = root.querySelector('form.woocommerce-form-login');
            const credentials = [...loginForm.querySelectorAll(
                'input[name="username"],input[name="password"],input#username,input#password'
            )];
            const username = loginForm.querySelector('input[name="username"],input#username');
            const password = loginForm.querySelector('input[name="password"],input#password');
            if (!username || !password) continue;

            // Visual readiness means BOTH native fields contain text, never
            // that WooCommerce has authenticated or validated those values.
            // Preserve the real form, remembered checkbox and submit action.
            const updateSubmitReadiness = () => {
                loginForm.classList.toggle('sf-auth-submit-ready',
                    username.value.trim().length > 0 && password.value.length > 0);
            };
            loginForm.addEventListener('input', updateSubmitReadiness);
            loginForm.addEventListener('change', updateSubmitReadiness);
            loginForm.addEventListener('focusin', () => {
                window.requestAnimationFrame(updateSubmitReadiness);
            });
            window.addEventListener('pageshow', updateSubmitReadiness);
            root.closest('#sf-account')?.addEventListener('codela:account-open', updateSubmitReadiness);
            updateSubmitReadiness();

            const scrim = document.createElement('div');
            scrim.className = 'sf-auth-focus-scrim';
            scrim.setAttribute('aria-hidden', 'true');
            root.appendChild(scrim);
            const viewport = window.visualViewport;
            let baseline = viewport?.height || window.innerHeight;
            let hadKeyboard = false;
            let active = false;

            const stop = () => {
                if (!active) return;
                active = false;
                hadKeyboard = false;
                root.classList.remove('sf-auth-focus-mode');
            };
            const start = () => {
                if (root.classList.contains('sf-auth-register-view')
                    || root.classList.contains('sf-pin-active')) return;
                active = true;
                root.classList.add('sf-auth-focus-mode');
            };
            const isCredential = element => credentials.includes(element);
            // Track input focus, not password-manager suggestions or programmatic
            // selection of the login view.
            loginForm.addEventListener('focusin', event => {
                if (isCredential(event.target)) start();
            });
            loginForm.addEventListener('focusout', () => {
                window.requestAnimationFrame(() => {
                    if (!isCredential(document.activeElement)) stop();
                });
            });
            scrim.addEventListener('pointerdown', event => {
                event.preventDefault();
                if (isCredential(document.activeElement)) document.activeElement.blur();
                stop();
            });
            function onViewportResize() {
                const height = viewport?.height || window.innerHeight;
                if (!active) {
                    baseline = Math.max(baseline, height);
                    return;
                }
                if (baseline - height > 110) hadKeyboard = true;
                // Safari's Done key can close the native keyboard while the
                // input is still technically focused. Clear the dim in that case.
                if (hadKeyboard && height >= baseline - 48) {
                    if (isCredential(document.activeElement)) document.activeElement.blur();
                    stop();
                }
            }
            viewport?.addEventListener('resize', onViewportResize, {passive:true});
            // Native browser back/navigation, form submission and view changes
            // must never leave a stale black scrim over the site.
            loginForm.addEventListener('submit', stop);
            root.addEventListener('click', event => {
                if (event.target.closest('.sf-auth-register-cta,.sf-auth-back-login')) stop();
            });
            root.querySelector('#customer_login')?.addEventListener('codela:auth-select', stop);
        }
    }
    function init() {
        preventInitialAccountAutoFocus();
        applyAuthPlaceholders();
        initInstantAccountFreshness();
        initAccountFormFocusMode();
        const container = document.querySelector('#customer_login');
        if (!container) return;
        const login = container.querySelector('.u-column1');
        const register = container.querySelector('.u-column2');
        // When the merchant disables registration Woo renders only the login
        // form; do not manufacture a registration action or a second form.
        if (!login?.querySelector('form.woocommerce-form-login')
            || !register?.querySelector('form.woocommerce-form-register')) return;

        const heading = document.querySelector('.sf-account-intro');
        const headingText = heading?.querySelector('.sf-auth-heading-text');
        const headingWave = heading?.querySelector('.sf-auth-heading-wave');
        const description = heading?.querySelector('.sf-auth-description');
        const root = container.closest('.woocommerce');
        login.id = 'sf-auth-login';
        register.id = 'sf-auth-register';

        function select(view) {
            const active = view === 'register' ? 'register' : 'login';
            container.dataset.authView = active;
            root?.classList.toggle('sf-auth-register-view', active === 'register');
            if (heading) {
                if (headingText) headingText.textContent = active === 'register'
                    ? heading.dataset.authRegisterTitle : heading.dataset.authLoginTitle;
                if (description) description.textContent = active === 'register'
                    ? heading.dataset.authRegisterDescription : heading.dataset.authLoginDescription;
                if (headingWave) headingWave.hidden = active === 'register';
            }
            for (const [key, panel] of Object.entries({login,register})) {
                panel.hidden = key !== active;
                panel.setAttribute('aria-labelledby', 'sf-auth-view-title');
            }
        }

        // Register CTA is a sibling AFTER #customer_login (before Google).
        // Back-to-login remains inside Woo registration. Delegate within
        // the shared Woo shell, never to the document or unrelated links.
        // Switching views does not focus any field or invoke AutoFill.
        root?.addEventListener('click', event => {
            const action = event.target.closest('a.sf-auth-register-cta,a.sf-auth-back-login');
            if (!action || !root.contains(action)) return;
            event.preventDefault();
            select(action.classList.contains('sf-auth-register-cta') ? 'register' : 'login');
        });

        // Existing remembered-device -> password fallback uses this event.
        container.addEventListener('codela:auth-select', event => {
            select(event.detail?.view === 'register' ? 'register' : 'login');
        });

        // No-JS fallback leaves both native forms accessible. When enhancement
        // runs there is one active view, including after a failed Woo register
        // POST (to preserve the merchant's visible validation messages).
        container.classList.add('sf-auth-ready');
        select(heading?.dataset.authInitial === 'register'
            || ['#register','#sf-auth-register'].includes(window.location.hash)
            ? 'register' : 'login');
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
    else init();
}());
