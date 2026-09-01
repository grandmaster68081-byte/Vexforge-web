import { Ionicons } from '@/components/ForgeIcon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { emitTelemetry } from '@/lib/telemetry';
import { ScreenShell } from '@/components/ScreenShell';
import {
  claimDailyQuest,
  executeMobileMission,
  loadDailyQuests,
  loadMissions,
  type DailyQuest,
  type MissionReward,
  type MobileMission,
} from '@/lib/supabase';

function missionColor(type: string | null, colors: ReturnType<typeof useColors>) {
  if (type?.toLowerCase().includes('pvp')) return colors.danger;
  if (type?.toLowerCase().includes('tutorial')) return colors.rarityRare;
  if (type?.toLowerCase().includes('event')) return colors.rarityEpic;
  return colors.accent;
}

function statusLabel(status: string) {
  if (status === 'claimed') return 'RECLAMADA';
  if (status === 'completed') return 'COMPLETA';
  return 'ACTIVA';
}

function QuestCard({
  quest,
  claiming,
  colors,
  onClaim,
}: {
  quest: DailyQuest;
  claiming: string | null;
  colors: ReturnType<typeof useColors>;
  onClaim: (id: string) => void;
}) {
  const definition = quest.quest;
  const target = definition?.target_count ?? 0;
  const percent = target > 0 ? Math.min(100, (quest.progress / target) * 100) : 0;
  const complete = quest.status === 'completed';
  const claimed = quest.status === 'claimed';
  return (
    <View
      testID={`mission-quest-${quest.id}`}
      style={[
        styles.questCard,
        {
          backgroundColor: colors.card,
          borderColor: complete && !claimed ? `${colors.accent}88` : colors.border,
          opacity: claimed ? 0.62 : 1,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <View style={[styles.questIcon, { backgroundColor: `${colors.accent}18` }]}>
            <Ionicons name="flag-outline" size={18} color={colors.accent} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
              {definition?.title ?? 'Misión diaria'}
            </Text>
            <Text style={[styles.cardBody, { color: colors.mutedForeground }]} numberOfLines={2}>
              {definition?.description ?? 'Completa actividad para avanzar.'}
            </Text>
          </View>
        </View>
        <Text style={[styles.status, { color: claimed ? colors.mutedForeground : complete ? colors.success : colors.accent }]}>
          {statusLabel(quest.status)}
        </Text>
      </View>
      <View style={styles.rewardLine}>
        <Text style={[styles.reward, { color: colors.accent }]}>
          <Ionicons name="flash-outline" size={13} color={colors.accent} /> {definition?.reward_vex_ingame ?? 0} VEX
        </Text>
        <Text style={[styles.reward, { color: colors.rarityRare }]}>
          <Ionicons name="sparkles-outline" size={13} color={colors.rarityRare} /> {definition?.reward_xp ?? 0} XP
        </Text>
      </View>
      <View style={styles.progressMeta}>
        <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>PROGRESO</Text>
        <Text style={[styles.progressLabel, { color: colors.foreground }]}>{quest.progress}/{target}</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: complete ? colors.success : colors.accent, width: `${percent}%` }]} />
      </View>
      {complete && !claimed ? (
        <Pressable
          testID={`mission-claim-${quest.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Reclamar recompensa de ${definition?.title ?? 'misión diaria'}`}
          disabled={claiming === quest.id}
          onPress={() => onClaim(quest.id)}
          style={({ pressed }) => [
            styles.claimButton,
            { backgroundColor: colors.accent, opacity: pressed ? 0.78 : claiming === quest.id ? 0.58 : 1 },
          ]}
        >
          {claiming === quest.id ? <ActivityIndicator size="small" color={colors.ink} /> : <Text style={[styles.claimText, { color: colors.ink }]}>RECLAMAR RECOMPENSA</Text>}
        </Pressable>
      ) : null}
    </View>
  );
}

function MissionCard({
  mission,
  colors,
  executing,
  cooldown,
  onExecute,
}: {
  mission: MobileMission;
  colors: ReturnType<typeof useColors>;
  executing: string | null;
  cooldown: number;
  onExecute: (mission: MobileMission) => void;
}) {
  const accent = missionColor(mission.mission_type, colors);
  const isBusy = executing === mission.id;
  const disabled = Boolean(executing) || cooldown > 0;
  return (
    <View testID={`mission-card-${mission.id}`} style={[styles.missionCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <View style={[styles.missionIcon, { backgroundColor: `${accent}18`, borderColor: `${accent}55` }]}>
            <Ionicons name="shield-checkmark-outline" size={19} color={accent} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{mission.name}</Text>
            <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>
              {(mission.difficulty ?? 'NORMAL').toUpperCase()} · {mission.mission_type ?? 'Misión'}
            </Text>
          </View>
        </View>
        <Text style={[styles.energy, { color: colors.rarityRare }]}>
          <Ionicons name="flash" size={12} color={colors.rarityRare} /> {mission.energy_cost ?? 0}
        </Text>
      </View>
      <View style={styles.rewardLine}>
        <Text style={[styles.reward, { color: colors.accent }]}>+{mission.reward_vex_ingame ?? 0} VEX</Text>
        <Text style={[styles.reward, { color: colors.rarityRare }]}>+{mission.reward_xp ?? 0} XP</Text>
        {(mission.reward_vex_tradeable ?? 0) > 0 ? <Text style={[styles.reward, { color: colors.rarityEpic }]}>+{mission.reward_vex_tradeable} T-VEX</Text> : null}
      </View>
      <Pressable
        testID={`mission-execute-${mission.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Comenzar misión ${mission.name}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onExecute(mission)}
        style={({ pressed }) => [
          styles.executeButton,
          { borderColor: accent, opacity: pressed ? 0.76 : disabled ? 0.45 : 1 },
        ]}
      >
        {isBusy ? <ActivityIndicator size="small" color={accent} /> : <Text style={[styles.executeText, { color: accent }]}>{cooldown > 0 ? `DISPONIBLE EN ${cooldown}s` : 'INICIAR MISIÓN'}</Text>}
      </Pressable>
    </View>
  );
}

export default function MissionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, player, progress, refresh } = useGame();
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [missions, setMissions] = useState<MobileMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async (isRefresh = false) => {
    if (!session) {
      setLoading(false);
      setError('Inicia sesión para consultar tus misiones.');
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [nextQuests, nextMissions] = await Promise.all([loadDailyQuests(session), loadMissions(session)]);
      setQuests(nextQuests);
      setMissions(nextMissions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las misiones.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const completedQuests = useMemo(() => quests.filter((quest) => quest.status === 'completed' || quest.status === 'claimed').length, [quests]);
  const cooldownRemaining = (missionId: string) => Math.max(0, Math.ceil(((cooldowns[missionId] ?? 0) - now) / 1000));

  const handleClaim = async (assignmentId: string) => {
    if (!session) return;
    setClaiming(assignmentId);
    setActionMessage(null);
    try {
      const result = await claimDailyQuest(session, assignmentId);
      if (!result.claimed) throw new Error(result.reason ?? 'La recompensa no pudo reclamarse.');
      void emitTelemetry(session, 'reward_claimed', { source: 'daily_quest' });
      setActionMessage(result.pendingRewards ? 'Misión completada. La recompensa se aplicará en breve.' : 'Recompensa reclamada correctamente.');
      await load(true);
      await refresh();
    } catch (claimError) {
      setActionMessage(claimError instanceof Error ? claimError.message : 'No se pudo reclamar la recompensa.');
    } finally {
      setClaiming(null);
    }
  };

  const handleExecute = async (mission: MobileMission) => {
    if (!session || !player || executing || cooldownRemaining(mission.id) > 0) return;
    setExecuting(mission.id);
    setActionMessage(null);
    try {
      const reward: MissionReward = await executeMobileMission(session, player.id, mission.id);
      void emitTelemetry(session, 'reward_claimed', { source: 'mission' });
      setActionMessage(`Misión completada: +${reward.xp_reward ?? 0} XP y +${reward.ingame_reward ?? 0} VEX.`);
      if ((mission.cooldown_seconds ?? 0) > 0) {
        setCooldowns((current) => ({ ...current, [mission.id]: Date.now() + (mission.cooldown_seconds ?? 0) * 1000 }));
      }
      await refresh();
      await load(true);
    } catch (missionError) {
      setActionMessage(missionError instanceof Error ? missionError.message : 'La misión no pudo completarse.');
    } finally {
      setExecuting(null);
    }
  };

  if (!session) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="lock-closed-outline" size={34} color={colors.accent} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Inicia sesión para continuar</Text>
        <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>Tus misiones y recompensas pertenecen a tu cuenta de forjador.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/auth')} style={[styles.primaryButton, { backgroundColor: colors.accent }]}>
          <Text style={[styles.claimText, { color: colors.ink }]}>IR A INICIO DE SESIÓN</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScreenShell surface="missions">
      <View style={[styles.screen, { backgroundColor: 'transparent', paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
      >
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
          <View style={styles.heading}>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>CENTRO DE ACTIVIDAD</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Misiones y recompensas</Text>
          </View>
          <View style={[styles.energyPill, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <Ionicons name="flash" size={14} color={colors.rarityRare} />
            <Text style={[styles.energyPillText, { color: colors.foreground }]}>{progress?.energy ?? '—'}</Text>
          </View>
        </View>

        {actionMessage ? (
          <View accessibilityRole="alert" style={[styles.message, { backgroundColor: `${colors.success}16`, borderColor: `${colors.success}66` }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            <Text style={[styles.messageText, { color: colors.foreground }]}>{actionMessage}</Text>
          </View>
        ) : null}
        {error ? (
          <View accessibilityRole="alert" style={[styles.message, { backgroundColor: `${colors.danger}16`, borderColor: `${colors.danger}66` }]}>
            <Ionicons name="warning-outline" size={18} color={colors.danger} />
            <Text style={[styles.messageText, { color: colors.foreground }]}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View testID="missions-loading" style={styles.stateBlock}><ActivityIndicator size="large" color={colors.accent} /><Text style={[styles.cardBody, { color: colors.mutedForeground }]}>Sincronizando actividad real…</Text></View>
        ) : (
          <>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.accent }]}>OBJETIVOS DEL DÍA</Text>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Misiones diarias</Text>
              </View>
              <Text style={[styles.count, { color: colors.mutedForeground }]}>{completedQuests}/{quests.length}</Text>
            </View>
            {quests.length > 0 ? quests.map((quest) => <QuestCard key={quest.id} quest={quest} claiming={claiming} colors={colors} onClaim={handleClaim} />) : (
              <View testID="missions-empty-quests" style={[styles.emptyCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
                <Ionicons name="flag-outline" size={28} color={colors.accent} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No hay quests asignadas</Text>
                <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>Vuelve a sincronizar cuando se abra la próxima rotación diaria.</Text>
              </View>
            )}

            <View style={[styles.sectionHeading, { marginTop: 28 }]}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.accent }]}>ACTIVIDAD DISPONIBLE</Text>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Misiones</Text>
              </View>
              <Text style={[styles.count, { color: colors.mutedForeground }]}>{missions.length} ACTIVAS</Text>
            </View>
            {missions.length > 0 ? missions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} colors={colors} executing={executing} cooldown={cooldownRemaining(mission.id)} onExecute={handleExecute} />
            )) : (
              <View testID="missions-empty" style={[styles.emptyCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
                <Ionicons name="compass-outline" size={28} color={colors.accent} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No hay misiones disponibles</Text>
                <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>El servidor no tiene actividad lista para esta cuenta.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  backButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 23, fontWeight: '700', marginTop: 4 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 11 },
  sectionTitle: { fontSize: 19, fontWeight: '700', marginTop: 4 },
  count: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  energyPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 8 },
  energyPillText: { fontSize: 13, fontWeight: '700' },
  message: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 18 },
  messageText: { flex: 1, fontSize: 12, lineHeight: 17 },
  questCard: { borderWidth: 1, borderRadius: 15, padding: 15, marginBottom: 11 },
  missionCard: { borderWidth: 1, borderRadius: 15, padding: 15, marginBottom: 11 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  questIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  missionIcon: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardBody: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  status: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  energy: { fontSize: 11, fontWeight: '700' },
  rewardLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 13, marginTop: 14, marginBottom: 12 },
  reward: { fontSize: 11, fontWeight: '700' },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
  progressTrack: { height: 7, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  claimButton: { minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  claimText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  executeButton: { minHeight: 40, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  executeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  emptyCard: { borderWidth: 1, borderRadius: 15, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  stateBlock: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  primaryButton: { minHeight: 44, borderRadius: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
});