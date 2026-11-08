const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const auth=fs.readFileSync('theme/codela-storefront/assets/scripts/auth.js','utf8');
const smart=fs.readFileSync('theme/codela-storefront/assets/scripts/auth-smart.js','utf8');
const css=['theme/codela-storefront/assets/styles/account-overlay.css',
  'theme/codela-storefront/assets/styles/auth-smart.css'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const html=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;font:16px -apple-system,system-ui}#sf-panel{max-width:430px;margin:auto;padding:16px}#customer_login{display:block}.u-column1,.u-column2{width:100%}.sf-auth-focus-scrim{position:fixed}</style>
<style>${css}</style></head>
<body><div id="sf-panel" class="is-account-panel">
<div class="sf-panel-top">Account header</div>
<div class="woocommerce sf-overlay-auth" data-auth-state-url="/state">
<header class="sf-account-intro" data-auth-lookup-url="/lookup" data-auth-lookup-nonce="token123"
data-auth-initial="login" data-auth-login-title="Welcome back"
data-auth-login-description="Sign in to your account."
data-auth-register-title="Create an account" data-auth-register-description="Join us in a few steps."
data-auth-smart-label="Email address" data-auth-smart-first="First name"
data-auth-smart-last="Last name" data-auth-smart-checking="Checking account…"
data-auth-smart-error="Check unavailable" data-auth-smart-closed="Registration closed"
data-auth-smart-continue="Continue with email"
data-auth-smart-password-link="Password link emailed" data-auth-smart-register-password="Password (at least 8 characters)"
data-auth-smart-strength-min="At least 8 characters" data-auth-smart-strength-mix="Include letters and a number or symbol"
data-auth-smart-strength-ok="Password meets requirements" data-auth-smart-strength-strong="Strong password"
data-auth-smart-title="Welcome" data-auth-smart-description="Sign in or create an account with your email.">
<h1><span class="sf-auth-heading-text">Welcome back</span>
<span class="sf-auth-heading-wave">👋</span></h1>
<p class="sf-auth-description">Sign in to your account.</p></header>
<div id="customer_login">
<div class="u-column1"><form class="woocommerce-form-login" action="/submitted" method="post">
<p class="form-row"><label for="username">Email or username</label>
<input id="username" name="username" type="text"></p>
<p class="form-row"><label for="password">Password</label>
<input id="password" name="password" type="password"></p>
<p class="form-row"><label class="woocommerce-form-login__rememberme">
<input type="checkbox" name="rememberme">Remember me</label>
<button class="woocommerce-form-login__submit" name="login" value="Log in" type="submit">Log in</button></p>
<p class="lost_password"><a href="/reset">Forgot password</a></p>
<input name="woocommerce-login-nonce" type="hidden" value="old"></form></div>
<div class="u-column2"><form class="woocommerce-form-register" action="/submitted" method="post">
<a class="sf-auth-back-login" href="#customer_login">Back to sign in</a>
<div class="sf-smart-name-fields">
<p class="form-row"><label for="sf-smart-first">First name</label>
<input id="sf-smart-first" name="first_name" type="text" class="input-text"></p>
<p class="form-row"><label for="sf-smart-last">Last name</label>
<input id="sf-smart-last" name="last_name" type="text" class="input-text"></p></div>
<p class="form-row"><label for="reg_username">Username</label>
<input id="reg_username" name="username" type="text"></p>
<p class="form-row"><label for="reg_email">Email</label>
<input id="reg_email" name="email" type="email"></p>
<p class="form-row"><label for="reg_password">Create password</label>
<input id="reg_password" name="password" type="password"></p>
<p class="form-row"><button type="submit" name="register" value="Register">Register</button></p>
<input name="woocommerce-register-nonce" type="hidden" value="old"></form></div></div>
<a class="sf-auth-register-cta" href="#sf-auth-register">Register with email</a>
<button class="sf-quick-return" type="button">Quick sign in</button>
<div class="sf-auth-social"><button class="sf-auth-google">Google login</button></div>
</div><div class="sf-mobile-dock">Dock</div></div>
<script src="/auth.js"></script><script src="/auth-smart.js"></script></body></html>`;
(async()=>{
 let requests=0;
 const server=http.createServer((req,res)=>{
   const send=(status,body,type='application/json')=>{
     res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);
   };
   if(req.url==='/'&&req.method==='GET')return send(200,html,'text/html');
   if(req.url==='/auth.js')return send(200,auth,'text/javascript');
   if(req.url==='/auth-smart.js')return send(200,smart,'text/javascript');
   if(req.url==='/state'&&req.method==='POST')
     return send(200,JSON.stringify({authenticated:false,login_nonce:'fresh-login',
       register_nonce:'fresh-register',lookup_nonce:'fresh-lookup'}));
   if(req.url==='/lookup'&&req.method==='POST'){
     let raw='';req.on('data',chunk=>raw+=chunk);
     return req.on('end',()=>{
       const params=new URLSearchParams(raw);requests++;
       assert.equal(params.get('action'),'codela_sf_auth_lookup','Use read-only account lookup');
       assert.equal(params.get('token')==='token123'||params.get('token')==='fresh-lookup',true);
       const value=params.get('identity');
       if(value==='limited@example.test')return send(429,JSON.stringify({status:'unavailable'}));
       return send(200,JSON.stringify({status:value==='existing@example.test'?'existing':'new'}));
     });
   }
   if(req.url==='/submitted'&&req.method==='POST')return send(200,'<h1>Native Woo submitted</h1>','text/html');
   return send(404,'no route','text/plain');
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const url='http://127.0.0.1:'+server.address().port+'/';
 const browser=await (process.env.TEST_WEBKIT==='1'?webkit:chromium).launch({headless:true});
 try{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   await page.goto(url);
   const uid=page.locator('.sf-smart-identity');
   assert(await uid.isVisible(),'Initial page exposes one shared identity input');
   assert.equal(await page.locator('.u-column1').isVisible(),false,'Native login stays folded');
   assert.equal(await page.locator('.u-column2').isVisible(),false,'Native registration stays folded');
   assert.equal(await page.locator('.sf-auth-register-cta').isVisible(),false,'No extra registration CTA');
   assert.equal(await uid.getAttribute('type'),'email','Only email addresses can initiate account lookup');
   assert.equal(await uid.getAttribute('autocomplete'),'email','Native email autofill stays available');
   assert.equal(await page.locator('.sf-smart-change').count(),0,'There is no change-email action');
   assert.equal(await page.locator('#customer_login').isVisible(),false,'Empty native form container must not reserve vertical space');
   const firstGap=await page.evaluate(()=>{
     const email=document.querySelector('.sf-smart-identity').getBoundingClientRect();
     const quick=document.querySelector('.sf-quick-return').getBoundingClientRect();
     return quick.top-email.bottom;
   });
   assert(firstGap>=0 && firstGap<=40,'Initial quick return follows the email field closely, gap='+firstGap);
   assert.equal(await page.locator('.sf-quick-return').isVisible(),true,'Quick return remains on the initial screen');
   assert.equal(await page.locator('.sf-auth-google').isVisible(),true,'Google remains on the initial screen');
   // A real gesture releases the iOS/WebKit initial-autofocus guard.
   await uid.click();
   await uid.fill('test');
   assert.equal(await page.locator('#password').isVisible(),false,'Bare username-like text never opens a password field');
   assert.equal(await page.locator('.u-column2').isVisible(),false,'Bare text never opens registration');
   assert.equal(requests,0,'Bare text does not reach the existence endpoint');
   await uid.fill('existing@example.test');
   assert.equal(await page.locator('.sf-smart-progress').getAttribute('data-state'),'checking','Email field owns lookup spinner');
   assert.equal(await page.locator('.sf-smart-progress').isVisible(),true,'Animated lookup indicator is inside the email field');
   assert.equal(await page.locator('.sf-smart-message').evaluate(e=>getComputedStyle(e).position),'absolute','Lookup text does not add another visual row');
   await page.waitForFunction(()=>document.querySelector('.woocommerce')?.classList.contains('sf-smart-existing'),
     null,{timeout:6500}).catch(async error=>{
       const details=await page.evaluate(()=>({
         className:document.querySelector('.woocommerce')?.className,
         identity:document.querySelector('.sf-smart-identity')?.value,
         hint:document.querySelector('.sf-smart-message')?.textContent,
         token:document.querySelector('.sf-account-intro')?.dataset.authLookupNonce,
         screen:document.querySelector('#customer_login')?.dataset.authView,
         pending:!document.querySelector('.sf-smart-progress')?.hidden,
         smartLoaded:!!document.querySelector('.sf-smart-auth')
       }));
       console.error('SMART_AUTH_DIAGNOSTICS',JSON.stringify(details));
       throw error;
     });
   assert(await page.locator('#password').isVisible(),'Existing account opens password');
   assert.equal(await page.locator('.sf-smart-progress').getAttribute('data-state'),'done','Lookup completion changes spinner to a check icon');
   assert.equal(await page.locator('.sf-auth-google').isVisible(),false,'Google disappears when password stage starts');
   assert.equal(await page.locator('.sf-quick-return').isVisible(),false,'Quick sign-in disappears when password stage starts');
   assert.equal(await page.locator('.woocommerce-form-login__submit').isVisible(),false,'Submit hidden before password');
   await page.locator('#password').fill('correct horse');
   assert(await page.locator('.woocommerce-form-login__submit').isVisible(),'Button appears after password');
   assert.equal(await page.locator('#username').inputValue(),'existing@example.test','Woo login has exact username');
   const primary=await page.locator('.woocommerce-form-login__submit').evaluate(e=>getComputedStyle(e).backgroundColor);
   assert.equal(primary,'rgb(37, 38, 40)','Filled password produces dark primary action');
   // Use a genuine pointer gesture: the site deliberately suppresses
   // unwanted PROGRAMMATIC autofocus until the first real user interaction.
   await page.locator('#password').click();
   await page.waitForFunction(()=>document.querySelector('.woocommerce')?.classList.contains('sf-auth-focus-mode'));
   // Visibility intentionally transitions for 160 ms; wait for the final
   // hidden state instead of reading the property mid-transition.
   await page.waitForFunction(()=>
     getComputedStyle(document.querySelector('.sf-panel-top')).visibility==='hidden');
   assert.equal(await page.locator('.sf-panel-top').evaluate(e=>getComputedStyle(e).visibility),'hidden',
     'App header hidden during credential focus');
   await uid.fill('new@example.test');
   await page.waitForFunction(()=>document.querySelector('.woocommerce')?.classList.contains('sf-smart-new'));
   assert(await page.locator('#sf-smart-first').isVisible(),'New email opens first name');
   assert(await page.locator('#sf-smart-last').isVisible(),'New email opens last name');
   assert.equal(await page.locator('#reg_email').inputValue(),'new@example.test','Woo native registration email synchronized');
   assert.equal(await page.locator('#reg_username').inputValue(),'new@example.test','Woo native username is derived from email');
   assert.equal(await page.locator('#reg_username').isVisible(),false,'Registration never asks for a separate username');
   assert.equal(await page.locator('.sf-auth-google').isVisible(),false,'Google option is hidden during registration');
   assert.equal(await page.locator('.sf-quick-return').isVisible(),false,'Quick return is hidden during registration');
   assert.equal(await page.locator('.sf-smart-actions').isVisible(),false,'No change-email link in registration');
   assert.equal(await page.locator('.woocommerce-form-register button[type=submit]').isVisible(),true,'Register CTA is discoverable as soon as the new email is recognized');
   assert.equal(await page.locator('.woocommerce-form-register button[type=submit]').isDisabled(),true,'Register remains disabled until required details are complete');
   assert.equal(await page.locator('#reg_password').getAttribute('minlength'),'8','Registration password requirement is clear');
   assert.equal(await page.locator('.sf-smart-strength').isVisible(),true,'Password includes its own quality indicator');
   await page.locator('#reg_password').fill('test..');
   assert.equal(await page.locator('.sf-smart-strength-feedback').innerText(),'At least 8 characters','Short password explains why it is insufficient');
   assert.equal(await page.locator('.woocommerce-form-register button[type=submit]').isDisabled(),true,'Insufficient password cannot submit');
   await page.locator('#reg_password').fill('abcdefgh');
   assert.equal(await page.locator('.sf-smart-strength-feedback').innerText(),'Add a number or symbol','Weak single-category password explains remedy');
   await page.locator('#sf-smart-first').fill('Ada');
   await page.locator('#sf-smart-last').fill('Yılmaz');
   await page.locator('#reg_password').fill('StrongP4ss!Good');
   assert(await page.locator('.woocommerce-form-register button[type=submit]').isVisible(),'Register remains visible after required details');
   assert.equal(await page.locator('.woocommerce-form-register button[type=submit]').isEnabled(),true,'Completed form enables Register');
   assert.equal(await page.locator('.sf-smart-strength-feedback').innerText(),'Strong password','Password field confirms adequate strength without relying on button');
   assert.equal(await page.locator('.sf-smart-strength').getAttribute('data-level'),'3','Three strength bars activate for strong password');
   assert.equal(await page.locator('.woocommerce-form-register button[type=submit]').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(37, 38, 40)','Register darkens when ready');
   assert.equal(await page.locator('.sf-auth-google').isVisible(),false,'Google remains hidden after registration is ready');
   assert.equal(await page.locator('.sf-quick-return').isVisible(),false,'Quick login remains hidden after registration is ready');
   assert.equal(await page.locator('.sf-auth-register-cta').isVisible(),false,'Old separate registration action remains absent');
   assert.equal(await page.locator('.sf-auth-heading-text').innerText(),'Welcome','Welcome header remains on one unified page');
   await uid.fill('limited@example.test');
   await page.waitForFunction(()=>document.querySelector('.woocommerce')?.classList.contains('sf-smart-unavailable'));
   assert(await page.locator('.sf-smart-manual-register').isVisible(),'Throttled lookup has native fallback');
   assert.equal(await page.locator('.sf-smart-manual-register').innerText(),'Continue with email','Fallback is not a separate create-account CTA');
   await page.locator('.sf-smart-manual-register').click();
   assert(await page.locator('#sf-smart-first').isVisible(),'Fallback creates no separate registration page');
   await uid.fill('existing@example.test');
   await page.waitForFunction(()=>document.querySelector('.woocommerce')?.classList.contains('sf-smart-existing'));
   assert.equal(await page.locator('.sf-auth-google').isVisible(),false,'Google stays hidden on the sign-in password screen');
   assert.equal(await page.locator('.sf-quick-return').isVisible(),false,'Quick sign-in stays hidden on the sign-in password screen');
   assert.equal(await page.locator('.sf-smart-actions').isVisible(),false,'No empty action row on login');
   await uid.fill('username123');
   assert.equal(await page.locator('#password').isVisible(),false,'Username-like text cannot reach sign-in');
   assert.equal(await page.locator('.sf-smart-actions').isVisible(),false,'No username-based account creation action');
   const before=requests;
   await page.waitForTimeout(850);
   assert.equal(requests,before,'Username-like text is never probed');
   assert.equal(await page.locator('.sf-auth-google').isVisible(),true,'Secondary Google option returns when email is cleared or invalid');
   assert.equal(await page.locator('.sf-quick-return').isVisible(),true,'Quick sign-in returns when email is cleared or invalid');
   await page.close();
   console.log('Email-only staged login/registration, native Woo forms, focus and alternate-action hiding passed');
 }finally{
   await browser.close();
   await new Promise(done=>server.close(done));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
