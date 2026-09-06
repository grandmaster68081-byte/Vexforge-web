import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ForgeIcon';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { ScreenShell } from '@/components/ScreenShell';
import { DomainHeader } from '@/components/DomainHeader';
import {
  loadPlayerAchievements,
  loadPlayerRank,
  type PlayerAchievement,
  type PlayerRank,
} from '@/lib/supabase';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { MOTION } from '@/constants/experience';

type Colors = ReturnType<typeof useColors>;
type RankTone = 'primary' | 'accent' | 'success' | 'mutedForeground' | 'rarityRare' | 'rarityEpic' | 'rarityLegendary';

function rankDetails(mmr: number) {
  if (mmr >= 3000) return { label: 'MYTHIC', icon: 'diamond' as const, tone: 'rarityLegendary' as RankTone };
  if (mmr >= 2400) return { label: 'DIAMOND', icon: 'diamond-outline' as const, tone: 'rarityRare' as RankTone };
  if (mmr >= 1800) return { label: 'PLATINUM', icon: 'medal-outline' as const, tone: 'rarityEpic' as RankTone };
  if (mmr >= 1300) return { label: 'GOLD', icon: 'trophy-outline' as const, tone: 'accent' as RankTone };
  if (mmr >= 900) return { label: 'SILVER', icon: 'shield-outline' as const, tone: 'rarityRare' as RankTone };
  if (mmr >= 500) return { label: 'BRONZE', icon: 'shield-half-outline' as const, tone: 'primary' as RankTone };
  return { label: 'IRON', icon: 'ellipse-outline' as const, tone: 'mutedForeground' as RankTone };
}

function toneColor(colors: Colors, tone: RankTone) {
  return colors[tone];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'VF';
}

function formatMemberSince(iso: string | null | undefined) {
  if (!iso) return 'Fecha no disponible';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return `Desde ${date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).replace('.', '').toUpperCase()}`;
}

function formatDate(iso: string | null) {
  if (!iso) return 'Fecha no disponible';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}

function StatCell({ icon, label, value, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | number; colors: Colors }) {
  return (
    <View style={styles.statCell}>
      <Ionicons name={icon} size={18} color={colors.accent} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress, colors, testID }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; colors: Colors; testID: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        { backgroundColor: colors.panel, borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <Ionicons name={icon} size={19} color={colors.accent} />
      <Text style={[styles.quickActionLabel, { color: colors.foreground }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

function AchievementCard({ achievement, colors, index, reduceMotion }: { achievement: PlayerAchievement; colors: Colors; index: number; reduceMotion: boolean | null }) {
  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(index * 45).duration(MOTION.reveal)} style={[styles.achievementCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
      <View style={[styles.achievementIcon, { backgroundColor: `${colors.accent}1A`, borderColor: `${colors.accent}55` }]}>
        <Ionicons name="ribbon-outline" size={21} color={colors.accent} />
      </View>
      <View style={styles.achievementCopy}>
        <Text style={[styles.achievementTitle, { color: colors.foreground }]}>{achievement.title}</Text>
        <Text style={[styles.achievementDescription, { color: colors.mutedForeground }]} numberOfLines={2}>{achievement.description}</Text>
        <Text style={[styles.achievementMeta, { color: colors.accent }]}>{achievement.points} PTS · {formatDate(achievement.unlocked_at)}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={19} color={colors.success} />
    </Animated.View>
  );
}

function LoadingBlock({ colors }: { colors: Colors }) {
  return (
    <View testID="profile-loading" style={[styles.stateBlock, { backgroundColor: colors.panel, borderColor: colors.border }]}>
      <ActivityIndicator size="small" color={colors.accent} />
      <Text style={[styles.body, { color: colors.mutedForeground }]}>Sincronizando perfil, rango y logros…</Text>
    </View>
  );
}

function LegacySignal({ icon, label, value, color, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | number; color: string; colors: Colors }) {
  return (
    <View style={styles.legacySignal}>
      <View style={[styles.legacySignalIcon, { borderColor: `${color}55`, backgroundColor: `${color}12` }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={[styles.legacySignalValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.legacySignalLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function AuthPrompt({ colors, insets }: { colors: Colors; insets: { top: number; bottom: number } }) {
  const { authError, authLoading, signIn, signUp } = useGame();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <ScreenShell surface="profile">
      <KeyboardAwareScrollViewCompat
      style={[styles.screen, { backgroundColor: 'transparent' }]}
      contentContainerStyle={[styles.authContent, { paddingTop: insets.top + 44, paddingBottom: insets.bottom + 40 }]}
    >
      <View style={[styles.authMark, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <Ionicons name="person-outline" size={28} color={colors.accent} />
      </View>
      <Text style={[styles.eyebrow, { color: colors.accent }]}>IDENTIDAD DEL NEXUS</Text>
      <Text style={[styles.authTitle, { color: colors.foreground }]}>Tu perfil espera.</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>Inicia sesión para consultar tu progreso, rango y recompensas.</Text>
      <View style={styles.authFields}>
        <TextInputField label="CORREO" value={email} onChangeText={setEmail} placeholder="forjador@ejemplo.com" colors={colors} keyboardType="email-address" />
        <TextInputField label="CONTRASEÑA" value={password} onChangeText={setPassword} placeholder="••••••••" colors={colors} secureTextEntry />
      </View>
      {authError ? <Text accessibilityRole="alert" style={[styles.errorText, { color: colors.danger }]}>{authError}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={authLoading || !email || !password}
        onPress={() => { void (mode === 'signin' ? signIn(email, password) : signUp(email, password)); }}
        style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.accent, opacity: pressed ? 0.76 : authLoading || !email || !password ? 0.45 : 1 }]}
      >
        {authLoading ? <ActivityIndicator color={colors.ink} /> : <Text style={[styles.primaryButtonText, { color: colors.ink }]}>{mode === 'signin' ? 'ENTRAR AL NEXUS' : 'CREAR CUENTA'}</Text>}
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={styles.modeButton}>
        <Text style={[styles.modeText, { color: colors.mutedForeground }]}>{mode === 'signin' ? '¿Nuevo en VEXFORGE? Crear cuenta' : 'Ya tengo cuenta · Iniciar sesión'}</Text>
      </Pressable>
      </KeyboardAwareScrollViewCompat>
    </ScreenShell>
  );
}

function TextInputField({ label, value, onChangeText, placeholder, colors, secureTextEntry = false, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: Colors; secureTextEntry?: boolean; keyboardType?: 'default' | 'email-address' }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={[styles.input, { color: colors.foreground, backgroundColor: colors.panel, borderColor: colors.border }]}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, player, progress, wallet, stats, syncState, syncError, authLoading, refresh, signOut } = useGame();
  const [rank, setRank] = useState<PlayerRank | null>(null);
  const [achievements, setAchievements] = useState<PlayerAchievement[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const reduceMotion = useReducedMotion();

  const loadDetails = useCallback(async (isRefresh = false) => {
    if (!session || !player?.id) return;
    if (isRefresh) setRefreshing(true);
    else setDetailsLoading(true);
    setDetailsError(null);
    try {
      const [nextRank, nextAchievements] = await Promise.all([
        loadPlayerRank(session, player.id),
        loadPlayerAchievements(session, player.id),
      ]);
      setRank(nextRank);
      setAchievements(nextAchievements);
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : 'No se pudo sincronizar el detalle del perfil.');
    } finally {
      setDetailsLoading(false);
      setRefreshing(false);
    }
  }, [player?.id, session]);

  useEffect(() => { void loadDetails(); }, [loadDetails]);

  const handleRefresh = () => { void Promise.all([refresh(), loadDetails(true)]); };
  const displayName = player?.display_name?.trim() || 'FORJADOR';
  const rankInfo = rankDetails(Number(rank?.mmr ?? 0));
  const rankColor = toneColor(colors, rankInfo.tone);
  const xpPercent = progress ? Math.min(100, Math.max(0, Math.round((Number(progress.xp) / Math.max(1, Number(progress.xp_to_next))) * 100))) : 0;
  const totalPoints = useMemo(() => achievements.reduce((total, achievement) => total + achievement.points, 0), [achievements]);
  const legacySummary = useMemo(() => {
    const signals = [
      progress?.level ? `nivel ${progress.level}` : null,
      achievements.length > 0 ? `${achievements.length} logro${achievements.length === 1 ? '' : 's'}` : null,
      stats?.pvp_wins ? `${stats.pvp_wins} victoria${stats.pvp_wins === 1 ? '' : 's'}` : null,
    ].filter(Boolean);
    return signals.length > 0
      ? `Tu rastro en el Nexus ya guarda ${signals.join(' · ')}.`
      : 'Tu rastro en el Nexus comenzará a tomar forma con tus primeras victorias.';
  }, [achievements.length, progress?.level, stats?.pvp_wins]);

  if (authLoading && !session) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.accent} /></View>;
  }
  if (!session) return <AuthPrompt colors={colors} insets={insets} />;
  if (!player) {
    return <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 22 }]}><LoadingBlock colors={colors} /></View>;
  }

  return (
    <ScreenShell surface="profile">
      <View style={[styles.screen, { backgroundColor: 'transparent' }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ paddingBottom: insets.bottom + 112 }}
        refreshControl={<RefreshControl refreshing={refreshing || syncState === 'loading'} onRefresh={handleRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <DomainHeader
          domain="legado"
          style={[styles.header, { paddingTop: insets.top + 22, borderBottomColor: colors.border }]}
          trailing={
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" testID="profile-sign-out" onPress={() => { void signOut(); }} style={({ pressed }) => [styles.iconButton, { borderColor: colors.border, opacity: pressed ? 0.68 : 1 }]}>
              <Ionicons name="log-out-outline" size={20} color={colors.foreground} />
            </Pressable>
          }
        />

        {syncError || detailsError ? (
          <View accessibilityRole="alert" style={[styles.message, { backgroundColor: `${colors.danger}16`, borderColor: `${colors.danger}55` }]}>
            <Ionicons name="warning-outline" size={18} color={colors.danger} />
            <Text style={[styles.messageText, { color: colors.foreground }]}>{detailsError ?? syncError}</Text>
          </View>
        ) : null}

        <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(80).duration(MOTION.reveal)} style={[styles.identityCard, { backgroundColor: colors.panelStrong, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={[styles.avatarText, { color: colors.ink }]}>{initials(displayName)}</Text>
          </View>
          <View style={styles.identityCopy}>
            <Text style={[styles.identityName, { color: colors.foreground }]}>{displayName}</Text>
            <Text style={[styles.identityEmail, { color: colors.mutedForeground }]}>{player.email ?? session.user.email ?? 'Cuenta VEXFORGE'}</Text>
            <View style={styles.identityMeta}>
              <Ionicons name="radio-outline" size={13} color={syncState === 'connected' ? colors.success : colors.danger} />
              <Text style={[styles.identityStatus, { color: syncState === 'connected' ? colors.success : colors.danger }]}>{syncState === 'connected' ? 'NEXUS CONECTADO' : 'MODO SINCRONIZACIÓN LIMITADA'}</Text>
            </View>
          </View>
          <Text style={[styles.memberSince, { color: colors.mutedForeground }]}>{formatMemberSince(player.created_at)}</Text>
        </Animated.View>

        {detailsLoading && !rank ? <LoadingBlock colors={colors} /> : null}

        <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(140).duration(MOTION.reveal)} style={[styles.rankCard, { backgroundColor: colors.card, borderColor: `${rankColor}66` }]}>
          <View style={[styles.rankIcon, { backgroundColor: `${rankColor}1A`, borderColor: `${rankColor}55` }]}>
            <Ionicons name={rankInfo.icon} size={27} color={rankColor} />
          </View>
          <View style={styles.rankCopy}>
            <Text style={[styles.eyebrow, { color: rankColor }]}>RANGO PvP</Text>
            <Text style={[styles.rankTitle, { color: colors.foreground }]}>{rank?.tier?.toUpperCase() ?? rankInfo.label}</Text>
            <Text style={[styles.rankMeta, { color: colors.mutedForeground }]}>{Number(rank?.mmr ?? 0)} MMR · {Number(rank?.wins ?? stats?.pvp_wins ?? 0)}V / {Number(rank?.losses ?? stats?.pvp_losses ?? 0)}D</Text>
          </View>
          <View style={styles.rankScore}>
            <Text style={[styles.rankScoreValue, { color: rankColor }]}>{Number(rank?.shields ?? 0)}</Text>
            <Text style={[styles.rankScoreLabel, { color: colors.mutedForeground }]}>ESCUDOS</Text>
          </View>
        </Animated.View>

        <Animated.View testID="profile-legacy-record" entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(MOTION.reveal)} style={[styles.legacyCard, { backgroundColor: colors.panelStrong, borderColor: `${colors.rarityEpic}55` }]}>
          <View style={styles.legacyCardHeader}>
            <View style={[styles.legacyMark, { backgroundColor: `${colors.rarityEpic}18`, borderColor: `${colors.rarityEpic}55` }]}>
              <Ionicons name="award" size={21} color={colors.rarityEpic} />
            </View>
            <View style={styles.legacyCardCopy}>
              <Text style={[styles.eyebrow, { color: colors.rarityEpic }]}>REGISTRO DE LEGADO</Text>
              <Text style={[styles.legacyCardTitle, { color: colors.foreground }]}>Lo que has conseguido</Text>
            </View>
          </View>
          <Text style={[styles.legacySummary, { color: colors.mutedForeground }]}>{legacySummary}</Text>
          <View style={[styles.legacySignalRow, { borderTopColor: colors.border }]}>
            <LegacySignal icon="progress" label="NIVEL" value={progress?.level ?? '—'} color={colors.accent} colors={colors} />
            <LegacySignal icon="ribbon-outline" label="LOGROS" value={achievements.length} color={colors.rarityEpic} colors={colors} />
            <LegacySignal icon="trophy-outline" label="VICTORIAS" value={stats?.pvp_wins ?? 0} color={colors.success} colors={colors} />
            <LegacySignal icon="layers-outline" label="CARTAS" value={stats?.cards_owned ?? 0} color={colors.rarityRare} colors={colors} />
          </View>
        </Animated.View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>ESTADO DEL FORJADOR</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nivel y recursos</Text>
          </View>
          <Text style={[styles.sectionCounter, { color: colors.mutedForeground }]}>NIVEL {progress?.level ?? '—'}</Text>
        </View>

        <View style={[styles.progressCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <View style={styles.progressTop}>
            <View>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>EXPERIENCIA</Text>
              <Text style={[styles.progressValue, { color: colors.foreground }]}>{Number(progress?.xp ?? 0).toLocaleString('es-ES')} <Text style={[styles.progressTarget, { color: colors.mutedForeground }]}>/ {Number(progress?.xp_to_next ?? 0).toLocaleString('es-ES')} XP</Text></Text>
            </View>
            <Text style={[styles.progressPercent, { color: colors.accent }]}>{xpPercent}%</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${xpPercent}%` }]} />
          </View>
          <View style={styles.resourceRow}>
            <View style={styles.resourceItem}><Ionicons name="flash-outline" size={16} color={colors.rarityRare} /><Text style={[styles.resourceValue, { color: colors.foreground }]}>{progress?.energy ?? '—'}/{progress?.max_energy ?? '—'}</Text><Text style={[styles.resourceLabel, { color: colors.mutedForeground }]}>ENERGÍA</Text></View>
            <View style={styles.resourceItem}><Ionicons name="logo-bitcoin" size={16} color={colors.accent} /><Text style={[styles.resourceValue, { color: colors.foreground }]}>{Number(wallet?.vex_ingame ?? 0).toLocaleString('es-ES')}</Text><Text style={[styles.resourceLabel, { color: colors.mutedForeground }]}>VEX</Text></View>
            <View style={styles.resourceItem}><Ionicons name="globe-outline" size={16} color={colors.success} /><Text style={[styles.resourceValue, { color: colors.foreground }]}>{progress?.starter_region ?? 'NEXUS'}</Text><Text style={[styles.resourceLabel, { color: colors.mutedForeground }]}>REGIÓN</Text></View>
          </View>
        </View>

        <View style={styles.statGrid}>
          <StatCell icon="trophy-outline" label="VICTORIAS" value={stats?.pvp_wins ?? 0} colors={colors} />
          <StatCell icon="flag-outline" label="MISIONES" value={stats?.missions_completed ?? 0} colors={colors} />
          <StatCell icon="layers-outline" label="CARTAS" value={stats?.cards_owned ?? 0} colors={colors} />
          <StatCell icon="cube-outline" label="PACKS" value={stats?.packs_opened ?? 0} colors={colors} />
          <StatCell icon="storefront-outline" label="VENTAS" value={stats?.market_sales ?? 0} colors={colors} />
          <StatCell icon="ribbon-outline" label="PTS LOGRO" value={totalPoints} colors={colors} />
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>REGISTRO DE HAZAÑAS</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Logros desbloqueados</Text>
          </View>
          <Text style={[styles.sectionCounter, { color: colors.mutedForeground }]}>{achievements.length}</Text>
        </View>

        {achievements.length > 0 ? achievements.map((achievement, index) => <AchievementCard key={achievement.id} achievement={achievement} colors={colors} index={index} reduceMotion={reduceMotion} />) : (
          <View testID="profile-empty-achievements" style={[styles.emptyCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <Ionicons name="ribbon-outline" size={28} color={colors.accent} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aún no hay logros</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Completa misiones y combates para registrar tus primeros hitos.</Text>
          </View>
        )}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>ACCESOS RÁPIDOS</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Continúa tu recorrido</Text>
          </View>
        </View>
        <View style={styles.quickActions}>
          <QuickAction icon="flag-outline" label="Misiones y recompensas" onPress={() => router.push('/missions')} colors={colors} testID="profile-missions" />
          <QuickAction icon="layers-outline" label="Explorar colección" onPress={() => router.push('/collection')} colors={colors} testID="profile-collection" />
          <QuickAction icon="grid-outline" label="Preparar mazo" onPress={() => router.push('/deck')} colors={colors} testID="profile-deck" />
           <QuickAction icon="storefront-outline" label="Forja, tienda e inventario" onPress={() => router.push('/store')} colors={colors} testID="profile-store" />
           <QuickAction icon="wallet-outline" label="Cartera, mercado y retiros" onPress={() => router.push('/economy')} colors={colors} testID="profile-economy" />
           <QuickAction icon="globe-outline" label="Explorar mundo, raids y Codex" onPress={() => router.push('/world')} colors={colors} testID="profile-world" />
           <QuickAction icon="people-outline" label="Amigos, clanes y ranking PvP" onPress={() => router.push('/social')} colors={colors} testID="profile-social" />
           <QuickAction icon="settings" label="Cuenta, ajustes y sistemas" onPress={() => router.push('/meta')} colors={colors} testID="profile-meta" />
        </View>
      </KeyboardAwareScrollViewCompat>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.35 },
  screenTitle: { fontSize: 25, fontWeight: '700', marginTop: 4 },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 21 },
  message: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, padding: 12, borderWidth: 1, borderRadius: 12 },
  messageText: { flex: 1, fontSize: 12, lineHeight: 18 },
  identityCard: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 16, borderWidth: 1, borderRadius: 16 },
  avatar: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  identityCopy: { flex: 1, marginLeft: 13 },
  identityName: { fontSize: 18, fontWeight: '700' },
  identityEmail: { fontSize: 11, marginTop: 3 },
  identityMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  identityStatus: { fontSize: 9, fontWeight: '700', letterSpacing: 0.55 },
  memberSince: { alignSelf: 'flex-start', fontSize: 9, fontWeight: '700', letterSpacing: 0.55, maxWidth: 70, textAlign: 'right' },
  rankCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, padding: 16, borderWidth: 1, borderRadius: 16 },
  rankIcon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 14 },
  rankCopy: { flex: 1, marginLeft: 13 },
  rankTitle: { fontSize: 21, fontWeight: '800', letterSpacing: 0.5, marginTop: 2 },
  rankMeta: { fontSize: 11, marginTop: 4 },
  rankScore: { alignItems: 'flex-end' },
  rankScoreValue: { fontSize: 20, fontWeight: '800' },
  rankScoreLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8, marginTop: 2 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 28, marginBottom: 11 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 3 },
  sectionCounter: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 2 },
  progressCard: { marginHorizontal: 16, padding: 16, borderWidth: 1, borderRadius: 16 },
  progressTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  progressLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  progressValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  progressTarget: { fontSize: 12, fontWeight: '500' },
  progressPercent: { fontSize: 13, fontWeight: '800' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', borderRadius: 4 },
  resourceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  resourceItem: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 5 },
  resourceValue: { fontSize: 13, fontWeight: '700' },
  resourceLabel: { width: '100%', fontSize: 8, fontWeight: '700', letterSpacing: 0.8, marginTop: 4 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, marginTop: 12, backgroundColor: 'transparent' },
  statCell: { width: '50%', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 5 },
  statLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8, marginTop: 3 },
  achievementCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 9, padding: 13, borderWidth: 1, borderRadius: 13 },
  achievementIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12 },
  achievementCopy: { flex: 1, marginHorizontal: 11 },
  achievementTitle: { fontSize: 13, fontWeight: '700' },
  achievementDescription: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  achievementMeta: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 5 },
  emptyCard: { alignItems: 'center', marginHorizontal: 16, padding: 26, borderWidth: 1, borderRadius: 16 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  body: { fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  quickActions: { gap: 9, marginHorizontal: 16 },
  quickAction: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderRadius: 13 },
  quickActionLabel: { flex: 1, fontSize: 13, fontWeight: '600', marginLeft: 10 },
  stateBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, marginTop: 16, padding: 14, borderWidth: 1, borderRadius: 13 },
  legacyCard: { marginHorizontal: 16, marginTop: 14, padding: 16, borderWidth: 1, borderRadius: 16 },
  legacyCardHeader: { flexDirection: 'row', alignItems: 'center' },
  legacyMark: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 13 },
  legacyCardCopy: { flex: 1, marginLeft: 11 },
  legacyCardTitle: { fontSize: 18, fontWeight: '800', marginTop: 3 },
  legacySummary: { fontSize: 12, lineHeight: 18, marginTop: 14 },
  legacySignalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, paddingTop: 15, borderTopWidth: StyleSheet.hairlineWidth },
  legacySignal: { flex: 1, alignItems: 'center' },
  legacySignalIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 9 },
  legacySignalValue: { fontSize: 15, fontWeight: '800', marginTop: 6 },
  legacySignalLabel: { fontSize: 7, fontWeight: '800', letterSpacing: 0.7, marginTop: 3 },
  authContent: { alignItems: 'stretch', paddingHorizontal: 24 },
  authMark: { alignSelf: 'center', width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 18, marginBottom: 22 },
  authTitle: { fontSize: 30, fontWeight: '800', marginTop: 7 },
  authFields: { gap: 14, marginTop: 28 },
  inputGroup: { gap: 7 },
  inputLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 14 },
  errorText: { fontSize: 12, lineHeight: 18, marginTop: 14 },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginTop: 20 },
  primaryButtonText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  modeButton: { alignItems: 'center', paddingVertical: 17 },
  modeText: { fontSize: 12, fontWeight: '600' },
});