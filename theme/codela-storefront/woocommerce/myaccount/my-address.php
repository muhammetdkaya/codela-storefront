<?php
/**
 * Checkout Pro renders its address book on this endpoint at priority 20.
 * Suppress only duplicate WooCommerce address cards. If the module is not
 * active, fall back to WooCommerce's original address list template.
 *
 * @version 9.3.0
 */
defined( 'ABSPATH' ) || exit;
$hook = $GLOBALS['wp_filter']['woocommerce_account_edit-address_endpoint'] ?? null;
$has_codela_address_book = false;
if ( is_object( $hook ) && isset( $hook->callbacks ) && is_array( $hook->callbacks ) ) {
    foreach ( $hook->callbacks as $callbacks ) {
        foreach ( $callbacks as $callback ) {
            $handler = $callback['function'] ?? null;
            if ( is_array( $handler ) && isset( $handler[0], $handler[1] )
                && is_object( $handler[0] )
                && $handler[0] instanceof \Codela\Modules\CheckoutPro\Module
                && 'render_manage_link_on_edit_address' === $handler[1] ) {
                $has_codela_address_book = true;
                break 2;
            }
        }
    }
}
if ( ! $has_codela_address_book ) {
    include WC()->plugin_path() . '/templates/myaccount/my-address.php';
}
