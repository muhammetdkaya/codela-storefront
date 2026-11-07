// Isolated visual regressions for iOS account choices and PIN panel geometry.
// The native PIN verification/network tests remain in quick-login-browser.cjs.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base='theme/codela-storefront/assets/styles/';
const css=['tokens.css','components.css','quick-login.css','account.css','account-overlay.css'].map(x=>fs.readFileSync(base+x,'utf8')).join('\n');
(async()=>{
 const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body class="woocommerce-account"><div class="woocommerce"><button class="sf-quick-google" disabled>Google</button><div class="sf-auth-social"><button class="sf-auth-google" disabled>Google</button></div></div><div id="sf-panel" class="is-account-panel"><button class="sf-auth-google" disabled>Google</button></div><section class="sf-quick-sheet"><div style="height:300px"></div></section></body></html>');
  for(const selector of ['.sf-quick-google','.woocommerce .sf-auth-google','#sf-panel .sf-auth-google']){
    const result=await page.locator(selector).evaluate(el=>{
      const st=getComputedStyle(el);return {background:st.backgroundColor,opacity:st.opacity};
    });
    assert.equal(result.background,selector==='.sf-quick-google'
      ? 'rgb(37, 38, 40)' : 'rgb(255, 255, 255)',
      selector+' retains its configured visual surface');
    assert.equal(result.opacity,'1',selector+' full contrast even when disabled');
  }
  // Homepage/shop enqueues account-overlay.css WITHOUT account.css.
  // Reproduce genuine nested form order, register CTA and Google sibling.
  const overlayOnly=['tokens.css','components.css','account-overlay.css']
    .map(x=>fs.readFileSync(base+x,'utf8')).join('\n');
  for (const width of [320,390]) {
    await page.setViewportSize({width,height:844});
    const markup='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+overlayOnly+'</style></head>'
      +'<body><div id="sf-panel" class="is-account-panel"><div class="woocommerce">'
      +'<div id="customer_login" class="sf-auth-ready"><div class="u-column1"><form class="woocommerce-form-login">'
      +'<p class="form-row"><input class="input-text" placeholder="E-posta"></p>'
      +'<p class="form-row"><label class="woocommerce-form-login__rememberme">Beni hatırla</label><button type="submit">Giriş Yap</button></p>'
      +'</form></div></div>'
      +'<a class="sf-auth-register-cta" href="#sf-auth-register"><span class="sf-auth-register-glyph">✉</span><span>E-posta ile Kayıt Ol</span></a>'
      +'<div class="sf-auth-social"><div class="sf-auth-divider">veya</div><button class="sf-auth-google" disabled>Google</button></div>'
      +'</div></div></body></html>';
    await page.setContent(markup);
    const layout=await page.locator('.sf-auth-register-cta').evaluate(el=>{
      const b=el.getBoundingClientRect(),form=document.querySelector('#customer_login').getBoundingClientRect(),
        primary=document.querySelector('button[type=submit]').getBoundingClientRect(),
        google=document.querySelector('.sf-auth-google').getBoundingClientRect(),
        label=el.lastElementChild.getBoundingClientRect();
      return {height:b.height,width:b.width,formWidth:form.width,top:b.top,
        primaryBottom:primary.bottom,googleTop:google.top,
        textHeight:label.height,bg:getComputedStyle(el).backgroundColor,nowrap:getComputedStyle(el).whiteSpace,
        insideForm:!!el.closest('form')};
    });
    assert(Math.abs(layout.height-54)<1,'Quick-panel register uses 54px theme action on '+width);
    assert(Math.abs(layout.width-layout.formWidth)<2,'Register uses FULL form width on '+width);
    assert(layout.primaryBottom<layout.top && layout.top+layout.height<layout.googleTop,'Register sits between Login and Google on '+width);
    assert(layout.nowrap==='nowrap' && layout.textHeight<25,'Register label stays in one line on '+width);
    assert.equal(layout.bg,'rgb(237, 237, 237)','Signup inherits the standard UI Kit tonal color');
    assert.equal(layout.insideForm,false,'Signup is not trapped in a Woo form row');
    assert.equal(await page.locator('.sf-auth-google').evaluate(el=>getComputedStyle(el).backgroundColor),
      'rgb(255, 255, 255)','Overlay-only Google CTA uses theme white');
    await page.locator('.woocommerce').evaluate(el=>el.classList.add('sf-auth-register-view'));
    assert.equal(await page.locator('.sf-auth-register-cta').isVisible(),false,
      'Registration hides duplicate signup action in CSS-backed quick panel');
    assert.equal(await page.locator('.sf-auth-social').isVisible(),false,
      'Registration hides duplicate Google action in CSS-backed quick panel');
  }
  await page.setViewportSize({width:390,height:844});
  // Recreate the sheet for its native keyboard geometry acceptance.
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body class="woocommerce-account"><section class="sf-quick-sheet"><div style="height:300px"></div></section></body></html>');
  const closed=await page.locator('.sf-quick-sheet').evaluate(el=>el.getBoundingClientRect().bottom);
  assert(Math.abs(closed-844)<2,'Sheet rests on layout viewport when keyboard is absent');
  const opened=await page.locator('.sf-quick-sheet').evaluate(el=>{
    el.classList.add('has-keyboard');
    el.style.setProperty('--sf-quick-visual-height','430px');
    el.style.setProperty('--sf-quick-visual-top','142px');
    return {top:el.getBoundingClientRect().top,
      maxHeight:getComputedStyle(el).maxHeight};
  });
  assert(Math.abs(opened.top-142)<2,'Keyboard mode uses measured visual top, not double lift');
  assert.equal(opened.maxHeight,'430px','Sheet can scroll in a reduced viewport');
  await page.locator('.sf-quick-sheet').evaluate(el=>{
    el.classList.remove('has-keyboard');
    el.style.removeProperty('--sf-quick-visual-top');
    el.style.removeProperty('--sf-quick-visual-height');
  });
  const restored=await page.locator('.sf-quick-sheet').evaluate(el=>el.getBoundingClientRect().bottom);
  assert(Math.abs(restored-844)<2,'Keyboard dismissal restores true bottom anchoring');
  console.log('Account Google and PIN visual states passed in '+(process.env.TEST_WEBKIT?'WebKit':'Chromium'));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
