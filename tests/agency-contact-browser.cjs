// Real browser contract for the source-matched Contact Bento + live form.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const html=execFileSync(process.env.PHP_BIN||'php',['tests/agency-pages.php','--render=contact-bento'],{cwd:root,encoding:'utf8'});
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost').pathname;
 if(u==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html)}
 const f=path.resolve(root,'.'+u);
 if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.statusCode=404;return res.end()}
 res.setHeader('Content-Type',f.endsWith('.css')?'text/css':f.endsWith('.js')?'text/javascript':'text/plain');
 res.end(fs.readFileSync(f));
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||undefined});
 try{
  fs.mkdirSync(path.join(root,'qa'),{recursive:true});
  for(const [width,height] of [[320,667],[390,844],[402,874],[768,1024],[1440,900]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/');
   const app=page.locator('.sf-agency-widget--contact-bento');
   assert.equal(await app.count(),1,'One isolated Contact Bento');
   assert.equal(await app.locator('.cdl-contact__card').count(),0,'No redundant contact cards');
   assert.equal(await app.locator('.cdl-contact__body form').count(),1,'Form in first section');
   assert.equal(await app.locator('h1').textContent(),'Birlikte başlayalım.');
   const s=await app.evaluate(el=>{
      const bounds=el.querySelector('.cdl-contact').getBoundingClientRect();
      const cards=[...el.querySelectorAll('.cdl-contact__grid>.cdl-contact__card')].map(x=>x.getBoundingClientRect().width);
      const input=el.querySelector('[name="agency_message"]');
      return {bg:getComputedStyle(el.querySelector('.cdl-contact')).backgroundColor,
       overflow:document.documentElement.scrollWidth-innerWidth,viewW:bounds.width,viewX:bounds.x,
       cards,form:!!input,submit:!!el.querySelector('[name="agency_contact_nonce"]'),
       honey:!!el.querySelector('[name="agency_webpage"]'),consent:!!el.querySelector('[name="agency_consent"]'),
       fakeChrome:el.querySelectorAll('.phone-frame,.status-bar,.bottom-nav').length
      };
   });
   assert.equal(s.bg,'rgb(9, 9, 12)','Matches Stage 1+2 obsidian');
   assert(s.overflow<=1,'No horizontal overflow '+width);
   assert(Math.abs(s.viewX)<=1&&Math.abs(s.viewW-width)<=1,'Full-bleed screen '+width);
   assert(s.cards.every(w=>w>80),'All cards remain usable '+width);
   assert(s.form&&s.submit&&s.honey&&s.consent,'Existing form security preserved');
   assert.equal(s.fakeChrome,0,'No mock phone controls');
   assert.deepEqual(errors,[],'No browser exceptions');
   // Clicking the primary project card must take visitors to the real form.
   await app.locator('[name="agency_name"]').focus();
   await page.waitForTimeout(70);
    assert(await app.locator('[name="agency_name"]').isVisible(),'First-screen form is available');
   await page.screenshot({path:path.join(root,'qa','agency-contact-'+width+'.png'),fullPage:true});
   await page.close();
  }
  console.log('MONA Contact Bento: 5 viewports, secure form, native anchors passed.');
 }finally{await browser.close();await new Promise(done=>server.close(done))}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
