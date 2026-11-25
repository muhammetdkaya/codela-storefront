const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('theme/codela-storefront/inc/agency.php','utf8');
const match=source.match(/<script>\(function\(\)\{var root=document\.documentElement,[\s\S]*?\}\)\(\);<\/script>/);
assert(match,'Inline first-entry script exists');
const schema=JSON.parse(fs.readFileSync('theme/codela-storefront/config/settings.json','utf8'));
const fields=schema.sections.flatMap(s=>s.fields).filter(f=>f.id==='first_entry_feedback_enabled');
assert.equal(fields.length,1);assert.equal(fields[0].type,'checkbox');assert.equal(fields[0].default,true);
const streamingFields=schema.sections.flatMap(s=>s.fields).filter(f=>f.id==='early_html_streaming_enabled');
assert.equal(streamingFields.length,1);assert.equal(streamingFields[0].type,'checkbox');assert.equal(streamingFields[0].default,false);
require('node:child_process').execFileSync('php',['tests/agency-streaming.php'],{stdio:'inherit'});
assert.equal((source.match(/if \( !? ?codela_sf_first_entry_enabled\(\) \)/g)||[]).length,1);
assert(!source.includes('data-cdl-entry-css'),'Native stylesheet loading remains intact');
assert(!match[0].includes('MutationObserver')&&!match[0].includes('codelaAgencyEntryReady'),'No content readiness handshake');
function fixture({internal=false,intent=false,history=false,loaded=false}={}){
 let next=0,now=0;
 const timers=new Map(),frames=new Map(),classes=new Set(),events={},marks=[];
 const root={classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}};
 const doc={documentElement:root,referrer:internal?'https://example.test/services':'',readyState:loaded?'complete':'loading',addEventListener:(n,f)=>events[n]=f};
 const win={performance:{mark:n=>marks.push(n),getEntriesByType:()=>[{type:history?'back_forward':'navigate'}]},location:{origin:'https://example.test',href:'https://example.test/'},sessionStorage:{getItem:()=>intent?JSON.stringify({url:'https://example.test/',time:Date.now()}):null,removeItem:()=>{}},addEventListener:(n,f)=>events[n]=f,requestAnimationFrame:f=>{const id=++next;frames.set(id,f);return id},cancelAnimationFrame:id=>frames.delete(id)};
 vm.runInNewContext(match[0].slice(8,-9),{document:doc,window:win,URL,setTimeout:(f,ms)=>{let id=++next;timers.set(id,{f,at:now+ms});return id},clearTimeout:id=>timers.delete(id)});
 return {classes,events,timers,marks,paint:()=>{for(const [id,f] of [...frames])if(frames.delete(id))f()},advance:ms=>{now+=ms;for(const [id,t] of [...timers])if(t.at<=now&&timers.delete(id))t.f()}};
}
for(const opts of [{loaded:true},{internal:true},{intent:true},{history:true}]){const f=fixture(opts);assert(!f.classes.has('cdl-first-entry'));assert.equal(f.timers.size,0);}
let f=fixture();assert(f.classes.has('cdl-first-entry'));
f.events.DOMContentLoaded();f.paint();f.paint();assert(f.marks.includes('codela-entry-hold-start'));
f.events.pageshow({persisted:false});f.advance(999);assert(f.classes.has('cdl-first-entry'),'Fast page stays on entry for fixed one second');
f.advance(1);assert(!f.classes.has('cdl-first-entry'));assert.equal(f.timers.size,0);
f=fixture();f.advance(2000);assert(f.classes.has('cdl-first-entry'),'Slow page has not started fixed hold before its first render opportunity');
f.events.DOMContentLoaded();f.paint();f.paint();f.advance(1000);assert(!f.classes.has('cdl-first-entry'));
f=fixture();f.advance(8000);assert(!f.classes.has('cdl-first-entry'),'Fail open on stalled document');
f=fixture();f.events.pagehide();assert(!f.classes.has('cdl-first-entry'));assert.equal(f.timers.size,0);
f=fixture();f.events.pageshow({persisted:true});assert(!f.classes.has('cdl-first-entry'),'BFCache restore skips entry');
console.log('Fixed entry: one-second hold, slow document, fail-open, internal intent and history passed.');
