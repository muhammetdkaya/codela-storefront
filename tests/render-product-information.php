<?php
/** Production description/tabs rendering with native callback boundaries. */
define('ABSPATH',__DIR__);
$hooks=[]; $active=[]; $tab_reads=0; $renders=[];
function add_action($name,$callback,$priority=10,$args=1){$GLOBALS['hooks'][$name][$priority][]=$callback;}
function add_filter(...$args){add_action(...$args);}
function remove_action($name,$callback,$priority=10){foreach($GLOBALS['hooks'][$name][$priority]??[] as $i=>$fn){if($fn===$callback)unset($GLOBALS['hooks'][$name][$priority][$i]);}}
function do_action($name,...$args){$GLOBALS['active'][]=$name;$groups=$GLOBALS['hooks'][$name]??[];ksort($groups);foreach($groups as $group)foreach($group as $fn)$fn(...$args);array_pop($GLOBALS['active']);}
function doing_action($name){return in_array($name,$GLOBALS['active'],true);}
function apply_filters($name,$value,...$args){if($name==='woocommerce_product_tabs'){++$GLOBALS['tab_reads'];return $GLOBALS['fixture_tabs'];}return $value;}
function esc_attr($value){return htmlspecialchars((string)$value,ENT_QUOTES);}
function wp_kses_post($value){return $value;}
function check($value,$message){if(!$value)throw new RuntimeException($message);}
require __DIR__.'/../theme/codela-storefront/inc/product.php';
$product = new stdClass();
$fixture_tabs = [
 'description'=>['title'=>'Ürün hakkında','callback'=>function($key,$tab){$GLOBALS['renders'][]=$key;check(codela_sf_product_description_heading('Description')==='','Scoped heading suppression');echo '<div style="min-height:450px">Ürün bilgisi</div>';}],
 'reviews'=>['title'=>'Değerlendirmeler','callback'=>function($key,$tab){$GLOBALS['renders'][]=$key;echo '<div id="reviews"><a id="review_form">Yorum yaz</a><textarea aria-label="Yorum"></textarea></div>';}],
];
if(getenv('FIXTURE_DESCRIPTION')==='none')unset($fixture_tabs['description']);
if(getenv('FIXTURE_DESCRIPTION')==='long')$fixture_tabs['description']['callback']=function($key,$tab){$GLOBALS['renders'][]=$key;echo '<p>'.str_repeat('El yapımı seramik. Bakım ve kullanım bilgileri. ',80).'</p>';};
ob_start();codela_sf_product_summary_description();codela_sf_product_summary_description();$summary=ob_get_clean();
ob_start();require __DIR__.'/../theme/codela-storefront/woocommerce/single-product/tabs/tabs.php';$information=ob_get_clean();
check($tab_reads===1,'Native tab filters run once across summary and information');
check(count(array_filter($renders,fn($key)=>$key==='description'))===(isset($fixture_tabs['description'])?1:0),'Description callback runs once');
check(count(array_filter($renders,fn($key)=>$key==='reviews'))===1,'Review callback runs once');
check(codela_sf_product_description_heading('Description')==='Description','Heading suppression never leaks');
if(isset($fixture_tabs['description'])){
 check(str_contains($summary,'id="sf-product-section-description"'),'Description is in server summary');
 check(!str_contains($information,'id="sf-product-section-description"')&&str_contains($information,'data-sf-description-home'),'Only a mobile placement marker remains below');
}
echo json_encode(['summary'=>$summary,'information'=>$information],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
