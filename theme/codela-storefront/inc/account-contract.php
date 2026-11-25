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
