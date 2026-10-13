<?php
/** Shared gallery presentation; native Woo and WordPress retain their own media behavior. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_gallery_classes( array $classes ): array {
    $classes[] = 'sf-ui-gallery';
    $classes[] = 'sf-ui-gallery--hero';
    return array_values( array_unique( $classes ) );
}

function codela_sf_gallery_options( array $options ): array {
    $settings = codela_theme_settings();
    $options['touch'] = true;
    $options['slideshow'] = false;
    $options['animationLoop'] = false;
    $options['controlNav'] = in_array( $settings['product_gallery_thumbnails'] ?? true, [ false, 0, '0', '' ], true ) ? false : 'thumbnails';
    return $options;
}

add_action( 'after_setup_theme', function() {
    add_filter( 'woocommerce_single_product_image_gallery_classes', 'codela_sf_gallery_classes' );
    add_filter( 'woocommerce_single_product_carousel_options', 'codela_sf_gallery_options' );
} );

add_action( 'init', function() {
    // Standard Gallery blocks can select this style without a new custom block or script.
    if ( ! function_exists( 'register_block_style' ) ) { return; }
    wp_register_style( 'codela-storefront-tokens', get_template_directory_uri() . '/assets/styles/tokens.css', [], '0.1.60' );
    wp_register_style( 'codela-storefront-gallery', get_template_directory_uri() . '/assets/styles/gallery.css', [ 'codela-storefront-tokens' ], '0.1.60' );
    register_block_style( 'core/gallery', [
        'name' => 'sf-media-slider',
        'label' => __( 'Sliding gallery', 'codela-storefront' ),
        'style_handle' => 'codela-storefront-gallery',
    ] );
    add_filter( 'render_block_core/gallery', function( string $html ): string {
        if ( ! str_contains( $html, 'is-style-sf-media-slider' ) ) { return $html; }
        $tags = new WP_HTML_Tag_Processor( $html );
        if ( $tags->next_tag( [ 'class_name' => 'is-style-sf-media-slider' ] ) ) {
            $tags->set_attribute( 'tabindex', '0' );
            if ( null === $tags->get_attribute( 'aria-label' ) ) {
                $tags->set_attribute( 'aria-label', __( 'Image gallery', 'codela-storefront' ) );
            }
        }
        return $tags->get_updated_html();
    } );
} );

add_action( 'wp', function() {
    if ( ! function_exists( 'is_product' ) || ! is_product() ) { return; }
    // Keep the native breadcrumb, below the edge-to-edge gallery and above the title.
    remove_action( 'woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 );
    add_action( 'woocommerce_single_product_summary', 'woocommerce_breadcrumb', 1 );
} );
