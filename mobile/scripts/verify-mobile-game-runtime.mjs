import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { activeRuntimeCue, buildRuntimeTimeline } from '../game/timeline.ts';
import { PACK_OPENING_TIMELINE, packCardRevealCue } from '../game/packTimeline.ts';
import { buildSceneActors, cameraForPresentation, projectScenePoint, WIDE_CAMERA } from '../game/scene.ts';
import { createGameFlow, enterGameBattle, finishGameBattle, isAuthoritativeResult, returnToWorld } from '../game/session.ts';

const sampleEvents = [
  { event_type: 'BASIC_ATTACK', actor_id: 'hero-1', target_id: 'boss-1', amount: 25, round: 1 },
  { event_type: 'BOSS_PHASE', actor_id: 'boss-1', amount: 120, round: 1, payload: { phase: 1 } },
  { event_type: 'VICTORY', round: 3 },
];
const sampleUnits = [
  { id: 'hero-1', side: 'player', hp: 80, max_hp: 100 },
  { id: 'boss-1', side: 'enemy', hp: 75, max_hp: 100 },
  { id: 'ally-1', side: 'player', hp: 60, max_hp: 80 },
];
const timeline = buildRuntimeTimeline(sampleEvents, sampleUnits);
assert.equal(timeline.length, sampleEvents.length, 'all battle events must be retained');
assert.deepEqual(timeline.map((cue) => cue.event), sampleEvents, 'timeline must preserve the original authority event payload');
assert.ok(timeline.every((cue, index) => cue.atMs >= (timeline[index - 1]?.atMs ?? 0)), 'timeline timestamps must be ordered');
assert.equal(timeline[0].audio, 'attack');
assert.equal(timeline[1].vfx, 'boss-phase');
assert.equal(timeline[2].haptic, 'success');
assert.equal(timeline[0].actorMotion['hero-1'], 'attacking');
assert.equal(timeline[0].actorMotion['boss-1'], 'taking-hit');
assert.notEqual(timeline[0].id, timeline[1].id, 'each cue must have a stable, unique identity');
assert.equal(activeRuntimeCue(timeline, timeline[1].atMs)?.id, timeline[1].id);

const actors = buildSceneActors(sampleUnits, sampleEvents[0], 'attack');
assert.equal(actors.find((actor) => actor.id === 'hero-1')?.motion, 'attacking');
assert.equal(actors.find((actor) => actor.id === 'boss-1')?.motion, 'taking-hit');
assert.equal(actors.find((actor) => actor.id === 'ally-1')?.motion, 'idle', 'unrelated actors must keep independent motion state');
assert.notEqual(actors[0].position.depth, actors[1].position.depth, 'actors need distinct depth lanes');

const point = { x: 0.35, y: -0.3, depth: 0.8 };
const wide = projectScenePoint(point, { width: 400, height: 800 }, WIDE_CAMERA);
const boss = projectScenePoint(point, { width: 400, height: 800 }, cameraForPresentation('boss'));
assert.notEqual(wide.x, boss.x, 'camera focus/zoom must affect projected position');
assert.notEqual(wide.scale, boss.scale, 'depth and camera zoom must affect actor scale');
assert.equal(cameraForPresentation('boss').shot, 'boss');

let flow = createGameFlow('pvp', 'world:arena');
flow = enterGameBattle(flow);
const result = { ok: true, match_id: 'server-match', you_won: true, events: sampleEvents };
flow = finishGameBattle(flow, { authority: 'server', result });
assert.equal(flow.stage, 'result');
assert.equal(isAuthoritativeResult(flow.result), true);
assert.equal(returnToWorld(flow).stage, 'world');
assert.throws(() => finishGameBattle(enterGameBattle(createGameFlow('pvp', 'world:unsafe')), {
  authority: 'local-training',
  outcome: 'victory',
}), /authoritative battle resolver/);

assert.deepEqual(PACK_OPENING_TIMELINE.map((cue) => cue.stage), ['awakening', 'binding', 'reveal', 'complete']);
assert.equal(PACK_OPENING_TIMELINE.find((cue) => cue.stage === 'reveal')?.interactive, true);
assert.equal(packCardRevealCue(2, 5).id, 'pack:card:2:of:5');
assert.equal(packCardRevealCue(2, 5).haptic, 'impact');

const [battlefieldSource, battleEffectsSource, arenaSource, worldSource, packSource, tutorialSource, labSource, headerSource] = await Promise.all([
  readFile(new URL('../src/render/BattlefieldCanvas.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/render/BattleEffects.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../app/(tabs)/arena.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../app/world.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/PackOpeningCeremony.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../app/tutorial.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../app/dev/game-lab.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/RuntimeHeader.tsx', import.meta.url), 'utf8'),
]);

assert.ok(battlefieldSource.includes('buildSceneActors') && battlefieldSource.includes('projectScenePoint'), 'the live battlefield must render shared 2.5D actor projections');
assert.ok(battlefieldSource.includes('cameraStyle') && battlefieldSource.includes('runtimeCueForEvent'), 'camera and event cues must be consumed by the live battlefield');
assert.ok(battlefieldSource.includes('motionPart') && battlefieldSource.includes('AudioCues') && battlefieldSource.includes('haptic('), 'actor motion, audio and haptics must be wired to presentation cues');
assert.ok(battleEffectsSource.includes('cueId') && battleEffectsSource.includes('viewport'), 'VFX must use stable cue identity and battlefield-local coordinates');
assert.ok(arenaSource.includes('buildRuntimeTimeline') && arenaSource.includes('runtimeTimeline[replayCursor]'), 'PvP replay must use the shared runtime timeline');
assert.ok(arenaSource.includes('finishGameBattle') && arenaSource.includes('isAuthoritativeResult') && arenaSource.includes('returnToWorld'), 'PvP result and return flow must pass the authority guard');
assert.ok(arenaSource.includes("params.mode==='pvp'") && arenaSource.includes("router.push('/world')"), 'the world-to-PvP result path must be navigable in both directions');
assert.ok(worldSource.includes('BossMonument') && worldSource.includes("pathname:'/arena'"), 'boss Atlas entries must continue to open the clearly non-settling presentation route');
assert.ok(packSource.includes('packCueForStage') && packSource.includes('packCardRevealCue'), 'the live pack ceremony must consume the shared pack timeline');
assert.ok(tutorialSource.includes('BattlefieldCanvas'), 'tutorial drills must share the runtime battlefield and presentation director');
assert.ok(labSource.includes('if (!__DEV__) return null') && labSource.includes('PackOpeningCeremony') && labSource.includes('BossMonument'), 'Game Lab must remain development-only and inspect pack and boss presentation');
assert.ok(headerSource.includes("'/dev/game-lab'") && headerSource.includes("'/arena?mode=pvp'"), 'development inspection and world-to-PvP entry points must be wired');

console.log(JSON.stringify({
  ok: true,
  checks: ['event timeline', 'cue synchronization', 'independent actors', 'depth projection', 'camera response', 'world-to-result flow', 'authority boundary', 'pack opening timeline', 'live battlefield integration', 'synchronized VFX/audio/haptics', 'tutorial runtime reuse', 'boss presentation', 'dev-only Game Lab'],
}, null, 2));