<?php
/** Compact account overview; Woo owns orders, money, permissions and endpoints. @version 4.4.0 */
defined( 'ABSPATH' ) || exit;
if ( ! is_user_logged_in() ) { return; }
// One bounded, current-customer query through Woo's HPOS-compatible data store.
$menu = wc_get_account_menu_items();
$orders = isset( $menu['orders'] ) ? wc_get_orders( [ 'customer_id' => get_current_user_id(), 'limit' => 1, 'orderby' => 'date', 'order' => 'DESC' ] ) : [];
$order = $orders[0] ?? null;
?>
<div class="sf-account-overview">
    <?php if ( isset( $menu['orders'] ) ) : ?>
    <section class="sf-account-card sf-ui-surface sf-account-order" aria-label="<?php esc_attr_e( 'Latest order', 'codela-storefront' ); ?>">
        <header class="sf-account-card-heading">
            <h2 id="sf-recent-order"><?php esc_html_e( 'Latest order', 'codela-storefront' ); ?></h2>
            <a href="<?php echo esc_url( wc_get_account_endpoint_url( 'orders' ) ); ?>"><?php esc_html_e( 'All orders', 'codela-storefront' ); ?><?php echo codela_sf_icon( 'arrow-right' ); ?></a>
        </header>
        <?php if ( $order ) : ?>
        <div class="sf-account-order-meta">
            <span>#<?php echo esc_html( $order->get_order_number() ); ?><?php if ( $order->get_date_created() ) : ?> <span class="sf-account-muted">· <?php echo esc_html( wc_format_datetime( $order->get_date_created() ) ); ?></span><?php endif; ?></span>
            <span class="sf-account-status <?php echo $order->has_status( [ 'completed', 'processing' ] ) ? 'sf-account-status--active' : ''; ?>"><?php echo esc_html( wc_get_order_status_name( $order->get_status() ) ); ?></span>
        </div>
        <?php $items = $order->get_items(); $item = reset( $items ); if ( $item ) : $product = $item->get_product(); ?>
        <div class="sf-account-order-item">
            <?php echo $product ? $product->get_image( 'woocommerce_thumbnail', [ 'class' => 'sf-account-order-image', 'loading' => 'lazy', 'alt' => '' ] ) : wc_placeholder_img( 'woocommerce_thumbnail', [ 'class' => 'sf-account-order-image', 'alt' => '' ] ); ?>
            <div><strong><?php echo esc_html( $item->get_name() ); ?></strong><span class="sf-account-muted"><?php printf( esc_html__( 'Quantity: %s', 'codela-storefront' ), esc_html( $item->get_quantity() ) ); ?></span>
                <?php if ( count( $items ) > 1 ) : ?><span class="sf-account-muted"><?php printf( esc_html__( '%s more items', 'codela-storefront' ), esc_html( count( $items ) - 1 ) ); ?></span><?php endif; ?>
            </div>
        </div>
        <?php endif; ?>
        <div class="sf-account-order-total"><span><?php esc_html_e( 'Total', 'woocommerce' ); ?></span><strong><?php echo wp_kses_post( $order->get_formatted_order_total() ); ?></strong></div>
        <div class="sf-account-order-action"><?php echo codela_sf_ui_button( __( 'View order', 'codela-storefront' ), [ 'href' => $order->get_view_order_url() ] ); ?></div>
        <?php else : ?>
        <div class="sf-account-empty-state"><?php echo codela_sf_icon( 'shopping-bag' ); ?><div><p class="sf-account-empty"><?php esc_html_e( 'You have no orders yet.', 'codela-storefront' ); ?></p>
        <p class="sf-account-muted"><?php esc_html_e( 'Your first order will appear here.', 'codela-storefront' ); ?></p>
        <?php echo codela_sf_ui_button( __( 'Browse products', 'codela-storefront' ), [ 'href' => wc_get_page_permalink( 'shop' ), 'variant' => 'secondary', 'icon' => 'arrow-right' ] ); ?>
        </div></div>
        <?php endif; ?>
    </section>
    <?php endif; ?>

</div>
<?php
// Preserve independent Codela/third-party module output at native hooks.
do_action( 'woocommerce_account_dashboard' );
do_action( 'woocommerce_before_my_account' );
do_action( 'woocommerce_after_my_account' );

