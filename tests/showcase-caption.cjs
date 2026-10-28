// Adapter/observer contract only. This is not browser geometry acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('theme/codela-storefront/assets/scripts/gallery-horizontal.js','utf8');
const values=new Map(),observed=[],observers=[];
let mobile=true,bottom=82,frame=0;const queue=[];
const flush=()=>{while(queue.length)queue.shift()()};
const resized=()=>{observers[0]();flush()};
const child=height=>({height,getBoundingClientRect(){return{height:this.height}},style:{display:'block'}});
const copies=[{children:[child(64),child(42),child(44)]},{children:[child(64),child(44)]}];
const items=copies.map((copy,i)=>({querySelector:s=>s==='.sf-section-copy'?copy:null,getBoundingClientRect:()=>({left:i*390}),dispatchEvent(){}}));
const track={children:items,getBoundingClientRect:()=>({left:0}),addEventListener(){}};
const count={};
const controls={querySelector:s=>s==='[data-gallery-count]'?count:null,querySelectorAll:()=>[]};
const gallery={dataset:{},classList:{contains:s=>s==='sf-section--hero'},querySelector:s=>s==='.sf-ui-gallery-track'?track:controls,style:{setProperty:(k,v)=>values.set(k,v),removeProperty:k=>values.delete(k)}};
const context={document:{querySelectorAll:()=>[gallery]},window:{addEventListener(){}},matchMedia:()=>({matches:mobile}),getComputedStyle:el=>copies.includes(el)?{paddingTop:'18px',paddingBottom:bottom+'px',rowGap:'8px'}:{display:'block'},ResizeObserver:class{constructor(fn){observers.push(fn)}observe(el){observed.push(el)}},Event:class{},requestAnimationFrame(fn){queue.push(fn);return ++frame}};
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
 const events={},queue=[],count={},prev={addEventListener(){}},next={addEventListener(){}};
 const track={scrollLeft:0,addEventListener(name,fn){events[name]=fn},getBoundingClientRect:()=>({left:0}),scrollTo({left}){this.scrollLeft=left;events.scroll?.()}};
 track.children=Array.from({length:total},(_,i)=>({getBoundingClientRect:()=>({left:i*390-track.scrollLeft}),querySelector:()=>null,dispatchEvent(){}}));
 const controls={querySelector:s=>s==='[data-gallery-count]'?count:hero?null:s==='[data-gallery-prev]'?prev:next,querySelectorAll:()=>[]};
 const gallery={dataset:{},classList:{contains:()=>hero},querySelector:s=>s==='.sf-ui-gallery-track'?track:controls,style:{removeProperty(){},setProperty(){}}};
 vm.runInNewContext(source,{document:{querySelectorAll:()=>[gallery]},window:{addEventListener(){}},matchMedia:()=>({matches:false}),Event:class{},requestAnimationFrame(fn){queue.push(fn);return queue.length}});
 return {count,prev,next,controls,key(key,target=track){let prevented=false;events.keydown({key,target,preventDefault(){prevented=true}});while(queue.length)queue.shift()();return prevented},swipe(index){track.scrollTo({left:index*390});while(queue.length)queue.shift()()}};
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
console.log('Showcase caption/counter: 28 adapter/observer/keyboard assertions passed (no real browser layout).');
