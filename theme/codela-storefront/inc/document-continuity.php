<?php
/**
 * Native cross-document View Transitions for Woo's document-owned pages.
 * A visual bridge only: each document still loads its own Woo scripts, styles,
 * cart state, variation forms and gallery setup. No router or data hydration.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_document_continuity_allowed(): bool {
    if ( is_admin() || ( function_exists( 'is_checkout' ) && is_checkout() )
        || ( function_exists( 'is_cart' ) && is_cart() )
        || ( function_exists( 'is_account_page' ) && is_account_page() ) ) {
        return false;
    }
    if ( function_exists( 'is_product' ) && is_product() ) { return true; }
    if ( function_exists( 'is_shop' ) && is_shop() ) { return true; }
    if ( function_exists( 'is_product_category' ) && is_product_category() ) { return true; }
    if ( function_exists( 'is_product_tag' ) && is_product_tag() ) { return true; }
    return function_exists( 'codela_sf_seamless_allowed' ) && codela_sf_seamless_allowed();
}
