import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { activeRuntimeCue, buildRuntimeTimeline } from '../../game/timeline';
import { PACK_OPENING_TIMELINE } from '../../game/packTimeline';
import { DEFAULT_SCENE_LAYER_VISIBILITY, SCENE_LAYER_IDS, SCENE_LAYER_LABELS, type SceneLayerVisibility } from '../../game/layers';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadMs, setPlayheadMs] = useState(0);
  const [showPack, setShowPack] = useState(false);
  const [showBoss, setShowBoss] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedCueId, setSelectedCueId] = useState<string | null>(null);
  const [layerVisibility, setLayerVisibility] = useState<SceneLayerVisibility>(DEFAULT_SCENE_LAYER_VISIBILITY);
  const playbackStartedAt = useRef(0);
  const playbackStartMs = useRef(0);

  const units = useMemo(() => {
    const fixture = fixtureUnits(session);
    if (kind !== 'boss') return fixture;
    const bossIndex = fixture.findIndex(unit => !['player', 'you'].includes(String(unit.side ?? '').toLowerCase()));
    if (bossIndex < 0) return fixture;
    return fixture.map((unit, index) => index === bossIndex
      ? { ...unit, card_id: BOSS_FIXTURE.name, faction: 'boss', role: BOSS_FIXTURE.tier }
      : unit);
  }, [session, kind]);
  const event = useMemo(() => makePreviewEvent(kind, units, session.round), [kind, units, session.round]);
  const timeline = useMemo(() => buildRuntimeTimeline([...session.events, event], units), [session.events, event, units]);
  const timelineDurationMs = timeline.length
    ? timeline[timeline.length - 1].atMs + timeline[timeline.length - 1].durationMs
    : 0;
  const playbackCue = useMemo(() => activeRuntimeCue(timeline, playheadMs), [timeline, playheadMs]);
  const cue: RuntimeCue | null = useMemo(() => {
    if (isPlaying && playbackCue) return playbackCue;
    if (selectedCueId) {
      const selected = timeline.find(item => item.id === selectedCueId);
      if (selected) return selected;
    }
    return timeline[timeline.length - 1] ?? null;
  }, [timeline, selectedCueId, isPlaying, playbackCue]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      const elapsed = playbackStartMs.current + Date.now() - playbackStartedAt.current;
      const next = Math.min(elapsed, timelineDurationMs);
      setPlayheadMs(next);
      if (next >= timelineDurationMs) setIsPlaying(false);
    }, 32);
    return () => clearInterval(timer);
  }, [isPlaying, timelineDurationMs]);
  const displayedEvent = cue?.event ?? event;
  const displayedKind = cue?.kind ?? kind;
  const actors = useMemo(() => buildSceneActors(units, displayedEvent, displayedKind), [units, displayedEvent, displayedKind]);
  const camera = cue?.camera ?? cameraForPresentation(displayedKind, displayedEvent);
  const actor = currentActor(session);
  const actions = legalActions(session);
  const targets = legalTargets(session, 'attack');
  const localEvents = session.events.slice(-8).reverse();

  if (!__DEV__) return null;

  const choosePresentation = (nextKind: PresentationKind) => {
    setIsPlaying(false);
    setKind(nextKind);
    setSelectedCueId(null);
  };

  const runLocalAction = () => {
    if (!actor || actor.side !== 'player' || !actions.includes('attack') || !targets.length || session.ended) return;
    const target = targets.find(candidate => candidate.id === selectedTargetId) ?? targets[0];
    setIsPlaying(false);
    setSession(current => dispatchPlayerAction(current, {
      actorId: actor.id,
      type: 'attack',
      targetId: target.id,
    }));
    setSelectedTargetId(null);
    setSelectedCueId(null);
  };

  const resetSession = () => {
    setIsPlaying(false);
    setSession(startTacticalSession(TRAINING_CARDS, TRAINING_ENEMY, makeSeed(`vexforge-dev-game-lab-${Date.now()}`)));
    setSelectedTargetId(null);
    setSelectedCueId(null);
    setPlayheadMs(0);
  };

  const startPlayback = () => {
    if (!timeline.length) return;
    const startAt = playheadMs >= timelineDurationMs ? 0 : playheadMs;
    playbackStartMs.current = startAt;
    playbackStartedAt.current = Date.now();
    setSelectedCueId(null);
    setPlayheadMs(startAt);
    setIsPlaying(true);
  };

  const pausePlayback = () => {
    const current = activeRuntimeCue(timeline, playheadMs);
    setIsPlaying(false);
    setSelectedCueId(current?.id ?? null);
  };

  const stepTimeline = () => {
    if (!timeline.length) return;
    const current = activeRuntimeCue(timeline, playheadMs);
    const currentIndex = current ? timeline.findIndex(item => item.id === current.id) : -1;
    const next = timeline[currentIndex + 1] ?? timeline[0];
    setIsPlaying(false);
    setPlayheadMs(next.atMs);
    setSelectedCueId(next.id);
    setKind(next.kind);
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
          activeEvent={displayedEvent}
          activeKind={displayedKind}
          runtimeCue={cue}
          maxAnimatedUnits={QUALITY_BUDGETS[quality].maxAnimatedUnits}
          selectedTargetId={selectedTargetId}
          onSelectTarget={id => {
            if (targets.some(target => target.id === id)) setSelectedTargetId(id);
          }}
          layerVisibility={layerVisibility}
        />
        <WorldObject accent={COLORS.arcaneBright} style={styles.inspect}>
          <Text style={styles.label}>CAPAS DE ESCENA</Text>
          <View style={styles.row}>
            {SCENE_LAYER_IDS.map(layer => {
              const enabled = layerVisibility[layer];
              return (
                <Pressable
                  key={layer}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Capa ${SCENE_LAYER_LABELS[layer]}`}
                  accessibilityState={{ checked: enabled }}
                  testID={`game-lab-layer-${layer.toLowerCase()}`}
                  onPress={() => setLayerVisibility(current => ({ ...current, [layer]: !current[layer] }))}
                  style={[styles.layerChip, { borderColor: enabled ? `${COLORS.arcaneBright}88` : `${COLORS.steel}66` }]}
                >
                  <Text style={[styles.layerChipText, { color: enabled ? COLORS.parchment : COLORS.steel }]}>
                    {enabled ? '● ' : '○ '}{SCENE_LAYER_LABELS[layer]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.label}>EVENTOS DE PRESENTACIÓN</Text>
          <View style={styles.row}>
            {PRESENTATIONS.map(item => (
              <RuneButton key={item.kind} label={item.label} onPress={() => choosePresentation(item.kind)} accent={kind === item.kind ? COLORS.goldBright : COLORS.steel} />
            ))}
          </View>
          <Text style={styles.copy}>EVENTO {displayedEvent.event_type} · CÁMARA {camera.shot.toUpperCase()} · {Math.round(camera.zoom * 100)}% · FOCO {camera.focusActorId ?? 'ESCENA'}</Text>
          <Text style={styles.copy}>SELECCIÓN {selectedTargetId ?? 'NINGUNA'} · CUE {cue?.id ?? '—'}</Text>
          <Text style={styles.copy}>TRACKS {cue?.tracks.map(track => track.track.toUpperCase()).join(' · ') ?? '—'}</Text>
        </WorldObject>

        <SectionTitle kicker="ACTOR STATE" title="MOTION INDEPENDIENTE" right={<StatusPill label={kind.toUpperCase()} accent={COLORS.goldBright} />} />
        {actors.map(sceneActor => (
          <WorldObject key={sceneActor.id} accent={sceneActor.motion === 'attacking' || sceneActor.motion === 'casting' || sceneActor.motion === 'phase' ? COLORS.crimson : sceneActor.side === 'player' ? COLORS.goldBright : COLORS.arcaneBright} style={styles.actorRow}>
            <Text style={styles.actorName}>{sceneActor.unit.card_id ?? sceneActor.id}</Text>
            <Text style={styles.copy}>{sceneActor.side.toUpperCase()} · {sceneActor.motion.toUpperCase()} · DEPTH {sceneActor.position.depth.toFixed(2)}</Text>
          </WorldObject>
        ))}

        <SectionTitle kicker="TIMELINE · VFX · AUDIO" title={`${timeline.length} CUES`} />
        <WorldObject accent={COLORS.goldBright} style={styles.inspect}>
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pausar reproducción de timeline' : 'Reproducir timeline'}
              testID="game-lab-timeline-play"
              onPress={() => isPlaying ? pausePlayback() : startPlayback()}
              style={[styles.layerChip, styles.timelineControl, { borderColor: isPlaying ? `${COLORS.crimson}99` : `${COLORS.mint}99` }]}
            >
              <Text style={[styles.layerChipText, { color: isPlaying ? COLORS.crimson : COLORS.mint }]}>
                {isPlaying ? 'PAUSAR' : 'REPRODUCIR'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Avanzar al siguiente cue"
              testID="game-lab-timeline-next"
              onPress={stepTimeline}
              style={[styles.layerChip, styles.timelineControl, { borderColor: `${COLORS.goldBright}99` }]}
            >
              <Text style={[styles.layerChipText, { color: COLORS.goldBright }]}>SIGUIENTE CUE</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reiniciar timeline"
              testID="game-lab-timeline-reset"
              onPress={() => {
                setIsPlaying(false);
                setSelectedCueId(timeline[0]?.id ?? null);
                setPlayheadMs(0);
              }}
              style={[styles.layerChip, styles.timelineControl, { borderColor: `${COLORS.steel}99` }]}
            >
              <Text style={[styles.layerChipText, { color: COLORS.parchment }]}>REINICIAR</Text>
            </Pressable>
          </View>
          <Text style={styles.copy}>PLAYHEAD {Math.round(playheadMs)} ms / {timelineDurationMs} ms · {cue?.event.event_type ?? 'SIN CUE'}</Text>
          {timeline.slice(-8).map(item => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Inspeccionar evento ${item.event.event_type}`}
              accessibilityState={{ selected: cue?.id === item.id }}
              onPress={() => {
                setIsPlaying(false);
                setSelectedCueId(item.id);
                setPlayheadMs(item.atMs);
                setKind(item.kind);
              }}
              style={[styles.timelineRow, cue?.id === item.id && styles.timelineRowSelected]}
            >
              <Text style={styles.timelineTime}>{(item.atMs / 1000).toFixed(2)}s</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actorName}>{item.event.event_type}</Text>
                <Text style={styles.copy}>{item.kind.toUpperCase()} · {item.vfx} · AUDIO {item.audio.toUpperCase()} · HAPTIC {item.haptic.toUpperCase()}</Text>
                <Text style={styles.copy}>{item.tracks.map(track => `${track.track}:${track.durationMs}ms`).join(' · ')}</Text>
              </View>
            </Pressable>
          ))}
          <Text style={styles.copy}>ACTOR {displayedEvent.actor_id ?? '—'} → TARGET {displayedEvent.target_id ?? '—'} · VFX {cue?.vfx ?? '—'} · AUDIO {cue?.audio ?? '—'}</Text>
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
  layerChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: COLORS.void },
  layerChipText: { fontSize: 6.5, fontWeight: '900', letterSpacing: .5 },
  label: { color: COLORS.goldDim, fontSize: 6, fontWeight: '900', letterSpacing: 1.4 },
  copy: { color: COLORS.parchment, fontSize: 7.5, lineHeight: 12 },
  actorRow: { gap: 3, paddingVertical: 9 },
  actorName: { color: COLORS.white, fontFamily: 'Cinzel_700Bold', fontSize: 9 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.06)', paddingVertical: 7 },
  timelineRowSelected: { backgroundColor: `${COLORS.goldBright}14`, borderRadius: 7, paddingHorizontal: 5 },
  timelineControl: { minHeight: 30, justifyContent: 'center' },
  timelineTime: { minWidth: 34, color: COLORS.goldBright, fontSize: 7, fontWeight: '900' },
});