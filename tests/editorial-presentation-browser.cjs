/** Visual/layout regression for opt-in editorial skins using real theme PHP shell. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const engine=process.env.TEST_WEBKIT?'webkit':'chromium';
const theme='theme/codela-storefront/assets/';
const shell=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{
 encoding:'utf8',env:{...process.env,FIXTURE_EXPERIENCE:'agency',FIXTURE_MENU:'1',FIXTURE_DOCK:'0',FIXTURE_PUBLIC_CONTACT:'1'}
});
const styles=['styles/tokens.css','storefront.css','styles/overlay.css','styles/navigation.css',
 'styles/components.css','styles/account.css','styles/account-overlay.css','styles/auth-smart.css','styles/quick-login.css',
 'styles/editorial-menu.css','styles/editorial-account-shell.css','styles/editorial-account.css']
 .map(file=>fs.readFileSync(theme+file,'utf8')).join('\n');
(async()=>{
 const browser=await ({chromium,webkit}[engine]).launch();
 try{
  for(const [width,height] of [[320,568],[390,844],[390,650],[1280,900]]){
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
   assert.equal(await aside.locator('p').count(),0,'No redundant agency description');
   assert.equal(await aside.locator('.sf-editorial-menu-eyebrow').textContent(),'Contact');
   assert.equal(await aside.locator('.sf-editorial-menu-actions>a').count(),4,'Four configured quick actions');
   assert.equal(await aside.locator('[data-codela-contact="phone"]').getAttribute('href'),'tel:+905551234567');
   assert.equal(await aside.locator('[data-codela-contact="whatsapp"]').getAttribute('href'),'https://wa.me/905551234567');
   assert.equal(await aside.locator('[data-codela-contact="email"]').getAttribute('href'),'mailto:hello@example.test');
   const utility=await aside.evaluate(el=>({height:el.getBoundingClientRect().height,items:[...el.querySelectorAll('.sf-editorial-menu-actions>a')].map(a=>({height:a.getBoundingClientRect().height,overflow:a.scrollWidth-a.clientWidth}))}));
   assert(utility.height<=156,'Compact contact card remains within two action rows: '+JSON.stringify(utility));
   assert(utility.items.every(x=>x.height>=44&&x.overflow<=1),'All utility actions retain touch targets and fit');
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
      menuLights:getComputedStyle(dialog).backgroundImage,
      activeLabel:getComputedStyle(document.querySelector('.sf-menu-list>li.current-menu-item'),'::after').content,
      navFont:parseFloat(getComputedStyle(document.querySelector('.sf-menu-list>li>a')).fontSize),
      navRows:[...document.querySelectorAll('.sf-menu-list>li')].map(el=>el.getBoundingClientRect().height),
      content:document.querySelector('#sf-menu').getBoundingClientRect().toJSON(),
      nav:document.querySelector('#sf-menu>nav[aria-label]').getBoundingClientRect().toJSON(),
      aside:aside.getBoundingClientRect().toJSON(),
      paddingTop:parseFloat(getComputedStyle(document.querySelector('#sf-menu')).paddingTop),
      paddingBottom:parseFloat(getComputedStyle(document.querySelector('#sf-menu')).paddingBottom)};
   });
   assert.equal(menu.scheme,'dark','Original dark reference wins over Agency and Commerce defaults');
   assert.equal(menu.background,'rgb(6, 6, 10)','Menu canvas stays #06060a');
   assert(menu.menuLights.includes('rgba(183, 125, 70'),
      'Menu replaces the violet light with a warm amber accent');
   assert(!menu.menuLights.includes('rgba(130, 96, 210'),
      'No violet ambient glow survives in editorial Menu');
   assert(menu.activeLabel.includes('Aktif'),'Current WordPress item displays the reference Active label');
   assert.equal((menu.asideLayers.match(/linear-gradient\(/g)||[]).length,1,'Studio card has one restrained highlight');
   assert.equal(await page.locator('.sf-editorial-menu-brand').count(),0,
    'Editorial Menu has no duplicate Codela logo capsule in rendered DOM');
   assert(menu.closeWidth>=44&&menu.closeHeight>=44,'Native close retains 44px hit target');
   assert(menu.navFont<= (width<=820?24:30),'Editorial links are compact, not oversized: '+menu.navFont);
   assert(menu.navRows.every(height=>height>=44),'Every menu row remains a >=44px touch target');
   const groupTop=Math.min(menu.nav.top,menu.aside.top),groupBottom=Math.max(menu.nav.bottom,menu.aside.bottom);
   const availableTop=menu.content.top+menu.paddingTop,availableBottom=menu.content.bottom-menu.paddingBottom;
   if(width<=820){
     assert(Math.abs(menu.nav.top-availableTop)<=1,'Mobile links start below the close bar');
     assert(menu.aside.top>=menu.nav.bottom+23,'Contact card never overlaps long navigation');
     if(menu.aside.bottom<=availableBottom+1) assert(Math.abs(menu.aside.bottom-availableBottom)<=1,'Contact card anchors to the bottom when it fits');
   } else if(groupBottom-groupTop<availableBottom-availableTop-20){
     const centerOffset=Math.abs((groupTop+groupBottom-availableTop-availableBottom)/2);
     assert(centerOffset<=20,'Compact Menu content should be vertically centered: '+centerOffset);
   } else {
     assert(groupTop>=menu.content.top-1,'Long Menu remains safely scrollable on short screens');
   }
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
   // The real Agency has four links: verify bottom anchoring separately from the long-menu fixture.
   if(width<=820){
     await page.locator('.sf-menu-list>li').evaluateAll(items=>items.slice(4).forEach(item=>item.remove()));
     const compact=await page.evaluate(()=>{
       const body=document.querySelector('#sf-menu'),nav=body.querySelector('nav'),card=body.querySelector('.sf-editorial-menu-aside');
       return {navTop:nav.getBoundingClientRect().top,top:body.getBoundingClientRect().top+parseFloat(getComputedStyle(body).paddingTop),
         cardBottom:card.getBoundingClientRect().bottom,bottom:body.getBoundingClientRect().bottom-parseFloat(getComputedStyle(body).paddingBottom),
         overflow:body.scrollHeight>body.clientHeight+1};
     });
     assert(Math.abs(compact.navTop-compact.top)<=1,'Four-link menu starts at the top');
     if(!compact.overflow) assert(Math.abs(compact.cardBottom-compact.bottom)<=1,'Four-link Studio card is at the bottom');
   }
   fs.mkdirSync('qa',{recursive:true});
   await page.screenshot({path:`qa/agency-editorial-menu-${width}-${height}-${engine}.png`});
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
   assert.equal(await page.locator('.sf-editorial-menu-brand').count(),0,
    'Removed Menu brand does not reappear in Account');
   assert(await page.locator('#sf-panel .sf-panel-top .sf-close').isVisible(),
    'Real Close remains visible in the top right');
   const position=await page.evaluate(()=>{
     const body=document.querySelector('#sf-account').getBoundingClientRect();
     const card=document.querySelector('#sf-account>.woocommerce').getBoundingClientRect();
     return {offset:Math.abs((body.top+body.bottom-card.top-card.bottom)/2),
       bodyHeight:body.height,cardHeight:card.height,topGap:card.top-body.top};
   });
   if(height<=620)
     assert(position.topGap>=0 && position.topGap<=40,'Short Account follows its intentional top-aligned keyboard-safe layout');
   else if(position.cardHeight<position.bodyHeight-24)
     assert(position.offset<=18,'Guest Account card must be vertically centered: '+JSON.stringify(position));
   else
     assert(position.topGap>=-1,'Tall Account must remain top-scrollable: '+JSON.stringify(position));
   const style=await account.evaluate(el=>({border:getComputedStyle(el).borderTopWidth,
    radius:getComputedStyle(el).borderRadius,backdrop:getComputedStyle(el).backdropFilter,
    layers:getComputedStyle(el).backgroundImage,
    ambient:getComputedStyle(document.querySelector('#sf-panel')).backgroundImage,
    canvas:getComputedStyle(document.querySelector('#sf-panel')).backgroundColor,
    scheme:getComputedStyle(document.querySelector('#sf-panel')).colorScheme}));
   assert.equal(style.scheme,'dark','Account is dark before and after guest CSS loads');
   assert.equal(style.canvas,'rgb(6, 6, 10)','Account canvas is original #06060a');
   assert(style.ambient.includes('rgba(183, 125, 70'),'Account has warm amber ambient light');
   assert(!style.ambient.includes('rgba(130, 96, 210'),'No purple Account glow');
   assert(style.border!=='0px','Account card has a rim');
   assert(parseFloat(style.radius)>=20,'Account card is softly rounded');
   assert.equal((style.layers.match(/linear-gradient\(/g)||[]).length,1,'Account card has one restrained highlight');
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
  // Regression: /hesabim/ must use the same centered, single-card guest
  // presentation as its popup without hiding the real Woo fallback permanently.
  const directShell=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{
   encoding:'utf8',env:{...process.env,FIXTURE_EXPERIENCE:'agency',
    FIXTURE_GUEST_ACCOUNT:'1',FIXTURE_MENU:'1',FIXTURE_DOCK:'1'}
  });
  for(const [width,height] of [[320,568],[390,844],[1280,900]]){
   const page=await browser.newPage({viewport:{width,height}});
   await page.setContent(`<!doctype html><html lang="tr" class="sf-auth-ssr-enabled">
    <head><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>${styles}</style></head>
    <body class="sf-account-editorial woocommerce-account">
    <div class="wp-site-blocks">${directShell}
    <main class="sf-content" id="sf-content"><div class="wp-block-post-content">
      <div class="woocommerce sf-pin-active">
       <div class="sf-account-intro"><h1>Hoş geldin</h1><p>Hesabınla güvenli ve hızlı giriş yap.</p></div>
       <div class="sf-quick-accounts has-passkey">
        <div class="sf-quick-choice-intro"><h2>Hoş geldin</h2><p>Hesabınla güvenli ve hızlı giriş yap.</p></div>
        <section class="sf-quick-login"><div class="sf-quick-choice">
         <div class="sf-quick-account-frame"><button class="sf-quick-account">info@codela.dev</button></div>
        </div></section>
        <div class="sf-quick-choice-alternatives">
          <div class="sf-quick-or">veya</div>
          <button class="sf-quick-native-alt">E-posta veya Google ile giriş yap</button>
        </div>
       </div>
       <div class="sf-smart-auth"><label class="sf-smart-label">
         <input class="sf-smart-identity" type="email" placeholder="E-posta adresiniz">
       </label></div>
      </div>
    </div></main><footer class="sf-footer">© Codela</footer>
    </div></body></html>`);
   assert.equal(await page.locator('.sf-editorial-account-exit').count(),1,
    'Standalone editorial guest page has one native home/close anchor');
   assert.equal(await page.locator('.sf-editorial-account-exit').getAttribute('href'),
    'https://store.test/','Close returns to the real home route');
   assert(await page.locator('.sf-editorial-account-exit').isVisible(),
    'Fullscreen guest close control remains visible');
   assert.equal(await page.locator('.sf-header .sf-brand').isVisible(),false,
    'Standalone guest uses the popup header, not a second site header');
   assert.equal(await page.locator('.sf-footer').isVisible(),false,
    'Guest fullscreen login has no extraneous store footer');
   assert.equal(await page.locator('.sf-smart-identity').isVisible(),false,
    'Remembered account suppresses SSR email even before smart-auth JS hydration');
   const dimensions=await page.evaluate(()=>{
    const main=document.querySelector('main.sf-content').getBoundingClientRect();
    const card=document.querySelector('main.sf-content .woocommerce').getBoundingClientRect();
    const exit=document.querySelector('.sf-editorial-account-exit').getBoundingClientRect();
    return {main:main.toJSON(),card:card.toJSON(),exit:exit.toJSON(),
      viewport:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   assert(!dimensions.overflow,'Direct account does not overflow the viewport horizontally');
   assert(dimensions.main.top<=1,'Header reserves no phantom vertical gap');
   assert(dimensions.exit.width>=44&&dimensions.exit.height>=44,'Close hit target is accessible');
   if(dimensions.card.height < height-100 && height>620){
    const offset=Math.abs((dimensions.card.top+dimensions.card.bottom-height)/2);
    assert(offset<=40,'Standalone welcome card is vertically centered, offset='+offset);
   }else{
    assert(dimensions.card.top>=0,'Short guest viewport remains scrollable and top-safe');
   }
   await page.locator('main .woocommerce').evaluate(el=>el.classList.remove('sf-pin-active'));
   assert(await page.locator('.sf-smart-identity').isVisible(),
    'Switching to existing native Email/Google reveals the original field');
   await page.close();
  }
  console.log('Editorial menu/account PHP shell, layout and native URLs passed ('+engine+').');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
