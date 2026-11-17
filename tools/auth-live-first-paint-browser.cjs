const assert = require('node:assert/strict');
const {webkit, chromium} = require('playwright');

(async()=>{
  for (const [name, engine] of [['webkit',webkit],['chromium',chromium]]) {
    const browser = await engine.launch({headless:true});
    for (const blocked of [true,false]) {
      const context = await browser.newContext({
        viewport:{width:402,height:874},deviceScaleFactor:3,isMobile:true,hasTouch:true
      });
      const page = await context.newPage();
      const browserErrors=[];
      page.on('pageerror',err=>browserErrors.push(err.message.slice(0,200)));
      if (blocked) await page.route(/auth-smart\.js(?:\?|$)/,route=>
        route.fulfill({status:200,contentType:'text/javascript',body:''}));
      await page.goto('https://codela.dev/hesabim/',{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForTimeout(850);
      const state=await page.evaluate(()=>{
        const intro=document.querySelector('.sf-account-intro');
        const shell=document.querySelector('.woocommerce > .sf-smart-auth');
        const native=document.querySelector('#customer_login')||document.querySelector('form.woocommerce-form-login');
        const display=el=>el?{display:getComputedStyle(el).display,visibility:getComputedStyle(el).visibility,
          bounds:{w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)}}:null;
        return {
          title:intro?.querySelector('.sf-auth-heading-text')?.textContent?.trim(),
          hasSSR:!!document.querySelector('[data-sf-auth-rendered="server"]'),
          ssrClass:document.documentElement.classList.contains('sf-auth-ssr-enabled'),
          ready:!!document.querySelector('.woocommerce.sf-smart-auth-active'),
          smart:display(shell),native:display(native),
          cssLoaded:[...document.styleSheets].some(s=>s.href?.includes('/auth-smart.css')),
          quickChecking:document.documentElement.classList.contains('sf-quick-checking')
        };
      });
      console.log(name,blocked?'NO_SMART_JS':'NORMAL',JSON.stringify(state));
      if(browserErrors.length) console.log(name,'PAGE_ERRORS',JSON.stringify(browserErrors.slice(0,3)));
      assert(state.hasSSR,name+' must receive PHP first-paint marker');
      assert(state.smart?.bounds.h>0,name+' first visible screen must be final email field');
      assert(state.native?.bounds.h===0,name+' native Woo form cannot occupy first paint');
      if (!blocked) assert(state.ready,name+' should bind the PHP field without duplicating it');
      await context.close();
    }
    await browser.close();
  }
})().catch(err=>{console.error(err);process.exitCode=1});
