<?php
/**
 * Google sign-in presentation and customer-account policy.
 * Google Site Kit owns verification, identity storage, registration and the
 * WordPress login session. No theme OAuth client, token exchange or credentials.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_google_enabled(): bool {
    return codela_sf_site_kit_signin_connected();
}

/** The native Google widget needs a real document, not an inert lazy template. */
function codela_sf_google_auth_url(): string {
    return add_query_arg( 'codela_google', '1', codela_sf_account_url() );
}

function codela_sf_google_button(): void {
    if ( ! codela_sf_google_enabled() || is_user_logged_in()
        || ( ! is_account_page() && empty( $GLOBALS['codela_sf_auth_overlay'] ) ) ) { return; }
    ?>
    <div class="sf-shell sf-auth-social" data-sf-site-kit-social>
        <div class="sf-auth-divider"><span><?php esc_html_e( 'or', 'codela-storefront' ); ?></span></div>
        <?php if ( ! empty( $GLOBALS['codela_sf_auth_overlay'] ) ) : ?>
            <a class="sf-auth-google sf-ui-button sf-ui-button--secondary" href="<?php echo esc_url( codela_sf_google_auth_url() ); ?>">
                <span class="sf-google-glyph" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24" focusable="false" aria-hidden="true">
                    <path fill="#4285F4" d="M21.8 12.2c0-.7-.06-1.4-.18-2.08H12v3.94h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.04-4.39 3.04-7.5z"/>
                    <path fill="#34A853" d="M12 22c2.75 0 5.07-.91 6.76-2.46l-3.3-2.56c-.92.62-2.1.98-3.46.98-2.66 0-4.91-1.8-5.72-4.22H2.87v2.64A10 10 0 0 0 12 22z"/>
                    <path fill="#FBBC05" d="M6.28 13.74a6 6 0 0 1 0-3.48V7.62H2.87a10 10 0 0 0 0 8.76l3.41-2.64z"/>
                    <path fill="#EA4335" d="M12 6.04c1.5 0 2.84.52 3.9 1.54l2.93-2.93A9.95 9.95 0 0 0 12 2a10 10 0 0 0-9.13 5.62l3.41 2.64C7.09 7.84 9.34 6.04 12 6.04z"/>
                </svg>
            </span>
                <span class="sf-ui-button-label"><?php esc_html_e( 'Continue with Google', 'codela-storefront' ); ?></span>
            </a>
        <?php else : ?>
            <div class="sf-site-kit-button" data-sf-site-kit-button>
                <?php
                // Supported Site Kit rendering hook; Google's iframe and click
                // handling remain entirely owned by Google Identity Services.
                do_action( 'googlesitekit_render_sign_in_with_google_button', [
                    'theme' => 'filled_black', 'shape' => 'pill',
                    'text' => 'continue_with', 'width' => 280,
                ] );
                ?>
            </div>
        <?php endif; ?>
    </div>
    <?php
}
add_action( 'woocommerce_after_customer_login_form', 'codela_sf_google_button', 15 );

/** Site Kit also inserts its default placeholder inside Woo's native form.
 * Remove only that duplicate within our own managed form before Site Kit's
 * footer script initializes. Leave checkout and other plugins' buttons alone.
 * The lazy overlay keeps its ordinary link; no third-party iframe in a template.
 */
add_action( 'wp_footer', static function(): void {
    if ( ! codela_sf_google_enabled() || is_user_logged_in() ) { return; }
    wp_print_inline_script_tag( <<<'JS'
(() => {
    const clean = scope => {
        for (const social of scope.querySelectorAll('[data-sf-site-kit-social]')) {
            const host = social.closest('.woocommerce');
            if (!host) continue;
            for (const button of host.querySelectorAll('form.woocommerce-form-login .googlesitekit-sign-in-with-google__frontend-output-button')) {
                if (button.closest('.woocommerce') === host) button.remove();
            }
        }
    };
    clean(document);
    for (const template of document.querySelectorAll('template[data-sf-auth-template]')) clean(template.content);
})();
JS
    );
}, 1 );

/** Preserve the existing customer-only boundary when Site Kit authenticates.
 * These native WordPress hooks are installed only during its credential POST.
 * Site Kit may also serve wp-login.php; neither a forged integration parameter
 * nor a direct request can select a more privileged Codela sign-in route.
 */
function codela_sf_google_policy_start(): void {
    if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) ) { return; }
    add_action( 'set_auth_cookie', 'codela_sf_google_guard_session', 1, 6 );
    add_action( 'user_register', static function( $id ): void {
        $GLOBALS['codela_sf_google_new_users'][ (int) $id ] = true;
    }, 1 );
    add_filter( 'update_user_metadata', 'codela_sf_google_guard_link', 1, 4 );
    add_filter( 'add_user_metadata', 'codela_sf_google_guard_link', 1, 4 );
    // Do not inherit an elevated WordPress default role in a customer sign-up.
    add_filter( 'pre_option_default_role', static fn() => 'customer' );
}
add_action( 'login_form_googlesitekit_auth', 'codela_sf_google_policy_start', 1 );

function codela_sf_google_reject(): void {
    nocache_headers();
    wp_safe_redirect( add_query_arg( 'google_login', 'error', codela_sf_account_url() ), 303 );
    exit;
}

/** Reject before WordPress emits the authentication cookies. Remove only
 * the newly generated session token; do not log out other devices.
 */
function codela_sf_google_guard_session( $cookie, $expire, $expiration, $user_id, $scheme, $token ): void {
    $user = get_user_by( 'id', $user_id );
    if ( codela_sf_public_account_user( $user ) ) { return; }
    if ( is_string( $token ) && '' !== $token ) {
        WP_Session_Tokens::get_instance( $user_id )->destroy( $token );
    }
    codela_sf_google_reject();
}

/** Site Kit stores the MD5 of its verified Google subject in this user option.
 * Preserve legacy identity links without writing to Site Kit's storage, and
 * never silently attach an external email to a pre-existing account. Explicit
 * signed-in linking remains the official provider's authenticated flow.
 */
function codela_sf_google_link_allowed( $user, string $hash, string $previous, string $legacy, bool $new, bool $explicit ): bool {
    if ( ! codela_sf_public_account_user( $user ) || ! preg_match( '/^[a-f0-9]{32}$/D', $hash ) ) { return false; }
    if ( '' !== $legacy && ! hash_equals( md5( $legacy ), $hash ) ) { return false; }
    if ( '' !== $previous ) { return hash_equals( $previous, $hash ); }
    if ( '' !== $legacy || $new || $explicit ) { return true; }
    $domain = strtolower( (string) substr( strrchr( $user->user_email, '@' ), 1 ) );
    return in_array( $domain, [ 'gmail.com', 'googlemail.com' ], true );
}

function codela_sf_google_guard_link( $check, $user_id, $key, $value ) {
    global $wpdb;
    $option = 'googlesitekitpersistent_siwg_google_user_hid';
    if ( ! in_array( $key, [ $option, $wpdb->get_blog_prefix() . $option ], true ) ) { return $check; }
    $user = get_user_by( 'id', $user_id );
    $explicit = 'existing_user' === ( $_POST['integration'] ?? '' )
        && (int) $user_id === get_current_user_id();
    if ( ! is_string( $value ) || ! codela_sf_google_link_allowed(
        $user, $value, (string) get_user_meta( $user_id, $key, true ),
        (string) get_user_meta( $user_id, '_sf_google_sub', true ),
        ! empty( $GLOBALS['codela_sf_google_new_users'][ (int) $user_id ] ), $explicit
    ) ) { codela_sf_google_reject(); }
    return $check;
}

/** Generic policy failure; ordinary Site Kit errors use its own Woo notices. */
add_action( 'woocommerce_before_customer_login_form', static function(): void {
    if ( ! is_account_page() || is_user_logged_in() || 'error' !== ( $_GET['google_login'] ?? '' ) ) { return; }
    echo '<p class="sf-google-error" role="alert">' .
        esc_html__( 'Google sign-in was not completed. Try again or use your existing password.', 'codela-storefront' ) . '</p>';
}, 4 );

/** Codela's integration hub now links to the official settings, never secrets. */
function codela_sf_google_settings_form(): void {
    if ( ! current_user_can( 'manage_options' ) ) { return; }
    ?>
    <div class="cdl-card" id="sf-google-settings"><div class="cdl-card-body">
        <h3><?php esc_html_e( 'Google login', 'codela-storefront' ); ?></h3>
        <p><?php esc_html_e( 'Google Site Kit manages Google sign-in. Enable Sign in with Google in Site Kit settings.', 'codela-storefront' ); ?></p>
        <?php if ( codela_sf_google_enabled() ) : ?><p role="status"><?php esc_html_e( 'Site Kit is connected.', 'codela-storefront' ); ?></p><?php endif; ?>
        <a class="codela-btn" href="<?php echo esc_url( admin_url( 'admin.php?page=googlesitekit-settings' ) ); ?>"><?php esc_html_e( 'Google Site Kit', 'codela-storefront' ); ?></a>
    </div></div>
    <?php
}
add_action( 'codela_theme_settings_integrations', 'codela_sf_google_settings_form' );
