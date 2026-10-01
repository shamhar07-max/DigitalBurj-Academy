import fs from 'node:fs';import path from 'node:path';import {build} from 'esbuild';
await import('./build-icons.mjs');
const assets={},types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',webp:'image/webp',png:'image/png',woff2:'font/woff2',json:'application/json'};
const checks=fs.readFileSync('shared/recipe.mjs','utf8').replace(/export /g,'');fs.writeFileSync('dist/recipe-checks.js','(function(){'+checks+'window.RecipeChecks={STEP_FIELDS,validateRecipe};})();');
function collect(dir){for(const name of fs.readdirSync(dir)){if(name.startsWith('.')||name==='server'||name==='preview-data.js'||name==='runtime.js')continue;const file=path.join(dir,name);if(fs.statSync(file).isDirectory())collect(file);else{const ext=name.split('.').pop();if(types[ext])assets['/'+path.relative('dist',file).split(path.sep).join('/')]={body:fs.readFileSync(file).toString('base64'),type:types[ext]}}}}
await build({entryPoints:['scripts/codes-entry.mjs'],bundle:true,format:'iife',platform:'browser',target:'es2022',outfile:'dist/certificate-codes.js',minify:true});
collect('dist');fs.mkdirSync('.generated',{recursive:true});fs.writeFileSync('.generated/assets.mjs','export default '+JSON.stringify(assets));
await build({entryPoints:['worker/entry.mjs'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/server/index.js',minify:true});
fs.mkdirSync('dist/.openai',{recursive:true});if(fs.existsSync('.openai/hosting.json'))fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});console.log('Built Academy Worker with '+Object.keys(assets).length+' public assets; private recipe content is served only by authorized API.');
