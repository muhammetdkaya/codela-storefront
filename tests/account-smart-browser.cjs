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
data-auth-smart-label="Email or username" data-auth-smart-first="First name"
data-auth-smart-last="Last name" data-auth-smart-checking="Checking account…"
data-auth-smart-error="Check unavailable" data-auth-smart-closed="Registration closed"
data-auth-smart-change="Change email" data-auth-smart-register="Create account"
data-auth-smart-password-link="Password link emailed"
data-auth-smart-title="Welcome" data-auth-smart-description="Continue securely with your account.">
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
<p class="form-row"><label for="reg_email">Email</label>
<input id="reg_email" name="email" type="email"></p>
<p class="form-row"><label for="reg_password">Create password</label>
<input id="reg_password" name="password" type="password"></p>
<p class="form-row"><button type="submit" name="register" value="Register">Register</button></p>
<input name="woocommerce-register-nonce" type="hidden" value="old"></form></div></div>
<a class="sf-auth-register-cta" href="#sf-auth-register">Register with email</a>
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
   // iOS/WebKit honors the intentional initial-autofocus guard more
   // strictly than Chromium. A real tap releases it before typing.
   await uid.click();
   await uid.fill('existing@example.test');
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
   assert.equal(await page.locator('.woocommerce-form-register button[type=submit]').isVisible(),false,'Register hidden before details');
   await page.locator('#sf-smart-first').fill('Ada');
   await page.locator('#sf-smart-last').fill('Yılmaz');
   await page.locator('#reg_password').fill('StrongP4ss!Good');
   assert(await page.locator('.woocommerce-form-register button[type=submit]').isVisible(),'Register appears after required details');
   assert.equal(await page.locator('.sf-auth-google').isVisible(),true,'Google remains available in same screen');
   assert.equal(await page.locator('.sf-auth-register-cta').isVisible(),false,'Old separate registration action remains absent');
   assert.equal(await page.locator('.sf-auth-heading-text').innerText(),'Welcome','Welcome header remains on one unified page');
   await uid.fill('limited@example.test');
   await page.waitForFunction(()=>document.querySelector('.woocommerce')?.classList.contains('sf-smart-unavailable'));
   assert(await page.locator('.sf-smart-manual-register').isVisible(),'Throttled lookup has native fallback');
   await page.locator('.sf-smart-manual-register').click();
   assert(await page.locator('#sf-smart-first').isVisible(),'Fallback creates no separate registration page');
   await uid.fill('existing@example.test');
   await page.waitForFunction(()=>document.querySelector('.woocommerce')?.classList.contains('sf-smart-existing'));
   await uid.fill('username123');
   assert(await page.locator('#password').isVisible(),'Username login works without username enumeration');
   const before=requests;
   await uid.fill('username456');
   await page.waitForTimeout(850);
   assert.equal(requests,before,'Username typing never probes username existence');
   await page.close();
   console.log('Smart account staged UI, native Woo forms, focus mode and privacy fallback passed');
 }finally{
   await browser.close();
   await new Promise(done=>server.close(done));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
