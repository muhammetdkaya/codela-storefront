<?php
// Woo account hook fixture; native authentication remains WooCommerce-owned.
define( 'ABSPATH', __DIR__ );
$GLOBALS['hooks'] = [];
function add_action( $name, $fn, $priority = 10 ) { $GLOBALS['hooks'][ $name ] = $fn; }
function add_filter( $name, $fn, $priority = 10 ) { $GLOBALS['filters'][ $name ] = $fn; }
function is_account_page() { return getenv( 'ACCOUNT_OUTSIDE' ) !== '1'; }
function is_user_logged_in() { return getenv( 'ACCOUNT_SIGNED_IN' ) === '1'; }
function __( $text, $domain = '' ) { return $text; }
function esc_html_e( $text, $domain = '' ) { echo esc_html( $text ); }
function esc_attr_e( $text, $domain = '' ) { echo esc_html( $text ); }
function esc_html( $text ) { return htmlspecialchars((string)$text, ENT_QUOTES, 'UTF-8'); }
require __DIR__ . '/../theme/codela-storefront/inc/account.php';
$hook = getenv( 'ACCOUNT_SIGNED_IN' ) === '1' ? 'woocommerce_before_account_navigation' : 'woocommerce_before_customer_login_form';
if ( isset( $GLOBALS['hooks'][ $hook ] ) ) {
    call_user_func( $GLOBALS['hooks'][ $hook ] );
}
