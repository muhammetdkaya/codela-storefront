<?php
// Verify native template reuse and nested WP/Woo context restoration.
define( 'ABSPATH', __DIR__ );
class WC_Product {
    public function __construct( private int $id, private bool $visible = true, private string $type = 'simple', private bool $stock = true, private bool $purchasable = true ) {}
    public function add_to_cart_text() { return $this->type === 'variable' ? 'Options' : 'Add'; }
    public function get_id() { return $this->id; }
    public function is_visible() { return $this->visible; }
    public function is_type( $type ) { return $this->type === $type; }
    public function is_in_stock() { return $this->stock; }
    public function is_purchasable() { return $this->purchasable; }
}
function wc_setup_loop( $props ) { $GLOBALS['woocommerce_loop'] = $props; }
function add_action( ...$args ) { $GLOBALS['actions'][] = $args; }
function remove_action( ...$args ) { $GLOBALS['removed'][] = $args; }
function woocommerce_template_loop_price() { echo '<span class="price">Native price</span>'; }
function is_account_page() { return $GLOBALS['account'] ?? false; }
function is_user_logged_in() { return $GLOBALS['signed_in'] ?? false; }
function __( $s, ...$args ) { return $s; }
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
function codela_sf_icon($name) { return '<img class="sf-icon" alt="" src="'.$name.'.svg">'; }
require __DIR__ . '/../theme/codela-storefront/inc/ui.php';
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

codela_sf_catalog_layout();
check( in_array(['woocommerce_after_shop_loop_item_title','woocommerce_template_loop_price',10],$removed,true), 'Price moved using native hook, not a replacement card' );
check( in_array(['woocommerce_after_shop_loop_item','codela_sf_catalog_footer_open',6],$actions,true), 'Footer opens after native link closes' );
ob_start();codela_sf_catalog_footer_open();echo 'Native Woo action';codela_sf_catalog_footer_close();$footer=ob_get_clean();
check( $footer === '<div class="sf-product-card-footer"><span class="price">Native price</span>Native Woo action</div>', 'Native price and action share one footer' );
$args=['class'=>'button ajax_add_to_cart','quantity'=>1,'attributes'=>['aria-label'=>'Add real product','data-product_id'=>42]];
$adapted=codela_sf_catalog_button_args($args,new WC_Product(42));
check( str_contains($adapted['class'],implode(' ',codela_sf_ui_icon_button_classes('soft'))) && str_contains($adapted['class'],'ajax_add_to_cart') && $adapted['attributes']===$args['attributes'] && $adapted['quantity']===1, 'Shared Button classes preserve native AJAX and accessible attributes' );
check( codela_sf_catalog_button_text('Native',new WC_Product(1))==='Add', 'Simple action is compact' );
check( codela_sf_catalog_button_text('Native',new WC_Product(1,true,'variable'))==='Options', 'Variable action keeps a distinct options label' );
check( codela_sf_catalog_button_text('Visit partner',new WC_Product(1,true,'external'))==='Visit partner', 'External native action preserved' );
check( codela_sf_catalog_button_visibility('<a>Read more</a>',new WC_Product(1,true,'simple',false))==='', 'No misleading out-of-stock action' );
ob_start();$product=new WC_Product(1,true,'simple',false);codela_sf_catalog_stock_label();$stock=ob_get_clean();
check( str_contains($stock,'sf-product-stock') && str_contains($stock,'Out of stock'), 'Out-of-stock badge retained' );
$native='<a class="button ajax_add_to_cart" href="/?add-to-cart=42" data-product_id="42" aria-label="Add product">Add</a><span>Extension</span>';
$adapted_html=codela_sf_catalog_button_visibility($native,new WC_Product(42));
check(str_contains($adapted_html,codela_sf_ui_icon_button_content('shopping-bag')) && str_contains($adapted_html,'<span class="screen-reader-text">Add</span>') && str_contains($adapted_html,'data-product_id="42" aria-label="Add product"') && str_ends_with($adapted_html,'<span>Extension</span>'),'Native anchor attributes, accessible name and extensions preserved');
check(str_contains(codela_sf_catalog_button_args($args,new WC_Product(42,true,'external'))['class'],'sf-ui-button--secondary'),'External action stays a text Button');
$account=true;$signed_in=true;$before=count($actions);codela_sf_catalog_layout();
check(count($actions)===$before && codela_sf_catalog_button_args($args,new WC_Product(42))===$args && codela_sf_catalog_button_text('Native',new WC_Product(1))==='Native' && codela_sf_catalog_button_visibility('Original',new WC_Product(1,true,'simple',false))==='Original', 'Plugin-owned signed-in account remains untouched' );
echo "Native catalog footer, stock/action semantics and shared Button reuse passed.\n";

function is_admin() { return false; }
function get_object_taxonomies($type) { return ['product_cat','product_tag']; }
$query = new class {
    public function is_main_query() { return true; }
    public function is_post_type_archive($type) { return true; }
    public function is_tax($taxonomies) { return false; }
};
$_GET = ['min_price'=>'10','max_price'=>'','orderby'=>'price'];
codela_sf_catalog_empty_bounds($query);
check($_GET === ['min_price'=>'10','orderby'=>'price'], 'No-JS empty max is unbounded, not a zero-price cap');
$_GET = ['min_price'=>'0','max_price'=>'0'];
codela_sf_catalog_empty_bounds($query);
check($_GET === ['min_price'=>'0','max_price'=>'0'], 'Explicit zero remains a real price bound');
