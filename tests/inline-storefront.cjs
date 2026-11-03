const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {moduleSource} = require('./helpers/inline-storefront.cjs');
const names = ['format','search-controller','cart-controller','overlay-controller','dock-controller'];
const mapped = names.map(moduleSource);
assert.deepEqual(mapped,names.map(name=>moduleSource(name)),'Array.map indices are never interpreted as file descriptors');
new vm.Script(mapped.join('\n'));
assert(!mapped.join('\n').includes('__codelaMotionMini'),'Normal storefront fixtures load no research vendor');
assert(!mapped.join('\n').includes('panelMotionReady'),'Normal storefront fixtures have no vendor readiness');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'codela-inline-source-'));
try {
    const oldSource=path.join(dir,'overlay-old.js');
    fs.writeFileSync(oldSource,'export function createOverlayController() { return "immutable-native-baseline-fixture"; }\n');
    const explicit=moduleSource('overlay-controller',oldSource);
    assert(explicit.includes('immutable-native-baseline-fixture'),'Explicit old-source path is used');
    assert(!explicit.includes('Overlay controller already bound'),'Current controller does not replace explicit baseline');
    assert(explicit.includes('function animatePanelTransform'),'Actual helper dependencies remain present');
    assert.equal((explicit.match(/function createOverlayController\(/g)||[]).length,1,'One controller in override fixture');
    new vm.Script(explicit);
    assert.equal(moduleSource('format',1),moduleSource('format'),'Numeric sourcePath is ignored');
    assert.equal(moduleSource('format',''),moduleSource('format'),'Empty override retains default source');
} finally {fs.rmSync(dir,{recursive:true,force:true});}
console.log('Inline storefront loader passed: direct Array.map, numeric/default paths, explicit historical source, actual dependency graph parse.');
