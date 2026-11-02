<?php
/** Real WordPress 6.5 HTML parser, no regex markup substitute. */
define('ABSPATH',__DIR__);$actions=[];
function add_filter(...$args){}
function add_action($name,$callback,$priority=10){$GLOBALS['actions'][$name][$priority][]=$callback;}
function esc_attr($value){return htmlspecialchars((string)$value,ENT_QUOTES);}
function _doing_it_wrong($name,$message,$version){throw new RuntimeException($name.': '.$message);}
function is_admin(){return false;}
function wp_print_inline_script_tag($script,$attributes=[]){echo '<script>'.$script.'</script>';}
function check($value,$message){if(!$value)throw new RuntimeException($message);}
$core=getenv('WP_CORE_INCLUDES');
check($core&&is_file($core.'/class-wp-html-tag-processor.php'),'Set WP_CORE_INCLUDES to the WordPress HTML API fixture');
foreach(['attribute-token','span','text-replacement','tag-processor'] as $class)require $core.'/class-wp-html-'.$class.'.php';
require __DIR__.'/../theme/codela-storefront/inc/media.php';
$original='<img src="/native.svg" width="320" height="320" loading="lazy" alt="Native">';
$native=codela_sf_defer_media($original);
check(str_contains($native,'src="/native.svg"')&&!str_contains($native,'data-sf-media-src'),'Native first-screen source remains immediately discoverable');
check(str_contains($native,'data-sf-media-state="loading"'),'Native image has presentation state');
$cached=codela_sf_defer_media(str_replace('alt="Native"','alt="Cached"',$original));
$error=codela_sf_defer_media(str_replace(['/native.svg','Native'],['/broken.svg','Broken'],$original));
$hero='<img src="/hero.svg" width="1200" height="900" loading="eager" fetchpriority="high" alt="Hero">';
check(codela_sf_defer_media($hero)===$hero,'Critical image has no presentation or source delay');
check(codela_sf_defer_media(str_replace('eager','lazy',$hero))===str_replace('eager','lazy',$hero),'High priority always bypasses presentation');
check(codela_sf_defer_media('<img src="/unknown.svg" loading="lazy">')==='<img src="/unknown.svg" loading="lazy">','No guessed dimensions');
codela_sf_image_preloads($hero);
$picture='<picture><source media="(max-width:700px)" srcset="/mobile.svg 600w" sizes="100vw"><img src="/desktop.svg" srcset="/desktop.svg 1200w" sizes="100vw" width="1200" height="900" loading="lazy" alt="Deferred"></picture>';
$deferred=codela_sf_defer_media($picture);
check(str_contains($deferred,'data-sf-media-src="/desktop.svg"')&&str_contains($deferred,'data-sf-media-srcset="/mobile.svg 600w"'),'Deferred responsive sources preserved');
check(str_contains($deferred,'<noscript>')&&str_contains($deferred,'data-sf-media-state="loading"'),'No-script fallback and loading presentation coexist');
ob_start();foreach($actions['wp_head'][2] as $callback)$callback();$bootstrap=ob_get_clean();
check(str_contains($bootstrap,'img[data-sf-media-state]{background:transparent!important}'),'No-script presentation resets');
echo json_encode(compact('native','cached','error','hero','deferred','bootstrap'),JSON_UNESCAPED_SLASHES);
