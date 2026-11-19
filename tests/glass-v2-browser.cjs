'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const root='theme/codela-storefront/assets/';
const base=fs.readFileSync(root+'styles/storefront-base.css','utf8');
const v2=fs.readFileSync(root+'styles/glass-v2.css','utf8');
const testHtml=(enabled,agency)=>`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${base}\n${v2}</style></head>
<body class="${enabled?'sf-glass-v2 ':''}home" style="margin:0;background:${agency?'#09090c':'#f8f7f4'}">
<div class="sf-shell"><header class="sf-header">
<div class="sf-brand sf-ui-surface"><a href="/">CODELA</a></div>
<nav class="sf-desktop-navigation sf-ui-surface"><ul class="sf-desktop-menu"><li><a href="#">Hizmetler</a></li></ul></nav>
<nav class="sf-header-menu"><button class="sf-ui-icon-button sf-ui-icon-button--soft" aria-label="Menu"><span class="sf-menu-mark"><span></span><span></span></span></button></nav>
</header><main>${agency?'<section class="sf-agency-widget sf-agency-widget--studio"></section>':''}</main></div>
<dialog id="sf-panel" class="sf-panel is-menu-panel"><button class="sf-ui-icon-button sf-ui-icon-button--soft sf-menu-trigger is-in-panel">Menu</button></dialog>
</body></html>`;
async function scenario(browser,width,enabled,agency) {
 const page=await browser.newPage({viewport:{width,height:850}});
 await page.setContent(testHtml(enabled,agency));
 const s=await page.evaluate(()=>{
  const brand=getComputedStyle(document.querySelector('.sf-brand'));
  const menu=getComputedStyle(document.querySelector('.sf-header-menu .sf-ui-icon-button'));
  const nav=getComputedStyle(document.querySelector('.sf-desktop-navigation'));
  const label=getComputedStyle(document.querySelector('.sf-brand a'));
  return {background:brand.backgroundColor,brandInk:label.color,blur:brand.backdropFilter,
          border:brand.borderColor,menuBg:menu.backgroundColor,navBg:nav.backgroundColor};
 });
 await page.close();return s;
}
(async()=>{
 for(const [name,driver] of [['chromium',chromium],['webkit',webkit]]) {
  const browser=await driver.launch({headless:true});
  try{
   for(const width of [390,1280]){
    const legacy=await scenario(browser,width,false,true);
    const dark=await scenario(browser,width,true,true);
    const light=await scenario(browser,width,true,false);
    const alpha=s=>{
      const parts=s.background.match(/rgba?\(([^)]*)\)/)?.[1].split(',');
      return parts && parts.length===4 ? Number(parts[3].trim()) : 1;
    };
    assert(alpha(dark)<.7,`${name} ${width}: dark V2 must be translucent`);
    assert(alpha(light)<.7,`${name} ${width}: light V2 must be translucent`);
    assert(alpha(legacy)>=.7,`${name} ${width}: opt-out must retain original UI`);
    assert.notEqual(dark.background,legacy.background,`${name} ${width}: opt-in must change material`);
    assert.equal(dark.brandInk,'rgb(248, 248, 251)',`${name} ${width}: dark header text`);
    assert.equal(light.brandInk,'rgb(27, 27, 35)',`${name} ${width}: light header text`);
    assert(dark.blur.includes('blur(20px)'),`${name} ${width}: V2 blur present`);
   }
   console.log(name+': Glass V2 dark/light and default-off passed at mobile/desktop');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exit(1)});
