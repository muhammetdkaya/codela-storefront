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
        return codela_sf_quick_failure( __( 'Check the six-digit code and this browser's security.', 'codela-storefront' ), 400 );
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

/** Guest PIN screen: unhidden only if an actual browser key is found. */
function codela_sf_quick_guest_markup(): void {
    if ( is_user_logged_in() || ( ! empty( $GLOBALS['codela_sf_auth_overlay'] )
        ? false : ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) ) ) { return; }
    ?>
    <section class="sf-quick-login" hidden aria-label="<?php esc_attr_e( 'Quick sign in', 'codela-storefront' ); ?>">
        <div class="sf-quick-avatar" aria-hidden="true"><?php echo codela_sf_icon( 'user-round' ); ?></div>
        <h2><?php esc_html_e( 'Welcome back', 'codela-storefront' ); ?></h2>
        <p class="sf-quick-user" aria-live="polite"></p>
        <p class="sf-quick-description"><?php esc_html_e( 'Enter your 6-digit quick sign-in code', 'codela-storefront' ); ?></p>
        <div class="sf-quick-dots" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <div class="sf-quick-pad" role="group" aria-label="<?php esc_attr_e( 'Number pad', 'codela-storefront' ); ?>">
            <?php foreach ( [ 1,2,3,4,5,6,7,8,9,'',0,'erase' ] as $digit ) : ?>
                <?php if ( '' === $digit ) : ?><span aria-hidden="true"></span>
                <?php else : ?>
                <button type="button" class="sf-quick-digit sf-ui-pressable" data-quick-digit="<?php echo esc_attr( (string) $digit ); ?>"
                    aria-label="<?php echo esc_attr( 'erase' === $digit ? __( 'Delete digit', 'codela-storefront' ) : (string) $digit ); ?>">
                    <?php echo 'erase' === $digit ? '&#9003;' : esc_html( (string) $digit ); ?>
                </button>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
        <p class="sf-quick-status" role="status" aria-live="polite"></p>
        <button type="button" class="sf-quick-password sf-ui-button sf-ui-button--secondary"><?php esc_html_e( 'Sign in with password or Google', 'codela-storefront' ); ?></button>
        <button type="button" class="sf-quick-forget"><?php esc_html_e( 'Forget this device', 'codela-storefront' ); ?></button>
    </section>
    <?php
}
add_action( 'woocommerce_before_customer_login_form', 'codela_sf_quick_guest_markup', 4 );

/** Enrollment appears within WooCommerce account management, not registration pre-verification. */
function codela_sf_quick_settings(): void {
    $user = wp_get_current_user();
    if ( ! codela_sf_quick_customer( $user ) ) { return; }
    $devices = codela_sf_quick_devices( $user->ID );
    ?>
    <section class="sf-quick-settings" id="sf-quick-settings" data-user-id="<?php echo esc_attr( (string) $user->ID ); ?>"
        data-username="<?php echo esc_attr( (string) $user->display_name ); ?>">
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

/** After WooCommerce registration/sign-in, suggest setup; never demand a PIN. */
add_action( 'woocommerce_account_dashboard', static function(): void {
    $user = wp_get_current_user();
    if ( ! codela_sf_quick_customer( $user ) || ! function_exists( 'wc_get_account_endpoint_url' ) ) { return; }
    $devices = codela_sf_quick_devices( $user->ID );
    if ( $devices ) { return; }
    $url = wc_get_account_endpoint_url( 'edit-account' ) . '#sf-quick-settings';
    echo '<div class="sf-quick-onboarding"><h3>' . esc_html__( 'Quick sign in', 'codela-storefront' ) . '</h3>'
        . '<p>' . esc_html__( 'Set a 6-digit code to sign in faster on this browser next time.', 'codela-storefront' ) . '</p>'
        . '<a class="sf-ui-button" href="' . esc_url( $url ) . '">' . esc_html__( 'Enable quick sign in', 'codela-storefront' ) . '</a></div>';
}, 20 );


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
