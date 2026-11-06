<?php
/** Theme presentation registry. Page data and editor stay in the Codela plugin. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
/** Declarative theme-owned layouts; the plugin validates the public registry contract. */
add_filter( 'codela_page_section_variants', static function( $defaults ) {
    static $loaded = false, $variants = null;
    if ( ! $loaded ) {
        $loaded = true;
        $path = __DIR__ . '/../config/sections.json';
        if ( is_file( $path ) && ! is_link( $path ) && filesize( $path ) <= 16384 ) {
            $schema = json_decode( file_get_contents( $path ), true );
            if ( 1 === ( $schema['schema_version'] ?? null ) && is_array( $schema['variants'] ?? null ) ) { $variants = $schema['variants']; }
        }
    }
    return $variants ?? $defaults;
} );
require_once __DIR__ . '/section-media.php';
require_once __DIR__ . '/section-categories.php';
require_once __DIR__ . '/section-products.php';
require_once __DIR__ . '/section-content.php';

function codela_sf_sections_capabilities(): array {
    static $caps = null;
    if ( null !== $caps ) { return $caps; }
    $caps = [ 'layout' => false, 'gallery' => false, 'products' => false, 'managed' => false ];
    if ( ! function_exists( 'codela_sections_validate_root' ) ) { return $caps; }
    if ( ! is_singular( 'page' ) && ! is_front_page() ) { return $caps; }
    // The queried post contains native preview/autosave content; get_post(ID) can read the published original.
    $post = get_queried_object();
    if ( ! $post instanceof WP_Post || (int) $post->ID !== get_queried_object_id() ) { $post = get_post( get_queried_object_id() ); }
    $content = $post ? ( function_exists( 'codela_sections_page_content' ) ? codela_sections_page_content( $post ) : $post->post_content ) : '';
    if ( $post && has_block( 'codela/page-layout', $content ) ) {
        $blocks = parse_blocks( $content );
        $managed = true;
        foreach ( $blocks as $root ) {
            if ( 'codela/page-layout' !== ( $root['blockName'] ?? '' ) || is_wp_error( codela_sections_validate_root( $root ) ) ) {
                // Unknown blocks, shortcodes and synced patterns may render products.
                if ( ! empty( $root['blockName'] ) || '' !== trim( $root['innerHTML'] ?? '' ) ) { $managed = false; }
                continue;
            }
            $caps['layout'] = true;
            foreach ( $root['innerBlocks'] as $child ) {
                $data = $child['attrs']['data'] ?? []; if ( isset( $data['enabled'] ) && ! $data['enabled'] ) { continue; }
                $type = str_replace( 'codela/section-', '', $child['blockName'] );
                if ( 'products' === $type ) { $caps['products'] = true; }
                if ( in_array( $type, [ 'hero', 'promo' ], true ) && count( $data['items'] ?? [] ) > 1 || 'categories' === $type && 'carousel' === ( $data['variant'] ?? '' ) ) { $caps['gallery'] = true; }
            }
        }
        $caps['managed'] = $caps['layout'] && $managed;
    }
    return $caps;
}

function codela_sf_render_section( $html, string $type, array $data, int $post_id = 0 ): string {
    static $content_rendered = false;
    if ( ! $data['enabled'] ) { return ''; }
    $renderers = [ 'hero' => 'codela_sf_section_media', 'promo' => 'codela_sf_section_media', 'categories' => 'codela_sf_section_categories', 'products' => 'codela_sf_section_products', 'story' => 'codela_sf_section_content', 'info' => 'codela_sf_section_content', 'contact' => 'codela_sf_section_content' ];
    if ( ! isset( $renderers[ $type ] ) ) { return ''; }
    // Reserve priority for the first rendered section, never a later image after
    // text/products. Mixed native content is deliberately left to normal loading.
    $priority = ! $content_rendered && ( ! $post_id || codela_sf_sections_capabilities()['managed'] );
    $output = in_array( $type, [ 'hero', 'promo', 'story' ], true )
        ? $renderers[ $type ]( $data, $type, $priority ) : $renderers[ $type ]( $data, $type );
    if ( '' !== $output ) { $content_rendered = true; }
    return $output;
}
add_filter( 'codela_render_page_section', 'codela_sf_render_section', 10, 4 );

/** Managed front pages supply their own accessible heading, including saved templates. */
add_filter( 'render_block_core/post-title', static function( $html, $block ) {
    return is_front_page() && codela_sf_sections_capabilities()['layout'] ? '' : $html;
}, 10, 2 );

add_filter( 'render_block_codela/page-layout', static function( $html ) {
    if ( is_front_page() && ! str_contains( $html, '<h1' ) ) { return '<h1 class="screen-reader-text">' . esc_html( get_bloginfo( 'name' ) ) . '</h1>' . $html; }
    return $html;
} );

/**
 * Pages with a valid, enabled Codela Contact layout present that layout as the
 * primary body. In block themes core/post-content may bypass the plugin's
 * classic in_the_loop() condition and leave the old HTML editor content visible.
 * Keep the original post_content untouched in the database for recovery/editing;
 * override only the public render of this explicitly managed Contact layout.
 */
function codela_sf_contact_page_layout( int $post_id ): string {
    if ( $post_id <= 0 || ! function_exists( 'codela_sections_validate_meta' ) ) { return ''; }
    $post = get_post( $post_id );
    if ( ! $post || 'page' !== $post->post_type
        || has_block( 'codela/page-layout', $post ) || post_password_required( $post_id ) ) { return ''; }
    $raw = get_post_meta( $post_id, '_codela_page_layout', true );
    if ( ! is_string( $raw ) || '' === $raw || is_wp_error( codela_sections_validate_meta( $raw ) ) ) { return ''; }
    foreach ( parse_blocks( $raw ) as $root ) {
        if ( 'codela/page-layout' !== ( $root['blockName'] ?? '' ) ) { continue; }
        foreach ( $root['innerBlocks'] ?? [] as $child ) {
            if ( 'codela/section-contact' !== ( $child['blockName'] ?? '' ) ) { continue; }
            $contact = codela_sections_clean( 'contact', $child['attrs']['data'] ?? [] );
            if ( ! is_wp_error( $contact ) && ! empty( $contact['enabled'] ) ) {
                // The plugin remains authoritative for schema validation and
                // section rendering. Never trust or print unvalidated raw HTML.
                return render_block( $root );
            }
        }
    }
    return '';
}
add_filter( 'render_block_core/post-content', static function( $html, $block, $instance ) {
    if ( is_admin() || ! is_singular( 'page' ) ) { return $html; }
    $id = (int) get_queried_object_id();
    if ( ! $id || (int) ( $instance->context['postId'] ?? $id ) !== $id ) { return $html; }
    $contact = codela_sf_contact_page_layout( $id );
    return '' !== $contact ? $contact : $html;
}, 30, 3 );
