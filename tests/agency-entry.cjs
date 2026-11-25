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
assert.equal((source.match(/if \( !? ?codela_sf_first_entry_enabled\(\) \)/g)||[]).length,2);
function fixture({internal=false,ready=false,intent=false,history=false,pendingCSS=false,loaded=false}={}){
 let next=0, main=ready?{querySelector:()=>({})}:null, callback=null;
 const timers=new Map(),frames=new Map(),classes=new Set(),events={},marks=[];
 const root={classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}};
 const css={pending:pendingCSS,media:'print',hasAttribute:k=>k==='data-cdl-entry-css'&&css.pending,getAttribute:()=> 'all',removeAttribute:()=>{css.pending=false}};
 const doc={documentElement:root,referrer:internal?'https://example.test/services':'',readyState:loaded?'complete':'loading',getElementById:()=>main,querySelector:()=>css.pending?css:null,querySelectorAll:()=>css.pending?[css]:[],addEventListener:(n,f)=>events[n]=f};
 const win={performance:{mark:n=>marks.push(n),getEntriesByType:()=>[{type:history?'back_forward':'navigate'}]},location:{origin:'https://example.test',href:'https://example.test/'},sessionStorage:{getItem:()=>intent?JSON.stringify({url:'https://example.test/',time:Date.now()}):null,removeItem:()=>{}},addEventListener:(n,f)=>events[n]=f,requestAnimationFrame:f=>{const id=++next;frames.set(id,f);return id},cancelAnimationFrame:id=>frames.delete(id)};
 vm.runInNewContext(match[0].slice(8,-9),{document:doc,window:win,URL,MutationObserver:class{constructor(f){callback=f}observe(){}disconnect(){callback=null}},setTimeout:(f,ms)=>{let id=++next;timers.set(id,{f,ms});return id},clearTimeout:id=>timers.delete(id)});
 return {classes,events,timers,win,css,marks,paint:()=>{for(const [id,f] of [...frames])if(frames.delete(id))f()},advance:ms=>{for(const [id,t] of [...timers])if(t.ms<=ms&&timers.delete(id))t.f()},showContent:()=>{main={querySelector:()=>({})};callback?.()},loadCSS:()=>events.load({target:css})};
}
for(const opts of [{loaded:true},{internal:true},{intent:true},{history:true}]){const f=fixture(opts);assert(!f.classes.has('cdl-first-entry'));assert.equal(f.timers.size,0);}
let f=fixture({pendingCSS:true});assert(f.classes.has('cdl-first-entry'));f.showContent();f.paint();assert(f.classes.has('cdl-first-entry'),'Parsed heading is not a ready page');f.win.codelaAgencyEntryReady();f.paint();assert(f.classes.has('cdl-first-entry'),'Pending theme styles retain entry');
f.loadCSS();assert.equal(f.css.media,'all');assert(f.classes.has('cdl-first-entry'));f.paint();assert(!f.classes.has('cdl-first-entry'));assert.equal(f.timers.size,0);
f=fixture({ready:true});f.win.codelaAgencyEntryReady();assert(f.classes.has('cdl-first-entry'));f.paint();assert(!f.classes.has('cdl-first-entry'));
f=fixture({pendingCSS:true});f.advance(4000);assert(!f.classes.has('cdl-first-entry'));assert.equal(f.css.media,'all');
f=fixture();f.events.pageshow();assert(!f.classes.has('cdl-first-entry'));
assert(source.includes("data-cdl-entry-css")&&source.includes("<noscript>"),'Styles retain no-JS fallback');
console.log('First entry: CSS readiness, render opportunity, fail-open, internal intent and history passed.');
