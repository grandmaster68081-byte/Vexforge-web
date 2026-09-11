import { useCallback, useEffect, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp, useAnimatedScrollHandler, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
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
type HomeRoute = '/' | '/battle' | '/collection' | '/deck' | '/missions' | '/profile' | '/meta' | '/world' | '/tutorial' | '/economy' | '/store?mode=fusion' | '/store?mode=shop' | '/store?mode=evolution' | '/store?mode=packs';
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
  if (days > 0) return `${days}D ${hours % 24}H`;
  return `${hours}H ${Math.floor((remaining % 3600000) / 60000)}M`;
}

function capitalize(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  if (!normalized) return fallback;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function Icon({ name, color, size = 18, style }: { name: IconName; color: string; size?: number; style?: StyleProp<ViewStyle> }) {
  return <VexIcon name={name} color={color} size={size} style={style} />;
}

function GlassButton({
  label,
  icon,
  onPress,
  tone = 'gold',
  testID,
  large = false,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  tone?: 'gold' | 'violet' | 'blue' | 'quiet';
  testID: string;
  large?: boolean;
}) {
  const colors = useColors();
  const palette = {
    gold: { fill: colors.accent, border: colors.accent, text: colors.ink },
    violet: { fill: `${colors.rarityEpic}1C`, border: `${colors.rarityEpic}CC`, text: colors.foreground },
    blue: { fill: `${colors.rarityRare}18`, border: `${colors.rarityRare}AA`, text: colors.foreground },
    quiet: { fill: `${colors.panelStrong}42`, border: `${colors.border}CC`, text: colors.foreground },
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        styles.glassButton,
        large && styles.glassButtonLarge,
        { backgroundColor: palette.fill, borderColor: palette.border, opacity: pressed ? 0.76 : 1 },
      ]}
    >
      <View style={[styles.glassButtonGlyph, { borderColor: `${palette.border}CC`, backgroundColor: `${palette.border}24` }]}>
        <Icon name={icon} color={palette.text} size={large ? 17 : 15} />
        <View style={[styles.glassButtonGlyphDot, { backgroundColor: palette.text }]} />
      </View>
      <Text style={[styles.glassButtonText, { color: palette.text }]}>{label}</Text>
      <Text style={[styles.glassButtonMeta, { color: `${palette.text}A8` }]}>GATE</Text>
    </Pressable>
  );
}

function HeroPrimaryButton({ label, icon, onPress, testID }: { label: string; icon: IconName; onPress: () => void; testID: string }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [styles.heroPrimaryButtonPressable, { opacity: pressed ? 0.82 : 1 }]}
    >
      <LinearGradient colors={[colors.accent, '#C9901F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroPrimaryButton}>
        <View style={[styles.heroActionIconFrame, { borderColor: `${colors.ink}70`, backgroundColor: `${colors.ink}12` }]}>
          <Icon name={icon} color={colors.ink} size={17} />
        </View>
        <View style={styles.heroActionCopy}>
          <Text style={[styles.heroPrimaryButtonText, { color: colors.ink }]}>{label}</Text>
          <Text style={[styles.heroActionMeta, { color: `${colors.ink}B8` }]}>ACCESO PRINCIPAL</Text>
        </View>
        <View style={[styles.heroPrimaryButtonMark, { borderColor: `${colors.ink}5C` }]}>
          <Icon name="arrow-up" color={colors.ink} size={11} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function HeroSecondaryButton({ label, icon, onPress, testID }: { label: string; icon: IconName; onPress: () => void; testID: string }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        styles.heroSecondaryButton,
        { borderColor: `${colors.foreground}70`, backgroundColor: `${colors.ink}8C`, opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <View style={[styles.heroSecondaryIconFrame, { borderColor: `${colors.foreground}72` }]}>
        <Icon name={icon} color={colors.foreground} size={15} />
      </View>
      <View style={styles.heroActionCopy}>
        <Text style={[styles.heroSecondaryButtonText, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.heroActionMeta, { color: `${colors.foreground}98` }]}>CONTINUAR</Text>
      </View>
    </Pressable>
  );
}

function SectionHeading({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionHeadingCopy}>
        <View style={styles.sectionKicker}>
          <View style={[styles.sectionKickerLine, { backgroundColor: `${colors.accent}A8` }]} />
          <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {action && onAction ? (
        <Pressable accessibilityRole="button" accessibilityLabel={action} accessibilityHint="Abre esta región del Nexus" onPress={onAction} style={styles.sectionAction}>
          <View style={[styles.sectionGatewayFrame, { borderColor: `${colors.accent}72`, backgroundColor: `${colors.accent}12` }]}>
            <Icon name="arrow-up" color={colors.accent} size={14} />
          </View>
          <View style={[styles.sectionGatewaySignal, { backgroundColor: `${colors.accent}A8` }]} />
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
  const pulse = useSharedValue(0);
  const orbit = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const [heroAssetState, setHeroAssetState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sentinelAssetState, setSentinelAssetState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [featuredAssetState, setFeaturedAssetState] = useState<'loading' | 'ready' | 'error'>('loading');

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
    opacity: 0.36 + pulse.value * 0.28,
    transform: [{ scale: 0.88 + pulse.value * 0.16 }],
  }));
  const heroParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: scrollY.value * 0.12 },
      { scale: 1.04 + Math.min(scrollY.value / 2400, 0.08) },
    ],
  }));
  const featuredSheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (orbit.value * 2 - 1) * 150 }, { rotate: '-24deg' }],
  }));
  const sentinelParallaxStyle = useAnimatedStyle(() => ({
    opacity: 0.92,
    transform: [
      { translateY: scrollY.value * 0.22 },
      { translateX: Math.sin(orbit.value * Math.PI * 2) * 3 },
      { scale: 1.02 + pulse.value * 0.025 },
    ],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    opacity: 0.26 + pulse.value * 0.28,
    transform: [{ rotate: `${orbit.value * 360}deg` }, { scale: 0.9 + pulse.value * 0.08 }],
  }));
  const activeCard = home.card ?? featuredCards[0] ?? null;
  const playerName = capitalize(player?.display_name, 'Forjador');
  const activeEvent = home.stats?.active_event ?? null;
  const season = home.stats?.season ?? null;
  const xp = progress?.xp ?? 0;
  const xpToNext = progress?.xp_to_next ?? 0;
  const connectionLabel = syncState === 'connected' ? 'NEXUS ONLINE' : syncState === 'offline' ? 'NEXUS OFFLINE' : 'SINCRONIZANDO';
  const connectionColor = syncState === 'connected' ? colors.success : syncState === 'offline' ? colors.danger : colors.accent;
  const viewportPadding = Math.max(18, Math.min(26, width * 0.06));
  const heroHeight = Math.min(648, Math.max(586, width * 1.43));
  const ranking = home.stats?.top3 ?? [];
  const hasPlayerData = Boolean(player || progress || wallet || playerStats);
  const domainPortals: Array<{ id: string; label: string; title: string; status: string; icon: IconName; route: HomeRoute; color: string }> = [
    { id: 'arena', label: 'ARENA', title: 'Cruza el umbral', status: home.stats?.active_event ? 'EVENTO ACTIVO' : 'OPONENTES EN ESPERA', icon: 'target', route: '/battle', color: colors.rarityRare },
    { id: 'forge', label: 'FORJA', title: 'Traza tu formación', status: `NIVEL ${formatNumber(progress?.level)} · MAZO ACTIVO`, icon: 'deck', route: '/deck', color: colors.rarityEpic },
    { id: 'archive', label: 'ARCHIVO', title: 'Revela tu colección', status: `${formatNumber(cardsTotal)} CARTAS REGISTRADAS`, icon: 'collection', route: '/collection', color: colors.rarityLegendary },
    { id: 'world', label: 'MUNDO', title: 'Lee la señal', status: activeEvent ? `CIERRA EN ${formatEventTime(activeEvent.ends_at)}` : 'SIN FRENTE PUBLICADO', icon: 'map', route: '/world', color: colors.rarityRare },
    { id: 'missions', label: 'MISIONES', title: 'Cumple el rito', status: `${formatNumber(home.missions.length)} ÓRDENES ACTIVAS`, icon: 'missions', route: '/missions', color: colors.success },
    { id: 'economy', label: 'ECONOMÍA', title: 'Mueve el VEX', status: `${formatNumber(wallet?.vex_ingame)} VEX DISPONIBLES`, icon: 'economy', route: '/economy', color: colors.accent },
  ];
  const domainRows = [
    [domainPortals[0], domainPortals[1]],
    [domainPortals[2], domainPortals[3]],
    [domainPortals[4], domainPortals[5]],
  ] as const;

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
            <LinearGradient
              colors={['#05050D08', '#05050D30', '#05050DA8', '#05050DF5', colors.background]}
              locations={[0, 0.24, 0.54, 0.82, 1]}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient colors={['#A78BFA36', 'transparent', '#F0C05022']} style={StyleSheet.absoluteFill} />
             <View pointerEvents="none" style={styles.heroFrame}>
               <View style={[styles.heroFrameCorner, styles.heroFrameTopLeft, { borderColor: `${colors.accent}A8` }]} />
               <View style={[styles.heroFrameCorner, styles.heroFrameTopRight, { borderColor: `${colors.accent}66` }]} />
               <View style={[styles.heroFrameCorner, styles.heroFrameBottomLeft, { borderColor: `${colors.rarityEpic}66` }]} />
               <View style={[styles.heroFrameCorner, styles.heroFrameBottomRight, { borderColor: `${colors.rarityEpic}A8` }]} />
               <Text style={[styles.heroFrameLabel, { color: `${colors.foreground}80` }]}>NEXUS / 01</Text>
             </View>
            <View pointerEvents="none" style={styles.heroAtmosphere}>
              <View style={[styles.heroAtmosphereLine, { backgroundColor: `${colors.rarityEpic}44` }]} />
              <View style={[styles.heroAtmosphereLineShort, { backgroundColor: `${colors.accent}66` }]} />
            </View>
            <Animated.Image
              source={OFFICIAL_ASSETS.homeSentinel}
              style={[styles.heroSentinel, sentinelParallaxStyle]}
              resizeMode="contain"
              accessibilityLabel="Guardián astral de la Forja"
              onLoad={() => setSentinelAssetState('ready')}
              onError={() => setSentinelAssetState('error')}
            />
            <Animated.View pointerEvents="none" style={[styles.heroOrbit, { borderColor: `${colors.rarityEpic}72` }, orbitStyle]} />
            <Animated.View pointerEvents="none" style={[styles.heroCore, { backgroundColor: `${colors.rarityEpic}A8` }, pulseStyle]} />
            {heroAssetState === 'error' || sentinelAssetState === 'error' ? (
              <View pointerEvents="none" style={styles.heroAssetError}>
                <Text style={[styles.heroAssetErrorTitle, { color: colors.accent }]}>NEXUS CORE OFFLINE</Text>
                <Text style={[styles.heroAssetErrorBody, { color: '#E5E0EACC' }]}>El arte de la escena no está disponible.</Text>
              </View>
            ) : null}
             <BlurView intensity={22} tint="dark" style={[styles.heroTopBarGlass, { marginTop: Math.max(12, insets.top + 6), marginHorizontal: viewportPadding, borderColor: `${colors.foreground}22` }]}>
               <View style={styles.heroTopBar}>
                 <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(420)} style={styles.brandLockup}>
                   <View style={[styles.brandMark, { borderColor: `${colors.accent}B8`, backgroundColor: '#05050DB8' }]}>
                     <Text style={[styles.brandMarkText, { color: colors.accent }]}>V</Text>
                   </View>
                   <View>
                     <Text style={[styles.brandName, { color: colors.foreground }]}>VEXFORGE</Text>
                     <Text style={[styles.brandSubline, { color: '#D7D0E8CC' }]}>NEXUS // RED DE DOMINIOS</Text>
                   </View>
                 </Animated.View>
                 <View style={styles.topActions}>
                   <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" testID="home-profile" onPress={() => navigate('/profile')} style={[styles.iconButton, { borderColor: `${colors.accent}80`, backgroundColor: '#05050DB8' }]}>
                     <Icon name="user" color={colors.accent} size={17} />
                   </Pressable>
                   <Pressable accessibilityRole="button" accessibilityLabel="Abrir mensajes y misiones" testID="home-inbox" onPress={() => navigate('/missions')} style={[styles.iconButton, { borderColor: `${colors.accent}80`, backgroundColor: '#05050DB8' }]}>
                     <Icon name="inbox" color={colors.foreground} size={17} />
                     {home.missions.length > 0 ? <View style={[styles.notificationDot, { backgroundColor: colors.accent }]} /> : null}
                   </Pressable>
                   <Pressable accessibilityRole="button" accessibilityLabel="Abrir ajustes" testID="home-settings" onPress={() => navigate('/meta')} style={[styles.iconButton, { borderColor: `${colors.accent}80`, backgroundColor: '#05050DB8' }]}>
                     <Icon name="settings" color={colors.foreground} size={17} />
                   </Pressable>
                 </View>
               </View>
             </BlurView>

            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(90).duration(600)} style={[styles.heroContent, { paddingHorizontal: viewportPadding }]}>
               <View style={styles.heroReadingField}>
                 <View style={[styles.syncPill, { borderColor: `${connectionColor}A0`, backgroundColor: '#05050D88' }]} testID="home-sync">
                   <View style={[styles.syncPulse, { backgroundColor: connectionColor }]} />
                   <Text style={[styles.syncText, { color: connectionColor }]}>{connectionLabel}</Text>
                   <Text style={[styles.syncDivider, { color: '#D7D0E880' }]}>/</Text>
                   <Text style={[styles.syncMeta, { color: '#D7D0E8CC' }]}>{season?.name ?? 'SEASON 01 // FORGE OF LEGENDS'}</Text>
                 </View>
                   <View style={styles.heroEyebrowRow}>
                     <Text style={[styles.heroEyebrow, { color: colors.accent }]}>TEMPORADA ACTIVA</Text>
                     <View style={[styles.heroEyebrowRule, { backgroundColor: `${colors.accent}7A` }]} />
                     <Text style={[styles.heroEyebrowMeta, { color: '#D7D0E8CC' }]}>FRENTE VIVO</Text>
                   </View>
                  <Text style={[styles.heroHeadline, { color: colors.foreground }]}>CRUZA{'\n'}EL UMBRAL</Text>
                  <Text style={[styles.heroDescription, { color: '#E5E0EACC' }]}>Tu frente está vivo. Elige un dominio y forja la próxima victoria.</Text>
                 <View style={styles.heroActions}>
                    <HeroPrimaryButton label="ENTRAR A LA ARENA" icon="target" onPress={() => navigate('/battle')} testID="home-battle" />
                    <HeroSecondaryButton label="CONTINUAR RITO" icon="arrow-right" onPress={() => navigate('/tutorial')} testID="home-tutorial" />
                 </View>
                 <View style={styles.heroFooter}>
                   <View style={styles.heroFooterItem}><Icon name="zap" color={colors.accent} size={13} /><Text style={[styles.heroFooterText, { color: '#D7D0E8CC' }]}>{progress ? `${formatNumber(progress.energy)} / ${formatNumber(progress.max_energy)} ENERGÍA` : 'ENERGÍA EN ESPERA'}</Text></View>
                   <View style={styles.heroFooterItem}><Icon name="gem" color={colors.rarityEpic} size={13} /><Text style={[styles.heroFooterText, { color: '#D7D0E8CC' }]}>{formatNumber(wallet?.vex_ingame)} VEX</Text></View>
                    <Pressable accessibilityRole="button" accessibilityLabel="Abrir mundo" testID="home-world" onPress={() => navigate('/world')} style={[styles.heroFooterGateway, { borderColor: `${colors.rarityRare}88`, backgroundColor: `${colors.rarityRare}16` }]}><Icon name="globe" color={colors.rarityRare} size={13} /><Icon name="arrow-up" color={colors.rarityRare} size={9} /></Pressable>
                 </View>
               </View>
            </Animated.View>
          </View>

          <View style={[styles.dashboard, { paddingHorizontal: viewportPadding }]}>
            {homeState === 'error' ? (
              <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(350)} style={[styles.errorBanner, { borderColor: `${colors.danger}80`, backgroundColor: `${colors.panelStrong}F4` }]} testID="home-retry">
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

             <BlurView intensity={18} tint="dark" style={[styles.playerStripGlass, { borderColor: `${colors.accent}55` }]}>
               <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(180).duration(600)} style={styles.playerStrip}>
                 <View style={styles.playerIdentity}>
                   <View style={[styles.avatarRing, { borderColor: colors.accent, backgroundColor: `${colors.accent}12` }]}><Text style={[styles.avatarLetter, { color: colors.accent }]}>{playerName.slice(0, 1).toUpperCase()}</Text></View>
                   <View style={styles.playerCopy}><Text style={[styles.playerName, { color: colors.foreground }]}>{playerName}</Text><Text style={[styles.playerMeta, { color: colors.mutedForeground }]}>NIVEL {formatNumber(progress?.level)} / FORJADOR</Text></View>
                 </View>
                 <View style={styles.playerProgress}><View style={styles.levelLine}><Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>RANGO DE FORJA</Text><Text style={[styles.progressValue, { color: colors.accent }]}>{formatNumber(xp)} / {formatNumber(xpToNext)} XP</Text></View><ProgressRail value={xp} total={xpToNext} color={colors.accent} background={`${colors.accent}28`} /></View>
               </Animated.View>
             </BlurView>

            <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(120).duration(560)} style={styles.domainSection} testID="home-domain-rail">
              <View style={styles.domainHeading}>
                <View>
                  <Text style={[styles.eyebrow, { color: colors.rarityRare }]}>CONSTELACIÓN DEL NEXUS</Text>
                     <Text style={[styles.domainTitle, { color: colors.foreground }]}>Elige dónde forjar</Text>
                </View>
                <View style={styles.liveSignal}><View style={[styles.liveSignalDot, { backgroundColor: connectionColor }]} /><Text style={[styles.liveSignalText, { color: connectionColor }]}>SEÑAL VIVA</Text></View>
              </View>
               <View style={styles.domainMap} accessibilityLabel="Dominios conectados del Nexus">
                 <View pointerEvents="none" style={[styles.domainSpine, { backgroundColor: `${colors.rarityEpic}35` }]} />
                  <View pointerEvents="none" style={[styles.domainCore, { borderColor: `${colors.rarityEpic}62`, backgroundColor: `${colors.rarityEpic}12` }]}>
                    <View style={[styles.domainCoreDot, { backgroundColor: `${colors.accent}CC` }]} />
                  </View>
                 {domainRows.map((row) => (
                   <View key={`${row[0].id}-${row[1].id}`} style={styles.domainRow}>
                     <NexusPortal portal={row[0]} onPress={() => navigate(row[0].route)} />
                     <View pointerEvents="none" style={styles.domainConnector}>
                       <View style={[styles.domainConnectorLine, { backgroundColor: `${row[0].color}66` }]} />
                       <Animated.View style={[styles.domainSignal, { backgroundColor: row[0].color }, pulseStyle]} />
                       <Icon name="chevron-right" color={`${row[0].color}B8`} size={11} />
                     </View>
                     <NexusPortal portal={row[1]} onPress={() => navigate(row[1].route)} />
                   </View>
                 ))}
               </View>
            </Animated.View>

            <View style={styles.metricGrid}>
              <Metric label="CARTAS" value={hasPlayerData ? formatNumber(progress?.level ? playerStats?.cards_owned ?? cardsTotal : cardsTotal) : formatNumber(cardsTotal)} icon="layers" color={colors.rarityRare} />
              <Metric label="VICTORIAS" value={formatNumber(playerStats?.pvp_wins)} icon="award" color={colors.accent} />
              <Metric label="BATALLAS" value={formatNumber(home.stats?.total_battles)} icon="activity" color={colors.rarityEpic} />
              <Metric label="PACKS" value={formatNumber(home.stats?.packs_opened)} icon="packs" color={colors.success} />
            </View>

             <SectionHeading eyebrow="SEÑAL DEL NEXUS" title="El frente de hoy" action="ABRIR MUNDO" onAction={() => navigate('/world')} />
             <Pressable accessibilityRole="button" accessibilityLabel="Abrir evento activo" testID="home-event" onPress={() => navigate('/world')} style={({ pressed }) => [styles.eventCard, { borderColor: `${colors.rarityRare}80`, backgroundColor: `${colors.panelStrong}38`, opacity: pressed ? 0.8 : 1 }]}>
               <View pointerEvents="none" style={[styles.eventCorner, styles.eventCornerTop, { borderColor: `${colors.rarityRare}A8` }]} />
               <View pointerEvents="none" style={[styles.eventCorner, styles.eventCornerBottom, { borderColor: `${colors.rarityRare}70` }]} />
              <View style={styles.eventOrbWrap}><View style={[styles.eventOrb, { borderColor: `${colors.rarityRare}80` }]}><Animated.View style={[styles.eventOrbCore, { backgroundColor: colors.rarityRare }, pulseStyle]} /></View><View style={[styles.eventOrbRing, { borderColor: `${colors.rarityRare}35` }]} /></View>
              <View style={styles.eventCopy}><Text style={[styles.eventType, { color: colors.rarityRare }]}>{activeEvent?.type?.toUpperCase() ?? 'SEÑAL GLOBAL'}</Text><Text style={[styles.eventTitle, { color: colors.foreground }]}>{activeEvent?.name ?? 'El Nexus espera un nuevo frente'}</Text><Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>{activeEvent ? `CIERRA EN ${formatEventTime(activeEvent.ends_at)}` : 'No hay evento activo publicado'}</Text></View>
              <View style={styles.eventProgress}><Text style={[styles.eventProgressValue, { color: colors.rarityRare }]}>{activeEvent ? `${Math.round(activeEvent.progress)}%` : '—'}</Text><ProgressRail value={activeEvent?.progress ?? 0} total={100} color={colors.rarityRare} background={`${colors.rarityRare}20`} /><Icon name="arrow-up" color={colors.rarityRare} size={16} /></View>
            </Pressable>

             <SectionHeading eyebrow={home.missions.length === 1 ? 'ORDEN ACTIVA' : 'ÓRDENES ACTIVAS'} title="El rito continúa" action="ABRIR MISIONES" onAction={() => navigate('/missions')} />
            {home.missions.length > 0 ? (
              <View style={styles.missionList}>
                {home.missions.slice(0, 3).map((mission, index) => <MissionRow key={mission.id} mission={mission} index={index} onPress={() => navigate('/missions')} />)}
              </View>
            ) : (
              <View style={[styles.emptyCard, { borderColor: `${colors.border}CC`, backgroundColor: `${colors.panelStrong}F0` }]}><Icon name="compass" color={colors.mutedForeground} size={22} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>SIN FRENTE ACTIVO</Text><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Las próximas misiones aparecerán cuando el Nexus publique el siguiente ciclo.</Text></View>
            )}

            <SectionHeading eyebrow="CARTA DESTACADA" title="Objeto de resonancia" action="ABRIR ARCHIVO" onAction={() => navigate('/collection')} />
            <Pressable accessibilityRole="button" accessibilityLabel="Inspeccionar carta destacada" testID="home-featured-card" onPress={openFeatured} style={[styles.featuredCard, { borderColor: `${colors.rarityLegendary}A0`, backgroundColor: `${colors.panelStrong}52` }]}>
              <View style={styles.featuredArtFrame}>
                <Image
                  source={OFFICIAL_ASSETS.homeFeatureCard}
                  style={styles.featuredArt}
                  resizeMode="cover"
                  accessibilityLabel="Arte original del objeto de resonancia"
                  onLoad={() => setFeaturedAssetState('ready')}
                  onError={() => setFeaturedAssetState('error')}
                />
                <LinearGradient colors={['transparent', '#05050D66', '#05050DCC']} style={StyleSheet.absoluteFill} />
                 <Animated.View style={[styles.featuredSheen, featuredSheenStyle]} pointerEvents="none" />
                {featuredAssetState === 'error' ? (
                  <View style={[styles.featuredAssetError, { backgroundColor: `${colors.panelStrong}F4` }]}>
                    <Icon name="alert-triangle" color={colors.accent} size={16} />
                    <Text style={[styles.featuredAssetErrorText, { color: colors.accent }]}>ARTE NO DISPONIBLE</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.featuredCopy}>
                <View style={styles.featuredTagLine}><Text style={[styles.featuredTag, { color: colors.rarityLegendary }]}>{activeCard?.rarity?.toUpperCase() ?? 'LEGENDARY'}</Text><Text style={[styles.featuredCode, { color: colors.mutedForeground }]}>{activeCard?.code ?? 'VEX-0017'}</Text></View>
                <Text style={[styles.featuredName, { color: colors.foreground }]}>{activeCard?.name ?? 'Bastión de Hierro'}</Text>
                <Text style={[styles.featuredFaction, { color: colors.mutedForeground }]}>{activeCard?.faction ?? 'Guerrero'}{activeCard?.power ? `  /  PODER ${formatNumber(activeCard.power)}` : '  /  PODER 150'}</Text>
                {featuredExpanded ? <Text style={[styles.featuredLore, { color: colors.mutedForeground }]}>{activeCard?.lore ?? 'La resonancia de esta carta todavía no ha sido registrada.'}</Text> : <Text style={[styles.featuredHint, { color: colors.accent }]}>TOCA PARA INSPECCIONAR</Text>}
              </View>
            </Pressable>

             <View style={styles.dualGrid}>
               <Pressable accessibilityRole="button" accessibilityLabel="Abrir Forja" testID="home-forge" onPress={() => navigate('/deck')} style={({ pressed }) => [styles.portalCard, { borderColor: `${colors.rarityEpic}80`, backgroundColor: `${colors.panelStrong}26`, opacity: pressed ? 0.76 : 1 }]}>
                 <View pointerEvents="none" style={[styles.portalCorner, styles.portalCornerTop, { borderColor: `${colors.rarityEpic}A8` }]} />
                 <View pointerEvents="none" style={[styles.portalCorner, styles.portalCornerBottom, { borderColor: `${colors.rarityEpic}70` }]} />
                 <View style={[styles.portalIcon, { backgroundColor: `${colors.rarityEpic}24`, borderColor: `${colors.rarityEpic}80` }]}><Icon name="deck" color={colors.rarityEpic} size={19} /></View>
                 <Text style={[styles.portalEyebrow, { color: colors.rarityEpic }]}>FORJA</Text>
                 <Text style={[styles.portalTitle, { color: colors.foreground }]}>Construye tu línea</Text>
                 <Text style={[styles.portalBody, { color: colors.mutedForeground }]}>Mazos y formación</Text>
                 <View style={[styles.portalGateway, { borderColor: `${colors.rarityEpic}70`, backgroundColor: `${colors.rarityEpic}12` }]}><Icon name="arrow-up" color={colors.rarityEpic} size={13} /></View>
               </Pressable>
               <Pressable accessibilityRole="button" accessibilityLabel="Abrir economía" testID="home-economy" onPress={() => navigate('/economy')} style={({ pressed }) => [styles.portalCard, { borderColor: `${colors.accent}80`, backgroundColor: `${colors.panelStrong}26`, opacity: pressed ? 0.76 : 1 }]}>
                 <View pointerEvents="none" style={[styles.portalCorner, styles.portalCornerTop, { borderColor: `${colors.accent}A8` }]} />
                 <View pointerEvents="none" style={[styles.portalCorner, styles.portalCornerBottom, { borderColor: `${colors.accent}70` }]} />
                 <View style={[styles.portalIcon, { backgroundColor: `${colors.accent}1C`, borderColor: `${colors.accent}80` }]}><Icon name="trending-up-outline" color={colors.accent} size={19} /></View>
                 <Text style={[styles.portalEyebrow, { color: colors.accent }]}>ECONOMÍA</Text>
                 <Text style={[styles.portalTitle, { color: colors.foreground }]}>Mueve el VEX</Text>
                 <Text style={[styles.portalBody, { color: colors.mutedForeground }]}>Mercado y recursos</Text>
                 <View style={[styles.portalGateway, { borderColor: `${colors.accent}70`, backgroundColor: `${colors.accent}12` }]}><Icon name="arrow-up" color={colors.accent} size={13} /></View>
               </Pressable>
            </View>

              <View style={[styles.storePortal, { borderColor: `${colors.success}72`, backgroundColor: `${colors.panelStrong}26` }]}>
               <View pointerEvents="none" style={[styles.storePortalTrace, { backgroundColor: `${colors.success}70` }]} />
               <View style={styles.storePortalHeading}><View><Text style={[styles.portalEyebrow, { color: colors.success }]}>CÁMARA DE FORJA</Text><Text style={[styles.storePortalTitle, { color: colors.foreground }]}>Elige tu siguiente operación</Text></View><View style={[styles.storePortalMark, { borderColor: `${colors.success}80`, backgroundColor: `${colors.success}16` }]}><Icon name="shop" color={colors.success} size={18} /></View></View>
              <View style={styles.storeActions}>
                <GlassButton label="PACKS" icon="packs" onPress={() => navigate('/store?mode=packs')} tone="quiet" testID="home-store-packs" />
                <GlassButton label="TIENDA" icon="shop" onPress={() => navigate('/store?mode=shop')} tone="quiet" testID="home-store-shop" />
                <GlassButton label="FUSIÓN" icon="fusion" onPress={() => navigate('/store?mode=fusion')} tone="quiet" testID="home-store-fusion" />
                <GlassButton label="EVOLUCIÓN" icon="evolution" onPress={() => navigate('/store?mode=evolution')} tone="quiet" testID="home-store-evolution" />
              </View>
            </View>

             <SectionHeading eyebrow="PULSO PÚBLICO" title="Actividad del Nexus" action="VER CLASIFICACIÓN" onAction={() => navigate('/world')} />
            <View style={[styles.activityPanel, { borderColor: `${colors.border}CC`, backgroundColor: `${colors.panelStrong}26` }]}>
              {home.activity.length > 0 ? home.activity.slice(0, 3).map((item) => <View key={item.id} style={styles.activityRow}><View style={[styles.activityDot, { backgroundColor: colors.success }]} /><View style={styles.activityText}><Text style={[styles.activityCopy, { color: colors.foreground }]}>{item.text}</Text><Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{new Date(item.time).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}</Text></View></View>) : <View style={styles.emptyActivity}><Icon name="radio" color={colors.mutedForeground} size={18} /><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>El pulso público se mostrará cuando exista actividad confirmada.</Text></View>}
            </View>

             <SectionHeading eyebrow="CIRCUITO ACTIVO" title="Clasificación del frente" action="ABRIR MUNDO" onAction={() => navigate('/world')} />
            <View style={[styles.rankingPanel, { borderColor: `${colors.accent}72`, backgroundColor: `${colors.panelStrong}26` }]}>
              {ranking.length > 0 ? ranking.map((entry, index) => <View key={`${entry.rank}-${entry.display_name}`} style={styles.rankingRow}><Text style={[styles.rankPosition, { color: index === 0 ? colors.accent : colors.mutedForeground }]}>{String(entry.rank).padStart(2, '0')}</Text><View style={[styles.rankAvatar, { borderColor: `${index === 0 ? colors.accent : colors.border}99` }]}><Text style={[styles.rankAvatarText, { color: index === 0 ? colors.accent : colors.mutedForeground }]}>{entry.display_name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.rankIdentity}><Text style={[styles.rankName, { color: colors.foreground }]}>{entry.display_name}</Text><Text style={[styles.rankMeta, { color: colors.mutedForeground }]}>{formatNumber(entry.wins)} VICTORIAS / {formatNumber(entry.mmr)} MMR</Text></View><Icon name={index === 0 ? 'award' : 'chevron-right'} color={index === 0 ? colors.accent : colors.mutedForeground} size={16} /></View>) : <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>El ranking de la temporada todavía no tiene posiciones publicadas.</Text>}
            </View>
          </View>
        </Animated.ScrollView>
      </View>
    </ScreenShell>
  );
}

function Metric({ label, value, icon, color }: { label: string; value: string; icon: IconName; color: string }) {
  const colors = useColors();
  return <View style={[styles.metricCard, { borderColor: `${color}66`, backgroundColor: `${colors.panelStrong}26` }]}><Icon name={icon} color={color} size={15} /><Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

function MissionRow({ mission, index, onPress }: { mission: HomeMission; index: number; onPress: () => void }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir misión ${mission.name}`} testID="home-missions" onPress={onPress} style={({ pressed }) => [styles.missionRow, { borderColor: `${colors.border}CC`, backgroundColor: `${colors.panelStrong}26`, opacity: pressed ? 0.72 : 1 }]}><View style={[styles.missionIndex, { borderColor: `${colors.accent}80` }]}><Text style={[styles.missionIndexText, { color: colors.accent }]}>0{index + 1}</Text></View><View style={styles.missionCopy}><Text style={[styles.missionName, { color: colors.foreground }]}>{mission.name}</Text><Text style={[styles.missionMeta, { color: colors.mutedForeground }]}>{capitalize(mission.difficulty, 'RITO')}  /  {formatNumber(mission.reward_xp)} XP  /  {formatNumber(mission.reward_vex_ingame)} VEX</Text></View><Icon name="chevron-right" color={colors.accent} size={17} /></Pressable>;
}

function NexusPortal({ portal, onPress }: { portal: { id: string; label: string; title: string; status: string; icon: IconName; route: HomeRoute; color: string }; onPress: () => void }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir dominio ${portal.label}`} testID={`home-domain-${portal.id}`} onPress={onPress} style={({ pressed }) => [styles.domainPortal, { borderColor: `${portal.color}80`, backgroundColor: `${colors.panelStrong}26`, opacity: pressed ? 0.74 : 1 }]}>
    <View pointerEvents="none" style={[styles.domainCorner, styles.domainCornerTop, { borderColor: `${portal.color}A8` }]} />
    <View pointerEvents="none" style={[styles.domainCorner, styles.domainCornerBottom, { borderColor: `${portal.color}70` }]} />
    <View pointerEvents="none" style={[styles.domainNodeHalo, { borderColor: `${portal.color}38` }]} />
    <View style={[styles.domainNode, { borderColor: `${portal.color}A8`, backgroundColor: `${portal.color}1C` }]}><Icon name={portal.icon} color={portal.color} size={17} /></View>
    <View style={styles.domainCopy}>
      <View style={styles.domainLabelLine}><Text style={[styles.domainEyebrow, { color: portal.color }]}>{portal.label}</Text><View style={[styles.domainPulse, { backgroundColor: portal.color }]} /></View>
      <Text style={[styles.domainPortalTitle, { color: colors.foreground }]}>{portal.title}</Text>
      <Text numberOfLines={1} style={[styles.domainStatus, { color: colors.mutedForeground }]}>{portal.status}</Text>
    </View>
    <View style={[styles.domainGateway, { borderColor: `${portal.color}70`, backgroundColor: `${portal.color}12` }]}><Icon name="arrow-up" color={`${portal.color}CC`} size={12} /></View>
  </Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { gap: 0 },
   heroStage: { overflow: 'hidden', position: 'relative' },
  heroArt: { height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' },
  heroSentinel: { bottom: -88, height: 590, position: 'absolute', right: -104, width: 580 },
  heroOrbit: { borderRadius: 210, borderWidth: 1, height: 420, position: 'absolute', right: -158, top: 112, width: 420 },
  heroCore: { borderRadius: 34, height: 68, opacity: 0.28, position: 'absolute', right: 114, top: 266, width: 68 },
  heroAtmosphere: { bottom: 46, left: 18, opacity: 0.75, position: 'absolute', right: 18 },
  heroAtmosphereLine: { height: 1, marginBottom: 7, width: '72%' },
  heroAtmosphereLineShort: { height: 1, width: '34%' },
  heroFrame: { ...StyleSheet.absoluteFillObject, opacity: 0.82 },
  heroFrameCorner: { height: 38, position: 'absolute', width: 38 },
  heroFrameTopLeft: { borderLeftWidth: 1, borderTopWidth: 1, left: 15, top: 15 },
  heroFrameTopRight: { borderRightWidth: 1, borderTopWidth: 1, right: 15, top: 15 },
  heroFrameBottomLeft: { borderBottomWidth: 1, borderLeftWidth: 1, bottom: 18, left: 15 },
  heroFrameBottomRight: { borderBottomWidth: 1, borderRightWidth: 1, bottom: 18, right: 15 },
  heroFrameLabel: { bottom: 24, fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1.8, position: 'absolute', right: 23 },
  heroAssetError: { alignItems: 'center', borderColor: '#F0C05080', borderRadius: 8, borderWidth: 1, left: 24, paddingHorizontal: 10, paddingVertical: 7, position: 'absolute', right: 24, top: 182 },
  heroAssetErrorTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1.3 },
  heroAssetErrorBody: { fontFamily: 'Rajdhani_500Medium', fontSize: 10, marginTop: 2 },
  heroTopBarGlass: { borderRadius: 13, borderWidth: 1, overflow: 'hidden' },
  heroTopBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 9, paddingVertical: 8 },
   heroContent: { bottom: 0, left: 0, paddingBottom: 27, position: 'absolute', right: 0 },
   heroReadingField: { borderLeftColor: '#F0C050B8', borderLeftWidth: 1, paddingLeft: 14, paddingTop: 8 },
  brandLockup: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  brandMark: { alignItems: 'center', borderRadius: 10, borderWidth: 1, height: 35, justifyContent: 'center', width: 35 },
  brandMarkText: { fontFamily: 'Cinzel_700Bold', fontSize: 19, letterSpacing: 1 },
  brandName: { fontFamily: 'Cinzel_700Bold', fontSize: 14, letterSpacing: 2.5 },
  brandSubline: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 1.5, marginTop: 2 },
  topActions: { flexDirection: 'row', gap: 7 },
  iconButton: { alignItems: 'center', borderRadius: 10, borderWidth: 1, height: 34, justifyContent: 'center', position: 'relative', width: 34 },
  notificationDot: { borderRadius: 3, height: 6, position: 'absolute', right: 7, top: 6, width: 6 },
  syncPill: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: 5, borderWidth: 1, flexDirection: 'row', gap: 7, paddingHorizontal: 9, paddingVertical: 5 },
  syncPulse: { borderRadius: 4, height: 6, width: 6 },
  syncText: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1.1 },
  syncDivider: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 10 },
  syncMeta: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 0.65 },
  heroEyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 18 },
  heroEyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1.8 },
  heroEyebrowRule: { height: 1, width: 28 },
  heroEyebrowMeta: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.35 },
  heroHeadline: { fontFamily: 'Cinzel_700Bold', fontSize: 41, letterSpacing: 1.1, lineHeight: 45, marginTop: 8, textShadowColor: '#000000B8', textShadowOffset: { height: 2, width: 0 }, textShadowRadius: 12 },
  heroDescription: { fontFamily: 'Rajdhani_500Medium', fontSize: 15, lineHeight: 20, marginTop: 8, maxWidth: 290 },
  heroActions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 17 },
  heroPrimaryButtonPressable: { borderRadius: 5, shadowColor: '#F0C050', shadowOffset: { height: 7, width: 0 }, shadowOpacity: 0.28, shadowRadius: 14 },
  heroPrimaryButton: { alignItems: 'center', borderRadius: 5, flexDirection: 'row', gap: 8, minHeight: 54, paddingHorizontal: 10, paddingVertical: 8 },
  heroActionIconFrame: { alignItems: 'center', borderRadius: 8, borderWidth: 1, height: 35, justifyContent: 'center', width: 35 },
  heroSecondaryIconFrame: { alignItems: 'center', borderRadius: 8, borderWidth: 1, height: 32, justifyContent: 'center', width: 32 },
  heroActionCopy: { gap: 1 },
  heroPrimaryButtonText: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 1.05 },
  heroActionMeta: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 8, letterSpacing: 0.8 },
  heroPrimaryButtonMark: { alignItems: 'center', borderRadius: 8, borderWidth: 1, height: 22, justifyContent: 'center', marginLeft: 2, width: 22 },
  heroSecondaryButton: { alignItems: 'center', borderRadius: 5, borderWidth: 1, flexDirection: 'row', gap: 8, minHeight: 54, paddingHorizontal: 10, paddingVertical: 8 },
  heroSecondaryButtonText: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 0.9 },
  glassButton: { alignItems: 'center', borderRadius: 11, borderWidth: 1, flexGrow: 1, gap: 4, justifyContent: 'center', minHeight: 66, minWidth: 72, paddingHorizontal: 6, paddingVertical: 7 },
  glassButtonLarge: { minHeight: 45, paddingHorizontal: 15 },
  glassButtonGlyph: { alignItems: 'center', borderRadius: 15, borderWidth: 1, height: 31, justifyContent: 'center', position: 'relative', width: 31 },
  glassButtonGlyphDot: { borderRadius: 2, bottom: 3, height: 4, position: 'absolute', right: 3, width: 4 },
  glassButtonText: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1, textAlign: 'center' },
  glassButtonMeta: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 7, letterSpacing: 0.8 },
  heroFooter: { borderTopColor: '#FFFFFF20', borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 13, marginTop: 17, paddingTop: 12 },
  heroFooterItem: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  heroFooterGateway: { alignItems: 'center', borderRadius: 5, borderWidth: 1, flexDirection: 'row', gap: 3, minHeight: 27, paddingHorizontal: 7 },
  heroFooterText: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 10, letterSpacing: 0.65 },
  dashboard: { gap: 17, paddingTop: 0 },
  errorBanner: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 13, shadowColor: '#000000', shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.24, shadowRadius: 16 },
  errorCopy: { flex: 1, gap: 2 },
  errorTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 1 },
  errorBody: { fontFamily: 'Rajdhani_500Medium', fontSize: 11, lineHeight: 15 },
  retryButton: { borderRadius: 5, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 7 },
  retryText: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.8 },
  playerStripGlass: { borderBottomWidth: 1, borderRadius: 11, borderTopWidth: 1, marginTop: -18, overflow: 'hidden' },
  playerStrip: { alignItems: 'center', backgroundColor: '#0D0D1A66', flexDirection: 'row', gap: 14, paddingHorizontal: 11, paddingVertical: 13 },
  playerIdentity: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  avatarRing: { alignItems: 'center', borderRadius: 22, borderWidth: 1, height: 39, justifyContent: 'center', width: 39 },
  avatarLetter: { fontFamily: 'Cinzel_700Bold', fontSize: 17 },
  playerCopy: { gap: 1 },
  playerName: { fontFamily: 'Rajdhani_700Bold', fontSize: 14, letterSpacing: 0.7 },
  playerMeta: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 0.9 },
  playerProgress: { flex: 1, gap: 7 },
  domainSection: { gap: 12, marginTop: 20 },
  domainHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  domainTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 18, letterSpacing: 0.3, marginTop: 4 },
  liveSignal: { alignItems: 'center', flexDirection: 'row', gap: 5, paddingBottom: 2 },
  liveSignalDot: { borderRadius: 4, height: 6, width: 6 },
  liveSignalText: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1 },
  domainMap: { gap: 9, position: 'relative' },
  domainSpine: { bottom: 18, left: '50%', position: 'absolute', top: 18, width: 1 },
  domainCore: { alignItems: 'center', borderRadius: 12, borderWidth: 1, height: 24, justifyContent: 'center', left: '50%', marginLeft: -12, position: 'absolute', top: '50%', width: 24, zIndex: 2 },
  domainCoreDot: { borderRadius: 3, height: 6, width: 6 },
  domainRow: { alignItems: 'stretch', flexDirection: 'row', gap: 7 },
  domainPortal: { alignItems: 'center', borderRadius: 8, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 9, minHeight: 84, paddingHorizontal: 11, paddingVertical: 10, shadowColor: '#000000', shadowOffset: { height: 6, width: 0 }, shadowOpacity: 0.2, shadowRadius: 12 },
  domainCorner: { height: 16, position: 'absolute', width: 16 },
  domainCornerTop: { borderRightWidth: 1, borderTopWidth: 1, right: 7, top: 7 },
  domainCornerBottom: { borderBottomWidth: 1, borderLeftWidth: 1, bottom: 7, left: 7 },
  domainNodeHalo: { borderRadius: 22, borderWidth: 1, height: 44, left: 7, position: 'absolute', width: 44 },
  domainNode: { alignItems: 'center', borderRadius: 16, borderWidth: 1, height: 34, justifyContent: 'center', width: 34 },
  domainCopy: { flex: 1, gap: 2, minWidth: 0 },
  domainLabelLine: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  domainPulse: { borderRadius: 3, height: 5, opacity: 0.9, width: 5 },
  domainEyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1.2 },
  domainPortalTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 11.5, lineHeight: 15 },
  domainStatus: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 8, letterSpacing: 0.25 },
  domainGateway: { alignItems: 'center', borderRadius: 6, borderWidth: 1, height: 25, justifyContent: 'center', width: 25 },
  domainConnector: { alignItems: 'center', flexDirection: 'row', gap: 1, justifyContent: 'center', width: 17 },
  domainConnectorLine: { height: 1, flex: 1 },
  domainSignal: { borderRadius: 3, height: 5, width: 5 },
  levelLine: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.9 },
  progressValue: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.4 },
  progressRail: { borderRadius: 6, height: 6, overflow: 'hidden', width: '100%' },
  progressFill: { borderRadius: 6, height: '100%' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  metricCard: { borderRadius: 13, borderWidth: 1, flexGrow: 1, minWidth: '22%', padding: 11, shadowColor: '#000000', shadowOffset: { height: 5, width: 0 }, shadowOpacity: 0.18, shadowRadius: 10 },
  metricValue: { fontFamily: 'Cinzel_700Bold', fontSize: 16, marginTop: 7 },
  metricLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1, marginTop: 2 },
  sectionHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
   sectionHeadingCopy: { flex: 1 },
   sectionKicker: { alignItems: 'center', flexDirection: 'row', gap: 7 },
   sectionKickerLine: { height: 1, width: 18 },
  eyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.8 },
  sectionTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 18, letterSpacing: 0.4, marginTop: 5 },
  sectionAction: { alignItems: 'center', flexDirection: 'row', gap: 5, paddingBottom: 2, paddingLeft: 10 },
  sectionGatewayFrame: { alignItems: 'center', borderRadius: 7, borderWidth: 1, height: 31, justifyContent: 'center', width: 31 },
  sectionGatewaySignal: { borderRadius: 2, height: 4, width: 4 },
  eventCard: { alignItems: 'center', backgroundColor: '#14142886', borderColor: '#6EA8FE80', borderRadius: 5, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 102, overflow: 'hidden', padding: 14, position: 'relative', shadowColor: '#000000', shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.26, shadowRadius: 16 },
  eventCorner: { height: 18, position: 'absolute', width: 18 },
  eventCornerTop: { borderRightWidth: 1, borderTopWidth: 1, right: 8, top: 8 },
  eventCornerBottom: { borderBottomWidth: 1, borderLeftWidth: 1, bottom: 8, left: 8 },
  eventOrbWrap: { alignItems: 'center', height: 58, justifyContent: 'center', width: 58 },
  eventOrb: { alignItems: 'center', borderRadius: 26, borderWidth: 1, height: 52, justifyContent: 'center', width: 52 },
  eventOrbRing: { borderRadius: 30, borderWidth: 1, height: 58, position: 'absolute', width: 58 },
  eventOrbCore: { borderRadius: 14, height: 26, width: 26 },
  eventCopy: { flex: 1, gap: 3 },
  eventType: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.4 },
  eventTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 14, lineHeight: 18 },
  eventMeta: { fontFamily: 'Rajdhani_500Medium', fontSize: 10, letterSpacing: 0.6 },
  eventProgress: { alignItems: 'flex-end', gap: 6, width: 48 },
  eventProgressValue: { fontFamily: 'Rajdhani_700Bold', fontSize: 13 },
  missionList: { gap: 9 },
  missionRow: { alignItems: 'center', backgroundColor: '#14142878', borderColor: '#FFFFFF18', borderRadius: 5, borderLeftWidth: 2, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 13, shadowColor: '#000000', shadowOffset: { height: 5, width: 0 }, shadowOpacity: 0.18, shadowRadius: 12 },
  missionIndex: { alignItems: 'center', borderRadius: 6, borderWidth: 1, height: 32, justifyContent: 'center', width: 32 },
  missionIndexText: { fontFamily: 'Rajdhani_700Bold', fontSize: 11 },
  missionCopy: { flex: 1, gap: 3 },
  missionName: { fontFamily: 'Rajdhani_700Bold', fontSize: 14, letterSpacing: 0.3 },
  missionMeta: { fontFamily: 'Rajdhani_500Medium', fontSize: 10, letterSpacing: 0.55 },
  emptyCard: { alignItems: 'center', borderRadius: 15, borderWidth: 1, gap: 8, paddingHorizontal: 20, paddingVertical: 25 },
  emptyTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 12, letterSpacing: 1.2 },
  emptyBody: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, lineHeight: 17, textAlign: 'center' },
  featuredCard: { borderColor: '#F0C050A0', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 13, overflow: 'hidden', padding: 11, shadowColor: '#F0C050', shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.12, shadowRadius: 20 },
  featuredArtFrame: { backgroundColor: '#05050D', borderColor: '#F0C05070', borderRadius: 13, borderWidth: 1, height: 166, overflow: 'hidden', position: 'relative', width: 118 },
  featuredArt: { height: '100%', width: '100%' },
  featuredSheen: { backgroundColor: '#FFFFFF28', height: 15, left: -20, position: 'absolute', top: 26, transform: [{ rotate: '-24deg' }], width: 170 },
  featuredAssetError: { alignItems: 'center', bottom: 8, left: 7, paddingHorizontal: 5, paddingVertical: 6, position: 'absolute', right: 7 },
  featuredAssetErrorText: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 0.7, marginTop: 3, textAlign: 'center' },
  featuredCopy: { flex: 1, justifyContent: 'center', paddingVertical: 7 },
  featuredTagLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  featuredTag: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1.2 },
  featuredCode: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 0.8 },
  featuredName: { fontFamily: 'Cinzel_600SemiBold', fontSize: 18, lineHeight: 23, marginTop: 12 },
  featuredFaction: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 10, letterSpacing: 0.5, marginTop: 5 },
  featuredLore: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, lineHeight: 16, marginTop: 11 },
  featuredHint: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.1, marginTop: 18 },
  dualGrid: { flexDirection: 'row', gap: 9 },
  storePortal: { borderColor: '#3DC96B72', borderRadius: 5, borderWidth: 1, overflow: 'hidden', padding: 14, position: 'relative', shadowColor: '#000000', shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.2, shadowRadius: 16 },
  storePortalTrace: { height: 1, left: 14, position: 'absolute', right: 14, top: 8 },
  storePortalHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  storePortalMark: { alignItems: 'center', borderRadius: 15, borderWidth: 1, height: 32, justifyContent: 'center', width: 32 },
  storePortalTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 15, marginTop: 4 },
  storeActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  portalCard: { borderRadius: 16, borderWidth: 1, flex: 1, minHeight: 142, padding: 13, position: 'relative', shadowColor: '#000000', shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.2, shadowRadius: 16 },
  portalCorner: { height: 17, position: 'absolute', width: 17 },
  portalCornerTop: { borderRightWidth: 1, borderTopWidth: 1, right: 8, top: 8 },
  portalCornerBottom: { borderBottomWidth: 1, borderLeftWidth: 1, bottom: 8, left: 8 },
  portalIcon: { alignItems: 'center', borderRadius: 10, borderWidth: 1, height: 37, justifyContent: 'center', width: 37 },
  portalEyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.2, marginTop: 12 },
  portalTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 13, lineHeight: 18, marginTop: 4 },
  portalBody: { fontFamily: 'Rajdhani_500Medium', fontSize: 10, marginTop: 2 },
  portalGateway: { alignItems: 'center', borderRadius: 6, borderWidth: 1, bottom: 11, height: 26, justifyContent: 'center', position: 'absolute', right: 11, width: 26 },
  activityPanel: { borderColor: '#FFFFFF20', borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 4, shadowColor: '#000000', shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.18, shadowRadius: 16 },
  activityRow: { alignItems: 'center', borderBottomColor: '#FFFFFF14', borderBottomWidth: 1, flexDirection: 'row', gap: 10, paddingVertical: 11 },
  activityDot: { borderRadius: 4, height: 7, width: 7 },
  activityText: { flex: 1, gap: 3 },
  activityCopy: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, lineHeight: 16 },
  activityTime: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.8 },
  emptyActivity: { alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingVertical: 20 },
  rankingPanel: { borderColor: '#F0C05072', borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, shadowColor: '#000000', shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.18, shadowRadius: 16 },
  rankingRow: { alignItems: 'center', borderBottomColor: '#FFFFFF14', borderBottomWidth: 1, flexDirection: 'row', gap: 9, paddingVertical: 11 },
  rankPosition: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, width: 21 },
  rankAvatar: { alignItems: 'center', borderRadius: 16, borderWidth: 1, height: 30, justifyContent: 'center', width: 30 },
  rankAvatarText: { fontFamily: 'Cinzel_700Bold', fontSize: 12 },
  rankIdentity: { flex: 1, gap: 2 },
  rankName: { fontFamily: 'Rajdhani_700Bold', fontSize: 13, letterSpacing: 0.3 },
  rankMeta: { fontFamily: 'Rajdhani_500Medium', fontSize: 9, letterSpacing: 0.65 },
});