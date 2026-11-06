<?php
// Deterministic WP/Woo boundary for rendering the real catalog header/form.
if (getenv("FIXTURE_FILTER_QUERY")) { parse_str(getenv("FIXTURE_FILTER_QUERY"), $_GET); }
class WP_Term {
    public $term_id = 7;
    public $taxonomy = 'product_cat';
    public $name = 'Bags & more';
    public $parent = 0;
    public function __construct(){ $this->name = getenv('FIXTURE_CATEGORY_TITLE') ?: 'Bags & more'; $this->parent = getenv('FIXTURE_CATEGORY_PARENT') === '1' ? 2 : 0; }
    public $count = 3;
}
function is_shop() { return getenv('FIXTURE_CATALOG') === 'shop'; }
function is_product_taxonomy() { return in_array(getenv('FIXTURE_CATALOG'), ['category','tag'], true); }
function is_product_category() { return getenv('FIXTURE_CATALOG') === 'category'; }
function is_product_tag() { return getenv('FIXTURE_CATALOG') === 'tag'; }
function get_queried_object() { return new WP_Term(); }
function get_term($id,$taxonomy='product_cat'){ return (object)['term_id'=>(int)$id,'taxonomy'=>$taxonomy,'name'=>'Parent category','parent'=>0]; }
function wc_clean($value) { return is_array($value) ? array_map("wc_clean",$value) : strip_tags($value); }
function wp_unslash($value) { return is_array($value) ? array_map("wp_unslash",$value) : stripslashes($value); }
function wc_format_decimal($value) { return is_numeric($value) ? (string)(float)$value : ''; }
if (!function_exists('add_filter')) { function add_filter(...$args) {} }
function apply_filters($hook,$value) { return $value; }
function get_woocommerce_currency_symbol() { return '$'; }
function wp_parse_url($url,$component) { return parse_url($url,$component); }
function wc_query_string_form_fields($values=null,$exclude=[]) {
    foreach ($values ?? $_GET as $key=>$value) {
        if (!in_array($key,$exclude,true) && is_scalar($value)) {
            echo '<input type="hidden" name="'.esc_attr($key).'" value="'.esc_attr($value).'">';
        }
    }
}
function selected($a,$b) { if ($a===$b) echo 'selected'; }
require __DIR__.'/../theme/codela-storefront/inc/catalog.php';

function remove_query_arg($keys,$url){$args=[];foreach((array)$keys as $key)$args[$key]=false;return add_query_arg($args,$url);}
function wp_strip_all_tags($value){return strip_tags($value);}
function wc_price($value){return '<span class="amount">₺'.number_format((float)$value,2,',','.').'</span>';}
function wc_attribute_taxonomy_slug($taxonomy){return substr($taxonomy,3);}
function wc_attribute_label($taxonomy){return $taxonomy==='pa_color'?'Renk':'Boyut';}
function get_term_by($field,$slug,$taxonomy){return in_array($slug,['cream','black','large'],true)?(object)['name'=>['cream'=>'Krem','black'=>'Siyah','large'=>'Büyük & geniş'][$slug]]:false;}
class WC_Query{static function get_layered_nav_chosen_attributes(){
 $chosen=[];foreach(['color','size'] as $attr){$value=$_GET['filter_'.$attr]??null;if(is_string($value)&&$value!=='')$chosen['pa_'.$attr]=['terms'=>explode(',',$value),'query_type'=>$_GET['query_type_'.$attr]??'and'];}return $chosen;
}}
