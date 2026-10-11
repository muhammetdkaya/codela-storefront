<?php
/**
 * Storefront owns presentation of the GUEST WooCommerce login screen only.
 * Authenticated account/dashboard/navigation are owned by WooCommerce and by
 * the Codela MyAccountLayout integration when enabled.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Display a welcome heading exclusively above the native guest login form. */
function codela_sf_account_intro(): void {
    if (
        ! function_exists( 'is_account_page' )
        || ! is_account_page()
        || is_user_logged_in()
    ) {
        return;
    }
    ?>
    <header class="sf-account-intro">
        <span class="sf-account-eyebrow"><?php esc_html_e( 'YOUR ACCOUNT', 'codela-storefront' ); ?></span>
        <h1><?php esc_html_e( 'Welcome back', 'codela-storefront' ); ?></h1>
        <p><?php esc_html_e( 'Sign in to follow your orders and manage your details.', 'codela-storefront' ); ?></p>
    </header>
    <?php
}

add_action( 'woocommerce_before_customer_login_form', 'codela_sf_account_intro', 5 );
// Deliberately NO woocommerce_before_account_navigation hook:
// Codela owns the signed-in profile, orders, tracking and account menu.
