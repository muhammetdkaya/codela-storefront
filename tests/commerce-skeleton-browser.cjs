// The real PHP skeleton markup powers BOTH an incoming navigation preview
// and a direct Cart/Checkout document's first paint. These fixtures never
// duplicate Woo forms or trigger commerce requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const {chromium,webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = 'theme/codela-storefront/';
const php = fs.readFileSync(base+'functions.php','utf8');
const feedback = fs.readFileSync(base+'assets/scripts/navigation-feedback.js','utf8');
const checkout = fs.readFileSync(base+'assets/scripts/checkout-steps.js','utf8');
const styles = ['styles/tokens.css','storefront.css','styles/components.css','styles/navigation.css','styles/navigation-feedback.css','styles/commerce-skeleton.css','styles/cart-page.css','styles/checkout.css']
  .map(p=>fs.readFileSync(base+'assets/'+p,'utf8')).join('\n');
function markup(type) {
  const expression = "define('ABSPATH', '/'); require 'theme/codela-storefront/inc/document-continuity.php'; echo codela_sf_commerce_skeleton_markup('"+type+"');";
  return execFileSync(process.env.PHP_BIN||'php',['-r',expression],{encoding:'utf8'});
}
const cart = markup('cart');
const payment = markup('checkout');
assert.equal((cart.match(/class="sf-commerce-cart-row"/g)||[]).length,2,'Cart uses two true product row placeholders');
assert.equal((payment.match(/class="sf-commerce-checkout-field"/g)||[]).length,4,'Checkout uses four true input placeholders');
assert(!/<form\b|<input\b|<button\b|<a\b/i.test(cart+payment),'Loading fragments contain no interactive fake elements');
assert(checkout.includes('window.codelaSFCheckoutBoot?.ready()'),'Real Woo stepper releases checkout skeleton after activation');
assert(checkout.includes('window.codelaSFCheckoutBoot?.fallback()'),'Unsupported checkout fails open');
const guard = type => {
  const matches = php.match(new RegExp('<style id="codela-'+type+'-first-paint">[\\s\\S]*?<\\/style>[\\s\\S]*?<script id="codela-'+type+'-first-paint-script">[\\s\\S]*?<\\/script>'));
  assert(matches,'Head boot exists for '+type);
  return matches[0];
};
const snapshot=(type,js=true)=>'<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width,initial-scale=1">'
  +guard(type)+'<style>body{margin:0;font-family:system-ui}body .sf-shell>.sf-header{height:68px}[hidden]{display:none!important}'+styles+'</style>'
  +'</head><body class="woocommerce-'+(type==='cart'?'cart':'checkout')+'">'
  +'<section class="sf-commerce-entry sf-commerce-entry--'+type+' sf-skeleton" role="status" aria-live="polite"><span class="sf-skeleton-status">Yükleniyor…</span><div class="sf-skeleton-layout" aria-hidden="true">'+(type==='cart'?cart:payment)+'</div></section>'
  +'<div class="sf-shell has-mobile-dock"><header class="sf-header"><div class="sf-brand">REAL HEADER</div></header>'
  +(type==='cart'?'<nav class="sf-mobile-dock"><div class="sf-dock-surface">REAL DOCK</div></nav>':'')+'</div>'
  +'<main id="sf-content" class="sf-content sf-'+type+'-page"><div class="wp-block-post-content"><div class="woocommerce">'
  +(type==='cart'?'<div class="wc-block-cart"><p>Native Woo cart</p></div>':'<form class="checkout woocommerce-checkout"><input name="billing_email"><button type="submit">Native Woo checkout</button></form>')
  +'</div></div></main></body></html>';

(async()=>{
  const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true});
  try{
    for(const type of ['cart','checkout']) for(const width of [390,1120]){
      const page=await browser.newPage({viewport:{width,height:844}});
      await page.setContent(snapshot(type));
      const entry=page.locator('.sf-commerce-entry');
      const native=page.locator(type==='cart'?'.wc-block-cart':'form.checkout');
      assert(await entry.isVisible(),type+'/'+width+' shared entry fragment visible on first paint');
      assert(!await native.isVisible(),type+'/'+width+' no legacy Woo flash');
      const before=await entry.evaluate((el,kind)=>({
        z:getComputedStyle(el).zIndex,
        rows:el.querySelectorAll(kind==='cart'?'.sf-commerce-cart-row':'.sf-commerce-checkout-field').length,
        button:el.querySelector('.sf-commerce-dark-action')?.getBoundingClientRect().toJSON(),
      }),type);
      assert.equal(before.rows,type==='cart'?2:4,'Accurate commerce placeholder count');
      assert(before.button?.height===76,'Checkout control height matches native');
      if(width===390) {
        assert(before.button.bottom<=844-8,'Checkout footer stays in viewport');
      }
      const ready=type==='cart'?'codelaSFCartBoot':'codelaSFCheckoutBoot';
      await page.evaluate(ready=>window[ready].ready(),ready);
      assert(!await entry.isVisible(),'Ready hides only skeleton');
      assert(await native.isVisible(),'After activation native content is visible in fixture');
      await page.close();
      const failed=await browser.newPage({viewport:{width,height:844}});
      await failed.setContent(snapshot(type));
      await failed.evaluate(ready=>window[ready].fallback(),ready);
      assert(!await failed.locator('.sf-commerce-entry').isVisible(),'Failure hides skeleton');
      assert(await failed.locator(type==='cart'?'.wc-block-cart':'form.checkout').isVisible(),'Failure restores Woo native surface');
      await failed.close();
      const noJS=await browser.newPage({viewport:{width,height:844},javaScriptEnabled:false});
      await noJS.setContent(snapshot(type));
      assert(!await noJS.locator('.sf-commerce-entry').isVisible(),'No-JS has no fake loader');
      assert(await noJS.locator(type==='cart'?'.wc-block-cart':'form.checkout').isVisible(),'No-JS sees native Woo');
      await noJS.close();
    }
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.setContent('<!doctype html><html><head><style>'+styles+'</style></head><body><div class="sf-shell"><header class="sf-header"><span class="sf-brand">REAL</span></header><nav class="sf-mobile-dock"><div class="sf-dock-surface">DOCK</div></nav></div><main id="sf-content">OLD PAGE</main><footer class="sf-footer">FOOTER</footer></body></html>');
    await page.evaluate(({cart,payment})=>{
      window.codelaSFDocument={
        home:'https://store.test/',cart:'https://store.test/sepet/',checkout:'https://store.test/odeme/',
        commerceSkeletons:{cart,checkout:payment},cartLabel:'Sepet',checkoutLabel:'Ödeme',loading:'Yükleniyor…'
      };
    },{cart,payment});
    await page.addScriptTag({content:feedback});
    for(const [type,url,expected] of [['cart','https://store.test/sepet/','sf-commerce-cart-row'],['checkout','https://store.test/odeme/','sf-commerce-checkout-field']]){
      await page.evaluate(url=>window.__token=codelaSFFeedback.begin({url}),url);
      const layout=page.locator('.sf-skeleton-layout');
      assert(await layout.isVisible(),type+' destination skeleton is visible');
      const actual=await layout.innerHTML();
      assert.equal(actual,type==='cart'?cart:payment,'Navigation uses IDENTICAL server fragment for '+type);
      assert.equal(await layout.locator('.'+expected).count(),type==='cart'?2:4);
      assert.equal(await page.locator('.sf-header-destination').count(),1,'Real header destination is present');
      await page.evaluate(()=>codelaSFFeedback.end(window.__token));
      assert.equal(await page.locator('.sf-skeleton').count(),0,'Navigation skeleton cleans up');
    }
    await page.close();
    console.log('Cart + checkout: shared PHP source, first paint, navigation, fixed geometry, error and no-JS fallback passed (Chromium/WebKit).');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
