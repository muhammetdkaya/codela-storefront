<?php
/** Deterministic native-template boundary; full WP/Woo acceptance is separate. */
define( 'ABSPATH', __DIR__ );
$GLOBALS['filters'] = [];
function add_action( ...$args ) {}
function add_filter( $name, $fn, ...$args ) { $GLOBALS['filters'][$name] = $fn; }
function __( $s, ...$args ) { return $s; }
function esc_html( $s ) { return htmlspecialchars( (string)$s, ENT_QUOTES, 'UTF-8' ); }
function esc_attr( $s ) { return esc_html( $s ); }
function esc_url( $s ) { return esc_html( $s ); }
function esc_html__( $s, ...$args ) { return esc_html( $s ); }
function esc_html_e( $s, ...$args ) { echo esc_html( $s ); }
function esc_attr_e( $s, ...$args ) { echo esc_attr( $s ); }
function wp_kses_post( $s ) { return $s; }
function is_user_logged_in() { return true; }
function apply_filters($name,$value){return $value;}
function is_account_page() { return true; }
function is_wc_endpoint_url() { return false; }
function sanitize_html_class( $s ) { return preg_replace('/[^a-zA-Z0-9_-]/', '', $s); }
function codela_sf_icon( $name ) { return '<span class="sf-icon" data-icon="'.esc_attr($name).'" aria-hidden="true"></span>'; }
function get_current_user_id() { return 42; }
function do_action( $name ) { echo '<!-- hook:'.esc_html($name).' -->'; }
function wc_get_account_menu_items() { return ['dashboard'=>'Overview','orders'=>'Orders','edit-address'=>'Addresses','edit-account'=>'Account details','privacy'=>'Privacy choices','customer-logout'=>'Log out']; }
function wc_is_current_account_menu_item( $endpoint ) { return $endpoint === 'dashboard'; }
function wc_get_account_menu_item_classes( $endpoint ) { return 'woocommerce-MyAccount-navigation-link woocommerce-MyAccount-navigation-link--'.$endpoint.($endpoint==='dashboard'?' is-active':''); }
function wc_get_account_endpoint_url( $endpoint ) { return '/account/'.$endpoint.'/'.($endpoint==='customer-logout'?'?_wpnonce=native':''); }
function wc_get_page_id( $page ) { return 8; }
function wc_get_page_permalink( $page ) { return '/'.$page.'/'; }
function wc_format_datetime( $date ) { return '19 October 2026'; }
function wc_get_order_status_name( $status ) { return $status; }
function wc_placeholder_img( ...$args ) { return '<img class="sf-account-order-image" width="300" height="300" alt="" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3C/svg%3E">'; }
class FixtureOrderItem {
 function get_product(){return false;}
 function get_name(){return '<Test product with a very long title & characters>';}
 function get_quantity(){return 2;}
}
class FixtureOrder {
 function get_order_number(){return '1048';}
 function get_date_created(){return true;}
 function get_status(){return getenv('ACCOUNT_CANCELLED')?'cancelled':'processing';}
 function has_status($statuses){return in_array($this->get_status(),$statuses,true);}
 function get_items(){return [new FixtureOrderItem(),new FixtureOrderItem()];}
 function get_formatted_order_total(){return '<span class="amount">1,980.00 TL</span>';}
 function get_view_order_url(){return '/account/view-order/1048/';}
}
function wc_get_orders($args){
 if($args !== ['customer_id'=>42,'limit'=>1,'orderby'=>'date','order'=>'DESC'])throw new RuntimeException('Query must be bounded to the signed-in customer');
 return getenv('ACCOUNT_EMPTY')?[]:[new FixtureOrder()];
}
require __DIR__.'/../theme/codela-storefront/inc/ui.php';
require __DIR__.'/../theme/codela-storefront/inc/account.php';
if(($GLOBALS['filters']['render_block_core/post-title'])('<h1>My account</h1>',[],(object)['context'=>['postId'=>8]])!=='')throw new RuntimeException('No duplicate signed-in title');
if(in_array('sf-account-dashboard',($GLOBALS['filters']['body_class'])([]),true)!==true)throw new RuntimeException('Dashboard scope');
echo '<div class="woocommerce">';
require __DIR__.'/../theme/codela-storefront/woocommerce/myaccount/navigation.php';
echo '<div class="woocommerce-MyAccount-content">';
if(getenv('ACCOUNT_ORDERS_EMPTY')){ $has_orders=false; require __DIR__.'/../theme/codela-storefront/woocommerce/myaccount/orders.php'; }else{ require __DIR__.'/../theme/codela-storefront/woocommerce/myaccount/dashboard.php'; }
echo '</div></div>';
