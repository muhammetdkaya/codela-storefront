const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('theme/codela-storefront/inc/agency.php','utf8');
const match=source.match(/<script>\(function\(\)\{var root=document\.documentElement,[\s\S]*?\}\)\(\);<\/script>/);
assert(match,'Inline first-entry script exists');
const schema=JSON.parse(fs.readFileSync('theme/codela-storefront/config/settings.json','utf8'));
const fields=schema.sections.flatMap(s=>s.fields).filter(f=>f.id==='first_entry_feedback_enabled');
assert.equal(fields.length,1);assert.equal(fields[0].type,'checkbox');assert.equal(fields[0].default,true);
assert.equal((source.match(/if \( !? ?codela_sf_first_entry_enabled\(\) \)/g)||[]).length,2);
function fixture({internal=false,ready=false}={}){
 let next=0, main=ready?{querySelector:()=>({})}:null, callback=null;
 const timers=new Map(), classes=new Set(), events={};
 const root={classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}};
 const doc={documentElement:root,referrer:internal?'https://example.test/services':'',readyState:'loading',getElementById:()=>main,addEventListener:(n,f)=>events[n]=f};
 const win={performance:{getEntriesByType:()=>[{type:'navigate'}]},location:{origin:'https://example.test'},addEventListener:(n,f)=>events[n]=f};
 vm.runInNewContext(match[0].slice(8,-9),{document:doc,window:win,URL,MutationObserver:class{constructor(f){callback=f}observe(){}disconnect(){callback=null}},setTimeout:(f,ms)=>{let id=++next;timers.set(id,{f,ms});return id},clearTimeout:id=>timers.delete(id)});
 return {classes,events,timers,win,advance:ms=>{for(const [id,t] of [...timers])if(t.ms<=ms&&timers.delete(id))t.f()},showContent:()=>{main={querySelector:()=>({})};callback?.()}};
}
let f=fixture({ready:true});assert(!f.classes.has('cdl-first-entry'));assert.equal(f.timers.size,0);
f=fixture({internal:true});assert(!f.classes.has('cdl-first-entry'));assert.equal(f.timers.size,0);
f=fixture();assert(f.classes.has('cdl-first-entry'));f.showContent();assert(!f.classes.has('cdl-first-entry'));assert.equal(f.timers.size,0);
f=fixture();assert(f.classes.has('cdl-first-entry'));f.win.codelaAgencyEntryReady();assert(!f.classes.has('cdl-first-entry'));
f=fixture();f.advance(4000);assert(!f.classes.has('cdl-first-entry'));
f=fixture();f.events.pageshow();assert(!f.classes.has('cdl-first-entry'));
console.log('First entry: fast paint, slow content, early footer, timeout and history passed.');
