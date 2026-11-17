/**
 * Browser integration of real Glisse 0.5.0 with the native Codela shell.
 * React is injected as wp.element; Glisse may not create a second runtime.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {build}=require('esbuild');
const {chromium,webkit}=require('playwright');
const read=p=>fs.readFileSync(p,'utf8');
const root='theme/codela-storefront/assets/';
const css=['styles/tokens.css','storefront.css','styles/overlay.css','styles/navigation.css','styles/components.css','styles/glisse-bridge.css'].map(p=>read(root+p)).join('\n');
const icon='<svg class="sf-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor"/></svg>';
const links=['home','search','cart','account'].map((v,i)=>'<a data-dock-view="'+v+'" class="sf-dock-item'+(i===0?' is-active':'')+'" href="#'+v+'" '+(i===0?'aria-current="page"':'')+(i>0?' data-panel="'+v+'" aria-expanded="false"':'')+'>'+icon+'<span>'+v+'</span></a>').join('');
const html='<div class="sf-shell has-mobile-dock"><header class="sf-header">'+
 '<div class="sf-brand sf-ui-surface"><a href="/">Codela</a></div>'+
 '<nav class="sf-actions sf-ui-surface"><button id="head-control" class="sf-ui-icon-button sf-ui-icon-button--soft" aria-label="Open">'+icon+'</button></nav>'+
 '</header><nav class="sf-mobile-dock has-selection" style="--sf-dock-index:0" aria-label="Mobile navigation">'+
 '<div class="sf-dock-surface">'+links+'</div><button class="sf-dock-handle" type="button" tabindex="-1"></button></nav>'+
 '</div><main id="sf-content"><button id="soft-control" class="sf-ui-icon-button sf-ui-icon-button--soft" aria-label="Secondary">'+icon+'</button></main>';
(async()=>{
 const boot=await build({stdin:{contents:"import * as React from 'react'; import {createRoot} from 'react-dom/client'; window.wp={element:{...React,createRoot}};",resolveDir:process.cwd(),sourcefile:'glisse-fixture.jsx'},bundle:true,write:false,format:'iife',platform:'browser',target:['es2022'],define:{'process.env.NODE_ENV':'"production"'}});
 const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:800},hasTouch:true});
  page.on('pageerror',error=>{throw error;});
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body>'+html+'</body></html>');
  await page.addScriptTag({content:boot.outputFiles[0].text});
  await page.evaluate(()=>{
    window.nativeClicks={home:0,search:0,cart:0,account:0};
    document.querySelectorAll('.sf-dock-item').forEach(a=>a.addEventListener('click',e=>{
      const name=a.dataset.dockView;window.nativeClicks[name]++;
      e.preventDefault();
      const dock=a.closest('.sf-mobile-dock');
      dock.querySelectorAll('.sf-dock-item').forEach(x=>{
        const active=x===a;
        x.classList.toggle('is-active',active);
        if(active)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');
      });
    }));
  });
  await page.addScriptTag({content:read(root+'scripts/glisse-bridge.js')});
  await page.waitForSelector('.sf-shell.sf-glisse-light .sf-mobile-dock .sf-dock-item');
  assert.equal(await page.locator('.sf-mobile-dock .sf-dock-item').count(),4,'Four native tabs remain visible');
  assert.equal(await page.locator('.sf-mobile-dock .sf-glisse-tabbar').count(),0,'No fragile Glisse replacement mounted');
  const nativeStyle=await page.evaluate(()=>{
    const dock=document.querySelector('.sf-mobile-dock');
    const surface=dock.querySelector('.sf-dock-surface');
    const rect=surface.getBoundingClientRect();
    const style=getComputedStyle(surface);
    return {width:rect.width,height:rect.height,visibility:style.visibility,pointerEvents:style.pointerEvents};
  });
  assert(nativeStyle.width>200 && nativeStyle.height>40 &&
    nativeStyle.visibility==='visible' && nativeStyle.pointerEvents!=='none',
    'Native dock remains usable: '+JSON.stringify(nativeStyle));
  await page.locator('.sf-dock-item').nth(1).click();
  await page.waitForFunction(()=>document.querySelector('.sf-dock-item[data-dock-view="search"]').classList.contains('is-active'));
  const counter=await page.evaluate(()=>window.nativeClicks);
  assert.equal(counter.search,1,'Native Search action runs exactly once');
  assert.equal(counter.home,0);
  assert(await page.locator('.sf-glisse-glass-plate').count()>=2,'Header islands use real Glisse Glass');
  await page.waitForSelector('.sf-glisse-button-host#soft-control');
  assert(await page.locator('.sf-glisse-paint-button').count()>=1,'Real Glisse Button paints general soft control');
  await page.evaluate(()=>{
    const host=document.querySelector('#soft-control');
    const box=host.getBoundingClientRect();
    host.dispatchEvent(new PointerEvent('pointerdown',{
      bubbles:true,pointerId:987,pointerType:'touch',isPrimary:true,button:0,buttons:1,
      clientX:box.left+box.width/2,clientY:box.top+box.height/2
    }));
  });
  await page.waitForFunction(()=>document.querySelector('.sf-glisse-paint-button')?.hasAttribute('data-pressed'));
  await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointerup',{pointerId:987,pointerType:'touch',isPrimary:true,button:0})));
  await page.waitForFunction(()=>!document.querySelector('.sf-glisse-paint-button')?.hasAttribute('data-pressed'));
  const nativeHidden=await page.locator('.sf-dock-item').first().getAttribute('aria-hidden');
  assert.equal(nativeHidden,null,'Original native anchor stays accessible');
  assert.equal(await page.locator('.sf-dock-item').first().getAttribute('tabindex'),null,
    'Native tabs retain keyboard focus');
  await page.setViewportSize({width:320,height:750});
  await page.waitForFunction(()=>{
    const surface=document.querySelector('.sf-dock-surface');
    const rect=surface?.getBoundingClientRect();
    return !!rect && rect.width>=200 && rect.height>40 && getComputedStyle(surface).visibility==='visible';
  });
  // Reparent the movable header menu control into an open native dialog:
  // do not create more React button/Glass instances during the animation.
  const beforePanel=await page.locator('.sf-glisse-button-mount').count();
  await page.evaluate(()=>{
    const shell=document.querySelector('.sf-shell');
    const menu=document.createElement('button');
    menu.id='menu-control';
    menu.className='sf-menu-trigger sf-ui-icon-button sf-ui-icon-button--soft';
    menu.textContent='Menu';
    shell.querySelector('.sf-header').append(menu);
    const dialog=document.createElement('dialog');
    dialog.id='sf-panel';
    dialog.innerHTML='<button class="sf-ui-icon-button sf-ui-icon-button--soft">Close</button>';
    shell.append(dialog);
    dialog.showModal();
    dialog.append(menu);
  });
  await page.waitForTimeout(140);
  assert.equal(await page.locator('#sf-panel .sf-glisse-button-mount').count(),0,
    'Modal opening does not allocate expensive Glisse Button surfaces');
  assert.equal(await page.locator('.sf-glisse-button-mount').count(),beforePanel,
    'Opening the menu does not add decorative React layers');
  await page.evaluate(()=>{
    const dialog=document.querySelector('#sf-panel');
    const menu=dialog.querySelector('#menu-control');
    dialog.close();
    document.querySelector('.sf-header').append(menu);
    dialog.remove();
  });
  assert.equal(await page.locator('.sf-dock-item').count(),4,
    'All four native tabs survive dialog open/close');
  assert.equal(await page.locator('.sf-mobile-dock .sf-glisse-tabbar').count(),0,
    'Dialog transitions cannot hide native tabs behind a stale Glisse root');
  await page.setViewportSize({width:1280,height:800});
  await page.locator('#head-control').click();
  assert(await page.locator('.sf-glisse-glass-plate').count()>=2,'Glisse visual layers do not swallow native button input');
  assert.equal(await page.locator('#head-control').count(),1,'Original header control still exists');
  await page.close();

  // Legacy Glisse URL and session flag are deliberately inert: old browser
  // tabs cannot accidentally revive a second mobile navigation system.
  const retired=await browser.newPage({viewport:{width:402,height:666},hasTouch:true});
  await retired.route('https://codela.test/**',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body>'+html+'</body></html>'
  }));
  await retired.goto('https://codela.test/?codela_glisse_dock=1');
  await retired.evaluate(()=>sessionStorage.setItem('codela-glisse-dock-pilot','1'));
  await retired.addScriptTag({content:boot.outputFiles[0].text});
  await retired.addScriptTag({content:read(root+'scripts/glisse-bridge.js')});
  await retired.waitForSelector('.sf-mobile-dock .sf-dock-item');
  assert.equal(await retired.locator('.sf-mobile-dock .sf-glisse-dock-root').count(),0,
    'Legacy test flag must not mount a decorative React navigation');
  assert.equal(await retired.locator('.sf-mobile-dock .lg-tab-bar').count(),0,
    'Glisse TabBar is completely retired');
  assert.equal(await retired.locator('.sf-mobile-dock .sf-dock-item').count(),4,
    'The original four native Codela links remain');
  const state=await retired.locator('.sf-dock-surface').evaluate(el=>{
    const paint=getComputedStyle(el);
    const bounds=el.getBoundingClientRect();
    return {display:paint.display,visibility:paint.visibility,opacity:paint.opacity,
      pointerEvents:paint.pointerEvents,width:bounds.width,height:bounds.height,
      anchors:[...el.querySelectorAll('.sf-dock-item')].map(a=>a.getBoundingClientRect().width)};
  });
  assert(state.display==='grid' && state.visibility==='visible' && state.opacity==='1' &&
    state.pointerEvents==='auto' && state.width>200 && state.height>40 &&
    state.anchors.length===4 && state.anchors.every(w=>w>=45),
    'Codela dock geometry and hit targets unchanged by legacy Glisse flag: '+JSON.stringify(state));
  await retired.close();
  console.log('Glisse shell browser integration passed on '+(process.env.TEST_WEBKIT?'WebKit':'Chromium'));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
