import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here,'..');
const sourceDir=path.join(root,'src'); const all=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else all.push(p);}}
walk(sourceDir);
const source=all.filter(f=>/\.(ts|tsx|css|html)$/.test(f)).map(f=>fs.readFileSync(f,'utf8')).join('\n');
const required=['/game','/cards','/world','/news','/media','/download','/download/android','/support','/privacy','/terms'];
const forbidden=['/admin','/withdrawal','/deposit','/pvp','/market','/inventory','/deck-builder','/nft','ProtectedAdminRoute','AuthProvider','getSession()','Authorization: Bearer','service_role','canonical distribution'];
const failures=[];
for(const route of required)if(!source.includes(`path="${route}"`))failures.push(`missing route: ${route}`);
for(const token of forbidden)if(source.includes(token))failures.push(`forbidden token: ${token}`);
if(!source.includes('googlePlay: ""')||!source.includes('directAndroid: ""'))failures.push('download targets not empty');
if(!source.includes('prefers-reduced-motion'))failures.push('reduced motion missing');
if(!source.includes('fetchPriority'))failures.push('image priority missing');
if(!source.includes('IntersectionObserver'))failures.push('reveal observer missing');
if(!source.includes('startsWith(OFFICIAL_PUBLIC_PREFIX)'))failures.push('card art allowlist missing');
for(const rel of ['public/media','public/brand']){const abs=path.join(root,rel);if(fs.existsSync(abs)&&fs.readdirSync(abs).length)failures.push(`unexpected local raster payloads in ${rel}`);}
if(failures.length){console.error('PORTAL VERIFY FAILED'); failures.forEach(f=>console.error('- '+f)); process.exit(1);} console.log(`PORTAL VERIFY PASS — ${all.length} source files scanned.`);
