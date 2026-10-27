<?php
/**
 * Native cross-document View Transitions for Woo's document-owned pages.
 * A visual bridge only: each document still loads its own Woo scripts, styles,
 * cart state, variation forms and gallery setup. No router or data hydration.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_document_continuity_allowed(): bool {
    if ( is_admin()
        || ( function_exists( 'is_preview' ) && is_preview() )
        || ( function_exists( 'is_customize_preview' ) && is_customize_preview() )
        || ( function_exists( 'is_checkout' ) && is_checkout() )
        || ( function_exists( 'is_cart' ) && is_cart() ) ) {
        return false;
    }
    if ( function_exists( 'is_account_page' ) && is_account_page() ) {
        return function_exists( 'is_user_logged_in' ) && is_user_logged_in()
            && ! ( function_exists( 'is_wc_endpoint_url' ) && ( is_wc_endpoint_url( 'customer-logout' ) || is_wc_endpoint_url( 'lost-password' ) ) );
    }
    if ( function_exists( 'is_page' ) && is_page() ) { return true; }
    if ( function_exists( 'codela_sections_validate_root' ) && function_exists( 'codela_sf_sections_capabilities' ) && codela_sf_sections_capabilities()['layout'] ) { return true; }
    if ( function_exists( 'is_product' ) && is_product() ) { return true; }
    if ( function_exists( 'is_shop' ) && is_shop() ) { return true; }
    if ( function_exists( 'is_product_category' ) && is_product_category() ) { return true; }
    if ( function_exists( 'is_product_tag' ) && is_product_tag() ) { return true; }
    return function_exists( 'codela_sf_seamless_allowed' ) && codela_sf_seamless_allowed();
}

/** Destination preview shares the native closed-sheet geometry, never Woo product data. */
function codela_sf_navigation_purchase_preview(): string {
    return '<section class="sf-navigation-purchase sf-ui-surface sf-ui-surface--glass-panel">'
        . '<header class="sf-product-sheet-header"><div class="sf-product-sheet-heading">'
        . '<span class="sf-navigation-heading-placeholder sf-navigation-heading-placeholder--title"></span>'
        . '<span class="sf-navigation-heading-placeholder sf-navigation-heading-placeholder--price"></span>'
        . '</div></header><div class="sf-navigation-controls">'
        . '<span class="sf-navigation-quantity"><span>−</span><span>1</span><span>+</span></span>'
        . codela_sf_ui_button( __( 'Add to cart', 'woocommerce' ), [ 'disabled' => true ] )
        . '</div></section>';
}
