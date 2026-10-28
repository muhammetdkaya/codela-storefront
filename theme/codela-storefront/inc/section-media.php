<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_section_image( array $item, bool $priority = false, string $sizes = '100vw' ): string {
    if ( ! wp_attachment_is_image( $item['image_id'] ?? 0 ) ) { return ''; }
    $position = (float) ( $item['focal_x'] ?? 50 ) . '% ' . (float) ( $item['focal_y'] ?? 50 ) . '%';
    $attributes = [ 'sizes' => $sizes, 'loading' => $priority ? 'eager' : 'lazy', 'fetchpriority' => $priority ? 'high' : 'low', 'decoding' => 'async', 'style' => 'object-position:' . $position ];
    // Reuse the same verified, original-resolution WebP manifest as the product
    // gallery. Never encode on a public request or replace attachment metadata.
    $webp = function_exists( 'codela_sf_png_webp_sources' ) ? codela_sf_png_webp_sources( (int) $item['image_id'] ) : [];
    if ( $webp ) {
        $attributes['src'] = $webp[ count( $webp ) - 1 ]['url'];
        $attributes['srcset'] = implode( ', ', array_map( static function( $source ) { return $source['url'] . ' ' . $source['width'] . 'w'; }, $webp ) );
    }
    $image = wp_get_attachment_image( $item['image_id'], 'large', false, $attributes );
    $mobile = (int) ( $item['mobile_image_id'] ?? 0 ); $source = '';
    if ( $mobile && wp_attachment_is_image( $mobile ) ) {
        $mobile_webp = function_exists( 'codela_sf_png_webp_sources' ) ? codela_sf_png_webp_sources( $mobile ) : [];
        $srcset = $mobile_webp
            ? implode( ', ', array_map( static function( $source ) { return $source['url'] . ' ' . $source['width'] . 'w'; }, $mobile_webp ) )
            : ( wp_get_attachment_image_srcset( $mobile, 'large' ) ?: wp_get_attachment_image_url( $mobile, 'large' ) );
        $source = '<source media="(max-width:700px)" srcset="' . esc_attr( $srcset ) . '" sizes="' . esc_attr( $sizes ) . '">';
    }
    $html = '<picture class="sf-section-art">' . $source . $image . '</picture>';
    if ( $priority && function_exists( 'codela_sf_image_preloads' ) ) { codela_sf_image_preloads( $html ); }
    return ! $priority && function_exists( 'codela_sf_defer_media' ) ? codela_sf_defer_media( $html ) : $html;
}
function codela_sf_section_controls( int $count, bool $hero = false ): string {
    $progress = $hero ? '<span class="sf-hero-progress" aria-hidden="true">' . str_repeat( '<span></span>', $count ) . '</span>' : '';
    if ( $count < 2 ) { return ''; }
    return '<nav class="sf-section-gallery-controls sf-ui-surface" data-gallery-controls aria-label="' . esc_attr__( 'Gallery navigation', 'codela-storefront' ) . '" hidden>'
        . ( $hero ? '' : codela_sf_ui_icon_button( 'arrow-left', __( 'Previous image', 'codela-storefront' ), [ 'attributes' => [ 'data-gallery-prev' => '' ] ] ) )
        . '<span data-gallery-count aria-live="polite" aria-atomic="true">' . ( $hero ? '01 / ' . sprintf( '%02d', $count ) : '1 / ' . $count ) . '</span>'
        . ( $hero ? '' : codela_sf_ui_icon_button( 'arrow-right', __( 'Next image', 'codela-storefront' ), [ 'attributes' => [ 'data-gallery-next' => '' ] ] ) ) . $progress . '</nav>';
}
function codela_sf_section_heading( array $data ): string {
    return ( $data['title'] ? '<h2>' . esc_html( $data['title'] ) . '</h2>' : '' ) . ( $data['description'] ? '<p class="sf-section-description">' . esc_html( $data['description'] ) . '</p>' : '' );
}
function codela_sf_section_media( array $data, string $type ): string {
    static $priority_used = false;
    $items = array_values( array_filter( $data['items'], static function( $item ) { return $item['enabled'] && wp_attachment_is_image( $item['image_id'] ); } ) );
    if ( ! $items ) { return ''; }
    $hero = 'hero' === $type; $gallery = count( $items ) > 1;
    $out = '<section class="sf-section sf-section--' . esc_attr( $type ) . ' sf-section--' . esc_attr( $data['variant'] ) . ( $gallery ? ' sf-ui-gallery' : '' ) . '"' . ( $gallery ? ' data-sf-gallery' : '' ) . ' aria-label="' . esc_attr( $data['title'] ?: ( $hero ? __( 'Featured collections', 'codela-storefront' ) : __( 'Discover', 'codela-storefront' ) ) ) . '">';
    if ( ! $hero ) { $out .= codela_sf_section_heading( $data ); }
    $out .= '<div class="sf-section-media-track' . ( $gallery ? ' sf-ui-gallery-track" tabindex="0' : '' ) . '">';
    foreach ( $items as $index => $item ) {
        $priority = $hero && 0 === $index && ! $priority_used; if ( $priority ) { $priority_used = true; }
        $heading = $hero && 0 === $index && is_front_page() ? 'h1' : 'h2';
        $out .= '<article class="sf-section-slide' . ( $gallery ? ' sf-ui-gallery-slide' : '' ) . '" aria-label="' . esc_attr( ( $index + 1 ) . ' / ' . count( $items ) ) . '">';
        $out .= codela_sf_section_image( $item, $priority, ! $hero && in_array( $data['variant'], [ 'split', 'editorial' ], true ) ? '(max-width:700px) 100vw, 60vw' : '100vw' );
        if ( $item['title'] || $item['subtitle'] || $item['button_label'] && $item['button_url'] ) {
            $out .= '<div class="sf-section-copy">' . ( $item['title'] ? '<' . $heading . '>' . esc_html( $item['title'] ) . '</' . $heading . '>' : '' );
            if ( $item['subtitle'] ) { $out .= '<p>' . esc_html( $item['subtitle'] ) . '</p>'; }
            if ( $item['button_label'] && $item['button_url'] ) { $out .= $hero ? codela_sf_ui_button( $item['button_label'], [ 'href' => $item['button_url'], 'variant' => 'secondary', 'icon' => 'arrow-right' ] ) : codela_sf_ui_primary_link( $item['button_url'], $item['button_label'] ); }
            $out .= '</div>';
        }
        $out .= '</article>';
    }
    $out .= '</div>' . codela_sf_section_controls( count( $items ), $hero ) . '</section>';
    if ( $hero && is_front_page() && ! $items[0]['title'] ) { $out = '<h1 class="screen-reader-text">' . esc_html( get_bloginfo( 'name' ) ) . '</h1>' . $out; }
    return $out;
}
