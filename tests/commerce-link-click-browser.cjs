const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base='theme/codela-storefront/';
const feedback=fs.readFileSync(base+'assets/scripts/navigation-feedback.js','utf8');
const commerce=fs.readFileSync(base+'assets/scripts/commerce-links.js','utf8');
const css=['styles/tokens.css','storefront.css','styles/components.css','styles/navigation.css','styles/navigation-feedback.css','styles/commerce-skeleton.css'].map(f=>fs.readFileSync(base+'assets/'+f,'utf8')).join('\n');
const php=(name)=>execFileSync('php',['-r',"define('ABSPATH','/');function esc_html__($v,$d=''){return $v;} require 'theme/codela-storefront/inc/document-continuity.php';echo codela_sf_commerce_skeleton_markup('"+name+"');"],{encoding:'utf8'});
const config={
  home:'https://store.test/',cart:'https://store.test/sepet/',checkout:'https://store.test/odeme/',account:'https://store.test/hesabim/',
  commerceSkeletons:{cart:php('cart'),checkout:php('checkout')},cartLabel:'Sepet',checkoutLabel:'Ödeme',loading:'Yükleniyor…',
  brandMarkup:'<span>Codela</span>'
};
function fixture(from,to){
  return '<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width,initial-scale=1">'
   +'<style>body{margin:0;background:#faf9f7;font-family:system-ui}.sf-header{height:78px}.sf-mobile-dock{height:66px;background:white}[hidden]{display:none!important}'+css+'</style>'
   +'<script>window.codelaSFDocument='+JSON.stringify(config)+'</script>'
   +'<script>'+feedback+'</script><script>'+commerce+'</script>'
   +'</head><body class="woocommerce-'+from+'"><div class="sf-shell">'
   +'<header class="sf-header"><div class="sf-brand">Codela</div><div class="sf-actions"><button class="sf-menu-trigger">Menü</button></div></header>'
   +(from==='cart'?'<nav class="sf-mobile-dock"><div class="sf-dock-surface">Alt menü</div></nav>':'')+'</div>'
   +'<main id="sf-content"><a id="go" href="https://store.test/'+(to==='cart'?'sepet':'odeme')+'/">'
   +(to==='cart'?'Sepete dön':'Ödemeye geç')+'</a></main></body></html>';
}
(async()=>{
  const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true});
  try{
    for(const [from,to] of [['cart','checkout'],['checkout','cart']]){
      const page=await browser.newPage({viewport:{width:390,height:844}});
      let requestResolve,release;
      const requested=new Promise(resolve=>requestResolve=resolve);
      await page.route('https://store.test/'+(to==='cart'?'sepet':'odeme')+'/',async route=>{
        requestResolve();
        await new Promise(resolve=>release=resolve);
        await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body><h1>Woo destination</h1></body></html>'});
      });
      await page.route('https://store.test/'+(from==='cart'?'sepet':'odeme')+'/',route=>
        route.fulfill({status:200,contentType:'text/html',body:fixture(from,to)}));
      await page.goto('https://store.test/'+(from==='cart'?'sepet':'odeme')+'/',{waitUntil:'load'});
      await page.locator('#go').click({noWaitAfter:true});
      await page.locator('.sf-skeleton').waitFor({state:'visible',timeout:4000});
      assert.equal(await page.locator('.sf-skeleton-layout .sf-commerce-'+to+'-row').count(),to==='cart'?2:0,'Row count belongs to destination');
      const hasPreview=await page.evaluate(type=>{
        const root=document.querySelector('.sf-skeleton');
        return !!root && !!root.querySelector('.sf-commerce-skeleton--'+type);
      },to);
      assert(hasPreview,'The matching commerce skeleton starts on the source document immediately');
      const didRequest=await Promise.race([requested.then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),4500))]);
      assert(didRequest,'Skeleton must not cancel native navigation '+from+' → '+to);
      release();
      await page.waitForURL('https://store.test/'+(to==='cart'?'sepet':'odeme')+'/',{timeout:8000});
      assert.equal(await page.locator('h1').innerText(),'Woo destination','Real native browser navigation completes');
      await page.close();
    }
    console.log('Commerce cart/checkout link click starts one source-document skeleton and retains native navigation');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
