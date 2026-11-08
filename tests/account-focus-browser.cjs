// Standalone and instant native Woo login focus-mode acceptance.
// No fake credentials, and no script is allowed to autofill/focus the fields.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base='theme/codela-storefront/assets/styles/';
const css=['tokens.css','components.css','account.css','account-overlay.css']
  .map(name=>fs.readFileSync(base+name,'utf8')).join('\n');
const script=fs.readFileSync('theme/codela-storefront/assets/scripts/auth.js','utf8');
const form='<div class="woocommerce"><header class="sf-account-intro"><h1>Welcome</h1></header>'
  +'<div id="customer_login" class="sf-auth-ready"><div class="u-column1">'
  +'<form class="woocommerce-form-login"><p class="form-row"><label for="username">Email</label>'
  +'<input id="username" name="username" class="input-text" autocomplete="username"></p>'
  +'<p class="form-row"><label for="password">Password</label>'
  +'<input id="password" name="password" class="input-text" type="password"></p>'
  +'<p class="form-row"><label class="woocommerce-form-login__rememberme">'
  +'<input type="checkbox" name="rememberme">Remember me</label></p>'
  +'<p class="lost_password"><a href="/forgot/">Forgot password?</a></p>'
  +'<button type="submit" class="woocommerce-form-login__submit">Log in</button></form></div></div>'
  +'<a class="sf-auth-register-cta" href="#register">Register with email</a>'
  +'<div class="sf-auth-social"><button class="sf-auth-google">Continue with Google</button></div></div>';
(async()=>{
 const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true});
 try{
  for(const mode of ['standalone','instant']){
   const page=await browser.newPage({viewport:{width:390,height:844}});
   const wrapped=mode==='instant'
     ?'<div id="sf-panel" class="is-account-panel"><section id="sf-account">'+form+'</section></div>'
     :'<main class="sf-content">'+form+'</main>';
   await page.setContent('<!doctype html><html><head>'
     +'<meta name="viewport" content="width=device-width,initial-scale=1">'
     +'<style>'+css+'</style></head><body class="woocommerce-account">'+wrapped+'</body></html>');
   await page.addScriptTag({content:script});
   assert.equal(await page.locator('.woocommerce.sf-auth-focus-mode').count(),0,
     mode+' login never auto-focuses or dims on page load');
   assert.equal(await page.locator('.sf-auth-focus-scrim').count(),1,
     mode+' installs one dedicated focus backdrop, distinct from quick PIN');
   const remember=page.locator('input[name="rememberme"]');
   const rememberLabel=page.locator('.woocommerce-form-login__rememberme');
   const forgot=page.locator('.lost_password');
   const submit=page.locator('.woocommerce-form-login__submit');
   assert.equal(await rememberLabel.isVisible(),true,mode+' shows the quiet remember option before typing');
   assert.equal(await forgot.isVisible(),true,mode+' shows the password reset link before typing');
   assert.equal(await submit.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)',
     mode+' retains the default white Login action');
   const helperStyle=await page.locator('.lost_password a').evaluate(el=>({
     decoration:getComputedStyle(el).textDecorationLine,
     arrow:getComputedStyle(el,'::after').content
   }));
   assert.equal(helperStyle.decoration,'none',mode+' helper link does not add a competing underline');
   assert.notEqual(helperStyle.arrow,'none',mode+' helper link keeps its minimal chevron');
   await remember.check();
   assert.equal(await remember.isChecked(),true,mode+' native remember checkbox is checkable');
   await page.locator('#username').click();
   await page.waitForFunction(()=>document.querySelector('.woocommerce')?.classList.contains('sf-auth-focus-mode'));
   assert.equal(await rememberLabel.isVisible(),false,mode+' hides helper row during credential focus');
   assert.equal(await forgot.isVisible(),false,mode+' hides reset option during credential focus');
   assert.equal(await remember.isChecked(),true,mode+' focus mode never clears the native remembered choice');
   const focusedStyle=await page.evaluate(()=>{
     const user=document.querySelector('#username');
     const pass=document.querySelector('#password');
     const submit=document.querySelector('.woocommerce-form-login__submit');
     const probe=document.createElement('i');
     probe.style.color='var(--sf-ui-ink)';
     submit.appendChild(probe);
     const ink=getComputedStyle(probe).color;probe.remove();
     const first=user.getBoundingClientRect(),second=pass.getBoundingClientRect(),action=submit.getBoundingClientRect();
     const style=getComputedStyle(user);
     return {
       ink,buttonBg:getComputedStyle(submit).backgroundColor,buttonColor:getComputedStyle(submit).color,
       borderWidth:style.borderTopWidth,outline:style.outlineStyle,outlineOffset:style.outlineOffset,
       firstWidth:first.width,secondWidth:second.width,actionWidth:action.width,
       betweenFields:second.top-first.bottom,betweenAction:action.top-second.bottom
     };
   });
   assert.equal(focusedStyle.buttonBg,'rgb(255, 255, 255)',
     mode+' focus alone keeps native Login white until both values are entered');
   assert(Math.max(...(focusedStyle.buttonColor.match(/\\d+/g)||[]).map(Number))<=65,
     mode+' untouched Login button retains legible dark theme text');
   assert.equal(focusedStyle.borderWidth,'2px',mode+' focused field has a continuous 2px border');
   assert.equal(focusedStyle.outline,'none',mode+' focused field has no detached outer outline');
   assert.equal(focusedStyle.outlineOffset,'0px',mode+' focused field has no outline gap');
   assert(Math.abs(focusedStyle.firstWidth-focusedStyle.secondWidth)<2,mode+' input widths match');
   assert(Math.abs(focusedStyle.firstWidth-focusedStyle.actionWidth)<2,mode+' action and inputs share one width');
   assert(focusedStyle.betweenFields>=7&&focusedStyle.betweenFields<=15,
     mode+' credentials maintain compact 9px internal spacing');
   assert(focusedStyle.betweenAction>=8&&focusedStyle.betweenAction<=18,
     mode+' submit stays compact below credentials');

   // Fully oval input shape does not affect WooCommerce nonces, helper controls,
   // or the focused continuous border.
   for(const selector of ['#username','#password']){
     const radius=await page.locator(selector).evaluate(el=>getComputedStyle(el).borderRadius);
     assert.equal(radius,'999px',mode+' '+selector+' is fully pill-shaped');
   }
   const getButtonColors=()=>submit.evaluate(el=>{
     const style=getComputedStyle(el);
     return {bg:style.backgroundColor,ink:style.color,
       animation:style.animationName,iterations:style.animationIterationCount};
   });
   await page.locator('#password').fill('example-password');
   assert.equal(await submit.evaluate(el=>getComputedStyle(el).backgroundColor),
     'rgb(255, 255, 255)',mode+' password alone never marks sign-in ready');
   assert.equal(await submit.evaluate(el=>el.closest('form').classList.contains('sf-auth-submit-ready')),
     false,mode+' a single field is not ready');
   await page.locator('#username').fill('person@example.com');
   await page.waitForFunction(()=>{
     const button=document.querySelector('.woocommerce-form-login__submit');
     if(!button?.closest('form')?.classList.contains('sf-auth-submit-ready'))return false;
     const probe=document.createElement('span');probe.style.color='var(--sf-ui-ink)';
     button.appendChild(probe);const expected=getComputedStyle(probe).color;probe.remove();
     return getComputedStyle(button).backgroundColor===expected;
   });
   const ready=await getButtonColors();
   assert.equal(ready.bg,focusedStyle.ink,mode+' both nonempty fields use theme dark, not green');
   assert.equal(ready.ink,'rgb(255, 255, 255)',mode+' ready Login keeps readable white type');
   assert.equal(ready.animation,'sf-auth-submit-ready-enter',mode+' readiness animates once');
   assert.equal(ready.iterations,'1',mode+' readiness never pulses indefinitely');
   await page.locator('#password').fill('');
   await page.waitForFunction(()=>{
     const form=document.querySelector('.woocommerce-form-login');
     const submit=form.querySelector('button[type=submit]');
     return !form.classList.contains('sf-auth-submit-ready')
       && getComputedStyle(submit).backgroundColor==='rgb(255, 255, 255)';
   });
   assert.equal(await submit.evaluate(el=>getComputedStyle(el).backgroundColor),
     'rgb(255, 255, 255)',mode+' clearing either field restores the white button');
   await page.locator('#password').fill('example-password');
   await page.waitForFunction(()=>{
     const button=document.querySelector('.woocommerce-form-login__submit');
     const probe=document.createElement('span');probe.style.color='var(--sf-ui-ink)';
     button.appendChild(probe);const expected=getComputedStyle(probe).color;probe.remove();
     return getComputedStyle(button).backgroundColor===expected;
   });
   assert.equal(await submit.evaluate(el=>getComputedStyle(el).backgroundColor),
     focusedStyle.ink,mode+' refilling restores dark readiness');
   const dim=await page.locator('.sf-auth-focus-scrim').evaluate(el=>{
     const st=getComputedStyle(el);return {bg:st.backgroundColor,blur:st.backdropFilter,z:st.zIndex};
   });
   assert.equal(dim.bg,'rgba(20, 21, 25, 0.3)',mode+' matches the existing quick PIN scrim opacity and RGB');
   assert(dim.blur.includes('2px'),mode+' matches the existing quick PIN blur');
   const layer=await page.evaluate(()=>{
     const form=document.querySelector('#customer_login');
     const scrim=document.querySelector('.sf-auth-focus-scrim');
     const cta=document.querySelector('.woocommerce-form-login__submit');
     const google=document.querySelector('.sf-auth-google');
     const loginBox=cta.getBoundingClientRect(),googleBox=google.getBoundingClientRect();
     return {form:Number(getComputedStyle(form).zIndex),
       scrim:Number(getComputedStyle(scrim).zIndex),
       overLogin:document.elementFromPoint(loginBox.left+loginBox.width/2,loginBox.top+loginBox.height/2)===cta,
       overGoogle:document.elementFromPoint(googleBox.left+googleBox.width/2,googleBox.top+googleBox.height/2)===scrim};
   });
   assert(layer.form>layer.scrim,mode+' raises only the native form over the background');
   assert(layer.overLogin,mode+' leaves the login button actionable above the backdrop');
   assert(layer.overGoogle,mode+' dims the Google action beneath the backdrop');
   await page.locator('#password').click();
   assert.equal(await page.locator('.woocommerce.sf-auth-focus-mode').count(),1,
     mode+' stays in focus mode when switching between username/password');
   await page.evaluate(()=>document.activeElement.blur());
   await page.waitForFunction(()=>!document.querySelector('.woocommerce')?.classList.contains('sf-auth-focus-mode'));
   assert.equal(await rememberLabel.isVisible(),true,mode+' restores helper row when keyboard closes');
   assert.equal(await forgot.isVisible(),true,mode+' restores password reset when keyboard closes');
   assert.equal(await remember.isChecked(),true,mode+' native remembered state persists after keyboard closes');
   assert.equal(await submit.evaluate(el=>getComputedStyle(el).backgroundColor),focusedStyle.ink,
     mode+' completed credentials stay ready after keyboard dismissal');
   // Autofilled/restored values are also reflected without fabricating auth.
   await page.evaluate(()=>{
     const user=document.querySelector('#username');
     user.value='';
     window.dispatchEvent(new Event('pageshow'));
   });
   await page.waitForFunction(()=>{
     const form=document.querySelector('.woocommerce-form-login');
     return !form.classList.contains('sf-auth-submit-ready')
       && getComputedStyle(form.querySelector('button[type=submit]')).backgroundColor==='rgb(255, 255, 255)';
   });
   assert.equal(await submit.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)',
     mode+' page restore recalculates native form readiness');
   await page.locator('#password').click();
   await page.locator('.sf-auth-focus-scrim').click({position:{x:5,y:5}});
   await page.waitForFunction(()=>!document.querySelector('.woocommerce')?.classList.contains('sf-auth-focus-mode'));
   assert.equal(await page.locator('.sf-auth-focus-scrim').evaluate(el=>getComputedStyle(el).pointerEvents),'none',
     mode+' does not leave a blocking backdrop when the field/keyboard is dismissed');
   await page.close();
  }
  console.log('Native Woo focus/keyboard scrim integration passed (standalone and instant)');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
