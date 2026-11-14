<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_ready(): bool {
    return defined( 'CODELA_VERSION' ) && version_compare( CODELA_VERSION, '1.2.0', '>=' ) && defined( 'CODELA_THEME_API_VERSION' ) && version_compare( CODELA_THEME_API_VERSION, '1.0.0', '>=' ) && defined( 'WC_VERSION' ) && version_compare( WC_VERSION, '9.0', '>=' ) && function_exists( 'wp_interactivity_state' );
}
/** Guest storefront panels load account enhancements only when requested. */
function codela_sf_guest_auth_lazy_allowed(): bool {
    return ! is_user_logged_in() && ( ! function_exists( 'is_account_page' ) || ! is_account_page() );
}
add_action( 'after_setup_theme', function() {
    load_theme_textdomain( 'codela-storefront', get_template_directory() . '/languages' );
    add_theme_support( 'woocommerce' );
    add_theme_support( 'wc-product-gallery-lightbox' );
    add_theme_support( 'wc-product-gallery-slider' );
    add_theme_support( 'codela-storefront', [ 'api' => '1.0.0' ] );
    add_theme_support( 'title-tag' );
    add_theme_support( 'codela-page-sections', [ 'api' => '1.0.0' ] );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'custom-logo', [ 'height' => 80, 'width' => 240, 'flex-width' => true, 'flex-height' => true ] );
    register_nav_menus( [ 'primary' => __( 'Main menu', 'codela-storefront' ) ] );
} );
// The desktop projection uses the same native menu and shared link feedback.
add_filter( 'nav_menu_link_attributes', function( $attributes, $item, $args ) {
    if ( 'sf-desktop-menu' === ( $args->menu_class ?? '' ) ) {
        $attributes['class'] = trim( ( $attributes['class'] ?? '' ) . ' sf-ui-pressable' );
    }
    return $attributes;
}, 10, 3 );
add_filter( 'nav_menu_item_id', static function( $id, $item, $args ) {
    return 'sf-desktop-menu' === ( $args->menu_class ?? '' ) ? 'sf-desktop-item-' . absint( $item->ID ) : $id;
}, 10, 3 );
add_action( 'admin_notices', function() {
    if ( current_user_can( 'manage_options' ) && ! defined( 'CODELA_PAGE_SECTIONS_VERSION' ) ) {
        echo '<div class="notice notice-warning"><p>' . esc_html__( 'Update Codela to 1.2.0+ to enable theme settings and page sections.', 'codela-storefront' ) . '</p></div>';
    }
    if ( codela_sf_ready() ) { return; }
    echo '<div class="notice notice-error"><p>' . esc_html__( 'Codela Storefront requires the current Codela Commerce Toolkit plugin with theme support and WooCommerce 9.0+. Activate or update these plugins, or switch to another theme.', 'codela-storefront' ) . '</p></div>';
} );
add_action( 'template_redirect', function() {
    if ( ! codela_sf_ready() ) {
        wp_die( esc_html__( 'The store is temporarily unavailable. Please try again later.', 'codela-storefront' ), esc_html( get_bloginfo( 'name' ) ), [ 'response' => 503 ] );
    }
}, 1 );
/**
 * Unified stylesheet cache key. WordPress caches the theme's Version metadata
 * and every registered/enqueued CSS handle receives the same release key.
 */
function codela_sf_style_version(): string {
    static $version = null;
    if ( null === $version ) {
        $version = (string) wp_get_theme()->get( 'Version' );
        // codela.dev hotfixes must invalidate stylesheet URLs without publishing
        // a WordPress update to every Storefront installation.
        $deployment_marker = get_template_directory() . '/.codela-deploy-manifest.json';
        if ( is_file( $deployment_marker ) ) {
            $marker_hash = hash_file( 'sha256', $deployment_marker );
            if ( false !== $marker_hash ) {
                $version .= '-' . substr( $marker_hash, 0, 12 );
            }
        }
    }
    return $version;
}
/** Static, audited Codela SVGs for zero-request header transitions. */
function codela_sf_transition_icon( string $name ): string {
    static $cached = [];
    if ( ! in_array( $name, [ 'house', 'shopping-bag', 'menu', 'sliders-horizontal', 'search', 'user-round' ], true ) ) { return ''; }
    if ( isset( $cached[ $name ] ) ) { return $cached[ $name ]; }
    $file = get_template_directory() . '/assets/icons/' . $name . '.svg';
    if ( ! is_file( $file ) ) { return ''; }
    $svg = file_get_contents( $file );
    return $cached[ $name ] = is_string( $svg )
        ? str_replace( '<svg ', '<svg class="sf-icon" aria-hidden="true" focusable="false" ', $svg ) : '';
}
require_once get_template_directory() . '/inc/site-mode.php';
require_once get_template_directory() . '/inc/typography.php';
require_once get_template_directory() . '/inc/render.php';
require_once get_template_directory() . '/inc/cart-shipping.php';
require_once get_template_directory() . '/inc/product-mobile-media.php';
require_once get_template_directory() . '/inc/media.php';
require_once get_template_directory() . '/inc/navigation.php';
require_once get_template_directory() . '/inc/document-continuity.php';
require_once get_template_directory() . '/inc/media-optimization.php';
require_once get_template_directory() . '/inc/product.php';
require_once get_template_directory() . '/inc/catalog.php';
require_once get_template_directory() . '/inc/search.php';
require_once get_template_directory() . '/inc/sections.php';
require_once get_template_directory() . '/inc/account.php';
require_once get_template_directory() . '/inc/quick-login.php';
require_once get_template_directory() . '/inc/passkeys.php';
require_once get_template_directory() . '/inc/google-auth.php';
/**
 * Fixed file paths only; hash once per request. Stable module identifiers in
 * the import map let independently changed child files receive new URLs.
 */
function codela_sf_script_module_version( string $relative_file ): string {
    static $versions = [];
    if ( ! isset( $versions[ $relative_file ] ) ) {
        $path = get_template_directory() . '/assets/' . $relative_file;
        $versions[ $relative_file ] = is_file( $path )
            ? substr( hash_file( 'sha256', $path ), 0, 20 )
            : 'missing';
    }
    return $versions[ $relative_file ];
}

add_action( 'init', function() {
    if ( ! codela_sf_ready() ) { return; }
    $asset_url = get_template_directory_uri() . '/assets/';
    // Native loops can request this during block-template rendering before wp_head.
    wp_register_style( 'codela-storefront-catalog', $asset_url . 'styles/catalog.css', [ 'codela-storefront-components' ], codela_sf_style_version() );
    // All statically imported modules are registered in dependency order.
    // Native modules only; no vendor runtime, Node or post-6.5 API is needed.
    $modules = [
        'codela-storefront/format'  => [ 'scripts/format.js', [] ],
        'codela-storefront/search'  => [ 'scripts/search-controller.js', [ 'codela-storefront/format' ] ],
        'codela-storefront/cart'    => [ 'scripts/cart-controller.js', [ 'codela-storefront/format' ] ],
        'codela-storefront/panel-motion' => [ 'scripts/panel-motion.js', [] ],
        'codela-storefront/overlay' => [ 'scripts/overlay-controller.js', [ 'codela-storefront/panel-motion' ] ],
        'codela-storefront/dock'    => [ 'scripts/dock-controller.js', [] ],
        'codela-storefront/navigation' => [ 'scripts/navigation-controller.js', [ '@wordpress/interactivity', [ 'id' => '@wordpress/interactivity-router', 'import' => 'dynamic' ] ] ],
        'codela-storefront'         => [ 'storefront.js', [
            '@wordpress/interactivity',
            'codela-storefront/search',
            'codela-storefront/cart',
            'codela-storefront/overlay',
            'codela-storefront/dock',
        ] ],
    ];
    foreach ( $modules as $id => [ $file, $deps ] ) {
        wp_register_script_module( $id, $asset_url . $file, $deps, codela_sf_script_module_version( $file ) );
    }
    // Core 6.9+ marks non-block script modules explicitly for router reuse.
    if ( codela_sf_seamless_core_supported() ) {
        wp_interactivity()->add_client_navigation_support_to_script_module( 'codela-storefront/navigation' );
    }
    register_block_type( 'codela/storefront-header', [ 'api_version' => 3, 'render_callback' => 'codela_sf_header', 'supports' => [ 'interactivity' => true, 'html' => false, 'inserter' => false ] ] );
    register_block_type( 'codela/storefront-home', [ 'api_version' => 3, 'render_callback' => 'codela_sf_home', 'supports' => [ 'html' => false, 'inserter' => false ] ] );
    register_block_type( 'codela/storefront-search', [ 'api_version' => 3, 'render_callback' => 'codela_sf_search_results', 'supports' => [ 'html' => false, 'inserter' => false ] ] );
    register_block_type( 'codela/storefront-footer', [ 'api_version' => 3, 'render_callback' => 'codela_sf_footer', 'supports' => [ 'html' => false, 'inserter' => false ] ] );
} );
/**
 * Checkout payment/thank-you endpoints must remain completely untouched.
 * Only the native checkout form document receives an inert loading preview.
 */
function codela_sf_checkout_skeleton_allowed(): bool {
    return function_exists( 'is_checkout' ) && is_checkout()
        && ! ( function_exists( 'is_wc_endpoint_url' )
            && ( is_wc_endpoint_url( 'order-pay' ) || is_wc_endpoint_url( 'order-received' ) ) );
}

/**
 * This is the SAME HTML fragment used by navigation-feedback.js. A skeleton
 * is server-rendered before the shell, without introducing a second Woo form.
 * With JS disabled no awaiting class is set and the native Woo page is shown.
 */
add_action( 'wp_body_open', static function() {
    if ( ! codela_sf_ready() ) { return; }
    $kind = function_exists( 'is_cart' ) && is_cart() ? 'cart'
        : ( codela_sf_checkout_skeleton_allowed() ? 'checkout' : '' );
    if ( ! $kind ) { return; }
    echo '<section class="sf-commerce-entry sf-commerce-entry--' . esc_attr( $kind ) . ' sf-skeleton" role="status" aria-live="polite">'
        . '<span class="sf-skeleton-status">' . esc_html__( 'Loading…', 'codela-storefront' ) . '</span>'
        . '<div class="sf-skeleton-layout" aria-hidden="true">'
        . codela_sf_commerce_skeleton_markup( $kind )
        . '</div></section>';
}, 1 );

/**
 * Critical cart first paint: avoid rendering the old Woo cart for a frame
 * before the shared Store API view has mounted. The marker is created only by
 * JavaScript, so with JS disabled native WooCommerce remains visible. A short
 * watchdog reveals native Woo if the script or API never finishes.
 *
 * wp_head priority 0 is intentionally earlier than the blocking theme CSS:
 * the initial frame has a stable loading silhouette, never a legacy CTA.
 */
add_action( 'wp_head', static function() {
    if ( ! codela_sf_ready() || ! function_exists( 'is_cart' ) || ! is_cart() ) { return; }
    ?>
    <style id="codela-cart-first-paint">
    html.sf-cart-awaiting body.woocommerce-cart .sf-cart-page .wp-block-post-content,
    html.sf-cart-awaiting body.woocommerce-cart .wp-block-post-content:has(.wc-block-cart),
    html.sf-cart-awaiting body.woocommerce-cart .wp-block-post-content:has(.woocommerce-cart-form),
    html.sf-cart-awaiting body.woocommerce-cart main > .woocommerce:has(.woocommerce-cart-form) {
        visibility:hidden!important;pointer-events:none!important;
    }
    /* Legacy pseudo silhouette only when a custom cart template omits
       wp_body_open; the real first paint uses the shared HTML fragment. */
    html.sf-cart-awaiting body.woocommerce-cart:has(.sf-commerce-entry) .sf-cart-page::before {
        display:none!important;
    }
    html.sf-cart-awaiting body.woocommerce-cart .sf-cart-page::before {
        content:"";display:block;max-width:780px;width:100%;
        height:238px;margin:2px auto 0;pointer-events:none;
        background:
            linear-gradient(#e7e7e4,#e7e7e4) left 0 top 12px/82px 82px no-repeat,
            linear-gradient(#e7e7e4,#e7e7e4) left 100px top 20px/59% 17px no-repeat,
            linear-gradient(#ebebe8,#ebebe8) left 100px top 51px/38% 16px no-repeat,
            linear-gradient(#e7e7e4,#e7e7e4) left 0 top 130px/82px 82px no-repeat,
            linear-gradient(#e7e7e4,#e7e7e4) left 100px top 138px/55% 17px no-repeat,
            linear-gradient(#ebebe8,#ebebe8) left 100px top 169px/35% 16px no-repeat;
        border-radius:14px;opacity:.82;
    }
    </style>
    <script id="codela-cart-first-paint-script">
    (function () {
        var root = document.documentElement;
        root.classList.add('sf-cart-awaiting');
        function revealNative() {
            root.classList.remove('sf-cart-awaiting');
            root.classList.add('sf-cart-fallback');
            var pending = document.querySelector('.sf-cart-page-panel:not(.is-ready)');
            if (pending) {
                pending.hidden = true;
                pending.setAttribute('aria-hidden', 'true');
            }
        }
        var timer = setTimeout(revealNative, 8000);
        window.codelaSFCartBoot = {
            ready: function () {
                clearTimeout(timer);
                root.classList.remove('sf-cart-awaiting', 'sf-cart-fallback');
            },
            fallback: function () {
                clearTimeout(timer);
                revealNative();
            }
        };
    }());
    </script>
    <?php
}, 0 );

/* Checkout uses the exact same early first-paint handshake as Cart. No legacy
 * form or gateway surface is hidden on order-pay/order-received endpoints. */
add_action( 'wp_head', static function() {
    if ( ! codela_sf_ready() || ! codela_sf_checkout_skeleton_allowed() ) { return; }
    ?>
    <style id="codela-checkout-first-paint">
    html.sf-checkout-awaiting body.woocommerce-checkout .sf-checkout-page .wp-block-post-content,
    html.sf-checkout-awaiting body.woocommerce-checkout .sf-checkout-page > .woocommerce {
        visibility:hidden!important;pointer-events:none!important;
    }
    </style>
    <script id="codela-checkout-first-paint-script">
    (function () {
        var root = document.documentElement;
        root.classList.add('sf-checkout-awaiting');
        function clear() { root.classList.remove('sf-checkout-awaiting'); }
        var timer = setTimeout(clear, 8000);
        window.codelaSFCheckoutBoot = {
            ready: function () { clearTimeout(timer); clear(); },
            fallback: function () { clearTimeout(timer); clear(); }
        };
    }());
    </script>
    <?php
}, 0 );

add_action( 'wp_enqueue_scripts', function() {
    if ( ! codela_sf_ready() ) { return; }
    $root_uri = get_template_directory_uri() . '/assets/';
    $style_version = codela_sf_style_version();
    $debug_assets = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;
    // One blocking stylesheet in production; original handles remain native
    // dependency/inline-style anchors. Debug mode serves the editable sources.
    $shared_styles = [
        'codela-storefront-tokens' => 'styles/tokens.css',
        'codela-storefront-theme' => 'storefront.css',
        'codela-storefront-overlay' => 'styles/overlay.css',
        'codela-storefront-navigation' => 'styles/navigation.css',
        'codela-storefront-components' => 'styles/components.css',
    ];
    $dependencies = [];
    foreach ( $shared_styles as $handle => $file ) {
        $source = $debug_assets ? $root_uri . $file : ( $dependencies ? false : $root_uri . 'styles/storefront-base.css' );
        wp_register_style( $handle, $source, $dependencies, $style_version );
        wp_enqueue_style( $handle );
        $dependencies = [ $handle ];
    }
    if ( is_home() || is_singular( 'post' ) || ( is_archive() && ! ( function_exists( 'is_woocommerce' ) && is_woocommerce() ) ) ) {
        wp_enqueue_style( 'codela-storefront-journal', $root_uri . 'styles/journal.css', [ 'codela-storefront-components' ], $style_version );
    }
    $sections = codela_sf_sections_capabilities();
    if ( ! $sections['managed'] || $sections['products'] || is_search()
        || ( function_exists( 'is_woocommerce' ) && is_woocommerce() )
        || is_cart() || is_checkout() || is_account_page() ) {
        wp_enqueue_style( 'codela-storefront-catalog' );
    }
    if ( $sections['layout'] ) {
        wp_enqueue_style( 'codela-storefront-sections', $root_uri . 'styles/sections.css', [ 'codela-storefront-components' ], $style_version );
    }
    if ( $sections['gallery'] ) {
        wp_enqueue_style( 'codela-storefront-gallery' );
        wp_enqueue_script( 'codela-storefront-gallery-horizontal', $root_uri . 'scripts/gallery-horizontal.js', [], codela_sf_script_module_version( 'scripts/gallery-horizontal.js' ), true );
    }
    if ( $sections['products'] || is_front_page() || is_search() ) { wp_enqueue_script( 'wc-add-to-cart' ); }
    if ( codela_sf_document_continuity_allowed() ) {
        wp_enqueue_style( 'codela-storefront-document-continuity', $root_uri . ( $debug_assets ? 'styles/document-continuity.css' : 'styles/document-navigation.css' ), [ 'codela-storefront-components' ], $style_version );
        wp_register_style( 'codela-storefront-navigation-feedback', $debug_assets ? $root_uri . 'styles/navigation-feedback.css' : false, [ 'codela-storefront-document-continuity' ], $style_version );
        wp_enqueue_style( 'codela-storefront-navigation-feedback' );
        $feedback_file = $debug_assets ? 'scripts/navigation-feedback.js' : 'scripts/document-navigation.js';
        wp_enqueue_script( 'codela-storefront-navigation-feedback', $root_uri . $feedback_file, [], codela_sf_script_module_version( $feedback_file ), false );
        // The same synchronous head bootstrap still registers pagereveal before
        // first paint. Bundling removes a blocking fetch, not the early listener.
        wp_register_script( 'codela-storefront-document-continuity', $debug_assets ? $root_uri . 'scripts/document-continuity.js' : false, [ 'codela-storefront-navigation-feedback' ], codela_sf_script_module_version( 'scripts/document-continuity.js' ), false );
        wp_enqueue_script( 'codela-storefront-document-continuity' );
        wp_add_inline_script( 'codela-storefront-navigation-feedback', 'window.codelaSFDocument=' . wp_json_encode( [
            'home' => home_url( '/' ),
            'shop' => wc_get_page_permalink( 'shop' ),
            // Use the store's configured permalink bases, including translated slugs.
            'productBase' => home_url( '/' . trim( explode( '%', wc_get_permalink_structure()['product_rewrite_slug'] )[0], '/' ) . '/' ),
            'catalogBases' => [ home_url( '/' . wc_get_permalink_structure()['category_rewrite_slug'] . '/' ), home_url( '/' . wc_get_permalink_structure()['tag_rewrite_slug'] . '/' ) ],
            'account' => wc_get_page_permalink( 'myaccount' ),
            'cart' => wc_get_cart_url(),
            'checkout' => wc_get_checkout_url(),
            'commerceSkeletons' => [
                'cart' => codela_sf_commerce_skeleton_markup( 'cart' ),
                'checkout' => codela_sf_commerce_skeleton_markup( 'checkout' ),
            ],
            'cartLabel' => __( 'Cart', 'codela-storefront' ),
            'checkoutLabel' => __( 'Checkout', 'woocommerce' ),
            'loading' => __( 'Loading…', 'codela-storefront' ),
            // Static target layout only: no price, product ID, form or cart action.
            'purchasePreview' => codela_sf_navigation_purchase_preview(),
            'accountLabel' => __( 'My account', 'codela-storefront' ),
            // Trusted bundled SVG is available before the navigation response or icon request.
            'backIcon' => str_replace( [ '<svg ', 'width="56"', 'height="56"' ], [ '<svg class="sf-icon" aria-hidden="true" focusable="false" ', 'width="24"', 'height="24"' ], file_get_contents( __DIR__ . '/assets/icons/chevron-left.svg' ) ),
            // Header icons are real, preloaded SVG markup. Only the page BODY
            // uses skeleton; destination header paints immediately on click.
            'brandMarkup' => has_custom_logo() ? get_custom_logo() : '<span>' . esc_html( get_bloginfo( 'name' ) ) . '</span>',
            'homeIcon' => codela_sf_transition_icon( 'house' ),
            'cartIcon' => codela_sf_transition_icon( 'shopping-bag' ),
            'menuIcon' => codela_sf_transition_icon( 'menu' ),
            'filterIcon' => codela_sf_transition_icon( 'sliders-horizontal' ),
            'searchIcon' => codela_sf_transition_icon( 'search' ),
            'accountIcon' => codela_sf_transition_icon( 'user-round' ),
            'shopLabel' => __( 'Shop', 'woocommerce' ),
            'accountParents' => [
                [ 'url' => wc_get_account_endpoint_url( 'view-order' ), 'back' => wc_get_account_endpoint_url( 'orders' ), 'label' => wc_get_account_menu_items()['orders'] ?? __( 'My account', 'codela-storefront' ) ],
                [ 'url' => wc_get_account_endpoint_url( 'edit-address' ), 'back' => wc_get_account_endpoint_url( 'edit-address' ), 'label' => wc_get_account_menu_items()['edit-address'] ?? __( 'My account', 'codela-storefront' ), 'childOnly' => true ],
            ],
            'excluded' => [ wc_get_cart_url(), wc_get_checkout_url(), wc_get_account_endpoint_url( 'customer-logout' ) ],
        ] ) . ';', 'before' );
    }
    // Cart and Checkout must preserve native Woo navigation and forms, but
    // loading feedback must begin at the TAP, not in the destination document.
    // Their lightweight click bridge shares the existing feedback renderer;
    // it never initializes Core Router or intercepts a payment POST.
    if ( ( function_exists( 'is_cart' ) && is_cart() || codela_sf_checkout_skeleton_allowed() )
        && ! codela_sf_document_continuity_allowed() ) {
        wp_enqueue_style( 'codela-storefront-commerce-navigation-feedback',
            $root_uri . 'styles/navigation-feedback.css', [ 'codela-storefront-components' ], $style_version );
        wp_enqueue_script( 'codela-storefront-commerce-navigation-feedback',
            $root_uri . 'scripts/navigation-feedback.js', [], codela_sf_script_module_version( 'scripts/navigation-feedback.js' ), false );
        wp_add_inline_script( 'codela-storefront-commerce-navigation-feedback', 'window.codelaSFDocument=' . wp_json_encode( [
            'home' => home_url( '/' ),
            'account' => wc_get_page_permalink( 'myaccount' ),
            'cart' => wc_get_cart_url(),
            'checkout' => wc_get_checkout_url(),
            'commerceSkeletons' => [
                'cart' => codela_sf_commerce_skeleton_markup( 'cart' ),
                'checkout' => codela_sf_commerce_skeleton_markup( 'checkout' ),
            ],
            'cartLabel' => __( 'Cart', 'codela-storefront' ),
            'checkoutLabel' => __( 'Checkout', 'woocommerce' ),
            'loading' => __( 'Loading…', 'codela-storefront' ),
            'backIcon' => codela_sf_transition_icon( 'chevron-left' ),
            'menuIcon' => codela_sf_transition_icon( 'menu' ),
            'homeIcon' => codela_sf_transition_icon( 'house' ),
            'cartIcon' => codela_sf_transition_icon( 'shopping-bag' ),
            'accountIcon' => codela_sf_transition_icon( 'user-round' ),
            'brandMarkup' => has_custom_logo() ? get_custom_logo() : '<span>' . esc_html( get_bloginfo( 'name' ) ) . '</span>',
        ] ) . ';', 'before' );
        wp_enqueue_script( 'codela-storefront-commerce-links', $root_uri . 'scripts/commerce-links.js',
            [ 'codela-storefront-commerce-navigation-feedback' ], codela_sf_script_module_version( 'scripts/commerce-links.js' ), false );
    }
    if ( function_exists( 'is_product' ) && is_product() ) {
        wp_enqueue_style( 'codela-storefront-gallery' );
        // Product-only layout; WooCommerce gallery, variations and cart stay native.
        wp_enqueue_style( 'codela-storefront-product', $root_uri . 'styles/product.css', [ 'codela-storefront-components', 'codela-storefront-gallery' ], $style_version );
        wp_enqueue_script( 'codela-storefront-product-information', $root_uri . 'scripts/product-information.js', [], codela_sf_script_module_version( 'scripts/product-information.js' ), true );
        // The adapter removes the prepaint state after mounting; the head bootstrap owns failure fallback.
        // Reuse Woo's PhotoSwipe; preserve native responsive photo loading.
        wp_enqueue_script( 'codela-storefront-gallery-defer', $root_uri . 'scripts/gallery-defer.js', [ 'wc-single-product', 'photoswipe-ui-default' ], $style_version, true );
    }
    if ( function_exists( 'is_cart' ) && is_cart() || codela_sf_checkout_skeleton_allowed() ) {
        // Source pages bundle the same CSS with navigation feedback; commerce
        // documents load only this tiny shape stylesheet, not router scripts.
        wp_enqueue_style( 'codela-storefront-commerce-skeleton', $root_uri . 'styles/commerce-skeleton.css', [ 'codela-storefront-components' ], $style_version );
    }
    if ( function_exists( 'is_cart' ) && is_cart() ) {
        // Native Woo Cart Block or classic shortcode remains fully authoritative.
        // Only the assigned Cart page receives popup-matched presentation.
        wp_enqueue_style( 'codela-storefront-cart-page', $root_uri . 'styles/cart-page.css', [ 'codela-storefront-components' ], $style_version );
    }
    if ( function_exists( 'is_checkout' ) && is_checkout() ) {
        // Native Woo keeps the only checkout form, AJAX, coupon and gateway.
        wp_enqueue_style( 'codela-storefront-checkout', $root_uri . 'styles/checkout.css', [ 'codela-storefront-components' ], $style_version );
        wp_enqueue_script( 'codela-storefront-checkout-steps', $root_uri . 'scripts/checkout-steps.js', [ 'jquery' ], codela_sf_script_module_version( 'scripts/checkout-steps.js' ), true );
        wp_add_inline_script( 'codela-storefront-checkout-steps', 'window.codelaSFCheckoutSteps=' . wp_json_encode( [
            'details' => __( 'Customer details', 'codela-storefront' ),
            'delivery' => __( 'Delivery preferences', 'codela-storefront' ),
            'payment' => __( 'Payment', 'codela-storefront' ),
            'steps' => __( 'Checkout progress', 'codela-storefront' ),
            'step' => __( 'Step', 'codela-storefront' ),
            'back' => __( 'Previous step', 'codela-storefront' ),
            'continue' => __( 'Continue', 'codela-storefront' ),
            'toPayment' => __( 'Continue to payment', 'codela-storefront' ),
            'next' => __( 'Checkout action', 'codela-storefront' ),
            'total' => __( 'Total', 'woocommerce' ),
            'estimated' => __( 'Estimated total', 'codela-storefront' ),
            'required' => __( 'Please complete the required fields before continuing.', 'codela-storefront' ),
            'coupon' => __( 'Add discount code', 'codela-storefront' ),
            'couponHint' => __( 'Have a code? Apply it here.', 'codela-storefront' ),
            'couponField' => __( 'Discount code', 'codela-storefront' ),
            'privacyUrl' => function_exists( 'get_privacy_policy_url' ) ? esc_url_raw( (string) get_privacy_policy_url() ) : '',
        ] ) . ';', 'before' );
    }
    if ( function_exists( 'is_account_page' ) && is_account_page() ) {
        wp_enqueue_style( 'codela-storefront-account', $root_uri . 'styles/account.css', [ 'codela-storefront-components' ], $style_version );
        if ( is_user_logged_in() ) {
            wp_enqueue_script( 'codela-storefront-account-notice', $root_uri . 'scripts/account-notice.js', [], codela_sf_script_module_version( 'scripts/account-notice.js' ), true );
        }
    }
    if ( ! is_user_logged_in() ) {
        if ( codela_sf_guest_auth_lazy_allowed() ) {
            // The Woo login form is present in the inert, hidden panel, but its
            // 3 feature styles and 4 scripts need not delay a guest's first paint.
            // The tiny bridge loads them in their original dependency order on
            // account intent; /my-account/ retains the eager, native fallback.
            $asset = static function( string $path, string $version ) use ( $root_uri ): string {
                return add_query_arg( 'ver', $version, $root_uri . $path );
            };
            wp_enqueue_script( 'codela-storefront-auth-loader',
                $root_uri . 'scripts/auth-loader.js', [], codela_sf_script_module_version( 'scripts/auth-loader.js' ), true );
            wp_localize_script( 'codela-storefront-auth-loader', 'CodelaSFAuthLoader', [
                'styles' => [
                    $asset( 'styles/account-overlay.css', $style_version ),
                    $asset( 'styles/auth-smart.css', codela_sf_script_module_version( 'styles/auth-smart.css' ) ),
                    $asset( 'styles/quick-login.css', $style_version ),
                ],
                'scripts' => [
                    $asset( 'scripts/auth.js', $style_version ),
                    $asset( 'scripts/auth-smart.js', codela_sf_script_module_version( 'scripts/auth-smart.js' ) ),
                    $asset( 'scripts/quick-login.js', codela_sf_script_module_version( 'scripts/quick-login.js' ) ),
                    $asset( 'scripts/passkeys.js', codela_sf_script_module_version( 'scripts/passkeys.js' ) ),
                ],
                'account' => wc_get_page_permalink( 'myaccount' ),
                'loading' => __( 'Loading…', 'codela-storefront' ),
                'fallback' => __( 'Open my account', 'codela-storefront' ),
            ] );
        } else {
            // Direct Account loads must preserve the old ready-before-first-paint
            // behavior, native Woo registration and all remembered PIN/passkeys.
            wp_enqueue_script( 'codela-storefront-auth', $root_uri . 'scripts/auth.js', [], $style_version, true );
            wp_enqueue_style( 'codela-storefront-auth-smart', $root_uri . 'styles/auth-smart.css',
                [ 'codela-storefront-account' ],
                codela_sf_script_module_version( 'styles/auth-smart.css' ) );
            wp_enqueue_script( 'codela-storefront-auth-smart', $root_uri . 'scripts/auth-smart.js',
                [ 'codela-storefront-auth' ], codela_sf_script_module_version( 'scripts/auth-smart.js' ), true );
        }
    }
    // Every Account document, including after ?loggedout=true, uses the same
    // four-tab store shell and working menu/cart/search module as the shop.
    // WooCommerce still owns its native guest login form and auth processing.
    wp_enqueue_script_module( 'codela-storefront' );
    if ( codela_sf_seamless_allowed() ) {
        wp_enqueue_script_module( 'codela-storefront/navigation' );
    }
    if ( function_exists( 'codela_storefront_design_enqueue' ) ) { codela_storefront_design_enqueue( 'codela-storefront-theme' ); }
    $accent = class_exists( '\Codela\Includes\StoreAppearance' ) ? \Codela\Includes\StoreAppearance::get_accent_color() : '#720eec';
    wp_add_inline_style( 'codela-storefront-theme', ':root{--sf-accent:' . $accent . ';}' );
} );




/**
 * The plugin's Advanced Checkout stylesheet is only needed on checkout and
 * account pages. Dequeue the known plugin handle from catalog/product pages;
 * do not remove WooCommerce base styles or alter any checkout JS.
 */
add_action( 'wp_print_styles', function() {
    if ( ( function_exists( 'is_checkout' ) && is_checkout() )
        || ( function_exists( 'is_account_page' ) && is_account_page() ) ) {
        return;
    }
    wp_dequeue_style( 'codela-checkout-pro' );
}, 100 );


// Expose the core menu manager even though this block theme uses a fixed shell.
add_action( 'admin_menu', static function() {
    add_submenu_page( 'themes.php', __( 'Menus', 'default' ), __( 'Menus', 'default' ), 'edit_theme_options', 'nav-menus.php' );
} );


// Use the plugin's existing Theme appearance mode. WooCommerce and Codela
// endpoint modules keep their data/hooks; the optional standalone account
// layout, CSS and fullscreen/navigation script never start on this theme.
add_filter( 'codela_store_appearance_surface_mode', static function( $mode, $surface ) {
    return 'account' === $surface ? 'theme' : $mode;
}, 10, 2 );


/**
 * Thumbnail alongside each product in Woo's classic order-review template.
 * The hook runs during AJAX fragment updates too; the Cart and Blocks paths
 * keep their own rendering, validation and item meta.
 */
add_filter( 'woocommerce_cart_item_name', static function ( $name, $item ) {
    if ( ! did_action( 'woocommerce_review_order_before_cart_contents' ) ) { return $name; }
    $product = $item['data'] ?? null;
    if ( ! $product instanceof WC_Product ) { return $name; }
    $thumbnail = $product->get_image( 'woocommerce_thumbnail', [
        'class' => 'sf-checkout-product-image',
        'loading' => 'lazy',
        'decoding' => 'async',
    ] );
    return '<span class="sf-checkout-product-main">' . $thumbnail
        . '<span class="sf-checkout-product-label">' . $name . '</span></span>';
}, 30, 2 );
