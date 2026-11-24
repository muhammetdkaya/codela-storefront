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
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.jpg')?'image/jpeg':'text/plain');
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
          canvas:getComputedStyle(el).backgroundColor,markBackground:mark.backgroundColor,
          align:title.textAlign,ink:title.color};
      });
      assert.equal(paint.filter,'none','Typographic watermark does not use Safari blur');
      assert.equal(paint.background,'none','Old AI grid and purple light are absent');
      assert.equal(paint.animation,'none','No perpetual background animation');
      assert.equal(paint.canvas,'rgb(251, 250, 248)','V4.1 uses clean porcelain paper');
      assert.equal(paint.align,'left','Editorial composition uses left-aligned type');
      assert.notEqual(paint.ink,'rgb(255, 255, 255)','Headline uses dark text');
      assert.equal(paint.mark,'"C"','Original Editorial A letter is a subtle typographic watermark');
      assert.equal(paint.markBackground,'rgba(0, 0, 0, 0)',
        'Legacy purple halo must never paint a rectangle behind the editorial C');
      assert.equal(paint.fill,'backwards','Entry animation releases CTA hover');
      assert.equal(paint.entrance,'sf-agency-hero-enter','Entry animation is CSS-only');
      if(width<=390){
        const typography=await hero.evaluate(el=>{
          const heading=el.querySelector('.sf-agency-minimal-title');
          const titleStyle=getComputedStyle(heading);
          const titleLines=[...heading.querySelectorAll('span')];
          const cta=el.querySelector('.sf-agency-minimal-cta');
          const signoff=el.querySelector('.sf-agency-minimal-signoff');
          const lh=parseFloat(titleStyle.lineHeight);
          return {
            fontSize:parseFloat(titleStyle.fontSize),
            lineSpacingRatio:lh/parseFloat(titleStyle.fontSize),
            singleLine: titleLines.every(line=>line.getBoundingClientRect().height<=lh*1.2),
            contentClearance:signoff.getBoundingClientRect().top-cta.getBoundingClientRect().bottom
          };
        });
        assert(typography.lineSpacingRatio>=1.09,
          'Editorial title has deliberate leading rather than compressed lines');
        assert(typography.singleLine,
          'Approved four-line editorial headline does not unexpectedly wrap on a phone');
        assert(typography.contentClearance>=18,
          'Headline and CTA remain clear of the closing signature');
        assert(await hero.locator('.sf-agency-minimal-signoff').isVisible(),
          'Editorial signature stays visible even on narrow mobile phones');
        if(width===390)assert(typography.fontSize>=43.5,
          'Phone title uses the slightly enlarged editorial scale');
      }
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
      assert.equal(await hero.locator('.sf-agency-minimal-signoff').count(),1,'Editorial A signoff is present');
      if(width===390){
        assert(await hero.locator('.sf-agency-minimal-signoff').isVisible(),
          'Editorial signoff stays visible in a realistic short mobile Safari viewport');
      }
      assert.notEqual(await services.locator('.sf-agency-services').evaluate(el=>getComputedStyle(el).backgroundColor),
        paint.canvas,'Services use a distinct warm surface from the porcelain hero');
      assert.equal(await services.locator('.sf-agency-poster-link').count(),4,'Only one link per service poster');
      assert.equal(await services.locator('[data-agency-widget-dialog]').count(),0,'Editorial service links do not open redundant modals');
      assert.equal(await services.locator('.sf-agency-poster-visual').count(),4,'Each service has its own lightweight CSS interface illustration');
      const posterSpace=await services.locator('.sf-agency-poster').first().evaluate(card=>{
        const desc=card.querySelector('.sf-agency-poster-description');
        const chips=card.querySelector('.sf-agency-poster-chips');
        const bottom=card.querySelector('.sf-agency-poster-link');
        return {gap:chips ? chips.getBoundingClientRect().top-desc.getBoundingClientRect().bottom : null,
          actionsVisible:bottom.getBoundingClientRect().bottom <= card.closest('.sf-agency-services-stage').getBoundingClientRect().bottom - 70};
      });
      if(width<=700){
        if(posterSpace.gap!==null)assert(posterSpace.gap<=15,'Description and chips keep the approved V4.1 compact spacing');
        assert(posterSpace.actionsVisible,'Service action stays above the bottom dock');
        const stage=services.locator('.sf-agency-services-stage');
        const size=await stage.evaluate(el=>el.getBoundingClientRect().height);
        assert(size>=height-2,'Services stage fills at least one viewport without clipping content');
        const cardHeight=await services.locator('.sf-agency-poster').first().evaluate(el=>el.getBoundingClientRect().height);
        assert(cardHeight<height*.65,'Service poster is content-sized instead of filling the viewport');
      }

      assert((await services.locator('.sf-agency-poster-link').first().getAttribute('href')).includes('hizmetler'),
        'The poster resolves to a real services page if a service-specific page is not published');
      const serviceTrack=services.locator('[data-agency-widget-track]');
      assert.equal(await serviceTrack.getAttribute('role'),'region','Accessible native service-card region');
      if(width<740){
        assert.equal(await serviceTrack.evaluate(el=>getComputedStyle(el).display),'flex',
          'Phone keeps a horizontal native scroll-snap carousel');
        await services.locator('[data-agency-widget-next]').click();
        await page.waitForTimeout(600);
        assert.equal(await services.getAttribute('data-agency-active-service'),'1','Mobile scroll selects the second service');
        assert.equal(await services.locator('.sf-agency-eyebrow').evaluate(el=>getComputedStyle(el).color),
          'rgb(130, 118, 106)','Eyebrow softly follows the active service tone');
        assert.equal(await services.locator('.sf-agency-poster').first().evaluate(el=>getComputedStyle(el).height!=='0px'),
          true,'Poster height remains content-aware');
      }else{
        assert.equal(await serviceTrack.evaluate(el=>getComputedStyle(el).display),'grid',
          'Tablet and desktop use an uncropped services grid');
        assert.equal(await serviceTrack.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),
          width>=1100?4:2,'Four columns on desktop; two on tablet');
      }
      await process.scrollIntoViewIfNeeded();
      await process.locator('[data-process-image-layer="1"][data-process-image-ready="true"]').waitFor({state:'attached'});
      await process.locator('[data-process-image-layer="2"][data-process-image-ready="true"]').waitFor({state:'attached'});
      await process.locator('[data-agency-widget-step="1"]').click();
      assert.equal(await process.locator('[data-process-image-active="true"]').getAttribute('data-process-image-layer'),'1','Decoded image is ready at the moment the stage changes');
      await process.locator('[data-agency-widget-step="2"]').click();
      assert.equal(await process.locator('[data-process-image-active="true"]').getAttribute('data-process-image-layer'),'2','Third image is already decoded');
      await process.locator('[data-agency-widget-step="1"]').click();
      assert.equal(await process.locator('[data-agency-widget-stage]').getAttribute('data-step'),'1','Process steps remain interactive');
      assert.equal(await process.locator('[data-agency-widget-counter]').textContent(),'2 / 3','Independent process counter follows stage');
      await first.locator('[data-agency-swap-to="1"]').click();
      assert.equal(await first.locator('[data-agency-card="1"]').getAttribute('data-pos'),'0','Optional first Card Swap changes');
      assert.equal(await second.locator('[data-agency-card="0"]').getAttribute('data-pos'),'0','Optional second Card Swap remains independent');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow at '+width);
      if(width===390||width===1440)await page.screenshot({path:path.join(root,'qa/agency-widgets-'+width+'.png'),fullPage:true});
    }
    // Desktop card uses its intended two columns and fits ordinary short viewports.
    for(const [width,height] of [[1280,720],[1440,900],[1024,600]]){
      await page.setViewportSize({width,height});
      const stage=page.locator('.sf-agency-widget--process .sf-agency-process');
      const geometry=await stage.evaluate(el=>{
        const rect=e=>e.getBoundingClientRect();
        const area=rect(el),card=el.querySelector('.sf-agency-process-stage'),foot=el.querySelector('.sf-agency-process-stage-foot');
        return {height:area.height,display:getComputedStyle(card).display,columns:getComputedStyle(card).gridTemplateColumns.split(' ').length,
          foot:rect(foot).bottom-area.top,card:rect(card).bottom-area.top};
      });
      assert.equal(geometry.display,'grid','Desktop stage uses the real two-column layout');
      assert.equal(geometry.columns,2,'Desktop process visual and text sit side by side');
      assert(geometry.height<=height+2&&geometry.foot<=geometry.card&&geometry.card<=height+2,'Desktop process fits viewport: '+JSON.stringify(geometry));
    }
    // Resize the same page, as mobile browser chrome changes the visible height.
    for(const [width,height] of [[390,844],[390,650],[430,932],[320,568]]){
      await page.setViewportSize({width,height});
      const stage=page.locator('.sf-agency-widget--process .sf-agency-process');
      const geometry=await stage.evaluate(el=>{
        const box=el.getBoundingClientRect(),cs=getComputedStyle(el);
        const wrap=el.querySelector('.sf-agency-wrap').getBoundingClientRect();
        const card=el.querySelector('.sf-agency-process-stage').getBoundingClientRect();
        const image=el.querySelector('.sf-agency-process-stage-visual').getBoundingClientRect();
        const foot=el.querySelector('.sf-agency-process-stage-foot').getBoundingClientRect();
        const layout=el.querySelector('.sf-agency-process-layout');
        const track=el.querySelector('.sf-agency-process-steps').getBoundingClientRect();
        const lastBar=el.querySelector('.sf-agency-process-step:last-child .sf-agency-process-bar').getBoundingClientRect();
        return {height:box.height,top:wrap.top-box.top,paddingTop:parseFloat(cs.paddingTop),
          layoutGap:getComputedStyle(layout).gap,layoutWidth:layout.getBoundingClientRect().width,
          trackWidth:track.width,trackRight:track.right,lastBarRight:lastBar.right,
          bottom:box.bottom-card.bottom,paddingBottom:parseFloat(cs.paddingBottom),
          imageHeight:image.height,footBottom:foot.bottom,cardBottom:card.bottom,overflow:el.scrollHeight>el.clientHeight+1};
      });
      assert(Math.abs(geometry.trackWidth-geometry.layoutWidth)<=2,
        'Three process steps fill the complete available layout width: '+JSON.stringify(geometry));
      assert(Math.abs(geometry.lastBarRight-geometry.trackRight)<=2,
        'Final progress bar reaches the right content edge: '+JSON.stringify(geometry));
      assert.equal(geometry.layoutGap,'0px','Legacy desktop 7% row gap must not survive on mobile');
      assert(Math.abs(geometry.top-geometry.paddingTop)<=1,'Process no longer floats vertically in unused space');
      assert(Math.abs(geometry.bottom-geometry.paddingBottom)<=1,'Process card fills remaining stage height');
      assert(geometry.imageHeight>=119,'Artwork retains a useful minimum');
      assert(geometry.footBottom<=geometry.cardBottom,'Next action stays inside the card');
      assert(!geometry.overflow,'Long process content grows the document instead of clipping');
      if(width>=390) assert(Math.abs(geometry.height-height)<=2,'Normal mobile process fits current viewport: '+JSON.stringify(geometry));
      await stage.screenshot({path:path.join(root,`qa/agency-process-height-${width}-${height}.png`)});
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
