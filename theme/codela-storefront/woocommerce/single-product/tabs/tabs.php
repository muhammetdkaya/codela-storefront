<?php
/**
 * Native Woo tab callbacks in accessible disclosure sections.
 * @version 9.8.0
 * Woo owns content/reviews and extension tabs; no cloned forms or tab JS.
 */
defined( 'ABSPATH' ) || exit;
$product_tabs = apply_filters( 'woocommerce_product_tabs', [] );
if ( empty( $product_tabs ) ) { return; }
?>
<div class="sf-product-information">
    <?php foreach ( $product_tabs as $key => $tab ) : ?>
        <details class="sf-product-information-section" id="sf-product-section-<?php echo esc_attr( $key ); ?>" <?php echo 'description' === $key ? 'open' : ''; ?>>
            <summary><?php echo wp_kses_post( apply_filters( 'woocommerce_product_' . $key . '_tab_title', $tab['title'], $key ) ); ?></summary>
            <div class="sf-product-information-content" id="tab-<?php echo esc_attr( $key ); ?>">
                <?php
                // The dedicated action scopes heading suppression to this
                // component; callback args and third-party tabs stay native.
                if ( isset( $tab['callback'] ) && is_callable( $tab['callback'] ) ) {
                    $render_tab = static function() use ( $tab, $key ) { call_user_func( $tab['callback'], $key, $tab ); };
                    add_action( 'codela_sf_product_information', $render_tab );
                    do_action( 'codela_sf_product_information' );
                    remove_action( 'codela_sf_product_information', $render_tab );
                }
                ?>
            </div>
        </details>
    <?php endforeach; ?>
    <?php do_action( 'woocommerce_product_after_tabs' ); ?>
</div>
