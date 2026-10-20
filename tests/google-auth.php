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
function is_wp_error( $value ) { return $value instanceof WP_Error; }
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
$results['configured_button'] = $button;
$results['button'] = str_contains( $button, 'sf-ui-button--secondary' ) &&
    str_contains( $button, 'Continue with Google' ) &&
    str_contains( $button, 'codela_sf_google_start' );
$results['configured_has_no_notice'] = ! str_contains( $button, 'popovertarget' );
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
// Exercise the real start/callback functions. Only WordPress HTTP/storage and
// redirects are stubbed; no request reaches Google or a live customer store.
class RedirectResult extends Exception { public function __construct(public string $url) {} }
function add_query_arg($args,$value=null,$url=null) {
    if (is_array($args)) { $base=$value; $query=$args; } else { $base=$url; $query=[$args=>$value]; }
    return $base . (str_contains($base,'?')?'&':'?') . http_build_query($query);
}
function nocache_headers() {}
function wp_safe_redirect($url,...$args) { throw new RedirectResult($url); }
function wp_redirect($url,...$args) { throw new RedirectResult($url); }
function set_transient($key,$value,$ttl) { $GLOBALS['transients'][$key]=$value; }
function get_transient($key) { return $GLOBALS['transients'][$key]??false; }
function delete_transient($key) { unset($GLOBALS['transients'][$key]); }
function wp_remote_post($url,$options) { $GLOBALS['http'][]=[$url,$options];return ['status'=>200,'body'=>json_encode(['access_token'=>'isolated-token'])]; }
function wp_remote_get($url,$options) { $GLOBALS['http'][]=[$url,$options];return ['status'=>200,'body'=>json_encode(['sub'=>'oauth-callback-user','email'=>'callback@gmail.com','email_verified'=>true])]; }
function wp_remote_retrieve_response_code($response) { return $response['status']; }
function wp_remote_retrieve_body($response) { return $response['body']; }
function wp_set_current_user($id) { $GLOBALS['logged_in']=$id; }
function wp_set_auth_cookie($id,$remember,$secure) { $GLOBALS['login_cookie']=[$id,$remember,$secure]; }
function do_action(...$args) {}
function run_redirect($callback) { try { $callback(); } catch(RedirectResult $r) { return $r->url; } throw new RuntimeException('No redirect'); }
$GLOBALS['settings']['codela_sf_google_client_secret']='isolated-secret';
$start=run_redirect('codela_sf_google_start');parse_str(parse_url($start,PHP_URL_QUERY),$query);
$verifier=get_transient('sf_google_'.hash('sha256',$query['state']));
$results['start_host']=parse_url($start,PHP_URL_HOST);
$results['start_redirect']=$query['redirect_uri'];
$results['pkce_matches']=$query['code_challenge']===rtrim(strtr(base64_encode(hash('sha256',$verifier,true)),'+/','-_'),'=');
$_GET=['state'=>$query['state'],'code'=>'isolated-code'];$_COOKIE=['sf_google_oauth'=>str_repeat('a',64)];
$results['wrong_browser']=run_redirect('codela_sf_google_callback');
$results['wrong_browser_no_request']=empty($GLOBALS['http']);
$_COOKIE=['sf_google_oauth'=>$query['state']];
$results['callback_success']=run_redirect('codela_sf_google_callback');
$results['callback_secure_customer']=($GLOBALS['login_cookie']??[])===[$GLOBALS['logged_in'],true,true];
$results['callback_exchange_proof']=$GLOBALS['http'][0][1]['body']['code_verifier']===$verifier;
$results['callback_replay']=run_redirect('codela_sf_google_callback');
$results['callback_request_count']=count($GLOBALS['http']);
echo json_encode( $results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
