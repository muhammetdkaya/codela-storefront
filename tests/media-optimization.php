<?php
// Isolated native-image contract tests; no live uploads or customer data.
define( 'ABSPATH', __DIR__ );
$GLOBALS['filters'] = [];
$GLOBALS['actions'] = [];
$GLOBALS['meta_write'] = null;
$GLOBALS['attachment_meta'] = [];
$GLOBALS['post_meta'] = [];
function add_filter( $hook, $callback, $priority = 10 ) { $GLOBALS['filters'][$hook][] = $callback; }
function add_action( $hook, $callback, $priority = 10 ) { $GLOBALS['actions'][$hook][] = $callback; }
function wp_image_editor_supports( $args ) { return $GLOBALS['supports_webp'] ?? true; }
function get_post_mime_type( $id ) { return $id === 1 ? 'image/jpeg' : ( $id === 3 ? 'image/gif' : 'image/png' ); }
function get_post_meta( $id, $key, $single ) { return $GLOBALS['post_meta'][$id][$key] ?? ''; }
function update_post_meta( $id, $key, $value ) { $GLOBALS['post_meta'][$id][$key] = $value; }
function wp_get_attachment_metadata( $id ) { return $GLOBALS['attachment_meta'][$id] ?? []; }
function get_attached_file( $id ) { return $GLOBALS['file']; }
function wp_get_attachment_url( $id ) { return 'https://site.test/wp-content/uploads/2026/10/original.png'; }
function is_wp_error( $value ) { return $value instanceof Exception; }
function wp_update_attachment_metadata( $id, $meta ) { $GLOBALS['meta_write'] = $meta; return true; }
class FakeEditor {
    public function set_quality( $quality ) { return true; }
    public function resize( $width, $height, $crop ) { return true; }
    public function save( $path, $mime ) {
        if ( ! empty( $GLOBALS['fail_png_full'] ) && str_contains( $path, '1024.webp' ) ) { return new Exception('encode failure'); }
        file_put_contents( $path, str_repeat( 'w', 800 ) );
        return [ 'file' => basename( $path ), 'mime-type' => $mime ];
    }
    public function make_subsize( $size ) {
        $file = 'original-' . $size['width'] . 'x' . $size['height'] . '.webp';
        file_put_contents( dirname($GLOBALS['file']).'/'.$file, str_repeat('w', 30) );
        return ['file'=>$file,'width'=>$size['width'],'height'=>$size['height'],'mime-type'=>'image/webp'];
    }
}
function wp_get_image_editor( $path ) { return new FakeEditor(); }
function test( $condition, $message ) { if ( ! $condition ) { throw new Exception($message); } }
require __DIR__ . '/../theme/codela-storefront/inc/media-optimization.php';
$filter = $GLOBALS['filters']['image_editor_output_format'][0] ?? null;
test( is_callable($filter), 'WordPress output-format filter registered' );
test( $filter(['image/heic'=>'image/jpeg']) === ['image/heic'=>'image/jpeg','image/jpeg'=>'image/webp','image/png'=>'image/webp'], 'Other mime mappings preserved and JPEG becomes WebP' );
test( $filter(['image/jpeg'=>'image/avif','image/png'=>'image/avif'])['image/png'] === 'image/avif', 'Existing conversion mappings are not overridden' );
$GLOBALS['supports_webp'] = false;
test( $filter([]) === [], 'Unsupported server keeps default image formats' );
$GLOBALS['supports_webp'] = true;
test( codela_sf_optimize_existing_image(2)['status'] === 'skipped', 'PNG is not converted' );
$dir = sys_get_temp_dir().'/sf-native-webp-'.getmypid();
mkdir($dir);
try {
    $GLOBALS['file']=$dir.'/original.jpg';
    file_put_contents($GLOBALS['file'], str_repeat('O', 1000));
    file_put_contents($dir.'/original-300x300.jpg', str_repeat('j', 300));
    $GLOBALS['attachment_meta'][1]=[
        'file'=>'2026/10/original.jpg',
        'width'=>1000,'height'=>1000,
        'image_meta'=>['copyright'=>'original metadata retained'],
        'sizes'=>[
            'medium'=>['file'=>'original-300x300.jpg','width'=>300,'height'=>300,'mime-type'=>'image/jpeg'],
            'thumb'=>['file'=>'existing.webp','width'=>48,'height'=>48,'mime-type'=>'image/webp'],
        ]
    ];
    $first=codela_sf_optimize_existing_image(1);
    test($first['status']==='optimized' && $first['saved']===270 && $first['converted']===1,'Valid WebP derivative saves bytes');
    test($GLOBALS['meta_write']['sizes']['medium']['mime-type']==='image/webp', 'Only converted size gets metadata update');
    test($GLOBALS['meta_write']['sizes']['thumb']['file']==='existing.webp', 'Existing WebP retained');
    test($GLOBALS['meta_write']['image_meta']['copyright']==='original metadata retained','Custom metadata retained');
    test(file_exists($dir.'/original-300x300.jpg')&&file_exists($GLOBALS['file']), 'Original full and prior JPEG derivatives retained');
    test(codela_sf_optimize_existing_image(1)['status']==='skipped', 'Idempotent repeat');
    unset($GLOBALS['post_meta'][1]['_codela_sf_webp_v1']);
    $GLOBALS['supports_webp']=false;
    test(codela_sf_optimize_existing_image(1)['status']==='unsupported', 'Encoder failure is safe');
    test($GLOBALS['meta_write']['sizes']['medium']['file']==='original-300x300.webp', 'Failure cannot rewrite prior metadata');
    // Gallery PNGs retain the original upload and native zoom while using
    // a separate responsive WebP manifest for the visible photograph.
    $GLOBALS['supports_webp']=true;
    $GLOBALS['file']=$dir.'/original.png';
    file_put_contents($GLOBALS['file'],str_repeat('p',5000));
    $GLOBALS['attachment_meta'][2]=[
        'file'=>'2026/10/original.png','width'=>1024,'height'=>1536,
        'sizes'=>['woocommerce_single'=>['file'=>'original-600x900.png','width'=>600,'height'=>900]]
    ];
    $png=codela_sf_optimize_png(2);
    test($png['status']==='optimized' && $png['converted']===1 && $png['saved']===4200,'Full PNG compressed with byte savings');
    $sources=codela_sf_png_webp_sources(2);
    test(count($sources)===3 && array_column($sources,'width')===[640,960,1024],'Responsive WebP variants retain original ratio and pixels');
    test(str_ends_with($sources[2]['url'],'codela-sf-2-1024.webp'),'Gallery URL points to generated WebP');
    test(file_exists($GLOBALS['file']) && file_exists($dir.'/original-sf-1024.webp'),'PNG full and WebP coexist');
    test($GLOBALS['attachment_meta'][2]['sizes']['woocommerce_single']['file']==='original-600x900.png','Original WordPress image metadata unmodified');
    test(codela_sf_optimize_png(2)['status']==='skipped','PNG batch conversion is idempotent');
    $saved_manifest=$GLOBALS['post_meta'][2]['_codela_sf_png_webp_v1'];
    $GLOBALS['post_meta'][2]['_codela_sf_png_webp_v1']['sources'][0]['file']='../evil.webp';
    test(count(codela_sf_png_webp_sources(2))===2,'Unsafe manifest path cannot be served');
    $GLOBALS['post_meta'][2]['_codela_sf_png_webp_v1']=$saved_manifest;
    $GLOBALS['supports_webp']=false;
    test(codela_sf_optimize_png(4)['status']==='unsupported','PNG encoder failure leaves original unchanged');
    $GLOBALS['supports_webp']=true;
    $GLOBALS['fail_png_full']=true;
    unset($GLOBALS['post_meta'][2]['_codela_sf_png_webp_v1']);
    test(codela_sf_optimize_png(2)['status']==='unchanged','Failed full-size conversion never publishes lower-resolution manifest');
    test(codela_sf_png_webp_sources(2)===[],'No incomplete manifest is served');

} finally {
    foreach (glob($dir.'/*') as $path)unlink($path);
    rmdir($dir);
}
echo "Native JPEG/PNG WebP sources, fallback and safe backfill passed.\n";
