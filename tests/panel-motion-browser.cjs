// One real PHP dialog, production styles and ESM modules. Optional immutable
// 0.1.195 controller allows an honest before/after run in the very same fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const {chromium, webkit, firefox} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = 'theme/codela-storefront/';
const header = execFileSync(process.env.PHP_BIN || 'php', ['tests/render-header.php'], {encoding:'utf8'}).replaceAll('https://store.test','https://motion.test');
const css = fs.readFileSync(root + 'assets/styles/storefront-base.css', 'utf8');
const baseline = process.env.PANEL_BASELINE_SOURCE && fs.readFileSync(process.env.PANEL_BASELINE_SOURCE, 'utf8');
const engine = process.env.TEST_WEBKIT ? 'webkit' : process.env.TEST_FIREFOX ? 'firefox' : 'chromium';
const engines = {chromium, webkit, firefox};
const output = 'qa/panel-motion';
const modes = [...(baseline ? ['baseline'] : []), 'motion', 'fallback', 'missing', 'aborted', 'invalid', 'bad-export', 'delayed', 'no-waapi'];
const imports = {
    'codela-storefront/overlay':'/assets/scripts/overlay-controller.js',
    'codela-storefront/panel-motion':'/assets/scripts/panel-motion.js',
    'codela-storefront/motion-mini':'/assets/vendor/motion-mini.js',
};
const setup = `
import {createOverlayController} from 'codela-storefront/overlay';
import {panelMotionReady} from 'codela-storefront/panel-motion';
panelMotionReady.then(ready => { window.vendorLoaded = ready; });
const $ = selector => document.querySelector(selector);
window.refreshes = 0;
window.overlay = createOverlayController({$, config:()=>({account:'https://motion.test/account/'}), t:key=>key,
    searchFeature:{start(){},cancel(){}},cartFeature:{getData:()=>({items:[]}),refresh(){window.refreshes++;}},
    mountDock(){},restoreDock(){},setDockCollapsed(){},markDockActive(){},mobileDock:()=>null,
    dockScrollPositions:new Map(),onMenuOpen(){}});
overlay.bind($('#sf-panel')); overlay.bind($('#sf-panel'));
document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-panel]');
    if (trigger) overlay.open(trigger.dataset.panel, event);
    else if (event.target.closest('.sf-close')) overlay.close();
});
window.ready = true;`;
const flush = page => page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const preference = async (page, value) => {
    await page.emulateMedia({reducedMotion:value});
    await page.waitForFunction(reduced=>matchMedia('(prefers-reduced-motion: reduce)').matches===reduced,value==='reduce');
    await flush(page);
};
async function mount(browser, mode) {
    const page = await browser.newPage({viewport:{width:1280,height:900}});
    const errors = [];
    let heldRoute, holdReady;
    const heldRequest = new Promise(resolve => { holdReady=resolve; });
    page.on('pageerror', error=>errors.push(error.message));
    await page.route('https://motion.test/**', route=>{
        const path = new URL(route.request().url()).pathname;
        if (path === '/assets/scripts/overlay-controller.js' && mode === 'baseline')
            return route.fulfill({contentType:'application/javascript',body:baseline});
        if (path === '/assets/vendor/motion-mini.js') {
            if (mode === 'fallback') return route.fulfill({contentType:'application/javascript',body:'export function animate(){throw new Error("Fixture unsupported Motion runtime")}'});
            if (mode === 'missing') return route.fulfill({status:404,contentType:'text/plain',body:'Fixture missing optional vendor'});
            if (mode === 'aborted') return route.abort('failed');
            if (mode === 'invalid') return route.fulfill({contentType:'application/javascript',body:'export function animate( INVALID MODULE'});
            if (mode === 'bad-export') return route.fulfill({contentType:'application/javascript',body:'export const animate = null;'});
            if (mode === 'delayed') { heldRoute=route;holdReady();return; }
        }
        if (path.includes('/assets/icons/')) return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(root+'assets/icons/'+path.split('/').at(-1))});
        if (path.startsWith('/assets/')) {
            const file = root + path.slice(1);
            return route.fulfill({contentType:path.endsWith('.js')?'application/javascript':'image/svg+xml',body:fs.readFileSync(file)});
        }
        return route.fulfill({contentType:'text/html; charset=utf-8',body:`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><script type="importmap">${JSON.stringify({imports})}</script><body>${header}<main style="height:3000px">Store</main>${mode==='no-waapi'?'<script>Element.prototype.animate=undefined</script>':''}<script type="module">${mode==='baseline'?setup.replace("import {panelMotionReady} from 'codela-storefront/panel-motion';", "const panelMotionReady = Promise.resolve(false);"):setup}</script></body></html>`});
    });
    await page.goto('https://motion.test/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.ready);
    return {page, errors, heldRequest, releaseVendor:()=>heldRoute.fulfill({contentType:'application/javascript',body:fs.readFileSync(root+'assets/vendor/motion-mini.js')})};
}
async function settle(page) {
    await page.waitForFunction(()=>!document.querySelector('#sf-panel').getAnimations({subtree:true}).some(animation=>
        animation.effect?.getKeyframes().some(frame=>frame.transform)));
    await flush(page);
}
async function geometry(page) {
    return page.locator('#sf-panel').evaluate(el=>{
        const rect = el.getBoundingClientRect(), style = getComputedStyle(el);
        return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,transform:style.transform,
            inlineTransform:el.style.transform,dialogs:document.querySelectorAll('#sf-panel').length,
            cart:document.querySelectorAll('#sf-cart').length,focus:document.activeElement?.className};
    });
}
(async()=>{
    fs.mkdirSync(output,{recursive:true});
    const browser = await engines[engine].launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
    const report = {engine,fixture:'Production PHP shell and identical empty/stub cart refresh; screenshots compare geometry, not populated commerce.',baselineSource:process.env.PANEL_BASELINE_SOURCE || null,modes:{}};
    try {
        for (const mode of modes) {
            const {page, errors, heldRequest, releaseVendor} = await mount(browser,mode);
            const result = report.modes[mode] = {geometry:{},samples:[]};
            if (mode === 'delayed') {
                await heldRequest;
                const early=await page.evaluate(()=>{
                    overlay.open('cart');const panel=document.querySelector('#sf-panel');
                    const animation=panel.getAnimations().find(a=>a.effect?.getKeyframes().some(frame=>frame.transform));
                    return {open:panel.open,fill:animation?.effect.getTiming().fill,duration:animation?.effect.getTiming().duration,loaded:window.vendorLoaded};
                });
                assert.equal(early.open,true,'Cart opens before optional module arrives');
                assert.equal(early.fill,'forwards','Pending vendor immediately uses native WAAPI');
                assert.equal(early.duration,240);assert.equal(early.loaded,undefined);
                await page.evaluate(()=>overlay.closeForNavigation());
                assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false);
                await page.evaluate(()=>{
                    overlay.open('cart');const panel=document.querySelector('#sf-panel');
                    window.pendingNative=panel.getAnimations().find(a=>a.effect?.getKeyframes().some(frame=>frame.transform));
                    pendingNative.pause();pendingNative.currentTime=72;
                });
                await releaseVendor();
            }
            await page.waitForFunction(()=>window.vendorLoaded!==undefined);
            result.vendorLoaded=await page.evaluate(()=>window.vendorLoaded);
            if(mode==='delayed') {
                result.upgrade=await page.evaluate(()=>{
                    const panel=document.querySelector('#sf-panel'),before=panel.getBoundingClientRect().x;
                    overlay.close();const animation=panel.getAnimations().find(a=>a.effect?.getKeyframes().some(frame=>frame.transform));animation.pause();
                    const value={jump:Math.abs(panel.getBoundingClientRect().x-before),fill:animation.effect.getTiming().fill,oldState:pendingNative.playState};
                    overlay.closeForNavigation();return value;
                });
                assert(result.upgrade.jump<.1,'Native-to-Motion handover retains current position');
                assert.equal(result.upgrade.fill,'both');assert.equal(result.upgrade.oldState,'idle');
            }
            assert.equal(result.vendorLoaded,!['baseline','missing','aborted','invalid','bad-export'].includes(mode),'Optional import settles safely: '+mode);
            for (const width of [320,390,700,701,900,901,1280,1440]) {
                await page.setViewportSize({width,height:900});await flush(page);
                const animation = await page.evaluate(()=>{
                    overlay.open('cart',{preventDefault(){},target:document.querySelector('.sf-header [data-panel="cart"]')});
                    const panel = document.querySelector('#sf-panel');
                    const drawer = panel.getAnimations().find(a=>a.effect?.getKeyframes().some(frame=>frame.transform));
                    return {duration:drawer?.effect.getTiming().duration || 0,fill:drawer?.effect.getTiming().fill,cartAnimations:document.querySelector('#sf-cart').getAnimations().length};
                });
                assert.equal(animation.duration,width>=901&&mode!=='no-waapi'?240:0,mode+' desktop only animation '+width);
                if(width>=901&&mode!=='no-waapi')assert.equal(animation.fill,['motion','delayed'].includes(mode)?'both':'forwards','Correct engine path: '+mode);
                if(width<901&&mode!=='no-waapi')assert(animation.cartAnimations>0,'Mobile keeps native content motion');
                await settle(page);
                const actual=result.geometry[width]=await geometry(page);
                assert.equal(actual.dialogs,1);assert.equal(actual.cart,1);assert.equal(actual.inlineTransform,'');
                assert.equal(actual.transform,'none',mode+' never leaves an inline containing block');
                if(width>=901){assert(actual.width<=460);assert(Math.abs(actual.x+actual.width-width)<1);}
                if(['baseline','motion','fallback'].includes(mode) && [390,1280].includes(width))await page.screenshot({path:`${output}/${engine}-${mode}-${width}.png`});
                await page.evaluate(()=>overlay.closeForNavigation());
                assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false);
            }
            await page.setViewportSize({width:1280,height:900});await flush(page);
            if(mode!=='no-waapi') {
                result.reversal = await page.evaluate(()=>{
                    const panel=document.querySelector('#sf-panel');
                    const active=()=>panel.getAnimations().find(a=>a.effect?.getKeyframes().some(frame=>frame.transform));
                    const x=()=>panel.getBoundingClientRect().x;
                    overlay.open('cart');let a=active();a.pause();a.currentTime=72;
                    const enterBefore=x();overlay.close();a=active();a.pause();
                    const closeAfter=x(),exitDuration=a.effect.getTiming().duration;
                    a.currentTime=54;const exitBefore=x();overlay.open('cart');a=active();a.pause();
                    const reopenAfter=x(),enterDuration=a.effect.getTiming().duration;
                    a.finish();overlay.close();const replacement=active();replacement.pause();
                    window.replacement=replacement;
                    return {enterBefore,closeAfter,exitBefore,reopenAfter,closeJump:Math.abs(enterBefore-closeAfter),reopenJump:Math.abs(exitBefore-reopenAfter),enterDuration,exitDuration};
                });
                assert.equal(result.reversal.enterDuration,240);assert.equal(result.reversal.exitDuration,180);
                if(mode!=='baseline') {
                    assert(result.reversal.closeJump<.1,mode+' close preserves sampled position '+JSON.stringify(result.reversal));
                    assert(result.reversal.reopenJump<.1,mode+' reopen preserves sampled position');
                }
                await flush(page);
                assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),true,'Queued old finish cannot close replacement');
                assert.equal(await page.evaluate(()=>replacement.playState),'paused','Replacement remains cancellable');
                assert.equal(await page.locator('#sf-panel').evaluate(el=>el.style.transform),'','No old Motion finish commits a stale endpoint');
                await page.evaluate(()=>overlay.open('cart'));await settle(page);
                assert.equal((await geometry(page)).inlineTransform,'');
                // Same action is idempotent and does not restart cart requests.
                assert.equal(await page.evaluate(()=>{const before=refreshes;for(let i=0;i<8;i++)overlay.open('cart');return refreshes-before;}),0);
                for(const next of ['menu','account','filters','search']) {
                    await page.evaluate(name=>{overlay.open('cart');overlay.close();overlay.open(name);},next);
                    await flush(page);
                    assert.equal(await page.locator('#sf-panel').evaluate(el=>el.style.transform),'','Switch to '+next+' clears drawer transform');
                    assert.equal(await page.evaluate(()=>overlay.getCurrent()),next);
                    await page.evaluate(()=>overlay.closeForNavigation());
                }
                // Five unpaused repeats capture scheduling/frame overhead, not a
                // claim about live LCP, INP or a physical device's smoothness.
                if(['baseline','motion','fallback'].includes(mode)) result.samples=await page.evaluate(async()=>{
                    const samples=[];let longTasks=0;
                    const observer=typeof PerformanceObserver==='function' && PerformanceObserver.supportedEntryTypes.includes('longtask')
                        ? new PerformanceObserver(list=>longTasks+=list.getEntries().length):null;
                    observer?.observe({type:'longtask'});
                    for(let i=0;i<5;i++){
                        let running=true,last=performance.now(),maxFrame=0,frames=0;
                        const tick=time=>{maxFrame=Math.max(maxFrame,time-last);last=time;frames++;if(running)requestAnimationFrame(tick);};
                        requestAnimationFrame(tick);const started=performance.now();overlay.open('cart');const startCost=performance.now()-started;
                        await new Promise(resolve=>setTimeout(resolve,300));overlay.close();
                        await new Promise(resolve=>{const check=()=>document.querySelector('#sf-panel').open?requestAnimationFrame(check):resolve();check();});
                        running=false;await new Promise(requestAnimationFrame);
                        samples.push({startCost,elapsed:performance.now()-started,maxFrame,frames});
                    }
                    observer?.disconnect();window.panelLongTasks=longTasks;return samples;
                });
                result.longTasks=await page.evaluate(()=>window.panelLongTasks || 0);
                // Reduced-motion flips during an active exit close synchronously.
                await page.evaluate(()=>{overlay.open('cart');overlay.close();});
                await preference(page,'reduce');
                assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false);
                await page.evaluate(()=>{overlay.open('cart');overlay.close();});
                assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false);
                await preference(page,'no-preference');
                // Breakpoint changes preserve the real cart and detach motion.
                await page.evaluate(()=>overlay.open('cart'));
                await page.setViewportSize({width:900,height:900});await flush(page);
                assert.equal(await page.evaluate(()=>overlay.getCurrent()),'cart');
                assert.equal((await geometry(page)).inlineTransform,'');
                assert.equal((await geometry(page)).transform,'none');
                await page.setViewportSize({width:1280,height:900});await flush(page);
                await page.evaluate(()=>overlay.close());
                await page.setViewportSize({width:900,height:900});await flush(page);
                assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false,'Resize during exit finishes close');
                await page.setViewportSize({width:1280,height:900});await flush(page);
            }
            await page.evaluate(()=>scrollTo(0,500));
            const opener=page.locator('.sf-header [data-panel="cart"]');
            // Programmatic click avoids Playwright scrolling the fixed header.
            await opener.evaluate(el=>{el.focus({preventScroll:true});el.click();});
            await settle(page);
            assert.equal(await page.locator('.sf-panel-top .sf-close').evaluate(el=>el===document.activeElement),true,'Native dialog initial focus');
            await page.keyboard.press('Tab');
            assert.equal(await page.locator('.sf-initial-focus').count(),0,'Keyboard focus indicator is restored');
            await page.keyboard.press('Escape');
            await page.waitForFunction(()=>!document.querySelector('#sf-panel').open);await flush(page);
            assert.equal(await opener.evaluate(el=>el===document.activeElement),true,'Escape restores original focus');
            assert.equal(await page.evaluate(()=>scrollY),500,'Original scroll restored');
            assert.equal(await page.evaluate(()=>document.body.style.position),'','Scroll lock cleared');
            await page.evaluate(()=>{overlay.open('cart');overlay.close();overlay.closeForNavigation();});
            await flush(page);
            assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false,'Navigation never waits for motion');
            assert.equal(await page.locator('#sf-panel').evaluate(el=>el.style.transform),'');
            assert.deepEqual(errors,[]);await page.close();
        }
        for(const mode of modes.filter(mode=>mode!=='motion'))for(const width of [320,390,700,701,900,901,1280,1440]) {
            const expected=report.modes.motion.geometry[width],actual=report.modes[mode].geometry[width];
            for(const dimension of ['x','y','width','height'])assert(Math.abs(actual[dimension]-expected[dimension])<.1,mode+' same '+dimension+' at '+width);
        }
        fs.writeFileSync(`${output}/${engine}-comparison.json`,JSON.stringify(report,null,2)+'\n');
        console.log('Panel motion pilot passed ('+engine+'): '+modes.join(', ')+', 8 widths, interruption/reversal, same-task finish race, switches, focus/scroll, reduced motion, resize and navigation.');
        console.log(JSON.stringify(Object.fromEntries(Object.entries(report.modes).map(([mode,value])=>[mode,{reversal:value.reversal,longTasks:value.longTasks,samples:value.samples}]))));
    } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
