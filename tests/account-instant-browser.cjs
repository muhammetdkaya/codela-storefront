// Real auth.js + browser integration: instant dialog, fresh Woo form nonces,
// native registration switching and active-session redirects. No Woo mock login.
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const auth=fs.readFileSync('theme/codela-storefront/assets/scripts/auth.js','utf8');
let authenticated=false, formRequests=0;
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
 +'<body><section id="sf-account"><div class="woocommerce sf-overlay-auth" data-auth-state-url="/state">'
 +'<header class="sf-account-intro"><div class="sf-auth-tabs" hidden data-register-prompt="New here?" data-login-prompt="Already registered?">'
 +'<button data-auth-tab="login">Log in</button><button data-auth-tab="register">Register</button></div></header>'
 +'<div id="customer_login"><div class="u-column1"><form class="woocommerce-form woocommerce-form-login" action="/myaccount/" method="post">'
 +'<input type="hidden" name="woocommerce-login-nonce" value="expired-public-cache"><input name="username">'
 +'<button type="submit">Log in</button></form></div>'
 +'<div class="u-column2"><form class="woocommerce-form woocommerce-form-register" action="/myaccount/" method="post">'
 +'<input type="hidden" name="woocommerce-register-nonce" value="expired-public-cache"><input name="email">'
 +'<button type="submit">Register</button></form></div></div></div></section>'
 +'<script src="/auth.js"></script></body></html>';
async function setup(){
 const server=http.createServer((req,res)=>{
  const send=(code,body,type='application/json')=>{
   res.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);
  };
  if(req.method==='GET' && req.url==='/')return send(200,html,'text/html');
  if(req.method==='GET' && req.url==='/auth.js')return send(200,auth,'text/javascript');
  if(req.method==='GET' && req.url?.startsWith('/myaccount/'))return send(200,'<h1>Authenticated account</h1>','text/html');
  if(req.method==='POST' && req.url==='/state'){
    let data='';req.on('data',c=>data+=c);
    req.on('end',async()=>{
     assert.equal(new URLSearchParams(data).get('action'),'codela_sf_account_form_state');
     formRequests++;
     await new Promise(resolve=>setTimeout(resolve,180));
     send(200,JSON.stringify({authenticated,login_nonce:'new-login',register_nonce:'new-register',registration:true}));
    });return;
  }
  send(404,JSON.stringify({error:true}));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {server,url:'http://127.0.0.1:'+server.address().port+'/'};
}
(async()=>{
 const {server,url}=await setup();
 const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true});
 try {
  const page=await browser.newPage();
  await page.goto(url);
  await page.waitForFunction(()=>document.querySelector('#customer_login')?.classList.contains('sf-auth-ready'));
  await page.evaluate(()=>{window.initialDocMarker='keep';document.querySelector('#sf-account').dispatchEvent(new Event('codela:account-open'));});
  assert.equal(await page.locator('.sf-overlay-auth').getAttribute('aria-busy'),'true','Dialog opens without waiting on the network');
  assert.equal(await page.locator('.woocommerce-form-login button[type="submit"]').isDisabled(),true,'Old cached form nonce cannot submit during refresh');
  await page.waitForFunction(()=>document.querySelector('[name="woocommerce-login-nonce"]')?.value==='new-login');
  assert.equal(await page.locator('[name="woocommerce-register-nonce"]').inputValue(),'new-register','Both Woo nonces are refreshed');
  assert.equal(await page.locator('.woocommerce-form-login button[type="submit"]').isEnabled(),true);
  assert.equal(await page.evaluate(()=>window.initialDocMarker),'keep','Opening Account preserves current document');
  await page.evaluate(()=>document.querySelector('#customer_login').dispatchEvent(new CustomEvent('codela:auth-select',{detail:{view:'register'}})));
  assert.equal(await page.locator('.u-column1').isVisible(),false,'Native login tab hidden after switch');
  assert.equal(await page.locator('.u-column2').isVisible(),true,'Native Woo registration tab selected in same panel');
  assert.equal(formRequests,1,'One background request per Account opening');
  await page.close();
  authenticated=true;
  const second=await browser.newPage();
  await second.goto(url);
  await second.waitForFunction(()=>document.querySelector('#customer_login')?.classList.contains('sf-auth-ready'));
  await second.evaluate(()=>document.querySelector('#sf-account').dispatchEvent(new Event('codela:account-open')));
  await second.waitForURL(u=>u.pathname==='/myaccount/' && u.searchParams.has('sf_quick_auth'));
  assert(await second.getByText('Authenticated account').isVisible(),'Stale guest dialog cannot replace an active server session');
  console.log('Instant Woo Account + fresh nonce + native registration + session check passed');
 } finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(err=>{console.error(err);process.exitCode=1});
