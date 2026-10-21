<?php
/** Shared gallery presentation; native Woo and WordPress retain their own media behavior. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Collect the actual rendered critical picture, not a guessed attachment URL.
 * Block templates render before wp_head, so core can preload its exact native
 * responsive sources before styles and module preloads start competing.
 */
function codela_sf_image_preloads( string $html = '' ): array {
    static $resources = [];
    if ( '' === $html ) { return $resources; }
    $picture = new WP_HTML_Tag_Processor( $html );
    $mobile = null;
    if ( $picture->next_tag( 'source' ) && '(max-width:700px)' === $picture->get_attribute( 'media' ) ) {
        $srcset = $picture->get_attribute( 'srcset' );
        if ( is_string( $srcset ) && $srcset ) {
            $mobile = [ 'as' => 'image', 'imagesrcset' => $srcset, 'imagesizes' => $picture->get_attribute( 'sizes' ) ?: '100vw', 'media' => '(max-width:700px)', 'fetchpriority' => 'high' ];
        }
    }
    $image = new WP_HTML_Tag_Processor( $html );
    if ( ! $image->next_tag( 'img' ) ) { return $resources; }
    $src = $image->get_attribute( 'src' );
    if ( ! is_string( $src ) || ! $src ) { return $resources; }
    $resource = [ 'as' => 'image', 'href' => $src, 'fetchpriority' => 'high' ];
    $srcset = $image->get_attribute( 'srcset' );
    if ( is_string( $srcset ) && $srcset ) {
        $resource['imagesrcset'] = $srcset;
        $resource['imagesizes'] = $image->get_attribute( 'sizes' ) ?: '100vw';
    }
    if ( $mobile ) {
        $resource['media'] = '(min-width:701px)';
        $resources[] = $mobile;
    }
    $resources[] = $resource;
    return $resources;
}
add_filter( 'wp_preload_resources', static function( $resources ) {
    return array_merge( $resources, codela_sf_image_preloads() );
} );

/** Theme-owned below-fold delivery; originals remain the no-script fallback. */
function codela_sf_defer_media( string $html ): string {
    if ( ! codela_sf_image_preloads()
        || ( defined( 'REST_REQUEST' ) && REST_REQUEST )
        || ( defined( 'WP_CLI' ) && WP_CLI )
        || ( function_exists( 'is_admin' ) && is_admin() ) ) { return $html; }
    $image = new WP_HTML_Tag_Processor( $html );
    if ( ! $image->next_tag( 'img' ) || 'lazy' !== $image->get_attribute( 'loading' ) ) { return $html; }
    $src = $image->get_attribute( 'src' );
    if ( ! is_string( $src ) || ! $src || $image->get_attribute( 'data-sf-gallery-src' ) ) { return $html; }
    $width = (int) $image->get_attribute( 'width' );
    $height = (int) $image->get_attribute( 'height' );
    if ( $width < 1 || $height < 1 ) { return $html; }
    foreach ( [ 'src', 'srcset', 'sizes' ] as $attribute ) {
        $value = $image->get_attribute( $attribute );
        if ( is_string( $value ) && $value ) {
            $image->set_attribute( 'data-sf-media-' . $attribute, $value );
            $image->remove_attribute( $attribute );
        }
    }
    // Explicit width/height and existing CSS keep the exact original geometry.
    $image->set_attribute( 'src', 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22' . $width . '%22%20height=%22' . $height . '%22/%3E' );
    $deferred = new WP_HTML_Tag_Processor( $image->get_updated_html() );
    while ( $deferred->next_tag( 'source' ) ) {
        $srcset = $deferred->get_attribute( 'srcset' );
        if ( is_string( $srcset ) && $srcset ) {
            $deferred->set_attribute( 'data-sf-media-srcset', $srcset );
            $deferred->remove_attribute( 'srcset' );
        }
    }
    $GLOBALS['codela_sf_deferred_media'] = true;
    return $deferred->get_updated_html() . '<noscript>' . $html . '</noscript>';
}
add_action( 'wp_head', static function() {
    if ( empty( $GLOBALS['codela_sf_deferred_media'] ) ) { return; }
    // Inline and dependency-free: lower images never depend on another network
    // request, Woo startup or the theme's interactive shell becoming ready.
    wp_print_inline_script_tag( file_get_contents( __DIR__ . '/../assets/scripts/media-loading.js' ), [ 'id' => 'sf-media-loading' ] );
    echo '<noscript><style>img[data-sf-media-src]{display:none!important}picture:has(>img[data-sf-media-src]){display:none!important}</style></noscript>';
}, 2 );

function codela_sf_gallery_classes( array $classes ): array {
    $classes[] = 'sf-ui-gallery';
    $classes[] = 'sf-ui-gallery--hero';
    $classes[] = 'sf-ui-gallery--scroll';
    $settings = codela_theme_settings();
    if ( in_array( $settings['product_gallery_thumbnails'] ?? true, [ false, 0, '0', '' ], true ) ) {
        $classes[] = 'sf-ui-gallery--no-thumbs';
    }
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
    // Native scrolling and inline zoom are the active product presentation.
    // Prevent Woo's classic block from enqueueing unused slider/lightbox assets.
    foreach ( [ 'slider', 'lightbox' ] as $feature ) {
        add_filter( 'current_theme_supports-wc-product-gallery-' . $feature, static function( $supported ) {
            return function_exists( 'is_product' ) && is_product() ? false : $supported;
        } );
    }
    add_filter( 'woocommerce_single_product_image_gallery_classes', 'codela_sf_gallery_classes' );
    add_filter( 'woocommerce_single_product_carousel_options', 'codela_sf_gallery_options' );
    // With FlexSlider disabled Woo otherwise renders secondary photos at the
    // cropped gallery-thumbnail size. All full-frame photos need single size.
    add_filter( 'woocommerce_gallery_image_size', function( $size ) {
        return function_exists( 'is_product' ) && is_product() ? 'woocommerce_single' : $size;
    } );
    // Native scrolling replaces the slider track for this product composition.
    // Woo's image nodes and variation updates remain the owners.
    add_filter( 'woocommerce_single_product_flexslider_enabled', function( $enabled ) {
        return function_exists( 'is_product' ) && is_product() ? false : $enabled;
    }, 100 );
    // ClassicTemplate installs __return_true at priority 10 during render.
    // The existing Woo zoom plugin is initialized on demand by the adapter.
    // Do not auto-download zoom images or open a second fullscreen gallery.
    add_filter( 'woocommerce_single_product_photoswipe_enabled', function( $enabled ) {
        return function_exists( 'is_product' ) && is_product() ? false : $enabled;
    }, 100 );
    add_filter( 'woocommerce_single_product_zoom_enabled', function( $enabled ) {
        return function_exists( 'is_product' ) && is_product() ? false : $enabled;
    }, 100 );
    add_filter( 'woocommerce_single_product_image_thumbnail_html', function( string $html, $attachment_id = 0 ): string {
        // Only the featured image is eager; other full-size native photos
        // retain responsive selection and browser lazy loading.
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
            if ( function_exists( 'is_product' ) && is_product() ) {
                $tags->remove_attribute( 'aria-haspopup' );
            } else {
                $tags->set_attribute( 'aria-haspopup', 'dialog' );
            }
        }
        if ( $tags->next_tag( 'img' ) ) {
            if ( function_exists( 'is_product' ) && is_product() && function_exists( 'codela_sf_image_framing_attributes' ) ) {
                foreach ( codela_sf_image_framing_attributes( (int) $attachment_id, [ 'style' => $tags->get_attribute( 'style' ) ?? '' ] ) as $name => $value ) {
                    $tags->set_attribute( $name, $value );
                }
            }
            // Only after an admin-verified PNG conversion: browser chooses
            // responsive WebP, while Woo's original image link and zoom data
            // continue pointing at the untouched full-resolution upload.
            $webp = (int) $attachment_id > 0 && function_exists( 'codela_sf_png_webp_sources' )
                && function_exists( 'is_product' ) && is_product()
                ? codela_sf_png_webp_sources( (int) $attachment_id ) : [];
            if ( $webp ) {
                $candidates = [];
                foreach ( $webp as $source ) {
                    $candidates[] = $source['url'] . ' ' . $source['width'] . 'w';
                }
                $tags->set_attribute( 'src', $webp[ count( $webp ) - 1 ]['url'] );
                $tags->set_attribute( 'srcset', implode( ', ', $candidates ) );
                // The native gallery is full bleed, including on desktop.
                $tags->set_attribute( 'sizes', '100vw' );
            }
            if ( $is_hero ) {
                $tags->set_attribute( 'loading', 'eager' );
                $tags->set_attribute( 'fetchpriority', 'high' );
                $sizes = $tags->get_attribute( 'sizes' );
                if ( is_string( $sizes ) ) { $tags->set_attribute( 'sizes', preg_replace( '/^auto,\s*/', '', $sizes ) ); }
            } elseif ( function_exists( 'is_product' ) && is_product() && $attachment_id ) {
                // A low-cost UNCROPPED preview keeps the same product framing.
                // Do not let native lazy heuristics fetch every multi-MB PNG
                // before the user starts browsing. Original responsive sources
                // are promoted by the existing gallery adapter on real intent.
                $preview = wp_get_attachment_image_src( (int) $attachment_id, 'medium' );
                $source = $tags->get_attribute( 'src' );
                if ( is_array( $preview ) && ! empty( $preview[0] ) && is_string( $source ) && $source !== $preview[0] ) {
                    $tags->set_attribute( 'data-sf-gallery-src', $source );
                    foreach ( [ 'srcset', 'sizes' ] as $attribute ) {
                        $value = $tags->get_attribute( $attribute );
                        if ( is_string( $value ) && $value ) {
                            $tags->set_attribute( 'data-sf-gallery-' . $attribute, $value );
                            $tags->remove_attribute( $attribute );
                        }
                    }
                    $tags->set_attribute( 'src', $preview[0] );
                }
                $tags->set_attribute( 'loading', 'lazy' );
                $tags->set_attribute( 'fetchpriority', 'low' );
            }
        }
        $html = $tags->get_updated_html();
        if ( $is_hero ) { codela_sf_image_preloads( $html ); }
        return $html;
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

