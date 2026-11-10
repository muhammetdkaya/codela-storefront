<?php
// Native server outcome survives suppressed notices and missing response headers.
define('ABSPATH', __DIR__);
$hooks=[];$sent=null;$notices=[];
function add_action($name,$fn,$priority=10,...$args){$GLOBALS['hooks'][$name][$priority][]=$fn;}
function add_filter(...$args){}
function wc_get_notices($type){return $GLOBALS['notices'];}
function wc_clear_notices(){$GLOBALS['notices']=[];}
function wp_strip_all_tags($text){return strip_tags($text);}
function nocache_headers(){}
function wp_send_json($result,$code){$GLOBALS['sent']=[$result,$code];}
require __DIR__.'/../theme/codela-storefront/inc/product.php';
function check($value,$message){if(!$value)throw new RuntimeException($message);}
$_SERVER['REQUEST_METHOD']='POST';$_POST=['add-to-cart'=>42,'codela_sf_cart_async'=>'1'];
check(isset($hooks['wp_loaded'][30]),'Response runs after native Woo handler at priority 20');
foreach($hooks['woocommerce_add_to_cart'][10] as $hook)$hook();
codela_sf_cart_async_result();
check($sent[0]['added']===true && $sent[1]===200,'Actual native add succeeds without notices');
unset($GLOBALS['codela_sf_cart_added']);$notices=[['notice'=>'<strong>Stokta yok</strong>']];
codela_sf_cart_async_result();
check($sent[0]['added']===false && $sent[1]===422 && $sent[0]['message']==='Stokta yok','Rejected add returns native error');
$sent=null;unset($_POST['codela_sf_cart_async']);codela_sf_cart_async_result();
check($sent===null,'Regular Woo form is untouched');
echo "Native cart JSON confirmation, validation errors and progressive-only scope passed.\n";
