const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('theme/codela-storefront/assets/scripts/panel-motion.js', 'utf8')
    .replace(/^export /gm, '').replace("import('codela-storefront/motion-mini')",'loadPanelFixture()');
const fixture = (vendor, native = () => ({cancel(){}}), loading = Promise.resolve({animate:vendor})) => {
    const styles = new Map();
    const element = {animate:native, style:{
        getPropertyValue:key=>styles.get(key)?.[0] || '',
        getPropertyPriority:key=>styles.get(key)?.[1] || '',
        setProperty:(key, value, priority = '')=>styles.set(key,[value,priority]),
        removeProperty:key=>styles.delete(key),
    }};
    const context = vm.createContext({loadPanelFixture:()=>loading});
    vm.runInContext(source + '\nthis.run=animatePanelTransform;this.ready=panelMotionReady;', context);
    return {element, ready:context.ready, run:options=>context.run(element, 'translateX(100%)', 'translateX(0)', options)};
};
(async()=>{
let settings, cancelled = 0, completed = 0;
const sample = fixture((element, frames, options) => {
    assert.equal(frames.transform[0], 'translateX(100%)');
    assert.equal(frames.transform[1], 'translateX(0)');
    settings = options;
    return {stop(){cancelled++;},cancel(){throw new Error('Motion cancellation must detach the native finish handler');}};
});
await sample.ready;
sample.element.style.setProperty('transform','translateX(2px)','important');
const first = sample.run({duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});
first.onfinish=()=>completed++;
assert.equal(settings.duration,.24,'Motion receives seconds');
assert.deepEqual(Array.from(settings.ease),[.2,.8,.2,1],'Exact CSS cubic bezier is preserved');
settings.onComplete();assert.equal(completed,1);
sample.element.style.setProperty('transform','translateX(0)');
first.cancel();first.cancel();settings.onComplete();
assert.equal(cancelled,1,'Cancellation is idempotent');assert.equal(completed,1,'Cancelled completion cannot run');
assert.equal(sample.element.style.getPropertyValue('transform'),'translateX(2px)');
assert.equal(sample.element.style.getPropertyPriority('transform'),'important');
let nativeCalls=0,nativeSettings,nativeMotion;
const fallback=fixture(()=>{throw new Error('Unsupported Motion runtime');},(frames,options)=>{
    nativeCalls++;nativeSettings=options;return nativeMotion={cancel(){cancelled++;}};
});
await fallback.ready;
const second=fallback.run({duration:180,easing:'ease-out'});second.onfinish=()=>completed++;
assert.equal(nativeCalls,1);assert.equal(nativeSettings.duration,180);assert.equal(nativeSettings.fill,'forwards');
const staleFinish=nativeMotion.onfinish;staleFinish();assert.equal(completed,2);second.cancel();assert.equal(nativeMotion.onfinish,null);staleFinish();assert.equal(completed,2);
assert.equal(fallback.element.style.getPropertyValue('transform'),'');
const absent=fixture(()=>{throw new Error('Must not start');});absent.element.animate=undefined;
assert.equal(absent.run({duration:240,easing:'ease-out'}),null,'No WAAPI is an immediate nonanimated fallback');
const zero=fixture(()=>{throw new Error('Must not start');});
assert.equal(zero.run({duration:0,easing:'ease-out'}),null,'Zero token never creates a pending animation');
const broken=fixture(()=>{throw new Error('Motion failed');},()=>{throw new Error('WAAPI failed');});
await broken.ready;
assert.equal(broken.run({duration:180,easing:'ease-out'}),null,'Both engines unavailable remain nonblocking');
let release, coldNative=0;
const cold=fixture(()=>{throw new Error('Not ready yet');},()=>{coldNative++;return {cancel(){}};},new Promise(resolve=>{release=resolve;}));
const immediate=cold.run({duration:240,easing:'ease-out'});
assert(immediate);assert.equal(coldNative,1,'Loading optional module never delays the first animation');immediate.cancel();
release({animate:()=>({stop(){}})});assert.equal(await cold.ready,true);
for(const loading of [Promise.reject(new Error('404 or blocked import')),Promise.resolve({animate:null})]) {
    let calls=0;const unavailable=fixture(null,()=>{calls++;return {cancel(){}};},loading);
    assert.equal(await unavailable.ready,false);assert(unavailable.run({duration:240,easing:'ease-out'}));assert.equal(calls,1);
}
console.log('Panel motion adapter: units/easing, cancellation identity, inline restoration, native/no-animation fallback passed.');
})().catch(error=>{console.error(error);process.exit(1)});
