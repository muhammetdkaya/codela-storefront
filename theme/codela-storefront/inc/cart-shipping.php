<?php
/**
 * Theme-only adapter for the existing Codela Free Shipping Bar module.
 *
 * The module remains completely untouched. Its public render_cart() method
 * already owns the merchant settings, WooCommerce shipping zone, discount
 * handling, translated messages, and paid-shipping warning.
 *
 * The native Woo Store API cart response is the source of truth for each
 * custom cart refresh. No cached page state, duplicate threshold calculation
 * or additional network request is introduced.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Use the plugin's public module API only when it is actually enabled.
 * A fresh, non-initialized instance is sufficient for these read-only methods.
 */
function codela_sf_cart_shipping_module() {
    if ( ! function_exists( 'codela_is_module_active' )
        || ! codela_is_module_active( 'free-shipping-bar' )
        || ! class_exists( '\Codela\Modules\FreeShippingBar\Module' ) ) {
        return null;
    }
    return new \Codela\Modules\FreeShippingBar\Module( null );
}

/** Server-render the plugin's existing cart bar using the current WC session. */
function codela_sf_cart_shipping_extension_data(): array {
    $module = codela_sf_cart_shipping_module();
    if ( ! $module || empty( $module->get_settings()['show_cart'] ) ) {
        return [ 'html' => '' ];
    }
    // Public render_cart() already returns nothing for an empty cart,
    // a non-shipping cart or an unavailable zone threshold.
    ob_start();
    $module->render_cart();
    return [ 'html' => (string) ob_get_clean() ];
}

/**
 * Register a theme-owned Store API extension; WooCommerce may load its
 * Store API before or after the active theme's functions.php.
 */
function codela_sf_register_cart_shipping_extension(): void {
    static $registered = false;
    if ( $registered || ! function_exists( 'woocommerce_store_api_register_endpoint_data' )
        || ! class_exists( '\Automattic\WooCommerce\StoreApi\Schemas\V1\CartSchema' ) ) {
        return;
    }
    woocommerce_store_api_register_endpoint_data( [
        'endpoint'        => \Automattic\WooCommerce\StoreApi\Schemas\V1\CartSchema::IDENTIFIER,
        'namespace'       => 'codela-storefront-shipping',
        'data_callback'   => 'codela_sf_cart_shipping_extension_data',
        'schema_callback' => static function(): array {
            return [
                'html' => [
                    'description' => __( 'Current cart free-shipping progress supplied by the active Codela module.', 'codela-storefront' ),
                    'type'        => 'string',
                    'readonly'    => true,
                ],
            ];
        },
        'schema_type'     => ARRAY_A,
    ] );
    $registered = true;
}
add_action( 'woocommerce_blocks_loaded', 'codela_sf_register_cart_shipping_extension', 20 );
add_action( 'init', 'codela_sf_register_cart_shipping_extension', 30 );
