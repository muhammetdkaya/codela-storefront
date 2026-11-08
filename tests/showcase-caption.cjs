// Adapter/observer contract only. This is not browser geometry acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('theme/codela-storefront/assets/scripts/gallery-horizontal.js','utf8');
// Small event/style/observer doubles model ownership without pretending to
// implement browser layout. Mutation delivery is explicit; style writes do not
// invent child-list records or remount a connected gallery.
const eventTarget=(target={})=>{
 const listeners=new Map();
 target.addEventListener=(name,fn)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn)};
 target.removeEventListener=(name,fn)=>listeners.get(name)?.delete(fn);
 target.emit=(name,event={})=>{for(const fn of listeners.get(name)||[])fn(event)};
 target.listenerCount=name=>name?(listeners.get(name)?.size||0):[...listeners.values()].reduce((total,set)=>total+set.size,0);
 return target;
};
const style=(values=new Map())=>({setProperty:(key,value)=>values.set(key,value),removeProperty:key=>values.delete(key),getPropertyValue:key=>values.get(key)||'',getPropertyPriority:()=>''});
const attributes=target=>{
 const attrs=new Map([['tabindex','0']]);
 return Object.assign(target,{getAttribute:key=>attrs.get(key)??null,setAttribute:(key,value)=>attrs.set(key,String(value)),removeAttribute:key=>attrs.delete(key),contains:node=>target===node||target.children.includes(node),focus(){}});
};
const mutationDouble=instances=>class{
 constructor(callback){this.callback=callback;this.disconnected=false;instances.push(this)}
 observe(target,options){this.target=target;this.options=options}
 disconnect(){this.disconnected=true}
 deliver(records){if(!this.disconnected)this.callback(records)}
};
const values=new Map(),observed=[],observers=[],resizeInstances=[],mutations=[];
let mobile=true,bottom=82,frame=0;const queue=[],cancelled=new Set();
const flush=()=>{while(queue.length){const item=queue.shift();if(!cancelled.has(item.id))item.fn()}};
const resized=()=>{observers[0]();flush()};
const child=height=>({height,getBoundingClientRect(){return{height:this.height}},style:{display:'block'}});
const copies=[{children:[child(64),child(42),child(44)]},{children:[child(64),child(44)]}];
const items=copies.map((copy,i)=>({querySelector:s=>s==='.sf-section-copy'?copy:null,getBoundingClientRect:()=>({left:i*390}),dispatchEvent(){}}));
const track=attributes(eventTarget({children:items,style:style(),classList:{remove(){}},getBoundingClientRect:()=>({left:0})}));
const count=attributes({children:[]});
const controls=eventTarget({hidden:true,querySelector:s=>s==='[data-gallery-count]'?count:null,querySelectorAll:()=>[]});
const gallery=eventTarget({isConnected:true,dataset:{},classList:{contains:s=>s==='sf-section--hero'},querySelector:s=>s==='.sf-ui-gallery-track'?track:controls,style:style(values)});
const context={document:eventTarget({documentElement:{},activeElement:null,querySelectorAll:()=>gallery.isConnected?[gallery]:[]}),window:eventTarget(),
 matchMedia:query=>eventTarget({matches:query.includes('max-width')?mobile:false}),
 getComputedStyle:el=>copies.includes(el)?{paddingTop:'18px',paddingBottom:bottom+'px',rowGap:'8px'}:{display:'block',direction:'ltr'},
 MutationObserver:mutationDouble(mutations),IntersectionObserver:class{observe(){}disconnect(){}},
 ResizeObserver:class{constructor(fn){observers.push(fn);resizeInstances.push(this);this.disconnected=false}observe(el){observed.push(el)}disconnect(){this.disconnected=true}},
 Event:class{},clearTimeout(){},requestAnimationFrame(fn){const id=++frame;queue.push({id,fn});return id},cancelAnimationFrame(id){cancelled.add(id)}};
vm.runInNewContext(source,context);
assert.equal(values.get('--sf-hero-caption-height'),'266px','Tallest actual caption includes dock padding, child heights and gaps');
assert(copies.every(copy=>observed.includes(copy)),'Padding-only geometry changes are observed on the caption itself');
assert(copies.flatMap(copy=>copy.children).every(el=>observed.includes(el)),'Intrinsic text/button changes remain observed');
assert.equal(count.textContent,'01 / 02','Hero counter works without previous/next nodes');
assert.equal(controls.hidden,false,'Counter remains visible after adapter setup');
bottom=116;resized();assert.equal(values.get('--sf-hero-caption-height'),'300px','Safe-area padding updates without changing child heights');
bottom=48;resized();assert.equal(values.get('--sf-hero-caption-height'),'232px','Partial dock overlap reduces the measured caption reserve');
bottom=20;resized();assert.equal(values.get('--sf-hero-caption-height'),'204px','A hero above the dock retains only its 20px bottom inset');
bottom=116;
copies[1].children[1].height=150;resized();assert.equal(values.get('--sf-hero-caption-height'),'356px','Long CTA participates in the shared caption height');
mobile=false;resized();assert(!values.has('--sf-hero-caption-height'),'Desktop removes mobile-only shared height');
mobile=true;bottom=20;resized();assert.equal(values.get('--sf-hero-caption-height'),'260px','Return to mobile/no-dock clears the old reserve');
vm.runInNewContext(source,context);assert.equal(observers.length,1,'Repeated adapter execution cannot duplicate ownership');
// Counter and keyboard regression: zero padding is hero-only and total is not
// hard-coded to the five-slide reference. These are DOM contracts, not layout.
function counterFixture(hero,total){
 const queue=[],count=attributes({children:[]}),prev=eventTarget(),next=eventTarget(),mutations=[];
 const track=attributes(eventTarget({scrollLeft:0,style:style(),getBoundingClientRect:()=>({left:0}),scrollTo({left}){this.scrollLeft=left;this.emit('scroll')}}));
 track.children=Array.from({length:total},(_,i)=>({getBoundingClientRect:()=>({left:i*390-track.scrollLeft}),querySelector:()=>null,dispatchEvent(){}}));
 const controls=eventTarget({hidden:true,querySelector:s=>s==='[data-gallery-count]'?count:hero?null:s==='[data-gallery-prev]'?prev:next,querySelectorAll:()=>[]});
 const gallery=eventTarget({isConnected:true,dataset:{},classList:{contains:()=>hero},querySelector:s=>s==='.sf-ui-gallery-track'?track:controls,style:style()});
 vm.runInNewContext(source,{document:eventTarget({documentElement:{},activeElement:null,querySelectorAll:()=>[gallery]}),window:eventTarget(),matchMedia:()=>eventTarget({matches:false}),getComputedStyle:()=>({direction:'ltr'}),MutationObserver:mutationDouble(mutations),IntersectionObserver:class{observe(){}disconnect(){}},Event:class{},clearTimeout(){},requestAnimationFrame(fn){queue.push(fn);return queue.length},cancelAnimationFrame(){}});
 return {count,prev,next,controls,key(key,target=track){let prevented=false;track.emit('keydown',{key,target,preventDefault(){prevented=true}});while(queue.length)queue.shift()();return prevented},swipe(index){track.scrollTo({left:index*390});while(queue.length)queue.shift()()}};
}
const hero=counterFixture(true,12);
assert.equal(hero.count.textContent,'01 / 12','Double-digit dynamic total is preserved');
assert(hero.key('ArrowRight'),'ArrowRight is handled on the track');assert.equal(hero.count.textContent,'02 / 12');
hero.key('End');assert.equal(hero.count.textContent,'12 / 12');
hero.key('ArrowRight');assert.equal(hero.count.textContent,'12 / 12','End boundary does not wrap unexpectedly');
hero.key('Home');assert.equal(hero.count.textContent,'01 / 12');
hero.key('ArrowLeft');assert.equal(hero.count.textContent,'01 / 12','Start boundary does not wrap unexpectedly');
hero.swipe(4);assert.equal(hero.count.textContent,'05 / 12','Native scroll/swipe updates the same counter');
assert.equal(hero.key('Home',{}),false,'Nested CTA key events are not hijacked');assert.equal(hero.count.textContent,'05 / 12');
const promo=counterFixture(false,3);
assert.equal(promo.count.textContent,'1 / 3','Other galleries retain their original unpadded format');assert(promo.prev.disabled&&!promo.next.disabled);
promo.key('End');assert.equal(promo.count.textContent,'3 / 3');assert(!promo.prev.disabled&&promo.next.disabled,'Nonhero arrow state still updates');
// Keep the original caption/counter assertions above. New lifecycle checks exercise the
// doubles rather than using an undefined/empty MutationObserver constructor.
assert.equal(mutations.length,1,'One persistent document observer owns router reconciliation');
assert.equal(mutations[0].target,context.document.documentElement,'Router observer watches the actual document root');
assert.deepEqual(JSON.parse(JSON.stringify(mutations[0].options)),{childList:true,subtree:true},'Per-frame style writes are not observed');
mutations[0].deliver([{addedNodes:[{nodeType:3}],removedNodes:[]}]);
mutations[0].deliver([{addedNodes:[{nodeType:1}],removedNodes:[]}]);
assert.equal(observers.length,1,'Text and unrelated element mutations do not duplicate caption ownership');
assert.equal(context.window.listenerCount('codela:route-committed'),1,'Repeated adapter execution retains one route listener');
resized();observers[0]();assert(queue.length>0,'A caption frame is pending before removal');
gallery.isConnected=false;
mutations[0].deliver([{addedNodes:[],removedNodes:[{nodeType:1}]}]);flush();
assert(resizeInstances[0].disconnected,'Removed caption observer is disconnected');
assert.equal(track.listenerCount(),0,'Removed track listeners are detached');
assert.equal(context.window.listenerCount(),1,'Removed gallery detaches global drag listeners and retains only router reconciliation');
assert.equal(gallery.dataset.sfGalleryReady,undefined,'Removed gallery can be safely mounted again');
assert.equal(controls.hidden,true,'Original control visibility is restored');
assert(!values.has('--sf-hero-caption-height'),'Disposed frames cannot rewrite restored caption style');
gallery.isConnected=true;
mutations[0].deliver([{addedNodes:[{nodeType:1}],removedNodes:[]}]);
assert.equal(observers.length,2,'Reinserted gallery obtains one fresh caption observer');
assert.equal(values.get('--sf-hero-caption-height'),'260px','Reinserted native gallery remeasures current mobile caption');
console.log('Showcase caption/counter: existing caption/counter contract and 13 lifecycle assertions passed (no real browser layout).');
