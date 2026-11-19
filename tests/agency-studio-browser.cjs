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
  res.setHeader('Content-Type',f.endsWith('.css')?'text/css':f.endsWith('.jpg')?'image/jpeg':'text/plain');
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
      const hero=page.locator('.codela-studio-hero');
      assert.equal(await hero.count(),1,'Exactly one isolated Studio hero');
      assert.equal(await hero.locator('h1').count(),1,'Primary headline is accessible');
      const ui=await hero.evaluate(el=>{
        const photo=el.querySelector('.codela-studio-hero__visual img');
        const cta=el.querySelector('.codela-studio-hero__visual-foot a');
        const photoBox=el.querySelector('.codela-studio-hero__visual').getBoundingClientRect();
        const ctaBox=cta.getBoundingClientRect();
        return {photoLoaded:photo.complete&&photo.naturalWidth===1200,
          background:getComputedStyle(el).backgroundColor,
          title:getComputedStyle(el.querySelector('h1')).color,
          heroHeight:el.getBoundingClientRect().height,
          photoHeight:photoBox.height,
          ctaVisible:ctaBox.bottom<=photoBox.bottom&&ctaBox.left>=photoBox.left,
          overflow:document.documentElement.scrollWidth-window.innerWidth};
      });
      assert(ui.photoLoaded,'Exact referenced hero photograph loads');
      assert.equal(ui.background,'rgb(9, 9, 12)','Obsidian surface stays isolated');
      assert.equal(ui.title,'rgb(245, 243, 247)','Title remains white');
      assert(ui.heroHeight>=height-1,'Hero at least fills mobile viewport');
      assert(ui.photoHeight>=200,'Cinematic photo stays legible on short phones');
      assert(ui.ctaVisible,'Services CTA is inside photograph safe area');
      assert(ui.overflow<=1,'No horizontal overflow at '+width);
      assert.deepEqual(errors,[],'No browser JavaScript errors');
      await page.screenshot({path:path.join(root,'qa','agency-studio-'+width+'.png')});
      await page.close();
    }
    console.log('Studio hero: reference photograph, full viewport, 320/390/402/1440 widths passed.');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);server.close();process.exitCode=1});
