<?php
/** Shared skin selection for WordPress rendering and standalone theme fixtures. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
/** Resolve the selected skin without changing the shared auth/menu controllers. */
function codela_sf_presentation( string $part, ?array $settings = null ): string {
    $settings ??= function_exists( 'codela_theme_settings' ) ? codela_theme_settings() : [];
    $mode = 'agency' === ( $settings['site_experience'] ?? 'commerce' ) ? 'agency' : 'commerce';
    $default = 'agency' === $mode ? 'editorial' : 'standard';
    if ( ! in_array( $part, [ 'menu', 'account' ], true ) ) { return 'standard'; }
    $value = $settings[ $mode . '_' . $part . '_design' ] ?? $default;
    return in_array( $value, [ 'standard', 'editorial' ], true ) ? $value : $default;
}
