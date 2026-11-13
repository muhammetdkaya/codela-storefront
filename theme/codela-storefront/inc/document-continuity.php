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
    if ( function_exists( 'is_home' ) && is_home() || function_exists( 'is_singular' ) && is_singular( 'post' ) ) { return true; }
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
        . '<header class="sf-product-sheet-header">' . codela_sf_product_sheet_handle_svg() . '<div class="sf-product-sheet-heading">'
        . '<span class="sf-navigation-heading-title"><span class="sf-navigation-heading-placeholder sf-navigation-heading-placeholder--title"></span><span class="sf-navigation-shipping"><span class="sf-navigation-shipping-icon sf-navigation-heading-placeholder"></span><span class="sf-navigation-heading-placeholder sf-navigation-heading-placeholder--title-tail"></span></span></span>'
        . '</div></header><div class="sf-navigation-controls">'
        . '<span class="sf-navigation-price-placeholder sf-navigation-heading-placeholder" aria-hidden="true"></span>'
        . codela_sf_ui_button( __( 'Add to cart', 'woocommerce' ), [ 'disabled' => true, 'class' => 'sf-navigation-buy-button' ] )
        . '</div></section>';
}


/**
 * Exact inert commerce skeleton used by BOTH navigation feedback and first
 * document paint. These placeholders have no form, price, coupon, customer
 * data, request or WooCommerce state. One markup source prevents drift.
 */
function codela_sf_commerce_skeleton_markup( string $kind ): string {
    if ( ! in_array( $kind, [ 'cart', 'checkout' ], true ) ) { return ''; }
    $shape = static function( string $name ): string {
        return '<i class="sf-skeleton-shape sf-commerce-shape sf-commerce-' . $name . '"></i>';
    };
    if ( 'cart' === $kind ) {
        $rows = '';
        for ( $i = 0; $i < 2; $i++ ) {
            $rows .= '<div class="sf-commerce-cart-row">'
                . $shape( 'cart-photo' )
                . '<div class="sf-commerce-cart-detail">'
                . $shape( 'cart-title' ) . $shape( 'cart-price' ) . $shape( 'cart-quantity' )
                . '</div>' . $shape( 'cart-remove' ) . '</div>';
        }
        return '<div class="sf-commerce-skeleton sf-commerce-skeleton--cart">'
            . '<div class="sf-commerce-cart-main">'
            . $shape( 'cart-count' ) . '<div class="sf-commerce-cart-rows">' . $rows . '</div>'
            . '</div>'
            . '<div class="sf-commerce-cart-footer">'
            . '<div class="sf-commerce-shipping">' . $shape( 'shipping-ring' ) . $shape( 'shipping-copy' ) . '</div>'
            . '<div class="sf-commerce-dark-action">'
            . '<span class="sf-commerce-action-summary"><small>' . esc_html__( 'Subtotal', 'codela-storefront' ) . '</small>' . $shape( 'action-price' ) . '</span>'
            . '<span class="sf-commerce-action-label">' . esc_html__( 'Checkout', 'codela-storefront' ) . '<span aria-hidden="true">→</span></span>'
            . '</div>'
            . '</div></div>';
    }
    $fields = '';
    for ( $i = 0; $i < 4; $i++ ) {
        $fields .= '<div class="sf-commerce-checkout-field">'
            . $shape( 'field-label' ) . $shape( 'field-input' ) . '</div>';
    }
    return '<div class="sf-commerce-skeleton sf-commerce-skeleton--checkout">'
        . '<div class="sf-commerce-checkout-main">'
        . '<div class="sf-commerce-checkout-stepper">'
        . $shape( 'step-index' ) . $shape( 'step-title' )
        . '<div class="sf-commerce-step-track">' . $shape( 'step-segment' ) . $shape( 'step-segment' ) . $shape( 'step-segment' ) . '</div>'
        . '</div><div class="sf-commerce-checkout-fields">' . $fields . '</div>'
        . '</div>'
        . '<div class="sf-commerce-checkout-footer sf-commerce-dark-action">'
        . '<span class="sf-commerce-action-summary"><small>' . esc_html__( 'Estimated total', 'codela-storefront' ) . '</small>' . $shape( 'action-price' ) . '</span>'
        . '<span class="sf-commerce-action-label">' . esc_html__( 'Continue', 'codela-storefront' ) . '<span aria-hidden="true">→</span></span>'
        . '</div></div>';
}
