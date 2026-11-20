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
 'styles/components.css','styles/account-overlay.css','styles/auth-smart.css','styles/quick-login.css',
 'styles/editorial-menu.css','styles/editorial-account-shell.css','styles/editorial-account.css']
 .map(file=>fs.readFileSync(theme+file,'utf8')).join('\n');
(async()=>{
 const browser=await ({chromium,webkit}[engine]).launch();
 try{
  for(const [width,height] of [[390,844],[390,650],[1280,900]]){
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
      cardLeft:card.left,cardRight:card.right,closeWidth:close.width,closeHeight:close.height,
      asideLayers:getComputedStyle(aside).backgroundImage,
      brandLayers:getComputedStyle(document.querySelector('.sf-editorial-menu-brand')).backgroundImage,
      activeLabel:getComputedStyle(document.querySelector('.sf-menu-list>li.current-menu-item'),'::after').content};
   });
   assert.equal(menu.scheme,'dark','Original dark reference wins over Agency and Commerce defaults');
   assert.equal(menu.background,'rgb(6, 6, 10)','Menu canvas stays #06060a');
   assert(menu.activeLabel.includes('Aktif'),'Current WordPress item displays the reference Active label');
   assert((menu.asideLayers.match(/linear-gradient\(/g)||[]).length>=3,'Studio card has original layered surface rim');
   assert((menu.brandLayers.match(/linear-gradient\(/g)||[]).length>=3,'Brand capsule has three glass paint layers');
   assert(menu.closeWidth>=44&&menu.closeHeight>=44,'Native close retains 44px hit target');
   assert(menu.cardLeft>=-1&&menu.cardRight<=width+1,'Aside fits horizontally');
   if(width<=700){
    const insets=await page.evaluate(()=>{
      const active=document.querySelector('.sf-menu-list>li.current-menu-item').getBoundingClientRect();
      const aside=document.querySelector('.sf-editorial-menu-aside').getBoundingClientRect();
      return {activeLeft:active.left,activeRight:innerWidth-active.right,
        asideLeft:aside.left,asideRight:innerWidth-aside.right};
    });
    for(const [side,inset] of Object.entries(insets))
      assert(inset>=18,side+' needs a real 20px mobile safe gutter, got '+inset);
   }
   assert(menu.scrollWidth<=width+1,'Menu does not overflow horizontally');
   await page.evaluate(()=>{
    const dialog=document.querySelector('#sf-panel');
    dialog.classList.remove('is-menu-panel');dialog.classList.add('is-account-panel');
    document.querySelector('#sf-menu').hidden=true;
    document.querySelector('#sf-account').hidden=false;
   });
   const account=page.locator('#sf-account>.woocommerce');
   assert(await account.isVisible(),'Original Woo guest form visible in editorial card');
   assert.equal(await page.locator('#sf-panel .sf-panel-app-title--account').isVisible(),false,
    'No redundant My Account logo/title capsule inside guest panel');
   assert.equal(await page.locator('#sf-panel .sf-editorial-menu-brand').isVisible(),false,
    'Menu-only Codela brand stays hidden in Account');
   assert(await page.locator('#sf-panel .sf-panel-top .sf-close').isVisible(),
    'Real Close remains visible in the top right');
   const position=await page.evaluate(()=>{
     const body=document.querySelector('#sf-account').getBoundingClientRect();
     const card=document.querySelector('#sf-account>.woocommerce').getBoundingClientRect();
     return {offset:Math.abs((body.top+body.bottom-card.top-card.bottom)/2),
       bodyHeight:body.height,cardHeight:card.height,topGap:card.top-body.top};
   });
   if(position.cardHeight<position.bodyHeight-24)
     assert(position.offset<=18,'Guest Account card must be vertically centered: '+JSON.stringify(position));
   else
     assert(position.topGap>=-1,'Tall Account must remain top-scrollable: '+JSON.stringify(position));
   const style=await account.evaluate(el=>({border:getComputedStyle(el).borderTopWidth,
    radius:getComputedStyle(el).borderRadius,backdrop:getComputedStyle(el).backdropFilter,
    layers:getComputedStyle(el).backgroundImage,canvas:getComputedStyle(document.querySelector('#sf-panel')).backgroundColor,
    scheme:getComputedStyle(document.querySelector('#sf-panel')).colorScheme}));
   assert.equal(style.scheme,'dark','Account is dark before and after guest CSS loads');
   assert.equal(style.canvas,'rgb(6, 6, 10)','Account canvas is original #06060a');
   assert(style.border!=='0px','Account card has a rim');
   assert(parseFloat(style.radius)>=20,'Account card is softly rounded');
   assert((style.layers.match(/linear-gradient\(/g)||[]).length>=3,'Account card retains original layered glass');
   assert(style.backdrop.includes('blur(22px)'),'Account card has real frosted blur');
   assert.equal(await page.locator('#sf-account form.woocommerce-form-login').count(),1,
    'One WooCommerce login form with native submission');
   // The real email control is server-rendered by account.php; hydration only
   // binds behavior. Visualize that existing class, never a fake submit API.
   await page.evaluate(()=>{
    const host=document.querySelector('#sf-account>.woocommerce');
    host.insertAdjacentHTML('beforeend', '<div class="sf-smart-auth"><label class="sf-smart-label"><input class="sf-smart-identity" type="email" placeholder="E-posta adresiniz"></label></div>');
    host.classList.add('sf-smart-auth-active');
   });
   const email=page.locator('#sf-account .sf-smart-identity');
   assert(await email.isVisible(),'Real smart email field is directly visible in native view');
   const emailStyle=await email.evaluate(el=>({background:getComputedStyle(el).backgroundColor,
     color:getComputedStyle(el).color,borderRadius:getComputedStyle(el).borderRadius}));
   assert.equal(emailStyle.background,'rgba(10, 10, 15, 0.72)','Input uses reference dark glass');
   assert.equal(emailStyle.color,'rgb(248, 247, 250)','Input remains legible');
   assert.equal(emailStyle.borderRadius,'14px','Email has reference glass-input radius');
   // This minimal native Woo social button reproduces the real Google class
   // and disabled state without manufacturing an authentication endpoint.
   await page.evaluate(()=>{
    document.querySelector('#sf-account>.woocommerce').insertAdjacentHTML('beforeend',
     '<div class="sf-auth-social"><button type="button" class="sf-auth-google" disabled><span>Google ile giriş yap</span></button></div>');
   });
   const google=await page.locator('#sf-account .sf-auth-social .sf-auth-google').evaluate(el=>{
     const cs=getComputedStyle(el),label=getComputedStyle(el.querySelector('span'));
     return {color:cs.color,labelColor:label.color,background:cs.backgroundColor,image:cs.backgroundImage};
   });
   assert.equal(google.color,'rgb(248, 247, 250)','Google text has readable dark-mode contrast');
   assert.equal(google.labelColor,'rgb(248, 247, 250)','Google child label stays readable');
   assert(google.image.includes('linear-gradient'),'Google button gets dark glass, not bright flat white');
   assert.notEqual(google.background,'rgb(248, 247, 250)','Google background must not equal its text');
   await page.close();
  }
  console.log('Editorial menu/account PHP shell, layout and native URLs passed ('+engine+').');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
