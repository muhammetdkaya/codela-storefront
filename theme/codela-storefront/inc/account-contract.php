<?php
/**
 * Compatibility bridge: plugin owns account policy; older supported plugin
 * releases keep the original native WooCommerce behavior until upgraded.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_account_url(): string {
    if ( function_exists( 'codela_account_url' ) ) {
        return codela_account_url();
    }
    return function_exists( 'wc_get_page_permalink' ) ? (string) wc_get_page_permalink( 'myaccount' ) : '';
}

function codela_sf_registration_enabled(): bool {
    if ( function_exists( 'codela_account_registration_enabled' ) ) {
        return codela_account_registration_enabled();
    }
    return 'yes' === get_option( 'woocommerce_enable_myaccount_registration', 'no' );
}

function codela_sf_public_account_user( $user ): bool {
    if ( function_exists( 'codela_account_is_public_user' ) ) {
        return codela_account_is_public_user( $user );
    }
    if ( ! $user instanceof WP_User ) { return false; }
    $roles = (array) $user->roles;
    return ! empty( $roles ) && ! array_diff( $roles, [ 'customer', 'subscriber' ] )
        && ! user_can( $user, 'edit_posts' ) && ! user_can( $user, 'manage_woocommerce' )
        && ! user_can( $user, 'manage_options' );
}

/** No Woo function shims. The same shell reads explicit runtime capabilities. */
function codela_sf_commerce_available(): bool {
    return function_exists( 'wc_get_page_permalink' );
}
function codela_sf_is_account_context(): bool {
    return ( function_exists( 'is_account_page' ) && is_account_page() )
        || ( function_exists( 'codela_account_is_wordpress_page' ) && codela_account_is_wordpress_page() );
}
function codela_sf_is_cart_context(): bool {
    return function_exists( 'is_cart' ) && is_cart();
}
function codela_sf_is_checkout_context(): bool {
    return function_exists( 'is_checkout' ) && is_checkout();
}
function codela_sf_shop_url(): string {
    return codela_sf_commerce_available() ? (string) wc_get_page_permalink( 'shop' ) : '';
}
function codela_sf_cart_url(): string {
    return function_exists( 'wc_get_cart_url' ) ? (string) wc_get_cart_url() : '';
}
function codela_sf_checkout_url(): string {
    return function_exists( 'wc_get_checkout_url' ) ? (string) wc_get_checkout_url() : '';
}
