<?php
/** Agency pages, native navigation ownership, pattern assets and independent widgets. */
define( 'ABSPATH', __DIR__ );
$GLOBALS['pages'] = [
    'hizmetler' => (object) [ 'ID' => 2, 'post_type' => 'page', 'post_name' => 'hizmetler',
        'post_status' => 'publish', 'post_content' => '<!-- wp:pattern {"slug":"codela-storefront/agency-services"} /-->' ],
    'hakkimizda' => (object) [ 'ID' => 3, 'post_type' => 'page', 'post_name' => 'hakkimizda',
        'post_status' => 'publish', 'post_content' => '<!-- wp:pattern {"slug":"codela-storefront/agency-about"} /-->' ],
    'iletisim' => (object) [ 'ID' => 4, 'post_type' => 'page', 'post_name' => 'iletisim',
        'post_status' => 'publish', 'post_content' => '<!-- wp:pattern {"slug":"codela-storefront/agency-contact"} /-->' ],
];
$GLOBALS['query'] = $GLOBALS['pages']['hizmetler'];
$GLOBALS['layout'] = '';
$GLOBALS['assets'] = [];
$GLOBALS['actions'] = [];
function add_action( $name, $callback, $priority = 10 ) { $GLOBALS['actions'][$name][] = $callback; }
function add_filter( ...$args ) {}
function codela_sf_ready() { return true; }
function is_front_page() { return true; }
function get_queried_object_id() { return $GLOBALS['query']->ID; }
function get_post( $id ) { return $GLOBALS['query']->ID === $id ? $GLOBALS['query'] : null; }
function get_post_meta( $id, $key, $single = true ) { return $GLOBALS['layout']; }
function get_page_by_path( $slug ) { return $GLOBALS['pages'][$slug] ?? null; }
function post_password_required( $post ) { return ! empty( $post->post_password ); }
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
function wp_get_theme() { return new class { function get( $field ) { return '0.1.321'; } }; }
function wp_enqueue_style( $name ) { $GLOBALS['assets'][] = $name; }
function wp_enqueue_script( $name ) { $GLOBALS['assets'][] = $name; }
require __DIR__ . '/../theme/codela-storefront/inc/agency.php';
function agency_page_check( $check, $message ) { if ( ! $check ) throw new RuntimeException( $message ); }
agency_page_check( codela_sf_agency_contact_url() === 'https://codela.test/iletisim/', 'Contact URL resolves through normal published page.' );
$enqueue = $GLOBALS['actions']['wp_enqueue_scripts'][0];
$enqueue();
agency_page_check( count( $GLOBALS['assets'] ) === 2 && in_array( 'codela-storefront-agency', $GLOBALS['assets'], true ),
    'Existing agency pattern loads theme CSS and pattern motion.' );
$GLOBALS['assets'] = [];
$GLOBALS['query'] = (object) [ 'ID' => 9, 'post_type' => 'page', 'post_content' => '' ];
$enqueue();
agency_page_check( [] === $GLOBALS['assets'], 'Unrelated page has no agency-specific assets.' );
$GLOBALS['layout'] = '<!-- wp:codela/section-agency-scroll /-->';
$enqueue();
agency_page_check( count( $GLOBALS['assets'] ) === 2 && in_array( 'codela-storefront-agency-widgets', $GLOBALS['assets'], true ),
    'Any WordPress page with an agency widget loads the correct independent script.' );
$GLOBALS['layout'] = '';

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

// Independent widgets reuse validated editorial text without mutating the
// original pattern or the legacy variant switch.
function sanitize_html_class( $value ) { return preg_replace( '/[^a-zA-Z0-9_-]/', '', $value ); }
function codela_sf_ui_button( $label, $attrs ) { return '<a href="' . esc_url( $attrs['href'] ) . '">' . esc_html( $label ) . '</a>'; }
require __DIR__ . '/../theme/codela-storefront/inc/section-agency.php';
$widget_data = [
    'id' => 'cards-demo', 'title' => 'Our Agency', 'description' => 'Independent and editable',
    'items' => [
        [ 'enabled' => true, 'title' => 'Design', 'body' => 'UI and UX' ],
        [ 'enabled' => true, 'title' => 'Commerce', 'body' => 'WooCommerce' ],
        [ 'enabled' => true, 'title' => 'Code', 'body' => 'APIs' ],
    ],
];
$cards = codela_sf_section_agency_cards( $widget_data );
agency_page_check( substr_count( $cards, 'data-agency-card="' ) === 3, 'Card Swap renders three distinct cards.' );
agency_page_check( substr_count( codela_sf_section_agency_cards( $widget_data, '', true ), '<h1 ' ) === 1, 'First homepage Card Swap owns a single H1.' );
agency_page_check( ! str_contains( $cards, '<h1 ' ), 'Secondary Card Swap uses H2.' );
agency_page_check( str_contains( $cards, 'Our Agency' ) && str_contains( $cards, 'UI and UX' ), 'Saved agency heading and item text appear.' );
$widget_data['id'] = 'scroll-demo';
$scroll = codela_sf_section_agency_scroll( $widget_data );
agency_page_check( str_contains( $scroll, 'data-agency-container-scroll' ) && str_contains( $scroll, 'data-agency-scroll-device' ), '3D Scroll keeps isolated motion hooks.' );
agency_page_check( substr_count( codela_sf_section_agency_scroll( $widget_data, '', true ), '<h1 ' ) === 1, 'First homepage 3D Scroll owns a single H1.' );
agency_page_check( str_contains( $scroll, 'Independent and editable' ) && substr_count( $scroll, '<strong>' ) === 3, 'Saved scroll content appears.' );
$widget_data['id'] = 'cards-duplicate';
agency_page_check( str_contains( codela_sf_section_agency_cards( $widget_data ), 'sf-agency-cards-cards-duplicate' ), 'Cloned widget gets independent accessible IDs.' );
$widget_data['items'][0]['title'] = '<script>unsafe</script>';
agency_page_check( ! str_contains( codela_sf_section_agency_cards( $widget_data ), '<script>' ), 'Widget escapes saved editorial text.' );
agency_page_check( str_contains( codela_sf_section_agency_cards( $widget_data ), 'data-agency-widget="cards"' ),
    'Agency widget remains available without any site mode.' );
$GLOBALS['mode'] = 'agency';


if ( in_array( '--render=widgets', $argv, true ) ) {
    $widget_data['items'][0]['title'] = 'Design';
    $widget_data['id'] = 'widget-cards-a';
    $first_cards = codela_sf_section_agency_cards( $widget_data );
    $widget_data['id'] = 'widget-scroll-a';
    $middle_scroll = codela_sf_section_agency_scroll( $widget_data );
    $widget_data['id'] = 'widget-cards-b';
    $last_cards = codela_sf_section_agency_cards( $widget_data );
    echo '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
    foreach ( [ 'storefront-base.css', 'agency.css' ] as $style ) {
        echo '<link rel="stylesheet" href="/theme/codela-storefront/assets/styles/' . $style . '">';
    }
    echo '</head><body class="sf-site-mode-agency"><main class="sf-content"><h1 class="screen-reader-text">Agency Layout</h1><div class="codela-page-layout">';
    echo $first_cards . $middle_scroll . $last_cards;
    echo '</div></main><script src="/theme/codela-storefront/assets/scripts/agency-widgets.js"></script></body></html>';
    exit;
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
