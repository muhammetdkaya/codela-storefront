const assert=require('node:assert/strict'),fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const php=process.env.PHP_BIN||'php';
const run=(context,debug)=>JSON.parse(execFileSync(php,['tests/asset-loading.php'],{encoding:'utf8',env:{...process.env,SF_ASSET_CONTEXT:context,SF_ASSET_DEBUG:debug?'1':'0'}}));
let cases=0;
for(const context of ['home','page','product','checkout','cart','guest-account','account','editor','page-story','page-products','page-mixed','page-disabled-products','page-loop']){
 const debug=run(context,true),prod=run(context,false);
 const hrefs=s=>[...s.matchAll(/href='([^']+)'/g)].map(m=>m[1]);
 const sources=s=>[...s.matchAll(/src="([^"]+)"/g)].map(m=>m[1]);
 const early=!['checkout','cart','guest-account','editor'].includes(context);
 assert.deepEqual(prod.style_done,debug.style_done,context+' preserves dependency handles');
 assert.deepEqual(prod.modules,debug.modules,context+' preserves the module graph');
 assert.equal(hrefs(debug.styles).length-hrefs(prod.styles).length,context==='editor'?0:early?5:4,context+' reduces only always-loaded theme files');
 assert.equal(sources(prod.scripts).length,early?1:0,context+' head bootstrap count');
 assert.equal(sources(debug.scripts).length,early?2:0,context+' debug source count');
 if(context==='editor'){
  assert(!prod.styles.includes('storefront-base.css'),'Editor gallery never inherits the storefront shell');
  assert(prod.styles.includes('styles/tokens.css')&&prod.styles.includes('styles/gallery.css'));
 }else{
  assert(prod.styles.includes('storefront-base.css'));
  assert(prod.styles.includes('--fixture-accent:purple'),'Inline CSS on a source-less handle is still printed');
  assert(prod.styles.includes('--sf-accent:#720eec'),'Merchant accent still follows theme base');
 }
 if(early){
  assert(prod.scripts.indexOf('window.codelaSFDocument=')<prod.scripts.indexOf('src="'),'Configuration precedes head runtime');
  assert(prod.scripts.indexOf('window.fixtureAfter=true')>prod.scripts.indexOf('src="'),'Dependent inline JS follows the runtime');
  assert(!/\b(?:async|defer)[= >]/.test(prod.scripts),'pagereveal registration remains synchronous');
 }
 const forbidden=context==='home'?['styles/product.css','styles/checkout.css','styles/account.css']:[];
 for(const file of forbidden)assert(!prod.styles.includes(file),'Home omits '+file);
 assert.equal(prod.styles.includes('styles/catalog.css'), !['editor','page-story','page-disabled-products'].includes(context), context+' catalog dependencies');
 cases++;
}
// Build artefacts must be exact ordered sources, so debug/production semantics
// do not drift and all CSS relative icon URLs keep their original styles/ base.
execFileSync('python3',['scripts/build-assets.py','--check'],{stdio:'pipe'});
console.log('Native WordPress asset loader: '+cases+' contexts × debug/production; 5 fewer blocking CSS and 1 fewer blocking JS on home, inline/dependency/editor boundaries passed.');
