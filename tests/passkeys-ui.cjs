const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('theme/codela-storefront/assets/scripts/passkeys.js','utf8');
const php=fs.readFileSync('theme/codela-storefront/inc/passkeys.php','utf8');
const quick=fs.readFileSync('theme/codela-storefront/assets/styles/quick-login.css','utf8');
const account=fs.readFileSync('theme/codela-storefront/assets/styles/account.css','utf8');
const overlay=fs.readFileSync('theme/codela-storefront/assets/styles/account-overlay.css','utf8');
assert(js.includes("const selectedId = remembered && !remembered.paused ? remembered.credentialId : ''"),
  'Remembered device sends its own passkey credential id');
assert(js.includes("post('/assert-options', selectedId ? {credential_id:selectedId} : {})"),
  'Native passkey call uses a single known key when possible');
assert(js.includes('navigator.credentials.get({') && js.includes("mediation:'optional'"),
  'User gesture still invokes the platform authenticator');
assert(!js.includes("document.createElement('button');\n    button.type='button'; button.className='sf-pk-discover'"),
  'Normal WooCommerce login never gains an unsolicited phone CTA');
assert(!js.includes("button.textContent='Telefonla hızlı giriş'"),
  'No random extra passkey option on normal sign in');
assert(js.includes("host.classList.remove('sf-passkey-active','sf-pin-active')"),
  'Email and Google fallback releases the fast sign in state');
assert(js.includes("section.querySelector('.sf-pk-use-email')?.addEventListener"),
  'Native Woo login can be deliberately selected');
assert(js.includes("const legacy = JSON.parse(localStorage.getItem('codela_sf_quick_profile_v1')"),
  'Original native PIN login remains available');
assert(php.includes("isset( $stored[ $hint ] )") && php.includes("empty( $stored[ $hint ]['paused'] )"),
  'Credential hint cannot bypass server-side registration and paused status');
assert(php.includes("'allowed_id' => $allowed_id") &&
  php.includes("hash_equals( $allowed_id, $id )"),
  'Challenge binds the exact credential to the signed assertion');
assert(php.includes("'userVerification' => 'required'") &&
  php.includes("hash_equals( hash( 'sha256', codela_sf_pk_host(), true )"),
  'Server-origin and user verification WebAuthn requirements stay enforced');
assert(account.includes('.woocommerce .sf-auth-register-cta') &&
  overlay.includes('.woocommerce > .sf-auth-register-cta'),
  'Legacy account layouts still explicitly display native signup');
assert(quick.includes('.woocommerce.sf-passkey-active > .sf-auth-register-cta') &&
  quick.includes('#sf-panel.is-account-panel .woocommerce.sf-passkey-active > .sf-auth-register-cta') &&
  quick.includes('display:none!important'),
  'Quick passkey screen hides sibling registration CTA at greater CSS specificity');
console.log('Saved passkey single-tap / native form isolation contract passed');
