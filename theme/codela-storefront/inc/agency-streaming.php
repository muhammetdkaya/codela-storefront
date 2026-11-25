<?php
/**
 * Opt-in early HEAD streaming for the public, managed Agency home only.
 * WordPress still renders blocks before wp_head() so block assets remain intact.
 * Never touch third-party buffers or cache drop-ins.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_streaming_buffer_allowed( array $buffers ): bool {
    if ( [] === $buffers ) { return true; }
    if ( count( $buffers ) !== 1 ) { return false; }
    $buffer = $buffers[0];
    return 'default output handler' === ( $buffer['name'] ?? '' )
        && 0 === (int) ( $buffer['buffer_used'] ?? -1 )
        && 0 !== ( (int) ( $buffer['flags'] ?? 0 ) & PHP_OUTPUT_HANDLER_FLUSHABLE );
}

function codela_sf_streaming_headers_allowed( array $headers ): bool {
    foreach ( $headers as $header ) {
        if ( preg_match( '/^(?:Set-Cookie|Location|Content-Length|Content-Encoding|Content-Disposition|Transfer-Encoding)\s*:/i', $header ) ) { return false; }
    }
    return true;
}

function codela_sf_streaming_request_allowed( array $server, array $cookies, array $query ): bool {
    return 'GET' === ( $server['REQUEST_METHOD'] ?? '' )
        && [] === $cookies && [] === $query
        && empty( $server['HTTP_AUTHORIZATION'] )
        && empty( $server['HTTP_RANGE'] )
        && empty( $server['HTTP_COOKIE'] )
        && empty( $server['HTTP_X_REQUESTED_WITH'] )
        && ! in_array( strtolower( $server['HTTP_SEC_FETCH_SITE'] ?? '' ), [ 'same-origin', 'same-site' ], true )
        && ( empty( $server['HTTP_SEC_FETCH_MODE'] ) || 'navigate' === $server['HTTP_SEC_FETCH_MODE'] );
}

function codela_sf_streaming_available(): bool {
    if ( ! codela_sf_first_entry_enabled()
        || ! in_array( codela_theme_settings()['early_html_streaming_enabled'] ?? false, [ true, 1, '1' ], true )
        || ! is_front_page() || ! is_singular( 'page' )
        || is_user_logged_in() || is_feed() || is_embed() || is_search() || is_404()
        || wp_is_json_request() || ( defined( 'REST_REQUEST' ) && REST_REQUEST )
        || ( defined( 'WP_CACHE' ) && WP_CACHE )
        || ( defined( 'DONOTCACHEPAGE' ) && DONOTCACHEPAGE )
        || ( defined( 'DONOTMINIFY' ) && DONOTMINIFY )
        || headers_sent()
        || ! in_array( http_response_code(), [ 200, false ], true )
        || ! codela_sf_streaming_request_allowed( $_SERVER, $_COOKIE, $_GET )
        || ! codela_sf_streaming_headers_allowed( headers_list() )
        || ! codela_sf_streaming_buffer_allowed( ob_get_status( true ) )
        || ! in_array( strtolower( (string) ini_get( 'zlib.output_compression' ) ), [ '', '0', 'off' ], true )
    ) { return false; }
    $post = get_queried_object();
    if ( ! $post instanceof WP_Post || 'publish' !== $post->post_status || ! empty( $post->post_password ) ) { return false; }
    $caps = codela_sf_sections_capabilities();
    $flags = codela_sf_agency_asset_flags();
    return ! empty( $caps['managed'] ) && empty( $caps['products'] ) && ! empty( $flags['widgets'] );
}

add_filter( 'template_include', static function( $template ) {
    // Respect all alternative PHP templates, including custom and child themes.
    if ( ! is_string( $template ) || ! function_exists( 'get_the_block_template_html' )
        || realpath( $template ) !== realpath( ABSPATH . WPINC . '/template-canvas.php' )
        || ! codela_sf_streaming_available() ) { return $template; }
    return __DIR__ . '/agency-streaming-canvas.php';
}, PHP_INT_MAX );
