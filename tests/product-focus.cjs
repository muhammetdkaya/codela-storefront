// Execute the production focus/open/unmount functions against a controlled rAF
// boundary. Browser tests separately check actual visibility and native focus.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.env.PRODUCT_INFORMATION_SOURCE || 'theme/codela-storefront/assets/scripts/product-information.js', 'utf8');
function functionSource(name, optional = false) {
    const start = source.indexOf('    function ' + name + '(');
    if (start < 0 && optional) return '';
    assert(start >= 0, 'Production function exists: ' + name);
    const end = source.indexOf('\n    function ', start + 1);
    return source.slice(start, end < 0 ? undefined : end);
}
const production = functionSource('cancelPendingFocus', true) + functionSource('setOpen') + functionSource('unmount');
function fixture() {
    return vm.runInNewContext(`
        const frames=new Map(),calls=[],targets=new Set();let next=0;
        const requestAnimationFrame=fn=>{const id=++next;frames.set(id,fn);return id;};
        const cancelAnimationFrame=id=>frames.delete(id);
        const noop=()=>{};
        const classes=()=>{const values=new Set();return{contains:name=>values.has(name),toggle:(name,on)=>on?values.add(name):values.delete(name),remove:(...names)=>names.forEach(name=>values.delete(name))};};
        const style={removeProperty:noop};
        const document={body:{classList:classes(),style},activeElement:null};
        const sheet={classList:classes(),style,remove:noop,contains:node=>targets.has(node)};
        const media={classList:classes(),style,inert:false};
        const toggle={setAttribute:noop,focus:noop},content={contains:()=>false},purchase=null;
        const discovery={remove:noop};
        var mounted=true,expanded=false,focusFrame=0,focusGeneration=0,settleFrame=0,discoveryFrame=0,photoWidth=0;
        var originals=[],openSections=[],delivery=null;
        const finishDrag=noop,measure=noop,isDiscovering=()=>false;
        function target(name){const node={isConnected:true,scrollIntoView:options=>calls.push(['scroll',name,options]),focus:options=>calls.push(['focus',name,options])};targets.add(node);return node;}
        ${production}
        ({setOpen,unmount,target,calls,remove:node=>targets.delete(node),
          pending:()=>Array.from(frames.values()),
          flush(){const queued=Array.from(frames);frames.clear();queued.forEach(([,fn])=>fn());},
          snapshot:()=>({mounted,expanded,focusFrame,pending:frames.size})})
    `);
}
{
    const f=fixture(),target=f.target('valid');
    f.setOpen(true,target,true);assert.equal(f.snapshot().pending,1);f.flush();
    assert.equal(f.calls.length,2,'Current open request scrolls then focuses its native field');
    assert.equal(f.calls[0][0],'scroll');assert.equal(f.calls[1][0],'focus');
    assert.equal(f.calls[1][2].preventScroll,true);assert.equal(f.snapshot().focusFrame,0);
}
for(const end of ['close','unmount']) {
    const f=fixture(),target=f.target(end);
    f.setOpen(true,target,true);const stale=f.pending()[0];
    if(end==='close') f.setOpen(false,null,true);else f.unmount();
    assert.equal(f.snapshot().pending,0,end+' cancels the queued focus frame');
    stale();f.flush();
    assert.equal(f.calls.length,0,end+' invalidates even an already-queued stale callback');
    if(end==='unmount')assert.equal(f.snapshot().mounted,false);
}
{
    const f=fixture(),first=f.target('first'),second=f.target('second');
    f.setOpen(true,first,true);const stale=f.pending()[0];
    f.setOpen(true,second,true);const current=f.snapshot().focusFrame;
    stale();assert.equal(f.snapshot().focusFrame,current,'Old callback cannot erase the newer frame identity');
    assert.equal(f.calls.length,0);f.flush();
    assert.equal(f.calls.length,2);assert.equal(f.calls[1][1],'second','Only the latest native field request wins');
}
for(const end of ['disconnected','moved']) {
    const f=fixture(),target=f.target(end);f.setOpen(true,target,true);
    if(end==='disconnected')target.isConnected=false;else f.remove(target);
    f.flush();assert.equal(f.calls.length,0,'Never focus a '+end+' field');
}
console.log('Product pending focus: normal request, close/unmount cancellation, stale callback identity, latest target and detached/moved field guards passed.');
