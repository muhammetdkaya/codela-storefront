const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('theme/codela-storefront/assets/scripts/quick-login.js','utf8');
const php=fs.readFileSync('theme/codela-storefront/inc/quick-login.php','utf8');
const css=fs.readFileSync('theme/codela-storefront/assets/styles/quick-login.css','utf8');
const fns=fs.readFileSync('theme/codela-storefront/functions.php','utf8');
assert(fns.includes("require_once get_template_directory() . '/inc/quick-login.php';"), 'Theme loads server auth adapter');
assert(js.includes("crypto.subtle.generateKey(") && js.includes("false, ['sign','verify']"),'Private keys are not extractable');
assert(js.includes("indexedDB.open(") && js.includes("tx.objectStore('keys').put(key, deviceId)"),'Private key only stored via IndexedDB');
assert(!js.includes("localStorage.setItem(savedKey, pin"),'PIN is never stored as a plaintext browser hint');
assert(js.includes("host.classList.add('sf-pin-active')") && js.includes("sf-quick-password"),'Native Woo login fallback remains available');
assert(js.includes("if (input.value.length === 6) void submit()"),'Sixth digit automatically submits native numeric input');
assert(js.includes('choose.addEventListener(\'click\', openSheet)'),'Remembered account opens a dedicated PIN bottom sheet');
assert(js.includes("input.focus({preventScroll:true})"),'A direct account tap opens the operating system numeric keyboard');
assert(js.includes('mergeSlots()') && js.includes("track.classList.add('is-merging')"),'The six visible PIN boxes merge into one center result');
assert(js.includes("if (!result.ok || typeof result.account_url !== 'string')"),'Server authentication response is validated before success');
assert(js.indexOf("track.classList.add('is-verified')") > js.indexOf("if (!result.ok || typeof result.account_url !== 'string')"),'Check animation cannot start before successful server verification');
assert(js.includes("remembered.displayName = settings.dataset.displayName"),'Existing remembered accounts refresh their customer name');
assert(js.includes("displayName:settings.dataset.displayName"),'New remembered accounts store display name');
assert(js.includes("email:settings.dataset.email"),'Enrollment stores only a display email alongside remembered account');
assert(js.includes("email.textContent = rememberedEmail"),'Guest card reads the remembered email');
assert(php.includes("class=\"sf-quick-email\""),'Saved-account markup has an optional email line');
assert(php.includes("codela_sf_icon( 'arrow-right' )"),'Saved-account trailing icon points right without CSS rotation');
assert(php.includes('sf-quick-choice-alternatives') && php.includes('sf-quick-email-login'),'Reference actions belong below the account card');
assert(php.includes('sf-quick-google') && php.includes('disabled aria-label='),'Google button stays visible but safely disabled without configured OAuth');
assert(css.includes('.sf-quick-or') && css.includes('.sf-quick-google'),'Divider and Google CTA have dedicated styles');
assert(!js.includes("data-quick-digit"),'No custom number keypad should be used');

assert(js.includes("currentBrowserStatus(profile, privateKey)") &&
  js.includes("if (!browserStatus.active)") &&
  js.includes("await forgetRemembered(profile)"),'Saved browser is verified server-side and revoked devices are removed');
assert(js.includes("browserStatus.authenticated") && js.includes("freshAccountDocument()"),
  'Cached anonymous HTML is replaced when actual WordPress cookie is present');
assert(js.includes("Number(config.identity.userId) !== profile.userId") &&
  js.includes("await forgetRemembered(profile)"),'Different Google/password account clears previous remembered identity');
assert(php.includes("wp_ajax_nopriv_codela_sf_quick_status") &&
  php.includes("codela_sf_quick_status_active"),'Read-only device status uses real WordPress cookie context');
assert(php.includes("woocommerce_logout_default_redirect_url") &&
  php.includes("woocommerce_login_redirect"),'Native login and logout bypass cached account HTML');
assert(php.includes("DONOTCACHEPAGE") && php.includes("is_account_page()"),
  'WooCommerce account route never caches account-specific HTML');
assert(js.includes("window.location.replace(destination.href)"),'Successful PIN forces a full document navigation');
assert(js.includes("destination.searchParams.set('sf_quick_auth'"),'Authenticated redirect bypasses cached guest account HTML');
assert(php.includes("nocache_headers()"),'Authentication completion page explicitly disables caches');
assert(js.includes("if (!result.ok || typeof result.account_url !== 'string')"),'Redirect only follows successful server result');
assert(js.includes("derFromP1363"),'P1363 ECDSA signatures are converted to OpenSSL DER');
assert(php.includes("wp_set_auth_cookie(") && php.includes("do_action( 'wp_login'"),'WordPress sessions are the authority');
assert(php.includes("wp_hash_password( codela_sf_quick_pin_secret( $pin ) )"),'PIN is hashed and server peppered');
assert(php.includes("delete_transient( $key ); // A challenge is usable only once."),'Challenges are one-time');
assert(php.includes("codela_sf_quick_request_limit( $limit, 5 )"),'Online guessing is rate-limited');
assert(php.includes("after_password_reset") && php.includes("wp_set_password"),'Password changes revoke device access');
assert(php.includes("woocommerce_before_customer_login_form"),'Native WooCommerce registration is preserved');
assert(php.includes("woocommerce_edit_account_form"),'Quick enrollment is available inside native account');
assert(css.includes(".sf-pin-active .sf-account-intro"),'Native form hidden only while remembered-account selection active');
assert(css.includes('.sf-quick-sheet') && css.includes('.sf-quick-scrim'),'PIN lives in a responsive accessible bottom sheet');
assert(css.includes('.sf-quick-slot.is-filled') && css.includes('.sf-quick-slot.is-current'),'PIN fill and current-slot colors defined');
assert(css.includes('.sf-quick-pin-track.is-verified .sf-quick-result'),'Verified-state color remains separate from typing/loading');
assert(css.includes('#16844f'),'Verified state uses distinct green');
assert(css.includes('#c53643'),'Failed state uses distinct red');
assert(css.includes('.sf-quick-status.is-error'),'Errors have distinct warning hue');
assert(css.includes('.sf-quick-choice-intro'),'Remembered account has concise heading and supporting description');
assert(css.includes('background:#fff!important;color:#252527!important'),'PIN modal is opaque white regardless of shared glass styling');
assert(css.includes('.sf-quick-sheet-links')&&css.includes('background:#f8f8f9!important'),'Password/recovery footer uses an integrated surface');

assert(css.includes("@media(prefers-reduced-motion:reduce)"),'Reduced-motion setting respected');
assert(!php.includes('sf-quick-remove') && !js.includes("removeAccount?.addEventListener('click'") && !css.includes('.sf-quick-remove-line'),
 'Remembered account removal option is absent from markup, handlers and styles');
assert(js.includes('async function forgetRemembered(profile)'),
 'Automatic device revocation and Google account switch still clean outdated keys');
assert(css.includes('.sf-quick-google:disabled{opacity:1!important'),
 'Quick Google button retains the approved dark background when OAuth is not configured');
assert(php.includes("'wp_head'") && php.includes('sf-quick-checking'),
 'Prepaint device hint suppresses the native form until status verification');
assert(js.includes("document.documentElement.classList.remove('sf-quick-checking')"),
 'Verification atomically reveals the native or recognized screen');
assert(js.includes("uri.searchParams.delete('sf_quick_auth')"),
 'One-time account cache-bypass parameter is removed from the address');
console.log('Quick login browser contracts passed');
