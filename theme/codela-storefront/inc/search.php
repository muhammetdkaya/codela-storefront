<?php
/** Presentation adapter for the plugin-owned search; no extra product query. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_filter( 'rest_request_before_callbacks', static function( $response, $handler, $request ) {
    if ( null !== $response || '/codela/v1/theme/search' !== $request->get_route()
        || 'GET' !== $request->get_method() || 'codela_theme_search' !== ( $handler['callback'] ?? null ) ) { return $response; }
    $capture = (object) [ 'prices' => [] ];
    // Capture the exact price the plugin already calculates for this customer.
    // Keep Woo's visible/accessible range and sale markup separate; its plain
    // text API field remains unchanged for existing consumers.
    $capture->filter = static function( $html, $product ) use ( $capture ) {
        $capture->prices[ $product->get_id() ] = wp_kses( $html, [
            'span' => [ 'class' => true, 'aria-hidden' => true ],
            'bdi' => [], 'del' => [ 'aria-hidden' => true ],
            'ins' => [ 'aria-hidden' => true ], 'small' => [ 'class' => true ], 'br' => [],
        ] );
        return $html;
    };
    $GLOBALS['codela_sf_search_prices'][ spl_object_id( $request ) ] = $capture;
    add_filter( 'woocommerce_get_price_html', $capture->filter, PHP_INT_MAX, 2 );
    return $response;
}, 10, 3 );

add_filter( 'rest_request_after_callbacks', static function( $response, $handler, $request ) {
    $key = spl_object_id( $request );
    $capture = $GLOBALS['codela_sf_search_prices'][ $key ] ?? null;
    if ( ! $capture ) { return $response; }
    remove_filter( 'woocommerce_get_price_html', $capture->filter, PHP_INT_MAX );
    unset( $GLOBALS['codela_sf_search_prices'][ $key ] );
    if ( ! $response instanceof WP_REST_Response || 200 !== $response->get_status() ) { return $response; }
    $items = $response->get_data();
    if ( ! is_array( $items ) ) { return $response; }
    foreach ( $items as &$item ) {
        if ( is_array( $item ) && isset( $item['id'], $capture->prices[ $item['id'] ] ) ) {
            $item['price_html'] = $capture->prices[ $item['id'] ];
        }
    }
    unset( $item );
    $response->set_data( $items );
    return $response;
}, 10, 3 );
