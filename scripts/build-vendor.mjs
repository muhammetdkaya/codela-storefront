/** Reproducible browser ESM vendor build. No CDN, React, or server-side Node. */
import { build, version as esbuildVersion } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputs = {runtime:path.join(root, 'theme/codela-storefront/assets/vendor'),research:path.join(root, 'tests/fixtures/motion-pilot')};
const check = process.argv.includes('--check');
const sha = data => createHash('sha256').update(data).digest('hex');
const lock = await readFile(path.join(root, 'package-lock.json'));
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const bundles = [
  { scope:'research', name: 'motion-mini', entry: 'export { animate } from "motion/mini";', source: 'https://github.com/motiondivision/motion', license: 'motion' },
  { scope:'runtime', name: 'embla-carousel', entry: 'export { default } from "embla-carousel";', source: 'https://github.com/davidjerleke/embla-carousel', license: 'embla-carousel' },
];
const packageHash=sha(await readFile(path.join(root,'package.json')));
const newManifest = scope => ({ schema: 1, scope, builder: { name: 'esbuild', version: esbuildVersion }, lock_sha256: sha(lock), package_sha256:packageHash, bundles: {} });
const manifests = {runtime:newManifest('runtime'),research:newManifest('research')};
for (const output of Object.values(outputs)) await mkdir(output, {recursive:true});
async function emit(output, name, bytes) {
  if (check) {
    const actual = await readFile(path.join(output, name)).catch(() => null);
    if (!actual || !actual.equals(Buffer.from(bytes))) throw new Error('Stale vendor output: ' + name + '; run npm run build:vendor');
  } else await writeFile(path.join(output, name), bytes);
}
for (const bundle of bundles) {
  const output=outputs[bundle.scope], manifest=manifests[bundle.scope];
  const result = await build({
    stdin: { contents: bundle.entry, resolveDir: root, sourcefile: bundle.name + '-entry.js' },
    absWorkingDir: root, bundle: true, write: false, minify: true, format: 'esm',
    target: ['es2020'], platform: 'browser', legalComments: 'none', metafile: true,
    treeShaking: true, define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: '/*! Codela local vendor: ' + bundle.name + '; licenses in THIRD-PARTY-NOTICES.txt */' },
  });
  const bytes = result.outputFiles[0].contents;
  const inputs = Object.keys(result.metafile.inputs).sort();
  if (inputs.some(p => /node_modules\/(react|react-dom)\//.test(p))) throw new Error('React runtime leaked into ' + bundle.name);
  if (/\bfrom\s*["'](?:motion|framer-motion|embla-carousel)/.test(Buffer.from(bytes).toString())) throw new Error('Unresolved dependency in ' + bundle.name);
  const packages = [...new Set(inputs.map(p => p.match(/node_modules\/([^/]+)\//)?.[1]).filter(Boolean))].sort();
  const dependencies = {};
  for (const name of packages) {
    const dependency = JSON.parse(await readFile(path.join(root, 'node_modules', name, 'package.json'), 'utf8'));
    dependencies[name] = { version: dependency.version, license: dependency.license };
  }
  await emit(output, bundle.name + '.js', bytes);
  manifest.bundles[bundle.name] = { file: bundle.name + '.js', sha256: sha(bytes), bytes: bytes.length, gzip_bytes: gzipSync(bytes, { level: 9 }).length, source: bundle.source, dependencies };
}
for (const [scope, manifest] of Object.entries(manifests)) {
const output=outputs[scope];
const allDependencies = [...new Set(Object.values(manifest.bundles).flatMap(b => Object.keys(b.dependencies)))].sort();
let notices = 'Codela Storefront '+scope+' dependencies\nBuilt from exact package-lock.json entries; no runtime CDN requests.\n\n';
for (const name of allDependencies) {
  const dependency = JSON.parse(await readFile(path.join(root, 'node_modules', name, 'package.json'), 'utf8'));
  let license;
  for (const filename of ['LICENSE.md', 'LICENSE', 'LICENSE.txt']) {
    try { license = await readFile(path.join(root, 'node_modules', name, filename), 'utf8'); break; } catch {}
  }
  // Embla's npm tarball omits its license. Keep the exact v8.6.0 repository copy.
  if (!license && name === 'embla-carousel' && dependency.version === '8.6.0') license = await readFile(path.join(root, 'scripts/vendor/embla-carousel-LICENSE'), 'utf8');
  if (!license) throw new Error('Missing redistribution license for ' + name);
  notices += name + ' ' + dependency.version + ' (' + dependency.license + ')\n' + license.trim() + '\n\n';
}
await emit(output, 'THIRD-PARTY-NOTICES.txt', notices);
manifest.notices = { file: 'THIRD-PARTY-NOTICES.txt', sha256: sha(notices) };
await emit(output, 'manifest.json', JSON.stringify(manifest, null, 2) + '\n');
}
console.log(JSON.stringify({check, manifests},null,2));
