<?php
/** Native Woo product-loop composition shared by home and product search.
 * Archives, categories, related and upsells already use content-product.php.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_product_grid( array $products, array $props = [], bool $toolbar = false ): string {
    $previous_product = $GLOBALS['product'] ?? null;
    $previous_post = $GLOBALS['post'] ?? null;
    $had_loop = array_key_exists( 'woocommerce_loop', $GLOBALS );
    $previous_loop = $GLOBALS['woocommerce_loop'] ?? [];
    ob_start();
    try {
        wc_setup_loop( $props + [
            'name' => 'sf-catalog', 'columns' => 4, 'loop' => 0,
            'total' => count( $products ), 'is_paginated' => false,
        ] );
        if ( $toolbar ) { do_action( 'woocommerce_before_shop_loop' ); }
        woocommerce_product_loop_start();
        foreach ( $products as $item ) {
            if ( ! $item instanceof WC_Product || ! $item->is_visible() ) { continue; }
            $GLOBALS['post'] = get_post( $item->get_id() );
            if ( ! $GLOBALS['post'] ) { continue; }
            setup_postdata( $GLOBALS['post'] );
            $GLOBALS['product'] = $item;
            do_action( 'woocommerce_shop_loop' );
            wc_get_template_part( 'content', 'product' );
        }
        woocommerce_product_loop_end();
        if ( $toolbar ) { do_action( 'woocommerce_after_shop_loop' ); }
        return ob_get_clean();
    } catch ( Throwable $error ) {
        ob_end_clean();
        throw $error;
    } finally {
        if ( $had_loop ) { $GLOBALS['woocommerce_loop'] = $previous_loop; }
        else { unset( $GLOBALS['woocommerce_loop'] ); }
        $GLOBALS['post'] = $previous_post;
        if ( $previous_post ) { setup_postdata( $previous_post ); }
        $GLOBALS['product'] = $previous_product;
    }
}

function codela_sf_search_results(): string {
    $type = get_query_var( 'post_type' );
    if ( 'product' !== $type && [ 'product' ] !== $type ) {
        // Keep ordinary post/page searches on the original core Query block.
        return do_blocks( '<!-- wp:query {"query":{"inherit":true}} --><div class="wp-block-query"><!-- wp:post-template --><!-- wp:post-title {"isLink":true} /--><!-- wp:post-excerpt /--><!-- /wp:post-template --><!-- wp:query-pagination --><!-- wp:query-pagination-previous /--><!-- wp:query-pagination-numbers /--><!-- wp:query-pagination-next /--><!-- /wp:query-pagination --></div><!-- /wp:query -->' );
    }
    global $wp_query;
    $products = [];
    foreach ( $wp_query->posts as $entry ) {
        $item = wc_get_product( $entry->ID );
        if ( $item && $item->is_visible() ) { $products[] = $item; }
    }
    ob_start(); ?>
    <section class="sf-catalog woocommerce">
        <h1><?php printf( esc_html__( 'Search results for: %s' ), esc_html( get_search_query() ) ); ?></h1>
        <?php
        if ( $products ) {
            echo codela_sf_product_grid( $products, [
                'total' => (int) $wp_query->found_posts,
                'total_pages' => (int) $wp_query->max_num_pages,
                'per_page' => max( 1, (int) get_query_var( 'posts_per_page' ) ),
                'current_page' => max( 1, (int) get_query_var( 'paged' ) ),
                'is_search' => true, 'is_paginated' => true,
            ], true );
        } else { do_action( 'woocommerce_no_products_found' ); }
        ?>
    </section>
    <?php return ob_get_clean();
}

/** Keep availability wording in the same native card in every loop. */
function codela_sf_catalog_stock_label(): void {
    global $product;
    if ( function_exists( 'is_account_page' ) && is_account_page() && is_user_logged_in() ) { return; }
    if ( $product instanceof WC_Product && ! $product->is_in_stock() ) {
        echo '<span class="sf-product-stock">' . esc_html__( 'Out of stock', 'woocommerce' ) . '</span>';
    }
}
add_action( 'woocommerce_after_shop_loop_item_title', 'codela_sf_catalog_stock_label', 15 );

/** Preserve deferred home collection thumbnails without delaying the hero. */
function codela_sf_catalog_image_attributes( array $attributes ): array {
    if ( is_front_page() && doing_action( 'woocommerce_before_shop_loop_item_title' ) ) {
        $attributes['loading'] = 'lazy';
        $attributes['decoding'] = 'async';
        unset( $attributes['fetchpriority'] );
    }
    return $attributes;
}
add_filter( 'wp_get_attachment_image_attributes', 'codela_sf_catalog_image_attributes', 20 );
