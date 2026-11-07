<?php
/**
 * Isolated UX regression: the Woo setting is authoritative and eligible
 * customers always have a discoverable path to theme-only PIN settings.
 */
define( 'ABSPATH', __DIR__ );
define( 'DAY_IN_SECONDS', 86400 );
define( 'MINUTE_IN_SECONDS', 60 );
$GLOBALS['actions'] = [];
$GLOBALS['filters'] = [];
$GLOBALS['settings'] = [ 'woocommerce_enable_myaccount_registration' => 'no' ];
$GLOBALS['user'] = null;
$GLOBALS['devices'] = [];
$GLOBALS['admin'] = true;
$GLOBALS['screen'] = 'toplevel_page_codela-commerce-toolkit';
class WP_User {
    public function __construct(
        public int $ID = 14,
        public array $roles = [ 'customer' ],
        public string $user_login = 'test-customer',
        public string $display_name = 'Test Customer'
    ) {}
}
function add_action( $name, $callback, $priority = 10, $args = 1 ) { $GLOBALS['actions'][$name][] = $callback; }
function add_filter( $name, $callback, $priority = 10, $args = 1 ) { $GLOBALS['filters'][$name][] = $callback; }
function __( $t, $domain = '' ) { return $t; }
function esc_html__( $t, $domain = '' ) { return htmlspecialchars($t, ENT_QUOTES); }
function esc_html_e( $t, $domain = '' ) { echo esc_html__($t); }
function esc_attr_e( $t, $domain = '' ) { echo htmlspecialchars($t, ENT_QUOTES); }
function esc_attr( $t ) { return htmlspecialchars((string)$t, ENT_QUOTES); }
function esc_html( $t ) { return htmlspecialchars((string)$t, ENT_QUOTES); }
function esc_url( $t ) { return htmlspecialchars((string)$t, ENT_QUOTES); }
function get_option( $key, $default = '' ) { return $GLOBALS['settings'][$key] ?? $default; }
function get_current_screen() { return (object)['id'=>$GLOBALS['screen']]; }
function current_user_can( $cap ) { return $GLOBALS['admin']; }
function sanitize_key( $t ) { return preg_replace('/[^a-z0-9_-]/', '', strtolower($t)); }
function wp_unslash( $t ) { return stripslashes($t); }
function admin_url( $path ) { return 'https://store.test/wp-admin/' . $path; }
function wp_get_current_user() { return $GLOBALS['user']; }
function user_can( $user, $cap ) { return in_array('administrator', $user->roles, true); }
function is_ssl() { return true; }
function wc_get_account_endpoint_url( $endpoint ) { return 'https://store.test/my-account/' . $endpoint . '/'; }
function get_user_meta( $user_id, $key, $single = true ) {
    return $GLOBALS['devices'][$user_id][$key] ?? [];
}
function wp_date( $format, $timestamp ) { return gmdate('Y-m-d', $timestamp); }
function check( $ok, $message ) { if (!$ok) throw new RuntimeException($message); }

require __DIR__ . '/../theme/codela-storefront/inc/account.php';
require __DIR__ . '/../theme/codela-storefront/inc/quick-login.php';

$items = [ 'dashboard'=>'Dashboard', 'edit-account'=>'Account details', 'orders'=>'Orders' ];
foreach ($GLOBALS['filters']['woocommerce_account_menu_items'] as $filter) $items = $filter($items);
check($items['edit-account']==='Account information', 'Native edit-account route has recognizable label');
check($items['orders']==='Orders', 'Other native Woo endpoints untouched');
$_GET=['page'=>'codela-commerce-toolkit'];
ob_start();codela_sf_registration_settings_notice();$alert=ob_get_clean();
check(str_contains($alert,'Customer registration is disabled'), 'Disabled registration warns in Codela admin');
check(str_contains($alert,'admin.php?page=wc-settings&amp;tab=account'), 'Warning links WooCommerce settings');
$GLOBALS['settings']['woocommerce_enable_myaccount_registration'] = 'yes';
ob_start();codela_sf_registration_settings_notice();$enabled=ob_get_clean();
check($enabled==='', 'No warning when WooCommerce registration is enabled');
$GLOBALS['settings']['woocommerce_enable_myaccount_registration'] = 'no';
$_GET=['page'=>'some-other-page'];$GLOBALS['screen']='dashboard';
ob_start();codela_sf_registration_settings_notice();$other=ob_get_clean();
check($other==='', 'No unrelated admin screen notices');
$GLOBALS['screen'] = 'toplevel_page_codela-commerce-toolkit';
$GLOBALS['admin']=false;$_GET=['page'=>'codela-commerce-toolkit'];
ob_start();codela_sf_registration_settings_notice();$nonAdmin=ob_get_clean();
check($nonAdmin==='', 'No notice without permissions');

$GLOBALS['user'] = new WP_User(14, ['customer']);
ob_start();codela_sf_quick_dashboard_entry();$customer=ob_get_clean();
check(str_contains($customer,'edit-account/#sf-quick-settings'), 'Customer gets PIN settings deep link');
check(str_contains($customer,'Enable quick sign in'), 'New customer gets quick setup CTA');
ob_start();codela_sf_quick_settings();$form=ob_get_clean();
check(str_contains($form,'sf-quick-create') && str_contains($form,'sf-quick-enable'), 'Customer gets real PIN form');
$GLOBALS['devices'][14]['_codela_sf_quick_devices'] = ['abc'=>['created'=>time()]];
ob_start();codela_sf_quick_dashboard_entry();$existing=ob_get_clean();
check(str_contains($existing,'Manage quick sign-in'), 'PIN device management always discoverable');
$GLOBALS['user'] = new WP_User(1, ['administrator'], 'admin');
ob_start();codela_sf_quick_dashboard_entry();$administrator=ob_get_clean();
check(str_contains($administrator,'Administrator and staff accounts')&&!str_contains($administrator,'Enable quick sign in'), 'Admin gets security explanation, never a PIN action');
ob_start();codela_sf_quick_settings();$restricted=ob_get_clean();
check(str_contains($restricted,'sf-quick-role-notice')&&!str_contains($restricted,'sf-quick-create'), 'No admin PIN form, clear notice instead');
echo "Account settings discovery and registration warning contracts passed\n";
