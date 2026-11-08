<?php
/**
 * Codela Storefront platform passkeys (WebAuthn ES256).
 * Customer-only, HTTPS, origin/RP-bound, one-time challenges.
 * Separate from legacy IndexedDB/6-digit PIN credentials.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_pk_encode( string $bytes ): string {
    return rtrim( strtr( base64_encode( $bytes ), '+/', '-_' ), '=' );
}
function codela_sf_pk_decode( $input, int $max = 4096 ) {
    if ( ! is_string( $input ) || strlen( $input ) > $max * 2 || ! preg_match( '/^[A-Za-z0-9_-]+={0,2}$/D', $input ) ) { return false; }
    $padded = strtr( rtrim( $input, '=' ), '-_', '+/' );
    $bytes = base64_decode( $padded . str_repeat( '=', ( 4 - strlen( $padded ) % 4 ) % 4 ), true );
    return is_string( $bytes ) && strlen( $bytes ) <= $max ? $bytes : false;
}
function codela_sf_pk_origin(): string {
    $url = wp_parse_url( home_url( '/' ) );
    $scheme = strtolower( (string) ( $url['scheme'] ?? '' ) );
    $host = strtolower( (string) ( $url['host'] ?? '' ) );
    if ( 'https' !== $scheme || ! $host ) { return ''; }
    $port = isset( $url['port'] ) ? ':' . (int) $url['port'] : '';
    return 'https://' . $host . $port;
}
function codela_sf_pk_host(): string {
    return (string) wp_parse_url( home_url( '/' ), PHP_URL_HOST );
}
function codela_sf_pk_error( int $status = 400 ): WP_Error {
    return new WP_Error( 'sf_passkey_failed', __( 'Passkey verification failed. Use your password or try again.', 'codela-storefront' ), [ 'status' => $status ] );
}
function codela_sf_pk_enabled( $user ): bool {
    return codela_sf_pk_origin() && function_exists( 'codela_sf_quick_customer' ) && $user instanceof WP_User && codela_sf_quick_customer( $user );
}
function codela_sf_pk_credentials( int $user_id ): array {
    $stored = get_user_meta( $user_id, '_codela_sf_passkeys', true );
    return is_array( $stored ) ? $stored : [];
}
function codela_sf_pk_option( string $credential_id ): string {
    return 'sf_pk_id_' . hash( 'sha256', $credential_id );
}
function codela_sf_pk_nonce_key( int $user_id ): string {
    return 'sf_pk_reg_' . hash( 'sha256', $user_id . ':' . wp_get_session_token() );
}
function codela_sf_pk_client_data( $encoded, string $type, string $challenge ) {
    $bytes = codela_sf_pk_decode( $encoded, 4096 );
    if ( ! $bytes ) { return false; }
    $data = json_decode( $bytes, true );
    if ( ! is_array( $data ) || ( $data['type'] ?? '' ) !== $type
        || ! hash_equals( $challenge, (string) ( $data['challenge'] ?? '' ) )
        || ( $data['origin'] ?? '' ) !== codela_sf_pk_origin()
        || ! empty( $data['crossOrigin'] ) ) { return false; }
    return $bytes;
}
function codela_sf_pk_auth_data( $encoded ) {
    $auth = codela_sf_pk_decode( $encoded, 8192 );
    if ( ! $auth || strlen( $auth ) < 37 ) { return false; }
    if ( ! hash_equals( hash( 'sha256', codela_sf_pk_host(), true ), substr( $auth, 0, 32 ) ) ) { return false; }
    $flags = ord( $auth[32] );
    if ( ( $flags & 0x01 ) === 0 || ( $flags & 0x04 ) === 0 ) { return false; } // UP + UV.
    $counter = unpack( 'N', substr( $auth, 33, 4 ) )[1];
    return [ $auth, $counter ];
}
function codela_sf_pk_registration_options( WP_REST_Request $request ) {
    $user = wp_get_current_user();
    if ( ! codela_sf_pk_enabled( $user ) ) { return codela_sf_pk_error( 403 ); }
    $credentials = codela_sf_pk_credentials( $user->ID );
    if ( count( $credentials ) >= 5 ) { return codela_sf_pk_error( 409 ); }
    $handle = get_user_meta( $user->ID, '_codela_sf_pk_handle', true );
    if ( ! is_string( $handle ) || ! codela_sf_pk_decode( $handle, 64 ) ) {
        $handle = codela_sf_pk_encode( random_bytes( 32 ) );
        update_user_meta( $user->ID, '_codela_sf_pk_handle', $handle );
    }
    $challenge = codela_sf_pk_encode( random_bytes( 32 ) );
    set_transient( codela_sf_pk_nonce_key( $user->ID ), $challenge, 120 );
    return rest_ensure_response( [
        'rp' => [ 'id' => codela_sf_pk_host(), 'name' => get_bloginfo( 'name' ) ],
        'user' => [ 'id' => $handle, 'name' => (string) $user->user_login, 'displayName' => codela_sf_quick_display_name( $user ) ],
        'challenge' => $challenge,
        'pubKeyCredParams' => [ [ 'type' => 'public-key', 'alg' => -7 ] ],
        'authenticatorSelection' => [ 'residentKey' => 'required', 'userVerification' => 'required' ],
        'timeout' => 90000, 'attestation' => 'none',
        'excludeCredentials' => array_map( static function( $id ) { return [ 'id' => $id, 'type' => 'public-key' ]; }, array_keys( $credentials ) ),
    ] );
}
function codela_sf_pk_register( WP_REST_Request $request ) {
    $user = wp_get_current_user();
    if ( ! codela_sf_pk_enabled( $user ) ) { return codela_sf_pk_error( 403 ); }
    $key = codela_sf_pk_nonce_key( $user->ID );
    $challenge = get_transient( $key );
    delete_transient( $key );
    $body = $request->get_json_params();
    $response = is_array( $body['response'] ?? null ) ? $body['response'] : [];
    $id = (string) ( $body['id'] ?? '' );
    $id_bytes = codela_sf_pk_decode( $id, 1024 );
    $public = codela_sf_pk_decode( $response['publicKey'] ?? null, 2048 );
    $auth = codela_sf_pk_auth_data( $response['authenticatorData'] ?? null );
    if ( ! $challenge || ! is_string( $challenge ) || ! $id_bytes || strlen( $id_bytes ) < 16
        || ! hash_equals( $id, codela_sf_pk_encode( $id_bytes ) )
        || ! codela_sf_pk_client_data( $response['clientDataJSON'] ?? null, 'webauthn.create', $challenge )
        || ! $auth || ! $public ) { return codela_sf_pk_error(); }
    $pem = "-----BEGIN PUBLIC KEY-----\n" . chunk_split( base64_encode( $public ), 64, "\n" ) . "-----END PUBLIC KEY-----\n";
    $parsed = openssl_pkey_get_public( $pem );
    $details = $parsed ? openssl_pkey_get_details( $parsed ) : [];
    if ( ! is_array( $details ) || ( $details['type'] ?? null ) !== OPENSSL_KEYTYPE_EC
        || ( $details['ec']['curve_name'] ?? '' ) !== 'prime256v1' ) { return codela_sf_pk_error(); }
    $credentials = codela_sf_pk_credentials( $user->ID );
    if ( count( $credentials ) >= 5 && ! isset( $credentials[ $id ] ) ) { return codela_sf_pk_error( 409 ); }
    $mapped = get_option( codela_sf_pk_option( $id ), false );
    if ( $mapped && (int) $mapped !== $user->ID ) { return codela_sf_pk_error( 409 ); }
    if ( ! $mapped && ! add_option( codela_sf_pk_option( $id ), (string) $user->ID, '', false ) ) { return codela_sf_pk_error( 409 ); }
    $credentials[ $id ] = [
        'pem' => $pem, 'sign_count' => $auth[1], 'created' => time(), 'last_used' => 0,
        'paused' => false, 'label' => __( 'Passkey', 'codela-storefront' ),
    ];
    update_user_meta( $user->ID, '_codela_sf_passkeys', $credentials );
    return rest_ensure_response( [ 'ok' => true ] );
}
function codela_sf_pk_assertion_options( WP_REST_Request $request ) {
    if ( ! codela_sf_pk_origin() || ! codela_sf_quick_ip_limit() ) { return codela_sf_pk_error( 429 ); }
    codela_sf_quick_ip_limit( true );
    $id = bin2hex( random_bytes( 16 ) );
    $challenge = codela_sf_pk_encode( random_bytes( 32 ) );
    set_transient( 'sf_pk_req_' . $id, $challenge, 120 );
    return rest_ensure_response( [ 'requestId' => $id,
        'publicKey' => [ 'challenge' => $challenge, 'rpId' => codela_sf_pk_host(), 'timeout' => 90000,
            'userVerification' => 'required', 'allowCredentials' => [] ],
    ] );
}
function codela_sf_pk_assert( WP_REST_Request $request ) {
    if ( ! codela_sf_pk_origin() || ! codela_sf_quick_ip_limit() ) { return codela_sf_pk_error( 429 ); }
    codela_sf_quick_ip_limit( true );
    $body = $request->get_json_params();
    $request_id = is_string( $body['requestId'] ?? null ) ? $body['requestId'] : '';
    if ( ! preg_match( '/^[a-f0-9]{32}$/D', $request_id ) ) { return codela_sf_pk_error(); }
    $transient = 'sf_pk_req_' . $request_id;
    $challenge = get_transient( $transient );
    delete_transient( $transient ); // Reject replay before cryptographic verification.
    $id = is_string( $body['id'] ?? null ) ? $body['id'] : '';
    $response = is_array( $body['response'] ?? null ) ? $body['response'] : [];
    $decoded = codela_sf_pk_decode( $id, 1024 );
    $client = is_string( $challenge )
        ? codela_sf_pk_client_data( $response['clientDataJSON'] ?? null, 'webauthn.get', $challenge ) : false;
    $auth = codela_sf_pk_auth_data( $response['authenticatorData'] ?? null );
    $signature = codela_sf_pk_decode( $response['signature'] ?? null, 1024 );
    if ( ! $decoded || ! hash_equals( $id, codela_sf_pk_encode( $decoded ) ) || ! $client || ! $auth || ! $signature ) {
        return codela_sf_pk_error();
    }
    $user_id = absint( get_option( codela_sf_pk_option( $id ), 0 ) );
    $user = $user_id ? get_user_by( 'id', $user_id ) : null;
    $credentials = $user_id ? codela_sf_pk_credentials( $user_id ) : [];
    $record = $credentials[ $id ] ?? null;
    if ( ! codela_sf_pk_enabled( $user ) || ! is_array( $record ) || ! empty( $record['paused'] ) ) {
        return codela_sf_pk_error();
    }
    $handle = get_user_meta( $user_id, '_codela_sf_pk_handle', true );
    if ( ! empty( $response['userHandle'] ) && ! hash_equals( (string) $handle, (string) $response['userHandle'] ) ) {
        return codela_sf_pk_error();
    }
    $signed = $auth[0] . hash( 'sha256', $client, true );
    if ( 1 !== openssl_verify( $signed, $signature, (string) $record['pem'], OPENSSL_ALGO_SHA256 ) ) {
        return codela_sf_pk_error();
    }
    $previous = (int) ( $record['sign_count'] ?? 0 );
    if ( $previous > 0 && $auth[1] > 0 && $auth[1] <= $previous ) { return codela_sf_pk_error(); }
    $credentials[ $id ]['sign_count'] = $auth[1];
    $credentials[ $id ]['last_used'] = time();
    update_user_meta( $user_id, '_codela_sf_passkeys', $credentials );
    wp_set_current_user( $user_id );
    wp_set_auth_cookie( $user_id, true, is_ssl() );
    do_action( 'wp_login', $user->user_login, $user );
    return rest_ensure_response( [ 'ok' => true, 'account_url' => wc_get_page_permalink( 'myaccount' ) ] );
}
function codela_sf_pk_manage( WP_REST_Request $request ) {
    $user = wp_get_current_user();
    if ( ! codela_sf_pk_enabled( $user ) ) { return codela_sf_pk_error( 403 ); }
    $id = is_string( $request['id'] ) ? $request['id'] : '';
    $action = is_string( $request['action'] ) ? $request['action'] : '';
    $credentials = codela_sf_pk_credentials( $user->ID );
    if ( ! isset( $credentials[ $id ] ) || ! in_array( $action, [ 'pause', 'resume', 'revoke' ], true ) ) {
        return codela_sf_pk_error();
    }
    if ( 'revoke' === $action ) {
        unset( $credentials[ $id ] );
        delete_option( codela_sf_pk_option( $id ) );
    } else { $credentials[ $id ]['paused'] = 'pause' === $action; }
    update_user_meta( $user->ID, '_codela_sf_passkeys', $credentials );
    return rest_ensure_response( [ 'ok' => true ] );
}
function codela_sf_pk_revoke_all( int $user_id ): void {
    foreach ( codela_sf_pk_credentials( $user_id ) as $id => $record ) { delete_option( codela_sf_pk_option( (string) $id ) ); }
    delete_user_meta( $user_id, '_codela_sf_passkeys' );
}
add_action( 'after_password_reset', static function( $user ): void {
    if ( $user instanceof WP_User ) { codela_sf_pk_revoke_all( $user->ID ); }
} );
add_action( 'wp_set_password', static function( $password, $user_id ): void { codela_sf_pk_revoke_all( (int) $user_id ); }, 10, 2 );
add_action( 'profile_update', static function( $user_id, $old_user ): void {
    if ( ! $old_user instanceof WP_User ) { return; }
    $new = get_userdata( (int) $user_id );
    if ( $new instanceof WP_User && is_string( $old_user->user_pass )
        && ! hash_equals( $old_user->user_pass, (string) $new->user_pass ) ) {
        codela_sf_pk_revoke_all( (int) $user_id );
    }
}, 10, 2 );
add_action( 'rest_api_init', static function(): void {
    $routes = [
        '/register-options' => [ 'codela_sf_pk_registration_options', true ],
        '/register' => [ 'codela_sf_pk_register', true ],
        '/assert-options' => [ 'codela_sf_pk_assertion_options', false ],
        '/assert' => [ 'codela_sf_pk_assert', false ],
        '/manage' => [ 'codela_sf_pk_manage', true ],
    ];
    foreach ( $routes as $path => [ $callback, $auth ] ) {
        register_rest_route( 'codela-storefront/v1', '/passkey' . $path, [
            'methods' => 'POST', 'callback' => $callback,
            'permission_callback' => $auth ? 'is_user_logged_in' : '__return_true',
        ] );
    }
} );

/** WooCommerce account sidebar contains a single Security destination. */
add_action( 'init', static function(): void { add_rewrite_endpoint( 'guvenlik', EP_ROOT | EP_PAGES ); }, 9 );
add_filter( 'woocommerce_get_query_vars', static function( array $vars ): array {
    $vars['guvenlik'] = 'guvenlik';
    return $vars;
} );
add_filter( 'woocommerce_account_menu_items', static function( array $items ): array {
    if ( ! is_user_logged_in() ) { return $items; }
    $out = [];
    foreach ( $items as $key => $label ) {
        if ( 'edit-account' === $key ) { $out['guvenlik'] = __( 'Security and sign-in', 'codela-storefront' ); }
        $out[$key] = $label;
    }
    return $out;
}, 30 );
add_action( 'init', static function(): void {
    if ( '1' !== get_option( 'codela_sf_security_endpoint_v1', '' ) ) {
        flush_rewrite_rules( false );
        update_option( 'codela_sf_security_endpoint_v1', '1', false );
    }
}, 30 );
add_action( 'woocommerce_account_guvenlik_endpoint', static function(): void {
    $user = wp_get_current_user();
    if ( ! codela_sf_pk_enabled( $user ) ) {
        echo '<p>' . esc_html__( 'Quick sign-in is available only for customer accounts on HTTPS.', 'codela-storefront' ) . '</p>';
        return;
    }
    $records = codela_sf_pk_credentials( $user->ID );
    echo '<section class="sf-pk-settings" data-pk-settings>';
    echo '<h2>' . esc_html__( 'Security and sign-in', 'codela-storefront' ) . '</h2>';
    echo '<p class="sf-pk-help">' . esc_html__( 'Sign in with your device verification. Your password and Google sign-in remain available.', 'codela-storefront' ) . '</p>';
    echo '<div class="sf-pk-section"><div class="sf-pk-section-title"><span class="sf-pk-glyph" aria-hidden="true">◎</span><span><strong>' . esc_html__( 'Sign in with your device', 'codela-storefront' ) . '</strong><small>' . esc_html__( 'Face ID, fingerprint or screen lock', 'codela-storefront' ) . '</small></span></div>';
    echo '<button type="button" class="sf-pk-enroll sf-pk-primary">' . esc_html__( 'Enable fast sign-in', 'codela-storefront' ) . '</button>';
    if ( $records ) {
        echo '<div class="sf-pk-records"><h3>' . esc_html__( 'Saved passkeys', 'codela-storefront' ) . '</h3>';
        foreach ( $records as $id => $record ) {
            $paused = ! empty( $record['paused'] );
            echo '<div class="sf-pk-record" data-credential-id="' . esc_attr( (string) $id ) . '"><span class="sf-pk-record-caption"><strong>' . esc_html__( 'Passkey', 'codela-storefront' ) . '</strong><small>' . esc_html( $paused ? __( 'Paused', 'codela-storefront' ) : __( 'Enabled', 'codela-storefront' ) ) . '</small></span><button type="button" class="sf-pk-toggle">' . esc_html( $paused ? __( 'Resume', 'codela-storefront' ) : __( 'Pause', 'codela-storefront' ) ) . '</button><button type="button" class="sf-pk-revoke">' . esc_html__( 'Remove', 'codela-storefront' ) . '</button></div>';
        }
        echo '</div>';
    }
    echo '<p class="sf-pk-result" role="status" aria-live="polite"></p></div>';
    echo '<div class="sf-pk-legacy"><button type="button" class="sf-pk-legacy-toggle" aria-expanded="false">' . esc_html__( '6-digit PIN (optional legacy sign-in)', 'codela-storefront' ) . ' <span aria-hidden="true">⌄</span></button><div class="sf-pk-legacy-content" hidden>';
    codela_sf_quick_settings();
    echo '</div></div></section>';
}, 20 );

/** Guest passkey choice is independent of the old PIN card. */
function codela_sf_pk_guest_markup(): void {
    if ( is_user_logged_in() || ( empty( $GLOBALS['codela_sf_auth_overlay'] ) && ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) ) ) { return; }
    echo '<section class="sf-pk-guest" hidden aria-label="' . esc_attr__( 'Passkey sign-in', 'codela-storefront' ) . '"><header class="sf-pk-hello"><h2>' . esc_html__( 'Welcome', 'codela-storefront' ) . ' 👋</h2><p>' . esc_html__( 'Sign in securely with your account.', 'codela-storefront' ) . '</p></header><button class="sf-pk-choice" type="button"><span class="sf-pk-avatar" aria-hidden="true">◎</span><span class="sf-pk-identity"><strong class="sf-pk-name">' . esc_html__( 'Sign in with passkey', 'codela-storefront' ) . '</strong><small class="sf-pk-detail">' . esc_html__( 'Use your phone or device', 'codela-storefront' ) . '</small></span><span class="sf-pk-symbol" aria-hidden="true">◎</span></button><p class="sf-pk-divider">' . esc_html__( 'or', 'codela-storefront' ) . '</p><button class="sf-pk-use-email" type="button">' . esc_html__( 'Sign in with email or Google', 'codela-storefront' ) . '</button></section>';
}
add_action( 'woocommerce_before_customer_login_form', 'codela_sf_pk_guest_markup', 4 );

add_action( 'wp_enqueue_scripts', static function(): void {
    if ( is_user_logged_in() && ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) ) { return; }
    $url = get_template_directory_uri() . '/assets/';
    wp_enqueue_script( 'codela-storefront-passkeys', $url . 'scripts/passkeys.js', [ 'codela-storefront-quick-login' ], codela_sf_script_module_version( 'scripts/passkeys.js' ), true );
    wp_localize_script( 'codela-storefront-passkeys', 'CodelaSFPasskey', [
        'rest' => esc_url_raw( rest_url( 'codela-storefront/v1/passkey' ) ),
        'nonce' => is_user_logged_in() ? wp_create_nonce( 'wp_rest' ) : '',
        'account' => wc_get_page_permalink( 'myaccount' ),
        'identity' => is_user_logged_in() ? [
            'userId' => get_current_user_id(), 'displayName' => codela_sf_quick_display_name( wp_get_current_user() ),
            'email' => wp_get_current_user()->user_email,
        ] : null,
    ] );
}, 26 );
