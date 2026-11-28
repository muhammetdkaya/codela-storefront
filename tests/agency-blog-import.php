<?php
/** Exercise the real importer with failure-injectable native API doubles. */
$fixture = sys_get_temp_dir() . '/codela-blog-test-' . uniqid();
mkdir( $fixture . '/wp-admin/includes', 0777, true );
foreach ( [ 'file', 'media', 'image' ] as $name ) { file_put_contents( $fixture . '/wp-admin/includes/' . $name . '.php', '<?php' ); }
define( 'ABSPATH', $fixture . '/' );
class WP_Error {
    public function __construct( public $code, public $message ) {}
    function get_error_code() { return $this->code; }
    function get_error_message() { return $this->message; }
}
function is_wp_error( $v ) { return $v instanceof WP_Error; }
function check_blog( $v, $message ) { if ( ! $v ) { throw new RuntimeException( $message ); } }
function reset_blog() {
    $GLOBALS['options'] = [ 'codela_theme_settings' => [ 'site_experience' => 'agency' ] ];
    $GLOBALS['posts'] = []; $GLOBALS['meta'] = []; $GLOBALS['caps'] = []; $GLOBALS['seq'] = 1;
    $GLOBALS['host'] = 'https://codela.dev'; $GLOBALS['fail_media'] = false; $GLOBALS['fail_metadata'] = false;
}
function get_option( $k, $default = false ) { return $GLOBALS['options'][$k] ?? $default; }
function add_option( $k, $v, $deprecated = '', $autoload = null ) {
    check_blog( false === $autoload, 'Import locks must not autoload.' );
    if ( isset( $GLOBALS['options'][$k] ) ) { return false; }
    $GLOBALS['options'][$k] = $v; return true;
}
function update_option( $k, $v, $autoload = null ) { check_blog( false === $autoload, 'Completion must not autoload.' ); $GLOBALS['options'][$k] = $v; return true; }
function wp_cache_delete( ...$args ) {}
$GLOBALS['wpdb'] = new class {
    public $options = 'wp_options';
    function delete( $table, $where, $formats ) {
        if ( ( $GLOBALS['options'][$where['option_name']] ?? null ) === $where['option_value'] ) { unset( $GLOBALS['options'][$where['option_name']] ); return 1; }
        return 0;
    }
};
function wp_json_encode( $v ) { return json_encode( $v ); }
function wp_generate_uuid4() { return uniqid(); }
function home_url( $p ) { return $GLOBALS['host'] . $p; }
function wp_parse_url( $u, $component ) { return parse_url( $u, $component ); }
function current_user_can( $cap, ...$args ) { return $GLOBALS['caps'][$cap] ?? true; }
function get_template_directory() { return dirname( __DIR__ ) . '/theme/codela-storefront'; }
function get_post_stati() { return array_fill_keys( [ 'draft', 'publish', 'private', 'pending', 'future', 'inherit', 'trash', 'auto-draft' ], 1 ); }
function get_posts( $args ) {
    $result = [];
    foreach ( $GLOBALS['posts'] as $id => $p ) {
        if ( $p['post_type'] !== $args['post_type'] || ! in_array( $p['post_status'], $args['post_status'], true ) ) { continue; }
        if ( isset( $args['name'] ) && ( $p['post_name'] ?? '' ) !== $args['name'] ) { continue; }
        if ( isset( $args['meta_key'] ) && get_post_meta( $id, $args['meta_key'], true ) !== $args['meta_value'] ) { continue; }
        $result[] = $id;
    }
    return array_slice( $result, 0, $args['posts_per_page'] );
}
function get_post_meta( $id, $key, $single ) { return $GLOBALS['meta'][$id][$key] ?? ''; }
function update_post_meta( $id, $key, $value ) { $GLOBALS['meta'][$id][$key] = $value; return true; }
function get_post_status( $id ) { return $GLOBALS['posts'][$id]['post_status']; }
function get_current_user_id() { return 77; }
function term_exists( ...$args ) { return [ 'term_id' => 9 ]; }
function wp_kses_post( $html ) { return $html; }
function wp_slash( $value ) { return $value; }
function wp_insert_post( $post, $error = false ) {
    $id = $GLOBALS['seq']++;
    $GLOBALS['posts'][$id] = $post;
    $GLOBALS['meta'][$id] = $post['meta_input'];
    return $id;
}
function get_attached_file( $id ) { return __FILE__; }
function wp_tempnam( $name ) { return tempnam( sys_get_temp_dir(), 'codela-blog-' ); }
function wp_delete_file( $file ) { unlink( $file ); }
function media_handle_sideload( $file, $parent, $desc, $post ) {
    check_blog( is_file( $file['tmp_name'] ), 'Image is copied before sideloading.' );
    if ( $GLOBALS['fail_media'] ) { return new WP_Error( 'upload', 'Simulated upload failure' ); }
    return wp_insert_post( $post + [ 'post_type' => 'attachment', 'post_status' => 'inherit', 'post_parent' => $parent ] );
}
function wp_update_image_subsizes( $id ) { return $GLOBALS['fail_metadata'] ? new WP_Error( 'image', 'Simulated metadata failure' ) : [ 'width' => 1200, 'height' => 800 ]; }
function get_post_thumbnail_id( $id ) { return (int) get_post_meta( $id, '_thumbnail_id', true ); }
function set_post_thumbnail( $id, $image ) { return update_post_meta( $id, '_thumbnail_id', $image ); }
function add_action( $name, $callback ) { $GLOBALS['hooks'][$name] = $callback; }
function check_ajax_referer( ...$args ) { return $GLOBALS['nonce']; }
function wp_send_json_error( $data, $code ) { $GLOBALS['response'] = [ false, $data, $code ]; }
function wp_send_json_success( $data ) { $GLOBALS['response'] = [ true, $data ]; }
require dirname( __DIR__ ) . '/theme/codela-storefront/inc/agency-blog-import.php';
reset_blog();
$rows = codela_sf_blog_import_rows();
check_blog( is_array( $rows ) && count( $rows ) === 10, 'Complete bundled package is readable.' );
check_blog( ! isset( $GLOBALS['hooks']['wp_ajax_nopriv_codela_sf_blog_import'] ), 'No anonymous importer.' );
foreach ( [ 'https://azseramik.com', 'https://codela.dev.evil.test' ] as $host ) {
    $GLOBALS['host'] = $host;
    check_blog( ! codela_sf_blog_import_allowed(), 'Other sites cannot import Codela editorial content.' );
}
reset_blog();
foreach ( [ 'manage_options', 'edit_posts', 'upload_files' ] as $cap ) {
    $GLOBALS['caps'][$cap] = false;
    check_blog( is_wp_error( codela_sf_blog_import_step() ), 'Missing capability denies mutation.' );
    unset( $GLOBALS['caps'][$cap] );
}
$GLOBALS['options']['codela_theme_settings']['site_experience'] = 'commerce';
check_blog( ! codela_sf_blog_import_allowed(), 'Commerce mode has no importer.' );
reset_blog();
$_SERVER['REQUEST_METHOD'] = 'GET'; $GLOBALS['nonce'] = true;
codela_sf_blog_import_ajax();
check_blog( 403 === $GLOBALS['response'][2] && [] === $GLOBALS['posts'], 'GET cannot mutate.' );
$_SERVER['REQUEST_METHOD'] = 'POST'; $GLOBALS['nonce'] = false;
codela_sf_blog_import_ajax();
check_blog( 403 === $GLOBALS['response'][2] && [] === $GLOBALS['posts'], 'Invalid nonce cannot mutate.' );
$GLOBALS['nonce'] = true;
$lock = codela_sf_blog_import_lock();
check_blog( 'busy' === codela_sf_blog_import_step()->get_error_code(), 'Concurrent clicks cannot write.' );
codela_sf_blog_import_unlock( 'wrong-owner' );
check_blog( $lock === get_option( 'codela_sf_blog_import_lock' ), 'Only the lock owner can release it.' );
codela_sf_blog_import_unlock( $lock );
$GLOBALS['options']['codela_sf_blog_import_lock'] = json_encode( [ 'expires' => time() - 1 ] );
$GLOBALS['fail_media'] = true;
check_blog( is_wp_error( codela_sf_blog_import_step() ) && count( $GLOBALS['posts'] ) === 1, 'Expired lock recovers; media failure leaves one resumable draft.' );
$GLOBALS['posts'][1]['post_title'] = 'User edited this draft';
$GLOBALS['meta'][1]['_codela_seo_title'] = 'User SEO title';
$GLOBALS['fail_media'] = false; $GLOBALS['fail_metadata'] = true;
check_blog( is_wp_error( codela_sf_blog_import_step() ) && count( $GLOBALS['posts'] ) === 2, 'Metadata failure keeps the same post and one attachment.' );
$GLOBALS['fail_metadata'] = false;
$result = codela_sf_blog_import_step();
check_blog( ! is_wp_error( $result ) && $result['count'] === 1 && count( $GLOBALS['posts'] ) === 2, 'Retry reuses both post and attachment.' );
check_blog( $GLOBALS['posts'][1]['post_title'] === 'User edited this draft' && get_post_meta( 1, '_codela_seo_title', true ) === 'User SEO title', 'Resume preserves editorial changes.' );
for ( $i = 2; $i <= 10; $i++ ) {
    $result = codela_sf_blog_import_step();
    check_blog( ! is_wp_error( $result ) && $result['count'] === $i, 'One article is completed per request.' );
}
check_blog( $result['done'] && count( $GLOBALS['posts'] ) === 20, 'Ten articles and ten covers complete the import.' );
foreach ( $GLOBALS['posts'] as $id => $post ) {
    if ( 'post' !== $post['post_type'] ) { continue; }
    check_blog( 'draft' === $post['post_status'] && 77 === $post['post_author'], 'All articles remain drafts owned by the initiating admin.' );
    check_blog( get_post_thumbnail_id( $id ) > 0 && get_post_meta( $id, '_codela_seo_description', true ), 'Every article has a thumbnail and SEO description.' );
}
codela_sf_blog_import_step();
check_blog( count( $GLOBALS['posts'] ) === 20, 'Repeated completed requests cannot duplicate content.' );
ob_start(); codela_sf_blog_import_render(); $html = ob_get_clean();
check_blog( '' === $html, 'Temporary panel disappears after completion.' );
reset_blog();
$GLOBALS['posts'][400] = [ 'post_type' => 'post', 'post_status' => 'draft', 'post_name' => $rows[0]['slug'] ];
check_blog( 'collision' === codela_sf_blog_import_step()->get_error_code() && count( $GLOBALS['posts'] ) === 1, 'Unrelated existing posts are never overwritten or duplicated.' );
reset_blog();
$GLOBALS['fail_media'] = true; codela_sf_blog_import_step();
$GLOBALS['posts'][1]['post_status'] = 'trash';
check_blog( 'trashed_post' === codela_sf_blog_import_step()->get_error_code() && count( $GLOBALS['posts'] ) === 1, 'Trashed partial posts are not recreated.' );
foreach ( [ 'file', 'media', 'image' ] as $name ) { unlink( $fixture . '/wp-admin/includes/' . $name . '.php' ); }
rmdir( $fixture . '/wp-admin/includes' ); rmdir( $fixture . '/wp-admin' ); rmdir( $fixture );
echo "Blog importer: authorization, nonce, locks, draft import, image retry, deduplication and completion passed.\n";
