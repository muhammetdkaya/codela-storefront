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
   assert(actions.includes('sf-agency-account-icon'),'Agency header uses new optical account glyph');
   assert(html.includes('sf-agency-header-tools'),'Agency uses unified native tools capsule');
   assert(!html.includes('sf-agency-header-divider'),'Agency controls have no vertical separators');
   assert(html.includes('sf-agency-brand-link'),'Agency exposes a linked Codela wordmark');
   assert(html.includes('/assets/icons/codela-brand-mark.svg'),'Agency uses transparent C amblem');
   assert(!html.includes('class="sf-agency-header-wordmark"'),'Agency does not overlay old logo text');
   if(dock){
    assert(html.includes('data-dock-view="services"'));
    assert(html.includes('data-dock-view="contact"'));
   }else assert(!html.includes('sf-mobile-dock'));
  }else{
   assert(actions.includes('data-panel="search"'));
   assert(!actions.includes('sf-agency-account-icon'),'Commerce retains its account glyph');
   assert(actions.includes('data-panel="cart"'));
   if(dock){
    assert(html.includes('data-dock-view="search"'));
    assert(html.includes('data-dock-view="cart"'));
   }
  }
 }
}
const contactHeader=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{
 cwd:root,encoding:'utf8',env:{...process.env,FIXTURE_EXPERIENCE:'agency',FIXTURE_DOCK:'0',FIXTURE_PUBLIC_CONTACT:'1'}
});
assert(contactHeader.includes('M5.8 3.5 8 3.2'),'Agency direct-call header uses refined telephone glyph');
assert(contactHeader.includes('data-contact-placement="header"'),'Header preserves native direct-call contract');
const material=fs.readFileSync(path.join(assets,'styles/agency-glass.css'),'utf8');
assert(material.includes('rgba(255,255,255,0.13) 0%,rgba(255,255,255,0.10) 32%'),'Quiet navigation rim');
assert(material.includes('rgba(255,255,255,0.17) 0%,rgba(255,255,255,0.13) 32%'),'Quiet primary action rim');
const css=['styles/tokens.css','storefront.css','styles/components.css',
 'styles/navigation.css','styles/overlay.css','styles/glass-v2.css','styles/agency-auth.css']
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
   const header=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{cwd:root,encoding:'utf8',env:{...process.env,FIXTURE_EXPERIENCE:'agency',FIXTURE_DOCK:dock?'1':'0',FIXTURE_PUBLIC_CONTACT:'1'}});
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
      divider:document.querySelectorAll('.sf-agency-header-divider').length,
      overflow:document.documentElement.scrollWidth-window.innerWidth,
      imgLoaded:document.querySelector('.sf-agency-brand-mark').complete};
   });
   assert(headerLayout.brandEnd<=headerLayout.toolsStart,'No overlap between brand and tools: '+JSON.stringify(headerLayout));
   assert(Math.abs(headerLayout.toolsHeight-44)<=2,'Combined glass capsule has compact 44px height');
   const brandGeometry=await page.evaluate(()=>{
    const shell=document.querySelector('.sf-brand'),mark=document.querySelector('.sf-agency-brand-mark');
    const name=document.querySelector('.sf-agency-brand-name');
    return {height:shell.getBoundingClientRect().height,width:shell.getBoundingClientRect().width,
       image:mark.getBoundingClientRect().width,labelOpacity:getComputedStyle(name).opacity};
   });
   assert(Math.abs(brandGeometry.height-44)<=2,'Logo and tools have equal 44px height');
   assert(Math.abs(brandGeometry.width-44)<=2,'Initial logo is emblem only');
   assert(brandGeometry.image>=27,'Original C emblem remains visible');
   assert(headerLayout.accountSize>=44&&headerLayout.menuSize>=44,'Both actions keep 44px touch targets');
   assert.equal(headerLayout.divider,0,'Agency tools have no divider elements');
   const glyph=await page.locator('.sf-agency-header-tools .sf-menu-mark').evaluate(el=>Array.from(el.children,s=>({width:s.getBoundingClientRect().width,height:s.getBoundingClientRect().height})));
   assert(Math.abs(glyph[0].width-18)<.3&&Math.abs(glyph[1].width-14)<.3&&glyph.every(g=>g.height<=2),'Menu strokes have balanced visible widths');
   const optical=await page.evaluate(()=>{
    const group=document.querySelector('.sf-agency-header-tools');
    return [...group.querySelectorAll('.sf-agency-account-icon,.sf-agency-phone .sf-contact-icon,.sf-menu-mark')].map(el=>{
     const r=el.getBoundingClientRect(),hit=el.closest('a,button').getBoundingClientRect();
     return {width:r.width,height:r.height,hitWidth:hit.width,hitHeight:hit.height,
      dx:Math.abs((r.left+r.right-hit.left-hit.right)/2),
      dy:Math.abs((r.top+r.bottom-hit.top-hit.bottom)/2),
      visible:el instanceof SVGElement?el.getBBox().width:null};
    });
   });
   assert.equal(optical.length,3,'Configured phone, account, menu all measured');
   assert(optical.every(g=>Math.abs(g.width-24)<.3&&Math.abs(g.height-24)<.3&&g.hitWidth>=44&&g.hitHeight>=44&&g.dx<1&&g.dy<1),'Shared icon grid, centered hit areas: '+JSON.stringify(optical));
   assert(optical.filter(g=>g.visible!==null).every(g=>g.visible>=16&&g.visible<=20),'SVG visible geometry stays balanced');
   assert(headerLayout.overflow<=1,'No mobile/desktop horizontal overflow');
   if(width>=701){
    await page.locator('.sf-agency-brand-link').hover();
    await page.waitForFunction(()=>document.querySelector('.sf-brand').getBoundingClientRect().width>=125);
    const expanded=await page.locator('.sf-brand').evaluate(el=>el.getBoundingClientRect().width);
    assert(expanded>=125,'Desktop hover reveals Codela wordmark without losing capsule');
    await page.locator('.sf-agency-header-tools .sf-menu-trigger').hover();
   }
   await page.locator('.sf-header-menu .sf-menu-trigger').click();
   const menu=await page.evaluate(()=>{
    const dialog=document.querySelector('#sf-panel');
    return {open:dialog.open,bg:getComputedStyle(dialog).backgroundColor,
     moved:!!document.querySelector('#sf-panel > .sf-menu-trigger'),
     closeVisible:getComputedStyle(document.querySelector('#sf-panel .sf-panel-top .sf-close')).display!=='none'};
   });
   assert(menu.open && !menu.moved && menu.closeVisible,'Agency native dark Menu remains dismissible: '+JSON.stringify(menu));
   const location=await page.evaluate(()=>{
    const a=document.querySelector('#sf-panel .sf-panel-top .sf-close').getBoundingClientRect();
    const b=document.querySelector('.sf-agency-header-tools .sf-menu-trigger').getBoundingClientRect();
    return {dx:Math.abs((a.left+a.width/2)-(b.left+b.width/2)),
            dy:Math.abs((a.top+a.height/2)-(b.top+b.height/2)),
            bg:getComputedStyle(document.querySelector('#sf-panel')).backgroundColor};
   });
   assert(location.dx<=2&&location.dy<=2,'Menu X must occupy original right slot: '+JSON.stringify(location));
   await page.locator('#sf-panel.is-menu-panel .sf-panel-top .sf-close').click();
   assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false);
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('sf-overlay-scroll-locked')),false);
   if(width<701){
    const account=page.locator('.sf-agency-header-tools .sf-account-link');
    await account.click();
    assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),true);
    const skin=await page.evaluate(()=>{
     const d=document.querySelector('#sf-panel.is-account-panel');
     const input=d.querySelector('#sf-account input[type=email]');
     return {color:getComputedStyle(d).color,
       image:getComputedStyle(d).backgroundImage,
       input:input?getComputedStyle(input).backgroundColor:null};
    });
    assert.equal(skin.color,'rgb(245, 244, 247)','Agency Account popup has dark-template light text');
    assert(skin.image.includes('radial-gradient'),'Agency Account popup shares dark studio background');
    assert.equal(skin.input,'rgb(32, 32, 39)','Account form input uses dark graphite');
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
