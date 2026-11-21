/* Responsive Agency screen geometry — real PHP widgets, no mocked cards.
   Cross-check home with and without the native dock; inner pages include
   the existing header offset. Scrolling remains free between proximity points. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
function render(name){
  return execFileSync(process.env.PHP_BIN||'php',['tests/agency-pages.php','--render='+name],
    {cwd:root,encoding:'utf8'});
}
function block(doc){
  const start='<div class="codela-page-layout">';
  const a=doc.indexOf(start),b=doc.lastIndexOf('</div></main>');
  assert(a>=0&&b>a,'Real PHP layout wrapper: '+doc.slice(0,90));
  return doc.slice(a+start.length,b);
}
const studio=block(render('studio'));
const bento=block(render('bento'));
const detail=block(render('detail'));
const contact=block(render('contact-bento'));
const project=block(render('project'));
const processPage=block(render('process'));
const cssFiles=['storefront-base.css','agency.css','agency-project.css'];
function fixture(page,dock){
  const home=page==='home';
  const contents={home:studio+bento,detail,contact,project,process:processPage};
  return '<!doctype html><html lang="tr"><head><meta charset="utf-8">'
    +'<meta name="viewport" content="width=device-width,initial-scale=1">'
    +cssFiles.map(x=>'<link rel="stylesheet" href="/theme/codela-storefront/assets/styles/'+x+'">').join('')
    +'</head><body class="'+(home?'home':'')+'">'
    +'<div class="sf-shell '+(dock?'has-mobile-dock':'has-header-tools')+'">'
    +'<header class="sf-header"></header>'
    +(dock?'<nav class="sf-mobile-dock"><div class="sf-dock-surface">Dock</div></nav>':'')
    +'</div><main class="sf-content"><div class="codela-page-layout">'
    +contents[page]+'</div></main><footer class="sf-footer"><div>codela.dev</div></footer></body></html>';
}
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/'){
    res.setHeader('Content-Type','text/html; charset=utf-8');
    return res.end(fixture(url.searchParams.get('page')||'home',url.searchParams.get('dock')==='1'));
  }
  const file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.statusCode=404;return res.end();
  }
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.svg')?'image/svg+xml':'text/plain');
  res.end(fs.readFileSync(file));
});
const rect=e=>{
  if(!e)return null;
  const r=e.getBoundingClientRect();
  return {top:r.top,bottom:r.bottom,height:r.height,left:r.left,right:r.right};
};
(async()=>{
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||undefined});
  const base='http://127.0.0.1:'+server.address().port+'/';
  try{
    for(const [width,height] of [[390,844],[402,874],[320,667],[1280,900]]){
      for(const dock of [false,true]){
        const page=await browser.newPage({viewport:{width,height}});
        await page.goto(base+'?page=home&dock='+(dock?'1':'0'));
        const boxes=await page.evaluate(()=>{
          const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};
          return {hero:rect(document.querySelector('.codela-studio-hero')),
            photo:rect(document.querySelector('.codela-studio-hero__visual')),
            bento:rect(document.querySelector('.cdl-bento')),
            footer:rect(document.querySelector('.sf-footer')),
            bodyPadding:getComputedStyle(document.body).paddingBottom,
            snap:getComputedStyle(document.documentElement).scrollSnapType,
            snapMatch:document.documentElement.matches('html:has(body.home .codela-page-layout > .sf-agency-widget--studio + .sf-agency-widget--bento)'),
            direct:!!document.querySelector('body.home .codela-page-layout > .sf-agency-widget--studio + .sf-agency-widget--bento'),
            supported:CSS.supports('scroll-snap-type','y proximity'),
            overflow:document.documentElement.scrollWidth-innerWidth};
        });
        assert(boxes.hero&&boxes.photo&&boxes.bento,'Real Studio + Bento rendered');
        assert(Math.abs(boxes.bento.top-boxes.hero.bottom)<=2,
          'No blank handoff between adjacent full-width stages: '+JSON.stringify(boxes));
        assert(boxes.hero.height>=height-2,'Studio stage spans safe viewport '+width+'x'+height);
        if(width<740){
          assert(boxes.hero.bottom-boxes.photo.bottom<(dock?115:65),
            'Photo must fill the stage, without previous 110px dead zone: '+JSON.stringify(boxes));
          assert(boxes.bodyPadding==='0px','No trailing body dock reserve on Agency');
        }
        assert(boxes.overflow<=2,'No horizontal overflow: '+JSON.stringify(boxes));
        assert(/^y(?: proximity)?$/.test(boxes.snap),'Home sections use gentle proximity snap (browsers serialize proximity as y): '+JSON.stringify(boxes));
        console.log('Agency stage:',width,height,'dock',dock,'photo-tail',Math.round(boxes.hero.bottom-boxes.photo.bottom),
          'snap',boxes.snap,'overflow',boxes.overflow);
        if(width===390){
          await page.screenshot({path:path.join(root,'qa','agency-viewport-home-'+(dock?'dock':'no-dock')+'.png')});
        }
        await page.close();
      }
    }
    for(const kind of ['detail','contact','project','process']){
      for(const height of [667,844]){
        const width=390;
        const page=await browser.newPage({viewport:{width,height}});
        await page.goto(base+'?page='+kind+'&dock=0');
        const snap=await page.evaluate(kind=>{
          const selector={detail:'.cdl-service-detail',contact:'.cdl-contact',
            project:'.cdl-project',process:'.sf-agency-widget--process .sf-agency-process'}[kind];
          const target=document.querySelector(selector);
          const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}};
          const visual=kind==='process'?document.querySelector('.sf-agency-widget--process .sf-agency-process-stage-visual'):null;
          return {area:rect(target),visual:rect(visual),footer:rect(document.querySelector('.sf-footer')),
            overflow:document.documentElement.scrollWidth-window.innerWidth,
            minHeight:getComputedStyle(target).minHeight,
            snap:getComputedStyle(document.documentElement).scrollSnapType};
        },kind);
        assert(snap.area,'Actual Agency inner widget: '+kind);
        assert(snap.overflow<=2,'Inner page must not overflow horizontally: '+kind);
        assert(snap.snap==='none','Form/detail pages retain entirely free scrolling: '+kind);
        if(kind!=='process'){
          assert(snap.area.height>=height-68-2,'First Agency inner stage fills viewport beneath existing native header: '+kind);
          assert(Math.abs(snap.area.top-68)<=1,
            'Native header occupies exactly one 68px reserve: '+kind+' '+JSON.stringify(snap));
        } else if(height===844) {
          assert(snap.visual.height>=120 && snap.visual.height<snap.area.height,'Process artwork fills available space with a safe minimum');
          assert(Math.abs(snap.area.height-(height-68))<=2,'Inner process fills the viewport below the native header');
        }
        console.log('Agency inner:',kind,width,height,'stage',Math.round(snap.area.height),'top',Math.round(snap.area.top));
        if(height===844)await page.screenshot({path:path.join(root,'qa','agency-viewport-'+kind+'.png')});
        await page.close();
      }
    }
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
    await page.goto(base+'?page=home&dock=0');
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollSnapType),'none',
      'Reduced-motion visitors are never snapped');
    await page.close();
    console.log('Agency viewport composition: dock, full stages, native header, free-scroll forms passed.');
  }finally{
    await browser.close();await new Promise(done=>server.close(done));
  }
})().catch(err=>{console.error(err);server.close();process.exitCode=1});
