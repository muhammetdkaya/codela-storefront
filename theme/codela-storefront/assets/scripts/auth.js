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
    function init() {
        preventInitialAccountAutoFocus();
        applyAuthPlaceholders();
        const tabs = document.querySelector('.sf-account-intro .sf-auth-tabs');
        const container = document.querySelector('#customer_login');
        if (!tabs || !container) return;
        const login = container.querySelector('.u-column1');
        const register = container.querySelector('.u-column2');
        if (!login?.querySelector('form.woocommerce-form-login')
            || !register?.querySelector('form.woocommerce-form-register')) return;

        const buttons = [...tabs.querySelectorAll('[data-auth-tab]')];
        const panels = {login, register};
        // Native WooCommerce login/register remain in place. Only relocate
        // the selector below the form when presented inside the guest dialog.
        const modal = !!tabs.closest('.sf-overlay-auth');
        let prompt = null;
        if (modal) {
            prompt = document.createElement('span');
            prompt.className = 'sf-auth-switch-prompt';
            tabs.prepend(prompt);
            container.after(tabs);
            tabs.classList.add('sf-auth-tabs--footer');
            // One alternate action is an ordinary button, not a two-tab
            // keyboard widget with its selected tab hidden visually.
            tabs.setAttribute('role', 'group');
            buttons.forEach(button => button.removeAttribute('role'));
        }
        login.id = 'sf-auth-login';
        register.id = 'sf-auth-register';

        function select(view, focus) {
            const active = view === 'register' ? 'register' : 'login';
            for (const button of buttons) {
                const selected = button.dataset.authTab === active;
                if (modal) {
                    button.hidden = selected;
                    button.removeAttribute('aria-selected');
                    button.tabIndex = selected ? -1 : 0;
                } else {
                    button.setAttribute('aria-selected', String(selected));
                    button.tabIndex = selected ? 0 : -1;
                    if (selected && focus) button.focus({preventScroll:true});
                }
            }
            if (prompt) prompt.textContent = active === 'login'
                ? tabs.dataset.registerPrompt : tabs.dataset.loginPrompt;
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
                if (modal || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
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
