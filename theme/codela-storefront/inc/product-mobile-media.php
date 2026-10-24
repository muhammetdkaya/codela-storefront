<?php
/** Product-detail art direction. WooCommerce catalog image IDs are never filtered. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_mobile_image_ids( $value ): array {
    if ( ! is_array( $value ) ) { return []; }
    return array_values( array_unique( array_filter( array_map( 'absint', array_filter( $value, static function( $id ) { return is_int( $id ) || ( is_string( $id ) && ctype_digit( $id ) ); } ) ), static function( $id ) {
        return $id > 0 && wp_attachment_is_image( $id );
    } ) ) );
}
function codela_sf_product_mobile_media( int $id ): array {
    $value = get_post_meta( $id, '_codela_sf_mobile_media', true );
    $value = is_array( $value ) ? $value : [];
    return [ 'featured' => codela_sf_mobile_image_ids( [ $value['featured'] ?? 0 ] )[0] ?? 0,
        'gallery' => codela_sf_mobile_image_ids( $value['gallery'] ?? [] ) ];
}
add_action( 'add_meta_boxes_product', static function() {
    add_meta_box( 'codela-sf-mobile-media', __( 'Mobile product images', 'codela-storefront' ), 'codela_sf_mobile_media_box', 'product', 'side' );
} );
function codela_sf_mobile_media_box( $post ): void {
    $media = codela_sf_product_mobile_media( (int) $post->ID );
    wp_nonce_field( 'codela_sf_mobile_media', 'codela_sf_mobile_media_nonce' );
    echo '<p>' . esc_html__( 'Only shown in the mobile product gallery (up to 900px). Catalog cards always use WooCommerce images. Empty fields use the standard images.', 'codela-storefront' ) . '</p>';
    foreach ( [ 'featured' => __( 'Mobile featured image', 'codela-storefront' ), 'gallery' => __( 'Mobile gallery', 'codela-storefront' ) ] as $key => $label ) {
        $ids = 'featured' === $key ? array_filter( [ $media['featured'] ] ) : $media['gallery'];
        echo '<div data-sf-mobile-field="' . esc_attr( $key ) . '"><p><strong>' . esc_html( $label ) . '</strong></p><input type="hidden" name="codela_sf_mobile_' . esc_attr( $key ) . '" value="' . esc_attr( implode( ',', $ids ) ) . '"><div data-sf-mobile-preview>';
        foreach ( $ids as $id ) { echo wp_get_attachment_image( $id, 'thumbnail', false, [ 'style' => 'width:60px;height:75px;object-fit:cover;margin:2px;' ] ); }
        echo '</div><p><button type="button" class="button" data-sf-mobile-select>' . esc_html__( 'Select images', 'codela-storefront' ) . '</button> <button type="button" class="button-link-delete" data-sf-mobile-clear>' . esc_html__( 'Remove', 'codela-storefront' ) . '</button></p></div>';
    }
    echo '<p class="description">' . esc_html__( 'Reopen the gallery to reorder images by dragging them.', 'codela-storefront' ) . '</p>';
}
add_action( 'admin_enqueue_scripts', static function() {
    $screen = get_current_screen();
    if ( ! $screen || 'product' !== $screen->post_type || 'post' !== $screen->base ) { return; }
    wp_enqueue_media();
    wp_enqueue_script( 'codela-sf-product-mobile-media', get_template_directory_uri() . '/assets/scripts/product-mobile-media-admin.js', [ 'media-editor' ], codela_sf_style_version(), true );
} );
add_action( 'save_post_product', static function( $id ) {
    if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $id ) || ! current_user_can( 'edit_post', $id ) ) { return; }
    $nonce = $_POST['codela_sf_mobile_media_nonce'] ?? null;
    if ( ! is_string( $nonce ) || ! wp_verify_nonce( $nonce, 'codela_sf_mobile_media' ) ) { return; }
    $fields = [];
    foreach ( [ 'featured', 'gallery' ] as $key ) {
        $raw = $_POST[ 'codela_sf_mobile_' . $key ] ?? null;
        // Reject partial or malformed submissions atomically; quick edits keep existing data.
        if ( ! is_string( $raw ) || ! preg_match( '/^(?:[1-9][0-9]*(?:,[1-9][0-9]*)*)?$/D', $raw ) ) { return; }
        $ids = '' === $raw ? [] : array_map( 'absint', explode( ',', $raw ) );
        if ( count( $ids ) > 100 || ( 'featured' === $key && count( $ids ) > 1 ) ) { return; }
        foreach ( $ids as $attachment_id ) { if ( ! wp_attachment_is_image( $attachment_id ) ) { return; } }
        $fields[ $key ] = codela_sf_mobile_image_ids( $ids );
    }
    update_post_meta( $id, '_codela_sf_mobile_media', [ 'featured' => $fields['featured'][0] ?? 0, 'gallery' => $fields['gallery'] ] );
} );

/** Paired slots allow independent gallery lengths without two carousel instances. */
function codela_sf_mobile_gallery_pairs( $product ): array {
    $mobile = codela_sf_product_mobile_media( (int) $product->get_id() );
    $desktop = array_merge( [ (int) $product->get_image_id() ], $product->get_gallery_image_ids() );
    $portrait = array_merge( [ $mobile['featured'] ?: $desktop[0] ], $mobile['gallery'] ?: array_slice( $desktop, 1 ) );
    $pairs = [];
    for ( $i = 0; $i < max( count( $desktop ), count( $portrait ) ); $i++ ) {
        $pairs[] = [ $desktop[$i] ?? 0, $portrait[$i] ?? 0 ];
    }
    return $pairs;
}
add_action( 'wp', static function() {
    if ( ! function_exists( 'is_product' ) || ! is_product() ) { return; }
    global $product;
    $current = wc_get_product( get_queried_object_id() );
    if ( ! $current || ! $current->get_image_id() ) { return; }
    $mobile = codela_sf_product_mobile_media( (int) $current->get_id() );
    if ( ! $mobile['featured'] && ! $mobile['gallery'] ) { return; }
    remove_action( 'woocommerce_before_single_product_summary', 'woocommerce_show_product_images', 20 );
    add_action( 'woocommerce_before_single_product_summary', 'codela_sf_render_mobile_gallery', 20 );
} );
function codela_sf_render_mobile_gallery(): void {
    global $product;
    $classes = apply_filters( 'woocommerce_single_product_image_gallery_classes', [ 'woocommerce-product-gallery', 'woocommerce-product-gallery--with-images', 'woocommerce-product-gallery--columns-4', 'images' ] );
    echo '<div class="' . esc_attr( implode( ' ', $classes ) ) . '" data-columns="4" style="opacity:1"><div class="woocommerce-product-gallery__wrapper">';
    foreach ( codela_sf_mobile_gallery_pairs( $product ) as $index => $pair ) {
        $GLOBALS['codela_sf_mobile_gallery_slot'] = [ 'desktop' => $pair[0], 'mobile' => $pair[1], 'hero' => 0 === $index ];
        try {
            echo apply_filters( 'woocommerce_single_product_image_thumbnail_html', wc_get_gallery_image_html( $pair[0] ?: $pair[1], 0 === $index ), $pair[0] ?: $pair[1] );
        } finally { unset( $GLOBALS['codela_sf_mobile_gallery_slot'] ); }
    }
    // Preserve extension hooks (including Codela's live visitor counter),
    // excluding only the native thumbnails already rendered above.
    $priority = has_action( 'woocommerce_product_thumbnails', 'woocommerce_show_product_thumbnails' );
    if ( false !== $priority ) { remove_action( 'woocommerce_product_thumbnails', 'woocommerce_show_product_thumbnails', $priority ); }
    try { do_action( 'woocommerce_product_thumbnails' ); }
    finally { if ( false !== $priority ) { add_action( 'woocommerce_product_thumbnails', 'woocommerce_show_product_thumbnails', $priority ); } }
    echo '</div></div>';
}

/** Called only by the gallery renderer, after native image delivery attributes. */
function codela_sf_mobile_gallery_picture( string $html ): string {
    $slot = $GLOBALS['codela_sf_mobile_gallery_slot'] ?? null;
    if ( ! $slot ) { return $html; }
    $mobile_id = (int) $slot['mobile'];
    $tags = new WP_HTML_Tag_Processor( $html );
    if ( $tags->next_tag( 'div' ) ) {
        $tags->set_attribute( 'data-sf-gallery-device', ! $slot['desktop'] ? 'mobile' : ( ! $mobile_id ? 'desktop' : 'both' ) );
        if ( $mobile_id ) { $tags->set_attribute( 'data-sf-mobile-thumb', wp_get_attachment_image_url( $mobile_id, 'thumbnail' ) ); }
    }
    $html = $tags->get_updated_html();
    if ( ! $mobile_id || $mobile_id === (int) $slot['desktop'] ) { return $html; }
    $full = wp_get_attachment_image_src( $mobile_id, 'full' );
    $source = wp_get_attachment_image_src( $mobile_id, $slot['hero'] ? 'woocommerce_single' : 'medium' );
    if ( ! $full || ! $source ) { return $html; }
    $set = wp_get_attachment_image_srcset( $mobile_id, 'woocommerce_single' ) ?: $full[0];
    $tags = new WP_HTML_Tag_Processor( $html );
    if ( $tags->next_tag( 'img' ) ) {
        foreach ( [ 'url' => $full[0], 'width' => $full[1], 'height' => $full[2], 'alt' => get_post_meta( $mobile_id, '_wp_attachment_image_alt', true ) ] as $key => $value ) {
            $tags->set_attribute( 'data-sf-mobile-' . $key, $value );
        }
    }
    $source_html = '<source media="(max-width:900px)" sizes="100vw" srcset="' . esc_attr( $slot['hero'] ? $set : $source[0] ) . '"' . ( $slot['hero'] ? '' : ' data-sf-gallery-srcset="' . esc_attr( $set ) . '"' ) . '>';
    return preg_replace_callback( '/<img\b[^>]*>/', static function( $match ) use ( $source_html ) { return '<picture>' . $source_html . $match[0] . '</picture>'; }, $tags->get_updated_html(), 1 );
}
