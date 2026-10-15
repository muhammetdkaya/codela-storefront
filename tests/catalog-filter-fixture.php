<?php
// Deterministic WP/Woo boundary for rendering the real catalog header/form.
class WP_Term {
    public $term_id = 7;
    public $taxonomy = 'product_cat';
    public $name = 'Bags & more';
    public $count = 3;
}
function is_shop() { return getenv('FIXTURE_CATALOG') === 'shop'; }
function is_product_taxonomy() { return getenv('FIXTURE_CATALOG') === 'category'; }
function get_queried_object() { return new WP_Term(); }
function wc_clean($value) { return strip_tags($value); }
function wp_unslash($value) { return stripslashes($value); }
function wc_format_decimal($value) { return is_numeric($value) ? (string)(float)$value : ''; }
function add_filter(...$args) {}
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
