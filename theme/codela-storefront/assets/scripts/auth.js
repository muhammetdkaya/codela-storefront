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
    function init() {
        preventInitialAccountAutoFocus();
        const tabs = document.querySelector('.sf-account-intro .sf-auth-tabs');
        const container = document.querySelector('#customer_login');
        if (!tabs || !container) return;
        const login = container.querySelector('.u-column1');
        const register = container.querySelector('.u-column2');
        if (!login?.querySelector('form.woocommerce-form-login')
            || !register?.querySelector('form.woocommerce-form-register')) return;

        const buttons = [...tabs.querySelectorAll('[data-auth-tab]')];
        const panels = {login, register};
        login.id = 'sf-auth-login';
        register.id = 'sf-auth-register';

        function select(view, focus) {
            const active = view === 'register' ? 'register' : 'login';
            for (const button of buttons) {
                const selected = button.dataset.authTab === active;
                button.setAttribute('aria-selected', String(selected));
                button.tabIndex = selected ? 0 : -1;
                if (selected && focus) button.focus({preventScroll:true});
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

        // Add the selected-tab class before hiding anything: without JS, Woo
        // retains the full two-form fallback (including registration).
        container.classList.add('sf-auth-ready');
        tabs.hidden = false;
        select(window.location.hash === '#sf-auth-register' ? 'register' : 'login', false);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
    else init();
}());
