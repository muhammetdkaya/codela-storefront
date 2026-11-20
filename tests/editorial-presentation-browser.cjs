/** Visual/layout regression for opt-in editorial skins using real theme PHP shell. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const engine=process.env.TEST_WEBKIT?'webkit':'chromium';
const theme='theme/codela-storefront/assets/';
const shell=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{
 encoding:'utf8',env:{...process.env,FIXTURE_EXPERIENCE:'agency',FIXTURE_MENU:'1',FIXTURE_DOCK:'0'}
});
const styles=['styles/tokens.css','storefront.css','styles/overlay.css','styles/navigation.css',
 'styles/components.css','styles/editorial-menu.css','styles/editorial-account.css']
 .map(file=>fs.readFileSync(theme+file,'utf8')).join('\n');
(async()=>{
 const browser=await ({chromium,webkit}[engine]).launch();
 try{
  for(const [width,height] of [[390,844],[1280,900]]){
   const page=await browser.newPage({viewport:{width,height}});
   await page.setContent('<!doctype html><html lang="tr"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<style>'+styles+'</style></head><body>'+shell+'</body></html>');
   assert.equal(await page.locator('.sf-shell.has-editorial-menu.has-editorial-account').count(),1,
    'Agency defaults to both editorial skins');
   assert.equal(await page.locator('#sf-panel').count(),1,'One native dialog');
   assert.equal(await page.locator('.sf-header').count(),1,'No duplicate header');
   assert.equal(await page.locator('#sf-menu .sf-menu-list>li').count(),7,'WP menu items retained');
   await page.evaluate(()=>{
    const dialog=document.querySelector('#sf-panel');
    dialog.setAttribute('open','');dialog.classList.add('is-menu-panel');
    document.querySelector('#sf-menu').hidden=false;
   });
   const nav=page.locator('#sf-menu>nav[aria-label]');
   const aside=page.locator('.sf-editorial-menu-aside');
   assert(await nav.isVisible(),'Native menu remains visible');
   assert(await aside.isVisible(),'Editorial contact/account aside is visible');
   assert.equal(await page.locator('.sf-editorial-menu-account').getAttribute('href'),
    'https://store.test/myaccount/','Account CTA retains real Woo URL');
   assert.equal(await page.locator('.sf-menu-list a[aria-current="page"]').count(),1,'Native current page semantics preserved');
   const menu=await page.evaluate(()=>{
    const dialog=document.querySelector('#sf-panel'),aside=document.querySelector('.sf-editorial-menu-aside');
    const card=aside.getBoundingClientRect(),close=document.querySelector('#sf-panel .sf-close').getBoundingClientRect();
    return {background:getComputedStyle(dialog).backgroundColor,
      scheme:getComputedStyle(dialog).colorScheme,
      viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
      cardLeft:card.left,cardRight:card.right,closeWidth:close.width,closeHeight:close.height};
   });
   assert.equal(menu.scheme,'light','Light porcelain panel wins over legacy Agency dark profile');
   assert(menu.closeWidth>=44&&menu.closeHeight>=44,'Native close retains 44px hit target');
   assert(menu.cardLeft>=-1&&menu.cardRight<=width+1,'Aside fits horizontally');
   assert(menu.scrollWidth<=width+1,'Menu does not overflow horizontally');
   await page.evaluate(()=>{
    const dialog=document.querySelector('#sf-panel');
    dialog.classList.remove('is-menu-panel');dialog.classList.add('is-account-panel');
    document.querySelector('#sf-menu').hidden=true;
    document.querySelector('#sf-account').hidden=false;
   });
   const account=page.locator('#sf-account>.woocommerce');
   assert(await account.isVisible(),'Original Woo guest form visible in editorial card');
   const style=await account.evaluate(el=>({border:getComputedStyle(el).borderTopWidth,
    radius:getComputedStyle(el).borderRadius,backdrop:getComputedStyle(el).backdropFilter}));
   assert(style.border!=='0px','New Account card gets a visible subtle rim');
   assert(parseFloat(style.radius)>=20,'Account card is softly rounded');
   assert.equal(await page.locator('#sf-account form.woocommerce-form-login').count(),1,
    'One WooCommerce login form with native submission');
   await page.close();
  }
  console.log('Editorial menu/account PHP shell, layout and native URLs passed ('+engine+').');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
