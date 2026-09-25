import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)); const root=path.resolve(here,'..');
const dist=path.join(root,'dist');
if(!fs.existsSync(dist)){console.error('Build verification failed: dist/ does not exist.');process.exit(1);} const index=fs.readFileSync(path.join(dist,'index.html'),'utf8');
if(!index.includes('root')){console.error('Build verification failed: root mount not found.');process.exit(1);} console.log('BUILD VERIFY PASS — dist/ exists and contains the root entry point.');
