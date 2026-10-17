<?php
/** Theme-owned homepage, composed from the shared gallery and native catalog. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_home_mode(): string {
    $mode = codela_theme_settings()['homepage_mode'] ?? 'legacy';
    if ( 'sections' === $mode && ( ! defined( 'CODELA_THEME_SETTINGS_API_VERSION' ) || version_compare( CODELA_THEME_SETTINGS_API_VERSION, '1.1.0', '<' ) ) ) { return 'legacy'; }
    return in_array( $mode, [ 'legacy', 'sections', 'page_content' ], true ) ? $mode : 'legacy';
}
function codela_sf_home_image( int $id, bool $first = false, string $sizes = '100vw' ): string {
    if ( ! $id || ! wp_attachment_is_image( $id ) ) { return ''; }
    return wp_get_attachment_image( $id, 'large', false, [ 'sizes' => $sizes, 'loading' => $first ? 'eager' : 'lazy', 'fetchpriority' => $first ? 'high' : 'low', 'decoding' => 'async' ] );
}
function codela_sf_home_slider( array $settings ): string {
    $slides = [];
    foreach ( array_slice( (array) ( $settings['homepage_slides'] ?? [] ), 0, 8 ) as $slide ) {
        if ( ! is_array( $slide ) || empty( $slide['enabled'] ) || ! wp_attachment_is_image( absint( $slide['image_id'] ?? 0 ) ) ) { continue; }
        $slides[] = $slide;
    }
    if ( ! $slides ) { return ''; }
    ob_start(); ?>
    <section class="sf-home-slider sf-ui-gallery sf-ui-gallery--hero" data-sf-gallery aria-label="<?php esc_attr_e( 'Featured collections', 'codela-storefront' ); ?>">
      <div class="sf-ui-gallery-track" tabindex="0" aria-label="<?php esc_attr_e( 'Swipe to explore', 'codela-storefront' ); ?>">
      <?php foreach ( $slides as $index => $slide ) :
          $title = trim( (string) ( $slide['title'] ?? '' ) );
          $mobile = absint( $slide['mobile_image_id'] ?? 0 );
          ?>
        <article class="sf-ui-gallery-slide sf-home-slide" aria-label="<?php echo esc_attr( ( $index + 1 ) . ' / ' . count( $slides ) ); ?>">
          <picture class="sf-home-slide-art">
            <?php if ( $mobile && wp_attachment_is_image( $mobile ) ) :
                $srcset = wp_get_attachment_image_srcset( $mobile, 'large' );
                $src = wp_get_attachment_image_url( $mobile, 'large' ); ?>
              <source media="(max-width:700px)" srcset="<?php echo esc_attr( $srcset ?: $src ); ?>" sizes="100vw">
            <?php endif; ?>
            <?php echo codela_sf_home_image( absint( $slide['image_id'] ), 0 === $index, $title || ! empty( $slide['subtitle'] ) || ! empty( $slide['button_label'] ) ? '(max-width:700px) 100vw, 57vw' : '100vw' ); ?>
          </picture>
          <?php if ( $title || ! empty( $slide['subtitle'] ) || ( ! empty( $slide['button_label'] ) && ! empty( $slide['button_url'] ) ) ) : ?>
          <div class="sf-home-slide-copy">
            <?php if ( $title ) : ?><?php echo 0 === $index ? '<h1>' : '<h2>'; ?><?php echo esc_html( $title ); ?><?php echo 0 === $index ? '</h1>' : '</h2>'; ?><?php endif; ?>
            <?php if ( ! empty( $slide['subtitle'] ) ) : ?><p><?php echo esc_html( $slide['subtitle'] ); ?></p><?php endif; ?>
            <?php if ( ! empty( $slide['button_label'] ) && ! empty( $slide['button_url'] ) ) { echo codela_sf_ui_primary_link( $slide['button_url'], $slide['button_label'] ); } ?>
          </div>
          <?php endif; ?>
        </article>
      <?php endforeach; ?>
      </div>
      <?php if ( count( $slides ) > 1 ) : ?>
      <nav class="sf-home-slider-controls" aria-label="<?php esc_attr_e( 'Gallery navigation', 'codela-storefront' ); ?>" hidden>
        <?php echo codela_sf_ui_icon_button( 'arrow-left', __( 'Previous image', 'codela-storefront' ), [ 'attributes' => [ 'data-gallery-prev' => '' ] ] ); ?>
        <span data-gallery-count aria-live="polite">1 / <?php echo count( $slides ); ?></span>
        <?php echo codela_sf_ui_icon_button( 'arrow-right', __( 'Next image', 'codela-storefront' ), [ 'attributes' => [ 'data-gallery-next' => '' ] ] ); ?>
      </nav>
      <?php endif; ?>
    </section>
    <?php return ob_get_clean();
}
function codela_sf_home_categories( array $settings ): string {
    if ( isset( $settings['homepage_categories_enabled'] ) && ! $settings['homepage_categories_enabled'] ) { return ''; }
    $cards = '';
    foreach ( array_slice( (array) ( $settings['homepage_categories'] ?? [] ), 0, 12 ) as $row ) {
        if ( ! is_array( $row ) || empty( $row['term_id'] ) ) { continue; }
        $term = get_term( absint( $row['term_id'] ), 'product_cat' );
        if ( ! $term || is_wp_error( $term ) ) { continue; }
        $url = get_term_link( $term ); if ( is_wp_error( $url ) ) { continue; }
        $title = trim( (string) ( $row['title'] ?? '' ) ) ?: $term->name;
        $image_id = absint( $row['image_id'] ?? 0 ) ?: absint( get_term_meta( $term->term_id, 'thumbnail_id', true ) );
        $image = codela_sf_home_image( $image_id, false, '(max-width:700px) 50vw, 25vw' );
        $cards .= '<a class="sf-home-category" href="' . esc_url( $url ) . '"><div class="sf-home-category-art">' . $image . '</div><h3>' . esc_html( $title ) . '</h3>';
        if ( ! empty( $row['description'] ) ) { $cards .= '<p>' . esc_html( $row['description'] ) . '</p>'; }
        $cards .= '</a>';
    }
    if ( ! $cards ) { return ''; }
    $title = $settings['homepage_categories_title'] ?? __( 'Explore categories', 'codela-storefront' );
    return '<section class="sf-home-section sf-home-categories">' . ( $title ? '<h2>' . esc_html( $title ) . '</h2>' : '' ) . '<div class="sf-home-category-grid">' . $cards . '</div></section>';
}
/** Use native catalog visibility and Woo's authoritative total_sales metadata. */
function codela_sf_home_products( array $row ): array {
    $category = absint( $row['category_id'] ?? 0 );
    if ( $category ) { $term = get_term( $category, 'product_cat' ); if ( ! $term || is_wp_error( $term ) ) { return []; } }
    $visibility = wc_get_product_visibility_term_ids();
    $excluded = [ $visibility['exclude-from-catalog'] ];
    if ( 'yes' === get_option( 'woocommerce_hide_out_of_stock_items' ) ) { $excluded[] = $visibility['outofstock']; }
    $tax = [ [ 'taxonomy' => 'product_visibility', 'field' => 'term_taxonomy_id', 'terms' => $excluded, 'operator' => 'NOT IN' ] ];
    if ( $category ) { $tax[] = [ 'taxonomy' => 'product_cat', 'field' => 'term_id', 'terms' => [ $category ], 'include_children' => true ]; }
    $limit = absint( $row['limit'] ?? 4 ); if ( ! in_array( $limit, [ 4, 8, 12 ], true ) ) { $limit = 4; }
    $args = [ 'post_type' => 'product', 'post_status' => 'publish', 'has_password' => false, 'posts_per_page' => $limit, 'no_found_rows' => true, 'fields' => 'ids', 'tax_query' => $tax, 'orderby' => [ 'date' => 'DESC', 'ID' => 'DESC' ], 'ignore_sticky_posts' => true ];
    if ( 'best_sellers' === ( $row['source'] ?? '' ) ) { $args['meta_key'] = 'total_sales'; $args['orderby'] = [ 'meta_value_num' => 'DESC', 'date' => 'DESC', 'ID' => 'DESC' ]; }
    $query = new WP_Query( $args ); $products = [];
    foreach ( $query->posts as $id ) {
        $product = wc_get_product( $id );
        if ( $product && $product->is_visible() && 'publish' === $product->get_status() && ! get_post_field( 'post_password', $id ) && ( 'yes' !== get_option( 'woocommerce_hide_out_of_stock_items' ) || $product->is_in_stock() ) ) { $products[] = $product; }
    }
    return $products;
}
function codela_sf_home_sections(): string {
    $settings = codela_theme_settings();
    $html = codela_sf_home_slider( $settings ) . codela_sf_home_categories( $settings );
    foreach ( array_slice( (array) ( $settings['homepage_sections'] ?? [] ), 0, 4 ) as $row ) {
        if ( ! is_array( $row ) || empty( $row['enabled'] ) ) { continue; }
        $products = codela_sf_home_products( $row ); if ( ! $products ) { continue; }
        $title = trim( (string) ( $row['title'] ?? '' ) ) ?: ( 'best_sellers' === ( $row['source'] ?? '' ) ? __( 'Best sellers', 'codela-storefront' ) : __( 'New arrivals', 'codela-storefront' ) );
        $url = ! empty( $row['category_id'] ) ? get_term_link( absint( $row['category_id'] ), 'product_cat' ) : wc_get_page_permalink( 'shop' );
        $html .= '<section class="sf-home-section sf-home-products woocommerce"><div class="sf-home-section-heading"><h2>' . esc_html( $title ) . '</h2>';
        if ( ! empty( $row['show_all'] ) && ! is_wp_error( $url ) ) { $html .= '<a href="' . esc_url( add_query_arg( 'orderby', 'best_sellers' === ( $row['source'] ?? '' ) ? 'popularity' : 'date', $url ) ) . '">' . esc_html__( 'View all', 'codela-storefront' ) . '</a>'; }
        $html .= '</div>' . codela_sf_product_grid( $products ) . '</section>';
    }
    if ( '' === $html ) { return '<section class="sf-home-section"><h1>' . esc_html( get_bloginfo( 'name' ) ) . '</h1><p>' . esc_html__( 'Our collection is coming soon.', 'codela-storefront' ) . '</p></section>'; }
    return $html;
}
