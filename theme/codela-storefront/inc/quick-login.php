<?php
/**
 * Codela quick sign-in: opt-in six-digit PIN paired with a browser-held ECDSA key.
 *
 * Authentication lives ONLY in this theme. WooCommerce remains the account,
 * password-reset and session authority. No PIN or private key is saved in the
 * browser's localStorage, no alternate WordPress user type is created.
 *
 * This is NOT WebAuthn / a platform passkey. The trusted-browser key is held
 * by IndexedDB/WebCrypto and the six-digit PIN is verified on the server.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_quick_customer( $user ): bool {
    if ( ! $user instanceof WP_User || ! is_ssl() ) { return false; }
    $roles = (array) $user->roles;
    return $roles && ! array_diff( $roles, [ 'customer', 'subscriber' ] )
        && ! user_can( $user, 'edit_posts' ) && ! user_can( $user, 'manage_woocommerce' );
}

/**
 * The six-digit space is small. Include WordPress server secret before the
 * slow password hash, so a stolen database alone cannot offline-bruteforce it.
 */
function codela_sf_quick_pin_secret( string $pin ): string {
    return hash_hmac( 'sha256', $pin, wp_salt( 'auth' ) );
}

function codela_sf_quick_devices( int $user_id ): array {
    $stored = get_user_meta( $user_id, '_codela_sf_quick_devices', true );
    return is_array( $stored ) ? $stored : [];
}

function codela_sf_quick_public_key( string $encoded ) {
    if ( ! function_exists( 'openssl_pkey_get_public' ) || ! defined( 'OPENSSL_KEYTYPE_EC' ) ) { return false; }
    if ( strlen( $encoded ) > 256 || ! preg_match( '/^[A-Za-z0-9+\/]+={0,2}$/D', $encoded ) ) { return false; }
    $der = base64_decode( $encoded, true );
    if ( ! is_string( $der ) || strlen( $der ) < 70 || strlen( $der ) > 140 ) { return false; }
    $pem = "-----BEGIN PUBLIC KEY-----\n" . chunk_split( base64_encode( $der ), 64, "\n" ) . "-----END PUBLIC KEY-----\n";
    $key = openssl_pkey_get_public( $pem );
    if ( ! $key ) { return false; }
    $details = openssl_pkey_get_details( $key );
    return is_array( $details ) && OPENSSL_KEYTYPE_EC === $details['type']
        && 'prime256v1' === ( $details['ec']['curve_name'] ?? '' ) ? $key : false;
}

function codela_sf_quick_signature_valid( string $key_b64, string $message, string $signature_b64 ): bool {
    if ( strlen( $signature_b64 ) > 256 ) { return false; }
    $signature = base64_decode( $signature_b64, true );
    $key = codela_sf_quick_public_key( $key_b64 );
    return $key && is_string( $signature ) && strlen( $signature ) >= 68 && strlen( $signature ) <= 80
        && 1 === openssl_verify( $message, $signature, $key, OPENSSL_ALGO_SHA256 );
}

function codela_sf_quick_input( WP_REST_Request $request, string $key, int $max = 512 ): string {
    $value = $request->get_param( $key );
    return is_string( $value ) && strlen( $value ) <= $max ? $value : '';
}

function codela_sf_quick_failure( string $message = '', int $status = 401 ): WP_Error {
    return new WP_Error( 'codela_quick_login_failed', $message ?: __( 'Quick sign-in could not be verified.', 'codela-storefront' ), [ 'status' => $status ] );
}

function codela_sf_quick_device_id( string $id ): bool {
    return (bool) preg_match( '/^[0-9a-f]{32}$/D', $id );
}

function codela_sf_quick_request_limit( string $name, int $max, bool $record = false ): bool {
    $key = 'sf_quick_' . hash( 'sha256', $name );
    $count = (int) get_transient( $key );
    if ( $record ) { set_transient( $key, $count + 1, 15 * MINUTE_IN_SECONDS ); }
    return $count < $max;
}

function codela_sf_quick_ip_limit( bool $record = false ): bool {
    $ip = isset( $_SERVER['REMOTE_ADDR'] ) && is_string( $_SERVER['REMOTE_ADDR'] )
        ? $_SERVER['REMOTE_ADDR'] : '';
    return codela_sf_quick_request_limit( 'ip:' . $ip, 30, $record );
}

function codela_sf_quick_enroll( WP_REST_Request $request ) {
    $user = wp_get_current_user();
    if ( ! codela_sf_quick_customer( $user ) ) { return codela_sf_quick_failure( __( 'Quick sign-in is not available for this account.', 'codela-storefront' ), 403 ); }
    $device = codela_sf_quick_input( $request, 'device_id', 64 );
    $public = codela_sf_quick_input( $request, 'public_key', 256 );
    $signature = codela_sf_quick_input( $request, 'signature', 256 );
    $pin = codela_sf_quick_input( $request, 'pin', 12 );
    if ( ! codela_sf_quick_device_id( $device ) || ! preg_match( '/^[0-9]{6}$/D', $pin )
        || ! codela_sf_quick_signature_valid( $public, 'codela-pin-enroll:v1:' . $device, $signature ) ) {
        return codela_sf_quick_failure( __( 'Check the six-digit code and browser security.', 'codela-storefront' ), 400 );
    }
    if ( preg_match( '/^(\d)\1{5}$/D', $pin ) || in_array( $pin, [ '123456', '654321', '012345', '111222' ], true ) ) {
        return codela_sf_quick_failure( __( 'Choose a stronger six-digit code.', 'codela-storefront' ), 400 );
    }
    $devices = codela_sf_quick_devices( $user->ID );
    if ( ! isset( $devices[ $device ] ) && count( $devices ) >= 5 ) {
        return codela_sf_quick_failure( __( 'You can add up to five browsers. Remove an old browser first.', 'codela-storefront' ), 400 );
    }
    $now = time();
    $devices[ $device ] = [
        'public_key' => $public,
        'pin_hash' => wp_hash_password( codela_sf_quick_pin_secret( $pin ) ),
        'created' => $now,
        'expires' => $now + 180 * DAY_IN_SECONDS,
        'last_used' => 0,
    ];
    update_user_meta( $user->ID, '_codela_sf_quick_devices', $devices );
    return rest_ensure_response( [ 'ok' => true ] );
}

function codela_sf_quick_challenge( WP_REST_Request $request ) {
    $user_id = absint( $request->get_param( 'user_id' ) );
    $device = codela_sf_quick_input( $request, 'device_id', 64 );
    if ( ! codela_sf_quick_device_id( $device ) || ! $user_id
        || ! codela_sf_quick_ip_limit() || ! codela_sf_quick_request_limit( 'challenge:' . $device, 30 ) ) {
        return codela_sf_quick_failure( __( 'Please try again later.', 'codela-storefront' ), 429 );
    }
    codela_sf_quick_ip_limit( true );
    codela_sf_quick_request_limit( 'challenge:' . $device, 30, true );
    $user = get_user_by( 'id', $user_id );
    $data = $user ? ( codela_sf_quick_devices( $user_id )[ $device ] ?? null ) : null;
    // Never reveal whether this device or account exists.
    $challenge = bin2hex( random_bytes( 32 ) );
    $key = 'sf_quick_ch_' . hash( 'sha256', $user_id . ':' . $device );
    if ( $user && codela_sf_quick_customer( $user ) && is_array( $data ) && ( $data['expires'] ?? 0 ) > time() ) {
        set_transient( $key, hash( 'sha256', $challenge ), 90 );
    } else {
        delete_transient( $key );
    }
    return rest_ensure_response( [ 'challenge' => $challenge ] );
}

function codela_sf_quick_verify( WP_REST_Request $request ) {
    $user_id = absint( $request->get_param( 'user_id' ) );
    $device = codela_sf_quick_input( $request, 'device_id', 64 );
    $challenge = codela_sf_quick_input( $request, 'challenge', 70 );
    $signature = codela_sf_quick_input( $request, 'signature', 256 );
    $pin = codela_sf_quick_input( $request, 'pin', 12 );
    if ( ! codela_sf_quick_device_id( $device ) || ! preg_match( '/^[0-9a-f]{64}$/D', $challenge )
        || ! preg_match( '/^[0-9]{6}$/D', $pin ) || ! $user_id ) {
        return codela_sf_quick_failure();
    }
    $limit = 'verify:' . $user_id . ':' . $device;
    if ( ! codela_sf_quick_request_limit( $limit, 5 ) || ! codela_sf_quick_ip_limit() ) {
        return codela_sf_quick_failure( __( 'Too many attempts. Sign in with your password or try again in 15 minutes.', 'codela-storefront' ), 429 );
    }
    $key = 'sf_quick_ch_' . hash( 'sha256', $user_id . ':' . $device );
    $stored_challenge = get_transient( $key );
    delete_transient( $key ); // A challenge is usable only once.
    $user = get_user_by( 'id', $user_id );
    $devices = $user ? codela_sf_quick_devices( $user_id ) : [];
    $data = $devices[ $device ] ?? null;
    $valid = is_string( $stored_challenge )
        && hash_equals( $stored_challenge, hash( 'sha256', $challenge ) )
        && $user && codela_sf_quick_customer( $user ) && is_array( $data )
        && ( $data['expires'] ?? 0 ) > time()
        && codela_sf_quick_signature_valid( (string) $data['public_key'],
            'codela-pin-login:v1:' . $user_id . ':' . $device . ':' . $challenge, $signature )
        && wp_check_password( codela_sf_quick_pin_secret( $pin ), (string) $data['pin_hash'], $user_id );
    if ( ! $valid ) {
        codela_sf_quick_request_limit( $limit, 5, true );
        codela_sf_quick_ip_limit( true );
        return codela_sf_quick_failure();
    }
    delete_transient( 'sf_quick_' . hash( 'sha256', $limit ) );
    $devices[ $device ]['last_used'] = time();
    update_user_meta( $user_id, '_codela_sf_quick_devices', $devices );
    wp_set_current_user( $user_id );
    wp_set_auth_cookie( $user_id, true, is_ssl() );
    do_action( 'wp_login', $user->user_login, $user );
    return rest_ensure_response( [
        'ok' => true, 'account_url' => wc_get_page_permalink( 'myaccount' ),
    ] );
}

function codela_sf_quick_revoke( WP_REST_Request $request ) {
    $user = wp_get_current_user();
    if ( ! codela_sf_quick_customer( $user ) ) { return codela_sf_quick_failure( __( 'Permission denied.', 'codela-storefront' ), 403 ); }
    $device = codela_sf_quick_input( $request, 'device_id', 64 );
    if ( ! codela_sf_quick_device_id( $device ) ) { return codela_sf_quick_failure( __( 'Invalid browser.', 'codela-storefront' ), 400 ); }
    $devices = codela_sf_quick_devices( $user->ID );
    unset( $devices[ $device ] );
    update_user_meta( $user->ID, '_codela_sf_quick_devices', $devices );
    return rest_ensure_response( [ 'ok' => true ] );
}

/**
 * Public, read-only browser credential status. Admin AJAX intentionally checks
 * the actual WordPress cookie even when stale guest markup lacks a REST nonce.
 * This endpoint never issues authentication, and proof replay grants no session.
 */
function codela_sf_quick_status_active( int $user_id, string $device, string $challenge, string $signature ): bool {
    if ( ! $user_id || ! codela_sf_quick_device_id( $device )
        || ! preg_match( '/^[0-9a-f]{64}$/D', $challenge ) ) { return false; }
    $user = get_user_by( 'id', $user_id );
    if ( ! $user || ! codela_sf_quick_customer( $user ) ) { return false; }
    $credential = codela_sf_quick_devices( $user_id )[ $device ] ?? null;
    return is_array( $credential ) && ( $credential['expires'] ?? 0 ) > time()
        && isset( $credential['public_key'] )
        && codela_sf_quick_signature_valid(
            (string) $credential['public_key'],
            'codela-pin-status:v1:' . $user_id . ':' . $device . ':' . $challenge,
            $signature
        );
}

function codela_sf_quick_browser_status(): void {
    // This read-only check must never be cached across account transitions.
    nocache_headers();
    $ip = isset( $_SERVER['REMOTE_ADDR'] ) && is_string( $_SERVER['REMOTE_ADDR'] )
        ? $_SERVER['REMOTE_ADDR'] : '';
    if ( ! codela_sf_quick_request_limit( 'status-ip:' . $ip, 90 ) ) {
        wp_send_json( [ 'error' => 'rate_limited' ], 429 );
    }
    codela_sf_quick_request_limit( 'status-ip:' . $ip, 90, true );
    $user_id = isset( $_POST['user_id'] ) ? absint( wp_unslash( $_POST['user_id'] ) ) : 0;
    $device = isset( $_POST['device_id'] ) && is_string( $_POST['device_id'] )
        ? wp_unslash( $_POST['device_id'] ) : '';
    $challenge = isset( $_POST['challenge'] ) && is_string( $_POST['challenge'] )
        ? wp_unslash( $_POST['challenge'] ) : '';
    $signature = isset( $_POST['signature'] ) && is_string( $_POST['signature'] )
        ? wp_unslash( $_POST['signature'] ) : '';
    wp_send_json( [
        'authenticated' => is_user_logged_in(),
        'active' => codela_sf_quick_status_active( $user_id, $device, $challenge, $signature ),
    ] );
}
add_action( 'wp_ajax_codela_sf_quick_status', 'codela_sf_quick_browser_status' );
add_action( 'wp_ajax_nopriv_codela_sf_quick_status', 'codela_sf_quick_browser_status' );

add_action( 'rest_api_init', static function(): void {
    $routes = [
        'enroll' => [ 'callback' => 'codela_sf_quick_enroll', 'permission_callback' => 'is_user_logged_in' ],
        'challenge' => [ 'callback' => 'codela_sf_quick_challenge', 'permission_callback' => '__return_true' ],
        'verify' => [ 'callback' => 'codela_sf_quick_verify', 'permission_callback' => '__return_true' ],
        'revoke' => [ 'callback' => 'codela_sf_quick_revoke', 'permission_callback' => 'is_user_logged_in' ],
    ];
    foreach ( $routes as $path => $route ) {
        register_rest_route( 'codela-storefront/v1', '/quick-login/' . $path, [
            'methods' => 'POST',
            'callback' => $route['callback'],
            'permission_callback' => $route['permission_callback'],
        ] );
    }
} );

// Password recovery invalidates trusted browsers automatically.
add_action( 'after_password_reset', static function( $user ): void {
    if ( $user instanceof WP_User ) { delete_user_meta( $user->ID, '_codela_sf_quick_devices' ); }
} );
add_action( 'wp_set_password', static function( $password, $user_id ): void {
    delete_user_meta( (int) $user_id, '_codela_sf_quick_devices' );
}, 10, 2 );

// WooCommerce password changes often go through wp_update_user(), not
// wp_set_password(). Only revoke when the actual password hash changes.
add_action( 'profile_update', static function( $user_id, $old_user ): void {
    if ( ! $old_user instanceof WP_User ) { return; }
    $current = get_userdata( (int) $user_id );
    if ( $current instanceof WP_User && is_string( $old_user->user_pass )
        && is_string( $current->user_pass )
        && ! hash_equals( $old_user->user_pass, $current->user_pass ) ) {
        delete_user_meta( (int) $user_id, '_codela_sf_quick_devices' );
    }
}, 10, 2 );


/**
 * Use a fresh public URL only after Woo login/logout has genuinely succeeded.
 * The session remains authoritative; these URLs contain NO credential.
 * Do not override merchant redirect rules for checkout or other destinations.
 */
function codela_sf_quick_fresh_account_redirect( $redirect ) {
    if ( ! is_string( $redirect ) || ! function_exists( 'wc_get_page_permalink' ) ) { return $redirect; }
    $account = (string) wc_get_page_permalink( 'myaccount' );
    if ( '' === $account || untrailingslashit( $redirect ) !== untrailingslashit( $account ) ) { return $redirect; }
    return add_query_arg( 'sf_quick_auth', bin2hex( random_bytes( 8 ) ), $account );
}
add_filter( 'woocommerce_login_redirect', 'codela_sf_quick_fresh_account_redirect', 20 );
add_filter( 'woocommerce_logout_default_redirect_url', 'codela_sf_quick_fresh_account_redirect', 20 );

/** The WooCommerce account is session-specific, before and after logout. */
add_action( 'template_redirect', static function(): void {
    if ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) { return; }
    if ( ! defined( 'DONOTCACHEPAGE' ) ) { define( 'DONOTCACHEPAGE', true ); }
    nocache_headers();
}, 0 );

/**
 * One-time post-PIN navigation must never reuse a cached anonymous account
 * page. A unique query is used only for this redirect; no auth token travels
 * in the URL. The WordPress login cookie remains the sole session authority.
 */
add_action( 'template_redirect', static function(): void {
    if ( ! function_exists( 'is_account_page' ) || ! is_account_page()
        || ! isset( $_GET['sf_quick_auth'] ) ) { return; }
    if ( ! defined( 'DONOTCACHEPAGE' ) ) { define( 'DONOTCACHEPAGE', true ); }
    nocache_headers();
}, 0 );

/** Guest PIN screen: unhidden only if an actual browser key is found. */
function codela_sf_quick_guest_markup(): void {
    if ( is_user_logged_in() || ( ! empty( $GLOBALS['codela_sf_auth_overlay'] )
        ? false : ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) ) ) { return; }
    ?>
    <section class="sf-quick-login" hidden aria-label="<?php esc_attr_e( 'Quick sign-in', 'codela-storefront' ); ?>">
        <div class="sf-quick-choice">
            <div class="sf-quick-choice-intro">
                <h2><?php esc_html_e( 'Welcome', 'codela-storefront' ); ?> <span class="sf-quick-wave" aria-hidden="true">👋</span></h2>
                <p><?php esc_html_e( 'Continue quickly with your account.', 'codela-storefront' ); ?></p>
            </div>
            <button type="button" class="sf-quick-account sf-ui-pressable" aria-haspopup="dialog" aria-controls="sf-quick-sheet">
                <span class="sf-quick-monogram" aria-hidden="true"></span>
                <span class="sf-quick-account-text"><strong class="sf-quick-user"></strong><small class="sf-quick-email" hidden></small></span>
                <span class="sf-quick-chevron" aria-hidden="true"><?php echo codela_sf_icon( 'arrow-right' ); ?></span>
            </button>
            <div class="sf-quick-choice-alternatives">
                <div class="sf-quick-or"><span><?php esc_html_e( 'or', 'codela-storefront' ); ?></span></div>
                <?php $google_available = function_exists( 'codela_sf_google_enabled' ) && codela_sf_google_enabled(); ?>
                <?php if ( $google_available ) : ?>
                    <a class="sf-quick-google" href="<?php echo esc_url( codela_sf_google_auth_url() ); ?>">
                <?php else : ?>
                    <button type="button" class="sf-quick-google" disabled aria-label="<?php esc_attr_e( 'Google sign-in is currently unavailable', 'codela-storefront' ); ?>">
                <?php endif; ?>
                        <span class="sf-quick-action-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                                <path fill="#4285F4" d="M21.8 12.2c0-.7-.06-1.4-.18-2.08H12v3.94h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.04-4.39 3.04-7.5z"/>
                                <path fill="#34A853" d="M12 22c2.75 0 5.07-.91 6.76-2.46l-3.3-2.56c-.92.62-2.1.98-3.46.98-2.66 0-4.91-1.8-5.72-4.22H2.87v2.64A10 10 0 0 0 12 22z"/>
                                <path fill="#FBBC05" d="M6.28 13.74a6 6 0 0 1 0-3.48V7.62H2.87a10 10 0 0 0 0 8.76l3.41-2.64z"/>
                                <path fill="#EA4335" d="M12 6.04c1.5 0 2.84.52 3.9 1.54l2.93-2.93A9.95 9.95 0 0 0 12 2a10 10 0 0 0-9.13 5.62l3.41 2.64C7.09 7.84 9.34 6.04 12 6.04z"/>
                            </svg>
                        </span>
                        <span class="sf-quick-action-divider" aria-hidden="true"></span>
                        <span class="sf-quick-action-label"><?php esc_html_e( 'Continue with Google', 'codela-storefront' ); ?></span>
                    <?php if ( $google_available ) : ?></a><?php else : ?></button><?php endif; ?>
                <button type="button" class="sf-quick-switch sf-quick-email-login">
                    <span class="sf-quick-action-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>
                        </svg>
                    </span>
                    <span class="sf-quick-action-divider" aria-hidden="true"></span>
                    <span class="sf-quick-action-label"><?php esc_html_e( 'Sign in with email and password', 'codela-storefront' ); ?></span>
                </button>
            </div>
            <?php if ( 'yes' === get_option( 'woocommerce_enable_myaccount_registration', 'no' ) ) : ?>
            <div class="sf-quick-register-line">
                <span><?php esc_html_e( 'New here?', 'codela-storefront' ); ?></span>
                <button type="button" class="sf-quick-register"><?php esc_html_e( 'Register', 'codela-storefront' ); ?></button>
            </div>
            <?php endif; ?>
        </div>

        <div class="sf-quick-scrim" hidden></div>
        <section class="sf-quick-sheet" id="sf-quick-sheet" role="dialog" aria-modal="true"
            aria-labelledby="sf-quick-sheet-title" hidden>
            <div class="sf-quick-handle" aria-hidden="true"></div>
            <header class="sf-quick-sheet-head">
                <h2 id="sf-quick-sheet-title"><?php esc_html_e( 'Quick sign-in', 'codela-storefront' ); ?></h2>
                <button type="button" class="sf-quick-close" aria-label="<?php esc_attr_e( 'Close', 'codela-storefront' ); ?>"><span aria-hidden="true">&times;</span></button>
            </header>
            <p class="sf-quick-description"><?php esc_html_e( 'Enter your 6-digit code.', 'codela-storefront' ); ?></p>
            <div class="sf-quick-pin-track">
                <?php for ( $i = 0; $i < 6; $i++ ) : ?>
                    <span class="sf-quick-slot" aria-hidden="true"><i></i></span>
                <?php endfor; ?>
                <span class="sf-quick-result" aria-hidden="true">
                    <span class="sf-quick-spinner"></span>
                    <svg class="sf-quick-check" width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                <input class="sf-quick-native-pin" type="text" inputmode="numeric" pattern="[0-9]*"
                    maxlength="6" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done"
                    aria-label="<?php esc_attr_e( '6-digit quick sign-in code', 'codela-storefront' ); ?>"/>
            </div>
            <p class="sf-quick-status" role="status" aria-live="polite"></p>
            <div class="sf-quick-sheet-links">
                <button type="button" class="sf-quick-password"><?php esc_html_e( 'Sign in with password', 'codela-storefront' ); ?></button>
                <span class="sf-quick-link-divider" aria-hidden="true"></span>
                <a class="sf-quick-lost-password" href="<?php echo esc_url( wc_lostpassword_url() ); ?>"><?php esc_html_e( 'Forgot password?', 'codela-storefront' ); ?></a>
            </div>
        </section>
    </section>
    <?php
}
add_action( 'woocommerce_before_customer_login_form', 'codela_sf_quick_guest_markup', 4 );

/** Public-safe display label is persisted only on the customer's own browser. */
function codela_sf_quick_display_name( WP_User $user ): string {
    $full_name = trim( (string) get_user_meta( $user->ID, 'first_name', true ) . ' ' . (string) get_user_meta( $user->ID, 'last_name', true ) );
    return $full_name ?: ( trim( (string) $user->display_name ) ?: (string) $user->user_login );
}

/** Enrollment appears within WooCommerce account management, not registration pre-verification. */
function codela_sf_quick_settings(): void {
    $user = wp_get_current_user();
    if ( ! codela_sf_quick_customer( $user ) ) {
        // Never silently hide the feature from a signed-in administrator;
        // privileged accounts must continue using their normal WP login.
        if ( $user instanceof WP_User ) {
            echo '<div class="sf-quick-role-notice" id="sf-quick-settings" role="note"><strong>'
                . esc_html__( 'Quick sign-in', 'codela-storefront' ) . '</strong><p>'
                . esc_html__( 'For security, 6-digit quick sign-in is available only to customer accounts on HTTPS. Administrator and staff accounts must use their normal WordPress login.', 'codela-storefront' )
                . '</p></div>';
        }
        return;
    }
    $devices = codela_sf_quick_devices( $user->ID );
    ?>
    <section class="sf-quick-settings" id="sf-quick-settings" data-user-id="<?php echo esc_attr( (string) $user->ID ); ?>"
        data-username="<?php echo esc_attr( (string) $user->user_login ); ?>"
        data-display-name="<?php echo esc_attr( codela_sf_quick_display_name( $user ) ); ?>"
        data-email="<?php echo esc_attr( (string) $user->user_email ); ?>">
        <h3><?php esc_html_e( 'Quick sign in', 'codela-storefront' ); ?></h3>
        <p><?php esc_html_e( 'Enable a 6-digit code for this browser. Your normal WooCommerce password will continue to work.', 'codela-storefront' ); ?></p>
        <div class="sf-quick-enroll">
            <label><?php esc_html_e( 'New 6-digit code', 'codela-storefront' ); ?>
                <input class="sf-quick-create" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" pattern="[0-9]{6}" placeholder="••••••"></label>
            <label><?php esc_html_e( 'Confirm code', 'codela-storefront' ); ?>
                <input class="sf-quick-confirm" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" pattern="[0-9]{6}" placeholder="••••••"></label>
            <button type="button" class="sf-quick-enable sf-ui-button"><?php esc_html_e( 'Enable on this browser', 'codela-storefront' ); ?></button>
        </div>
        <p class="sf-quick-enroll-status" role="status" aria-live="polite"></p>
        <?php if ( $devices ) : ?>
        <div class="sf-quick-devices">
            <h4><?php esc_html_e( 'Trusted browsers', 'codela-storefront' ); ?></h4>
            <?php foreach ( $devices as $id => $data ) : ?>
                <div class="sf-quick-device">
                    <span><?php echo esc_html( sprintf( __( 'Browser added on %s', 'codela-storefront' ), wp_date( get_option( 'date_format' ), (int) ( $data['created'] ?? time() ) ) ) ); ?></span>
                    <button type="button" class="sf-quick-revoke" data-device-id="<?php echo esc_attr( (string) $id ); ?>"><?php esc_html_e( 'Remove', 'codela-storefront' ); ?></button>
                </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </section>
    <?php
}
add_action( 'woocommerce_edit_account_form', 'codela_sf_quick_settings', 20 );

/** Keep the optional quick-login setting discoverable on the Codela account home.
 * WooCommerce and Codela's existing dashboard hooks both reach this action.
 * Administrator and staff accounts retain their normal secure login route.
 */
function codela_sf_quick_dashboard_entry(): void {
    $user = wp_get_current_user();
    if ( ! $user instanceof WP_User || ! function_exists( 'wc_get_account_endpoint_url' ) ) { return; }
    $eligible = codela_sf_quick_customer( $user );
    $devices = $eligible ? codela_sf_quick_devices( $user->ID ) : [];
    echo '<section class="sf-quick-onboarding" aria-labelledby="sf-quick-onboarding-title">'
        . '<h3 id="sf-quick-onboarding-title">' . esc_html__( 'Quick sign-in', 'codela-storefront' ) . '</h3><p>';
    if ( ! $eligible ) {
        echo esc_html__( 'For security, 6-digit quick sign-in is available only to customer accounts on HTTPS. Administrator and staff accounts must use their normal WordPress login.', 'codela-storefront' );
        echo '</p></section>';
        return;
    }
    echo $devices
        ? esc_html__( 'Manage your trusted browsers or set a code for this browser.', 'codela-storefront' )
        : esc_html__( 'Set a 6-digit code to sign in faster on this browser next time.', 'codela-storefront' );
    echo '</p><a class="sf-ui-button" href="'
        . esc_url( wc_get_account_endpoint_url( 'edit-account' ) . '#sf-quick-settings' ) . '">'
        . ( $devices
            ? esc_html__( 'Manage quick sign-in', 'codela-storefront' )
            : esc_html__( 'Enable quick sign in', 'codela-storefront' ) )
        . '</a></section>';
}
add_action( 'woocommerce_account_dashboard', 'codela_sf_quick_dashboard_entry', 20 );


/**
 * Suppress the native Woo form's first paint only when the visitor has a
 * remembered browser hint. Status must still be checked server-side before
 * showing the actual remembered name/card; absent a valid device, the native
 * form is revealed. This short head bootstrap does not authenticate anyone.
 */
add_action( 'wp_head', static function(): void {
    // Prepaint protection also covers the instant Account panel on other
    // storefront pages. Only the visible view is masked; no navigation waits.
    if ( is_user_logged_in() ) { return; }
    echo '<script>(function(){try{var p=JSON.parse(localStorage.getItem("codela_sf_quick_profile_v1")||"null");if(p&&Number.isSafeInteger(p.userId)&&/^[0-9a-f]{32}$/.test(p.deviceId||"")){document.documentElement.classList.add("sf-quick-checking");window.setTimeout(function(){document.documentElement.classList.remove("sf-quick-checking")},7000)}}catch(e){}})();</script>';
}, 1 );

add_action( 'wp_enqueue_scripts', static function(): void {
    // The login overlay can be opened on any storefront page by a guest.
    if ( is_user_logged_in() && ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) ) { return; }
    $uri = get_template_directory_uri() . '/assets/';
    wp_enqueue_style( 'codela-storefront-quick-login', $uri . 'styles/quick-login.css',
        [], codela_sf_style_version() );
    wp_enqueue_script( 'codela-storefront-quick-login', $uri . 'scripts/quick-login.js',
        [], codela_sf_script_module_version( 'scripts/quick-login.js' ), true );
    wp_localize_script( 'codela-storefront-quick-login', 'CodelaQuickLogin', [
        'rest' => esc_url_raw( rest_url( 'codela-storefront/v1/quick-login/' ) ),
        'nonce' => is_user_logged_in() ? wp_create_nonce( 'wp_rest' ) : '',
        'account' => wc_get_page_permalink( 'myaccount' ),
        'statusUrl' => admin_url( 'admin-ajax.php' ),
        'accountPage' => function_exists( 'is_account_page' ) && is_account_page(),
        // Refresh old username-only hints on normal signed-in account visits.
        // The authenticated account may be different from the saved device,
        // including when a different Google identity or staff login is used.
        'identity' => is_user_logged_in() ? [
                'userId' => (int) wp_get_current_user()->ID,
                'displayName' => codela_sf_quick_display_name( wp_get_current_user() ),
                'email' => (string) wp_get_current_user()->user_email,
            ]
            : null,
        'strings' => [
            'account' => __( 'Your account', 'codela-storefront' ),
            'requestFailed' => __( 'Request could not be completed. Try again.', 'codela-storefront' ),
            'waiting' => __( 'Signing in…', 'codela-storefront' ),
            'success' => __( 'Signed in', 'codela-storefront' ),
            'responseInvalid' => __( 'Sign-in response could not be verified.', 'codela-storefront' ),
            'failed' => __( 'Sign-in failed. Try again.', 'codela-storefront' ),
            'pinMismatch' => __( 'Enter and confirm the same six digits.', 'codela-storefront' ),
            'linking' => __( 'Linking this browser securely…', 'codela-storefront' ),
            'enabled' => __( 'Quick sign-in is enabled for this browser.', 'codela-storefront' ),
            'enableFailed' => __( 'Could not enable quick sign-in.', 'codela-storefront' ),
            'revokeFailed' => __( 'Could not remove browser.', 'codela-storefront' ),
        ],
    ] );
    wp_script_add_data( 'codela-storefront-quick-login', 'strategy', 'defer' );
}, 25 );
