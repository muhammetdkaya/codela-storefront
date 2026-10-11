// Private UI Kit reference made from the actual production PHP components.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const php=process.env.PHP_BIN||'php';
const controls=execFileSync(php,['tests/render-ui.php'],{encoding:'utf8'});
const header=execFileSync(php,['tests/render-header.php'],{encoding:'utf8'});
const css=['assets/styles/tokens.css','assets/storefront.css','assets/styles/overlay.css','assets/styles/navigation.css','assets/styles/components.css']
 .map(p=>fs.readFileSync('theme/codela-storefront/'+p,'utf8')).join('\n');
const demoCSS=[
'body{background:#f8f7f4;color:#22231f;font:14px system-ui,sans-serif}',
'.qa-page{max-width:940px;margin:30px auto 130px;padding:0 18px}',
'.qa-title{font-size:28px;font-weight:500;letter-spacing:-.04em}',
'.qa-note{color:#77776d;line-height:1.7}',
'.qa-section{background:#fff;border:1px solid #deded5;border-radius:18px;padding:24px;margin:18px 0}',
'.qa-section h2{font-size:16px;margin:0 0 18px;font-weight:600}',
'.qa-controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap}',
'.qa-controls>.sf-ui-icon-button,.qa-controls>.sf-ui-button{flex-shrink:0}',
'.qa-controls button,.qa-controls a{min-width:44px}',
'.qa-legend{color:#77776d;font-size:12px;margin-top:16px}',
'@media(max-width:700px){.qa-page{margin-top:18px}.qa-section{padding:16px;border-radius:14px}}',
].join('\n');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-gpu','--use-gl=disabled','--disable-software-rasterizer','--disable-dev-shm-usage','--no-zygote','--single-process']}:{})});
 try{
  fs.mkdirSync('qa',{recursive:true});
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:940},deviceScaleFactor:1});
   const html='<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'\n'+demoCSS+'</style></head><body><div class="sf-shell">'+header+'<main class="qa-page"><h1 class="qa-title">Storefront UI Kit</h1><p class="qa-note">Shared controls, consistent feedback and accessibility states.</p><section class="qa-section"><h2>Icon controls and actions</h2><div class="qa-controls">'+controls+'</div><p class="qa-legend">Standard · Soft · Clear · Primary · Disabled · Loading · Secondary</p></section><section class="qa-section"><h2>Control states</h2><div class="qa-controls"><button type="button" class="sf-ui-button sf-ui-button--primary">Normal</button><button type="button" disabled class="sf-ui-button sf-ui-button--secondary">Disabled</button><button type="button" class="sf-ui-button sf-ui-button--quiet" aria-busy="true" disabled>Loading</button></div></section></main></div></body></html>';
   await page.setContent(html);
   const preview=page.locator('.qa-page');
   assert(await preview.isVisible());
   assert((await page.locator('.sf-ui-icon-button').count())>=2);
   await page.screenshot({path:'qa/storefront-ui-kit-'+width+'.png',fullPage:true,animations:'disabled'});
   await page.close();
  }
  console.log('Private UI Kit visual references generated for two viewport sizes.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
