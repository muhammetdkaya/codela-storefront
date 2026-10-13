<?php
/** Product purchase composition; WooCommerce owns every input and submission. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_product_information_tabs( array $tabs ): array {
    if ( ! isset( $tabs['additional_information'] ) ) {
        $tabs['additional_information'] = [
            'title' => __( 'Additional information', 'woocommerce' ),
            'priority' => 20,
            'callback' => 'woocommerce_product_additional_information_tab',
        ];
    }
    return $tabs;
}

function codela_sf_product_stock_placement( string $html, $product ): string {
    // Keep variation availability in Woo's live selection data and AJAX responses.
    if ( ! is_product() || $product->is_type( 'variation' ) || doing_action( 'woocommerce_product_additional_information' ) ) {
        return $html;
    }
    return '';
}

add_action( 'wp', function() {
    if ( ! function_exists( 'is_product' ) || ! is_product() ) { return; }
    remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_meta', 40 );
    add_filter( 'woocommerce_product_tabs', 'codela_sf_product_information_tabs', 20 );
    add_filter( 'woocommerce_get_stock_html', 'codela_sf_product_stock_placement', 20, 2 );
    add_action( 'woocommerce_product_additional_information', 'woocommerce_template_single_meta', 20 );
    add_action( 'woocommerce_product_additional_information', function() {
        global $product;
        if ( $product ) { echo wc_get_stock_html( $product ); }
    }, 21 );
    // Wrap the existing quantity/button, inside the original Woo form.
    // No cloned controls, click proxy, extra endpoint or purchase controller.
    add_action( 'woocommerce_before_add_to_cart_button', function() {
        echo '<div class="sf-product-purchase">';
    }, 0 );
    add_action( 'woocommerce_after_add_to_cart_button', function() {
        echo '</div>';
    }, PHP_INT_MAX );
} );
