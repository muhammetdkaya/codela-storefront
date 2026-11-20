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
       headerShadow:style('.sf-brand').boxShadow,
       backdrop:style('.sf-brand').backdropFilter,
       iconBg:style('.sf-header-menu .sf-ui-icon-button').backgroundImage,
       primary:style('.cdl-project__button').backgroundImage,
       primaryColor:style('.cdl-project__button').backgroundColor,
       primaryShadow:style('.cdl-project__button').boxShadow,
       card:style('.cdl-bento__card').backgroundImage,
       contact:style('.cdl-contact__submit').backgroundImage,
       input:style('.cdl-project__fields input').backgroundColor,
       chosen:style('.cdl-project__choice input:checked + span').backgroundColor,
       stage:style('.sf-agency-process-stage').backgroundImage,
       canvas:document.querySelector('.sf-glass-optical-canvas')
     };
    });
    assert.equal(m.header,'none',name+': header has no bright gradient');
    assert.equal(m.headerColor,'rgba(36, 37, 44, 0.6)',name+': muted graphite header');
    assert(!m.headerShadow.includes('inset'),name+': no embossed navigation shadows');
    assert(m.backdrop.includes('blur(18px)'),name+': natural backdrop blur retained');
    assert(!m.backdrop.includes('brightness'),name+': no artificial brightness');
    assert.equal(m.iconBg,'none',name+': native menu glass is flat');
    assert.equal(m.primary,'none',name+': project CTA is not specular');
    assert.equal(m.primaryColor,'rgba(49, 50, 58, 0.67)',name+': quiet primary tint');
    assert(!m.primaryShadow.includes('inset'),name+': no 3D primary bevel');
    assert.equal(m.contact,'none',name+': contact submit does not bloom');
    assert(m.card.includes('linear-gradient('),name+': raised bento card');
    assert(m.stage.includes('linear-gradient('),name+': process stage');
    assert.equal(m.chosen,'rgba(214, 166, 118, 0.16)',name+': selected amber chip');
    assert.equal(m.canvas,null,name+': no Canvas overlay');
    await page.setContent(html(false));
    const disabled=await page.evaluate(()=>getComputedStyle(document.querySelector('.cdl-project__button')).backgroundColor);
    assert.equal(disabled,'rgb(248, 246, 249)',name+': off restores native design');
    await page.close();
   }
   console.log(name+': quiet Agency glass, accessible contrast and disabled fallback passed');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exit(1)});
