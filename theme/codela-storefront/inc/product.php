<?php
/** Product purchase composition; WooCommerce owns every input and submission. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'wp', function() {
    if ( ! function_exists( 'is_product' ) || ! is_product() ) { return; }
    // Wrap the existing quantity/button, inside the original Woo form.
    // No cloned controls, click proxy, extra endpoint or purchase controller.
    add_action( 'woocommerce_before_add_to_cart_button', function() {
        echo '<div class="sf-product-purchase">';
    }, 0 );
    add_action( 'woocommerce_after_add_to_cart_button', function() {
        echo '</div>';
    }, PHP_INT_MAX );
} );
