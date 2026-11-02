<?php
/** Production renderers and real WP HTML parser; content/attachments are fixtures. */
define( 'ABSPATH', __DIR__ );
function add_action( ...$args ) {}
function add_filter( ...$args ) {}
function __( $value, ...$args ) { return $value; }
function esc_attr( $value ) { return htmlspecialchars( (string) $value, ENT_QUOTES ); }
function esc_html( $value ) { return esc_attr( $value ); }
function esc_attr__( $value, ...$args ) { return esc_attr( $value ); }
function esc_url( $value ) { return esc_attr( $value ); }
function sanitize_html_class( $value ) { return $value; }
function is_front_page() { return false; }
function is_singular( $type ) { return 'page' === $type; }
function is_admin() { return false; }
function get_queried_object_id() { return 42; }
class WP_Post { public $ID = 42; public $post_content = 'layout'; }
function get_queried_object() { return new WP_Post; }
function has_block( ...$args ) { return true; }
function codela_sections_validate_root( $root ) { return true; }
function is_wp_error( $value ) { return false; }
function parse_blocks( $content ) {
    $roots = [ [ 'blockName' => 'codela/page-layout', 'innerBlocks' => [] ] ];
    if ( getenv( 'SF_PRIORITY_CASE' ) === 'mixed' ) { array_unshift( $roots, [ 'blockName' => 'core/paragraph', 'innerHTML' => '<p>Long introduction</p>' ] ); }
    return $roots;
}
function wp_attachment_is_image( $id ) { return in_array( $id, [ 10, 11, 12 ], true ); }
function wp_get_attachment_image( $id, $size, $icon, $attrs ) {
    $html = '<img src="/image-' . $id . '.svg" srcset="/image-' . $id . '.svg 1200w" width="1200" height="900" alt="Ceramics"';
    foreach ( $attrs as $key => $value ) { $html .= ' ' . $key . '="' . esc_attr( $value ) . '"'; }
    return $html . '>';
}
function wp_get_attachment_image_srcset( $id, $size ) { return '/image-' . $id . '.svg 600w'; }
function wp_get_attachment_image_url( $id, $size ) { return '/image-' . $id . '.svg'; }
function _doing_it_wrong( $name, $message, $version ) { throw new RuntimeException( $message ); }
$core = getenv( 'WP_CORE_INCLUDES' );
foreach ( [ 'attribute-token', 'span', 'text-replacement', 'tag-processor' ] as $class ) { require $core . '/class-wp-html-' . $class . '.php'; }
$theme = getenv( 'SF_THEME_SOURCE' ) ?: __DIR__ . '/../theme/codela-storefront';
require $theme . '/inc/media.php';
require $theme . '/inc/ui.php';
require $theme . '/inc/sections.php';
$case = getenv( 'SF_PRIORITY_CASE' ) ?: 'story';
$item = [ 'enabled' => true, 'image_id' => 10, 'mobile_image_id' => 11, 'title' => 'Our story', 'body' => 'Handmade ceramics.', 'subtitle' => '', 'button_label' => '', 'button_url' => '' ];
$data = [ 'id' => 'first', 'enabled' => true, 'variant' => 'image-left', 'title' => 'Story', 'description' => '', 'items' => [ $item, array_merge( $item, [ 'image_id' => 12 ] ) ] ];
$html = '';
if ( $case === 'text-first' ) { $html .= codela_sf_render_section( '', 'info', $data, 42 ); }
if ( $case === 'empty-first' ) { $html .= codela_sf_render_section( '', 'story', array_merge( $data, [ 'items' => [] ] ), 42 ); }
if ( $case === 'disabled-first' ) { $html .= codela_sf_render_section( '', 'hero', array_merge( $data, [ 'enabled' => false ] ), 42 ); }
if ( $case === 'text-card-first' ) { $data['items'][0]['image_id'] = 0; }
$type = in_array( $case, [ 'hero', 'promo' ], true ) ? $case : 'story';
if ( $type !== 'story' ) { $data['items'] = [ $item ]; }
$html .= codela_sf_render_section( '', $type, $data, 42 );
$html .= codela_sf_render_section( '', 'hero', array_merge( $data, [ 'id' => 'later', 'items' => [ $item ] ] ), 42 );
echo json_encode( [ 'html' => $html, 'preloads' => codela_sf_image_preloads() ], JSON_THROW_ON_ERROR );
