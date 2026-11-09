<?php
/** Deterministic contract tests for Account presentation and Woo boundaries. */
$root = __DIR__ . '/../theme/codela-storefront/';
function sf_assert( $ok, $why ) { if ( ! $ok ) { throw new RuntimeException( $why ); } }
$schema = json_decode( file_get_contents( $root . 'config/settings.json' ), true, 512, JSON_THROW_ON_ERROR );
$fields = [];
foreach ( $schema['sections'] as $section ) {
    foreach ( $section['fields'] as $field ) { $fields[$field['id']] = $field; }
}
sf_assert( isset( $fields['account_downloads_enabled'] ) && true === $fields['account_downloads_enabled']['default'], 'Downloads are visible by default' );
$account = file_get_contents( $root . 'inc/account.php' );
sf_assert( str_contains( $account, "unset( \$items['downloads'] );" ), 'Downloads hide only the menu item' );
sf_assert( str_contains( $account, "'woocommerce_login_redirect'" ) && str_contains( $account, "'woocommerce_registration_redirect'" ) && str_contains( $account, "'login_redirect'" ), 'All public login redirects' );
sf_assert( str_contains( $account, 'codela_sf_login_is_admin_destination' ), 'Administrative login is preserved' );
sf_assert( str_contains( $account, "remove_action( 'woocommerce_before_account_orders', [ \$controller, 'render_prompt' ], 10 )" ), 'Native email verification is preserved' );
sf_assert( str_contains( $account, 'should_show_prompt()' ) && str_contains( $account, 'woocommerce-send-verification-email' ), 'Native verification eligibility and nonce' );
sf_assert( str_contains( file_get_contents( $root . 'woocommerce/myaccount/dashboard.php' ), 'codela_sf_account_verification_banner()' ), 'Reminder in account overview' );
$orders = file_get_contents( $root . 'woocommerce/myaccount/orders.php' );
sf_assert( ! str_contains( $orders, 'Browse products' ) && str_contains( $orders, 'woocommerce_before_account_orders' ), 'Empty orders keeps hooks and has no shopping CTA' );
$address = file_get_contents( $root . 'woocommerce/myaccount/my-address.php' );
sf_assert( str_contains( $address, 'render_manage_link_on_edit_address' ) && str_contains( $address, 'WC()->plugin_path()' ), 'Address-book conditional fallback' );
sf_assert( str_contains( file_get_contents( $root . 'woocommerce/myaccount/navigation.php' ), "codela_sf_icon( 'chevron-right' )" ), 'Modern chevron' );
sf_assert( file_exists( $root . 'assets/icons/chevron-right.svg' ), 'Icon exists' );
echo "Account integration rules passed\n";
