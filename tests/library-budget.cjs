// Same-file gzip accounting, not live transfer, parse, INP, LCP or FPS evidence.
const fs=require('node:fs'),assert=require('node:assert/strict'),{gzipSync}=require('node:zlib');
const baseline=JSON.parse(fs.readFileSync('tests/fixtures/library-baseline/source-sizes.json','utf8'));
const root='theme/codela-storefront/';
const size=path=>gzipSync(fs.readFileSync(root+path),{level:9}).length;
const prior=path=>baseline.assets.find(item=>item.path===path).gzip_bytes;
const graph=baseline.global_storefront_modules.paths;
const motion=graph.reduce((sum,path)=>sum+size(path)-prior(path),0)
 +size('assets/scripts/panel-motion.js')+size('assets/vendor/motion-mini.js');
const hero=size('assets/scripts/gallery-horizontal.js')-prior('assets/scripts/gallery-horizontal.js')+size('assets/vendor/embla-carousel.js');
const report={baseline:baseline.source_sha,method:'Sum of individual gzip level9 file sizes',motion_delta_bytes:motion,hero_delta_bytes:hero,worst_case_page_delta_bytes:motion+hero,budget_bytes:15*1024};
fs.mkdirSync('qa/library-migration',{recursive:true});fs.writeFileSync('qa/library-migration/page-budget.json',JSON.stringify(report,null,2)+'\n');
assert(motion+hero<=report.budget_bytes,'Full affected graph exceeds initial page budget: '+JSON.stringify(report));
console.log(JSON.stringify(report));
