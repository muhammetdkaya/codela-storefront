<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_ready(): bool {
    return defined( 'CODELA_THEME_API_VERSION' ) && version_compare( CODELA_THEME_API_VERSION, '1.0.0', '>=' ) && defined( 'WC_VERSION' ) && version_compare( WC_VERSION, '9.0', '>=' ) && function_exists( 'wp_interactivity_state' );
}
add_action( 'after_setup_theme', function() {
    load_theme_textdomain( 'codela-storefront', get_template_directory() . '/languages' );
    add_theme_support( 'woocommerce' );
    add_theme_support( 'wc-product-gallery-zoom' );
    add_theme_support( 'wc-product-gallery-lightbox' );
    add_theme_support( 'wc-product-gallery-slider' );
    add_theme_support( 'codela-storefront', [ 'api' => '1.0.0' ] );
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'custom-logo', [ 'height' => 80, 'width' => 240, 'flex-width' => true, 'flex-height' => true ] );
    register_nav_menus( [ 'primary' => __( 'Main menu', 'codela-storefront' ) ] );
} );
add_action( 'admin_notices', function() {
    if ( codela_sf_ready() ) { return; }
    echo '<div class="notice notice-error"><p>' . esc_html__( 'Codela Storefront requires the current Codela Commerce Toolkit plugin with theme support and WooCommerce 9.0+. Activate or update these plugins, or switch to another theme.', 'codela-storefront' ) . '</p></div>';
} );
add_action( 'template_redirect', function() {
    if ( ! codela_sf_ready() ) {
        wp_die( esc_html__( 'The store is temporarily unavailable. Please try again later.', 'codela-storefront' ), esc_html( get_bloginfo( 'name' ) ), [ 'response' => 503 ] );
    }
}, 1 );
require_once get_template_directory() . '/inc/render.php';
require_once get_template_directory() . '/inc/account.php';
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
    // All statically imported modules are registered in dependency order.
    // No bundler or script-module args newer than WordPress 6.5 are needed.
    $modules = [
        'codela-storefront/format'  => [ 'scripts/format.js', [] ],
        'codela-storefront/search'  => [ 'scripts/search-controller.js', [ 'codela-storefront/format' ] ],
        'codela-storefront/cart'    => [ 'scripts/cart-controller.js', [ 'codela-storefront/format' ] ],
        'codela-storefront/overlay' => [ 'scripts/overlay-controller.js', [] ],
        'codela-storefront/dock'    => [ 'scripts/dock-controller.js', [] ],
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
    register_block_type( 'codela/storefront-header', [ 'api_version' => 3, 'render_callback' => 'codela_sf_header', 'supports' => [ 'interactivity' => true, 'html' => false, 'inserter' => false ] ] );
    register_block_type( 'codela/storefront-home', [ 'api_version' => 3, 'render_callback' => 'codela_sf_home', 'supports' => [ 'html' => false, 'inserter' => false ] ] );
    register_block_type( 'codela/storefront-footer', [ 'api_version' => 3, 'render_callback' => 'codela_sf_footer', 'supports' => [ 'html' => false, 'inserter' => false ] ] );
} );
add_action( 'wp_enqueue_scripts', function() {
    if ( ! codela_sf_ready() ) { return; }
    $root_uri = get_template_directory_uri() . '/assets/';
    wp_enqueue_style( 'codela-storefront-tokens', $root_uri . 'styles/tokens.css', [], '0.1.55' );
    wp_enqueue_style( 'codela-storefront-theme', $root_uri . 'storefront.css', [ 'codela-storefront-tokens' ], '0.1.55' );
    wp_enqueue_style( 'codela-storefront-overlay', $root_uri . 'styles/overlay.css', [ 'codela-storefront-theme' ], '0.1.55' );
    wp_enqueue_style( 'codela-storefront-navigation', $root_uri . 'styles/navigation.css', [ 'codela-storefront-overlay' ], '0.1.55' );
    wp_enqueue_style( 'codela-storefront-components', $root_uri . 'styles/components.css', [ 'codela-storefront-navigation' ], '0.1.55' );
    if ( function_exists( 'is_checkout' ) && is_checkout() ) {
        // Presentation adapter only; no Woo checkout/gateway logic is changed.
        wp_enqueue_style( 'codela-storefront-checkout', $root_uri . 'styles/checkout.css', [ 'codela-storefront-components' ], '0.1.55' );
    }
    if ( function_exists( 'is_account_page' ) && is_account_page() ) {
        wp_enqueue_style( 'codela-storefront-account', $root_uri . 'styles/account.css', [ 'codela-storefront-components' ], '0.1.55' );
    }
    if ( ! is_user_logged_in() ) {
        // Guest account opens inside the existing panel on store pages. Reuse the
        // same tiny tab script and Woo native forms as the fallback Account page.
        if ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) {
            wp_enqueue_style( 'codela-storefront-account-overlay', $root_uri . 'styles/account-overlay.css', [ 'codela-storefront-components' ], '0.1.55' );
        }
        wp_enqueue_script( 'codela-storefront-auth', $root_uri . 'scripts/auth.js', [], '0.1.55', true );
    }
    wp_enqueue_script_module( 'codela-storefront' );
    if ( function_exists( 'codela_storefront_design_enqueue' ) ) { codela_storefront_design_enqueue( 'codela-storefront-theme' ); }
    if ( class_exists( '\Codela\Includes\StoreAppearance' ) ) {
        $accent = \Codela\Includes\StoreAppearance::get_accent_color();
        wp_add_inline_style( 'codela-storefront-theme', ':root{--sf-accent:' . sanitize_hex_color( $accent ) . ';}' );
    }
} );



