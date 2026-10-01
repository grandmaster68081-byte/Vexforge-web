import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WorldBackdrop } from '../../src/render/WorldBackdrop';
import { RuntimeHeader } from '../../src/app/RuntimeHeader';
import { useGame } from '../../src/app/GameProvider';
import { COLORS, QUALITY_BUDGETS } from '../../src/core/constants';
import { makeSeed, TRAINING_CARDS, TRAINING_ENEMY } from '../../src/engine/tacticalLabEngine';
import { currentActor, dispatchPlayerAction, legalActions, legalTargets, startTacticalSession } from '../../src/engine/tacticalInteractive';
import type { TacticalSession } from '../../src/engine/tacticalInteractive';
import { classifyBattleEvent, type PresentationKind } from '../../src/engine/presentation';
import { BattlefieldCanvas } from '../../src/render/BattlefieldCanvas';
import { BossMonument } from '../../src/components/BossMonument';
import { PackOpeningCeremony } from '../../src/components/PackOpeningCeremony';
import { SceneCinematic } from '../../src/components/SceneCinematic';
import { RuneButton, SectionTitle, StatusPill, WorldObject, WorldTitle } from '../../src/render/Diegetic';
import { buildSceneActors, cameraForPresentation } from '../../game/scene';
import { buildRuntimeTimeline, runtimeCueForEvent } from '../../game/timeline';
import { PACK_OPENING_TIMELINE } from '../../game/packTimeline';
import type { BattleEvent, BattleUnitState } from '../../src/types/api';
import type { RuntimeCue } from '../../game/types';

const PRESENTATIONS: Array<{ kind: PresentationKind; eventType: string; label: string }> = [
  { kind: 'attack', eventType: 'BASIC_ATTACK', label: 'ATAQUE' },
  { kind: 'cast', eventType: 'SKILL_CAST', label: 'HECHIZO' },
  { kind: 'guard', eventType: 'GUARD', label: 'GUARDIA' },
  { kind: 'heal', eventType: 'HEAL', label: 'SANACIÓN' },
  { kind: 'boss', eventType: 'BOSS_PHASE', label: 'BOSS' },
  { kind: 'victory', eventType: 'VICTORY', label: 'VICTORIA' },
  { kind: 'defeat', eventType: 'DEFEAT', label: 'DERROTA' },
  { kind: 'status', eventType: 'STATUS_TICK', label: 'ESTADO' },
];

const BOSS_FIXTURE = {
  id: 'game-lab-boss',
  boss_code: 'RUNTIME-QA',
  name: 'Centinela del Runtime',
  tier: 'QA',
  power_level: 920,
  hp: 2400,
  image_url: null,
};

function fixtureUnits(session: TacticalSession): BattleUnitState[] {
  return [...session.player, ...session.enemy].map(unit => ({
    id: unit.id,
    hp: unit.hpNow,
    max_hp: unit.hp,
    side: unit.side,
    card_id: unit.name,
    status: unit.alive ? 'alive' : 'defeated',
    statuses: unit.statuses,
    energy: unit.energy,
    max_energy: unit.maxEnergy,
    role: unit.role,
    faction: unit.faction,
    rarity: unit.rarity,
  }));
}

function makePreviewEvent(kind: PresentationKind, units: BattleUnitState[], round: number): BattleEvent {
  const actor = units.find(unit => ['player', 'you'].includes(String(unit.side ?? '').toLowerCase()));
  const target = units.find(unit => !['player', 'you'].includes(String(unit.side ?? '').toLowerCase()));
  const presentation = PRESENTATIONS.find(item => item.kind === kind) ?? PRESENTATIONS[0];
  return {
    event_type: presentation.eventType,
    actor_id: actor?.id,
    target_id: target?.id,
    amount: kind === 'heal' ? 18 : kind === 'victory' || kind === 'defeat' ? null : 24,
    round,
    payload: kind === 'boss' ? { phase: 2, source: 'dev-game-lab' } : { source: 'dev-game-lab' },
  };
}

export default function GameLab() {
  const router = useRouter();
  const { quality } = useGame();
  const [session, setSession] = useState(() => startTacticalSession(TRAINING_CARDS, TRAINING_ENEMY, makeSeed('vexforge-dev-game-lab')));
  const [kind, setKind] = useState<PresentationKind>('attack');
  const [cueIndex, setCueIndex] = useState(0);
  const [showPack, setShowPack] = useState(false);
  const [showBoss, setShowBoss] = useState(false);

  const units = useMemo(() => fixtureUnits(session), [session]);
  const event = useMemo(() => makePreviewEvent(kind, units, session.round), [kind, units, session.round]);
  const cue: RuntimeCue | null = useMemo(() => runtimeCueForEvent(event, cueIndex), [event, cueIndex]);
  const actors = useMemo(() => buildSceneActors(units, event, kind), [units, event, kind]);
  const timeline = useMemo(() => buildRuntimeTimeline([...session.events, event], units), [session.events, event, units]);
  const camera = cameraForPresentation(kind);
  const actor = currentActor(session);
  const actions = legalActions(session);
  const targets = legalTargets(session, 'attack');
  const localEvents = session.events.slice(-8).reverse();

  if (!__DEV__) return null;

  const choosePresentation = (nextKind: PresentationKind) => {
    setKind(nextKind);
    setCueIndex(index => index + 1);
  };

  const runLocalAction = () => {
    if (!actor || actor.side !== 'player' || !actions.includes('attack') || !targets.length || session.ended) return;
    setSession(current => dispatchPlayerAction(current, {
      actorId: actor.id,
      type: 'attack',
      targetId: targets[0].id,
    }));
    setCueIndex(index => index + 1);
  };

  const resetSession = () => {
    setSession(startTacticalSession(TRAINING_CARDS, TRAINING_ENEMY, makeSeed(`vexforge-dev-game-lab-${Date.now()}`)));
    setCueIndex(index => index + 1);
  };

  return (
    <View style={styles.root}>
      <WorldBackdrop variant="arena" tier={quality} />
      <RuntimeHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <WorldTitle
          kicker="DEV ONLY · QA"
          title="GAME LAB"
          subtitle="Inspección local del runtime. Los fixtures son deterministas y no crean combate competitivo, recompensas, propiedad ni settlement."
        />

        <WorldObject accent={COLORS.goldBright} style={styles.status}>
          <View style={styles.row}>
            <StatusPill label="SOLO DESARROLLO" accent={COLORS.goldBright} />
            <StatusPill label="SIN SETTLEMENT" accent={COLORS.mint} />
          </View>
          <Text style={styles.copy}>La ruta y su acceso están desactivados fuera de builds de desarrollo.</Text>
          <RuneButton label="VOLVER" onPress={() => router.back()} accent={COLORS.steel} />
        </WorldObject>

        <SectionTitle kicker="SCENE · LAYERS · ACTORS" title="CAMPO 2.5D" right={<StatusPill label={`${actors.length} ACTORES`} accent={COLORS.arcaneBright} />} />
        <BattlefieldCanvas
          units={units}
          activeEvent={event}
          activeKind={kind}
          runtimeCue={cue}
          maxAnimatedUnits={QUALITY_BUDGETS[quality].maxAnimatedUnits}
        />
        <WorldObject accent={COLORS.arcaneBright} style={styles.inspect}>
          <Text style={styles.label}>CAPAS DE ESCENA</Text>
          <View style={styles.row}>
            {['FONDO', 'ARENA', 'PROFUNDIDAD', 'ACTORES', 'HUD', 'VFX'].map(layer => (
              <StatusPill key={layer} label={layer} accent={COLORS.arcaneBright} />
            ))}
          </View>
          <Text style={styles.label}>EVENTOS DE PRESENTACIÓN</Text>
          <View style={styles.row}>
            {PRESENTATIONS.map(item => (
              <RuneButton key={item.kind} label={item.label} onPress={() => choosePresentation(item.kind)} accent={kind === item.kind ? COLORS.goldBright : COLORS.steel} />
            ))}
          </View>
          <Text style={styles.copy}>EVENTO {event.event_type} · CÁMARA {camera.shot.toUpperCase()} · {Math.round(camera.zoom * 100)}% · CUE {cue?.id ?? '—'}</Text>
        </WorldObject>

        <SectionTitle kicker="ACTOR STATE" title="MOTION INDEPENDIENTE" right={<StatusPill label={kind.toUpperCase()} accent={COLORS.goldBright} />} />
        {actors.map(sceneActor => (
          <WorldObject key={sceneActor.id} accent={sceneActor.motion === 'attacking' || sceneActor.motion === 'casting' ? COLORS.crimson : sceneActor.side === 'player' ? COLORS.goldBright : COLORS.arcaneBright} style={styles.actorRow}>
            <Text style={styles.actorName}>{sceneActor.unit.card_id ?? sceneActor.id}</Text>
            <Text style={styles.copy}>{sceneActor.side.toUpperCase()} · {sceneActor.motion.toUpperCase()} · DEPTH {sceneActor.position.depth.toFixed(2)}</Text>
          </WorldObject>
        ))}

        <SectionTitle kicker="TIMELINE · VFX · AUDIO" title={`${timeline.length} CUES`} />
        <WorldObject accent={COLORS.goldBright} style={styles.inspect}>
          {timeline.slice(-8).map(item => (
            <View key={item.id} style={styles.timelineRow}>
              <Text style={styles.timelineTime}>{(item.atMs / 1000).toFixed(2)}s</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actorName}>{item.event.event_type}</Text>
                <Text style={styles.copy}>{item.kind.toUpperCase()} · {item.vfx} · AUDIO {item.audio.toUpperCase()} · HAPTIC {item.haptic.toUpperCase()}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.copy}>ACTOR {event.actor_id ?? '—'} → TARGET {event.target_id ?? '—'} · VFX {cue?.vfx ?? '—'} · AUDIO {cue?.audio ?? '—'}</Text>
        </WorldObject>

        <SectionTitle kicker="LOCAL TRAINING SIMULATION" title="EVENTOS REALES DEL DRILL" right={<StatusPill label="NO ES PVP" accent={COLORS.mint} />} />
        <WorldObject accent={COLORS.crimson} style={styles.inspect}>
          <Text style={styles.copy}>ACTOR ACTUAL · {actor?.name ?? '—'} · {actor?.side?.toUpperCase() ?? 'SIN TURNO'}</Text>
          <View style={styles.row}>
            <RuneButton label="EJECUTAR ATAQUE" disabled={!actor || actor.side !== 'player' || !actions.includes('attack') || !targets.length || session.ended} onPress={runLocalAction} accent={COLORS.crimson} />
            <RuneButton label="REINICIAR DRILL" onPress={resetSession} accent={COLORS.goldBright} />
          </View>
          {localEvents.length ? localEvents.map((localEvent: any, index) => (
            <View key={`${localEvent.id ?? localEvent.sequence ?? localEvent.event_type}-${index}`} style={styles.timelineRow}>
              <Text style={styles.actorName}>{String(localEvent.event_type).replaceAll('_', ' ')}</Text>
              <Text style={styles.copy}>{localEvent.actor_id ?? '—'} → {localEvent.target_id ?? '—'} {localEvent.amount == null ? '' : `· ${localEvent.amount}`}</Text>
            </View>
          )) : <Text style={styles.copy}>Ejecuta una acción local para poblar el registro del drill.</Text>}
        </WorldObject>

        <SectionTitle kicker="PACK CEREMONY" title="PACK OPENING TIMELINE" />
        <WorldObject accent={COLORS.goldBright} style={styles.inspect}>
          {PACK_OPENING_TIMELINE.map(item => (
            <View key={item.id} style={styles.timelineRow}>
              <Text style={styles.timelineTime}>{(item.atMs / 1000).toFixed(2)}s</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actorName}>{item.stage.toUpperCase()} · {item.actor}</Text>
                <Text style={styles.copy}>CÁMARA {item.camera.shot.toUpperCase()} · {item.vfx} · AUDIO {item.audio.toUpperCase()} · HAPTIC {item.haptic.toUpperCase()}</Text>
              </View>
            </View>
          ))}
          <RuneButton label="ABRIR PACK DE PRUEBA" onPress={() => setShowPack(true)} accent={COLORS.goldBright} />
        </WorldObject>

        <SectionTitle kicker="BOSS SEQUENCE" title="PRESENTACIÓN SIN SETTLEMENT" />
        <BossMonument boss={BOSS_FIXTURE} onPress={() => setShowBoss(true)} />
        <WorldObject accent={COLORS.crimson} style={styles.inspect}>
          <Text style={styles.copy}>Fixture narrativo: no llama RPC de boss, no envía daño y no crea recompensas.</Text>
          <RuneButton label="REPRODUCIR INTRO DEL BOSS" onPress={() => setShowBoss(true)} accent={COLORS.crimson} />
        </WorldObject>
      </ScrollView>

      <PackOpeningCeremony visible={showPack} packName="GAME LAB · FIXTURE" cards={TRAINING_CARDS} onClose={() => setShowPack(false)} />
      <SceneCinematic
        visible={showBoss}
        kicker="DEV QA · SECUENCIA DE BOSS"
        title={BOSS_FIXTURE.name}
        body="Presentación de prueba local. La autoridad de cualquier encuentro real permanece en el servidor."
        scene="arena"
        accent={COLORS.crimson}
        icon="♜"
        onFinish={() => setShowBoss(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 14, paddingBottom: 140, gap: 11 },
  status: { gap: 8 },
  inspect: { gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  label: { color: COLORS.goldDim, fontSize: 6, fontWeight: '900', letterSpacing: 1.4 },
  copy: { color: COLORS.parchment, fontSize: 7.5, lineHeight: 12 },
  actorRow: { gap: 3, paddingVertical: 9 },
  actorName: { color: COLORS.white, fontFamily: 'Cinzel_700Bold', fontSize: 9 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.06)', paddingVertical: 7 },
  timelineTime: { minWidth: 34, color: COLORS.goldBright, fontSize: 7, fontWeight: '900' },
});