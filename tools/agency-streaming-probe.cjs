// Measure actual arrival of both markers over the same response (not just TTFB).
// Usage: node tools/agency-streaming-probe.cjs https://codela.dev/
const https=require('node:https');
const {performance}=require('node:perf_hooks');
const target=process.argv[2];if(!target)throw Error('Provide HTTPS homepage URL');
const start=performance.now();let first=null,rendered=null,tail='';
const req=https.get(target,{headers:{'Accept-Encoding':'identity','Accept':'text/html','User-Agent':'CodelaStreamingProbe/1.0'}},res=>{
 const headersAt=performance.now()-start;
 if(res.statusCode!==200){res.resume();console.error('HTTP',res.statusCode);process.exitCode=1;return;}
 res.setEncoding('utf8');
 res.on('data',part=>{
  const elapsed=performance.now()-start;const text=tail+part;
  if(first===null&&text.includes('<!-- codela-stream-start -->'))first=elapsed;
  if(rendered===null&&text.includes('<!-- codela-stream-rendered -->'))rendered=elapsed;
  tail=text.slice(-128);
 });
 res.on('end',()=>{
  const total=performance.now()-start;
  const gap=first!==null&&rendered!==null?rendered-first:null;
  console.log(JSON.stringify({status:res.statusCode,streaming:res.headers['x-codela-streaming']||null,headersMs:Math.round(headersAt),prefixMs:first===null?null:Math.round(first),renderedMs:rendered===null?null:Math.round(rendered),gapMs:gap===null?null:Math.round(gap),totalMs:Math.round(total),separateArrival:gap!==null&&gap>=20},null,2));
  if(gap===null||gap<20){console.error('Separate prefix delivery not demonstrated; cache, transport buffering or fast render may be the reason.');process.exitCode=2;}
 });
});
req.setTimeout(20000,()=>req.destroy(Error('timeout')));req.on('error',e=>{console.error(e.message);process.exitCode=1});
