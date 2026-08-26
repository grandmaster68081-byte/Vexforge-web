import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { loadDailyFeaturedCard, loadHomeMissions, loadHomeStats, loadRecentActivity, storageAsset, type ActivityItem, type DailyCard, type HomeMission, type HomeStats } from '@/lib/supabase';
import { ForgeMark } from '@/components/ForgeMark';
import { ProgressBar } from '@/components/ProgressBar';
import { useRouter } from 'expo-router';

type HomeSnapshot = {
  stats: HomeStats | null;
  dailyCard: DailyCard | null;
  missions: HomeMission[];
  activity: ActivityItem[];
};

const FEATURE_HIGHLIGHTS: Array<{
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: 'primary' | 'success' | 'accent' | 'danger';
}> = [
  { title: 'Cartas únicas', description: 'Colecciona cartas de cuatro facciones.', icon: 'layers-outline', color: 'danger' },
  { title: 'Combate PvP', description: 'Sube tu rango en la arena competitiva.', icon: 'flash-outline', color: 'primary' },
  { title: 'Packs y forja', description: 'Descubre nuevas cartas y combinaciones.', icon: 'cube-outline', color: 'success' },
  { title: 'Misiones diarias', description: 'Completa objetivos y gana recompensas.', icon: 'shield-checkmark-outline', color: 'accent' },
];

function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

function countdown(iso: string) {
  const remaining = new Date(iso).getTime() - Date.now();
  if (remaining <= 0) return 'Finalizado';
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return `${days}d ${hours}h ${minutes}m`;
}

function rankName(mmr: number) {
  if (mmr >= 3000) return 'Mythic';
  if (mmr >= 2400) return 'Diamond';
  if (mmr >= 1800) return 'Platinum';
  if (mmr >= 1300) return 'Gold';
  if (mmr >= 900) return 'Silver';
  if (mmr >= 500) return 'Bronze';
  return 'Iron';
}

function SectionLabel({ children, color }: { children: string; color: string }) {
  return <Text style={[styles.eyebrow, { color }]}>{children}</Text>;
}

function ActionButton({ label, icon, onPress, colors, secondary = false, testID }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; colors: ReturnType<typeof useColors>; secondary?: boolean; testID: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: secondary ? colors.secondary : colors.primary, borderColor: secondary ? colors.border : colors.primary, opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <Ionicons name={icon} size={16} color={secondary ? colors.foreground : colors.primaryForeground} />
      <Text style={[styles.actionText, { color: secondary ? colors.foreground : colors.primaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

export default function ForgeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wallet, stats, player, progress, syncState, refresh } = useGame();
  const [home, setHome] = useState<HomeSnapshot>({ stats: null, dailyCard: null, missions: [], activity: [] });
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState<string | null>(null);

  const loadHome = useCallback(async () => {
    setHomeLoading(true);
    setHomeError(null);
    const results = await Promise.allSettled([
      loadHomeStats(),
      loadDailyFeaturedCard(),
      loadHomeMissions(),
      loadRecentActivity(),
    ]);
    const [statsResult, cardResult, missionsResult, activityResult] = results;
    const nextHome: HomeSnapshot = {
      stats: statsResult.status === 'fulfilled' ? statsResult.value : null,
      dailyCard: cardResult.status === 'fulfilled' ? cardResult.value : null,
      missions: missionsResult.status === 'fulfilled' ? missionsResult.value : [],
      activity: activityResult.status === 'fulfilled' ? activityResult.value : [],
    };
    setHome(nextHome);
    if (!nextHome.stats && !nextHome.dailyCard && nextHome.missions.length === 0 && nextHome.activity.length === 0) {
      setHomeError('No se pudo sincronizar el contenido del Nexus.');
    }
    setHomeLoading(false);
  }, []);

  useEffect(() => { void loadHome(); }, [loadHome]);

  const handleRefresh = () => { void Promise.all([refresh(), loadHome()]); };
  const displayName = player?.display_name?.trim() || 'FORJADOR';
  const energyPercent = progress ? Math.min(100, Math.round((progress.energy / Math.max(1, progress.max_energy)) * 100)) : 0;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 112 }}
      refreshControl={<RefreshControl refreshing={homeLoading || syncState === 'loading'} onRefresh={handleRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(450)} style={[styles.hero, { borderBottomColor: colors.border }]}>
        <Image source={{ uri: storageAsset('lobby/main.jpg') }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.ink, opacity: 0.78 }]} />
        <View style={[StyleSheet.absoluteFillObject, styles.heroVignette, { backgroundColor: colors.ink }]} />
        <View style={[styles.heroContent, { paddingTop: insets.top + 20 }]}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <ForgeMark />
              <View>
                <Text style={[styles.kicker, { color: colors.accent }]}>VEXFORGE</Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>NEXUS // 01</Text>
              </View>
            </View>
            <View accessibilityLabel="Notificaciones" style={[styles.iconButton, { borderColor: colors.border }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
              <View style={[styles.notificationDot, { backgroundColor: colors.accent }]} />
            </View>
          </View>

          <View style={styles.greeting}>
            <SectionLabel color={colors.accent}>VEXFORGE — TRADING CARD GAME</SectionLabel>
            <Text style={[styles.title, { color: colors.foreground }]}>Forja tu{'\n'}leyenda.</Text>
            <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>Compite, forja y domina la arena con cartas de valor real.</Text>
          </View>

          <View style={styles.actionRow}>
            <ActionButton label="Mi colección" icon="layers-outline" onPress={() => router.push('/collection')} colors={colors} testID="home-collection" />
            <ActionButton label="Entrar a la arena" icon="flash-outline" onPress={() => router.push('/battle')} colors={colors} secondary testID="home-battle" />
          </View>
           <Pressable
             accessibilityRole="button"
             accessibilityLabel="Abrir tutorial de la Forja"
             testID="home-tutorial"
             onPress={() => router.push('/tutorial')}
             style={({ pressed }) => [styles.tutorialLink, { borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
           >
             <Ionicons name="compass-outline" size={16} color={colors.accent} />
             <Text style={[styles.tutorialLinkText, { color: colors.accent }]}>APRENDER A JUGAR</Text>
             <Ionicons name="arrow-forward" size={15} color={colors.accent} />
           </Pressable>

           <View style={styles.heroStats}>
            <View style={styles.heroStat}><Text style={[styles.heroStatValue, { color: colors.accent }]}>{home.stats?.total_cards ?? '—'}</Text><Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>CARTAS</Text></View>
            <View style={styles.heroStat}><Text style={[styles.heroStatValue, { color: colors.accent }]}>{home.stats?.active_players ?? '—'}</Text><Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>FORJADORES</Text></View>
            <View style={styles.heroStat}><Text style={[styles.heroStatValue, { color: colors.accent }]}>{home.stats?.total_battles ?? '—'}</Text><Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>BATALLAS</Text></View>
             <View style={styles.heroStat}><Text style={[styles.heroStatValue, { color: colors.accent }]}>{home.stats?.packs_opened ?? '—'}</Text><Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>PACKS ABIERTOS</Text></View>
          </View>
        </View>
      </Animated.View>

      <View style={styles.content}>
        <View style={[styles.connectionCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <View style={[styles.connectionDot, { backgroundColor: syncState === 'connected' ? colors.success : syncState === 'loading' ? colors.accent : colors.danger }]} />
          <View style={styles.connectionCopy}>
            <Text style={[styles.connectionTitle, { color: colors.foreground }]}>NEXUS {syncState === 'connected' ? 'CONECTADO' : syncState === 'loading' ? 'SINCRONIZANDO' : 'SIN CONEXIÓN'}</Text>
            <Text style={[styles.connectionBody, { color: colors.mutedForeground }]}>{syncState === 'connected' ? 'Datos vivos de Supabase oficial' : 'Desliza para volver a intentar'}</Text>
          </View>
          <Ionicons name={syncState === 'connected' ? 'checkmark-circle-outline' : 'cloud-outline'} size={21} color={syncState === 'connected' ? colors.success : colors.mutedForeground} />
        </View>

        {homeError ? (
          <View style={[styles.errorCard, { backgroundColor: colors.panel, borderColor: colors.danger }]}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.foreground }]}>{homeError}</Text>
            <Pressable accessibilityRole="button" testID="home-retry" onPress={() => void loadHome()}><Text style={[styles.retryText, { color: colors.accent }]}>REINTENTAR</Text></Pressable>
          </View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(40).duration(450)} style={[styles.quickBattle, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
          <View style={styles.quickBattleCopy}>
            <Ionicons name="flash-outline" size={22} color={colors.primary} />
            <View style={styles.quickBattleText}>
              <Text style={[styles.quickBattleTitle, { color: colors.primary }]}>BATALLA RÁPIDA VS IA</Text>
              <Text style={[styles.quickBattleBody, { color: colors.mutedForeground }]}>Sin esperas · Practica tus estrategias en la arena.</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jugar batalla rápida"
            testID="home-quick-battle"
            onPress={() => router.push('/battle')}
            style={({ pressed }) => [styles.quickBattleButton, { backgroundColor: colors.primary, opacity: pressed ? 0.76 : 1 }]}
          >
            <Text style={[styles.quickBattleButtonText, { color: colors.primaryForeground }]}>JUGAR</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)} style={[styles.resourceCard, { backgroundColor: colors.panelStrong, borderColor: colors.border }]}>
          <View>
            <SectionLabel color={colors.mutedForeground}>BALANCE DE FORJA</SectionLabel>
            <Text style={[styles.balance, { color: colors.foreground }]}>{(wallet?.vex_ingame ?? 0).toLocaleString('es')}</Text>
            <Text style={[styles.resourceLabel, { color: colors.accent }]}>VEX DISPONIBLE</Text>
          </View>
          <View style={styles.resourceSide}>
            <View style={[styles.resourcePill, { backgroundColor: colors.panel }]}>
              <Ionicons name="diamond-outline" size={14} color={colors.accent} />
              <Text style={[styles.pillText, { color: colors.foreground }]}>{wallet?.reserved_ingame ?? 0}</Text>
            </View>
            <Text style={[styles.resourceLabel, { color: colors.mutedForeground }]}>RESERVADO</Text>
          </View>
        </Animated.View>

        {home.stats?.active_event ? (
          <Animated.View entering={FadeInDown.delay(140).duration(450)} style={[styles.eventCard, { backgroundColor: colors.panelStrong, borderColor: colors.accent }]}>
            <View style={styles.eventHeader}>
              <View style={styles.eventCopy}>
                <SectionLabel color={colors.accent}>EVENTO ACTIVO · TEMPORADA 1</SectionLabel>
                <Text style={[styles.eventTitle, { color: colors.foreground }]}>{home.stats.active_event.name}</Text>
               <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>Completa misiones del Festival y gana recompensas exclusivas.</Text>
              </View>
              <View style={styles.eventTimer}><Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>TERMINA EN</Text><Text style={[styles.timer, { color: colors.accent }]}>{countdown(home.stats.active_event.ends_at)}</Text></View>
            </View>
            <View style={styles.progressHeader}><Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>PROGRESO GLOBAL</Text><Text style={[styles.timerLabel, { color: colors.accent }]}>{home.stats.active_event.progress ?? 0}%</Text></View>
            <ProgressBar value={Math.max(0, Math.min(100, home.stats.active_event.progress ?? 0))} color={colors.accent} />
             <Pressable
               accessibilityRole="button"
               testID="home-event-arena"
               onPress={() => router.push('/battle')}
               style={({ pressed }) => [styles.eventButton, { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}
             >
               <Text style={[styles.eventButtonText, { color: colors.accent }]}>ENTRAR A LA ARENA</Text>
               <Ionicons name="arrow-forward" size={15} color={colors.accent} />
             </Pressable>
          </Animated.View>
        ) : home.stats?.season ? (
          <Animated.View entering={FadeInDown.delay(140).duration(450)} style={[styles.seasonCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <View style={styles.seasonCopy}>
              <SectionLabel color={colors.accent}>TEMPORADA ACTUAL</SectionLabel>
              <Text style={[styles.seasonTitle, { color: colors.foreground }]}>{home.stats.season.name}</Text>
              <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>La arena sigue abierta para los forjadores.</Text>
            </View>
            <View style={styles.seasonStatus}>
              <Ionicons name="radio-outline" size={20} color={colors.success} />
              <Text style={[styles.seasonStatusText, { color: colors.success }]}>EN VIVO</Text>
            </View>
          </Animated.View>
        ) : null}

        {home.dailyCard ? (
          <Animated.View entering={FadeInDown.delay(200).duration(450)}>
            <SectionLabel color={colors.accent}>CARTA DEL DÍA</SectionLabel>
            <View style={[styles.dailyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.cardImageFrame, { borderColor: colors.accent }]}>
                {home.dailyCard.image_url ? <Image source={{ uri: home.dailyCard.image_url }} style={styles.cardImage} resizeMode="cover" /> : <Ionicons name="layers-outline" size={34} color={colors.accent} />}
              </View>
              <View style={styles.dailyCopy}>
                <Text style={[styles.cardMeta, { color: colors.accent }]}>DESTACADA HOY · {home.dailyCard.faction}</Text>
                <Text style={[styles.dailyTitle, { color: colors.foreground }]}>{home.dailyCard.name}</Text>
                <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>PODER {home.dailyCard.power} · {home.dailyCard.rarity}</Text>
                {home.dailyCard.lore ? <Text style={[styles.lore, { color: colors.mutedForeground }]} numberOfLines={3}>"{home.dailyCard.lore}"</Text> : null}
                <Pressable accessibilityRole="button" testID="home-daily-card" onPress={() => router.push('/collection')} style={({ pressed }) => [styles.inlineButton, { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}>
                  <Text style={[styles.inlineButtonText, { color: colors.accent }]}>VER COLECCIÓN</Text><Ionicons name="arrow-forward" size={15} color={colors.accent} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        ) : !homeLoading ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <SectionLabel color={colors.accent}>CARTA DEL DÍA</SectionLabel>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>La rotación está en pausa.</Text>
            <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>Vuelve a sincronizar más tarde para descubrir la siguiente carta destacada.</Text>
          </View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(260).duration(450)}>
          <View style={styles.sectionHeader}><SectionLabel color={colors.accent}>TU ESTADO</SectionLabel><Text style={[styles.counter, { color: colors.mutedForeground }]}>{stats?.pvp_wins ?? 0} VICTORIAS</Text></View>
          <View style={styles.stateGrid}>
            <View style={[styles.stateCard, { backgroundColor: colors.panel, borderColor: colors.border }]}><Ionicons name="person-outline" size={19} color={colors.accent} /><Text style={[styles.stateLabel, { color: colors.mutedForeground }]}>JUGADOR</Text><Text style={[styles.stateValue, { color: colors.foreground }]} numberOfLines={1}>{displayName}</Text></View>
            <View style={[styles.stateCard, { backgroundColor: colors.panel, borderColor: colors.border }]}><Ionicons name="trending-up-outline" size={19} color={colors.accent} /><Text style={[styles.stateLabel, { color: colors.mutedForeground }]}>NIVEL</Text><Text style={[styles.stateValue, { color: colors.foreground }]}>{progress?.level ?? '—'}</Text></View>
            <View style={[styles.stateCard, { backgroundColor: colors.panel, borderColor: colors.border }]}><Ionicons name="flash-outline" size={19} color={colors.accent} /><Text style={[styles.stateLabel, { color: colors.mutedForeground }]}>ENERGÍA</Text><Text style={[styles.stateValue, { color: colors.foreground }]}>{progress ? `${progress.energy}/${progress.max_energy}` : '—'}</Text><ProgressBar value={energyPercent} color={colors.success} /></View>
            <View style={[styles.stateCard, { backgroundColor: colors.panel, borderColor: colors.border }]}><Ionicons name="layers-outline" size={19} color={colors.accent} /><Text style={[styles.stateLabel, { color: colors.mutedForeground }]}>CARTAS</Text><Text style={[styles.stateValue, { color: colors.foreground }]}>{stats?.cards_owned ?? '—'}</Text></View>
          </View>
        </Animated.View>

        {home.missions.length > 0 ? (
          <View>
            <View style={styles.sectionHeader}><SectionLabel color={colors.accent}>PRÓXIMAS MISIONES</SectionLabel><Pressable accessibilityRole="button" testID="home-missions" onPress={() => router.push('/battle')}><Text style={[styles.counter, { color: colors.accent }]}>ENTRAR A LA ARENA</Text></Pressable></View>
            {home.missions.map((mission) => (
              <View key={mission.id} style={[styles.missionRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.missionIcon, { backgroundColor: colors.muted }]}><Ionicons name="shield-checkmark-outline" size={20} color={colors.success} /></View>
                <View style={styles.missionCopy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{mission.name}</Text><Text style={[styles.cardBody, { color: colors.mutedForeground }]}>{mission.difficulty ?? 'Misión'} · {mission.energy_cost ?? 0} energía · +{mission.reward_vex_ingame ?? 0} VEX</Text></View>
              </View>
            ))}
          </View>
        ) : null}

        {home.stats?.top3?.length ? (
          <View>
            <View style={styles.sectionHeader}><SectionLabel color={colors.accent}>TOP ARENA</SectionLabel><Text style={[styles.counter, { color: colors.mutedForeground }]}>CLASIFICACIÓN VIVA</Text></View>
            {home.stats.top3.map((entry, index) => (
              <View key={`${entry.display_name}-${entry.rank}`} style={[styles.leaderRow, { backgroundColor: colors.panel, borderColor: index === 0 ? colors.accent : colors.border }]}>
                <Text style={[styles.leaderRank, { color: colors.accent }]}>{String(entry.rank).padStart(2, '0')}</Text>
                <View style={styles.leaderCopy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{entry.display_name}</Text><Text style={[styles.cardBody, { color: colors.mutedForeground }]}>{rankName(entry.mmr)} · {entry.mmr} MMR</Text></View>
                <Text style={[styles.leaderWins, { color: colors.success }]}>{entry.wins}W</Text>
              </View>
            ))}
          </View>
        ) : null}

        {home.activity.length > 0 ? (
          <View>
            <SectionLabel color={colors.accent}>ACTIVIDAD RECIENTE</SectionLabel>
            <View style={[styles.activityCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
              {home.activity.map((item, index) => (
                <View key={item.id} style={[styles.activityRow, index < home.activity.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                  <Ionicons name="sparkles-outline" size={16} color={colors.accent} /><Text style={[styles.activityText, { color: colors.mutedForeground }]} numberOfLines={1}>{item.text}</Text><Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{timeAgo(item.time)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : !homeLoading ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <SectionLabel color={colors.accent}>ACTIVIDAD RECIENTE</SectionLabel>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aún no hay actividad pública.</Text>
            <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>Las misiones completadas aparecerán aquí.</Text>
          </View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(320).duration(450)}>
          <SectionLabel color={colors.accent}>SISTEMAS DE LA FORJA</SectionLabel>
          <View style={styles.featureGrid}>
            {FEATURE_HIGHLIGHTS.map((feature) => {
              const featureColor = colors[feature.color];
              return (
                <View key={feature.title} style={[styles.featureCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
                  <View style={[styles.featureIcon, { backgroundColor: `${featureColor}18` }]}>
                    <Ionicons name={feature.icon} size={19} color={featureColor} />
                  </View>
                  <Text style={[styles.featureTitle, { color: colors.foreground }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>{feature.description}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: { minHeight: 430, overflow: 'hidden', borderBottomWidth: 1 },
  heroVignette: { opacity: 0.58 },
  heroContent: { paddingHorizontal: 20, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  kicker: { fontSize: 15, fontWeight: '700', letterSpacing: 3 },
  subtitle: { fontSize: 9, fontWeight: '600', letterSpacing: 2, marginTop: 3 },
  iconButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', top: 9, right: 10 },
  greeting: { marginTop: 46, marginBottom: 22 },
  eyebrow: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700' },
  title: { fontSize: 38, lineHeight: 43, fontWeight: '700', marginTop: 12 },
  heroBody: { fontSize: 14, lineHeight: 21, maxWidth: 300, marginTop: 13 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: { minHeight: 42, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 },
  actionText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
   heroStats: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 22, rowGap: 12, marginTop: 28 },
   heroStat: { alignItems: 'flex-start', minWidth: 62 },
  heroStatValue: { fontSize: 21, fontWeight: '800' },
  heroStatLabel: { fontSize: 9, letterSpacing: 1.2, fontWeight: '700', marginTop: 3 },
   tutorialLink: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8, marginTop: 12 },
   tutorialLinkText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  content: { padding: 20, gap: 24 },
  connectionCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 13 },
  connectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 11 },
  connectionCopy: { flex: 1 },
  connectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  connectionBody: { fontSize: 11, marginTop: 4 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 13 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 17 },
  retryText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  resourceCard: { borderWidth: 1, borderRadius: 22, padding: 19, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balance: { fontSize: 32, fontWeight: '700', letterSpacing: 0.5, marginTop: 3 },
  resourceLabel: { fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginTop: 4 },
  resourceSide: { alignItems: 'flex-end' },
  resourcePill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  pillText: { fontSize: 16, fontWeight: '700' },
  eventCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  eventHeader: { flexDirection: 'row', gap: 12 },
  eventCopy: { flex: 1 },
  eventTitle: { fontSize: 19, fontWeight: '700', marginTop: 8, marginBottom: 5 },
  eventTimer: { alignItems: 'flex-end' },
   eventButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, marginTop: 15 },
   eventButtonText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  timerLabel: { fontSize: 9, letterSpacing: 1.1, fontWeight: '700' },
  timer: { fontSize: 15, fontWeight: '800', marginTop: 7 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 7 },
  dailyCard: { flexDirection: 'row', gap: 15, borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 12 },
  cardImageFrame: { width: 92, height: 124, borderRadius: 10, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  cardImage: { width: '100%', height: '100%' },
  dailyCopy: { flex: 1, justifyContent: 'space-between', gap: 7 },
  cardMeta: { fontSize: 9, letterSpacing: 1.1, fontWeight: '700' },
  dailyTitle: { fontSize: 18, fontWeight: '700', lineHeight: 22 },
  lore: { fontSize: 11, lineHeight: 16, fontStyle: 'italic' },
  inlineButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  inlineButtonText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { fontSize: 9, fontWeight: '700', letterSpacing: 0.9 },
  stateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  stateCard: { width: '48%', minHeight: 94, borderWidth: 1, borderRadius: 14, padding: 12 },
  stateLabel: { fontSize: 9, letterSpacing: 1.1, fontWeight: '700', marginTop: 8 },
  stateValue: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 10 },
  missionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  missionCopy: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  cardBody: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 13, marginTop: 10 },
  leaderRank: { width: 35, fontSize: 15, fontWeight: '800' },
  leaderCopy: { flex: 1 },
  leaderWins: { fontSize: 12, fontWeight: '800' },
  activityCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginTop: 12 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, paddingVertical: 12 },
  activityText: { flex: 1, fontSize: 11 },
  activityTime: { fontSize: 9 },
   quickBattle: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
   quickBattleCopy: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
   quickBattleText: { flex: 1 },
   quickBattleTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
   quickBattleBody: { fontSize: 11, lineHeight: 16, marginTop: 3 },
   quickBattleButton: { borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9 },
   quickBattleButtonText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
   seasonCard: { borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
   seasonCopy: { flex: 1 },
   seasonTitle: { fontSize: 19, fontWeight: '700', marginTop: 8, marginBottom: 5 },
   seasonStatus: { alignItems: 'center', gap: 5 },
   seasonStatusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
   emptyCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
   emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 3 },
   featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
   featureCard: { width: '48%', minHeight: 138, borderWidth: 1, borderRadius: 16, padding: 13 },
   featureIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
   featureTitle: { fontSize: 13, fontWeight: '800' },
   featureDescription: { fontSize: 11, lineHeight: 16, marginTop: 5 },
});