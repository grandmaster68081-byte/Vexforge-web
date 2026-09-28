import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const world = fs.readFileSync(path.join(root,'src/kivora/KivoraFinalWorld.tsx'),'utf8');
for (const token of ['Command Deck','Opportunity Field','Kivora Vault','Chronicle','Settlement Terminal','USDT','TRC20','DAILY RUN','KIVORA ENGINE']) {
  if (!world.includes(token)) throw new Error(`Missing product contract: ${token}`);
}
const config = fs.readFileSync(path.join(root,'functions/api/config.ts'),'utf8');
if (!config.includes('withdrawalMinPoints: Number(map.withdrawal_min_points ?? 10000)')) throw new Error('10,000 KP minimum contract missing');
const withdraw = fs.readFileSync(path.join(root,'functions/api/withdraw.ts'),'utf8');
if (!withdraw.includes("rpc('request_withdrawal_v2'")) throw new Error('request_withdrawal_v2 missing');
if (!withdraw.includes("asset !== 'USDT' || network !== 'TRC20'")) throw new Error('USDT/TRC20 validation missing');
const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if (pkg.version !== '6.0.0') throw new Error(`Expected 6.0.0, got ${pkg.version}`);
console.log('KIVORA GOLDEN LOCK PRODUCT CONTRACT: PASS');
