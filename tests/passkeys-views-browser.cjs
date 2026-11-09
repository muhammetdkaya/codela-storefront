const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const cssAccount=fs.readFileSync('theme/codela-storefront/assets/styles/account.css','utf8');
const cssOverlay=fs.readFileSync('theme/codela-storefront/assets/styles/account-overlay.css','utf8');
const cssQuick=fs.readFileSync('theme/codela-storefront/assets/styles/quick-login.css','utf8');
const cssSmart=fs.readFileSync('theme/codela-storefront/assets/styles/auth-smart.css','utf8');
const passkeysSource=fs.readFileSync('theme/codela-storefront/inc/passkeys.php','utf8');
assert(passkeysSource.includes('class="sf-alt-login-icon"'),
  'The standalone passkey fallback also renders the combined login glyph');
const markup=(overlay,active)=>`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body class="${overlay?'':'woocommerce-account'}">
${overlay?'<div id="sf-panel" class="is-account-panel"><div id="sf-account">':''}
<div class="woocommerce${active?' sf-passkey-active':''}">
<section class="sf-pk-guest" ${active?'':'hidden'}><header class="sf-pk-hello"><h2>Hoş geldin 👋</h2><p>Hesabınla güvenli ve hızlı giriş yap.</p></header><button type="button" class="sf-pk-choice">Demo Demo</button><p class="sf-pk-divider">veya</p><button type="button" class="sf-pk-use-email">E-posta veya Google ile giriş yap</button></section>
<div class="sf-account-intro">Welcome</div>
<div id="customer_login">Native login</div>
<a class="sf-auth-register-cta">Register with email</a>
<div class="sf-auth-social">Google login</div>
</div>
${overlay?'</div></div>':''}</body></html>`;
(async()=>{
  const browser=await (process.env.TEST_WEBKIT==='1'?webkit:chromium).launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}});
    for (const overlay of [false,true]) {
      for (const active of [false,true]) {
        await page.setContent(markup(overlay,active));
        await page.addStyleTag({content:cssAccount+'\n'+cssOverlay+'\n'+cssQuick});
        const display=await page.locator('.sf-auth-register-cta').evaluate(el=>getComputedStyle(el).display);
        assert.equal(display==='none',active,
          `Registration visibility wrong for ${overlay?'instant overlay':'account page'} in ${active?'passkey':'native'} mode: ${display}`);
        const passkey=await page.locator('.sf-pk-guest').evaluate(el=>getComputedStyle(el).display);
        assert.equal(passkey!=='none',active,'Passkey only appears when recognized');
         if(active){
           const heading=await page.locator('.sf-pk-hello').evaluate(el=>({
             title:getComputedStyle(el.querySelector('h2')).textAlign,
             copy:getComputedStyle(el.querySelector('p')).textAlign
           }));
           assert.equal(heading.title,'left','Passkey heading is left aligned: '+overlay);
           assert.equal(heading.copy,'left','Passkey subheading is left aligned: '+overlay);
           const alternative=await page.locator('.sf-pk-use-email').evaluate(el=>({
             bg:getComputedStyle(el).backgroundColor,
             ink:getComputedStyle(el).color,
             radius:getComputedStyle(el).borderRadius,
             width:el.getBoundingClientRect().width,
             height:el.getBoundingClientRect().height,
             container:el.closest('.sf-pk-guest').getBoundingClientRect().width
           }));
           assert.equal(alternative.bg,'rgb(37, 38, 40)','Email/Google remains dark: '+overlay);
           assert.equal(alternative.ink,'rgb(255, 255, 255)','Email/Google text remains white: '+overlay);
           assert.equal(alternative.radius,'999px','Email/Google remains pill-shaped: '+overlay);
           assert(alternative.height>=52,'Alternative action has accessible tap height: '+overlay);
           assert(Math.abs(alternative.width-alternative.container)<2,'Alternative action fills the card width: '+overlay);
         }
      }
    }
    await page.close();

    // Responsive regression: the native staged login is vertically centered
    // within the same account viewport used by remembered-device login.
    // Do not pin the form to the top on tall phones. Return to top flow when
    // the iOS keyboard is active or the phone is short.
    const layout=await browser.newPage({viewport:{width:390,height:844}});
    await layout.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0"><div id="sf-panel" class="is-account-panel"
        style="display:flex;flex-direction:column;width:100%;height:844px;max-height:none;margin:0;padding:0">
        <div class="sf-panel-top" style="flex:none;height:68px">Toolbar</div>
        <section class="sf-panel-body sf-account-body" style="flex:1;min-height:0;box-sizing:border-box">
          <div class="woocommerce sf-overlay-auth sf-smart-auth-active sf-smart-start"
            style="height:300px"><header class="sf-account-intro">Welcome</header>
            <div class="sf-smart-auth">Email</div></div>
        </section></div></body></html>`);
    await layout.addStyleTag({content:cssAccount+'\n'+cssOverlay+'\n'+cssSmart});
    const centered=await layout.evaluate(()=>{
      const body=document.querySelector('.sf-account-body');
      const content=body.querySelector('.woocommerce');
      const box=body.getBoundingClientRect(),inner=content.getBoundingClientRect();
      const style=getComputedStyle(body);
      return {
        alignment:style.justifyContent,
        above:inner.top-box.top-parseFloat(style.paddingTop),
        below:box.bottom-inner.bottom-parseFloat(style.paddingBottom)
      };
    });
    assert(centered.alignment.includes('center'),'Normal login uses vertical centering on tall phones');
    assert(Math.abs(centered.above-centered.below)<6,
      'Normal login is centered in usable account space, not offset from top: '+JSON.stringify(centered));
    await layout.locator('.woocommerce').evaluate(el=>el.classList.add('sf-auth-focus-mode'));
    assert.equal(await layout.locator('.sf-account-body').evaluate(el=>getComputedStyle(el).justifyContent),'normal',
      'Focusing login fields releases centering so the keyboard can scroll naturally');
    await layout.setViewportSize({width:390,height:650});
    await layout.locator('#sf-panel').evaluate(el=>el.style.height='650px');
    await layout.locator('.woocommerce').evaluate(el=>el.classList.remove('sf-auth-focus-mode'));
    assert.equal(await layout.locator('.sf-account-body').evaluate(el=>getComputedStyle(el).justifyContent),'normal',
      'Short phones keep normal top-aligned scrolling');
    await layout.close();

    // Regression: when the same customer has BOTH trusted PIN and WebAuthn,
    // the passkey module waits for the PIN server status. It must enrich one
    // account card, never paint a second welcome/identity view in parallel.
    const combined=await browser.newPage({viewport:{width:390,height:844}});
    const origin='https://storefront-auth.test';
    const combinedHtml='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
      +'<body class="woocommerce-account"><div class="woocommerce">'
      +'<section class="sf-pk-guest" hidden><header class="sf-pk-hello"><h2>Hoş geldin 👋</h2></header>'
      +'<button class="sf-pk-choice"><span class="sf-pk-avatar"></span>'
      +'<span class="sf-pk-identity"><strong class="sf-pk-name"></strong><small class="sf-pk-detail"></small></span>'
      +'<span class="sf-pk-symbol"><svg></svg></span></button>'
      +'<button class="sf-pk-use-email">Email</button></section>'
      +'<div class="sf-account-intro">Normal login</div>'
      +'<div id="customer_login">Woo login</div>'
      +'<div class="sf-quick-accounts"><div class="sf-quick-choice-intro">Welcome</div>'
      +'<section class="sf-quick-login" data-sf-quick-user-id="17" hidden>'
      +'<div class="sf-quick-choice"><div class="sf-quick-account-frame"><div class="sf-quick-account">'
      +'<span class="sf-quick-account-text">Customer</span>'
      +'<span class="sf-quick-methods"><button type="button" class="sf-quick-method sf-quick-method--passkey" hidden>'
      +'<svg class="sf-bio-icon" viewBox="0 0 24 24"><g class="sf-bio-face"><path class="sf-bio-corner" d="M3 8v-4h5"/>'
      +'<path class="sf-bio-feature" d="M7 9h10"/><path class="sf-bio-scanline" d="M6 7h12"/></g>'
      +'<path class="sf-bio-verified" d="M5 12l4 4 10-10"/></svg></button>'
      +'<button type="button" class="sf-quick-method sf-quick-method--pin">PIN</button></span>'
      +'</div></div></div></section>'
      +'<div class="sf-quick-choice-alternatives"><button class="sf-quick-native-alt">Email</button></div></div>'
      +'</div></body></html>';
    await combined.route(origin+'/**',route=>{
      const url=new URL(route.request().url());
      if(url.pathname==='/account')return route.fulfill({status:200,contentType:'text/html',body:combinedHtml});
      if(url.pathname==='/api/assert-options')return route.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify({requestId:'test-request',publicKey:{challenge:'YQ',allowCredentials:[],
          rpId:'storefront-auth.test',userVerification:'required'}})});
      return route.fulfill({status:404,contentType:'text/plain',body:'Not found'});
    });
    await combined.goto(origin+'/account');
    // Install the fixture explicitly on the navigated document. A storage
    // bootstrap on about:blank can be suppressed by WebKit and never reach
    // the fake passkey code below.
    await combined.evaluate(()=>{
      localStorage.setItem('codela_sf_quick_profile_v1',JSON.stringify({
        deviceId:'a'.repeat(32),userId:17,displayName:'Demo Demo'
      }));
      localStorage.setItem('codela_sf_passkey_hint_v1',JSON.stringify({
        credentialId:'test-credential',userId:17,displayName:'Demo Demo',
        email:'demo@example.test',paused:false
      }));
      window.PublicKeyCredential=class {};
      Object.defineProperty(navigator,'credentials',{configurable:true,value:{
        get:()=>new Promise((resolve,reject)=>{window.rejectAuth=reject})
      }});
      window.CodelaSFRemembered={
        passkeys:()=>[JSON.parse(localStorage.getItem('codela_sf_passkey_hint_v1'))],
        select:()=>{}
      };
      window.CodelaSFPasskey={rest:'/api',identity:null};
    });
    await combined.addStyleTag({content:cssAccount+'\n'+cssOverlay+'\n'+cssQuick});
    const passkeysScript=fs.readFileSync('theme/codela-storefront/assets/scripts/passkeys.js','utf8');
    await combined.addScriptTag({content:passkeysScript});
    assert.equal(await combined.locator('.sf-pk-guest').isVisible(),false,
      'Saved passkey must not paint a second account before PIN server status');
    assert.equal(await combined.locator('.sf-quick-login').isVisible(),false,
      'PIN card remains hidden until the trusted browser is server verified');

    await combined.evaluate(()=>{
      const host=document.querySelector('.woocommerce');
      const quick=host.querySelector('.sf-quick-login');
      quick.hidden=false;
      host.classList.add('sf-pin-active');
      host.dataset.sfQuickStatus='active';host.dataset.sfQuickUserId='17';
      host.dispatchEvent(new CustomEvent('codela:quick-status',{
        detail:{active:true,userId:17}
      }));
    });
    assert.equal(await combined.locator('.sf-quick-login').isVisible(),true,'One combined card visible');
    assert.equal(await combined.locator('.sf-pk-guest').isVisible(),false,'Duplicate passkey card stays hidden');
    assert.equal(await combined.locator('.sf-quick-method--pin').isVisible(),true,'PIN icon remains available');
    const combinedDiagnostics=await combined.evaluate(()=>{
      const host=document.querySelector('.woocommerce');
      const biometric=host?.querySelector('.sf-quick-method--passkey');
      return {
        secure:window.isSecureContext,credentialType:typeof window.PublicKeyCredential,
        hasCredentials:!!navigator.credentials,config:!!window.CodelaSFPasskey,
        hasPasskeyHint:!!localStorage.getItem('codela_sf_passkey_hint_v1'),
        hasPinHint:!!localStorage.getItem('codela_sf_quick_profile_v1'),
        hostClass:host?.className,
        quickStatus:host?.dataset.sfQuickStatus,
        biometricHidden:biometric?.hidden,biometricDisplay:biometric&&getComputedStyle(biometric).display,
        guestHidden:host?.querySelector('.sf-pk-guest')?.hidden
      };
    });
    assert.equal(combinedDiagnostics.biometricHidden,false,
      'Fake trusted account event activates the saved biometric icon');
    assert.equal(await combined.locator('.sf-quick-method--passkey').isVisible(),true,'Face ID icon added to same card');
    assert.equal(await combined.locator('.sf-quick-native-alt').isVisible(),true,
      'Combined card has one standard email/Google fallback');

    await combined.locator('.sf-quick-method--passkey').click();
    await combined.waitForFunction(()=>!!window.rejectAuth);
    assert.equal(await combined.locator('.sf-quick-method--passkey').getAttribute('aria-busy'),
      'true','Face ID gesture animates the chosen icon');
    assert.equal(await combined.locator('.sf-quick-method--passkey .sf-bio-corner').evaluate(el=>
      getComputedStyle(el).animationName),'sf-bio-trace',
      'Animated vector corner traces only while system WebAuthn is pending');
    assert.equal(await combined.locator('.sf-quick-passkey-error').innerText(),'',
      'No intrusive phone verification progress line is inserted');
    await combined.evaluate(()=>window.rejectAuth(Object.assign(new Error('Cancelled'),{
      name:'NotAllowedError'
    })));
    await combined.waitForFunction(()=>!document.querySelector('.sf-quick-method--passkey')?.classList.contains('is-verifying'));
    assert.equal(await combined.locator('.sf-quick-passkey-error').innerText(),
      'Doğrulama iptal edildi.','Native cancellation leaves a clear error and stops icon animation');
    await combined.close();
    console.log('Passkey/native registration and combined method card passed');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
