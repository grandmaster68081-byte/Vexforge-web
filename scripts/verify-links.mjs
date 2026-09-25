import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'src');
const allowed = new Set(['/', '/game', '/cards', '/world', '/news', '/media', '/download', '/download/android', '/support', '/privacy', '/terms']);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) files.push(full);
  }
}
walk(src);
const errors=[];
const matches=new Set();
for (const file of files) {
  const text=fs.readFileSync(file,'utf8');
  for (const m of text.matchAll(/\b(?:to|href)\s*=\s*["'](\/[^"'#?\s]*)["']/g)) {
    matches.add(m[1]);
    if (!allowed.has(m[1])) errors.push(`${path.relative(root,file)} → ${m[1]}`);
  }
}
for (const route of matches) {
  if (route.includes(':') || route.includes('*')) continue;
}
if (errors.length) {
  console.error('LINK VERIFY FAIL');
  for (const e of errors) console.error(e);
  process.exit(1);
}
console.log(`LINK VERIFY PASS — ${matches.size} literal internal paths checked.`);
