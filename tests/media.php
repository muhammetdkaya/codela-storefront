<?php
define( 'ABSPATH', __DIR__ );
$actions = []; $filters = []; $settings = []; $product_page = true;
function add_action( $hook, $callback, $priority = 10 ) { $GLOBALS['actions'][$hook][$priority][] = $callback; }
function add_filter( $hook, $callback ) { $GLOBALS['filters'][$hook] = $callback; }
function remove_action( $hook, $callback, $priority ) { $GLOBALS['removed'] = [$hook,$callback,$priority]; }
function codela_theme_settings() { return $GLOBALS['settings']; }
function is_product() { return $GLOBALS['product_page']; }
function __( $text, $domain ) { return $text; }
function get_template_directory_uri() { return '/theme'; }
function wp_register_style( ...$args ) { $GLOBALS['style'] = $args; }
function register_block_style( ...$args ) { $GLOBALS['block_style'] = $args; }
require __DIR__ . '/../theme/codela-storefront/inc/media.php';
function check( $result, $message ) { if ( ! $result ) { throw new RuntimeException( $message ); } }
foreach ($actions['after_setup_theme'][10] as $callback) { $callback(); }
check(isset($filters['woocommerce_single_product_image_gallery_classes']), 'Native gallery class hook');
check(isset($filters['woocommerce_single_product_image_thumbnail_html']), 'Accessible native image link hook');
check(codela_sf_gallery_classes(['original'])[0] === 'original', 'Existing gallery classes retained');
$options = codela_sf_gallery_options(['rtl'=>true,'animationSpeed'=>500]);
check($options['rtl'] && $options['animationSpeed'] === 500 && $options['touch'] && !$options['slideshow'], 'Native options retained, no autoplay');
foreach ([false,0,'0',''] as $value) { $settings=['product_gallery_thumbnails'=>$value];check(codela_sf_gallery_options([])['controlNav']===false, 'Thumbnail setting'); }
foreach ($actions['init'][10] as $callback) { $callback(); }
check($block_style[0] === 'core/gallery' && $block_style[1]['style_handle'] === $style[0], 'Reusable native gallery style');
foreach ($actions['wp'][10] as $callback) { $callback(); }
check($removed === ['woocommerce_before_main_content','woocommerce_breadcrumb',20], 'Product breadcrumb removed');
check(!in_array('woocommerce_breadcrumb',$actions['woocommerce_single_product_summary'][1] ?? [],true), 'Product breadcrumb is not reinserted');
unset($GLOBALS['removed']);$product_page=false;
foreach ($actions['wp'][10] as $callback) { $callback(); }
check(!isset($GLOBALS['removed']), 'Non-product breadcrumb unchanged');
echo "Media adapters and settings passed.\n";

// Product composition uses native Woo hooks, only on the product document.
$product_page=true;
require __DIR__ . '/../theme/codela-storefront/inc/product.php';
$callbacks=$actions['wp'][10];$callbacks[count($callbacks)-1]();
ob_start();$actions['woocommerce_before_add_to_cart_button'][0][0]();echo '<button type="submit">Native</button>';$actions['woocommerce_after_add_to_cart_button'][PHP_INT_MAX][0]();
check(ob_get_clean()==='<div class="sf-product-purchase"><button type="submit">Native</button></div>', 'One wrapper retains native form control');
