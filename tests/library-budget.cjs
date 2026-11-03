// Same-file gzip accounting, not live transfer, parse, INP, LCP or FPS evidence.
const fs=require('node:fs'),assert=require('node:assert/strict'),{gzipSync}=require('node:zlib');
const baseline=JSON.parse(fs.readFileSync('tests/fixtures/library-baseline/source-sizes.json','utf8'));
const root='theme/codela-storefront/';
const size=path=>gzipSync(fs.readFileSync(root+path),{level:9}).length;
const prior=path=>baseline.assets.find(item=>item.path===path).gzip_bytes;
const graph=baseline.global_storefront_modules.paths;
const globalDelta=graph.reduce((sum,path)=>sum+size(path)-prior(path),0);
const dockDelta=size('assets/scripts/dock-controller.js')-prior('assets/scripts/dock-controller.js');
const productDelta=size('assets/scripts/product-information.js')-prior('assets/scripts/product-information.js');
const nativeCart=globalDelta-dockDelta+size('assets/scripts/panel-motion.js');
const lifecycle=dockDelta+productDelta;
assert(!fs.existsSync(root+'assets/vendor'),'Production graph must contain no vendor runtime');
const hero=size('assets/scripts/gallery-horizontal.js')-prior('assets/scripts/gallery-horizontal.js');
const report={baseline:baseline.source_sha,method:'Conservative cumulative route graph; sum of individual gzip level9 file sizes',native_cart_delta_bytes:nativeCart,hero_delta_bytes:hero,production_vendor_bytes:0,native_lifecycle_delta_bytes:lifecycle,worst_case_page_delta_bytes:nativeCart+hero+lifecycle,budget_bytes:15000};
fs.mkdirSync('qa/library-migration',{recursive:true});fs.writeFileSync('qa/library-migration/page-budget.json',JSON.stringify(report,null,2)+'\n');
assert(report.worst_case_page_delta_bytes<=report.budget_bytes,'Full affected graph exceeds initial page budget: '+JSON.stringify(report));
console.log(JSON.stringify(report));
