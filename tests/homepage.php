<?php
/** Production section renderers with isolated WP/Woo boundaries. */
define('ABSPATH',__DIR__);
function __( $s,...$args ){return $s;}function esc_html($s){return htmlspecialchars((string)$s,ENT_QUOTES);}function esc_attr($s){return esc_html($s);}function esc_url($s){return esc_html($s);}function esc_html__($s,...$args){return esc_html($s);}function esc_attr_e($s,...$args){echo esc_attr($s);}function esc_attr__($s,...$args){return esc_attr($s);}function sanitize_html_class($s){return $s;}function absint($s){return abs((int)$s);}function get_template_directory_uri(){return '/theme';}
function codela_sf_icon($name){return '<img class="sf-icon" src="/theme/assets/icons/'.$name.'.svg" alt="">';}
function add_filter(...$args){}function is_front_page(){return true;}function codela_theme_settings(){return $GLOBALS['settings']??[];}function get_bloginfo($s){return 'Store';}function wp_attachment_is_image($id){return in_array($id,[10,11,12,13],true);}function wp_get_attachment_image($id,$size,$icon,$attrs){return '<img alt="Stone" src="/image-'.$id.'.svg" width="1200" height="900" '.implode(' ',array_map(fn($k,$v)=>$k.'="'.$v.'"',array_keys($attrs),$attrs)).'>';}function wp_get_attachment_image_url($id,$size){return '/image-'.$id.'.svg';}function wp_get_attachment_image_srcset($id,$size){return '/image-'.$id.'-160.svg 160w, /image-'.$id.'-320.svg 320w, /image-'.$id.'-640.svg 640w, /image-'.$id.'-1200.svg 1200w';}function get_term($id,$taxonomy){return $id===7?(object)['term_id'=>7,'name'=>'Lighting']:null;}function get_term_meta(...$a){return 12;}function get_term_link($term,...$args){return '/category/'.(is_object($term)?$term->term_id:$term).'/';}function is_wp_error($s){return false;}function get_option($key){return $key==='woocommerce_hide_out_of_stock_items'?'yes':'';}function wc_get_product_visibility_term_ids(){return ['exclude-from-catalog'=>2,'outofstock'=>3];}function get_post_field(...$a){return '';}function wc_get_page_permalink($s){return '/shop/';}function add_query_arg($k,$v,$url){return $url.'?'.$k.'='.$v;}function codela_sf_product_grid($products){return '<ul class="products">'.implode('',array_map(fn($p)=>'<li class="product"><a href="/product/'.$p->id.'">Product '.$p->id.'</a></li>',$products)).'</ul>';}
class WC_Product{function __construct(public $id){}function is_visible(){return $this->id!==99;}function is_in_stock(){return $this->id!==98;}function get_status(){return 'publish';}}
function wc_get_product($id){return new WC_Product($id);}class WP_Query{public $posts;function __construct($args){$GLOBALS['queries'][]=$args;$this->posts=[1,98,99];}}

function codela_sections_contact_rows($data){return empty($data['phone'])?[]:['<div class="codela-contact-row"><dt>Phone</dt><dd><a href="tel:+902125550000">+90 212 555 00 00</a></dd></div>'];}
function codela_sf_png_webp_sources($id){return $GLOBALS['section_webp'][$id]??[];}
require __DIR__.'/../theme/codela-storefront/inc/ui.php';
require __DIR__.'/../theme/codela-storefront/inc/sections.php';
function expect($ok,$msg){if(!$ok)throw new RuntimeException($msg);}
function item($title='Sade yaşam',$image=10){return ['id'=>'item-'.$image,'enabled'=>true,'term_id'=>7,'image_id'=>$image,'mobile_image_id'=>11,'title'=>$title,'subtitle'=>'Doğal dokular ve zamansız koleksiyonlar.','button_label'=>'Keşfet','button_url'=>'/shop/','focal_x'=>50,'focal_y'=>50];}
function data($type,$variant,$items=[]){return ['id'=>'section-'.$type.'-'.$variant,'enabled'=>true,'variant'=>$variant,'title'=>$type==='hero'?'':'Kategorileri keşfet','description'=>'','items'=>$items,'source'=>'new','category_id'=>7,'limit'=>4,'show_all'=>true];}
$html='<div class="codela-page-layout">';
$html.=codela_sf_render_section(null,'hero',data('hero','showcase',[array_merge(item(),['eyebrow'=>'Kadın girişimci • El yapımı']),item('Işığı keşfet',12)]));
foreach(['compact','editorial','bands','mosaic','carousel','grid'] as $variant){
    $items=[item('Aydınlatma'),item('Objeler',12),item('Ev tekstili')];
    if($variant==='bands'){$items[]=item('Dekorasyon');$items[]=item('Yeni koleksiyonlar');}
    $html.=codela_sf_render_section(null,'categories',data('categories',$variant,array_map(fn($item)=>$variant==='editorial'?array_merge($item,['mobile_image_id'=>13]):$item,$items)));
}
foreach(explode(',',getenv('PROMO_VARIANTS')?:'split,inset') as $variant){$html.=codela_sf_render_section(null,'promo',data('promo',$variant,[item('Yeni koleksiyon'),item('Doğadan ilham',12)]));}
$row=data('products','grid');$html.=codela_sf_render_section(null,'products',$row);$html.='</div>';
expect(substr_count($html,'fetchpriority="high"')===1,'Only the first hero receives high priority');
preg_match('/<section class="sf-section sf-section--hero[\\s\\S]*?<\\/section>/', $html, $hero_markup);
expect(str_contains($hero_markup[0],'<span class="sf-hero-eyebrow">Kadın girişimci • El yapımı</span><h1>'),'Optional hero label precedes title');
expect(substr_count($hero_markup[0],'sf-hero-eyebrow')===1,'Missing label creates no empty element or spacing');
expect(!str_contains($hero_markup[0],'data-gallery-prev')&&!str_contains($hero_markup[0],'data-gallery-next'),'Hero removes arrows, not just their icons');
expect(str_contains($hero_markup[0],'01 / 02'),'Hero counter is padded and uses actual valid slide total');
$label_only = array_merge(item(''), ['eyebrow'=>'<script>alert(1)</script>', 'subtitle'=>'', 'button_label'=>'']);
$escaped_label=codela_sf_section_media(data('hero','showcase',[$label_only]),'hero');
expect(str_contains($escaped_label,'&lt;script&gt;')&&!str_contains($escaped_label,'<script>'),'Label is escaped, never executable markup');
expect(!str_contains(codela_sf_section_media(data('promo','split',[$label_only]),'promo'),'sf-hero-eyebrow'),'Label does not leak into other section types');
expect(!str_contains(codela_sf_section_media(data('hero','showcase',[array_merge($label_only,['eyebrow'=>'   '])]),'hero'),'sf-section-copy'),'Whitespace-only label creates no copy container');
expect(str_contains(codela_sf_section_media(data('hero','showcase',[array_merge($label_only,['eyebrow'=>'0'])]),'hero'),'>0</span>'),'Zero is a valid plain-text label');
expect(str_contains(codela_sf_section_controls(5,true),'01 / 05'),'Five slides use 01 / 05');
expect(str_contains(codela_sf_section_controls(12,true),'01 / 12'),'Two digit totals are not truncated');
expect(str_contains(codela_sf_section_controls(2,false),'data-gallery-next'),'Other galleries keep their controls');
expect(codela_sf_section_controls(1,true)==='','Single-slide hero has no false navigation');

expect(substr_count($html,'<h1>')===1,'Exactly one page H1');
expect(str_contains($html,'<source media="(max-width:700px)"'),'Responsive mobile image');
preg_match_all('/<picture[^>]*><source[^>]*sizes="([^"]+)"[^>]*><img[^>]*sizes="([^"]+)"/', $html, $responsive, PREG_SET_ORDER);
expect(count($responsive)>0,'Responsive pictures exercised');
foreach($responsive as $picture){expect($picture[1]===$picture[2],'Mobile source keeps the layout slot width');}
expect(!str_contains($html,'/product/98')&&!str_contains($html,'/product/99'),'Woo stock and visibility');
expect($GLOBALS['queries'][0]['tax_query'][1]['include_children']===true,'Category descendants');
$before=count($GLOBALS['queries']);codela_sf_section_product_query($row);expect(count($GLOBALS['queries'])===$before,'Identical product query memoized per request');
$row['source']='best_sellers';codela_sf_section_product_query($row);expect($GLOBALS['queries'][1]['meta_key']==='total_sales','Real Woo sales ordering');
expect(codela_sf_section_product_query(['category_id'=>99])===[],'Deleted category never broadens query');
expect(codela_sf_render_section(null,'categories',data('categories','grid',[array_merge(item(),['term_id'=>99])]))==='','Missing category omitted');
$GLOBALS['section_webp']=[10=>[['url'=>'/verified-main-640.webp','width'=>640],['url'=>'/verified-main-1200.webp','width'=>1200]],11=>[['url'=>'/verified-mobile-640.webp','width'=>640],['url'=>'/verified-mobile-1200.webp','width'=>1200]]];
$optimized=codela_sf_section_image(item(),true,'50vw');
expect(str_contains($optimized,'src="/verified-main-1200.webp"'),'Verified full-resolution WebP used in section img');
expect(str_contains($optimized,'/verified-main-640.webp 640w'),'Native responsive WebP candidates retained');
expect(str_contains($optimized,'srcset="/verified-mobile-640.webp 640w, /verified-mobile-1200.webp 1200w" sizes="50vw"'),'Mobile source uses its own verified WebP and layout slot');
unset($GLOBALS['section_webp'][11]);
expect(str_contains(codela_sf_section_image(item()),'/image-11-160.svg 160w'),'Unconverted mobile image retains native responsive fallback');
unset($GLOBALS['section_webp']);
expect(!str_contains(codela_sf_section_image(item()),'.webp'),'Missing manifests retain native images');
$story=array_merge(data('story','image-right'),['items'=>[array_merge(item('Hikâyemiz'),['body'=>"Uzun bir hikâye.\nİkinci satır."])]]);
$info=array_merge(data('info','grid'),['items'=>[['enabled'=>true,'title'=>'Kalite','body'=>'Özenli üretim'],['enabled'=>true,'title'=>'','body'=>'']]]);
$contact=array_merge(data('contact','grid'),['phone'=>'+90 212 555 00 00','directions_url'=>'https://example.test/map']);
$content_html=codela_sf_render_section(null,'story',$story).codela_sf_render_section(null,'info',$info).codela_sf_render_section(null,'contact',$contact);
expect(str_contains($content_html,'sf-content--image-right'),'Story image position');
expect(!str_contains($content_html,'data-sf-gallery')&&!str_contains($content_html,'<iframe'),'Static content has no gallery or map');
expect(substr_count($content_html,'sf-content-card')===4,'Only populated story and info cards (including plural wrappers)');
expect(str_contains($content_html,'tel:+902125550000'),'Contact rows use plugin shared helper');
expect(str_contains($content_html,'sf-ui-button--primary'),'Directions reuse shared Button');
$empty=array_merge(data('info','grid'),['items'=>[['enabled'=>true,'title'=>'','body'=>'']]]);
expect(''===codela_sf_render_section(null,'info',$empty),'Empty cards omit whole section');
if(getenv('RENDER_CONTENT')){echo '<div class="codela-page-layout">'.$content_html.'</div>';exit;}
if(getenv('RENDER_HOME')){echo $html;}else{echo "Section catalogue, one LCP/H1, shared cards, Woo visibility and query memoization passed.\n";}
