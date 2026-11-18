// Browser acceptance for editor-managed minimal V2 Agency welcome and sibling widgets.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const html=execFileSync(process.env.PHP_BIN||'php',['tests/agency-pages.php','--render=widgets'],{cwd:root,encoding:'utf8'});
const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  if(name==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html);}
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.statusCode=404;return res.end();
  }
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/plain');
  return res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser,page;
  try{
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||undefined});
    page=await browser.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    fs.mkdirSync(path.join(root,'qa'),{recursive:true});
    for(const [width,height] of [[320,740],[390,844],[768,1024],[1440,900]]){
      await page.setViewportSize({width,height});
      await page.goto('http://127.0.0.1:'+server.address().port+'/');
      const first=page.locator('[data-agency-widget="cards"]').first();
      const second=page.locator('[data-agency-widget="cards"]').last();
      const hero=page.locator('[data-agency-widget="scroll"]');
      const services=page.locator('[data-agency-widget="services"]');
      const process=page.locator('[data-agency-widget="process"]');
      assert.equal(await page.locator('[data-agency-widget]').count(),5,'Independent editor widgets remain intact');
      assert.equal(await page.locator('.sf-agency-swap-card').count(),6,'Two optional Card Swap widgets still work');
      assert.equal(await hero.count(),1,'One minimal welcome is rendered');
      assert.equal(await hero.locator('.sf-agency-minimal-title .sf-agency-reveal').count(),4,
        'The editorial welcome contains four typographic lines');
      assert.equal((await hero.locator('.sf-agency-minimal-title').textContent()).replace(/\s+/g,' ').trim(),
        'Markanıza özel web siteleri, e-ticaret ve yazılım.','The approved headline is coherent and editable');
      assert.equal(await hero.locator('.sf-agency-minimal-cta').count(),1,'Only one contact CTA remains');
      assert((await hero.locator('.sf-agency-minimal-cta').getAttribute('href')).includes('iletisim'),
        'CTA uses the actual WordPress Contact page');
      assert.equal(await hero.locator('.sf-agency-preview-browser,[data-agency-scroll-device],[data-agency-scroll-next]').count(),0,
        'No fake product UI, scroll hint or 3D compositor');
      const paint=await hero.locator('.sf-agency-minimal-hero').evaluate(el=>{
        const mark=getComputedStyle(el,'::after');
        const line=getComputedStyle(el.querySelector('.sf-agency-reveal'));
        const title=getComputedStyle(el.querySelector('.sf-agency-minimal-title'));
        return {filter:mark.filter,background:mark.backgroundImage,animation:mark.animationName,
          mark:mark.content,fill:line.animationFillMode,entrance:line.animationName,
          canvas:getComputedStyle(el).backgroundColor,align:title.textAlign,ink:title.color};
      });
      assert.equal(paint.filter,'none','Typographic watermark does not use Safari blur');
      assert.equal(paint.background,'none','Old AI grid and purple light are absent');
      assert.equal(paint.animation,'none','No perpetual background animation');
      assert.equal(paint.canvas,'rgb(243, 240, 233)','Editorial Light uses warm neutral paper');
      assert.equal(paint.align,'left','Editorial composition uses left-aligned type');
      assert.notEqual(paint.ink,'rgb(255, 255, 255)','Headline uses dark text');
      assert(paint.mark.includes('C'),'The subtle signature is static typography');
      assert.equal(paint.fill,'backwards','Entry animation releases CTA hover');
      assert.equal(paint.entrance,'sf-agency-hero-enter','Entry animation is CSS-only');
      const handoff=await hero.evaluate(el=>{
        const next=el.nextElementSibling,layer=next?.querySelector('.sf-agency-services');
        return {type:next?.dataset.agencyWidget,overlap:el.getBoundingClientRect().bottom-next.getBoundingClientRect().top,
          radius:layer?parseFloat(getComputedStyle(layer).borderTopLeftRadius):0,
          heroHeight:el.querySelector('.sf-agency-minimal-hero').getBoundingClientRect().height};
      });
      assert.equal(handoff.type,'services','Services follow the welcome');
      if(width<=700){
        assert(Math.abs(handoff.overlap)<=1,'Services do not overlap the full mobile welcome screen');
        assert(handoff.heroHeight>=height-1,'Welcome itself fills at least one visible mobile viewport');
      }else{
        assert(handoff.overlap>=22&&handoff.overlap<=40,'Desktop keeps the rounded editorial handoff');
      }
      assert(handoff.radius>=25,'Services surface remains rounded');
      assert.equal(await services.locator('.sf-agency-poster').count(),4,'Four editable service cards remain');
      await services.locator('[data-agency-widget-detail="0"]').click();
      assert(await services.locator('[data-agency-widget-dialog]').isVisible(),'Service details still open');
      await services.locator('[data-agency-widget-close]').click();
      assert(!(await services.locator('[data-agency-widget-dialog]').isVisible()),'Service details close');
      await process.locator('[data-agency-widget-step="1"]').click();
      assert.equal(await process.locator('[data-agency-widget-stage]').getAttribute('data-step'),'1','Process steps remain interactive');
      await first.locator('[data-agency-swap-to="1"]').click();
      assert.equal(await first.locator('[data-agency-card="1"]').getAttribute('data-pos'),'0','Optional first Card Swap changes');
      assert.equal(await second.locator('[data-agency-card="0"]').getAttribute('data-pos'),'0','Optional second Card Swap remains independent');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow at '+width);
      if(width===390||width===1440)await page.screenshot({path:path.join(root,'qa/agency-widgets-'+width+'.png'),fullPage:true});
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.reload();
    assert.equal(await page.locator('.sf-agency-minimal-title .sf-agency-reveal').first().evaluate(
      el=>getComputedStyle(el).animationName),'none','Reduced-motion preference disables entrance animation');
    const plain=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
    await plain.goto('http://127.0.0.1:'+server.address().port+'/');
    assert.equal(await plain.locator('.sf-agency-minimal-title').isVisible(),true,'Welcome remains visible without JS');
    assert.equal(await plain.locator('.sf-agency-minimal-cta').isVisible(),true,'Contact link works without JS');
    assert.deepEqual(errors,[],'No uncaught JS errors');
    console.log('Minimal Agency V2: 320/390/768/1440, sibling widgets, hover-safe CSS, reduced-motion and no-JS passed.');
  }catch(e){if(page)await page.screenshot({path:path.join(root,'qa/agency-widgets-failure.png'),fullPage:true});throw e;}
  finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
