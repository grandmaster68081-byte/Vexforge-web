import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ForgeIcon';
import Animated, { cancelAnimation, FadeIn, FadeInDown, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { loadDailyFeaturedCard, loadHomeMissions, loadHomeStats, loadRecentActivity, type ActivityItem, type DailyCard, type HomeMission, type HomeStats } from '@/lib/supabase';
import { ForgeMark } from '@/components/ForgeMark';
import { ProgressBar } from '@/components/ProgressBar';
import { useRouter } from 'expo-router';
import { ForgeButton } from '@/components/ForgeButton';
import { ForgeText } from '@/components/ForgeText';
import { ScreenShell } from '@/components/ScreenShell';
import { CANONICAL_BACKGROUNDS } from '@/constants/visual';
import { typography } from '@/constants/typography';

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

const SCENE_PORTALS: Array<{
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'danger' | 'accent' | 'primary' | 'success';
  route: '/battle' | '/collection' | '/deck' | '/world';
}> = [
  { label: 'ARENA', hint: 'COMBATIR', icon: 'arena', tone: 'danger', route: '/battle' },
  { label: 'CARTAS', hint: 'INSPECCIONAR', icon: 'cards', tone: 'accent', route: '/collection' },
  { label: 'MAZO', hint: 'PREPARAR', icon: 'deck', tone: 'primary', route: '/deck' },
  { label: 'MUNDO', hint: 'EXPLORAR', icon: 'map', tone: 'success', route: '/world' },
];

const UTILITY_PORTALS: Array<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: '/tutorial' | '/store' | '/economy';
}> = [
  { label: 'APRENDER A JUGAR', icon: 'map', route: '/tutorial' },
  { label: 'FORJA Y RECURSOS', icon: 'shop', route: '/store' },
  { label: 'ECONOMÍA Y MERCADO', icon: 'wallet-outline', route: '/economy' },
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
  return <ForgeText variant="label" style={[styles.eyebrow, { color }]}>{children}</ForgeText>;
}

function ActionButton({ label, icon, onPress, colors, secondary = false, testID }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; colors: ReturnType<typeof useColors>; secondary?: boolean; testID: string }) {
  return (
    <View style={secondary ? styles.secondaryAction : styles.primaryAction}>
      <ForgeButton label={label} icon={icon} onPress={onPress} secondary={secondary} testID={testID} />
    </View>
  );
}

function ScenePortal({ label, hint, icon, tone, onPress, colors, testID }: {
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'danger' | 'accent' | 'primary' | 'success';
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  testID: string;
}) {
  const toneColor = colors[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${hint}`}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.scenePortal, { borderColor: `${toneColor}75`, backgroundColor: `${colors.ink}A8`, opacity: pressed ? 0.72 : 1, transform: [{ translateY: pressed ? 1 : 0 }] }]}
    >
      <View style={[styles.scenePortalIcon, { backgroundColor: `${toneColor}20`, borderColor: `${toneColor}66` }]}>
        <Ionicons name={icon} size={19} color={toneColor} />
      </View>
      <Text style={[styles.scenePortalLabel, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.scenePortalHint, { color: toneColor }]}>{hint}</Text>
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
  const sceneMotion = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      sceneMotion.value = 0;
      return;
    }
    sceneMotion.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 9000 }),
        withTiming(0, { duration: 9000 }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(sceneMotion);
  }, [reduceMotion, sceneMotion]);

  const sceneMotionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(sceneMotion.value, [0, 1], [-5, 5]) },
      { translateY: interpolate(sceneMotion.value, [0, 1], [2, -2]) },
      { scale: interpolate(sceneMotion.value, [0, 1], [1.04, 1.08]) },
    ],
  }));

  const glowMotionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sceneMotion.value, [0, 1], [0.48, 0.82]),
    transform: [{ scale: interpolate(sceneMotion.value, [0, 1], [0.96, 1.08]) }],
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

  useEffect(() => {
    setFeaturedCardImageFailed(false);
  }, [home.dailyCard?.image_url]);

  const handleRefresh = () => { void Promise.all([refresh(), loadHome()]); };
  const displayName = player?.display_name?.trim() || 'FORJADOR';
  const energyPercent = progress ? Math.min(100, Math.round((progress.energy / Math.max(1, progress.max_energy)) * 100)) : 0;

  return (
    <ScreenShell surface="home" sceneMode="hero">
      <ScrollView
        style={[styles.screen, { backgroundColor: 'transparent' }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 112 }}
        refreshControl={<RefreshControl refreshing={homeLoading || syncState === 'loading'} onRefresh={handleRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
       <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(450)} style={[styles.hero, { borderBottomColor: colors.border }]}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, sceneMotionStyle]}>
            <Image
              source={{ uri: CANONICAL_BACKGROUNDS.home }}
              style={[StyleSheet.absoluteFillObject, styles.heroImage]}
              resizeMode="cover"
              accessibilityLabel="Escena oficial de la Forja"
              onLoad={() => setHomeSceneState('ready')}
              onError={() => setHomeSceneState('error')}
            />
          </Animated.View>
         <LinearGradient
            colors={['transparent', `${colors.ink}36`, `${colors.background}F2`]}
           locations={[0, 0.46, 1]}
           style={StyleSheet.absoluteFillObject}
         />
         <LinearGradient
            colors={[`${colors.ink}C2`, `${colors.ink}26`, 'transparent']}
           start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.64 }}
           style={StyleSheet.absoluteFillObject}
         />
         <Animated.View style={[styles.heroGlow, { backgroundColor: `${colors.accent}20` }, glowMotionStyle]} />
         <View style={[styles.heroGlowRight, { backgroundColor: `${colors.primary}18` }]} />
        <Text pointerEvents="none" style={[styles.sceneWord, { color: `${colors.accent}12` }]}>FORJA</Text>
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

           <View style={[styles.statusHud, { borderColor: `${colors.accent}45`, backgroundColor: `${colors.ink}88` }]}>
             <View style={styles.playerHud}>
               <View style={[styles.playerHudIcon, { backgroundColor: `${colors.accent}1C`, borderColor: `${colors.accent}75` }]}>
                 <Ionicons name="profile" size={18} color={colors.accent} />
               </View>
               <View>
                 <Text style={[styles.hudEyebrow, { color: colors.mutedForeground }]}>FORJADOR ACTIVO</Text>
                 <Text style={[styles.hudName, { color: colors.foreground }]} numberOfLines={1}>{displayName}</Text>
               </View>
             </View>
             <View style={styles.hudResource}>
               <Text style={[styles.hudEyebrow, { color: colors.mutedForeground }]}>VEX</Text>
               <Text style={[styles.hudValue, { color: colors.accent }]}>{(wallet?.vex_ingame ?? 0).toLocaleString('es')}</Text>
             </View>
           </View>

          <View style={styles.heroSignal}>
            <View style={[styles.signalDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.signalText, { color: colors.success }]}>NEXUS ONLINE</Text>
            <View style={[styles.signalRule, { backgroundColor: `${colors.accent}45` }]} />
            <Text style={[styles.signalText, { color: colors.mutedForeground }]}>SEASON 01</Text>
          </View>

           {homeSceneState === 'loading' ? (
             <View style={[styles.sceneNotice, { backgroundColor: `${colors.panelStrong}D9`, borderColor: `${colors.accent}66` }]}>
               <ActivityIndicator size="small" color={colors.accent} />
               <Text style={[styles.sceneNoticeText, { color: colors.mutedForeground }]}>CARGANDO ESCENA DEL NEXUS</Text>
             </View>
           ) : homeSceneState === 'error' ? (
             <View accessibilityRole="alert" style={[styles.sceneNotice, { backgroundColor: `${colors.danger}18`, borderColor: colors.danger }]}>
               <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
               <Text style={[styles.sceneNoticeText, { color: colors.foreground }]}>EL ARTE OFICIAL NO ESTÁ DISPONIBLE</Text>
             </View>
           ) : null}

          <View style={styles.greeting}>
            <SectionLabel color={colors.accent}>VEXFORGE — TRADING CARD GAME</SectionLabel>
             <ForgeText variant="display" style={[styles.title, { color: colors.foreground }]}>La forja{'\n'}te espera.</ForgeText>
              <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>Un frente vivo. Una carta en rotación. Tu próxima victoria empieza aquí.</Text>
          </View>

           <View style={[styles.sceneAnchor, { borderColor: `${colors.accent}75`, backgroundColor: `${colors.ink}B8` }]}>
             <View style={[styles.sceneAnchorRing, { borderColor: `${colors.accent}32` }]} />
             <View style={[styles.sceneAnchorCore, { backgroundColor: `${colors.accent}D9` }]}>
               <Ionicons name="target" size={19} color={colors.ink} />
             </View>
             <View style={styles.sceneAnchorCopy}>
               <Text style={[styles.sceneAnchorEyebrow, { color: colors.accent }]}>FRENTE ACTIVO</Text>
               <Text style={[styles.sceneAnchorTitle, { color: colors.foreground }]} numberOfLines={1}>{home.stats?.active_event?.name ?? home.stats?.season?.name ?? 'ARENA NEXUS'}</Text>
               <Text style={[styles.sceneAnchorBody, { color: colors.mutedForeground }]}>Elige tu formación para entrar en la escena.</Text>
             </View>
           </View>

          <View style={styles.actionRow}>
             <ActionButton label="Entrar a la arena" icon="flash-outline" onPress={() => router.push('/battle')} colors={colors} testID="home-battle" />
             <ActionButton label="Mi colección" icon="layers-outline" onPress={() => router.push('/collection')} colors={colors} secondary testID="home-collection" />
          </View>

           {home.dailyCard ? (
             <Pressable
               accessibilityRole="button"
               accessibilityLabel={`Inspeccionar carta destacada ${home.dailyCard.name}`}
               testID="home-featured-card"
               onPress={() => router.push('/collection')}
               style={({ pressed }) => [styles.featuredCardDock, { backgroundColor: `${colors.panelStrong}D9`, borderColor: `${colors.accent}8C`, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
             >
               <View style={[styles.featuredCardFrame, { borderColor: colors.accent }]}>
                 {home.dailyCard.image_url && !featuredCardImageFailed ? (
                   <Image
                     source={{ uri: home.dailyCard.image_url }}
                     style={styles.featuredCardImage}
                     resizeMode="cover"
                     accessibilityLabel={`Arte de ${home.dailyCard.name}`}
                     onError={() => setFeaturedCardImageFailed(true)}
                   />
                 ) : (
                   <View style={[styles.featuredCardEmpty, { backgroundColor: `${colors.muted}CC` }]}>
                     <Ionicons name="image-outline" size={19} color={colors.accent} />
                     <Text style={[styles.featuredCardEmptyText, { color: colors.mutedForeground }]}>{featuredCardImageFailed ? 'ARTE NO DISPONIBLE' : 'ARTE PENDIENTE'}</Text>
                   </View>
                 )}
               </View>
               <View style={styles.featuredCardCopy}>
                 <Text style={[styles.featuredCardMeta, { color: colors.accent }]}>OBJETO DESTACADO · CARTA DEL DÍA</Text>
                 <Text style={[styles.featuredCardTitle, { color: colors.foreground }]} numberOfLines={2}>{home.dailyCard.name}</Text>
                 <Text style={[styles.featuredCardMeta, { color: colors.mutedForeground }]}>{home.dailyCard.faction} · {home.dailyCard.rarity} · PODER {home.dailyCard.power}</Text>
                 <Text style={[styles.featuredCardAction, { color: colors.accent }]}>TOCA PARA INSPECCIONAR</Text>
               </View>
               <Ionicons name="chevron-forward" size={19} color={colors.accent} />
             </Pressable>
           ) : !homeLoading ? (
             <View style={[styles.featuredCardDock, { backgroundColor: `${colors.panelStrong}D9`, borderColor: colors.border }]}>
               <View style={[styles.featuredCardEmpty, { backgroundColor: colors.muted }]}>
                 <Ionicons name="layers-outline" size={19} color={colors.mutedForeground} />
               </View>
               <View style={styles.featuredCardCopy}>
                 <Text style={[styles.featuredCardMeta, { color: colors.accent }]}>CARTA DEL DÍA</Text>
                 <Text style={[styles.featuredCardTitle, { color: colors.foreground }]}>La rotación está en pausa.</Text>
                 <Text style={[styles.featuredCardMeta, { color: colors.mutedForeground }]}>Vuelve a sincronizar para descubrir la siguiente carta.</Text>
               </View>
             </View>
           ) : null}

           <View style={styles.scenePortalGrid}>
             {SCENE_PORTALS.map((portal) => (
               <ScenePortal key={portal.route} {...portal} colors={colors} testID={`home-portal-${portal.label.toLowerCase()}`} onPress={() => router.push(portal.route)} />
             ))}
           </View>

           <View style={[styles.heroStats, { borderTopColor: `${colors.accent}45` }]}>
            <View style={styles.heroStat}><Text style={[styles.heroStatValue, { color: colors.accent }]}>{home.stats?.total_cards ?? '—'}</Text><Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>CARTAS</Text></View>
            <View style={styles.heroStat}><Text style={[styles.heroStatValue, { color: colors.accent }]}>{home.stats?.active_players ?? '—'}</Text><Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>FORJADORES</Text></View>
            <View style={styles.heroStat}><Text style={[styles.heroStatValue, { color: colors.accent }]}>{home.stats?.total_battles ?? '—'}</Text><Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>BATALLAS</Text></View>
             <View style={styles.heroStat}><Text style={[styles.heroStatValue, { color: colors.accent }]}>{home.stats?.packs_opened ?? '—'}</Text><Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>PACKS ABIERTOS</Text></View>
          </View>
        </View>
      </Animated.View>

      <View style={styles.content}>
        {homeError ? (
          <View style={[styles.errorCard, { backgroundColor: colors.panel, borderColor: colors.danger }]}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.foreground }]}>{homeError}</Text>
            <Pressable accessibilityRole="button" testID="home-retry" onPress={() => void loadHome()}><Text style={[styles.retryText, { color: colors.accent }]}>REINTENTAR</Text></Pressable>
          </View>
        ) : null}

        <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(40).duration(450)} style={[styles.quickBattle, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
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

        <View style={[styles.connectionCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <View style={[styles.connectionDot, { backgroundColor: syncState === 'connected' ? colors.success : syncState === 'loading' ? colors.accent : colors.danger }]} />
          <View style={styles.connectionCopy}>
            <Text style={[styles.connectionTitle, { color: colors.foreground }]}>NEXUS {syncState === 'connected' ? 'CONECTADO' : syncState === 'loading' ? 'SINCRONIZANDO' : 'SIN CONEXIÓN'}</Text>
            <Text style={[styles.connectionBody, { color: colors.mutedForeground }]}>{syncState === 'connected' ? 'Datos vivos de Supabase oficial' : 'Desliza para volver a intentar'}</Text>
          </View>
          <Ionicons name={syncState === 'connected' ? 'checkmark-circle-outline' : 'cloud-outline'} size={21} color={syncState === 'connected' ? colors.success : colors.mutedForeground} />
        </View>

         <View style={styles.utilityRail}>
           {UTILITY_PORTALS.map((portal) => (
             <Pressable
               key={portal.route}
               accessibilityRole="button"
               testID={`home-utility-${portal.route.slice(1)}`}
               onPress={() => router.push(portal.route)}
               style={({ pressed }) => [styles.utilityPortal, { borderColor: colors.border, backgroundColor: colors.panel, opacity: pressed ? 0.72 : 1 }]}
             >
               <Ionicons name={portal.icon} size={16} color={colors.accent} />
               <Text style={[styles.utilityPortalText, { color: colors.foreground }]}>{portal.label}</Text>
             </Pressable>
           ))}
         </View>

        <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(80).duration(450)} style={[styles.resourceCard, { backgroundColor: colors.panelStrong, borderColor: colors.border }]}>
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
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(140).duration(450)} style={[styles.eventCard, { backgroundColor: colors.panelStrong, borderColor: colors.accent }]}>
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
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(140).duration(450)} style={[styles.seasonCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
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

        <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(260).duration(450)}>
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
          <View style={styles.sectionHeader}><SectionLabel color={colors.accent}>PRÓXIMAS MISIONES</SectionLabel><Pressable accessibilityRole="button" testID="home-missions" onPress={() => router.push('/missions')}><Text style={[styles.counter, { color: colors.accent }]}>VER MISIONES</Text></Pressable></View>
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

        <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(320).duration(450)}>
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
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: { minHeight: 620, overflow: 'hidden', borderBottomWidth: 1, borderTopWidth: 0, shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  heroImage: { opacity: 0.94 },
  heroGlow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: 74, left: -184, opacity: 0.8 },
  heroGlowRight: { position: 'absolute', width: 360, height: 360, borderRadius: 180, top: 150, right: -218, opacity: 0.82 },
  heroContent: { paddingHorizontal: 20, paddingBottom: 34 },
  sceneWord: { position: 'absolute', right: -20, top: 168, fontFamily: typography.display, fontSize: 84, letterSpacing: 8, transform: [{ rotate: '-12deg' }] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusHud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 9, marginTop: 18 },
  playerHud: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 },
  playerHudIcon: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hudEyebrow: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 1, fontWeight: '700' },
  hudName: { fontFamily: typography.bodyBold, fontSize: 13, fontWeight: '800', marginTop: 2, maxWidth: 160 },
  hudResource: { alignItems: 'flex-end', paddingLeft: 12 },
  hudValue: { fontFamily: typography.bodyBold, fontSize: 14, fontWeight: '800', marginTop: 2 },
  heroSignal: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 },
  signalDot: { width: 7, height: 7, borderRadius: 4 },
  signalText: { fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 1.2 },
  signalRule: { flex: 1, height: 1, marginHorizontal: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  kicker: { fontFamily: typography.bodyBold, fontSize: 15, fontWeight: '700', letterSpacing: 3 },
  subtitle: { fontFamily: typography.bodySemiBold, fontSize: 9, fontWeight: '600', letterSpacing: 2, marginTop: 3 },
  iconButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', top: 9, right: 10 },
  greeting: { marginTop: 40, marginBottom: 24 },
  eyebrow: { fontFamily: typography.bodyBold, fontSize: 10, letterSpacing: 1.6, fontWeight: '700' },
  title: { fontFamily: typography.display, fontSize: 42, lineHeight: 47, fontWeight: '700', letterSpacing: 0.3, marginTop: 12, textShadowColor: 'rgba(0,0,0,0.42)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12 },
  heroBody: { fontFamily: typography.body, fontSize: 15, lineHeight: 22, maxWidth: 310, marginTop: 14 },
  sceneAnchor: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 11, marginBottom: 13 },
  sceneAnchorRing: { position: 'absolute', left: 9, width: 40, height: 40, borderWidth: 1, borderRadius: 20 },
  sceneAnchorCore: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  sceneAnchorCopy: { flex: 1, gap: 2 },
  sceneAnchorEyebrow: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 1.1, fontWeight: '800' },
  sceneAnchorTitle: { fontFamily: typography.bodyBold, fontSize: 14, fontWeight: '800' },
  sceneAnchorBody: { fontFamily: typography.body, fontSize: 10, lineHeight: 14 },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryAction: { flex: 1.12 },
  secondaryAction: { flex: 0.88 },
  actionButton: { minHeight: 42, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 },
  actionText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
   heroStats: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 22, rowGap: 12, marginTop: 28, paddingTop: 17, borderTopWidth: 1 },
   heroStat: { alignItems: 'flex-start', minWidth: 62 },
  heroStatValue: { fontFamily: typography.bodyBold, fontSize: 23, fontWeight: '800' },
  heroStatLabel: { fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 1.2, fontWeight: '700', marginTop: 4 },
  sceneNotice: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginTop: 22 },
  sceneNoticeText: { fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 0.7 },
  featuredCardDock: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 10, marginTop: 14, shadowColor: '#000000', shadowOpacity: 0.34, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7 },
  featuredCardFrame: { width: 58, height: 78, borderWidth: 1, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  featuredCardImage: { width: '100%', height: '100%' },
  featuredCardCopy: { flex: 1, gap: 4 },
  featuredCardMeta: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.85, fontWeight: '700' },
  featuredCardTitle: { fontFamily: typography.bodyBold, fontSize: 15, lineHeight: 18, fontWeight: '800' },
  featuredCardAction: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.75, fontWeight: '800', marginTop: 2 },
  featuredCardEmpty: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 5 },
  featuredCardEmptyText: { fontFamily: typography.bodyBold, fontSize: 6, letterSpacing: 0.5, textAlign: 'center' },
  scenePortalGrid: { flexDirection: 'row', gap: 8, marginTop: 14 },
  scenePortal: { width: '22.7%', minHeight: 84, borderWidth: 1, borderRadius: 13, paddingHorizontal: 4, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', gap: 3 },
  scenePortalIcon: { width: 31, height: 31, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  scenePortalLabel: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.8, fontWeight: '800' },
  scenePortalHint: { fontFamily: typography.bodyBold, fontSize: 6.5, letterSpacing: 0.45, fontWeight: '700' },
  content: { padding: 20, paddingTop: 22, gap: 27 },
  connectionCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 14, shadowColor: '#000000', shadowOpacity: 0.32, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  connectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 11 },
  connectionCopy: { flex: 1 },
  connectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  connectionBody: { fontSize: 11, marginTop: 4 },
  utilityRail: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  utilityPortal: { flexGrow: 1, flexBasis: '30%', minHeight: 38, borderWidth: 1, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  utilityPortalText: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.45, fontWeight: '800', flexShrink: 1 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 13 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 17 },
  retryText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  resourceCard: { borderWidth: 1, borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000000', shadowOpacity: 0.34, shadowRadius: 20, shadowOffset: { width: 0, height: 11 }, elevation: 7 },
  balance: { fontSize: 32, fontWeight: '700', letterSpacing: 0.5, marginTop: 3 },
  resourceLabel: { fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginTop: 4 },
  resourceSide: { alignItems: 'flex-end' },
  resourcePill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  pillText: { fontSize: 16, fontWeight: '700' },
  eventCard: { borderWidth: 1, borderRadius: 18, padding: 18, shadowColor: '#000000', shadowOpacity: 0.32, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 7 },
  eventHeader: { flexDirection: 'row', gap: 12 },
  eventCopy: { flex: 1 },
  eventTitle: { fontSize: 19, fontWeight: '700', marginTop: 8, marginBottom: 5 },
  eventTimer: { alignItems: 'flex-end' },
   eventButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, marginTop: 15 },
   eventButtonText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  timerLabel: { fontSize: 9, letterSpacing: 1.1, fontWeight: '700' },
  timer: { fontSize: 15, fontWeight: '800', marginTop: 7 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 7 },
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
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 13, marginTop: 10, shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  missionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  missionCopy: { flex: 1 },
  cardTitle: { fontFamily: typography.bodyBold, fontSize: 14, fontWeight: '700' },
  cardBody: { fontFamily: typography.body, fontSize: 12, lineHeight: 17, marginTop: 3 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 13, marginTop: 10 },
  leaderRank: { width: 35, fontSize: 15, fontWeight: '800' },
  leaderCopy: { flex: 1 },
  leaderWins: { fontSize: 12, fontWeight: '800' },
  activityCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginTop: 12 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, paddingVertical: 12 },
  activityText: { flex: 1, fontSize: 11 },
  activityTime: { fontSize: 9 },
   quickBattle: { borderWidth: 1, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, shadowColor: '#000000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
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
   featureCard: { width: '48%', minHeight: 148, borderWidth: 1, borderRadius: 17, padding: 14, shadowColor: '#000000', shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
   featureIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
   featureTitle: { fontSize: 13, fontWeight: '800' },
   featureDescription: { fontSize: 11, lineHeight: 16, marginTop: 5 },
});