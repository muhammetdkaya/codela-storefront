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
  +'<button type="button" class="woocommerce-form-login__submit">Log in</button></form></div></div>'
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
   await page.locator('#username').click();
   await page.waitForFunction(()=>document.querySelector('.woocommerce')?.classList.contains('sf-auth-focus-mode'));
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
