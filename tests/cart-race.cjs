// Deferred-response cart regression using the real controller source.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('theme/codela-storefront/assets/scripts/cart-controller.js','utf8')
  .replace(/^import .*;$/gm,'').replace(/^export /gm,'');
function deferred() { let resolve,reject; const promise=new Promise((a,b)=>{resolve=a;reject=b;}); return {promise,resolve,reject}; }
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function snapshot(quantity) {
 return {items_count:quantity,items:quantity?[{key:'k',name:'Product',quantity,permalink:'/p',images:[],variation:[],totals:{line_subtotal:'100',line_subtotal_tax:'0',currency_code:'TRY',currency_minor_unit:2}}]:[],totals:{total_items:String(quantity*100),total_items_tax:'0',currency_code:'TRY',currency_minor_unit:2}};
}
function setup() {
 const requests=[], listeners={}, nodes={};
 const element=()=>({innerHTML:'',textContent:'',hidden:false,inert:false,dataset:{},disabled:false,setAttribute(){},querySelectorAll(){return []},focus(){}});
 for(const id of ['#sf-cart-items','.sf-cart-bottom','#sf-subtotal','#sf-status','#sf-cart','.sf-close'])nodes[id]=element();
 const context={console,AbortController,Promise,queueMicrotask,fetch:(url,options)=>{const d=deferred();requests.push({url,options,...d});return d.promise;},
 document:{querySelectorAll:()=>[],body:{addEventListener:(name,fn)=>{listeners[name]??=[];listeners[name].push(fn);}}},
 window:{addEventListener:()=>{}},escape:x=>x,decode:x=>x,safeURL:x=>x,money:x=>String(x)};
 vm.createContext(context);vm.runInContext(source+'\nthis.createCartController=createCartController;',context);
 const controller=context.createCartController({$:id=>nodes[id],config:()=>({api:'/api/',cart:'/cart'}),t:x=>x,getCurrent:()=> 'cart',getDialog:()=>({open:false})});
 const answer=(index,data,nonce='nonce-'+index,ok=true,code)=>requests[index].resolve({ok,headers:{get:key=>key==='Nonce'?nonce:null},json:async()=>ok?data:{code,message:'failure'}});
 return {controller,requests,nodes,listeners,answer};
}
(async()=>{
 // An old GET must never replace the successful POST or its nonce.
 {
 const x=setup();const read=x.controller.refresh();await tick();assert.equal(x.requests.length,1);
 const write=x.controller.change({dataset:{key:'k',qty:'2'}});
 await tick();assert.equal(x.requests.length,2,'Write obtains a controlled nonce');
 x.answer(1,snapshot(1),'fresh');await tick();await tick();
 assert.equal(x.requests.length,3);assert.equal(x.requests[2].options.headers.Nonce,'fresh');
 x.answer(2,snapshot(2),'post');await write;
 x.answer(0,snapshot(1),'stale');await read;await tick();
 assert.equal(x.controller.getData().items_count,2);
 }
 // Three external events during POST must lead to a single refresh.
 {
 const x=setup();const write=x.controller.change({dataset:{key:'k',qty:'2'}});await tick();
 x.answer(0,snapshot(1),'fresh');await tick();await tick();
 x.controller.invalidate();x.controller.invalidate();x.controller.invalidate();
 x.answer(1,snapshot(2),'post');await write;await tick();await tick();
 assert.equal(x.requests.length,3);
 x.answer(2,snapshot(3));await tick();await tick();
 assert.equal(x.controller.getData().items_count,3);
 }
 // Double bind cannot duplicate initial GET or native event listeners.
 {
 const x=setup();x.controller.bind();x.controller.bind();await tick();
 assert.equal(x.requests.length,1);
 assert.equal(x.listeners['wc_blocks_added_to_cart'],undefined);
 assert.equal(x.listeners.wc-blocks_added_to_cart?.length,1);
 assert.equal(x.listeners.wc-blocks_removed_from_cart?.length,1);
 x.answer(0,snapshot(0));await tick();
 }
 console.log('Cart race regression tests passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
