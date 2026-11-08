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
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body class="woocommerce-account">'
    +'<div class="woocommerce"><button class="sf-quick-google" disabled>Google</button>'
    +'<form class="woocommerce-form-login"><button type="submit">Log in</button></form>'
    +'<a class="sf-auth-register-cta" href="#sf-auth-register">Register with email</a>'
    +'<div class="sf-auth-social"><button class="sf-auth-google" disabled>Google</button></div></div>'
    +'<div id="sf-panel" class="is-account-panel"><div class="woocommerce">'
    +'<form class="woocommerce-form-login"><button type="submit">Log in</button></form>'
    +'<div class="sf-auth-social"><button class="sf-auth-google" disabled>Google</button></div></div></div>'
    +'<section class="sf-quick-sheet"><div style="height:300px"></div></section></body></html>');
  for(const selector of ['.sf-quick-google','body > .woocommerce .sf-auth-google','#sf-panel .sf-auth-google']){
    const result=await page.locator(selector).evaluate(el=>{
      const st=getComputedStyle(el);return {background:st.backgroundColor,ink:st.color,opacity:st.opacity};
    });
    const rgb=(result.background.match(/\d+/g)||[]).map(Number);
    assert(rgb.length===3&&Math.max(...rgb)<=65,selector+' is dark at full opacity');
    assert.equal(result.ink,'rgb(255, 255, 255)',selector+' keeps readable white text');
    assert.equal(result.opacity,'1',selector+' never fades whole-button colors');
  }
  for(const selector of ['body > .woocommerce .woocommerce-form-login button','#sf-panel .woocommerce-form-login button']){
    const result=await page.locator(selector).evaluate(el=>({
      background:getComputedStyle(el).backgroundColor,ink:getComputedStyle(el).color
    }));
    assert.equal(result.background,'rgb(255, 255, 255)',selector+' uses the normal white Login CTA');
    const rgbInk=(result.ink.match(/\d+/g)||[]).map(Number);
    assert(rgbInk.length===3&&Math.max(...rgbInk)<=65,selector+' uses the dark UI Kit label text');
  }
  // The same remembered/initial-check suppression also works on /hesabim/.
  await page.locator('body > .woocommerce').evaluate(el=>el.classList.add('sf-pin-active'));
  assert.equal(await page.locator('body > .woocommerce > .sf-auth-register-cta').isVisible(),false,
    'Remembered login hides standalone registration even against important flex rules');
  await page.locator('body > .woocommerce').evaluate(el=>el.classList.remove('sf-pin-active'));
  assert.equal(await page.locator('body > .woocommerce > .sf-auth-register-cta').isVisible(),true,
    'Native standalone login keeps its registration link');
  await page.evaluate(()=>document.documentElement.classList.add('sf-quick-checking'));
  assert.equal(await page.locator('body > .woocommerce > .sf-auth-register-cta').isVisible(),false,
    'Standalone quick status preflight never flashes registration');
  await page.evaluate(()=>document.documentElement.classList.remove('sf-quick-checking'));
  // Homepage/shop enqueues account-overlay.css WITHOUT account.css.
  // Reproduce genuine nested form order, register CTA and Google sibling.
  const overlayOnly=['tokens.css','components.css','quick-login.css','account-overlay.css']
    .map(x=>fs.readFileSync(base+x,'utf8')).join('\n');
  for (const width of [320,390]) {
    await page.setViewportSize({width,height:844});
    const markup='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+overlayOnly+'</style></head>'
      +'<body><div id="sf-panel" class="is-account-panel"><section id="sf-account"><div class="woocommerce">'
      +'<div id="customer_login" class="sf-auth-ready"><div class="u-column1"><form class="woocommerce-form-login">'
      +'<p class="form-row"><input class="input-text" placeholder="E-posta"></p>'
      +'<p class="form-row"><label class="woocommerce-form-login__rememberme">Beni hatırla</label><button type="submit">Giriş Yap</button></p>'
      +'</form></div></div>'
      +'<a class="sf-auth-register-cta" href="#sf-auth-register"><span class="sf-auth-register-glyph">✉</span><span>E-posta ile Kayıt Ol</span></a>'
      +'<div class="sf-auth-social"><div class="sf-auth-divider">veya</div><button class="sf-auth-google" disabled>Google</button></div>'
      +'</div></section></div></body></html>';
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
    const darkGoogle=await page.locator('.sf-auth-google').evaluate(el=>getComputedStyle(el).backgroundColor);
    assert(Math.max(...(darkGoogle.match(/\d+/g)||[]).map(Number))<=65,
      'Native overlay-only Google CTA uses theme dark');
    assert.equal(await page.locator('.woocommerce-form-login button[type=submit]').evaluate(el=>getComputedStyle(el).backgroundColor),
      'rgb(255, 255, 255)','Native overlay-only Login uses white UI Kit surface');
    // Only the REMEMBERED quick account screen suppresses direct signup.
    await page.locator('.woocommerce').evaluate(el=>el.classList.add('sf-pin-active'));
    assert.equal(await page.locator('.sf-auth-register-cta').isVisible(),false,
      'Remembered quick account never displays registration action on '+width);
    await page.locator('.woocommerce').evaluate(el=>el.classList.remove('sf-pin-active'));
    assert.equal(await page.locator('.sf-auth-register-cta').isVisible(),true,
      'Returning to native email sign-in restores registration action on '+width);
    await page.evaluate(()=>document.documentElement.classList.add('sf-quick-checking'));
    assert.equal(await page.locator('.sf-auth-register-cta').isVisible(),false,
      'Device status preflight cannot flash registration on '+width);
    await page.evaluate(()=>document.documentElement.classList.remove('sf-quick-checking'));
    await page.locator('.woocommerce').evaluate(el=>el.classList.add('sf-auth-register-view'));
    assert.equal(await page.locator('.sf-auth-register-cta').isVisible(),false,
      'Registration hides duplicate signup action in CSS-backed quick panel');
    assert.equal(await page.locator('.sf-auth-social').isVisible(),false,
      'Registration hides duplicate Google action in CSS-backed quick panel');
  }
  await page.setViewportSize({width:390,height:844});
  // Native PIN now expands within the account card: no fixed sheet. CSS
  // geometry and chevron are verified in both Chromium and WebKit.
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head>'
    +'<body><section class="sf-quick-login"><div class="sf-quick-choice">'
    +'<div class="sf-quick-account-frame">'
    +'<button class="sf-quick-account" aria-expanded="false"><span class="sf-quick-monogram">A</span>'
    +'<span class="sf-quick-account-text">Ayşe Yılmaz</span>'
    +'<span class="sf-quick-chevron"><svg viewBox="0 0 24 24"><path d="m5 9 7 7 7-7"/></svg></span></button>'
    +'<div class="sf-quick-inline-pin" aria-hidden="true"><div class="sf-quick-inline-inner">'
    +'<div class="sf-quick-inline-divider"></div><p class="sf-quick-inline-label">6-digit code</p>'
    +'<div class="sf-quick-pin-track">'
    +Array.from({length:6},()=>'<span class="sf-quick-slot"><i></i></span>').join('')
    +'<span class="sf-quick-result"><svg class="sf-quick-check"><path d="M4 12l5 5L20 6"/></svg></span>'
    +'<input class="sf-quick-native-pin" inputmode="numeric" autocomplete="off"></div>'
    +'<p class="sf-quick-status"></p></div></div></div></div>'
    +'<div class="sf-quick-choice-alternatives">Other actions</div></div>'
    +'<div class="sf-quick-scrim" hidden></div></section></body></html>');
  assert.equal(await page.locator('.sf-quick-sheet').count(),0,'No bottom modal is rendered');
  await page.locator('.sf-quick-login').evaluate(el=>el.classList.add('is-inline-open'));
  await page.locator('.sf-quick-scrim').evaluate(el=>el.hidden=false);
  await page.waitForTimeout(470);
  const geometry=await page.locator('.sf-quick-account-frame').evaluate(el=>{
    const card=el.getBoundingClientRect(),track=el.querySelector('.sf-quick-pin-track').getBoundingClientRect();
    const cells=[...el.querySelectorAll('.sf-quick-slot')].map(slot=>{
      const rect=slot.getBoundingClientRect();
      return {w:rect.width,h:rect.height};
    });
    return {cardWidth:card.width,trackWidth:track.width,cells};
  });
  assert.equal(geometry.cells.length,6,'Exactly six inline PIN squares');
  for(const square of geometry.cells){
    assert(Math.abs(square.w-square.h)<1,'PIN fields remain square');
    assert(square.w>20,'PIN square can be tapped on mobile');
  }
  assert(geometry.trackWidth<geometry.cardWidth,'PIN remains inside card padding');
  const chevron=await page.locator('.sf-quick-chevron svg').evaluate(el=>getComputedStyle(el).transform);
  assert(chevron!=='none','Chevron rotates upward while card is expanded');
  const shade=await page.locator('.sf-quick-scrim').evaluate(el=>getComputedStyle(el));
  assert(await page.locator('.sf-quick-scrim').isVisible(),'The rest of the screen dims when inline PIN opens');
  assert.equal(await page.locator('.sf-quick-native-pin').getAttribute('inputmode'),'numeric','System numeric keyboard is used');
  assert.equal(await page.locator('.sf-quick-result').evaluate(el=>getComputedStyle(el).opacity),'0',
    'Green check is hidden while PIN is unverified');
  await page.locator('.sf-quick-pin-track').evaluate(el=>el.classList.add('is-merging'));
  assert.equal(await page.locator('.sf-quick-result').evaluate(el=>getComputedStyle(el).opacity),'0',
    'Even the merge transition does not reveal the check early');
  await page.locator('.sf-quick-pin-track').evaluate(el=>el.classList.add('is-verified'));
  await page.waitForTimeout(380);
  assert.equal(await page.locator('.sf-quick-result').evaluate(el=>getComputedStyle(el).backgroundColor),
    'rgb(22, 132, 79)','Single result becomes green after verified state');
  await page.locator('.sf-quick-login').evaluate(el=>el.classList.remove('is-inline-open'));
  await page.waitForTimeout(450);
  assert.equal(await page.locator('.sf-quick-inline-pin').evaluate(el=>getComputedStyle(el).opacity),'0',
    'Collapsing card hides the PIN without a page navigation');
  console.log('Account Google and PIN visual states passed in '+(process.env.TEST_WEBKIT?'WebKit':'Chromium'));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
