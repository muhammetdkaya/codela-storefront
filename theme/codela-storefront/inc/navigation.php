<?php
/**
 * Opt-in region navigation for stable, non-transactional WordPress pages.
 * The core Interactivity Router owns URL/history/fetch/cache/error fallback.
 * Native Woo product, cart, account and checkout keep full-document navigation.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_seamless_core_supported(): bool {
    return function_exists( 'wp_interactivity' )
        && method_exists( wp_interactivity(), 'add_client_navigation_support_to_script_module' )
        && function_exists( 'wp_interactivity_config' );
}
function codela_sf_seamless_page_allowed( int $id ): bool {
    if ( $id <= 0 || ! function_exists( 'get_post' ) ) { return false; }
    if ( function_exists( 'codela_sf_home_mode' ) && 'sections' === codela_sf_home_mode() && (int) get_option( 'page_on_front' ) === $id ) { return false; }
    $post = get_post( $id );
    if ( ! $post || 'page' !== $post->post_type || 'publish' !== $post->post_status
        || ! empty( $post->post_password ) ) { return false; }
    foreach ( [ 'cart', 'checkout', 'myaccount' ] as $name ) {
        if ( function_exists( 'wc_get_page_id' ) && (int) wc_get_page_id( $name ) === $id ) { return false; }
    }
    // Pages with shortcodes, embedded forms or direct script hooks require a
    // traditional document load. Non-core blocks are conservatively excluded.
    $content = function_exists( 'codela_sections_page_content' ) ? codela_sections_page_content( $post ) : (string) $post->post_content;
    if ( function_exists( 'has_block' ) && has_block( 'codela/page-layout', $content ) ) { return false; }
    if ( preg_match( '/\\[[a-z][\\w-]*(?:\\s|\\]|\\/)/i', $content )
        || preg_match( '/<\\s*(?:script|form|iframe)\\b/i', $content ) ) { return false; }
    if ( function_exists( 'parse_blocks' ) ) {
        $safe = [
            'core/paragraph', 'core/heading', 'core/image', 'core/gallery', 'core/list',
            'core/list-item', 'core/columns', 'core/column', 'core/group', 'core/quote',
            'core/separator', 'core/spacer', 'core/buttons', 'core/button', 'core/cover',
            'core/verse', 'core/preformatted', 'core/table', 'core/details',
        ];
        $check = static function( $blocks ) use ( &$check, $safe ): bool {
            foreach ( $blocks as $block ) {
                $name = $block['blockName'] ?? null;
                if ( null !== $name && ! in_array( $name, $safe, true ) ) { return false; }
                if ( ! empty( $block['innerBlocks'] ) && ! $check( $block['innerBlocks'] ) ) { return false; }
            }
            return true;
        };
        if ( ! $check( parse_blocks( $content ) ) ) { return false; }
    }
    return true;
}
function codela_sf_seamless_allowed(): bool {
    if ( ! codela_sf_seamless_core_supported() ) { return false; }
    if ( function_exists( 'codela_sections_validate_root' ) && function_exists( 'codela_sf_sections_capabilities' ) && codela_sf_sections_capabilities()['layout'] ) { return false; }
    if ( function_exists( 'is_front_page' ) && is_front_page() ) {
        // Managed home contains native Woo actions and a classic gallery adapter.
        // Let the existing document transition run their real initialization.
        if ( function_exists( 'codela_sf_home_mode' ) && 'sections' === codela_sf_home_mode() ) { return false; }
        // A configured front page may contain arbitrary shortcodes or forms.
        if ( function_exists( 'get_option' ) && 'page' === get_option( 'show_on_front' ) ) {
            return codela_sf_seamless_page_allowed( (int) get_option( 'page_on_front' ) );
        }
        return true;
    }
    return function_exists( 'is_page' ) && is_page()
        && codela_sf_seamless_page_allowed( (int) get_queried_object_id() );
}
add_action( 'wp', function() {
    if ( ! codela_sf_seamless_core_supported() ) { return; }
    // The destination is authoritative. A router arriving from a safe page
    // must reload on native WooCommerce, authentication or complex content.
    if ( ! codela_sf_seamless_allowed() ) {
        wp_interactivity_config( 'core/router', [ 'clientNavigationDisabled' => true ] );
    }
} );
add_filter( 'render_block', function( string $html, array $block ): string {
    if ( ! codela_sf_seamless_allowed() || 'core/group' !== ( $block['blockName'] ?? '' )
        || 'sf-content' !== ( $block['attrs']['anchor'] ?? '' ) ) { return $html; }
    $tags = new WP_HTML_Tag_Processor( $html );
    if ( $tags->next_tag( 'main' ) && 'sf-content' === $tags->get_attribute( 'id' ) ) {
        $tags->set_attribute( 'data-wp-interactive', 'codela/storefront' );
        $tags->set_attribute( 'data-wp-router-region', 'codela/storefront/main' );
        $tags->set_attribute( 'data-sf-route-type', function_exists( 'is_front_page' ) && is_front_page() ? 'home' : 'page' );
        return $tags->get_updated_html();
    }
    return $html;
}, 10, 2 );
/** Link hints only: links not explicitly marked still perform normal navigation. */
add_filter( 'nav_menu_link_attributes', function( array $attrs, $item ) {
    if ( ! codela_sf_seamless_allowed() || empty( $item->object_id )
        || 'page' !== ( $item->object ?? '' ) || 'post_type' !== ( $item->type ?? '' ) ) {
        return $attrs;
    }
    if ( codela_sf_seamless_page_allowed( (int) $item->object_id ) ) {
        $attrs['data-sf-route'] = 'content';
    }
    return $attrs;
}, 10, 2 );

add_filter( 'get_custom_logo', function( string $html ): string {
    if ( ! codela_sf_seamless_allowed() ) { return $html; }
    $tag = new WP_HTML_Tag_Processor( $html );
    if ( $tag->next_tag( 'a' ) ) {
        $tag->set_attribute( 'data-sf-route', 'home' );
    }
    return $tag->get_updated_html();
}, 30 );

