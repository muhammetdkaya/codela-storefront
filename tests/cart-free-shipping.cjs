// The Codela cart must display the enabled plugin module from the live Woo Store API,
// without guessing a threshold from page HTML or making another cart network request.
const assert=require('node:assert/strict');
const {setup,snapshot,tick}=require('./cart-race.cjs');

function makeSetup() {
  let renders=0, latestConfig;
  const x=setup((ctx,nodes)=>{
    nodes['#sf-cart-count']={textContent:'',hidden:true};
    nodes['#sf-cart-progress']={innerHTML:'',hidden:true};
    ctx.window.CodelaFsbHtml=(config,cart)=>{
      renders++;
      latestConfig=config;
      return cart.items.length ? '<div class="cdl-fsb">'+config.threshold+'</div>' : '';
    };
  });
  return {...x,get renders(){return renders},get config(){return latestConfig}};
}
function pluginCart(quantity,config) {
  const data=snapshot(quantity);
  data.extensions={'codela-free-shipping-bar':{config_json:config?JSON.stringify(config):''}};
  return data;
}
async function load(x,data) {
  const pending=x.controller.refresh();
  await tick();
  x.answer(0,data);
  await pending;
}
(async()=>{
  {
    const x=makeSetup();
    await load(x,pluginCart(1,{threshold:5000,context:'cart',progress:'{remaining}'}));
    assert.equal(x.nodes['#sf-cart-progress'].hidden,false,'Enabled progress becomes visible');
    assert.match(x.nodes['#sf-cart-progress'].innerHTML,/5000/,'Plugin threshold reaches the renderer');
    assert.equal(x.config.context,'cart','Plugin controls rendering context');
    assert.equal(x.nodes['#sf-cart-count'].textContent,'Items in cart: 1');
    assert.equal(x.nodes['#sf-cart-count'].hidden,false);
    assert.equal(x.requests.length,1,'No second cart request for progress');
    assert.equal(x.renders,1);
  }
  {
    const x=makeSetup();
    await load(x,pluginCart(1,null));
    assert.equal(x.nodes['#sf-cart-progress'].hidden,true,'Disabled or inapplicable module stays hidden');
    assert.equal(x.renders,0);
  }
  {
    const x=makeSetup();
    await load(x,pluginCart(0,{threshold:5000}));
    assert.equal(x.nodes['#sf-cart-progress'].hidden,true,'Empty cart has no progress bar');
    assert.equal(x.nodes['#sf-cart-count'].hidden,true,'Empty cart has no item count');
  }
  console.log('Storefront / free-shipping module cart integration contracts passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
