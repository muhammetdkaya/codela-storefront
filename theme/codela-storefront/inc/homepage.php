<?php
/** Compatibility input adapter, removed after the explicit page migration. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_home_mode(): string {
    $mode = codela_theme_settings()['homepage_mode'] ?? 'legacy';
    if ( 'sections' === $mode && ! function_exists( 'codela_sections_legacy_blocks' ) ) { return 'legacy'; }
    return in_array( $mode, [ 'legacy', 'sections', 'page_content' ], true ) ? $mode : 'legacy';
}
/**
 * A published static homepage that owns native Codela sections must display
 * those sections even when the previous homepage mode is still "sections".
 * A draft, an unassigned page or an empty/invalid panel never changes the
 * existing homepage renderer or the site's WordPress Reading settings.
 */
function codela_sf_front_page_has_saved_sections(): bool {
    if ( 'page' !== get_option( 'show_on_front' ) || ! function_exists( 'codela_sections_validate_meta' ) ) { return false; }
    $id = absint( get_option( 'page_on_front' ) );
    if ( ! $id || 'publish' !== get_post_status( $id ) ) { return false; }
    $value = get_post_meta( $id, defined( 'CODELA_LAYOUT_META' ) ? CODELA_LAYOUT_META : '_codela_page_layout', true );
    if ( ! is_string( $value ) || '' === trim( $value ) || is_wp_error( codela_sections_validate_meta( $value ) ) ) { return false; }
    foreach ( parse_blocks( $value ) as $root ) {
        if ( 'codela/page-layout' === ( $root['blockName'] ?? '' ) && ! empty( $root['innerBlocks'] ) ) { return true; }
    }
    return false;
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
