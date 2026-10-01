import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';

await import('./build-portable.mjs');
const assets = (await import('../.generated/assets.mjs')).default;
const assetDirectory = '.cloudflare/assets';
fs.rmSync('.cloudflare', {recursive: true, force: true});
fs.mkdirSync(assetDirectory, {recursive: true});
const metadata = {};
for (const [route, asset] of Object.entries(assets)) {
  // The API generates entitlement-filtered course content; never upload these dumps.
  if (['/curriculum.js', '/mentorship.js'].includes(route)) continue;
  const file = path.join(assetDirectory, route.slice(1));
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, Buffer.from(asset.body, 'base64'));
  metadata[route] = {type: asset.type};
}
const metadataFile = fileURLToPath(new URL('../.generated/assets.mjs', import.meta.url));
await build({
  entryPoints: ['cloudflare/entry.mjs'], bundle: true, format: 'esm', platform: 'browser',
  target: 'es2022', outfile: '.cloudflare/worker.mjs', minify: true,
  plugins: [{name: 'external-static-assets', setup(builder) {
    builder.onLoad({filter: /assets\.mjs$/}, args => args.path === metadataFile
      ? {contents: 'export default ' + JSON.stringify(metadata), loader: 'js'} : undefined);
  }}]
});
console.log('Cloudflare Worker built with ' + Object.keys(metadata).length + ' assets behind the request gate.');
console.log('Worker bytes: ' + fs.statSync('.cloudflare/worker.mjs').size + '. No native database binaries.');
