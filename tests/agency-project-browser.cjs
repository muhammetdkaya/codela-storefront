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
   assert.equal(await page.locator('[data-project-step="1"] input[name="agency_project_service"]').count(),4);
   assert.equal(await page.locator('input[name="agency_project_time"]').count(),3);
   assert.equal(await page.locator('input[name="agency_project_scale"]').count(),3);
   assert.equal(await page.locator('input[name="agency_project_nonce"]').count(),1);
   const first=page.locator('[data-project-step="1"]');
   const second=page.locator('[data-project-step="2"]');
   assert(await first.isVisible(),'Step 1 visible on entry');
   assert(!(await second.isVisible()),'Step 2 hidden until requested');
   assert.equal(await first.locator('.cdl-project__kicker').count(),0,
     'Project start is named once in the progress eyebrow, never repeated above the title');
   assert.equal((await page.locator('.cdl-project__progress-label').textContent()).includes('PROJE BAŞLAT'),true);
   const initialStyle=await first.evaluate(node=>{
     const panel=node.closest('.cdl-project__panel');
     const chip=node.querySelector('.cdl-project__choices--three .cdl-project__choice span');
     const selected=node.querySelector('.cdl-project__choice input:checked + span');
     const button=node.querySelector('[data-project-next]');
     const h=node.querySelector('h1');
     const shell=node.closest('.cdl-project__shell');
     const c=el=>getComputedStyle(el);
     return {shellWidth:shell.getBoundingClientRect().width,
       panelRadius:c(panel).borderRadius,chipRadius:c(chip).borderRadius,
       selectedFill:c(selected).backgroundColor,selectedBorder:c(selected).borderTopColor,
       selectedTick:getComputedStyle(selected,'::after').content,
       buttonHeight:button.getBoundingClientRect().height,
       buttonLayers:c(button).backgroundImage,
       buttonShadow:c(button).boxShadow,
       titleSize:parseFloat(c(h).fontSize)};
   });
   assert(initialStyle.shellWidth<=641,'Account-like compact glass panel, not a 750px form');
   assert(parseFloat(initialStyle.panelRadius)<=26,'Project panel has softer 24–26px corners');
   assert.equal(initialStyle.chipRadius,'14px','All choice cards use small rectangular corners');
   assert.equal(initialStyle.selectedFill,'rgba(214, 166, 118, 0.075)','Selected state is a restrained amber tint');
   assert(initialStyle.selectedBorder==='rgba(214, 166, 118, 0.68)','Thin amber border');
   assert(initialStyle.selectedTick.includes('✓'),'Selected card has a small confirmation tick');
   assert(initialStyle.buttonHeight<=50,'Primary glass CTA does not dominate the form');
   assert.equal((initialStyle.buttonLayers.match(/linear-gradient\(/g)||[]).length,3,'Quiet three-layer glass CTA');
   assert(initialStyle.buttonShadow.includes('5px 14px -8px'),'Primary glass shadow is restrained');
   assert(initialStyle.titleSize<=36,'Headline stays editorial and compact');
   await page.locator('input[name="agency_project_service"][value="E-Ticaret"]').check();
   await page.locator('input[name="agency_project_time"][value="Esnek"]').check();
   await page.locator('input[name="agency_project_scale"][value="Kurumsal"]').check();
   await page.locator('[data-project-next]').click();
   assert(await second.isVisible(),'Step 2 visible after Continue');
   assert(!(await first.isVisible()),'Step 1 hidden during contact entry');
   assert((await page.locator('[data-project-summary]').textContent()).includes('E-Ticaret · Esnek · Kurumsal'),'Selection summary carries all 3 inputs');
   assert.equal(await page.locator('[data-project-progress-label]').textContent(),'2 / 2');
   await page.locator('[data-project-back]').click();
   assert(await first.isVisible(),'Edit returns to step 1');
   assert(await page.locator('input[value="E-Ticaret"]').isChecked(),'Edit retains choice');
   await page.locator('[data-project-next]').click();
   const s=await widget.evaluate(el=>({
      bg:getComputedStyle(el.querySelector('.cdl-project')).backgroundColor,
      left:el.querySelector('.cdl-project').getBoundingClientRect().left,
      width:el.querySelector('.cdl-project').getBoundingClientRect().width,
      overflow:document.documentElement.scrollWidth-innerWidth,
      nonce:!!el.querySelector('input[name="agency_project_nonce"]'),
      honey:!!el.querySelector('input[name="agency_project_webpage"]'),
      consent:!!el.querySelector('input[name="agency_project_consent"]'),
      action:el.querySelector('form').getAttribute('action'),
      nativeStatus:el.querySelector('form').getAttribute('method'),
      panelFill:getComputedStyle(el.querySelector('.cdl-project__panel')).backgroundColor,
      panelLayers:getComputedStyle(el.querySelector('.cdl-project__panel')).backgroundImage,
      panelBlur:getComputedStyle(el.querySelector('.cdl-project__panel')).backdropFilter,
      activeGlass:getComputedStyle(el.querySelector('.cdl-project__choice input:checked+span')).backgroundColor,
      actionGlass:getComputedStyle(el.querySelector('.cdl-project__button')).backgroundImage,
      kicker:getComputedStyle(el.querySelector('.cdl-project__kicker')).color
    }));
   assert.equal(s.bg,'rgb(9, 9, 12)');
   assert.equal(s.panelFill,'rgba(20, 20, 22, 0.78)','Account-style neutral project glass');
   assert.equal((s.panelLayers.match(/linear-gradient\(/g)||[]).length,1,'Single restrained card highlight');
   assert(s.panelBlur.includes('blur(22px)'),'Project card has frosted glass');
   assert.equal(s.activeGlass,'rgba(214, 166, 118, 0.075)','Selected project choice uses quiet amber');
   assert.equal((s.actionGlass.match(/linear-gradient\(/g)||[]).length,3,'Glass primary action');
   assert.equal(s.kicker,'rgb(214, 166, 118)','Project eyebrow is amber');
   assert(s.overflow<=1,'No horizontal overflow at '+width);
   assert(Math.abs(s.left)<=1&&Math.abs(s.width-width)<=1,'Full-bleed native page at '+width);
   assert(s.nonce&&s.honey&&s.consent,'Real form security fields are present');
   assert(s.action.includes('admin-post.php')&&s.nativeStatus==='post','Native POST, not a mocked success');
   assert.deepEqual(errors,[],'No runtime JavaScript errors');
   await page.screenshot({path:path.join(root,'qa','agency-project-'+width+'.png'),fullPage:true});
   await page.close();
  }
  console.log('MONA Project Start: five viewports, two steps, back/edit, selection, secure native form passed');
 } finally {await browser.close();await new Promise(done=>server.close(done));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
