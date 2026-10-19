<?php
/** Native account destinations, composed by the theme. @version 9.3.0 */
defined( 'ABSPATH' ) || exit;
do_action( 'woocommerce_before_account_navigation' );
$items = wc_get_account_menu_items();
$current_label = $items['dashboard'] ?? __( 'Overview', 'codela-storefront' );
$classes = [];
foreach ( $items as $endpoint => $label ) {
    $classes[ $endpoint ] = wc_get_account_menu_item_classes( $endpoint );
    if ( in_array( 'is-active', explode( ' ', $classes[ $endpoint ] ), true ) ) { $current_label = $label; }
}
?>
<nav class="woocommerce-MyAccount-navigation" aria-label="<?php esc_attr_e( 'Account pages', 'woocommerce' ); ?>">
    <details class="sf-account-menu">
        <summary class="sf-ui-pressable"><?php echo esc_html( $current_label ); ?><?php echo codela_sf_icon( 'plus' ); ?></summary>
        <ul>
            <?php foreach ( $items as $endpoint => $label ) : ?>
            <li class="<?php echo esc_attr( $classes[ $endpoint ] ); ?>">
                <a class="sf-ui-pressable" href="<?php echo esc_url( wc_get_account_endpoint_url( $endpoint ) ); ?>" <?php echo in_array( 'is-active', explode( ' ', $classes[ $endpoint ] ), true ) ? 'aria-current="page"' : ''; ?>>
                    <?php echo codela_sf_account_icon( (string) $endpoint ); ?><span><?php echo esc_html( $label ); ?></span>
                </a>
            </li>
            <?php endforeach; ?>
        </ul>
    </details>
</nav>
<?php do_action( 'woocommerce_after_account_navigation' ); ?>
