<?php
/** Isolated coverage: native agency page seeding, scoped enqueue, contact form wiring. */
define( 'ABSPATH', __DIR__ );
$GLOBALS['mode'] = 'commerce';
$GLOBALS['pages'] = [];
$GLOBALS['opts'] = [];
$GLOBALS['actions'] = [];
$GLOBALS['front'] = false;
$GLOBALS['current'] = '';
$GLOBALS['assets'] = [];
function add_action( $name, $callback, $priority = 10 ) { $GLOBALS['actions'][$name][] = $callback; }
function add_filter( ...$args ) {}
function codela_theme_settings() { return [ 'site_mode' => $GLOBALS['mode'] ]; }
function codela_sf_ready() { return true; }
function is_front_page() { return $GLOBALS['front']; }
function is_page( $slugs ) { return in_array( $GLOBALS['current'], (array) $slugs, true ); }
function get_option( $name, $default = false ) { return $GLOBALS['opts'][$name] ?? $default; }
function update_option( $name, $value, $autoload = null ) { $GLOBALS['opts'][$name] = $value; return true; }
function get_page_by_path( $slug ) { return $GLOBALS['pages'][$slug] ?? null; }
function post_password_required( $post ) { return ! empty( $post->post_password ); }
function wp_insert_post( $data, $wp_error = false ) {
    $post = (object) $data; $post->ID = count( $GLOBALS['pages'] ) + 10;
    $GLOBALS['pages'][ $data['post_name'] ] = $post;
    return $post->ID;
}
function is_wp_error( $item ) { return false; }
function get_permalink( $post ) { return 'https://codela.test/' . $post->post_name . '/'; }
function home_url( $url = '/' ) { return 'https://codela.test' . $url; }
function esc_attr( $value ) { return htmlspecialchars( (string) $value, ENT_QUOTES ); }
function esc_html( $value ) { return esc_attr( $value ); }
function esc_url( $value ) { return esc_attr( $value ); }
function admin_url( $path ) { return 'https://codela.test/wp-admin/' . $path; }
function wp_nonce_field( ...$args ) { echo '<input type="hidden" name="agency_contact_nonce" value="testnonce">'; }
function get_privacy_policy_url() { return 'https://codela.test/gizlilik/'; }
function wp_unslash( $value ) { return $value; }
function sanitize_key( $value ) { return preg_replace( '/[^a-z0-9_-]/', '', strtolower( $value ) ); }
function get_template_directory_uri() { return 'https://codela.test/wp-content/themes/codela-storefront'; }
function wp_get_theme() { return new class { function get( $field ) { return '0.1.317'; } }; }
function wp_enqueue_style( $name ) { $GLOBALS['assets'][] = $name; }
function wp_enqueue_script( $name ) { $GLOBALS['assets'][] = $name; }
require __DIR__ . '/../theme/codela-storefront/inc/site-mode.php';
require __DIR__ . '/../theme/codela-storefront/inc/agency.php';
function agency_page_check( $check, $message ) { if ( ! $check ) throw new RuntimeException( $message ); }
codela_sf_agency_seed_pages();
agency_page_check( ! $GLOBALS['pages'], 'Commerce must never create agency pages.' );
$GLOBALS['mode'] = 'agency';
$GLOBALS['pages']['hizmetler'] = (object) [ 'ID' => 2, 'post_name' => 'hizmetler', 'post_status' => 'publish', 'post_content' => 'Existing custom content' ];
codela_sf_agency_seed_pages();
agency_page_check( count( $GLOBALS['pages'] ) === 3, 'Exactly three pages should exist after seeding, including the existing one.' );
agency_page_check( $GLOBALS['pages']['hizmetler']->post_content === 'Existing custom content', 'Existing page content must remain unchanged.' );
agency_page_check( str_contains( $GLOBALS['pages']['hakkimizda']->post_content, 'agency-about' ), 'About is a native block pattern.' );
agency_page_check( str_contains( $GLOBALS['pages']['iletisim']->post_content, 'agency-contact' ), 'Contact is a native block pattern.' );
codela_sf_agency_seed_pages();
agency_page_check( count( $GLOBALS['pages'] ) === 3, 'Seeding is idempotent.' );
agency_page_check( codela_sf_agency_contact_url() === 'https://codela.test/iletisim/', 'Only the published real contact page is linked.' );
$enqueue = $GLOBALS['actions']['wp_enqueue_scripts'][0];
$GLOBALS['current'] = 'hizmetler';
$enqueue();
agency_page_check( count( $GLOBALS['assets'] ) === 2, 'Services page loads scoped assets.' );
$GLOBALS['assets'] = [];
$GLOBALS['current'] = 'checkout';
$enqueue();
agency_page_check( ! $GLOBALS['assets'], 'WooCommerce and unrelated pages remain untouched.' );
$GLOBALS['current'] = '';
foreach ( [ 'agency-services', 'agency-about', 'agency-contact', 'agency-process' ] as $slug ) {
    ob_start(); require __DIR__ . '/../theme/codela-storefront/patterns/' . $slug . '.php'; $html = ob_get_clean();
    agency_page_check( strlen( $html ) > 500, $slug . ' renders actual content.' );
    if ( $slug === 'agency-services' ) {
        agency_page_check( substr_count( $html, 'class="sf-agency-module"' ) === 6, 'Exactly six services from the reference.' );
        agency_page_check( substr_count( $html, 'data-agency-filter="' ) === 4, 'Category filter has four selections.' );
    } elseif ( $slug === 'agency-process' ) {
        agency_page_check( substr_count( $html, 'data-agency-step="' ) === 3, 'Process has three reference steps.' );
    } elseif ( $slug === 'agency-contact' ) {
        agency_page_check( str_contains( $html, 'admin-post.php' ) && str_contains( $html, 'agency_contact_nonce' ), 'Real WordPress form action and nonce.' );
        agency_page_check( str_contains( $html, 'agency_consent' ) && str_contains( $html, 'agency_webpage' ), 'Contact consent and honeypot.' );
    }
}
foreach ( [ 'services', 'about', 'contact' ] as $page_slug ) {
    if ( ! in_array( '--render=' . $page_slug, $argv, true ) ) { continue; }
    ob_start();
    require __DIR__ . '/../theme/codela-storefront/patterns/agency-' . $page_slug . '.php';
    $body = ob_get_clean();
    if ( 'about' === $page_slug ) {
        ob_start();
        require __DIR__ . '/../theme/codela-storefront/patterns/agency-process.php';
        $process = ob_get_clean();
        $body = str_replace( '<!-- wp:pattern {"slug":"codela-storefront/agency-process"} /-->', $process, $body );
    }
    echo '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
    foreach ( [ 'storefront-base.css', 'agency.css' ] as $name ) {
        echo '<link rel="stylesheet" href="/theme/codela-storefront/assets/styles/' . $name . '">';
    }
    echo '<style>body{font-family:system-ui}</style></head><body class="sf-site-mode-agency">';
    echo '<main class="sf-content" id="sf-content">' . $body . '</main>';
    echo '<script src="/theme/codela-storefront/assets/scripts/agency.js"></script></body></html>';
    exit;
}
echo "Agency native pages, six services, process and contact form wiring passed.\n";
