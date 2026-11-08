<?php
/** Functional WebAuthn ES256 security regression against the production adapter. */
define('ABSPATH',__DIR__);define('MINUTE_IN_SECONDS',60);define('DAY_IN_SECONDS',86400);
$GLOBALS['u'] = null; $GLOBALS['meta']=[];$GLOBALS['opts']=[];$GLOBALS['transients']=[];$GLOBALS['login']=[];
class WP_User { public function __construct(public int $ID=17,public string $user_login='customer',public string $user_email='customer@shop.test',public array $roles=['customer']){} }
class WP_Error { public function __construct(public string $code,public string $message='',public array $data=[]){} }
class WP_REST_Request implements ArrayAccess {
    public function __construct(private array $input=[]){}
    public function get_param($key){return $this->input[$key]??null;}
    public function get_json_params(){return $this->input;}
    public function offsetExists(mixed $offset):bool{return isset($this->input[$offset]);}
    public function offsetGet(mixed $offset):mixed{return $this->input[$offset]??null;}
    public function offsetSet(mixed $offset,mixed $value):void{$this->input[$offset]=$value;}
    public function offsetUnset(mixed $offset):void{unset($this->input[$offset]);}
}
function add_action(...$args){} function add_filter(...$args){}
function __($s,$d=''){return $s;}function home_url($p=''){return 'https://shop.test/'.ltrim($p,'/');}
function wp_parse_url($url,$part=-1){return parse_url($url,$part);}
function get_bloginfo($k){return 'Test Shop';}
function wp_get_current_user(){return $GLOBALS['u'];}
function get_user_by($field,$id){
    return match ((int)$id) {
        17 => new WP_User(),
        18 => new WP_User(18,'siteadmin','admin@shop.test',['administrator']),
        19 => new WP_User(19,'shopmanager','manager@shop.test',['shop_manager']),
        20 => new WP_User(20,'editor','editor@shop.test',['editor']),
        default => false
    };
}
function codela_sf_quick_customer($u){return $u instanceof WP_User && in_array('customer',$u->roles,true);}
function codela_sf_quick_display_name($u){return 'Test Customer';}
function codela_sf_quick_ip_limit($record=false){return true;}
function wp_get_session_token(){return 'test-session';}
function get_user_meta($uid,$key,$single=true){return $GLOBALS['meta'][$uid][$key]??null;}
function update_user_meta($uid,$key,$value){$GLOBALS['meta'][$uid][$key]=$value;return true;}
function delete_user_meta($uid,$key){unset($GLOBALS['meta'][$uid][$key]);}
function get_option($key,$default=false){return $GLOBALS['opts'][$key]??$default;}
function add_option($key,$value,$deprecated='',$autoload=false){if(isset($GLOBALS['opts'][$key]))return false;$GLOBALS['opts'][$key]=$value;return true;}
function delete_option($key){unset($GLOBALS['opts'][$key]);}
function set_transient($key,$value,$ttl){$GLOBALS['transients'][$key]=$value;return true;}
function get_transient($key){return $GLOBALS['transients'][$key]??false;}
function delete_transient($key){unset($GLOBALS['transients'][$key]);}
function absint($n){return abs((int)$n);}
function rest_ensure_response($r){return $r;}
function wp_set_current_user($id){$GLOBALS['login']['id']=$id;}
function wp_set_auth_cookie($id,$remember,$secure){$GLOBALS['login']['cookie']=[$id,$remember,$secure];}
function do_action($name,...$args){if($name==='wp_login')$GLOBALS['login']['hook']=$args;}
function wc_get_page_permalink($key){return 'https://shop.test/hesabim/';}
function is_ssl(){return true;}
function check($ok,$why){if(!$ok)throw new RuntimeException($why);}
function req(array $x=[]){return new WP_REST_Request($x);}
require __DIR__.'/../theme/codela-storefront/inc/passkeys.php';
$GLOBALS['u']=new WP_User();
$enc='codela_sf_pk_encode';
$pair=openssl_pkey_new(['private_key_type'=>OPENSSL_KEYTYPE_EC,'curve_name'=>'prime256v1']);
check((bool)$pair,'openssl P256 supported');
$admin=get_user_by('id',18);
$manager=get_user_by('id',19);
$editor=get_user_by('id',20);
check(codela_sf_pk_privileged_user($admin),'administrator is recognized as privileged');
check(codela_sf_pk_privileged_user($manager),'shop manager is recognized as privileged');
check(codela_sf_pk_enabled($admin),'administrator may enroll a passkey on HTTPS');
check(codela_sf_pk_enabled($manager),'shop manager may enroll a passkey on HTTPS');
check(!codela_sf_pk_enabled($editor),'editor does not gain a privileged passkey bypass');
check(!codela_sf_quick_customer($admin),'administrator must remain ineligible for PIN');
$details=openssl_pkey_get_details($pair);
$der=base64_decode(preg_replace('/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s+/','',$details['key']));
$credential=$enc(random_bytes(32));
$auth=hash('sha256','shop.test',true).chr(0x05).pack('N',0); // UP + UV.
$create=codela_sf_pk_registration_options(req());
check(strlen($create['challenge'])>=43,'fresh registration challenge');
check($create['authenticatorSelection']['residentKey']==='required','discoverable credential');
$clientCreate=json_encode(['type'=>'webauthn.create','challenge'=>$create['challenge'],'origin'=>'https://shop.test']);
$enrolled=codela_sf_pk_register(req([
    'id'=>$credential,
    'response'=>['clientDataJSON'=>$enc($clientCreate),'authenticatorData'=>$enc($auth),'publicKey'=>$enc($der)]
]));
check(($enrolled['ok']??false)===true,'valid customer registration');
check(get_option(codela_sf_pk_option($credential))==='17','credential map belongs to customer');
check(count(codela_sf_pk_credentials(17))===1,'credential persisted');
$targeted=codela_sf_pk_assertion_options(req(['credential_id'=>$credential]));
check(count($targeted['publicKey']['allowCredentials'])===1,'known browser targets just its enrolled passkey');
check($targeted['publicKey']['allowCredentials'][0]['id']===$credential,'same saved key is returned');
$unknown=codela_sf_pk_assertion_options(req(['credential_id'=>codela_sf_pk_encode(random_bytes(32))]));
check($unknown['publicKey']['allowCredentials']===[],'unknown browser hint cannot target an account');
$unhinted=codela_sf_pk_assertion_options(req());
check($unhinted['publicKey']['allowCredentials']===[],'no-hint request keeps safe discoverable fallback');

function assertion(string $id,OpenSSLAsymmetricKey $pair,string $auth,bool $wrongOrigin=false,bool $targeted=false):array{
    $o=codela_sf_pk_assertion_options(req($targeted?['credential_id'=>$id]:[]));
    $client=json_encode(['type'=>'webauthn.get','challenge'=>$o['publicKey']['challenge'],
        'origin'=>$wrongOrigin?'https://evil.test':'https://shop.test']);
    openssl_sign($auth.hash('sha256',$client,true),$sig,$pair,OPENSSL_ALGO_SHA256);
    return ['requestId'=>$o['requestId'],'id'=>$id,'response'=>[
        'clientDataJSON'=>codela_sf_pk_encode($client),
        'authenticatorData'=>codela_sf_pk_encode($auth),
        'signature'=>codela_sf_pk_encode($sig),
        'userHandle'=>get_user_meta(17,'_codela_sf_pk_handle',true),
    ]];
}
$bad=assertion($credential,$pair,$auth,true);
check(codela_sf_pk_assert(req($bad)) instanceof WP_Error,'reject wrong origin');
$bound=codela_sf_pk_assertion_options(req(['credential_id'=>$credential]));
$another=codela_sf_pk_encode(random_bytes(32));
$clientBound=json_encode(['type'=>'webauthn.get','challenge'=>$bound['publicKey']['challenge'],'origin'=>'https://shop.test']);
openssl_sign($auth.hash('sha256',$clientBound,true),$boundSig,$pair,OPENSSL_ALGO_SHA256);
$wrongCredential=req(['requestId'=>$bound['requestId'],'id'=>$another,'response'=>[
    'clientDataJSON'=>codela_sf_pk_encode($clientBound),
    'authenticatorData'=>codela_sf_pk_encode($auth),
    'signature'=>codela_sf_pk_encode($boundSig)
]]);
check(codela_sf_pk_assert($wrongCredential) instanceof WP_Error,'targeted challenge rejects any other credential');

check(!$GLOBALS['login'],'wrong-origin assertion cannot authenticate');
$payload=assertion($credential,$pair,$auth);
$ok=codela_sf_pk_assert(req($payload));
check(($ok['ok']??false)===true,'valid signed assertion creates session');
$targetedPayload=assertion($credential,$pair,$auth,false,true);
check((codela_sf_pk_assert(req($targetedPayload))['ok']??false)===true,'saved key signs in with targeted challenge');

check($GLOBALS['login']['cookie']===[17,true,true],'WordPress session cookie set securely');
check(codela_sf_pk_assert(req($payload)) instanceof WP_Error,'request challenge is one-use');
$other=openssl_pkey_new(['private_key_type'=>OPENSSL_KEYTYPE_EC,'curve_name'=>'prime256v1']);
check(codela_sf_pk_assert(req(assertion($credential,$other,$auth))) instanceof WP_Error,'wrong private key rejected');
check((codela_sf_pk_manage(req(['id'=>$credential,'action'=>'pause']))['ok']??false)===true,'pause action');
check(codela_sf_pk_assert(req(assertion($credential,$pair,$auth))) instanceof WP_Error,'paused credential not accepted');
check((codela_sf_pk_manage(req(['id'=>$credential,'action'=>'resume']))['ok']??false)===true,'resume action');
check((codela_sf_pk_assert(req(assertion($credential,$pair,$auth)))['ok']??false)===true,'resumed credential accepted');
codela_sf_pk_revoke_all(17);
check(codela_sf_pk_credentials(17)===[],'all credentials revoked');
check(get_option(codela_sf_pk_option($credential),false)===false,'credential index removed');
check(codela_sf_pk_assert(req(assertion($credential,$pair,$auth))) instanceof WP_Error,'revoked credential denied');
// A privileged administrator can enroll a dedicated origin-bound passkey,
// then sign in without making a permanent remembered administrator session.
// This does not add PIN enrollment to privileged accounts.
$GLOBALS['u']=$admin;
$adminPair=openssl_pkey_new(['private_key_type'=>OPENSSL_KEYTYPE_EC,'curve_name'=>'prime256v1']);
$adminDetails=openssl_pkey_get_details($adminPair);
$adminDer=base64_decode(preg_replace('/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\\s+/','',$adminDetails['key']));
$adminCredential=codela_sf_pk_encode(random_bytes(32));
$adminOpts=codela_sf_pk_registration_options(req());
check(is_array($adminOpts) && isset($adminOpts['challenge']),'administrator can request WebAuthn registration');
$adminCreate=json_encode(['type'=>'webauthn.create','challenge'=>$adminOpts['challenge'],'origin'=>'https://shop.test']);
$adminRegistered=codela_sf_pk_register(req(['id'=>$adminCredential,'response'=>[
    'clientDataJSON'=>codela_sf_pk_encode($adminCreate),
    'authenticatorData'=>codela_sf_pk_encode($auth),
    'publicKey'=>codela_sf_pk_encode($adminDer),
]]));
check(($adminRegistered['ok']??false)===true,'administrator credential enrolled');
check(get_option(codela_sf_pk_option($adminCredential))==='18','administrator credential owner is unique');
$adminRequest=codela_sf_pk_assertion_options(req(['credential_id'=>$adminCredential]));
check($adminRequest['publicKey']['allowCredentials'][0]['id']===$adminCredential,
    'administrator targeted login must use own credential');
$adminClient=json_encode(['type'=>'webauthn.get','challenge'=>$adminRequest['publicKey']['challenge'],'origin'=>'https://shop.test']);
openssl_sign($auth.hash('sha256',$adminClient,true),$adminSig,$adminPair,OPENSSL_ALGO_SHA256);
$GLOBALS['login']=[];
$adminLogin=codela_sf_pk_assert(req(['requestId'=>$adminRequest['requestId'],'id'=>$adminCredential,'response'=>[
    'clientDataJSON'=>codela_sf_pk_encode($adminClient),
    'authenticatorData'=>codela_sf_pk_encode($auth),
    'signature'=>codela_sf_pk_encode($adminSig),
    'userHandle'=>get_user_meta(18,'_codela_sf_pk_handle',true),
]]));
check(($adminLogin['ok']??false)===true,'administrator WebAuthn assertion logs into real WordPress');
check($GLOBALS['login']['cookie']===[18,false,true],
    'administrator passkey creates a secure session cookie, not persistent remember-me');
check(($GLOBALS['login']['hook'][0]??'')==='siteadmin','WordPress admin login hook fires');
check(codela_sf_pk_assert(req(['requestId'=>$adminRequest['requestId'],'id'=>$adminCredential,'response'=>[]]))
    instanceof WP_Error,'administrator challenge cannot be replayed');
check(codela_sf_pk_assert(req(assertion($credential,$pair,$auth))) instanceof WP_Error,
    'revoked customer key remains denied after admin authorization');
echo "Passkey ES256 WebAuthn functional checks passed\n";
