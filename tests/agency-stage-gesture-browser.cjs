/* One physical touchpad gesture remains one stage even beyond 620ms. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const script=fs.readFileSync('theme/codela-storefront/assets/scripts/agency-stage-scroll.js','utf8');
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'
 +'<style>html,body{padding:0;margin:0}.sf-agency-widget{height:100vh;box-sizing:border-box}</style></head><body class="home">'
 +'<main class="sf-content"><div class="codela-page-layout">'
 +'<div class="sf-agency-widget sf-agency-widget--studio">1</div>'
 +'<div class="sf-agency-widget sf-agency-widget--bento">2</div>'
 +'<div class="sf-agency-widget sf-agency-widget--process">3</div>'
 +'</div></main><script src="/agency-stage-scroll.js"></script></body></html>';
(async()=>{
const server=http.createServer((req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.url==='/agency-stage-scroll.js'){res.setHeader('Content-Type','text/javascript');res.end(script);return;}
 res.setHeader('Content-Type','text/html');res.end(html);
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true});
try{
const page=await browser.newPage({viewport:{width:1100,height:700}});
await page.addInitScript(()=>{
 const native=window.scrollTo.bind(window);
 window.__stageCalls=[];
 window.scrollTo=(...args)=>{window.__stageCalls.push(args[0]);return native(...args)};
});
await page.goto('http://127.0.0.1:'+server.address().port+'/');
assert(await page.evaluate(()=>document.documentElement.classList.contains('sf-agency-stage-nav')));
const wheel=async(delta,interval,count)=>{
 await page.evaluate(async ({delta,interval,count})=>{
  for(let i=0;i<count;i++){
   document.body.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:delta,deltaMode:0}));
   await new Promise(done=>setTimeout(done,interval));
  }
 },{delta,interval,count});
};
await wheel(55,25,60);
await page.waitForTimeout(350);
const first=await page.evaluate(()=>window.scrollY);
assert(first>=695&&first<=705,'Long momentum must stop at stage 2, got '+first);
assert.deepEqual(await page.evaluate(()=>window.__stageCalls),[{top:700,behavior:'smooth'}],'Exactly one native smooth scroll per wheel gesture');
await wheel(55,30,3);
await page.waitForTimeout(650);
const second=await page.evaluate(()=>window.scrollY);
assert(second>=1395&&second<=1405,'A new discrete gesture must reach stage 3: '+second);
await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
await page.waitForTimeout(300);
await wheel(12,0,1);
await page.waitForTimeout(320);
await wheel(12,0,1);
await page.waitForTimeout(100);
assert.equal(await page.evaluate(()=>window.scrollY),0,'Separated small wheel gestures do not aggregate');
await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.waitForTimeout(300);
 await page.evaluate(()=>{
   const fire=(type,y)=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,'touches',{value:[{clientX:100,clientY:y}]});document.body.dispatchEvent(e)};
   fire('touchstart',500);fire('touchmove',455);
 });
 await page.waitForFunction(()=>Math.abs(window.scrollY-700)<=2,{},{timeout:1800});
 assert.equal(await page.evaluate(()=>window.__stageCalls.filter(x=>x.behavior==='smooth').length),3,'Touch triggers one native smooth scroll before release');
 await page.evaluate(()=>{const e=new Event('touchmove',{bubbles:true,cancelable:true});Object.defineProperty(e,'touches',{value:[{clientX:100,clientY:100}]});document.body.dispatchEvent(e);document.body.dispatchEvent(new Event('touchend',{bubbles:true}));});
 await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>window.scrollY),700,'One touch can move only one stage');
 console.log('Agency wheel: 1500ms momentum, new gesture, idle reset passed.');
await page.close();
}finally{await browser.close();await new Promise(done=>server.close(done));}
})().catch(e=>{console.error(e);process.exitCode=1});
