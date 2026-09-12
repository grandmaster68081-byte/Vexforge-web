import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ForgeIcon';
import { ScreenShell } from '@/components/ScreenShell';
import { DomainHeader } from '@/components/DomainHeader';
import { useMeasuredCanonicalFrame } from '@/components/CanonicalFrame';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import {
  loadPlayerAchievements,
  loadPlayerRank,
  loadSocialSnapshot,
  type MobileSocialSnapshot,
  type PlayerAchievement,
  type PlayerRank,
} from '@/lib/supabase';
import { typography } from '@/constants/typography';

const PROFILE_REFERENCE = require('../../assets/images/profile-reference-scene.png');
type Panel = 'stats' | 'achievements' | 'titles' | 'history' | 'ranking' | 'season' | 'progress' | 'account' | null;
type ProfileAction = 'collection' | 'owned' | 'fusion' | 'achievements' | 'profile' | 'meta' | 'deck' | 'missions' | 'social' | 'home' | 'battle' | 'stats' | 'titles' | 'history' | 'ranking' | 'season' | 'progress';

const PROFILE_HOTSPOTS: Array<{
  id: string;
  label: string;
  left: `${number}%`;
  top: `${number}%`;
  width: `${number}%`;
  height: `${number}%`;
  action: ProfileAction;
}> = [
  { id: 'collection', label: 'Abrir colección', left: '3%', top: '11%', width: '18%', height: '7%', action: 'collection' },
  { id: 'owned', label: 'Abrir tus cartas', left: '22%', top: '11%', width: '20%', height: '7%', action: 'owned' },
  { id: 'fusion', label: 'Abrir fusión', left: '43%', top: '11%', width: '17%', height: '7%', action: 'fusion' },
  { id: 'achievements-top', label: 'Abrir logros', left: '61%', top: '11%', width: '17%', height: '7%', action: 'achievements' },
  { id: 'profile-top', label: 'Perfil', left: '80%', top: '11%', width: '17%', height: '7%', action: 'profile' },
  { id: 'settings', label: 'Abrir configuración de cuenta', left: '84%', top: '3%', width: '8%', height: '7%', action: 'meta' },
  { id: 'notifications', label: 'Abrir misiones y avisos', left: '92%', top: '3%', width: '7%', height: '7%', action: 'missions' },
  { id: 'edit-profile', label: 'Editar perfil', left: '75%', top: '21%', width: '20%', height: '7%', action: 'meta' },
  { id: 'stats', label: 'Ver estadísticas', left: '3%', top: '32%', width: '18%', height: '8%', action: 'stats' },
  { id: 'achievements', label: 'Ver logros', left: '22%', top: '32%', width: '18%', height: '8%', action: 'achievements' },
  { id: 'titles', label: 'Ver títulos', left: '42%', top: '32%', width: '18%', height: '8%', action: 'titles' },
  { id: 'history', label: 'Ver historial', left: '62%', top: '32%', width: '17%', height: '8%', action: 'history' },
  { id: 'ranking', label: 'Ver ranking', left: '81%', top: '32%', width: '16%', height: '8%', action: 'ranking' },
  { id: 'season', label: 'Ver detalles de temporada', left: '77%', top: '43%', width: '19%', height: '8%', action: 'season' },
  { id: 'decks', label: 'Abrir mis mazos', left: '4%', top: '62%', width: '29%', height: '11%', action: 'deck' },
  { id: 'cards', label: 'Abrir cartas obtenidas', left: '35%', top: '62%', width: '30%', height: '11%', action: 'owned' },
  { id: 'progress', label: 'Abrir progreso', left: '68%', top: '72%', width: '28%', height: '8%', action: 'progress' },
  { id: 'quick-achievements', label: 'Logros', left: '3%', top: '81%', width: '21%', height: '9%', action: 'achievements' },
  { id: 'quick-titles', label: 'Títulos', left: '26%', top: '81%', width: '21%', height: '9%', action: 'titles' },
  { id: 'quick-rewards', label: 'Recompensas', left: '50%', top: '81%', width: '21%', height: '9%', action: 'missions' },
  { id: 'quick-social', label: 'Red de forjadores', left: '74%', top: '81%', width: '23%', height: '9%', action: 'social' },
  { id: 'nav-home', label: 'Inicio', left: '0%', top: '91%', width: '20%', height: '9%', action: 'home' },
  { id: 'nav-battle', label: 'Batalla', left: '20%', top: '91%', width: '20%', height: '9%', action: 'battle' },
  { id: 'nav-cards', label: 'Cartas', left: '40%', top: '91%', width: '20%', height: '9%', action: 'collection' },
  { id: 'nav-deck', label: 'Mazo', left: '60%', top: '91%', width: '20%', height: '9%', action: 'deck' },
  { id: 'nav-profile', label: 'Perfil', left: '80%', top: '91%', width: '20%', height: '9%', action: 'profile' },
];

function number(value: number | null | undefined) {
  return typeof value === 'number' ? value.toLocaleString('es-ES') : '—';
}

function rankLabel(rank: PlayerRank | null) {
  return rank?.tier?.toUpperCase() || 'SIN RANGO';
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).replace('.', '').toUpperCase();
}

function getStreak(matches: MobileSocialSnapshot['matches'], playerId: string) {
  let streak = 0;
  for (const match of matches) {
    if (match.status !== 'resolved') continue;
    if (match.winner === playerId) streak += 1;
    else break;
  }
  return streak;
}

function DataText({ children, style }: { children: ReactNode; style?: object }) {
  return <Text pointerEvents="none" style={[styles.dataText, style]}>{children}</Text>;
}

function PanelContent({
  panel,
  colors,
  playerId,
  playerName,
  playerEmail,
  rank,
  stats,
  progress,
  wallet,
  achievements,
  social,
  collectionCount,
  onClose,
  onSignOut,
}: {
  panel: Exclude<Panel, null>;
  colors: ReturnType<typeof useColors>;
  playerId: string;
  playerName: string;
  playerEmail: string;
  rank: PlayerRank | null;
  stats: ReturnType<typeof useGame>['stats'];
  progress: ReturnType<typeof useGame>['progress'];
  wallet: ReturnType<typeof useGame>['wallet'];
  achievements: PlayerAchievement[];
  social: MobileSocialSnapshot | null;
  collectionCount: number;
  onClose: () => void;
  onSignOut: () => Promise<void>;
}) {
  const title = panel === 'stats' ? 'ESTADÍSTICAS' : panel === 'achievements' ? 'LOGROS' : panel === 'titles' ? 'TÍTULOS' : panel === 'history' ? 'HISTORIAL' : panel === 'ranking' ? 'RANKING' : panel === 'progress' ? 'PROGRESO' : panel === 'account' ? 'CUENTA' : 'TEMPORADA ACTUAL';
  return (
    <View style={[styles.modalPanel, { backgroundColor: colors.panelStrong, borderColor: colors.accent }]}>
      <View style={styles.modalHeader}>
        <View>
          <Text style={[styles.modalEyebrow, { color: colors.accent }]}>REGISTRO DEL FORJADOR</Text>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
        </View>
        <Pressable testID="profile-panel-close" accessibilityRole="button" accessibilityLabel="Cerrar detalle" onPress={onClose} style={[styles.modalClose, { borderColor: colors.border }]}><Ionicons name="close" size={18} color={colors.foreground} /></Pressable>
      </View>
      {panel === 'stats' ? (
        <View style={styles.modalGrid}>
          <ModalMetric label="VICTORIAS" value={number(stats?.pvp_wins)} colors={colors} icon="trophy-outline" />
          <ModalMetric label="DERROTAS" value={number(stats?.pvp_losses)} colors={colors} icon="close-circle-outline" />
          <ModalMetric label="RACHA" value={number(getStreak(social?.matches ?? [], playerId))} colors={colors} icon="flame" />
          <ModalMetric label="ELO" value={number(rank?.mmr)} colors={colors} icon="shield-outline" />
          <ModalMetric label="CARTAS" value={number(collectionCount)} colors={colors} icon="cards" />
          <ModalMetric label="VEX" value={number(wallet?.vex_ingame)} colors={colors} icon="coin" />
        </View>
      ) : null}
      {panel === 'season' ? (
        <View style={styles.modalCopy}>
          <Text style={[styles.modalBody, { color: colors.foreground }]}>Tu camino en VEXFORGE</Text>
          <Text style={[styles.modalMuted, { color: colors.mutedForeground }]}>Nivel {progress?.level ?? '—'} · {number(progress?.xp)} / {number(progress?.xp_to_next)} XP</Text>
          <Text style={[styles.modalMuted, { color: colors.mutedForeground }]}>Energía {number(progress?.energy)} / {number(progress?.max_energy)} · {social?.seasonName ?? 'Temporada activa'}</Text>
        </View>
      ) : null}
      {panel === 'progress' ? (
        <View style={styles.modalCopy}>
          <Text style={[styles.modalBody, { color: colors.foreground }]}>Tu camino en VEXFORGE</Text>
          <Text style={[styles.modalMuted, { color: colors.mutedForeground }]}>Nivel {progress?.level ?? '—'} · {number(progress?.xp)} / {number(progress?.xp_to_next)} XP</Text>
          <Text style={[styles.modalMuted, { color: colors.mutedForeground }]}>Energía {number(progress?.energy)} / {number(progress?.max_energy)}</Text>
          <Text style={[styles.modalMuted, { color: colors.mutedForeground }]}>Región inicial: {progress?.starter_region ?? '—'}</Text>
        </View>
      ) : null}
      {panel === 'account' ? (
        <View style={styles.modalCopy}>
          <Text style={[styles.modalBody, { color: colors.foreground }]}>{playerName}</Text>
          <Text style={[styles.modalMuted, { color: colors.mutedForeground }]}>{playerEmail}</Text>
          <Text style={[styles.modalMuted, { color: colors.mutedForeground }]}>ID de forjador: {playerId}</Text>
          <Text style={[styles.modalMuted, { color: colors.mutedForeground }]}>Rango actual: {rankLabel(rank)}</Text>
          <Pressable
            testID="profile-sign-out"
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            onPress={() => {
              Alert.alert('Cerrar sesión', '¿Quieres salir de esta cuenta?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar sesión', style: 'destructive', onPress: () => { void onSignOut(); } },
              ]);
            }}
            style={[styles.signOutButton, { borderColor: colors.danger, backgroundColor: `${colors.danger}12` }]}
          >
            <Ionicons name="log-out-outline" size={17} color={colors.danger} />
            <Text style={[styles.signOutText, { color: colors.danger }]}>CERRAR SESIÓN</Text>
          </Pressable>
        </View>
      ) : null}
      {panel === 'achievements' || panel === 'titles' ? (
        achievements.length ? <ScrollView style={styles.modalList}>{achievements.map((achievement) => <View key={achievement.id} style={[styles.modalRow, { borderColor: colors.border }]}><Ionicons name={panel === 'titles' ? 'crown' : 'trophy-outline'} size={18} color={colors.accent} /><View style={styles.modalRowCopy}><Text style={[styles.modalRowTitle, { color: colors.foreground }]}>{achievement.title}</Text><Text style={[styles.modalMuted, { color: colors.mutedForeground }]}>{achievement.description}</Text></View><Text style={[styles.modalPoints, { color: colors.accent }]}>{achievement.points}</Text></View>)}</ScrollView> : <Text testID="profile-empty-achievements" style={[styles.modalMuted, { color: colors.mutedForeground }]}>Todavía no hay registros disponibles.</Text>
      ) : null}
      {panel === 'history' ? (
        social?.matches.length ? <ScrollView style={styles.modalList}>{social.matches.map((match) => { const won = match.winner === playerId; const elo = match.player_a === playerId ? match.elo_change_a : match.elo_change_b; return <View key={match.id} style={[styles.modalRow, { borderColor: colors.border }]}><Ionicons name={won ? 'checkmark-circle' : 'close-circle-outline'} size={18} color={won ? colors.success : colors.danger} /><View style={styles.modalRowCopy}><Text style={[styles.modalRowTitle, { color: colors.foreground }]}>{won ? 'Victoria' : 'Derrota'} · {match.opponent_name ?? '—'}</Text><Text style={[styles.modalMuted, { color: colors.mutedForeground }]}>{formatDate(match.created_at)}</Text></View><Text style={[styles.modalPoints, { color: elo && elo > 0 ? colors.success : colors.danger }]}>{elo == null ? '—' : `${elo > 0 ? '+' : ''}${elo}`}</Text></View>; })}</ScrollView> : <Text style={[styles.modalMuted, { color: colors.mutedForeground }]}>No hay combates registrados.</Text>
      ) : null}
      {panel === 'ranking' ? (
        social?.rankings.length ? <ScrollView style={styles.modalList}>{social.rankings.map((entry) => <View key={entry.player_id} style={[styles.modalRow, { borderColor: entry.player_id === playerId ? colors.accent : colors.border }]}><Text style={[styles.modalRank, { color: entry.player_id === playerId ? colors.accent : colors.mutedForeground }]}>#{entry.rank_position}</Text><View style={styles.modalRowCopy}><Text style={[styles.modalRowTitle, { color: colors.foreground }]}>{entry.display_name ?? '—'}{entry.player_id === playerId ? ' · TÚ' : ''}</Text><Text style={[styles.modalMuted, { color: colors.mutedForeground }]}>{entry.mmr} ELO · {entry.wins}V / {entry.losses}D</Text></View><Ionicons name="shield-outline" size={18} color={colors.accent} /></View>)}</ScrollView> : <Text style={[styles.modalMuted, { color: colors.mutedForeground }]}>El ranking de temporada todavía no está disponible.</Text>
      ) : null}
    </View>
  );
}

function ModalMetric({ label, value, icon, colors }: { label: string; value: string; icon: string; colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.modalMetric, { borderColor: colors.border }]}><Ionicons name={icon} size={18} color={colors.accent} /><Text style={[styles.modalMetricValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.modalMetricLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const { section: requestedSection } = useLocalSearchParams<{ section?: string }>();
  const { session, player, progress, wallet, stats, collection, syncState, syncError, signOut } = useGame();
  const [rank, setRank] = useState<PlayerRank | null>(null);
  const [achievements, setAchievements] = useState<PlayerAchievement[]>([]);
  const [social, setSocial] = useState<MobileSocialSnapshot | null>(null);
  const [panel, setPanel] = useState<Panel>(requestedSection === 'achievements' ? 'achievements' : null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  // Keep artwork, data overlays, and percentage-based hotspots on the same
  // proportional 1080×2340 frame. Extra viewport space becomes letterbox
  // space instead of stretching the authored composition.
  const {
    width: frameWidth,
    height: canvasHeight,
    scale: frameScale,
    onLayout: onReferenceRootLayout,
  } = useMeasuredCanonicalFrame(
    viewportWidth,
    viewportHeight,
    insets.top,
    insets.bottom,
  );

  const loadDetails = useCallback(async () => {
    if (!session || !player?.id) return;
    setLoading(true);
    setDetailsError(null);
    const [rankResult, achievementsResult, socialResult] = await Promise.allSettled([
      loadPlayerRank(session, player.id),
      loadPlayerAchievements(session, player.id),
      loadSocialSnapshot(session, player.id),
    ]);
    if (rankResult.status === 'fulfilled') setRank(rankResult.value);
    if (achievementsResult.status === 'fulfilled') setAchievements(achievementsResult.value);
    if (socialResult.status === 'fulfilled') setSocial(socialResult.value);
    const rejected = [rankResult, achievementsResult, socialResult].find((result) => result.status === 'rejected');
    if (rejected?.status === 'rejected') setDetailsError(rejected.reason instanceof Error ? rejected.reason.message : 'No se pudo sincronizar el detalle del perfil');
    setLoading(false);
  }, [player?.id, session]);

  useEffect(() => { void loadDetails(); }, [loadDetails]);

  useEffect(() => {
    if (requestedSection === 'achievements') {
      setPanel('achievements');
    }
  }, [requestedSection]);

  const displayName = player?.display_name?.trim() || '—';
  const handle = player?.telegram_username?.trim() ? `@${player.telegram_username.trim().replace(/^@+/, '')}` : '—';
  const playerEmail = player ? player.email : null;
  const email = playerEmail || session?.user.email || '—';
  const xpPercent = progress && progress.xp_to_next > 0 ? Math.min(100, Math.round((progress.xp / progress.xp_to_next) * 100)) : 0;
  const currentRank = rankLabel(rank);
  const statValues = useMemo(() => [
    number(stats?.pvp_wins),
    number(stats?.pvp_losses),
    number(getStreak(social?.matches ?? [], player?.id ?? '')),
    number(rank?.mmr),
  ], [player?.id, rank?.mmr, social?.matches, stats?.pvp_losses, stats?.pvp_wins]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDetails();
    } finally {
      setRefreshing(false);
    }
  };

  const action = (kind: ProfileAction) => {
    if (kind === 'collection') return router.push('/collection');
    if (kind === 'owned') return router.push('/collection?scope=owned');
    if (kind === 'fusion') return router.push('/store?mode=fusion');
    if (kind === 'meta') return router.push('/meta');
    if (kind === 'deck') return router.push('/deck');
    if (kind === 'missions') return router.push('/missions');
    if (kind === 'social') return router.push('/social');
    if (kind === 'home') return router.push('/');
    if (kind === 'battle') return router.push('/battle');
    if (kind === 'stats') return setPanel('stats');
    if (kind === 'achievements') return setPanel('achievements');
    if (kind === 'titles') return setPanel('titles');
    if (kind === 'history') return setPanel('history');
    if (kind === 'ranking') return setPanel('ranking');
    if (kind === 'season') return setPanel('season');
    if (kind === 'progress') return setPanel('progress');
    if (kind === 'profile') return setPanel('account');
  };

  if (!session || !player) {
    return <ScreenShell surface="profile" sceneMode="hero"><View testID="profile-loading" style={styles.loadingScreen}><ActivityIndicator color={colors.accent} /><Text style={[styles.loadingText, { color: colors.foreground }]}>CARGANDO PERFIL DEL NEXUS</Text></View></ScreenShell>;
  }

  return (
    <ScreenShell surface="profile" sceneMode="hero">
      <DomainHeader domain="legado" pointerEvents="none" style={{ position: 'absolute', left: 18, right: 18, top: insets.top + 14, zIndex: 5 }} />
      <View
        onLayout={onReferenceRootLayout}
        style={[styles.referenceRoot, { marginBottom: -insets.bottom }]}
      >
        <ScrollView
          testID="profile-screen"
          style={styles.profileScroll}
          contentContainerStyle={[styles.profileScrollContent, { minHeight: canvasHeight + insets.top, paddingTop: 0, paddingBottom: 0 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void handleRefresh(); }} tintColor={colors.accent} />}
          showsVerticalScrollIndicator={false}
        >
          <View testID="profile-reference-scene" style={[styles.referenceScene, { width: frameWidth, height: canvasHeight, marginTop: insets.top, alignSelf: 'center' }]}>
              <Image source={PROFILE_REFERENCE} style={styles.referenceImage} resizeMode="cover" accessibilityLabel="Composición oficial de Perfil VEXFORGE" accessibilityIgnoresInvertColors />
              <View pointerEvents="none" style={[styles.identityMask, { backgroundColor: `${colors.ink}D4`, borderRadius: 8 * frameScale }]} />
              <View pointerEvents="none" style={styles.dataLayer}>
                <DataText style={[styles.displayName, { fontSize: 17 * frameScale }]}>{displayName.toUpperCase()}</DataText>
                <DataText style={[styles.handle, { fontSize: 9 * frameScale }]}>{handle}</DataText>
                <DataText style={[styles.status, { fontSize: 9 * frameScale }]}>●  {syncState === 'connected' ? 'En línea' : 'Sin conexión'}</DataText>
                <DataText style={[styles.rank, { fontSize: 9 * frameScale }]}>{currentRank}</DataText>
                <DataText style={[styles.memberSince, { fontSize: 7 * frameScale }]}>{`DESDE ${formatDate(player.created_at)}`}</DataText>
                <DataText style={[styles.statOne, { fontSize: 17 * frameScale }]}>{statValues[0]}</DataText>
                <DataText style={[styles.statTwo, { fontSize: 17 * frameScale }]}>{statValues[1]}</DataText>
                <DataText style={[styles.statThree, { fontSize: 17 * frameScale }]}>{statValues[2]}</DataText>
                <DataText style={[styles.statFour, { fontSize: 17 * frameScale }]}>{statValues[3]}</DataText>
                <DataText style={[styles.xpValue, { fontSize: 8 * frameScale }]}>{number(progress?.xp)} / {number(progress?.xp_to_next)} XP</DataText>
                <View style={[styles.xpFill, { width: `${xpPercent}%`, height: 8 * frameScale, borderRadius: 8 * frameScale, backgroundColor: colors.accent }]} />
                <DataText style={[styles.collectionValue, { fontSize: 10 * frameScale }]}>{collection.length.toLocaleString('es-ES')} CARTAS</DataText>
                <DataText style={[styles.progressLevel, { fontSize: 8 * frameScale }]}>Nv. {progress?.level ?? '—'}</DataText>
              </View>
              <View style={styles.hotspotLayer}>
                {PROFILE_HOTSPOTS.map((hotspot) => (
                  <Pressable
                    key={hotspot.id}
                    testID={`profile-reference-${hotspot.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={hotspot.label}
                    accessibilityHint="Toca dos veces para abrir este flujo."
                    onPress={() => action(hotspot.action)}
                    style={({ pressed }) => [styles.hotspot, { left: hotspot.left, top: hotspot.top, width: hotspot.width, height: hotspot.height, opacity: pressed ? 0.7 : 1 }]}
                  />
                ))}
              </View>
          </View>
        </ScrollView>
        {syncError || detailsError ? (
          <View testID="profile-sync-error" accessibilityRole="alert" style={[styles.errorNotice, { backgroundColor: `${colors.danger}E8`, borderColor: colors.danger }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.foreground} />
            <Text style={[styles.errorNoticeText, { color: colors.foreground }]}>{syncError ?? detailsError}</Text>
          </View>
        ) : null}
        <Modal visible={panel !== null} animationType="slide" transparent onRequestClose={() => setPanel(null)}>
          {panel ? <View style={styles.modalBackdrop}><PanelContent panel={panel} colors={colors} playerId={player.id} playerName={displayName} playerEmail={email} rank={rank} stats={stats} progress={progress} wallet={wallet} achievements={achievements} social={social} collectionCount={collection.length} onClose={() => setPanel(null)} onSignOut={async () => { await signOut(); setPanel(null); }} /></View> : null}
        </Modal>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  referenceRoot: { flex: 1, width: '100%', overflow: 'hidden' },
  profileScroll: { flex: 1 },
  profileScrollContent: { flexGrow: 1 },
  referenceScene: { overflow: 'hidden' },
  referenceImage: { width: '100%', height: '100%' },
  dataLayer: { ...StyleSheet.absoluteFillObject },
  hotspotLayer: { ...StyleSheet.absoluteFillObject },
  hotspot: { position: 'absolute' },
  identityMask: { position: 'absolute', left: '22%', top: '19%', width: '52%', height: '11%', borderRadius: 8, opacity: 0.7 },
  dataText: { position: 'absolute', color: '#FFFFFF', fontFamily: typography.bodyBold, textShadowColor: '#000000', textShadowRadius: 3 },
  displayName: { left: '23%', top: '20.3%', width: '49%', fontFamily: typography.display, fontSize: 17 },
  handle: { left: '23%', top: '23.5%', width: '35%', fontSize: 9, color: '#B9C6E8' },
  status: { left: '23%', top: '26.2%', width: '22%', fontSize: 9, color: '#3DC96B' },
  rank: { left: '36%', top: '26.2%', width: '22%', fontSize: 9, color: '#C8D0E9' },
  memberSince: { right: '5%', top: '28.9%', width: '20%', fontSize: 7, textAlign: 'right', color: '#B9C6E8' },
  statOne: { left: '11%', top: '57.6%', width: '10%', textAlign: 'center', fontSize: 17, color: '#F0C050' },
  statTwo: { left: '34%', top: '57.6%', width: '10%', textAlign: 'center', fontSize: 17, color: '#F0C050' },
  statThree: { left: '57%', top: '57.6%', width: '10%', textAlign: 'center', fontSize: 17, color: '#A78BFA' },
  statFour: { left: '80%', top: '57.6%', width: '10%', textAlign: 'center', fontSize: 17, color: '#F0C050' },
  xpFill: { position: 'absolute', left: '13%', top: '77.3%', height: 8, borderRadius: 8, maxWidth: '56%' },
  xpValue: { right: '5%', top: '76.5%', width: '23%', textAlign: 'right', fontSize: 8, color: '#C8D0E9' },
  collectionValue: { left: '68%', top: '64.4%', width: '25%', textAlign: 'right', fontSize: 10, color: '#F0C050' },
  progressLevel: { left: '7%', top: '74.8%', width: '10%', textAlign: 'left', fontSize: 8, color: '#C8D0E9' },
  errorNotice: { position: 'absolute', left: 18, right: 18, bottom: 14, minHeight: 42, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorNoticeText: { flex: 1, fontFamily: typography.body, fontSize: 11, lineHeight: 15 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontFamily: typography.bodyBold, fontSize: 10, letterSpacing: 1.3 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000B8' },
  modalPanel: { maxHeight: '78%', minHeight: 260, borderTopWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalEyebrow: { fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 1 },
  modalTitle: { fontFamily: typography.display, fontSize: 22, marginTop: 4 },
  modalClose: { width: 36, height: 36, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalMetric: { width: '31%', minHeight: 84, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 4 },
  modalMetricValue: { fontFamily: typography.display, fontSize: 18 },
  modalMetricLabel: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.6 },
  modalCopy: { gap: 8 },
  modalBody: { fontFamily: typography.display, fontSize: 18 },
  modalMuted: { fontFamily: typography.body, fontSize: 12, lineHeight: 17 },
  modalList: { maxHeight: 320 },
  modalRow: { minHeight: 58, borderWidth: 1, borderRadius: 11, padding: 10, marginBottom: 7, flexDirection: 'row', alignItems: 'center', gap: 9 },
  modalRowCopy: { flex: 1 },
  modalRowTitle: { fontFamily: typography.bodyBold, fontSize: 13 },
  modalPoints: { fontFamily: typography.bodyBold, fontSize: 12 },
  modalRank: { width: 35, fontFamily: typography.display, fontSize: 15 },
  signOutButton: { minHeight: 46, borderWidth: 1, borderRadius: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  signOutText: { fontFamily: typography.bodyBold, fontSize: 11, letterSpacing: 0.8 },
});