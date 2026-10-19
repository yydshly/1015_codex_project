import {build} from 'esbuild';
import {cp,mkdir,readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const vendor=path.join(root,'web','vendor');
await mkdir(vendor,{recursive:true});
await build({entryPoints:[path.join(root,'src','canvas.jsx')],outdir:vendor,entryNames:'canvas',chunkNames:'chunks/[name]-[hash]',bundle:true,format:'esm',splitting:true,minify:true,legalComments:'linked',define:{'process.env.NODE_ENV':'"production"'},conditions:['production'],target:['es2022'],logLevel:'info',loader:{'.woff2':'file','.ttf':'file','.woff':'file','.png':'file','.svg':'file'}});
const prod=path.join(root,'node_modules','@excalidraw','excalidraw','dist','prod');
await cp(path.join(prod,'fonts'),path.join(vendor,'fonts'),{recursive:true});
// Keep the upstream font licenses and all dependency license notices next to the bundles.
const records=[];
async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.name==='.bin')continue;const p=path.join(dir,entry.name);if(entry.isDirectory()){if(entry.name.startsWith('@')){await scan(p);continue;}try{const pkg=JSON.parse(await readFile(path.join(p,'package.json'),'utf8'));const licenseFiles=(await readdir(p)).filter(n=>/^(license|licence|copying|notice)(\.|$|-)/i.test(n));let text=`\n\n===== ${pkg.name}@${pkg.version} · ${pkg.license||'see package notice'} =====\n`;for(const file of licenseFiles){if((await stat(path.join(p,file))).isFile())text+=`\n${file}\n${await readFile(path.join(p,file),'utf8')}\n`;}records.push(text);if((await readdir(p)).includes('node_modules'))await scan(path.join(p,'node_modules'));}catch{/* non-package directory */}}}}
await scan(path.join(root,'node_modules'));
await writeFile(path.join(vendor,'THIRD_PARTY_LICENSES.txt'),'Third-party package license notices. Build tooling is included for completeness.\n'+records.sort().join(''));
console.log(`Canvas and local fonts ready; ${records.length} package notices retained.`);
