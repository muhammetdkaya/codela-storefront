const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('theme/codela-storefront/assets/scripts/navigation-feedback.js','utf8');
function fixture(){
 let seq=0,now=0;const timers=new Map(),events={},attrs=new Map(),surfaces=[];
 const main={isConnected:true,getAttribute:k=>attrs.get(k)??null,setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k)};
 Object.defineProperty(main,'inert',{get:()=>attrs.has('inert'),set:v=>v?attrs.set('inert',''):attrs.delete('inert')});
 const node=()=>({dataset:{},setAttribute(){},append(){},remove(){this.removed=true}});
 const document={querySelector:s=>s==='#sf-content'?main:s==='.sf-shell.has-agency-profile'?{}:null,createElement:node,body:{append:n=>surfaces.push(n)},documentElement:{removeAttribute(){}},addEventListener(){},activeElement:null};
 const location={href:'https://test.example/',origin:'https://test.example'};
 const window={codelaSFDocument:{home:location.href,agencyRoutes:[{kind:'about',url:'https://test.example/about/'}]},addEventListener:(n,f)=>events[n]=f,dispatchEvent(){}};
 vm.runInNewContext(source,{window,document,location,URL,Event:class{},sessionStorage:{setItem(){}},setTimeout:(fn,ms)=>{const id=++seq;timers.set(id,{fn,at:now+ms});return id},clearTimeout:id=>timers.delete(id)});
 return {f:window.codelaSFFeedback,main,events,surfaces,advance(ms){now+=ms;for(const [id,t] of [...timers])if(t.at<=now&&timers.delete(id))t.fn();}};
}
let a=fixture(),url='https://test.example/about/',t=a.f.begin({url});assert.equal(a.surfaces[0].dataset.phase,'quiet');a.advance(149);assert.equal(a.surfaces[0].dataset.phase,'quiet');assert(!a.main.inert);a.f.end(t);a.advance(1000);assert(a.surfaces[0].removed);assert.equal(a.surfaces[0].dataset.phase,'quiet');
a=fixture();t=a.f.begin({url});a.advance(150);assert.equal(a.surfaces[0].dataset.phase,'header');assert(!a.main.inert);a.advance(599);assert.equal(a.surfaces[0].dataset.phase,'header');a.advance(1);assert.equal(a.surfaces[0].dataset.phase,'center');assert(a.main.inert);a.events.pagehide();assert(a.surfaces[0].removed);assert(!a.main.inert);a.advance(1000);assert(!a.f.active(t));
a=fixture();const old=a.f.begin({url});a.advance(100);const fresh=a.f.begin({url});a.advance(50);assert.equal(a.surfaces[1].dataset.phase,'quiet');assert(!a.f.end(old));a.advance(100);assert.equal(a.surfaces[1].dataset.phase,'header');a.f.end(fresh);assert(!a.main.inert);
console.log('Adaptive Agency timing, cancellation, page handoff and stale token passed.');
