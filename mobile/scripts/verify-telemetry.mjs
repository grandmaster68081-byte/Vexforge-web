import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['lib/telemetry.ts', ['session_start', 'forge_action', 'combat_resolved', 'reward_claimed', 'return_visit', 'trackSessionEntry']],
  ['lib/supabase.ts', ['insertTelemetryEvent', 'vexforge_telemetry_events']],
  ['context/GameContext.tsx', ['trackSessionEntry(session)']],
  ['app/(tabs)/battle.tsx', ['emitTelemetry(session, 'combat_resolved'']],
  ['app/missions.tsx', ['emitTelemetry(session, 'reward_claimed'']],
  ['app/store.tsx', ['emitTelemetry(session, 'forge_action'']],
];
for (const [relative, needles] of checks) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) throw new Error(`Missing ${relative}`);
  const source = fs.readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!source.includes(needle)) throw new Error(`${relative} is missing ${needle}`);
  }
}
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (packageJson.scripts?.['verify:telemetry'] !== 'node scripts/verify-telemetry.mjs') throw new Error('verify:telemetry is not wired');
console.log('mobile telemetry guard: 5 canonical events, Android consumers, and transport present');
