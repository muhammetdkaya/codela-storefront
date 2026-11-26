// MONA Phase 5: accessible, secure 2-step service enquiry.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const html=execFileSync(process.env.PHP_BIN||'php',['tests/agency-pages.php','--render=project'],{cwd:root,encoding:'utf8'});
const adminHtml=execFileSync(process.env.PHP_BIN||'php',['tests/agency-pages.php','--render=quote-admin'],{cwd:root,encoding:'utf8'});
const server=http.createServer((req,res)=>{
 const loc=new URL(req.url,'http://localhost').pathname;
 if(loc==='/admin'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(adminHtml);}
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
  for(const [width,height] of [[320,667],[390,844],[402,874],[768,1024],[1280,720],[1440,900],[1920,1080],[2560,1440]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/');
   // Exercise the real production cascade, including the optional Glass V2 material.
   await page.addStyleTag({path:path.join(root,'theme/codela-storefront/assets/styles/glass-v2.css')});
   await page.addStyleTag({path:path.join(root,'theme/codela-storefront/assets/styles/agency-glass.css')});
   await page.evaluate(()=>document.body.classList.add('sf-glass-v2'));
   const widget=page.locator('.sf-agency-widget--project');
   assert.equal(await widget.count(),1);
   if(width<=739){
     const spacing=await widget.locator('.cdl-project').evaluate(e=>{const c=getComputedStyle(e);return {left:parseFloat(c.paddingLeft),right:parseFloat(c.paddingRight),top:parseFloat(c.paddingTop)}});
     const expected=width>=390?24:18;
     assert(Math.abs(spacing.left-expected)<.1&&Math.abs(spacing.right-expected)<.1,'Responsive optical form gutters');
     assert.equal(spacing.top,26,'Shared inner header inset');
   }
   const one=widget.locator('[data-project-step="1"]'),scope=widget.locator('[data-project-step="2"]'),two=widget.locator('[data-project-step="3"]'),three=widget.locator('[data-project-step="4"]');
   assert(await one.isVisible() && !(await scope.isVisible()) && !(await two.isVisible()) && !(await three.isVisible()));
   assert.equal(await one.locator('input[type="checkbox"]').count(),4);
   assert.equal(await one.locator('h1').textContent(),'Hangi alanda çalışmak istersin?');
   assert.equal(await widget.locator('.cdl-project__progress h1,.cdl-project__progress h2').count(),0,'No duplicate heading');
   const rows=await one.locator('.cdl-project__choice').evaluateAll(labels=>labels.map(label=>{
     const row=label.querySelector('input+span'),css=getComputedStyle(row),check=getComputedStyle(row,'::after');
     return {fill:css.backgroundColor,left:css.borderLeftWidth,right:css.borderRightWidth,top:css.borderTopWidth,
       height:row.getBoundingClientRect().height,checkTop:parseFloat(check.top),checkWidth:check.width,
       checkHeight:check.height,checkRight:check.right,line:getComputedStyle(row,'::before').opacity};
   }));
   for(const row of rows){
     assert.equal(row.fill,'rgba(0, 0, 0, 0)','No legacy card fill');
     assert.equal(row.left,'0px');assert.equal(row.right,'0px');assert.equal(row.top,'0px');
     assert.equal(row.checkWidth,'22px');assert.equal(row.checkHeight,'22px');assert.equal(row.checkRight,'2px');
     assert(Math.abs(row.checkTop-row.height/2)<=2,'Check is vertically centered');
   }
   assert.equal(rows[0].line,'1','Selected line visible');
   await one.locator('input[value="E-Ticaret"]').locator('..').click();
   assert.equal(await one.locator('input:checked').count(),2,'Multiple services retained');
   await one.locator('[data-project-next]').click();
   assert(await scope.isVisible());
   assert.equal(await scope.locator('[data-project-scope]:visible').count(),1,'Only active service is visible');
   assert.equal(await scope.locator('[data-scope-tab]:visible').count(),2,'Selected services have tabs');
   assert.equal(await scope.locator('input[data-scope-extra]:checked').count(),0,'No automatically selected paid extras');
   assert.equal(await scope.locator('select').count(),0,'No native dropdown in scope');
   const web=scope.locator('[data-project-scope="Web Tasarım"]');
   assert.equal(await web.locator('input[data-scope-package]:checked').count(),0,'No priced default');
   assert(await web.locator('input[data-scope-custom]').isChecked());
   await web.locator('input[data-scope-package]').first().locator('..').click();
   assert(!(await web.locator('input[data-scope-custom]').isChecked()));
   const marker=await web.locator('input[data-scope-package]:checked+span').evaluate(el=>getComputedStyle(el,'::after').width);
   assert.equal(marker,'22px','Shared choice indicator');
   assert((await web.locator('.cdl-project__package-price').first().textContent()).includes('12.000'));
   assert(await web.getByText('Örnek açıklama').isVisible());
   await web.locator('input[data-scope-extra]').first().locator('..').click();
   assert((await scope.locator('[data-scope-total]').textContent()).includes('13.500'));
   await scope.locator('[data-scope-tab="E-Ticaret"]').click();
   assert(!(await web.isVisible()));
   assert((await widget.locator('form').evaluate(el=>new FormData(el).get('project_quote[web][packages][]')))==='0','Inactive selected tab submits package');
   await scope.locator('[data-scope-tab="Web Tasarım"]').click();
   assert(await web.locator('input[data-scope-package]').first().isChecked());
   assert(await web.locator('input[data-scope-extra]').first().isChecked());
   assert.equal(await scope.locator('[data-project-scope-summary]').count(),0,'No duplicate price summary');
   await web.locator('input[data-scope-custom]').locator('..').click();
   assert.equal(await web.locator('input[data-scope-package]:checked').count(),0);
   await scope.locator('[data-project-next]').click();
   assert(await two.isVisible());
   assert.equal(await two.locator('input[name="agency_project_month"]').count(),4);
   assert.equal(await two.locator('input[name="agency_project_month"]:disabled').count(),2);
   assert.equal(await widget.locator('.cdl-project__availability').count(),0,'No repeated capacity banner');
   assert.equal(await two.locator('h2').textContent(),'Ne zaman başlayalım?');
   assert.equal(await two.locator('.cdl-project__slots .cdl-project__choice>span>i').count(),4);
   await two.locator('input[value="flexible"]').locator('..').click();
   await two.locator('[data-project-next]').click();
   assert(await three.isVisible());
   const contact=three.locator('[name="agency_project_contact"]');
   await contact.fill('05321234567');
   assert(await contact.evaluate(el=>el.checkValidity()),'Phone accepted');
   await contact.fill('invalid');
   assert(!(await contact.evaluate(el=>el.checkValidity())),'Invalid contact rejected');
   await contact.fill('test@example.com');
   assert(await contact.evaluate(el=>el.checkValidity()),'Email accepted');
   const field=await three.locator('[name="agency_project_name"]').evaluate(el=>{const c=getComputedStyle(el);return [c.backgroundColor,c.borderTopWidth,c.borderLeftWidth,c.borderBottomWidth,c.borderRadius];});
   assert.deepEqual(field,['rgba(0, 0, 0, 0)','0px','0px','1px','0px'],'Underline-only field with Glass V2');
   assert.equal(await widget.locator('[data-project-progress-label]').textContent(),'04 / 04');
   assert.equal(await widget.locator('[data-project-summary]>span').count(),5);
   await three.locator('[data-project-back]').click();
   await two.locator('[data-project-back]').click();
   await scope.locator('[data-project-back]').click();
   assert.equal(await one.locator('input:checked').count(),2);
   await one.locator('[data-project-next]').click();
   assert(await scope.isVisible());
   assert.equal(await scope.locator('[data-project-scope]:visible').count(),1,'Only active service is visible');
   assert.equal(await scope.locator('[data-scope-tab]:visible').count(),2,'Selected services have tabs');
   assert.equal(await scope.locator('input[data-scope-extra]:checked').count(),0,'No automatically selected paid extras');
   await scope.locator('[data-project-next]').click();
   assert(await two.locator('input[value="flexible"]').isChecked());
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
  const admin=await browser.newPage({viewport:{width:390,height:844}});
  const adminErrors=[];admin.on('pageerror',e=>adminErrors.push(e.message));
  await admin.goto('http://127.0.0.1:'+server.address().port+'/admin');
  const webAdmin=admin.locator('[data-quote-service="web"]');
  const ecomAdmin=admin.locator('[data-quote-service="commerce"]');
  assert(await webAdmin.isVisible()&&!(await ecomAdmin.isVisible()));
  const group=webAdmin.locator('[data-quote-group][data-kind="packages"]');
  assert((await group.locator('[data-quote-price]').first().textContent()).includes('12.000'));
  await group.locator('[data-quote-add]').click();
  const added=group.locator('[data-quote-row]').last();
  assert(await added.locator('[data-quote-field="label"]').isVisible());
  await added.locator('[data-quote-field="label"]').fill('Yeni paket');
  await added.locator('[data-quote-field="description"]').fill('Kısa açıklama');
  await added.locator('[data-quote-field="min"]').fill('25000');
  await added.locator('[data-quote-fixed]').click();
  assert.equal(await added.locator('[data-quote-field="max"]').inputValue(),'25000');
  assert((await added.locator('[data-quote-price]').textContent()).includes('25.000 TL'));
  await admin.locator('[data-quote-tab="commerce"]').click();
  assert(await ecomAdmin.isVisible()&&!(await webAdmin.isVisible()));
  assert.equal(await admin.locator('#codela-quote-rules form').evaluate(el=>new FormData(el).get('quote[web][packages][2][label]')),'Yeni paket');
  await admin.locator('[data-quote-tab="web"]').click();
  await added.locator('[data-quote-unknown]').click();
  assert.equal(await added.locator('[data-quote-field="min"]').inputValue(),'');
  await added.locator('[data-quote-field="min"]').fill('30000');
  await admin.locator('[data-quote-tab="commerce"]').click();
  await admin.locator('#codela-quote-rules form button[type="submit"]').click();
  assert(await webAdmin.isVisible(),'Invalid range returns to correct service');
  assert(await added.locator('[data-quote-field="max"]').isVisible(),'Invalid editor opens');
  await added.locator('[data-quote-fixed]').click();
  await admin.locator('[data-quote-tab="commerce"]').click();
  assert.equal(await admin.locator('#codela-quote-rules form').evaluate(el=>new FormData(el).get('quote_editor_complete')),'1');
  assert.deepEqual(adminErrors,[]);
  await admin.close();
  console.log('MONA Project Start: five viewports, four steps, back/edit, selection, secure native form passed');
 } finally {await browser.close();await new Promise(done=>server.close(done));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
