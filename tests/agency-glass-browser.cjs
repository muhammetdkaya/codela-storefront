'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base=fs.readFileSync('theme/codela-storefront/assets/styles/storefront-base.css','utf8');
const glass=fs.readFileSync('theme/codela-storefront/assets/styles/glass-v2.css','utf8');
const agency=fs.readFileSync('theme/codela-storefront/assets/styles/agency.css','utf8');
const project=fs.readFileSync('theme/codela-storefront/assets/styles/agency-project.css','utf8');
const material=fs.readFileSync('theme/codela-storefront/assets/styles/agency-glass.css','utf8');
function html(enabled){
 const agencyMarkup=`<div class="sf-agency-widget sf-agency-widget--studio"><section class="codela-studio-hero"><div class="codela-studio-hero__visual-foot"><a href="#">Hizmetler</a></div></section></div>
 <div class="sf-agency-widget sf-agency-widget--bento"><a class="cdl-bento__card" href="#"><span class="cdl-bento__pill">Öne Çıkan</span><span class="cdl-bento__support-action">İncele</span></a></div>
 <div class="sf-agency-widget sf-agency-widget--detail"><a class="cdl-service-detail__back" href="#">Geri</a><a class="cdl-service-detail__cta" href="#">Proje Başlat</a></div>
 <div class="sf-agency-widget sf-agency-widget--contact-bento"><div class="cdl-contact__card"></div><form class="cdl-contact__form"><input name="name" aria-label="Ad"><button type="button" class="cdl-contact__submit">Gönder</button></form></div>
 <div class="sf-agency-widget sf-agency-widget--project"><div class="cdl-project__panel"><label class="cdl-project__choice"><input type="radio" name="s" checked><span>Web Tasarım</span></label><button class="cdl-project__button">Devam</button><div class="cdl-project__fields"><input aria-label="E-posta"></div></div></div>
 <div class="sf-agency-widget sf-agency-widget--process"><section class="sf-agency-process"><button class="sf-agency-process-step" aria-pressed="true">Keşif</button><div class="sf-agency-process-stage" data-step="0"></div></section></div>`;
 return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+
 base+'\n'+agency+'\n'+project+'\n'+glass+(enabled?'\n'+material:'')+
 '</style></head><body class="'+(enabled?'sf-glass-v2 ':'')+'home"><div class="sf-shell"><header class="sf-header">'+
 '<nav class="sf-header-menu"><button class="sf-ui-icon-button sf-ui-icon-button--soft">Menu</button></nav>'+
 '<div class="sf-brand sf-ui-surface"><a href="/">CODELA</a></div><nav class="sf-actions sf-ui-surface">'+
 '<button type="button">Search</button></nav></header></div>'+agencyMarkup+'</body></html>';
}
(async()=>{
 for(const [name,driver] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await driver.launch({headless:true});
  try{
   for(const width of [390,1280]){
    const page=await browser.newPage({viewport:{width,height:860}});
    await page.setContent(html(true));
    const m=await page.evaluate(()=>{
     const style=s=>getComputedStyle(document.querySelector(s));
     return {
       header:style('.sf-brand').backgroundImage,
       headerColor:style('.sf-brand').backgroundColor,
       headerBorder:style('.sf-brand').borderTopWidth,
       headerShadow:style('.sf-brand').boxShadow,
       backdrop:style('.sf-brand').backdropFilter,
       iconBg:style('.sf-header-menu .sf-ui-icon-button').backgroundImage,
       primary:style('.cdl-project__button').backgroundImage,
       primaryColor:style('.cdl-project__button').backgroundColor,
       primaryBorder:style('.cdl-project__button').borderTopWidth,
       primaryShadow:style('.cdl-project__button').boxShadow,
       card:style('.cdl-bento__card').backgroundImage,
       contact:style('.cdl-contact__submit').backgroundImage,
       input:style('.cdl-project__fields input').backgroundColor,
       chosen:style('.cdl-project__choice input:checked + span').backgroundColor,
       stage:style('.sf-agency-process-stage').backgroundImage,
       canvas:document.querySelector('.sf-glass-optical-canvas')
     };
    });
    assert.equal((m.header.match(/linear-gradient\(/g)||[]).length,3,name+': header has refractive rim, clear base and soft reflection');
    assert.equal(m.headerColor,'rgba(0, 0, 0, 0)',name+': no opaque graphite paint');
    assert.equal(m.headerBorder,'1px',name+': thin rim');
    assert(!m.headerShadow.includes('inset'),name+': no 3D bevel');
    assert(m.headerShadow.includes('6px 18px -6px'),name+': approved navigation shadow');
    assert(m.backdrop.includes('blur(20px)'),name+': live blur');
    assert(m.backdrop.includes('saturate(160%)'),name+': approved saturation');
    assert(m.backdrop.includes('brightness(0.92)'),name+': approved darkening');
    assert.equal((m.iconBg.match(/linear-gradient\(/g)||[]).length,3,name+': menu button refractive glass');
    assert.equal((m.primary.match(/linear-gradient\(/g)||[]).length,3,name+': primary button refractive glass');
    assert.equal(m.primaryColor,'rgba(0, 0, 0, 0)',name+': transparent primary paint');
    assert.equal(m.primaryBorder,'1px',name+': thin primary rim');
    assert(!m.primaryShadow.includes('inset'),name+': no raised primary');
    assert(m.primaryShadow.includes('8px 22px -6px'),name+': approved primary shadow');
    assert.equal((m.contact.match(/linear-gradient\(/g)||[]).length,3,name+': contact button refractive glass');
    // Verify two actual colors instead of relying on the number of layers.
    assert(m.header.includes('rgba(34, 34, 36, 0.72)'),name+': navigation graphite matches approval');
    assert(m.primary.includes('rgba(44, 44, 48, 0.78)'),name+': CTA graphite matches approval');
    assert(m.card.includes('linear-gradient('),name+': raised bento card');
    assert(m.stage.includes('linear-gradient('),name+': process stage');
    assert.equal(m.chosen,'rgba(214, 166, 118, 0.16)',name+': selected amber chip');
    assert.equal(m.canvas,null,name+': no Canvas overlay');
    await page.setContent(html(false));
    const disabled=await page.evaluate(()=>getComputedStyle(document.querySelector('.cdl-project__button')).backgroundColor);
    assert.equal(disabled,'rgb(248, 246, 249)',name+': off restores native design');
    await page.close();
   }
   console.log(name+': refractive Agency glass, accessible contrast and disabled fallback passed');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exit(1)});
