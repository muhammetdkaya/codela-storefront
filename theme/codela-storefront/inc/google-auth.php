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

/** Both native and delayed surfaces use the same official provider markup.
 * Late surfaces are rendered by Google's public renderButton API after Site
 * Kit has initialized its own credential callback; never initialize it again.
 */
function codela_sf_google_widget( bool $late = false ): void {
    ?>
    <div class="sf-site-kit-button" data-sf-site-kit-button<?php if ( $late ) : ?> data-sf-site-kit-late<?php endif; ?>>
        <?php do_action( 'googlesitekit_render_sign_in_with_google_button', [
            'class' => 'sf-site-kit-target',
            'theme' => 'filled_black', 'shape' => 'pill',
            'text' => 'continue_with', 'width' => 280,
        ] ); ?>
        <?php if ( $late ) : ?><span data-sf-site-kit-unavailable hidden role="status"><?php esc_html_e( 'Google sign-in is currently unavailable', 'codela-storefront' ); ?></span><?php endif; ?>
    </div>
    <?php
}

function codela_sf_google_button(): void {
    if ( ! codela_sf_google_enabled() || is_user_logged_in()
        || ( ! is_account_page() && empty( $GLOBALS['codela_sf_auth_overlay'] ) ) ) { return; }
    ?>
    <div class="sf-shell sf-auth-social" data-sf-site-kit-social>
        <div class="sf-auth-divider"><span><?php esc_html_e( 'or', 'codela-storefront' ); ?></span></div>
        <?php codela_sf_google_widget( ! empty( $GLOBALS['codela_sf_auth_overlay'] ) ); ?>
    </div>
    <?php
}
add_action( 'woocommerce_after_customer_login_form', 'codela_sf_google_button', 15 );

/** Keep Site Kit's standard initialization and direct-page rendering.
 * Suppress only duplicate default Woo placeholders in Codela's managed
 * forms and defer our popup/remembered widgets until their final DOM position.
 * Neither other provider buttons nor One Tap are changed.
 */
add_action( 'wp_footer', static function(): void {
    if ( ! codela_sf_google_enabled() || is_user_logged_in() ) { return; }
    wp_print_inline_script_tag( <<<'JS'
(() => {
    const official = 'googlesitekit-sign-in-with-google__frontend-output-button';
    const clean = scope => {
        for (const social of scope.querySelectorAll('[data-sf-site-kit-social]')) {
            const host = social.closest('.woocommerce');
            if (!host) continue;
            for (const button of host.querySelectorAll('form.woocommerce-form-login .' + official)) {
                if (button.closest('.woocommerce') === host) button.remove();
            }
        }
        for (const target of scope.querySelectorAll('[data-sf-site-kit-late] .sf-site-kit-target')) {
            // Site Kit discovers buttons by this class on initial document load.
            // Keep the official data attributes; render late via the same GIS.
            target.classList.remove(official);
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
    if ( codela_sf_public_account_user( $user ) ) {
        // An already-linked Site Kit user may bypass its metadata write. Do
        // not let a conflicting provider link bypass the legacy identity rule.
        $legacy = (string) get_user_meta( $user_id, '_sf_google_sub', true );
        if ( '' === $legacy ) { return; }
        global $wpdb;
        $option = 'googlesitekitpersistent_siwg_google_user_hid';
        $links = array_filter( [
            (string) get_user_meta( $user_id, $option, true ),
            (string) get_user_meta( $user_id, $wpdb->get_blog_prefix() . $option, true ),
        ] );
        if ( $links && ! array_diff( $links, [ md5( $legacy ) ] ) ) { return; }
    }
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
