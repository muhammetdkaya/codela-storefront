<?php
/** Production section HTML and real WP parser; reuse isolated Woo fixtures. */
ob_start(); require __DIR__ . '/homepage.php'; ob_end_clean();
function add_action(...$args){}
function _doing_it_wrong($name,$message,$version){throw new RuntimeException($message);}
$core=getenv('WP_CORE_INCLUDES');
expect($core && is_file($core.'/class-wp-html-tag-processor.php'),'Set WP_CORE_INCLUDES to the WordPress HTML API fixture');
foreach(['attribute-token','span','text-replacement','tag-processor'] as $class)require $core.'/class-wp-html-'.$class.'.php';
require __DIR__.'/../theme/codela-storefront/inc/media.php';
$items=[item(),array_merge(item('Işığı keşfet',12),['mobile_image_id'=>12]),array_merge(item('Yeni dokular',13),['mobile_image_id'=>13])];
$hero=codela_sf_section_media(data('hero','showcase',$items),'hero',true);
$wheel=codela_sf_section_media(data('hero','showcase',array_merge($items,[item('Zamansız tasarım'),item('Sade dokular',12)])),'hero',true);
$single=codela_sf_section_media(data('hero','showcase',[$items[0]]),'hero',true);
$promo=codela_sf_section_media(data('promo','split',[$items[1],$items[2]]),'promo',false);
$category=codela_sf_section_categories(data('categories','carousel',$items));
echo json_encode(compact('hero','wheel','single','promo','category'),JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
