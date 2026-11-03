// Keep legacy script-tag fixtures on the actual production dependency graph.
// Only the prebuilt ESM vendor export is wrapped for these non-module fixtures.
const fs = require('node:fs');
const {transformSync} = require('esbuild');
const root = 'theme/codela-storefront/assets/';
const strip = source => source.replace(/^import .*;$/gm, '').replace(/^export /gm, '');
let motion;
function panelMotionSource() {
    if (!motion) {
        const vendor = transformSync(fs.readFileSync(root + 'vendor/motion-mini.js', 'utf8'), {
            format:'iife', globalName:'__codelaMotionMini',
        }).code;
        motion = vendor + '\n' + strip(fs.readFileSync(root + 'scripts/panel-motion.js', 'utf8'))
            .replace("import('codela-storefront/motion-mini')", 'Promise.resolve(__codelaMotionMini)');
    }
    return motion;
}
function moduleSource(name, sourcePath) {
    return (name === 'overlay-controller' ? panelMotionSource() + '\n' : '')
        + strip(fs.readFileSync(sourcePath || root + 'scripts/' + name + '.js', 'utf8'));
}
module.exports = {moduleSource, panelMotionSource};
