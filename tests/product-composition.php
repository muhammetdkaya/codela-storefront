<?php
/** Contract checks: relocate enabled callbacks without enabling modules. */
namespace Codela\Modules\LiveVisitor { class Module { public function render_counter_container() {} } }
namespace Codela\Modules\UrgencyBadge { class Module { public function render() {} } }
namespace Codela\Modules\TrustBadges { class Module { public function render() {} } }
namespace Codela\Modules\DeliveryEta { class Module { public function render() {} } }
namespace Codela\Modules\FreeShippingBar { class Module { public function render_product() {} } }
namespace Codela\Modules\WhatsappButton { class Module { public function render_product() {} public function render_floating() {} } }
namespace {
define( 'ABSPATH', __DIR__ );
class WP_Hook { public $callbacks = []; }
$wp_filter = []; $actions = []; $styles = []; $product_page = true;
function add_action( $hook, $callback, $priority = 10, $args = 1 ) {
    global $wp_filter;
    $wp_filter[$hook] = $wp_filter[$hook] ?? new WP_Hook();
    $wp_filter[$hook]->callbacks[$priority][] = [ 'function' => $callback, 'accepted_args' => $args ];
}
function remove_action( $hook, $callback, $priority = 10 ) {
    global $wp_filter;
    foreach ( $wp_filter[$hook]->callbacks[$priority] ?? [] as $key => $entry ) {
        if ( $entry['function'] === $callback ) { unset( $wp_filter[$hook]->callbacks[$priority][$key] ); }
    }
}
function add_filter( ...$args ) { add_action( ...$args ); }
function is_product() { global $product_page; return $product_page; }
function wp_dequeue_style( $handle ) { global $styles; $styles[] = $handle; }
function check( $condition, $message ) { if ( ! $condition ) { throw new \RuntimeException( $message ); } }
function entries( $hook, $priority ) { global $wp_filter; return array_values( $wp_filter[$hook]->callbacks[$priority] ?? [] ); }
require __DIR__ . '/../theme/codela-storefront/inc/product.php';
$lv = new \Codela\Modules\LiveVisitor\Module();
$stock = new \Codela\Modules\UrgencyBadge\Module();
$trust = new \Codela\Modules\TrustBadges\Module();
$eta = new \Codela\Modules\DeliveryEta\Module();
$shipping = new \Codela\Modules\FreeShippingBar\Module();
$contact = new \Codela\Modules\WhatsappButton\Module();
$foreign = static function() {};
foreach ( [ [$lv,'render_counter_container'],[$stock,'render'],[$trust,'render'],[$eta,'render'],[$shipping,'render_product'],[$contact,'render_product'] ] as $callback ) {
    add_action( 'woocommerce_single_product_summary', $callback, 26, 2 );
}
add_action( 'woocommerce_single_product_summary', $foreign, 26 );
add_action( 'wp_footer', [$contact,'render_floating'], 10 );
codela_sf_product_modules();
check( count(entries('woocommerce_product_thumbnails',30)) === 1, 'One gallery counter' );
check( entries('woocommerce_single_product_summary',11)[0]['function'] === [$stock,'render'], 'Original stock instance beside price' );
check( entries('woocommerce_single_product_summary',36)[0]['function'] === [$trust,'render'], 'Original trust instance in summary after contact, retained by mobile adapter' );
check( entries('woocommerce_single_product_summary',32)[0]['function'] === [$eta,'render'], 'Original ETA instance' );
check( entries('woocommerce_single_product_summary',33)[0]['function'] === [$shipping,'render_product'], 'Original live shipping instance' );
check( entries('woocommerce_single_product_summary',33)[0]['accepted_args'] === 2, 'Callback argument contract retained' );
check( count(entries('woocommerce_single_product_summary',35)) === 1, 'One contact renderer' );
check( count(entries('wp_footer',10)) === 1, 'Optional floating link not duplicated' );
check( count(entries('woocommerce_single_product_summary',26)) === 1 && entries('woocommerce_single_product_summary',26)[0]['function'] === $foreign, 'Unrelated extension hook remains' );
$wp_filter['woocommerce_single_product_summary'] = new WP_Hook();
$wp_filter['woocommerce_product_thumbnails'] = new WP_Hook();
$wp_filter['woocommerce_after_single_product_summary'] = new WP_Hook();
$wp_filter['wp_footer'] = new WP_Hook();
codela_sf_product_modules();
check( count(entries('woocommerce_product_thumbnails',30)) === 0 && count(entries('woocommerce_after_single_product_summary',12)) === 0, 'Disabled modules never instantiated or rendered' );
codela_sf_product_module_styles();
check( count($styles) === 7 && in_array('codela-free-shipping-bar',$styles,true), 'Default product module paint removed' );
$styles=[]; $product_page=false;
codela_sf_product_module_styles();
check( !$styles, 'Cart, checkout, other themes/pages untouched' );
echo "Product composition: enabled callback ownership, no duplicates, disabled modules and CSS isolation passed.\n";
}
