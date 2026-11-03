// Keep legacy script-tag fixtures on the actual vendor-free production graph.
const fs = require('node:fs');
const root = 'theme/codela-storefront/assets/';
const strip = source => source.replace(/^import .*;$/gm, '').replace(/^export /gm, '');
function panelMotionSource() {
    return strip(fs.readFileSync(root + 'scripts/panel-motion.js', 'utf8'));
}
function moduleSource(name, sourcePath) {
    // Array.map supplies its numeric index as argument two. Only an explicit
    // string is a source override; never pass that index to fs as a file fd.
    const source = typeof sourcePath === 'string' && sourcePath ? sourcePath : root + 'scripts/' + name + '.js';
    return (name === 'overlay-controller' ? panelMotionSource() + '\n' : '')
        + strip(fs.readFileSync(source, 'utf8'));
}
module.exports = {moduleSource, panelMotionSource};
