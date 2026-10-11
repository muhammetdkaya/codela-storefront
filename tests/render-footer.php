<?php
// A deterministic WordPress/WooCommerce fixture for the real footer renderer.
define( 'ABSPATH', __DIR__ );
function codela_sf_ready() { return true; }
function codela_theme_settings() { return [ 'brand' => 'CODELA', 'footer_text' => getenv('FOOTER_NOTE') ? 'Simple products' : '' ]; }
function get_bloginfo() { return 'CODELA'; }
function sanitize_text_field( $text ) { return trim(strip_tags($text)); }
function absint( $number ) { return abs((int)$number); }
function get_option( $name, $default = 0 ) { return $name === 'woocommerce_terms_page_id' && getenv('FOOTER_TERMS') ? 33 : $default; }
function get_post_status( $id ) { return getenv('FOOTER_DRAFT') ? 'draft' : 'publish'; }
function get_permalink( $id ) { return 'https://store.test/terms/'; }
function get_privacy_policy_url() { return getenv('FOOTER_PRIVACY') ? 'https://store.test/privacy/' : ''; }
function home_url( $path = '' ) { return 'https://store.test' . $path; }
function wp_date( $format ) { return '2026'; }
function __( $text, $domain = '' ) { return $text; }
function esc_html__( $text, $domain = '' ) { return htmlspecialchars($text,ENT_QUOTES,'UTF-8'); }
function esc_attr__( $text, $domain = '' ) { return htmlspecialchars($text,ENT_QUOTES,'UTF-8'); }
function esc_html( $text ) { return htmlspecialchars((string)$text,ENT_QUOTES,'UTF-8'); }
function esc_attr( $text ) { return htmlspecialchars((string)$text,ENT_QUOTES,'UTF-8'); }
function esc_url( $text ) { return htmlspecialchars((string)$text,ENT_QUOTES,'UTF-8'); }
require __DIR__ . '/../theme/codela-storefront/inc/render.php';
echo codela_sf_footer();
