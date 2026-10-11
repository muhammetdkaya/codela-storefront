// Exercise real dock helpers in a minimal event/DOM harness (not just text assertions).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('theme/codela-storefront/assets/storefront.js','utf8');
const start=src.indexOf('function mobileDock() {'),end=src.indexOf('\nfunction open(name, event) {',start);
assert.ok(start>0 && end>start);
const classList=()=>{
 const set=new Set();
 return {add:k=>set.add(k),remove:(...ks)=>ks.forEach(k=>set.delete(k)),contains:k=>set.has(k),
 toggle:(k,v)=>v===undefined?(set.has(k)?set.delete(k):set.add(k)):v?set.add(k):set.delete(k)};
};
const items=['home','search','cart','account'].map((name,i)=>({
 dataset:{dockView:name,...(['search','cart'].includes(name)?{panel:name}:{})},classList:classList(),attrs:new Map(name==='home'?[['aria-current','page']]:[]),
 href:'https://example.test/'+name,inert:false,
 getBoundingClientRect:()=>({left:80*i,top:30,right:80*(i+1),bottom:95,width:80,height:65}),
 hasAttribute(k){return this.attrs.has(k)},setAttribute(k,v){this.attrs.set(k,v)}
}));
const handlers={};
const handle={tabIndex:-1,attrs:new Map(),setAttribute(k,v){this.attrs.set(k,v)},addEventListener(k,fn){this[k]=fn}};
const shell={};
const dock={
 parentElement:shell,hidden:false,classList:classList(),
 style:{setProperty(){}},before(){},setPointerCapture(){},
 getBoundingClientRect:()=>({left:0,right:320,top:20,bottom:106,width:320,height:86}),
 querySelectorAll:sel=>sel==='.sf-dock-item'?items:[],
 querySelector:sel=>sel==='.sf-dock-handle'?handle:null,
 addEventListener(name,fn){handlers[name]=fn},
 contains(){return false}
};
const dialog={open:false,appendChild(el){el.parentElement=this},before(el){el.parentElement=shell},contains(){return false}};
const docHandlers={};
const document={
 body:{classList:{contains:()=>false}},
 scrollingElement:{scrollHeight:3000,clientHeight:800},
 createComment:()=>({after(el){el.parentElement=shell}}),
 querySelector:()=>null,querySelectorAll:()=>[],
 addEventListener:(k,fn)=>{docHandlers[k]=fn},
 removeEventListener:()=>{},activeElement:null
};
const win={innerWidth:390,addEventListener(){},scrollY:0,location:{assign:url=>{assigned=url}}};
let assigned='',opened=[],seq=0,raf=null;
const timers=new Map();
const setTimeoutFake=fn=>{const id=++seq;timers.set(id,fn);return id};
const context={
 dialog,document,window:win,current:null,dockNode:null,dockHome:null,dockScrollFrame:0,dockScrollTarget:null,
 requestAnimationFrame:fn=>{raf=fn;return 1},
 $:sel=>sel==='.sf-mobile-dock'?dock:null,
 dockScrollPositions:new WeakMap(),Element:class Element{},
 clearTimeout:id=>timers.delete(id),setTimeout:setTimeoutFake,
 open:name=>opened.push(name),Date,Math,Number
};
const helpers=vm.runInNewContext(src.slice(start,end)+
 '\n({mountDock,restoreDock,markDockActive,dockCandidate,setDockCollapsed,handleDockScroll,installDockGestures})',context);
helpers.mountDock();
assert.equal(dock.parentElement,dialog,'Real dock moves into native modal top layer');
helpers.markDockActive('search');
assert.equal(items[1].classList.contains('is-active'),true);
helpers.markDockActive('cart');
assert.equal(items[2].classList.contains('is-active'),true);
helpers.restoreDock();
assert.equal(dock.parentElement,shell);
assert.equal(items[0].classList.contains('is-active'),true);
assert.equal(helpers.dockCandidate(dock,165,50),items[2]);
assert.equal(helpers.dockCandidate(dock,165,400),null);
// Window and modal scroll direction trigger a recoverable collapsed dock.
helpers.handleDockScroll({target:document});raf();
win.scrollY=140;helpers.handleDockScroll({target:document});raf();
assert.equal(dock.classList.contains('is-collapsed'),true,'Scroll down hides dock');
assert.equal(handle.tabIndex,0,'Reveal line is keyboard reachable');
assert.equal(items[0].inert,true,'Hidden dock tabs are inert');
win.scrollY=98;helpers.handleDockScroll({target:document});raf();
assert.equal(dock.classList.contains('is-collapsed'),false,'Scroll up restores dock');
assert.equal(items[0].inert,false);
helpers.installDockGestures(dock);
const touch=(x,y,id=1)=>({clientX:x,clientY:y,identifier:id});
const ev=(item,t,kind)=>({
 target:{closest:()=>item},touches:kind==='end'?[]:[t],changedTouches:[t],cancelable:true,
 preventDefault(){this.prevented=true},stopImmediatePropagation(){}
});
let e=ev(items[0],touch(40,55),'start');
handlers.touchstart(e);
assert.equal(items[0].classList.contains('is-pressed'),true,'Touchstart gives press feedback');
handlers.touchend(ev(items[0],touch(40,55),'end'));
assert.equal(opened.length,0,'Simple taps retain native browser navigation');
e=ev(items[0],touch(40,55,2),'start');handlers.touchstart(e);
let m=ev(items[0],touch(171,55,2),'move');handlers.touchmove(m);
assert.equal(dock.classList.contains('is-scrubbing'),true,'Horizontal finger motion enters scrub');
assert.equal(items[2].classList.contains('is-preview'),true,'Target tab is previewed');
assert.equal(m.prevented,true,'Native horizontal scroll suppressed only while scrubbing');
let up=ev(items[0],touch(171,55,2),'end');handlers.touchend(up);
assert.equal(opened.at(-1),'cart','Releasing on Cart switches panel');
assert.equal(up.prevented,true,'Native click is suppressed on drag');
let prevented=false;
handlers.click({detail:1,preventDefault(){prevented=true},stopImmediatePropagation(){}});
assert.equal(prevented,true,'mobil tarayıcı synthetic click suppressed');
e=ev(items[0],touch(40,55,3),'start');handlers.touchstart(e);
const hold=[...timers.values()].at(-1);
assert.equal(typeof hold,'function');
hold();
assert.equal(dock.classList.contains('is-scrubbing'),true,'Long press activates scrub');
handlers.touchmove(ev(items[0],touch(285,55,3),'move'));
handlers.touchend(ev(items[0],touch(285,55,3),'end'));
assert.equal(assigned,'https://example.test/account','Release on Account navigates');
const h=ev(items[0],touch(40,55,4),'start');handlers.touchstart(h);
handlers.touchcancel();
assert.equal(dock.classList.contains('is-scrubbing'),false,'Cancelled gesture resets styling');
// A new physical press on the reveal handle clears the prior scrub's ghost-click guard.
handlers.touchstart(ev(null,touch(160,90,5),'start'));
let handleBlocked=false;
handlers.click({detail:1,preventDefault(){handleBlocked=true},stopImmediatePropagation(){}});
assert.equal(handleBlocked,false,'New reveal-handle press must not be swallowed');
helpers.setDockCollapsed(true);
handlers.click({preventDefault(){},stopImmediatePropagation(){}}); // Consume old synthetic click if pending
handle.tabIndex=0;
assert.ok(src.includes("dock.querySelector('.sf-dock-handle')?.addEventListener('click'"),'Thin handle can reopen dock');
assert.ok(src.includes("name === 'search' ? $('.sf-search-cancel')"),'Search opens without auto focusing text input');
assert.ok(src.includes('preventInitialAccountAutoFocus()'),'Account autofocus guard is installed');
assert.ok(src.includes("dock.addEventListener('touchmove'"),'Native touch support for mobil tarayıcı');
console.log('Dock modal, scrolling, touch scrubbing, hold and focus tests passed.');

