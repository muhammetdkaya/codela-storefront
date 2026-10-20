<?php
/**
 * Small, theme-owned Google OAuth 2.0 login adapter.
 *
 * No added WordPress plugin, PHP SDK, refresh-token storage or sitewide JS.
 * Uses a one-time browser-bound state, PKCE and Google's token + UserInfo APIs.
 * WooCommerce retains customer accounts, orders and authenticated My Account.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_google_credentials(): array {
    $id = defined( 'CODELA_SF_GOOGLE_CLIENT_ID' ) ? (string) CODELA_SF_GOOGLE_CLIENT_ID : (string) get_option( 'codela_sf_google_client_id', '' );
    $secret = defined( 'CODELA_SF_GOOGLE_CLIENT_SECRET' ) ? (string) CODELA_SF_GOOGLE_CLIENT_SECRET : (string) get_option( 'codela_sf_google_client_secret', '' );
    return [ trim( $id ), trim( $secret ) ];
}

function codela_sf_google_enabled(): bool {
    [ $id, $secret ] = codela_sf_google_credentials();
    return is_ssl() && str_ends_with( $id, '.apps.googleusercontent.com' ) && '' !== $secret;
}

/** This must be copied exactly into the Google Cloud OAuth web-client settings. */
function codela_sf_google_callback_url(): string {
    return admin_url( 'admin-post.php?action=codela_sf_google_callback', 'https' );
}

function codela_sf_google_auth_url(): string {
    return admin_url( 'admin-post.php?action=codela_sf_google_start', 'https' );
}

function codela_sf_google_cookie( string $state, int $expires ): void {
    setcookie( 'sf_google_oauth', $state, [
        'expires' => $expires, 'path' => '/', 'secure' => true,
        'httponly' => true, 'samesite' => 'Lax',
    ] );
}

/** All errors are deliberately generic: no token or account data in URLs. */
function codela_sf_google_return( bool $error = true ): void {
    $account = wc_get_page_permalink( 'myaccount' );
    $url = $error ? add_query_arg( 'google_login', 'error', $account ) : $account;
    nocache_headers();
    wp_safe_redirect( $url, 303 );
    exit;
}

function codela_sf_google_start(): void {
    if ( is_user_logged_in() ) { codela_sf_google_return( false ); }
    if ( ! codela_sf_google_enabled() ) { codela_sf_google_return(); }
    [ $id ] = codela_sf_google_credentials();

    $state = bin2hex( random_bytes( 32 ) );
    $verifier = rtrim( strtr( base64_encode( random_bytes( 32 ) ), '+/', '-_' ), '=' );
    $challenge = rtrim( strtr( base64_encode( hash( 'sha256', $verifier, true ) ), '+/', '-_' ), '=' );
    set_transient( 'sf_google_' . hash( 'sha256', $state ), $verifier, 10 * MINUTE_IN_SECONDS );
    codela_sf_google_cookie( $state, time() + 600 );

    $url = add_query_arg( [
        'client_id' => $id,
        'redirect_uri' => codela_sf_google_callback_url(),
        'response_type' => 'code',
        'scope' => 'openid email profile',
        'state' => $state,
        'code_challenge' => $challenge,
        'code_challenge_method' => 'S256',
        'prompt' => 'select_account',
    ], 'https://accounts.google.com/o/oauth2/v2/auth' );
    nocache_headers();
    // The only external redirect in this file is this hard-coded Google origin.
    wp_redirect( $url, 302, 'Codela Storefront Google Login' );
    exit;
}
add_action( 'admin_post_nopriv_codela_sf_google_start', 'codela_sf_google_start' );
add_action( 'admin_post_codela_sf_google_start', 'codela_sf_google_start' );

/** Require a trusted, verified provider identity. Never accept email from GET. */
function codela_sf_google_customer( array $identity ) {
    $sub = (string) ( $identity['sub'] ?? '' );
    $email = sanitize_email( (string) ( $identity['email'] ?? '' ) );
    if ( ! preg_match( '/^[A-Za-z0-9_-]{1,255}$/D', $sub )
        || ! is_email( $email ) || true !== ( $identity['email_verified'] ?? false ) ) {
        return new WP_Error( 'invalid_google_identity' );
    }

    // Google's immutable subject is the identity key, never a changeable email.
    $matches = get_users( [
        'meta_key' => '_sf_google_sub', 'meta_value' => $sub,
        'number' => 2, 'fields' => 'all',
    ] );
    if ( count( $matches ) > 1 ) { return new WP_Error( 'duplicate_google_identity' ); }
    if ( $matches ) {
        $user = $matches[0];
    } else {
        $user = get_user_by( 'email', $email );
        if ( $user ) {
            // A verified third-party address is not proof Google still controls
            // that external mailbox. Do not auto-link without Google's authority.
            $domain = strtolower( (string) substr( strrchr( $email, '@' ), 1 ) );
            $hosted = strtolower( (string) ( $identity['hd'] ?? '' ) );
            $authoritative = in_array( $domain, [ 'gmail.com', 'googlemail.com' ], true )
                || ( '' !== $hosted && hash_equals( $domain, $hosted ) );
            if ( ! $authoritative || get_user_meta( $user->ID, '_sf_google_sub', true ) ) {
                return new WP_Error( 'manual_account_link_required' );
            }
        } else {
            $user_id = wc_create_new_customer( $email, '', wp_generate_password( 32, true, true ) );
            if ( is_wp_error( $user_id ) ) { return $user_id; }
            $user = get_user_by( 'id', $user_id );
        }
    }
    if ( ! $user || ! $user instanceof WP_User ) { return new WP_Error( 'invalid_customer' ); }

    // Never turn a social account into a route for admin/staff access.
    $roles = (array) $user->roles;
    if ( array_diff( $roles, [ 'customer', 'subscriber' ] )
        || ! $roles || user_can( $user, 'edit_posts' ) || user_can( $user, 'manage_woocommerce' ) ) {
        return new WP_Error( 'privileged_account' );
    }
    $linked = (string) get_user_meta( $user->ID, '_sf_google_sub', true );
    if ( '' !== $linked && ! hash_equals( $linked, $sub ) ) { return new WP_Error( 'account_link_conflict' ); }
    if ( '' === $linked ) { update_user_meta( $user->ID, '_sf_google_sub', $sub ); }
    return $user;
}

function codela_sf_google_callback(): void {
    if ( ! codela_sf_google_enabled() ) { codela_sf_google_return(); }
    $state = isset( $_GET['state'] ) && is_string( $_GET['state'] ) ? $_GET['state'] : '';
    $cookie = isset( $_COOKIE['sf_google_oauth'] ) && is_string( $_COOKIE['sf_google_oauth'] ) ? $_COOKIE['sf_google_oauth'] : '';
    $code = isset( $_GET['code'] ) && is_string( $_GET['code'] ) ? $_GET['code'] : '';
    if ( ! preg_match( '/^[0-9a-f]{64}$/D', $state )
        || ! hash_equals( $state, $cookie ) || '' === $code || strlen( $code ) > 2048 ) {
        codela_sf_google_return();
    }
    $key = 'sf_google_' . hash( 'sha256', $state );
    $verifier = get_transient( $key );
    delete_transient( $key ); // Each state is single-use, even on failed exchange.
    codela_sf_google_cookie( '', time() - 3600 );
    if ( ! is_string( $verifier ) || '' === $verifier ) { codela_sf_google_return(); }

    [ $client_id, $client_secret ] = codela_sf_google_credentials();
    $response = wp_remote_post( 'https://oauth2.googleapis.com/token', [
        'timeout' => 10,
        'redirection' => 0,
        'body' => [
            'code' => $code, 'client_id' => $client_id,
            'client_secret' => $client_secret,
            'redirect_uri' => codela_sf_google_callback_url(),
            'grant_type' => 'authorization_code',
            'code_verifier' => $verifier,
        ],
    ] );
    if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
        codela_sf_google_return();
    }
    $token = json_decode( wp_remote_retrieve_body( $response ), true );
    $access = is_array( $token ) ? (string) ( $token['access_token'] ?? '' ) : '';
    if ( '' === $access || strlen( $access ) > 4096 ) { codela_sf_google_return(); }

    // This access token came from Google's authenticated back-channel exchange,
    // bound to this client's secret, exact redirect URL and one-time PKCE proof.
    $response = wp_remote_get( 'https://openidconnect.googleapis.com/v1/userinfo', [
        'timeout' => 10,
        'redirection' => 0,
        'headers' => [ 'Authorization' => 'Bearer ' . $access, 'Accept' => 'application/json' ],
    ] );
    if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
        codela_sf_google_return();
    }
    $identity = json_decode( wp_remote_retrieve_body( $response ), true );
    $user = is_array( $identity ) ? codela_sf_google_customer( $identity ) : new WP_Error( 'invalid_google_response' );
    if ( is_wp_error( $user ) ) { codela_sf_google_return(); }

    wp_set_current_user( $user->ID );
    wp_set_auth_cookie( $user->ID, true, is_ssl() );
    do_action( 'wp_login', $user->user_login, $user );
    codela_sf_google_return( false );
}
add_action( 'admin_post_nopriv_codela_sf_google_callback', 'codela_sf_google_callback' );
add_action( 'admin_post_codela_sf_google_callback', 'codela_sf_google_callback' );

/** WooCommerce invokes this after its native login/registration forms. */
function codela_sf_google_button(): void {
    if ( ! function_exists( 'is_account_page' ) || ( ! is_account_page() && empty( $GLOBALS['codela_sf_auth_overlay'] ) )
        || is_user_logged_in() ) { return; }
    if ( ! codela_sf_google_enabled() ) { return; }
    ?>
    <div class="sf-shell sf-auth-social">
        <div class="sf-auth-divider"><span><?php esc_html_e( 'or', 'codela-storefront' ); ?></span></div>
        <a class="sf-auth-google sf-ui-button sf-ui-button--secondary" href="<?php echo esc_url( codela_sf_google_auth_url() ); ?>">
            <span class="sf-google-glyph" aria-hidden="true">G</span>
            <span class="sf-ui-button-label"><?php esc_html_e( 'Continue with Google', 'codela-storefront' ); ?></span>
        </a>
    </div>
    <?php
}
add_action( 'woocommerce_after_customer_login_form', 'codela_sf_google_button', 15 );

/** Friendly, non-identifying message after a rejected or expired Google login. */
function codela_sf_google_notice(): void {
    if ( ! function_exists( 'is_account_page' ) || ! is_account_page()
        || is_user_logged_in() || ! isset( $_GET['google_login'] )
        || ! is_string( $_GET['google_login'] ) || 'error' !== $_GET['google_login'] ) {
        return;
    }
    echo '<p class="sf-google-error" role="alert">'
        . esc_html__( 'Google sign-in was not completed. Try again or use your existing password.', 'codela-storefront' )
        . '</p>';
}
add_action( 'woocommerce_before_customer_login_form', 'codela_sf_google_notice', 4 );

/** Keep credentials in the theme; present their form inside the existing hub. */
function codela_sf_google_settings_url(): string {
    return function_exists( 'codela_theme_render_integrations' )
        ? codela_theme_admin_url() : admin_url( 'themes.php?page=codela-sf-google' );
}
function codela_sf_google_admin_menu(): void {
    // Older Codela versions retain a working fallback until the plugin is updated.
    if ( function_exists( 'codela_theme_render_integrations' ) ) { return; }
    add_theme_page( __( 'Google login', 'codela-storefront' ), __( 'Google login', 'codela-storefront' ),
        'manage_options', 'codela-sf-google', 'codela_sf_google_admin_page' );
}
add_action( 'admin_menu', 'codela_sf_google_admin_menu' );
add_action( 'admin_init', static function(): void {
    if ( function_exists( 'codela_theme_render_integrations' ) && current_user_can( 'manage_options' )
        && 'codela-sf-google' === ( $_GET['page'] ?? '' ) ) {
        wp_safe_redirect( codela_sf_google_settings_url() . '#sf-google-settings', 302 );
        exit;
    }
} );
add_action( 'admin_notices', static function(): void {
    if ( ! current_user_can( 'manage_options' ) || codela_sf_google_enabled() ) { return; }
    $screen = get_current_screen();
    if ( ! $screen || ! in_array( $screen->id, [ 'themes', 'appearance_page_codela-sf-google' ], true ) ) { return; }
    echo '<div class="notice notice-warning"><p>' . esc_html__( 'Google sign-in needs an OAuth web client. Configure it to enable the sign-in button.', 'codela-storefront' )
        . ' <a href="' . esc_url( codela_sf_google_settings_url() . '#sf-google-settings' ) . '">' . esc_html__( 'Google login', 'codela-storefront' ) . '</a></p></div>';
} );

function codela_sf_google_settings_form(): void {
    if ( ! current_user_can( 'manage_options' ) ) { return; }
    [ $id, $secret ] = codela_sf_google_credentials();
    $managed = defined( 'CODELA_SF_GOOGLE_CLIENT_ID' ) || defined( 'CODELA_SF_GOOGLE_CLIENT_SECRET' );
    ?>
    <div class="cdl-card" id="sf-google-settings"><div class="cdl-card-body">
        <h3><?php esc_html_e( 'Google login', 'codela-storefront' ); ?></h3>
        <p><?php esc_html_e( 'Let customers sign in with their Google account.', 'codela-storefront' ); ?></p>
        <?php if ( isset( $_GET['sf_google_saved'] ) ) : ?><p role="status"><?php esc_html_e( 'Settings saved.', 'codela-storefront' ); ?></p><?php endif; ?>
        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
            <input type="hidden" name="action" value="codela_sf_google_save">
            <?php wp_nonce_field( 'codela_sf_google_save' ); ?>
            <div class="cdl-theme-field"><label for="sf-google-callback"><?php esc_html_e( 'Redirect URI', 'codela-storefront' ); ?></label>
                <input type="text" class="regular-text" id="sf-google-callback" readonly value="<?php echo esc_attr( codela_sf_google_callback_url() ); ?>">
                <p class="description"><?php esc_html_e( 'Create a Google Cloud OAuth client of type Web application. Add this exact authorized redirect URI:', 'codela-storefront' ); ?></p></div>
            <?php if ( $managed ) : ?>
                <p><?php esc_html_e( 'Credentials are managed in the server configuration.', 'codela-storefront' ); ?></p>
            <?php else : ?>
                <div class="cdl-theme-field"><label for="sf-google-id">Client ID</label>
                    <input type="text" id="sf-google-id" name="sf_google_id" class="regular-text" autocomplete="off" maxlength="255" value="<?php echo esc_attr( $id ); ?>"></div>
                <div class="cdl-theme-field"><label for="sf-google-secret">Client secret</label>
                    <input id="sf-google-secret" name="sf_google_secret" type="password" class="regular-text" autocomplete="new-password" maxlength="512" value="">
                    <p class="description"><?php echo $secret ? esc_html__( 'A secret is saved. Leave blank to keep it.', 'codela-storefront' ) : esc_html__( 'Enter your Google OAuth client secret.', 'codela-storefront' ); ?></p></div>
                <div class="cdl-theme-field"><label for="sf-google-clear"><?php esc_html_e( 'Disable and clear saved credentials', 'codela-storefront' ); ?></label>
                    <input id="sf-google-clear" type="checkbox" name="sf_google_clear" value="1"></div>
                <div class="cdl-theme-actions"><button class="codela-btn" type="submit"><?php esc_html_e( 'Save settings', 'codela-storefront' ); ?></button></div>
            <?php endif; ?>
        </form>
    </div></div>
    <?php
}
add_action( 'codela_theme_settings_integrations', 'codela_sf_google_settings_form' );
function codela_sf_google_admin_page(): void {
    if ( ! current_user_can( 'manage_options' ) ) { return; }
    echo '<div class="wrap"><h1>' . esc_html__( 'Google login', 'codela-storefront' ) . '</h1>';
    codela_sf_google_settings_form();
    echo '</div>';
}

function codela_sf_google_save(): void {
    if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Forbidden', '', [ 'response' => 403 ] ); }
    check_admin_referer( 'codela_sf_google_save' );
    if ( ! defined( 'CODELA_SF_GOOGLE_CLIENT_ID' ) && ! defined( 'CODELA_SF_GOOGLE_CLIENT_SECRET' ) ) {
        if ( ! empty( $_POST['sf_google_clear'] ) ) {
            delete_option( 'codela_sf_google_client_id' );
            delete_option( 'codela_sf_google_client_secret' );
        } else {
            $id = isset( $_POST['sf_google_id'] ) && is_string( $_POST['sf_google_id'] )
                ? sanitize_text_field( wp_unslash( $_POST['sf_google_id'] ) ) : '';
            $secret = isset( $_POST['sf_google_secret'] ) && is_string( $_POST['sf_google_secret'] )
                ? trim( wp_unslash( $_POST['sf_google_secret'] ) ) : '';
            if ( strlen( $id ) > 255 || ! str_ends_with( $id, '.apps.googleusercontent.com' ) || strlen( $secret ) > 512 ) {
                wp_die( 'Invalid OAuth configuration', '', [ 'response' => 400 ] );
            }
            update_option( 'codela_sf_google_client_id', $id, false );
            if ( '' !== $secret ) { update_option( 'codela_sf_google_client_secret', $secret, false ); }
        }
    }
    wp_safe_redirect( add_query_arg( [ 'sf_google_saved' => '1' ], codela_sf_google_settings_url() ) . '#sf-google-settings', 303 );
    exit;
}
add_action( 'admin_post_codela_sf_google_save', 'codela_sf_google_save' );
