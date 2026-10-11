const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const css=fs.readFileSync('theme/codela-storefront/assets/storefront.css','utf8');
const render=env=>execFileSync(process.env.PHP_BIN||'php',['tests/render-account.php'],{encoding:'utf8',env:{...process.env,...env}});
const intro=render({});
const signed=render({ACCOUNT_SIGNED_IN:'1'});
assert(intro.includes('Welcome back'));
assert(signed.includes('My account'));
assert.equal(render({ACCOUNT_OUTSIDE:'1'}),'','Do not inject account heading elsewhere');
const fields='<p class="woocommerce-form-row form-row"><label for="username">Email address</label><input class="woocommerce-Input input-text" id="username" type="email" autocomplete="username" required></p>'+
'<p class="woocommerce-form-row form-row"><label for="password">Password</label><input class="woocommerce-Input input-text" id="password" type="password" autocomplete="current-password" required></p>'+
'<p class="form-row"><label class="woocommerce-form__label woocommerce-form-login__rememberme"><input type="checkbox" name="rememberme"><span>Remember me</span></label><button class="woocommerce-button woocommerce-form-login__submit" type="submit">Log in</button></p>'+
'<p class="woocommerce-LostPassword lost_password"><a href="/account/lost-password/">Lost password?</a></p>';
const form='<h2>Log in</h2><form class="woocommerce-form woocommerce-form-login login" method="post">'+fields+'</form>';
const login='<div class="woocommerce">'+intro+form+'</div>';
const register='<div class="woocommerce">'+intro+'<div class="u-columns col2-set" id="customer_login"><div class="u-column1 col-1">'+form+'</div><div class="u-column2 col-2"><h2>Register</h2><form class="woocommerce-form woocommerce-form-register register"><p class="form-row"><label for="reg_email">Email</label><input class="input-text" type="email" id="reg_email"></p><button type="submit">Register</button></form></div></div></div>';
const logged='<div class="woocommerce">'+signed+'<nav class="woocommerce-MyAccount-navigation"><ul><li class="is-active"><a href="/account/" aria-current="page">Dashboard</a></li><li><a href="/orders/">Orders</a></li><li><a href="/addresses/">Addresses</a></li></ul></nav><div class="woocommerce-MyAccount-content"><h2>My orders</h2><p>Account details here.</p></div></div>';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-gpu','--use-gl=disabled','--disable-software-rasterizer','--disable-dev-shm-usage','--no-zygote','--single-process']}:{})});
 try {
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:850},isMobile:width===390,hasTouch:width===390});
   for(const [type,markup] of [['login',login],['register',register],['logged',logged]]){
    const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body class="woocommerce-account"><main class="sf-content"><h1 class="wp-block-post-title">My Account</h1>'+markup+'</main></body></html>';
    await page.setContent(html);
    const info=await page.evaluate(()=>{
     return {overflows:document.documentElement.scrollWidth>innerWidth+1,
       titleVisible:getComputedStyle(document.querySelector('.wp-block-post-title')).display!=='none',
       focus:document.activeElement.tagName};
    });
    assert(!info.overflows,type+' must not overflow viewport '+width);
    assert.equal(info.titleVisible,false,'Duplicated WP title hidden with intro present');
    if(type==='login'||type==='register'){
      assert.equal(await page.locator('form.woocommerce-form').count(),type==='login'?1:2,'Native Woo forms remain present');
      const input=page.locator('#username');
      assert.equal(await input.evaluate(el=>getComputedStyle(el).fontSize),'16px','Avoid mobile keyboard zoom');
      assert((await input.boundingBox()).height>=46,'Text input is touch accessible');
      assert((await page.locator('.woocommerce-form-login__submit').boundingBox()).height>=48,'Submit has adequate target');
      assert.equal(info.focus,'BODY','Opening account should not autofocus input');
    } else {
      const nav=page.locator('.woocommerce-MyAccount-navigation');
      const content=page.locator('.woocommerce-MyAccount-content');
      assert(await nav.isVisible()&&await content.isVisible(),'Account navigation and content displayed');
      const a=await nav.boundingBox(),b=await content.boundingBox();
      if(width===390)assert(b.y>a.y,'Mobile content below nav');
      else assert(b.x>a.x,'Desktop content beside nav');
    }
   }
   await page.close();
  }
  console.log('Woo account intro, login/register and dashboard responsive layout: passed.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
