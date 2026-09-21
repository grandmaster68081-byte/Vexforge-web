import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const src = join(root, 'src');

const forbidden = [
  /ProtectedAdminRoute/i,
  /AuthProvider/i,
  /getSession\s*\(/i,
  /from\(["']players["']\)/i,
  /from\(["']player_/i,
  /vexforge_create_shop_order/i,
  /vexforge_submit_shop_order_payment/i,
  /vexforge_is_control_admin/i,
  /\/admin(?:["'`]|\W)/i,
  /\/withdrawal(?:["'`]|\W)/i,
  /\/deposit(?:["'`]|\W)/i,
  /\/pvp(?:["'`]|\W)/i,
  /\/battle(?:["'`]|\W)/i,
  /\/market(?:["'`]|\W)/i,
  /\/inventory(?:["'`]|\W)/i,
  /\/deck-builder(?:["'`]|\W)/i,
  /\/nft(?:["'`]|\W)/i,
  /\/login(?:["'`]|\W)/i,
];

const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full);
    else if (/\.(tsx?|css)$/.test(entry)) files.push(full);
  }
}
walk(src);

const findings = [];
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const rx of forbidden) if (rx.test(content)) findings.push(`${relative(root, file)} :: ${rx}`);
}

if (findings.length) {
  console.error('PORTAL ISOLATION FAILED');
  console.error(findings.join('\n'));
  process.exit(1);
}

console.log(`PORTAL ISOLATION PASS — ${files.length} source files scanned`);
