// Native ownership/lifecycle contract. Fake geometry is not browser acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('theme/codela-storefront/assets/scripts/gallery-horizontal.js','utf8');
assert(!/\bimport\s*\(|Embla|codelaSfVendors|sf-gallery-viewport/.test(source),'Production gallery has no vendor path or transform viewport');
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
function setup({hero=true,count=3}={}){
 const document=new Element();document.root=true;document.documentElement=document;document.fonts={ready:Promise.resolve()};
 const window=new Events(),reduced=new Events();reduced.matches=false;
 // Poisoned old config is ignored; it must never trigger a vendor request.
 Object.defineProperty(window,'codelaSfVendors',{get(){throw Error('Production read removed vendor config')}});
 const observers=[],frames=new Map();let frame=0;
 class Observer{constructor(fn){this.fn=fn;this.disconnected=0;observers.push(this);}observe(){}disconnect(){this.disconnected++;}}
 const ctx={document,window,Symbol,Event,Map,MutationObserver:Observer,ResizeObserver:Observer,
 matchMedia:query=>query.includes('reduced-motion')?reduced:{matches:false},getComputedStyle:()=>({direction:'ltr'}),
 requestAnimationFrame:fn=>{frames.set(++frame,fn);return frame;},cancelAnimationFrame:id=>frames.delete(id)};
 vm.createContext(ctx);const initial=gallery({hero,count});document.append(initial.section);vm.runInContext(source,ctx);
 const flush=()=>{for(const [key,fn] of frames){frames.delete(key);fn();}};
 const reconcile=()=>window[Symbol.for('codela.storefront.section-galleries')]();
 return{...initial,document,window,reduced,observers,frames,flush,reconcile,repeat:()=>vm.runInContext(source,ctx)};
}
const x=setup();
assert.equal(x.controls.hidden,false);assert.equal(x.section.dataset.sfGalleryReady,'1');
assert.equal(x.track.parent,x.section,'Original native scroll target and ancestry stay untouched');
assert.equal(x.track.getAttribute('tabindex'),'0');assert.equal(x.track.styles.size,0,'No transform/overflow/snap style ownership');
assert.equal(x.track.listeners.get('wheel'),undefined,'No wheel listener means first delta/modifiers/default routing remain browser owned');
for(const input of [{deltaX:350,deltaY:0},{deltaX:0,deltaY:350,shiftKey:true},{deltaX:0,deltaY:350},{deltaX:100,ctrlKey:true},{deltaX:100,metaKey:true}]){
 const event=new Event('wheel',input);x.track.dispatchEvent(event);assert.equal(event.defaultPrevented,undefined);assert.equal(x.track.scrollLeft,0,'No fabricated wheel movement');
}
const intents=[];x.section.addEventListener('codela:media-intent',event=>intents.push(event.target));
x.track.dispatchEvent(new Event('pointerdown'));assert.deepEqual(intents,[x.items[1]],'Adjacent existing media is prepared, not every invisible slide');
const key=key=>{const event=new Event('keydown',{key});x.track.dispatchEvent(event);x.flush();assert(event.defaultPrevented);};
key('End');assert.equal(x.label.textContent,'03 / 03');assert.equal(x.track.behavior,'smooth');assert.equal(intents.at(-1),x.items[2]);
x.reduced.matches=true;key('Home');assert.equal(x.track.behavior,'instant');assert.equal(x.label.textContent,'01 / 03');
key('ArrowRight');assert.equal(x.label.textContent,'02 / 03');key('ArrowLeft');assert.equal(x.label.textContent,'01 / 03');
const nested=new Event('keydown',{key:'End',bubbles:true});x.items[0].dispatchEvent(nested);assert.equal(nested.defaultPrevented,undefined,'Nested CTA key events are not hijacked');
let updates=0,text=x.label.textContent;Object.defineProperty(x.label,'textContent',{get:()=>text,set:value=>{updates++;text=value;}});
x.track.dispatchEvent(new Event('scroll'));x.flush();assert.equal(updates,0,'Same slide does not repeat live-region announcement');
x.track.scrollTo({left:390});x.flush();assert.equal(updates,1);assert.equal(text,'02 / 03');
x.repeat();x.reconcile();assert.equal(x.observers.length,2,'One document observer and one caption observer despite repeated scripts/routes');
assert.equal(x.track.listeners.get('keydown').size,1);assert.equal(x.window.listeners.get('codela:route-committed').size,1);
x.track.dispatchEvent(new Event('scroll'));assert(x.frames.size>0);x.section.remove();x.reconcile();x.reconcile();
assert.equal(x.frames.size,0,'Pending scroll frame cancelled');assert.equal(x.observers[1].disconnected,1,'Caption observer disposed once');
for(const set of x.track.listeners.values())assert.equal(set.size,0,'Detached track has no live listeners');
assert.equal(x.section.dataset.sfGalleryReady,undefined);assert.equal(x.controls.hidden,true);
x.track.dispatchEvent(new Event('keydown',{key:'End'}));x.flush();assert.equal(text,'02 / 03','Detached event cannot mutate counter');
x.document.append(x.section);x.window.dispatchEvent(new Event('codela:route-committed'));assert.equal(x.section.dataset.sfGalleryReady,'1');assert.equal(x.observers.length,3,'Reinserted section has one new caption observer');
const partial=setup(),replacement=gallery();partial.track.replaceWith(replacement.track);partial.reconcile();
assert.equal(partial.section.querySelector('.sf-ui-gallery-track'),replacement.track);assert.equal(partial.observers[1].disconnected,1,'Track replacement cleans old owner');
assert.equal(partial.track.listeners.get('keydown').size,0);assert.equal(replacement.track.listeners.get('keydown').size,1);
const changed=setup();changed.items[2].remove();changed.reconcile();assert.equal(changed.label.textContent,'01 / 02','Slide list changes remount with the actual count');
const single=setup({count:1});assert.equal(single.controls.hidden,true);assert.equal(single.section.dataset.sfGalleryReady,undefined,'Single slide stays unenhanced');
const promo=setup({hero:false});assert.equal(promo.label.textContent,'1 / 3');assert.equal(promo.observers.length,1,'Nonhero has no caption observer');
console.log('Native gallery: zero vendor/wheel/transform ownership, keyboard/reduced-motion/media intents, silent counter, repeated execution and disposal/remount contracts passed.');
