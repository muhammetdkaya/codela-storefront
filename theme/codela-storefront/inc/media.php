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
    // ClassicTemplate installs __return_true at priority 10 during render.
    // Inline click-zoom consumes touch clicks before the native lightbox link.
    // The lightbox remains the product image's single enlargement action.
    add_filter( 'woocommerce_single_product_zoom_enabled', function( $enabled ) {
        return function_exists( 'is_product' ) && is_product() ? false : $enabled;
    }, 100 );
    add_filter( 'woocommerce_single_product_image_thumbnail_html', function( string $html, $attachment_id = 0 ): string {
        // Only promote the featured image; all other Woo gallery slides keep
        // their native lazy loading and slider/variation functionality.
        global $product;
        $main_id = is_object( $product ) && method_exists( $product, 'get_image_id' )
            ? (int) $product->get_image_id() : 0;
        $is_hero = function_exists( 'is_product' ) && is_product()
            && $main_id > 0 && $main_id === (int) $attachment_id;
        // FlexSlider copies data-thumb-sizes to its native thumbnail images.
        // The rail paints 46px images on mobile and 48px on desktop.
        $thumb_tags = new WP_HTML_Tag_Processor( $html );
        if ( $thumb_tags->next_tag( [ 'class_name' => 'woocommerce-product-gallery__image' ] )
            && null !== $thumb_tags->get_attribute( 'data-thumb' ) ) {
            $thumb_tags->set_attribute( 'data-thumb-sizes', '48px' );
            $html = $thumb_tags->get_updated_html();
        }
        $tags = new WP_HTML_Tag_Processor( $html );
        if ( $tags->next_tag( 'a' ) ) {
            $tags->set_attribute( 'aria-label', __( 'Enlarge product image', 'codela-storefront' ) );
            $tags->set_attribute( 'aria-haspopup', 'dialog' );
        }
        if ( $tags->next_tag( 'img' ) ) {
            if ( $is_hero ) {
                $tags->set_attribute( 'loading', 'eager' );
                $tags->set_attribute( 'fetchpriority', 'high' );
            } elseif ( function_exists( 'is_product' ) && is_product() && $attachment_id ) {
                // Reuse Woo's native thumbnail until this slide is selected.
                // The original image URL, srcset and sizes remain in data attrs;
                // PhotoSwipe's href and data-large_image are never changed.
                $thumb = new WP_HTML_Tag_Processor( $html );
                if ( $thumb->next_tag( [ 'class_name' => 'woocommerce-product-gallery__image' ] ) ) {
                    $preview = $thumb->get_attribute( 'data-thumb' );
                    $source = $tags->get_attribute( 'src' );
                    if ( is_string( $preview ) && is_string( $source ) && $preview && $source && $preview !== $source ) {
                        $tags->set_attribute( 'data-sf-gallery-src', $source );
                        $srcset = $tags->get_attribute( 'srcset' );
                        $sizes = $tags->get_attribute( 'sizes' );
                        if ( is_string( $srcset ) && $srcset ) {
                            $tags->set_attribute( 'data-sf-gallery-srcset', $srcset );
                            $tags->remove_attribute( 'srcset' );
                        }
                        if ( is_string( $sizes ) && $sizes ) {
                            $tags->set_attribute( 'data-sf-gallery-sizes', $sizes );
                            $tags->remove_attribute( 'sizes' );
                        }
                        $tags->set_attribute( 'src', $preview );
                        $tags->set_attribute( 'loading', 'lazy' );
                        $tags->set_attribute( 'fetchpriority', 'low' );
                    }
                }
            }
        }
        return $tags->get_updated_html();
    }, 10, 2 );
    // Select a responsive logo size matching its real painted header width,
    // rather than choosing a near-full-resolution source for a tiny logo.
    add_filter( 'get_custom_logo', function( string $html ): string {
        $id = (int) get_theme_mod( 'custom_logo' );
        $metadata = $id ? wp_get_attachment_metadata( $id ) : false;
        if ( ! is_array( $metadata ) || empty( $metadata['width'] ) || empty( $metadata['height'] ) ) {
            return $html;
        }
        $display_width = max( 1, (int) ceil( 34 * (int) $metadata['width'] / (int) $metadata['height'] ) );
        $desktop = min( 180, $display_width );
        $mobile = min( 145, $display_width );
        $tags = new WP_HTML_Tag_Processor( $html );
        if ( $tags->next_tag( 'img' ) ) {
            $tags->set_attribute( 'sizes', "(max-width: 700px) {$mobile}px, {$desktop}px" );
        }
        return $tags->get_updated_html();
    } );
} );

add_action( 'init', function() {
    // Standard Gallery blocks can select this style without a new custom block or script.
    if ( ! function_exists( 'register_block_style' ) ) { return; }
    wp_register_style( 'codela-storefront-tokens', get_template_directory_uri() . '/assets/styles/tokens.css', [], codela_sf_style_version() );
    wp_register_style( 'codela-storefront-gallery', get_template_directory_uri() . '/assets/styles/gallery.css', [ 'codela-storefront-tokens' ], codela_sf_style_version() );
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
    // Product details start directly with the title; no breadcrumb trail.
    remove_action( 'woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 );
} );
