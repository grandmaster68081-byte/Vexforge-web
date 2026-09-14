import { readFile } from 'node:fs/promises';

const files = {
  screen: 'mobile/app/(tabs)/battle.tsx',
  supabase: 'mobile/lib/supabase.ts',
  formation: 'mobile/components/ForgeFormationPreview.tsx',
  ai: 'mobile/lib/aiBattle.ts',
  battlefield: 'mobile/components/ForgeBattlefield.tsx',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);

const assertions = [
  ['battle screen exists', contents.screen.includes('export default function BattleScreen')],
  ['battle loads the real deck formation', contents.screen.includes('loadPlayerDeck') && contents.screen.includes('formationSlots')],
  ['battle presents ForgeFormation roles', contents.screen.includes('ForgeFormationPreview') && contents.formation.includes('VANGUARDIA') && contents.formation.includes('CAMPEÓN') && contents.formation.includes('CENTINELA') && contents.formation.includes('RESERVA')],
  ['battlefield uses the real vertical formation', contents.screen.includes('ForgeBattlefield') && contents.battlefield.includes('battlefield-${side}-formation') && contents.battlefield.includes('battlefield-confrontation-lane')],
  ['battlefield renders authoritative card art and roles', contents.battlefield.includes('image_url') && contents.battlefield.includes('CAMPEÓN') && contents.battlefield.includes('VANGUARDIA') && contents.battlefield.includes('CENTINELA') && contents.battlefield.includes('RESERVA') && contents.formation.includes('slot.image_url')],
  ['formation preview is read-only', contents.formation.includes('no calcula daño, turnos ni ganador') && !contents.formation.includes('Math.random') && !contents.formation.includes('simulate')],
  ['battle loads real opponents', contents.screen.includes('findOpponents') && contents.screen.includes('battle-find-opponents')], ['opponent selection uses get_pvp_opponents with deck awareness', contents.supabase.includes('get_pvp_opponents') && contents.supabase.includes('has_deck')],
  ['battle keeps AI training behind the explicit practice tile', contents.screen.includes('simulateQuickAIBattle') && contents.screen.includes('battle-ai-fallback') && contents.ai.includes('client_ai_v1') && contents.screen.includes('No hay un rival real disponible ahora')],
  ['battle is a programmatic surface without a background skin', contents.screen.includes('sceneMode="hero"') && !contents.screen.includes('battle-reference-scene')],
  ['AI fallback does not claim MMR or economy', contents.screen.includes('SIN MMR') && contents.ai.includes('elo_change: 0') && !contents.ai.includes('claim_ai_battle_reward')],
  ['battle requires explicit confirmation', contents.screen.includes('battle-confirmation') && contents.screen.includes('battle-confirm')],
  ['battle resolves through the authoritative action', contents.screen.includes('startBattle(selectedOpponent.player_id)')],
  ['battle renders server and training turns', contents.screen.includes('activeBattleResult?.turns') && contents.screen.includes('TurnView')],
  ['battle renders the authoritative result', contents.screen.includes('battle-result') && contents.screen.includes('result.match_id')],
  ['battle exposes loading and error states', contents.screen.includes('ActivityIndicator') && contents.screen.includes('localError || authError')],
  ['battle supports reduced motion', contents.screen.includes('isReduceMotionEnabled') && contents.screen.includes('reducedMotion')],
  ['supabase exposes the battle turn contract', contents.supabase.includes('export type BattleTurn') && contents.supabase.includes('turns?: BattleTurn[]') && contents.supabase.includes('image_url?: string | null') && contents.supabase.includes('slot?: string')],
  ['supabase calls the official resolve RPC', contents.supabase.includes("'vexforge_battle_resolve'")],
  ['no client PvP battle simulation', contents.screen.includes('startBattle(selectedOpponent.player_id)') && !contents.screen.includes('simulateFormation') && !contents.screen.includes('Math.random')],
  ['no emoji characters in battle UI', !/[\u{1F000}-\u{1FAFF}]/u.test(contents.screen)],
  ['arena action gates expose diegetic press depth', contents.screen.includes('testID="battle-confirm"') && contents.screen.includes('opacity: battleLoading || formationSlots.length < 3 ? 0.7 : pressed ? 0.82 : 1') && contents.screen.includes('styles.cancelButton') && contents.screen.includes('opacity: pressed ? 0.72 : 1')],
  ['replay exposes authoritative turn progress', contents.screen.includes('testID="battle-replay-progress"') && contents.screen.includes('turnIndex={turnIndex}') && contents.screen.includes('totalTurns={turns.length}') && contents.screen.includes('replayProgressFill')],
  ['result preserves the authoritative final formation', contents.screen.includes('testID="battle-result-formation"') && contents.screen.includes('FORMACIÓN FINAL VERIFICADA') && contents.screen.includes('finalUnits={result.final_units ?? []}') && contents.screen.includes('outcome={outcome}')],
  ['result distinguishes an authoritative draw', contents.screen.includes("if (outcome === 'draw') return 'Empate confirmado'") && contents.screen.includes("outcome === 'draw'") && contents.battlefield.includes('EMPATE CONFIRMADO POR EL SERVIDOR')],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile battle verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile battle verification OK: ${assertions.length}/${assertions.length} checks`);