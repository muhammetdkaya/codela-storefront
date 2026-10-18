<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
/** Request-only ID memoization; never cache personalized price or cart HTML. */
function codela_sf_section_product_query( array $row ): array {
    static $queries = [];
    $category = absint( $row['category_id'] ?? 0 );
    if ( $category ) { $term = get_term( $category, 'product_cat' ); if ( ! $term || is_wp_error( $term ) ) { return []; } }
    $limit = (int) ( $row['limit'] ?? 4 ); if ( ! in_array( $limit, [ 4, 8, 12 ], true ) ) { $limit = 4; }
    $visibility = wc_get_product_visibility_term_ids(); $excluded = [ $visibility['exclude-from-catalog'] ];
    $hide_stock = 'yes' === get_option( 'woocommerce_hide_out_of_stock_items' ); if ( $hide_stock ) { $excluded[] = $visibility['outofstock']; }
    $tax = [ [ 'taxonomy' => 'product_visibility', 'field' => 'term_taxonomy_id', 'terms' => $excluded, 'operator' => 'NOT IN' ] ];
    if ( $category ) { $tax[] = [ 'taxonomy' => 'product_cat', 'field' => 'term_id', 'terms' => [ $category ], 'include_children' => true ]; }
    $args = [ 'post_type' => 'product', 'post_status' => 'publish', 'has_password' => false, 'posts_per_page' => $limit, 'no_found_rows' => true, 'fields' => 'ids', 'tax_query' => $tax, 'orderby' => [ 'date' => 'DESC', 'ID' => 'DESC' ], 'ignore_sticky_posts' => true ];
    if ( 'best_sellers' === ( $row['source'] ?? '' ) ) { $args['meta_key'] = 'total_sales'; $args['orderby'] = [ 'meta_value_num' => 'DESC', 'date' => 'DESC', 'ID' => 'DESC' ]; }
    $key = serialize( [ $args, function_exists( 'determine_locale' ) ? determine_locale() : '' ] );
    if ( ! isset( $queries[ $key ] ) ) { $queries[ $key ] = ( new WP_Query( $args ) )->posts; }
    $products = [];
    foreach ( $queries[ $key ] as $id ) {
        $product = wc_get_product( $id );
        if ( $product && $product->is_visible() && 'publish' === $product->get_status() && ! get_post_field( 'post_password', $id ) && ( ! $hide_stock || $product->is_in_stock() ) ) { $products[] = $product; }
    }
    return $products;
}
function codela_sf_section_products( array $data ): string {
    $products = codela_sf_section_product_query( $data ); if ( ! $products ) { return ''; }
    $data['title'] = $data['title'] ?: ( 'best_sellers' === $data['source'] ? __( 'Best sellers', 'codela-storefront' ) : __( 'New arrivals', 'codela-storefront' ) );
    $url = $data['category_id'] ? get_term_link( $data['category_id'], 'product_cat' ) : wc_get_page_permalink( 'shop' );
    $out = '<section class="sf-section sf-section--products woocommerce"><div class="sf-section-heading">' . codela_sf_section_heading( $data );
    if ( $data['show_all'] && ! is_wp_error( $url ) ) { $out .= '<a class="sf-section-view-all" href="' . esc_url( add_query_arg( 'orderby', 'best_sellers' === $data['source'] ? 'popularity' : 'date', $url ) ) . '">' . esc_html__( 'View all', 'codela-storefront' ) . '</a>'; }
    return $out . '</div>' . codela_sf_product_grid( $products, [ 'codela_defer_images' => true ] ) . '</section>';
}
