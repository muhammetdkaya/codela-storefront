#!/usr/bin/env node
'use strict';
// Isolated fixture orchestration only. This does not provision or visit a live site.
const fs = require('node:fs');
const path = require('node:path');
const {spawn, execFileSync} = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const ENGINES = ['chromium', 'webkit', 'firefox'];
const SOURCE_PATHS = ['theme', 'scripts', 'tests', 'tools', 'package.json', 'package-lock.json'];
const BASE = '687ef83e13621f6117264d04f220fa13c8836bb4';
const MAX_LOG = 8 * 1024 * 1024;
const FIXTURE_OVERRIDES = ['DOCK_SOURCE','PANEL_PRESENTATION_SOURCE','MOBILE_CONTROLS_OLD_CSS','MOBILE_CONTROLS_SCOPE','FIRST_PAINT_OLD_CSS','PRODUCT_OLD_CSS','MEDIA_LOADING_SOURCE','DOCK_QA','QA_CART','QA_HEADER','FEEDBACK_SCRIPT','CONTEXT_SCRIPT','HEADER_CATALOG_CSS','HEADER_FEEDBACK_SCRIPT','HEADER_TEST_SCOPE','SHOWCASE_ALIGNMENT_ONLY','SHOWCASE_CONTRAST_ONLY','SHOWCASE_CSS','SHOWCASE_FEEDBACK_CSS','SHOWCASE_INLINE_VISUALS','SHOWCASE_PHASE','SHOWCASE_REAL_IMAGE','SHOWCASE_SCREENSHOTS_ONLY','SF_REPORT_DIR','BASECOAT_REPORT_DIR'];

function manifest(root = ROOT) {
    const value = JSON.parse(fs.readFileSync(path.join(root, 'scripts/regression-suites.json'), 'utf8'));
    if (value.schema !== 1 || !value.groups || typeof value.groups !== 'object') throw Error('Invalid suite manifest');
    const seen = new Set();
    for (const [group, entries] of Object.entries(value.groups)) {
        if (!/^[a-z]+$/.test(group) || !Array.isArray(entries) || !entries.length) throw Error('Invalid group');
        for (const entry of entries) {
            if (!/^tests\/[a-z][a-z0-9-]*\.cjs$/.test(entry.file) || /wordpress-|live/.test(entry.file)
                || seen.has(entry.file) || !Array.isArray(entry.engines) || !entry.engines.length
                || entry.engines.some(engine => !ENGINES.includes(engine)) || !Array.isArray(entry.dependencies)
                || !Number.isInteger(entry.timeout_ms) || entry.timeout_ms < 1000 || entry.timeout_ms > 300000) throw Error('Invalid or unsafe entry: ' + entry.file);
            if (!fs.statSync(path.join(root, entry.file)).isFile()) throw Error('Missing test: ' + entry.file);
            seen.add(entry.file);
        }
    }
    return value;
}
function options(args) {
    const parsed = {list: false, group: 'all', budget_ms: 900000};
    while (args.length) {
        const key = args.shift();
        if (key === '--list') parsed.list = true;
        else if (['--engine', '--group', '--expect-sha', '--budget-ms'].includes(key)) {
            const value = args.shift();
            if (!value || value.startsWith('--')) throw Error('Missing value: ' + key);
            parsed[{'--engine':'engine','--group':'group','--expect-sha':'sha','--budget-ms':'budget_ms'}[key]] = value;
        } else throw Error('Unknown option: ' + key);
    }
    parsed.budget_ms = Number(parsed.budget_ms);
    if (parsed.engine && !ENGINES.includes(parsed.engine)) throw Error('Unsupported engine');
    if (!Number.isInteger(parsed.budget_ms) || parsed.budget_ms < 1000 || parsed.budget_ms > 3600000) throw Error('Budget must be 1000..3600000 ms');
    if (!parsed.list && (!parsed.engine || !/^[a-f0-9]{40}$/.test(parsed.sha || ''))) throw Error('Execution requires --engine and --expect-sha <full 40-character commit>');
    return parsed;
}
function select(value, group) {
    const names = group === 'all' ? Object.keys(value.groups) : group.split(',');
    if (!names.length || new Set(names).size !== names.length || names.some(name => !value.groups[name])) throw Error('Unknown or duplicate group');
    return names.flatMap(name => value.groups[name].map(entry => ({group: name, ...entry})));
}
function environment(engine, base = process.env) {
    const env = {...base, TEST_WEBKIT:engine === 'webkit' ? '1' : '', TEST_FIREFOX:engine === 'firefox' ? '1' : '', TEST_BROWSER:engine, SF_ENGINE:engine};
    // Do not accidentally run negative controls, narrowed subsets or alternate sources.
    for (const key of FIXTURE_OVERRIDES) delete env[key];
    if (engine !== 'chromium') { delete env.CHROMIUM_BIN; delete env.CHROME_BIN; }
    // Some legacy fixtures invoke `php`, while newer ones honor PHP_BIN.
    if (env.PHP_BIN && path.isAbsolute(env.PHP_BIN)) env.PATH = path.dirname(env.PHP_BIN) + path.delimiter + (env.PATH || '');
    return env;
}
function git(args, root = ROOT) { return execFileSync('git', args, {cwd:root, encoding:'utf8', timeout:10000}).trim(); }
function verifySource(sha, root = ROOT) {
    if (git(['rev-parse', 'HEAD'], root) !== sha) throw Error('HEAD does not match --expect-sha');
    const modified = git(['status', '--porcelain', '--untracked-files=all', '--', ...SOURCE_PATHS], root);
    if (modified) throw Error('Runtime/test/build tree is not clean: ' + modified);
}
function preflight(entry, env, root = ROOT) {
    const reasons = [];
    try { require.resolve(env.PLAYWRIGHT_MODULE || 'playwright'); } catch { reasons.push('Playwright package unavailable; run locked npm ci'); }
    for (const dependency of entry.dependencies) {
        if (dependency === 'php' || dependency === 'php-path') {
            try { execFileSync(dependency === 'php-path' ? 'php' : env.PHP_BIN || 'php', ['-v'], {env, stdio:'ignore', timeout:10000}); }
            catch { reasons.push('PHP unavailable: ' + dependency); }
        } else if (dependency === 'esbuild') {
            try { require.resolve('esbuild'); } catch { reasons.push('Locked esbuild dev dependency unavailable'); }
        } else if (dependency === 'wp-core') {
            const files = ['kses.php', 'class-wp-html-attribute-token.php', 'class-wp-html-span.php', 'class-wp-html-text-replacement.php', 'class-wp-html-tag-processor.php'];
            if (!env.WP_CORE_INCLUDES || files.some(file => !fs.existsSync(path.join(env.WP_CORE_INCLUDES, file)))) reasons.push('Pinned WP6.5 fixture files unavailable in WP_CORE_INCLUDES');
        } else if (dependency === 'immutable-panel-baseline') {
            try {
                const expected = execFileSync('git', ['show', BASE + ':theme/codela-storefront/assets/scripts/overlay-controller.js'], {cwd:root, timeout:10000});
                if (!env.PANEL_BASELINE_SOURCE || !fs.readFileSync(env.PANEL_BASELINE_SOURCE).equals(expected)) throw Error('Mismatch');
            } catch { reasons.push('PANEL_BASELINE_SOURCE must match immutable 0.1.195 overlay source'); }
        } else if (dependency !== 'localhost-http') reasons.push('Unrecognized dependency: ' + dependency);
    }
    return reasons;
}
function runOne({file, timeout_ms}, {cwd = ROOT, env = process.env, logPath, signal, command = process.execPath, args} = {}) {
    return new Promise(resolve => {
        const started = Date.now();
        let child, timer, killTimer, outcome, error, written = 0, truncated = false;
        const fd = fs.openSync(logPath, 'wx');
        function log(data) {
            const bytes = Buffer.from(data);
            const available = MAX_LOG - written;
            if (available > 0) { const part = bytes.subarray(0, available); fs.writeSync(fd, part); written += part.length; }
            if (!truncated && bytes.length > available) { truncated = true; fs.writeSync(fd, '\n[Runner log truncated at 8 MiB]\n'); }
        }
        function kill(kind) {
            if (!child || !child.pid) return;
            try { if (process.platform === 'win32') child.kill(kind); else process.kill(-child.pid, kind); } catch (cause) { if (cause.code !== 'ESRCH') error = cause.message; }
        }
        function stop(status) { if (outcome) return; outcome = status; kill('SIGTERM'); killTimer = setTimeout(() => kill('SIGKILL'), 1500); }
        const abort = () => stop('cancelled');
        child = spawn(command, args || [file], {cwd, env, detached:process.platform !== 'win32', stdio:['ignore','pipe','pipe']});
        child.stdout.on('data', log); child.stderr.on('data', log);
        child.on('error', cause => { error = cause.message; outcome = 'blocked'; });
        timer = setTimeout(() => stop('timed_out'), timeout_ms);
        signal?.addEventListener('abort', abort, {once:true});
        if (signal?.aborted) abort();
        child.on('close', (code, childSignal) => {
            clearTimeout(timer); clearTimeout(killTimer); signal?.removeEventListener('abort', abort);
            // Clean up only this runner-owned process group, never unrelated browsers.
            kill('SIGKILL'); fs.closeSync(fd);
            resolve({status:outcome || (code === 0 ? 'passed' : 'failed'), exit_code:code, signal:childSignal, duration_ms:Date.now()-started, log:logPath, log_truncated:truncated, ...(error ? {error} : {})});
        });
    });
}
async function main(argv = process.argv.slice(2)) {
    const opts = options([...argv]), value = manifest(), entries = select(value, opts.group);
    if (opts.list) {
        console.log(JSON.stringify({scope:value.scope, groups:opts.group, engine:opts.engine || 'all', entries:entries.map(entry => ({...entry, supported:!opts.engine || entry.engines.includes(opts.engine)})), excluded:value.excluded}, null, 2));
        return 0;
    }
    verifySource(opts.sha);
    const env = environment(opts.engine), started = Date.now();
    const folder = path.join(ROOT, 'qa/regression-suite', opts.sha, opts.engine, opts.group.replaceAll(',', '+') + '-' + started + '-' + process.pid);
    fs.mkdirSync(folder, {recursive:true});
    const report = {schema:1, sha:opts.sha, engine:opts.engine, groups:opts.group, scope:value.scope, started_at:new Date(started).toISOString(), budget_ms:opts.budget_ms, node:process.version, browser_executable:opts.engine === 'chromium' ? env.CHROMIUM_BIN || env.CHROME_BIN || 'Playwright managed' : 'Playwright managed', status:'running', results:[]};
    try { report.playwright = require((env.PLAYWRIGHT_MODULE || 'playwright') + '/package.json').version; } catch { report.playwright = 'unknown'; }
    const reportPath = path.join(folder, 'report.json');
    const save = () => { fs.writeFileSync(reportPath + '.tmp', JSON.stringify(report, null, 2) + '\n'); fs.renameSync(reportPath + '.tmp', reportPath); };
    const controller = new AbortController();
    const cancel = () => controller.abort();
    process.on('SIGINT', cancel); process.on('SIGTERM', cancel);
    save();
    try {
        for (const entry of entries) {
            const result = {file:entry.file, group:entry.group};
            report.results.push(result);
            const remaining = opts.budget_ms - (Date.now() - started);
            if (!entry.engines.includes(opts.engine)) result.status = 'unsupported_engine';
            else if (controller.signal.aborted) result.status = 'not_run_cancelled';
            else if (remaining <= 0) result.status = 'not_run_budget';
            else {
                const problems = preflight(entry, env);
                if (problems.length) { result.status = 'blocked'; result.reasons = problems; }
                else {
                    result.status = 'running'; save();
                    Object.assign(result, await runOne({...entry, timeout_ms:Math.min(entry.timeout_ms, Math.max(1, opts.budget_ms - (Date.now() - started)))}, {env, signal:controller.signal, logPath:path.join(folder, path.basename(entry.file) + '.log')}));
                }
            }
            save(); console.log(`${result.status}: ${entry.file}`);
        }
        try { verifySource(opts.sha); report.source_integrity = 'unchanged'; } catch (cause) { report.source_integrity = 'changed'; report.source_error = cause.message; }
        const executed = report.results.filter(result => result.status !== 'unsupported_engine');
        report.status = executed.length && executed.every(result => result.status === 'passed') && report.source_integrity === 'unchanged' ? 'passed' : 'incomplete_or_failed';
    } finally {
        report.finished_at = new Date().toISOString(); report.duration_ms = Date.now() - started; save();
        process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel);
    }
    console.log('Report: ' + path.relative(ROOT, reportPath));
    return report.status === 'passed' ? 0 : 1;
}
module.exports = {manifest, options, select, environment, verifySource, preflight, runOne, main};
if (require.main === module) main().then(code => { process.exitCode = code; }).catch(error => { console.error(error.message); process.exitCode = 1; });
