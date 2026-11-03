// The real core router is tested post-deploy. This checks controller ownership,
// immediate feedback, navigation guards and the visual placeholder in an isolated browser.
// Destination main/brand replacement and popstate are supplied at the core boundary.
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
let script=fs.readFileSync('theme/codela-storefront/assets/scripts/navigation-controller.js','utf8')
 .replace(/^import .*;\s*$/gm,'')
 .replace("import('@wordpress/interactivity-router')","Promise.resolve({actions:{navigate:window.__routeNavigate}})");
const documentScript=fs.readFileSync('theme/codela-storefront/assets/scripts/navigation-feedback.js','utf8')+fs.readFileSync('theme/codela-storefront/assets/scripts/document-continuity.js','utf8');
const css=['tokens','navigation-feedback'].map(name=>fs.readFileSync('theme/codela-storefront/assets/styles/'+name+'.css','utf8')).join('\n');
const brand=title=>'<div class="sf-brand sf-context-brand" data-wp-router-region="codela/storefront/brand">'+(title==='Home'?'<a href="https://store.test/">CODELA</a>':'<a data-sf-context-back data-sf-context-root data-sf-page-title="'+title+'" hidden href="https://store.test/" aria-label="Back"><svg aria-hidden="true"></svg></a><span class="sf-context-label">'+title+'</span>')+'</div>';
const main=(type='home')=>'<main id="sf-content" class="sf-content" data-wp-router-region="codela/storefront/main" data-sf-route-type="'+type+'"><h1>Example</h1><p>Page content</p></main>';
(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  const html = '<!doctype html><html><head><title>Home</title><style>'+css+'</style></head><body>'+
   '<header id="persistent-header">'+brand('Home')+'</header><div class="sf-shell has-mobile-dock">'+
   '<a id="to-content" data-sf-route="content" href="https://store.test/about/">About</a>'+
   '<a id="to-checkout" href="https://store.test/checkout/">Checkout</a>'+
   '<nav class="sf-mobile-dock has-selection"><a class="sf-dock-item" data-dock-view="home" aria-current="page" data-sf-route="home" href="https://store.test/">Home</a></nav></div>'+
   main()+'<script>'+`
    window.__routeState={url:location.href};window.__watchers=[];
    window.store=()=>({state:window.__routeState});window.watch=fn=>{window.__watchers.push(fn);fn()};
    window.__duration=350;window.__routeCalls=0;
    const routeDocuments=${JSON.stringify(Object.fromEntries([['/','Home'],['/about/','About'],['/details/','Details'],['/new-home/','New home']].map(([path,title])=>[path,{title,main:main(path==='/'?'home':'page'),brand:brand(title)}])))};
    window.__commitFixtureRoute=url=>{
      const destination=routeDocuments[new URL(url).pathname]||routeDocuments['/details/'];
      document.querySelector('#sf-content').outerHTML=destination.main;
      document.querySelector('[data-wp-router-region="codela/storefront/brand"]').outerHTML=destination.brand;
      document.title=destination.title;window.__routeState.url=url;window.__watchers.forEach(fn=>fn());
    };
    window.__routeNavigate=url=>{
      window.__lastRoute=new Promise(resolve=>{
        window.__routeCalls++;window.__watchers.forEach(fn=>fn());setTimeout(()=>{
          history.pushState({},'',url);window.__commitFixtureRoute(url);resolve();
        },window.__duration);
      });
      return window.__lastRoute;
    };
    window.addEventListener('popstate',()=>window.__commitFixtureRoute(location.href));
   `+'</script></body></html>';
  await page.route('https://store.test/**',route=>route.fulfill({status:200,contentType:'text/html',body:html}));
  await page.goto('https://store.test/');
  await page.addScriptTag({content:documentScript});
  await page.addScriptTag({content:script});
  await page.locator('#persistent-header').evaluate(el=>{el.dataset.original='yes'});
  const immediate=await page.evaluate(()=>{document.querySelector('#to-content').click();return {count:document.querySelectorAll('.sf-skeleton').length,busy:document.querySelector('main').getAttribute('aria-busy'),native:document.querySelectorAll('.sf-skeleton[data-owner="document"]').length};});
  assert.deepEqual(immediate,{count:1,busy:'true',native:0},'Exactly one skeleton is present in the click task');
  assert.equal(await page.locator('.sf-skeleton').count(),1,'Skeleton visible immediately in main');
  assert.equal(await page.locator('.sf-skeleton-lines i').first().evaluate(el=>getComputedStyle(el).animationName),'sf-skeleton-pulse','Core router shares loading motion');
  assert.equal(await page.locator('#persistent-header').getAttribute('data-original'),'yes','Header stays in DOM');
  assert.equal(await page.locator('.sf-mobile-dock').count(),1,'One dock retained during navigation');
  await page.waitForFunction(()=>window.__routeState.url==='https://store.test/about/'&&!document.querySelector('.sf-skeleton'));
  assert.equal(await page.locator('.sf-skeleton').count(),0,'Skeleton removed after new page');
  assert.equal(await page.locator('.sf-dock-item').getAttribute('aria-current'),null,'Home no longer active after page');
  assert.equal(await page.locator('main').getAttribute('tabindex'),'-1','New main focusable');
  assert.equal(await page.locator('main').evaluate(el=>document.activeElement===el),true,'Focus moves to new content');
  assert.equal(await page.locator('[data-sf-context-back]').getAttribute('href'),'https://store.test/','First route knows the previous home address');
  assert.equal(await page.locator('[data-sf-context-back]').getAttribute('aria-label'),'Back','Return control has an accessible action name');
  assert.equal((await page.locator('[data-sf-context-back]').innerText()).trim(),'','Current return control is icon-only');
  assert.equal(await page.locator('.sf-context-label').isVisible(),false,'Content route shows the return icon instead of the root title');
  // Cached responses replace feedback immediately without a minimum dwell time.
  const quick=await page.evaluate(async()=>{
    window.__duration=30;const before=window.__routeCalls;document.querySelector('.sf-dock-item').click();
    await Promise.resolve();await Promise.resolve();
    if(window.__routeCalls!==before+1)throw new Error('Expected one new core navigation');
    await window.__lastRoute;await new Promise(requestAnimationFrame);
    return {url:window.__routeState.url,skeletons:document.querySelectorAll('.sf-skeleton').length};
  });
  assert.deepEqual(quick,{url:'https://store.test/',skeletons:0},'Ready cached content is visible on the next frame without an artificial dwell');
  assert.equal(await page.locator('.sf-skeleton').count(),0,'Quick navigation removes placeholder without a minimum delay');
  assert.equal(await page.locator('.sf-dock-item').getAttribute('aria-current'),'page','Home active again');
  // Since 0.1.188, menu/dock roots use their destination title/logo rather than
  // inventing a previous-page back link. The core router also replaces brand.
  assert.equal(await page.locator('[data-sf-context-back]').count(),0,'Dock Home route restores its real logo rather than an About return control');
  assert.equal(await page.locator('.sf-brand').innerText(),'CODELA','Destination Home brand is installed');
  assert.equal(await page.locator('#persistent-header').getAttribute('data-original'),'yes','Header owner remains the same while brand region changes');
  // Keep meaningful same-document return coverage using actual content routes.
  await page.locator('#to-content').click();
  await page.waitForFunction(()=>window.__routeState.url==='https://store.test/about/'&&!document.querySelector('.sf-skeleton'));
  await page.evaluate(()=>{const link=document.createElement('a');link.id='to-details';link.dataset.sfRoute='content';link.href='https://store.test/details/';link.textContent='Details';document.querySelector('main').append(link);});
  await page.locator('#to-details').click();
  await page.waitForFunction(()=>window.__routeState.url==='https://store.test/details/'&&!document.querySelector('.sf-skeleton'));
  assert.equal(await page.locator('[data-sf-context-back]').getAttribute('href'),'https://store.test/about/','Content-to-content return keeps its actual previous address');
  assert(await page.locator('[data-sf-context-back]').isVisible(),'Content return icon is usable');
  assert.equal((await page.locator('[data-sf-context-back]').innerText()).trim(),'','Content return is icon-only, not an obsolete previous-page text label');
  // Real browser history changes the URL. The fixture supplies only the core
  // popstate region/state update, leaving scroll/focus ownership to the browser.
  await page.evaluate(()=>{
    window.__historyScrollCalls=0;window.__historyFocusCalls=0;
    window.__originalScroll=window.scrollTo;window.__originalFocus=HTMLElement.prototype.focus;
    window.scrollTo=()=>{window.__historyScrollCalls++};
    HTMLElement.prototype.focus=function(...args){window.__historyFocusCalls++;return window.__originalFocus.apply(this,args);};
  });
  await page.goBack();
  await page.waitForFunction(()=>location.href==='https://store.test/about/'&&window.__routeState.url===location.href);
  const historyCalls=await page.evaluate(()=>{
    window.scrollTo=window.__originalScroll;HTMLElement.prototype.focus=window.__originalFocus;
    return {scroll:window.__historyScrollCalls,focus:window.__historyFocusCalls};
  });
  assert.deepEqual(historyCalls,{scroll:0,focus:0},'History traversal retains browser/core scroll and focus ownership');
  assert.equal(await page.locator('.sf-dock-item').getAttribute('aria-current'),null,'History updates dock selection');
  assert.equal(await page.locator('.sf-skeleton').count(),0,'History state change creates no click-owned feedback');
  // An old router promise must not clear or focus a newer navigation.
  await page.evaluate(async()=>{
   window.__originalNavigate=window.__routeNavigate;window.__pendingRoutes=[];
   window.__routeNavigate=url=>new Promise(resolve=>window.__pendingRoutes.push({url,resolve}));
   document.querySelector('#to-content').href='https://store.test/details/';
   document.querySelector('#to-content').click();await Promise.resolve();await Promise.resolve();
   const a=document.createElement('a');a.dataset.sfRoute='home';a.href='https://store.test/new-home/';document.body.append(a);a.click();
  });
  await page.waitForFunction(()=>window.__pendingRoutes.length===2);
  await page.evaluate(()=>window.__pendingRoutes[0].resolve());
  await page.waitForTimeout(30);
  assert.equal(await page.locator('.sf-skeleton').count(),1,'Older router completion leaves current skeleton mounted');
  await page.evaluate(()=>window.__pendingRoutes[1].resolve());
  await page.waitForFunction(()=>!document.querySelector('.sf-skeleton'));
  await page.evaluate(()=>{window.__routeNavigate=window.__originalNavigate});
  const footerChecks = await page.evaluate(require('./navigation-feedback-footer.cjs'));
  assert.equal(footerChecks.length, 15, 'Footer lifecycle and exact restoration checks');
  // Shared lifecycle owns ARIA, inert, shell and stale-completion cleanup.
  const lifecycle=await page.evaluate(()=>{
   const f=window.codelaSFFeedback,main=document.querySelector('main'),dock=document.querySelector('.sf-mobile-dock');
   main.setAttribute('aria-busy','false');main.firstElementChild.inert=true;
   const snapshot=()=>JSON.stringify([dock,...dock.querySelectorAll('*')].map(el=>[...el.attributes].filter(a=>a.name!=='style'||a.value.trim()).map(a=>[a.name,a.value]).sort()));
   const before=snapshot(),link=document.querySelector('#to-content');
   const a=f.begin({url:link.href,link,owner:'router'});
   const first=document.querySelector('.sf-skeleton').innerHTML;
   const b=f.begin({url:link.href,link,owner:'document'});
   const same=first===document.querySelector('.sf-skeleton').innerHTML;
   const stale=f.end(a),kept=f.active(b)&&document.querySelectorAll('.sf-skeleton').length===1;
   f.end(b);
   const restored=snapshot()===before&&main.getAttribute('aria-busy')==='false'&&main.firstElementChild.inert;
   main.firstElementChild.inert=false;main.removeAttribute('aria-busy');
   // Timeout restores state without relying on a network completion.
   const timer=window.setTimeout;let expire;
   window.setTimeout=(callback,ms)=>ms===10000?(expire=callback,0):timer(callback,ms);
   f.begin({url:link.href,link});window.setTimeout=timer;expire();
   const timeout=!document.querySelector('.sf-skeleton')&&!main.hasAttribute('aria-busy')&&!dock.inert;
   f.begin({url:link.href,link});window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
   return {same,stale,kept,restored,timeout,bfcache:!document.querySelector('.sf-skeleton')&&!dock.inert};
  });
  assert.deepEqual(lifecycle,{same:true,stale:false,kept:true,restored:true,timeout:true,bfcache:true});
  // Native checkout and modified-clicks are not intercepted.
  const before=await page.evaluate(()=>window.__routeCalls||0);
  await page.locator('#to-content').click({modifiers:['Control']});
  await page.waitForTimeout(50);
  assert.equal(await page.evaluate(()=>window.__routeCalls||0),before,'Modified navigation not hijacked');
  assert.equal(await page.locator('#to-checkout').getAttribute('data-sf-route'),null,'Checkout left to browser');
  await page.evaluate(()=>{
   window.__routeNavigate=()=>Promise.reject(new Error('Router unavailable'));
   window.addEventListener('pageswap',()=>sessionStorage.setItem('fallback-pending',String(document.querySelectorAll('.sf-skeleton').length)));
   document.querySelector('#to-content').href='https://store.test/fallback/';document.querySelector('#to-content').click();
  });
  await page.waitForURL('**/fallback/');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('fallback-pending')),'1','Fallback keeps feedback until the real document replaces it');
  console.log('Shell navigation: persistent header/dock, destination brand, content return, real history ownership, immediate skeleton, stale completion, focus and native fallback passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

