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
  // Count genuine Glisse TabBar React commits; cosmetic native dock changes
  // must not tear down/reset Glisse's in-flight spring animation.
  await page.evaluate(()=>{
    const original=window.wp.element.createRoot;
    window.__glisseDockRenders=0;
    window.wp.element.createRoot=(node)=>{
      const root=original(node);
      if(node.classList.contains('sf-glisse-dock-root')){
        const render=root.render.bind(root);
        root.render=content=>{window.__glisseDockRenders++;render(content);};
      }
      return root;
    };
  });
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
  await page.waitForSelector('.sf-mobile-dock.sf-glisse-ready .sf-glisse-tabbar.lg-tab-bar');
  assert.equal(await page.locator('.sf-mobile-dock .lg-tab').count(),4,'Real Glisse generates four tabs');
  const dims=await page.evaluate(()=>{
    const dock=document.querySelector('.sf-mobile-dock'),tabs=[...document.querySelectorAll('.sf-glisse-tabbar .lg-tab')];
    return {dock:dock.clientWidth,tabWidth:tabs[0].getBoundingClientRect().width,lastRight:tabs[3].getBoundingClientRect().right,barRight:document.querySelector('.sf-glisse-tabbar').getBoundingClientRect().right};
  });
  assert(Math.abs(dims.tabWidth-(dims.dock-8)/4)<=2,'All four Glisse tabs share actual dock width: '+JSON.stringify(dims));
  assert(Math.abs(dims.lastRight-(dims.barRight-4))<=3,'Fourth tab reaches the right inset');
  await page.locator('.sf-glisse-tabbar .lg-tab').nth(1).click();
  await page.waitForFunction(()=>document.querySelector('.sf-dock-item[data-dock-view="search"]').classList.contains('is-active'));
  await page.waitForTimeout(80);
  const renders=await page.evaluate(()=>window.__glisseDockRenders);
  for(let k=0;k<8;k++){
    await page.evaluate(()=>{
      const dock=document.querySelector('.sf-mobile-dock');
      dock.classList.toggle('is-pressing');
      dock.querySelector('.sf-dock-item').classList.toggle('is-pressed');
    });
    await page.waitForTimeout(32);
  }
  await page.waitForTimeout(80);
  const nextRenders=await page.evaluate(()=>window.__glisseDockRenders);
  assert.equal(nextRenders,renders,'Cosmetic dock motion never rerenders real Glisse TabBar');
  const counter=await page.evaluate(()=>window.nativeClicks);
  assert.equal(counter.search,1,'Glisse forwards exactly one activation to native Search');
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
  assert.equal(nativeHidden,'true','Native anchor remains available as event owner but not duplicate tab stop');
  await page.setViewportSize({width:320,height:750});
  await page.waitForFunction(()=>{
    const bar=document.querySelector('.sf-glisse-tabbar');
    const tab=bar?.querySelectorAll('.lg-tab')[3];
    return !!tab && Math.abs(tab.getBoundingClientRect().right-(bar.getBoundingClientRect().right-4))<3;
  },null,{timeout:4000});
  const gap=await page.evaluate(()=>{const bar=document.querySelector('.sf-glisse-tabbar'),tabs=bar.querySelectorAll('.lg-tab');return Math.abs(tabs[3].getBoundingClientRect().right-(bar.getBoundingClientRect().right-4));});
  assert(gap<3,'Dock slots remain aligned after resize: gap '+gap);
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
  await page.setViewportSize({width:1280,height:800});
  await page.locator('#head-control').click();
  assert(await page.locator('.sf-glisse-glass-plate').count()>=2,'Glisse visual layers do not swallow native button input');
  assert.equal(await page.locator('#head-control').count(),1,'Original header control still exists');
  await page.close();
  console.log('Glisse shell browser integration passed on '+(process.env.TEST_WEBKIT?'WebKit':'Chromium'));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
