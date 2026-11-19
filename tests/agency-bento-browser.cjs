// Browser geometry for the MONA four-card reference, independent of WordPress database.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const doc=execFileSync(process.env.PHP_BIN||'php',['tests/agency-pages.php','--render=bento'],{cwd:root,encoding:'utf8'});
const server=http.createServer((req,res)=>{
  const uri=new URL(req.url,'http://localhost').pathname;
  if(uri==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(doc);}
  const file=path.resolve(root,'.'+uri);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.statusCode=404;return res.end();}
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.jpg')?'image/jpeg':'text/plain');
  res.end(fs.readFileSync(file));
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
      const hero=page.locator('.sf-agency-widget--bento');
      assert.equal(await hero.count(),1,'Bento is isolated in its own component');
      assert.equal(await hero.locator('h2').textContent(),'Uzmanlık Alanları');
      assert.equal(await hero.locator('.cdl-bento__card').count(),4,'Exactly 4 original services');
      assert.equal(await hero.getByRole('link').count(),4,'Four accessible native navigation links');
      const snapshot=await hero.evaluate(el=>{
        const cards=[...el.querySelectorAll('.cdl-bento__card')].map(e=>({height:e.getBoundingClientRect().height,
          width:e.getBoundingClientRect().width,href:e.getAttribute('href'),text:e.innerText}));
        const photo=el.querySelector('.cdl-bento__photo');
        const section=el.querySelector('.cdl-bento').getBoundingClientRect();
        return {cards,photo:photo.complete&&photo.naturalWidth===1376,background:getComputedStyle(el.querySelector('.cdl-bento')).backgroundColor,
          overflow:document.documentElement.scrollWidth-innerWidth,sectionWidth:section.width,
          viewportLeft:section.left,tagCount:el.querySelectorAll('.cdl-bento__card--support .cdl-bento__support-action').length,
          phoneChrome:el.querySelectorAll('.phone-frame,.status-bar,.bottom-nav').length
        };
      });
      assert(snapshot.photo,'Supplied source JPEG loads');
      assert.equal(snapshot.background,'rgb(9, 9, 12)','Obsidian matches MONA welcome');
      assert(snapshot.overflow<=1,'No horizontal scrollbar at '+width);
      assert(Math.abs(snapshot.viewportLeft)<=1 && Math.abs(snapshot.sectionWidth-width)<=1,'Full-width handoff from hero');
      assert(snapshot.cards.every(card=>card.height>=70&&card.width>=100&&card.href&&card.href.includes('hizmetler')),'Every bento service has a usable destination');
      assert.equal(snapshot.phoneChrome,0,'No fake prototype phone chrome or duplicated native dock');
      assert.equal(snapshot.tagCount,1,'One reference support CTA');
      assert.deepEqual(errors,[],'No browser exceptions');
      await page.screenshot({path:path.join(root,'qa','agency-bento-'+width+'.png'),fullPage:true});
      await page.close();
    }
    console.log('MONA Services Bento: image/links and five responsive widths passed.');
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(err=>{console.error(err);server.close();process.exitCode=1;});
