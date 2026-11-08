const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const {execFileSync} = require('node:child_process');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const markup = execFileSync(process.env.PHP_BIN || 'php', ['tests/quick-login-markup.php'], {
  encoding:'utf8', env:{...process.env, CODELA_RENDER_ONLY:'1'}
});
const css = fs.readFileSync('theme/codela-storefront/assets/styles/quick-login.css', 'utf8');
const js = fs.readFileSync('theme/codela-storefront/assets/scripts/quick-login.js', 'utf8');
const pending = [];
let browserStatus = 'active';
let statusRequests = 0;
const fixture = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">'
  + '<style>body{font-family:system-ui;margin:0;background:#fafafa}.woocommerce{max-width:440px;margin:auto;}'
  + css + '</style></head><body><div class="woocommerce">'
  + '<div class="sf-account-intro">Ordinary Woo account intro</div>'
  + '<div id="customer_login"><input name="username" aria-label="Native Woo login"></div>'
  + markup + '</div>'
  + '<script>window.CodelaQuickLogin={rest:"/quick-login/",statusUrl:"/quick-status",account:"/account/",accountPage:true,strings:{}}</script>'
  + '<script src="/quick-login.js"></script></body></html>';

async function startServer() {
  const server = http.createServer((req,res)=>{
    const send=(status,body,type='application/json')=>{
      res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});
      res.end(body);
    };
    if(req.method==='GET' && req.url==='/') return send(200,fixture,'text/html; charset=utf-8');
    if(req.method==='GET' && req.url==='/switch-account') {
      return send(200,fixture.replace('accountPage:true,strings:{}',
        'accountPage:true,identity:{userId:999,displayName:"Other Customer"},strings:{}'),
        'text/html; charset=utf-8');
    }
    if(req.method==='POST' && req.url==='/quick-status') {
      let body='';
      req.on('data',c=>{body+=c});
      req.on('end',()=>{
        const values=new URLSearchParams(body);
        assert.equal(values.get('action'),'codela_sf_quick_status','Read-only device status action');
        assert.match(values.get('signature')||'',/^[A-Za-z0-9+/]+=*$/,'Proof-of-possession signature supplied');
        statusRequests++;
        send(200,JSON.stringify({authenticated:browserStatus==='signed-in',active:browserStatus!=='revoked'}));
      });
      return;
    }
    if(req.method==='GET' && req.url==='/quick-login.js') return send(200,js,'text/javascript; charset=utf-8');
    if(req.method==='GET' && req.url?.startsWith('/account/')) {
      // Simulate the old cached guest response for a plain same-URL redirect.
      const actual = new URL(req.url,'http://localhost');
      if (!actual.searchParams.has('sf_quick_auth')) {
        return send(200,'<h1>Cached guest login page</h1>','text/html');
      }
      return send(200,'<h1>WooCommerce account opened</h1>','text/html');
    }
    if(req.method==='POST' && req.url==='/quick-login/challenge') return send(200,JSON.stringify({challenge:'ab'.repeat(32)}));
    if(req.method==='POST' && req.url==='/quick-login/verify') {
      let body='';
      req.on('data',c=>{body+=c});
      req.on('end',()=>pending.push({res,body:JSON.parse(body)}));
      return;
    }
    send(404,JSON.stringify({message:'Not found'}));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {server,url:'http://127.0.0.1:'+server.address().port+'/'};
}
async function enrollFixture(page,url,visible=true) {
  await page.goto(url,{waitUntil:'load'});
  await page.evaluate(async()=>{
    const deviceId='a'.repeat(32), userId=17;
    const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
    const db=await new Promise((resolve,reject)=>{
      const request=indexedDB.open('codela_sf_quick_keys_v1',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('keys');
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
    });
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('keys','readwrite');
      tx.objectStore('keys').put(pair.privateKey,deviceId);
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
    });
    db.close();
    localStorage.setItem('codela_sf_quick_profile_v1',JSON.stringify({
      deviceId,userId,username:'demo',displayName:'Ayşe Yılmaz',email:'ayse@example.test'
    }));
  });
  await page.reload({waitUntil:'load'});
  if (visible) await page.locator('.sf-quick-login').waitFor({state:'visible'});

}
async function awaitRequest(page) {
  await page.waitForFunction(()=>document.querySelector('.sf-quick-pin-track')?.classList.contains('is-checking'));
  for(let i=0;i<30 && !pending.length;i++) await page.waitForTimeout(25);
  assert.equal(pending.length,1,'One verification request for six digits');
  assert.equal(pending[0].body.pin,'381905','Native input sends six digits to Woo REST');
  assert(pending[0].body.signature?.length>50,'Signature remains browser-key bound');
}
function release(ok) {
  const {res}=pending.shift();
  res.writeHead(ok?200:401,{'Content-Type':'application/json','Cache-Control':'no-store'});
  res.end(JSON.stringify(ok?{ok:true,account_url:'/account/'}:{message:'Hatalı kod. Yeniden deneyin.'}));
}
(async()=>{
  const {server,url}=await startServer();
  const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true});
  try {
    for(const outcome of ['success','failure']){
      browserStatus='active';
      const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
      const page=await context.newPage();
      await enrollFixture(page,url);
      assert.equal(await page.locator('.sf-quick-user').innerText(),'Ayşe Yılmaz','Full name, not remembered-account label');
      assert.equal(await page.locator('.sf-quick-email').innerText(),'ayse@example.test','Saved account includes email as a secondary line');
      assert(await page.locator('.sf-quick-email-login').isVisible(),'Email/password fallback is visible on first screen');
      assert(await page.locator('.sf-quick-or').isVisible(),'Reference divider is visible');
      assert.equal(await page.locator('.sf-quick-method--pin').getAttribute('aria-expanded'),'false','Account card starts collapsed');
      assert.equal(await page.locator('.sf-quick-inline-pin').getAttribute('aria-hidden'),'true','Inline PIN starts hidden');
      assert.equal(await page.locator('.sf-quick-slot').count(),6,'Six square PIN cells remain mounted in the card');
      assert.equal(await page.getByText('Welcome',{exact:false}).count(),1,
        'Reference welcome heading is present');
      assert.equal(await page.locator('.sf-quick-account-frame').evaluate(el=>getComputedStyle(el).backgroundColor),
        'rgb(255, 255, 255)','Inline PIN uses the white remembered card surface');
      assert.equal(await page.locator('.sf-quick-sheet').count(),0,'Old PIN bottom sheet no longer exists');
      await page.locator('.sf-quick-method--pin').click();
      await page.waitForFunction(()=>document.querySelector('.sf-quick-login')?.classList.contains('is-inline-open'));
      assert.equal(await page.locator('.sf-quick-method--pin').getAttribute('aria-expanded'),'true','Card expands with down-to-up chevron');
      assert.equal(await page.locator('.sf-quick-scrim').isVisible(),true,'Outside content is dimmed');
      assert(await page.evaluate(()=>document.activeElement===document.querySelector('.sf-quick-native-pin')),
        'Direct account tap focuses native numeric keypad input');
      assert.equal(await page.locator('.sf-quick-native-pin').getAttribute('inputmode'),'numeric');
      assert.equal(await page.locator('#customer_login').isVisible(),false,'Native Woo login hidden until selected');
      await page.locator('.sf-quick-native-pin').fill('381905');
      await page.locator('.sf-quick-pin-track.is-checking').waitFor({state:'attached'});
      await awaitRequest(page);
      assert.equal(await page.locator('.sf-quick-pin-track.is-verified').count(),0,
        'No approved check appears before server response');
      assert.equal(await page.locator('.sf-quick-pin-track.is-merging').count(),0,
        'Six boxes never converge before server verifies the PIN');
      release(outcome==='success');
      if(outcome==='success'){
        await page.locator('.sf-quick-pin-track.is-verified').waitFor({state:'attached'});
        // Assertion occurs within one DOM poll, before the 420ms redirect
        // removes the old document. A separate locator.evaluate() raced
        // against successful navigation and hung after the page was replaced.
        await page.waitForFunction(() => {
          const box = document.querySelector('.sf-quick-result');
          if (!box || !document.querySelector('.sf-quick-pin-track')?.classList.contains('is-verified')) return false;
          const style=getComputedStyle(box),a=box.getBoundingClientRect(),b=document.querySelector('.sf-quick-pin-track').getBoundingClientRect();
          return Number(style.opacity)>.9 && style.backgroundColor === 'rgb(22, 132, 79)'
            && Math.abs(a.left+a.width/2-b.left-b.width/2)<4;
        }, null, {timeout:4000});
        await page.waitForURL(url=>url.pathname==='/account/'&&url.searchParams.has('sf_quick_auth'),{timeout:10000});
        assert(await page.getByText('WooCommerce account opened').isVisible(),'Real account redirect follows verification');
      } else {
        await page.locator('.sf-quick-pin-track.is-error').waitFor({state:'attached'});
        await page.waitForFunction(()=>document.querySelector('.sf-quick-native-pin')?.value==='',{timeout:3500});
        assert.equal(await page.locator('.sf-quick-native-pin').inputValue(),'','Failed code clears after short red feedback');
        assert.equal(await page.locator('.sf-quick-slot.is-filled').count(),0,'No persisted PIN dots after error');
        assert.equal(await page.locator('.sf-quick-pin-track.is-verified').count(),0,'Error never shows success check');
        assert.equal(await page.locator('.sf-quick-status').evaluate(el=>getComputedStyle(el).color),
          'rgb(197, 54, 67)','Failed PIN visibly uses red feedback');
        await page.locator('.sf-quick-method--pin').click();
        assert.equal(await page.locator('.sf-quick-method--pin').getAttribute('aria-expanded'),'false','Up chevron closes inline PIN');
        assert.equal(await page.locator('.sf-quick-scrim').isVisible(),false,'Closing restores outside content');
        await page.locator('.sf-quick-email-login').click();
        assert(await page.locator('#customer_login').isVisible(),'Native Woo password login remains available');
      }
      console.log('Quick-login '+outcome+' browser animation '+(process.env.TEST_WEBKIT?'webkit':'chromium')+' passed');
      await context.close();
    }
    // Revoke in account A while localStorage/IndexedDB still remember it.
    browserStatus='revoked';
    {
      const context=await browser.newContext({viewport:{width:390,height:844}});
      const page=await context.newPage();
      const before=statusRequests;
      await enrollFixture(page,url,false);
      await page.waitForFunction(()=>localStorage.getItem('codela_sf_quick_profile_v1') === null);
      assert(statusRequests>before,'Server-side status was consulted before rendering remembered account');
      assert.equal(await page.locator('.sf-quick-login').isVisible(),false,'Revoked device must never appear as recognized');
      assert.equal(await page.locator('#customer_login').isVisible(),true,'Original password form is available');
      assert.equal(await page.evaluate(()=>localStorage.getItem('codela_sf_quick_profile_v1')),null,'Revoked profile cleared locally');
      await context.close();
    }
    // Signing in to Woo/Google B must preserve A's browser key. This is an
    // account switch, NOT a revocation; a fresh guest screen can offer A again.
    browserStatus='active';
    {
      const context=await browser.newContext({viewport:{width:390,height:844}});
      const page=await context.newPage();
      await enrollFixture(page,url);
      await page.goto(url+'switch-account',{waitUntil:'load'});
      assert.equal(await page.evaluate(()=>
        window.CodelaSFRemembered.pins().some(item=>item.userId===17)),true,
        'A remains saved after signing into another WooCommerce user');
      assert.equal(await page.locator('.sf-quick-login').isVisible(),false,
        'Signed-in pages do not display guest account switching UI');
      await page.goto(url,{waitUntil:'load'});
      await page.locator('.sf-quick-login').waitFor({state:'visible'});
      assert.equal(await page.locator('.sf-quick-user').first().innerText(),'Ayşe Yılmaz',
        'A is selectable again after signing out of B');
      await context.close();
    }

    // Two different customers remain visible, each with a separate browser
    // ECDSA key. Six digits verify ONLY the chosen card, without keyboard Done.
    {
      const context=await browser.newContext({viewport:{width:390,height:844}});
      const page=await context.newPage();
      await enrollFixture(page,url);
      await page.evaluate(async()=>{
        const deviceId='b'.repeat(32);
        const pair=await crypto.subtle.generateKey(
          {name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']
        );
        const db=await new Promise((resolve,reject)=>{
          const req=indexedDB.open('codela_sf_quick_keys_v1',1);
          req.onsuccess=()=>resolve(req.result);
          req.onerror=()=>reject(req.error);
        });
        await new Promise((resolve,reject)=>{
          const tx=db.transaction('keys','readwrite');
          tx.objectStore('keys').put(pair.privateKey,deviceId);
          tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
        });
        db.close();
        localStorage.setItem('codela_sf_quick_profiles_v2',JSON.stringify([
          {deviceId:'a'.repeat(32),userId:17,displayName:'Ayşe Yılmaz',email:'ayse@example.test'},
          {deviceId,userId:28,displayName:'Mehmet Demir',email:'mehmet@example.test'}
        ]));
        localStorage.removeItem('codela_sf_quick_profile_v1');
      });
      await page.reload({waitUntil:'load'});
      await page.waitForFunction(()=>document.querySelectorAll('.sf-quick-login:not([hidden])').length===2);
      assert.equal(await page.locator('.sf-quick-account-frame').count(),2,'Two account cards are available');
      assert.equal(await page.locator('.sf-quick-choice-intro').count(),1,'One shared welcome heading');
      assert.equal(await page.locator('.sf-quick-choice-alternatives').count(),1,'One shared native-login fallback');
      assert.deepEqual(await page.locator('.sf-quick-user').allInnerTexts(),['Ayşe Yılmaz','Mehmet Demir']);
      await page.locator('.sf-quick-method--pin').nth(1).click();
      await page.locator('.sf-quick-native-pin').nth(1).fill('381905');
      await page.waitForFunction(()=>document.querySelectorAll('.sf-quick-pin-track.is-checking').length===1);
      assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('sf-quick-native-pin')),
        false,'PIN keyboard loses focus when the sixth digit arrives automatically');
      for(let i=0;i<30&&!pending.length;i++)await page.waitForTimeout(25);
      assert.equal(pending.length,1,'Only one PIN verification request is sent');
      assert.equal(pending[0].body.user_id,28,'PIN belongs to selected account B, not A');
      release(false);
      await page.locator('.sf-quick-pin-track.is-error').waitFor({state:'attached'});
      assert.equal(await page.evaluate(()=>window.CodelaSFRemembered.pins().length),2,
        'An unsuccessful login does not remove the other account');
      await context.close();
    }
    // When a guest document is restored from a stale cache with an active
    // server session, it navigates back to an uncached account document.
    browserStatus='signed-in';
    {
      const context=await browser.newContext({viewport:{width:390,height:844}});
      const page=await context.newPage();
      await enrollFixture(page,url,false);
      await page.waitForURL(url=>url.pathname==='/account/' && url.searchParams.has('sf_quick_auth'),{timeout:10000});
      assert(await page.getByText('WooCommerce account opened').isVisible(),'Stale guest HTML cannot override authenticated session');
      await context.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
