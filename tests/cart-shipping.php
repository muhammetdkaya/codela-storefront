<?php
// Contract tests for the theme adapter. The Codela plugin itself is unchanged.
namespace Codela\Modules\FreeShippingBar {
    class Module {
        public function __construct($loader) {}
        public function get_settings(): array {
            return ['show_cart' => $GLOBALS['show_cart'] ?? 1];
        }
        public function render_cart(): void {
            echo '<div class="cdl-fsb cdl-fsb--cart">Plugin-rendered bar</div>';
        }
    }
}
namespace Automattic\WooCommerce\StoreApi\Schemas\V1 {
    class CartSchema { public const IDENTIFIER = 'cart'; }
}
namespace {
    define('ABSPATH', __DIR__);
    if (!defined('ARRAY_A')) define('ARRAY_A', 'ARRAY_A');
    function add_action($name, $callback, $priority = 10) { $GLOBALS['actions'][$name] = $callback; }
    function codela_is_module_active($slug) { return $slug === 'free-shipping-bar' && ($GLOBALS['active'] ?? false); }
    function woocommerce_store_api_register_endpoint_data($args) { $GLOBALS['registrations'][] = $args; }
    function __($message, $domain = '') { return $message; }
    function assertTrue($condition, $why) { if (!$condition) { throw new \RuntimeException($why); } }

    require __DIR__ . '/../theme/codela-storefront/inc/cart-shipping.php';

    assertTrue(isset($GLOBALS['actions']['init']) && isset($GLOBALS['actions']['woocommerce_blocks_loaded']), 'Both registration paths are available');
    codela_sf_register_cart_shipping_extension();
    codela_sf_register_cart_shipping_extension();
    assertTrue(count($GLOBALS['registrations']) === 1, 'Endpoint registered once');
    $extension=$GLOBALS['registrations'][0];
    assertTrue($extension['namespace'] === 'codela-storefront-shipping', 'Extension belongs to theme');
    assertTrue($extension['endpoint'] === 'cart', 'Uses WooCommerce native cart schema');
    assertTrue($extension['schema_callback']()['html']['type'] === 'string', 'Exposes HTML as string');

    $GLOBALS['active'] = false;
    assertTrue($extension['data_callback']()['html'] === '', 'Disabled plugin renders nothing');
    $GLOBALS['active'] = true;
    $GLOBALS['show_cart'] = 0;
    assertTrue($extension['data_callback']()['html'] === '', 'Disabled cart toggle renders nothing');
    $GLOBALS['show_cart'] = 1;
    assertTrue(str_contains($extension['data_callback']()['html'], 'Plugin-rendered bar'), 'Uses the original plugin renderer');
    echo "Theme-only shipping integration PHP contracts passed\n";
}
