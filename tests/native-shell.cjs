/** Native Codela shell contract after retiring Glisse from WordPress.
 * This guards the production asset path, not merely a stub/theme-toggle.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(p,'utf8');
const theme='theme/codela-storefront';
const php=read(theme+'/functions.php');
const css=read(theme+'/assets/styles/components.css');
const nav=read(theme+'/assets/styles/navigation.css');
const dock=read(theme+'/assets/scripts/dock-controller.js');
const overlay=read(theme+'/assets/scripts/overlay-controller.js');
const deploy=read('.github/workflows/deploy.yml');
const release=read('.github/workflows/release.yml');
assert.doesNotMatch(php, /codela-storefront-glisse|glisse-bridge|Glisse/i);
assert.doesNotMatch(deploy, /build-glisse|glisse@0\.5\.0|glisse-shell/i);
assert.doesNotMatch(release, /build-glisse|glisse@0\.5\.0|glisse-shell/i);
for(const file of [
  'scripts/build-glisse.mjs','scripts/glisse-bridge.jsx',
  'scripts/glisse-wp-react.js','scripts/glisse-wp-jsx-runtime.js',
  theme+'/assets/styles/glisse-bridge.css',
  theme+'/assets/scripts/glisse-bridge.js',
  'tests/glisse-shell.cjs','tests/glisse-shell-browser.cjs'
]){
  assert(!fs.existsSync(file), 'Legacy Glisse implementation must be absent: '+file);
}
assert.match(css,/\.sf-shell \.sf-ui-surface/,'Native glass surface remains in the UI Kit');
assert.match(css,/backdrop-filter:blur\(/,'Original native glass blur remains supported');
assert.match(nav,/\.sf-mobile-dock/,'Four-tab native dock retains its styling');
assert.match(dock,/sf-dock-item/,'Native dock interactions remain in the controller');
assert.match(overlay,/showModal\(/,'Menu stays a native accessible dialog');
assert.match(overlay,/finishClose\(/,'The native menu keeps its synchronous close');
const agencyCSS=read(theme+'/assets/styles/agency.css');
assert.match(agencyCSS,/\.sf-agency-widget--minimal \.sf-agency-minimal-hero::after\s*\{/);
assert.match(agencyCSS,/filter:none/);
assert.match(agencyCSS,/\.sf-agency-widget--services \.sf-agency-glass-info/);

// Agency pages share an actual document canvas; the viewport contract follows
// the native header/dock mode and never forces scroll snapping.
assert.match(agencyCSS,/html:has\(body:not\(\.sf-agency-mixed\) \.sf-content :is\(/,'Agency canvas colors html overscroll');
assert.match(agencyCSS,/body:not\(\.sf-agency-mixed\):has\(\.sf-content :is\(/,'Agency canvas is conditional on real widgets');
assert.match(agencyCSS,/--sf-agency-screen-block:calc\(100dvh/,'Stages use the dynamic usable screen');
assert.match(agencyCSS,/\.sf-shell\.has-mobile-dock/,'Only enabled dock reserves bottom clearance');
assert.match(agencyCSS,/body:not\(\.sf-agency-mixed\):has\(\.sf-content :is\([\s\S]*?\)\)\{padding-bottom:0!important\}/,'No generic dock body-strip on Agency');
assert.match(agencyCSS,/@media\(max-width:739px\) and \(max-height:700px\)/,'Short phones can scroll tall Studio content');
assert.doesNotMatch(agencyCSS,/scroll-snap-type:\s*y\s+mandatory/,'Agency never traps vertical page scroll');

console.log('Native Codela shell, no Glisse runtime and mobile Agency compositor contracts passed');
