// Theme-only cart shipping integration: reuse original plugin HTML via Woo cart data.
const assert=require('node:assert/strict');
const {setup,snapshot,tick}=require('./cart-race.cjs');

function makeSetup() {
  const x=setup((ctx,nodes)=>{
    nodes['#sf-cart-count']={textContent:'',hidden:true};
    nodes['#sf-cart-progress']={innerHTML:'',hidden:true};
    // The plugin's front-end JavaScript must NOT be needed in this cart.
    ctx.window.CodelaFsbHtml=undefined;
  });
  return x;
}
function themeCart(quantity,html) {
  const data=snapshot(quantity);
  data.extensions={'codela-storefront-shipping':{html}};
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
    await load(x,themeCart(1,'<div class="cdl-fsb cdl-fsb--cart"><div class="cdl-fsb-text">Ücretsiz kargo için ₺4.250 daha ekleyin.</div><div class="cdl-fsb-track"><span class="cdl-fsb-fill" style="width:15%"></span></div></div>'));
    assert.equal(x.nodes['#sf-cart-progress'].hidden,false,'Enabled module HTML becomes visible');
    assert.match(x.nodes['#sf-cart-progress'].innerHTML,/₺4.250/,'Plugin-owned message reaches the cart intact');
    assert.equal(x.nodes['#sf-cart-count'].textContent,'Items in cart: 1');
    assert.equal(x.nodes['#sf-cart-count'].hidden,false);
    assert.equal(x.requests.length,1,'No second cart request for shipping progress');
  }
  {
    const x=makeSetup();
    await load(x,themeCart(1,''));
    assert.equal(x.nodes['#sf-cart-progress'].hidden,true,'Disabled or inapplicable module stays hidden');
  }
  {
    const x=makeSetup();
    await load(x,themeCart(0,'<div class="cdl-fsb">stale HTML</div>'));
    assert.equal(x.nodes['#sf-cart-progress'].hidden,true,'Empty cart ignores any stale progress markup');
    assert.equal(x.nodes['#sf-cart-count'].hidden,true,'Empty cart has no item count');
  }
  {
    const x=makeSetup();
    await load(x,snapshot(1));
    assert.equal(x.nodes['#sf-cart-progress'].hidden,true,'Without plugin, no progress markup appears');
  }
  console.log('Theme-owned free-shipping cart integration contracts passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
