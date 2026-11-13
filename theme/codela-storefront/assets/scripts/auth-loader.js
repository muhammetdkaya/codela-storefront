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
        loading = Promise.all([
            ...config.styles.map(assetLink),
            loadScripts(config.scripts),
        ]).then(() => { state = 'ready'; })
          .catch(error => { state = 'failed'; throw error; });
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
        if (!document.getElementById('sf-auth-loader-style')) {
            const style = document.createElement('style');
            style.id = 'sf-auth-loader-style';
            style.textContent = [
                '#sf-account.sf-auth-deferred-loading>:not(.sf-auth-loader-status){display:none!important}',
                '#sf-account .sf-auth-loader-status{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;min-height:min(56dvh,470px);font:inherit;font-size:14px;color:var(--sf-muted,#777)}',
                '#sf-account .sf-auth-loader-status:before{content:"";width:30px;height:30px;border:2px solid #e7e7e9;border-top-color:var(--sf-ui-ink,#222);border-radius:50%;animation:sf-auth-loading .8s linear infinite}',
                '@keyframes sf-auth-loading{to{transform:rotate(360deg)}}',
                '@media(prefers-reduced-motion:reduce){#sf-account .sf-auth-loader-status:before{animation:none}}',
            ].join('');
            document.head.append(style);
        }
        if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.className = 'sf-auth-loader-status';
            placeholder.setAttribute('role', 'status');
            placeholder.setAttribute('aria-live', 'polite');
            section.append(placeholder);
        }
        placeholder.replaceChildren(document.createTextNode(config.loading || 'Loading…'));
        section.classList.add('sf-auth-deferred-loading');
    }
    function hidePlaceholder() {
        section.classList.remove('sf-auth-deferred-loading');
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
    }
    function domReady() {
        if (document.readyState !== 'loading') return Promise.resolve();
        return new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once:true}));
    }

    section.addEventListener('codela:account-open', () => {
        if (state === 'ready') return; // Normal event already reached the controllers.
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
