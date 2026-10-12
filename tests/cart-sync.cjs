// Controller contract tests. Real WP/Woo browser acceptance remains a separate gate.
const assert = require('node:assert/strict');
const {setup, snapshot, tick} = require('./cart-race.cjs');
function setupWoo({classic = false, late = false, failRefresh = false, holdRefresh = false} = {}) {
    let subscriber, current = snapshot(1), subscriptions = 0, resolves = 0;
    const invalidations = [], outgoing = [], events = {}, windowEvents = {};
    const releases = [];
    const store = {};
    const registry = {
        select: () => ({getCartData: () => current}),
        dispatch: () => ({invalidateResolution: (...args) => invalidations.push(args)}),
        resolveSelect: () => ({getCartData: async () => {
            resolves++;
            if (failRefresh) throw Error('Secondary refresh failed');
            if (holdRefresh) await new Promise(resolve => releases.push(resolve));
            return current;
        }}),
        subscribe: fn => {subscriptions++; subscriber = fn;},
    };
    let context;
    const x = setup((ctx, nodes) => {
        context = ctx;
        ctx.window.wp = {data:registry};
        if (!late) ctx.window.wc = {wcBlocksData:{cartStore:store}};
        ctx.window.addEventListener = (name, fn) => {windowEvents[name] = fn;};
        ctx.window.jQuery = () => ({
            on: (names, fn) => names.split(' ').forEach(name => events[name] = fn),
            trigger: name => outgoing.push(name),
        });
        if (classic) {
            nodes['.woocommerce-cart-form'] = {};
            nodes['form.checkout'] = {};
        }
    });
    return {...x, invalidations, outgoing, events, releases,
        get subscriptions() {return subscriptions;},
        get resolves() {return resolves;},
        emit: data => {current = data; subscriber();},
        load: () => {context.window.wc = {wcBlocksData:{cartStore:store}}; windowEvents.load();},
    };
}
async function initialize(x) {
    x.controller.bind(); x.controller.bind(); await tick();
    x.answer(0, snapshot(1)); await tick(); await tick();
}
async function change(x, {remove = false, fail = false} = {}) {
    const offset = x.requests.length;
    const pending = x.controller.change({dataset:remove ? {remove:'k'} : {key:'k', qty:'2'}});
    await tick();
    // This fixture's first write has no stored nonce.
    x.answer(offset, snapshot(1)); await tick(); await tick();
    x.answer(offset + 1, snapshot(remove ? 0 : 2), 'post', !fail, 'stock_error');
    if (fail) {await tick(); x.answer(offset + 2, snapshot(1));}
    await pending; await tick(); await tick();
}
(async () => {
    {
        const x = setupWoo(); await initialize(x);
        assert.equal(x.subscriptions, 1);
        x.emit(snapshot(1)); await tick();
        assert.equal(x.requests.length, 1, 'Unrelated/identical store updates do not fetch');
        x.emit(snapshot(3)); await tick();
        assert.equal(x.requests.length, 2, 'Blocks quantity change invalidates theme');
        x.answer(1, snapshot(3)); await tick(); await tick();
        assert.equal(x.controller.getData().items_count, 3);
        assert.equal(x.resolves, 0, 'Theme GET never sends store notifications back');
    }
    for (const remove of [false, true]) {
        const x = setupWoo(); await initialize(x); await change(x, {remove});
        assert.equal(x.resolves, 1, 'Successful quantity/remove refreshes Woo through its resolver');
        assert.equal(x.invalidations[0][0], 'getCartData');
        assert.equal(x.invalidations[0][1].length, 0);
        assert.equal(x.outgoing.length, 0, 'No fake add event or global fragments refresh');
        const count = x.requests.length;
        x.emit(snapshot(remove ? 0 : 2)); await tick();
        assert.equal(x.requests.length, count, 'Own accepted snapshot does not echo another theme GET');
    }
    {
        const x = setupWoo({classic:true}); await initialize(x); await change(x);
        assert.deepEqual(x.outgoing, ['wc_update_cart', 'update_checkout']);
        x.events.updated_checkout(); x.events.updated_wc_div(); await tick();
        assert.equal(x.requests.length, 4, 'Paired classic completion signals coalesce');
        x.answer(3, snapshot(2)); await tick();
    }
    {
        const x = setupWoo(); await initialize(x); await change(x, {fail:true});
        assert.equal(x.resolves, 0, 'Failed POST does not announce success to Woo');
    }
    {
        const x = setupWoo({failRefresh:true}); await initialize(x); await change(x);
        assert.equal(x.controller.getData().items_count, 2);
        assert.equal(x.requests.length, 3, 'Consumer error does not retry POST or start recovery');
    }
    {
        const x = setupWoo({holdRefresh:true}); await initialize(x); await change(x);
        assert.equal(x.resolves, 1);
        const second = x.controller.change({dataset:{key:'k', qty:'3'}}); await tick();
        x.answer(3, snapshot(3)); await second; await tick();
        assert.equal(x.resolves, 1, 'Secondary refresh is serialized');
        x.releases[0](); await tick(); await tick();
        assert.equal(x.resolves, 2, 'Second write is not lost behind pending Woo refresh');
        x.releases[1](); await tick();
    }
    {
        const x = setupWoo({late:true}); await initialize(x);
        assert.equal(x.subscriptions, 0);
        x.load(); x.load(); assert.equal(x.subscriptions, 1);
    }
    {
        const x = setup(); await initialize(x);
        x.listeners['wc-blocks_added_to_cart'][0]();
        x.listeners['wc-blocks_removed_from_cart'][0](); await tick();
        assert.equal(x.requests.length, 2, 'Native signals coalesce without loading Woo Blocks');
        x.answer(1, snapshot(0)); await tick();
    }
    console.log('Cart/Woo synchronization contracts passed (not real WP/Woo acceptance)');
})().catch(error => {console.error(error); process.exitCode = 1;});
