<?php
/** Compatibility input adapter, removed after the explicit page migration. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_home_mode(): string {
    $mode = codela_theme_settings()['homepage_mode'] ?? 'legacy';
    if ( 'sections' === $mode && ! function_exists( 'codela_sections_legacy_blocks' ) ) { return 'legacy'; }
    return in_array( $mode, [ 'legacy', 'sections', 'page_content' ], true ) ? $mode : 'legacy';
}
function codela_sf_home_sections(): string {
    if ( ! function_exists( 'codela_sections_legacy_blocks' ) ) { return ''; }
    $children = codela_sections_legacy_blocks( codela_theme_settings() );
    $root = codela_sections_root_block( $children );
    if ( is_wp_error( codela_sections_validate_root( $root ) ) ) { return ''; }
    $html = '';
    foreach ( $children as $child ) {
        $type = str_replace( 'codela/section-', '', $child['blockName'] );
        $data = codela_sections_clean( $type, $child['attrs']['data'] );
        $html .= codela_sf_render_section( null, $type, $data );
    }
    if ( ! str_contains( $html, '<h1' ) ) { $html = '<h1 class="screen-reader-text">' . esc_html( get_bloginfo( 'name' ) ) . '</h1>' . $html; }
    return '<div class="codela-page-layout">' . $html . '</div>';
}
