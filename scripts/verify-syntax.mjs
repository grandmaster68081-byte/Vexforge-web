import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
let ts;
try {
  ts = await import('typescript');
} catch {
  try {
    ts = await import(path.join(root, 'node_modules/typescript/lib/typescript.js'));
  } catch {
    ts = await import('/usr/local/slides_js/node_modules/typescript/lib/typescript.js');
  }
}
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(entry.name))files.push(p);}}
walk(path.join(root,'src')); const failures=[];
for(const file of files){const text=fs.readFileSync(file,'utf8');const out=ts.transpileModule(text,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});if((out.diagnostics??[]).length)failures.push(file);}
if(failures.length){console.error('SYNTAX CHECK FAILED'); failures.forEach(f=>console.error(f)); process.exit(1);} console.log(`SYNTAX PASS — ${files.length} TS/TSX files parsed.`);
