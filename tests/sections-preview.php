<?php
/** Preview assets must follow the queried autosave, never the published original. */
define( 'ABSPATH', __DIR__ );
class WP_Post { public function __construct( public int $ID, public string $post_content ) {} }
function add_filter( ...$args ) {}
function codela_sections_validate_root( $root ) { return true; }
function is_wp_error( $value ) { return false; }
function is_front_page() { return false; }
function is_singular( $type ) { return 'page' === $type; }
function get_queried_object_id() { return 42; }
function get_queried_object() { return new WP_Post( 42, 'native-text' ); }
function get_post( $id ) { throw new RuntimeException( 'Published original must not replace preview content' ); }
function codela_sections_page_content( $post ) { if ( 'native-text' !== $post->post_content ) { throw new RuntimeException( 'Native text must be preserved' ); } return 'preview-layout'; }
function has_block( $name, $post ) { return 'codela/page-layout' === $name && 'preview-layout' === $post; }
function parse_blocks( $content ) {
    if ( 'preview-layout' !== $content ) { throw new RuntimeException( 'Wrong content scanned' ); }
    return [ [ 'blockName' => 'codela/page-layout', 'innerBlocks' => [
        [ 'blockName' => 'codela/section-hero', 'attrs' => [ 'data' => [ 'enabled' => true, 'items' => [ [], [] ] ] ] ],
        [ 'blockName' => 'codela/section-products', 'attrs' => [ 'data' => [ 'enabled' => true ] ] ],
    ] ] ];
}
require __DIR__ . '/../theme/codela-storefront/inc/sections.php';
$caps = codela_sf_sections_capabilities();
if ( [ 'layout' => true, 'gallery' => true, 'products' => true ] !== $caps ) { throw new RuntimeException( 'Preview must load layout, gallery and Woo assets' ); }
echo "Queried autosave drives section capabilities and preview assets.\n";

