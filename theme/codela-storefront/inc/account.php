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
        <h1><?php esc_html_e( 'My account', 'codela-storefront' ); ?></h1>
        <p><?php esc_html_e( 'Manage your orders and account details.', 'codela-storefront' ); ?></p>
        <!-- Only shown by auth.js if WooCommerce has rendered BOTH native forms. -->
        <div class="sf-auth-tabs" role="tablist" aria-label="<?php esc_attr_e( 'Account access', 'codela-storefront' ); ?>" hidden>
            <button type="button" class="sf-auth-tab sf-ui-nav-tab sf-ui-pressable" role="tab" data-auth-tab="login" aria-selected="true"><?php esc_html_e( 'Log in', 'codela-storefront' ); ?></button>
            <button type="button" class="sf-auth-tab sf-ui-nav-tab sf-ui-pressable" role="tab" data-auth-tab="register" aria-selected="false"><?php esc_html_e( 'Register', 'codela-storefront' ); ?></button>
        </div>
    </header>
    <?php
}

add_action( 'woocommerce_before_customer_login_form', 'codela_sf_account_intro', 5 );
// Deliberately NO woocommerce_before_account_navigation hook:
// Codela owns the signed-in profile, orders, tracking and account menu.
