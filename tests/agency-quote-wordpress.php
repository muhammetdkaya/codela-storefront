<?php
/** Real WordPress integration, isolated DB, no external mail sent. */
function agency_real_expect( bool $ok, string $message ): void { if ( ! $ok ) { throw new RuntimeException( $message ); } }
agency_real_expect( codela_sf_ready(), 'Theme boots with Codela and no WooCommerce' );
wp_set_current_user( 1 );
function agency_real_child( string $type, string $id, string $variant, string $title, bool $enabled = true ): array {
    $data = codela_sections_clean( $type, [ 'id' => $id, 'variant' => $variant, 'title' => $title, 'description' => '', 'items' => [], 'enabled' => $enabled ] );
    agency_real_expect( ! is_wp_error( $data ), 'Valid section: ' . $type );
    return [ 'blockName' => 'codela/section-' . $type, 'attrs' => [ 'data' => $data ], 'innerBlocks' => [], 'innerHTML' => '', 'innerContent' => [] ];
}
function agency_real_page( string $title, array $children, string $native = '', string $status = 'publish', string $password = '' ): int {
    $layout = serialize_block( codela_sections_root_block( $children ) );
    agency_real_expect( ! is_wp_error( codela_sections_validate_meta( $layout ) ), 'Valid page layout' );
    $id = wp_insert_post( [ 'post_type' => 'page', 'post_title' => $title, 'post_status' => $status, 'post_content' => $native, 'post_password' => $password ], true );
    agency_real_expect( ! is_wp_error( $id ) && $id > 0, 'Page created in isolated DB' );
    update_post_meta( $id, CODELA_LAYOUT_META, wp_slash( $layout ) );
    return (int) $id;
}
$detail = agency_real_child( 'agency-detail', 'quote-web', 'web', 'Web Tasarım' );
$commerce = agency_real_child( 'agency-detail', 'quote-shop', 'commerce', 'E-Ticaret' );
$contact = agency_real_child( 'agency-contact-bento', 'contact-a', 'bento', 'İletişim A' );
$project = agency_real_child( 'agency-project', 'project-a', 'flow', 'Proje Başlat' );
$mixed = agency_real_page( 'Independent mixed page', [ $detail, $commerce, $contact, $project ], '<!-- wp:paragraph --><p>Native paragraph remains visible.</p><!-- /wp:paragraph -->' );
$only = agency_real_page( 'Pure detail page', [ $detail ] );
$disabled = agency_real_page( 'Disabled detail', [ agency_real_child( 'agency-detail', 'quote-web', 'web', 'Web', false ) ] );
$draft = agency_real_page( 'Draft detail', [ $detail ], '', 'draft' );
$private = agency_real_page( 'Protected detail', [ $detail ], '', 'publish', 'test-password' );
agency_real_expect( ! codela_sf_agency_exclusive_page( get_post( $mixed ) ) && codela_sf_agency_exclusive_page( get_post( $only ) ), 'Mixed page does not own the dark site shell' );
agency_real_expect( codela_sf_agency_form_source( $mixed, 'agency-detail', 'quote-web' ) === get_permalink( $mixed ), 'Native page source resolves actual URL' );
foreach ( [ $disabled, $draft, $private ] as $id ) { agency_real_expect( ! codela_sf_agency_form_source( $id, 'agency-detail', 'quote-web' ), 'Disabled, draft and password pages cannot submit' ); }
agency_real_expect( ! codela_sf_agency_form_source( $mixed, 'agency-project', 'quote-web' ), 'Cross-type component rejected' );
$rules = codela_sf_quote_defaults();
$rules['web']['packages'][0] = [ 'label' => 'WordPress acceptance', 'min' => 12000, 'max' => 18000 ];
$rules['web']['extras'][0] = [ 'label' => 'Ek sayfa acceptance', 'min' => 1500, 'max' => 2000 ];
$rules['web']['extras'][1] = [ 'label' => 'Kapsamı belirlenecek', 'min' => null, 'max' => null ];
update_option( 'codela_sf_quote_rules', codela_sf_quote_clean( $rules ), false );
$GLOBALS['wp_query'] = new WP_Query( [ 'page_id' => $mixed ] );
$GLOBALS['post'] = get_post( $mixed );
agency_real_expect( in_array( 'sf-agency-mixed', get_body_class(), true ), 'Mixed body class comes from real WordPress' );
$flags = codela_sf_agency_asset_flags();
agency_real_expect( $flags['widgets'] && $flags['project'] && $flags['visuals'] && ! $flags['studio'], 'Validated content owns only relevant assets' );
$quote = codela_sf_quote_markup( 'web', $detail['attrs']['data'] );
agency_real_expect( str_contains( $quote, '12.000' ) && str_contains( $quote, 'quote_nonce' ) && str_contains( $quote, 'agency_source_nonce' ), 'Configured live quote form and source nonce render' );
$quote2 = codela_sf_quote_markup( 'commerce', $commerce['attrs']['data'] );
agency_real_expect( ! str_contains( $quote2, 'başlangıç tahmini' ) && ! str_contains( $quote2, '12.000' ), 'Unpriced service never inherits another service price' );
class AgencyRealRedirect extends RuntimeException {}
class AgencyRealDie extends RuntimeException {}
add_filter( 'wp_redirect', static function( $url ) { throw new AgencyRealRedirect( $url ); } );
add_filter( 'wp_die_handler', static function() { return static function( $message ) { throw new AgencyRealDie( is_string( $message ) ? $message : 'wp_die' ); }; } );
$mails = [];
add_filter( 'pre_wp_mail', static function( $pre, $atts ) use ( &$mails ) { $mails[] = $atts; return true; }, 10, 2 );
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REMOTE_ADDR'] = '192.0.2.33';
$_POST = [
    'agency_source_page' => (string) $mixed, 'agency_source_component' => 'quote-web',
    'agency_source_nonce' => wp_create_nonce( 'codela_sf_source_' . $mixed . '_quote-web' ),
    'quote_nonce' => wp_create_nonce( 'codela_sf_agency_quote' ), 'quote_service' => 'web',
    'quote_package' => '0', 'quote_extra' => ['0'], 'quote_name' => 'Acceptance Visitor',
    'quote_email' => 'visitor@example.test', 'quote_note' => 'Acceptance only', 'quote_consent' => '1', 'quote_webpage' => '',
];
$base_post = $_POST;
function agency_real_submit(): string {
    try { codela_sf_quote_submit(); }
    catch ( AgencyRealRedirect $e ) { return $e->getMessage(); }
    catch ( AgencyRealDie $e ) { return 'denied'; }
    throw new RuntimeException( 'Quote handler must terminate via safe redirect' );
}
$_POST['agency_source_nonce'] = 'wrong';
agency_real_expect( agency_real_submit() === 'denied' && ! $mails, 'Forged source nonce rejected before mail' );
$_POST = $base_post; $_POST['quote_service'] = 'commerce';
agency_real_expect( str_contains( agency_real_submit(), 'codela_quote_status=invalid' ) && ! $mails, 'Service cannot be switched by forged POST' );
$_POST = $base_post; $_POST['quote_extra'] = ['5'];
agency_real_expect( str_contains( agency_real_submit(), 'codela_quote_status=invalid' ) && ! $mails, 'Unknown extra rejected' );
$_POST = $base_post; $_POST['quote_consent'] = '0';
agency_real_expect( str_contains( agency_real_submit(), 'codela_quote_status=invalid' ) && ! $mails, 'Consent is required' );
$_POST = $base_post; $_POST['quote_price'] = '1';
$url = agency_real_submit();
agency_real_expect( str_contains( $url, 'codela_quote_status=sent' ) && str_contains( $url, 'codela_component=quote-web' ) && count( $mails ) === 1, 'Valid request returns to exact source page' );
agency_real_expect( str_contains( $mails[0]['message'], '13.500 – 20.000 TL' ), 'Mail estimate is recomputed server-side, ignoring forged price' );
agency_real_expect( str_contains( agency_real_submit(), 'codela_quote_status=wait' ) && count( $mails ) === 1, 'Repeated requests throttled' );
parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $_GET );
agency_real_expect( str_contains( codela_sf_quote_markup( 'web', $detail['attrs']['data'] ), 'Talebin alındı.' ), 'Only valid mail receipt shows confirmation' );
agency_real_expect( ! str_contains( codela_sf_quote_markup( 'commerce', $commerce['attrs']['data'] ), 'Talebin alındı.' ), 'Other component never shows receipt' );
$_GET['codela_quote_receipt'] = str_repeat( '0', 32 );
agency_real_expect( ! str_contains( codela_sf_quote_markup( 'web', $detail['attrs']['data'] ), 'Talebin alındı.' ), 'Forged receipt cannot show success' );
$_GET = $_POST = [];
file_put_contents( '/tmp/codela-agency-real-fixture.json', wp_json_encode( [ 'mixed' => $mixed, 'only' => $only, 'disabled' => $disabled ] ) );
echo "Real WordPress assets, arbitrary page sources, pricing and mail acceptance passed.\n";
