<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_ready(): bool {
    return defined( 'CODELA_VERSION' ) && version_compare( CODELA_VERSION, '1.2.0', '>=' ) && defined( 'CODELA_THEME_API_VERSION' ) && version_compare( CODELA_THEME_API_VERSION, '1.0.0', '>=' ) && defined( 'WC_VERSION' ) && version_compare( WC_VERSION, '9.0', '>=' ) && function_exists( 'wp_interactivity_state' );
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
    if ( function_exists( 'is_product' ) && is_product() ) {
        wp_enqueue_style( 'codela-storefront-gallery' );
        // Product-only layout; WooCommerce gallery, variations and cart stay native.
        wp_enqueue_style( 'codela-storefront-product', $root_uri . 'styles/product.css', [ 'codela-storefront-components', 'codela-storefront-gallery' ], $style_version );
        wp_enqueue_script( 'codela-storefront-product-information', $root_uri . 'scripts/product-information.js', [], codela_sf_script_module_version( 'scripts/product-information.js' ), true );
        // The adapter removes the prepaint state after mounting; the head bootstrap owns failure fallback.
        // Reuse Woo's PhotoSwipe; preserve native responsive photo loading.
        wp_enqueue_script( 'codela-storefront-gallery-defer', $root_uri . 'scripts/gallery-defer.js', [ 'wc-single-product', 'photoswipe-ui-default' ], $style_version, true );
    }
    if ( function_exists( 'is_checkout' ) && is_checkout() ) {
        // Presentation adapter only; no Woo checkout/gateway logic is changed.
        wp_enqueue_style( 'codela-storefront-checkout', $root_uri . 'styles/checkout.css', [ 'codela-storefront-components' ], $style_version );
    }
    if ( function_exists( 'is_account_page' ) && is_account_page() ) {
        wp_enqueue_style( 'codela-storefront-account', $root_uri . 'styles/account.css', [ 'codela-storefront-components' ], $style_version );
        if ( is_user_logged_in() ) {
            wp_enqueue_script( 'codela-storefront-account-notice', $root_uri . 'scripts/account-notice.js', [], codela_sf_script_module_version( 'scripts/account-notice.js' ), true );
        }
    }
    if ( ! is_user_logged_in() ) {
        // Guest account opens inside the existing panel on store pages. Reuse the
        // same tiny tab script and Woo native forms as the fallback Account page.
        if ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) {
            wp_enqueue_style( 'codela-storefront-account-overlay', $root_uri . 'styles/account-overlay.css', [ 'codela-storefront-components' ], $style_version );
        }
        wp_enqueue_script( 'codela-storefront-auth', $root_uri . 'scripts/auth.js', [], $style_version, true );
        wp_enqueue_style( 'codela-storefront-auth-smart', $root_uri . 'styles/auth-smart.css',
            [ function_exists( 'is_account_page' ) && is_account_page() ? 'codela-storefront-account' : 'codela-storefront-account-overlay' ],
            codela_sf_script_module_version( 'styles/auth-smart.css' ) );
        wp_enqueue_script( 'codela-storefront-auth-smart', $root_uri . 'scripts/auth-smart.js',
            [ 'codela-storefront-auth' ], codela_sf_script_module_version( 'scripts/auth-smart.js' ), true );
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

