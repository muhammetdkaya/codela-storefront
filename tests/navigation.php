<?php
// Minimal decision/markup tests, independent of a WordPress database.
define( 'ABSPATH', __DIR__ );
$GLOBALS['actions'] = []; $GLOBALS['filters'] = []; $GLOBALS['front'] = true; $GLOBALS['page'] = false; $GLOBALS['supported'] = true;
function add_action($name,$callback,$priority=10){$GLOBALS['actions'][$name][]=$callback;}
function add_filter($name,$callback,$priority=10,$args=1){$GLOBALS['filters'][$name][]=$callback;}
function wp_interactivity(){return $GLOBALS['supported'] ? new class{function add_client_navigation_support_to_script_module($id){}} : new stdClass();}
function wp_interactivity_config($namespace,$config){$GLOBALS['router_config']=$config;}
function codela_sf_home_mode(){return $GLOBALS['home_mode']??'legacy';}
function is_front_page(){return $GLOBALS['front'];}
function is_page(){return $GLOBALS['page'];}
function get_option($key){return ['show_on_front'=>'posts','page_on_front'=>1][$key]??null;}
function get_post($id){return $GLOBALS['posts'][$id]??null;}
function get_queried_object_id(){return $GLOBALS['queried']??2;}
function wc_get_page_id($type){return ['cart'=>3,'checkout'=>4,'myaccount'=>5][$type]??0;}
function parse_blocks($content){if(str_contains($content,'wp:custom'))return [['blockName'=>'custom/block','innerBlocks'=>[]]];return [['blockName'=>'core/paragraph','innerBlocks'=>[]]];}
function check($condition,$message){if(!$condition)throw new RuntimeException($message);}
class WP_HTML_Tag_Processor {
    private $html;
    public function __construct($html){$this->html=$html;}
    public function next_tag($type){return str_contains($this->html,'<'.$type);}
    public function get_attribute($name){preg_match('/'.preg_quote($name,'/').'="([^"]*)"/',$this->html,$m);return $m[1]??null;}
    public function set_attribute($name,$value){$this->html=preg_replace('/(<(?:main|a)\\b)/','$1 '. $name.'="'.$value.'"',$this->html,1);}
    public function get_updated_html(){return $this->html;}
}
$posts = [];
foreach([1,2,3,4,5,6,7,8,9] as $id)$posts[$id]=(object)['post_type'=>'page','post_status'=>'publish','post_password'=>'','post_content'=>'<!-- wp:paragraph -->text<!-- /wp:paragraph -->'];
$posts[6]->post_status='private';
$posts[7]->post_content='<!-- wp:custom/block /-->';
$posts[8]->post_content='[my_form]';
$posts[9]->post_password='secret';
$GLOBALS['posts']=$posts;
require __DIR__.'/../theme/codela-storefront/inc/navigation.php';
check(codela_sf_seamless_allowed(),'Built-in home is eligible');
$GLOBALS['home_mode']='sections';
check(!codela_sf_seamless_allowed(),'Managed home initializes its real gallery and Woo scripts through a full document');
check(!codela_sf_seamless_page_allowed(1),'A configured managed homepage is not marked as a partial region target');
$GLOBALS['home_mode']='legacy';
foreach([3,4,5,6,7,8,9] as $id)check(!codela_sf_seamless_page_allowed($id),'Unsafe page '.$id.' excluded');
check(codela_sf_seamless_page_allowed(2),'Public core-block page allowed');
$GLOBALS['front']=false;$GLOBALS['page']=true;$GLOBALS['queried']=2;
check(codela_sf_seamless_allowed(),'Simple page eligible');
$render=$GLOBALS['filters']['render_block'][0];
$html='<main class="wp-block-group sf-content" id="sf-content"><p>Content</p></main>';
$block=['blockName'=>'core/group','attrs'=>['anchor'=>'sf-content']];
$result=$render($html,$block);
check(str_contains($result,'data-wp-router-region="codela/storefront/main"'),'Main region installed');
check(str_contains($result,'data-wp-interactive="codela/storefront"'),'Region has namespace');
check($render($html,['blockName'=>'core/group','attrs'=>['anchor'=>'other']])===$html,'Other groups untouched');
$link=$GLOBALS['filters']['nav_menu_link_attributes'][0];
$item=(object)['object'=>'page','type'=>'post_type','object_id'=>2];
check(($link([],$item)['data-sf-route']??null)==='content','Only safe page links marked');
$item->object_id=4;check(!isset($link([],$item)['data-sf-route']),'Checkout link stays ordinary');
$GLOBALS['page']=false;$GLOBALS['front']=false;
check(!codela_sf_seamless_allowed(),'Archive and product classes not opted in');
foreach($GLOBALS['actions']['wp'] as $callback)$callback();
check(!empty($GLOBALS['router_config']['clientNavigationDisabled']),'Core router forced to full page for unsafe targets');
$GLOBALS['supported']=false;$GLOBALS['front']=true;
check(!codela_sf_seamless_allowed(),'Older WordPress safely stays native');
echo "Safe route eligibility, shell markup and full-document fallback passed.\n";
