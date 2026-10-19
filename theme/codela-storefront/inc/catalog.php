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
add_action( 'woocommerce_before_shop_loop_item_title', 'codela_sf_catalog_stock_label', 11 );

/** Deprioritize non-critical native product cards across sections and related products.
 * The single-product hero is handled separately by the existing media helper.
 */
function codela_sf_catalog_image_attributes( array $attributes, $attachment = null ): array {
    $card_image = doing_action( 'woocommerce_before_shop_loop_item_title' )
        && ( is_front_page()
            || ( function_exists( 'is_product' ) && is_product() )
            || ( function_exists( 'wc_get_loop_prop' ) && wc_get_loop_prop( 'codela_defer_images', false ) ) );
    if ( ! $card_image ) { return $attributes; }
    $attributes['loading'] = 'lazy';
    $attributes['decoding'] = 'async';
    $attributes['fetchpriority'] = 'low';
    // One existing opt-in manifest is shared with the product hero and page
    // sections. Never transcode during a shopper request; missing manifests
    // fall through to WooCommerce's untouched responsive native image.
    $id = is_object( $attachment ) ? (int) ( $attachment->ID ?? 0 ) : 0;
    $webp = $id && function_exists( 'codela_sf_png_webp_sources' )
        ? codela_sf_png_webp_sources( $id ) : [];
    if ( $webp ) {
        $attributes['src'] = $webp[ count( $webp ) - 1 ]['url'];
        $attributes['srcset'] = implode( ', ', array_map(
            static fn( $source ) => $source['url'] . ' ' . $source['width'] . 'w', $webp
        ) );
    }
    return $attributes;
}
add_filter( 'wp_get_attachment_image_attributes', 'codela_sf_catalog_image_attributes', 20 );

/** Compose the existing native loop hooks; never replace content-product.php. */
function codela_sf_catalog_enabled(): bool {
    return ! ( function_exists( 'is_account_page' ) && is_account_page() && is_user_logged_in() );
}
function codela_sf_catalog_layout(): void {
    if ( ! codela_sf_catalog_enabled() ) { return; }
    remove_action( 'woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_price', 10 );
    // The native product link closes at5; native add-to-cart stays at10.
    add_action( 'woocommerce_after_shop_loop_item', 'codela_sf_catalog_footer_open', 6 );
    add_action( 'woocommerce_after_shop_loop_item', 'codela_sf_catalog_footer_close', 99 );
}
add_action( 'wp', 'codela_sf_catalog_layout' );
function codela_sf_catalog_footer_open(): void {
    echo '<div class="sf-product-card-footer">';
    woocommerce_template_loop_price();
}
function codela_sf_catalog_footer_close(): void { echo '</div>'; }

function codela_sf_catalog_action_icon( $item ): string {
    if ( ! $item instanceof WC_Product || ! $item->is_in_stock() ) { return ''; }
    if ( $item->is_type( 'variable' ) ) { return 'arrow-right'; }
    return $item->is_type( 'simple' ) && $item->is_purchasable() ? 'shopping-bag' : '';
}
/** Add only shared Button classes; Woo retains URL, AJAX classes and all data/ARIA. */
function codela_sf_catalog_button_args( array $args, $item ): array {
    if ( codela_sf_catalog_enabled() && $item instanceof WC_Product ) {
        $classes = codela_sf_catalog_action_icon( $item ) ? implode( ' ', codela_sf_ui_icon_button_classes( 'soft' ) ) : 'sf-ui-button sf-ui-button--secondary sf-ui-surface';
        $args['class'] = trim( ( $args['class'] ?? '' ) . ' ' . $classes );
    }
    return $args;
}
add_filter( 'woocommerce_loop_add_to_cart_args', 'codela_sf_catalog_button_args', 20, 2 );
function codela_sf_catalog_button_text( string $text, $item ): string {
    if ( ! codela_sf_catalog_enabled() || ! $item instanceof WC_Product || ! $item->is_in_stock() ) { return $text; }
    if ( $item->is_type( 'simple' ) && $item->is_purchasable() ) { return __( 'Add' ); }
    if ( $item->is_type( 'variable' ) ) { return __( 'Options' ); }
    return $text;
}
add_filter( 'woocommerce_product_add_to_cart_text', 'codela_sf_catalog_button_text', 20, 2 );
function codela_sf_catalog_button_visibility( string $html, $item ): string {
    if ( ! codela_sf_catalog_enabled() || ! $item instanceof WC_Product ) { return $html; }
    if ( ! $item->is_in_stock() ) { return ''; }
    $icon = codela_sf_catalog_action_icon( $item );
    if ( $icon ) {
        $label = esc_html( $item->add_to_cart_text() );
        $content = codela_sf_ui_icon_button_content( $icon ) . '<span class="screen-reader-text">' . $label . '</span>';
        // Retain Woo's original URL, AJAX/data/ARIA attributes and trailing extension markup.
        $html = str_replace( '>' . $label . '</a>', '>' . $content . '</a>', $html );
    }
    return $html;
}
add_filter( 'woocommerce_loop_add_to_cart_link', 'codela_sf_catalog_button_visibility', 20, 2 );

/** Archive composition only; keep Woo's main query, pagination and native hooks. */
function codela_sf_is_catalog_archive(): bool {
    return ( function_exists( 'is_shop' ) && is_shop() )
        || ( function_exists( 'is_product_taxonomy' ) && is_product_taxonomy() );
}
function codela_sf_catalog_archive_layout(): void {
    if ( ! codela_sf_is_catalog_archive() ) { return; }
    remove_action( 'woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 );
    // Sorting lives in the existing fullscreen panel; notices and extension hooks remain.
    remove_action( 'woocommerce_before_shop_loop', 'woocommerce_catalog_ordering', 30 );
}
add_action( 'wp', 'codela_sf_catalog_archive_layout' );

/** A normal GET form: Woo owns price filtering, ordering and pagination. */
function codela_sf_catalog_filters(): string {
    $shop = wc_get_page_permalink( 'shop' );
    $term = is_product_taxonomy() ? get_queried_object() : null;
    $base = $term instanceof WP_Term ? get_term_link( $term ) : $shop;
    if ( is_wp_error( $base ) ) { $base = $shop; }
    $order = isset( $_GET['orderby'] ) && is_scalar( $_GET['orderby'] )
        ? wc_clean( wp_unslash( $_GET['orderby'] ) ) : get_option( 'woocommerce_default_catalog_orderby', 'menu_order' );
    $options = apply_filters( 'woocommerce_catalog_orderby', [
        'menu_order' => __( 'Default sorting', 'woocommerce' ),
        'popularity' => __( 'Sort by popularity', 'woocommerce' ),
        'rating' => __( 'Sort by average rating', 'woocommerce' ),
        'date' => __( 'Sort by latest', 'woocommerce' ),
        'price' => __( 'Sort by price: low to high', 'woocommerce' ),
        'price-desc' => __( 'Sort by price: high to low', 'woocommerce' ),
    ] );
    if ( 'no' === get_option( 'woocommerce_enable_review_rating' ) ) { unset( $options['rating'] ); }
    $terms = get_terms( [ 'taxonomy' => 'product_cat', 'hide_empty' => true ] );
    ob_start(); ?>
    <div class="sf-catalog-filters">
        <form method="get" action="<?php echo esc_url( $base ); ?>">
            <?php
            // Preserve attribute/plugin filters and plain-permalink query vars.
            // Remove page vars so every changed filter starts on its first page.
            wc_query_string_form_fields( null, [ 'orderby', 'min_price', 'max_price', 'paged', 'product-page', 'submit' ] );
            $base_args = wp_parse_url( $base, PHP_URL_QUERY );
            if ( $base_args ) {
                parse_str( $base_args, $args );
                wc_query_string_form_fields( $args );
            }
            ?>
            <label for="sf-catalog-order"><?php esc_html_e( 'Sort by', 'codela-storefront' ); ?></label>
            <select id="sf-catalog-order" name="orderby">
                <?php foreach ( $options as $value => $label ) : ?>
                <option value="<?php echo esc_attr( $value ); ?>" <?php selected( $order, $value ); ?>><?php echo esc_html( $label ); ?></option>
                <?php endforeach; ?>
            </select>
            <fieldset><legend><?php echo esc_html__( 'Price range', 'codela-storefront' ) . ' (' . esc_html( get_woocommerce_currency_symbol() ) . ')'; ?></legend>
                <div class="sf-filter-prices">
                <?php foreach ( [ 'min_price' => 'Minimum price', 'max_price' => 'Maximum price' ] as $key => $label ) :
                    $value = isset( $_GET[ $key ] ) && is_scalar( $_GET[ $key ] ) ? wc_format_decimal( wp_unslash( $_GET[ $key ] ) ) : ''; ?>
                    <label><?php echo esc_html__( $label, 'codela-storefront' ); ?><input type="number" name="<?php echo esc_attr( $key ); ?>" value="<?php echo esc_attr( $value ); ?>" min="0" step="any" inputmode="decimal"></label>
                <?php endforeach; ?>
                </div>
            </fieldset>
            <div class="sf-filter-actions">
                <?php echo codela_sf_ui_button( __( 'Apply filters', 'codela-storefront' ), [ 'type' => 'submit' ] ); ?>
                <?php echo codela_sf_ui_button( __( 'Clear filters', 'codela-storefront' ), [ 'href' => $base, 'variant' => 'secondary' ] ); ?>
            </div>
        </form>
        <?php if ( ! is_wp_error( $terms ) && $terms ) : ?>
        <nav class="sf-filter-categories" aria-label="<?php esc_attr_e( 'Categories', 'codela-storefront' ); ?>">
            <h3><?php esc_html_e( 'Categories', 'codela-storefront' ); ?></h3>
            <a class="sf-ui-pressable" href="<?php echo esc_url( $shop ); ?>" <?php if ( ! $term ) { echo 'aria-current="page"'; } ?>><?php esc_html_e( 'All products', 'codela-storefront' ); ?></a>
            <?php foreach ( $terms as $category ) :
                $url = get_term_link( $category );
                if ( is_wp_error( $url ) ) { continue; } ?>
                <a class="sf-ui-pressable" href="<?php echo esc_url( $url ); ?>" <?php if ( $term && $term->taxonomy === 'product_cat' && $term->term_id === $category->term_id ) { echo 'aria-current="page"'; } ?>><?php echo esc_html( $category->name ); ?><span><?php echo esc_html( $category->count ); ?></span></a>
            <?php endforeach; ?>
        </nav>
        <?php endif; ?>
    </div>
    <?php return ob_get_clean();
}

/** Empty optional GET bounds mean no bound, including without JavaScript. */
function codela_sf_catalog_empty_bounds( $query ): void {
    if ( is_admin() || ! $query->is_main_query() || ! (
        $query->is_post_type_archive( 'product' ) || $query->is_tax( get_object_taxonomies( 'product' ) )
    ) ) { return; }
    foreach ( [ 'min_price', 'max_price' ] as $key ) {
        if ( isset( $_GET[ $key ] ) && is_string( $_GET[ $key ] ) && '' === trim( $_GET[ $key ] ) ) {
            unset( $_GET[ $key ] );
        }
    }
}
add_action( 'pre_get_posts', 'codela_sf_catalog_empty_bounds', 9 );
