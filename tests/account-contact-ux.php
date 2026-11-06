<?php
// Public login routing and Codela Contact page layout regression.
define('ABSPATH', __DIR__);
$GLOBALS['filters'] = [];
$GLOBALS['actions'] = [];
$GLOBALS['is_admin'] = false;
$GLOBALS['meta'] = 'valid-contact-layout';
$GLOBALS['contact_enabled'] = true;
$GLOBALS['password_required'] = false;
function add_filter($name,$fn,$priority=10,$accepted_args=1){$GLOBALS['filters'][$name][]=['fn'=>$fn,'priority'=>$priority];}
function add_action($name,$fn,$priority=10,$accepted_args=1){$GLOBALS['actions'][$name][]=['fn'=>$fn,'priority'=>$priority];}
function is_admin(){return $GLOBALS['is_admin'];}
function is_singular($type){return $type==='page';}
function get_queried_object_id(){return 19;}
function get_post($id){return (object)['ID'=>19,'post_type'=>'page','post_content'=>'<p>Legacy HTML body</p>'];}
function post_password_required($id){return $GLOBALS['password_required'];}
function has_block($name,$post){return false;}
function get_post_meta($id,$key,$single){return $GLOBALS['meta'];}
function codela_sections_validate_meta($value){return $value==='valid-contact-layout' ? true : (object)['error'=>'invalid'];}
function is_wp_error($value){return is_object($value) && isset($value->error);}
function parse_blocks($raw){
    if($raw!=='valid-contact-layout')return [];
    return [['blockName'=>'codela/page-layout','innerBlocks'=>[
        ['blockName'=>'codela/section-contact','attrs'=>['data'=>['enabled'=>$GLOBALS['contact_enabled'],'id'=>'contact','phone'=>'+90 212 555 1234']]]
    ]]];
}
function codela_sections_clean($type,$raw){return $raw;}
function render_block($block){return '<div class="codela-page-layout"><section class="sf-section--contact">Telephone from Codela</section></div>';}
function wc_get_page_permalink($type){return 'https://store.test/myaccount/';}
function check($true,$description){if(!$true)throw new RuntimeException($description);}
require __DIR__.'/../theme/codela-storefront/inc/sections.php';
require __DIR__.'/../theme/codela-storefront/inc/account.php';
check(codela_sf_public_login_destination([])==='https://store.test/myaccount/','Direct wp-login GET goes to My Account');
check(codela_sf_public_login_destination(['action'=>'register'])==='https://store.test/myaccount/','Public registration uses My Account');
foreach ([
    [['action'=>'logout'],'GET'],[['action'=>'lostpassword'],'GET'],
    [['action'=>'rp','key'=>'token'],'GET'],[['redirect_to'=>'/wp-admin/'],'GET'],
    [['reauth'=>'1'],'GET'],[['interim-login'=>'1'],'GET'],
    [[], 'POST']
] as [$args,$method]){
    check(codela_sf_public_login_destination($args,$method)==='','WP admin, recovery, logout and POST remain native');
}
$links=$GLOBALS['filters']['login_url']??[];
check(count($links)===1,'Front-end login URL filter installed');
$filter=$links[0]['fn'];
check($filter('https://store.test/wp-login.php','',false)==='https://store.test/myaccount/','Frontend login links lead to My Account');
check($filter('https://store.test/wp-login.php','/wp-admin/',false)==='https://store.test/wp-login.php','Admin redirect login preserved');
$GLOBALS['is_admin']=true;
check($filter('https://store.test/wp-login.php','',false)==='https://store.test/wp-login.php','Admin login links preserved');
$GLOBALS['is_admin']=false;
$hooks=array_values(array_filter($GLOBALS['filters']['render_block_core/post-content']??[],fn($item)=>$item['priority']===30));
check(count($hooks)===1,'Theme contact post-content override is registered after plugin priority 20');
$render=$hooks[0]['fn'];
$instance=(object)['context'=>['postId'=>19]];
$raw='<div class="legacy">Legacy HTML body</div>';
check(str_contains($render($raw, [], $instance),'sf-section--contact'),'Valid Codela contact section appears in page');
check(!str_contains($render($raw, [], $instance),'legacy'),'Old editor HTML is not shown ahead of managed contact layout');
$GLOBALS['contact_enabled']=false;
check($render($raw, [], $instance)===$raw,'Disabled contact section never hides original page HTML');
$GLOBALS['contact_enabled']=true;
$GLOBALS['meta']='invalid-layout';
check($render($raw, [], $instance)===$raw,'Invalid layout never overrides content');
$GLOBALS['meta']='valid-contact-layout';
$GLOBALS['password_required']=true;
check($render($raw, [], $instance)===$raw,'Password protected page never exposes contact data');
$GLOBALS['password_required']=false;
$GLOBALS['is_admin']=true;
check($render($raw, [], $instance)===$raw,'Editor retains original page HTML');
echo "Account-only public login and validated Contact page rendering: passed.\n";
