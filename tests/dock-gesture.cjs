// Runtime tests: dock remains interactive in a native dialog, tabs can be
// scrubbed with a finger, normal clicks retain browser navigation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('theme/codela-storefront/assets/storefront.js','utf8');
const start=source.indexOf('function mobileDock() {');
const end=source.indexOf('\nfunction open(name, event) {',start);
assert.ok(start>-1 && end>start,'Dock controller must be present');
function classes() {
  const values=new Set();
  return {
    add:k=>values.add(k),
    remove:k=>values.delete(k),
    contains:k=>values.has(k),
    toggle:(k,on)=>on===undefined?(values.has(k)?values.delete(k):values.add(k)):on?values.add(k):values.delete(k)
  };
}
let assigned='',opened=[],timerSeq=0;
const timeouts=new Map();
const items=['home','search','cart','account'].map((name,i)=>{
  const el={
    dataset:{dockView:name},
    classList:classes(),
    attrs:new Map(),
    href:'https://example.test/'+name,
    getBoundingClientRect:()=>({left:i*80,top:30,width:80,height:65}),
    hasAttribute(k){return this.attrs.has(k)},
    setAttribute(k,v){this.attrs.set(k,v)},
  };
  if(name==='home')el.attrs.set('aria-current','page');
  return el;
});
const handlers={};
const shell={};
const dock={
  parentElement:shell,hidden:false,
  classList:classes(),
  getBoundingClientRect:()=>({left:0,top:20,right:320,bottom:106,width:320,height:86}),
  querySelectorAll:sel=>sel==='.sf-dock-item'?items:[],
  addEventListener:(name,handler)=>{handlers[name]=handler},
  appendChild(){},
  setPointerCapture(){this.captured=true},
};
const dialog={
  appendChild(el){el.parentElement=this},
  before(el){el.parentElement=shell},
};
const context={
  dialog,
  $:sel=>sel==='.sf-mobile-dock'?dock:null,
  clearTimeout:id=>timeouts.delete(id),
  setTimeout:fn=>{const id=++timerSeq;timeouts.set(id,fn);return id},
  open:name=>opened.push(name),
  window:{location:{assign:href=>{assigned=href}}},
  Math
};
const api=vm.runInNewContext(source.slice(start,end)+'\n({mountDock,restoreDock,markDockActive,dockCandidate,installDockGestures})',context);
api.mountDock();
assert.equal(dock.parentElement,dialog,'Dock must enter dialog top layer');
api.markDockActive('search');
assert.equal(items[1].classList.contains('is-active'),true,'Search shows active state');
assert.equal(items[0].classList.contains('is-active'),false,'Home is no longer active while searching');
assert.equal(items[1].attrs.get('aria-expanded'),'true');
api.markDockActive('cart');
assert.equal(items[2].classList.contains('is-active'),true,'Cart highlights without closing modal');
api.restoreDock();
assert.equal(dock.parentElement,shell,'Closing restores dock to page');
assert.equal(items[0].classList.contains('is-active'),true,'Home page active state is restored');
assert.equal(api.dockCandidate(dock,245,60),items[3],'Last tab chosen under rightward finger');
assert.equal(api.dockCandidate(dock,165,60),items[2],'Middle finger position chooses cart');
assert.equal(api.dockCandidate(dock,165,400),null,'Out-of-dock vertical gesture rejected');
api.installDockGestures(dock);
const pointer=(target,x,y,id=1)=>({button:0,pointerType:'touch',pointerId:id,
  target:{closest:()=>target},clientX:x,clientY:y,
  preventDefault(){this.prevented=true}});
let ev=pointer(items[0],40,55);
handlers.pointerdown(ev);
assert.ok(items[0].classList.contains('is-pressed'),'Tap gives immediate feedback');
handlers.pointerup(pointer(items[0],40,55));
assert.equal(opened.length,0,'Simple taps use native click (no duplicated navigation)');
ev=pointer(items[0],40,55,2);
handlers.pointerdown(ev);
let move=pointer(items[0],169,55,2);
handlers.pointermove(move);
assert.equal(dock.classList.contains('is-scrubbing'),true,'Horizontal drag enters scrub mode');
assert.equal(items[2].classList.contains('is-preview'),true,'Cart previews under the finger');
assert.equal(move.prevented,true,'Dragging does not scroll the page horizontally');
let up=pointer(items[0],168,55,2);
handlers.pointerup(up);
assert.equal(opened.at(-1),'cart','Releasing on cart opens cart');
assert.equal(up.prevented,true,'Dragged gesture blocks duplicate native navigation');
let clickSuppressed=false;
handlers.click({preventDefault(){clickSuppressed=true},stopImmediatePropagation(){}});
assert.equal(clickSuppressed,true,'Synthetic click suppressed after drag');
ev=pointer(items[0],40,55,3);
handlers.pointerdown(ev);
const holdFn=[...timeouts.values()].at(-1);
assert.equal(typeof holdFn,'function');
holdFn();
assert.equal(dock.classList.contains('is-scrubbing'),true,'Press-and-hold activates scrub');
handlers.pointermove(pointer(items[0],285,55,3));
handlers.pointerup(pointer(items[0],285,55,3));
assert.equal(assigned,'https://example.test/account','Release on account navigates');
console.log('Dock top layer, active tabs, tap feedback and scrub-to-release: passed.');
