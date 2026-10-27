// Exercise real dock helpers in a minimal event/DOM harness (not just text assertions).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const entry=fs.readFileSync('theme/codela-storefront/assets/storefront.js','utf8');
const src=fs.readFileSync('theme/codela-storefront/assets/scripts/dock-controller.js','utf8');
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
const dockStyle=new Map();
const dock={
 parentElement:shell,hidden:false,classList:classList(),
 style:{setProperty(k,v){dockStyle.set(k,String(v))}},before(){},setPointerCapture(){},
 getBoundingClientRect:()=>({left:0,right:320,top:20,bottom:106,width:320,height:86}),
 querySelectorAll:sel=>sel==='.sf-dock-item'?items:[],
 querySelector:sel=>sel==='.sf-dock-handle'?handle:null,
 addEventListener(name,fn){handlers[name]=fn},
 contains(){return false}
};
const dialogHandlers={};
const dialog={open:false,appendChild(el){el.parentElement=this},before(el){el.parentElement=shell},contains(){return false},addEventListener(k,fn){dialogHandlers[k]=fn}};
const docHandlers={};
let navigationPending=false;
const document={
 documentElement:{hasAttribute:name=>name==='data-sf-navigation-pending'&&navigationPending},
 body:{classList:{contains:()=>false}},
 scrollingElement:{scrollHeight:3000,clientHeight:800},
 createComment:()=>({after(el){el.parentElement=shell}}),
 querySelector:sel=>sel==='.sf-mobile-dock'?dock:null,querySelectorAll:()=>[],
 addEventListener:(k,fn)=>{docHandlers[k]=fn},
 removeEventListener:()=>{},activeElement:null
};
const windowHandlers={};let scrollListeners=0;
const win={innerWidth:390,addEventListener(k,fn){windowHandlers[k]=fn;if(k==='scroll')scrollListeners++},scrollY:0,location:{assign:url=>{assigned=url}}};
let assigned='',opened=[],closed=0,seq=0,raf=null,now=0;
const timers=new Map();
const setTimeoutFake=fn=>{const id=++seq;timers.set(id,fn);return id};
const fireTimers=()=>{for(const [id,fn] of [...timers]){timers.delete(id);fn();}};
const context={
 document,window:win,
 requestAnimationFrame:fn=>{raf=fn;return 1},
 Element:class Element{},
 clearTimeout:id=>timers.delete(id),setTimeout:setTimeoutFake,Date:{now:()=>now},Math,Number
};
const createDockController=vm.runInNewContext(src.replace(/^export /m,'')+'\ncreateDockController',context);
const helpers=createDockController({
 getDialog:()=>dialog,getCurrent:()=>null,open:name=>opened.push(name),close:()=>{closed++;dialog.open=false},
});
helpers.mountDock();
assert.equal(dock.parentElement,dialog,'Real dock moves into native modal top layer');
helpers.markDockActive('search');
assert.equal(items[1].classList.contains('is-active'),true);
helpers.markDockActive('cart');
assert.equal(items[2].classList.contains('is-active'),true);
helpers.restoreDock();
assert.equal(dock.parentElement,shell);
assert.equal(items[0].classList.contains('is-active'),true);
navigationPending=true;helpers.setDockCollapsed(true);
assert.equal(dock.classList.contains('is-collapsed'),false,'Loading feedback owns dock visibility');
navigationPending=false;
// A single installation owns both gesture and scroll listeners, even if init repeats.
helpers.init(dialog);helpers.init(dialog);
assert.equal(scrollListeners,1,'Scroll listener installed once');
assert.equal(typeof dialogHandlers.scroll,'function','Native modal scroll is tracked');
assert.equal(typeof handlers.touchstart,'function','Touch listeners installed once');
// Hiding requires substantial downward travel; rapid reversal waits for rest time.
windowHandlers.scroll({target:document});raf();
win.scrollY=20;windowHandlers.scroll({target:document});raf();
assert.equal(dock.classList.contains('is-collapsed'),false,'Tiny scroll does not hide dock');
win.scrollY=140;windowHandlers.scroll({target:document});raf();
assert.equal(dock.classList.contains('is-collapsed'),false,'First transition respects initial 650ms dwell');
now=650;fireTimers();
assert.equal(dock.classList.contains('is-collapsed'),true,'Sustained downward movement hides dock');
assert.equal(handle.tabIndex,0,'Reveal line is keyboard reachable');
assert.equal(items[0].inert,true,'Hidden dock tabs are inert');
// A few pixels of scroll bounce must not reveal the bar.
win.scrollY=136;windowHandlers.scroll({target:document});raf();
assert.equal(dock.classList.contains('is-collapsed'),true,'Small reversal is ignored');
now=700;win.scrollY=98;windowHandlers.scroll({target:document});raf();
assert.equal(dock.classList.contains('is-collapsed'),true,'Upward movement cannot undo hide within rest time');
now=1300;fireTimers();
assert.equal(dock.classList.contains('is-collapsed'),false,'Confirmed upward movement reveals dock after rest time');
assert.equal(items[0].inert,false);
// A queued hide should be cancelled when the direction truly reverses.
now=1350;win.scrollY=150;windowHandlers.scroll({target:document});raf();
assert.equal(dock.classList.contains('is-collapsed'),false,'New hide queues during dwell');
win.scrollY=134;windowHandlers.scroll({target:document});raf();
now=2200;fireTimers();
assert.equal(dock.classList.contains('is-collapsed'),false,'Real reversal cancels an obsolete queued hide');
// Explicit reveal/scroll-to-top should always override any pending motion.
win.scrollY=200;windowHandlers.scroll({target:document});raf();
now=2300;win.scrollY=10;windowHandlers.scroll({target:document});raf();
now=3000;fireTimers();
assert.equal(dock.classList.contains('is-collapsed'),false,'At top, any queued hide must stay cancelled');
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
// A click on Home while Search is on top must close it, not follow the anchor.
dialog.open=true;
let preventedCurrent=false;
handlers.click({detail:0,target:{closest:()=>items[0]},preventDefault(){preventedCurrent=true}});
assert.equal(preventedCurrent,true,'Native current-page Home click is intercepted');
assert.equal(closed,1,'Current-page Home closes the popup through the overlay owner');
assert.equal(assigned,'','Current-page Home never navigates');
// With no dialog open, clicking the selected page should still avoid a reload.
preventedCurrent=false;
handlers.click({detail:0,target:{closest:()=>items[0]},preventDefault(){preventedCurrent=true}});
assert.equal(preventedCurrent,true,'Current-page reselect does not reload');
assert.equal(closed,1,'No extra close when the popup is already closed');
e=ev(items[0],touch(40,55,2),'start');handlers.touchstart(e);
let m=ev(items[0],touch(171,55,2),'move');handlers.touchmove(m);
assert.equal(dock.classList.contains('is-scrubbing'),true,'Horizontal finger motion enters scrub');
assert.equal(items[2].classList.contains('is-preview'),true,'Target tab is previewed');
assert(Math.abs(Number(dockStyle.get('--sf-dock-index'))-1.6375)<.001,'Capsule follows a fractional finger position between icon centers');
handlers.touchmove(ev(items[0],touch(185,55,2),'move'));
assert(Number(dockStyle.get('--sf-dock-index'))>1.6375,'Capsule continues moving inside the same target slot');
assert.equal(m.prevented,true,'Native horizontal scroll suppressed only while scrubbing');
let up=ev(items[0],touch(171,55,2),'end');handlers.touchend(up);
assert.equal(opened.at(-1),'cart','Releasing on Cart switches panel');
assert.equal(dockStyle.get('--sf-dock-index'),'2','Release settles at the selected icon center');
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
// Horizontal scrubbing back to the underlying Home also dismisses immediately.
dialog.open=true;
e=ev(items[1],touch(120,55,9),'start');handlers.touchstart(e);
handlers.touchmove(ev(items[1],touch(40,55,9),'move'));
const back=ev(items[1],touch(40,55,9),'end');handlers.touchend(back);
assert.equal(closed,2,'Scrub to current Home closes the popup');
assert.equal(assigned,'https://example.test/account','Scrub to current Home does not navigate');
items[3].dataset.panel='account';
e=ev(items[0],touch(40,55,12),'start');handlers.touchstart(e);
handlers.touchmove(ev(items[0],touch(285,55,12),'move'));
handlers.touchend(ev(items[0],touch(285,55,12),'end'));
assert.equal(opened.at(-1),'account','Guest Account scrub opens overlay, not navigation');
assert.equal(assigned,'https://example.test/account','Guest Account does not cause another full page load');
delete items[3].dataset.panel;

assert.equal(back.prevented,true,'Scrub event is consumed');
// Account is not the active page on Home, so external navigation stays native.

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
const overlaySource=fs.readFileSync('theme/codela-storefront/assets/scripts/overlay-controller.js','utf8');
assert.ok(overlaySource.includes("name === 'search' ? $('.sf-search-cancel')"),'Search opens without auto focusing text input');
assert.ok(fs.readFileSync('theme/codela-storefront/assets/scripts/auth.js','utf8').includes('preventInitialAccountAutoFocus()'),'Account autofocus guard is installed');
assert.ok(src.includes("dock.addEventListener('touchmove'"),'Native touch support for mobil tarayıcı');
console.log('Dock modal, scrolling, touch scrubbing, hold and focus tests passed.');

