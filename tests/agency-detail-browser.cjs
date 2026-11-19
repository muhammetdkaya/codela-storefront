// Service detail, derived from the source HTML rather than the old service cards.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const fixture=execFileSync(process.env.PHP_BIN||'php',['tests/agency-pages.php','--render=detail'],{cwd:root,encoding:'utf8'});
const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost').pathname;
  if(u==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(fixture)}
  const f=path.resolve(root,'.'+u);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.statusCode=404;return res.end()}
  res.setHeader('Content-Type',f.endsWith('.css')?'text/css':f.endsWith('.jpg')?'image/jpeg':'text/plain');
  res.end(fs.readFileSync(f));
});
(async()=>{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||undefined});
 try{
   fs.mkdirSync(path.join(root,'qa'),{recursive:true});
   for(const [width,height] of [[320,667],[390,844],[402,874],[768,1024],[1440,900]]){
     const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
     const errors=[];page.on('pageerror',e=>errors.push(e.message));
     await page.goto('http://127.0.0.1:'+server.address().port+'/');
     const detail=page.locator('.sf-agency-widget--detail');
     assert.equal(await detail.count(),1,'Only one detail section');
     assert.equal(await detail.locator('h1').count(),1,'One page headline');
     assert.equal(await detail.locator('.cdl-service-detail__scope li').count(),4,'Four source scope labels');
     const s=await detail.evaluate(el=>{
       const photo=el.querySelector('.cdl-service-detail__visual img');
       const bounds=el.querySelector('.cdl-service-detail').getBoundingClientRect();
       const cta=el.querySelector('.cdl-service-detail__cta');
       const action=cta.getBoundingClientRect();
       return {background:getComputedStyle(el.querySelector('.cdl-service-detail')).backgroundColor,
         image:photo.complete&&photo.naturalWidth===1376,
         overflow:document.documentElement.scrollWidth-innerWidth,
         viewX:bounds.x,viewW:bounds.width,
         buttonHeight:action.height,
         ctaHref:cta.getAttribute('href'),
         backHref:el.querySelector('.cdl-service-detail__back')?.getAttribute('href'),
         fakeChrome:el.querySelectorAll('.phone-frame,.status-bar,.bottom-nav').length
       };
     });
     assert(s.image,'Approved source photograph loaded at '+width);
     assert.equal(s.background,'rgb(9, 9, 12)');
     assert(s.overflow<=1,'No horizontal overflow '+width);
     assert(Math.abs(s.viewX)<=1&&Math.abs(s.viewW-width)<=1,'Full-bleed stage '+width);
     assert(s.buttonHeight>=44,'Touch-safe CTA '+width);
     assert(s.ctaHref.includes('hizmetler=Web%20Tasar%C4%B1m'),'Project CTA transports service to existing form');
     assert(s.backHref.includes('hizmetler'),'Back link navigates to real Services page');
     assert.equal(s.fakeChrome,0,'No duplicate fake phone UI');
     assert.deepEqual(errors,[]);
     await page.screenshot({path:path.join(root,'qa','agency-detail-'+width+'.png'),fullPage:true});
     await page.close();
   }
   console.log('Service details: original art and copy, native links, five viewports passed.');
 }finally{await browser.close();await new Promise(done=>server.close(done))}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
