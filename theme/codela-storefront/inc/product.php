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

/**
 * Recompose only already-enabled Codela module callbacks. Never instantiate a
 * module, read its private settings, or duplicate its calculations/REST/JS.
 * Public WP_Hook callbacks let us retain the same instance and accepted args
 * even when a merchant chose a different summary priority in the plugin.
 */
function codela_sf_product_modules(): void {
    if ( ! function_exists( 'is_product' ) || ! is_product() ) { return; }
    global $wp_filter;
    $hook = $wp_filter['woocommerce_single_product_summary'] ?? null;
    if ( ! $hook instanceof WP_Hook ) { return; }
    $placements = [
        'Codela\\Modules\\LiveVisitor\\Module' => [ 'render_counter_container', 'woocommerce_product_thumbnails', 30 ],
        'Codela\\Modules\\UrgencyBadge\\Module' => [ 'render', 'woocommerce_single_product_summary', 11 ],
        'Codela\\Modules\\DeliveryEta\\Module' => [ 'render', 'woocommerce_single_product_summary', 32 ],
        'Codela\\Modules\\FreeShippingBar\\Module' => [ 'render_product', 'woocommerce_single_product_summary', 33 ],
        'Codela\\Modules\\WhatsappButton\\Module' => [ 'render_product', 'woocommerce_single_product_summary', 35 ],
        'Codela\\Modules\\TrustBadges\\Module' => [ 'render', 'woocommerce_after_single_product_summary', 12 ],
    ];
    foreach ( $hook->callbacks as $priority => $callbacks ) {
        foreach ( $callbacks as $entry ) {
            $callback = $entry['function'];
            if ( ! is_array( $callback ) || ! is_object( $callback[0] ) ) { continue; }
            $placement = $placements[ get_class( $callback[0] ) ] ?? null;
            if ( ! $placement || $callback[1] !== $placement[0] ) { continue; }
            remove_action( 'woocommerce_single_product_summary', $callback, $priority );
            $render = $callback;
            if ( 'render_counter_container' === $callback[1] || 'Codela\\Modules\\WhatsappButton\\Module' === get_class( $callback[0] ) ) {
                $render = static function() use ( $callback ) { codela_sf_product_module_output( $callback ); };
            }
            add_action( $placement[1], $render, $placement[2], (int) $entry['accepted_args'] );
        }
    }
    // Optional site-wide contact remains functional after its shared plugin
    // stylesheet is removed on product pages. Reuse the same IconButton.
    $footer = $wp_filter['wp_footer'] ?? null;
    if ( $footer instanceof WP_Hook ) {
        foreach ( $footer->callbacks as $priority => $callbacks ) {
            foreach ( $callbacks as $entry ) {
                $callback = $entry['function'];
                if ( is_array( $callback ) && is_object( $callback[0] )
                    && 'Codela\\Modules\\WhatsappButton\\Module' === get_class( $callback[0] ) && 'render_floating' === $callback[1] ) {
                    remove_action( 'wp_footer', $callback, $priority );
                    add_action( 'wp_footer', static function() use ( $callback ) { codela_sf_product_module_output( $callback ); }, $priority );
                }
            }
        }
    }
}

/** Decorate original, escaped module markup with shared component classes. */
function codela_sf_product_module_output( array $callback ): void {
    ob_start();
    call_user_func( $callback );
    $html = (string) ob_get_clean();
    $tags = new WP_HTML_Tag_Processor( $html );
    while ( $tags->next_tag() ) {
        if ( 'codela-live-visitor-container' === $tags->get_attribute( 'id' ) ) { $tags->add_class( 'sf-product-visitor' ); }
        if ( $tags->has_class( 'cdl-wa-ico' ) || $tags->has_class( 'cdl-wa-float' ) ) {
            foreach ( codela_sf_ui_icon_button_classes( 'soft' ) as $class ) { $tags->add_class( $class ); }
        }
    }
    $html = $tags->get_updated_html();
    if ( 'render_floating' === $callback[1] && '' !== trim( $html ) ) {
        $html = '<div class="sf-product-plugin-footer">' . $html . '</div>';
    }
    echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- original escaped module output; only controlled classes/wrapper added.
}

/** One CSS owner on product pages; scripts and every other page stay native. */
function codela_sf_product_module_styles(): void {
    if ( ! function_exists( 'is_product' ) || ! is_product() ) { return; }
    // Shared saved corner/font tokens may have been attached to a plugin
    // handle before the theme enqueued. Retain those settings on our sole
    // product handle rather than retaining the plugin's component paint.
    $tokens = function_exists( 'codela_storefront_design_tokens' ) ? codela_storefront_design_tokens() : null;
    if ( is_array( $tokens ) ) {
        wp_add_inline_style( 'codela-storefront-product', 'body{--cdl-ct-radius:' . $tokens[0]
            . ';--cdl-ct-box-radius:' . $tokens[1] . ';'
            . ( null !== $tokens[2] ? '--cdl-ct-font:' . $tokens[2] . ';' : '' ) . '}' );
    }
    foreach ( [ 'conversion-tools', 'live-visitor', 'urgency-badge', 'delivery-eta', 'free-shipping-bar', 'trust-badges', 'whatsapp-button' ] as $handle ) {
        wp_dequeue_style( 'codela-' . $handle );
    }
    // The optional global WhatsApp link shares its stylesheet with the inline
    // one, so the theme owns its presentation too, only on this product page.
}
add_action( 'wp_print_styles', 'codela_sf_product_module_styles', 110 );

function codela_sf_product_description_heading( string $heading ): string {
    return doing_action( 'codela_sf_product_information' ) ? '' : $heading;
}
add_filter( 'woocommerce_product_description_heading', 'codela_sf_product_description_heading' );
add_filter( 'woocommerce_product_additional_information_heading', 'codela_sf_product_description_heading' );

add_action( 'wp', function() {
    if ( ! function_exists( 'is_product' ) || ! is_product() ) { return; }
    add_action( 'woocommerce_single_product_summary', function() { echo '<div class="sf-product-price-row">'; }, 9 );
    add_action( 'woocommerce_single_product_summary', function() { echo '</div>'; }, 12 );
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
add_action( 'wp', 'codela_sf_product_modules', 100 );

