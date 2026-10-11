<?php
/**
 * Storefront-owned account presentation. WooCommerce owns the forms,
 * nonce validation, registration settings and authentication lifecycle.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Print a short, accessible introduction without overriding Woo templates. */
function codela_sf_account_intro( bool $signed_in = false ): void {
    if ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) { return; }
    ?>
    <header class="sf-account-intro">
        <span class="sf-account-eyebrow"><?php esc_html_e( 'YOUR ACCOUNT', 'codela-storefront' ); ?></span>
        <h1><?php echo esc_html( $signed_in ? __( 'My account', 'codela-storefront' ) : __( 'Welcome back', 'codela-storefront' ) ); ?></h1>
        <p><?php echo esc_html( $signed_in ? __( 'View your orders, addresses and account details.', 'codela-storefront' ) : __( 'Sign in to follow your orders and manage your details.', 'codela-storefront' ) ); ?></p>
    </header>
    <?php
}

add_action( 'woocommerce_before_customer_login_form', 'codela_sf_account_intro', 5 );
add_action( 'woocommerce_before_account_navigation', static function(): void {
    codela_sf_account_intro( true );
}, 5 );
