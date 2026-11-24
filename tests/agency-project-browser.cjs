// MONA Phase 5: accessible, secure 2-step service enquiry.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const html=execFileSync(process.env.PHP_BIN||'php',['tests/agency-pages.php','--render=project'],{cwd:root,encoding:'utf8'});
const server=http.createServer((req,res)=>{
 const loc=new URL(req.url,'http://localhost').pathname;
 if(loc==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html);}
 const f=path.resolve(root,'.'+loc);
 if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.statusCode=404;return res.end();}
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
   const widget=page.locator('.sf-agency-widget--project');
   assert.equal(await widget.count(),1);
   const one=widget.locator('[data-project-step="1"]'),two=widget.locator('[data-project-step="2"]'),three=widget.locator('[data-project-step="3"]');
   assert(await one.isVisible() && !(await two.isVisible()) && !(await three.isVisible()));
   assert.equal(await one.locator('input[type="checkbox"]').count(),4);
   await one.locator('input[value="E-Ticaret"]').locator('..').click();
   assert.equal(await one.locator('input:checked').count(),2,'Multiple services retained');
   await one.locator('[data-project-next]').click();
   assert(await two.isVisible());
   await two.locator('input[value="Esnek takvim"]').locator('..').click();
   await two.locator('input[value="Mevcut site yenilenecek"]').locator('..').click();
   await two.locator('[data-project-next]').click();
   assert(await three.isVisible());
   assert.equal(await widget.locator('[data-project-progress-label]').textContent(),'03 / 03');
   assert.equal(await widget.locator('[data-project-summary]>span').count(),4);
   await three.locator('[data-project-back]').click();
   await two.locator('[data-project-back]').click();
   assert.equal(await one.locator('input:checked').count(),2);
   await one.locator('[data-project-next]').click();
   assert(await two.locator('input[value="Esnek takvim"]').isChecked());
   await two.locator('[data-project-next]').click();
   const geometry=await widget.evaluate(el=>({overflow:document.documentElement.scrollWidth-innerWidth,
      width:el.querySelector('.cdl-project__shell').getBoundingClientRect().width,
      panel:getComputedStyle(el.querySelector('.cdl-project__panel')).backgroundImage,
      form:el.querySelector('form').getAttribute('action'),method:el.querySelector('form').method,
      secure:['agency_project_nonce','agency_project_webpage','agency_project_consent'].every(name=>el.querySelector('[name="'+name+'"]'))}));
   assert(geometry.overflow<=1&&geometry.width<=697);
   assert.equal(geometry.panel,'none');
   assert(geometry.form.includes('admin-post.php')&&geometry.method==='post'&&geometry.secure);
   assert.deepEqual(errors,[]);
   await page.screenshot({path:path.join(root,'qa','agency-project-'+width+'.png'),fullPage:true});
   await page.close();
  }
  console.log('MONA Project Start: five viewports, three steps, back/edit, selection, secure native form passed');
 } finally {await browser.close();await new Promise(done=>server.close(done));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
