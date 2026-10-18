<?php
/** The saved page layout takes precedence only for the assigned published static homepage. */
define( 'ABSPATH', __DIR__ );
define( 'CODELA_LAYOUT_META', '_codela_page_layout' );
$GLOBALS['options'] = [ 'show_on_front' => 'page', 'page_on_front' => 42 ];
$GLOBALS['post_status'] = 'publish';
$GLOBALS['layout'] = 'saved-layout';
$GLOBALS['valid'] = true;
function get_option( $key ) { return $GLOBALS['options'][ $key ] ?? null; }
function absint( $value ) { return abs( (int) $value ); }
function get_post_status( $id ) { return 42 === $id ? $GLOBALS['post_status'] : false; }
function get_post_meta( $id, $key, $single ) { return 42 === $id && CODELA_LAYOUT_META === $key && $single ? $GLOBALS['layout'] : ''; }
function codela_sections_validate_meta( $value ) { return $GLOBALS['valid'] ? true : new WP_Error(); }
class WP_Error {}
function is_wp_error( $value ) { return $value instanceof WP_Error; }
function parse_blocks( $value ) {
    return [ [ 'blockName' => 'codela/page-layout', 'innerBlocks' => 'empty-layout' === $value ? [] : [ [ 'blockName' => 'codela/section-hero' ] ] ] ];
}
function codela_sf_ready() { return true; }
function codela_theme_settings() { return [ 'homepage_mode' => 'sections' ]; }
function do_blocks( $content ) { return $GLOBALS['native_output'] ?? 'native-page-content'; }
function wp_strip_all_tags( $text ) { return strip_tags( $text ); }
function codela_sections_legacy_blocks( $settings ) { return [ [ 'blockName' => 'codela/section-products', 'attrs' => [ 'data' => [ 'enabled' => true ] ] ] ]; }
function codela_sections_root_block( $children ) { return [ 'innerBlocks' => $children ]; }
function codela_sections_validate_root( $root ) { return true; }
function codela_sf_render_section( $html, $type, $data ) { return '<section class="sf-section">previous homepage</section>'; }
function esc_html( $text ) { return htmlspecialchars( $text, ENT_QUOTES ); }
function get_bloginfo( $field ) { return 'Store'; }
require __DIR__ . '/../theme/codela-storefront/inc/homepage.php';
require __DIR__ . '/../theme/codela-storefront/inc/render.php';
function check( $condition, $message ) { if ( ! $condition ) { throw new RuntimeException( $message ); } }

check( codela_sf_front_page_has_saved_sections(), 'Published assigned homepage uses its saved panel' );
check( 'native-page-content' === codela_sf_home(), 'Native panel wins over legacy homepage sections mode' );
$GLOBALS['native_output'] = '<div class="entry-content"></div>';
check( str_contains( codela_sf_home(), 'previous homepage' ), 'Empty post-content retains the visible legacy homepage instead of going blank' );
unset( $GLOBALS['native_output'] );
$GLOBALS['post_status'] = 'draft';
check( ! codela_sf_front_page_has_saved_sections(), 'Draft does not replace existing homepage' );
$GLOBALS['post_status'] = 'publish';
$GLOBALS['layout'] = '';
check( ! codela_sf_front_page_has_saved_sections(), 'Blank panel does not replace existing homepage' );
$GLOBALS['layout'] = 'empty-layout';
check( ! codela_sf_front_page_has_saved_sections(), 'No sections does not replace existing homepage' );
$GLOBALS['layout'] = 'saved-layout';
$GLOBALS['valid'] = false;
check( ! codela_sf_front_page_has_saved_sections(), 'Invalid panel cannot replace existing homepage' );
$GLOBALS['valid'] = true;
$GLOBALS['options']['show_on_front'] = 'posts';
check( ! codela_sf_front_page_has_saved_sections(), 'Unassigned page never takes over the homepage' );
$GLOBALS['options']['show_on_front'] = 'page';
$GLOBALS['options']['page_on_front'] = 99;
check( ! codela_sf_front_page_has_saved_sections(), 'Other page metadata never takes over the homepage' );
echo "Published native homepage precedence and safe legacy fallback passed.\n";
