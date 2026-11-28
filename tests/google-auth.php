<?php
/** Deterministic provider boundary checks: no requests to Google or live WP. */
define('ABSPATH', __DIR__);
$GLOBALS['hooks']=[];$GLOBALS['filters']=[];$GLOBALS['users']=[];$GLOBALS['meta']=[];
$GLOBALS['connected']=true;
class WP_User { public function __construct(public int $ID, public string $user_email,public array $roles=['customer']){} }
class RedirectResult extends RuntimeException { public function __construct(public string $url){parent::__construct($url);} }
class WP_Session_Tokens { public static function get_instance($id){return new self;} public function destroy($token){$GLOBALS['destroyed']=$token;} }
function add_action($name,$callback,$priority=10,$args=1){$GLOBALS['hooks'][$name][]=$callback;}
function add_filter($name,$callback,$priority=10,$args=1){$GLOBALS['filters'][$name][]=$callback;}
function codela_sf_site_kit_signin_connected(){return $GLOBALS['connected'];}
function codela_sf_account_url(){return 'https://store.test/my-account/';}
function is_user_logged_in(){return false;}
function is_account_page(){return true;}
function esc_url($s){return htmlspecialchars($s,ENT_QUOTES);}
function esc_html_e($s,$d=''){echo htmlspecialchars($s,ENT_QUOTES);}
function esc_html__($s,$d=''){return htmlspecialchars($s,ENT_QUOTES);}
function current_user_can($cap){return true;}
function admin_url($p){return 'https://store.test/wp-admin/'.$p;}
function add_query_arg($key,$value,$url){return $url.'?'.http_build_query([$key=>$value]);}
function do_action($name,...$args){if($name==='googlesitekit_render_sign_in_with_google_button'){echo '<div data-official-button="yes"></div>';$GLOBALS['button_args']=$args[0];}}
function codela_sf_public_account_user($user){return $user instanceof WP_User && !empty($user->roles) && !array_diff($user->roles,['customer','subscriber']);}
function get_user_by($key,$id){return $GLOBALS['users'][$id]??false;}
function get_user_meta($id,$key,$single){return $GLOBALS['meta'][$id][$key]??'';}
function get_current_user_id(){return $GLOBALS['current_id']??0;}
function nocache_headers(){}
function wp_safe_redirect($url,$code){throw new RedirectResult($url);}
$wpdb=new class{function get_blog_prefix(){return 'wp_';}};
require __DIR__.'/../theme/codela-storefront/inc/google-auth.php';
function check($ok,$msg){if(!$ok)throw new RuntimeException($msg);}
function markup(){ob_start();codela_sf_google_button();return ob_get_clean();}
$customer=new WP_User(1,'a@gmail.com');$external=new WP_User(2,'a@example.test');$admin=new WP_User(3,'admin@gmail.com',['administrator']);
$GLOBALS['users']=[1=>$customer,2=>$external,3=>$admin];
$hash=md5('legacy-sub');$other=md5('different-sub');
check(codela_sf_google_enabled(),'Connected provider');
check(str_contains(markup(),'data-official-button="yes"'),'Official Site Kit button on account page');
check($GLOBALS['button_args']['theme']==='filled_black','Official widget configuration');
$GLOBALS['codela_sf_auth_overlay']=true;
check(str_contains(markup(),'codela_google=1')&&!str_contains(markup(),'data-official-button="yes"'),'Lazy dialog links to native Google surface');
unset($GLOBALS['codela_sf_auth_overlay']);
$GLOBALS['connected']=false;check(markup()==='','No fake Google button without Site Kit');$GLOBALS['connected']=true;
check(codela_sf_google_link_allowed($customer,$hash,'','',false,false),'Verified Gmail match');
check(!codela_sf_google_link_allowed($external,$hash,'','',false,false),'External account cannot be silently linked');
check(codela_sf_google_link_allowed($external,$hash,'','legacy-sub',false,false),'Legacy verified identity remains valid');
check(!codela_sf_google_link_allowed($external,$other,'','legacy-sub',false,false),'Legacy mismatch rejected');
check(!codela_sf_google_link_allowed($customer,$other,$hash,'',false,false),'Existing Site Kit link cannot be overwritten');
check(codela_sf_google_link_allowed($external,$hash,'','',true,false),'New verified user');
check(codela_sf_google_link_allowed($external,$hash,'','',false,true),'Authenticated explicit connection');
check(!codela_sf_google_link_allowed($admin,$hash,'','',false,true),'Admin not accepted');
$_SERVER['REQUEST_METHOD']='GET';codela_sf_google_policy_start();
check(empty($GLOBALS['hooks']['set_auth_cookie']),'No policy hook on GET');
$_SERVER['REQUEST_METHOD']='POST';codela_sf_google_policy_start();
check(count($GLOBALS['hooks']['set_auth_cookie'])===1 && count($GLOBALS['filters']['update_user_metadata'])===1,'Guard only on provider POST');
codela_sf_google_guard_session('',0,0,1,'auth','customer-token');
try{codela_sf_google_guard_session('',0,0,3,'auth','admin-token');throw new RuntimeException('Admin must be rejected');}
catch(RedirectResult $e){check(str_contains($e->url,'google_login=error')&&$GLOBALS['destroyed']==='admin-token','Rejected session destroys only new token');}
check(codela_sf_google_guard_link(null,3,'unrelated_meta',$hash)===null,'Unrelated metadata untouched');
try{codela_sf_google_guard_link(null,2,'wp_googlesitekitpersistent_siwg_google_user_hid',$hash);throw new RuntimeException('External link must be rejected');}
catch(RedirectResult $e){check(str_contains($e->url,'google_login=error'),'Link rejected before metadata write');}
$GLOBALS['meta'][2]['_sf_google_sub']='legacy-sub';
check(codela_sf_google_guard_link(null,2,'wp_googlesitekitpersistent_siwg_google_user_hid',$hash)===null,'Legacy identity passes official write');
ob_start();codela_sf_google_settings_form();$settings=ob_get_clean();
check(str_contains($settings,'googlesitekit-settings')&&!str_contains($settings,'Client secret'),'Settings point to official provider only');
echo "Site Kit presentation, customer session boundary and link policy passed\n";
