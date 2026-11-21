<?php
/** Shared skin selection; templates provide content, settings only appearance. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Both Agency and Commerce consume the same appearance switches.
 *
 * Legacy per-experience keys are only a read fallback until the plugin's
 * one-time migration materializes the active experience into shared settings.
 */
function codela_sf_presentation( string $part, ?array $settings = null ): string {
    $settings ??= function_exists( 'codela_theme_settings' ) ? codela_theme_settings() : [];
    if ( ! in_array( $part, [ 'menu', 'account' ], true ) ) { return 'standard'; }
    $shared = $part . '_design';
    if ( isset( $settings[ $shared ] ) && in_array( $settings[ $shared ], [ 'standard', 'editorial' ], true ) ) {
        return $settings[ $shared ];
    }
    // Backward compatibility before the single-owner settings migration runs.
    $mode = 'agency' === ( $settings['site_experience'] ?? 'commerce' ) ? 'agency' : 'commerce';
    $legacy = $settings[ $mode . '_' . $part . '_design' ] ?? ( 'agency' === $mode ? 'editorial' : 'standard' );
    return in_array( $legacy, [ 'standard', 'editorial' ], true ) ? $legacy : 'standard';
}
