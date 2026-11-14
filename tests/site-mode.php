<?php
/** Site mode defaults, stored preferences, and safe body-class integration. */
define( 'ABSPATH', __DIR__ );
$GLOBALS['mode_test_filters'] = [];
$GLOBALS['mode_test_settings'] = [];
function add_filter( $tag, $callback ) { $GLOBALS['mode_test_filters'][ $tag ] = $callback; }
if ( ! in_array( '--without-plugin', $argv, true ) ) {
    function codela_theme_settings() { return $GLOBALS['mode_test_settings']; }
}
require __DIR__ . '/../theme/codela-storefront/inc/site-mode.php';
function mode_test( bool $condition, string $message ): void {
    if ( ! $condition ) { throw new RuntimeException( $message ); }
}
mode_test( codela_sf_site_mode() === 'commerce', 'Existing sites default to commerce without a migration.' );
mode_test( ( $GLOBALS['mode_test_filters']['body_class'] ?? null ) === 'codela_sf_site_mode_body_class', 'WordPress body classes use the shared site mode.' );
if ( ! function_exists( 'codela_theme_settings' ) ) {
    mode_test( codela_sf_site_mode_body_class( [ 'home' ] ) === [ 'home', 'sf-site-mode-commerce' ], 'Missing plugin helper has a safe default.' );
    echo "Site mode without plugin: passed.\n";
    exit;
}
foreach ( [
    [ [], 'commerce' ],
    [ [ 'site_font' => 'arial', 'mobile_dock_enabled' => false ], 'commerce' ],
    [ [ 'site_mode' => 'agency', 'site_font' => 'arial' ], 'agency' ],
    [ [ 'site_mode' => 'commerce' ], 'commerce' ],
    [ [ 'site_mode' => 'agency injected-class' ], 'commerce' ],
    [ [ 'site_mode' => 'AGENCY' ], 'commerce' ],
    [ [ 'site_mode' => [ 'agency' ] ], 'commerce' ],
    [ [ 'site_mode' => true ], 'commerce' ],
    [ [ 'site_mode' => 0 ], 'commerce' ],
    [ [ 'site_mode' => null ], 'commerce' ],
    [ 'malformed-option', 'commerce' ],
] as [ $settings, $expected ] ) {
    $GLOBALS['mode_test_settings'] = $settings;
    mode_test( codela_sf_site_mode() === $expected, 'Only declared site modes are accepted.' );
    $classes = [ 'home', 'logged-in', 'custom-theme-class' ];
    $filtered = call_user_func( $GLOBALS['mode_test_filters']['body_class'], $classes );
    mode_test( $filtered === array_merge( $classes, [ 'sf-site-mode-' . $expected ] ), 'Existing body classes survive and the current mode is reflected.' );
    mode_test( $GLOBALS['mode_test_settings'] === $settings, 'Reading a mode never rewrites merchant settings.' );
}
$schema = json_decode( file_get_contents( __DIR__ . '/../theme/codela-storefront/config/settings.json' ), true );
$fields = array_merge( ...array_column( $schema['sections'], 'fields' ) );
$field = array_values( array_filter( $fields, static fn( $field ) => $field['id'] === 'site_mode' ) )[0];
foreach ( array_keys( $field['options'] ) as $mode ) {
    $GLOBALS['mode_test_settings'] = [ 'site_mode' => $mode ];
    mode_test( codela_sf_site_mode() === $mode, 'Every selectable admin option is supported at runtime.' );
}
echo "Site mode settings, fallback, switching and body classes: passed.\n";
