/**
 * Dismiss an optional WooCommerce email reminder for this tab session.
 * Verification state and WooCommerce actions are never modified.
 */
(() => {
  const init = () => {
    document.querySelectorAll('[data-sf-verify-banner]').forEach(banner => {
      const key = banner.dataset.sfVerifyDismissKey;
      if (!key) return;
      try { if (sessionStorage.getItem(key) === '1') banner.hidden = true; } catch (_) {}
      const button = banner.querySelector('[data-sf-verify-dismiss]');
      if (button) button.addEventListener('click', () => {
        banner.hidden = true;
        try { sessionStorage.setItem(key, '1'); } catch (_) {}
      });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
