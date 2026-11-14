<?php
/** Shared site identity for commerce and agency presentations. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Existing installations and invalid settings retain commerce behavior. */
function codela_sf_site_mode(): string {
    $settings = function_exists( 'codela_theme_settings' ) ? codela_theme_settings() : [];
    $mode = is_array( $settings ) ? ( $settings['site_mode'] ?? null ) : null;
    return in_array( $mode, [ 'commerce', 'agency' ], true ) ? $mode : 'commerce';
}

/** A single allowlisted class is available to theme-owned page sections. */
function codela_sf_site_mode_body_class( array $classes ): array {
    $classes[] = 'sf-site-mode-' . codela_sf_site_mode();
    return $classes;
}
add_filter( 'body_class', 'codela_sf_site_mode_body_class' );
