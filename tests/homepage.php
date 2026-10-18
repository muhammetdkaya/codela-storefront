<?php
/** Production section renderers with isolated WP/Woo boundaries. */
define('ABSPATH',__DIR__);
function __( $s,...$args ){return $s;}function esc_html($s){return htmlspecialchars((string)$s,ENT_QUOTES);}function esc_attr($s){return esc_html($s);}function esc_url($s){return esc_html($s);}function esc_html__($s,...$args){return esc_html($s);}function esc_attr_e($s,...$args){echo esc_attr($s);}function esc_attr__($s,...$args){return esc_attr($s);}function sanitize_html_class($s){return $s;}function absint($s){return abs((int)$s);}function get_template_directory_uri(){return '/theme';}
function codela_sf_icon($name){return '<img class="sf-icon" src="/theme/assets/icons/'.$name.'.svg" alt="">';}
function add_filter(...$args){}function is_front_page(){return true;}function codela_theme_settings(){return $GLOBALS['settings']??[];}function get_bloginfo($s){return 'Store';}function wp_attachment_is_image($id){return in_array($id,[10,11,12],true);}function wp_get_attachment_image($id,$size,$icon,$attrs){return '<img alt="Stone" src="/image-'.$id.'.svg" width="1200" height="900" '.implode(' ',array_map(fn($k,$v)=>$k.'="'.$v.'"',array_keys($attrs),$attrs)).'>';}function wp_get_attachment_image_url($id,$size){return '/image-'.$id.'.svg';}function wp_get_attachment_image_srcset($id,$size){return '/image-'.$id.'.svg 1200w';}function get_term($id,$taxonomy){return $id===7?(object)['term_id'=>7,'name'=>'Lighting']:null;}function get_term_meta(...$a){return 12;}function get_term_link($term,...$args){return '/category/'.(is_object($term)?$term->term_id:$term).'/';}function is_wp_error($s){return false;}function get_option($key){return $key==='woocommerce_hide_out_of_stock_items'?'yes':'';}function wc_get_product_visibility_term_ids(){return ['exclude-from-catalog'=>2,'outofstock'=>3];}function get_post_field(...$a){return '';}function wc_get_page_permalink($s){return '/shop/';}function add_query_arg($k,$v,$url){return $url.'?'.$k.'='.$v;}function codela_sf_product_grid($products){return '<ul class="products">'.implode('',array_map(fn($p)=>'<li class="product"><a href="/product/'.$p->id.'">Product '.$p->id.'</a></li>',$products)).'</ul>';}
class WC_Product{function __construct(public $id){}function is_visible(){return $this->id!==99;}function is_in_stock(){return $this->id!==98;}function get_status(){return 'publish';}}
function wc_get_product($id){return new WC_Product($id);}class WP_Query{public $posts;function __construct($args){$GLOBALS['queries'][]=$args;$this->posts=[1,98,99];}}

require __DIR__.'/../theme/codela-storefront/inc/ui.php';
require __DIR__.'/../theme/codela-storefront/inc/sections.php';
function expect($ok,$msg){if(!$ok)throw new RuntimeException($msg);}
function item($title='Sade yaşam',$image=10){return ['id'=>'item-'.$image,'enabled'=>true,'term_id'=>7,'image_id'=>$image,'mobile_image_id'=>11,'title'=>$title,'subtitle'=>'Doğal dokular ve zamansız koleksiyonlar.','button_label'=>'Keşfet','button_url'=>'/shop/','focal_x'=>50,'focal_y'=>50];}
function data($type,$variant,$items=[]){return ['id'=>'section-'.$type.'-'.$variant,'enabled'=>true,'variant'=>$variant,'title'=>$type==='hero'?'':'Kategorileri keşfet','description'=>'','items'=>$items,'source'=>'new','category_id'=>7,'limit'=>4,'show_all'=>true];}
$html='<div class="codela-page-layout">';
$html.=codela_sf_render_section(null,'hero',data('hero','showcase',[item(),item('Işığı keşfet',12)]));
foreach(['compact','editorial','bands','mosaic','carousel','grid'] as $variant){$html.=codela_sf_render_section(null,'categories',data('categories',$variant,[item('Aydınlatma'),item('Objeler',12),item('Ev tekstili')]));}
foreach(explode(',',getenv('PROMO_VARIANTS')?:'split,inset') as $variant){$html.=codela_sf_render_section(null,'promo',data('promo',$variant,[item('Yeni koleksiyon'),item('Doğadan ilham',12)]));}
$row=data('products','grid');$html.=codela_sf_render_section(null,'products',$row);$html.='</div>';
expect(substr_count($html,'fetchpriority="high"')===1,'Only the first hero receives high priority');
expect(substr_count($html,'<h1>')===1,'Exactly one page H1');
expect(str_contains($html,'<source media="(max-width:700px)"'),'Responsive mobile image');
expect(!str_contains($html,'/product/98')&&!str_contains($html,'/product/99'),'Woo stock and visibility');
expect($GLOBALS['queries'][0]['tax_query'][1]['include_children']===true,'Category descendants');
$before=count($GLOBALS['queries']);codela_sf_section_product_query($row);expect(count($GLOBALS['queries'])===$before,'Identical product query memoized per request');
$row['source']='best_sellers';codela_sf_section_product_query($row);expect($GLOBALS['queries'][1]['meta_key']==='total_sales','Real Woo sales ordering');
expect(codela_sf_section_product_query(['category_id'=>99])===[],'Deleted category never broadens query');
expect(codela_sf_render_section(null,'categories',data('categories','grid',[array_merge(item(),['term_id'=>99])]))==='','Missing category omitted');
if(getenv('RENDER_HOME')){echo $html;}else{echo "Section catalogue, one LCP/H1, shared cards, Woo visibility and query memoization passed.\n";}
