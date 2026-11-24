const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('theme/codela-storefront/inc/agency.php','utf8');
const match=source.match(/<script>\(function\(\)\{var root=document\.documentElement,[\s\S]*?\}\)\(\);<\/script>/);
assert(match,'Inline first-entry script exists');
function fixture(){
 let next=0, main=null, callback=null;
 const timers=new Map(), classes=new Set(), events={};
 const root={classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}};
 const doc={documentElement:root,readyState:'loading',getElementById:()=>main,addEventListener:(n,f)=>events[n]=f};
 const win={addEventListener:(n,f)=>events[n]=f};
 vm.runInNewContext(match[0].slice(8,-9),{document:doc,window:win,MutationObserver:class{constructor(f){callback=f}observe(){}disconnect(){callback=null}},setTimeout:(f,ms)=>{let id=++next;timers.set(id,{f,ms});return id},clearTimeout:id=>timers.delete(id)});
 return {classes,events,timers,win,advance:ms=>{for(const [id,t] of [...timers])if(t.ms<=ms&&timers.delete(id))t.f()},showContent:()=>{main={querySelector:()=>({})};callback?.()}};
}
let f=fixture();f.showContent();f.advance(100);assert(!f.classes.has('cdl-first-entry'));assert.equal(f.timers.size,0);
f=fixture();f.advance(100);assert(f.classes.has('cdl-first-entry'));f.showContent();assert(!f.classes.has('cdl-first-entry'));assert.equal(f.timers.size,0);
f=fixture();f.advance(100);f.win.codelaAgencyEntryReady();assert(!f.classes.has('cdl-first-entry'));
f=fixture();f.advance(1800);assert(!f.classes.has('cdl-first-entry'));
f=fixture();f.advance(100);f.events.pageshow();assert(!f.classes.has('cdl-first-entry'));
console.log('First entry: fast paint, slow content, early footer, timeout and history passed.');
