<?php
/** Native image delivery: preserved originals, optional bounded WebP backfill. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** WordPress owns original image files and standard responsive metadata. */
function codela_sf_webp_output( array $formats ): array {
    if ( function_exists( 'wp_image_editor_supports' ) && wp_image_editor_supports( [ 'mime_type' => 'image/webp' ] ) ) {
        foreach ( [ 'image/jpeg', 'image/png' ] as $source ) {
            if ( ! isset( $formats[ $source ] ) ) { $formats[ $source ] = 'image/webp'; }
        }
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


/**
 * The original PNG remains the media attachment and the zoom target.
 * A separate, opt-in manifest serves only verified, same-ratio WebP images
 * in the native product gallery, without rewriting WordPress image metadata.
 */
function codela_sf_png_webp_sources( int $id ): array {
    if ( 'image/png' !== get_post_mime_type( $id ) ) { return []; }
    $manifest = get_post_meta( $id, '_codela_sf_png_webp_v1', true );
    if ( ! is_array( $manifest ) || empty( $manifest['sources'] ) || ! is_array( $manifest['sources'] ) ) { return []; }
    $original_url = wp_get_attachment_url( $id );
    if ( ! is_string( $original_url ) || false === strrpos( $original_url, '/' ) ) { return []; }
    $prefix = substr( $original_url, 0, strrpos( $original_url, '/' ) + 1 );
    $sources = [];
    foreach ( $manifest['sources'] as $source ) {
        if ( ! is_array( $source ) || empty( $source['file'] ) || empty( $source['width'] )
            || ! is_string( $source['file'] ) || basename( $source['file'] ) !== $source['file']
            || ! preg_match( '/^[a-zA-Z0-9._-]+\.webp$/', $source['file'] ) ) { continue; }
        $sources[] = [
            'url' => $prefix . rawurlencode( $source['file'] ),
            'width' => (int) $source['width'],
        ];
    }
    usort( $sources, static function( $a, $b ) { return $a['width'] <=> $b['width']; } );
    // Do not silently replace a sharp image with a low-resolution preview.
    $original_width = isset( $manifest['width'] ) ? (int) $manifest['width'] : 0;
    return $sources && end( $sources )['width'] >= $original_width && $original_width > 0 ? $sources : [];
}

/**
 * One PNG attachment per admin request. Compress at original pixel dimensions
 * plus two responsive widths; never overwrite or remove uploaded PNG/JPEGs.
 * WP_Image_Editor handles color/alpha encoding, not a custom media pipeline.
 */
function codela_sf_optimize_png( int $id ): array {
    $skipped = [ 'status' => 'skipped', 'converted' => 0, 'saved' => 0 ];
    if ( 'image/png' !== get_post_mime_type( $id ) ) { return $skipped; }
    if ( codela_sf_png_webp_sources( $id ) ) { return $skipped; }
    if ( ! wp_image_editor_supports( [ 'mime_type' => 'image/webp' ] ) ) {
        return [ 'status' => 'unsupported', 'converted' => 0, 'saved' => 0 ];
    }
    $meta = wp_get_attachment_metadata( $id );
    $file = get_attached_file( $id );
    if ( ! is_array( $meta ) || empty( $meta['width'] ) || empty( $meta['height'] )
        || ! is_string( $file ) || ! is_file( $file ) ) { return $skipped; }
    $original_width = (int) $meta['width'];
    $original_height = (int) $meta['height'];
    $original_bytes = (int) filesize( $file );
    if ( $original_width < 1 || $original_height < 1 || $original_bytes < 1 ) { return $skipped; }

    $widths = array_values( array_unique( array_filter( [
        min( 640, $original_width ), min( 960, $original_width ), $original_width,
    ] ) ) );
    sort( $widths, SORT_NUMERIC );
    $candidates = [];
    $full_bytes = 0;
    foreach ( $widths as $width ) {
        $height = max( 1, (int) round( $original_height * $width / $original_width ) );
        $name = 'codela-sf-' . $id . '-' . $width . '.webp';
        $output = dirname( $file ) . '/' . $name;
        $editor = wp_get_image_editor( $file );
        if ( is_wp_error( $editor ) ) { continue; }
        if ( method_exists( $editor, 'set_quality' ) ) { $editor->set_quality( 90 ); }
        if ( $width !== $original_width ) {
            $resized = $editor->resize( $width, $height, false );
            if ( is_wp_error( $resized ) ) { continue; }
        }
        $result = $editor->save( $output, 'image/webp' );
        if ( is_wp_error( $result ) || ! is_array( $result ) || 'image/webp' !== ( $result['mime-type'] ?? '' )
            || ! is_file( $output ) || (int) filesize( $output ) <= 0
            || (int) filesize( $output ) >= $original_bytes ) { continue; }
        $candidates[] = [ 'file' => $name, 'width' => $width, 'height' => $height ];
        if ( $width === $original_width ) { $full_bytes = (int) filesize( $output ); }
    }
    // Retain original PNG delivery when original-resolution compression fails.
    if ( ! $full_bytes ) {
        return [ 'status' => 'unchanged', 'converted' => 0, 'saved' => 0 ];
    }
    update_post_meta( $id, '_codela_sf_png_webp_v1', [
        'width' => $original_width, 'height' => $original_height, 'sources' => $candidates,
    ] );
    return [ 'status' => 'optimized', 'converted' => 1, 'saved' => max( 0, $original_bytes - $full_bytes ) ];
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
    echo '<p>' . esc_html__( 'New JPEG/PNG uploads automatically receive WebP image sizes when the server supports WebP. Original files, image links and WooCommerce full-screen images remain intact.', 'codela-storefront' ) . '</p>';
    echo '<p>' . esc_html__( 'For older JPEG and PNG uploads, optimize one attachment per request. PNG products receive original-resolution and responsive WebP alternatives. No originals or previous JPEG derivatives are deleted. Stop by closing this page.', 'codela-storefront' ) . '</p>';
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
        'post_mime_type' => [ 'image/jpeg', 'image/png' ],
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
    $id = (int) $ids[0];
    $result = 'image/png' === get_post_mime_type( $id )
        ? codela_sf_optimize_png( $id ) : codela_sf_optimize_existing_image( $id );
    wp_send_json_success( [ 'done' => false, 'offset' => $offset + 1, 'result' => $result ] );
} );
