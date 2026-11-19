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
