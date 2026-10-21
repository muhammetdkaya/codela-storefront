<?php
/**
 * Empty order presentation only. Populated orders remain the installed Woo
 * template (columns, actions, pagination and module hooks stay upstream).
 * @version 9.5.0
 */
defined( 'ABSPATH' ) || exit;
if ( $has_orders ) {
    include WC()->plugin_path() . '/templates/myaccount/orders.php';
    return;
}
do_action( 'woocommerce_before_account_orders', $has_orders );
?>
<div class="sf-account-empty-state sf-account-empty-orders" role="status">
    <?php echo codela_sf_icon( 'shopping-bag' ); ?>
    <div>
        <p class="sf-account-empty"><?php esc_html_e( 'You have no orders yet.', 'codela-storefront' ); ?></p>
        <p class="sf-account-muted"><?php esc_html_e( 'Your first order will appear here.', 'codela-storefront' ); ?></p>
        <?php echo codela_sf_ui_button( __( 'Browse products', 'codela-storefront' ), [
            'href' => apply_filters( 'woocommerce_return_to_shop_redirect', wc_get_page_permalink( 'shop' ) ),
            'variant' => 'secondary', 'icon' => 'arrow-right',
        ] ); ?>
    </div>
</div>
<?php do_action( 'woocommerce_after_account_orders', $has_orders ); ?>
