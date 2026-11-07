// Isolated visual regressions for iOS account choices and PIN panel geometry.
// The native PIN verification/network tests remain in quick-login-browser.cjs.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base='theme/codela-storefront/assets/styles/';
const css=['quick-login.css','account.css','account-overlay.css'].map(x=>fs.readFileSync(base+x,'utf8')).join('\n');
(async()=>{
 const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body class="woocommerce-account"><div class="woocommerce"><button class="sf-quick-google" disabled>Google</button><div class="sf-auth-social"><button class="sf-auth-google" disabled>Google</button></div></div><div id="sf-panel" class="is-account-panel"><button class="sf-auth-google" disabled>Google</button></div><section class="sf-quick-sheet"><div style="height:300px"></div></section></body></html>');
  for(const selector of ['.sf-quick-google','.woocommerce .sf-auth-google','#sf-panel .sf-auth-google']){
    const result=await page.locator(selector).evaluate(el=>{
      const st=getComputedStyle(el);return {background:st.backgroundColor,opacity:st.opacity};
    });
    assert.equal(result.background,selector==='.sf-quick-google'
      ? 'rgb(37, 38, 40)' : 'rgb(255, 255, 255)',
      selector+' retains its configured visual surface');
    assert.equal(result.opacity,'1',selector+' full contrast even when disabled');
  }
  const closed=await page.locator('.sf-quick-sheet').evaluate(el=>el.getBoundingClientRect().bottom);
  assert(Math.abs(closed-844)<2,'Sheet rests on layout viewport when keyboard is absent');
  const opened=await page.locator('.sf-quick-sheet').evaluate(el=>{
    el.classList.add('has-keyboard');
    el.style.setProperty('--sf-quick-visual-height','430px');
    el.style.setProperty('--sf-quick-visual-top','142px');
    return {top:el.getBoundingClientRect().top,
      maxHeight:getComputedStyle(el).maxHeight};
  });
  assert(Math.abs(opened.top-142)<2,'Keyboard mode uses measured visual top, not double lift');
  assert.equal(opened.maxHeight,'430px','Sheet can scroll in a reduced viewport');
  await page.locator('.sf-quick-sheet').evaluate(el=>{
    el.classList.remove('has-keyboard');
    el.style.removeProperty('--sf-quick-visual-top');
    el.style.removeProperty('--sf-quick-visual-height');
  });
  const restored=await page.locator('.sf-quick-sheet').evaluate(el=>el.getBoundingClientRect().bottom);
  assert(Math.abs(restored-844)<2,'Keyboard dismissal restores true bottom anchoring');
  console.log('Account Google and PIN visual states passed in '+(process.env.TEST_WEBKIT?'WebKit':'Chromium'));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
