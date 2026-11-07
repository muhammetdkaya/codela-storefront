const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const css=['assets/styles/tokens.css','assets/storefront.css','assets/styles/overlay.css','assets/styles/navigation.css','assets/styles/components.css','assets/styles/account.css'].map(p=>fs.readFileSync('theme/codela-storefront/'+p,'utf8')).join('\n');
const render=env=>execFileSync(process.env.PHP_BIN||'php',['tests/render-account.php'],{encoding:'utf8',env:{...process.env,...env}});
const intro=render({});
const signed=render({ACCOUNT_SIGNED_IN:'1'});
const authJS=fs.readFileSync('theme/codela-storefront/assets/scripts/auth.js','utf8');
const nativeGoogleInfo=JSON.parse(execFileSync(process.env.PHP_BIN||'php',['tests/google-auth.php'],{encoding:'utf8'}));
const unconfiguredGoogle=nativeGoogleInfo.disabled_button;
const guestHeader=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_GUEST_ACCOUNT:'1'}});
assert(guestHeader.includes('class="sf-header') && guestHeader.includes('sf-mobile-dock') &&
  guestHeader.includes('class="sf-panel"'),'Logged-out My Account uses the same header, dock and panel as the store');
assert(!guestHeader.includes('sf-auth-site-header') && !guestHeader.includes('sf-auth-shell'),
  'There is no separate standalone login header');
assert(guestHeader.includes('data-dock-view="account"') && guestHeader.includes('is-active'),
  'My Account is the selected bottom navigation tab');
assert(guestHeader.includes('sf-context-account-heading') && guestHeader.includes('user-round.svg') &&
  guestHeader.includes('sf-context-label'),
  'Logged-out My Account uses the same user icon and Account label as the instant dialog');
assert(!guestHeader.includes('class="sf-brand sf-ui-surface"'),
  'The direct guest account route must not fall back to the store logo');

assert(!guestHeader.includes('class="sf-panel-body sf-account-body"'),
  'The real account login has no duplicate form inside an overlay');
assert(intro.includes('Welcome back'),'Guest account hero has app greeting');
const locale=fs.readFileSync('theme/codela-storefront/languages/tr_TR.l10n.php','utf8');
assert.equal((locale.match(/'Welcome back'\s*=>/g)||[]).length,1,'Turkish welcome copy has one translation (no overwritten duplicate)');
assert(locale.includes("'Welcome back' => 'Hoş geldiniz'"),'Account title is the short welcome copy');
assert(!intro.includes('sf-auth-mark'),'Guest hero does not repeat the account icon');
assert(intro.includes('data-auth-login-placeholder="Email or username"'),'Login placeholder metadata comes from localized theme');
assert(intro.includes('Sign in to your account.'),'Guest account hero includes short subtitle');
assert(intro.includes('sf-auth-tabs'),'Guest intro offers progressive tabs');
assert(!intro.includes('Manage your orders and account details.'),'Unnecessary account subtitle removed');
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
   await page.route('**/assets/icons/*.svg*',route=>{
    const file=new URL(route.request().url()).pathname.split('/').at(-1);
    return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync('theme/codela-storefront/assets/icons/'+file,'utf8')});
   });
   for(const [type,markup] of [['login',login],['register',register],['logged',logged]]){
    const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body class="woocommerce-account">'+(type==='logged'?'':guestHeader)+'<main class="sf-content"><h1 class="wp-block-post-title">My Account</h1>'+markup+'</main></body></html>';
    await page.setContent(html);
    const info=await page.evaluate(()=>{
     return {overflows:document.documentElement.scrollWidth>innerWidth+1,
       titleVisible:getComputedStyle(document.querySelector('.wp-block-post-title')).display!=='none',
       focus:document.activeElement.tagName};
    });
    assert(!info.overflows,type+' must not overflow viewport '+width);
    assert.equal(info.titleVisible,type==='logged', 'WP title shown only in vanilla Woo fallback; guest intro has own heading');
    if(type==='login'||type==='register'){
      assert.equal(await page.locator('.sf-auth-store-link').count(),0,'Do not add a separate login Back shortcut');
      const menu=page.locator('.sf-header .sf-menu-trigger');
      assert.equal(await menu.count(),1,'Same genuine menu as every other page');
      assert((await menu.boundingBox()).width>=44,'Menu has 44px hit target');
      assert.equal(await page.locator('.sf-mobile-dock').isVisible(),width<=700,
        'Normal bottom navigation is available on mobile logged-out Account');
      assert.equal(await page.locator('.sf-mobile-dock [data-dock-view="account"]').getAttribute('aria-current'),'page',
        'Account tab stays selected after logout');
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
      assert((await page.locator('.woocommerce-form-login__submit').boundingBox()).height>=52,'Guest submit uses compact UI Kit action height');
      await page.addScriptTag({content:authJS});
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
       const actionSize=await page.locator('.woocommerce-form-login__submit').evaluate(el=>{
         const st=getComputedStyle(el);
         return {height:el.getBoundingClientRect().height,min:st.minHeight,font:st.fontSize,
           paddingTop:st.paddingTop,paddingBottom:st.paddingBottom};
       });
       assert(actionSize.height>=52&&actionSize.height<=54,'Native login uses the 52px common Button sizing');
       assert.equal(actionSize.min,'52px','Guest Button token is scoped to the account, not global design');
       assert.equal(actionSize.font,'15px','Compact guest CTA type uses shared Button font token');

      assert.equal(controls.fieldRadius,'12px','Inputs follow the same UI Kit control radius');
      assert.equal(await page.locator('#username').evaluate(el=>getComputedStyle(el).backgroundColor),
        'rgb(255, 255, 255)','Guest input is a clean outlined white field, not a bulky gray surface');
      assert(controls.fieldHeight>=49&&controls.fieldHeight<=51,'Guest input uses approved 50px geometry');
      const fieldAlignment=await page.evaluate(()=>{
       const input=document.querySelector('#username');
       const label=document.querySelector('label[for="username"]');
       const a=input.getBoundingClientRect(),b=label.getBoundingClientRect();
       const remember=document.querySelector('.woocommerce-form-login__rememberme').getBoundingClientRect();
       const lost=document.querySelector('.woocommerce-LostPassword').getBoundingClientRect();
       return {labelHidden:b.width<=1&&b.height<=1, textPadding:parseFloat(getComputedStyle(input).paddingTop),
        placeholder:input.placeholder,placeholderOpacity:getComputedStyle(input,'::placeholder').opacity,
        password:document.querySelector('#password').placeholder,
        ready:input.closest('.form-row').classList.contains('sf-auth-placeholder-ready'),
        sameLine:Math.abs(remember.top+remember.height/2-lost.top-lost.height/2)<10,
        rememberBeforeLost:remember.right<lost.left+5,
        hasInputName:input.name||''};
      });
      assert(fieldAlignment.labelHidden&&fieldAlignment.ready,'Original label remains accessible without visual duplication');
      assert(fieldAlignment.textPadding<18,'Text has no floating-label padding');
      assert.equal(fieldAlignment.placeholder,'Email or username');
      assert.equal(fieldAlignment.password,'Password');
      assert.equal(fieldAlignment.placeholderOpacity,'1','Placeholder stays readable');
      // Real touch/click releases the intentional initial-autofocus guard.
      await input.click();
      const ring=await input.evaluate(el=>{
        const css=getComputedStyle(el);
        return {width:css.outlineWidth,offset:css.outlineOffset,color:css.outlineColor,borderColor:css.borderTopColor};
      });
      assert.equal(ring.width,'2px','Standalone guest input has the same single focus ring');
      assert.equal(ring.offset,'2px','Standalone guest input matches Search focus offset');
      assert.equal(ring.color,'rgb(28, 28, 30)','Standalone guest ring uses shared glass ink');
      assert(['rgba(0, 0, 0, 0)','rgb(221, 224, 229)'].includes(ring.borderColor),
        'Standalone Woo field keeps only a neutral edge, never a second dark ring');
      assert(fieldAlignment.sameLine,'Remember me and lost-password share the same row');
      assert(fieldAlignment.rememberBeforeLost,'Remember me stays left, password reset right');
      assert.equal(controls.registerPresent,type==='register','Registration follows native Woo setting');
      assert.equal(info.focus,'BODY','Opening account should not autofocus input');
      const compact=await page.evaluate(()=>{
       const intro=document.querySelector('.sf-account-intro').getBoundingClientRect();
       const form=document.querySelector('form.woocommerce-form-login').getBoundingClientRect();
       const headings=[...document.querySelectorAll('.woocommerce > h2')].filter(el=>getComputedStyle(el).display!=='none');
       const arrow=document.querySelector('.sf-header .sf-menu-trigger .sf-menu-mark');
       const logo=document.querySelector('.sf-header .sf-brand');
       const main=document.querySelector('main.sf-content');
       return {gap:form.top-intro.bottom,headings:headings.length,hasSvg:!!arrow,
        sectionPadding:parseFloat(getComputedStyle(main).paddingTop),
        brandHeight:logo?.getBoundingClientRect().height};
      });
      assert(compact.hasSvg,'Shared header has the real Menu icon');
      assert(compact.sectionPadding<=36,'Guest content starts close below header divider');
      assert(compact.gap<85,'Guest intro and form have no oversized vertical gap');
      assert(compact.brandHeight>=30,'Real store brand remains readable');
      if(type==='login')assert.equal(compact.headings,0,'Single login page hides duplicated WooCommerce heading');
      const background=await page.locator('.sf-account-intro').evaluate(el=>getComputedStyle(document.body).backgroundColor);
      assert.equal(background,'rgb(248, 247, 244)','Guest account shares the theme page canvas');
      if(type==='login'){
        await page.locator('.woocommerce').evaluate(node=>node.insertAdjacentHTML('beforeend',
          '<div class="sf-shell sf-auth-social"><div class="sf-auth-divider"><span>or</span></div>'+
          '<a class="sf-auth-google sf-ui-button sf-ui-button--secondary" href="/wp-admin/admin-post.php?action=codela_sf_google_start">'+
          '<span class="sf-google-glyph" aria-hidden="true">G</span><span class="sf-ui-button-label">Continue with Google</span></a></div>'));
        const social=await page.locator('.sf-auth-google').evaluate(el=>{
          const style=getComputedStyle(el);
          return {width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,
            background:style.backgroundColor,radius:style.borderRadius,display:style.display,
            border:style.borderTopWidth,borderColor:style.borderTopColor,
            textCenter:el.querySelector('.sf-ui-button-label').getBoundingClientRect().left+
              el.querySelector('.sf-ui-button-label').getBoundingClientRect().width/2,
            buttonCenter:el.getBoundingClientRect().left+el.getBoundingClientRect().width/2,
            glyphRight:el.querySelector('.sf-google-glyph').getBoundingClientRect().right,
            textLeft:el.querySelector('.sf-ui-button-label').getBoundingClientRect().left};
        });
        const parent=await page.locator('.sf-auth-social').boundingBox();
        assert(social.width>=parent.width-2,'Google Button fills same form width');
        assert(social.height>=52&&social.height<=54,'Google Button reuses compact UI Kit action height');
        assert.equal(social.background,'rgb(37, 38, 40)','Google uses approved dark Codela CTA');
        assert.equal(social.radius,'30px','Google Button uses the approved rounded Codela capsule');
        if(social.border!=='1px')console.error('Secondary Button computed styles',social,await page.locator('.sf-auth-google').evaluate(el=>({
         classes:el.className, borderStyle:getComputedStyle(el).borderTopStyle,
         borderToken:getComputedStyle(el).getPropertyValue('--sf-ui-border'),
         matchingRules:[...document.styleSheets].flatMap(sh=>{try{return [...sh.cssRules]}catch{return []}})
          .filter(rule=>rule.selectorText&&el.matches(rule.selectorText)&&/border/.test(rule.cssText))
          .map(rule=>rule.cssText.slice(0,450)).slice(-12)
        })));
        assert.equal(social.border,'1px','Google secondary UI Kit Button must retain its visible border');
        assert.equal(social.borderColor,social.background,'Dark Google button uses the same surface and edge color');
        assert.equal(social.display,'flex','Google uses centered text plus a positioned multicolor icon');
        assert(Math.abs(social.textCenter-social.buttonCenter)<1,
          'Google label is centered in the complete Button regardless of glyph width');
        assert(social.textLeft-social.glyphRight>=12,
          'The positioned Google mark does not overlap the centered label');
        await page.locator('.sf-auth-social').evaluate(el=>el.remove());
        await page.locator('.woocommerce').evaluate((node,markup)=>node.insertAdjacentHTML('beforeend',markup),unconfiguredGoogle);
        assert.equal(await page.locator('.sf-auth-google').count(),1,'Google option stays visible when not configured');
        assert.equal(await page.locator('.sf-auth-google').isDisabled(),true,'Unconfigured Google cannot start OAuth');
        assert.equal(await page.locator('.sf-auth-google[href]').count(),0,'Disabled Google has no authentication redirect');
        assert.equal(await page.locator('.sf-auth-google').evaluate(el=>getComputedStyle(el).backgroundColor),
          'rgb(37, 38, 40)','Disabled Google stays charcoal and remains safely non-interactive');

      }
      if(type==='register'){
        assert.equal(await page.locator('.sf-auth-tabs').isVisible(),true,'Tabs appear when Woo renders registration');
        const tabs=await page.locator('.sf-auth-tabs').evaluate(el=>{
         const selected=el.querySelector('[aria-selected="true"]');
         return {height:selected.getBoundingClientRect().height,shadow:getComputedStyle(selected).boxShadow};
        });
        assert(tabs.height>=39,'Account tabs maintain a comfortable accessible hit target');
        assert.equal(tabs.shadow,'none','Active tab paint belongs to the sliding surface');
        assert.notEqual(await page.locator('.sf-auth-tab-slide').evaluate(el=>getComputedStyle(el).boxShadow),'none','Sliding white surface has subtle shadow');
        assert.equal(await page.locator('.sf-auth-tabs').getAttribute('data-active'),'login','Login slide initially selected');
        assert.equal(await page.locator('.sf-auth-tabs').evaluate(el=>el.compareDocumentPosition(document.querySelector('.sf-account-intro h1')) & Node.DOCUMENT_POSITION_FOLLOWING ? 'before' : 'after'),'before','Tabs remain above the welcome heading');

        assert.equal(await page.locator('#customer_login .u-column2').isVisible(),false,'Login selected by default');
        await page.locator('[data-auth-tab="register"]').click();
        assert.equal(await page.locator('#reg_email').getAttribute('placeholder'),'Email address','Registration uses its own email placeholder');
        assert.equal(await page.locator('#customer_login .u-column2').isVisible(),true,'Registration tab shows the native register form');
        assert.equal(await page.locator('#customer_login .u-column1').isVisible(),false,'Login form hidden while Register is selected');
        assert.equal(await page.locator('[data-auth-tab="register"]').getAttribute('aria-selected'),'true');
        assert.equal(await page.locator('.sf-auth-heading-text').innerText(),'Create an account','Register tab updates its heading');
        assert.equal(await page.locator('.sf-auth-description').innerText(),'Join us in a few steps.','Register tab updates its subtitle');
        assert.equal(await page.locator('.sf-auth-heading-wave').isVisible(),false,'Register tab does not repeat welcome emoji');
        assert.equal(await page.locator('.sf-auth-tabs').getAttribute('data-active'),'register','Slider follows registration');
        await page.locator('[data-auth-tab="register"]').focus();
        await page.keyboard.press('ArrowLeft');
        assert.equal(await page.locator('[data-auth-tab="login"]').getAttribute('aria-selected'),'true','Keyboard arrows change tabs');
        assert.equal(await page.locator('#customer_login .u-column1').isVisible(),true,'Login form restored without re-creating form');
        assert.equal(await page.locator('.sf-auth-heading-text').innerText(),'Welcome back','Login tab restores welcome heading and subtitle');
        assert.equal(await page.locator('.sf-auth-heading-wave').isVisible(),true,'Login greeting uses one emoji');
        assert.equal(await page.locator('form.woocommerce-form').count(),2,'Both native Woo forms remain in DOM');
      }else{
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

