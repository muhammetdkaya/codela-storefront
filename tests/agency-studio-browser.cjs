// MONA reference stage 1: separate studio hero, no legacy selector cascade.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const doc=execFileSync(process.env.PHP_BIN||'php',['tests/agency-pages.php','--render=studio'],{cwd:root,encoding:'utf8'});
const server=http.createServer((req,res)=>{
  const p=new URL(req.url,'http://127.0.0.1').pathname;
  if(p==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(doc);}
  const f=path.resolve(root,'.'+p);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.statusCode=404;return res.end();}
  res.setHeader('Content-Type',f.endsWith('.css')?'text/css':f.endsWith('.js')?'application/javascript':f.endsWith('.jpg')?'image/jpeg':'text/plain');
  return res.end(fs.readFileSync(f));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||undefined});
  try{
    for(const [width,height] of [[320,667],[390,844],[402,874],[1440,900]]){
      const page=await browser.newPage({viewport:{width,height}});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:'+server.address().port+'/');
      await page.locator('.codela-monolith[data-scene-ready="true"]').waitFor();
      const hero=page.locator('.codela-studio-hero');
      assert.equal(await hero.count(),1,'Exactly one isolated Studio hero');
      assert.equal(await hero.locator('h1').count(),1,'Primary headline is accessible');
      const ui=await hero.evaluate(el=>{
        const scene=el.querySelector('.codela-studio-hero__visual .codela-monolith');
        const canvas=scene?.querySelector('.codela-monolith__canvas');
        const cta=el.querySelector('.codela-studio-hero__visual-foot a');
        const photoBox=el.querySelector('.codela-studio-hero__visual').getBoundingClientRect();
        const ctaBox=cta.getBoundingClientRect();
        return {sceneReady:!!scene && !!canvas && canvas.width>0 && canvas.height>0 && Math.abs(scene.getBoundingClientRect().height-photoBox.height)<2 && !!canvas.getContext('2d') && canvas.getContext('2d').getImageData(Math.floor(canvas.width/2),Math.floor(canvas.height/2),1,1).data[0]>0,
          background:getComputedStyle(el).backgroundColor,
          title:getComputedStyle(el.querySelector('h1')).color,
          fontFamily:getComputedStyle(el.querySelector('h1')).fontFamily,
          viewportLeft:el.getBoundingClientRect().left,
          viewportRight:el.getBoundingClientRect().right,
          heroHeight:el.getBoundingClientRect().height,
          photoHeight:photoBox.height,
          ctaVisible:ctaBox.bottom<=photoBox.bottom&&ctaBox.left>=photoBox.left,
          overflow:document.documentElement.scrollWidth-window.innerWidth};
      });
      assert(ui.sceneReady,'Architectural monolith canvas is painted and fills the media frame');
      assert.equal(ui.background,'rgb(9, 9, 12)','Obsidian surface stays isolated');
      assert.equal(ui.title,'rgb(245, 243, 247)','Title remains white');
      assert(!/Times New Roman/i.test(ui.fontFamily),'Studio typography uses system sans-serif');
      assert(Math.abs(ui.viewportLeft)<=1&&Math.abs(ui.viewportRight-width)<=1,
        'Hero fills the entire viewport without fixture browser margins');
      assert(ui.heroHeight>=height-1,'Hero at least fills mobile viewport');
      assert(ui.photoHeight>=200,'Cinematic spotlight scene stays visible on short phones');
      assert(ui.ctaVisible,'Services CTA remains inside the scene safe area');
      assert(ui.overflow<=1,'No horizontal overflow at '+width);
      assert.deepEqual(errors,[],'No browser JavaScript errors');
      await page.screenshot({path:path.join(root,'qa','agency-studio-'+width+'.png')});
      await page.close();
    }
    console.log('Studio hero: architectural monolith canvas, full viewport, 320/390/402/1440 widths passed.');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);server.close();process.exitCode=1});
