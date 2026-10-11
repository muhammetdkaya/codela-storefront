<?php
// Render the real PHP header with deterministic WP/Woo boundary stubs.
// This is a DOM contract fixture, not a substitute for full WordPress integration.
define('ABSPATH', __DIR__);
function codela_sf_ready() { return true; }
function codela_theme_settings() { return ['menu_id'=>0, 'brand'=>'CODELA'] + (getenv('FIXTURE_DOCK') === false ? [] : ['mobile_dock_enabled'=>getenv('FIXTURE_DOCK')]); }
function __( $s, ...$args ) { return $s; }
function esc_html__( $s, ...$args ) { return htmlspecialchars($s, ENT_QUOTES); }
function esc_html_e( $s, ...$args ) { echo esc_html__($s); }
function esc_attr_e( $s, ...$args ) { echo esc_html__($s); }
function esc_attr( $s ) { return esc_html__($s); }
function esc_html( $s ) { return esc_html__($s); }
function esc_url( $s ) { return esc_html__($s); }
function esc_url_raw( $s ) { return $s; }
function absint( $n ) { return abs((int)$n); }
function get_nav_menu_locations() { return []; }
function get_template_directory_uri() { return 'https://store.test/theme'; }
function home_url( $s ) { return 'https://store.test'.$s; }
function wc_get_page_permalink( $s ) { return home_url('/'.$s.'/'); }
function wc_get_cart_url() { return home_url('/cart/'); }
function wc_get_checkout_url() { return home_url('/checkout/'); }
function rest_url( $s ) { return home_url('/wp-json/'.$s); }
function wp_interactivity_state( ...$args ) {}
function get_option( ...$args ) { return ''; }
function get_bloginfo( ...$args ) { return 'CODELA'; }
function has_custom_logo() { return false; }
function is_checkout() { return getenv('FIXTURE_CHECKOUT') === '1'; }
function is_front_page() { return true; }
function is_account_page() { return false; }
function get_privacy_policy_url() { return ''; }
function add_query_arg( $args, $url ) { return $url.'?'.http_build_query($args); }
function get_terms( ...$args ) { return [(object)['parent'=>0,'term_id'=>1,'name'=>'Collection'],(object)['parent'=>1,'term_id'=>2,'name'=>'Shoes']]; }
function get_term_link( $term ) { return home_url('/category/'.$term->term_id.'/'); }
function is_wp_error( ...$args ) { return false; }
require __DIR__.'/../theme/codela-storefront/inc/render.php';
echo codela_sf_header();

