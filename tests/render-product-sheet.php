<?php
/** Render the production template in the browser fixture. */
define( 'ABSPATH', __DIR__ );
function add_action( ...$args ) {}
function add_filter( ...$args ) {}
function __( $text, $domain = '' ) { return $text; }
function esc_attr( $text ) { return htmlspecialchars( (string) $text, ENT_QUOTES ); }
function esc_html( $text ) { return esc_attr( $text ); }
function esc_attr_e( $text, $domain = '' ) { echo esc_attr( $text ); }
function is_product() { return true; }
function codela_sf_icon( $name ) { return '<span class="sf-icon" data-icon="' . esc_attr( $name ) . '" aria-hidden="true"></span>'; }
function wp_print_scripts( $handles ) {}
function wp_print_inline_script_tag( $script, $attributes = [] ) { echo '<script>' . $script . '</script>'; }
function sanitize_html_class( $text ) { return preg_replace( '/[^A-Za-z0-9_-]/', '', $text ); }
require __DIR__ . '/../theme/codela-storefront/inc/ui.php';
require __DIR__ . '/../theme/codela-storefront/inc/product.php';
if ( isset( $argv[1] ) && 'navigation' === $argv[1] ) {
    require __DIR__ . '/../theme/codela-storefront/inc/document-continuity.php';
    echo codela_sf_navigation_purchase_preview();
} elseif ( isset( $argv[1] ) && 'quantity' === $argv[1] ) {
    codela_sf_product_quantity_step( 'decrease' );
    echo '<input aria-label="Adet" class="qty" type="number" name="quantity" value="1" min="1" max="3" required>';
    codela_sf_product_quantity_step( 'increase' );
} elseif ( isset( $argv[1] ) && 'bootstrap' === $argv[1] ) {
    codela_sf_product_sheet_bootstrap();
} else {
    codela_sf_product_sheet_template();
}
