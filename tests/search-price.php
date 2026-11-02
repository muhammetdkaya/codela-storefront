<?php
/** Run the real theme adapter and WordPress KSES; the plugin boundary is a fixture. */
define( 'ABSPATH', __DIR__ );
$hooks = [];
function add_filter( $name, $callback, $priority = 10, $args = 1 ) { $GLOBALS['hooks'][$name][$priority][] = $callback; }
function remove_filter( $name, $callback, $priority = 10 ) {
    foreach ( $GLOBALS['hooks'][$name][$priority] ?? [] as $i => $item ) {
        if ( $callback === $item ) { unset( $GLOBALS['hooks'][$name][$priority][$i] ); }
    }
}
function apply_filters( $name, $value, ...$args ) {
    $groups = $GLOBALS['hooks'][$name] ?? []; ksort( $groups );
    foreach ( $groups as $group ) { foreach ( $group as $callback ) { $value = $callback( $value, ...$args ); } }
    return $value;
}
function wp_allowed_protocols() { return ['http','https']; }
function check( $value, $message ) { if ( ! $value ) { throw new RuntimeException( $message ); } }
class WP_REST_Request {
    public function __construct( private string $route = '/codela/v1/theme/search', private string $method = 'GET' ) {}
    public function get_route() { return $this->route; }
    public function get_method() { return $this->method; }
}
class WP_REST_Response {
    public array $headers = ['Cache-Control'=>'no-store, private'];
    public function __construct( private $data, private int $status = 200 ) {}
    public function get_data() { return $this->data; }
    public function set_data( $data ) { $this->data = $data; }
    public function get_status() { return $this->status; }
}
class ProductPriceFixture {
    public int $calls = 0;
    public function __construct( private int $id, private string $html ) {}
    public function get_id() { return $this->id; }
    public function get_price_html() { ++$this->calls; return apply_filters( 'woocommerce_get_price_html', $this->html, $this ); }
}
function wc_get_product() { throw new RuntimeException('Search presentation must not query products again'); }
$core = getenv('WP_CORE_INCLUDES');
check( $core && is_file( $core . '/kses.php' ), 'Set WP_CORE_INCLUDES to WordPress 6.5 wp-includes' );
require $core . '/kses.php';
require __DIR__ . '/../theme/codela-storefront/inc/search.php';
$handler = ['callback'=>'codela_theme_search'];
$request = new WP_REST_Request();
$range = '<span class="woocommerce-Price-amount amount" aria-hidden="true"><bdi><span class="woocommerce-Price-currencySymbol">₺</span>1.290,00</bdi></span> <span aria-hidden="true">&ndash;</span> <span class="woocommerce-Price-amount amount" aria-hidden="true"><bdi><span class="woocommerce-Price-currencySymbol">₺</span>1.590,00</bdi></span><span class="screen-reader-text">Fiyat aralığı: ₺1.290,00 - ₺1.590,00</span>';
$sale = '<del aria-hidden="true"><bdi>€40,00</bdi></del><span class="screen-reader-text">Original price was: €40,00.</span> <ins aria-hidden="true"><bdi>€30,00</bdi></ins><span class="screen-reader-text">Current price is: €30,00.</span> <small class="woocommerce-price-suffix">incl. VAT</small>';
$inputs = [$range,$sale,'<bdi>₺200,00</bdi> <small class="woocommerce-price-suffix">KDV dahil</small>','', '<img src=x onerror="alert(1)"><span class="amount" onclick="alert(2)" style="position:fixed">₺15</span>'];
apply_filters( 'rest_request_before_callbacks', null, $handler, $request );
$products = []; $items = [];
foreach ( $inputs as $i => $html ) {
    $product = new ProductPriceFixture( $i+1, $html ); $products[] = $product;
    $items[] = ['id'=>$i+1,'price'=>strip_tags($product->get_price_html()),'name'=>'Ürün &amp; örnek','image'=>'https://search.test/photo.svg','url'=>'https://search.test/product/'.$i,'sku'=>'SKU-'.$i];
}
$response = new WP_REST_Response($items);
$actual = apply_filters('rest_request_after_callbacks',$response,$handler,$request);
check($actual === $response && $actual->headers === ['Cache-Control'=>'no-store, private'], 'Original response and private caching retained');
$data = $actual->get_data();
foreach($data as $i=>$item) { check($item['price'] === $items[$i]['price'] && $products[$i]->calls === 1, 'Existing plain price and single calculation retained'); }
check($data[0]['price_html'] === $range && $data[1]['price_html'] === $sale, 'Localized native range, sale and accessible descriptions preserved');
check($data[3]['price_html'] === '', 'No invented price for empty amount');
check($data[4]['price_html'] === '<span class="amount">₺15</span>', 'Real KSES rejects images, handlers and style attributes');
check(empty($GLOBALS['codela_sf_search_prices']) && empty($hooks['woocommerce_get_price_html'][PHP_INT_MAX]), 'Capture released after response');
foreach([new WP_REST_Request('/other'),new WP_REST_Request('/codela/v1/theme/search','POST')] as $other) {
    apply_filters('rest_request_before_callbacks',null,$handler,$other);
    check(empty($GLOBALS['codela_sf_search_prices']), 'Other routes/methods unchanged');
    check(apply_filters('rest_request_after_callbacks',$response,$handler,$other) === $response, 'Unrelated response identity');
}
apply_filters('rest_request_before_callbacks',null,['callback'=>'other'],$request);
check(empty($GLOBALS['codela_sf_search_prices']), 'Replaced endpoint callbacks not intercepted');
apply_filters('rest_request_before_callbacks',null,$handler,$request);
$error = new WP_REST_Response(['code'=>'failed'],500);
check(apply_filters('rest_request_after_callbacks',$error,$handler,$request) === $error && empty($GLOBALS['codela_sf_search_prices']), 'Error cleanup preserves error');
// A later request must never borrow a preceding customer's captured price.
apply_filters('rest_request_before_callbacks',null,$handler,$request);
$uncaptured = new WP_REST_Response($items);
apply_filters('rest_request_after_callbacks',$uncaptured,$handler,$request);
check(!isset($uncaptured->get_data()[0]['price_html']), 'No cross-request price reuse');
echo in_array('--json',$argv,true) ? json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES) : "Search price: native markup, real KSES, one calculation, request isolation and cleanup passed.\n";
