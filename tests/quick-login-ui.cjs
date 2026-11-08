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
assert(js.includes("host.classList.add('sf-pin-active')") && js.includes("sf-quick-switch") && js.includes("showNativeLogin('login')"),'Native Woo login fallback remains available outside inline PIN card');
assert(js.includes("if (input.value.length === 6) {") && js.includes("void submit();"),
  'Sixth digit automatically submits native numeric input without tapping Done');
assert(js.includes("choose.addEventListener('click', () => {") && js.includes('openInline()'),'Remembered account expands the existing card');
assert(js.includes("input.focus({preventScroll:true})"),'A direct account tap opens the operating system numeric keyboard');
assert(!js.includes("host.querySelector('input[name=\"username\"]')?.focus"),'Switching to email must not autofocus login fields');
assert(js.includes('window.visualViewport') && js.includes('browserChrome') && js.includes('safeBottom') && js.includes('naturalBottom') && !js.includes('positionSheet()'),'Inline card reserves native iOS keyboard and Safari toolbar visible area without fixed bottom sheet');
assert(css.includes('var(--sf-quick-keyboard-lift,0px)') && js.includes("frame.style.setProperty('--sf-quick-keyboard-lift'"),'Only the expanded account card lifts to stay visible over native keyboard');
assert(css.includes('.sf-quick-login.is-inline-open .sf-quick-inline-inner{visibility:visible;padding-bottom:18px}') && !css.includes('.sf-quick-inline-inner{padding-bottom:18px}'),'Collapsed remembered card must not retain expanded PIN padding');
assert(css.includes('.sf-quick-account-frame::before') && !css.includes('.sf-quick-account::before'),'Skeleton uses the single actual outer card frame');
assert(css.includes('.sf-quick-google:disabled{opacity:1!important'),'Disabled Google CTA preserves full dark background and logo colors');
assert(js.includes('mergeSlots()') && js.includes("track.classList.add('is-merging')"),'The six square boxes converge to a single result');
assert(js.includes("if (!result.ok || typeof result.account_url !== 'string')"),'Server authentication response is validated before success');
assert(js.indexOf('mergeSlots();') > js.indexOf("const result = await request('verify'") && js.indexOf("track.classList.add('is-verified')") > js.indexOf('mergeSlots();'),'Both merge and check are gated on the successful server response');
assert(js.includes("accountStore.storePin({...remembered,") &&
  js.includes("displayName:settings.dataset.displayName || remembered.username"),
  'An existing customer profile refreshes only its own remembered name and email');
assert(js.includes("displayName:settings.dataset.displayName"),'New remembered accounts store display name');
assert(js.includes("email:settings.dataset.email"),'Enrollment stores only a display email alongside remembered account');
assert(js.includes("email.textContent = rememberedEmail"),'Guest card reads the remembered email');
assert(php.includes("class=\"sf-quick-email\""),'Saved-account markup has an optional email line');
assert(php.includes('aria-expanded="false"') && php.includes('sf-quick-method--pin') && php.includes('sf-quick-method--passkey'),'Account card uses a downward chevron with accessible expanded state');
assert(php.includes('sf-quick-choice-alternatives') && php.includes('sf-quick-email-login'),'Reference actions belong below the account card');
assert(php.includes('sf-quick-google') && php.includes('disabled aria-label='),'Google button stays visible but safely disabled without configured OAuth');
assert(css.includes('.sf-quick-or') && css.includes('.sf-quick-google'),'Divider and Google CTA have dedicated styles');
assert(css.includes('background:#252628!important;background-image:none!important'), 'Remembered Google button uses the same dark Codela surface without a secondary tint');
assert(!js.includes("data-quick-digit"),'No custom number keypad should be used');

assert(js.includes("currentBrowserStatus(profile, privateKey)") &&
  js.includes("if (!browserStatus.active)") &&
  js.includes("await forgetRemembered(profile)"),'Saved browser is verified server-side and revoked devices are removed');
assert(js.includes("browserStatus.authenticated") && js.includes("freshAccountDocument()"),
  'Cached anonymous HTML is replaced when actual WordPress cookie is present');
assert(js.includes("const signedInPin=identity && accountStore.pins().find(") &&
  !js.includes("Number(config.identity.userId) !== profile.userId"),
  'Other remembered customer profiles remain after signing into a different account');
assert(js.includes("accountStore.storePin({") && js.includes("accountStore.forgetPin(profile.deviceId)"),
  'PIN enrollment and revocation are scoped to one account/device');
assert(js.includes("const handleDigits = () =>") && js.includes("input.blur();") &&
  js.includes("if (input.value.length === 6) {"),
  'Six digits immediately auto-submit and dismiss the native iOS keyboard');
assert(js.includes("renderGuestAccountGroups()") && js.includes("showPasskeyOnly(section,account.passkey)"),
  'Quick login renders several saved customer cards with independent methods');
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
const passkeys = fs.readFileSync('theme/codela-storefront/inc/passkeys.php','utf8');
assert(!php.includes("add_action( 'woocommerce_edit_account_form', 'codela_sf_quick_settings'") &&
  !php.includes("add_action( 'woocommerce_account_dashboard', 'codela_sf_quick_dashboard_entry'") &&
  passkeys.includes("add_action( 'woocommerce_account_guvenlik_endpoint'") &&
  passkeys.includes('codela_sf_quick_settings();'),
  'PIN enrollment moves from permanent account card into dedicated security endpoint');
assert(css.includes(".sf-pin-active .sf-account-intro"),'Native form hidden only while remembered-account selection active');
assert(css.includes('.woocommerce.sf-pin-active .sf-auth-register-cta') && css.includes('html.sf-quick-checking'),'Signup is hidden with sufficient specificity during remembered choice and preflight');
assert(css.includes('.sf-quick-inline-pin') && css.includes('.sf-quick-account-frame') && css.includes('.sf-quick-scrim'),'PIN is part of the focused account card with backdrop');
assert(!php.includes('role="dialog"') && !php.includes('sf-quick-sheet'),'No separate bottom sheet or popup remains');
assert(css.includes('.sf-quick-slot.is-filled') && css.includes('.sf-quick-slot.is-current'),'PIN fill and current-slot colors defined');
assert(css.includes('.sf-quick-pin-track.is-verified .sf-quick-result'),'Verified-state displays a single centered green square');
assert(css.includes('grid-template-columns:repeat(6,minmax(0,1fr))') && css.includes('aspect-ratio:1'),'PIN cells retain square geometry');
assert(css.includes('stroke-dashoffset:0') && !php.includes('sf-quick-spinner'),'Animated center tick without success row or spinner');
assert(css.includes('#16844f'),'Verified state uses distinct green');
assert(css.includes('#c53643'),'Failed state uses distinct red');
assert(css.includes('.sf-quick-status.is-error'),'Errors have distinct warning hue');
assert(css.includes('.sf-quick-choice-intro'),'Remembered account has concise heading and supporting description');
assert(js.includes("host.dispatchEvent(new CustomEvent('codela:quick-status'"),'Quick status coordinates the saved account view');
assert(js.includes("const choose = section.querySelector('.sf-quick-method--pin')"),'Only the PIN icon opens its numeric input');
assert(css.includes('.sf-quick-account-frame') && css.includes('background:#fff') && css.includes('sf-quick-inline-inner'),'Inline PIN remains on the account card white surface');
assert(css.includes('.sf-quick-status.is-error') && css.includes('position:absolute;width:1px'),'Only errors have visible status text; success is accessible without extra row');
assert(php.includes('sf-quick-email-login') && !php.includes('sf-quick-sheet-links'),'Email/password fallback remains below the card rather than duplicated in a popup');

assert(css.includes("@media(prefers-reduced-motion:reduce)"),'Reduced-motion setting respected');
assert(!php.includes('sf-quick-remove-line') && !js.includes('sf-quick-remove'),
 'Remembered account removal is absent from guest UI and handler');
assert(js.includes('await forgetRemembered(profile)'),
 'Revoked or mismatched remembered identities still clear local device data');
assert(php.includes("'wp_head'") && php.includes('sf-quick-checking'),
 'Prepaint device hint suppresses the native form until status verification');
assert(js.includes("document.documentElement.classList.remove('sf-quick-checking')"),
 'Verification atomically reveals the native or recognized screen');
assert(js.includes("uri.searchParams.delete('sf_quick_auth')"),
 'One-time account cache-bypass parameter is removed from the address');
console.log('Quick login browser contracts passed');
