<?php
// The cross-document transition must never change WC transaction navigation.
define( 'ABSPATH', __DIR__ );
$GLOBALS['context'] = 'home';
function is_admin(){ return $GLOBALS['context']==='admin'; }
function is_checkout(){ return $GLOBALS['context']==='checkout'; }
function is_cart(){ return $GLOBALS['context']==='cart'; }
function is_account_page(){ return in_array($GLOBALS['context'],['account','guest-account','logout'],true); }
function is_user_logged_in(){ return $GLOBALS['context']!=='guest-account'; }
function is_wc_endpoint_url($endpoint){ return $GLOBALS['context']==='logout' && $endpoint==='customer-logout'; }
function is_product(){ return $GLOBALS['context']==='product'; }
function is_shop(){ return $GLOBALS['context']==='shop'; }
function is_product_category(){ return $GLOBALS['context']==='category'; }
function is_product_tag(){ return $GLOBALS['context']==='tag'; }
function codela_sf_seamless_allowed(){ return in_array($GLOBALS['context'],['home','page'],true); }
require __DIR__.'/../theme/codela-storefront/inc/document-continuity.php';
foreach(['home','page','product','shop','category','tag','account'] as $name){
    $GLOBALS['context']=$name;
    if(!codela_sf_document_continuity_allowed())throw new RuntimeException('Expected continuity on '.$name);
}
foreach(['admin','checkout','cart','guest-account','logout','unsupported'] as $name){
    $GLOBALS['context']=$name;
    if(codela_sf_document_continuity_allowed())throw new RuntimeException('Forbidden continuity on '.$name);
}
$css=file_get_contents(__DIR__.'/../theme/codela-storefront/assets/styles/document-continuity.css');
if(!str_contains($css,'@view-transition { navigation: auto; }'))throw new RuntimeException('Native CSS opt-in missing');
if(!str_contains($css,'prefers-reduced-motion: no-preference'))throw new RuntimeException('Reduced-motion opt out missing');
if(!str_contains($css,'data-sf-document-target'))throw new RuntimeException('Destination bottom surface rules missing');
echo "Cross-document eligibility: browse and signed-in account snapshots; checkout/cart/guest/logout/admin excluded.\n";
