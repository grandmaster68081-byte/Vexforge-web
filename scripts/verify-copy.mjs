import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)); const root=path.resolve(here,'..');
const roots=[path.join(root,'src/pages'),path.join(root,'src/data'),path.join(root,'src/components')];
const forbidden=[/supabase/i,/Resources\.Load/i,/Addressables/i,/backend/i,/database/i,/API key/i,/ProtectedAdminRoute/i,/AuthProvider/i,/getSession\(\)/i,/service_role/i,/anonKey/i,/canonical distribution/i,/archivo público/i,/catálogo público/i];
const files=[]; function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(/\.(tsx|ts)$/.test(entry.name))files.push(full);}} roots.forEach(walk);
const hits=[]; for(const file of files){const t=fs.readFileSync(file,'utf8');for(const re of forbidden)if(re.test(t))hits.push(`${path.relative(root,file)} matches ${re}`);}
if(hits.length){console.error('PUBLIC COPY VERIFY FAIL');hits.forEach(h=>console.error(h));process.exit(1);} console.log(`PUBLIC COPY VERIFY PASS — ${files.length} player-facing source files scanned.`);
