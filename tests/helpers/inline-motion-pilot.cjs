// Research-only wrapper. Neither this helper nor the rejected Motion fixture
// belongs to the WordPress runtime or the normal storefront fixture graph.
const fs = require('node:fs');
const {transformSync} = require('esbuild');
const root = 'tests/fixtures/motion-pilot/';
function researchMotionSource() {
    const vendor = transformSync(fs.readFileSync(root + 'motion-mini.js', 'utf8'), {
        format:'iife', globalName:'__codelaMotionMini',
    }).code;
    const helper = fs.readFileSync(root + 'panel-motion.js', 'utf8').replace(/^export /gm, '')
        .replace("import('codela-storefront/motion-mini')", 'Promise.resolve(__codelaMotionMini)');
    return vendor + '\n' + helper;
}
module.exports = {researchMotionSource};
