<?php
/** Actual WP dependency/printing classes; only the surrounding site is a fixture.
 * WP_CORE_INCLUDES points to wp-includes from WordPress 6.5 or later.
 */
define( 'ABSPATH', __DIR__ );
define( 'CODELA_VERSION', '1.2.3' );
define( 'CODELA_THEME_API_VERSION', '1.0.0' );
define( 'WC_VERSION', '9.0.0' );
define( 'SCRIPT_DEBUG', getenv( 'SF_ASSET_DEBUG' ) === '1' );
$context = getenv( 'SF_ASSET_CONTEXT' ) ?: 'home';
$hooks = []; $fired = []; $modules = [];
function add_action($name,$callback,$priority=10,$count=1){$GLOBALS['hooks'][$name][$priority][]=$callback;}
function add_filter(...$args){}
function apply_filters($name,$value,...$args){return $value;}
function do_action($name,...$args){$GLOBALS['fired'][$name]=1;$callbacks=$GLOBALS['hooks'][$name]??[];ksort($callbacks);foreach($callbacks as $group)foreach($group as $callback)$callback(...$args);}
function do_action_ref_array($name,$args){do_action($name,...$args);}
function did_action($name){return $GLOBALS['fired'][$name]??0;}
function current_filter(){return 'wp_enqueue_scripts';}
function is_admin(){return $GLOBALS['context']==='editor';}
function is_front_page(){return $GLOBALS['context']==='home';}
function is_page(){return in_array($GLOBALS['context'],['home','page','account','guest-account','checkout','cart'],true);}
function is_singular($type=''){return $type==='page'&&is_page();}
function is_home(){return false;}
function is_archive(){return false;}
function is_search(){return false;}
function is_product(){return $GLOBALS['context']==='product';}
function is_checkout(){return $GLOBALS['context']==='checkout';}
function is_cart(){return $GLOBALS['context']==='cart';}
function is_account_page(){return in_array($GLOBALS['context'],['account','guest-account'],true);}
function is_user_logged_in(){return $GLOBALS['context']==='account';}
function is_wc_endpoint_url($endpoint){return false;}
function is_rtl(){return false;}
function __( $s,...$args ){return $s;}
function esc_attr($s){return htmlspecialchars((string)$s,ENT_QUOTES);}
function esc_html($s){return esc_attr($s);}
function sanitize_html_class($s){return preg_replace('/[^A-Za-z0-9_-]/','',$s);}
function esc_url($s){return esc_attr($s);}
function esc_url_raw($s){return $s;}
function wp_json_encode($value){return json_encode($value);}
function home_url($path=''){return 'https://store.test'.$path;}
function add_query_arg($key,$value,$url){return $url.(str_contains($url,'?')?'&':'?').rawurlencode($key).'='.rawurlencode($value);}
function get_template_directory(){return dirname(__DIR__).'/theme/codela-storefront';}
function get_template_directory_uri(){return 'https://store.test/theme';}
function wp_get_theme(){return new class{function get($name){preg_match('/^Version:\s*(\S+)/m',file_get_contents(get_template_directory().'/style.css'),$m);return $m[1];}};}
function wp_interactivity_state(){return [];}
function wp_register_script_module($id,$src,$deps=[],$version=false){$GLOBALS['modules'][$id]=compact('src','deps','version');}
function wp_enqueue_script_module($id){$GLOBALS['enqueued_modules'][]=$id;}
function register_block_type(...$args){}
function register_block_style(...$args){}
function wc_get_page_permalink($page){return home_url('/'.$page.'/');}
function wc_get_cart_url(){return wc_get_page_permalink('cart');}
function wc_get_checkout_url(){return wc_get_page_permalink('checkout');}
function wc_get_account_endpoint_url($endpoint){return home_url('/myaccount/'.$endpoint.'/');}
function wc_get_account_menu_items(){return ['orders'=>'Orders','edit-address'=>'Addresses'];}
function wc_get_permalink_structure(){return ['product_rewrite_slug'=>'product','category_rewrite_slug'=>'product-category','tag_rewrite_slug'=>'product-tag'];}
function get_queried_object_id(){return 42;}
class WP_Post {public $ID=42;public $post_content='layout';}
function get_queried_object(){return new WP_Post;}
function has_block($name,$content){return is_front_page();}
function is_wp_error($v){return false;}
function codela_sections_validate_root($root){return true;}
function parse_blocks($content){return [['blockName'=>'codela/page-layout','innerBlocks'=>[
 ['blockName'=>'codela/section-hero','attrs'=>['data'=>['enabled'=>true,'items'=>[[],[]]]]],
 ['blockName'=>'codela/section-products','attrs'=>['data'=>['enabled'=>true]]],
]]];}
function wp_get_script_tag($attrs){return '<script '.implode(' ',array_map(fn($k,$v)=>$k.'="'.esc_attr($v).'"',array_keys($attrs),$attrs)).'></script>' . "\n";}
function wp_get_inline_script_tag($code,$attrs=[]){return str_replace('</script>',"\n".$code."\n</script>",wp_get_script_tag($attrs));}
function _doing_it_wrong(...$args){throw new RuntimeException(implode(' ',array_filter($args,'is_string')));}
$wp_core = rtrim((string)getenv('WP_CORE_INCLUDES'),'/');
if (!$wp_core || !is_file($wp_core.'/class-wp-styles.php')) {throw new RuntimeException('Set WP_CORE_INCLUDES to actual WordPress wp-includes');}
foreach(['class-wp-dependency.php','class-wp-dependencies.php','class-wp-styles.php','class-wp-scripts.php','functions.wp-styles.php','functions.wp-scripts.php'] as $file){require $wp_core.'/'.$file;}
require dirname(__DIR__).'/theme/codela-storefront/functions.php';
do_action('init');
// Native Woo dependency handles are external to this theme-focused fixture.
foreach(['wc-add-to-cart','wc-single-product','zoom'] as $handle){wp_register_script($handle,'https://store.test/woo/'.$handle.'.js',[],null,true);}
if (!is_admin()) {do_action('wp_enqueue_scripts');}
// Downstream integrations may attach inline styles/scripts to aliases.
wp_add_inline_style('codela-storefront-theme',':root{--fixture-accent:purple;}');
if (!is_admin()) {wp_add_inline_script('codela-storefront-document-continuity','window.fixtureAfter=true;','after');}
if (is_admin()) {wp_enqueue_style('codela-storefront-gallery');}
ob_start();wp_styles()->do_items();$styles=ob_get_clean();
ob_start();wp_scripts()->do_head_items();$scripts=ob_get_clean();
echo json_encode(['context'=>$context,'debug'=>SCRIPT_DEBUG,'styles'=>$styles,'scripts'=>$scripts,'style_queue'=>wp_styles()->queue,'style_done'=>wp_styles()->done,'script_done'=>wp_scripts()->done,'modules'=>$GLOBALS['enqueued_modules']??[]],JSON_THROW_ON_ERROR);
