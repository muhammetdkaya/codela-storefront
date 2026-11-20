const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const assets=path.join(root,'theme/codela-storefront/assets');
function render(profile,dock){
 return execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{
  cwd:root,encoding:'utf8',env:{...process.env,FIXTURE_EXPERIENCE:profile,FIXTURE_DOCK:dock?'1':'0'}
 }).replaceAll('https://store.test','https://nav.test');
}
for(const profile of ['commerce','agency']){
 for(const dock of [false,true]){
  const html=render(profile,dock),agency=profile==='agency';
  const actions=html.match(/<nav class="sf-actions[^]*?<\/nav>/)?.[0]||'';
  assert.equal(html.includes('has-agency-profile'),agency);
  if(agency){
   assert(!actions.includes('data-panel="search"'));
   assert(!actions.includes('data-panel="cart"'));
   assert(!html.includes('data-panel="search"'));
   assert(!html.includes('data-panel="cart"'));
   assert(!html.includes('data-dock-view="search"'));
   assert(!html.includes('data-dock-view="cart"'));
   assert(!html.includes('class="sf-menu-tools'));
   assert(html.includes('sf-account-link'));
   assert(html.includes('sf-agency-header-tools'),'Agency uses unified native tools capsule');
   assert(html.includes('sf-agency-brand-link'),'Agency exposes a linked Codela wordmark');
   assert(html.includes('/assets/icons/codela-brand-mark.svg'),'Agency uses transparent C amblem');
   assert(!html.includes('class="sf-agency-header-wordmark"'),'Agency does not overlay old logo text');
   if(dock){
    assert(html.includes('data-dock-view="services"'));
    assert(html.includes('data-dock-view="contact"'));
   }else assert(!html.includes('sf-mobile-dock'));
  }else{
   assert(actions.includes('data-panel="search"'));
   assert(actions.includes('data-panel="cart"'));
   if(dock){
    assert(html.includes('data-dock-view="search"'));
    assert(html.includes('data-dock-view="cart"'));
   }
  }
 }
}
const css=['styles/tokens.css','storefront.css','styles/components.css',
 'styles/navigation.css','styles/overlay.css','styles/glass-v2.css']
 .map(p=>fs.readFileSync(path.join(assets,p),'utf8')).join('\n');
const moduleInit=[
 'im'+'port {createOverlayController} from "/assets/scripts/overlay-controller.js";',
 'im'+'port {createDockController} from "/assets/scripts/dock-controller.js";',
 'const $=s=>document.querySelector(s);',
 'let overlay;',
 'const dock=createDockController({getDialog:()=>$("#sf-panel"),getCurrent:()=>overlay?.getCurrent(),open:(...args)=>overlay.open(...args),close:()=>overlay.close()});',
 'overlay=createOverlayController({$,config:()=>({account:"https://nav.test/myaccount/"}),t:k=>k,',
 'searchFeature:{start(){},cancel(){}},cartFeature:{isPageActive:()=>false,getData:()=>({items:[]}),refresh(){}},',
 'mountDock:dock.mountDock,restoreDock:dock.restoreDock,setDockCollapsed:dock.setDockCollapsed,',
 'markDockActive:dock.markDockActive,mobileDock:dock.mobileDock,dockScrollPositions:dock.dockScrollPositions,onMenuOpen(){}});',
 'overlay.bind($("#sf-panel"));dock.init($("#sf-panel"));',
 'document.querySelector(".sf-header-menu .sf-menu-trigger").addEventListener("click",e=>overlay.toggleMenu(e));',
 'document.querySelectorAll(".sf-account-link,.sf-dock-item[data-dock-view=account]").forEach(el=>el.addEventListener("click",e=>overlay.open("account",e)));',
 'document.querySelector(".sf-panel-top .sf-close").addEventListener("click",()=>overlay.close());',
 'window.overlay=overlay;window.testReady=true;'
].join('\n');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||undefined});
 try{
  for(const dock of [false,true])for(const width of [390,1280]){
   const header=render('agency',dock);
   const page=await browser.newPage({viewport:{width,height:844}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://nav.test/**',route=>{
    const url=new URL(route.request().url());
    if(url.pathname.endsWith('/assets/icons/codela-brand-mark.svg')){
     return route.fulfill({contentType:'image/svg+xml',
      body:fs.readFileSync(path.join(assets,'icons','codela-brand-mark.svg'),'utf8')});
    }
    if(url.pathname.startsWith('/assets/scripts/')){
     return route.fulfill({contentType:'application/javascript',
      body:fs.readFileSync(path.join(assets,'scripts',path.basename(url.pathname)))});
    }
    return route.fulfill({contentType:'text/html; charset=utf-8',body:
     '<!doctype html><html lang="tr"><head><meta charset="utf-8">'
      +'<meta name="viewport" content="width=device-width,initial-scale=1">'
      +'<style>'+css+'</style><script type="importmap">'+JSON.stringify({imports:{
       'codela-storefront/panel-motion':'/assets/scripts/panel-motion.js'
      }})+'</script></head><body class="home">'+header
      +'<main style="min-height:1400px;background:#09090c;color:white">Agency</main>'
      +'<script type="module">'+moduleInit+'</script></body></html>'});
   });
   await page.goto('https://nav.test/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.testReady);
   const headerLayout=await page.evaluate(()=>{
    const rect=sel=>document.querySelector(sel).getBoundingClientRect();
    const a=rect('.sf-agency-brand-link'),g=rect('.sf-agency-header-tools');
    const account=rect('.sf-agency-header-tools .sf-account-link');
    const menu=rect('.sf-agency-header-tools .sf-menu-trigger');
    return {brandEnd:a.right,toolsStart:g.left,toolsHeight:g.height,
      accountSize:account.width,menuSize:menu.width,
      divider:rect('.sf-agency-header-divider').width,
      overflow:document.documentElement.scrollWidth-window.innerWidth,
      imgLoaded:document.querySelector('.sf-agency-brand-mark').complete};
   });
   assert(headerLayout.brandEnd<=headerLayout.toolsStart,'No overlap between brand and tools: '+JSON.stringify(headerLayout));
   assert(Math.abs(headerLayout.toolsHeight-50)<=2,'Combined glass capsule has approved 50px height');
   assert(headerLayout.accountSize>=44&&headerLayout.menuSize>=44,'Both actions keep 44px touch targets');
   assert(headerLayout.divider>=1&&headerLayout.divider<=2,'Subtle divider is one physical CSS pixel');
   assert(headerLayout.overflow<=1,'No mobile/desktop horizontal overflow');
   await page.locator('.sf-header-menu .sf-menu-trigger').click();
   const menu=await page.evaluate(()=>{
    const dialog=document.querySelector('#sf-panel');
    return {open:dialog.open,bg:getComputedStyle(dialog).backgroundColor,
     moved:!!document.querySelector('#sf-panel > .sf-menu-trigger'),
     closeVisible:getComputedStyle(document.querySelector('#sf-panel .sf-panel-top .sf-close')).display!=='none'};
   });
   assert.deepEqual(menu,{open:true,bg:'rgb(9, 9, 12)',moved:false,closeVisible:true},
    'Agency Menu retains dark surface and separate close: '+JSON.stringify(menu));
   await page.locator('#sf-panel.is-menu-panel .sf-panel-top .sf-close').click();
   assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false);
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('sf-overlay-scroll-locked')),false);
   if(width<701){
    const account=page.locator('.sf-agency-header-tools .sf-account-link');
    await account.click();
    assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),true);
    const x=page.locator('#sf-panel.is-account-panel .sf-panel-top .sf-close');
    assert(await x.isVisible(),'Agency Account close control must be visible');
    await x.click();
    assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false);
    // A panel transition must never turn the Agency X into a Back button.
    await page.evaluate(()=>{window.overlay.open('account');window.overlay.open('menu');});
    assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),true);
    await page.locator('#sf-panel.is-menu-panel .sf-panel-top .sf-close').click();
    assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false,
      'Agency Close must dismiss the whole overlay, not reopen Account');
   }
   assert.deepEqual(errors,[],'No browser errors');
   console.log('Agency menu/account dismissal passed',width,'dock',dock);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
