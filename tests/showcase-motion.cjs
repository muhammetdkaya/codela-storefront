// Deterministic timing, pointer and disposal contracts. Browser geometry is
// covered separately in showcase-motion-browser.cjs, not simulated here.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.env.GALLERY_SOURCE||'theme/codela-storefront/assets/scripts/gallery-horizontal.js','utf8');
function target(extra={}){
 const listeners=new Map(),attrs=new Map(),classes=new Set();
 return Object.assign({
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn)},
  removeEventListener(type,fn){listeners.get(type)?.delete(fn)},
  emit(type,extra={}){const event={target:this,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},...extra};for(const fn of listeners.get(type)||[])fn(event);return event},
  listenerCount(){return [...listeners.values()].reduce((sum,v)=>sum+v.size,0)},
  classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c)},
  style:{getPropertyValue:()=>'',getPropertyPriority:()=>'',removeProperty(){},setProperty(){}},
  setAttribute:(key,value)=>attrs.set(key,String(value)),getAttribute:key=>attrs.get(key)??null,removeAttribute:key=>attrs.delete(key),
  closest:()=>null,dataset:{},
 },extra);
}
function fixture({hero=true,reduced=false,total=3,rtl=false}={}){
 let now=0,id=0;const timers=new Map(),frames=new Map(),mutations=[],intersections=[];
 const win=target(),doc=target({hidden:false,activeElement:null,documentElement:{}}),media=target({matches:reduced});
 const count=target({textContent:''});count.setAttribute('aria-live','polite');
 const controls=target({hidden:true,querySelector:s=>s==='[data-gallery-count]'?count:null,querySelectorAll:()=>[]});
 const track=target({children:[],scrollLeft:0,clientWidth:1000,capture:null,getBoundingClientRect:()=>({left:0}),
  scrollTo({left}){this.scrollLeft=left;this.emit('scroll')},setPointerCapture(id){this.capture=id},hasPointerCapture(id){return this.capture===id},releasePointerCapture(){this.capture=null}});
 track.children=Array.from({length:total},(_,i)=>target({querySelector:()=>null,getBoundingClientRect:()=>({left:(rtl?-1:1)*i*1000-track.scrollLeft}),dispatchEvent(){}}));
 const gallery=target({isConnected:true,querySelector:s=>s==='.sf-ui-gallery-track'?track:controls,getBoundingClientRect:()=>({top:0,bottom:700}),contains:node=>[track,...track.children].includes(node)});
 if(hero)gallery.classList.add('sf-section--hero');doc.querySelectorAll=()=>gallery.isConnected?[gallery]:[];
 const context={window:win,document:doc,innerHeight:900,matchMedia:q=>q.includes('reduced')?media:target({matches:false}),getComputedStyle:()=>({direction:rtl?'rtl':'ltr'}),
  setTimeout(fn,delay){const key=++id;timers.set(key,{fn,at:now+delay});return key},clearTimeout:key=>timers.delete(key),
  requestAnimationFrame(fn){const key=++id;frames.set(key,fn);return key},cancelAnimationFrame:key=>frames.delete(key),queueMicrotask:fn=>fn(),Event:class{},
  IntersectionObserver:class{constructor(fn){this.fn=fn;intersections.push(this)}observe(){}disconnect(){this.disconnected=true}},
  MutationObserver:class{constructor(fn){this.fn=fn;mutations.push(this)}observe(){}}
 };
 const flush=()=>{for(const [key,fn] of frames){frames.delete(key);fn()}};
 vm.runInNewContext(source,context);
 const api={win,doc,media,count,controls,track,gallery,timers,
  visible(value){intersections[0]?.fn([{isIntersecting:value,intersectionRatio:value?1:0}]);},
  tick(ms){const end=now+ms;while(true){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;now=next[1].at;timers.delete(next[0]);next[1].fn();flush()}now=end;flush()},
  focus(node){doc.activeElement=node;gallery.emit('focusin',{target:node})},
  blur(){doc.activeElement=null;gallery.emit('focusout')},
  pointer(type,x,y=20,extra={}){const owner=type==='pointerdown'?track:win;const event=owner.emit(type,{pointerId:1,pointerType:'mouse',button:0,buttons:1,clientX:x,clientY:y,...extra});flush();return event},
  destroy(){gallery.isConnected=false;mutations[0].fn([{addedNodes:[],removedNodes:[{nodeType:1}]}]);flush()},
  rerun(){vm.runInNewContext(source,context)},flush,
 };api.visible(true);return api;
}
let f=fixture();assert.equal(f.timers.size,1);f.tick(5999);assert.equal(f.count.textContent,'01 / 03');f.tick(1);assert.equal(f.count.textContent,'02 / 03');f.tick(12000);assert.equal(f.count.textContent,'01 / 03');assert.equal(f.count.getAttribute('aria-live'),'off');
f.gallery.emit('pointerenter',{pointerType:'mouse'});f.tick(12000);assert.equal(f.count.textContent,'01 / 03');f.gallery.emit('pointerleave',{pointerType:'mouse'});f.tick(6000);assert.equal(f.count.textContent,'02 / 03');
f.visible(false);f.tick(12000);assert.equal(f.count.textContent,'02 / 03');f.visible(true);f.tick(5999);assert.equal(f.count.textContent,'02 / 03');f.tick(1);assert.equal(f.count.textContent,'03 / 03');
f.doc.hidden=true;f.doc.emit('visibilitychange');f.tick(6000);assert.equal(f.count.textContent,'03 / 03');f.doc.hidden=false;f.doc.emit('visibilitychange');f.tick(6000);assert.equal(f.count.textContent,'01 / 03');
f.focus(f.track);f.tick(12000);assert.equal(f.count.textContent,'01 / 03');assert.equal(f.count.getAttribute('aria-live'),'polite');
f.blur();f.tick(5999);assert.equal(f.count.textContent,'01 / 03');f.tick(1);assert.equal(f.count.textContent,'02 / 03','Autoplay resumes after focus leaves without any start button');
f=fixture({reduced:true});f.tick(12000);assert.equal(f.count.textContent,'01 / 03');assert.equal(f.timers.size,0);f.media.matches=false;f.media.emit('change');f.tick(6000);assert.equal(f.count.textContent,'02 / 03','Motion preference is followed without a manual toggle');f.media.matches=true;f.media.emit('change');assert.equal(f.timers.size,0);
f=fixture({hero:false});f.tick(12000);assert.equal(f.timers.size,0);assert.equal(f.count.textContent,'1 / 3');
f=fixture({total:1});assert.equal(f.timers.size,0);assert.equal(f.controls.hidden,true);
for(const rtl of [false,true]){
 f=fixture({rtl});f.pointer('pointerdown',700);f.pointer('pointermove',rtl?950:400);assert(f.track.classList.contains('is-dragging'));f.pointer('pointerup',rtl?950:400);assert.equal(f.count.textContent,'02 / 03');assert(!f.track.classList.contains('is-dragging'));
 const click=f.track.emit('click',{detail:1});assert(click.prevented&&click.stopped,'Drag must not activate a link');
 f.pointer('pointerdown',500);f.pointer('pointermove',rtl?200:800);f.pointer('pointerup',rtl?200:800);assert.equal(f.count.textContent,'01 / 03');
 f.pointer('pointerdown',500);f.pointer('pointermove',510);f.pointer('pointerup',510);assert.equal(f.count.textContent,'01 / 03','Short drag snaps back');
 assert(!f.track.emit('click',{detail:0}).prevented,'Keyboard activation after cancelled mouse drag survives');
 f.pointer('pointerdown',600);f.pointer('pointermove',rtl?900:300);f.pointer('pointercancel',rtl?900:300);assert.equal(f.count.textContent,'01 / 03','Pointer cancellation restores origin');
 f.pointer('pointerdown',500);f.pointer('pointermove',505,100);f.pointer('pointerup',505,100);assert.equal(f.count.textContent,'01 / 03','Vertical gesture does not change slide');
 f.pointer('pointerdown',600,20,{pointerType:'touch'});f.pointer('pointermove',300,20,{pointerType:'touch'});assert.equal(f.track.scrollLeft,0,'Touch remains native');
 f.pointer('pointerdown',600,20,{button:2});f.pointer('pointermove',300);assert.equal(f.track.scrollLeft,0,'Right click is not a drag');
 f.pointer('pointerdown',600);f.pointer('pointerup',600);assert(!f.track.emit('click',{detail:1}).prevented,'Ordinary click survives');
}
f=fixture();f.rerun();assert.equal(f.timers.size,1,'Repeated init keeps one timer');f.pointer('pointerdown',700);f.pointer('pointermove',400);f.destroy();assert.equal(f.timers.size,0);assert.equal(f.track.capture,null);assert.equal(f.track.listenerCount(),0);assert.equal(f.win.listenerCount(),1);assert.equal(f.doc.listenerCount(),0);assert.equal(f.media.listenerCount(),0);assert.equal(f.count.getAttribute('aria-live'),'polite');f.tick(12000);assert.equal(f.gallery.dataset.sfGalleryReady,undefined);
console.log('Showcase motion: autoplay/cycle, hover/focus/offscreen/hidden/reduced-motion, mouse LTR/RTL, threshold/cancel/click, native touch and cleanup contracts passed.');
