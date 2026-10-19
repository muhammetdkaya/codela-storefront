<?php
// Render the real PHP header with deterministic WP/Woo boundary stubs.
// This is a DOM contract fixture, not a substitute for full WordPress integration.
define('ABSPATH', __DIR__);
class Walker_Nav_Menu {
    public function start_el(&$output,$item,$depth=0,$args=null,$current_object_id=0) {
        $output .= '<li class="'.esc_attr(implode(' ',$item->classes)).'"><a class="sf-ui-pressable" href="'.esc_url($item->url).'"'.(in_array('current-menu-item',$item->classes,true)?' aria-current="page"':'').'>'.esc_html($item->title).'</a>';
    }
}
function codela_sf_ready() { return true; }
function codela_theme_settings() { return ['menu_id'=>0, 'brand'=>'CODELA'] + (getenv('FIXTURE_DOCK') === false ? [] : ['mobile_dock_enabled'=>getenv('FIXTURE_DOCK')]); }
function __( $s, ...$args ) { return $s; }
function esc_html__( $s, ...$args ) { return htmlspecialchars($s, ENT_QUOTES); }
function esc_html_e( $s, ...$args ) { echo esc_html__($s); }
function esc_attr_e( $s, ...$args ) { echo esc_html__($s); }
function esc_attr( $s ) { return esc_html__($s); }
function sanitize_html_class( $value ) { return preg_replace('/[^A-Za-z0-9_-]/', '', (string)$value); }
function esc_html( $s ) { return esc_html__($s); }
function esc_url( $s ) { return esc_html__($s); }
function esc_url_raw( $s ) { return $s; }
function absint( $n ) { return abs((int)$n); }
function get_nav_menu_locations() { return []; }
function get_template_directory_uri() { return 'https://store.test/theme'; }
function home_url( $s ) { return 'https://store.test'.$s; }
function wc_get_page_permalink( $s ) { return home_url('/'.$s.'/'); }
function wc_get_cart_url() { return home_url('/cart/'); }
function wc_get_checkout_url() { return home_url('/checkout/'); }
function rest_url( $s ) { return home_url('/wp-json/'.$s); }
function wp_interactivity_state( ...$args ) {}
function get_option( ...$args ) { return ''; }
function get_bloginfo( ...$args ) { return 'CODELA'; }
function has_custom_logo() { return false; }
function is_product() { return getenv('FIXTURE_PRODUCT') === '1'; }
function is_checkout() { return getenv('FIXTURE_CHECKOUT') === '1'; }
function is_front_page() { return getenv('FIXTURE_ACCOUNT') !== '1' && getenv('FIXTURE_GUEST_ACCOUNT') !== '1'; }
function is_account_page() { return getenv('FIXTURE_ACCOUNT') === '1' || getenv('FIXTURE_GUEST_ACCOUNT') === '1'; }
function is_user_logged_in() { return getenv('FIXTURE_ACCOUNT') === '1' && getenv('FIXTURE_GUEST_ACCOUNT') !== '1'; }
function get_privacy_policy_url() { return ''; }
function add_query_arg( $args, $url ) { return $url.'?'.http_build_query($args); }
function get_terms( ...$args ) { return [(object)['parent'=>0,'term_id'=>1,'name'=>'Collection','count'=>3],(object)['parent'=>1,'term_id'=>2,'name'=>'Shoes','count'=>2]]; }
function get_term_link( $term ) { return home_url('/category/'.$term->term_id.'/'); }
function is_wp_error( ...$args ) { return false; }
function add_action(...$args) {}
function wc_get_template( $name ) {
    if ( $name !== 'myaccount/form-login.php' ) { throw new RuntimeException('Unexpected template'); }
    echo '<div class="sf-account-intro"><h1>My account</h1><div class="sf-auth-tabs" hidden></div></div>';
    echo '<div class="woocommerce"><form class="woocommerce-form woocommerce-form-login" method="post">'
        . '<p class="woocommerce-form-row form-row"><label for="test-login-username">Email address</label><input id="test-login-username" class="input-text" type="email" name="username"></p>'
        . '<p class="woocommerce-form-row form-row"><label for="test-login-password">Password</label><span class="password-input"><input id="test-login-password" class="input-text" type="password" name="password"></span></p>'
        . '<p class="form-row"><label class="woocommerce-form-login__rememberme"><input type="checkbox" name="rememberme">Remember me</label><button type="submit" name="login">Log in</button></p>'
        . '<p class="woocommerce-LostPassword lost_password"><a href="/account/lost-password/">Lost password?</a></p>'
        . '</form></div>';
}
require __DIR__.'/../theme/codela-storefront/inc/account.php';
if (getenv('FIXTURE_CATALOG')) { require __DIR__.'/catalog-filter-fixture.php'; }
require __DIR__.'/../theme/codela-storefront/inc/render.php';
echo codela_sf_header();

function has_nav_menu($location){return getenv('FIXTURE_MENU') === '1';}
function wp_nav_menu($args){
    $desktop = $args['menu_class'] === 'sf-desktop-menu';
    $walker = $args['walker'] ?? new Walker_Nav_Menu();
    $items = '';
    $labels = ['Mağaza','Yeni koleksiyon','Hakkımızda','İletişim','Uzun kategori başlığı örneği','Diğer ürünler','Üst kategori'];
    foreach ($labels as $i=>$label) {
        $item = (object)['ID'=>$i+1,'title'=>$label,'url'=>$i===0?'/shop/':($i===6?'/parent/':'/category/7/'),'classes'=>$i===0?['current-menu-item']:($i===6?['menu-item-has-children']:[])];
        $walker->start_el($items,$item,0,(object)$args);
        if ($i===6) {
            if($desktop)$walker->start_lvl($items,0,(object)$args);else $items.='<ul class="sub-menu">';
            $walker->start_el($items,(object)['ID'=>8,'title'=>'Alt kategori','url'=>'/nested/','classes'=>[]],1,(object)$args);
            $items.='</li></ul>';
        }
        $items.='</li>';
    }
    return '<ul id="'.$args['menu_id'].'" class="'.$args['menu_class'].'">'.$items.'</ul>';
}
