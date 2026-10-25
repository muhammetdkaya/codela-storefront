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
    <header class="sf-account-intro">
        <h1><?php esc_html_e( 'My account', 'codela-storefront' ); ?></h1>
        <!-- Only shown by auth.js if WooCommerce has rendered BOTH native forms. -->
        <div class="sf-auth-tabs" role="tablist" aria-label="<?php esc_attr_e( 'Account access', 'codela-storefront' ); ?>" hidden>
            <button type="button" class="sf-auth-tab sf-ui-nav-tab sf-ui-pressable" role="tab" data-auth-tab="login" aria-selected="true"><?php esc_html_e( 'Log in', 'codela-storefront' ); ?></button>
            <button type="button" class="sf-auth-tab sf-ui-nav-tab sf-ui-pressable" role="tab" data-auth-tab="register" aria-selected="false"><?php esc_html_e( 'Register', 'codela-storefront' ); ?></button>
        </div>
    </header>
    <?php
}

add_action( 'woocommerce_before_customer_login_form', 'codela_sf_account_intro', 5 );
// Keep WooCommerce endpoint navigation and all registered plugin destinations.

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
        echo '<div class="woocommerce sf-overlay-auth">';
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
    return $items;
} );
add_filter( 'body_class', function ( array $classes ): array {
    if ( function_exists( 'is_account_page' ) && is_account_page() && is_user_logged_in() && ! is_wc_endpoint_url() ) {
        $classes[] = 'sf-account-dashboard';
    }
    return $classes;
} );

/** Shared local icon vocabulary; unknown plugin destinations remain real links. */
function codela_sf_account_icon( string $endpoint ): string {
    $icons = [ 'dashboard' => 'house', 'orders' => 'shopping-bag', 'downloads' => 'download', 'communication-preferences' => 'sliders-horizontal', 'privacy' => 'sliders-horizontal', 'edit-address' => 'map-pin', 'edit-account' => 'user-round', 'customer-logout' => 'log-out' ];
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
