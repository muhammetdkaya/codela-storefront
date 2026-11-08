const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const cssAccount=fs.readFileSync('theme/codela-storefront/assets/styles/account.css','utf8');
const cssOverlay=fs.readFileSync('theme/codela-storefront/assets/styles/account-overlay.css','utf8');
const cssQuick=fs.readFileSync('theme/codela-storefront/assets/styles/quick-login.css','utf8');
const markup=(overlay,active)=>`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body class="${overlay?'':'woocommerce-account'}">
${overlay?'<div id="sf-panel" class="is-account-panel"><div id="sf-account">':''}
<div class="woocommerce${active?' sf-passkey-active':''}">
<section class="sf-pk-guest" ${active?'':'hidden'}>Passkey</section>
<div class="sf-account-intro">Welcome</div>
<div id="customer_login">Native login</div>
<a class="sf-auth-register-cta">Register with email</a>
<div class="sf-auth-social">Google login</div>
</div>
${overlay?'</div></div>':''}</body></html>`;
(async()=>{
  const browser=await (process.env.TEST_WEBKIT==='1'?webkit:chromium).launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}});
    for (const overlay of [false,true]) {
      for (const active of [false,true]) {
        await page.setContent(markup(overlay,active));
        await page.addStyleTag({content:cssAccount+'\n'+cssOverlay+'\n'+cssQuick});
        const display=await page.locator('.sf-auth-register-cta').evaluate(el=>getComputedStyle(el).display);
        assert.equal(display==='none',active,
          `Registration visibility wrong for ${overlay?'instant overlay':'account page'} in ${active?'passkey':'native'} mode: ${display}`);
        const passkey=await page.locator('.sf-pk-guest').evaluate(el=>getComputedStyle(el).display);
        assert.equal(passkey!=='none',active,'Passkey only appears when recognized');
      }
    }
    await page.close();
    console.log('Passkey/native registration CSS visual isolation passed');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
