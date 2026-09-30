import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const failures:string[] = [];
const mustExist = [
  'src/engine/battleDirector.ts',
  'src/services/mutationGate.ts',
  'docs/FINAL_RELEASE_AUDIT_1.10.0.md',
  'docs/FINAL_SHIP_CONTRACT_1.10.0.md',
  'docs/OFFICIAL_CONTENT_CLOSURE_1.10.json',
];
for (const file of mustExist) if (!fs.existsSync(path.join(root,file))) failures.push(`missing:${file}`);

const repo = fs.readFileSync(path.join(root,'src/services/repository.ts'),'utf8');
if (repo.includes("eq('season_key','S1_2026')")) failures.push('hardcoded-active-season');
if (!repo.includes('withMutationGate')) failures.push('mutation-gate-not-wired');

const arena = fs.readFileSync(path.join(root,'app/(tabs)/arena.tsx'),'utf8');
for (const token of ['buildBattleSequence','battlePlaybackDelay','createIdempotencyKey','REPRODUCIR REPLAY']) {
  if (!arena.includes(token)) failures.push(`battle-director-missing:${token}`);
}

const cinematicDir = path.join(root,'assets/vexforge/cinematics');
const cinematicFiles = fs.readdirSync(cinematicDir).filter(x=>x.endsWith('.jpg')).sort();
if (cinematicFiles.length < 8) failures.push(`cinematics:${cinematicFiles.length}`);

const hash = crypto.createHash('sha256');
for (const file of cinematicFiles) {
  const bytes = fs.readFileSync(path.join(cinematicDir,file));
  if (bytes.length < 100_000) failures.push(`tiny-cinematic:${file}`);
  hash.update(bytes);
}

console.log(JSON.stringify({
  ok: failures.length===0,
  cinematicCount: cinematicFiles.length,
  cinematicCorpusSha256: hash.digest('hex'),
  failures,
}, null, 2));
process.exitCode = failures.length ? 1 : 0;
