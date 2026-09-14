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

const opponentSource = contents.supabase.slice(
  contents.supabase.indexOf('function finiteOpponentNumber'),
  contents.supabase.indexOf('export async function startBattle'),
);

const assertions = [
  ['battle screen exists', contents.screen.includes('export default function BattleScreen')],
  ['battle loads the real deck formation', contents.screen.includes('loadPlayerDeck') && contents.screen.includes('formationSlots')],
  ['battle presents ForgeFormation roles', contents.screen.includes('ForgeFormationPreview') && contents.formation.includes('VANGUARDIA') && contents.formation.includes('CAMPEÓN') && contents.formation.includes('CENTINELA') && contents.formation.includes('RESERVA')],
  ['battlefield uses the real vertical formation', contents.screen.includes('ForgeBattlefield') && contents.battlefield.includes('battlefield-${side}-formation') && contents.battlefield.includes('battlefield-confrontation-lane')],
  ['battlefield renders authoritative card art and roles', contents.battlefield.includes('image_url') && contents.battlefield.includes('CAMPEÓN') && contents.battlefield.includes('VANGUARDIA') && contents.battlefield.includes('CENTINELA') && contents.battlefield.includes('RESERVA') && contents.formation.includes('slot.image_url')],
  ['battlefield keeps absent unit and HP signals explicit', contents.battlefield.includes('IDENTIDAD NO REPORTADA') && contents.battlefield.includes('FACCIÓN NO REPORTADA') && contents.battlefield.includes('HP ACTUAL NO REPORTADO') && contents.battlefield.includes('HP MÁXIMO NO REPORTADO') && contents.battlefield.includes('DAÑO NO REPORTADO')],
  ['battlefield keeps confirmed zero damage visible', contents.battlefield.includes('0 DAÑO CONFIRMADO') && contents.battlefield.includes('typeof currentTurn.damage === \'number\'') && !contents.battlefield.includes('(currentTurn.damage ?? 0) > 0')],
  ['battlefield does not infer missing side or slot data', contents.battlefield.includes('battlefield-side-unassigned') && contents.battlefield.includes('POSICIÓN NO REPORTADA') && contents.battlefield.includes('CAÍDA') && !contents.battlefield.includes('Math.ceil(finalUnits.length / 2)') && !contents.battlefield.includes('return index === 0')],
  ['formation preview is read-only', contents.formation.includes('no calcula daño, turnos ni ganador') && !contents.formation.includes('Math.random') && !contents.formation.includes('simulate')],
  ['battle loads real opponents', contents.screen.includes('findOpponents') && contents.screen.includes('battle-find-opponents')], ['opponent selection uses get_pvp_opponents with deck awareness', contents.supabase.includes('get_pvp_opponents') && contents.supabase.includes('has_deck')],
  ['opponent data preserves missing identity and metrics', contents.supabase.includes('display_name: string | null') && contents.supabase.includes('mmr: number | null') && contents.supabase.includes('wins: number | null') && contents.supabase.includes('losses: number | null') && opponentSource.includes('finiteOpponentNumber') && !opponentSource.includes("row.display_name ?? 'Forjador'") && !opponentSource.includes('row.mmr ?? 1000') && !opponentSource.includes('row.wins ?? 0') && !opponentSource.includes('row.losses ?? 0')],
  ['opponent UI labels absent signals explicitly', contents.screen.includes('IDENTIDAD NO RESUELTA') && contents.screen.includes('MMR NO REPORTADO') && contents.screen.includes('RÉCORD NO REPORTADO') && contents.screen.includes('DIFERENCIA NO REPORTADA')],
  ['opponent sorting does not subtract an unknown MMR', contents.screen.includes('a.mmr === null ? Number.POSITIVE_INFINITY') && contents.screen.includes('b.mmr === null ? Number.POSITIVE_INFINITY')],
  ['battle keeps AI training behind the explicit practice tile', contents.screen.includes('simulateQuickAIBattle') && contents.screen.includes('battle-ai-fallback') && contents.ai.includes('client_ai_v1') && contents.screen.includes('No hay un rival real disponible ahora')],
  ['battle is a programmatic surface without a background skin', contents.screen.includes('sceneMode="hero"') && !contents.screen.includes('battle-reference-scene')],
  ['AI fallback does not claim MMR or economy', contents.screen.includes('SIN MMR') && contents.ai.includes('elo_change: 0') && !contents.ai.includes('claim_ai_battle_reward')],
  ['battle requires explicit confirmation', contents.screen.includes('battle-confirmation') && contents.screen.includes('battle-confirm')],
  ['battle resolves through the authoritative action', contents.screen.includes('startBattle(selectedOpponent.player_id)')],
  ['battle renders server and training turns', contents.screen.includes('activeBattleResult?.turns') && contents.screen.includes('TurnView')],
  ['replay renders the current authoritative turn detail', contents.screen.includes('<TurnView turn={currentTurn}') && contents.screen.includes('index={turnIndex}') && contents.screen.includes('total={turns.length}')],
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
  ['result preserves neutral and absent MMR states', contents.screen.includes('const mmrChange = typeof result.elo_change === \'number\' ? result.elo_change : null') && contents.screen.includes('mmrChange < 0 ? colors.danger : colors.accent') && contents.screen.includes("mmrChange === null ? '—'")],
  ['battle never invents an MMR reference or turn count', contents.screen.includes('playerMmr === null') && contents.screen.includes('totalTurns === null ? \'—\'') && contents.screen.includes('typeof battleResult.total_turns === \'number\'') && !contents.screen.includes('playerMmr ?? 1000') && !contents.screen.includes('result.total_turns ?? result.turns?.length ?? 0')],
  ['rank card preserves absent record and shield states', contents.screen.includes('RÉCORD PENDIENTE') && contents.screen.includes('shields === null ?') && !contents.screen.includes('const shields = rank?.shields ?? 0')],
  ['arena gates provide intentional haptic feedback', contents.screen.includes("import * as Haptics from 'expo-haptics'") && contents.screen.includes('Haptics.selectionAsync()') && contents.screen.includes('Haptics.ImpactFeedbackStyle.Medium')],
  ['AI practice gate provides intentional haptic feedback', contents.screen.includes('Haptics.ImpactFeedbackStyle.Light') && contents.screen.includes('const handleStartAIBattle') && contents.screen.includes('void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)')],
  ['replay and result closure provide haptic feedback', contents.screen.includes('testID="battle-next-turn"') && contents.screen.includes('Haptics.ImpactFeedbackStyle.Light') && contents.screen.includes('testID="battle-close-result"') && contents.screen.includes('onDismiss();')],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile battle verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile battle verification OK: ${assertions.length}/${assertions.length} checks`);