// Runtime geometry checks for the fullscreen panel's iOS-style origin reveal.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('theme/codela-storefront/assets/storefront.js', 'utf8');
const start = source.indexOf('function placePanelReveal(source) {');
const end = source.indexOf('\nfunction open(name, event)', start);
assert.ok(start !== -1 && end > start, 'panel reveal function must exist');
const behavior = source.slice(start, end);
function insets(panel, trigger) {
    const custom = new Map();
    const dialog = {
        getBoundingClientRect() { return panel; },
        style: { setProperty(k, v) { custom.set(k, v); } }
    };
    vm.runInNewContext(behavior + '\nplacePanelReveal(trigger);', {dialog,trigger,Math});
    const value = key => Number.parseFloat(custom.get('--sf-reveal-' + key));
    return [value('top'),value('right'),value('bottom'),value('left')];
}
assert.deepEqual(insets(
    {left:0,top:0,width:390,height:850},
    {left:20,top:16,width:44,height:44}
), [16,326,790,20], 'menu must expand from left');
assert.deepEqual(insets(
    {left:0,top:0,width:390,height:850},
    {left:326,top:16,width:44,height:44}
), [16,20,790,326], 'cart must expand from right');
assert.deepEqual(insets(
    {left:0,top:46,width:390,height:804},
    {left:282,top:64,width:44,height:44}
), [18,64,742,282], 'admin toolbar must be subtracted from origin');
assert.deepEqual(insets(
    {left:0,top:0,width:390,height:850},
    {left:-20,top:-50,width:44,height:44}
), [0,346,806,0], 'out-of-bounds launcher should be clamped');
assert.ok(source.includes('revealRect = sourceRect || null;'),'launcher position must be remembered before fixed scroll lock');
assert.ok(source.includes('dialog.showModal();\n        // Synchronous setup'),'modal must remain natively modal');
assert.ok(source.includes('PANEL_MOTION_MS = 420'),'close duration should match CSS');
console.log('Panel origin geometry: menu, right actions, toolbar and clamping passed.');
