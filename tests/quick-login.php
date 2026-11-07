<?php
/**
 * Deterministic functional PIN authentication test. No real WooCommerce required.
 * Real EC P-256 signatures and the production adapter are exercised.
 */
define( 'ABSPATH', __DIR__ );
define( 'MINUTE_IN_SECONDS', 60 );
define( 'DAY_IN_SECONDS', 86400 );
$GLOBALS['transient_data'] = [];
$GLOBALS['meta'] = [];
$GLOBALS['login'] = [];
$GLOBALS['user'] = null;
class WP_User {
    public function __construct( public int $ID, public string $user_login = 'customer',
        public string $display_name = 'Customer', public array $roles = [ 'customer' ] ) {}
}
class WP_Error {
    public function __construct( public string $code, public string $message = '', public array $data = [] ) {}
}
class WP_REST_Request {
    public function __construct( private array $data ) {}
    public function get_param( $key ) { return $this->data[$key] ?? null; }
}
function add_action(...$args) {}
function is_ssl() { return true; }
function user_can( $user, $cap ) { return !empty($GLOBALS['admin']); }
function get_user_meta($id,$key,$single=true) { return $GLOBALS['meta'][$id][$key]??null; }
function update_user_meta($id,$key,$value) { $GLOBALS['meta'][$id][$key]=$value; }
function delete_user_meta($id,$key) { unset($GLOBALS['meta'][$id][$key]); }
function wp_hash_password($password) { return password_hash($password, PASSWORD_BCRYPT); }
function wp_check_password($password,$hash,$uid) { return password_verify($password,$hash); }
function wp_get_current_user() { return $GLOBALS['user']; }
function get_user_by($field,$id) { return $id===17?new WP_User(17):false; }
function get_transient($key) { return $GLOBALS['transient_data'][$key]['value']??false; }
function set_transient($key,$val,$ttl) { $GLOBALS['transient_data'][$key]=['value'=>$val,'ttl'=>$ttl]; }
function delete_transient($key) { unset($GLOBALS['transient_data'][$key]); }
function rest_ensure_response($data) { return $data; }
function absint($value) { return abs((int)$value); }
function wp_set_current_user($id) { $GLOBALS['login']['current']=$id; }
function wp_set_auth_cookie($id,$remember,$secure) { $GLOBALS['login']['cookie']=[$id,$remember,$secure]; }
function do_action($name,...$args) { if($name==='wp_login')$GLOBALS['login']['hook']=$args; }
function wc_get_page_permalink($name) { return 'https://example.test/my-account/'; }
function a($condition,$message){ if(!$condition)throw new RuntimeException($message); }

require __DIR__ . '/../theme/codela-storefront/inc/quick-login.php';
$GLOBALS['user'] = new WP_User(17);
$ec = openssl_pkey_new(['private_key_type'=>OPENSSL_KEYTYPE_EC,'curve_name'=>'prime256v1']);
a((bool)$ec,'PHP P-256 support');
$details=openssl_pkey_get_details($ec);
$pub=preg_replace('/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s+/','',$details['key']);
$device=str_repeat('a',32);
$signature=function(string $message)use($ec){openssl_sign($message,$raw,$ec,OPENSSL_ALGO_SHA256);return base64_encode($raw);};
$request=function(array $p){return new WP_REST_Request($p);};
$pin='381905';
$enroll=codela_sf_quick_enroll($request([
    'device_id'=>$device,'public_key'=>$pub,
    'signature'=>$signature('codela-pin-enroll:v1:'.$device),'pin'=>$pin
]));
a(($enroll['ok']??false)===true,'enrollment works');
$stored=codela_sf_quick_devices(17);
a(count($stored)===1,'device persisted');
a(!str_contains(json_encode($stored),$pin),'PIN is not persisted in plaintext');
a(!isset($stored[$device]['private_key']),'private key not persisted on server');

$challenge=codela_sf_quick_challenge($request(['user_id'=>17,'device_id'=>$device]));
a(preg_match('/^[0-9a-f]{64}$/D',$challenge['challenge'])===1,'secure challenge length');
$payload=[
    'user_id'=>17,'device_id'=>$device,'challenge'=>$challenge['challenge'],
    'signature'=>$signature('codela-pin-login:v1:17:'.$device.':'.$challenge['challenge']),
    'pin'=>'999999',
];
a(codela_sf_quick_verify($request($payload)) instanceof WP_Error,'wrong PIN denied');
a(!$GLOBALS['login'],'wrong PIN does not log in');
a(codela_sf_quick_verify($request(array_replace($payload,['pin'=>$pin]))) instanceof WP_Error,'reused challenge denied');

$challenge=codela_sf_quick_challenge($request(['user_id'=>17,'device_id'=>$device]))['challenge'];
$payload['challenge']=$challenge;
$payload['signature']=$signature('codela-pin-login:v1:17:'.$device.':'.$challenge);
$payload['pin']=$pin;
$result=codela_sf_quick_verify($request($payload));
a(($result['ok']??false)===true,'signed correct PIN signs in');
a($GLOBALS['login']['cookie']===[17,true,true],'secure persistent WordPress cookie');
a(($GLOBALS['login']['hook'][0]??'')==='customer','WordPress login hook fired');
a(codela_sf_quick_verify($request($payload)) instanceof WP_Error,'successful challenge replay blocked');
$GLOBALS['admin']=true;
a(codela_sf_quick_enroll($request(['device_id'=>$device])) instanceof WP_Error,'admin account forbidden');
$GLOBALS['admin']=false;
codela_sf_quick_revoke($request(['device_id'=>$device]));
a(codela_sf_quick_devices(17)===[],'revocation deletes browser credential');
a(codela_sf_quick_challenge($request(['user_id'=>17,'device_id'=>$device]))['challenge']??false,'unknown browser returns generic challenge');
$expired=codela_sf_quick_verify($request($payload));
a($expired instanceof WP_Error,'revoked browser denied');
echo "Quick login functional PHP security tests passed\n";
