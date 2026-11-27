<?php
/** Share only native parsed block trees, never validation or authorization. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Per-request, bounded memoization by exact resolved content. A preview or
 * updated layout must never reuse the published tree. Custom parsers may
 * depend on context, so always defer to WordPress when a parser filter exists.
 * No transients, persistent cache, page data writes or validation bypass.
 */
function codela_sf_parse_page_blocks( string $content ): array {
    static $trees = [];
    if ( strlen( $content ) > 262144
        || ( function_exists( 'has_filter' ) && has_filter( 'block_parser_class' ) ) ) {
        return parse_blocks( $content );
    }
    // Prefix preserves exact string keys even for numeric-only content.
    $key = 'block:' . $content;
    if ( ! array_key_exists( $key, $trees ) ) {
        if ( count( $trees ) >= 8 ) { array_shift( $trees ); }
        $trees[ $key ] = parse_blocks( $content );
    }
    return $trees[ $key ];
}
