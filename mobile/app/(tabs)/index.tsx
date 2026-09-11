import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { ForgeIconName, VexIcon } from '@/components/ForgeIcon';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenShell } from '@/components/ScreenShell';
import { OFFICIAL_ASSETS } from '@/constants/visual';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { loadDailyFeaturedCard, loadHomeMissions, loadHomeStats, loadRecentActivity, type ActivityItem, type DailyCard, type HomeMission, type HomeStats } from '@/lib/supabase';

type IconName = ForgeIconName;
type HomeRoute = '/' | '/battle' | '/collection' | '/deck' | '/missions' | '/profile' | '/meta' | '/world' | '/tutorial' | '/economy' | '/store?mode=fusion' | '/store?mode=shop' | '/store?mode=evolution' | '/store?mode=packs';
type HomeState = 'loading' | 'ready' | 'partial' | 'error';
type AssetState = 'loading' | 'ready' | 'error';
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

function GlassButton({ label, icon, onPress, tone = 'gold', testID, large = false }: { label: string; icon: IconName; onPress: () => void; tone?: 'gold' | 'violet' | 'blue' | 'quiet'; testID: string; large?: boolean }) {
  const colors = useColors();
  const palette = {
    gold: { fill: `${colors.accent}E8`, border: colors.accent, text: colors.ink },
    violet: { fill: `${colors.rarityEpic}25`, border: `${colors.rarityEpic}99`, text: colors.foreground },
    blue: { fill: `${colors.rarityRare}20`, border: `${colors.rarityRare}88`, text: colors.foreground },
    quiet: { fill: `${colors.panelStrong}CC`, border: `${colors.border}CC`, text: colors.foreground },
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
      style={({ pressed }) => [styles.glassButton, large && styles.glassButtonLarge, { backgroundColor: palette.fill, borderColor: palette.border, opacity: pressed ? 0.78 : 1 }]}
    >
      <Icon name={icon} color={palette.text} size={large ? 17 : 15} />
      <Text style={[styles.glassButtonText, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

function SectionHeading({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <View>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {action && onAction ? (
        <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onAction} style={styles.sectionAction}>
          <Text style={[styles.sectionActionText, { color: colors.mutedForeground }]}>{action}</Text>
          <Icon name="arrow-up" color={colors.accent} size={14} />
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
  const [featuredAssetState, setFeaturedAssetState] = useState<AssetState>('loading');
  const [nexusAssetState, setNexusAssetState] = useState<AssetState>('loading');
  const [featuredExpanded, setFeaturedExpanded] = useState(false);
  const pulse = useSharedValue(0);

  const loadHome = useCallback(async () => {
    setHomeState((current) => (current === 'ready' ? 'loading' : current));
    const results = await Promise.allSettled([
      loadHomeStats(),
      loadDailyFeaturedCard(),
      loadHomeMissions(),
      loadRecentActivity(5),
    ]);
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
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse, reduceMotion]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: 0.22 + pulse.value * 0.22, transform: [{ scale: 0.92 + pulse.value * 0.12 }] }));
  const activeCard = home.card ?? featuredCards[0] ?? null;
  const playerName = capitalize(player?.display_name, 'Forjador');
  const activeEvent = home.stats?.active_event ?? null;
  const season = home.stats?.season ?? null;
  const xp = progress?.xp ?? 0;
  const xpToNext = progress?.xp_to_next ?? 0;
  const xpRatio = xpToNext > 0 ? xp / xpToNext : 0;
  const connectionLabel = syncState === 'connected' ? 'NEXUS ONLINE' : syncState === 'offline' ? 'NEXUS OFFLINE' : 'SINCRONIZANDO';
  const connectionColor = syncState === 'connected' ? colors.success : syncState === 'offline' ? colors.danger : colors.accent;
  const viewportPadding = Math.max(18, Math.min(26, width * 0.06));

  useEffect(() => {
    setFeaturedAssetState(activeCard?.image_url ? 'loading' : 'error');
  }, [activeCard?.id, activeCard?.image_url]);

  const navigate = (route: HomeRoute) => {
    void Haptics.selectionAsync().catch(() => undefined);
    if (route === '/') router.replace('/');
    else router.push(route);
  };

  const doRefresh = async () => {
    setRefreshing(true);
    setNexusAssetState('loading');
    await Promise.allSettled([loadHome(), refresh()]);
    setRefreshing(false);
  };

  const openFeatured = () => {
    setFeaturedExpanded((expanded) => !expanded);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const retry = () => {
    void doRefresh();
  };

  const missionsLabel = home.missions.length === 1 ? 'MISIÓN ACTIVA' : 'MISIONES ACTIVAS';
  const ranking = home.stats?.top3 ?? [];
  const hasPlayerData = Boolean(player || progress || wallet || playerStats);

  return (
    <ScreenShell surface="home" sceneMode="shell">
      <View style={styles.root} testID="home-scene">
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(12, insets.top + 10), paddingHorizontal: viewportPadding, paddingBottom: Math.max(32, insets.bottom + 28) }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
          showsVerticalScrollIndicator={false}
          accessibilityLabel="Inicio de Vexforge"
        >
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(520)} style={styles.topBar}>
            <View style={styles.brandLockup}>
              <View style={[styles.brandMark, { borderColor: `${colors.accent}88`, backgroundColor: `${colors.ink}88` }]}>
                <Text style={[styles.brandMarkText, { color: colors.accent }]}>V</Text>
              </View>
              <View>
                <Text style={[styles.brandName, { color: colors.foreground }]}>VEXFORGE</Text>
                <Text style={[styles.brandSubline, { color: colors.mutedForeground }]}>NEXUS // FORJA ACTIVA</Text>
              </View>
            </View>
            <View style={styles.topActions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" testID="home-profile" onPress={() => navigate('/profile')} style={[styles.iconButton, { borderColor: `${colors.accent}4D`, backgroundColor: `${colors.panelStrong}B8` }]}>
                <Icon name="user" color={colors.accent} size={17} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Abrir mensajes y misiones" testID="home-inbox" onPress={() => navigate('/missions')} style={[styles.iconButton, { borderColor: `${colors.accent}4D`, backgroundColor: `${colors.panelStrong}B8` }]}>
                <Icon name="inbox" color={colors.foreground} size={17} />
                {home.missions.length > 0 ? <View style={[styles.notificationDot, { backgroundColor: colors.accent }]} /> : null}
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Abrir ajustes" testID="home-settings" onPress={() => navigate('/meta')} style={[styles.iconButton, { borderColor: `${colors.accent}4D`, backgroundColor: `${colors.panelStrong}B8` }]}>
                <Icon name="settings" color={colors.foreground} size={17} />
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(80).duration(520)} style={[styles.syncPill, { borderColor: `${connectionColor}66`, backgroundColor: `${colors.ink}A6` }]} testID="home-sync">
            <View style={[styles.syncPulse, { backgroundColor: connectionColor }]} />
            <Text style={[styles.syncText, { color: connectionColor }]}>{connectionLabel}</Text>
            <Text style={[styles.syncDivider, { color: `${colors.mutedForeground}80` }]}>/</Text>
            <Text style={[styles.syncMeta, { color: colors.mutedForeground }]}>{homeState === 'partial' ? 'SEÑAL PARCIAL' : season?.name ?? 'ECLIPSE // 07'}</Text>
          </Animated.View>

          {homeState === 'error' ? (
            <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(350)} style={[styles.errorBanner, { borderColor: `${colors.danger}80`, backgroundColor: `${colors.panelStrong}E6` }]} testID="home-retry">
              <Icon name="alert-triangle" color={colors.danger} size={18} />
              <View style={styles.errorCopy}>
                <Text style={[styles.errorTitle, { color: colors.foreground }]}>SEÑAL INTERRUMPIDA</Text>
                <Text style={[styles.errorBody, { color: colors.mutedForeground }]}>{syncError ?? 'No se pudo sincronizar la señal del Nexus.'}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Reintentar sincronización" onPress={retry} style={[styles.retryButton, { borderColor: colors.danger }]}>
                <Text style={[styles.retryText, { color: colors.danger }]}>REINTENTAR</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(150).duration(650)} style={[styles.heroCard, { borderColor: `${colors.accent}52`, backgroundColor: `${colors.panelStrong}D9` }]}>
            <Image
              source={{ uri: OFFICIAL_ASSETS.homeNexusBurst }}
              style={styles.heroNexus}
              resizeMode="cover"
              onLoad={() => setNexusAssetState('ready')}
              onError={() => setNexusAssetState('error')}
              accessibilityLabel="Atmósfera oficial del núcleo Nexus"
            />
            {nexusAssetState === 'error' ? <View style={[styles.nexusError, { borderColor: `${colors.danger}66` }]} testID="home-nexus-burst-error"><Text style={[styles.nexusErrorText, { color: colors.danger }]}>NEXUS CORE OFFLINE</Text></View> : null}
            <View style={styles.heroGlow} pointerEvents="none" />
            <View style={styles.heroTopLine}>
              <View>
                <Text style={[styles.heroEyebrow, { color: colors.accent }]}>TEMPORADA ACTIVA</Text>
                <Text style={[styles.heroSeason, { color: colors.foreground }]}>{season?.name ?? 'ECLIPSE // SEASON 07'}</Text>
              </View>
              <View style={[styles.heroStatus, { borderColor: `${connectionColor}66` }]}>
                <Text style={[styles.heroStatusText, { color: connectionColor }]}>{activeEvent ? 'FRENTE VIVO' : 'NEXUS CALIBRADO'}</Text>
              </View>
            </View>
            <Text style={[styles.heroHeadline, { color: colors.foreground }]}>ENTRA AL VEX</Text>
            <Text style={[styles.heroDescription, { color: colors.mutedForeground }]}>Forja tu identidad. Lee el frente. Decide cuándo cruzar el umbral.</Text>
            <View style={styles.heroActions}>
              <GlassButton label="ENTRAR A LA ARENA" icon="crosshair" onPress={() => navigate('/battle')} testID="home-battle" large />
              <GlassButton label="CONTINUAR RITO" icon="arrow-right" onPress={() => navigate('/tutorial')} tone="violet" testID="home-tutorial" />
            </View>
            <View style={styles.heroFooter}>
              <View style={styles.heroFooterItem}><Icon name="zap" color={colors.accent} size={13} /><Text style={[styles.heroFooterText, { color: colors.mutedForeground }]}>{progress ? `${formatNumber(progress.energy)} / ${formatNumber(progress.max_energy)} ENERGÍA` : 'ENERGÍA EN ESPERA'}</Text></View>
              <View style={styles.heroFooterItem}><Icon name="gem" color={colors.rarityEpic} size={13} /><Text style={[styles.heroFooterText, { color: colors.mutedForeground }]}>{formatNumber(wallet?.vex_ingame)} VEX</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Abrir mundo" testID="home-world" onPress={() => navigate('/world')} style={styles.heroFooterItem}><Icon name="globe" color={colors.rarityRare} size={13} /><Text style={[styles.heroFooterText, { color: colors.rarityRare }]}>MUNDO</Text></Pressable>
            </View>
          </Animated.View>

          <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(250).duration(600)} style={styles.playerStrip}>
            <View style={styles.playerIdentity}>
              <View style={[styles.avatarRing, { borderColor: `${colors.accent}99` }]}><Text style={[styles.avatarLetter, { color: colors.accent }]}>{playerName.slice(0, 1).toUpperCase()}</Text></View>
              <View style={styles.playerCopy}><Text style={[styles.playerName, { color: colors.foreground }]}>{playerName}</Text><Text style={[styles.playerMeta, { color: colors.mutedForeground }]}>NIVEL {formatNumber(progress?.level)} / FORJADOR</Text></View>
            </View>
            <View style={styles.playerProgress}><View style={styles.levelLine}><Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>RANGO DE FORJA</Text><Text style={[styles.progressValue, { color: colors.accent }]}>{formatNumber(xp)} / {formatNumber(xpToNext)} XP</Text></View><ProgressRail value={xp} total={xpToNext} color={colors.accent} background={`${colors.accent}21`} /></View>
          </Animated.View>

          <View style={styles.metricGrid}>
            <Metric label="CARTAS" value={hasPlayerData ? formatNumber(progress?.level ? playerStats?.cards_owned ?? cardsTotal : cardsTotal) : formatNumber(cardsTotal)} icon="layers" color={colors.rarityRare} />
            <Metric label="VICTORIAS" value={formatNumber(playerStats?.pvp_wins)} icon="award" color={colors.accent} />
            <Metric label="BATALLAS" value={formatNumber(home.stats?.total_battles)} icon="activity" color={colors.rarityEpic} />
            <Metric label="PACKS" value={formatNumber(home.stats?.packs_opened)} icon="packs" color={colors.success} />
          </View>

          <SectionHeading eyebrow="SEÑAL DEL NEXUS" title="El frente de hoy" action="VER MUNDO" onAction={() => navigate('/world')} />
          <Pressable accessibilityRole="button" accessibilityLabel="Abrir evento activo" testID="home-event" onPress={() => navigate('/world')} style={[styles.eventCard, { borderColor: `${colors.rarityRare}66`, backgroundColor: `${colors.panelStrong}DB` }]}>
            <View style={[styles.eventOrb, { borderColor: `${colors.rarityRare}66` }]}><Animated.View style={[styles.eventOrbCore, { backgroundColor: colors.rarityRare }, pulseStyle]} /></View>
            <View style={styles.eventCopy}><Text style={[styles.eventType, { color: colors.rarityRare }]}>{activeEvent?.type?.toUpperCase() ?? 'SEÑAL GLOBAL'}</Text><Text style={[styles.eventTitle, { color: colors.foreground }]}>{activeEvent?.name ?? 'El Nexus espera un nuevo frente'}</Text><Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>{activeEvent ? `CIERRA EN ${formatEventTime(activeEvent.ends_at)}` : 'No hay evento activo publicado'}</Text></View>
            <View style={styles.eventProgress}><Text style={[styles.eventProgressValue, { color: colors.rarityRare }]}>{activeEvent ? `${Math.round(activeEvent.progress)}%` : '—'}</Text><ProgressRail value={activeEvent?.progress ?? 0} total={100} color={colors.rarityRare} background={`${colors.rarityRare}20`} /><Icon name="arrow-up" color={colors.rarityRare} size={16} /></View>
          </Pressable>

          <SectionHeading eyebrow={missionsLabel} title="Acciones que forjan" action="ABRIR MISIONES" onAction={() => navigate('/missions')} />
          {home.missions.length > 0 ? (
            <View style={styles.missionList}>
              {home.missions.slice(0, 3).map((mission, index) => <MissionRow key={mission.id} mission={mission} index={index} onPress={() => navigate('/missions')} />)}
            </View>
          ) : (
            <View style={[styles.emptyCard, { borderColor: `${colors.border}CC`, backgroundColor: `${colors.panelStrong}D9` }]}><Icon name="compass" color={colors.mutedForeground} size={22} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>SIN FRENTE ACTIVO</Text><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Las próximas misiones aparecerán cuando el Nexus publique el siguiente ciclo.</Text></View>
          )}

          <SectionHeading eyebrow="CARTA DESTACADA" title="Objeto de resonancia" action="ABRIR ARCHIVO" onAction={() => navigate('/collection')} />
          <Pressable accessibilityRole="button" accessibilityLabel="Inspeccionar carta destacada" testID="home-featured-card" onPress={openFeatured} style={[styles.featuredCard, { borderColor: `${colors.rarityLegendary}70`, backgroundColor: `${colors.panelStrong}E8` }]}>
            <View style={styles.featuredArtFrame}>
              {activeCard?.image_url && featuredAssetState !== 'error' ? <Image source={{ uri: activeCard.image_url }} style={styles.featuredArt} resizeMode="cover" onLoad={() => setFeaturedAssetState('ready')} onError={() => setFeaturedAssetState('error')} accessibilityLabel={`Arte oficial de ${activeCard.name}`} /> : null}
              {featuredAssetState === 'loading' ? <View style={styles.assetLoading}><Icon name="loader" color={colors.accent} size={20} /><Text style={[styles.assetStateText, { color: colors.mutedForeground }]}>SINCRONIZANDO ARTE</Text></View> : null}
              {featuredAssetState === 'error' ? <View style={styles.assetError}><Icon name="warning" color={colors.danger} size={22} /><Text style={[styles.assetErrorTitle, { color: colors.foreground }]}>ARTE NO DISPONIBLE</Text><Text style={[styles.assetErrorBody, { color: colors.mutedForeground }]}>El registro oficial no devolvió una imagen válida.</Text></View> : null}
              <View style={styles.featuredSheen} pointerEvents="none" />
            </View>
            <View style={styles.featuredCopy}><View style={styles.featuredTagLine}><Text style={[styles.featuredTag, { color: colors.rarityLegendary }]}>{activeCard?.rarity?.toUpperCase() ?? 'SIN CARTA'}</Text><Text style={[styles.featuredCode, { color: colors.mutedForeground }]}>{activeCard?.code ?? '—'}</Text></View><Text style={[styles.featuredName, { color: colors.foreground }]}>{activeCard?.name ?? 'La señal aún no tiene carta'}</Text><Text style={[styles.featuredFaction, { color: colors.mutedForeground }]}>{activeCard?.faction ?? 'ARCHIVO VEXFORGE'}{activeCard?.power ? `  /  PODER ${formatNumber(activeCard.power)}` : ''}</Text>{featuredExpanded ? <Text style={[styles.featuredLore, { color: colors.mutedForeground }]}>{activeCard?.lore ?? 'La resonancia de esta carta todavía no ha sido registrada.'}</Text> : <Text style={[styles.featuredHint, { color: colors.accent }]}>TOCA PARA INSPECCIONAR</Text>}</View>
          </Pressable>

          <View style={styles.dualGrid}>
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir Forja" testID="home-forge" onPress={() => navigate('/deck')} style={[styles.portalCard, { borderColor: `${colors.rarityEpic}66`, backgroundColor: `${colors.panelStrong}E0` }]}><View style={[styles.portalIcon, { backgroundColor: `${colors.rarityEpic}22`, borderColor: `${colors.rarityEpic}66` }]}><Icon name="deck" color={colors.rarityEpic} size={19} /></View><Text style={[styles.portalEyebrow, { color: colors.rarityEpic }]}>FORJA</Text><Text style={[styles.portalTitle, { color: colors.foreground }]}>Construye tu línea</Text><Text style={[styles.portalBody, { color: colors.mutedForeground }]}>Mazos y formación</Text><Icon name="arrow-up" color={colors.rarityEpic} size={15} style={styles.portalArrow} /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir economía" testID="home-economy" onPress={() => navigate('/economy')} style={[styles.portalCard, { borderColor: `${colors.accent}66`, backgroundColor: `${colors.panelStrong}E0` }]}><View style={[styles.portalIcon, { backgroundColor: `${colors.accent}18`, borderColor: `${colors.accent}66` }]}><Icon name="trending-up-outline" color={colors.accent} size={19} /></View><Text style={[styles.portalEyebrow, { color: colors.accent }]}>ECONOMÍA</Text><Text style={[styles.portalTitle, { color: colors.foreground }]}>Mueve el VEX</Text><Text style={[styles.portalBody, { color: colors.mutedForeground }]}>Mercado y recursos</Text><Icon name="arrow-up" color={colors.accent} size={15} style={styles.portalArrow} /></Pressable>
          </View>

          <View style={[styles.storePortal, { borderColor: `${colors.success}52`, backgroundColor: `${colors.panelStrong}D9` }]}>
            <View style={styles.storePortalHeading}><View><Text style={[styles.portalEyebrow, { color: colors.success }]}>SISTEMAS DE LA FORJA</Text><Text style={[styles.storePortalTitle, { color: colors.foreground }]}>Abre el siguiente ciclo</Text></View><Icon name="shop" color={colors.success} size={18} /></View>
            <View style={styles.storeActions}>
              <GlassButton label="PACKS" icon="packs" onPress={() => navigate('/store?mode=packs')} tone="quiet" testID="home-store-packs" />
              <GlassButton label="TIENDA" icon="shop" onPress={() => navigate('/store?mode=shop')} tone="quiet" testID="home-store-shop" />
              <GlassButton label="FUSIÓN" icon="fusion" onPress={() => navigate('/store?mode=fusion')} tone="quiet" testID="home-store-fusion" />
              <GlassButton label="EVOLUCIÓN" icon="evolution" onPress={() => navigate('/store?mode=evolution')} tone="quiet" testID="home-store-evolution" />
            </View>
          </View>

          <SectionHeading eyebrow="PULSO PÚBLICO" title="Actividad del Nexus" action="VER RANKING" onAction={() => navigate('/world')} />
          <View style={[styles.activityPanel, { borderColor: `${colors.border}CC`, backgroundColor: `${colors.panelStrong}D9` }]}>
            {home.activity.length > 0 ? home.activity.slice(0, 3).map((item) => <View key={item.id} style={styles.activityRow}><View style={[styles.activityDot, { backgroundColor: colors.success }]} /><View style={styles.activityText}><Text style={[styles.activityCopy, { color: colors.foreground }]}>{item.text}</Text><Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{new Date(item.time).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}</Text></View></View>) : <View style={styles.emptyActivity}><Icon name="radio" color={colors.mutedForeground} size={18} /><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>El pulso público se mostrará cuando exista actividad confirmada.</Text></View>}
          </View>

          <SectionHeading eyebrow="CIRCUITO ACTIVO" title="Top del frente" action="ABRIR MUNDO" onAction={() => navigate('/world')} />
          <View style={[styles.rankingPanel, { borderColor: `${colors.accent}52`, backgroundColor: `${colors.panelStrong}D9` }]}>
            {ranking.length > 0 ? ranking.map((entry, index) => <View key={`${entry.rank}-${entry.display_name}`} style={styles.rankingRow}><Text style={[styles.rankPosition, { color: index === 0 ? colors.accent : colors.mutedForeground }]}>{String(entry.rank).padStart(2, '0')}</Text><View style={[styles.rankAvatar, { borderColor: `${index === 0 ? colors.accent : colors.border}99` }]}><Text style={[styles.rankAvatarText, { color: index === 0 ? colors.accent : colors.mutedForeground }]}>{entry.display_name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.rankIdentity}><Text style={[styles.rankName, { color: colors.foreground }]}>{entry.display_name}</Text><Text style={[styles.rankMeta, { color: colors.mutedForeground }]}>{formatNumber(entry.wins)} VICTORIAS / {formatNumber(entry.mmr)} MMR</Text></View><Icon name={index === 0 ? 'award' : 'chevron-right'} color={index === 0 ? colors.accent : colors.mutedForeground} size={16} /></View>) : <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>El ranking de la temporada todavía no tiene posiciones publicadas.</Text>}
          </View>
        </ScrollView>
      </View>
    </ScreenShell>
  );
}

function Metric({ label, value, icon, color }: { label: string; value: string; icon: IconName; color: string }) {
  const colors = useColors();
  return <View style={[styles.metricCard, { borderColor: `${color}52`, backgroundColor: `${colors.panelStrong}C9` }]}><Icon name={icon} color={color} size={15} /><Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

function MissionRow({ mission, index, onPress }: { mission: HomeMission; index: number; onPress: () => void }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir misión ${mission.name}`} testID="home-missions" onPress={onPress} style={({ pressed }) => [styles.missionRow, { borderColor: `${colors.border}CC`, backgroundColor: `${colors.panelStrong}D9`, opacity: pressed ? 0.72 : 1 }]}><View style={[styles.missionIndex, { borderColor: `${colors.accent}66` }]}><Text style={[styles.missionIndexText, { color: colors.accent }]}>0{index + 1}</Text></View><View style={styles.missionCopy}><Text style={[styles.missionName, { color: colors.foreground }]}>{mission.name}</Text><Text style={[styles.missionMeta, { color: colors.mutedForeground }]}>{capitalize(mission.difficulty, 'RITO')}  /  {formatNumber(mission.reward_xp)} XP  /  {formatNumber(mission.reward_vex_ingame)} VEX</Text></View><Icon name="chevron-right" color={colors.accent} size={17} /></Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { gap: 16 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  brandLockup: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  brandMark: { alignItems: 'center', borderRadius: 10, borderWidth: 1, height: 35, justifyContent: 'center', width: 35 },
  brandMarkText: { fontFamily: 'Cinzel_700Bold', fontSize: 19, letterSpacing: 1 },
  brandName: { fontFamily: 'Cinzel_700Bold', fontSize: 14, letterSpacing: 2.5 },
  brandSubline: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 1.5, marginTop: 2 },
  topActions: { flexDirection: 'row', gap: 7 },
  iconButton: { alignItems: 'center', borderRadius: 10, borderWidth: 1, height: 34, justifyContent: 'center', position: 'relative', width: 34 },
  notificationDot: { borderRadius: 3, height: 6, position: 'absolute', right: 7, top: 6, width: 6 },
  syncPill: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: 4, borderWidth: 1, flexDirection: 'row', gap: 7, paddingHorizontal: 9, paddingVertical: 5 },
  syncPulse: { borderRadius: 4, height: 6, width: 6 },
  syncText: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1.15 },
  syncDivider: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 10 },
  syncMeta: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 10, letterSpacing: 0.9 },
  errorBanner: { alignItems: 'center', borderRadius: 10, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  errorCopy: { flex: 1, gap: 2 },
  errorTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 1 },
  errorBody: { fontFamily: 'Rajdhani_500Medium', fontSize: 11, lineHeight: 15 },
  retryButton: { borderRadius: 5, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 7 },
  retryText: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.8 },
  heroCard: { borderRadius: 17, borderWidth: 1, overflow: 'hidden', padding: 18, position: 'relative' },
  heroNexus: { height: 210, opacity: 0.16, position: 'absolute', right: -58, top: -35, width: 250 },
  nexusError: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 4, position: 'absolute', right: 15, top: 14 },
  nexusErrorText: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 0.9 },
  heroGlow: { backgroundColor: '#C9901F22', borderRadius: 160, height: 230, position: 'absolute', right: -98, top: -130, width: 230 },
  heroTopLine: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  heroEyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1.8 },
  heroSeason: { fontFamily: 'Cinzel_600SemiBold', fontSize: 16, letterSpacing: 0.8, marginTop: 5 },
  heroStatus: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 5 },
  heroStatusText: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.9 },
  heroHeadline: { fontFamily: 'Cinzel_700Bold', fontSize: 34, letterSpacing: 1, marginTop: 20 },
  heroDescription: { fontFamily: 'Rajdhani_500Medium', fontSize: 15, lineHeight: 20, marginTop: 5, maxWidth: 290 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 17 },
  glassButton: { alignItems: 'center', borderRadius: 7, borderWidth: 1, flexDirection: 'row', gap: 7, minHeight: 37, paddingHorizontal: 12, paddingVertical: 9 },
  glassButtonLarge: { minHeight: 45, paddingHorizontal: 15 },
  glassButtonText: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 1 },
  heroFooter: { borderTopColor: '#FFFFFF14', borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 13, marginTop: 17, paddingTop: 12 },
  heroFooterItem: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  heroFooterText: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 10, letterSpacing: 0.65 },
  playerStrip: { alignItems: 'center', backgroundColor: '#0D0D1AD9', borderColor: '#242448CC', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 14, padding: 13 },
  playerIdentity: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  avatarRing: { alignItems: 'center', borderRadius: 22, borderWidth: 1, height: 39, justifyContent: 'center', width: 39 },
  avatarLetter: { fontFamily: 'Cinzel_700Bold', fontSize: 17 },
  playerCopy: { gap: 1 },
  playerName: { fontFamily: 'Rajdhani_700Bold', fontSize: 14, letterSpacing: 0.7 },
  playerMeta: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 0.9 },
  playerProgress: { flex: 1, gap: 7 },
  levelLine: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.9 },
  progressValue: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.4 },
  progressRail: { borderRadius: 6, height: 6, overflow: 'hidden', width: '100%' },
  progressFill: { borderRadius: 6, height: '100%' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard: { alignItems: 'flex-start', borderRadius: 10, borderWidth: 1, flexGrow: 1, minWidth: '22%', padding: 10 },
  metricValue: { fontFamily: 'Cinzel_700Bold', fontSize: 16, marginTop: 7 },
  metricLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1, marginTop: 2 },
  sectionHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  eyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.8 },
  sectionTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 18, letterSpacing: 0.4, marginTop: 3 },
  sectionAction: { alignItems: 'center', flexDirection: 'row', gap: 3, paddingBottom: 2 },
  sectionActionText: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.8 },
  eventCard: { alignItems: 'center', borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 14 },
  eventOrb: { alignItems: 'center', borderRadius: 26, borderWidth: 1, height: 52, justifyContent: 'center', width: 52 },
  eventOrbCore: { borderRadius: 14, height: 26, width: 26 },
  eventCopy: { flex: 1, gap: 3 },
  eventType: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.4 },
  eventTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 14, lineHeight: 18 },
  eventMeta: { fontFamily: 'Rajdhani_500Medium', fontSize: 10, letterSpacing: 0.6 },
  eventProgress: { alignItems: 'flex-end', gap: 6, width: 48 },
  eventProgressValue: { fontFamily: 'Rajdhani_700Bold', fontSize: 13 },
  missionList: { gap: 8 },
  missionRow: { alignItems: 'center', borderRadius: 10, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 12 },
  missionIndex: { alignItems: 'center', borderRadius: 6, borderWidth: 1, height: 32, justifyContent: 'center', width: 32 },
  missionIndexText: { fontFamily: 'Rajdhani_700Bold', fontSize: 11 },
  missionCopy: { flex: 1, gap: 3 },
  missionName: { fontFamily: 'Rajdhani_700Bold', fontSize: 14, letterSpacing: 0.3 },
  missionMeta: { fontFamily: 'Rajdhani_500Medium', fontSize: 10, letterSpacing: 0.55 },
  emptyCard: { alignItems: 'center', borderRadius: 12, borderWidth: 1, gap: 8, paddingHorizontal: 20, paddingVertical: 24 },
  emptyTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 12, letterSpacing: 1.2 },
  emptyBody: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, lineHeight: 17, textAlign: 'center' },
  featuredCard: { borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 13, overflow: 'hidden', padding: 10 },
  featuredArtFrame: { backgroundColor: '#05050D', borderColor: '#F0C05055', borderRadius: 9, height: 154, overflow: 'hidden', position: 'relative', width: 112 },
  featuredArt: { height: '100%', width: '100%' },
  featuredSheen: { backgroundColor: '#FFFFFF18', height: 15, left: -20, position: 'absolute', top: 26, transform: [{ rotate: '-24deg' }], width: 170 },
  assetLoading: { alignItems: 'center', gap: 8, inset: 0, justifyContent: 'center', position: 'absolute' },
  assetStateText: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 0.9, textAlign: 'center' },
  assetError: { alignItems: 'center', gap: 6, inset: 0, justifyContent: 'center', padding: 10, position: 'absolute' },
  assetErrorTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.8, textAlign: 'center' },
  assetErrorBody: { fontFamily: 'Rajdhani_500Medium', fontSize: 9, lineHeight: 12, textAlign: 'center' },
  featuredCopy: { flex: 1, justifyContent: 'center', paddingVertical: 7 },
  featuredTagLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  featuredTag: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1.2 },
  featuredCode: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 0.8 },
  featuredName: { fontFamily: 'Cinzel_600SemiBold', fontSize: 18, lineHeight: 23, marginTop: 11 },
  featuredFaction: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 10, letterSpacing: 0.5, marginTop: 5 },
  featuredLore: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, lineHeight: 16, marginTop: 11 },
  featuredHint: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.1, marginTop: 17 },
  dualGrid: { flexDirection: 'row', gap: 9 },
  storePortal: { borderRadius: 12, borderWidth: 1, padding: 13 },
  storePortalHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  storePortalTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 15, marginTop: 4 },
  storeActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  portalCard: { borderRadius: 12, borderWidth: 1, flex: 1, minHeight: 130, padding: 12, position: 'relative' },
  portalIcon: { alignItems: 'center', borderRadius: 8, borderWidth: 1, height: 35, justifyContent: 'center', width: 35 },
  portalEyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.2, marginTop: 12 },
  portalTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 13, lineHeight: 18, marginTop: 4 },
  portalBody: { fontFamily: 'Rajdhani_500Medium', fontSize: 10, marginTop: 2 },
  portalArrow: { bottom: 12, position: 'absolute', right: 12 },
  activityPanel: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 4 },
  activityRow: { alignItems: 'center', borderBottomColor: '#FFFFFF10', borderBottomWidth: 1, flexDirection: 'row', gap: 10, paddingVertical: 11 },
  activityRowLast: { borderBottomWidth: 0 },
  activityDot: { borderRadius: 4, height: 7, width: 7 },
  activityText: { flex: 1, gap: 3 },
  activityCopy: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, lineHeight: 16 },
  activityTime: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.8 },
  emptyActivity: { alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingVertical: 20 },
  rankingPanel: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 13 },
  rankingRow: { alignItems: 'center', borderBottomColor: '#FFFFFF10', borderBottomWidth: 1, flexDirection: 'row', gap: 9, paddingVertical: 11 },
  rankPosition: { fontFamily: 'Rajdhani_700Bold', fontSize: 11, width: 21 },
  rankAvatar: { alignItems: 'center', borderRadius: 16, borderWidth: 1, height: 30, justifyContent: 'center', width: 30 },
  rankAvatarText: { fontFamily: 'Cinzel_700Bold', fontSize: 12 },
  rankIdentity: { flex: 1, gap: 2 },
  rankName: { fontFamily: 'Rajdhani_700Bold', fontSize: 13, letterSpacing: 0.3 },
  rankMeta: { fontFamily: 'Rajdhani_500Medium', fontSize: 9, letterSpacing: 0.65 },
});
