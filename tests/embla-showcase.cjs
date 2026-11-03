// Adapter lifecycle/ownership unit harness. Actual drag physics belongs to the
// complementary browser suite using the real pinned Embla vendor.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('theme/codela-storefront/assets/scripts/gallery-horizontal.js','utf8').replace('import(window.codelaSfVendors.embla)','__import()');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class Events{
 constructor(){this.listeners=new Map();}
 addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
 removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
 dispatchEvent(event){event.target??=this;event.currentTarget=this;for(const fn of this.listeners.get(event.type)||[])fn(event);if(event.bubbles)this.parent?.dispatchEvent(event);return !event.defaultPrevented;}
}
class Event{
 constructor(type,options={}){this.type=type;Object.assign(this,options);}
 preventDefault(){this.defaultPrevented=true;}
}
class Element extends Events{
 constructor(className='',tag='div'){
  super();this.className=className;this.tagName=tag;this.nodeType=1;this.children=[];this.parent=null;this.dataset={};this.attrs=new Map();this.hidden=false;this.textContent='';this.scrollLeft=0;
  this.styles=new Map();this.style={setProperty:(k,v,p='')=>this.styles.set(k,{v,p}),removeProperty:k=>this.styles.delete(k),getPropertyValue:k=>this.styles.get(k)?.v||'',getPropertyPriority:k=>this.styles.get(k)?.p||''};
  this.classList={contains:k=>this.className.split(' ').includes(k),toggle:(k,on)=>{const set=new Set(this.className.split(' '));if(on)set.add(k);else set.delete(k);this.className=[...set].join(' ');}};
 }
 getAttribute(key){return this.attrs.get(key)??null;}
 setAttribute(key,value){this.attrs.set(key,String(value));}
 removeAttribute(key){this.attrs.delete(key);}
 focus(){let root=this;while(root.parent)root=root.parent;root.activeElement=this;}
 get childNodes(){return this.children;}
 get isConnected(){return this.root===true||!!this.parent?.isConnected;}
 append(...nodes){for(const node of nodes){if(node.parent)node.parent.children.splice(node.parent.children.indexOf(node),1);node.parent=this;this.children.push(node);}}
 before(node){const parent=this.parent,index=parent.children.indexOf(this);if(node.parent)node.parent.children.splice(node.parent.children.indexOf(node),1);parent.children.splice(index,0,node);node.parent=parent;}
 replaceWith(...nodes){const parent=this.parent;if(!parent)return;const index=parent.children.indexOf(this);parent.children.splice(index,1);this.parent=null;for(const node of nodes){if(node.parent)node.parent.children.splice(node.parent.children.indexOf(node),1);node.parent=parent;}parent.children.splice(index,0,...nodes);}
 remove(){this.replaceWith();}
 contains(node){return this===node||this.children.some(child=>child.contains(node));}
 matches(selector){if(selector.startsWith('.'))return this.classList.contains(selector.slice(1));if(selector.startsWith('[data-')){const key=selector.slice(6,-1).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return key in this.dataset;}return this.tagName===selector;}
 querySelectorAll(selector){const [ancestor,child]=selector.split(' > ');if(child)return this.querySelectorAll(ancestor).flatMap(element=>element.children.filter(item=>item.matches(child)));return this.children.flatMap(node=>[...(node.matches(selector)?[node]:[]),...node.querySelectorAll(selector)]);}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 getBoundingClientRect(){const index=this.parent?.children.indexOf(this)||0;return{left:this.classList.contains('sf-ui-gallery-slide')?index*390-(this.parent?.scrollLeft||0):0,height:400,width:390};}
 get offsetLeft(){return (this.parent?.children.indexOf(this)||0)*390;}
 scrollTo({left,behavior}){this.scrollLeft=left;this.behavior=behavior;this.dispatchEvent(new Event('scroll'));}
}
function gallery({hero=true,count=3}={}){
 const section=new Element(hero?'sf-section--hero':'sf-section--promo');section.dataset.sfGallery='';
 const track=new Element('sf-ui-gallery-track');track.setAttribute('tabindex','0');section.setAttribute('aria-label','Featured collections');section.append(track);
 const items=Array.from({length:count},()=>new Element('sf-ui-gallery-slide','article'));track.append(...items);
 const controls=new Element();controls.dataset.galleryControls='';controls.hidden=true;const label=new Element('', 'span');label.dataset.galleryCount='';label.textContent=hero?'01 / 03':'1 / 3';controls.append(label);
 const progress=new Element('sf-hero-progress','span');progress.append(...Array.from({length:count},()=>new Element('','span')));controls.append(progress);section.append(controls);
 return{section,track,items,controls,label};
}
function setup({hero=true,count=3,configured=true,fail=false}={}){
 const document=new Element();document.root=true;document.documentElement=document;document.createElement=tag=>new Element('',tag);document.fonts={ready:Promise.resolve()};
 const window=new Events(),reduced=new Events();reduced.matches=false;
 const observers=[],frames=new Map(),engines=[];let frame=0,imports=0,resolve,reject;
 const pending=new Promise((yes,no)=>{resolve=yes;reject=no;});
 if(configured)window.codelaSfVendors={embla:'/vendor.js?ver=fixture'};
 class Observer{constructor(fn){this.fn=fn;this.disconnected=false;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}
 const Embla=(root,options)=>{
  if(fail)throw Error('init failure');
  let current=options.startIndex;
  const events=new Map(),api={options,root,calls:[],destroyed:0,on(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn);return this;},emit(type){for(const fn of events.get(type)||[])fn(this);},selectedScrollSnap:()=>current,slidesInView:()=>[current],scrollTo(index,jump){current=index;this.calls.push({index,jump});this.emit('select');},destroy(){this.destroyed++;events.clear();}};
  engines.push(api);return api;
 };
 const ctx={document,window,Symbol,Event,Map,MutationObserver:Observer,ResizeObserver:Observer,IntersectionObserver:Observer,matchMedia:query=>query.includes('reduced-motion')?reduced:{matches:false},getComputedStyle:()=>({direction:'ltr'}),requestAnimationFrame:fn=>{frames.set(++frame,fn);return frame;},cancelAnimationFrame:id=>frames.delete(id),__import:()=>{imports++;return pending;}};
 vm.createContext(ctx);const initial=gallery({hero,count});document.append(initial.section);vm.runInContext(source,ctx);
 const flush=()=>{for(const [key,fn] of frames){frames.delete(key);fn();}};
 const reconcile=()=>window[Symbol.for('codela.storefront.section-galleries')]();
 return{...initial,document,window,reduced,observers,frames,engines,flush,reconcile,imports:()=>imports,load:async()=>{resolve({default:Embla});await tick();},reject:async()=>{reject(Error('blocked'));await tick();},repeat:()=>vm.runInContext(source,ctx)};
}
(async()=>{
 const x=setup();assert.equal(x.imports(),1);assert.equal(x.section.dataset.sfGalleryEngine,'native');assert.equal(x.controls.hidden,false);
 const end=new Event('keydown',{key:'End'});x.track.dispatchEvent(end);x.flush();assert(end.defaultPrevented);assert.equal(x.label.textContent,'03 / 03');
 await x.load();assert.equal(x.engines.length,1);assert.equal(x.engines[0].options.startIndex,2,'Native selection retained during import');assert.equal(x.engines[0].options.loop,false);assert.equal(x.track.style.getPropertyValue('scroll-snap-type'),'none');
 assert.equal(x.track.getAttribute('tabindex'),'-1');assert.equal(x.track.parent.getAttribute('tabindex'),'0');assert.equal(x.track.parent.getAttribute('aria-label'),'Featured collections');
 assert.equal(x.track.children[0],x.items[0],'Original nodes retained');assert.equal(x.section.querySelectorAll('.sf-gallery-viewport').length,1);
 x.track.dispatchEvent(new Event('keydown',{key:'Home'}));assert.equal(x.label.textContent,'01 / 03');assert.equal(x.engines[0].calls.at(-1).jump,false);
 x.engines[0].options.watchFocus(x.engines[0],{target:x.items[2]});assert.equal(x.engines[0].calls.at(-1).jump,true,'Focus reveals a slide immediately even without reduced-motion');x.engines[0].scrollTo(0,true);
 x.reduced.matches=true;x.reduced.dispatchEvent(new Event('change'));assert.equal(x.engines[0].calls.at(-1).jump,true,'Preference changes interrupt active movement');
 x.track.dispatchEvent(new Event('keydown',{key:'ArrowRight'}));assert.equal(x.engines[0].calls.at(-1).jump,true);assert.equal(x.label.textContent,'02 / 03');
 x.repeat();x.reconcile();assert.equal(x.engines.length,1,'Idempotent script and route mounts');
 x.section.remove();x.reconcile();x.reconcile();assert.equal(x.engines[0].destroyed,1,'Exactly-once destruction');assert.equal(x.track.style.getPropertyValue('scroll-snap-type'),'');assert.equal(x.section.querySelectorAll('.sf-gallery-viewport').length,0);assert.equal(x.section.dataset.sfGalleryReady,undefined);assert.equal(x.controls.hidden,true);
 x.track.dispatchEvent(new Event('keydown',{key:'End'}));assert.equal(x.label.textContent,'02 / 03','Detached listeners removed');assert.equal(x.reduced.listeners.get('change').size,0);assert(x.observers.slice(1).every(observer=>observer.disconnected),'Caption observer disconnected');
 const fresh=gallery();x.document.append(fresh.section);x.reconcile();await tick();assert.equal(x.engines.length,2);assert.equal(x.imports(),1,'Vendor request shared across router replacements');
 const stale=setup();stale.section.remove();stale.reconcile();await stale.load();assert.equal(stale.engines.length,0,'Stale import cannot mount detached content');
 for(const options of [{configured:false},{hero:false},{count:1}]){const test=setup(options);assert.equal(test.imports(),0,'Only multi-slide hero requests vendor');}
 const wheel=setup();await wheel.load();wheel.track.dispatchEvent(new Event('wheel',{deltaX:0,deltaY:40}));assert.equal(wheel.engines[0].destroyed,0,'Vertical wheel preserves engine and page scrolling');
 wheel.engines[0].scrollTo(1,true);wheel.track.parent.focus();
 const horizontal=new Event('wheel',{deltaX:250,deltaY:0});wheel.track.dispatchEvent(horizontal);assert.equal(wheel.engines[0].destroyed,1);assert.equal(horizontal.defaultPrevented,undefined,'Native default applies the first wheel event exactly once');assert.equal(wheel.section.dataset.sfGalleryEngine,'native');wheel.reconcile();wheel.repeat();assert.equal(wheel.engines.length,1,'Wheel fallback remains native for the component lifecycle');assert.equal(wheel.track.getAttribute('tabindex'),'0');assert.equal(wheel.track.scrollLeft,390,'Wheel handoff sets selected native offset synchronously');assert.equal(wheel.document.activeElement,wheel.track,'Fixed viewport focus returns to native track');
 const shifted=setup();await shifted.load();shifted.track.dispatchEvent(new Event('wheel',{deltaX:0,deltaY:100,shiftKey:true}));assert.equal(shifted.engines[0].destroyed,1,'Shift+wheel returns to native');
 const pendingWheel=setup();pendingWheel.track.dispatchEvent(new Event('wheel',{deltaX:30,deltaY:0}));await pendingWheel.load();assert.equal(pendingWheel.engines.length,0,'Wheel during import permanently keeps native ownership');
 for(const modifier of [{ctrlKey:true},{metaKey:true},{defaultPrevented:true}]){const ignored=setup();await ignored.load();ignored.track.dispatchEvent(new Event('wheel',{deltaX:100,deltaY:0,...modifier}));assert.equal(ignored.engines[0].destroyed,0,'Pinch, modified or consumed wheel does not force handoff');}
 const linkFocus=setup();await linkFocus.load();const link=new Element('sf-ui-button','a');linkFocus.items[1].append(link);linkFocus.engines[0].scrollTo(1,true);link.focus();linkFocus.track.dispatchEvent(new Event('wheel',{deltaX:100,deltaY:0}));assert.equal(linkFocus.document.activeElement,link,'Nested original control retains focus across wheel handoff');
 const blocked=setup();await blocked.reject();assert.equal(blocked.section.dataset.sfGalleryEngine,'native');assert.equal(blocked.section.querySelectorAll('.sf-gallery-viewport').length,0);
 const failure=setup({fail:true});failure.track.focus();await failure.load();assert.equal(failure.document.activeElement,failure.track,'Constructor failure restores keyboard focus');assert.equal(failure.section.dataset.sfGalleryEngine,'native');assert.equal(failure.section.querySelectorAll('.sf-gallery-viewport').length,0);assert.equal(failure.track.style.getPropertyValue('scroll-snap-type'),'');
 // A router may replace just the track. Disposal must not resurrect that old
 // track and discard the incoming region's nodes while unwrapping the viewport.
 const partial=setup();await partial.load();const replacement=gallery();partial.track.replaceWith(replacement.track);partial.reconcile();await tick();assert.equal(partial.engines[0].destroyed,1);assert.equal(partial.section.querySelector('.sf-ui-gallery-track'),replacement.track);assert.equal(partial.engines.length,2);
 console.log('Embla adapter lifecycle: native ownership, delayed/failed import, keyboard/reduced-motion, node preservation, idempotence and disposal passed. Real movement remains browser-tested separately.');
})().catch(error=>{console.error(error);process.exitCode=1;});
