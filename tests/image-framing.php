<?php
/** Execute the production attachment editor and variation metadata at WP boundaries. */
define( 'ABSPATH', __DIR__ );
$hooks = []; $meta = []; $can_edit = true; $nonce_ok = true;
function add_filter( $hook, $callback, ...$args ) { $GLOBALS['hooks'][$hook] = $callback; }
function __( $s, ...$args ) { return $s; }
function esc_html__( $s, ...$args ) { return esc_html( $s ); }
function esc_attr__( $s, ...$args ) { return esc_attr( $s ); }
function esc_html( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function esc_attr( $s ) { return esc_html( $s ); }
function checked( $a, $b, $echo = true ) { $v = $a === $b ? 'checked="checked"' : ''; if ( $echo ) { echo $v; } return $v; }
function selected( $a, $b, $echo = true ) { $v = $a === $b ? 'selected="selected"' : ''; if ( $echo ) { echo $v; } return $v; }
function wp_nonce_field( $action, $name, ...$args ) { return '<input type="hidden" name="' . esc_attr( $name ) . '" value="nonce">'; }
function wp_verify_nonce( $nonce, $action ) { return $GLOBALS['nonce_ok'] && 'nonce' === $nonce; }
function current_user_can( $cap, $id ) { return $GLOBALS['can_edit'] && $cap === 'edit_post' && $id === 17; }
function wp_attachment_is_image( $id ) { return in_array( $id, [17,18], true ); }
function get_post_meta( $id, $key, $single ) { return $GLOBALS['meta'][$id][$key] ?? ''; }
function update_post_meta( $id, $key, $value ) { $GLOBALS['meta'][$id][$key] = $value; return true; }
function expect( $test, $message ) { if ( ! $test ) { throw new RuntimeException( $message ); } }
require __DIR__ . '/../theme/codela-storefront/inc/image-framing.php';
expect( codela_sf_image_framing(17) === ['fit'=>'cover','focus'=>'center','position'=>'50% 50%'], 'Existing images default to centered fill' );
$fields = $hooks['attachment_fields_to_edit'](['alt'=>['label'=>'Native alt']], (object)['ID'=>17]);
expect( isset($fields['alt'], $fields['codela_sf_mobile_fill'], $fields['codela_sf_focus']), 'Native fields retained' );
expect( str_contains($fields['codela_sf_mobile_fill']['html'], 'checked="checked"') && str_contains($fields['codela_sf_mobile_fill']['html'], 'value="0"'), 'On and unchecked values both submit explicitly' );
expect( substr_count($fields['codela_sf_focus']['html'], '<option') === 9, 'Nine bounded focal points' );
$save = $hooks['attachment_fields_to_save'];
$values = ['codela_sf_mobile_fill'=>'1','codela_sf_focus'=>'top-right','codela_sf_framing_nonce'=>'nonce'];
$save(['ID'=>17], $values);
expect( codela_sf_image_framing(17)['position'] === '100% 0%', 'Focal point persisted' );
$before = $meta;
foreach ( ['no-edit', 'bad-nonce', 'invalid', 'array', 'partial'] as $case ) {
    $can_edit = $case !== 'no-edit'; $nonce_ok = $case !== 'bad-nonce'; $bad = $values;
    if ($case==='invalid') { $bad['codela_sf_focus']='right;display:none'; }
    if ($case==='array') { $bad['codela_sf_mobile_fill']=['1']; }
    if ($case==='partial') { unset($bad['codela_sf_focus']); }
    $save(['ID'=>17], $bad); expect($meta===$before, 'Rejected edits cannot mutate metadata: '.$case);
}
$can_edit = $nonce_ok = true;
$save(['ID'=>17], array_replace($values, ['codela_sf_mobile_fill'=>'0','codela_sf_focus'=>'bottom']));
expect(codela_sf_image_framing(17)['fit']==='contain', 'Unchecked fills persist as contain');
expect(codela_sf_image_framing(18)['fit']==='cover', 'Other gallery images are independent');
$meta[18]['_codela_sf_image_framing']=['fit'=>[], 'focus'=>['bad']];
expect(codela_sf_image_framing(18)['position']==='50% 50%', 'Malformed stored values have safe defaults');
$attrs=codela_sf_image_framing_attributes(17, ['alt'=>'Original alt','style'=>'opacity:1;']);
expect($attrs['alt']==='Original alt' && str_contains($attrs['style'],'opacity:1;--sf-image-mobile-fit:contain'), 'Original image attributes remain intact');
$data=['image_id'=>17,'image'=>['src'=>'original.webp','width'=>2000],'price'=>123,'is_in_stock'=>true];
$variation=$hooks['woocommerce_available_variation']($data);
expect($variation['image']['codela_sf_mobile']===['fit'=>'contain','position'=>'50% 100%'], 'Variation uses its own image framing');
unset($variation['image']['codela_sf_mobile']);expect($variation===$data, 'Native commerce/image fields are untouched');
if (getenv('RENDER_IMAGE_FRAMING')) {
    $save(['ID'=>17], $values);
    file_put_contents(getenv('RENDER_IMAGE_FRAMING'), json_encode(['fields'=>$fields,'cover'=>codela_sf_image_framing_attributes(17),'contain'=>$attrs]));
}
echo "Per-image defaults, native editor, capability/nonce, atomic rejection and variation metadata passed.\n";
