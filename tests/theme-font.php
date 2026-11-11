<?php
// Theme typography contract without a running WordPress instance.
define( 'ABSPATH', __DIR__ );
$GLOBALS['font_test_options'] = [];
$GLOBALS['font_test_filters'] = [];
function add_filter( $tag, $callback ) { $GLOBALS['font_test_filters'][ $tag ] = $callback; }
function codela_theme_settings(): array { return $GLOBALS['font_test_options']; }
require __DIR__ . '/../theme/codela-storefront/inc/typography.php';
function font_test( bool $ok, string $message ): void {
    if ( ! $ok ) { throw new RuntimeException( $message ); }
}
class FontThemeJSONProbe {
    public array $data = [];
    public function update_with( array $data ): self { $this->data = $data; return $this; }
}
$theme = __DIR__ . '/../theme/codela-storefront/';
$schema = json_decode( file_get_contents( $theme . 'config/settings.json' ), true );
$json = json_decode( file_get_contents( $theme . 'theme.json' ), true );
font_test( is_array( $schema ) && is_array( $json ), 'Valid theme settings/theme.json' );
$appearance = array_values( array_filter( $schema['sections'], static fn( $section ) => $section['id'] === 'appearance' ) );
font_test( count( $appearance ) === 1, 'Appearance uses the plugin theme-settings schema' );
$font_fields = array_values( array_filter( $appearance[0]['fields'], static fn( $field ) => $field['id'] === 'site_font' ) );
font_test( count( $font_fields ) === 1, 'Exactly one site font setting' );
$field = $font_fields[0];
font_test( $field['type'] === 'select' && $field['default'] === 'system', 'Safe default is Apple / System' );
font_test( array_keys( $field['options'] ) === array_keys( codela_sf_font_families() ), 'Admin options match runtime allowlist' );
font_test( $json['styles']['typography']['fontFamily'] === 'var:preset|font-family|sf-site', 'Global typography uses one semantic preset' );
font_test( $json['settings']['typography']['fontFamilies'][0]['slug'] === 'sf-site', 'Editable preset exists' );
font_test( isset( $GLOBALS['font_test_filters']['wp_theme_json_data_theme'] ), 'Theme filter registered' );
foreach ( [ [], [ 'site_font' => 'system' ], [ 'site_font' => 'arial' ],
    [ 'site_font' => 'system; font-size:999px' ], [ 'site_font' => 123 ] ] as $options ) {
    $GLOBALS['font_test_options'] = $options;
    $choice = codela_sf_site_font();
    $expected = isset( codela_sf_font_families()[ $options['site_font'] ?? '' ] ) ? $options['site_font'] : 'system';
    font_test( $choice === $expected, 'Unknown font IDs are rejected' );
    $probe = new FontThemeJSONProbe();
    $updated = codela_sf_theme_font_json( $probe );
    font_test( $probe === $updated, 'WordPress theme JSON data instance is returned' );
    $families = $probe->data['settings']['typography']['fontFamilies'];
    font_test( $families[0]['slug'] === 'sf-site', 'Stable semantic font slug' );
    font_test( $families[0]['fontFamily'] === codela_sf_font_families()[ $expected ], 'Selected stack reaches global styles' );
    font_test( $probe->data['styles']['typography']['fontFamily'] === 'var:preset|font-family|sf-site', 'Global style uses site preset' );
}
foreach ( [ 'assets/storefront.css','assets/styles/catalog.css','assets/styles/overlay.css','assets/styles/storefront-base.css' ] as $name ) {
    $css = file_get_contents( $theme . $name );
    font_test( str_contains( $css, '--wp--preset--font-family--sf-site' ), $name . ': theme typography token' );
    font_test( !str_contains( $css, '--wp--preset--font-family--system' ), $name . ': no pinned system font override' );
}
echo "Theme typography settings and fallback: passed.\n";
