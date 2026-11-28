/* Late opening + delayed CSS + async verified device status never flashes Woo. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const php=fs.readFileSync('theme/codela-storefront/inc/quick-login.php','utf8');
const match=php.match(/<style id="sf-auth-gate-critical">([\s\S]*?)<\/style>/);
assert(match,'Critical first-paint guest gate present in wp_head');
const loader=fs.readFileSync('theme/codela-storefront/assets/scripts/auth-loader.js','utf8');
const smartCss=fs.readFileSync('theme/codela-storefront/assets/styles/auth-smart.css','utf8');
const auth=fs.readFileSync('theme/codela-storefront/assets/scripts/auth.js','utf8');
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'
 +'<script>document.documentElement.classList.add("sf-auth-js")</script><style>'+match[1]+'</style>'
 +'<style>body{font:16px system-ui}#sf-account{min-height:400px}#customer_login{display:block}</style></head>'
 +'<body><button id="open">Account</button><div class="sf-shell has-editorial-account"><div id="sf-panel" class="is-account-panel"><h2 id="sf-panel-title">My account</h2><section id="sf-account" hidden>'
 +'<template data-sf-auth-template><div class="woocommerce sf-overlay-auth"><div class="sf-smart-auth">Email stage</div>'
 +'<div id="customer_login">CLASSIC WOO FORM</div><div class="sf-quick-login" hidden>PIN</div><div data-sf-site-kit-late class="sf-site-kit-button"><div class="sf-site-kit-target"></div></div></div></template></section></div></div>'
 +'<script data-siwg-config="{}">window.googleRenders=0;window.google={accounts:{id:{renderButton:(el,opts)=>{window.googleRenders++;const b=document.createElement("button");b.type="button";b.textContent="Google";b.onclick=()=>window.googleClicked=true;el.append(b);}}}};</script>'
 +'<script>window.CodelaSFAuthLoader={styles:["/auth.css"],scripts:["/auth.js","/smart.js","/quick.js"],'
 +'account:"/myaccount/",loading:"Checking sign-in…"};'
 +'document.querySelector("#open").addEventListener("click",()=>{'
 +'document.querySelector("#sf-account").hidden=false;'
 +'document.querySelector("#sf-account").dispatchEvent(new Event("codela:account-open"))'
 +'});</script><script src="/auth-loader.js"></script></body></html>';
const server=http.createServer((req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
 if(req.url==='/auth-loader.js'){res.setHeader('Content-Type','text/javascript');res.end(loader);return;}
 if(req.url==='/auth.js'){res.setHeader('Content-Type','text/javascript');res.end(auth);return;}
 if(req.url==='/auth.css'){
  setTimeout(()=>{res.setHeader('Content-Type','text/css');res.end(smartCss)},420);return;
 }
 if(req.url==='/smart.js'){
  res.setHeader('Content-Type','text/javascript');
  res.end('window.codelaSFSmartAuthReady=Promise.resolve(true);document.querySelector(".sf-overlay-auth").classList.add("sf-smart-auth-active","sf-smart-start");');
  return;
 }
 if(req.url==='/quick.js'){
  res.setHeader('Content-Type','text/javascript');
  res.end('window.codelaSFQuickLoginReady=new Promise(resolve=>{window.finishDeviceVerification=()=>resolve(true)});');
  return;
 }
 res.statusCode=404;res.end();
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.waitForTimeout(11000);
  assert.equal(await page.evaluate(()=>window.googleRenders),0,'Inert Account does not render Google on Home');
  await page.click('#open');
  await page.evaluate(()=>{
   window.flash=false;
   window.checkFrames=()=>{
    if(document.querySelector('#customer_login')?.getClientRects().length>0)window.flash=true;
    if(!document.querySelector('#sf-account').dataset.sfAuthReady)requestAnimationFrame(window.checkFrames);
   };
   requestAnimationFrame(window.checkFrames);
  });
  assert.equal(await page.locator('#customer_login').isVisible(),false,'No classic form at dialog opening');
  assert.equal(await page.locator('#sf-panel-title').evaluate(e=>getComputedStyle(e).clipPath),'inset(50%)','Title is clipped before lazy styles');
  assert.equal(await page.locator('.sf-auth-loader-status').evaluate(e=>getComputedStyle(e).alignItems),'center','Critical centered loading status');
  assert.equal(await page.locator('.sf-auth-loader-status').evaluate(e=>getComputedStyle(e,'::before').height),'1px','Agency amber line before account CSS');
  assert.equal(await page.locator('#sf-account').getAttribute('aria-busy'),'true');
  await page.waitForFunction(()=>!!window.finishDeviceVerification);
  await page.waitForTimeout(1100);
  assert.equal(await page.locator('#customer_login').isVisible(),false,'Pending status must never reveal Woo');
  assert.equal(await page.locator('#sf-account').getAttribute('data-sf-auth-ready'),null,'Files alone do not mark Account ready');
  assert.equal(await page.evaluate(()=>window.googleRenders),0,'Google waits for final remembered-device layout');
  await page.evaluate(()=>window.finishDeviceVerification());
  await page.waitForFunction(()=>document.querySelector('#sf-account').dataset.sfAuthReady==='true');
  assert.equal(await page.evaluate(()=>window.flash),false,'No Woo flash across frames');
  assert.equal(await page.locator('#customer_login').isVisible(),false,
    'Only smart email is visible after both controllers are ready');
  assert.equal(await page.locator('.sf-auth-loader-status').count(),0,'Loader removed only after verification');
  assert.equal(await page.locator('#sf-account').getAttribute('aria-busy'),null);
  await page.locator('[data-sf-site-kit-late] button').click();
  assert.equal(await page.evaluate(()=>window.googleClicked),true,'Late-loaded Google button is directly interactive');
  assert.equal(await page.evaluate(()=>window.googleRenders),1,'No duplicate initialization or render');
  assert.equal(new URL(page.url()).pathname,'/','Google does not navigate to full Account');
  console.log('Account: 11s late, delayed CSS, pending device proof: no flash, direct Google widget.');
  await page.close();
 }finally{await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(e=>{console.error(e);process.exitCode=1});
