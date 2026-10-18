<?php
/** Theme presentation registry. Page data and editor stay in the Codela plugin. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
/** Declarative theme-owned layouts; the plugin validates the public registry contract. */
add_filter( 'codela_page_section_variants', static function( $defaults ) {
    $path = __DIR__ . '/../config/sections.json';
    if ( ! is_file( $path ) || is_link( $path ) || filesize( $path ) > 16384 ) { return $defaults; }
    $schema = json_decode( file_get_contents( $path ), true );
    return 1 === ( $schema['schema_version'] ?? null ) && is_array( $schema['variants'] ?? null ) ? $schema['variants'] : $defaults;
} );
require_once __DIR__ . '/section-media.php';
require_once __DIR__ . '/section-categories.php';
require_once __DIR__ . '/section-products.php';

function codela_sf_sections_capabilities(): array {
    static $caps = null;
    if ( null !== $caps ) { return $caps; }
    $caps = [ 'layout' => false, 'gallery' => false, 'products' => false ];
    if ( ! function_exists( 'codela_sections_validate_root' ) ) { return $caps; }
    if ( ! is_singular( 'page' ) && ! is_front_page() ) { return $caps; }
    // The queried post contains native preview/autosave content; get_post(ID) can read the published original.
    $post = get_queried_object();
    if ( ! $post instanceof WP_Post || (int) $post->ID !== get_queried_object_id() ) { $post = get_post( get_queried_object_id() ); }
    $content = $post ? ( function_exists( 'codela_sections_page_content' ) ? codela_sections_page_content( $post ) : $post->post_content ) : '';
    if ( $post && has_block( 'codela/page-layout', $content ) ) {
        $blocks = parse_blocks( $content );
        foreach ( $blocks as $root ) {
            if ( 'codela/page-layout' !== ( $root['blockName'] ?? '' ) || is_wp_error( codela_sections_validate_root( $root ) ) ) { continue; }
            $caps['layout'] = true;
            foreach ( $root['innerBlocks'] as $child ) {
                $data = $child['attrs']['data'] ?? []; if ( isset( $data['enabled'] ) && ! $data['enabled'] ) { continue; }
                $type = str_replace( 'codela/section-', '', $child['blockName'] );
                if ( 'products' === $type ) { $caps['products'] = true; }
                if ( in_array( $type, [ 'hero', 'promo' ], true ) && count( $data['items'] ?? [] ) > 1 || 'categories' === $type && 'carousel' === ( $data['variant'] ?? '' ) ) { $caps['gallery'] = true; }
            }
        }
    } elseif ( is_front_page() && 'sections' === codela_sf_home_mode() && function_exists( 'codela_sections_legacy_blocks' ) ) {
        $caps['layout'] = true;
        foreach ( codela_sections_legacy_blocks( codela_theme_settings() ) as $child ) {
            if ( 'codela/section-products' === $child['blockName'] ) { $caps['products'] = true; }
            if ( 'codela/section-hero' === $child['blockName'] && count( $child['attrs']['data']['items'] ) > 1 ) { $caps['gallery'] = true; }
        }
    }
    return $caps;
}

function codela_sf_render_section( $html, string $type, array $data, int $post_id = 0 ): string {
    if ( ! $data['enabled'] ) { return ''; }
    $renderers = [ 'hero' => 'codela_sf_section_media', 'promo' => 'codela_sf_section_media', 'categories' => 'codela_sf_section_categories', 'products' => 'codela_sf_section_products' ];
    return isset( $renderers[ $type ] ) ? $renderers[ $type ]( $data, $type ) : '';
}
add_filter( 'codela_render_page_section', 'codela_sf_render_section', 10, 4 );

/** One page title: the regular template title remains H1 on inner pages. */
add_filter( 'render_block_core/post-title', static function( $html, $block ) {
    return is_front_page() && codela_sf_sections_capabilities()['layout'] ? '' : $html;
}, 10, 2 );

add_filter( 'render_block_codela/page-layout', static function( $html ) {
    if ( is_front_page() && ! str_contains( $html, '<h1' ) ) { return '<h1 class="screen-reader-text">' . esc_html( get_bloginfo( 'name' ) ) . '</h1>' . $html; }
    return $html;
} );

