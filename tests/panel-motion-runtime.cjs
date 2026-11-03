// Execute the pinned, distributed Motion build, not a substitute engine. The
// small WAAPI boundary here tests callback/style ownership; browser fixtures
// separately validate native rendering, focus, geometry and interruption.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {panelMotionSource} = require('./helpers/inline-storefront.cjs');
const tasks=[];
class Surface extends EventTarget {
    constructor(){
        super();this.isConnected=true;this.animations=[];this.values=new Map();
        this.style={getPropertyValue:key=>this.values.get(key)?.[0]||'',getPropertyPriority:key=>this.values.get(key)?.[1]||'',
            setProperty:(key,value,priority='')=>this.values.set(key,[value,priority]),removeProperty:key=>this.values.delete(key)};
        Object.defineProperty(this.style,'transform',{get:()=>this.style.getPropertyValue('transform'),set:value=>this.style.setProperty('transform',value)});
    }
    animate(frames,options){
        const element=this;
        const animation={playState:'running',currentTime:0,playbackRate:1,onfinish:null,
            effect:{getComputedTiming:()=>({duration:options.duration})},frames,options,
            pause(){this.playState='paused';},play(){this.playState='running';},
            commitStyles(){element.style.transform='matrix(1, 0, 0, 1, 120, 0)';},
            cancel(){this.playState='idle';},
            finish(){this.playState='finished';this.currentTime=options.duration;tasks.push(()=>this.onfinish?.());},
        };
        this.animations.push(animation);return animation;
    }
}
(async()=>{
const context=vm.createContext({EventTarget,performance,queueMicrotask});
vm.runInContext(panelMotionSource()+'\nthis.animatePanel=animatePanelTransform;this.vendor=__codelaMotionMini.animate;this.ready=panelMotionReady;',context);
await context.ready;
const options={duration:240,easing:'cubic-bezier(.2,.8,.2,1)'};
let completes=0;
const element=new Surface();
const first=context.animatePanel(element,'translateX(100%)','translateX(0)',options);
first.onfinish=()=>{completes++;first.cancel();};
assert.equal(element.animations.length,1,'Pinned Motion runtime starts native animation');
assert.equal(element.animations[0].options.duration,240);
assert.equal(element.animations[0].options.easing,'cubic-bezier(0.2, 0.8, 0.2, 1)');
assert.equal(element.animations[0].options.fill,'both','Motion path, not catch/native fallback, was used');
element.animations[0].finish();tasks.shift()();
assert.equal(completes,1);assert.equal(element.style.transform,'','Completed Motion inline endpoint is restored');
const closing=context.animatePanel(element,'translateX(0)','translateX(100%)',{...options,duration:180});
closing.onfinish=()=>{completes++;};
const closingNative=element.animations.at(-1);closingNative.finish();closing.cancel();
assert.equal(closingNative.onfinish,null,'stop() detaches queued native finish before replacement');
const reopened=context.animatePanel(element,'matrix(1, 0, 0, 1, 120, 0)','translateX(0)',options);
reopened.onfinish=()=>{completes++;reopened.cancel();};
tasks.shift()();
assert.equal(completes,1);assert.equal(element.style.transform,'','Queued old finish cannot contaminate inline transform');
assert.equal(element.animations.at(-1).playState,'running');
element.animations.at(-1).finish();tasks.shift()();assert.equal(completes,2);assert.equal(element.style.transform,'');
// The corrected-native comparator uses this exact production helper with only
// its optional import skipped. No vendor code is loaded and no exception cost
// is added to the measured animation path.
const nativeContext=vm.createContext({EventTarget});
const nativeSource=fs.readFileSync('theme/codela-storefront/assets/scripts/panel-motion.js','utf8')
    .replace(/^export /gm,'').replace("import('codela-storefront/motion-mini')",'Promise.resolve({})');
vm.runInContext(nativeSource+'\nthis.animatePanel=animatePanelTransform;this.ready=panelMotionReady;',nativeContext);
assert.equal(await nativeContext.ready,false);
assert.equal(nativeContext.__codelaMotionMini,undefined,'Native comparator loads no Motion build');
const nativeElement=new Surface();
const nativeMotion=nativeContext.animatePanel(nativeElement,'translateX(100%)','translateX(0)',options);
assert.equal(nativeElement.animations[0].options.fill,'forwards');
assert.equal(nativeElement.animations[0].options.duration,240);
nativeElement.animations[0].finish();nativeMotion.cancel();tasks.shift()();
assert.equal(nativeElement.animations[0].onfinish,null);assert.equal(nativeElement.style.transform,'');
// Negative control proves why the adapter cannot just use Motion.cancel().
const raw=new Surface(),controls=context.vendor(raw,{transform:['translateX(0)','translateX(100%)']},{duration:.18});
raw.animations[0].finish();controls.cancel();tasks.shift()();
assert.equal(raw.style.transform,'translateX(100%)','Pinned Motion cancel alone still commits a queued endpoint');
console.log('Pinned Motion and vendor-free corrected-native runtime passed: native options, finish cleanup, stop/reverse queued callback isolation; cancel-only negative control reproduced.');
})().catch(error=>{console.error(error);process.exit(1)});
