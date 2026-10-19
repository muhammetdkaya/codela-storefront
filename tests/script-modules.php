<?php
// Executes the real theme registration callback behind minimal WP stubs.
define( 'ABSPATH', __DIR__ );
define( 'CODELA_VERSION', '1.2.0' );
define( 'CODELA_THEME_API_VERSION', '1.0.0' );
define( 'WC_VERSION', '9.0.0' );
$GLOBALS['sf_hooks'] = [];
$GLOBALS['sf_modules'] = [];
function add_action( $hook, $callback, $priority = 10 ) {
    $GLOBALS['sf_hooks'][ $hook ][] = $callback;
}
function get_template_directory() {
    return getenv( 'SF_TEST_THEME_PATH' ) ?: dirname( __DIR__ ) . '/theme/codela-storefront';
}
function get_template_directory_uri() {
    return getenv( 'SF_TEST_THEME_URL' ) ?: 'http://127.0.0.1/theme/codela-storefront';
}
function wp_interactivity_state() { return []; }
function register_block_type( $name, $options ) { return true; }
function wp_register_script_module( $id, $src, $deps = [], $version = false ) {
    if ( isset( $GLOBALS['sf_modules'][ $id ] ) ) {
        throw new RuntimeException( 'Duplicate module: ' . $id );
    }
    $GLOBALS['sf_modules'][ $id ] = [ 'src' => $src, 'deps' => $deps, 'version' => $version ];
}
require dirname( __DIR__ ) . '/theme/codela-storefront/functions.php';
foreach ( $GLOBALS['sf_hooks']['init'] ?? [] as $callback ) { $callback(); }
$expected = [
    'codela-storefront/format'  => [ 'scripts/format.js', [] ],
    'codela-storefront/search'  => [ 'scripts/search-controller.js', [ 'codela-storefront/format' ] ],
    'codela-storefront/cart'    => [ 'scripts/cart-controller.js', [ 'codela-storefront/format' ] ],
    'codela-storefront/overlay' => [ 'scripts/overlay-controller.js', [] ],
    'codela-storefront/dock'    => [ 'scripts/dock-controller.js', [] ],
    'codela-storefront'         => [ 'storefront.js', [ '@wordpress/interactivity', 'codela-storefront/search', 'codela-storefront/cart', 'codela-storefront/overlay', 'codela-storefront/dock' ] ],
];
if ( count( $GLOBALS['sf_modules'] ) !== count( $expected ) ) {
    throw new RuntimeException( 'Unexpected module count' );
}
foreach ( $expected as $id => [ $path, $deps ] ) {
    $module = $GLOBALS['sf_modules'][ $id ] ?? null;
    $hash = substr( hash_file( 'sha256', get_template_directory() . '/assets/' . $path ), 0, 20 );
    if ( ! $module || $module['deps'] !== $deps || $module['version'] !== $hash
        || $module['src'] !== get_template_directory_uri() . '/assets/' . $path ) {
        throw new RuntimeException( 'Invalid registration: ' . $id );
    }
}
echo json_encode( $GLOBALS['sf_modules'], JSON_THROW_ON_ERROR );
