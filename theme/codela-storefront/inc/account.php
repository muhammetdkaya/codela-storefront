<?php
/**
 * Storefront owns account presentation through the existing Theme appearance mode.
 * WooCommerce owns native forms/endpoints; Codela modules retain their hooks.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Display a welcome heading exclusively above the native guest login form. */
function codela_sf_account_intro(): void {
    if (
        ! function_exists( 'is_account_page' )
        || ( ! is_account_page() && empty( $GLOBALS['codela_sf_auth_overlay'] ) )
        || is_user_logged_in()
    ) {
        return;
    }
    ?>
    <header class="sf-account-intro"
        data-auth-initial="<?php echo isset( $_POST['register'] ) ? 'register' : 'login'; ?>"
        data-auth-login-placeholder="<?php esc_attr_e( 'Email or username', 'codela-storefront' ); ?>"
        data-auth-username-placeholder="<?php esc_attr_e( 'Username', 'codela-storefront' ); ?>"
        data-auth-email-placeholder="<?php esc_attr_e( 'Email address', 'codela-storefront' ); ?>"
        data-auth-password-placeholder="<?php esc_attr_e( 'Password', 'codela-storefront' ); ?>"
        data-auth-login-title="<?php esc_attr_e( 'Welcome back', 'codela-storefront' ); ?>"
        data-auth-login-description="<?php esc_attr_e( 'Sign in to your account.', 'codela-storefront' ); ?>"
        data-auth-register-title="<?php esc_attr_e( 'Create an account', 'codela-storefront' ); ?>"
        data-auth-register-description="<?php esc_attr_e( 'Join us in a few steps.', 'codela-storefront' ); ?>">
        <h1 id="sf-auth-view-title"><span class="sf-auth-heading-text"><?php esc_html_e( 'Welcome back', 'codela-storefront' ); ?></span> <span class="sf-auth-heading-wave" aria-hidden="true">👋</span></h1>
        <p class="sf-auth-description"><?php esc_html_e( 'Sign in to your account.', 'codela-storefront' ); ?></p>
    </header>
    <?php
}

add_action( 'woocommerce_before_customer_login_form', 'codela_sf_account_intro', 5 );

/**
 * Render registration BETWEEN the completed Woo account forms and Google's
 * social offer. Never print the CTA from inside a Woo form-row: native submit /
 * remember-me layouts can give form-end hooks a narrow column and reorder it.
 * WooCommerce still owns both forms, validation, and registration permissions.
 */
function codela_sf_account_register_action(): void {
    if ( is_user_logged_in() || 'yes' !== get_option( 'woocommerce_enable_myaccount_registration', 'no' )
        || ( ! is_account_page() && empty( $GLOBALS['codela_sf_auth_overlay'] ) ) ) { return; }
    ?>
    <a href="#sf-auth-register" class="sf-auth-register-cta sf-ui-pressable" aria-controls="sf-auth-register">
        <span class="sf-auth-register-glyph" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" focusable="false">
                <rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>
            </svg>
        </span>
        <span><?php esc_html_e( 'Register with email', 'codela-storefront' ); ?></span>
    </a>
    <?php
}
add_action( 'woocommerce_after_customer_login_form', 'codela_sf_account_register_action', 10 );

/** Registration stays the native WooCommerce form; returning never focuses an input. */
function codela_sf_account_login_return(): void {
    if ( is_user_logged_in() || ( ! is_account_page() && empty( $GLOBALS['codela_sf_auth_overlay'] ) ) ) { return; }
    ?>
    <a href="#customer_login" class="sf-auth-back-login sf-ui-pressable" aria-controls="sf-auth-login">
        <span aria-hidden="true">‹</span><?php esc_html_e( 'Back to sign in', 'codela-storefront' ); ?>
    </a>
    <?php
}
add_action( 'woocommerce_register_form_start', 'codela_sf_account_login_return', 12 );

/** Storefront authentication lives on WooCommerce My Account, not wp-login.php.
 * Keep WordPress's administrative login, reauthentication, password recovery,
 * logout and external identity callbacks fully operational.
 */
function codela_sf_public_login_destination( array $query, string $method = 'GET' ): string {
    if ( 'GET' !== strtoupper( $method ) || ! function_exists( 'wc_get_page_permalink' ) ) { return ''; }
    $action = $query['action'] ?? 'login';
    if ( ! is_string( $action ) || ! in_array( $action, [ '', 'login', 'register' ], true ) ) { return ''; }
    foreach ( [ 'redirect_to', 'reauth', 'interim-login', 'checkemail', 'key', 'login', 'action' ] as $param ) {
        if ( in_array( $param, [ 'action' ], true ) ) { continue; }
        if ( isset( $query[ $param ] ) ) { return ''; }
    }
    return (string) wc_get_page_permalink( 'myaccount' );
}
add_action( 'login_init', static function(): void {
    $method = isset( $_SERVER['REQUEST_METHOD'] ) && is_string( $_SERVER['REQUEST_METHOD'] )
        ? $_SERVER['REQUEST_METHOD'] : 'GET';
    $destination = codela_sf_public_login_destination( $_GET, $method );
    if ( ! $destination ) { return; }
    nocache_headers();
    wp_safe_redirect( $destination, 302, 'Codela Storefront' );
    exit;
}, 5 );

/** Native front-end login/register links resolve to My Account. Admin login
 * URLs are deliberately left alone, including WP-CLI and password reset flows.
 */
add_filter( 'login_url', static function( $url, $redirect, $force_reauth ) {
    if ( is_admin() || $force_reauth || $redirect ) { return $url; }
    $account = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'myaccount' ) : '';
    return $account ?: $url;
}, 20, 3 );

// Keep WooCommerce endpoint navigation and all registered plugin destinations.

/**
 * Refresh guest Woo form nonces when the instant dialog opens. A storefront
 * page may be publicly cached for longer than the WooCommerce login/register
 * nonce lifetime. This read-only endpoint returns fresh guest form tokens,
 * never an authentication token and never authenticates a customer.
 */
function codela_sf_account_form_state(): void {
    nocache_headers();
    wp_send_json( [
        'authenticated' => is_user_logged_in(),
        'login_nonce' => wp_create_nonce( 'woocommerce-login' ),
        'register_nonce' => wp_create_nonce( 'woocommerce-register' ),
        'registration' => 'yes' === get_option( 'woocommerce_enable_myaccount_registration', 'no' ),
    ] );
}
add_action( 'wp_ajax_nopriv_codela_sf_account_form_state', 'codela_sf_account_form_state' );
add_action( 'wp_ajax_codela_sf_account_form_state', 'codela_sf_account_form_state' );

/**
 * Render genuine WooCommerce login and optional registration forms inside the
 * existing Storefront dialog. No iframe, duplicate auth engine, or AJAX endpoint.
 * The native Woo template retains its own nonces, hooks and validation.
 */
function codela_sf_account_overlay_form(): string {
    if ( is_user_logged_in() || ! function_exists( 'wc_get_template' ) ) { return ''; }
    ob_start();
    $GLOBALS['codela_sf_auth_overlay'] = true;
    try {
        echo '<div class="woocommerce sf-overlay-auth" data-auth-state-url="' . esc_url( admin_url( 'admin-ajax.php' ) ) . '">';
        wc_get_template( 'myaccount/form-login.php' );
        echo '</div>';
    } finally {
        unset( $GLOBALS['codela_sf_auth_overlay'] );
    }
    return (string) ob_get_clean();
}

/** The signed-in account starts at its navigation, without a duplicate page title. */
add_filter( 'render_block_core/post-title', function ( string $html, array $block, $instance ): string {
    if ( ! function_exists( 'is_account_page' ) || ! is_account_page() || ! is_user_logged_in() ) { return $html; }
    $is_page_title = (int) ( $instance->context['postId'] ?? 0 ) === (int) wc_get_page_id( 'myaccount' );
    return $is_page_title ? '' : $html;
}, 10, 3 );

/** Keep the native endpoint registry, including independent module destinations. */
add_filter( 'woocommerce_account_menu_items', function ( array $items ): array {
    if ( isset( $items['dashboard'] ) ) { $items['dashboard'] = __( 'Overview', 'codela-storefront' ); }
    // Keep WooCommerce's real edit-account endpoint; only improve the label
    // shown by both the native menu and the Codela account appearance.
    if ( isset( $items['edit-account'] ) ) { $items['edit-account'] = __( 'Account information', 'codela-storefront' ); }
    return $items;
}, 20 );
add_filter( 'body_class', function ( array $classes ): array {
    if ( function_exists( 'is_account_page' ) && is_account_page() && is_user_logged_in() && ! is_wc_endpoint_url() ) {
        $classes[] = 'sf-account-dashboard';
    }
    return $classes;
} );

/** Shared local icon vocabulary; unknown plugin destinations remain real links. */
function codela_sf_account_icon( string $endpoint ): string {
    $icons = [ 'dashboard' => 'house', 'orders' => 'shopping-bag', 'downloads' => 'download', 'communication-preferences' => 'sliders-horizontal', 'privacy' => 'sliders-horizontal', 'edit-address' => 'map-pin', 'edit-account' => 'user-round', 'guvenlik' => 'sliders-horizontal', 'customer-logout' => 'log-out' ];
    return codela_sf_icon( $icons[ $endpoint ] ?? 'arrow-right' );
}


/** Current endpoint is a content heading; the header names its parent. */
add_action( 'woocommerce_account_content', function (): void {
    if ( ! is_user_logged_in() || ! function_exists( 'WC' ) || ! WC()->query ) { return; }
    $endpoint = WC()->query->get_current_endpoint();
    if ( ! $endpoint ) { return; }
    $items = wc_get_account_menu_items();
    $title = $items[ $endpoint ] ?? WC()->query->get_endpoint_title( $endpoint );
    if ( $title ) { echo '<h1 class="sf-account-endpoint-title">' . esc_html( $title ) . '</h1>'; }
}, 5 );


// Explain disabled WooCommerce customer registration INSIDE the Codela admin
// settings screen. Never display this notice to the site's visitors or
// enable registration behind the merchant's back.
function codela_sf_registration_settings_notice(): void {
    if ( ! current_user_can( 'manage_woocommerce' )
        || ! function_exists( 'get_option' )
        || 'yes' === get_option( 'woocommerce_enable_myaccount_registration', 'no' ) ) { return; }

    $page = isset( $_GET['page'] ) && is_string( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
    $screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
    $screen_id = $screen && isset( $screen->id ) ? (string) $screen->id : '';
    $is_codela = str_contains( $page, 'codela' ) || str_contains( $screen_id, 'codela' );
    if ( ! $is_codela ) { return; }

    $settings_url = admin_url( 'admin.php?page=wc-settings&tab=account' );
    echo '<div class="notice notice-warning codela-sf-registration-warning"><p><strong>'
        . esc_html__( 'Customer registration is disabled in WooCommerce.', 'codela-storefront' )
        . '</strong> '
        . esc_html__( 'The email registration action is hidden until account creation on the My Account page is enabled.', 'codela-storefront' )
        . ' <a href="' . esc_url( $settings_url ) . '">'
        . esc_html__( 'Open WooCommerce account settings', 'codela-storefront' )
        . '</a></p></div>';
}
add_action( 'admin_notices', 'codela_sf_registration_settings_notice' );
