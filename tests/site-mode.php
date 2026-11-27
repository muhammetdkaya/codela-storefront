<?php
/** Unified theme contract: selecting a demo never stores a permanent site mode. */
define( 'ABSPATH', __DIR__ );
function unified_check( bool $condition, string $message ): void {
    if ( ! $condition ) { throw new RuntimeException( $message ); }
}
$config = json_decode( file_get_contents( __DIR__ . '/../theme/codela-storefront/config/settings.json' ), true );
unified_check( is_array( $config ), 'Theme settings schema is valid.' );
$fields = array_merge( ...array_column( $config['sections'], 'fields' ) );
$ids = array_column( $fields, 'id' );
unified_check( ! in_array( 'site_mode', $ids, true ), 'Agency and commerce are installation presets, not settings.' );
unified_check( in_array( 'site_font', $ids, true ) && in_array( 'mobile_dock_enabled', $ids, true ), 'Shared appearance controls remain.' );
unified_check( in_array( 'site_experience', $ids, true ), 'Agency/Commerce navigation profile is independently configurable.' );
$source = file_get_contents( __DIR__ . '/../theme/codela-storefront/functions.php' );
$render = file_get_contents( __DIR__ . '/../theme/codela-storefront/inc/render.php' );
$widgets = file_get_contents( __DIR__ . '/../theme/codela-storefront/inc/section-agency.php' );
unified_check( ! str_contains( $source, "require_once get_template_directory() . '/inc/site-mode.php';" ), 'Removed mode helper is not loaded.' );
unified_check( ! str_contains( $render, 'codela_sf_site_mode' ), 'Header and homepage have no mode branch.' );
unified_check( ! str_contains( $widgets, 'codela_sf_site_mode' ), 'Agency widgets render irrespective of site identity.' );
echo "Unified site preset, native menu/homepage and widget contract passed.\n";

require __DIR__ . '/../theme/codela-storefront/inc/script-modules.php';
$commerce = codela_sf_script_module_graph( true );
$agency = codela_sf_script_module_graph( false );
foreach ( [ 'search', 'cart' ] as $feature ) {
    $id = 'codela-storefront/' . $feature;
    unified_check( $commerce[$id][0] === 'scripts/' . $feature . '-controller.js' && $commerce[$id][1] === [ 'codela-storefront/format' ], 'Native Woo controller retains its formatter.' );
    unified_check( $agency[$id] === [ 'scripts/commerce-disabled.js', [] ], 'Inactive commerce uses only the side-effect-free adapter.' );
}
unified_check( ! isset( $agency['codela-storefront/format'] ), 'Woo-disabled site does not register the formatter.' );
foreach ( [ 'codela-storefront', 'codela-storefront/overlay', 'codela-storefront/dock', 'codela-storefront/navigation', 'codela-storefront/panel-motion' ] as $id ) {
    unified_check( $commerce[$id] === $agency[$id], 'Both profiles use the exact same shared native shell: ' . $id );
}
foreach ( [$commerce, $agency] as $graph ) {
    foreach ( $graph as [$file, $deps] ) {
        unified_check( is_file( __DIR__ . '/../theme/codela-storefront/assets/' . $file ), 'Registered module exists: ' . $file );
        foreach ( $deps as $dep ) {
            $id = is_array( $dep ) ? $dep['id'] : $dep;
            unified_check( str_starts_with( $id, '@wordpress/' ) || isset( $graph[$id] ), 'Module graph has no dangling dependencies: ' . $id );
        }
    }
}
unified_check( str_contains( $source, 'codela_sf_script_module_graph( codela_sf_commerce_available() )' ), 'Production init selects graph using the shared capability.' );
echo "Commerce capability module graph passed.\n";
