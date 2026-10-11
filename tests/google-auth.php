<?php
/* Deterministic security boundary tests for the isolated Google login adapter. */
define( 'ABSPATH', __DIR__ );
define( 'MINUTE_IN_SECONDS', 60 );
$GLOBALS['settings'] = [
    'codela_sf_google_client_id' => 'abc.apps.googleusercontent.com',
    'codela_sf_google_client_secret' => 'private-secret',
];
$GLOBALS['customers'] = [];
$GLOBALS['meta'] = [];
$GLOBALS['created'] = 0;
class WP_Error { public function __construct( public string $code ) {} }
class WP_User {
    public function __construct(
        public int $ID,
        public string $user_email,
        public array $roles = [ 'customer' ],
        public string $user_login = 'customer'
    ) {}
}
function add_action( ...$args ) {}
function get_option( $key, $default = '' ) { return $GLOBALS['settings'][ $key ] ?? $default; }
function is_ssl() { return true; }
function is_user_logged_in() { return false; }
function is_account_page() { return true; }
function admin_url( $path, $scheme = null ) { return 'https://store.test/wp-admin/' . $path; }
function wc_get_page_permalink( $page ) { return 'https://store.test/my-account/'; }
function esc_url( $value ) { return htmlspecialchars( $value, ENT_QUOTES ); }
function esc_html_e( $value, $domain = '' ) { echo htmlspecialchars( $value, ENT_QUOTES ); }
function esc_html__( $value, $domain = '' ) { return $value; }
function esc_attr( $value ) { return htmlspecialchars( $value, ENT_QUOTES ); }
function esc_html( $value ) { return htmlspecialchars( $value, ENT_QUOTES ); }
function is_email( $email ) { return filter_var( $email, FILTER_VALIDATE_EMAIL ) !== false; }
function sanitize_email( $email ) { return filter_var( $email, FILTER_SANITIZE_EMAIL ); }
function user_can( $user, $capability ) { return in_array( 'administrator', $user->roles, true ); }
function get_users( $args ) {
    return array_values( array_filter( $GLOBALS['customers'], fn( $user ) =>
        ( $GLOBALS['meta'][ $user->ID ]['_sf_google_sub'] ?? '' ) === $args['meta_value'] ) );
}
function get_user_by( $field, $value ) {
    foreach ( $GLOBALS['customers'] as $user ) {
        if ( 'email' === $field && $user->user_email === $value ) { return $user; }
        if ( 'id' === $field && $user->ID === (int) $value ) { return $user; }
    }
    return false;
}
function get_user_meta( $id, $key, $single = false ) { return $GLOBALS['meta'][ $id ][ $key ] ?? ''; }
function update_user_meta( $id, $key, $value ) { $GLOBALS['meta'][ $id ][ $key ] = $value; }
function wp_generate_password( ...$args ) { return 'random-generated-password-not-leaked'; }
function wc_create_new_customer( $email, $username, $password ) {
    $id = 1000 + $GLOBALS['created']++;
    $GLOBALS['customers'][] = new WP_User( $id, $email );
    return $id;
}

require __DIR__ . '/../theme/codela-storefront/inc/google-auth.php';

function kind( $value ) { return $value instanceof WP_User ? 'customer' : ( $value instanceof WP_Error ? $value->code : 'unknown' ); }
$make = fn( $sub, $email, $hosted = '' ) => [
    'sub' => $sub, 'email' => $email, 'email_verified' => true, 'hd' => $hosted,
];

$results = [];
$results['enabled'] = codela_sf_google_enabled();
$results['callback'] = codela_sf_google_callback_url();
ob_start();
codela_sf_google_button();
$button = ob_get_clean();
$results['button'] = str_contains( $button, 'sf-ui-button--secondary' ) &&
    str_contains( $button, 'Continue with Google' ) &&
    str_contains( $button, 'codela_sf_google_start' );
$results['reject_unverified'] = kind( codela_sf_google_customer( [
    'sub' => 'abc-1', 'email' => 'unverified@gmail.com', 'email_verified' => false,
] ) );
$results['reject_missing_sub'] = kind( codela_sf_google_customer( [
    'email' => 'sub@gmail.com', 'email_verified' => true,
] ) );
$first = codela_sf_google_customer( $make( 'google-new-1', 'new@gmail.com' ) );
$results['new'] = kind( $first );
$results['created_count'] = $GLOBALS['created'];
$results['new_linked'] = get_user_meta( $first->ID, '_sf_google_sub', true );
$results['reuse_sub'] = codela_sf_google_customer( $make( 'google-new-1', 'new@gmail.com' ) )->ID === $first->ID;
$results['reject_conflicting_sub'] = kind( codela_sf_google_customer( $make( 'another-sub', 'new@gmail.com' ) ) );

$GLOBALS['customers'][] = new WP_User( 20, 'existing@example.com' );
$results['reject_external_auto_link'] = kind( codela_sf_google_customer( $make( 'ext-1', 'existing@example.com' ) ) );
$results['allow_hosted_authority'] = kind( codela_sf_google_customer( $make( 'ext-1', 'existing@example.com', 'example.com' ) ) );
$GLOBALS['customers'][] = new WP_User( 21, 'loyal@gmail.com' );
$results['link_existing_gmail'] = kind( codela_sf_google_customer( $make( 'gmail-1', 'loyal@gmail.com' ) ) );
$GLOBALS['customers'][] = new WP_User( 22, 'admin@gmail.com', [ 'administrator' ], 'admin' );
$results['reject_admin'] = kind( codela_sf_google_customer( $make( 'admin-1', 'admin@gmail.com' ) ) );
$GLOBALS['settings']['codela_sf_google_client_secret'] = '';
ob_start();
codela_sf_google_button();
$results['disabled_button'] = ob_get_clean();
$results['disabled'] = ! codela_sf_google_enabled();
echo json_encode( $results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
