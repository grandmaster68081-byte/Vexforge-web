import fs from 'node:fs';

const files = [
  'mobile/app/world.tsx',
  'mobile/lib/supabase.ts',
  'mobile/constants/visual.ts',
  'mobile/app/_layout.tsx',
  'mobile/app/(tabs)/index.tsx',
  'mobile/app/(tabs)/profile.tsx',
  'docs/VE-MOB-12-WORLD.md',
  'docs/VE-MOB-12-WORLD-HONEST-SIGNALS.md',
];
for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`WORLD missing ${file}`);
}
const screen = fs.readFileSync('mobile/app/world.tsx', 'utf8');
const supabase = fs.readFileSync('mobile/lib/supabase.ts', 'utf8');
const visual = fs.readFileSync('mobile/constants/visual.ts', 'utf8');
const checks = [
  ['five world panels', ['bosses', 'raids', 'lore', 'season', 'rankings']],
  ['official world reads', ['world_bosses', 'raid_runs', 'lore_codex', 'season_passes', 'season_rankings']],
  ['official actions', ['vexforge_join_raid', 'vexforge_contribute_raid', 'claim_season_pass_reward']],
  ['world background', ['world: storageAsset']],
  ['explicit states', ['Abriendo rutas del mundo', 'REINTENTAR SINCRONIZACIÓN', 'Sin jefes activos']],
  ['honest missing signals', ['LORE NO SINCRONIZADO', 'DIFICULTAD NO REPORTADA', 'MULTIPLICADOR NO REPORTADO', 'PROGRESO DE TEMPORADA NO REPORTADO', 'NOMBRE NO RESUELTO']],
  ['honest reward signals', ["function rewardNumber", "appendNumericReward('vex_ingame', 'VEX')", "appendNumericReward('shards', 'FRAGMENTOS')", 'value === null ? `${label} NO REPORTADO`', 'CARTA NO REPORTADA', 'RECOMPENSA SIN DETALLE']],
  ['honest encounter damage', ['ownEncounters', 'ownDamage === null', 'TÚ DAÑO NO REPORTADO', 'TÚ ${formatNumber(ownDamage)}']],
  ['honest lore and raid identity signals', ['function worldStatusLabel', 'ESTADO NO REPORTADO', 'TÍTULO NO REPORTADO', 'CONTENIDO NO REPORTADO', 'REGIÓN NO REPORTADA', 'worldStatusLabel(raid.status)']],
  ['honest ranking metrics', ['function rankingMetric', 'function rankingWinRate', 'PUESTO NO REPORTADO', 'PORCENTAJE NO REPORTADO', 'SIN PARTIDAS']],
  ['honest date signals', ['function formatDate', 'FECHA NO REPORTADA', 'FECHA NO VÁLIDA', 'toLocaleDateString']],
  ['honest numeric signals', ['function numberSignal', "numberSignal(boss.power_level, 'PWR')", "numberSignal(boss.hp, 'HP')", "numberSignal(raid.metadata?.max_participants, 'LÍMITE')", "numberSignal(xp, 'XP')", "numberSignal(currentTier, 'TIER')", "numberSignal(tier.xp_required, 'XP')", 'formatNumber(value)', 'NO REPORTADO']],
  ['honest boss identity signals', ['function worldBossIdentity', 'CÓDIGO NO REPORTADO', 'NOMBRE DEL JEFE NO REPORTADO', 'TIER NO REPORTADO', 'worldBossIdentity(boss)', 'identity.code', 'identity.name', 'identity.tier']],
  ['honest ranking identity signals', ['function rankingSeasonLabel', 'function rankingName', 'rankingSeasonLabel(rankings[0]?.season_key)', 'rankingName(entry.display_name)', 'NOMBRE NO RESUELTO', 'NO CONFIRMADA']],
  ['honest raid identity signals', ['function worldRaidIdentity', 'CÓDIGO DE RAID NO REPORTADO', 'NOMBRE DE RAID NO REPORTADO', 'worldRaidIdentity(raid)', 'identity.code', 'identity.name']],
];
for (const [label, needles] of checks) {
  const source = label === 'official world reads' || label === 'official actions' ? supabase : label === 'world background' ? visual : screen;
  for (const needle of needles) if (!source.includes(needle)) throw new Error(`WORLD gate failed: ${label} -> ${needle}`);
}
if (screen.includes('Fecha no disponible')) throw new Error('WORLD gate failed: generic date fallback remains');
if (screen.includes('>—<') || screen.includes('>— </Text>')) throw new Error('WORLD gate failed: generic numeric fallback remains');
if (screen.includes('>{boss.name}</Text>') || screen.includes('>{boss.boss_code}</Text>') || screen.includes('>{boss.tier.toUpperCase()}</Text>')) throw new Error('WORLD gate failed: raw boss identity remains');
if (screen.includes("rankings[0]?.season_key ?? 'NO CONFIRMADA'") || screen.includes("entry.display_name ?? 'NOMBRE NO RESUELTO'")) throw new Error('WORLD gate failed: raw ranking identity fallback remains');
if (screen.includes('>{raid.metadata?.name ?? raid.raid_code}</Text>') || screen.includes('>{raid.raid_code}</Text>')) throw new Error('WORLD gate failed: raw raid identity remains');
console.log('verify-mobile-world: ok');
