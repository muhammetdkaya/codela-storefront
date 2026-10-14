<?php
/** Native WordPress image derivatives, with a bounded manual backfill for old JPEGs. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** WordPress owns the responsive metadata and the original file. Never convert PNG/GIF. */
function codela_sf_webp_output( array $formats ): array {
    if ( function_exists( 'wp_image_editor_supports' )
        && wp_image_editor_supports( [ 'mime_type' => 'image/webp' ] ) ) {
        $formats['image/jpeg'] = 'image/webp';
    }
    return $formats;
}
add_filter( 'image_editor_output_format', 'codela_sf_webp_output', 20 );

/**
 * Opt in for an existing attachment, retaining each JPEG derivative and the full
 * original. Update only the metadata entries whose new WebP is smaller.
 * A failed or interrupted request cannot replace the image's source.
 */
function codela_sf_optimize_existing_image( int $id ): array {
    if ( 'image/jpeg' !== get_post_mime_type( $id ) ) {
        return [ 'status' => 'skipped', 'converted' => 0, 'saved' => 0 ];
    }
    if ( get_post_meta( $id, '_codela_sf_webp_v1', true ) ) {
        return [ 'status' => 'skipped', 'converted' => 0, 'saved' => 0 ];
    }
    if ( ! wp_image_editor_supports( [ 'mime_type' => 'image/webp' ] ) ) {
        return [ 'status' => 'unsupported', 'converted' => 0, 'saved' => 0 ];
    }
    $meta = wp_get_attachment_metadata( $id );
    $file = get_attached_file( $id );
    if ( ! is_array( $meta ) || empty( $meta['sizes'] ) || ! is_array( $meta['sizes'] )
        || ! is_string( $file ) || ! is_file( $file ) ) {
        return [ 'status' => 'skipped', 'converted' => 0, 'saved' => 0 ];
    }
    $editor = wp_get_image_editor( $file );
    if ( is_wp_error( $editor ) ) {
        return [ 'status' => 'error', 'converted' => 0, 'saved' => 0 ];
    }
    $converted = 0;
    $saved = 0;
    $attempted = 0;
    foreach ( $meta['sizes'] as $name => $size ) {
        if ( empty( $size['file'] ) || ! preg_match( '/\\.jpe?g$/i', $size['file'] )
            || empty( $size['width'] ) || empty( $size['height'] ) ) {
            continue;
        }
        // WordPress puts intermediate sizes alongside its attached image.
        // Do not follow nested or relative metadata paths supplied by plugins.
        if ( basename( $size['file'] ) !== $size['file'] ) { continue; }
        $old_path = dirname( $file ) . '/' . $size['file'];
        if ( ! is_file( $old_path ) ) { continue; }
        $attempted++;
        $result = $editor->make_subsize( [
            'width' => (int) $size['width'],
            'height' => (int) $size['height'],
            'crop' => true,
        ] );
        if ( is_wp_error( $result ) || ! is_array( $result )
            || 'image/webp' !== ( $result['mime-type'] ?? '' )
            || empty( $result['file'] ) ) {
            continue;
        }
        if ( basename( $result['file'] ) !== $result['file'] ) { continue; }
        $new_path = dirname( $file ) . '/' . $result['file'];
        $new_bytes = is_file( $new_path ) ? (int) filesize( $new_path ) : 0;
        $old_bytes = (int) filesize( $old_path );
        // Do not replace a valid JPEG reference with a missing or larger file.
        if ( $new_bytes <= 0 || $old_bytes <= 0 || $new_bytes >= $old_bytes ) {
            continue;
        }
        $meta['sizes'][ $name ] = $result;
        $converted++;
        $saved += $old_bytes - $new_bytes;
    }
    if ( $converted ) {
        if ( ! wp_update_attachment_metadata( $id, $meta ) ) {
            return [ 'status' => 'error', 'converted' => 0, 'saved' => 0 ];
        }
    }
    // Only mark completed work; a failed editor may be tried again.
    if ( $attempted && ! $converted ) {
        return [ 'status' => 'unchanged', 'converted' => 0, 'saved' => 0 ];
    }
    update_post_meta( $id, '_codela_sf_webp_v1', '1' );
    return [ 'status' => $converted ? 'optimized' : 'skipped', 'converted' => $converted, 'saved' => $saved ];
}

/** Administrative maintenance utility, not a second theme-settings interface. */
add_action( 'admin_menu', function() {
    if ( ! current_user_can( 'manage_options' ) ) { return; }
    add_media_page(
        __( 'Codela Image Optimization', 'codela-storefront' ),
        __( 'Image Optimization', 'codela-storefront' ),
        'manage_options',
        'codela-sf-media',
        'codela_sf_media_tools_page'
    );
} );
function codela_sf_media_tools_page(): void {
    if ( ! current_user_can( 'manage_options' ) ) { return; }
    $supported = wp_image_editor_supports( [ 'mime_type' => 'image/webp' ] );
    echo '<div class="wrap"><h1>' . esc_html__( 'Image Optimization', 'codela-storefront' ) . '</h1>';
    echo '<p>' . esc_html__( 'New JPEG uploads automatically receive WebP image sizes when the server supports WebP. Original files, image links and WooCommerce full-screen images remain intact.', 'codela-storefront' ) . '</p>';
    echo '<p>' . esc_html__( 'For older JPEG uploads, process existing intermediate sizes one attachment per request. No originals or previous JPEG derivatives are deleted. Stop by closing this page.', 'codela-storefront' ) . '</p>';
    if ( ! $supported ) {
        echo '<div class="notice notice-warning"><p>' . esc_html__( 'This server image editor does not support WebP encoding. Nothing will be converted.', 'codela-storefront' ) . '</p></div>';
    } else {
        echo '<p><button type="button" id="sf-optimize-run" class="button button-primary">' . esc_html__( 'Optimize existing images', 'codela-storefront' ) . '</button> ';
        echo '<button type="button" id="sf-optimize-stop" class="button" disabled>' . esc_html__( 'Stop', 'codela-storefront' ) . '</button></p>';
        echo '<p id="sf-optimize-progress" role="status" aria-live="polite"></p>';
    }
    echo '</div>';
}
add_action( 'admin_enqueue_scripts', function( $hook ) {
    if ( 'media_page_codela-sf-media' !== $hook || ! current_user_can( 'manage_options' ) ) { return; }
    wp_enqueue_script( 'codela-sf-media-admin', get_template_directory_uri() . '/assets/scripts/media-admin.js', [], codela_sf_style_version(), true );
    wp_add_inline_script( 'codela-sf-media-admin', 'window.codelaSfMedia=' . wp_json_encode( [
        'url' => admin_url( 'admin-ajax.php' ),
        'nonce' => wp_create_nonce( 'codela_sf_optimize_media' ),
        'messages' => [
            'paused' => __( 'Paused', 'codela-storefront' ),
            'complete' => __( 'Complete', 'codela-storefront' ),
            'scanned' => __( 'Scanned', 'codela-storefront' ),
            'optimized' => __( 'Optimized', 'codela-storefront' ),
            'saved' => __( 'Saved', 'codela-storefront' ),
            'errors' => __( 'Errors', 'codela-storefront' ),
            'failed' => __( 'Stopped at image', 'codela-storefront' ),
        ],
    ] ) . ';', 'before' );
} );
add_action( 'wp_ajax_codela_sf_optimize_media', function() {
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( [ 'message' => 'forbidden' ], 403 );
    }
    check_ajax_referer( 'codela_sf_optimize_media', 'nonce' );
    if ( ! wp_image_editor_supports( [ 'mime_type' => 'image/webp' ] ) ) {
        wp_send_json_error( [ 'message' => 'WebP encoder unavailable' ], 400 );
    }
    $offset = isset( $_POST['offset'] ) ? max( 0, min( 1000000, absint( $_POST['offset'] ) ) ) : 0;
    $ids = get_posts( [
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'post_mime_type' => 'image/jpeg',
        'posts_per_page' => 1,
        'offset' => $offset,
        'orderby' => 'ID',
        'order' => 'ASC',
        'fields' => 'ids',
        'suppress_filters' => true,
    ] );
    if ( ! $ids ) {
        wp_send_json_success( [ 'done' => true, 'offset' => $offset ] );
    }
    $result = codela_sf_optimize_existing_image( (int) $ids[0] );
    wp_send_json_success( [ 'done' => false, 'offset' => $offset + 1, 'result' => $result ] );
} );
