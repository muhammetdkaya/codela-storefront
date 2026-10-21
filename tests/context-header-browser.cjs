const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/assets/';
const css=['storefront.css','styles/tokens.css','styles/overlay.css','styles/navigation.css','styles/components.css'].map(p=>fs.readFileSync(root+p,'utf8')).join('\n');
(async()=>{
 const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch();
 try{
  for(const width of [320,390,700,1280]){
   const page=await browser.newPage({viewport:{width,height:844}});
   for(const [name,env,title,back] of [
    ['hub',{FIXTURE_ACCOUNT:'1'},'My account',null],
    ['orders',{FIXTURE_ACCOUNT:'1',FIXTURE_ENDPOINT:'orders'},'Siparişlerim','https://store.test/myaccount/'],
    ['page',{FIXTURE_PAGE:'1'},'Hakkımızda','https://store.test/'],
    ['long',{FIXTURE_PAGE:'1',FIXTURE_PAGE_TITLE:'Çok uzun bir sayfa başlığının dar ekranda görünümü'},'Çok uzun', 'https://store.test/'],
    ['home',{},'CODELA','https://store.test/'],
   ]){
    const html=execFileSync('php',['tests/render-header.php'],{encoding:'utf8',env:{...process.env,...env}});
    await page.setContent('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}'+css+'</style></head><body>'+html+'</body></html>');
    const brand=page.locator('.sf-header .sf-brand'), menu=page.locator('.sf-menu-trigger');
    assert((await brand.innerText()).includes(title),'Correct page context');
    const b=await brand.boundingBox(),m=await menu.boundingBox();
    assert.equal(Math.round(b.height),44,'Shared logo capsule height');
    assert(b.x+b.width<=m.x || width>700,'Long title does not collide with mobile menu');
    assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'No page overflow');
    if(back)assert.equal(await brand.locator('a').getAttribute('href'),back,'Native fallback destination');
    else assert.equal(await brand.locator('a').count(),0,'Root account title is not a misleading back link');
    if(width===390){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/storefront-ui-kit-context-${name}-${process.env.TEST_WEBKIT?'webkit':'chromium'}.png`});}
   }
   await page.close();
  }
 }finally{await browser.close();}
 console.log('Context header: native destinations, 44px shared capsule, long labels and mobile menu clearance passed.');
})().catch(e=>{console.error(e);process.exit(1)});
