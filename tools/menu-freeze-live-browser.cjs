/* Real public Codela nav A/B. Never signs in or mutates the server. */
const { chromium, webkit } = require('playwright');
const URL_BASE='https://codela.dev/';
const checks=[
 {name:'home-base',path:'/'},
 {name:'home-no-3d-transform',path:'/',disable3d:true},
 {name:'home-no-agency-widgets',path:'/',stripAgency:true},
 {name:'services-base',path:'/hizmetler/'},
 {name:'account-base',path:'/hesabim/'}
];
function stat(vals){
 if(!vals.length)return {frames:0};
 const sort=[...vals].sort((a,b)=>a-b);
 const take=q=>+sort[Math.max(0,Math.floor((sort.length-1)*q))].toFixed(1);
 return {frames:sort.length,p50:take(.5),p95:take(.95),max:take(1),dropped34:sort.filter(x=>x>34).length,dropped50:sort.filter(x=>x>50).length};
}
async function capture(page,trigger){
 await page.evaluate(()=>{
   window.__menuFrames=[];
   let last=0,end=performance.now()+850;
   const tick=t=>{
     if(last)window.__menuFrames.push(t-last);last=t;
     if(t<end)requestAnimationFrame(tick);
   };
   requestAnimationFrame(tick);
 });
 const before=Date.now();
 try{await trigger.click({timeout:6000});}catch(e){return {error:String(e.message).slice(0,130)};}
 await page.waitForTimeout(880);
 const details=await page.evaluate(()=>({
    samples:window.__menuFrames||[],
    open:!!document.querySelector('#sf-panel[open]'),
    active:document.querySelector('#sf-panel')?.className.slice(0,150)||'',
    locked:document.documentElement.classList.contains('sf-overlay-scroll-locked'),
    visible:document.visibilityState
 }));
 return {...stat(details.samples),clickTime:Date.now()-before,open:details.open,active:details.active,locked:details.locked};
}
(async()=>{
 for(const [engineName,engine] of [['webkit',webkit],['chromium',chromium]]){
 const browser=await engine.launch({headless:true});
 try {
  for(const choice of checks) {
   const context=await browser.newContext({viewport:{width:402,height:874},isMobile:true,hasTouch:true,deviceScaleFactor:3,
     reducedMotion:'no-preference'});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message.slice(0,120)));
   let response;
   try{response=await page.goto(URL_BASE.replace(/\/$/,'')+choice.path,{waitUntil:'domcontentloaded',timeout:30000});}
   catch(e){console.log('REPORT',JSON.stringify({engine:engineName,scenario:choice.name,error:'navigation: '+e.message.slice(0,200)}));await context.close();continue;}
   await page.waitForTimeout(600);
   const structure=await page.evaluate(()=>({
     title:document.title.slice(0,90),
     cards:document.querySelectorAll('[data-agency-widget="cards"]').length,
     scroll:document.querySelectorAll('[data-agency-widget="scroll"]').length,
     service:document.querySelectorAll('[data-agency-widget="services"]').length,
     menu:document.querySelectorAll('.sf-header .sf-menu-trigger').length,
     panel:document.querySelectorAll('#sf-panel').length,
     css:document.styleSheets.length
   }));
   if(choice.disable3d){
    await page.evaluate(()=>{
      document.querySelectorAll('.sf-agency-scroll-device').forEach(el=>{
        el.style.setProperty('transition','none','important');
        el.style.setProperty('transform','none','important');
        el.style.setProperty('will-change','auto','important');
        el.style.setProperty('box-shadow','none','important');
      });
    });
   }
   if(choice.stripAgency){
     await page.evaluate(()=>document.querySelectorAll('[data-agency-widget]').forEach(x=>x.remove()));
   }
   let open,close={};
   if(structure.menu && structure.panel){
      open=await capture(page,page.locator('.sf-header .sf-menu-trigger').first());
      if(open?.open){
        const trigger=page.locator('#sf-panel .sf-menu-trigger');
        const closer=await trigger.count()?trigger:page.locator('#sf-panel .sf-close').first();
        close=await capture(page,closer);
      }
   }else open={error:'menu or dialog missing'};
   console.log('REPORT',JSON.stringify({engine:engineName,scenario:choice.name,http:response?.status(),structure,open,close,pageErrors:errors.slice(0,3)}));
   await context.close();
  }
 }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
