<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_section_categories( array $data ): string {
    $cards = []; $variant = $data['variant'];
    $sizes = [ 'compact' => '(max-width:700px) 44vw, 23vw', 'editorial' => '(max-width:700px) 35vw, 40vw', 'bands' => '100vw', 'mosaic' => '(max-width:700px) 90vw, 60vw', 'carousel' => '(max-width:700px) 82vw, 48vw', 'grid' => '(max-width:700px) 50vw, 25vw' ];
    foreach ( $data['items'] as $item ) {
        if ( ! $item['enabled'] ) { continue; }
        $term = get_term( $item['term_id'], 'product_cat' ); if ( ! $term || is_wp_error( $term ) ) { continue; }
        $url = get_term_link( $term ); if ( is_wp_error( $url ) ) { continue; }
        $title = $item['title'] ?: $term->name;
        if ( ! $item['image_id'] ) { $item['image_id'] = (int) get_term_meta( $term->term_id, 'thumbnail_id', true ); }
        $cards[] = '<a class="sf-category-story' . ( 'carousel' === $variant ? ' sf-ui-gallery-slide' : '' ) . '" href="' . esc_url( $url ) . '">'
            . codela_sf_section_image( $item, false, $sizes[ $variant ] ?? '50vw' )
            . '<div class="sf-category-caption"><h3>' . esc_html( $title ) . '</h3>'
            . ( $item['subtitle'] ? '<p>' . esc_html( $item['subtitle'] ) . '</p>' : '' )
            . '<span class="sf-category-explore">' . esc_html__( 'Discover', 'codela-storefront' ) . ' ' . codela_sf_icon( 'arrow-right' ) . '</span></div></a>';
    }
    if ( ! $cards ) { return ''; }
    $gallery = 'carousel' === $variant;
    $out = '<section class="sf-section sf-section--categories sf-categories--' . esc_attr( $variant ) . ( $gallery ? ' sf-ui-gallery' : '' ) . '"' . ( $gallery ? ' data-sf-gallery' : '' ) . '>' . codela_sf_section_heading( $data );
    if ( 'mosaic' === $variant ) {
        foreach ( array_chunk( $cards, 3 ) as $group ) { $out .= '<div class="sf-category-layout sf-category-mosaic" data-count="' . count( $group ) . '">' . implode( '', $group ) . '</div>'; }
    } else {
        $out .= '<div class="sf-category-layout' . ( $gallery ? ' sf-ui-gallery-track" tabindex="0' : '' ) . '">' . implode( '', $cards ) . '</div>';
    }
    return $out . ( $gallery ? codela_sf_section_controls( count( $cards ) ) : '' ) . '</section>';
}
