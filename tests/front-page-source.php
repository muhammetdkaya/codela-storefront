<?php
/** Reading settings are authoritative; retired Codela options cannot select a homepage. */
define('ABSPATH',__DIR__);
function codela_sf_ready(){return true;}
function get_option($key){return $GLOBALS['options'][$key]??null;}
function codela_theme_settings(){return ['homepage_mode'=>'sections','hero_product_id'=>42];}
function do_blocks($content){$GLOBALS['rendered'][]=$content;return $content;}
require __DIR__.'/../theme/codela-storefront/inc/render.php';
function check($ok,$msg){if(!$ok)throw new RuntimeException($msg);}
$GLOBALS['options']=['show_on_front'=>'page','page_on_front'=>42];
check(str_contains(codela_sf_home(),'wp:post-content'),'Static homepage uses native post-content');
$GLOBALS['options']['show_on_front']='posts';
check(str_contains(codela_sf_home(),'codela-storefront/journal-loop'),'Posts homepage uses inherited WordPress query');
check(!str_contains(codela_sf_home(),'woocommerce'),'No implicit product/homepage selection');
echo "Native Reading settings own homepage selection.\n";
