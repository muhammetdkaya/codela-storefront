// Real browser contract for the source-matched Contact Bento + live form.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const html=execFileSync(process.env.PHP_BIN||'php',['tests/agency-pages.php','--render=contact-bento'],{cwd:root,encoding:'utf8'});
const configured=execFileSync(process.env.PHP_BIN||'php',['tests/agency-pages.php','--render=contact-configured'],{cwd:root,encoding:'utf8'});
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost').pathname;
 if(u==='/'||u==='/configured'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(u==='/'?html:configured)}
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
  for(const [width,height] of [[320,667],[390,844],[402,874],[768,1024],[1280,720],[1440,900],[1920,1080],[2560,1440]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://www.openstreetmap.org/**',route=>route.fulfill({contentType:'text/html',body:'<html><body>Map fixture</body></html>'}));
   await page.route('https://unpkg.com/**',route=>route.abort());
   await page.goto('http://127.0.0.1:'+server.address().port+'/');
   const app=page.locator('.sf-agency-widget--contact-bento');
   assert.equal(await app.count(),1,'One isolated Contact Bento');
   assert.equal(await app.locator('.cdl-contact__grid>.cdl-contact__card--map').count(),1,'Map is the first card');
   assert.equal(await app.locator('.cdl-contact__grid>:first-child').getAttribute('class'),'cdl-contact__card--map cdl-contact__map-frame');
   assert.equal(await app.locator('.cdl-contact__card--primary').count(),1,'Original project card retained');
   assert.equal(await app.locator('.cdl-contact__action').count(),2,'Exactly two editorial action rows');
   assert.equal(await app.locator('.cdl-contact__card--strip').count(),0,'No redundant studio card');
   assert.equal(await app.locator('dialog.cdl-contact__sheet form').count(),1,'One real form');
   assert.equal(await app.locator('[name="agency_name"]').isVisible(),false,'Initially collapsed');
   assert.equal(await app.getByText('Neler yapıyoruz?').count(),0,'No services card');
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
   await app.locator('details#sf-agency-contact-form>summary').click();
   assert(await app.locator('dialog[open] [name="agency_name"]').isVisible(),'Row opens the real modal form');
   await app.locator('[data-contact-close]').click();
   assert.equal(await app.locator('[name="agency_name"]').isVisible(),false,'Sheet closes again');
   await app.locator('.cdl-contact__card--primary').click();
   assert(await app.locator('[name="agency_name"]').isVisible(),'Fallback project anchor opens the form');
   await page.screenshot({path:path.join(root,'qa','agency-contact-'+width+'.png'),fullPage:true});
   await page.goto('http://127.0.0.1:'+server.address().port+'/configured');
   assert.equal(await app.locator('[data-contact-map]').getAttribute('data-map-office'),'true','Configured office point');
   assert((await app.locator('.cdl-contact__map-fallback').getAttribute('src')).includes('marker=41.1%2C28.8'),'Fallback map displays marker');
   const rows=app.locator('.cdl-contact__action');
   assert.equal(await rows.count(),4,'Four parallel real contact actions');
   assert.deepEqual(await rows.locator('.cdl-contact__num').allTextContents(),['01','02','03','04']);
   assert.equal(await app.locator('[data-codela-contact="phone"]').getAttribute('href'),'tel:+905551234567');
   assert.equal(await app.locator('[data-codela-contact="email"]').getAttribute('href'),'mailto:hello@example.test');
   await app.locator('[data-contact-whatsapp] summary').click();
   await app.locator('.cdl-contact__wa-topic').nth(1).click();
   const message=await app.locator('[data-wa-preview]').textContent();
   assert(message.includes('e-ticaret mağazamız'));
   const link=await app.locator('[data-wa-launch]').getAttribute('href');
   assert(decodeURIComponent(link).includes('e-ticaret mağazamız'));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No configured contact overflow');
   await app.locator('[data-contact-whatsapp] summary').click();
   assert.equal(await app.locator('[data-wa-launch]').isVisible(),false);
   assert.deepEqual(errors,[],'Configured contact has no exceptions');
   await page.close();
  }
  // Real widget code, deterministic Leaflet boundary: validate native tile
  // contract, completion/error fallback, persistent credit and office marker.
  const mapPage=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,reducedMotion:'reduce'});
  await mapPage.route('https://www.openstreetmap.org/**',r=>r.fulfill({contentType:'text/html',body:'<html>Map fallback</html>'}));
  await mapPage.addInitScript(()=>{
    const events={};window.mapFixture={events};
    const map={setView(center,zoom){window.mapFixture.recenter={center,zoom};},invalidateSize(){}};
    window.L={map(host,options){window.mapFixture.options=options;return map;},
      tileLayer(url,options){window.mapFixture.tiles={url,options};return {on(name,fn){events[name]=fn;return this;},addTo(){events.loading();events.tileload();return this;}};},
      divIcon(options){return options;},marker(center,options){window.mapFixture.marker={center,options};return {addTo(){}};}};
  });
  await mapPage.goto('http://127.0.0.1:'+server.address().port+'/configured');
  await mapPage.waitForFunction(()=>window.mapFixture?.tiles);
  const mapContract=await mapPage.evaluate(()=>({tiles:window.mapFixture.tiles,options:window.mapFixture.options,marker:window.mapFixture.marker}));
  assert.equal(mapContract.tiles.url,'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  assert.equal(mapContract.tiles.options.detectRetina,false);
  assert(mapContract.tiles.options.maxNativeZoom>=mapContract.options.zoom+1);
  assert.equal(mapContract.options.zoom,15);
  assert.equal(mapContract.options.dragging,false);
  assert.equal(mapContract.marker.options.icon.html,'<i></i><b></b>');
  assert.deepEqual(mapContract.marker.center,[41.1,28.8]);
  const frame=mapPage.locator('[data-contact-map]');
  assert.notEqual(await frame.getAttribute('data-map-ready'),'true','One tile cannot hide fallback');
  await mapPage.evaluate(()=>window.mapFixture.events.load());
  assert.equal(await frame.getAttribute('data-map-ready'),'true');
  assert(await frame.locator('.cdl-contact__map-credit').isVisible(),'Map license credit stays visible');
  assert.equal(await frame.locator('.cdl-contact__map-chip,.cdl-contact__map-center,.cdl-contact__pin-label').count(),0,'No redundant map overlays');
  assert((await frame.locator('.cdl-contact__map-location').getAttribute('href')).includes('mlat=41.1&mlon=28.8'),'Exact external location remains available');
  await mapPage.evaluate(()=>{window.mapFixture.events.loading();window.mapFixture.events.tileload();window.mapFixture.events.tileerror();window.mapFixture.events.load();});
  assert.equal(await frame.getAttribute('data-map-ready'),'false','Tile failure restores fallback');
  assert(await frame.locator('.cdl-contact__map-fallback').isVisible());
  await mapPage.close();
  console.log('Contact Bento: responsive layouts, native form, quiet map contract and fallback passed.');
 }finally{await browser.close();await new Promise(done=>server.close(done))}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
