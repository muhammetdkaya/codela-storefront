<?php
/** Disposable actual WP/Woo/full Codela acceptance. Never run against production. */
if ( home_url() !== 'http://127.0.0.1:8888' ) { throw new RuntimeException('Disposable site only'); }
function sf_layout_check($ok,$message){if(!$ok){throw new RuntimeException($message);}}
update_option('blog_public',1);
update_option('woocommerce_default_country','TR');
update_option('woocommerce_cod_settings',['enabled'=>'yes','title'=>'Cash on delivery','enable_for_virtual'=>'yes']);
update_option('woocommerce_coming_soon','no');
update_option('woocommerce_store_pages_only','no');
update_option('woocommerce_enable_myaccount_registration','yes');
update_option('codela_active_modules',['store-appearance','checkout','checkout-pro']);
sf_layout_check(codela_is_module_active('checkout-pro'),'Parent and child checkout switches must both be active');
\Codela\Includes\StoreAppearance::save_settings(['account_mode'=>'codela','product_gallery_mode'=>'theme']);
// The theme chooses the EXISTING theme mode without rewriting merchant options.
sf_layout_check('theme' === \Codela\Includes\StoreAppearance::get_surface_mode('account'),'Storefront must own account presentation');
sf_layout_check('codela' === \Codela\Includes\StoreAppearance::get_settings()['account_mode'],'Stored plugin preference retained for other themes');
WC_Install::create_pages();
foreach(['cart','checkout','myaccount'] as $role){$id=wc_get_page_id($role);wp_update_post(['ID'=>$id,'post_content'=>'[woocommerce_'.($role==='myaccount'?'my_account':$role).']']);}
$product=new WC_Product_Simple();$product->set_name('Layout acceptance product');$product->set_status('publish');$product->set_regular_price('99');$product->set_description(str_repeat('Native product detail content. ',80));$product->set_short_description('Original WooCommerce purchase form.');$product->set_virtual(false);$pid=$product->save();
require_once ABSPATH.'wp-admin/includes/image.php';
$uploads=wp_upload_dir();wp_mkdir_p($uploads['path']);$path=$uploads['path'].'/layout-product.jpg';$img=imagecreatetruecolor(800,1000);$color=imagecolorallocate($img,194,179,158);imagefill($img,0,0,$color);imagejpeg($img,$path,80);imagedestroy($img);$image=wp_insert_attachment(['post_title'=>'QA photo','post_mime_type'=>'image/jpeg','post_status'=>'inherit'],$path);wp_update_attachment_metadata($image,wp_generate_attachment_metadata($image,$path));$product->set_image_id($image);$product->save();
$variable=new WC_Product_Variable();$variable->set_name('Layout variable product');$variable->set_status('publish');$variable->set_image_id($image);$attribute=new WC_Product_Attribute();$attribute->set_name('Size');$attribute->set_options(['Small','Large']);$attribute->set_variation(true);$variable->set_attributes([$attribute]);$vid=$variable->save();foreach(['Small','Large'] as $size){$v=new WC_Product_Variation();$v->set_parent_id($vid);$v->set_attributes(['size'=>$size]);$v->set_regular_price('120');$v->set_status('publish');$v->save();}WC_Product_Variable::sync($vid);
$menu=wp_create_nav_menu('Layout primary');$parent=wp_update_nav_menu_item($menu,0,['menu-item-title'=>'Products','menu-item-url'=>get_permalink($pid),'menu-item-status'=>'publish']);$child=wp_update_nav_menu_item($menu,0,['menu-item-title'=>'Nested product','menu-item-url'=>get_permalink($vid),'menu-item-parent-id'=>$parent,'menu-item-status'=>'publish']);wp_update_nav_menu_item($menu,0,['menu-item-title'=>'Deep product','menu-item-url'=>get_permalink($pid),'menu-item-parent-id'=>$child,'menu-item-status'=>'publish']);foreach(['About','Contact','Collection'] as $title){wp_update_nav_menu_item($menu,0,['menu-item-title'=>$title,'menu-item-url'=>home_url('/'),'menu-item-status'=>'publish']);}set_theme_mod('nav_menu_locations',['primary'=>$menu]);
$customer=wp_create_user('layout-customer','layout-customer-local','layout@example.test');$user=new WP_User($customer);$user->set_role('customer');$wc=new WC_Customer($customer);$wc->set_billing_first_name('Layout');$wc->set_billing_last_name('Customer');$wc->set_billing_email('layout@example.test');$wc->set_billing_country('TR');$wc->set_billing_city('Istanbul');$wc->set_billing_address_1('Acceptance address');$wc->set_billing_postcode('34000');$wc->save();
$order=wc_create_order(['customer_id'=>$customer]);$order->add_product(wc_get_product($pid),1);$order->calculate_totals();$order->set_status('processing');$order->save();
$coupon=new WC_Coupon();$coupon->set_code('layout-ten');$coupon->set_discount_type('percent');$coupon->set_amount(10);$coupon->save();
$seed=['order'=>wc_get_endpoint_url('view-order',$order->get_id(),wc_get_page_permalink('myaccount')),'simple'=>get_permalink($pid),'variable'=>get_permalink($vid),'checkout'=>wc_get_checkout_url(),'account'=>wc_get_page_permalink('myaccount'),'pid'=>$pid,'versions'=>['wp'=>get_bloginfo('version'),'woo'=>WC_VERSION,'codela'=>CODELA_VERSION,'theme'=>wp_get_theme()->get('Version')]];
file_put_contents(getenv('SF_REPORT_DIR').'/layout-seed.json',wp_json_encode($seed));
