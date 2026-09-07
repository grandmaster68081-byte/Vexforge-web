import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import {
  loadDailyFeaturedCard,
  loadHomeMissions,
  loadHomeStats,
  loadRecentActivity,
  TUTORIAL_DONE_STEP,
  TUTORIAL_TOTAL_STEPS,
  type ActivityItem,
  type DailyCard,
  type HomeMission,
  type HomeStats,
} from '@/lib/supabase';
import { Ionicons } from '@/components/ForgeIcon';
import { ForgeMark } from '@/components/ForgeMark';
import { ForgeText } from '@/components/ForgeText';
import { ProgressBar } from '@/components/ProgressBar';
import { ScreenShell } from '@/components/ScreenShell';
import { CANONICAL_BACKGROUNDS, FACTION_BACKGROUNDS, OFFICIAL_ASSETS } from '@/constants/visual';
import { DEPTH, MOTION } from '@/constants/experience';
import { typography } from '@/constants/typography';

type HomeSnapshot = {
  stats: HomeStats | null;
  dailyCard: DailyCard | null;
  missions: HomeMission[];
  activity: ActivityItem[];
};

type HomeRoute = '/' | '/battle' | '/collection' | '/deck' | '/world' | '/missions' | '/tutorial' | '/profile';
type ToneName = 'accent' | 'primary' | 'success' | 'danger' | 'rarityEpic' | 'rarityRare';

const PARTICLES = [
  { left: '11%', top: '31%', size: 3, delay: 0, drift: 1.9 },
  { left: '27%', top: '23%', size: 2, delay: MOTION.micro * 4, drift: 2.25 },
  { left: '74%', top: '28%', size: 3, delay: MOTION.reveal * 4, drift: 2.1 },
  { left: '89%', top: '40%', size: 2, delay: MOTION.micro * 2, drift: 2.5 },
  { left: '17%', top: '58%', size: 2, delay: MOTION.navigation * 2, drift: 2.2 },
  { left: '83%', top: '61%', size: 3, delay: MOTION.reveal * 6, drift: 2.05 },
  { left: '36%', top: '76%', size: 2, delay: MOTION.micro * 3, drift: 2.35 },
  { left: '68%', top: '79%', size: 2, delay: MOTION.navigation * 3, drift: 2 },
] as const;

const HOTSPOTS: Array<{
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  route: HomeRoute;
  tone: ToneName;
  position: 'forge' | 'arena' | 'archive' | 'deck';
}> = [
  { key: 'foja', title: 'Foja', subtitle: 'EL MUNDO TE ESPERA', icon: 'home', route: '/', tone: 'accent', position: 'forge' },
  { key: 'arena', title: 'Arena', subtitle: 'DESAFÍA A OTROS FORJADORES', icon: 'arena', route: '/battle', tone: 'danger', position: 'arena' },
  { key: 'archive', title: 'Archivo', subtitle: 'COLECCIONA · DESCUBRE · EVOLUCIONA', icon: 'collection', route: '/collection', tone: 'rarityEpic', position: 'archive' },
  { key: 'deck', title: 'Forja', subtitle: 'CONSTRUYE TU LEYENDA', icon: 'deck', route: '/deck', tone: 'primary', position: 'deck' },
];

function countdown(iso: string) {
  const remaining = new Date(iso).getTime() - Date.now();
  if (remaining <= 0) return 'FINALIZADO';
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${Math.floor((remaining % 3600000) / 60000)}m`;
}

function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes}m`;
  return `hace ${Math.floor(minutes / 60)}h`;
}

function SectionLabel({ children, color }: { children: string; color: string }) {
  return <ForgeText variant="label" style={[styles.eyebrow, { color }]}>{children}</ForgeText>;
}

function SceneParticle({
  left,
  top,
  size,
  delay,
  drift,
  color,
  reduceMotion,
}: (typeof PARTICLES)[number] & { color: string; reduceMotion: boolean | null }) {
  const motion = useSharedValue(0);
  const duration = Math.round(MOTION.ambient * drift);

  useEffect(() => {
    if (reduceMotion) {
      motion.value = 0;
      return;
    }
    motion.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration }), withTiming(0, { duration })),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(motion);
  }, [delay, duration, motion, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(motion.value, [0, 0.5, 1], [0.08, 0.7, 0.08]),
    transform: [
      { translateY: interpolate(motion.value, [0, 1], [14, -18]) },
      { translateX: interpolate(motion.value, [0, 1], [-4, 9]) },
      { scale: interpolate(motion.value, [0, 0.5, 1], [0.7, 1.25, 0.7]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        { left, top, width: size, height: size, borderRadius: size / 2, backgroundColor: color, shadowColor: color },
        animatedStyle,
      ]}
    />
  );
}

function WorldHotspot({
  title,
  subtitle,
  icon,
  route,
  tone,
  position,
  colors,
  signal,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: string;
  route: HomeRoute;
  tone: ToneName;
  position: (typeof HOTSPOTS)[number]['position'];
  colors: ReturnType<typeof useColors>;
  signal?: string | null;
  onPress: (route: HomeRoute) => void;
}) {
  const toneColor = colors[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${subtitle}${signal ? ` · ${signal}` : ''}`}
      testID={title === 'Arena' ? 'home-battle' : `home-hotspot-${title.toLowerCase()}`}
      onPress={() => onPress(route)}
      style={({ pressed }) => [
        styles.hotspot,
        styles[`hotspot${position[0].toUpperCase()}${position.slice(1)}` as 'hotspotForge'],
        { opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] },
      ]}
    >
      <View style={[styles.hotspotHalo, { borderColor: `${toneColor}45`, shadowColor: toneColor }]}>
        <View style={[styles.hotspotSeal, { borderColor: `${toneColor}B8`, backgroundColor: `${colors.ink}E6` }]}>
          <View style={[styles.hotspotGlyph, { borderColor: `${toneColor}66`, backgroundColor: `${toneColor}18` }]}>
            <Ionicons name={icon} size={23} color={toneColor} />
          </View>
        </View>
      </View>
      <Text style={[styles.hotspotTitle, { color: colors.foreground }]}>{title.toUpperCase()}</Text>
      <Text style={[styles.hotspotSubtitle, { color: colors.mutedForeground }]} numberOfLines={2}>{subtitle}</Text>
      {signal ? <Text style={[styles.hotspotSignal, { color: toneColor }]}>{signal}</Text> : null}
    </Pressable>
  );
}

export default function ForgeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { wallet, stats, player, progress, syncState, refresh } = useGame();
  const [home, setHome] = useState<HomeSnapshot>({ stats: null, dailyCard: null, missions: [], activity: [] });
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState<string | null>(null);
  const [featuredCardImageFailed, setFeaturedCardImageFailed] = useState(false);
  const [factionSceneFailed, setFactionSceneFailed] = useState(false);
  const [homeSceneState, setHomeSceneState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [homeNexusBurstState, setHomeNexusBurstState] = useState<'loading' | 'ready' | 'error'>('loading');
  const scrollY = useSharedValue(0);
  const ambientMotion = useSharedValue(0);
  const progressMotion = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      ambientMotion.value = 0;
      return;
    }
    ambientMotion.value = withRepeat(
      withSequence(withTiming(1, { duration: MOTION.ambient * 4 }), withTiming(0, { duration: MOTION.ambient * 4 })),
      -1,
      false,
    );
    return () => cancelAnimation(ambientMotion);
  }, [ambientMotion, reduceMotion]);

  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const sceneParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, 900], [0, 78]) },
      { scale: interpolate(scrollY.value, [0, 900], [1.06, 1.15]) },
    ],
  }));

  const factionParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, 900], [0, 42]) },
      { scale: interpolate(scrollY.value, [0, 900], [1.08, 1.18]) },
    ],
  }));

  const ambientGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ambientMotion.value, [0, 1], [0.14, 0.48]),
    transform: [
      { translateY: interpolate(ambientMotion.value, [0, 1], [10, -14]) },
      { scale: interpolate(ambientMotion.value, [0, 1], [0.86, 1.1]) },
    ],
  }));

  const focalMotionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(ambientMotion.value, [0, 1], [4, -5]) },
      { rotate: `${interpolate(ambientMotion.value, [0, 1], [-1, 1])}deg` },
    ],
  }));

  const progressFillStyle = useAnimatedStyle(() => ({ width: `${progressMotion.value}%` }));

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
    if (results.some((result) => result.status === 'rejected')) {
      setHomeError(nextHome.stats || nextHome.dailyCard || nextHome.missions.length > 0 || nextHome.activity.length > 0
        ? 'Algunas señales no se pudieron sincronizar. Reintenta para actualizar la escena.'
        : 'No se pudo sincronizar el contenido de Foja.');
    }
    setHomeLoading(false);
  }, []);

  useEffect(() => { void loadHome(); }, [loadHome]);
  useEffect(() => {
    setFeaturedCardImageFailed(false);
    setFactionSceneFailed(false);
  }, [home.dailyCard?.image_url, home.dailyCard?.faction]);

  const handleRefresh = () => { void Promise.all([refresh(), loadHome()]); };
  const routeTo = (route: HomeRoute) => {
    if (route === '/') {
      router.replace('/');
      return;
    }
    router.push(route);
  };

  const displayName = player?.display_name?.trim() || 'FORJADOR';
  const featuredCard = home.dailyCard;
  const event = home.stats?.active_event;
  const season = home.stats?.season;
  const factionScene = featuredCard?.faction && !factionSceneFailed
    ? FACTION_BACKGROUNDS[featuredCard.faction as keyof typeof FACTION_BACKGROUNDS]
    : null;
  const energyPercent = progress ? Math.min(100, Math.round((progress.energy / Math.max(1, progress.max_energy)) * 100)) : 0;
  const xpPercent = progress ? Math.min(100, Math.round((progress.xp / Math.max(1, progress.xp_to_next)) * 100)) : 0;
  const tutorialStep = progress?.tutorial_step;
  const tutorialComplete = tutorialStep != null && tutorialStep >= TUTORIAL_DONE_STEP;
  const tutorialPercent = tutorialStep == null
    ? 0
    : tutorialComplete
      ? 100
      : Math.min(100, Math.round((tutorialStep / Math.max(1, TUTORIAL_TOTAL_STEPS - 1)) * 100));
  const nexusStatus = syncState === 'connected'
    ? { label: 'ONLINE', color: colors.success }
    : syncState === 'loading'
      ? { label: 'SYNC', color: colors.accent }
      : { label: 'OFFLINE', color: colors.danger };
  const nodeSignals = {
    archive: stats?.cards_owned != null ? `${stats.cards_owned} CARTAS` : null,
    arena: null,
    forge: progress ? `NV. ${progress.level}` : null,
    deck: null,
  };
  const cardWidth = Math.min(Math.max(width * 0.34, 132), 174);
  const cardHeight = cardWidth * 1.42;
  const hasHomePayload = Boolean(home.stats || home.dailyCard || home.missions.length > 0 || home.activity.length > 0);
  const homeDataState: 'loading' | 'partial' | 'error' | 'empty' | 'ready' = homeLoading && !hasHomePayload
    ? 'loading'
    : homeError
      ? hasHomePayload ? 'partial' : 'error'
      : hasHomePayload ? 'ready' : 'empty';

  useEffect(() => {
    progressMotion.value = reduceMotion ? xpPercent : withTiming(xpPercent, { duration: MOTION.navigation });
  }, [progressMotion, reduceMotion, xpPercent]);

  return (
    <ScreenShell surface="home" sceneMode="hero">
      <Animated.ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        refreshControl={<RefreshControl refreshing={homeLoading || syncState === 'loading'} onRefresh={handleRefresh} tintColor={colors.accent} />}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          testID="home-scene"
          entering={reduceMotion ? undefined : FadeIn.duration(MOTION.navigation)}
          style={[styles.scene, { borderBottomColor: `${colors.accent}38`, shadowColor: colors.shadow }]}
        >
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, sceneParallaxStyle]}>
            <Image
              source={{ uri: CANONICAL_BACKGROUNDS.home }}
              style={[StyleSheet.absoluteFillObject, styles.sceneImage]}
              resizeMode="cover"
              accessibilityLabel="Escena oficial de Foja"
              onLoad={() => setHomeSceneState('ready')}
              onError={() => setHomeSceneState('error')}
            />
          </Animated.View>
          {factionScene ? (
            <Animated.Image
              source={{ uri: factionScene }}
              style={[StyleSheet.absoluteFillObject, styles.sceneFactionImage, factionParallaxStyle]}
              resizeMode="cover"
              accessibilityLabel="Atmósfera oficial de la facción activa"
              onError={() => setFactionSceneFailed(true)}
            />
          ) : null}
          <LinearGradient
            colors={[`${colors.ink}DB`, `${colors.ink}20`, `${colors.background}E8`]}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={[`${colors.primary}32`, 'transparent', `${colors.accent}1E`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
            {PARTICLES.map((particle) => (
              <SceneParticle key={`${particle.left}-${particle.top}`} {...particle} color={colors.accent} reduceMotion={reduceMotion} />
            ))}
          </View>
          <Animated.View pointerEvents="none" style={[styles.sceneGlow, { backgroundColor: colors.accent, zIndex: DEPTH.ambient }, ambientGlowStyle]} />
          <View pointerEvents="none" style={[styles.sceneFrame, { borderColor: `${colors.accent}20`, zIndex: DEPTH.surface }]} />

          <View style={[styles.sceneContent, { paddingTop: insets.top + 12 }]}>
            <View style={styles.topLine}>
              <View style={styles.brand}>
                <ForgeMark />
                <View>
                  <Text style={[styles.brandName, { color: colors.accent }]}>VEXFORGE</Text>
                  <Text style={[styles.brandMeta, { color: colors.mutedForeground }]}>FOJA · BASE DEL FORJADOR</Text>
                </View>
              </View>
              <View style={styles.topActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir bandeja de notificaciones"
                  testID="home-inbox"
                  onPress={() => router.push('/missions')}
                  style={({ pressed }) => [styles.topAction, { borderColor: `${colors.foreground}36`, backgroundColor: `${colors.ink}B8`, opacity: pressed ? 0.72 : 1 }]}
                >
                  <Ionicons name="mail" size={17} color={colors.foreground} />
                  <View style={[styles.notificationDot, { backgroundColor: colors.danger }]} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir configuración"
                  testID="home-settings"
                  onPress={() => router.push('/meta')}
                  style={({ pressed }) => [styles.topAction, { borderColor: `${colors.foreground}36`, backgroundColor: `${colors.ink}B8`, opacity: pressed ? 0.72 : 1 }]}
                >
                  <Ionicons name="gear" size={17} color={colors.foreground} />
                </Pressable>
              </View>
            </View>

            <View style={styles.resourceRail}>
              <View style={[styles.resource, { borderColor: `${colors.success}56`, backgroundColor: `${colors.ink}B8` }]}>
                <Ionicons name="energy" size={14} color={colors.success} />
                <View>
                  <Text style={[styles.resourceLabel, { color: `${colors.success}D2` }]}>ENERGÍA</Text>
                  <Text style={[styles.resourceValue, { color: colors.foreground }]}>{progress ? `${progress.energy}/${progress.max_energy}` : '—'}</Text>
                </View>
                <Text style={[styles.resourceTimer, { color: colors.mutedForeground }]}>03:27</Text>
              </View>
              <View style={[styles.resource, { borderColor: `${colors.rarityRare}56`, backgroundColor: `${colors.ink}B8` }]}>
                <Ionicons name="gem" size={14} color={colors.rarityRare} />
                <View>
                  <Text style={[styles.resourceLabel, { color: `${colors.rarityRare}D2` }]}>VEX</Text>
                  <Text style={[styles.resourceValue, { color: colors.foreground }]}>{(wallet?.vex_ingame ?? 0).toLocaleString('es')}</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Abrir perfil del forjador"
                testID="home-profile"
                onPress={() => router.push('/profile')}
                style={({ pressed }) => [styles.playerMedallion, { borderColor: `${colors.accent}80`, backgroundColor: `${colors.ink}D4`, opacity: pressed ? 0.72 : 1 }]}
              >
                <Ionicons name="profile" size={20} color={colors.accent} />
              </Pressable>
            </View>

            <View style={[styles.playerStrip, { borderColor: `${colors.accent}4C`, backgroundColor: `${colors.ink}A8` }]}>
              <View style={[styles.playerBadge, { borderColor: `${colors.accent}8A`, backgroundColor: `${colors.accent}20` }]}>
                <Ionicons name="profile" size={15} color={colors.accent} />
              </View>
              <View style={styles.playerCopy}>
                <Text style={[styles.playerEyebrow, { color: colors.mutedForeground }]}>FORJADOR</Text>
                <Text style={[styles.playerName, { color: colors.foreground }]} numberOfLines={1}>{displayName}</Text>
              </View>
              <View style={styles.playerLevel}>
                <Text style={[styles.playerEyebrow, { color: colors.mutedForeground }]}>NIVEL</Text>
                <Text style={[styles.playerLevelValue, { color: colors.accent }]}>{progress?.level ?? '—'}</Text>
              </View>
            </View>

            <View style={styles.seasonRibbon}>
              <View style={[styles.seasonSeal, { borderColor: `${colors.rarityEpic}A8`, backgroundColor: `${colors.ink}E0`, shadowColor: colors.rarityEpic }]}>
                <Ionicons name="season" size={24} color={colors.rarityEpic} />
              </View>
              <View style={styles.seasonCopy}>
                <Text style={[styles.seasonEyebrow, { color: colors.accent }]}>TEMPORADA ACTIVA</Text>
                <Text style={[styles.seasonTitle, { color: colors.foreground }]}>{season?.name ?? 'EL DESPERTAR DE VEX'}</Text>
                <Text style={[styles.seasonMeta, { color: colors.mutedForeground }]}>{season ? `Termina en ${countdown(season.ends_at)}` : 'Sincronizando temporada'}</Text>
              </View>
              <View style={[styles.connectionPill, { borderColor: `${nexusStatus.color}66`, backgroundColor: `${nexusStatus.color}16` }]}>
                <View style={[styles.connectionDot, { backgroundColor: nexusStatus.color }]} />
                <Text style={[styles.connectionText, { color: nexusStatus.color }]}>{nexusStatus.label}</Text>
              </View>
            </View>

            {homeSceneState === 'loading' ? (
              <View style={[styles.sceneNotice, { borderColor: `${colors.accent}66`, backgroundColor: `${colors.ink}D9` }]}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={[styles.sceneNoticeText, { color: colors.mutedForeground }]}>CARGANDO LA FORJA</Text>
              </View>
            ) : homeSceneState === 'error' ? (
              <View accessibilityRole="alert" style={[styles.sceneNotice, { borderColor: colors.danger, backgroundColor: `${colors.danger}1A` }]}>
                <Ionicons name="warning" size={15} color={colors.danger} />
                <Text style={[styles.sceneNoticeText, { color: colors.foreground }]}>ARTE OFICIAL NO DISPONIBLE</Text>
              </View>
            ) : null}

            <View style={styles.world} testID="home-world">
              <Image
                testID="home-official-nexus-burst"
                source={{ uri: OFFICIAL_ASSETS.homeNexusBurst }}
                style={styles.nexusBurst}
                resizeMode="cover"
                accessibilityLabel="Atmósfera oficial del pulso del Nexus"
                onLoad={() => setHomeNexusBurstState('ready')}
                onError={() => setHomeNexusBurstState('error')}
              />
              {homeNexusBurstState === 'loading' ? (
                <View testID="home-nexus-burst-loading" pointerEvents="none" style={styles.nexusBurstLoading}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[styles.nexusBurstLoadingText, { color: colors.mutedForeground }]}>CARGANDO ATMÓSFERA</Text>
                </View>
              ) : null}
              <View pointerEvents="none" style={styles.worldLight}>
                <LinearGradient
                  colors={[`${colors.accent}4A`, `${colors.primary}1C`, 'transparent']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
              <WorldHotspot {...HOTSPOTS[0]} colors={colors} signal={nodeSignals.forge} onPress={routeTo} />
              <WorldHotspot {...HOTSPOTS[1]} colors={colors} signal={nodeSignals.arena} onPress={routeTo} />
              <WorldHotspot {...HOTSPOTS[2]} colors={colors} signal={nodeSignals.archive} onPress={routeTo} />
              <WorldHotspot {...HOTSPOTS[3]} colors={colors} signal={nodeSignals.deck} onPress={routeTo} />

              <Animated.View style={[styles.centralRelic, focalMotionStyle]}>
                <View pointerEvents="none" style={[styles.relicOrbit, { borderColor: `${colors.accent}32` }]} />
                <View pointerEvents="none" style={[styles.relicOrbitSmall, { borderColor: `${colors.rarityEpic}38` }]} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={featuredCard ? `Inspeccionar ${featuredCard.name}` : 'Abrir archivo de cartas'}
                  testID="home-featured-card"
                  onPress={() => routeTo('/collection')}
                  style={({ pressed }) => [styles.cardPressable, { opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                >
                  <View style={[styles.cardFrame, { width: cardWidth, height: cardHeight, borderColor: colors.accent, shadowColor: colors.accent }]}>
                    {featuredCard?.image_url && !featuredCardImageFailed ? (
                      <Image
                        source={{ uri: featuredCard.image_url }}
                        style={styles.cardImage}
                        resizeMode="cover"
                        accessibilityLabel={`Arte de ${featuredCard.name}`}
                        onError={() => setFeaturedCardImageFailed(true)}
                      />
                    ) : featuredCard || featuredCardImageFailed ? (
                      <View style={[styles.cardError, { backgroundColor: `${colors.ink}EE` }]}>
                        <Ionicons name="warning" size={29} color={colors.danger} />
                        <Text style={[styles.cardErrorText, { color: colors.mutedForeground }]}>ARTE NO DISPONIBLE</Text>
                      </View>
                    ) : homeLoading ? (
                      <View style={[styles.cardError, { backgroundColor: `${colors.ink}EE` }]}>
                        <ActivityIndicator size="small" color={colors.accent} />
                        <Text style={[styles.cardErrorText, { color: colors.mutedForeground }]}>CARGANDO CARTA</Text>
                      </View>
                    ) : (
                      <View style={[styles.cardError, { backgroundColor: `${colors.ink}EE` }]}>
                        <Ionicons name="card" size={29} color={colors.mutedForeground} />
                        <Text style={[styles.cardErrorText, { color: colors.mutedForeground }]}>CARTA NO PUBLICADA</Text>
                      </View>
                    )}
                    <LinearGradient
                      pointerEvents="none"
                      colors={['transparent', `${colors.ink}D9`]}
                      style={styles.cardShade}
                    />
                    <View pointerEvents="none" style={[styles.cardCorner, { borderColor: `${colors.accent}AA` }]} />
                    <View pointerEvents="none" style={[styles.cardCornerBottom, { borderColor: `${colors.accent}AA` }]} />
                    <View style={styles.cardCaption}>
                      <Text style={[styles.cardKicker, { color: colors.accent }]}>RELIQUIA ACTIVA</Text>
                      <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>{featuredCard?.name ?? (homeLoading ? 'CARTA DEL DÍA' : 'CARTA NO PUBLICADA')}</Text>
                      <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>{featuredCard ? `${featuredCard.rarity} · ${featuredCard.faction}` : homeLoading ? 'Sincronizando' : 'Sin registro oficial'}</Text>
                    </View>
                  </View>
                </Pressable>
                <Text style={[styles.relicHint, { color: colors.accent }]}>TOCA PARA INSPECCIONAR</Text>
              </Animated.View>

              <View style={[styles.dailyMission, { borderColor: `${colors.accent}6E`, backgroundColor: `${colors.ink}D9` }]}>
                <View style={[styles.missionSeal, { borderColor: `${colors.accent}8A`, backgroundColor: `${colors.accent}18` }]}>
                  <Ionicons name="missions" size={23} color={colors.accent} />
                </View>
                <View style={styles.missionCopy}>
                  <Text style={[styles.missionEyebrow, { color: colors.accent }]}>MISIÓN DIARIA</Text>
                  <Text style={[styles.missionTitle, { color: colors.foreground }]} numberOfLines={1}>{home.missions[0]?.name ?? (homeLoading ? 'Sincronizando misión' : 'No hay misión publicada')}</Text>
                  <Text style={[styles.missionMeta, { color: colors.mutedForeground }]}>
                    {home.missions[0] ? `${home.missions[0].difficulty ?? 'Misión'} · +${home.missions[0].reward_vex_ingame ?? 0} VEX` : homeLoading ? 'Consultando el Nexus' : 'Sin misiones publicadas'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir misiones diarias"
                  testID="home-missions"
                  onPress={() => router.push('/missions')}
                  style={({ pressed }) => [styles.missionAction, { borderColor: `${colors.accent}8A`, opacity: pressed ? 0.72 : 1 }]}
                >
                  <Ionicons name="chevron-right" size={17} color={colors.accent} />
                </Pressable>
              </View>
            </View>

            {homeNexusBurstState === 'error' ? (
              <View testID="home-nexus-burst-error" accessibilityRole="alert" style={[styles.stageAssetNotice, { borderColor: colors.danger, backgroundColor: `${colors.danger}1A` }]}>
                <Ionicons name="warning" size={13} color={colors.danger} />
                <Text style={[styles.stageAssetNoticeText, { color: colors.foreground }]}>ATMÓSFERA OFICIAL NO DISPONIBLE</Text>
              </View>
            ) : null}

            {event ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir evento ${event.name}`}
                testID="home-event"
                onPress={() => routeTo('/world')}
                style={({ pressed }) => [styles.eventCard, { borderColor: `${colors.rarityEpic}8A`, backgroundColor: `${colors.ink}D9`, opacity: pressed ? 0.8 : 1 }]}
              >
                <View style={[styles.eventSeal, { borderColor: `${colors.rarityEpic}A8`, backgroundColor: `${colors.rarityEpic}18` }]}>
                  <Ionicons name="spark" size={23} color={colors.rarityEpic} />
                </View>
                <View style={styles.eventCopy}>
                  <Text style={[styles.eventEyebrow, { color: colors.rarityEpic }]}>EVENTO ESPECIAL</Text>
                  <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>{event.name}</Text>
                  <Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>Progreso global · {event.progress ?? 0}%</Text>
                </View>
                <Ionicons name="chevron-right" size={18} color={colors.rarityEpic} />
              </Pressable>
            ) : !homeLoading ? (
              <View testID="home-event-empty" accessibilityRole="status" style={[styles.eventCard, { borderColor: colors.border, backgroundColor: `${colors.ink}B8` }]}>
                <View style={[styles.eventSeal, { borderColor: colors.border, backgroundColor: `${colors.foreground}0D` }]}>
                  <Ionicons name="spark" size={23} color={colors.mutedForeground} />
                </View>
                <View style={styles.eventCopy}>
                  <Text style={[styles.eventEyebrow, { color: colors.mutedForeground }]}>EVENTO ESPECIAL</Text>
                  <Text style={[styles.eventTitle, { color: colors.foreground }]}>Sin evento activo</Text>
                  <Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>El Nexus publicará el próximo evento aquí.</Text>
                </View>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tutorialComplete ? 'Revisar el rito de entrada' : 'Continuar el rito de entrada'}
              testID="home-tutorial"
              onPress={() => router.push('/tutorial')}
              style={({ pressed }) => [styles.ritualCard, { borderColor: `${colors.accent}6E`, backgroundColor: `${colors.ink}D4`, opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={[styles.ritualSeal, { borderColor: `${colors.accent}8A`, backgroundColor: `${colors.accent}18` }]}>
                <Ionicons name={tutorialComplete ? 'check' : 'compass'} size={22} color={colors.accent} />
              </View>
              <View style={styles.ritualCopy}>
                <Text style={[styles.ritualEyebrow, { color: colors.accent }]}>{tutorialComplete ? 'RITO COMPLETADO' : 'CONTINÚA TU RITO'}</Text>
                <Text style={[styles.ritualMeta, { color: colors.mutedForeground }]}>
                  {tutorialStep == null ? 'Sincroniza tu progreso' : tutorialComplete ? 'Vuelve a recorrer la guía oficial' : `Paso ${Math.min(tutorialStep + 1, TUTORIAL_TOTAL_STEPS)} de ${TUTORIAL_TOTAL_STEPS}`}
                </Text>
              </View>
              <View style={[styles.ritualProgress, { backgroundColor: `${colors.foreground}18` }]}>
                <View style={[styles.ritualProgressFill, { width: `${tutorialPercent}%`, backgroundColor: colors.accent }]} />
              </View>
              <Ionicons name="chevron-right" size={17} color={colors.mutedForeground} />
            </Pressable>

            <View style={styles.sceneHint}>
              <Ionicons name="compass" size={15} color={colors.accent} />
              <Text style={[styles.sceneHintText, { color: colors.mutedForeground }]}>DESLIZA PARA EXPLORAR EL MUNDO</Text>
              <Ionicons name="arrow-down" size={15} color={colors.accent} />
            </View>
          </View>
        </Animated.View>

        <View style={styles.content}>
          {homeDataState !== 'ready' ? (
            <View
              testID="home-data-state"
              accessibilityRole={homeDataState === 'partial' || homeDataState === 'error' ? 'alert' : 'status'}
              style={[styles.statePanel, { borderColor: homeDataState === 'loading' || homeDataState === 'empty' ? `${colors.accent}66` : colors.danger, backgroundColor: homeDataState === 'loading' || homeDataState === 'empty' ? `${colors.accent}12` : `${colors.danger}16` }]}
            >
              {homeDataState === 'loading' ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons name={homeDataState === 'empty' ? 'radio' : 'warning'} size={18} color={homeDataState === 'empty' ? colors.accent : colors.danger} />
              )}
              <View style={styles.stateCopy}>
                <Text style={[styles.stateTitle, { color: homeDataState === 'loading' || homeDataState === 'empty' ? colors.accent : colors.danger }]}>
                  {homeDataState === 'loading' ? 'SINCRONIZANDO FOJA' : homeDataState === 'partial' ? 'SEÑALES PARCIALES' : homeDataState === 'error' ? 'FOJA NO DISPONIBLE' : 'NEXUS EN ESPERA'}
                </Text>
                <Text style={[styles.stateText, { color: colors.foreground }]}>
                  {homeDataState === 'loading' ? 'Los datos reales del Nexus están llegando.' : homeDataState === 'partial' ? 'Parte del contenido sigue disponible; actualiza para completar la escena.' : homeDataState === 'error' ? homeError ?? 'No se pudo sincronizar el contenido de Foja.' : 'No hay contenido publicado para esta superficie.'}
                </Text>
              </View>
              {homeDataState !== 'loading' ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Reintentar sincronización del Home" testID="home-retry" onPress={() => void loadHome()}>
                  <Text style={[styles.retryText, { color: colors.accent }]}>REINTENTAR</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={[styles.statusPanel, { borderColor: colors.border, backgroundColor: colors.panelStrong }]}>
            <View style={styles.statusHeader}>
              <View>
                <SectionLabel color={colors.accent}>ESTADO DE LA BASE</SectionLabel>
                <Text style={[styles.statusTitle, { color: colors.foreground }]}>{homeDataState === 'ready' ? 'Tu mundo, siempre listo.' : 'Señales del Nexus.'}</Text>
              </View>
              <View style={[styles.connectionPill, { borderColor: `${nexusStatus.color}66`, backgroundColor: `${nexusStatus.color}16` }]}>
                <View style={[styles.connectionDot, { backgroundColor: nexusStatus.color }]} />
                <Text style={[styles.connectionText, { color: nexusStatus.color }]}>{nexusStatus.label}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Ionicons name="energy" size={17} color={colors.success} />
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>ENERGÍA</Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{progress ? `${progress.energy}/${progress.max_energy}` : '—'}</Text>
                <ProgressBar value={energyPercent} color={colors.success} />
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statCell}>
                <Ionicons name="collection" size={17} color={colors.accent} />
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>ARCHIVO</Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stats?.cards_owned ?? '—'}</Text>
                <Text style={[styles.statHint, { color: colors.mutedForeground }]}>cartas</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statCell}>
                <Ionicons name="wallet" size={17} color={colors.rarityRare} />
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>VEX</Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{(wallet?.vex_ingame ?? 0).toLocaleString('es')}</Text>
                <Text style={[styles.statHint, { color: colors.mutedForeground }]}>disponible</Text>
              </View>
            </View>
          </View>

          <View style={[styles.progressPanel, { borderColor: `${colors.accent}58`, backgroundColor: colors.panel }]}>
            <View style={styles.progressHeader}>
              <View>
                <SectionLabel color={colors.accent}>PULSO DEL FORJADOR</SectionLabel>
                <Text style={[styles.progressTitle, { color: colors.foreground }]}>{progress ? `NIVEL ${progress.level}` : 'PROGRESO NO DISPONIBLE'}</Text>
              </View>
              <Text style={[styles.progressValue, { color: colors.accent }]}>{progress ? `${progress.xp}/${progress.xp_to_next} XP` : '—'}</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: `${colors.foreground}18` }]}>
              <Animated.View style={[styles.progressFill, progressFillStyle, { backgroundColor: colors.accent }]} />
            </View>
            <Text style={[styles.progressMeta, { color: colors.mutedForeground }]}>
              {tutorialStep == null ? 'Sincroniza tu progreso para continuar.' : tutorialComplete ? 'Rito de entrada completado.' : `Rito de entrada · ${tutorialPercent}%`}
            </Text>
          </View>

          {home.activity[0] ? (
            <View style={[styles.activitySignal, { borderColor: colors.border, backgroundColor: colors.panel }]}>
              <Ionicons name="spark" size={17} color={colors.accent} />
              <View style={styles.activityCopy}>
                <SectionLabel color={colors.accent}>ÚLTIMA SEÑAL</SectionLabel>
                <Text style={[styles.activityText, { color: colors.foreground }]} numberOfLines={1}>{home.activity[0].text}</Text>
              </View>
              <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{timeAgo(home.activity[0].time)}</Text>
            </View>
          ) : !homeLoading ? (
            <View style={[styles.activitySignal, { borderColor: colors.border, backgroundColor: colors.panel }]}>
              <Ionicons name="radio" size={17} color={colors.mutedForeground} />
              <View style={styles.activityCopy}>
                <SectionLabel color={colors.mutedForeground}>ÚLTIMA SEÑAL</SectionLabel>
                <Text style={[styles.activityText, { color: colors.mutedForeground }]}>El Nexus espera tu próxima acción.</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.secondaryLinks}>
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir el mundo" testID="home-world" onPress={() => routeTo('/world')} style={({ pressed }) => [styles.secondaryLink, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
              <Ionicons name="map" size={15} color={colors.accent} />
              <Text style={[styles.secondaryLinkText, { color: colors.foreground }]}>MUNDO</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir economía" testID="home-economy" onPress={() => router.push('/economy')} style={({ pressed }) => [styles.secondaryLink, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
              <Ionicons name="wallet" size={15} color={colors.accent} />
              <Text style={[styles.secondaryLinkText, { color: colors.foreground }]}>ECONOMÍA</Text>
            </Pressable>
          </View>
        </View>
      </Animated.ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scene: { minHeight: 1140, overflow: 'hidden', borderBottomWidth: 1, shadowOpacity: 0.52, shadowRadius: 28, shadowOffset: { width: 0, height: 18 }, elevation: 10 },
  sceneImage: { opacity: 0.98 },
  sceneFactionImage: { opacity: 0.3 },
  sceneContent: { paddingHorizontal: 16, paddingBottom: 24 },
  particle: { position: 'absolute', shadowOpacity: 0.78, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  sceneGlow: { position: 'absolute', width: 340, height: 340, borderRadius: 170, top: 360, right: -170 },
  sceneFrame: { position: 'absolute', left: 10, right: 10, top: 10, bottom: 10, borderWidth: 1, borderRadius: 24 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontFamily: typography.bodyBold, fontSize: 15, fontWeight: '800', letterSpacing: 2.7 },
  brandMeta: { fontFamily: typography.bodySemiBold, fontSize: 7, letterSpacing: 1.1, marginTop: 3 },
  topActions: { flexDirection: 'row', gap: 6 },
  topAction: { width: 38, height: 38, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', top: 7, right: 7 },
  resourceRail: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 11 },
  resource: { flex: 1, minHeight: 43, borderWidth: 1, borderRadius: 11, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  resourceLabel: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.7, fontWeight: '800' },
  resourceValue: { fontFamily: typography.bodyBold, fontSize: 11, fontWeight: '800', marginTop: 1 },
  resourceTimer: { fontFamily: typography.body, fontSize: 7, marginLeft: 'auto' },
  playerMedallion: { width: 43, height: 43, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  playerStrip: { minHeight: 53, borderWidth: 1, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  playerBadge: { width: 35, height: 35, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  playerCopy: { flex: 1, marginLeft: 9 },
  playerEyebrow: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 1, fontWeight: '800' },
  playerName: { fontFamily: typography.bodyBold, fontSize: 13, fontWeight: '800', marginTop: 2 },
  playerLevel: { alignItems: 'flex-end', paddingLeft: 10 },
  playerLevelValue: { fontFamily: typography.bodyBold, fontSize: 16, fontWeight: '800', marginTop: 1 },
  seasonRibbon: { minHeight: 74, borderWidth: 1, borderColor: 'rgba(221,174,94,0.38)', backgroundColor: 'rgba(8,13,24,0.78)', borderRadius: 18, padding: 9, flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  seasonSeal: { width: 49, height: 49, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.6, shadowRadius: 12 },
  seasonCopy: { flex: 1, marginLeft: 10 },
  seasonEyebrow: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 1, fontWeight: '800' },
  seasonTitle: { fontFamily: typography.bodyBold, fontSize: 13, fontWeight: '800', marginTop: 3 },
  seasonMeta: { fontFamily: typography.body, fontSize: 8, marginTop: 3 },
  connectionPill: { minHeight: 24, borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  connectionDot: { width: 6, height: 6, borderRadius: 3 },
  connectionText: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.6, fontWeight: '800' },
  sceneNotice: { minHeight: 30, borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10 },
  sceneNoticeText: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.7, fontWeight: '800' },
  world: { height: 755, marginTop: 10, position: 'relative' },
  nexusBurst: { position: 'absolute', width: '78%', height: '66%', top: 92, left: '11%', opacity: 0.18, borderRadius: 160 },
  nexusBurstLoading: { position: 'absolute', top: 126, left: 0, right: 0, alignItems: 'center', gap: 6 },
  nexusBurstLoadingText: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.7, fontWeight: '800' },
  worldLight: { position: 'absolute', width: '72%', height: '64%', top: 65, left: '14%', opacity: 0.9 },
  hotspot: { position: 'absolute', width: 134, alignItems: 'center', zIndex: DEPTH.surface, padding: 5 },
  hotspotForge: { left: 0, top: 165 },
  hotspotArena: { right: 0, top: 195 },
  hotspotArchive: { left: 4, top: 430 },
  hotspotDeck: { right: 4, top: 452 },
  hotspotHalo: { width: 78, height: 78, borderWidth: 1, borderRadius: 39, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } },
  hotspotSeal: { width: 64, height: 64, borderWidth: 1, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  hotspotGlyph: { width: 46, height: 46, borderWidth: 1, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  hotspotTitle: { fontFamily: typography.bodyBold, fontSize: 11, letterSpacing: 1.9, fontWeight: '800', marginTop: 8 },
  hotspotSubtitle: { fontFamily: typography.body, fontSize: 7, letterSpacing: 0.35, textAlign: 'center', lineHeight: 10, marginTop: 3 },
  hotspotSignal: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.7, marginTop: 4 },
  centralRelic: { position: 'absolute', top: 132, left: '50%', marginLeft: -105, width: 210, alignItems: 'center', zIndex: DEPTH.focus },
  relicOrbit: { position: 'absolute', top: 56, width: 208, height: 300, borderWidth: 1, borderRadius: 104, transform: [{ rotate: '-8deg' }] },
  relicOrbitSmall: { position: 'absolute', top: 72, width: 184, height: 274, borderWidth: 1, borderRadius: 92, transform: [{ rotate: '11deg' }] },
  cardPressable: { alignItems: 'center' },
  cardFrame: { borderWidth: 2, borderRadius: 12, overflow: 'hidden', backgroundColor: '#080B12', shadowOpacity: 0.78, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 13 },
  cardImage: { width: '100%', height: '100%' },
  cardError: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  cardErrorText: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.6, textAlign: 'center' },
  cardShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '42%' },
  cardCorner: { position: 'absolute', left: 6, top: 6, width: 17, height: 17, borderLeftWidth: 1, borderTopWidth: 1 },
  cardCornerBottom: { position: 'absolute', right: 6, bottom: 6, width: 17, height: 17, borderRightWidth: 1, borderBottomWidth: 1 },
  cardCaption: { position: 'absolute', left: 10, right: 10, bottom: 9 },
  cardKicker: { fontFamily: typography.bodyBold, fontSize: 6, letterSpacing: 0.8, fontWeight: '800' },
  cardName: { fontFamily: typography.bodyBold, fontSize: 12, fontWeight: '800', marginTop: 3 },
  cardMeta: { fontFamily: typography.body, fontSize: 7, marginTop: 3 },
  relicHint: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.9, marginTop: 10 },
  dailyMission: { position: 'absolute', left: 12, right: 12, top: 603, minHeight: 73, borderWidth: 1, borderRadius: 16, padding: 9, flexDirection: 'row', alignItems: 'center', zIndex: DEPTH.surface },
  missionSeal: { width: 48, height: 48, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  missionCopy: { flex: 1, marginLeft: 9 },
  missionEyebrow: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.9, fontWeight: '800' },
  missionTitle: { fontFamily: typography.bodyBold, fontSize: 11, fontWeight: '800', marginTop: 3 },
  missionMeta: { fontFamily: typography.body, fontSize: 8, marginTop: 3 },
  missionAction: { width: 30, height: 30, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stageAssetNotice: { minHeight: 28, borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 7 },
  stageAssetNoticeText: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.6, fontWeight: '800' },
  eventCard: { minHeight: 80, borderWidth: 1, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  eventSeal: { width: 50, height: 50, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  eventCopy: { flex: 1 },
  eventEyebrow: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.9, fontWeight: '800' },
  eventTitle: { fontFamily: typography.bodyBold, fontSize: 13, fontWeight: '800', marginTop: 3 },
  eventMeta: { fontFamily: typography.body, fontSize: 8, marginTop: 3 },
  ritualCard: { minHeight: 61, borderWidth: 1, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 },
  ritualSeal: { width: 38, height: 38, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ritualCopy: { flex: 1 },
  ritualEyebrow: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.8, fontWeight: '800' },
  ritualMeta: { fontFamily: typography.body, fontSize: 8, marginTop: 4 },
  ritualProgress: { width: 42, height: 4, borderRadius: 3, overflow: 'hidden' },
  ritualProgressFill: { height: '100%', borderRadius: 3 },
  eyebrow: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.9, fontWeight: '800' },
  sceneHint: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 9 },
  sceneHintText: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.8, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 11, gap: 11 },
  errorBar: { minHeight: 48, borderWidth: 1, borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  errorText: { flex: 1, fontFamily: typography.body, fontSize: 11, lineHeight: 15 },
  statePanel: { minHeight: 62, borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  stateCopy: { flex: 1, gap: 4 },
  stateTitle: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.8, fontWeight: '800' },
  stateText: { fontFamily: typography.body, fontSize: 10, lineHeight: 14 },
  retryText: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.7, fontWeight: '800' },
  statusPanel: { borderWidth: 1, borderRadius: 17, padding: 14 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  statusTitle: { fontFamily: typography.bodyBold, fontSize: 15, fontWeight: '800', marginTop: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'stretch', marginTop: 17 },
  statCell: { flex: 1, gap: 4 },
  statDivider: { width: 1, marginHorizontal: 9 },
  statLabel: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.8, fontWeight: '700', marginTop: 2 },
  statValue: { fontFamily: typography.bodyBold, fontSize: 14, fontWeight: '800' },
  statHint: { fontFamily: typography.body, fontSize: 8 },
  progressPanel: { borderWidth: 1, borderRadius: 16, padding: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressTitle: { fontFamily: typography.bodyBold, fontSize: 15, fontWeight: '800', marginTop: 6 },
  progressValue: { fontFamily: typography.bodyBold, fontSize: 12, fontWeight: '800', marginTop: 5 },
  progressTrack: { height: 7, borderRadius: 5, overflow: 'hidden', marginTop: 14 },
  progressFill: { height: '100%', borderRadius: 5 },
  progressMeta: { fontFamily: typography.body, fontSize: 8, marginTop: 8 },
  activitySignal: { minHeight: 58, borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 9 },
  activityCopy: { flex: 1, gap: 4 },
  activityText: { fontFamily: typography.bodyBold, fontSize: 11, fontWeight: '700' },
  activityTime: { fontFamily: typography.body, fontSize: 8 },
  secondaryLinks: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  secondaryLink: { flex: 1, minHeight: 40, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  secondaryLinkText: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.5, fontWeight: '800' },
});