/**
 * Compile genuine, pinned Glisse 0.6.0 into a self-contained shell adapter.
 * React and JSX runtime are delegated to wp-element (WordPress 6.5+).
 * Build from: npm install --no-save --package-lock=false glisse@0.6.0
 * This produces a theme-owned file: no external CDN requests at runtime.
 */
import { build } from 'esbuild';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
const root=process.cwd();
const glisse=JSON.parse(await readFile(path.join(root,'node_modules/glisse/package.json'),'utf8'));
if(glisse.version!=='0.6.0')throw new Error('Glisse must stay pinned at 0.6.0');
const outfile=path.join(root,'theme/codela-storefront/assets/scripts/glisse-bridge.js');
const result=await build({
  entryPoints:[path.join(root,'scripts/glisse-bridge.jsx')],
  absWorkingDir:root,
  outfile,
  bundle:true,
  format:'iife',
  platform:'browser',
  target:['es2022'],
  minify:true,
  legalComments:'none',
  sourcemap:false,
  metafile:true,
  alias:{
    'react/jsx-runtime':path.join(root,'scripts/glisse-wp-jsx-runtime.js'),
    'react':path.join(root,'scripts/glisse-wp-react.js')
  },
  define:{'process.env.NODE_ENV':'"production"'},
  banner:{js:'/*! Glisse v0.6.0 MIT, Kelvin Zhang; licenses in THIRD-PARTY-NOTICES.txt */'}
});
const output=await readFile(outfile);
const gz=gzipSync(output).length;
if(gz>95000)throw new Error('Glisse shell bundle exceeds 95 KB gzip budget: '+gz);
if(/from ["']react(?:\/|["'])/.test(output.toString()))throw new Error('Unresolved React import');
console.log(JSON.stringify({glisse:glisse.version,bytes:output.length,gzip_bytes:gz,files:Object.keys(result.metafile.inputs).length}));
