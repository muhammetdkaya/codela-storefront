<?php
/** Agency selection, native template-part ownership, links and production fixture. */
define( 'ABSPATH', __DIR__ );
$GLOBALS['mode'] = 'commerce';
$GLOBALS['front'] = true;
$GLOBALS['ready'] = true;
$GLOBALS['contact'] = null;
$GLOBALS['enqueued'] = [];
function add_action( ...$args ) { $GLOBALS['actions'][$args[0]][] = $args[1]; }
function add_filter( ...$args ) {}
function codela_theme_settings() { return [ 'site_mode' => $GLOBALS['mode'] ]; }
function is_front_page() { return $GLOBALS['front']; }
function codela_sf_ready() { return $GLOBALS['ready']; }
function get_option( $name ) { return $name === 'show_on_front' ? 'page' : null; }
function do_blocks( $content ) { return $content; }
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
require __DIR__ . '/../theme/codela-storefront/inc/site-mode.php';
require __DIR__ . '/../theme/codela-storefront/inc/agency.php';
require __DIR__ . '/../theme/codela-storefront/inc/render.php';
function agency_check( $condition, $message ) { if ( ! $condition ) { throw new RuntimeException( $message ); } }
agency_check( str_contains( codela_sf_home(), 'wp:post-content' ), 'Commerce preserves Reading/post content.' );
$enqueue = $GLOBALS['actions']['wp_enqueue_scripts'][0];
$enqueue();
agency_check( [] === $GLOBALS['enqueued'], 'No agency assets in commerce mode.' );
$GLOBALS['mode'] = 'agency';
agency_check( str_contains( codela_sf_home(), '"slug":"agency-home"' ), 'Agency renders the editable native template part.' );
$enqueue();
agency_check( count( $GLOBALS['enqueued'] ) === 2, 'Agency front page loads only its two additional assets.' );
$GLOBALS['front'] = false;
$GLOBALS['enqueued'] = [];
$enqueue();
agency_check( [] === $GLOBALS['enqueued'], 'Agency assets stay off product/account/other pages.' );
agency_check( str_contains( codela_sf_home(), 'wp:post-content' ), 'Other pages are never replaced by the agency home.' );
$GLOBALS['front'] = true;
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
agency_check( substr_count( $html, '<article ' ) === 3, 'Three service showcases below hero.' );
agency_check( substr_count( $html, '<details ' ) === 3, 'All service details work natively without JavaScript.' );
agency_check( ! str_contains( $html, 'cdn.' ) && ! str_contains( $html, '<script' ), 'No third-party runtime in pattern.' );
if ( in_array( '--render', $argv, true ) ) {
    echo '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
    foreach ( [ 'tokens.css', 'components.css', 'agency.css' ] as $file ) { echo '<link rel="stylesheet" href="/theme/codela-storefront/assets/styles/' . $file . '">'; }
    echo '<style>body{margin:0;font-family:system-ui;background:#f5f6ef}*{box-sizing:border-box}.qa-header{height:76px;display:flex;align-items:center;justify-content:space-between;padding:0 5%;border-bottom:1px solid #dce1d3}.qa-header strong{font-size:26px;letter-spacing:-1px}.qa-header span{font-size:12px;color:#687565}.sf-content{padding:0}@media(max-width:700px){.qa-header{height:68px}}</style></head><body class="home sf-site-mode-agency"><header class="qa-header"><strong>codela.</strong><span>Dijital stüdyo</span></header><main class="sf-content">' . $html . '</main><script src="/theme/codela-storefront/assets/scripts/agency.js"></script></body></html>';
    exit;
}
echo "Agency mode isolation, editable part, dependency gate, published links and pattern passed.\n";
