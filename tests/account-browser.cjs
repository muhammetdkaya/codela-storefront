const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const css=['assets/styles/tokens.css','assets/storefront.css','assets/styles/overlay.css','assets/styles/navigation.css','assets/styles/components.css','assets/styles/account.css'].map(p=>fs.readFileSync('theme/codela-storefront/'+p,'utf8')).join('\n');
const render=env=>execFileSync(process.env.PHP_BIN||'php',['tests/render-account.php'],{encoding:'utf8',env:{...process.env,...env}});
const intro=render({});
const signed=render({ACCOUNT_SIGNED_IN:'1'});
const authJS=fs.readFileSync('theme/codela-storefront/assets/scripts/auth.js','utf8');
const guestHeader=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_GUEST_ACCOUNT:'1'}});
assert(guestHeader.includes('sf-auth-site-header') && guestHeader.includes('Back to store'),'Guest header returns to store');
assert(!guestHeader.includes('sf-mobile-dock') && !guestHeader.includes('sf-panel'),'Guest header has no normal store dock or overlays');
assert(intro.includes('My account'));
assert(intro.includes('sf-auth-tabs'),'Guest intro offers progressive tabs');
assert.equal(signed,'','Signed-in Woo account never receives a duplicate theme header');
assert.equal(render({ACCOUNT_OUTSIDE:'1'}),'','Do not inject account heading elsewhere');
const fields='<p class="woocommerce-form-row form-row"><label for="username">Email address</label><input class="woocommerce-Input input-text" id="username" type="email" autocomplete="username" required></p>'+
'<p class="woocommerce-form-row form-row"><label for="password">Password</label><input class="woocommerce-Input input-text" id="password" type="password" autocomplete="current-password" required></p>'+
'<p class="form-row"><label class="woocommerce-form__label woocommerce-form-login__rememberme"><input type="checkbox" name="rememberme"><span>Remember me</span></label><button class="woocommerce-button woocommerce-form-login__submit" type="submit">Log in</button></p>'+
'<p class="woocommerce-LostPassword lost_password"><a href="/account/lost-password/">Lost password?</a></p>';
const form='<h2>Log in</h2><form class="woocommerce-form woocommerce-form-login login" method="post">'+fields+'</form>';
const login='<div class="woocommerce">'+intro+form+'</div>';
const register='<div class="woocommerce">'+intro+'<div class="u-columns col2-set" id="customer_login"><div class="u-column1 col-1">'+form+'</div><div class="u-column2 col-2"><h2>Register</h2><form class="woocommerce-form woocommerce-form-register register"><p class="form-row"><label for="reg_email">Email</label><input class="input-text" type="email" id="reg_email"></p><button type="submit">Register</button></form></div></div></div>';
const logged='<div class="woocommerce">'+signed+'<nav class="woocommerce-MyAccount-navigation"><ul><li class="is-active"><a href="/account/" aria-current="page">Dashboard</a></li><li><a href="/orders/">Orders</a></li><li><a href="/addresses/">Addresses</a></li></ul></nav><div class="woocommerce-MyAccount-content"><h2>My orders</h2><p>Account details here.</p></div></div>';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-gpu','--use-gl=disabled','--disable-software-rasterizer','--disable-dev-shm-usage','--no-zygote','--single-process']}:{})});
 try {
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:850},isMobile:width===390,hasTouch:width===390});
   for(const [type,markup] of [['login',login],['register',register],['logged',logged]]){
    const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body class="woocommerce-account"><main class="sf-content"><h1 class="wp-block-post-title">My Account</h1>'+markup+'</main></body></html>';
    await page.setContent(html);
    const info=await page.evaluate(()=>{
     return {overflows:document.documentElement.scrollWidth>innerWidth+1,
       titleVisible:getComputedStyle(document.querySelector('.wp-block-post-title')).display!=='none',
       focus:document.activeElement.tagName};
    });
    assert(!info.overflows,type+' must not overflow viewport '+width);
    assert.equal(info.titleVisible,type==='logged', 'WP title shown only in vanilla Woo fallback; guest intro has own heading');
    if(type==='login'||type==='register'){
      const layout=await page.evaluate(()=>{
       const wrap=document.querySelector('#customer_login');
       if(!wrap)return {single:true};
       const first=wrap.querySelector('.u-column1').getBoundingClientRect();
       const second=wrap.querySelector('.u-column2').getBoundingClientRect();
       return {single:false,stacked:second.top>first.bottom-1,sideBySide:second.left>first.left};
      });
      assert(type==='login'?layout.single:width===390?layout.stacked:layout.sideBySide,'Guest layout respects Woo login/register settings and device width');
      assert.equal(await page.locator('form.woocommerce-form').count(),type==='login'?1:2,'Native Woo forms remain present');
      const input=page.locator('#username');
      assert.equal(await input.evaluate(el=>getComputedStyle(el).fontSize),'16px','Avoid mobile keyboard zoom');
      assert((await input.boundingBox()).height>=46,'Text input is touch accessible');
      assert((await page.locator('.woocommerce-form-login__submit').boundingBox()).height>=54,'Submit uses UI Kit action height');
      const controls=await page.evaluate(()=>{
       const shell=document.createElement('div');
       shell.className='sf-shell';
       shell.style.cssText='position:absolute;left:0;top:-9999px';
       shell.innerHTML='<button class="sf-ui-button sf-ui-button--primary">Shared Button</button>';
       document.body.append(shell);
       const theme=getComputedStyle(shell.querySelector('button'));
       const native=getComputedStyle(document.querySelector('.woocommerce-form-login__submit'));
       const reg=document.querySelector('.woocommerce-form-register button[type=submit]');
       const register=reg?getComputedStyle(reg):null;
       const fields=getComputedStyle(document.querySelector('#username'));
       const result={
        sameBackground:native.backgroundColor===theme.backgroundColor && (!register||register.backgroundColor===theme.backgroundColor),
        sameRadius:native.borderRadius===theme.borderRadius && (!register||register.borderRadius===theme.borderRadius),
        samePadding:native.paddingTop===theme.paddingTop && (!register||register.paddingTop===theme.paddingTop),
        sameMotion:native.transitionProperty===theme.transitionProperty,
        fieldRadius:fields.borderRadius,
        fieldHeight:document.querySelector('#username').getBoundingClientRect().height,
        registerPresent:!!reg
       };
       shell.remove();
       return result;
      });
      assert.equal(controls.sameBackground,true,'Guest submit buttons reuse UI Kit primary palette');
      assert.equal(controls.sameRadius,true,'Native Woo buttons reuse the shared control radius');
      assert.equal(controls.samePadding,true,'Native Woo buttons reuse shared button spacing');
      assert.equal(controls.sameMotion,true,'Native Woo and UI Kit buttons share press feedback');
      assert.equal(controls.fieldRadius,'12px','Inputs follow the same UI Kit control radius');
      assert(controls.fieldHeight>=54,'Guest input uses shared action height');
      assert.equal(controls.registerPresent,type==='register','Registration follows native Woo setting');
      assert.equal(info.focus,'BODY','Opening account should not autofocus input');
      const background=await page.locator('.sf-account-intro').evaluate(el=>getComputedStyle(document.body).backgroundColor);
      assert.equal(background,'rgb(255, 255, 255)','Guest account stays neutral white');
      if(type==='register'){
        await page.addScriptTag({content:authJS});
        assert.equal(await page.locator('.sf-auth-tabs').isVisible(),true,'Tabs appear when Woo renders registration');
        assert.equal(await page.locator('#customer_login .u-column2').isVisible(),false,'Login selected by default');
        await page.locator('[data-auth-tab="register"]').click();
        assert.equal(await page.locator('#customer_login .u-column2').isVisible(),true,'Registration tab shows the native register form');
        assert.equal(await page.locator('#customer_login .u-column1').isVisible(),false,'Login form hidden while Register is selected');
        assert.equal(await page.locator('[data-auth-tab="register"]').getAttribute('aria-selected'),'true');
        await page.locator('[data-auth-tab="register"]').focus();
        await page.keyboard.press('ArrowLeft');
        assert.equal(await page.locator('[data-auth-tab="login"]').getAttribute('aria-selected'),'true','Keyboard arrows change tabs');
        assert.equal(await page.locator('#customer_login .u-column1').isVisible(),true,'Login form restored without re-creating form');
        assert.equal(await page.locator('form.woocommerce-form').count(),2,'Both native Woo forms remain in DOM');
      }else{
        await page.addScriptTag({content:authJS});
        assert.equal(await page.locator('.sf-auth-tabs').isVisible(),false,'No fake Register tab if Woo registration is disabled');
      }
    } else {
      const nav=page.locator('.woocommerce-MyAccount-navigation');
      const content=page.locator('.woocommerce-MyAccount-content');
      assert(await nav.isVisible()&&await content.isVisible(),'Account navigation and content displayed');
      const a=await nav.boundingBox(),b=await content.boundingBox();
      if(width===390)assert(b.y>a.y,'Mobile content below nav');
      else assert(b.x>a.x,'Desktop content beside nav');
    }
   }
   // Codela plugin owns the signed-in dashboard and its full-screen layout.
   // The theme must not inject a header, card, navigation, or spacing on it.
   const pluginMarkup='<div class="woocommerce"><div class="cdl-account-navigation">'+
    '<div class="cdl-account-navigation__mobile"><header><h2>Hesabım</h2></header><p>MERHABA</p><strong>titan</strong></div></div>'+
    '<div class="woocommerce-MyAccount-content"><section class="cdl-account-dashboard"><p>Recent order</p></section></div></div>';
   await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head>'+
    '<body class="woocommerce-account logged-in codela-my-account-layout codela-account-dashboard-home"><main class="sf-content">'+
    '<h1 class="wp-block-post-title">Hesabım</h1>'+pluginMarkup+'</main></body></html>');
   const plugin=await page.evaluate(()=>{
    const c=document.querySelector('.woocommerce-MyAccount-content');
    return {
      heading:getComputedStyle(document.querySelector('.wp-block-post-title')).display,
      pluginHeading:document.querySelectorAll('.cdl-account-navigation h2').length,
      themeHeading:document.querySelectorAll('.sf-account-intro').length,
      pluginNav:document.querySelectorAll('.cdl-account-navigation').length,
      contentBorder:getComputedStyle(c).borderTopWidth,
      contentPadding:getComputedStyle(c).paddingTop,
      bodyOverflow:document.documentElement.scrollWidth>innerWidth+1
    };
   });
   assert.equal(plugin.heading,'none','Only WP duplicate title is hidden on Codela account');
   assert.equal(plugin.pluginHeading,1,'Codela account heading remains');
   assert.equal(plugin.themeHeading,0,'No extra theme heading');
   assert.equal(plugin.pluginNav,1,'Codela account navigation preserved');
   assert.equal(plugin.contentBorder,'0px','Theme must not wrap plugin content in a new card');
   assert.equal(plugin.contentPadding,'0px','Theme must not override plugin content padding');
   assert.equal(plugin.bodyOverflow,false,'No extra horizontal overflow in Codela account');
   // The authenticated plugin dashboard must never inherit guest Button/input adapters.
   const pluginButton=await page.evaluate(()=>{
    const button=document.createElement('button');
    button.className='woocommerce-button';
    button.textContent='Plugin button';
    document.querySelector('.cdl-account-dashboard').append(button);
    const shared=getComputedStyle(button);
    const nativeSize=shared.minHeight;
    button.remove();
    return nativeSize;
   });
   assert.notEqual(pluginButton,'54px','Theme guest Button adapter must not reach plugin-owned account');
   await page.close();
  }
  console.log('Guest auth + vanilla Woo fallback + Codela signed-in account isolation: passed.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
