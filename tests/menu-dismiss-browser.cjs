const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const theme='theme/codela-storefront/assets/';
const engine=process.env.TEST_WEBKIT?'webkit':'chromium';
const header=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{encoding:'utf8'}).replaceAll('https://store.test','https://menu.test');
const css=['styles/tokens.css','storefront.css','styles/components.css','styles/navigation.css','styles/overlay.css','styles/glisse-bridge.css'].map(x=>fs.readFileSync(theme+x,'utf8')).join('\n');
const setup=`
import {createOverlayController} from '/assets/scripts/overlay-controller.js';
import {createDockController} from '/assets/scripts/dock-controller.js';
const $=s=>document.querySelector(s);
let overlay;
const dock=createDockController({
 getDialog:()=>$('#sf-panel'),getCurrent:()=>overlay?.getCurrent(),
 open:(...args)=>overlay.open(...args),close:()=>overlay.close()
});
overlay=createOverlayController({
 $,config:()=>({account:'https://menu.test/myaccount/'}),t:k=>k,
 searchFeature:{start(){},cancel(){}},
 cartFeature:{isPageActive:()=>false,getData:()=>({items:[]}),refresh(){}},
 mountDock:dock.mountDock,restoreDock:dock.restoreDock,
 setDockCollapsed:dock.setDockCollapsed,markDockActive:dock.markDockActive,
 mobileDock:dock.mobileDock,dockScrollPositions:dock.dockScrollPositions,onMenuOpen(){}
});
overlay.bind($('#sf-panel'));dock.init($('#sf-panel'));
window.overlay=overlay;window.testReady=true;`;
(async()=>{
 const browser=await({chromium,webkit}[engine]).launch(),errors=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://menu.test/**',route=>{
   const pathname=new URL(route.request().url()).pathname;
   if(pathname.startsWith('/assets/scripts/'))return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(theme+'scripts/'+pathname.split('/').at(-1))});
   return route.fulfill({contentType:'text/html; charset=utf-8',body:
    '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<style>'+css+'</style><script type="importmap">'+JSON.stringify({imports:{'codela-storefront/panel-motion':'/assets/scripts/panel-motion.js'}})+'</script></head><body>'+
    header+'<main id="test-main" style="min-height:2400px;background:#fafafa;padding:24px"><h1>Ürünler</h1><p>Current page</p></main>'+
    '<script type="module">'+setup+'</script></body></html>'});
  });
  await page.goto('https://menu.test/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.testReady);
  await page.evaluate(()=>scrollTo(0,340));
  for(let i=0;i<5;i++){
   const state=await page.evaluate(()=>{
    const dialog=document.querySelector('#sf-panel'),dock=document.querySelector('.sf-mobile-dock');
    overlay.open('menu');
    if(!dialog.open)throw Error('Menu failed to open');
    const relocated=dock.parentElement===dialog;
    const hidden=dock.hidden;
    const start=performance.now();overlay.close();const elapsed=performance.now()-start;
    return {relocated,hidden,open:dialog.open,locked:document.documentElement.classList.contains('sf-overlay-scroll-locked'),
      position:document.body.style.position,collapsed:dock.classList.contains('is-collapsed'),
      dockVisible:getComputedStyle(dock.querySelector('.sf-dock-surface')).visibility,
      animations:document.querySelector('#sf-menu').getAnimations().length,elapsed};
   });
   assert.equal(state.relocated,false,'Menu does not move dock into the top layer');
   assert.equal(state.hidden,true,'Full-screen Menu hides native dock while not reparenting it');
   assert.equal(state.open,false,'Menu top layer closes in the same click task');
   assert.equal(state.locked,false,'No white frame from deferred scroll unlock');
   assert.notEqual(state.position,'fixed','Document body restored synchronously');
   assert.equal(state.dockVisible,'visible','Original four-tab dock is still visible');
   assert.equal(state.animations,0,'Menu has no opacity-out animation holding white dialog');
   assert(state.elapsed<150,'No long synchronous dismissal: '+JSON.stringify(state));
   await page.evaluate(()=>new Promise(requestAnimationFrame));
   assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false,'No blank dialog a frame later');
  }
  const search=await page.evaluate(()=>{
    overlay.open('search');const dialog=document.querySelector('#sf-panel'),dock=document.querySelector('.sf-mobile-dock');
    const mounted=dock.parentElement===dialog;overlay.close();
    return {mounted,closed:!dialog.open,restored:dock.parentElement!==dialog};
  });
  assert.deepEqual(search,{mounted:true,closed:true,restored:true},'Search retains modal dock relocation');
  const swapped=await page.evaluate(()=>{
    overlay.open('menu');
    const dialog=document.querySelector('#sf-panel'),dock=document.querySelector('.sf-mobile-dock');
    const menuOutside=dock.parentElement!==dialog && dock.hidden;
    overlay.open('search');
    const searchInside=dock.parentElement===dialog && !dock.hidden;
    overlay.close();
    return {menuOutside,searchInside,closed:!dialog.open,restored:dock.parentElement!==dialog};
  });
  assert.deepEqual(swapped,{menuOutside:true,searchInside:true,closed:true,restored:true},
    'Switching Menu to Search restores live dock into the dialog top layer');
  // Static-body diagnostic mode preserves a real modal without replacing
  // the existing body scroll-lock strategy for normal traffic.
  const staticBody=await page.evaluate(()=>{
    window.codelaSFDebug={skipBodyFix:()=>true,mark(){},postAction(){},preparePanel(){},isGuestFormIsolated:()=>false};
    const before=window.scrollY,oldPosition=document.body.style.position;
    overlay.open('menu');
    const locked=document.documentElement.classList.contains('sf-overlay-scroll-locked');
    const modal=document.querySelector('#sf-panel').matches(':modal');
    const duringPosition=document.body.style.position;
    overlay.close();
    const after=window.scrollY,afterPosition=document.body.style.position;
    delete window.codelaSFDebug;
    return {before,after,oldPosition,duringPosition,afterPosition,locked,modal,
      unlocked:!document.documentElement.classList.contains('sf-overlay-scroll-locked')};
  });
  assert(staticBody.before>=300,'Fixture starts away from page top');
  assert.equal(staticBody.duringPosition,staticBody.oldPosition,'Diagnostic never fixes body');
  assert.equal(staticBody.afterPosition,staticBody.oldPosition,'Closing leaves body untouched');
  assert.equal(staticBody.after,staticBody.before,'No scroll restoration is needed');
  assert(staticBody.locked&&staticBody.unlocked&&staticBody.modal,'Original modal and CSS lock lifecycle remain intact');
  assert.deepEqual(errors,[]);
  console.log('Menu dismissal and native dock stability passed ('+engine+')');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
