// Ensure guest feature scripts do not enter the first-load script/style queue.
// Test belongs to the stable release workflow (independent of network/device).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = 'theme/codela-storefront/';
const file = path => fs.readFileSync(base + path, 'utf8');
const fn = file('functions.php');
const quick = file('inc/quick-login.php');
const passkey = file('inc/passkeys.php');
const lazy = file('assets/scripts/auth-loader.js');
assert(fn.includes('function codela_sf_guest_auth_lazy_allowed(): bool'), 'Guest-only guard');
assert(fn.includes("if ( codela_sf_guest_auth_lazy_allowed() )"), 'Deferred guest branch');
assert(fn.includes("'codela-storefront-auth-loader'"), 'Loader enqueued on guest storefront');
for (const path of ['account-overlay.css','auth-smart.css','quick-login.css']) {
    assert(fn.includes("'styles/" + path + "'"), 'Lazy style: ' + path);
}
for (const path of ['auth.js','auth-smart.js','quick-login.js','passkeys.js']) {
    assert(fn.includes("'scripts/" + path + "'"), 'Lazy script: ' + path);
}
assert(fn.includes("wp_enqueue_script( 'codela-storefront-auth'"), 'Direct account fallback');
assert(quick.includes("if ( ! $lazy ) {"), 'PIN eager only on account');
assert(passkey.includes("if ( ! $lazy ) {"), 'Passkeys eager only on account');
assert(quick.includes("$lazy ? 'codela-storefront-auth-loader'"), 'PIN config on loader');
assert(passkey.includes("$lazy ? 'codela-storefront-auth-loader'"), 'Passkey config on loader');
assert(lazy.includes('script.async = false'), 'Dependency-safe simultaneous downloads');
assert(lazy.includes("section.dispatchEvent(new Event('codela:account-open'))"), 'Replay when ready');
assert(lazy.includes('showFailure()'), 'Failure is actionable');
assert(lazy.includes("document.addEventListener('pointerover'"), 'Low priority intent warming');
console.log('Guest lazy auth asset contracts OK');
