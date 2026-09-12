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
  onPress,
}: {
  portal: { id: string; label: string; title: string; status: string; icon: IconName; route: HomeRoute; color: string };
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir dominio ${portal.label}`}
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
      testID="home-missions"
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
    setHomeState((current) => (current === 'ready' ? 'loading' : current));
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
    pulse.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, true);
    orbit.value = withRepeat(withTiming(1, { duration: 9200, easing: Easing.linear }), -1, false);
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
              <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(420)} style={styles.brandLockup}>
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

            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(90).duration(600)} style={[styles.heroContent, { paddingHorizontal: viewportPadding }]}>
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
                  <Text style={[styles.heroCardRarityText, { color: colors.rarityLegendary }]}>{activeCard?.rarity?.toUpperCase() ?? 'LEGENDARY'}</Text>
                </View>
                {featuredAssetState === 'error' ? <View style={styles.heroCardAssetError}><Text style={[styles.heroCardAssetErrorText, { color: colors.accent }]}>ARTE OFFLINE</Text></View> : null}
                <Text style={[styles.heroCardCode, { color: `${colors.foreground}B8` }]}>{activeCard?.code ?? 'VEX-0017'}</Text>
              </View>
              <View style={styles.heroCardCopy}>
                <Text style={[styles.heroCardEyebrow, { color: colors.rarityLegendary }]}>RESONANCIA ACTIVA</Text>
                <Text numberOfLines={1} style={[styles.heroCardName, { color: colors.foreground }]}>{activeCard?.name ?? 'Bastión de Hierro'}</Text>
                {featuredExpanded ? <Text numberOfLines={2} style={[styles.heroCardLore, { color: `${colors.foreground}B8` }]}>{activeCard?.lore ?? 'La resonancia todavía no ha sido registrada.'}</Text> : null}
              </View>
            </Pressable>
          </View>

          <View style={[styles.content, { paddingHorizontal: viewportPadding }]}>
            {homeState === 'error' ? (
              <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(350)} style={[styles.errorBanner, { borderColor: `${colors.danger}80` }]} testID="home-retry">
                <Icon name="alert-triangle" color={colors.danger} size={18} />
                <View style={styles.errorCopy}>
                  <Text style={[styles.errorTitle, { color: colors.foreground }]}>SEÑAL INTERRUMPIDA</Text>
                  <Text style={[styles.errorBody, { color: colors.mutedForeground }]}>{syncError ?? 'No se pudo sincronizar la señal del Nexus.'}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Reintentar sincronización" onPress={doRefresh} style={[styles.retryButton, { borderColor: colors.danger }]}>
                  <Text style={[styles.retryText, { color: colors.danger }]}>REINTENTAR</Text>
                </Pressable>
              </Animated.View>
            ) : null}
            {homeState === 'loading' && !home.stats && !activeCard ? <LoadingTrace /> : null}

            <View style={[styles.nexusBoard, { borderColor: `${colors.rarityEpic}70`, backgroundColor: `${colors.ink}52` }]}>
              <View style={styles.nexusBoardHeader}>
                <View style={styles.nexusBoardHeaderCopy}>
                  <Text style={[styles.nexusBoardEyebrow, { color: colors.rarityEpic }]}>NEXUS TABLE / LIVE</Text>
                  <Text style={[styles.nexusBoardTitle, { color: colors.foreground }]}>Tu frente de forja</Text>
                </View>
                <View style={[styles.nexusBoardToken, { borderColor: `${colors.accent}88` }]}>
                  <Icon name="target" color={colors.accent} size={12} />
                  <Text style={[styles.nexusBoardTokenText, { color: colors.accent }]}>CORE</Text>
                </View>
              </View>
              <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(150).duration(560)} style={[styles.playerLedger, { borderTopColor: `${colors.accent}80`, borderBottomColor: `${colors.border}88` }]}>
                <View style={styles.playerIdentity}>
                  <View style={[styles.avatarSeal, { borderColor: colors.accent, backgroundColor: `${colors.accent}10` }]}>
                    <View style={[styles.avatarSealInner, { borderColor: `${colors.accent}72` }]}><Text style={[styles.avatarLetter, { color: colors.accent }]}>{playerName.slice(0, 1).toUpperCase()}</Text></View>
                  </View>
                  <View style={styles.playerCopy}>
                    <Text style={[styles.playerName, { color: colors.foreground }]}>{playerName}</Text>
                    <Text style={[styles.playerMeta, { color: colors.mutedForeground }]}>NIVEL {formatNumber(progress?.level)} / FORJADOR</Text>
                  </View>
                </View>
                <View style={styles.playerProgress}>
                  <View style={styles.levelLine}><Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>RANGO DE FORJA</Text><Text style={[styles.progressValue, { color: colors.accent }]}>{formatNumber(xp)} / {formatNumber(xpToNext)} XP</Text></View>
                  <ProgressRail value={xp} total={xpToNext} color={colors.accent} background={`${colors.accent}24`} />
                </View>
              </Animated.View>

              <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(220).duration(560)} style={styles.constellationSection} testID="home-domain-rail">
                <SectionMarker eyebrow="CONSTELACIÓN DEL NEXUS" title="Elige dónde forjar" accent={colors.rarityRare} />
                <View style={styles.constellation} accessibilityLabel="Dominios conectados del Nexus">
                  <View pointerEvents="none" style={[styles.constellationAxis, { backgroundColor: `${colors.rarityEpic}42` }]} />
                  <View pointerEvents="none" style={[styles.constellationCore, { borderColor: `${colors.accent}9A`, backgroundColor: `${colors.accent}18` }]}>
                    <Animated.View style={[styles.constellationCoreDot, { backgroundColor: colors.accent }, pulseStyle]} />
                  </View>
                  {domainPortals.map((portal, index) => (
                    <View key={portal.id} style={[styles.constellationRow, index % 2 === 1 && styles.constellationRowReverse]}>
                      <DomainNode portal={portal} onPress={() => navigate(portal.route)} />
                      <View pointerEvents="none" style={[styles.constellationLink, { backgroundColor: `${portal.color}66` }]}>
                        <Animated.View style={[styles.constellationSignal, { backgroundColor: portal.color }, pulseStyle]} />
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>

              <View style={[styles.signalBand, { borderTopColor: `${colors.border}88`, borderBottomColor: `${colors.border}88` }]}>
                <SignalMetric label="CARTAS" value={formatNumber(playerStats?.cards_owned ?? cardsTotal)} icon="layers" color={colors.rarityRare} />
                <SignalMetric label="VICTORIAS" value={formatNumber(playerStats?.pvp_wins)} icon="award" color={colors.accent} />
                <SignalMetric label="BATALLAS" value={formatNumber(home.stats?.total_battles)} icon="activity" color={colors.rarityEpic} />
                <SignalMetric label="PACKS" value={formatNumber(home.stats?.packs_opened)} icon="packs" color={colors.success} />
              </View>
            </View>

            <View style={[styles.frontBoard, { borderColor: `${colors.rarityRare}66`, backgroundColor: `${colors.ink}3D` }]}>
              <View style={styles.boardSectionTag}>
                <Text style={[styles.boardSectionEyebrow, { color: colors.rarityRare }]}>LIVE FRONT / 01</Text>
                <Icon name="globe" color={colors.rarityRare} size={14} />
              </View>
              <SectionMarker eyebrow="SEÑAL DEL NEXUS" title="El frente de hoy" action="ABRIR MUNDO" onAction={() => navigate('/world')} accent={colors.rarityRare} />
              <Pressable accessibilityRole="button" accessibilityLabel="Abrir evento activo" testID="home-event" onPress={() => navigate('/world')} style={({ pressed }) => [styles.eventLine, { borderColor: `${colors.rarityRare}72`, opacity: pressed ? 0.76 : 1 }]}>
                <View style={styles.eventBeacon}>
                  <View style={[styles.eventOrb, { borderColor: `${colors.rarityRare}80` }]}><Animated.View style={[styles.eventOrbCore, { backgroundColor: colors.rarityRare }, pulseStyle]} /></View>
                  <View style={[styles.eventBeaconAxis, { backgroundColor: `${colors.rarityRare}60` }]} />
                </View>
                <View style={styles.eventCopy}><Text style={[styles.eventType, { color: colors.rarityRare }]}>{activeEvent?.type?.toUpperCase() ?? 'SEÑAL GLOBAL'}</Text><Text style={[styles.eventTitle, { color: colors.foreground }]}>{activeEvent?.name ?? 'El Nexus espera un nuevo frente'}</Text><Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>{activeEvent ? `CIERRA EN ${formatEventTime(activeEvent.ends_at)}` : 'No hay evento activo publicado'}</Text></View>
                <View style={styles.eventProgress}><Text style={[styles.eventProgressValue, { color: colors.rarityRare }]}>{activeEvent ? `${Math.round(activeEvent.progress)}%` : '—'}</Text><ProgressRail value={activeEvent?.progress ?? 0} total={100} color={colors.rarityRare} background={`${colors.rarityRare}20`} /><Icon name="arrow-up" color={colors.rarityRare} size={14} /></View>
              </Pressable>

              <SectionMarker eyebrow={home.missions.length === 1 ? 'ORDEN ACTIVA' : 'ÓRDENES ACTIVAS'} title="El rito continúa" action="ABRIR MISIONES" onAction={() => navigate('/missions')} />
              {home.missions.length > 0 ? (
                <View style={styles.missionList}>{home.missions.slice(0, 3).map((mission, index) => <MissionLine key={mission.id} mission={mission} index={index} onPress={() => navigate('/missions')} />)}</View>
              ) : (
                <View style={[styles.emptyState, { borderColor: `${colors.border}88` }]}><Icon name="compass" color={colors.mutedForeground} size={21} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>SIN FRENTE ACTIVO</Text><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Las próximas misiones aparecerán cuando el Nexus publique el siguiente ciclo.</Text></View>
              )}
            </View>

            <View style={[styles.ritualBoard, { borderColor: `${colors.success}62`, backgroundColor: `${colors.ink}32` }]}>
              <View style={styles.boardSectionTag}>
                <Text style={[styles.boardSectionEyebrow, { color: colors.success }]}>RITUALS / 02</Text>
                <Icon name="shop" color={colors.success} size={14} />
              </View>
              <View style={styles.operationRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Abrir Forja" testID="home-forge" onPress={() => navigate('/deck')} style={({ pressed }) => [styles.operationLink, { borderColor: `${colors.rarityEpic}72`, opacity: pressed ? 0.7 : 1 }]}>
                <Icon name="deck" color={colors.rarityEpic} size={17} />
                <View><Text style={[styles.operationLabel, { color: colors.rarityEpic }]}>FORJA</Text><Text style={[styles.operationTitle, { color: colors.foreground }]}>Construye tu línea</Text></View>
                <Icon name="arrow-up" color={colors.rarityEpic} size={12} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Abrir economía" testID="home-economy" onPress={() => navigate('/economy')} style={({ pressed }) => [styles.operationLink, { borderColor: `${colors.accent}72`, opacity: pressed ? 0.7 : 1 }]}>
                <Icon name="trending-up-outline" color={colors.accent} size={17} />
                <View><Text style={[styles.operationLabel, { color: colors.accent }]}>ECONOMÍA</Text><Text style={[styles.operationTitle, { color: colors.foreground }]}>Mueve el VEX</Text></View>
                <Icon name="arrow-up" color={colors.accent} size={12} />
              </Pressable>
            </View>

            <View style={[styles.storeRitual, { borderTopColor: `${colors.success}88`, borderBottomColor: `${colors.border}88` }]}>
              <View style={styles.storeHeading}><View><Text style={[styles.operationLabel, { color: colors.success }]}>CÁMARA DE FORJA</Text><Text style={[styles.storeTitle, { color: colors.foreground }]}>Elige tu siguiente operación</Text></View><Icon name="shop" color={colors.success} size={19} /></View>
              <View style={styles.storeActions}>
                {[
                  ['PACKS', 'packs', '/store?mode=packs', 'home-store-packs'],
                  ['TIENDA', 'shop', '/store?mode=shop', 'home-store-shop'],
                  ['FUSIÓN', 'fusion', '/store?mode=fusion', 'home-store-fusion'],
                  ['EVOLUCIÓN', 'evolution', '/store?mode=evolution', 'home-store-evolution'],
                ].map(([label, icon, route, testID]) => (
                  <Pressable key={testID} accessibilityRole="button" accessibilityLabel={label} testID={testID} onPress={() => navigate(route as HomeRoute)} style={({ pressed }) => [styles.storeAction, { borderBottomColor: `${colors.success}66`, opacity: pressed ? 0.66 : 1 }]}>
                    <Icon name={icon as IconName} color={colors.success} size={14} /><Text style={[styles.storeActionText, { color: colors.foreground }]}>{label}</Text><Icon name="arrow-up" color={colors.success} size={10} />
                  </Pressable>
                ))}
              </View>
            </View>

            </View>

            <View style={[styles.publicBoard, { borderColor: `${colors.accent}5C`, backgroundColor: `${colors.ink}2C` }]}>
              <View style={styles.boardSectionTag}>
                <Text style={[styles.boardSectionEyebrow, { color: colors.accent }]}>PUBLIC SIGNAL / 03</Text>
                <Icon name="radio" color={colors.accent} size={14} />
              </View>
              <SectionMarker eyebrow="PULSO PÚBLICO" title="Actividad del Nexus" action="VER CLASIFICACIÓN" onAction={() => navigate('/world')} />
              <View style={styles.activityRail}>
                {home.activity.length > 0 ? home.activity.slice(0, 3).map((item) => (
                  <View key={item.id} style={[styles.activityRow, { borderBottomColor: `${colors.border}66` }]}>
                    <View style={[styles.activityDot, { backgroundColor: colors.success }]} />
                    <View style={styles.activityText}><Text style={[styles.activityCopy, { color: colors.foreground }]}>{item.text}</Text><Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{new Date(item.time).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}</Text></View>
                  </View>
                )) : <View style={styles.emptyActivity}><Icon name="radio" color={colors.mutedForeground} size={18} /><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>El pulso público se mostrará cuando exista actividad confirmada.</Text></View>}
              </View>

              <SectionMarker eyebrow="CIRCUITO ACTIVO" title="Clasificación del frente" action="ABRIR MUNDO" onAction={() => navigate('/world')} />
              <View style={styles.rankingRail}>
                {ranking.length > 0 ? ranking.map((entry, index) => (
                  <View key={`${entry.rank}-${entry.display_name}`} style={[styles.rankingRow, { borderBottomColor: `${colors.border}66` }]}>
                    <Text style={[styles.rankPosition, { color: index === 0 ? colors.accent : colors.mutedForeground }]}>{String(entry.rank).padStart(2, '0')}</Text>
                    <View style={[styles.rankAvatar, { borderColor: `${index === 0 ? colors.accent : colors.border}99` }]}><Text style={[styles.rankAvatarText, { color: index === 0 ? colors.accent : colors.mutedForeground }]}>{entry.display_name.slice(0, 1).toUpperCase()}</Text></View>
                    <View style={styles.rankIdentity}><Text style={[styles.rankName, { color: colors.foreground }]}>{entry.display_name}</Text><Text style={[styles.rankMeta, { color: colors.mutedForeground }]}>{formatNumber(entry.wins)} VICTORIAS / {formatNumber(entry.mmr)} MMR</Text></View>
                    <Icon name={index === 0 ? 'award' : 'chevron-right'} color={index === 0 ? colors.accent : colors.mutedForeground} size={15} />
                  </View>
                )) : <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>El ranking de la temporada todavía no tiene posiciones publicadas.</Text>}
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
  heroCardAnchor: { alignItems: 'center', bottom: 92, position: 'absolute', right: 14, width: 112, zIndex: 5 },
  heroCardFrame: { borderWidth: 1, height: 142, overflow: 'hidden', position: 'relative', transform: [{ rotate: '3deg' }], width: 98 },
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
  constellation: { gap: 4, minHeight: 289, paddingVertical: 4, position: 'relative' },
  constellationAxis: { bottom: 12, left: '50%', position: 'absolute', top: 12, width: 1 },
  constellationCore: { alignItems: 'center', borderRadius: 10, borderWidth: 1, height: 21, justifyContent: 'center', left: '50%', marginLeft: -10, position: 'absolute', top: '50%', width: 21, zIndex: 2 },
  constellationCoreDot: { borderRadius: 3, height: 6, width: 6 },
  constellationRow: { alignItems: 'center', flexDirection: 'row', minHeight: 45 },
  constellationRowReverse: { flexDirection: 'row-reverse' },
  constellationLink: { height: 1, marginHorizontal: 3, width: 12 },
  constellationSignal: { borderRadius: 3, height: 5, marginTop: -2, width: 5 },
  domainNode: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 8, minHeight: 84, paddingHorizontal: 3 },
  domainNodeStem: { height: 24, width: 1 },
  domainSigil: { alignItems: 'center', borderWidth: 1, height: 37, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 37 },
  domainNodeCopy: { flex: 1, gap: 2, minWidth: 0, transform: [{ translateX: -2 }] },
  domainLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1.2 },
  domainNodeTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 11.5, lineHeight: 15 },
  domainStatus: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 8, letterSpacing: 0.2 },
  signalBand: { borderBottomWidth: 1, borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 13, paddingVertical: 14, rowGap: 13 },
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
});