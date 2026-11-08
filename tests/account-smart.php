<?php
/** Single-screen login must retain Woo's native validation and safe lookup. */
define('ABSPATH',__DIR__);
define('MINUTE_IN_SECONDS',60);
$GLOBALS['hooks']=[];$GLOBALS['filters']=[];$GLOBALS['transients']=[];$GLOBALS['users']=[];$GLOBALS['auth']=false;
$GLOBALS['token_ok']=true;$GLOBALS['register_open']=true;
function add_action($name,$fn,$priority=10,$args=1){$GLOBALS['hooks'][$name][]=$fn;}
function add_filter($name,$callback,$priority=10,$accepted_args=1){$GLOBALS['filters'][$name][]=$callback;}
function __( $s,$d=''){return $s;}
function esc_html__($s,$d=''){return htmlspecialchars($s,ENT_QUOTES);}
function esc_attr($s){return htmlspecialchars((string)$s,ENT_QUOTES);}
function is_account_page(){return true;}
function is_user_logged_in(){return $GLOBALS['auth'];}
function get_option($name,$default=''){
  return $name==='woocommerce_enable_myaccount_registration'
    ? ($GLOBALS['register_open']?'yes':'no'):$default;
}
function sanitize_email($value){return filter_var((string)$value,FILTER_SANITIZE_EMAIL);}
function is_email($value){return filter_var($value,FILTER_VALIDATE_EMAIL);}
function sanitize_text_field($value){return trim(strip_tags((string)$value));}
function wp_unslash($value){return stripslashes((string)$value);}
function wp_salt($which){return 'private-test-server-key';}
function get_transient($key){return $GLOBALS['transients'][$key]??false;}
function set_transient($key,$value,$ttl){$GLOBALS['transients'][$key]=$value;}
function check_ajax_referer($name,$field,$die){return $GLOBALS['token_ok'];}
function email_exists($email){return $email==='existing@example.test'?17:false;}
function nocache_headers(){$GLOBALS['no_cache']=true;}
class SmartResponse extends Exception{
  public function __construct(public array $response,public int $status=200){parent::__construct();}
}
function wp_send_json($payload,$code=200){throw new SmartResponse($payload,$code);}
function update_user_meta($id,$field,$value){$GLOBALS['users'][$id][$field]=$value;}
function check($ok,$msg){if(!$ok)throw new RuntimeException($msg);}
class WP_Error{
  public array $errors=[];
  public function add($code,$text){$this->errors[$code][]=$text;}
}
require __DIR__.'/../theme/codela-storefront/inc/account.php';
function resolve($identity,$token=true){
  $GLOBALS['token_ok']=$token;$_POST=['identity'=>$identity,'token'=>'sample'];
  try{codela_sf_auth_lookup();throw new RuntimeException('lookup must return JSON');}
  catch(SmartResponse $reply){return [$reply->response,$reply->status];}
}
$_SERVER['REMOTE_ADDR']='203.0.113.44';
[$value,$status]=resolve('existing@example.test');
check($status===200&&$value['status']==='existing','Known email reveals native password stage');
[$value,$status]=resolve('fresh@example.test');
check($status===200&&$value['status']==='new','New valid email reveals native registration stage');
[$value,$status]=resolve('fresh@example.test',false);
check($status===403&&$value['status']==='unavailable','Invalid nonce cannot enumerate addresses');
[$value,$status]=resolve('bad email');
check($status===400,'Invalid email has no account lookup');
$GLOBALS['register_open']=false;
[$value,$status]=resolve('fresh@example.test');
check($status===200&&$value['status']==='closed','Disabled WooCommerce registration never opens fake form');
$GLOBALS['register_open']=true;
$GLOBALS['auth']=true;
[$value,$status]=resolve('existing@example.test');
check($value['status']==='authenticated','No anonymous profile resolution for active WordPress sessions');
$GLOBALS['auth']=false;
$_SERVER['REMOTE_ADDR']='203.0.113.49';
for($i=0;$i<18;$i++)resolve('fresh@example.test');
[$value,$status]=resolve('fresh@example.test');
check($status===429&&$value['status']==='unavailable','Email lookup is rate-limited');
// Registration validation runs on Woo's real native POST, even with no JS.
$_POST=['first_name'=>'','last_name'=>'','register'=>'Register'];
$errors=new WP_Error();
foreach($GLOBALS['filters']['woocommerce_registration_errors'] as $validate)$validate($errors,'test','new@example.test');
check(isset($errors->errors['codela_sf_missing_first_name']),'Empty names fail Woo native registration');
$_POST=['first_name'=>' Ada ','last_name'=>' Yılmaz ','register'=>'Register'];
ob_start();codela_sf_auth_registration_names();$markup=ob_get_clean();
check(str_contains($markup,'name="first_name"')&&str_contains($markup,'name="last_name"'),'Native Woo form has both names');
foreach($GLOBALS['hooks']['woocommerce_created_customer'] as $action)$action(71);
check(($GLOBALS['users'][71]['first_name']??'')==='Ada','First name persisted with Woo-created user');
check(($GLOBALS['users'][71]['last_name']??'')==='Yılmaz','Last name persisted with Woo-created user');
check($GLOBALS['no_cache']??false,'Availability response is never cached');
echo "Progressive WooCommerce email lookup, limits, and profile fields passed\n";
