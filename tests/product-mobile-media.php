<?php
/** Production save/pairing boundaries with WordPress functions stubbed. */
define('ABSPATH', __DIR__);
$hooks=[];$meta=[];$can_edit=true;$nonce_ok=true;
function add_action($name,$callback,...$args){$GLOBALS['hooks'][$name]=$callback;}
function absint($v){return abs((int)$v);}
function wp_attachment_is_image($id){return in_array($id,[10,11,12,20,21,22,23],true);}
function get_post_meta($id,$key,$single){return $GLOBALS['meta'][$id][$key]??'';}
function update_post_meta($id,$key,$value){$GLOBALS['meta'][$id][$key]=$value;}
function current_user_can(...$args){return $GLOBALS['can_edit'];}
function wp_is_post_revision($id){return false;}
function wp_verify_nonce($nonce,$action){return $GLOBALS['nonce_ok']&&$nonce==='valid';}
function expect($ok,$message){if(!$ok)throw new RuntimeException($message);}
require __DIR__.'/../theme/codela-storefront/inc/product-mobile-media.php';
class Product {function get_id(){return 1;}function get_image_id(){return 10;}function get_gallery_image_ids(){return [11,12];}}
$product=new Product;
expect(codela_sf_mobile_gallery_pairs($product)===[[10,10],[11,11],[12,12]],'Empty mobile fields preserve Woo images');
$save=$hooks['save_post_product'];
$_POST=['codela_sf_mobile_media_nonce'=>'valid','codela_sf_mobile_featured'=>'20','codela_sf_mobile_gallery'=>'21,22,23'];$save(1);
expect(codela_sf_mobile_gallery_pairs($product)===[[10,20],[11,21],[12,22],[0,23]],'Independent longer mobile gallery');
$before=$meta;
foreach(['nonce','permission','partial','array','non-image','negative','multiple-featured'] as $case){
 $can_edit=$case!=='permission';$nonce_ok=$case!=='nonce';
 $_POST=['codela_sf_mobile_media_nonce'=>'valid','codela_sf_mobile_featured'=>'20','codela_sf_mobile_gallery'=>'21'];
 if($case==='partial')unset($_POST['codela_sf_mobile_gallery']);
 if($case==='array')$_POST['codela_sf_mobile_gallery']=['21'];
 if($case==='non-image')$_POST['codela_sf_mobile_gallery']='999';
 if($case==='negative')$_POST['codela_sf_mobile_gallery']='-21';
 if($case==='multiple-featured')$_POST['codela_sf_mobile_featured']='20,21';
 $save(1);expect($meta===$before,'Atomic rejection: '.$case);
}
$can_edit=$nonce_ok=true;
$_POST=['codela_sf_mobile_media_nonce'=>'valid','codela_sf_mobile_featured'=>'','codela_sf_mobile_gallery'=>'21'];$save(1);
expect(codela_sf_mobile_gallery_pairs($product)===[[10,10],[11,21],[12,0]],'Shorter gallery hides desktop-only slots; featured falls back independently');
$_POST['codela_sf_mobile_gallery']='';$save(1);
expect(codela_sf_mobile_gallery_pairs($product)===[[10,10],[11,11],[12,12]],'Remove restores defaults');
expect($product->get_image_id()===10&&$product->get_gallery_image_ids()===[11,12],'Catalog IDs never change');
echo "Mobile media fallback, independent lengths, save permissions/nonce and atomic rejection passed.\n";

// Optional real WordPress HTML parser (no database or Woo runtime required).
if (getenv('WP_HTML_API_DIR')) {
 if (file_exists(dirname(getenv('WP_HTML_API_DIR')).'/class-wp-token-map.php')) require dirname(getenv('WP_HTML_API_DIR')).'/class-wp-token-map.php';
 foreach (['html5-named-character-references.php','class-wp-html-attribute-token.php','class-wp-html-span.php','class-wp-html-doctype-info.php','class-wp-html-text-replacement.php','class-wp-html-decoder.php','class-wp-html-tag-processor.php'] as $file) require getenv('WP_HTML_API_DIR').'/'.$file;
 function esc_attr($s){return htmlspecialchars((string)$s, ENT_QUOTES);}
 function esc_url($s,...$args){return esc_attr($s);}
 function wp_kses_uri_attributes(){return ['href','src'];}
 function wp_has_noncharacters($s){return false;}
 function wp_get_attachment_image_src($id,$size){return ['https://media.example/'.$id.'-'.$size.'.jpg',800,1200];}
 function wp_get_attachment_image_url($id,$size){return wp_get_attachment_image_src($id,$size)[0];}
 function wp_get_attachment_image_srcset($id,$size){return 'https://media.example/'.$id.'-small.jpg 400w, https://media.example/'.$id.'-large.jpg 800w';}
 $html='<div class="woocommerce-product-gallery__image" data-thumb="desktop.jpg"><a href="desktop-full.jpg"><img src="desktop.jpg" alt="Native" width="1200" height="800"></a></div>';
 expect(codela_sf_mobile_gallery_picture($html)===$html,'Non-gallery markup untouched');
 $GLOBALS['codela_sf_mobile_gallery_slot']=['desktop'=>10,'mobile'=>20,'hero'=>true];
 $rendered=codela_sf_mobile_gallery_picture($html);
 expect(str_contains($rendered,'<picture><source media="(max-width:900px)"'),'Responsive mobile source emitted');
 expect(str_contains($rendered,'src="desktop.jpg"')&&str_contains($rendered,'href="desktop-full.jpg"'),'Native fallback and original URL retained');
 expect(str_contains($rendered,'data-sf-mobile-url="https://media.example/20-full.jpg"'),'Mobile zoom full source');
 $GLOBALS['codela_sf_mobile_gallery_slot']=['desktop'=>0,'mobile'=>20,'hero'=>false];
 $rendered=codela_sf_mobile_gallery_picture($html);
 expect(str_contains($rendered,'data-sf-gallery-device="mobile"')&&str_contains($rendered,'data-sf-gallery-srcset='),'Extra mobile slides and deferred sources');
 $GLOBALS['codela_sf_mobile_gallery_slot']=['desktop'=>10,'mobile'=>0,'hero'=>false];
 expect(str_contains(codela_sf_mobile_gallery_picture($html),'data-sf-gallery-device="desktop"'),'Desktop-only slides marked');
 unset($GLOBALS['codela_sf_mobile_gallery_slot']);
 echo "Real WordPress HTML parser: art direction, fallback, zoom and device-only slots passed.\n";
}
