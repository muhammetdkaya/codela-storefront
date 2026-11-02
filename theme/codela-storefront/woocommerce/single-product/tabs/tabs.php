<?php
/**
 * Native Woo tab callbacks in accessible disclosure sections.
 * @version 9.8.0
 * Woo owns content/reviews and extension tabs; no cloned forms or tab JS.
 */
defined( 'ABSPATH' ) || exit;
$state =& codela_sf_product_information_state();
$product_tabs = $state['tabs'];
if ( empty( $product_tabs ) ) { return; }
?>
<div class="sf-product-information">
    <?php foreach ( $product_tabs as $key => $tab ) : ?>
        <?php if ( 'description' === $key && $state['description_rendered'] ) : ?>
            <span hidden data-sf-description-home></span>
        <?php else : ?>
            <?php codela_sf_product_information_section( (string) $key, $tab ); ?>
        <?php endif; ?>
    <?php endforeach; ?>
    <?php do_action( 'woocommerce_product_after_tabs' ); ?>
</div>
