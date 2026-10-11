<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_icon( string $name ): string {
    if ( ! in_array( $name, [ 'search', 'shopping-bag', 'menu', 'x', 'arrow-left', 'arrow-right', 'plus', 'minus', 'house', 'user-round' ], true ) ) { return ''; }
    return '<img class="sf-icon" width="22" height="22" alt="" src="' . esc_url( get_template_directory_uri() . '/assets/icons/' . $name . '.svg' ) . '">';
}
function codela_sf_menu(): string {
    $settings = codela_theme_settings();
    $menu = absint( $settings['menu_id'] );
    if ( ! $menu ) { $locations = get_nav_menu_locations(); $menu = absint( $locations['primary'] ?? 0 ); }
    if ( $menu && wp_get_nav_menu_object( $menu ) ) {
        return wp_nav_menu( [ 'menu' => $menu, 'echo' => false, 'container' => false, 'menu_class' => 'sf-menu-list', 'fallback_cb' => false, 'depth' => 3 ] );
    }
    $html = '<ul class="sf-menu-list"><li><a href="' . esc_url( wc_get_page_permalink( 'shop' ) ) . '">' . esc_html__( 'All products', 'codela-storefront' ) . '</a></li>';
    $terms = get_terms( [ 'taxonomy' => 'product_cat', 'hide_empty' => true, 'number' => 100 ] );
    if ( ! is_wp_error( $terms ) ) {
        $render = static function( $parent, $depth = 0 ) use ( &$render, $terms ) {
            if ( $depth > 2 ) { return ''; }
            $out = '';
            foreach ( $terms as $term ) {
                if ( (int) $term->parent !== (int) $parent ) { continue; }
                $url = get_term_link( $term );
                if ( is_wp_error( $url ) ) { continue; }
                $children = $render( $term->term_id, $depth + 1 );
                $out .= '<li><a href="' . esc_url( $url ) . '">' . esc_html( $term->name ) . '</a>' . ( $children ? '<ul class="sub-menu">' . $children . '</ul>' : '' ) . '</li>';
            }
            return $out;
        };
        $html .= $render( 0 );
    }
    return $html . '</ul>';
}
function codela_sf_header(): string {
    if ( ! codela_sf_ready() ) { return ''; }
    $settings = codela_theme_settings();
    $labels = [];
    foreach ( [ 'Loading…', 'Search products', 'No matching products.', 'Something went wrong. Please try again.', 'Your cart is empty.', 'Remove', 'Quantity', 'Decrease quantity', 'Increase quantity', 'Back', 'View all', 'Cart updated.', 'Retry', 'Your cart', 'Item added to cart.', 'Subtotal', 'Shipping and discounts are calculated at checkout.' ] as $label ) {
        $labels[ $label ] = __( $label, 'codela-storefront' ); // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
    }
    wp_interactivity_state( 'codela/storefront', [ 'config' => [
        'api' => esc_url_raw( rest_url( 'wc/store/v1/' ) ),
        'search' => esc_url_raw( rest_url( 'codela/v1/theme/search' ) ),
        'home' => esc_url_raw( home_url( '/' ) ), 'shop' => esc_url_raw( wc_get_page_permalink( 'shop' ) ),
        'cart' => esc_url_raw( wc_get_cart_url() ), 'checkout' => esc_url_raw( wc_get_checkout_url() ),
        'taxInclusive' => 'incl' === get_option( 'woocommerce_tax_display_cart' ),
        'labels' => $labels,
    ] ] );
    ob_start(); ?>
    <div data-wp-interactive="codela/storefront" class="sf-shell">
        <a class="sf-skip" href="#sf-content"><?php esc_html_e( 'Skip to content', 'codela-storefront' ); ?></a>
        <header class="sf-header">
            <nav class="sf-header-menu" aria-label="<?php esc_attr_e( 'Main menu', 'codela-storefront' ); ?>">
                <a class="sf-icon-button" href="#sf-menu-fallback" data-wp-on--click="actions.menu" data-panel="menu" aria-label="<?php esc_attr_e( 'Menu', 'codela-storefront' ); ?>" aria-haspopup="dialog" aria-expanded="false"><?php echo codela_sf_icon( 'menu' ); ?></a>
            </nav>
            <div class="sf-brand"><?php if ( has_custom_logo() ) { the_custom_logo(); } else { ?><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo esc_html( $settings['brand'] ?: get_bloginfo( 'name' ) ); ?></a><?php } ?></div>
            <nav class="sf-actions" aria-label="<?php esc_attr_e( 'Store tools', 'codela-storefront' ); ?>">
                <a class="sf-icon-button" href="<?php echo esc_url( add_query_arg( [ 's' => '', 'post_type' => 'product' ], home_url( '/' ) ) ); ?>" data-wp-on--click="actions.search" data-panel="search" aria-label="<?php esc_attr_e( 'Search', 'codela-storefront' ); ?>" aria-haspopup="dialog" aria-expanded="false"><?php echo codela_sf_icon( 'search' ); ?></a>
                <a class="sf-icon-button" href="<?php echo esc_url( wc_get_cart_url() ); ?>" data-wp-on--click="actions.cart" data-panel="cart" aria-label="<?php esc_attr_e( 'Your cart', 'codela-storefront' ); ?>" aria-haspopup="dialog" aria-expanded="false"><?php echo codela_sf_icon( 'shopping-bag' ); ?><span class="sf-badge" aria-hidden="true"></span></a>
            </nav>
        </header>
        <?php if ( ! is_checkout() ) : ?>
        <nav class="sf-mobile-dock" aria-label="<?php esc_attr_e( 'Mobile navigation', 'codela-storefront' ); ?>">
            <a class="sf-dock-item <?php echo esc_attr( is_front_page() ? 'is-active' : '' ); ?>" href="<?php echo esc_url( home_url( '/' ) ); ?>" <?php if ( is_front_page() ) : ?>aria-current="page"<?php endif; ?>>
                <?php echo codela_sf_icon( 'house' ); ?><span><?php esc_html_e( 'Home', 'codela-storefront' ); ?></span>
            </a>
            <a class="sf-dock-item" href="<?php echo esc_url( add_query_arg( [ 's' => '', 'post_type' => 'product' ], home_url( '/' ) ) ); ?>" data-wp-on--click="actions.search" data-panel="search" aria-haspopup="dialog" aria-expanded="false" aria-label="<?php esc_attr_e( 'Search', 'codela-storefront' ); ?>">
                <?php echo codela_sf_icon( 'search' ); ?><span><?php esc_html_e( 'Search', 'codela-storefront' ); ?></span>
            </a>
            <a class="sf-dock-item" href="<?php echo esc_url( wc_get_cart_url() ); ?>" data-wp-on--click="actions.cart" data-panel="cart" aria-haspopup="dialog" aria-expanded="false" aria-label="<?php esc_attr_e( 'Your cart', 'codela-storefront' ); ?>">
                <?php echo codela_sf_icon( 'shopping-bag' ); ?><span class="sf-badge" aria-hidden="true"></span><span><?php esc_html_e( 'Cart', 'codela-storefront' ); ?></span>
            </a>
            <a class="sf-dock-item <?php echo esc_attr( is_account_page() ? 'is-active' : '' ); ?>" href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>" <?php if ( is_account_page() ) : ?>aria-current="page"<?php endif; ?>>
                <?php echo codela_sf_icon( 'user-round' ); ?><span><?php esc_html_e( 'My account', 'codela-storefront' ); ?></span>
            </a>
        </nav>
        <?php endif; ?>
        <dialog class="sf-panel" id="sf-panel" aria-labelledby="sf-panel-title">
            <div class="sf-panel-top"><h2 id="sf-panel-title" tabindex="-1"></h2><button class="sf-icon-button sf-close" data-wp-on--click="actions.close" aria-label="<?php esc_attr_e( 'Close', 'codela-storefront' ); ?>"><?php echo codela_sf_icon( 'x' ); ?></button></div>
            <section class="sf-panel-body" id="sf-menu" hidden><button class="sf-back" hidden><?php echo codela_sf_icon( 'arrow-left' ); ?><?php esc_html_e( 'Back', 'codela-storefront' ); ?></button><nav aria-label="<?php esc_attr_e( 'Main menu', 'codela-storefront' ); ?>"><?php echo codela_sf_menu(); ?></nav><div class="sf-menu-secondary"><a href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>"><?php esc_html_e( 'My account', 'codela-storefront' ); ?></a><?php if ( get_privacy_policy_url() ) { ?><a href="<?php echo esc_url( get_privacy_policy_url() ); ?>"><?php esc_html_e( 'Privacy', 'codela-storefront' ); ?></a><?php } ?></div></section>
            <section class="sf-panel-body sf-search-body" id="sf-search" hidden>
                <div class="sf-search-toolbar">
                    <form class="sf-search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>" method="get" role="search">
                        <input type="hidden" name="post_type" value="product">
                        <span class="sf-search-leading" aria-hidden="true"><?php echo codela_sf_icon( 'search' ); ?></span>
                        <label class="screen-reader-text" for="sf-query"><?php esc_html_e( 'Search products', 'codela-storefront' ); ?></label>
                        <input id="sf-query" type="search" name="s" maxlength="80" autocomplete="off" enterkeyhint="search" placeholder="<?php esc_attr_e( 'Search', 'codela-storefront' ); ?>">
                        <button type="button" class="sf-search-clear" aria-label="<?php esc_attr_e( 'Clear search', 'codela-storefront' ); ?>" hidden><?php echo codela_sf_icon( 'x' ); ?></button>
                    </form>
                    <button type="button" class="sf-search-cancel sf-close" data-wp-on--click="actions.close" aria-label="<?php esc_attr_e( 'Close', 'codela-storefront' ); ?>"><?php echo codela_sf_icon( 'x' ); ?></button>
                </div>
                <div class="sf-search-content">
                    <div id="sf-results" aria-live="polite"></div>
                </div>
            </section>
            <section class="sf-panel-body" id="sf-cart" hidden><div id="sf-cart-items"></div></section>
            <div class="sf-cart-bottom" hidden><div class="sf-subtotal"><span><?php esc_html_e( 'Subtotal', 'codela-storefront' ); ?></span><strong id="sf-subtotal"></strong></div><p><?php esc_html_e( 'Shipping and discounts are calculated at checkout.', 'codela-storefront' ); ?></p><a class="sf-primary" href="<?php echo esc_url( wc_get_checkout_url() ); ?>"><?php esc_html_e( 'Checkout', 'codela-storefront' ); ?> <?php echo codela_sf_icon( 'arrow-right' ); ?></a></div>
            <p class="sf-status" id="sf-status" role="status" aria-live="polite"></p>
        </dialog>
        <noscript><nav id="sf-menu-fallback"><?php echo codela_sf_menu(); ?></nav></noscript>
    </div>
    <?php return ob_get_clean();
}
function codela_sf_home(): string {
    if ( ! codela_sf_ready() ) { return ''; }
    if ( 'page' === get_option( 'show_on_front' ) && get_option( 'page_on_front' ) && trim( (string) get_post_field( 'post_content', get_option( 'page_on_front' ) ) ) ) {
        return do_blocks( '<!-- wp:post-content {"layout":{"type":"constrained"}} /-->' );
    }
    $settings = codela_theme_settings();
    $products = wc_get_products( [ 'status' => 'publish', 'visibility' => 'visible', 'limit' => 7, 'orderby' => 'date', 'order' => 'DESC' ] );
    $products = array_values( array_filter( $products, static fn( $p ) => $p->is_visible() && ! get_post_field( 'post_password', $p->get_id() ) ) );
    $hero = ! empty( $settings['hero_product_id'] ) ? wc_get_product( $settings['hero_product_id'] ) : null;
    if ( ! $hero || ! $hero->is_visible() || 'publish' !== $hero->get_status() || get_post_field( 'post_password', $hero->get_id() ) ) { $hero = $products[0] ?? null; }
    ob_start();
    if ( $hero ) { ?>
        <section class="sf-hero"><a class="sf-hero-art" href="<?php echo esc_url( $hero->get_permalink() ); ?>"><?php echo $hero->get_image( 'large', [ 'loading' => 'eager', 'fetchpriority' => 'high' ] ); ?></a><div class="sf-hero-info"><p class="sf-kicker"><?php esc_html_e( 'A considered selection', 'codela-storefront' ); ?></p><h1><?php echo esc_html( $hero->get_name() ); ?></h1><div class="sf-description"><?php echo wp_kses_post( wpautop( $hero->get_short_description() ) ); ?></div><div class="sf-price"><?php echo wp_kses_post( $hero->get_price_html() ); ?></div><a class="sf-primary" href="<?php echo esc_url( $hero->get_permalink() ); ?>"><?php esc_html_e( 'Discover', 'codela-storefront' ); ?> <?php echo codela_sf_icon( 'arrow-right' ); ?></a></div></section>
        <section class="sf-selection"><h2><?php esc_html_e( 'Explore the collection', 'codela-storefront' ); ?></h2><div class="sf-products"><?php foreach ( $products as $product ) { ?><article><a href="<?php echo esc_url( $product->get_permalink() ); ?>"><?php echo $product->get_image( 'woocommerce_thumbnail', [ 'loading' => 'lazy' ] ); ?><h3><?php echo esc_html( $product->get_name() ); ?></h3></a><div><?php echo wp_kses_post( $product->get_price_html() ); ?></div></article><?php } ?></div></section>
    <?php } else { ?><section class="sf-selection"><h1><?php echo esc_html( get_bloginfo( 'name' ) ); ?></h1><p><?php esc_html_e( 'Our collection is coming soon.', 'codela-storefront' ); ?></p></section><?php }
    return ob_get_clean();
}


/** Optional footer note is declared by the theme's own settings schema. */
function codela_sf_footer(): string {
    if ( ! codela_sf_ready() ) { return ''; }
    $settings = codela_theme_settings();
    $brand = (string) ( $settings['brand'] ?: get_bloginfo( 'name' ) );
    $note = sanitize_text_field( (string) ( $settings['footer_text'] ?? '' ) );
    $html = '<footer class="sf-footer"><div class="sf-footer-inner">';
    $html .= '<a class="sf-footer-brand" href="' . esc_url( home_url( '/' ) ) . '">' . esc_html( $brand ) . '</a>';
    if ( '' !== $note ) { $html .= '<p class="sf-footer-note">' . esc_html( $note ) . '</p>'; }
    return $html . '</div></footer>';
}
