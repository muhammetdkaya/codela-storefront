<?php
/** Legacy agency patterns and module assets no longer require a site mode. */
define( 'ABSPATH', __DIR__ );
$GLOBALS['front'] = true;
$GLOBALS['ready'] = true;
$GLOBALS['contact'] = null;
$GLOBALS['enqueued'] = [];
$GLOBALS['page'] = (object) [ 'ID' => 7, 'post_type' => 'page', 'post_content' => '', 'post_password' => '' ];
$GLOBALS['layout'] = '';
function add_action( ...$args ) { $GLOBALS['actions'][$args[0]][] = $args[1]; }
function add_filter( ...$args ) {}
function is_front_page() { return $GLOBALS['front']; }
function codela_sf_ready() { return $GLOBALS['ready']; }
function get_option( $name ) { return 'show_on_front' === $name ? 'page' : null; }
function do_blocks( $content ) { return $content; }
function get_queried_object_id() { return 7; }
function get_post( $id ) { return $GLOBALS['page']; }
function get_post_meta( $id, $key, $single = true ) { return $GLOBALS['layout']; }
function get_page_by_path( $path ) { return $GLOBALS['contact']; }
function post_password_required( $post ) { return ! empty( $post->post_password ); }
function get_permalink( $page ) { return 'https://example.test/iletisim/'; }
function home_url( $path ) { return 'https://example.test' . $path; }
function wc_get_page_permalink( $slug ) { return 'https://example.test/hesabim/'; }
function get_template_directory_uri() { return '/theme/codela-storefront'; }
function wp_get_theme() { return new class { function get( $field ) { return 'test'; } }; }
function wp_enqueue_style( ...$args ) { $GLOBALS['enqueued'][] = $args[0]; }
function wp_enqueue_script( ...$args ) { $GLOBALS['enqueued'][] = $args[0]; }
function __( $value, $domain = '' ) { return $value; }
function esc_attr( $value ) { return htmlspecialchars( (string) $value, ENT_QUOTES ); }
function esc_html( $value ) { return esc_attr( $value ); }
function esc_url( $value ) { return esc_attr( $value ); }
function sanitize_html_class( $value ) { return preg_replace( '/[^a-zA-Z0-9_-]/', '', $value ); }
require __DIR__ . '/../theme/codela-storefront/inc/agency.php';
require __DIR__ . '/../theme/codela-storefront/inc/render.php';
function agency_check( $condition, $message ) { if ( ! $condition ) { throw new RuntimeException( $message ); } }
agency_check( str_contains( codela_sf_home(), 'wp:post-content' ), 'Homepage always uses native Reading/post content.' );
$enqueue = $GLOBALS['actions']['wp_enqueue_scripts'][0];
$enqueue();
agency_check( [] === $GLOBALS['enqueued'], 'No agency assets when a page has no agency sections.' );
$GLOBALS['page']->post_content = '<!-- wp:pattern {"slug":"codela-storefront/agency-home"} /-->';
$enqueue();
agency_check( count( $GLOBALS['enqueued'] ) === 3 && in_array( 'codela-storefront-agency', $GLOBALS['enqueued'], true ) && in_array( 'codela-storefront-agency-widgets', $GLOBALS['enqueued'], true ), 'Agency reference pattern loads scoped CSS and interaction script.' );
$GLOBALS['enqueued'] = [];
$GLOBALS['page']->post_content = '';
$GLOBALS['layout'] = '<!-- wp:codela/section-agency-cards /-->';
$enqueue();
agency_check( count( $GLOBALS['enqueued'] ) === 2 && in_array( 'codela-storefront-agency-widgets', $GLOBALS['enqueued'], true ), 'Page-owned agency widgets load their own script in any shop.' );
$GLOBALS['enqueued'] = [];
$GLOBALS['layout'] = '';
$GLOBALS['front'] = false;
$enqueue();
agency_check( [] === $GLOBALS['enqueued'], 'Unrelated pages do not pay for agency assets.' );
$GLOBALS['ready'] = false;
agency_check( codela_sf_home() === '', 'Dependency gate is preserved.' );
$GLOBALS['ready'] = true;
agency_check( '' === codela_sf_agency_contact_url(), 'No invented contact route.' );
$GLOBALS['contact'] = (object) [ 'post_status' => 'draft' ];
agency_check( '' === codela_sf_agency_contact_url(), 'Draft contact page is not linked.' );
$GLOBALS['contact'] = (object) [ 'post_status' => 'publish', 'post_password' => 'private' ];
agency_check( '' === codela_sf_agency_contact_url(), 'Protected contact page is not linked.' );
$GLOBALS['contact'] = (object) [ 'post_status' => 'publish' ];
agency_check( 'https://example.test/iletisim/' === codela_sf_agency_contact_url(), 'Published contact permalink is used.' );
ob_start();require __DIR__ . '/../theme/codela-storefront/patterns/agency-home.php';$html = ob_get_clean();
agency_check( substr_count( $html, '<h1 ' ) === 1, 'One main heading.' );
agency_check( substr_count( $html, 'data-agency-card="' ) === 3, 'Three rotating hero cards.' );
agency_check( substr_count( $html, 'data-agency-variant="' ) === 2, 'Both reference hero modes are offered.' );
agency_check( str_contains( $html, 'data-agency-container-scroll hidden' ), 'Container scroll starts hidden without JavaScript.' );
agency_check( str_contains( $html, 'data-agency-scroll-device' ), 'Scroll tablet animation has its own isolated target.' );
agency_check( substr_count( $html, 'class="sf-agency-poster ' ) === 4, 'Four service posters in the horizontal carousel.' );
agency_check( str_contains( $html, 'data-agency-service-track' ), 'Native scrollable service deck.' );
agency_check( str_contains( $html, '<dialog ' ), 'Service details modal is rendered.' );
agency_check( ! str_contains( $html, 'cdn.' ) && ! str_contains( $html, '<script' ), 'No third-party runtime in pattern.' );
if ( in_array( '--render', $argv, true ) ) {
    echo '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
    foreach ( [ 'storefront-base.css', 'agency.css' ] as $file ) { echo '<link rel="stylesheet" href="/theme/codela-storefront/assets/styles/' . $file . '">'; }
    echo '<style>body{font-family:system-ui}</style></head><body class="home"><!-- agency-shell --><main class="sf-content" id="sf-content"><div class="sf-agency-home">' . $html . '</div></main><script src="/theme/codela-storefront/assets/scripts/agency.js"></script></body></html>';
    exit;
}
echo "Mode-free agency pattern, editor assets, native homepage, contact links and dependency gate passed.\n";
