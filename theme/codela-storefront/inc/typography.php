<?php
/**
 * Site-wide Storefront typography: one vetted font family for all theme
 * surfaces, including WP global styles, WooCommerce and destination previews.
 * The Codela plugin already owns the Theme Settings form and its sanitization.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Font stacks must be selected by allowlisted IDs, never injected as raw CSS. */
function codela_sf_font_families(): array {
    return [
        'system' => '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        'arial'  => 'Arial, Helvetica, sans-serif',
    ];
}

function codela_sf_site_font(): string {
    $settings = function_exists( 'codela_theme_settings' ) ? codela_theme_settings() : [];
    $id = is_array( $settings ) && is_string( $settings['site_font'] ?? null )
        ? $settings['site_font'] : 'system';
    return array_key_exists( $id, codela_sf_font_families() ) ? $id : 'system';
}

/**
 * WP 6.5+ generates the shared --wp--preset--font-family--sf-site token.
 * Every theme-owned font declaration references this token, so changing
 * families does not create a second styling system or add network requests.
 */
function codela_sf_theme_font_json( $theme_json ) {
    $family = codela_sf_font_families()[ codela_sf_site_font() ];
    return $theme_json->update_with( [
        'version'  => 2,
        'settings' => [ 'typography' => [ 'fontFamilies' => [
            [ 'slug' => 'sf-site', 'name' => 'Codela site font', 'fontFamily' => $family ],
            [ 'slug' => 'system', 'name' => 'System', 'fontFamily' => codela_sf_font_families()['system'] ],
            [ 'slug' => 'arial', 'name' => 'Arial / Helvetica', 'fontFamily' => codela_sf_font_families()['arial'] ],
        ] ] ],
        'styles'   => [ 'typography' => [ 'fontFamily' => 'var:preset|font-family|sf-site' ] ],
    ] );
}
add_filter( 'wp_theme_json_data_theme', 'codela_sf_theme_font_json' );
