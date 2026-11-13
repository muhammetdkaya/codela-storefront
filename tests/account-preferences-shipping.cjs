// Account preferences must be a genuine Woo endpoint and signed-in profile
// and shipping choices must stay native with theme-owned presentation only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const root = 'theme/codela-storefront/';
const load = p => fs.readFileSync(root + p,'utf8');
const account = load('inc/account.php'), css = load('assets/styles/account.css');
const checkout = load('assets/styles/checkout.css');
assert(account.includes("add_filter( 'woocommerce_get_query_vars'"),'Woo query registry hook');
assert(account.includes("$vars['communication-preferences'] = 'communication-preferences';"),'Preferences query var registered');
assert(account.includes("has_action( 'woocommerce_account_communication-preferences_endpoint'"),'Only active consent renderer registered');
assert(account.includes("codela_consent_center_render_preferences_endpoint"),'No theme-built second preferences engine');
assert(account.includes("WC()->query->get_current_endpoint()"),'Header and endpoint content use Woo query');
assert(account.includes("! is_wc_endpoint_url()"),'Dashboard body state relies on WC query registry');
assert(css.includes('form.woocommerce-EditAccountForm'),'Profile Woo form scoped');
assert(css.includes('button[name="save_account_details"]'),'Native Woo save button retained');
assert(css.includes('fieldset'),'Native password form retained');
assert(!account.includes('woocommerce_edit_account_form_start'),'No duplicate profile fields');
assert(checkout.includes(':has(input[type="radio"]:checked)'), 'Checked shipping radio has themed state');
assert(checkout.includes('sf-checkout-step-2'),'Only delivery step is styled');
assert(checkout.includes('woocommerce-shipping-methods'),'Support native method list');
assert(!checkout.includes('input[type="radio"]{display:none'),'Shipping input accessible');
console.log('Preferences endpoint, profile and delivery controls contracts OK');
