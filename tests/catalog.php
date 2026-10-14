<?php
// Verify native template reuse and nested WP/Woo context restoration.
define( 'ABSPATH', __DIR__ );
class WC_Product {
    public function __construct( private int $id, private bool $visible = true ) {}
    public function get_id() { return $this->id; }
    public function is_visible() { return $this->visible; }
}
function wc_setup_loop( $props ) { $GLOBALS['woocommerce_loop'] = $props; }
function add_action( ...$args ) {}
function add_filter( ...$args ) {}
function is_front_page() { return $GLOBALS['front_page'] ?? false; }
function doing_action( $name ) { return $GLOBALS['in_card_image'] ?? false; }
function do_action( $name ) { $GLOBALS['called'][] = $name; }
function woocommerce_product_loop_start() { echo '<ul class="products">'; }
function woocommerce_product_loop_end() { echo '</ul>'; }
function get_post( $id ) { return (object) [ 'ID' => $id ]; }
function setup_postdata( $post ) { $GLOBALS['setup_id'] = $post->ID; }
function wc_get_template_part( $slug, $name ) {
    if ( ! empty( $GLOBALS['throw_template'] ) ) { throw new RuntimeException( 'extension failure' ); }
    if ( 'content' !== $slug || 'product' !== $name ) { throw new RuntimeException( 'Wrong native template' ); }
    if ( $GLOBALS['product']->get_id() !== $GLOBALS['post']->ID ) { throw new RuntimeException( 'Mismatched product/post' ); }
    echo '<li class="product" data-id="' . $GLOBALS['product']->get_id() . '"></li>';
}
function get_query_var( $name ) { return $GLOBALS['query_vars'][$name] ?? ''; }
function wc_get_product( $id ) { return new WC_Product( $id ); }
function get_search_query() { return '<red & blue>'; }
function esc_html__( $s, ...$args ) { return htmlspecialchars( $s, ENT_QUOTES ); }
function esc_html( $s ) { return htmlspecialchars( $s, ENT_QUOTES ); }
function do_blocks( $s ) { return 'core-query-fallback'; }
function check( $value, $message ) { if ( ! $value ) { throw new RuntimeException( $message ); } }
require __DIR__ . '/../theme/codela-storefront/inc/catalog.php';
$post = (object) [ 'ID' => 99 ]; $product = new WC_Product( 99 );
$woocommerce_loop = [ 'name' => 'outer-loop', 'loop' => 6 ];
$previous_post = $post; $previous_product = $product; $previous_loop = $woocommerce_loop;
$html = codela_sf_product_grid( [ new WC_Product(1), new WC_Product(2,false), new WC_Product(3) ] );
check( substr_count( $html, 'class="product"' ) === 2, 'Visible products use native template' );
check( $post === $previous_post && $product === $previous_product && $woocommerce_loop === $previous_loop && $setup_id === 99, 'Nested context restored' );
$level = ob_get_level(); $throw_template = true;
try { codela_sf_product_grid( [new WC_Product(4)] ); throw new LogicException('Expected template error'); }
catch ( RuntimeException $e ) { check( $e->getMessage() === 'extension failure', 'Original extension failure preserved' ); }
check( ob_get_level() === $level && $post === $previous_post && $product === $previous_product && $woocommerce_loop === $previous_loop, 'Exception restores output buffer and globals' );
$throw_template = false;
$query_vars = ['post_type'=>'product','posts_per_page'=>12,'paged'=>2];
$wp_query = (object) ['posts'=>[(object)['ID'=>5]],'found_posts'=>25,'max_num_pages'=>3];
$search = codela_sf_search_results();
check( str_contains( $search, '&lt;red &amp; blue&gt;' ) && str_contains( $search, 'data-id="5"' ), 'Product search escapes heading and uses native card' );
check( in_array('woocommerce_before_shop_loop',$called,true) && in_array('woocommerce_after_shop_loop',$called,true), 'Native toolbar/pagination hooks retained' );
$query_vars = ['post_type'=>'post'];
check( codela_sf_search_results() === 'core-query-fallback', 'Editorial searches keep core Query' );
$front_page = true; $in_card_image = true;
check( codela_sf_catalog_image_attributes(['fetchpriority'=>'high']) === ['loading'=>'lazy','decoding'=>'async'], 'Home cards stay deferred' );
$in_card_image = false;
check( codela_sf_catalog_image_attributes(['fetchpriority'=>'high']) === ['fetchpriority'=>'high'], 'Hero priority remains unchanged' );
echo "Shared native catalog context, error recovery and search boundaries passed.\n";
