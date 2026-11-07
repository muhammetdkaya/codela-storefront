<?php
/** Native Woo login nonce refresh is read-only and reflects the real session. */
define( 'ABSPATH', __DIR__ );
$GLOBALS['auth_active'] = false;
$GLOBALS['payload'] = null;
$GLOBALS['nocache_called'] = false;
function add_action(...$args) {}
function add_filter(...$args) {}
function is_user_logged_in() { return $GLOBALS['auth_active']; }
function get_option($name,$default='') {
    return 'woocommerce_enable_myaccount_registration' === $name ? 'yes' : $default;
}
function wp_create_nonce($action) { return 'fresh-' . $action; }
function nocache_headers() { $GLOBALS['nocache_called'] = true; }
function wp_send_json($data) { $GLOBALS['payload'] = $data; }
function check($value,$reason) {
    if (!$value) throw new RuntimeException($reason);
}
require __DIR__ . '/../theme/codela-storefront/inc/account.php';
codela_sf_account_form_state();
check($GLOBALS['nocache_called'], 'Form nonces must never be cached');
check($GLOBALS['payload']['authenticated']===false, 'Guest state reflects a logged-out cookie');
check($GLOBALS['payload']['login_nonce']==='fresh-woocommerce-login', 'Correct Woo native login nonce action');
check($GLOBALS['payload']['register_nonce']==='fresh-woocommerce-register', 'Correct Woo native registration nonce action');
check($GLOBALS['payload']['registration']===true, 'WooCommerce registration setting is authoritative');
$GLOBALS['auth_active'] = true;
codela_sf_account_form_state();
check($GLOBALS['payload']['authenticated']===true, 'Old guest panel cannot override a new signed-in session');
echo "Instant account native form nonce checks passed\n";
