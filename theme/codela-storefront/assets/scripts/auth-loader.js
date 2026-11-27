/**
 * Delayed guest Account features. Native Woo form markup remains in the document;
 * only account-specific enhancements/styles are loaded on intent. Never capture
 * or submit credentials here, and never duplicate the existing dialog/router.
 */
(() => {
    'use strict';
    const config = window.CodelaSFAuthLoader;
    const section = document.getElementById('sf-account');
    if (!config || !section) return;

    let state = 'idle';
    let loading = null;
    let replayPending = false;
    // The initial dialog is always gated by the server-rendered head CSS.
    // Prefetching scripts alone never makes raw Woo forms visible.
    let prefetched = false;
    let placeholder = null;

    function assetLink(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = resolve;
            link.onerror = reject;
            document.head.append(link);
        });
    }
    function loadScripts(urls) {
        // Dynamic classic scripts are ordered with async=false while all four
        // downloads can overlap. auth -> smart -> PIN -> passkeys is required.
        const jobs = urls.map(url => new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.async = false;
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.append(script);
        }));
        return Promise.all(jobs);
    }
    function load() {
        if (loading) return loading;
        state = 'loading';
        // Move native markup into the live DOM before controllers initialize.
        // Until actual account intent, the template is not a document heading or form.
        const template = section.querySelector('template[data-sf-auth-template]');
        if (template) { template.replaceWith(template.content); }
        loading = Promise.all([
            ...config.styles.map(assetLink),
            loadScripts(config.scripts),
        ]).then(async () => {
            // Script load events precede asynchronous device attestation.
            // Only the real smart stage AND quick-login status may reveal UI.
            const smart=window.codelaSFSmartAuthReady;
            const quick=window.codelaSFQuickLoginReady;
            if (!smart || !quick) throw Error('Auth controllers did not register');
            const results=await Promise.all([smart,quick]);
            if (results.some(ok=>ok!==true)) throw Error('Auth controllers failed to initialize');
            state='ready'; // The open handler commits readiness and removes the placeholder atomically.
        }).catch(error => { state = 'failed'; throw error; });
        return loading;
    }
    function preloadOnIntent(event) {
        if (prefetched || state !== 'idle' ||
            !event.target.closest?.('[data-panel="account"]')) return;
        prefetched = true;
        // Hints are intentionally low-priority. Hover/focus does not execute
        // auth or fire the signed-device status check against admin-ajax.php.
        for (const href of [...config.styles, ...config.scripts]) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = href;
            document.head.append(link);
        }
    }
    function ensurePlaceholder() {
        // Critical loader styling is already present in the document head.
        if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.className = 'sf-auth-loader-status';
            placeholder.setAttribute('role', 'status');
            placeholder.setAttribute('aria-live', 'polite');
            section.append(placeholder);
        }
        placeholder.replaceChildren(document.createTextNode(config.loading || 'Loading…'));
        section.classList.add('sf-auth-deferred-loading');
        section.setAttribute('aria-busy','true');
        section.removeAttribute('data-sf-auth-ready');
    }
    function hidePlaceholder() {
        section.classList.remove('sf-auth-deferred-loading');
        section.removeAttribute('aria-busy');
        // Reveal only the completed single view; an error keeps the fallback
        // link visible without exposing obsolete Woo forms.
        section.dataset.sfAuthReady='true';
        placeholder?.remove();
        placeholder = null;
    }
    function showFailure() {
        ensurePlaceholder();
        placeholder.replaceChildren();
        const link = document.createElement('a');
        link.href = config.account;
        link.textContent = config.fallback || 'Open my account';
        link.className = 'sf-ui-button sf-ui-button--primary';
        placeholder.append(link);
        section.removeAttribute('aria-busy');
    }
    function domReady() {
        if (document.readyState !== 'loading') return Promise.resolve();
        return new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once:true}));
    }

    section.addEventListener('codela:account-open', () => {
        if (state === 'ready') {
            hidePlaceholder();
            return; // Controllers have finished, including device verification.
        }
        if (state === 'failed') { showFailure(); return; }
        ensurePlaceholder();
        if (replayPending) return;
        replayPending = true;
        load().then(domReady).then(() => {
            replayPending = false;
            hidePlaceholder();
            // Fresh Woo nonces and quick-login device checks start exactly as
            // on the eager Account page. Don't perform them for closed panels.
            if (!section.hidden) section.dispatchEvent(new Event('codela:account-open'));
        }).catch(() => {
            replayPending = false;
            showFailure(); // Never leave a blank, permanently blocked dialog.
        });
    });

    document.addEventListener('pointerover', preloadOnIntent, {passive:true});
    document.addEventListener('focusin', preloadOnIntent);
    document.addEventListener('pointerdown', event => {
        if (event.target.closest?.('[data-panel="account"]')) void load().catch(() => {});
    }, {passive:true});
})();
