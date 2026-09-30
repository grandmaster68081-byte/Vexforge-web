import fs from 'node:fs';
import path from 'node:path';
let ts;
try { ts = await import('typescript'); }
catch { ts = await import('file:///opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js'); }
const root=process.cwd();
const files=[];
for(const base of ['app','src','plugins']) walk(path.join(root,base));
const errors=[];
for(const file of files){const source=fs.readFileSync(file,'utf8');const kind=file.endsWith('.tsx')?ts.ScriptKind.TSX:file.endsWith('.jsx')?ts.ScriptKind.JSX:ts.ScriptKind.TS;const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,kind);for(const d of sf.parseDiagnostics){errors.push({file:path.relative(root,file),message:ts.flattenDiagnosticMessageText(d.messageText,' '),line:sf.getLineAndCharacterOfPosition(d.start??0).line+1});}}
if(errors.length){console.error(JSON.stringify({ok:false,errors},null,2));process.exit(1)}
console.log(JSON.stringify({ok:true,files:files.length,syntaxErrors:0},null,2));
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(/\.(ts|tsx|js|jsx)$/.test(entry.name))files.push(full);}}
