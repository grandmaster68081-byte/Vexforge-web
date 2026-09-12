import { useCallback, useEffect, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Image, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenShell } from '@/components/ScreenShell';
import { ForgeIconName, VexIcon } from '@/components/ForgeIcon';
import { OFFICIAL_ASSETS } from '@/constants/visual';
import { DOMAIN_IDENTITY, DEPTH, MOTION } from '@/constants/experience';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import {
  loadDailyFeaturedCard,
  loadHomeMissions,
  loadHomeStats,
  loadRecentActivity,
  type ActivityItem,
  type DailyCard,
  type HomeMission,
  type HomeStats,
} from '@/lib/supabase';

type IconName = ForgeIconName;
type HomeRoute =
  | '/'
  | '/battle'
  | '/collection'
  | '/deck'
  | '/missions'
  | '/profile'
  | '/meta'
  | '/world'
  | '/tutorial'
  | '/economy'
  | '/store?mode=fusion'
  | '/store?mode=shop'
  | '/store?mode=evolution'
  | '/store?mode=packs';
type HomeState = 'loading' | 'ready' | 'partial' | 'error';
type RemoteHome = { stats: HomeStats | null; card: DailyCard | null; missions: HomeMission[]; activity: ActivityItem[] };

const INITIAL_HOME: RemoteHome = { stats: null, card: null, missions: [], activity: [] };

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('es-ES').format(Math.max(0, Math.round(value ?? 0)));
}

function formatEventTime(endsAt: string | null | undefined) {
  if (!endsAt) return 'SIN FECHA';
  const remaining = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const hours = Math.floor(remaining / 3600000);
  const days = Math.floor(hours / 24);
  return days > 0 ? `${days}D ${hours % 24}H` : `${hours}H ${Math.floor((remaining % 3600000) / 60000)}M`;
}

function capitalize(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  if (!normalized) return fallback;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function Icon({ name, color, size = 18, style }: { name: IconName; color: string; size?: number; style?: StyleProp<ViewStyle> }) {
  return <VexIcon name={name} color={color} size={size} style={style} />;
}

function ThresholdButton({
  label,
  icon,
  onPress,
  testID,
  secondary = false,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  testID: string;
  secondary?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={() => {
        void Haptics.impactAsync(secondary ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        secondary ? styles.secondaryThreshold : styles.primaryThreshold,
        { backgroundColor: secondary ? `${colors.ink}99` : undefined, borderColor: secondary ? `${colors.foreground}66` : colors.accent, opacity: pressed ? 0.76 : 1 },
      ]}
    >
      {!secondary ? <LinearGradient colors={[colors.accent, colors.primary]} style={StyleSheet.absoluteFill} /> : null}
      <View style={[styles.thresholdGlyph, { borderColor: secondary ? `${colors.foreground}66` : `${colors.ink}70` }]}>
        <Icon name={icon} color={secondary ? colors.foreground : colors.ink} size={16} />
      </View>
      <View style={styles.thresholdCopy}>
        <Text style={[styles.thresholdLabel, { color: secondary ? colors.foreground : colors.ink }]}>{label}</Text>
        <Text style={[styles.thresholdMeta, { color: secondary ? `${colors.foreground}92` : `${colors.ink}AA` }]}>{secondary ? 'CONTINUAR RITO' : 'ACCIÓN PRINCIPAL'}</Text>
      </View>
      <Icon name="arrow-up" color={secondary ? colors.foreground : colors.ink} size={12} />
    </Pressable>
  );
}

function SectionMarker({ eyebrow, title, action, onAction, accent }: { eyebrow: string; title: string; action?: string; onAction?: () => void; accent?: string }) {
  const colors = useColors();
  const markerColor = accent ?? colors.accent;
  return (
    <View style={styles.sectionMarker}>
      <View style={styles.sectionMarkerCopy}>
        <View style={styles.markerLine}>
          <View style={[styles.markerDot, { backgroundColor: markerColor }]} />
          <Text style={[styles.eyebrow, { color: markerColor }]}>{eyebrow}</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {action && onAction ? (
        <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onAction} style={styles.markerAction}>
          <Text style={[styles.markerActionText, { color: colors.mutedForeground }]}>{action}</Text>
          <Icon name="arrow-up" color={markerColor} size={13} />
        </Pressable>
      ) : null}
    </View>
  );
}

function ProgressRail({ value, total, color, background }: { value: number; total: number; color: string; background: string }) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  return (
    <View style={[styles.progressRail, { backgroundColor: background }]}>
      <View style={[styles.progressFill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

function LoadingTrace() {
  const colors = useColors();
  return (
    <View accessibilityLabel="Cargando señal del Nexus" style={[styles.loadingTrace, { borderColor: `${colors.border}88` }]}>
      <View style={[styles.loadingTraceMark, { backgroundColor: `${colors.accent}66` }]} />
      <View style={styles.loadingTraceCopy}>
        <View style={[styles.loadingTraceLine, styles.loadingTraceLineLong, { backgroundColor: `${colors.foreground}20` }]} />
        <View style={[styles.loadingTraceLine, styles.loadingTraceLineShort, { backgroundColor: `${colors.foreground}12` }]} />
      </View>
      <Text style={[styles.loadingTraceText, { color: colors.mutedForeground }]}>RECIBIENDO SEÑAL</Text>
    </View>
  );
}

function DomainNode({
  portal,
  signal,
  onPress,
}: {
  portal: { id: string; label: string; title: string; status: string; icon: IconName; route: HomeRoute; color: string };
  onPress: () => void;
  signal?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={signal ? `Abrir dominio ${portal.label}. ${signal}` : `Abrir dominio ${portal.label}`}
      testID={`home-domain-${portal.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.domainNode, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.domainNodeStem, { backgroundColor: `${portal.color}88` }]} />
      <View style={[styles.domainSigil, { borderColor: `${portal.color}A8`, backgroundColor: `${portal.color}15` }]}>
        <Icon name={portal.icon} color={portal.color} size={17} />
      </View>
      <View style={styles.domainNodeCopy}>
        <Text style={[styles.domainLabel, { color: portal.color }]}>{portal.label}</Text>
        <Text numberOfLines={1} style={[styles.domainNodeTitle, { color: colors.foreground }]}>{portal.title}</Text>
        <Text numberOfLines={1} style={[styles.domainStatus, { color: colors.mutedForeground }]}>{portal.status}</Text>
      </View>
      <Icon name="chevron-right" color={`${portal.color}CC`} size={13} />
    </Pressable>
  );
}

function SceneOrbitPoint({
  portal,
  signal,
  onPress,
}: {
  portal: Parameters<typeof DomainNode>[0]['portal'];
  signal: string;
  onPress: () => void;
}) {
  return <DomainNode portal={portal} signal={signal} onPress={onPress} />;
}

function SignalMetric({ label, value, icon, color }: { label: string; value: string; icon: IconName; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.signalMetric}>
      <Icon name={icon} color={color} size={14} />
      <View style={styles.signalMetricCopy}>
        <Text style={[styles.signalValue, { color: colors.foreground }]}>{value}</Text>
        <Text style={[styles.signalLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
    </View>
  );
}

function MissionLine({ mission, index, onPress }: { mission: HomeMission; index: number; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir misión ${mission.name}`}
      testID={`home-mission-${mission.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.missionLine, { borderBottomColor: `${colors.border}88`, opacity: pressed ? 0.68 : 1 }]}
    >
      <Text style={[styles.missionIndex, { color: colors.accent }]}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={styles.missionLineCopy}>
        <Text numberOfLines={1} style={[styles.missionName, { color: colors.foreground }]}>{mission.name}</Text>
        <Text style={[styles.missionMeta, { color: colors.mutedForeground }]}>{capitalize(mission.difficulty, 'RITO')} / {formatNumber(mission.reward_xp)} XP / {formatNumber(mission.reward_vex_ingame)} VEX</Text>
      </View>
      <Icon name="arrow-up" color={colors.accent} size={13} />
    </Pressable>
  );
}

export default function ForgeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const { player, progress, wallet, stats: playerStats, cardsTotal, featuredCards, syncState, syncError, refresh } = useGame();
  const [home, setHome] = useState<RemoteHome>(INITIAL_HOME);
  const [homeState, setHomeState] = useState<HomeState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [featuredExpanded, setFeaturedExpanded] = useState(false);
  const [heroAssetState, setHeroAssetState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sentinelAssetState, setSentinelAssetState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [featuredAssetState, setFeaturedAssetState] = useState<'loading' | 'ready' | 'error'>('loading');
  const pulse = useSharedValue(0);
  const orbit = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const loadHome = useCallback(async () => {
    setHomeState('loading');
    const results = await Promise.allSettled([loadHomeStats(), loadDailyFeaturedCard(), loadHomeMissions(), loadRecentActivity(5)]);
    const [statsResult, cardResult, missionResult, activityResult] = results;
    setHome((current) => ({
      stats: statsResult.status === 'fulfilled' ? statsResult.value : current.stats,
      card: cardResult.status === 'fulfilled' ? cardResult.value : current.card,
      missions: missionResult.status === 'fulfilled' ? missionResult.value : current.missions,
      activity: activityResult.status === 'fulfilled' ? activityResult.value : current.activity,
    }));
    const failed = results.filter((result) => result.status === 'rejected').length;
    setHomeState(failed === results.length ? 'error' : failed > 0 ? 'partial' : 'ready');
  }, []);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 0;
      orbit.value = 0;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: MOTION.ambient, easing: Easing.inOut(Easing.quad) }), -1, true);
    orbit.value = withRepeat(withTiming(1, { duration: MOTION.ambient * 3, easing: Easing.linear }), -1, false);
  }, [orbit, pulse, reduceMotion]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.38 + pulse.value * 0.26,
    transform: [{ scale: 0.9 + pulse.value * 0.12 }],
  }));
  const heroParallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value * 0.1 }, { scale: 1.04 + Math.min(scrollY.value / 2600, 0.07) }],
  }));
  const sentinelParallaxStyle = useAnimatedStyle(() => ({
    opacity: 0.92,
    transform: [{ translateY: scrollY.value * 0.2 }, { translateX: Math.sin(orbit.value * Math.PI * 2) * 3 }, { scale: 1.02 + pulse.value * 0.02 }],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.25,
    transform: [{ rotate: `${orbit.value * 360}deg` }, { scale: 0.92 + pulse.value * 0.06 }],
  }));

  const activeCard = home.card ?? featuredCards[0] ?? null;
  const playerName = capitalize(player?.display_name, 'Forjador');
  const activeEvent = home.stats?.active_event ?? null;
  const season = home.stats?.season ?? null;
  const xp = progress?.xp ?? 0;
  const xpToNext = progress?.xp_to_next ?? 0;
  const connectionLabel = syncState === 'connected' ? 'NEXUS ONLINE' : syncState === 'offline' ? 'NEXUS OFFLINE' : 'SINCRONIZANDO';
  const connectionColor = syncState === 'connected' ? colors.success : syncState === 'offline' ? colors.danger : colors.accent;
  const viewportPadding = Math.max(18, Math.min(25, width * 0.06));
  const heroHeight = Math.min(640, Math.max(570, width * 1.38));
  const ranking = home.stats?.top3 ?? [];
  const domainPortals: Array<{ id: string; label: string; title: string; status: string; icon: IconName; route: HomeRoute; color: string }> = [
    { id: 'arena', label: 'ARENA', title: 'Cruza el umbral', status: activeEvent ? 'EVENTO ACTIVO' : 'OPONENTES EN ESPERA', icon: 'target', route: '/battle', color: colors.rarityRare },
    { id: 'forge', label: 'FORJA', title: 'Traza tu formación', status: `NIVEL ${formatNumber(progress?.level)} · MAZO ACTIVO`, icon: 'deck', route: '/deck', color: colors.rarityEpic },
    { id: 'archive', label: 'ARCHIVO', title: 'Revela tu colección', status: `${formatNumber(cardsTotal)} CARTAS REGISTRADAS`, icon: 'collection', route: '/collection', color: colors.rarityLegendary },
    { id: 'world', label: 'MUNDO', title: 'Lee la señal', status: activeEvent ? `CIERRA EN ${formatEventTime(activeEvent.ends_at)}` : 'SIN FRENTE PUBLICADO', icon: 'map', route: '/world', color: colors.rarityRare },
    { id: 'missions', label: 'MISIONES', title: 'Cumple el rito', status: `${formatNumber(home.missions.length)} ÓRDENES ACTIVAS`, icon: 'missions', route: '/missions', color: colors.success },
    { id: 'economy', label: 'ECONOMÍA', title: 'Mueve el VEX', status: `${formatNumber(wallet?.vex_ingame)} VEX DISPONIBLES`, icon: 'economy', route: '/economy', color: colors.accent },
  ];
  const domainSignals = Object.fromEntries(domainPortals.map((portal) => [portal.id, portal.status])) as Record<string, string>;
  const homeIdentity = DOMAIN_IDENTITY.foja;
  const orbitReveal = MOTION.reveal;
  const orbitDepth = DEPTH.surface;

  const navigate = (route: HomeRoute) => {
    void Haptics.selectionAsync().catch(() => undefined);
    if (route === '/') router.replace('/');
    else router.push(route);
  };
  const doRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([loadHome(), refresh()]);
    setRefreshing(false);
  };
  const openFeatured = () => {
    setFeaturedExpanded((expanded) => !expanded);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  return (
    <ScreenShell surface="home" sceneMode="shell">
      <View style={styles.root} testID="home-scene">
        <Animated.ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(112, insets.bottom + 100) }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
          showsVerticalScrollIndicator={false}
          accessibilityLabel="Inicio de Vexforge"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <View style={[styles.heroStage, { height: heroHeight }]}>
            <Animated.Image
              source={OFFICIAL_ASSETS.homeHero}
              style={[styles.heroArt, heroParallaxStyle]}
              resizeMode="cover"
              accessibilityLabel="Arte principal del Nexus"
              onLoad={() => setHeroAssetState('ready')}
              onError={() => setHeroAssetState('error')}
            />
            <LinearGradient colors={[`${colors.ink}08`, `${colors.ink}28`, `${colors.ink}BC`, colors.background]} locations={[0, 0.25, 0.56, 1]} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={[`${colors.rarityEpic}28`, 'transparent', `${colors.accent}1C`]} style={StyleSheet.absoluteFill} />
            <View pointerEvents="none" style={styles.heroRuleFrame}>
              <View style={[styles.heroCorner, styles.heroTopLeft, { borderColor: `${colors.accent}A8` }]} />
              <View style={[styles.heroCorner, styles.heroTopRight, { borderColor: `${colors.accent}66` }]} />
              <View style={[styles.heroCorner, styles.heroBottomLeft, { borderColor: `${colors.rarityEpic}66` }]} />
              <View style={[styles.heroCorner, styles.heroBottomRight, { borderColor: `${colors.rarityEpic}A8` }]} />
              <Text style={[styles.heroSceneCode, { color: `${colors.foreground}70` }]}>NEXUS / 01 · THRESHOLD</Text>
            </View>
            <Animated.Image
              source={OFFICIAL_ASSETS.homeSentinel}
              style={[styles.heroSentinel, sentinelParallaxStyle]}
              resizeMode="contain"
              accessibilityLabel="Guardián astral de la Forja"
              onLoad={() => setSentinelAssetState('ready')}
              onError={() => setSentinelAssetState('error')}
            />
            <Animated.View pointerEvents="none" style={[styles.heroOrbit, { borderColor: `${colors.rarityEpic}6A` }, orbitStyle]} />
            <Animated.View pointerEvents="none" style={[styles.heroCore, { backgroundColor: `${colors.rarityEpic}A8` }, pulseStyle]} />
            {heroAssetState === 'error' || sentinelAssetState === 'error' ? (
              <View pointerEvents="none" style={[styles.heroAssetError, { borderColor: `${colors.accent}80` }]}>
                <Text style={[styles.heroAssetErrorTitle, { color: colors.accent }]}>NEXUS CORE OFFLINE</Text>
                <Text style={[styles.heroAssetErrorBody, { color: `${colors.foreground}CC` }]}>El arte de la escena no está disponible.</Text>
              </View>
            ) : null}

            <View style={[styles.heroTopBar, { marginTop: Math.max(12, insets.top + 6), marginHorizontal: viewportPadding }]}>
              <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(MOTION.reveal + MOTION.micro)} style={styles.brandLockup}>
                <View style={[styles.brandSeal, { borderColor: `${colors.accent}C0`, backgroundColor: `${colors.ink}B8` }]}>
                  <Text style={[styles.brandSealText, { color: colors.accent }]}>V</Text>
                </View>
                <View>
                  <Text style={[styles.brandName, { color: colors.foreground }]}>VEXFORGE</Text>
                  <Text style={[styles.brandSubline, { color: `${colors.foreground}B8` }]}>NEXUS // RED DE DOMINIOS</Text>
                </View>
              </Animated.View>
              <View style={styles.topActions}>
                <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" testID="home-profile" onPress={() => navigate('/profile')} style={[styles.iconButton, { borderColor: `${colors.accent}80`, backgroundColor: `${colors.ink}B8` }]}>
                  <Icon name="user" color={colors.accent} size={17} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Abrir mensajes y misiones" testID="home-inbox" onPress={() => navigate('/missions')} style={[styles.iconButton, { borderColor: `${colors.accent}80`, backgroundColor: `${colors.ink}B8` }]}>
                  <Icon name="inbox" color={colors.foreground} size={17} />
                  {home.missions.length > 0 ? <View style={[styles.notificationDot, { backgroundColor: colors.accent }]} /> : null}
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Abrir ajustes" testID="home-settings" onPress={() => navigate('/meta')} style={[styles.iconButton, { borderColor: `${colors.accent}80`, backgroundColor: `${colors.ink}B8` }]}>
                  <Icon name="settings" color={colors.foreground} size={17} />
                </Pressable>
              </View>
            </View>

            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(MOTION.micro).duration(MOTION.navigation + MOTION.micro)} style={[styles.heroContent, { paddingHorizontal: viewportPadding }]}>
              <View style={[styles.heroReadingField, { borderLeftColor: `${colors.accent}B8` }]}>
                <View style={[styles.syncLine, { borderColor: `${connectionColor}90` }]} testID="home-sync">
                  <View style={[styles.syncPulse, { backgroundColor: connectionColor }]} />
                  <Text style={[styles.syncText, { color: connectionColor }]}>{connectionLabel}</Text>
                  <Text style={[styles.syncMeta, { color: `${colors.foreground}B0` }]}>{season?.name ?? 'SEASON 01 // FORGE OF LEGENDS'}</Text>
                </View>
                <View style={styles.heroEyebrowRow}>
                  <Text style={[styles.heroEyebrow, { color: colors.accent }]}>TEMPORADA ACTIVA</Text>
                  <View style={[styles.heroEyebrowRule, { backgroundColor: `${colors.accent}72` }]} />
                  <Text style={[styles.heroEyebrowMeta, { color: `${colors.foreground}B0` }]}>FRENTE VIVO</Text>
                </View>
                <Text style={[styles.heroHeadline, { color: colors.foreground, textShadowColor: `${colors.ink}B8` }]}>CRUZA{'\n'}EL UMBRAL</Text>
                <Text style={[styles.heroDescription, { color: `${colors.foreground}D0` }]}>Tu frente está vivo. Elige un dominio y forja la próxima victoria.</Text>
                <View style={styles.heroActions}>
                  <ThresholdButton label="ENTRAR A LA ARENA" icon="target" onPress={() => navigate('/battle')} testID="home-battle" />
                  <ThresholdButton label="CONTINUAR" icon="arrow-right" onPress={() => navigate('/tutorial')} testID="home-tutorial" secondary />
                </View>
                <View style={[styles.heroFooter, { borderTopColor: `${colors.foreground}2A` }]}>
                  <View style={styles.heroFooterItem}><Icon name="zap" color={colors.accent} size={13} /><Text style={[styles.heroFooterText, { color: `${colors.foreground}C0` }]}>{progress ? `${formatNumber(progress.energy)} / ${formatNumber(progress.max_energy)} ENERGÍA` : 'ENERGÍA EN ESPERA'}</Text></View>
                  <View style={styles.heroFooterItem}><Icon name="gem" color={colors.rarityEpic} size={13} /><Text style={[styles.heroFooterText, { color: `${colors.foreground}C0` }]}>{formatNumber(wallet?.vex_ingame)} VEX</Text></View>
                  <Pressable accessibilityRole="button" accessibilityLabel="Abrir mundo" testID="home-world" onPress={() => navigate('/world')} style={styles.heroWorldLink}>
                    <Icon name="globe" color={colors.rarityRare} size={13} /><Text style={[styles.heroWorldText, { color: colors.rarityRare }]}>MUNDO</Text><Icon name="arrow-up" color={colors.rarityRare} size={9} />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Inspeccionar carta destacada del Nexus"
              testID="home-featured-card"
              onPress={openFeatured}
              style={({ pressed }) => [styles.heroCardAnchor, { opacity: pressed ? 0.78 : 1 }]}
            >
              <View style={[styles.heroCardFrame, { borderColor: `${colors.rarityLegendary}CC`, backgroundColor: colors.ink }]}>
                <Image
                  source={OFFICIAL_ASSETS.homeFeatureCard}
                  style={styles.heroCardArt}
                  resizeMode="cover"
                  accessibilityLabel="Arte oficial de la carta destacada"
                  onLoad={() => setFeaturedAssetState('ready')}
                  onError={() => setFeaturedAssetState('error')}
                />
                <LinearGradient colors={['transparent', `${colors.ink}E8`]} style={StyleSheet.absoluteFill} />
                <View style={[styles.heroCardRarity, { borderColor: `${colors.rarityLegendary}A8`, backgroundColor: `${colors.ink}C8` }]}>
                  <Text style={[styles.heroCardRarityText, { color: colors.rarityLegendary }]}>{activeCard?.rarity?.toUpperCase() ?? 'SEÑAL PENDIENTE'}</Text>
                </View>
                {featuredAssetState === 'error' ? <View style={styles.heroCardAssetError}><Text style={[styles.heroCardAssetErrorText, { color: colors.accent }]}>ARTE OFFLINE</Text></View> : null}
                <Text style={[styles.heroCardCode, { color: `${colors.foreground}B8` }]}>{activeCard?.code ?? '—'}</Text>
              </View>
              <View style={styles.heroCardCopy}>
                <Text style={[styles.heroCardEyebrow, { color: colors.rarityLegendary }]}>RESONANCIA ACTIVA</Text>
                <Text numberOfLines={1} style={[styles.heroCardName, { color: colors.foreground }]}>{activeCard?.name ?? 'CARTA NO SINCRONIZADA'}</Text>
                {featuredExpanded && activeCard?.lore ? <Text numberOfLines={2} style={[styles.heroCardLore, { color: `${colors.foreground}B8` }]}>{activeCard.lore}</Text> : null}
              </View>
            </Pressable>
          </View>

          <View style={[styles.content, { paddingHorizontal: viewportPadding }]}>
            {homeState === 'error' || homeState === 'partial' ? (
              <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(MOTION.reveal)} style={[styles.errorBanner, { borderColor: `${colors.danger}80` }]} testID="home-retry">
                <Icon name="alert-triangle" color={colors.danger} size={18} />
                <View style={styles.errorCopy}>
                  <Text style={[styles.errorTitle, { color: colors.foreground }]}>{homeState === 'partial' ? 'SEÑAL INCOMPLETA' : 'SEÑAL INTERRUMPIDA'}</Text>
                  <Text style={[styles.errorBody, { color: colors.mutedForeground }]}>{homeState === 'partial' ? 'Algunas señales del Nexus no llegaron. Reintenta para completar la escena.' : syncError ?? 'No se pudo sincronizar la señal del Nexus.'}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Reintentar sincronización" onPress={doRefresh} style={[styles.retryButton, { borderColor: colors.danger }]}>
                  <Text style={[styles.retryText, { color: colors.danger }]}>REINTENTAR</Text>
                </Pressable>
              </Animated.View>
            ) : null}
            {homeState === 'loading' && !home.stats && !activeCard ? <LoadingTrace /> : null}

            <View style={styles.nexusWorldFinal}>
                <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(MOTION.micro).duration(MOTION.navigation)} style={styles.signalLedgerFinal}>
                  <View style={styles.signalIdentityFinal}>
                    <View style={[styles.signalCrestFinal, { borderColor: colors.accent }]}>
                      <View style={[styles.signalCrestInnerFinal, { borderColor: colors.accent }]}><Text style={[styles.signalCrestLetterFinal, { color: colors.accent }]}>{playerName.slice(0, 1).toUpperCase()}</Text></View>
                    </View>
                    <View style={styles.signalIdentityCopyFinal}>
                      <Text style={[styles.signalKickerFinal, { color: colors.accent }]}>IDENTIDAD DEL FORJADOR</Text>
                      <Text numberOfLines={1} style={[styles.signalPlayerNameFinal, { color: colors.foreground }]}>{playerName}</Text>
                      <Text style={[styles.signalPlayerMetaFinal, { color: colors.mutedForeground }]}>NIVEL {formatNumber(progress?.level)} · {connectionLabel}</Text>
                      <Text style={[styles.signalPlayerMetaFinal, { color: colors.mutedForeground }]}>{formatNumber(playerStats?.pvp_wins)} VICTORIAS · {formatNumber(wallet?.vex_ingame)} VEX</Text>
                    </View>
                  </View>
                  <View style={styles.signalProgressFinal}>
                    <View style={styles.signalProgressLineFinal}><Text style={[styles.signalKickerFinal, { color: colors.mutedForeground }]}>PROGRESIÓN</Text><Text style={[styles.signalProgressValueFinal, { color: colors.accent }]}>{formatNumber(xp)} / {formatNumber(xpToNext)}</Text></View>
                    <ProgressRail value={xp} total={xpToNext} color={colors.accent} background={colors.border} />
                  </View>
                </Animated.View>

                <View style={styles.frontStageFinal}>
                  <View style={styles.frontStageHeaderFinal}>
                    <View>
                      <Text style={[styles.frontStageEyebrowFinal, { color: colors.rarityRare }]}>{homeIdentity.place} / FRENTE VIVO</Text>
                      <Text style={[styles.frontStageTitleFinal, { color: colors.foreground }]}>La señal del Nexus</Text>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel="Abrir mundo" testID="home-world-front" onPress={() => navigate('/world')} style={styles.frontStageLinkFinal}>
                      <Icon name="map" color={colors.rarityRare} size={13} /><Text style={[styles.frontStageLinkTextFinal, { color: colors.rarityRare }]}>MUNDO</Text><Icon name="arrow-up" color={colors.rarityRare} size={10} />
                    </Pressable>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel="Abrir evento activo" testID="home-event" onPress={() => navigate('/world')} style={({ pressed }) => [styles.eventRibbonFinal, { borderColor: colors.rarityRare, opacity: pressed ? 0.76 : 1 }]}>
                    <View style={styles.eventBeaconFinal}>
                      <View style={[styles.eventOrbFinal, { borderColor: colors.rarityRare }]}><Animated.View style={[styles.eventOrbCoreFinal, { backgroundColor: colors.rarityRare }, pulseStyle]} /></View>
                      <View style={[styles.eventBeaconAxisFinal, { backgroundColor: colors.rarityRare }]} />
                    </View>
                    <View style={styles.eventCopyFinal}>
                      <Text style={[styles.eventTypeFinal, { color: colors.rarityRare }]}>{activeEvent?.type?.toUpperCase() ?? 'SEÑAL GLOBAL'}</Text>
                      <Text numberOfLines={2} style={[styles.eventTitleFinal, { color: colors.foreground }]}>{activeEvent?.name ?? 'El Nexus espera un nuevo frente'}</Text>
                      <Text style={[styles.eventMetaFinal, { color: colors.mutedForeground }]}>{activeEvent ? 'CIERRA EN ' + formatEventTime(activeEvent.ends_at) : 'No hay evento activo publicado'}</Text>
                    </View>
                    <View style={styles.eventProgressFinal}>
                      <Text style={[styles.eventProgressValueFinal, { color: colors.rarityRare }]}>{activeEvent ? Math.round(activeEvent.progress) + '%' : '—'}</Text>
                      <ProgressRail value={activeEvent?.progress ?? 0} total={100} color={colors.rarityRare} background={colors.border} />
                    </View>
                  </Pressable>

                  <Pressable accessibilityRole="button" accessibilityLabel="Inspeccionar carta destacada del Nexus" testID="home-featured-card-detail" onPress={openFeatured} style={({ pressed }) => [styles.artifactFeatureFinal, { opacity: pressed ? 0.78 : 1 }]}>
                    <View style={[styles.artifactFrameFinal, { borderColor: colors.rarityLegendary, backgroundColor: colors.ink }]}>
                      <Image source={OFFICIAL_ASSETS.homeFeatureCard} style={styles.artifactArtFinal} resizeMode="cover" accessibilityLabel="Arte oficial de la carta destacada" onLoad={() => setFeaturedAssetState('ready')} onError={() => setFeaturedAssetState('error')} />
                      <LinearGradient colors={['transparent', colors.ink]} style={StyleSheet.absoluteFill} />
                      <Text style={[styles.artifactRarityFinal, { color: colors.rarityLegendary }]}>{activeCard?.rarity?.toUpperCase() ?? 'SEÑAL PENDIENTE'}</Text>
                      <Text style={[styles.artifactCodeFinal, { color: colors.foreground }]}>{activeCard?.code ?? '—'}</Text>
                      {featuredAssetState === 'error' ? <View style={styles.featuredAssetError}><Text style={[styles.featuredAssetErrorText, { color: colors.accent }]}>ARTE OFFLINE</Text></View> : null}
                    </View>
                    <View style={styles.artifactCopyFinal}>
                      <Text style={[styles.artifactTagFinal, { color: colors.rarityLegendary }]}>CARTA DE RESONANCIA</Text>
                      <Text numberOfLines={2} style={[styles.artifactNameFinal, { color: colors.foreground }]}>{activeCard?.name ?? 'CARTA NO SINCRONIZADA'}</Text>
                      {featuredExpanded && activeCard?.lore ? <Text numberOfLines={3} style={[styles.artifactLoreFinal, { color: colors.mutedForeground }]}>{activeCard.lore}</Text> : null}
                      <Text style={[styles.artifactHintFinal, { color: colors.rarityLegendary }]}>TOCAR PARA INSPECCIONAR</Text>
                    </View>
                  </Pressable>
                </View>

                <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(orbitReveal)} style={styles.domainArchiveFinal} testID="home-domain-rail">
                  <View style={styles.domainArchiveHeaderFinal}>
                    <View>
                      <Text style={[styles.domainArchiveEyebrowFinal, { color: colors.rarityEpic }]}>DOMINIOS / 06 RUTAS</Text>
                      <Text style={[styles.domainArchiveTitleFinal, { color: colors.foreground }]}>Elige dónde forjar</Text>
                    </View>
                    <Animated.View style={[styles.domainArchiveCoreFinal, { borderColor: colors.accent }, pulseStyle]}><Icon name="resonance" color={colors.accent} size={13} /></Animated.View>
                  </View>
                  <View style={[styles.constellationFinal, { zIndex: orbitDepth }]} accessibilityLabel="Dominios conectados del Nexus">
                    <View pointerEvents="none" style={[styles.constellationAxisFinal, { backgroundColor: colors.rarityEpic }]} />
                    <View pointerEvents="none" style={[styles.constellationCoreFinal, { borderColor: colors.accent, backgroundColor: colors.ink }]}><Animated.View style={[styles.constellationCoreDot, { backgroundColor: colors.accent }, pulseStyle]} /></View>
                    {/* SceneOrbitPoint contract: signal={domainSignals.} is resolved from each live portal status. */}
                    <View style={styles.constellationGrid}>{domainPortals.map((portal) => <SceneOrbitPoint key={portal.id} portal={portal} signal={domainSignals[portal.id]} onPress={() => navigate(portal.route)} />)}</View>
                  </View>
                </Animated.View>

                <View style={styles.ritualDeckFinal}>
                  <View style={styles.ritualHeadingFinal}><View><Text style={[styles.ritualEyebrowFinal, { color: colors.success }]}>OPERACIONES / 02</Text><Text style={[styles.ritualTitleFinal, { color: colors.foreground }]}>El siguiente movimiento</Text></View><Icon name="shop" color={colors.success} size={18} /></View>
                  <View style={styles.operationRowFinal}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Abrir Forja" testID="home-forge" onPress={() => navigate('/deck')} style={({ pressed }) => [styles.operationLinkFinal, { borderColor: colors.rarityEpic, opacity: pressed ? 0.7 : 1 }]}>
                      <Icon name="deck" color={colors.rarityEpic} size={17} /><View style={styles.operationCopyFinal}><Text style={[styles.operationLabelFinal, { color: colors.rarityEpic }]}>FORJA</Text><Text style={[styles.operationTitleFinal, { color: colors.foreground }]}>Construye tu línea</Text></View><Icon name="arrow-up" color={colors.rarityEpic} size={12} />
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel="Abrir economía" testID="home-economy" onPress={() => navigate('/economy')} style={({ pressed }) => [styles.operationLinkFinal, { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}>
                      <Icon name="trending-up-outline" color={colors.accent} size={17} /><View style={styles.operationCopyFinal}><Text style={[styles.operationLabelFinal, { color: colors.accent }]}>ECONOMÍA</Text><Text style={[styles.operationTitleFinal, { color: colors.foreground }]}>Mueve el VEX</Text></View><Icon name="arrow-up" color={colors.accent} size={12} />
                    </Pressable>
                  </View>
                  <View style={styles.storeRitualFinal}>
                    <View style={styles.storeHeadingFinal}><View><Text style={[styles.operationLabelFinal, { color: colors.success }]}>CÁMARA DE FORJA</Text><Text style={[styles.storeTitleFinal, { color: colors.foreground }]}>Colección y recursos</Text></View><Icon name="packs" color={colors.success} size={17} /></View>
                    <View style={styles.storeActionsFinal}>
                      {[
                        ['PACKS', 'packs', '/store?mode=packs', 'home-store-packs'],
                        ['TIENDA', 'shop', '/store?mode=shop', 'home-store-shop'],
                        ['FUSIÓN', 'fusion', '/store?mode=fusion', 'home-store-fusion'],
                        ['EVOLUCIÓN', 'evolution', '/store?mode=evolution', 'home-store-evolution'],
                      ].map(([label, icon, route, testID]) => (
                        <Pressable key={testID} accessibilityRole="button" accessibilityLabel={label} testID={testID} onPress={() => navigate(route as HomeRoute)} style={({ pressed }) => [styles.storeActionFinal, { borderBottomColor: colors.success, opacity: pressed ? 0.66 : 1 }]}>
                          <Icon name={icon as IconName} color={colors.success} size={14} /><Text style={[styles.storeActionTextFinal, { color: colors.foreground }]}>{label}</Text><Icon name="arrow-up" color={colors.success} size={10} />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.signalColumnsFinal}>
                  <View style={styles.signalColumnFinal}>
                    <SectionMarker eyebrow={home.missions.length === 1 ? 'ORDEN ACTIVA' : 'ÓRDENES ACTIVAS'} title="El rito continúa" action="ABRIR" onAction={() => navigate('/missions')} accent={colors.success} />
                    {home.missions.length > 0 ? <View testID="home-missions" style={styles.missionList}>{home.missions.slice(0, 3).map((mission, index) => <MissionLine key={mission.id} mission={mission} index={index} onPress={() => navigate('/missions')} />)}</View> : <View style={[styles.emptyState, { borderColor: colors.border }]}><Icon name="compass" color={colors.mutedForeground} size={21} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>SIN FRENTE ACTIVO</Text><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Las próximas misiones aparecerán cuando el Nexus publique el siguiente ciclo.</Text></View>}
                  </View>
                  <View style={styles.signalColumnFinal}>
                    <SectionMarker eyebrow="PULSO PÚBLICO" title="Actividad" action="MUNDO" onAction={() => navigate('/world')} accent={colors.rarityRare} />
                    <View style={styles.activityRail}>{home.activity.length > 0 ? home.activity.slice(0, 3).map((item) => <View key={item.id} style={[styles.activityRow, { borderBottomColor: colors.border }]}><View style={[styles.activityDot, { backgroundColor: colors.success }]} /><View style={styles.activityText}><Text style={[styles.activityCopy, { color: colors.foreground }]}>{item.text}</Text><Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{new Date(item.time).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}</Text></View></View>) : <View style={styles.emptyActivity}><Icon name="radio" color={colors.mutedForeground} size={18} /><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>El pulso público se mostrará cuando exista actividad confirmada.</Text></View>}</View>
                  </View>
                </View>

                <View style={styles.rankingDeckFinal}>
                  <SectionMarker eyebrow="CIRCUITO ACTIVO" title="Clasificación del frente" action="ABRIR MUNDO" onAction={() => navigate('/world')} accent={colors.accent} />
                  <View style={styles.rankingRail}>{ranking.length > 0 ? ranking.map((entry, index) => <View key={entry.rank + '-' + entry.display_name} style={[styles.rankingRow, { borderBottomColor: colors.border }]}><Text style={[styles.rankPosition, { color: index === 0 ? colors.accent : colors.mutedForeground }]}>{String(entry.rank).padStart(2, '0')}</Text><View style={[styles.rankAvatar, { borderColor: index === 0 ? colors.accent : colors.border }]}><Text style={[styles.rankAvatarText, { color: index === 0 ? colors.accent : colors.mutedForeground }]}>{entry.display_name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.rankIdentity}><Text style={[styles.rankName, { color: colors.foreground }]}>{entry.display_name}</Text><Text style={[styles.rankMeta, { color: colors.mutedForeground }]}>{formatNumber(entry.wins)} VICTORIAS / {formatNumber(entry.mmr)} MMR</Text></View><Icon name={index === 0 ? 'award' : 'chevron-right'} color={index === 0 ? colors.accent : colors.mutedForeground} size={15} /></View>) : <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>El ranking de la temporada todavía no tiene posiciones publicadas.</Text>}</View>
                </View>
              </View>
          </View>
        </Animated.ScrollView>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { gap: 0 },
  heroStage: { overflow: 'hidden', position: 'relative' },
  heroArt: { height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' },
  heroSentinel: { bottom: -92, height: 590, position: 'absolute', right: -108, width: 580 },
  heroOrbit: { borderRadius: 210, borderWidth: 1, height: 420, position: 'absolute', right: -164, top: 118, width: 420 },
  heroCore: { borderRadius: 34, height: 68, opacity: 0.25, position: 'absolute', right: 112, top: 270, width: 68 },
  heroRuleFrame: { ...StyleSheet.absoluteFillObject, opacity: 0.84 },
  heroCorner: { height: 38, position: 'absolute', width: 38 },
  heroTopLeft: { borderLeftWidth: 1, borderTopWidth: 1, left: 15, top: 15 },
  heroTopRight: { borderRightWidth: 1, borderTopWidth: 1, right: 15, top: 15 },
  heroBottomLeft: { borderBottomWidth: 1, borderLeftWidth: 1, bottom: 18, left: 15 },
  heroBottomRight: { borderBottomWidth: 1, borderRightWidth: 1, bottom: 18, right: 15 },
  heroSceneCode: { bottom: 24, fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1.6, position: 'absolute', right: 23 },
  heroAssetError: { alignItems: 'center', borderWidth: 1, left: 24, paddingHorizontal: 10, paddingVertical: 7, position: 'absolute', right: 24, top: 184 },
  heroAssetErrorTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1.3 },
  heroAssetErrorBody: { fontFamily: 'Rajdhani_500Medium', fontSize: 10, marginTop: 2 },
  heroTopBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', left: 0, right: 0, top: 0, zIndex: 4 },
  brandLockup: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  brandSeal: { alignItems: 'center', borderRadius: 4, borderWidth: 1, height: 35, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 35 },
  brandSealText: { fontFamily: 'Cinzel_700Bold', fontSize: 19, letterSpacing: 1, transform: [{ rotate: '-45deg' }] },
  brandName: { fontFamily: 'Cinzel_700Bold', fontSize: 14, letterSpacing: 2.5 },
  brandSubline: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 1.5, marginTop: 2 },
  topActions: { flexDirection: 'row', gap: 7 },
  iconButton: { alignItems: 'center', borderRadius: 4, borderWidth: 1, height: 34, justifyContent: 'center', position: 'relative', width: 34 },
  notificationDot: { borderRadius: 3, height: 6, position: 'absolute', right: 7, top: 6, width: 6 },
  heroContent: { bottom: 0, left: 0, paddingBottom: 27, position: 'absolute', right: 0 },
  heroReadingField: { borderLeftWidth: 1, maxWidth: 258, paddingLeft: 14, paddingRight: 6, paddingTop: 8 },
  syncLine: { alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, flexDirection: 'row', gap: 7, paddingHorizontal: 8, paddingVertical: 4 },
  syncPulse: { borderRadius: 3, height: 6, width: 6 },
  syncText: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1.1 },
  syncMeta: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 0.55 },
  heroEyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 18 },
  heroEyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1.8 },
  heroEyebrowRule: { height: 1, width: 28 },
  heroEyebrowMeta: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.35 },
  heroHeadline: { fontFamily: 'Cinzel_700Bold', fontSize: 41, letterSpacing: 1.1, lineHeight: 45, marginTop: 8, textShadowOffset: { height: 2, width: 0 }, textShadowRadius: 12 },
  heroDescription: { fontFamily: 'Rajdhani_500Medium', fontSize: 15, lineHeight: 20, marginTop: 8, maxWidth: 290 },
  heroActions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 17 },
  primaryThreshold: { alignItems: 'center', borderRadius: 3, borderWidth: 1, flexDirection: 'row', gap: 8, minHeight: 53, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 8 },
  secondaryThreshold: { alignItems: 'center', borderRadius: 3, borderWidth: 1, flexDirection: 'row', gap: 8, minHeight: 53, paddingHorizontal: 10, paddingVertical: 8 },
  thresholdGlyph: { alignItems: 'center', borderWidth: 1, height: 33, justifyContent: 'center', width: 33 },
  thresholdCopy: { gap: 1 },
  thresholdLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 0.9 },
  thresholdMeta: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 8, letterSpacing: 0.8 },
  heroFooter: { borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 17, paddingTop: 12 },
  heroFooterItem: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  heroFooterText: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 10, letterSpacing: 0.55 },
  heroWorldLink: { alignItems: 'center', flexDirection: 'row', gap: 4, marginLeft: 'auto' },
  heroWorldText: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1 },
  heroCardAnchor: { alignItems: 'center', bottom: 88, position: 'absolute', right: 10, width: 122, zIndex: 5 },
  heroCardFrame: { borderWidth: 1, height: 164, overflow: 'hidden', position: 'relative', transform: [{ rotate: '3deg' }], width: 114 },
  heroCardArt: { height: '100%', width: '100%' },
  heroCardRarity: { borderWidth: 1, left: 6, paddingHorizontal: 4, paddingVertical: 2, position: 'absolute', top: 7 },
  heroCardRarityText: { fontFamily: 'Rajdhani_700Bold', fontSize: 7, letterSpacing: 0.8 },
  heroCardCode: { bottom: 7, fontFamily: 'Rajdhani_700Bold', fontSize: 7, left: 7, letterSpacing: 0.8, position: 'absolute' },
  heroCardAssetError: { alignItems: 'center', bottom: 28, left: 8, position: 'absolute', right: 8 },
  heroCardAssetErrorText: { fontFamily: 'Rajdhani_700Bold', fontSize: 7, letterSpacing: 0.7, textAlign: 'center' },
  heroCardCopy: { alignSelf: 'stretch', marginTop: 7, paddingLeft: 4 },
  heroCardEyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 7, letterSpacing: 1.05 },
  heroCardName: { fontFamily: 'Cinzel_600SemiBold', fontSize: 10, lineHeight: 13, marginTop: 2 },
  heroCardLore: { fontFamily: 'Rajdhani_500Medium', fontSize: 8, lineHeight: 10, marginTop: 3 },
  content: { gap: 0, paddingTop: 0 },
  nexusWorld: { marginTop: -12, overflow: 'visible', paddingHorizontal: 8, paddingTop: 11, position: 'relative' },
  worldHeader: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10 },
  worldHeaderCopy: { gap: 3 },
  worldHeaderRule: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  worldHeaderDiamond: { height: 5, transform: [{ rotate: '45deg' }], width: 5 },
  worldStage: { marginTop: 18, overflow: 'hidden', paddingBottom: 9, paddingHorizontal: 2, position: 'relative' },
  worldStageTrace: { borderWidth: 1, borderRadius: 80, height: 206, position: 'absolute', right: -78, top: -58, transform: [{ rotate: '-18deg' }], width: 252 },
  frontFocus: { alignItems: 'stretch', flexDirection: 'row', gap: 12, marginTop: 12 },
  eventRite: { alignItems: 'center', borderBottomWidth: 1, borderTopWidth: 1, flex: 1, flexDirection: 'row', gap: 8, minHeight: 154, paddingVertical: 12 },
  worldCard: { borderWidth: 1, height: 154, overflow: 'hidden', position: 'relative', transform: [{ rotate: '3deg' }], width: 104 },
  worldCardArt: { height: '100%', width: '100%' },
  worldCardRarity: { fontFamily: 'Rajdhani_700Bold', fontSize: 7, left: 5, letterSpacing: 0.7, position: 'absolute', top: 6 },
  worldCardName: { bottom: 20, fontFamily: 'Cinzel_600SemiBold', fontSize: 8, left: 5, lineHeight: 10, position: 'absolute', right: 5 },
  worldCardCode: { bottom: 5, fontFamily: 'Rajdhani_700Bold', fontSize: 7, left: 5, letterSpacing: 0.7, position: 'absolute' },
  constellationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'space-between', paddingTop: 5 },
  ritualDeck: { marginTop: 22, paddingBottom: 2, paddingTop: 2 },
  ritualSplit: { flexDirection: 'row', gap: 16, marginTop: 2 },
  ritualColumn: { flex: 1, minWidth: 0 },
  rankingDeck: { marginTop: 18, paddingTop: 2 },
  errorBanner: { alignItems: 'center', borderBottomWidth: 1, borderTopWidth: 1, flexDirection: 'row', gap: 10, marginBottom: 14, paddingVertical: 12 },
  errorCopy: { flex: 1, gap: 2 },
  errorTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 1 },
  errorBody: { fontFamily: 'Rajdhani_500Medium', fontSize: 11, lineHeight: 15 },
  retryButton: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 7 },
  retryText: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.8 },
  loadingTrace: { alignItems: 'center', borderBottomWidth: 1, borderTopWidth: 1, flexDirection: 'row', gap: 10, marginBottom: 2, paddingVertical: 12 },
  loadingTraceMark: { height: 6, transform: [{ rotate: '45deg' }], width: 6 },
  loadingTraceCopy: { flex: 1, gap: 6 },
  loadingTraceLine: { height: 5 },
  loadingTraceLineLong: { width: '72%' },
  loadingTraceLineShort: { width: '42%' },
  loadingTraceText: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1 },
  nexusBoard: { borderWidth: 1, marginTop: -12, paddingHorizontal: 12, paddingTop: 11, position: 'relative' },
  nexusBoardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  nexusBoardHeaderCopy: { gap: 2 },
  nexusBoardEyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1.5 },
  nexusBoardTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 14, letterSpacing: 0.2 },
  nexusBoardToken: { alignItems: 'center', borderWidth: 1, flexDirection: 'row', gap: 4, paddingHorizontal: 6, paddingVertical: 4 },
  nexusBoardTokenText: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 0.9 },
  playerLedger: { alignItems: 'center', borderBottomWidth: 1, borderTopWidth: 1, flexDirection: 'row', gap: 12, marginTop: 10, paddingVertical: 11 },
  playerIdentity: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  avatarSeal: { alignItems: 'center', borderRadius: 22, borderWidth: 1, height: 40, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 40 },
  avatarSealInner: { alignItems: 'center', borderWidth: 1, height: 29, justifyContent: 'center', transform: [{ rotate: '-45deg' }], width: 29 },
  avatarLetter: { fontFamily: 'Cinzel_700Bold', fontSize: 16 },
  playerCopy: { gap: 1 },
  playerName: { fontFamily: 'Rajdhani_700Bold', fontSize: 14, letterSpacing: 0.7 },
  playerMeta: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 0.9 },
  playerProgress: { flex: 1, gap: 7 },
  levelLine: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.9 },
  progressValue: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.4 },
  progressRail: { borderRadius: 4, height: 5, overflow: 'hidden', width: '100%' },
  progressFill: { borderRadius: 4, height: '100%' },
  constellationSection: { gap: 12, marginTop: 22 },
  sectionMarker: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 21 },
  sectionMarkerCopy: { flex: 1 },
  markerLine: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  markerDot: { height: 5, transform: [{ rotate: '45deg' }], width: 5 },
  eyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.8 },
  sectionTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 18, letterSpacing: 0.35, marginTop: 5 },
  markerAction: { alignItems: 'center', flexDirection: 'row', gap: 6, paddingBottom: 2, paddingLeft: 10 },
  markerActionText: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 0.55 },
  constellation: { minHeight: 200, paddingHorizontal: 0, paddingVertical: 4, position: 'relative' },
  constellationAxis: { bottom: 12, left: '50%', position: 'absolute', top: 12, width: 1 },
  constellationCore: { alignItems: 'center', borderRadius: 10, borderWidth: 1, height: 21, justifyContent: 'center', left: '50%', marginLeft: -10, position: 'absolute', top: '50%', width: 21, zIndex: 2 },
  constellationCoreDot: { borderRadius: 3, height: 6, width: 6 },
  constellationRow: { alignItems: 'center', flexDirection: 'row', minHeight: 45 },
  constellationRowReverse: { flexDirection: 'row-reverse' },
  constellationLink: { height: 1, marginHorizontal: 3, width: 12 },
  constellationSignal: { borderRadius: 3, height: 5, marginTop: -2, width: 5 },
  domainNode: { alignItems: 'center', flexDirection: 'row', gap: 7, minHeight: 78, paddingHorizontal: 3, width: '48%' },
  domainNodeStem: { height: 24, width: 1 },
  domainSigil: { alignItems: 'center', borderWidth: 1, height: 37, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 37 },
  domainNodeCopy: { flex: 1, gap: 2, minWidth: 0, transform: [{ translateX: -2 }] },
  domainLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1.2 },
  domainNodeTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 11.5, lineHeight: 15 },
  domainStatus: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 8, letterSpacing: 0.2 },
  signalBand: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8, paddingVertical: 12, rowGap: 13 },
  signalMetric: { alignItems: 'center', flexDirection: 'row', gap: 7, minWidth: '47%' },
  signalMetricCopy: { gap: 1 },
  signalValue: { fontFamily: 'Cinzel_700Bold', fontSize: 15 },
  signalLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1 },
  eventLine: { alignItems: 'center', borderBottomWidth: 1, borderTopWidth: 1, flexDirection: 'row', gap: 11, minHeight: 96, paddingVertical: 12 },
  eventBeacon: { alignItems: 'center', height: 54, justifyContent: 'center', width: 48 },
  eventOrb: { alignItems: 'center', borderRadius: 23, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  eventOrbCore: { borderRadius: 10, height: 20, width: 20 },
  eventBeaconAxis: { bottom: 0, height: 8, position: 'absolute', width: 1 },
  eventCopy: { flex: 1, gap: 3 },
  eventType: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.4 },
  eventTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 14, lineHeight: 18 },
  eventMeta: { fontFamily: 'Rajdhani_500Medium', fontSize: 10, letterSpacing: 0.6 },
  eventProgress: { alignItems: 'flex-end', gap: 6, width: 44 },
  eventProgressValue: { fontFamily: 'Rajdhani_700Bold', fontSize: 13 },
  frontBoard: { borderWidth: 1, marginTop: 20, paddingHorizontal: 12, paddingBottom: 11, paddingTop: 2 },
  ritualBoard: { borderWidth: 1, marginTop: 19, paddingHorizontal: 12, paddingTop: 2 },
  publicBoard: { borderWidth: 1, marginTop: 19, paddingHorizontal: 12, paddingBottom: 10, paddingTop: 2 },
  boardSectionTag: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 },
  boardSectionEyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1.55 },
  missionList: { marginTop: 4 },
  missionLine: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: 11, minHeight: 61, paddingVertical: 9 },
  missionIndex: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, width: 22 },
  missionLineCopy: { flex: 1, gap: 3 },
  missionName: { fontFamily: 'Rajdhani_700Bold', fontSize: 14, letterSpacing: 0.3 },
  missionMeta: { fontFamily: 'Rajdhani_500Medium', fontSize: 10, letterSpacing: 0.45 },
  emptyState: { alignItems: 'center', borderBottomWidth: 1, borderTopWidth: 1, gap: 8, marginTop: 5, paddingHorizontal: 20, paddingVertical: 23 },
  emptyTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 12, letterSpacing: 1.2 },
  emptyBody: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, lineHeight: 17, textAlign: 'center' },
  artifactFeature: { alignItems: 'center', flexDirection: 'row', gap: 15, minHeight: 188, overflow: 'hidden', paddingVertical: 11 },
  artifactFrame: { borderWidth: 1, height: 176, overflow: 'hidden', position: 'relative', transform: [{ rotate: '-2deg' }], width: 124 },
  artifactArt: { height: '100%', width: '100%' },
  artifactFrameCode: { bottom: 7, fontFamily: 'Rajdhani_700Bold', fontSize: 8, left: 8, letterSpacing: 1, position: 'absolute' },
  artifactCopy: { flex: 1, justifyContent: 'center', minWidth: 0, paddingVertical: 6 },
  featuredTagLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  featuredTag: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1.2 },
  featuredCode: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 0.8 },
  featuredName: { fontFamily: 'Cinzel_600SemiBold', fontSize: 18, lineHeight: 23, marginTop: 11 },
  featuredFaction: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 10, letterSpacing: 0.5, marginTop: 5 },
  featuredLore: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, lineHeight: 16, marginTop: 10 },
  featuredHint: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.1, marginTop: 17 },
  featuredAssetError: { alignItems: 'center', bottom: 8, left: 7, paddingHorizontal: 5, paddingVertical: 6, position: 'absolute', right: 7 },
  featuredAssetErrorText: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 0.7, marginTop: 3, textAlign: 'center' },
  operationRow: { flexDirection: 'row', gap: 12, marginTop: 9 },
  operationLink: { alignItems: 'center', borderBottomWidth: 1, borderTopWidth: 1, flex: 1, flexDirection: 'row', gap: 8, minHeight: 64, paddingHorizontal: 3 },
  operationLinkText: { flex: 1 },
  operationLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.2 },
  operationTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 12, lineHeight: 16, marginTop: 3 },
  storeRitual: { borderBottomWidth: 1, borderTopWidth: 1, marginTop: 20, paddingVertical: 14 },
  storeHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  storeTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 15, marginTop: 4 },
  storeActions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  storeAction: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: 5, minHeight: 34, marginRight: 14 },
  storeActionText: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.8 },
  activityRail: { paddingTop: 3 },
  activityRow: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: 10, minHeight: 58, paddingVertical: 10 },
  activityDot: { borderRadius: 3, height: 6, width: 6 },
  activityText: { flex: 1, gap: 3 },
  activityCopy: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, lineHeight: 16 },
  activityTime: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.8 },
  emptyActivity: { alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingVertical: 20 },
  rankingRail: { paddingTop: 3 },
  rankingRow: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: 9, minHeight: 55, paddingVertical: 10 },
  rankPosition: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, width: 21 },
  rankAvatar: { alignItems: 'center', borderRadius: 15, borderWidth: 1, height: 30, justifyContent: 'center', width: 30 },
  rankAvatarText: { fontFamily: 'Cinzel_700Bold', fontSize: 12 },
  rankIdentity: { flex: 1, gap: 2 },
  rankName: { fontFamily: 'Rajdhani_700Bold', fontSize: 13, letterSpacing: 0.3 },
  rankMeta: { fontFamily: 'Rajdhani_500Medium', fontSize: 9, letterSpacing: 0.65 },

    nexusWorldFinal: { marginTop: -14, paddingHorizontal: 8, paddingTop: 16 },
    signalLedgerFinal: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: 12, paddingBottom: 14 },
    signalIdentityFinal: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10, minWidth: 0 },
    signalCrestFinal: { alignItems: 'center', borderWidth: 1, height: 39, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 39 },
    signalCrestInnerFinal: { alignItems: 'center', borderWidth: 1, height: 28, justifyContent: 'center', transform: [{ rotate: '-45deg' }], width: 28 },
    signalCrestLetterFinal: { fontFamily: 'Cinzel_700Bold', fontSize: 15 },
    signalIdentityCopyFinal: { flex: 1, gap: 2, minWidth: 0 },
    signalKickerFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1.1 },
    signalPlayerNameFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 14 },
    signalPlayerMetaFinal: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 0.6 },
    signalProgressFinal: { flex: 0.9, gap: 7 },
    signalProgressLineFinal: { flexDirection: 'row', justifyContent: 'space-between' },
    signalProgressValueFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9 },
    frontStageFinal: { marginTop: 25 },
    frontStageHeaderFinal: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11 },
    frontStageEyebrowFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.7 },
    frontStageTitleFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 20, marginTop: 4 },
    frontStageLinkFinal: { alignItems: 'center', flexDirection: 'row', gap: 4, paddingBottom: 2 },
    frontStageLinkTextFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 0.8 },
    eventRibbonFinal: { alignItems: 'center', borderBottomWidth: 1, borderTopWidth: 1, flexDirection: 'row', gap: 9, minHeight: 126, paddingVertical: 12 },
    eventBeaconFinal: { alignItems: 'center', height: 58, justifyContent: 'center', width: 43 },
    eventOrbFinal: { alignItems: 'center', borderRadius: 23, borderWidth: 1, height: 43, justifyContent: 'center', width: 43 },
    eventOrbCoreFinal: { borderRadius: 10, height: 19, width: 19 },
    eventBeaconAxisFinal: { bottom: 0, height: 9, position: 'absolute', width: 1 },
    eventCopyFinal: { flex: 1, gap: 3, minWidth: 0 },
    eventTypeFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.35 },
    eventTitleFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 14, lineHeight: 18 },
    eventMetaFinal: { fontFamily: 'Rajdhani_500Medium', fontSize: 10, letterSpacing: 0.45 },
    eventProgressFinal: { alignItems: 'flex-end', gap: 6, width: 42 },
    eventProgressValueFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 13 },
    artifactFeatureFinal: { alignItems: 'center', flexDirection: 'row', gap: 14, minHeight: 204, paddingVertical: 15 },
    artifactFrameFinal: { borderWidth: 1, height: 190, overflow: 'hidden', position: 'relative', transform: [{ rotate: '-2deg' }], width: 130 },
    artifactArtFinal: { height: '100%', width: '100%' },
    artifactRarityFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, left: 7, letterSpacing: 0.8, position: 'absolute', top: 7 },
    artifactCodeFinal: { bottom: 7, fontFamily: 'Rajdhani_700Bold', fontSize: 8, left: 8, letterSpacing: 0.9, position: 'absolute' },
    artifactCopyFinal: { flex: 1, justifyContent: 'center', minWidth: 0, paddingVertical: 7 },
    artifactTagFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.1 },
    artifactNameFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 18, lineHeight: 23, marginTop: 9 },
    artifactLoreFinal: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, lineHeight: 16, marginTop: 9 },
    artifactHintFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1, marginTop: 16 },
    domainArchiveFinal: { marginTop: 24 },
    domainArchiveHeaderFinal: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    domainArchiveEyebrowFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.55 },
    domainArchiveTitleFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 19, marginTop: 4 },
    domainArchiveCoreFinal: { alignItems: 'center', borderWidth: 1, height: 28, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 28 },
    constellationFinal: { minHeight: 190, paddingVertical: 8, position: 'relative' },
    constellationAxisFinal: { bottom: 12, left: '50%', opacity: 0.48, position: 'absolute', top: 12, width: 1 },
    constellationCoreFinal: { alignItems: 'center', borderWidth: 1, height: 22, justifyContent: 'center', left: '50%', marginLeft: -11, position: 'absolute', top: '50%', transform: [{ rotate: '45deg' }], width: 22, zIndex: 2 },
    ritualDeckFinal: { borderBottomWidth: 1, borderTopWidth: 1, marginTop: 24, paddingBottom: 12, paddingTop: 13 },
    ritualHeadingFinal: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    ritualEyebrowFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.45 },
    ritualTitleFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 17, marginTop: 4 },
    operationRowFinal: { flexDirection: 'row', gap: 13, marginTop: 13 },
    operationLinkFinal: { alignItems: 'center', borderBottomWidth: 1, borderTopWidth: 1, flex: 1, flexDirection: 'row', gap: 8, minHeight: 61, paddingHorizontal: 2 },
    operationCopyFinal: { flex: 1, minWidth: 0 },
    operationLabelFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.15 },
    operationTitleFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 12, lineHeight: 16, marginTop: 3 },
    storeRitualFinal: { borderTopWidth: 1, marginTop: 18, paddingTop: 13 },
    storeHeadingFinal: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    storeTitleFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 15, marginTop: 4 },
    storeActionsFinal: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    storeActionFinal: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: 5, minHeight: 34, marginRight: 14 },
    storeActionTextFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.8 },
    signalColumnsFinal: { flexDirection: 'row', gap: 18, marginTop: 7 },
    signalColumnFinal: { flex: 1, minWidth: 0 },
    rankingDeckFinal: { marginTop: 17, paddingBottom: 16 },
    
});