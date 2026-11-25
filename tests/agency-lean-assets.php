<?php
define('ABSPATH', __DIR__);
$source = file_get_contents(__DIR__ . '/../theme/codela-storefront/functions.php');
$start = strpos($source, '/** Remove only the general Woo frontend script');
$end = strpos($source, '/** Enqueue only the selected optional skins', $start);
if ($start === false || $end === false) throw new RuntimeException('Missing scoped hook');
$GLOBALS['ctx'] = ['ready'=>true,'agency'=>true,'page'=>true,'managed'=>true,'widgets'=>true];
$GLOBALS['removed']=[];
function add_action($name,$callback,$priority) { $GLOBALS['hook']=$callback; }
function codela_sf_ready(){return !empty($GLOBALS['ctx']['ready']);}
function codela_theme_settings(){ $settings=['site_experience'=>!empty($GLOBALS['ctx']['agency'])?'agency':'commerce']; if (array_key_exists('lightweight',$GLOBALS['ctx'])) $settings['woo_lightweight_enabled']=$GLOBALS['ctx']['lightweight']; return $settings; }
$helper_start = strpos($source, 'function codela_sf_woo_lightweight_enabled(): bool {');
$helper_end = strpos($source, "\nadd_action( 'wp_enqueue_scripts'", $helper_start);
if ($helper_start === false || $helper_end === false) throw new RuntimeException('Missing shared lightweight switch');
eval(substr($source,$helper_start,$helper_end-$helper_start));
if (substr_count($source, 'codela_sf_woo_lightweight_enabled()') !== 3) throw new RuntimeException('Both reductions must use the shared switch');
$schema=json_decode(file_get_contents(__DIR__.'/../theme/codela-storefront/config/settings.json'),true);
$fields=array_merge(...array_column($schema['sections'],'fields'));
$setting=array_values(array_filter($fields,static fn($f)=>$f['id']==='woo_lightweight_enabled'));
if (count($setting)!==1 || $setting[0]['type']!=='checkbox' || $setting[0]['default']!==true) throw new RuntimeException('Missing compatible settings schema');
function is_singular($type){return !empty($GLOBALS['ctx']['page']);}
function is_search(){return !empty($GLOBALS['ctx']['search']);}
function is_cart(){return !empty($GLOBALS['ctx']['cart']);}
function is_checkout(){return !empty($GLOBALS['ctx']['checkout']);}
function is_account_page(){return !empty($GLOBALS['ctx']['account']);}
function is_woocommerce(){return !empty($GLOBALS['ctx']['woo']);}
function is_preview(){return !empty($GLOBALS['ctx']['preview']);}
function codela_sf_sections_capabilities(){return ['managed'=>!empty($GLOBALS['ctx']['managed']),'products'=>!empty($GLOBALS['ctx']['products'])];}
function codela_sf_agency_asset_flags(){return ['widgets'=>!empty($GLOBALS['ctx']['widgets'])];}
function wp_dequeue_script($handle){$GLOBALS['removed'][]=$handle;}
eval(substr($source,$start,$end-$start));
$base=$GLOBALS['ctx'];
($GLOBALS['hook'])();
if ($GLOBALS['removed'] !== ['woocommerce','wc-cart-fragments','wc-add-to-cart']) throw new RuntimeException('Expected lean Agency handles');
foreach(['ready','agency','page','managed','widgets','products','search','cart','checkout','account','woo','preview'] as $key){
 $GLOBALS['ctx']=$base; $GLOBALS['ctx'][$key]=empty($base[$key]); $GLOBALS['removed']=[];
 ($GLOBALS['hook'])();
 if ($GLOBALS['removed']) throw new RuntimeException('Unsafe removal: '.$key);
}
foreach([false,0,'0',true,1,'1'] as $value){
 $GLOBALS['ctx']=$base; $GLOBALS['ctx']['lightweight']=$value; $GLOBALS['removed']=[];
 ($GLOBALS['hook'])();
 $expected=in_array($value,[true,1,'1'],true)?['woocommerce','wc-cart-fragments','wc-add-to-cart']:[];
 if ($GLOBALS['removed']!==$expected) throw new RuntimeException('Incorrect lightweight toggle behavior');
}
echo "Scoped Agency script removal and toggle passed.\n";
