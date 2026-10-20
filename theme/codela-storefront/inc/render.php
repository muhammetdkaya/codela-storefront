<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
require_once __DIR__ . '/ui.php';
function codela_sf_icon( string $name ): string {
    if ( ! in_array( $name, [ 'sliders-horizontal', 'search', 'shopping-bag', 'menu', 'x', 'arrow-left', 'arrow-right', 'plus', 'minus', 'house', 'user-round', 'map-pin', 'log-out' ], true ) ) { return ''; }
    static $versions = [];
    $versions[ $name ] ??= hash_file( 'crc32b', __DIR__ . '/../assets/icons/' . $name . '.svg' );
    return '<img class="sf-icon" width="22" height="22" alt="" src="' . esc_url( get_template_directory_uri() . '/assets/icons/' . $name . '.svg?ver=' . $versions[ $name ] ) . '">';
}
function codela_sf_menu( bool $desktop = false ): string {
    if ( ! has_nav_menu( 'primary' ) ) { return ''; }
    if ( $desktop ) { require_once __DIR__ . '/menu-walker.php'; }
    return (string) wp_nav_menu( [ 'menu_id' => $desktop ? 'sf-desktop-menu' : 'sf-panel-menu', 'walker' => $desktop ? new Codela_SF_Menu_Walker() : null, 'theme_location' => 'primary', 'echo' => false, 'container' => false, 'menu_class' => $desktop ? 'sf-desktop-menu' : 'sf-menu-list', 'fallback_cb' => false, 'depth' => 0 ] );
}

function codela_sf_header(): string {
    if ( ! codela_sf_ready() ) { return ''; }
    // Guest authentication has its own quiet header. Do not show the store dock,
    // search/cart dialogs or a second menu above the WooCommerce login form.
    if ( function_exists( 'is_account_page' ) && is_account_page() && ! is_user_logged_in() ) {
        $settings = codela_theme_settings();
        ob_start(); ?>
        <div class="sf-shell sf-auth-shell">
            <a class="sf-skip" href="#sf-content"><?php esc_html_e( 'Skip to content', 'codela-storefront' ); ?></a>
            <header class="sf-auth-site-header" aria-label="<?php esc_attr_e( 'Your account', 'codela-storefront' ); ?>">
                <div class="sf-auth-brand">
                    <?php if ( has_custom_logo() ) { the_custom_logo(); } else { ?>
                    <a data-sf-route="home" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></a>
                    <?php } ?>
                </div>
                <a class="sf-auth-store-link sf-ui-pressable" href="<?php echo esc_url( home_url( '/' ) ); ?>">
                    <?php esc_html_e( 'Back to store', 'codela-storefront' ); ?>
                    <?php echo codela_sf_icon( 'arrow-right' ); ?>
                </a>
            </header>
        </div>
        <?php return ob_get_clean();
    }
    $settings = codela_theme_settings();
    $catalog_page = function_exists( 'codela_sf_is_catalog_archive' ) && codela_sf_is_catalog_archive();
    $desktop_menu = codela_sf_menu( true );
    $guest_account = ! is_user_logged_in();
    $checkout_page = is_checkout();
    $show_mobile_dock = ! $checkout_page && ! in_array( $settings['mobile_dock_enabled'] ?? true, [ false, 0, '0', '' ], true );
    // Checkout is a full page without the mobile dock, but uses the same
    // compact mobile header layout as pages with the dock enabled.
    $product_page = function_exists( 'is_product' ) && is_product();
    // Product document uses header tools while purchase occupies the bottom.
    // Keep the single real dock available when it moves into the dialog.
    $header_mode = $product_page ? 'has-product-header' . ( $show_mobile_dock ? ' has-mobile-dock' : '' ) : ( $show_mobile_dock ? 'has-mobile-dock' : ( $checkout_page ? 'has-checkout-header' : 'has-header-tools' ) );
    $labels = [];
    foreach ( [ 'Loading…', 'Search products', 'No matching products.', 'Something went wrong. Please try again.', 'Your cart is empty.', 'Remove', 'Quantity', 'Decrease quantity', 'Increase quantity', 'Back', 'View all', 'Cart updated.', 'Retry', 'Your cart', 'Item added to cart.', 'Subtotal', 'Shipping and discounts are calculated at checkout.', 'My account', 'Filters' ] as $label ) {
        $labels[ $label ] = __( $label, 'codela-storefront' ); // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
    }
    wp_interactivity_state( 'codela/storefront', [ 'config' => [
        'api' => esc_url_raw( rest_url( 'wc/store/v1/' ) ),
        'search' => esc_url_raw( rest_url( 'codela/v1/theme/search' ) ),
        'home' => esc_url_raw( home_url( '/' ) ), 'shop' => esc_url_raw( wc_get_page_permalink( 'shop' ) ),
        'cart' => esc_url_raw( wc_get_cart_url() ), 'checkout' => esc_url_raw( wc_get_checkout_url() ),
        'account' => esc_url_raw( wc_get_page_permalink( 'myaccount' ) ),
        'taxInclusive' => 'incl' === get_option( 'woocommerce_tax_display_cart' ),
        'labels' => $labels,
    ] ] );
    ob_start(); ?>
    <div data-wp-interactive="codela/storefront" class="sf-shell <?php echo esc_attr( $header_mode . ( $catalog_page ? ' has-catalog-header' : '' ) ); ?>">
        <a class="sf-skip" href="#sf-content"><?php esc_html_e( 'Skip to content', 'codela-storefront' ); ?></a>
        <header class="sf-header<?php echo $desktop_menu ? ' has-desktop-menu' : ''; ?>">
            <nav class="sf-header-menu" aria-label="<?php esc_attr_e( 'Main menu', 'codela-storefront' ); ?>">
                <?php echo codela_sf_ui_icon_button( 'menu', __( 'Menu', 'codela-storefront' ), [ 'variant' => 'soft', 'class' => 'sf-menu-trigger', 'href' => '#sf-menu-fallback', 'attributes' => [ 'data-wp-on--click' => 'actions.menu', 'data-panel' => 'menu', 'aria-haspopup' => 'dialog', 'aria-controls' => 'sf-panel', 'aria-expanded' => 'false' ] ] ); ?>
            </nav>
            <div class="sf-brand sf-ui-surface"><?php if ( has_custom_logo() ) { the_custom_logo(); } else { ?><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></a><?php } ?></div>
            <?php if ( $desktop_menu ) : ?><nav class="sf-desktop-navigation sf-ui-surface" aria-label="<?php esc_attr_e( 'Main menu', 'codela-storefront' ); ?>"><?php echo $desktop_menu; ?></nav><?php endif; ?>
            <div class="sf-header-search sf-ui-surface" hidden></div>
            <nav class="sf-actions sf-ui-surface<?php echo $product_page || ( $catalog_page && $show_mobile_dock ) ? ' sf-ui-icon-group--single-mobile' : ''; ?>" aria-label="<?php esc_attr_e( 'Store tools', 'codela-storefront' ); ?>">
                <?php if ( $catalog_page ) { echo codela_sf_ui_icon_button( 'sliders-horizontal', __( 'Filters', 'codela-storefront' ), [ 'variant' => $show_mobile_dock ? 'soft' : 'bare', 'class' => 'sf-filter-trigger', 'href' => '#sf-filters', 'attributes' => [ 'data-wp-on--click' => 'actions.filters', 'data-panel' => 'filters', 'aria-haspopup' => 'dialog', 'aria-controls' => 'sf-panel', 'aria-expanded' => 'false' ] ] ); } ?>
                <?php echo codela_sf_ui_icon_button( 'search', __( 'Search', 'codela-storefront' ), [ 'href' => add_query_arg( [ 's' => '', 'post_type' => 'product' ], home_url( '/' ) ), 'attributes' => [ 'data-wp-on--click' => 'actions.search', 'data-panel' => 'search', 'aria-haspopup' => 'dialog', 'aria-expanded' => 'false' ] ] ); ?>
                <?php echo codela_sf_ui_icon_button( 'shopping-bag', __( 'Your cart', 'codela-storefront' ), [ 'variant' => $product_page ? 'soft' : 'bare', 'href' => wc_get_cart_url(), 'class' => 'sf-cart-trigger', 'attributes' => [ 'data-wp-on--click' => 'actions.cart', 'data-panel' => 'cart', 'aria-haspopup' => 'dialog', 'aria-expanded' => 'false' ] ], '<span class="sf-badge" aria-hidden="true"></span>' ); ?>
                <?php echo codela_sf_ui_icon_button( 'user-round', __( 'My account', 'codela-storefront' ), [
    'href' => wc_get_page_permalink( 'myaccount' ), 'class' => 'sf-account-link',
    'attributes' => $guest_account ? [ 'data-wp-on--click' => 'actions.account', 'data-panel' => 'account', 'aria-haspopup' => 'dialog', 'aria-expanded' => 'false' ] : [],
] ); ?>
            </nav>
        </header>
        <?php if ( $show_mobile_dock ) : ?>
        <nav class="sf-mobile-dock<?php echo is_front_page() || is_account_page() ? ' has-selection' : ''; ?>" style="--sf-dock-index:<?php echo is_account_page() ? 3 : 0; ?>" aria-label="<?php esc_attr_e( 'Mobile navigation', 'codela-storefront' ); ?>">
            <div class="sf-dock-surface">
            <a data-dock-view="home" data-sf-route="home" class="sf-dock-item sf-ui-nav-tab <?php echo esc_attr( is_front_page() ? 'is-active' : '' ); ?>" href="<?php echo esc_url( home_url( '/' ) ); ?>" <?php if ( is_front_page() ) : ?>aria-current="page"<?php endif; ?>>
                <?php echo codela_sf_icon( 'house' ); ?><span><?php esc_html_e( 'Home', 'codela-storefront' ); ?></span>
            </a>
            <a data-dock-view="search" class="sf-dock-item sf-ui-nav-tab" href="<?php echo esc_url( add_query_arg( [ 's' => '', 'post_type' => 'product' ], home_url( '/' ) ) ); ?>" data-wp-on--click="actions.search" data-panel="search" aria-haspopup="dialog" aria-expanded="false" aria-label="<?php esc_attr_e( 'Search', 'codela-storefront' ); ?>">
                <?php echo codela_sf_icon( 'search' ); ?><span><?php esc_html_e( 'Search', 'codela-storefront' ); ?></span>
            </a>
            <a data-dock-view="cart" class="sf-dock-item sf-ui-nav-tab" href="<?php echo esc_url( wc_get_cart_url() ); ?>" data-wp-on--click="actions.cart" data-panel="cart" aria-haspopup="dialog" aria-expanded="false" aria-label="<?php esc_attr_e( 'Your cart', 'codela-storefront' ); ?>">
                <span class="sf-ui-icon-badged"><?php echo codela_sf_icon( 'shopping-bag' ); ?><span class="sf-badge" aria-hidden="true"></span></span><span><?php esc_html_e( 'Cart', 'codela-storefront' ); ?></span>
            </a>
            <a data-dock-view="account" class="sf-dock-item sf-ui-nav-tab <?php echo esc_attr( is_account_page() ? 'is-active' : '' ); ?>" href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>" <?php if ( $guest_account ) : ?>data-wp-on--click="actions.account" data-panel="account" aria-haspopup="dialog" aria-expanded="false"<?php endif; ?> <?php if ( is_account_page() ) : ?>aria-current="page"<?php endif; ?>>
                <?php echo codela_sf_icon( 'user-round' ); ?><span><?php esc_html_e( 'My account', 'codela-storefront' ); ?></span>
            </a>
            </div>
            <button type="button" class="sf-dock-handle" tabindex="-1" aria-hidden="true" aria-label="<?php esc_attr_e( 'Show navigation', 'codela-storefront' ); ?>"></button>
        </nav>
        <?php endif; ?>
        <dialog class="sf-panel" id="sf-panel" aria-labelledby="sf-panel-title">
            <div class="sf-panel-top"><h2 id="sf-panel-title" tabindex="-1"></h2><?php echo codela_sf_ui_icon_button( 'x', __( 'Close', 'codela-storefront' ), [ 'variant' => 'soft', 'class' => 'sf-close', 'attributes' => [ 'data-wp-on--click' => 'actions.close' ] ] ); ?></div>
            <section class="sf-panel-body" id="sf-menu" hidden><?php if ( ! $show_mobile_dock ) : ?><nav class="sf-menu-tools" aria-label="<?php esc_attr_e( 'Store tools', 'codela-storefront' ); ?>">
                <?php echo codela_sf_ui_icon_button( 'search', __( 'Search', 'codela-storefront' ), [ 'variant' => 'soft', 'href' => add_query_arg( [ 's' => '', 'post_type' => 'product' ], home_url( '/' ) ), 'attributes' => [ 'data-wp-on--click' => 'actions.search', 'data-panel' => 'search', 'aria-haspopup' => 'dialog', 'aria-expanded' => 'false' ] ] ); ?>
                <?php echo codela_sf_ui_icon_button( 'user-round', __( 'My account', 'codela-storefront' ), [ 'variant' => 'soft', 'href' => wc_get_page_permalink( 'myaccount' ), 'attributes' => $guest_account ? [ 'data-wp-on--click' => 'actions.account', 'data-panel' => 'account', 'aria-haspopup' => 'dialog', 'aria-expanded' => 'false' ] : [] ] ); ?>
            </nav><?php endif; ?><button class="sf-back" hidden><?php echo codela_sf_icon( 'arrow-left' ); ?><?php esc_html_e( 'Back', 'codela-storefront' ); ?></button><nav aria-label="<?php esc_attr_e( 'Main menu', 'codela-storefront' ); ?>"><?php echo codela_sf_menu(); ?></nav><div class="sf-menu-secondary"><?php if ( get_privacy_policy_url() ) { ?><a href="<?php echo esc_url( get_privacy_policy_url() ); ?>"><?php esc_html_e( 'Privacy', 'codela-storefront' ); ?></a><?php } ?></div></section>
            <?php if ( $guest_account ) : ?>
            <section class="sf-panel-body sf-account-body" id="sf-account" hidden>
                <?php echo codela_sf_account_overlay_form(); ?>
            </section>
            <?php endif; ?>
            <section class="sf-panel-body sf-search-body" id="sf-search" hidden>
                <div class="sf-search-toolbar">
                    <form class="sf-search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>" method="get" role="search">
                        <input type="hidden" name="post_type" value="product">
                        <span class="sf-search-leading" aria-hidden="true"><?php echo codela_sf_icon( 'search' ); ?></span>
                        <label class="screen-reader-text" for="sf-query"><?php esc_html_e( 'Search products', 'codela-storefront' ); ?></label>
                        <input id="sf-query" type="search" name="s" maxlength="80" autocomplete="off" enterkeyhint="search" placeholder="<?php esc_attr_e( 'Search', 'codela-storefront' ); ?>">
                        <?php echo codela_sf_ui_icon_button( 'x', __( 'Clear search', 'codela-storefront' ), [ 'variant' => 'clear', 'class' => 'sf-search-clear', 'attributes' => [ 'data-control' => 'search-clear', 'hidden' => true ] ] ); ?>
                    </form>
                    <?php echo codela_sf_ui_icon_button( 'x', __( 'Close', 'codela-storefront' ), [ 'variant' => 'soft', 'class' => 'sf-search-cancel sf-close', 'attributes' => [ 'data-wp-on--click' => 'actions.close' ] ] ); ?>
                </div>
                <div class="sf-search-content">
                    <div id="sf-results" aria-live="polite"></div>
                </div>
            </section>
            <?php if ( $catalog_page ) : ?><section class="sf-panel-body" id="sf-filters" hidden><?php echo codela_sf_catalog_filters(); ?></section><?php endif; ?>
            <section class="sf-panel-body" id="sf-cart" hidden><div id="sf-cart-items"></div></section>
            <div class="sf-cart-bottom" hidden><div class="sf-subtotal"><span><?php esc_html_e( 'Subtotal', 'codela-storefront' ); ?></span><strong id="sf-subtotal"></strong></div><p><?php esc_html_e( 'Shipping and discounts are calculated at checkout.', 'codela-storefront' ); ?></p><?php echo codela_sf_ui_primary_link( wc_get_checkout_url(), __( 'Checkout', 'codela-storefront' ) ); ?></div>
            <p class="sf-status" id="sf-status" role="status" aria-live="polite"></p>
        </dialog>
        <noscript><style>#sf-filters{display:block!important}#sf-panel:not([open]):has(#sf-filters){display:block;position:static;height:auto}#sf-panel:not([open])>:not(#sf-filters){display:none}</style><nav id="sf-menu-fallback"><?php echo codela_sf_menu(); ?></nav></noscript>
    </div>
    <?php return ob_get_clean();
}
function codela_sf_home(): string {
    if ( ! codela_sf_ready() ) { return ''; }
    // WordPress Reading settings are the only homepage selector.
    if ( 'page' === get_option( 'show_on_front' ) ) {
        return do_blocks( '<!-- wp:post-content {"layout":{"type":"constrained"}} /-->' );
    }
    return do_blocks( '<!-- wp:group {"className":"sf-journal"} --><div class="wp-block-group sf-journal"><!-- wp:pattern {"slug":"codela-storefront/journal-heading"} /--><!-- wp:pattern {"slug":"codela-storefront/journal-loop"} /--></div><!-- /wp:group -->' );
}



/** Optional footer note is declared by the theme's own settings schema. */
function codela_sf_footer(): string {
    if ( ! codela_sf_ready() ) { return ''; }
    $settings = codela_theme_settings();
    $brand = (string) ( get_bloginfo( 'name' ) );
    $note = sanitize_text_field( (string) ( $settings['footer_text'] ?? '' ) );
    $privacy_url = get_privacy_policy_url();
    $terms_id = absint( get_option( 'woocommerce_terms_page_id', 0 ) );
    $terms_url = $terms_id && 'publish' === get_post_status( $terms_id ) ? get_permalink( $terms_id ) : '';

    $html = '<footer class="sf-footer"><div class="sf-footer-inner"><div class="sf-footer-copy">';
    $html .= '<span class="sf-footer-copyright">© ' . esc_html( wp_date( 'Y' ) ) . '</span>';
    $html .= '<a class="sf-footer-brand" href="' . esc_url( home_url( '/' ) ) . '">' . esc_html( $brand ) . '</a>';
    if ( '' !== $note ) {
        $html .= '<span class="sf-footer-note" title="' . esc_attr( $note ) . '">' . esc_html( $note ) . '</span>';
    }
    $html .= '</div>';

    if ( $privacy_url || $terms_url ) {
        $html .= '<nav class="sf-footer-links" aria-label="' . esc_attr__( 'Legal links', 'codela-storefront' ) . '">';
        if ( $privacy_url ) {
            $html .= '<a href="' . esc_url( $privacy_url ) . '">' . esc_html__( 'Privacy', 'codela-storefront' ) . '</a>';
        }
        if ( $terms_url ) {
            $html .= '<a href="' . esc_url( $terms_url ) . '">' . esc_html__( 'Terms', 'codela-storefront' ) . '</a>';
        }
        $html .= '</nav>';
    }

    return $html . '</div></footer>';
}

