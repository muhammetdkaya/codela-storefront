'use strict';
// Runner unit contracts: only harmless Node children. Never launches a browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {manifest, options, select, environment, runOne} = require('../scripts/run-regression-suite.cjs');
(async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'codela-runner-'));
    let count = 0;
    try {
        const catalog = manifest();
        const all = select(catalog, 'all');
        assert.equal(all.length, 47); count++;
        assert.deepEqual(['chromium','webkit','firefox'].map(engine => all.filter(entry => entry.engines.includes(engine)).length), [47,30,4]); count++;
        assert(!all.some(entry => /wordpress|live/.test(entry.file))); count++;
        assert.throws(() => options(['--engine','firefox']), /expect-sha/); count++;
        assert.throws(() => options(['--list','--engine','safari']), /Unsupported/); count++;
        assert.throws(() => options(['--list','--budget-ms','0']), /Budget/); count++;
        assert.throws(() => options(['--test','tools/live.cjs']), /Unknown/); count++;
        assert.throws(() => select(catalog, 'panels,panels'), /duplicate/); count++;
        assert.throws(() => select(catalog, 'wordpress'), /Unknown/); count++;
        const env = environment('webkit', {PATH:'/bin',PHP_BIN:'/tmp/php/bin/php',CHROMIUM_BIN:'/usr/bin/chromium',CHROME_BIN:'/usr/bin/chrome',TEST_FIREFOX:'1',SF_ENGINE:'firefox',DOCK_SOURCE:'/old.js',SHOWCASE_SCREENSHOTS_ONLY:'1'});
        assert.equal(env.TEST_WEBKIT, '1'); assert.equal(env.TEST_FIREFOX, ''); assert.equal(env.TEST_BROWSER, 'webkit'); assert.equal(env.SF_ENGINE, 'webkit'); assert.equal(env.PATH, '/tmp/php/bin:/bin'); assert(!env.CHROMIUM_BIN); assert(!env.CHROME_BIN); assert(!env.DOCK_SOURCE); assert(!env.SHOWCASE_SCREENSHOTS_ONLY); count++;
        let index=0;
        const run = (source, timeout_ms=3000, extra={}) => runOne({file:'unused',timeout_ms}, {args:['-e',source], logPath:path.join(directory, `test-${index++}.log`), ...extra});
        const success = await run('console.log("fixture passed")'); assert.equal(success.status,'passed'); assert.equal(success.exit_code,0); assert.match(fs.readFileSync(success.log,'utf8'),/fixture passed/); count++;
        const failure = await run('console.error("fixture failed");process.exit(7)'); assert.equal(failure.status,'failed'); assert.equal(failure.exit_code,7); count++;
        const timeout = await run('setInterval(()=>{},1000)',100); assert.equal(timeout.status,'timed_out'); assert(timeout.duration_ms<2500); count++;
        const following = await run('process.exit(0)'); assert.equal(following.status,'passed'); count++;
        const missing = await run('',1000,{command:path.join(directory,'missing-executable')}); assert.equal(missing.status,'blocked'); assert.match(missing.error,/ENOENT/); count++;
        const controller=new AbortController(); const pending=run('setInterval(()=>{},1000)',3000,{signal:controller.signal}); setTimeout(()=>controller.abort(),50); assert.equal((await pending).status,'cancelled'); count++;
        const truncated=await run('process.stdout.write("x".repeat(9*1024*1024))'); assert.equal(truncated.status,'passed'); assert.equal(truncated.log_truncated,true); assert(fs.statSync(truncated.log).size<8*1024*1024+100); count++;
        // Full CLI in a fresh throwaway repository: tests are inert Node scripts.
        const isolated=path.join(directory,'isolated'); fs.mkdirSync(path.join(isolated,'scripts'),{recursive:true}); fs.mkdirSync(path.join(isolated,'tests'));
        fs.copyFileSync(path.resolve(__dirname,'../scripts/run-regression-suite.cjs'),path.join(isolated,'scripts/run-regression-suite.cjs'));
        fs.writeFileSync(path.join(isolated,'.gitignore'),'qa/\n');
        const fixtures=[['tests/runner-first.cjs','process.exit(6)'],['tests/runner-second.cjs','setInterval(()=>{},1000)'],['tests/runner-last.cjs','console.log("last ran")']];
        for(const [file,body] of fixtures)fs.writeFileSync(path.join(isolated,file),body);
        fs.writeFileSync(path.join(isolated,'scripts/regression-suites.json'),JSON.stringify({schema:1,scope:'inert unit fixtures',groups:{dummy:fixtures.map(([file])=>({file,engines:['chromium'],dependencies:[],timeout_ms:1000}))}}));
        const git=args=>execFileSync('git',args,{cwd:isolated,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
        git(['init','-q']);git(['add','.']);git(['-c','user.name=Runner unit test','-c','user.email=runner@example.test','commit','-qm','Temporary inert fixture']);
        const sha=git(['rev-parse','HEAD']);
        // The copied CLI resolves packages relative to its temporary tree, not
        // this checkout. Supply the locked package explicitly; a global NODE_PATH
        // must not hide a missing fixture dependency (as it did outside CI).
        const fixtureEnv={...process.env,PLAYWRIGHT_MODULE:path.dirname(require.resolve('playwright/package.json'))};
        delete fixtureEnv.NODE_PATH;
        let failed=false;try{execFileSync(process.execPath,['scripts/run-regression-suite.cjs','--engine','chromium','--group','dummy','--expect-sha',sha,'--budget-ms','5000'],{cwd:isolated,env:fixtureEnv,timeout:10000,stdio:'pipe'});}catch(error){failed=true;assert.equal(error.status,1);}
        assert(failed);const engineDir=path.join(isolated,'qa/regression-suite',sha,'chromium');const runDir=fs.readdirSync(engineDir)[0];
        const complete=JSON.parse(fs.readFileSync(path.join(engineDir,runDir,'report.json'),'utf8'));
        assert.deepEqual(complete.results.map(result=>result.status),['failed','timed_out','passed']);assert.equal(complete.status,'incomplete_or_failed');assert.equal(complete.source_integrity,'unchanged');count++;
        // Preflight must still block all tests when the explicit dependency is
        // absent. Never weaken the production guard to make the fixture pass.
        const previousRuns=new Set(fs.readdirSync(engineDir));
        assert.throws(()=>execFileSync(process.execPath,['scripts/run-regression-suite.cjs','--engine','chromium','--group','dummy','--expect-sha',sha],{cwd:isolated,env:{...fixtureEnv,PLAYWRIGHT_MODULE:path.join(isolated,'missing-playwright')},timeout:5000,stdio:'pipe'}),error=>error.status===1);
        const blockedRun=fs.readdirSync(engineDir).find(name=>!previousRuns.has(name));
        const blocked=JSON.parse(fs.readFileSync(path.join(engineDir,blockedRun,'report.json'),'utf8'));
        assert.deepEqual(blocked.results.map(result=>result.status),['blocked','blocked','blocked']);
        assert(blocked.results.every(result=>result.reasons.includes('Playwright package unavailable; run locked npm ci')));
        assert.equal(blocked.status,'incomplete_or_failed');
        // A changed candidate is rejected before launching even the inert scripts.
        fs.appendFileSync(path.join(isolated,'tests/runner-last.cjs'),'\n// dirty');
        assert.throws(()=>execFileSync(process.execPath,['scripts/run-regression-suite.cjs','--engine','chromium','--group','dummy','--expect-sha',sha],{cwd:isolated,env:fixtureEnv,timeout:5000,stdio:'pipe'}),error=>error.status===1&&/not clean/.test(error.stderr.toString()));count++;
        console.log(`Regression runner: ${count} unit contracts passed; no browser launched.`);
    } finally { fs.rmSync(directory,{recursive:true,force:true}); }
})().catch(error => {console.error(error);process.exitCode=1;});
