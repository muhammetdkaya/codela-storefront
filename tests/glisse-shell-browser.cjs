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
  const counter=await page.evaluate(()=>window.nativeClicks);
  assert.equal(counter.search,1,'Glisse forwards exactly one activation to native Search');
  assert.equal(counter.home,0);
  assert(await page.locator('.sf-glisse-glass-plate').count()>=2,'Header and common soft controls use real Glisse Glass');
  const nativeHidden=await page.locator('.sf-dock-item').first().getAttribute('aria-hidden');
  assert.equal(nativeHidden,'true','Native anchor remains available as event owner but not duplicate tab stop');
  await page.setViewportSize({width:320,height:750});
  await page.waitForTimeout(120);
  const gap=await page.evaluate(()=>{const bar=document.querySelector('.sf-glisse-tabbar'),tabs=bar.querySelectorAll('.lg-tab');return Math.abs(tabs[3].getBoundingClientRect().right-(bar.getBoundingClientRect().right-4));});
  assert(gap<3,'Dock slots remain aligned after resize');
  await page.locator('#head-control').click();
  assert(await page.locator('.sf-glisse-glass-plate').count()>=2,'Glisse visual layers do not swallow native button input');
  await page.close();
  console.log('Glisse shell browser integration passed on '+(process.env.TEST_WEBKIT?'WebKit':'Chromium'));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
