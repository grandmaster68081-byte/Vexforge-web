import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
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
import { ForgeButton } from '@/components/ForgeButton';
import { Ionicons } from '@/components/ForgeIcon';
import { ForgeMark } from '@/components/ForgeMark';
import { ForgeText } from '@/components/ForgeText';
import { ProgressBar } from '@/components/ProgressBar';
import { ScreenShell } from '@/components/ScreenShell';
import { CANONICAL_BACKGROUNDS, FACTION_BACKGROUNDS } from '@/constants/visual';
import { typography } from '@/constants/typography';

type HomeSnapshot = {
  stats: HomeStats | null;
  dailyCard: DailyCard | null;
  missions: HomeMission[];
  activity: ActivityItem[];
};

type DomainRoute = '/collection' | '/deck' | '/world' | '/social' | '/profile';
type DomainTone = 'accent' | 'primary' | 'success' | 'danger' | 'rarityEpic' | 'rarityRare';

const DOMAIN_POINTS: Array<{
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  route: DomainRoute;
  tone: DomainTone;
}> = [
  { name: 'Cartas', subtitle: 'ARMERÍA', description: 'Inspecciona tus entidades y el archivo vivo.', icon: 'cards', route: '/collection', tone: 'rarityRare' },
  { name: 'Forja', subtitle: 'FORMACIÓN', description: 'Prepara la alineación que irá al frente.', icon: 'deck', route: '/deck', tone: 'primary' },
  { name: 'Mundo', subtitle: 'FRONTERA', description: 'Sigue temporadas, jefes y expediciones.', icon: 'map', route: '/world', tone: 'danger' },
  { name: 'Social', subtitle: 'CONVERGENCIA', description: 'Conecta con otros Forjadores y clanes.', icon: 'people-outline', route: '/social', tone: 'success' },
  { name: 'Perfil', subtitle: 'IDENTIDAD', description: 'Consulta tu rango, progreso y logros.', icon: 'profile', route: '/profile', tone: 'rarityEpic' },
];

function countdown(iso: string) {
  const remaining = new Date(iso).getTime() - Date.now();
  if (remaining <= 0) return 'Finalizado';
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

function SceneOrbitPoint({
  point,
  position,
  colors,
  onPress,
}: {
  point: (typeof DOMAIN_POINTS)[number];
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'bottomCenter';
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const toneColor = colors[point.tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${point.name}: ${point.description}`}
      testID={`home-domain-${point.name.toLowerCase()}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.orbitPoint,
        styles[`orbitPoint${position[0].toUpperCase()}${position.slice(1)}` as 'orbitPointTopLeft'],
        { opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.93 : 1 }] },
      ]}
    >
      <View style={[styles.orbitSeal, { borderColor: `${toneColor}A8`, backgroundColor: `${colors.ink}E6`, shadowColor: toneColor }]}>
        <View style={[styles.orbitSealInner, { borderColor: `${toneColor}66`, backgroundColor: `${toneColor}18` }]}>
          <Ionicons name={point.icon} size={18} color={toneColor} />
        </View>
      </View>
      <Text style={[styles.orbitLabel, { color: colors.foreground }]}>{point.name.toUpperCase()}</Text>
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
  const [featuredCardImageFailed, setFeaturedCardImageFailed] = useState(false);
  const [homeSceneState, setHomeSceneState] = useState<'loading' | 'ready' | 'error'>('loading');
  const scrollY = useSharedValue(0);
  const ambientMotion = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      ambientMotion.value = 0;
      return;
    }
    ambientMotion.value = withRepeat(
      withSequence(withTiming(1, { duration: 10000 }), withTiming(0, { duration: 10000 })),
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
      { translateY: interpolate(scrollY.value, [0, 700], [0, 74]) },
      { scale: interpolate(scrollY.value, [0, 700], [1.06, 1.14]) },
    ],
  }));

  const factionParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, 700], [0, 38]) },
      { scale: interpolate(scrollY.value, [0, 700], [1.08, 1.18]) },
    ],
  }));

  const ambientGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ambientMotion.value, [0, 1], [0.18, 0.5]),
    transform: [
      { translateY: interpolate(ambientMotion.value, [0, 1], [8, -12]) },
      { scale: interpolate(ambientMotion.value, [0, 1], [0.86, 1.08]) },
    ],
  }));

  const focalMotionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(ambientMotion.value, [0, 1], [4, -4]) },
      { rotate: `${interpolate(ambientMotion.value, [0, 1], [-1, 1])}deg` },
    ],
  }));

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
  useEffect(() => { setFeaturedCardImageFailed(false); }, [home.dailyCard?.image_url]);

  const handleRefresh = () => { void Promise.all([refresh(), loadHome()]); };
  const displayName = player?.display_name?.trim() || 'FORJADOR';
  const event = home.stats?.active_event;
  const frontName = event?.name ?? home.stats?.season?.name ?? 'Arena Nexus';
  const energyPercent = progress ? Math.min(100, Math.round((progress.energy / Math.max(1, progress.max_energy)) * 100)) : 0;
  const featuredCard = home.dailyCard;
  const factionScene = featuredCard?.faction
    ? FACTION_BACKGROUNDS[featuredCard.faction as keyof typeof FACTION_BACKGROUNDS]
    : null;
  const nexusStatus = syncState === 'connected'
    ? { label: 'NEXUS ONLINE', color: colors.success }
    : syncState === 'loading'
      ? { label: 'SINCRONIZANDO', color: colors.accent }
      : { label: 'NEXUS OFFLINE', color: colors.danger };
  const xpPercent = progress
    ? Math.min(100, Math.round((progress.xp / Math.max(1, progress.xp_to_next)) * 100))
    : 0;
  const tutorialStep = progress?.tutorial_step;
  const tutorialComplete = tutorialStep != null && tutorialStep >= TUTORIAL_DONE_STEP;
  const tutorialPercent = tutorialStep == null
    ? 0
    : tutorialComplete
      ? 100
      : Math.min(100, Math.round((tutorialStep / Math.max(1, TUTORIAL_TOTAL_STEPS - 1)) * 100));

  return (
    <ScreenShell surface="home" sceneMode="hero">
      <Animated.ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: insets.bottom + 108 }}
        refreshControl={<RefreshControl refreshing={homeLoading || syncState === 'loading'} onRefresh={handleRefresh} tintColor={colors.accent} />}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(500)} style={[styles.scene, { borderBottomColor: colors.border }]}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, sceneParallaxStyle]}>
            <Image
              source={{ uri: CANONICAL_BACKGROUNDS.home }}
              style={[StyleSheet.absoluteFillObject, styles.sceneImage]}
              resizeMode="cover"
              accessibilityLabel="Escena oficial de la Forja"
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
            />
          ) : null}
          <LinearGradient
            colors={[`${colors.ink}B8`, `${colors.ink}18`, `${colors.background}EC`]}
            locations={[0, 0.38, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={[`${colors.primary}38`, 'transparent', `${colors.accent}18`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Animated.View pointerEvents="none" style={[styles.sceneGlow, { backgroundColor: colors.accent }, ambientGlowStyle]} />
          <View pointerEvents="none" style={[styles.sceneFrame, { borderColor: `${colors.accent}20` }]} />

          <View style={[styles.sceneContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.topBar}>
              <View style={styles.brand}>
                <ForgeMark />
                <View>
                  <Text style={[styles.brandName, { color: colors.accent }]}>VEXFORGE</Text>
                  <Text style={[styles.brandSubline, { color: colors.mutedForeground }]}>FOJA // NEXUS 01</Text>
                </View>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" onPress={() => router.push('/profile')} style={({ pressed }) => [styles.profileOrb, { borderColor: `${colors.accent}66`, backgroundColor: `${colors.ink}B8`, opacity: pressed ? 0.72 : 1 }]}>
                <Ionicons name="profile" size={19} color={colors.foreground} />
                <View style={[styles.notificationDot, { backgroundColor: colors.accent }]} />
              </Pressable>
            </View>

            <View style={[styles.playerRibbon, { borderColor: `${colors.accent}52`, backgroundColor: `${colors.ink}A6` }]}>
              <View style={[styles.playerGlyph, { borderColor: `${colors.accent}7A`, backgroundColor: `${colors.accent}20` }]}>
                <Ionicons name="profile" size={17} color={colors.accent} />
              </View>
              <View style={styles.playerCopy}>
                <Text style={[styles.ribbonLabel, { color: colors.mutedForeground }]}>FORJADOR ACTIVO</Text>
                <Text style={[styles.playerName, { color: colors.foreground }]} numberOfLines={1}>{displayName}</Text>
              </View>
              <View style={styles.vexCopy}>
                <Text style={[styles.ribbonLabel, { color: colors.mutedForeground }]}>VEX</Text>
                <Text style={[styles.vexValue, { color: colors.accent }]}>{(wallet?.vex_ingame ?? 0).toLocaleString('es')}</Text>
              </View>
            </View>

            <View style={styles.sceneSignal}>
              <View style={[styles.signalDot, { backgroundColor: nexusStatus.color }]} />
              <Text style={[styles.signalText, { color: nexusStatus.color }]}>{nexusStatus.label}</Text>
              <View style={[styles.signalRule, { backgroundColor: `${colors.accent}4A` }]} />
              <Text style={[styles.signalText, { color: colors.mutedForeground }]}>BASE FOJA</Text>
            </View>

            {homeSceneState === 'loading' ? (
              <View style={[styles.sceneNotice, { borderColor: `${colors.accent}66`, backgroundColor: `${colors.panelStrong}D9` }]}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={[styles.sceneNoticeText, { color: colors.mutedForeground }]}>CARGANDO LA FORJA</Text>
              </View>
            ) : homeSceneState === 'error' ? (
              <View accessibilityRole="alert" style={[styles.sceneNotice, { borderColor: colors.danger, backgroundColor: `${colors.danger}1A` }]}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                <Text style={[styles.sceneNoticeText, { color: colors.foreground }]}>ARTE OFICIAL NO DISPONIBLE</Text>
              </View>
            ) : null}

            <View style={styles.sceneHeading}>
              <SectionLabel color={colors.accent}>EL NEXUS · FORJA VIVA</SectionLabel>
              <ForgeText variant="display" style={[styles.sceneTitle, { color: colors.foreground }]}>La arena{'\n'}te está llamando.</ForgeText>
              <Text style={[styles.sceneDescription, { color: colors.mutedForeground }]}>Una base para volver. Un frente para conquistar.</Text>
            </View>

            <View style={styles.sceneStage}>
              <View pointerEvents="none" style={[styles.stageRingOuter, { borderColor: `${colors.accent}35` }]} />
              <View pointerEvents="none" style={[styles.stageRingInner, { borderColor: `${colors.accent}24` }]} />
              <SceneOrbitPoint point={DOMAIN_POINTS[0]} position="topLeft" colors={colors} onPress={() => router.push(DOMAIN_POINTS[0].route)} />
              <SceneOrbitPoint point={DOMAIN_POINTS[1]} position="topRight" colors={colors} onPress={() => router.push(DOMAIN_POINTS[1].route)} />
              <SceneOrbitPoint point={DOMAIN_POINTS[2]} position="bottomLeft" colors={colors} onPress={() => router.push(DOMAIN_POINTS[2].route)} />
              <SceneOrbitPoint point={DOMAIN_POINTS[3]} position="bottomRight" colors={colors} onPress={() => router.push(DOMAIN_POINTS[3].route)} />
              <SceneOrbitPoint point={DOMAIN_POINTS[4]} position="bottomCenter" colors={colors} onPress={() => router.push(DOMAIN_POINTS[4].route)} />
              <Animated.View style={[styles.stageArtifact, focalMotionStyle]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={featuredCard ? `Inspeccionar ${featuredCard.name}` : 'Abrir colección'}
                  testID="home-featured-card"
                  onPress={() => router.push('/collection')}
                  style={({ pressed }) => [styles.stageCard, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                >
                  <View style={[styles.artifactFrameLarge, { borderColor: colors.accent, shadowColor: colors.accent }]}>
                    {featuredCard?.image_url && !featuredCardImageFailed ? (
                      <Image
                        source={{ uri: featuredCard.image_url }}
                        style={styles.artifactImage}
                        resizeMode="cover"
                        accessibilityLabel={`Arte de ${featuredCard.name}`}
                        onError={() => setFeaturedCardImageFailed(true)}
                      />
                    ) : (
                      <View style={[styles.artifactFallback, { backgroundColor: `${colors.muted}D9` }]}>
                        <Ionicons name="card" size={27} color={colors.accent} />
                        <Text style={[styles.artifactFallbackText, { color: colors.mutedForeground }]}>{featuredCardImageFailed ? 'ARTE NO DISPONIBLE' : 'ARTE PENDIENTE'}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.artifactKicker, { color: colors.accent }]}>RELIQUIA EN ROTACIÓN</Text>
                  <Text style={[styles.stageArtifactName, { color: colors.foreground }]} numberOfLines={1}>{featuredCard?.name ?? 'Carta del día'}</Text>
                  <Text style={[styles.stageArtifactMeta, { color: colors.mutedForeground }]}>{featuredCard ? `${featuredCard.faction} · ${featuredCard.rarity}` : 'Sincronizando'}</Text>
                </Pressable>
              </Animated.View>
            </View>

            <View style={[styles.frontPanel, { borderColor: `${colors.accent}85`, backgroundColor: `${colors.ink}C9` }]}>
              <View style={styles.frontPanelCopy}>
                <Text style={[styles.frontKicker, { color: colors.accent }]}>FRENTE ACTIVO</Text>
                <Text style={[styles.frontTitle, { color: colors.foreground }]} numberOfLines={1}>{frontName}</Text>
              </View>
              {event ? (
                <View style={styles.frontTimer}>
                  <Text style={[styles.frontTimerLabel, { color: colors.mutedForeground }]}>TERMINA EN</Text>
                  <Text style={[styles.frontTimerValue, { color: colors.accent }]}>{countdown(event.ends_at)}</Text>
                </View>
              ) : <Text style={[styles.frontTimerValue, { color: colors.mutedForeground }]}>SIN FRENTE ACTIVO</Text>}
            </View>

            <View style={[styles.sceneProgress, { borderColor: `${colors.accent}52`, backgroundColor: `${colors.ink}B8` }]}>
              <View style={styles.sceneProgressHeader}>
                <View>
                  <Text style={[styles.sceneProgressLabel, { color: colors.mutedForeground }]}>PULSO DEL FORJADOR</Text>
                  <Text style={[styles.sceneProgressTitle, { color: colors.foreground }]}>
                    {progress ? `NIVEL ${progress.level}` : 'PROGRESO NO DISPONIBLE'}
                  </Text>
                </View>
                <Text style={[styles.sceneProgressValue, { color: colors.accent }]}>
                  {progress ? `${progress.xp}/${progress.xp_to_next} XP` : '—'}
                </Text>
              </View>
              <View style={[styles.sceneProgressTrack, { backgroundColor: `${colors.foreground}18` }]}>
                <View style={[styles.sceneProgressFill, { width: `${xpPercent}%`, backgroundColor: colors.accent }]} />
              </View>
              <Text style={[styles.sceneProgressMeta, { color: colors.mutedForeground }]}>
                {tutorialStep == null
                  ? 'Sincroniza tu progreso para continuar.'
                  : tutorialComplete
                    ? 'Rito de entrada completado · el Nexus está abierto.'
                    : `Rito de entrada · paso ${Math.min(tutorialStep + 1, TUTORIAL_TOTAL_STEPS)} de ${TUTORIAL_TOTAL_STEPS} · ${tutorialPercent}%`}
              </Text>
            </View>

            <View style={styles.primaryAction}>
              <ForgeButton label="ENTRAR A LA ARENA" icon="arena" onPress={() => router.push('/battle')} testID="home-battle" />
            </View>

            <View style={styles.sceneHint}>
              <Ionicons name="compass-outline" size={16} color={colors.accent} />
              <Text style={[styles.sceneHintText, { color: colors.mutedForeground }]}>DESLIZA PARA EXPLORAR LA FORJA</Text>
              <Ionicons name="arrow-down-outline" size={15} color={colors.accent} />
            </View>
          </View>
        </Animated.View>

        <View style={styles.content}>
          {homeError ? (
            <View style={[styles.errorBar, { borderColor: colors.danger, backgroundColor: `${colors.danger}16` }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.foreground }]}>{homeError}</Text>
              <Pressable accessibilityRole="button" testID="home-retry" onPress={() => void loadHome()}>
                <Text style={[styles.retryText, { color: colors.accent }]}>REINTENTAR</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={[styles.returnPanel, { borderColor: colors.border, backgroundColor: colors.panelStrong }]}>
            <View style={styles.returnHeader}>
              <View>
                <SectionLabel color={colors.accent}>REGRESO A FOJA</SectionLabel>
                <Text style={[styles.returnTitle, { color: colors.foreground }]}>La base recuerda tu pulso.</Text>
              </View>
              <View style={[styles.connectionMark, { backgroundColor: syncState === 'connected' ? `${colors.success}1A` : `${colors.danger}1A`, borderColor: syncState === 'connected' ? `${colors.success}66` : `${colors.danger}66` }]}>
                <View style={[styles.connectionDot, { backgroundColor: syncState === 'connected' ? colors.success : syncState === 'loading' ? colors.accent : colors.danger }]} />
                <Text style={[styles.connectionText, { color: syncState === 'connected' ? colors.success : colors.mutedForeground }]}>{syncState === 'connected' ? 'ONLINE' : syncState === 'loading' ? 'SYNC' : 'OFFLINE'}</Text>
              </View>
            </View>

            <View style={styles.loopRow}>
              <View style={styles.loopCell}>
                <Ionicons name="energy" size={17} color={colors.success} />
                <Text style={[styles.loopLabel, { color: colors.mutedForeground }]}>ENERGÍA</Text>
                <Text style={[styles.loopValue, { color: colors.foreground }]}>{progress ? `${progress.energy}/${progress.max_energy}` : '—'}</Text>
                <ProgressBar value={energyPercent} color={colors.success} />
              </View>
              <View style={[styles.loopDivider, { backgroundColor: colors.border }]} />
              <View style={styles.loopCell}>
                <Ionicons name="layers-outline" size={17} color={colors.accent} />
                <Text style={[styles.loopLabel, { color: colors.mutedForeground }]}>CARTAS</Text>
                <Text style={[styles.loopValue, { color: colors.foreground }]}>{stats?.cards_owned ?? '—'}</Text>
                <Text style={[styles.loopHint, { color: colors.mutedForeground }]}>coleccionadas</Text>
              </View>
              <View style={[styles.loopDivider, { backgroundColor: colors.border }]} />
              <View style={styles.loopCell}>
                <Ionicons name="wallet-outline" size={17} color={colors.accent} />
                <Text style={[styles.loopLabel, { color: colors.mutedForeground }]}>VEX</Text>
                <Text style={[styles.loopValue, { color: colors.foreground }]}>{(wallet?.vex_ingame ?? 0).toLocaleString('es')}</Text>
                <Text style={[styles.loopHint, { color: colors.mutedForeground }]}>disponible</Text>
              </View>
            </View>
          </View>

          {event ? (
            <View style={[styles.eventPanel, { borderColor: colors.accent, backgroundColor: colors.panel }]}>
              <View style={styles.eventPanelTop}>
                <View style={styles.eventPanelCopy}>
                  <SectionLabel color={colors.accent}>ACTIVIDAD DEL FRENTE</SectionLabel>
                  <Text style={[styles.eventPanelTitle, { color: colors.foreground }]}>{event.name}</Text>
                  <Text style={[styles.eventPanelBody, { color: colors.mutedForeground }]}>Progreso global de temporada</Text>
                </View>
                <Text style={[styles.eventPercent, { color: colors.accent }]}>{event.progress ?? 0}%</Text>
              </View>
              <ProgressBar value={Math.max(0, Math.min(100, event.progress ?? 0))} color={colors.accent} />
              <Pressable accessibilityRole="button" testID="home-event-arena" onPress={() => router.push('/battle')} style={({ pressed }) => [styles.eventLink, { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[styles.eventLinkText, { color: colors.accent }]}>VER EL FRENTE</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.accent} />
              </Pressable>
            </View>
          ) : null}

          {home.missions.length > 0 ? (
            <View style={[styles.signalPanel, { borderColor: colors.border, backgroundColor: colors.panel }]}>
              <View style={styles.signalPanelIcon}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
              </View>
              <View style={styles.signalPanelCopy}>
                <SectionLabel color={colors.success}>MISIÓN DISPONIBLE</SectionLabel>
                <Text style={[styles.signalPanelTitle, { color: colors.foreground }]} numberOfLines={1}>{home.missions[0].name}</Text>
                <Text style={[styles.signalPanelMeta, { color: colors.mutedForeground }]}>{home.missions[0].difficulty ?? 'Misión'} · +{home.missions[0].reward_vex_ingame ?? 0} VEX</Text>
              </View>
              <Pressable accessibilityRole="button" testID="home-missions" onPress={() => router.push('/missions')} style={({ pressed }) => [styles.signalPanelAction, { borderColor: colors.success, opacity: pressed ? 0.72 : 1 }]}>
                <Ionicons name="arrow-forward" size={16} color={colors.success} />
              </Pressable>
            </View>
          ) : null}

          {home.activity[0] ? (
            <View style={[styles.activitySignal, { borderColor: colors.border, backgroundColor: colors.panel }]}>
              <Ionicons name="sparkles-outline" size={17} color={colors.accent} />
              <View style={styles.activitySignalCopy}>
                <SectionLabel color={colors.accent}>ÚLTIMA SEÑAL</SectionLabel>
                <Text style={[styles.activitySignalText, { color: colors.foreground }]} numberOfLines={1}>{home.activity[0].text}</Text>
              </View>
              <Text style={[styles.activitySignalTime, { color: colors.mutedForeground }]}>{timeAgo(home.activity[0].time)}</Text>
            </View>
          ) : !homeLoading ? (
            <View style={[styles.activitySignal, { borderColor: colors.border, backgroundColor: colors.panel }]}>
              <Ionicons name="radio-outline" size={17} color={colors.mutedForeground} />
              <View style={styles.activitySignalCopy}>
                <SectionLabel color={colors.mutedForeground}>ÚLTIMA SEÑAL</SectionLabel>
                <Text style={[styles.activitySignalText, { color: colors.mutedForeground }]}>El Nexus espera tu próxima acción.</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.secondaryLinks}>
            <Pressable accessibilityRole="button" testID="home-forge-store" onPress={() => router.push('/store')} style={({ pressed }) => [styles.secondaryLink, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
              <Ionicons name="shop" size={15} color={colors.accent} />
              <Text style={[styles.secondaryLinkText, { color: colors.foreground }]}>FORJA Y RECURSOS</Text>
            </Pressable>
            <Pressable accessibilityRole="button" testID="home-economy" onPress={() => router.push('/economy')} style={({ pressed }) => [styles.secondaryLink, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
              <Ionicons name="wallet-outline" size={15} color={colors.accent} />
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
  scene: { minHeight: 700, overflow: 'hidden', borderBottomWidth: 1, shadowColor: '#000000', shadowOpacity: 0.52, shadowRadius: 28, shadowOffset: { width: 0, height: 18 }, elevation: 10 },
  sceneImage: { opacity: 0.96 },
  sceneFactionImage: { opacity: 0.36 },
  sceneContent: { paddingHorizontal: 20, paddingBottom: 20 },
  sceneGlow: { position: 'absolute', width: 320, height: 320, borderRadius: 160, top: 250, right: -150 },
  sceneFrame: { position: 'absolute', left: 12, right: 12, top: 12, bottom: 12, borderWidth: 1, borderRadius: 24 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandName: { fontFamily: typography.bodyBold, fontSize: 15, fontWeight: '800', letterSpacing: 3 },
  brandSubline: { fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 1.8, marginTop: 3 },
  profileOrb: { width: 42, height: 42, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', top: 8, right: 8 },
  playerRibbon: { minHeight: 54, borderWidth: 1, borderRadius: 15, paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  playerGlyph: { width: 34, height: 34, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  playerCopy: { flex: 1, marginLeft: 9 },
  ribbonLabel: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 1, fontWeight: '700' },
  playerName: { fontFamily: typography.bodyBold, fontSize: 13, fontWeight: '800', marginTop: 2 },
  vexCopy: { alignItems: 'flex-end', paddingLeft: 10 },
  vexValue: { fontFamily: typography.bodyBold, fontSize: 14, fontWeight: '800', marginTop: 2 },
  sceneSignal: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 17 },
  signalDot: { width: 7, height: 7, borderRadius: 4 },
  signalText: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 1.1 },
  signalRule: { flex: 1, height: 1, marginHorizontal: 2 },
  sceneNotice: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7, marginTop: 15 },
  sceneNoticeText: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.75 },
  sceneHeading: { marginTop: 22 },
  eyebrow: { fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 1.5, fontWeight: '800' },
  sceneTitle: { fontFamily: typography.display, fontSize: 36, lineHeight: 40, fontWeight: '700', marginTop: 8, textShadowColor: 'rgba(0,0,0,0.58)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 14 },
  sceneDescription: { fontFamily: typography.body, fontSize: 13, lineHeight: 18, maxWidth: 285, marginTop: 8 },
  sceneStage: { height: 230, marginTop: 13, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  stageRingOuter: { position: 'absolute', width: 198, height: 198, top: 11, borderWidth: 1, borderRadius: 99 },
  stageRingInner: { position: 'absolute', width: 146, height: 146, top: 37, borderWidth: 1, borderRadius: 73 },
  stageArtifact: { position: 'absolute', top: 15, left: 72, right: 72, alignItems: 'center', zIndex: 2 },
  stageCard: { alignItems: 'center' },
  artifactFrameLarge: { width: 88, height: 123, borderWidth: 1, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.42, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  artifactImage: { width: '100%', height: '100%' },
  artifactFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 5 },
  artifactFallbackText: { fontFamily: typography.bodyBold, fontSize: 6, letterSpacing: 0.45, textAlign: 'center' },
  artifactKicker: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.8, fontWeight: '800' },
  stageArtifactName: { fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 14, fontWeight: '800', maxWidth: 118, marginTop: 2 },
  stageArtifactMeta: { fontFamily: typography.body, fontSize: 8, marginTop: 2 },
  orbitPoint: { position: 'absolute', width: 66, alignItems: 'center', gap: 4, zIndex: 3 },
  orbitPointTopLeft: { left: 0, top: 19 },
  orbitPointTopRight: { right: 0, top: 19 },
  orbitPointBottomLeft: { left: 2, bottom: 14 },
  orbitPointBottomRight: { right: 2, bottom: 14 },
  orbitPointBottomCenter: { left: '50%', marginLeft: -33, bottom: -2 },
  orbitSeal: { width: 46, height: 46, borderWidth: 1, borderRadius: 23, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.32, shadowRadius: 14, elevation: 6 },
  orbitSealInner: { width: 34, height: 34, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  orbitLabel: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.85, fontWeight: '800' },
  frontPanel: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11 },
  frontPanelCopy: { flex: 1 },
  frontKicker: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 1.1, fontWeight: '800' },
  frontTitle: { fontFamily: typography.bodyBold, fontSize: 13, fontWeight: '800', marginTop: 3 },
  frontTimer: { alignItems: 'flex-end', paddingLeft: 10 },
  frontTimerLabel: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.8, fontWeight: '700' },
  frontTimerValue: { fontFamily: typography.bodyBold, fontSize: 10, fontWeight: '800', marginTop: 3, textAlign: 'right' },
  sceneProgress: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 9, marginTop: 10 },
  sceneProgressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sceneProgressLabel: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 1, fontWeight: '800' },
  sceneProgressTitle: { fontFamily: typography.bodyBold, fontSize: 12, fontWeight: '800', marginTop: 3 },
  sceneProgressValue: { fontFamily: typography.bodyBold, fontSize: 10, fontWeight: '800' },
  sceneProgressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 8 },
  sceneProgressFill: { height: '100%', borderRadius: 2 },
  sceneProgressMeta: { fontFamily: typography.body, fontSize: 8, marginTop: 6 },
  primaryAction: { marginTop: 11 },
  sceneHint: { minHeight: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  sceneHintText: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 1, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 9, gap: 14 },
  errorBar: { minHeight: 48, borderWidth: 1, borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  errorText: { flex: 1, fontFamily: typography.body, fontSize: 11, lineHeight: 15 },
  retryText: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.7, fontWeight: '800' },
  returnPanel: { borderWidth: 1, borderRadius: 17, padding: 15 },
  returnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  returnTitle: { fontFamily: typography.bodyBold, fontSize: 15, fontWeight: '800', marginTop: 6 },
  connectionMark: { minHeight: 25, borderWidth: 1, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7 },
  connectionDot: { width: 6, height: 6, borderRadius: 3 },
  connectionText: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.6, fontWeight: '800' },
  loopRow: { flexDirection: 'row', alignItems: 'stretch', marginTop: 17 },
  loopCell: { flex: 1, gap: 4 },
  loopDivider: { width: 1, marginHorizontal: 10 },
  loopLabel: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.8, fontWeight: '700', marginTop: 2 },
  loopValue: { fontFamily: typography.bodyBold, fontSize: 15, fontWeight: '800' },
  loopHint: { fontFamily: typography.body, fontSize: 8 },
  eventPanel: { borderWidth: 1, borderRadius: 16, padding: 15 },
  eventPanelTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  eventPanelCopy: { flex: 1 },
  eventPanelTitle: { fontFamily: typography.bodyBold, fontSize: 17, lineHeight: 21, fontWeight: '800', marginTop: 7 },
  eventPanelBody: { fontFamily: typography.body, fontSize: 10, marginTop: 4 },
  eventPercent: { fontFamily: typography.bodyBold, fontSize: 16, fontWeight: '800' },
  eventLink: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 13 },
  eventLinkText: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.7, fontWeight: '800' },
  signalPanel: { minHeight: 72, borderWidth: 1, borderRadius: 15, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  signalPanelIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(73, 186, 122, 0.12)', alignItems: 'center', justifyContent: 'center' },
  signalPanelCopy: { flex: 1, gap: 4 },
  signalPanelTitle: { fontFamily: typography.bodyBold, fontSize: 12, fontWeight: '800' },
  signalPanelMeta: { fontFamily: typography.body, fontSize: 9 },
  signalPanelAction: { width: 31, height: 31, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activitySignal: { minHeight: 58, borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 9 },
  activitySignalCopy: { flex: 1, gap: 4 },
  activitySignalText: { fontFamily: typography.bodyBold, fontSize: 11, fontWeight: '700' },
  activitySignalTime: { fontFamily: typography.body, fontSize: 8 },
  secondaryLinks: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  secondaryLink: { flex: 1, minHeight: 39, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  secondaryLinkText: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.5, fontWeight: '800' },
});