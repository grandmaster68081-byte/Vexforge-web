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
import { getCardIdentityVisual } from '@/constants/cardIdentity';
import { DOMAIN_IDENTITY, DEPTH, MOTION, VISUAL_TOKENS } from '@/constants/experience';
import { CANONICAL_BACKGROUNDS } from '@/constants/visual';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import {
  loadDailyFeaturedCard,
  loadHomeIdentityCard,
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
type RemoteHome = { stats: HomeStats | null; card: DailyCard | null; identityCard: DailyCard | null; missions: HomeMission[]; activity: ActivityItem[] };

const INITIAL_HOME: RemoteHome = { stats: null, card: null, identityCard: null, missions: [], activity: [] };

function formatNumber(value: number | null | undefined, fallback = 'NO REPORTADO') {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return new Intl.NumberFormat('es-ES').format(Math.max(0, Math.round(value)));
}

function formatMetric(value: number | null | undefined, unit: string, fallback: string) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return `${formatNumber(value)} ${unit}`;
}

function formatPair(first: number | null | undefined, second: number | null | undefined, unit: string, firstFallback: string, secondFallback: string) {
  return `${formatNumber(first, firstFallback)} / ${formatNumber(second, secondFallback)} ${unit}`;
}

function formatEventProgress(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'PROGRESO NO REPORTADO';
  return `${Math.round(value)}%`;
}

function formatEventTime(endsAt: string | null | undefined) {
  if (!endsAt) return 'FECHA NO REPORTADA';
  const endsAtMs = new Date(endsAt).getTime();
  if (!Number.isFinite(endsAtMs)) return 'FECHA NO REPORTADA';
  const remaining = Math.max(0, endsAtMs - Date.now());
  const hours = Math.floor(remaining / 3600000);
  const days = Math.floor(hours / 24);
  return days > 0 ? `${days}D ${hours % 24}H` : `${hours}H ${Math.floor((remaining % 3600000) / 60000)}M`;
}

function capitalize(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  if (!normalized) return fallback;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function cardCodeLabel(value: string | null | undefined) {
  return value?.trim() || 'CÓDIGO NO REPORTADO';
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
        {
          backgroundColor: secondary ? `${colors.ink}99` : undefined,
          borderColor: secondary ? `${colors.foreground}66` : colors.accent,
          opacity: pressed ? 0.76 : 1,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
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
            <View style={[styles.markerSeal, { borderColor: `${markerColor}A8`, backgroundColor: `${markerColor}12` }]}>
              <View style={[styles.markerSealCore, { backgroundColor: markerColor }]} />
            </View>
          <Text style={[styles.eyebrow, { color: markerColor }]}>{eyebrow}</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {action && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action}
          onPress={onAction}
          style={({ pressed }) => [styles.markerAction, { opacity: pressed ? 0.68 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }]}
        >
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
  portal: { id: string; label: string; title: string; status: string; icon: IconName; route: HomeRoute; color: string; active: boolean };
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
      style={({ pressed }) => [
        styles.domainWorldObject,
        { opacity: pressed ? 0.72 : portal.active ? 1 : 0.68, transform: [{ translateY: pressed ? 2 : 0 }] },
      ]}
    >
      <View style={styles.domainWorldObjectTop}>
        <View style={[styles.domainWorldHalo, { borderColor: `${portal.color}${portal.active ? '70' : '38'}`, backgroundColor: portal.active ? `${portal.color}0C` : `${colors.ink}1C` }]}>
          <View style={[styles.domainWorldSigil, { borderColor: `${portal.color}${portal.active ? 'B8' : '58'}`, backgroundColor: portal.active ? `${portal.color}18` : `${colors.ink}22` }]}>
            <View style={styles.domainWorldGlyph}>
              <Icon name={portal.icon} color={portal.color} size={VISUAL_TOKENS.domainPortal.iconSize} />
            </View>
          </View>
          <View style={[styles.domainWorldCore, { backgroundColor: portal.color, opacity: portal.active ? 1 : 0.42 }]} />
        </View>
        <View style={[styles.domainWorldTrace, { backgroundColor: `${portal.color}70` }]} />
      </View>
      <Text style={[styles.domainWorldLabel, { color: portal.color }]}>{portal.label}</Text>
      <Text numberOfLines={1} style={[styles.domainWorldTitle, { color: colors.foreground }]}>{portal.title}</Text>
      <View style={styles.domainWorldStatusLine}>
        <View style={[styles.domainWorldStatusMark, { backgroundColor: portal.color, opacity: portal.active ? 1 : 0.55 }]} />
        <Text numberOfLines={1} style={[styles.domainWorldStatus, { color: portal.active ? colors.mutedForeground : `${colors.mutedForeground}B0` }]}>{portal.status}</Text>
      </View>
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

function NexusWorldScene({
  portals,
  pulseStyle,
  onPortalPress,
}: {
  portals: Array<Parameters<typeof DomainNode>[0]['portal']>;
  pulseStyle: StyleProp<ViewStyle>;
  onPortalPress: (portal: Parameters<typeof DomainNode>[0]['portal']) => void;
}) {
  const colors = useColors();
  const scenePortals = portals.filter((portal) => ['arena', 'forge', 'archive', 'world'].includes(portal.id));

  return (
    <View pointerEvents="box-none" style={styles.nexusWorldScene} testID="home-native-scene" accessibilityLabel="Escena viva del Nexus con citadel, núcleo y portales interactivos">
      <View pointerEvents="none" style={styles.sceneLightColumns}>
        <View style={[styles.sceneLightColumn, styles.sceneLightColumnLeft, { backgroundColor: `${colors.rarityRare}16` }]} />
        <View style={[styles.sceneLightColumn, styles.sceneLightColumnCenter, { backgroundColor: `${colors.accent}24` }]} />
        <View style={[styles.sceneLightColumn, styles.sceneLightColumnRight, { backgroundColor: `${colors.rarityEpic}18` }]} />
      </View>
      <View pointerEvents="none" style={styles.sceneBridge}>
        <LinearGradient colors={['transparent', `${colors.ink}A8`, colors.ink]} style={StyleSheet.absoluteFill} />
        <View style={[styles.sceneBridgeRail, { backgroundColor: `${colors.accent}B8` }]} />
        <Animated.View style={[styles.sceneForgeCore, { backgroundColor: colors.accent }, pulseStyle]} />
      </View>
      {scenePortals.map((portal) => (
        <Pressable
          key={portal.id}
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${portal.label}. ${portal.status}`}
          testID={`home-scene-portal-${portal.id}`}
          onPress={() => onPortalPress(portal)}
          style={({ pressed }) => [
            styles.scenePortalMarker,
            portal.id === 'arena' || portal.id === 'archive' ? styles.scenePortalLeft : styles.scenePortalRight,
            portal.id === 'arena' || portal.id === 'forge' ? styles.scenePortalHigh : styles.scenePortalLow,
            { opacity: pressed ? 0.7 : portal.active ? 1 : 0.78 },
          ]}
        >
          <View style={[styles.scenePortalRing, { borderColor: `${portal.color}${portal.active ? 'C8' : '78'}`, backgroundColor: `${portal.color}12` }]}>
            <View style={[styles.scenePortalCore, { backgroundColor: portal.color, opacity: portal.active ? 1 : 0.55 }]} />
            <Icon name={portal.icon} color={portal.color} size={15} />
          </View>
          <Text style={[styles.scenePortalLabel, { color: portal.color }]}>{portal.label}</Text>
          <Text numberOfLines={1} style={[styles.scenePortalStatus, { color: `${colors.foreground}B8` }]}>{portal.active ? 'ACTIVO' : 'EN ESPERA'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function OperationGate({
  label,
  title,
  detail,
  icon,
  color,
  testID,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  title: string;
  detail: string;
  icon: IconName;
  color: string;
  testID: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.operationGate,
        { borderColor: `${color}8C`, backgroundColor: `${colors.ink}55`, opacity: pressed ? 0.7 : 1, transform: [{ translateY: pressed ? 2 : 0 }] },
      ]}
    >
      <View style={[styles.operationGateGlyph, { borderColor: color, backgroundColor: `${color}14` }]}>
        <Icon name={icon} color={color} size={17} />
      </View>
      <View style={styles.operationGateCopy}>
        <Text style={[styles.operationGateLabel, { color }]}>{label}</Text>
        <Text numberOfLines={1} style={[styles.operationGateTitle, { color: colors.foreground }]}>{title}</Text>
        <Text numberOfLines={1} style={[styles.operationGateDetail, { color: colors.mutedForeground }]}>{detail}</Text>
      </View>
      <View style={styles.operationGateBeacon}>
        <View style={[styles.operationGateBeaconMark, { backgroundColor: color }]} />
        <Text style={[styles.operationGateBeaconText, { color }]}>ABRIR</Text>
      </View>
    </Pressable>
  );
}

function ForgeChamber({
  label,
  icon,
  color,
  testID,
  onPress,
}: {
  label: string;
  icon: IconName;
  color: string;
  testID: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${label.toLowerCase()}`}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.forgeChamber,
        { borderColor: `${color}55`, opacity: pressed ? 0.68 : 1, transform: [{ translateY: pressed ? 2 : 0 }] },
      ]}
    >
      <View style={[styles.forgeChamberGlyph, { borderColor: color, backgroundColor: `${color}12` }]}>
        <Icon name={icon} color={color} size={14} />
      </View>
      <Text style={[styles.forgeChamberLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.forgeChamberMark, { backgroundColor: color }]} />
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

function ContinuumNode({
  label,
  value,
  detail,
  icon,
  color,
  active,
  testID,
  onPress,
}: {
  label: string;
  value: string;
  detail: string;
  icon: IconName;
  color: string;
  active: boolean;
  testID: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. ${detail}. ${active ? 'Señal activa' : 'Señal en espera'}`}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.continuumNode,
        {
          borderColor: `${color}${active ? '60' : '30'}`,
          backgroundColor: active ? `${colors.ink}66` : `${colors.ink}45`,
          opacity: pressed ? 0.7 : active ? 1 : 0.72,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
      ]}
    >
      <SignalMetric label={label} value={value} icon={icon} color={color} />
      <Text numberOfLines={1} style={[styles.continuumNodeDetail, { color: colors.mutedForeground }]}>
        {detail}
      </Text>
      <View style={[styles.continuumNodeMark, { backgroundColor: color, opacity: active ? 1 : 0.42 }]} />
    </Pressable>
  );
}

function MissionSignal({ mission, index, onPress }: { mission: HomeMission; index: number; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir misión ${mission.name}`}
      testID={`home-mission-${mission.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.missionSignal,
        {
          borderColor: `${colors.success}50`,
          backgroundColor: `${colors.ink}55`,
          opacity: pressed ? 0.7 : 1,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
      ]}
    >
      <View style={styles.missionSignalBeacon}>
        <View style={[styles.missionSignalOrbit, { borderColor: `${colors.success}A8`, backgroundColor: `${colors.success}12` }]}>
          <Text style={[styles.missionSignalIndex, { color: colors.success }]}>{String(index + 1).padStart(2, '0')}</Text>
        </View>
        <View style={[styles.missionSignalAxis, { backgroundColor: `${colors.success}70` }]} />
      </View>
      <View style={styles.missionSignalCopy}>
        <Text numberOfLines={1} style={[styles.missionSignalName, { color: colors.foreground }]}>{mission.name}</Text>
        <View style={styles.missionSignalMeta}>
          <Text style={[styles.missionSignalDifficulty, { color: colors.success }]}>{capitalize(mission.difficulty, 'RITO')}</Text>
          <View style={[styles.missionSignalDivider, { backgroundColor: `${colors.success}70` }]} />
          <Text numberOfLines={1} style={[styles.missionSignalReward, { color: colors.mutedForeground }]}>{formatMetric(mission.reward_xp, 'XP', 'XP NO REPORTADO')} · {formatMetric(mission.reward_vex_ingame, 'VEX', 'VEX NO REPORTADO')}</Text>
        </View>
      </View>
      <View style={styles.missionSignalPulse}>
        <View style={[styles.missionSignalPulseMark, { backgroundColor: colors.success }]} />
        <Text style={[styles.missionSignalPulseText, { color: colors.success }]}>ACTIVA</Text>
      </View>
    </Pressable>
  );
}

function ActivitySignal({ item, index, last, onPress }: { item: ActivityItem; index: number; last: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir mundo. ${item.text}`}
      testID={`home-activity-${item.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.activitySignal, { opacity: pressed ? 0.7 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }]}
    >
      <View style={styles.activitySignalRail}>
        <View style={[styles.activitySignalSeal, { borderColor: `${colors.rarityRare}88`, backgroundColor: `${colors.rarityRare}12` }]}>
          <Icon name="radio" color={colors.rarityRare} size={11} style={styles.activitySignalSealIcon} />
        </View>
        {!last ? <View style={[styles.activitySignalLine, { backgroundColor: `${colors.rarityRare}55` }]} /> : null}
      </View>
      <View style={styles.activitySignalBody}>
        <Text numberOfLines={2} style={[styles.activitySignalCopy, { color: colors.foreground }]}>{item.text}</Text>
        <Text style={[styles.activitySignalTime, { color: colors.rarityRare }]}>{new Date(item.time).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}</Text>
      </View>
      <Text style={[styles.activitySignalStamp, { color: `${colors.rarityRare}99` }]}>{String(index + 1).padStart(2, '0')}</Text>
    </Pressable>
  );
}

function RankingSignal({ entry, index, onPress }: { entry: NonNullable<HomeStats['top3']>[number]; index: number; onPress: () => void }) {
  const colors = useColors();
  const accent = index === 0 ? colors.accent : colors.mutedForeground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir mundo. Posición ${entry.rank}, ${entry.display_name}`}
      testID={`home-ranking-${entry.rank}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.rankingSignal,
        {
          borderColor: `${accent}55`,
          backgroundColor: `${colors.ink}45`,
          opacity: pressed ? 0.7 : 1,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
      ]}
    >
      <View style={[styles.rankingSignalSigil, { borderColor: accent, backgroundColor: `${accent}12` }]}>
        <Text style={[styles.rankingSignalPosition, { color: accent }]}>{String(entry.rank).padStart(2, '0')}</Text>
      </View>
      <View style={styles.rankingSignalIdentity}>
        <Text numberOfLines={1} style={[styles.rankingSignalName, { color: colors.foreground }]}>{entry.display_name}</Text>
        <Text style={[styles.rankingSignalMeta, { color: colors.mutedForeground }]}>{formatMetric(entry.wins, 'VICTORIAS', 'VICTORIAS NO REPORTADAS')}</Text>
      </View>
      <View style={styles.rankingSignalScore}>
        <Text style={[styles.rankingSignalScoreValue, { color: accent }]}>{formatNumber(entry.mmr, 'MMR NO REPORTADO')}</Text>
        <Text style={[styles.rankingSignalScoreLabel, { color: colors.mutedForeground }]}>MMR</Text>
      </View>
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
  const [homeSceneState, setHomeSceneState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [identityAssetState, setIdentityAssetState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [featuredAssetState, setFeaturedAssetState] = useState<'loading' | 'ready' | 'error'>('loading');
  const pulse = useSharedValue(0);
  const orbit = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const loadHome = useCallback(async () => {
    setHomeState('loading');
    const results = await Promise.allSettled([loadHomeStats(), loadDailyFeaturedCard(), loadHomeMissions(), loadRecentActivity(5), loadHomeIdentityCard()]);
    const [statsResult, cardResult, missionResult, activityResult, identityResult] = results;
    setHome((current) => ({
      stats: statsResult.status === 'fulfilled' ? statsResult.value : current.stats,
      card: cardResult.status === 'fulfilled' ? cardResult.value : current.card,
      missions: missionResult.status === 'fulfilled' ? missionResult.value : current.missions,
      activity: activityResult.status === 'fulfilled' ? activityResult.value : current.activity,
      identityCard: identityResult.status === 'fulfilled' ? identityResult.value : current.identityCard,
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
  const activeDomainPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.94 + pulse.value * 0.06,
    transform: [{ scale: 1 + pulse.value * 0.018 }],
  }));
  const heroParallaxStyle = useAnimatedStyle(() => {
    // Keep the camera movement bounded so a long scroll cannot pull the hero
    // out of its authored composition before the next scene takes over.
    const cameraY = Math.min(Math.max(scrollY.value, 0), 720);
    const phase = orbit.value * Math.PI * 2;
    return {
      transform: reduceMotion
        ? []
        : [
            { translateX: Math.sin(phase) * 1.8 },
            { translateY: cameraY * 0.1 + Math.cos(phase) * 1.2 },
            { scale: 1.04 + Math.min(cameraY / 2600, 0.07) },
          ],
    };
  });
  const sceneAtmosphereStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.16 : 0.12 + pulse.value * 0.08,
    transform: reduceMotion
      ? []
      : [
          { translateX: Math.sin(orbit.value * Math.PI * 2) * 5 },
          { translateY: Math.cos(orbit.value * Math.PI * 2) * 4 },
          { scale: 1 + pulse.value * 0.05 },
        ],
  }));
  const sceneMistStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.14 : 0.1 + (1 - pulse.value) * 0.08,
    transform: reduceMotion
      ? []
      : [{ translateY: (1 - pulse.value) * -10 }, { translateX: Math.sin(orbit.value * Math.PI * 2) * -3 }],
  }));
  const sentinelParallaxStyle = useAnimatedStyle(() => {
    const cameraY = Math.min(Math.max(scrollY.value, 0), 720);
    return {
      opacity: 0.92,
      transform: reduceMotion
        ? []
        : [{ translateY: cameraY * 0.2 }, { translateX: Math.sin(orbit.value * Math.PI * 2) * 3 }, { scale: 1.02 + pulse.value * 0.02 }],
    };
  });
  const orbitStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.25,
    transform: [{ rotate: `${orbit.value * 360}deg` }, { scale: 0.92 + pulse.value * 0.06 }],
  }));
  const domainSceneDriftStyle = useAnimatedStyle(() => {
    const cameraY = Math.min(Math.max(scrollY.value, 0), 720);
    return {
      transform: reduceMotion
        ? []
        : [
            { translateY: cameraY * 0.035 },
            { translateX: Math.sin(orbit.value * Math.PI * 2) * 1.5 },
          ],
    };
  });
  const continuumArtStyle = useAnimatedStyle(() => {
    const cameraY = Math.min(Math.max(scrollY.value, 0), 720);
    return {
      opacity: 0.17 + pulse.value * 0.05,
      transform: reduceMotion
        ? []
        : [
            { translateY: cameraY * -0.08 },
            { translateX: Math.sin(orbit.value * Math.PI * 2) * 5 },
            { scale: 1.08 + pulse.value * 0.025 },
          ],
    };
  });
  const secondarySceneDepthStyle = useAnimatedStyle(() => {
    const cameraY = Math.min(Math.max(scrollY.value, 0), 720);
    return {
      transform: reduceMotion ? [] : [{ translateY: cameraY * 0.024 }],
    };
  });
  const continuumGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + pulse.value * 0.1,
    transform: [{ translateY: pulse.value * -18 }, { scale: 1 + pulse.value * 0.08 }],
  }));

  const activeCard = home.card ?? featuredCards[0] ?? null;
  const featuredCanExpand = Boolean(activeCard?.lore);
  const identityCard = home.identityCard;
  const identityVisual = getCardIdentityVisual(identityCard?.id);
  const identityArtUnavailable = identityAssetState === 'error' || Boolean(identityCard && !identityCard.image_url);
  const playerName = capitalize(player?.display_name, 'IDENTIDAD EN ESPERA');
  const activeEvent = home.stats?.active_event ?? null;
  const eventAccent = activeEvent ? colors.rarityRare : colors.mutedForeground;
  const eventProgressAvailable = Boolean(activeEvent && typeof activeEvent.progress === 'number' && Number.isFinite(activeEvent.progress));
  const season = home.stats?.season ?? null;
  const xp = progress?.xp;
  const xpToNext = progress?.xp_to_next;
  const progression = typeof xp === 'number' && Number.isFinite(xp) && typeof xpToNext === 'number' && Number.isFinite(xpToNext) ? { xp, xpToNext } : null;
  const levelSignal = progress ? `NIVEL ${formatNumber(progress.level)}` : 'NIVEL EN ESPERA';
  const walletSignal = wallet ? formatMetric(wallet?.vex_ingame, 'VEX', 'VEX NO REPORTADO') : 'VEX EN ESPERA';
  const winsSignal = playerStats ? formatMetric(playerStats?.pvp_wins, 'VICTORIAS', 'VICTORIAS NO REPORTADAS') : 'VICTORIAS EN ESPERA';
  const progressionSignal = progression
    ? formatPair(progression.xp, progression.xpToNext, 'XP', 'XP NO REPORTADO', 'XP OBJETIVO NO REPORTADO')
    : 'PROGRESIÓN EN ESPERA';
  const connectionLabel = syncState === 'connected' ? 'NEXUS ONLINE' : syncState === 'offline' ? 'NEXUS OFFLINE' : 'SINCRONIZANDO';
  const connectionColor = syncState === 'connected' ? colors.success : syncState === 'offline' ? colors.danger : colors.accent;
  const viewportPadding = Math.max(18, Math.min(25, width * 0.06));
  const heroHeight = Math.min(640, Math.max(570, width * 1.38));
  const ranking = home.stats?.top3 ?? [];
  const domainPortals: Array<{ id: string; label: string; title: string; status: string; icon: IconName; route: HomeRoute; color: string; active: boolean }> = [
    { id: 'arena', label: 'ARENA', title: 'Cruza el umbral', status: activeEvent ? 'EVENTO ACTIVO' : 'OPONENTES EN ESPERA', icon: 'target', route: '/battle', color: colors.rarityRare, active: Boolean(activeEvent) },
    { id: 'forge', label: 'FORJA', title: 'Traza tu formación', status: `${levelSignal} · MAZO ACTIVO`, icon: 'deck', route: '/deck', color: colors.rarityEpic, active: Boolean(progress) },
    { id: 'archive', label: 'ARCHIVO', title: 'Revela tu colección', status: formatMetric(cardsTotal, 'CARTAS REGISTRADAS', 'CARTAS NO REPORTADAS'), icon: 'collection', route: '/collection', color: colors.rarityLegendary, active: cardsTotal > 0 },
    { id: 'world', label: 'MUNDO', title: 'Lee la señal', status: activeEvent ? `CIERRA EN ${formatEventTime(activeEvent.ends_at)}` : 'SIN FRENTE PUBLICADO', icon: 'map', route: '/world', color: colors.rarityRare, active: Boolean(activeEvent) },
    { id: 'missions', label: 'MISIONES', title: 'Cumple el rito', status: formatMetric(home.missions.length, 'ÓRDENES ACTIVAS', 'ÓRDENES NO REPORTADAS'), icon: 'missions', route: '/missions', color: colors.success, active: home.missions.length > 0 },
    { id: 'economy', label: 'ECONOMÍA', title: 'Mueve el VEX', status: wallet ? `${walletSignal} DISPONIBLES` : walletSignal, icon: 'economy', route: '/economy', color: colors.accent, active: Boolean(wallet) },
  ];
  const domainSignals = Object.fromEntries(domainPortals.map((portal) => [portal.id, portal.status])) as Record<string, string>;
  const homeIdentity = DOMAIN_IDENTITY.foja;
  const orbitReveal = MOTION.reveal;
  const orbitDepth = DEPTH.surface;
  const homeSceneAsset = CANONICAL_BACKGROUNDS.home;
  const homeSceneSource = typeof homeSceneAsset === 'string' ? { uri: homeSceneAsset } : homeSceneAsset;
  const navigate = (route: HomeRoute) => {
    void Haptics.selectionAsync().catch(() => undefined);
    if (route === '/') router.replace('/');
    else router.push(route);
  };
  const doRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.allSettled([loadHome(), refresh()]);
    } finally {
      setRefreshing(false);
    }
  };
  const openFeatured = () => {
    if (!featuredCanExpand) return;
    setFeaturedExpanded((expanded) => !expanded);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  return (
    <ScreenShell surface="home" sceneMode="hero">
      <View style={styles.root} testID="home-scene">
        <Animated.ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(112, insets.bottom + 100) }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
          showsVerticalScrollIndicator={false}
          accessibilityLabel="Inicio de Vexforge"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
           <View style={[styles.heroStage, { backgroundColor: identityVisual?.overlay ?? colors.ink, height: heroHeight }]}>
             <View pointerEvents="box-none" style={styles.heroSceneViewport}>
               {homeSceneSource ? (
                 <Animated.Image
                   source={homeSceneSource}
                   style={[styles.heroSceneReference, heroParallaxStyle]}
                   resizeMode="cover"
                   accessibilityLabel="Referencia oficial integrada como escena viva del Nexus Home"
                   onLoad={() => setHomeSceneState('ready')}
                   onError={() => setHomeSceneState('error')}
                 />
               ) : null}
               <Animated.View style={[styles.sceneDepthLayer, heroParallaxStyle]}>
                 <NexusWorldScene portals={domainPortals} pulseStyle={pulseStyle} onPortalPress={(portal) => navigate(portal.route)} />
               </Animated.View>
               {identityCard?.image_url && identityAssetState !== 'error' ? (
                 <Animated.Image
                   source={{ uri: identityCard.image_url }}
                   style={[styles.heroIdentityBackdrop, heroParallaxStyle]}
                   resizeMode="cover"
                   accessibilityLabel="Artwork canónico de la identidad integrado en la escena viva del Home"
                   onLoad={() => setIdentityAssetState('ready')}
                   onError={() => setIdentityAssetState('error')}
                 />
               ) : null}
               <Animated.View style={[styles.heroSceneAtmosphere, sceneAtmosphereStyle]}>
                 <LinearGradient
                   colors={[`${colors.accent}2C`, `${colors.accent}08`, 'transparent']}
                   style={StyleSheet.absoluteFill}
                 />
               </Animated.View>
               <Animated.View style={[styles.heroSceneMist, sceneMistStyle]}>
                 <LinearGradient
                   colors={['transparent', `${colors.primary}18`, `${colors.ink}44`]}
                   locations={[0, 0.5, 1]}
                   style={StyleSheet.absoluteFill}
                 />
               </Animated.View>
             </View>
             {homeSceneState === 'error' ? (
               <View pointerEvents="none" testID="home-scene-state" style={[styles.heroAssetError, { borderColor: `${colors.accent}80` }]}>
                 <Text style={[styles.heroAssetErrorTitle, { color: colors.accent }]}>ESCENA DEL NEXUS NO DISPONIBLE</Text>
                 <Text style={[styles.heroAssetErrorBody, { color: `${colors.foreground}CC` }]}>La referencia visual no pudo cargarse.</Text>
               </View>
             ) : null}
            <LinearGradient colors={[`${colors.ink}18`, `${colors.ink}42`, `${colors.ink}D4`, colors.background]} locations={[0, 0.25, 0.56, 1]} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={[`${identityVisual?.accent ?? colors.rarityEpic}38`, 'transparent', `${colors.accent}24`]} style={StyleSheet.absoluteFill} />
            <View pointerEvents="none" style={styles.heroRuleFrame}>
              <View style={[styles.heroCorner, styles.heroTopLeft, { borderColor: `${colors.accent}A8` }]} />
              <View style={[styles.heroCorner, styles.heroTopRight, { borderColor: `${colors.accent}66` }]} />
              <View style={[styles.heroCorner, styles.heroBottomLeft, { borderColor: `${colors.rarityEpic}66` }]} />
              <View style={[styles.heroCorner, styles.heroBottomRight, { borderColor: `${colors.rarityEpic}A8` }]} />
              <Text style={[styles.heroSceneCode, { color: `${colors.foreground}70` }]}>NEXUS / 01 · THRESHOLD</Text>
            </View>
            <Animated.View
              style={[
                styles.identityStage,
                {
                  borderColor: `${identityVisual?.edge ?? colors.rarityEpic}B8`,
                  backgroundColor: `${identityVisual?.overlay ?? colors.ink}CC`,
                  height: Math.min(432, heroHeight * 0.72),
                  right: -Math.min(36, width * 0.1),
                  width: Math.min(286, Math.max(236, width * 0.72)),
                },
                sentinelParallaxStyle,
              ]}
            >
               {identityCard?.image_url ? (
                 <Image
                   source={{ uri: identityCard.image_url }}
                   style={styles.identityArt}
                   resizeMode="cover"
                   accessibilityLabel="Artwork oficial de la identidad canónica del Home"
                  onLoad={() => setIdentityAssetState('ready')}
                  onError={() => setIdentityAssetState('error')}
                />
              ) : null}
              <LinearGradient
                colors={[
                  `${identityVisual?.overlay ?? colors.ink}12`,
                  `${identityVisual?.overlay ?? colors.ink}54`,
                  `${colors.ink}F0`,
                ]}
                style={StyleSheet.absoluteFill}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.identityAtmosphere,
                  {
                    borderColor: `${identityVisual?.accent ?? colors.rarityEpic}70`,
                    backgroundColor: `${identityVisual?.accent ?? colors.rarityEpic}14`,
                  },
                ]}
              />
              <View pointerEvents="none" style={[styles.identityAxis, { backgroundColor: `${identityVisual?.accent ?? colors.rarityEpic}4D` }]} />
              <View style={[styles.identityStageRule, { borderColor: `${identityVisual?.accent ?? colors.rarityEpic}9C` }]} />
               <View style={styles.identityStageCopy}>
                 <Text style={[styles.identityStageKicker, { color: identityVisual?.accent ?? colors.rarityEpic }]}>IDENTIDAD CANÓNICA</Text>
                 <Text style={[styles.identityStageCode, { color: `${colors.foreground}B8` }]}>{identityCard?.code ?? 'SEÑAL PENDIENTE'}</Text>
                 <Text numberOfLines={2} style={[styles.identityStageName, { color: colors.foreground }]}>{identityCard?.name ?? 'IDENTIDAD NO SINCRONIZADA'}</Text>
                 <Text style={[styles.identityStageMeta, { color: `${colors.foreground}B8` }]}>{identityCard ? `${identityCard.rarity?.toUpperCase()} · ${identityCard.faction?.toUpperCase()}` : 'CARGANDO REGISTRO CANÓNICO'}</Text>
               </View>
             </Animated.View>
            <Animated.View pointerEvents="none" style={[styles.heroOrbit, { borderColor: `${identityVisual?.accent ?? colors.rarityEpic}6A` }, orbitStyle]} />
            <Animated.View pointerEvents="none" style={[styles.heroCore, { backgroundColor: `${identityVisual?.accent ?? colors.rarityEpic}A8` }, pulseStyle]} />
            {identityArtUnavailable ? (
              <View pointerEvents="none" style={[styles.heroAssetError, { borderColor: `${colors.accent}80` }]}>
                <Text style={[styles.heroAssetErrorTitle, { color: colors.accent }]}>NEXUS CORE OFFLINE</Text>
                <Text style={[styles.heroAssetErrorBody, { color: `${colors.foreground}CC` }]}>La identidad canónica no está disponible.</Text>
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir perfil"
                  testID="home-profile"
                  onPress={() => navigate('/profile')}
                  style={({ pressed }) => [styles.iconButton, { borderColor: `${colors.accent}80`, backgroundColor: `${colors.ink}B8`, opacity: pressed ? 0.68 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }]}
                >
                  <Icon name="user" color={colors.accent} size={17} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir mensajes y misiones"
                  testID="home-inbox"
                  onPress={() => navigate('/missions')}
                  style={({ pressed }) => [styles.iconButton, { borderColor: `${colors.accent}80`, backgroundColor: `${colors.ink}B8`, opacity: pressed ? 0.68 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }]}
                >
                  <Icon name="inbox" color={colors.foreground} size={17} />
                  {home.missions.length > 0 ? <View style={[styles.notificationDot, { backgroundColor: colors.accent }]} /> : null}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir ajustes"
                  testID="home-settings"
                  onPress={() => navigate('/meta')}
                  style={({ pressed }) => [styles.iconButton, { borderColor: `${colors.accent}80`, backgroundColor: `${colors.ink}B8`, opacity: pressed ? 0.68 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }]}
                >
                  <Icon name="settings" color={colors.foreground} size={17} />
                </Pressable>
              </View>
            </View>

            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(MOTION.micro).duration(MOTION.navigation + MOTION.micro)} style={[styles.heroContent, { paddingHorizontal: viewportPadding, zIndex: 3 }]}>
              <View style={[styles.heroReadingField, { borderLeftColor: `${colors.accent}B8` }]}>
                <View style={[styles.syncLine, { borderColor: `${connectionColor}90` }]} testID="home-sync">
                  <View style={[styles.syncPulse, { backgroundColor: connectionColor }]} />
                  <Text style={[styles.syncText, { color: connectionColor }]}>{connectionLabel}</Text>
                    <Text style={[styles.syncMeta, { color: `${colors.foreground}B0` }]}>{season?.name ?? 'TEMPORADA NO SINCRONIZADA'}</Text>
                </View>
                 <View style={styles.heroEyebrowRow}>
                   <Text style={[styles.heroEyebrow, { color: colors.accent }]}>{season ? 'TEMPORADA ACTIVA' : 'TEMPORADA EN ESPERA'}</Text>
                  <View style={[styles.heroEyebrowRule, { backgroundColor: `${colors.accent}72` }]} />
                   <Text style={[styles.heroEyebrowMeta, { color: `${colors.foreground}B0` }]}>{activeEvent ? 'FRENTE VIVO' : 'FRENTE EN ESPERA'}</Text>
                </View>
                <Text style={[styles.heroHeadline, { color: colors.foreground, textShadowColor: `${colors.ink}B8` }]}>CRUZA{'\n'}EL UMBRAL</Text>
                 <Text style={[styles.heroDescription, { color: `${colors.foreground}D0` }]}>{activeEvent ? 'Tu frente está vivo. Elige un dominio y forja la próxima victoria.' : 'El Nexus espera un frente publicado. Elige un dominio y lee sus señales.'}</Text>
                <View style={styles.heroActions}>
                  <ThresholdButton label="ENTRAR A LA ARENA" icon="target" onPress={() => navigate('/battle')} testID="home-battle" />
                  <ThresholdButton label="CONTINUAR" icon="arrow-right" onPress={() => navigate('/tutorial')} testID="home-tutorial" secondary />
                </View>
                <View style={[styles.heroFooter, { borderTopColor: `${colors.foreground}2A` }]}>
                  <View style={styles.heroFooterItem}><Icon name="zap" color={colors.accent} size={13} /><Text style={[styles.heroFooterText, { color: `${colors.foreground}C0` }]}>{progress ? formatPair(progress.energy, progress.max_energy, 'ENERGÍA', 'ENERGÍA NO REPORTADA', 'ENERGÍA MÁXIMA NO REPORTADA') : 'ENERGÍA EN ESPERA'}</Text></View>
                  <View style={styles.heroFooterItem}><Icon name="gem" color={colors.rarityEpic} size={13} /><Text style={[styles.heroFooterText, { color: `${colors.foreground}C0` }]}>{walletSignal}</Text></View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Abrir mundo"
                    testID="home-world"
                    onPress={() => navigate('/world')}
                    style={({ pressed }) => [styles.heroWorldLink, { opacity: pressed ? 0.68 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }]}
                  >
                    <Icon name="globe" color={colors.rarityRare} size={13} /><Text style={[styles.heroWorldText, { color: colors.rarityRare }]}>MUNDO</Text><Icon name="arrow-up" color={colors.rarityRare} size={9} />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={activeCard ? 'Abrir carta destacada en Archivo' : 'Carta destacada no sincronizada'}
              accessibilityState={{ disabled: !activeCard }}
              testID="home-featured-card"
              disabled={!activeCard}
              onPress={() => navigate('/collection')}
              style={({ pressed }) => [styles.heroCardAnchor, { opacity: pressed ? 0.78 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }]}
            >
              <View style={[styles.heroCardFrame, { borderColor: `${colors.rarityLegendary}CC`, backgroundColor: colors.ink }]}>
                 {activeCard?.image_url ? (
                   <Image
                     source={{ uri: activeCard.image_url }}
                     style={styles.heroCardArt}
                     resizeMode="cover"
                     accessibilityLabel="Arte oficial de la carta destacada"
                     onLoad={() => setFeaturedAssetState('ready')}
                     onError={() => setFeaturedAssetState('error')}
                   />
                 ) : null}
                <LinearGradient colors={['transparent', `${colors.ink}E8`]} style={StyleSheet.absoluteFill} />
                <View style={[styles.heroCardRarity, { borderColor: `${colors.rarityLegendary}A8`, backgroundColor: `${colors.ink}C8` }]}>
                  <Text style={[styles.heroCardRarityText, { color: colors.rarityLegendary }]}>{activeCard?.rarity?.toUpperCase() ?? 'SEÑAL PENDIENTE'}</Text>
                </View>
                {featuredAssetState === 'error' ? <View style={styles.heroCardAssetError}><Text style={[styles.heroCardAssetErrorText, { color: colors.accent }]}>ARTE OFFLINE</Text></View> : null}
                 <Text style={[styles.heroCardCode, { color: `${colors.foreground}B8` }]}>{cardCodeLabel(activeCard?.code)}</Text>
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={refreshing ? 'Sincronización en curso' : 'Reintentar sincronización'}
                  accessibilityState={{ busy: refreshing, disabled: refreshing }}
                  disabled={refreshing}
                  onPress={doRefresh}
                  style={({ pressed }) => [
                    styles.retryButton,
                    {
                      borderColor: colors.danger,
                      opacity: refreshing ? 0.52 : pressed ? 0.68 : 1,
                      transform: [{ translateY: pressed && !refreshing ? 2 : 0 }],
                    },
                  ]}
                >
                  <Text style={[styles.retryText, { color: colors.danger }]}>{refreshing ? 'RECIBIENDO' : 'REINTENTAR'}</Text>
                </Pressable>
              </Animated.View>
            ) : null}
            {homeState === 'loading' && !home.stats && !activeCard ? <LoadingTrace /> : null}

             <View style={styles.nexusWorldFinal} testID="home-continuum">
               {identityCard?.image_url ? (
                 <Animated.Image
                   source={{ uri: identityCard.image_url }}
                   style={[styles.continuumArt, continuumArtStyle]}
                   resizeMode="cover"
                   accessibilityLabel="Atmósfera derivada del artwork oficial de la identidad del Home"
                 />
               ) : null}
               <LinearGradient
                 colors={[`${identityVisual?.overlay ?? colors.ink}D8`, `${colors.background}E8`, colors.background]}
                 locations={[0, 0.44, 1]}
                 style={StyleSheet.absoluteFill}
               />
               <LinearGradient
                 colors={[`${identityVisual?.accent ?? colors.rarityEpic}24`, 'transparent', `${colors.ink}EE`]}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 0.9 }}
                 style={StyleSheet.absoluteFill}
               />
               <Animated.View
                 pointerEvents="none"
                 style={[
                   styles.continuumGlow,
                   { backgroundColor: identityVisual?.accent ?? colors.rarityEpic },
                   continuumGlowStyle,
                 ]}
               />
               <View style={styles.continuumContent}>
                <Animated.View
                  entering={reduceMotion ? undefined : FadeInUp.delay(MOTION.micro).duration(MOTION.navigation)}
                  style={[
                    styles.signalLedgerFinal,
                    {
                      borderBottomColor: `${identityVisual?.accent ?? colors.accent}80`,
                      borderTopColor: `${identityVisual?.accent ?? colors.accent}80`,
                    },
                  ]}
                  testID="home-forger-ledger"
                >
                  <View style={styles.signalIdentityFinal}>
                     <View style={[styles.signalCrestFinal, { borderColor: colors.accent, backgroundColor: `${colors.accent}18` }]}>
                       <Icon name="profile" color={colors.accent} size={18} />
                    </View>
                    <View style={styles.signalIdentityCopyFinal}>
                      <Text style={[styles.signalKickerFinal, { color: colors.accent }]}>IDENTIDAD DEL FORJADOR</Text>
                      <Text numberOfLines={1} style={[styles.signalPlayerNameFinal, { color: colors.foreground }]}>{playerName}</Text>
                      <Text style={[styles.signalPlayerMetaFinal, { color: colors.mutedForeground }]}>{levelSignal} · {connectionLabel}</Text>
                      <Text style={[styles.signalPlayerMetaFinal, { color: colors.mutedForeground }]}>{winsSignal} · {walletSignal}</Text>
                      <View style={styles.identitySourceFinal}>
                        <View style={[styles.identitySourceMarkFinal, { backgroundColor: identityVisual?.accent ?? colors.accent }]} />
                        <Text numberOfLines={1} style={[styles.identitySourceTextFinal, { color: identityVisual?.accent ?? colors.accent }]}>
                          {identityCard ? `${identityCard.code} · ${identityCard.name}` : 'SEÑAL CANÓNICA PENDIENTE'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.signalProgressFinal}>
                    <View style={styles.signalProgressLineFinal}><Text style={[styles.signalKickerFinal, { color: colors.mutedForeground }]}>PROGRESIÓN</Text><Text style={[styles.signalProgressValueFinal, { color: progress ? colors.accent : colors.mutedForeground }]}>{progressionSignal}</Text></View>
                    {progression ? <ProgressRail value={progression.xp} total={progression.xpToNext} color={colors.accent} background={colors.border} /> : <View style={[styles.progressRail, { backgroundColor: `${colors.mutedForeground}44` }]} />}
                  </View>
                </Animated.View>

                <View style={styles.frontStageFinal}>
                  <View style={styles.frontStageHeaderFinal}>
                    <View>
                      <Text style={[styles.frontStageEyebrowFinal, { color: colors.rarityRare }]}>{homeIdentity.place} / FRENTE VIVO</Text>
                      <Text style={[styles.frontStageTitleFinal, { color: colors.foreground }]}>La señal del Nexus</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Abrir mundo"
                      testID="home-world-front"
                      onPress={() => navigate('/world')}
                      style={({ pressed }) => [styles.frontStageLinkFinal, { opacity: pressed ? 0.68 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }]}
                    >
                      <Icon name="map" color={colors.rarityRare} size={13} /><Text style={[styles.frontStageLinkTextFinal, { color: colors.rarityRare }]}>MUNDO</Text><Icon name="arrow-up" color={colors.rarityRare} size={10} />
                    </Pressable>
                  </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={activeEvent ? 'Abrir evento activo' : 'Abrir mundo para consultar eventos'} testID="home-event" onPress={() => navigate('/world')} style={({ pressed }) => [styles.eventRibbonFinal, { borderLeftColor: eventAccent, backgroundColor: activeEvent ? `${colors.ink}A6` : `${colors.ink}72`, opacity: pressed ? 0.76 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }]}>
                    <View style={[styles.eventBeaconFinal, { borderColor: `${eventAccent}66`, backgroundColor: `${eventAccent}0D` }]}>
                       <Icon name={activeEvent ? 'resonance' : 'radio'} color={eventAccent} size={23} />
                    </View>
                    <View style={styles.eventCopyFinal}>
                      <Text style={[styles.eventTypeFinal, { color: eventAccent }]}>{activeEvent?.type?.toUpperCase() ?? 'SIN FRENTE'}</Text>
                      <Text numberOfLines={2} style={[styles.eventTitleFinal, { color: colors.foreground }]}>{activeEvent?.name ?? 'Ningún frente está publicado'}</Text>
                      <Text style={[styles.eventMetaFinal, { color: colors.mutedForeground }]}>{activeEvent ? 'CIERRA EN ' + formatEventTime(activeEvent.ends_at) : 'No hay evento activo publicado'}</Text>
                    </View>
                    <View style={styles.eventProgressFinal}>
                      <Text style={[styles.eventProgressValueFinal, { color: eventAccent }]}>{activeEvent ? formatEventProgress(activeEvent.progress) : 'EVENTO EN ESPERA'}</Text>
                       {activeEvent && eventProgressAvailable ? <ProgressRail value={activeEvent.progress} total={100} color={eventAccent} background={colors.border} /> : <View style={[styles.eventIdleRule, { backgroundColor: `${eventAccent}66` }]} />}
                    </View>
                  </Pressable>

                    <Pressable accessibilityRole="button" accessibilityLabel={featuredCanExpand ? (featuredExpanded ? 'Ocultar lore de la carta destacada' : 'Inspeccionar lore de la carta destacada') : 'Carta destacada sin lore sincronizado'} accessibilityState={{ disabled: !featuredCanExpand, expanded: featuredCanExpand && featuredExpanded }} disabled={!featuredCanExpand} testID="home-featured-card-detail" onPress={openFeatured} style={({ pressed }) => [styles.artifactFeatureFinal, { opacity: !featuredCanExpand ? 0.62 : pressed ? 0.78 : 1, transform: [{ translateY: pressed && featuredCanExpand ? 2 : 0 }] }]}>
                    <View style={[styles.artifactFrameFinal, { borderColor: colors.rarityLegendary, backgroundColor: colors.ink }]}>
                       {activeCard?.image_url ? <Image source={{ uri: activeCard.image_url }} style={styles.artifactArtFinal} resizeMode="cover" accessibilityLabel="Arte oficial de la carta destacada" onLoad={() => setFeaturedAssetState('ready')} onError={() => setFeaturedAssetState('error')} /> : null}
                       <LinearGradient colors={['transparent', `${colors.ink}F2`]} style={StyleSheet.absoluteFill} />
                      <Text style={[styles.artifactRarityFinal, { color: colors.rarityLegendary }]}>{activeCard?.rarity?.toUpperCase() ?? 'SEÑAL PENDIENTE'}</Text>
                      <Text style={[styles.artifactCodeFinal, { color: colors.foreground }]}>{cardCodeLabel(activeCard?.code)}</Text>
                      {featuredAssetState === 'error' ? <View style={styles.featuredAssetError}><Text style={[styles.featuredAssetErrorText, { color: colors.accent }]}>ARTE OFFLINE</Text></View> : null}
                    </View>
                    <View style={styles.artifactCopyFinal}>
                      <Text style={[styles.artifactTagFinal, { color: colors.rarityLegendary }]}>CARTA DE RESONANCIA</Text>
                      <Text numberOfLines={2} style={[styles.artifactNameFinal, { color: colors.foreground }]}>{activeCard?.name ?? 'CARTA NO SINCRONIZADA'}</Text>
                      {featuredExpanded && activeCard?.lore ? <Text numberOfLines={3} style={[styles.artifactLoreFinal, { color: colors.mutedForeground }]}>{activeCard.lore}</Text> : null}
                       <Text style={[styles.artifactHintFinal, { color: featuredCanExpand ? colors.rarityLegendary : colors.mutedForeground }]}>{featuredCanExpand ? (featuredExpanded ? 'TOCAR PARA CERRAR' : 'TOCAR PARA INSPECCIONAR') : 'LORE NO SINCRONIZADO'}</Text>
                    </View>
                  </Pressable>
                </View>

                   <Animated.View
                     entering={reduceMotion ? undefined : FadeInUp.delay(orbitReveal)}
                     style={[
                       styles.domainArchiveFinal,
                       domainSceneDriftStyle,
                       {
                         borderLeftColor: `${identityVisual?.accent ?? colors.rarityEpic}80`,
                       },
                     ]}
                     testID="home-domain-rail"
                   >
                  <View style={styles.domainArchiveHeaderFinal}>
                    <View>
                         <Text style={[styles.domainArchiveEyebrowFinal, { color: colors.rarityEpic }]}>
                           {identityCard ? `DOMINIOS / 06 RUTAS · ${identityCard.faction?.toUpperCase()}` : 'DOMINIOS / 06 RUTAS'}
                         </Text>
                      <Text style={[styles.domainArchiveTitleFinal, { color: colors.foreground }]}>Elige dónde forjar</Text>
                    </View>
                    <Animated.View style={[styles.domainArchiveCoreFinal, { borderColor: colors.accent }, pulseStyle]}><Icon name="resonance" color={colors.accent} size={13} /></Animated.View>
                  </View>
                  <View style={[styles.constellationFinal, { zIndex: orbitDepth }]} accessibilityLabel="Dominios conectados del Nexus">
                    {/* SceneOrbitPoint contract: signal={domainSignals.} is resolved from each live portal status. */}
                     <View style={styles.constellationGrid}>{domainPortals.map((portal) => <Animated.View key={portal.id} style={[styles.domainPulseWrapper, portal.active ? activeDomainPulseStyle : undefined]}><SceneOrbitPoint portal={portal} signal={domainSignals[portal.id]} onPress={() => navigate(portal.route)} /></Animated.View>)}</View>
                  </View>
                </Animated.View>

                 <View
                   style={[
                     styles.ritualDeckFinal,
                     {
                       borderLeftColor: `${identityVisual?.accent ?? colors.accent}B8`,
                       backgroundColor: `${colors.ink}98`,
                     },
                   ]}
                 >
                  <View style={styles.ritualHeadingFinal}><View><Text style={[styles.ritualEyebrowFinal, { color: colors.success }]}>OPERACIONES / 02</Text><Text style={[styles.ritualTitleFinal, { color: colors.foreground }]}>El siguiente movimiento</Text></View><View style={[styles.ritualHeadingMarkFinal, { borderColor: colors.success }]}><Icon name="resonance" color={colors.success} size={14} /></View></View>
                  <View style={styles.operationRowFinal}>
                    <OperationGate label="FORJA" title="Construye tu línea" detail={`${levelSignal} · MAZO ACTIVO`} icon="deck" color={colors.rarityEpic} testID="home-forge" accessibilityLabel="Abrir Forja" onPress={() => navigate('/deck')} />
                    <OperationGate label="ECONOMÍA" title="Mueve el VEX" detail={wallet ? `${walletSignal} DISPONIBLES` : walletSignal} icon="trending-up-outline" color={colors.accent} testID="home-economy" accessibilityLabel="Abrir economía" onPress={() => navigate('/economy')} />
                  </View>
                  <View style={styles.storeRitualFinal}>
                    <View style={styles.storeHeadingFinal}><View><Text style={[styles.operationLabelFinal, { color: colors.success }]}>CÁMARA DE FORJA</Text><Text style={[styles.storeTitleFinal, { color: colors.foreground }]}>Colección y recursos</Text></View><View style={[styles.storeHeadingMarkFinal, { backgroundColor: `${colors.success}18`, borderColor: colors.success }]}><Icon name="packs" color={colors.success} size={14} /></View></View>
                    <View style={styles.forgeChamberGrid}>
                      {[
                        ['PACKS', 'packs', '/store?mode=packs', 'home-store-packs'],
                        ['TIENDA', 'shop', '/store?mode=shop', 'home-store-shop'],
                        ['FUSIÓN', 'fusion', '/store?mode=fusion', 'home-store-fusion'],
                        ['EVOLUCIÓN', 'evolution', '/store?mode=evolution', 'home-store-evolution'],
                      ].map(([label, icon, route, testID]) => (
                        <ForgeChamber key={testID} label={label} icon={icon as IconName} color={colors.success} testID={testID} onPress={() => navigate(route as HomeRoute)} />
                      ))}
                    </View>
                  </View>
                </View>

                <Animated.View
                  entering={reduceMotion ? undefined : FadeInUp.delay(orbitReveal + MOTION.micro)}
                  style={styles.continuumBridge}
                  testID="home-continuum-bridge"
                >
                  <View style={styles.continuumBridgeHeader}>
                    <View>
                      <Text style={[styles.continuumBridgeEyebrow, { color: colors.rarityRare }]}>TRAZA DEL NEXUS</Text>
                      <Text style={[styles.continuumBridgeTitle, { color: colors.foreground }]}>El frente se mueve</Text>
                    </View>
                    <Animated.View style={[styles.continuumBridgeCore, { borderColor: colors.rarityRare }, pulseStyle]}>
                      <Icon name="resonance" color={colors.rarityRare} size={12} />
                    </Animated.View>
                  </View>
                  <View style={styles.continuumBridgeRail}>
                    <View style={[styles.continuumBridgeAxis, { backgroundColor: `${colors.rarityRare}4D` }]} />
                    <ContinuumNode
                      label="FORJA"
                      value={levelSignal}
                      detail={wallet ? formatMetric(wallet.vex_ingame, 'VEX EN RESERVA', 'VEX NO REPORTADO') : 'REGISTRO EN ESPERA'}
                      icon="deck"
                      color={colors.rarityEpic}
                      active={Boolean(wallet)}
                      testID="home-continuum-forge"
                      onPress={() => navigate('/deck')}
                    />
                    <ContinuumNode
                      label="RITO"
                      value={formatMetric(home.missions.length, 'ACTIVAS', 'ÓRDENES NO REPORTADAS')}
                      detail={home.missions[0]?.name ?? 'SIN FRENTE PUBLICADO'}
                      icon="missions"
                      color={colors.success}
                      active={home.missions.length > 0}
                      testID="home-continuum-missions"
                      onPress={() => navigate('/missions')}
                    />
                    <ContinuumNode
                      label="PULSO"
                      value={formatMetric(home.activity.length, 'SEÑALES', 'ACTIVIDAD NO REPORTADA')}
                      detail={ranking[0] ? `#${ranking[0].rank} ${ranking[0].display_name}` : 'CLASIFICACIÓN EN ESPERA'}
                      icon="radio"
                      color={colors.rarityRare}
                      active={home.activity.length > 0 || ranking.length > 0}
                      testID="home-continuum-pulse"
                      onPress={() => navigate('/world')}
                    />
                  </View>
                </Animated.View>

                 <Animated.View
                   entering={reduceMotion ? undefined : FadeInUp.delay(orbitReveal + MOTION.navigation)}
                   style={[styles.signalColumnsFinal, secondarySceneDepthStyle]}
                   testID="home-secondary-signals"
                 >
                  <View style={styles.signalColumnFinal}>
                    <SectionMarker eyebrow={home.missions.length === 1 ? 'ORDEN ACTIVA' : 'ÓRDENES ACTIVAS'} title="El rito continúa" action="ABRIR" onAction={() => navigate('/missions')} accent={colors.success} />
                    {home.missions.length > 0 ? <View testID="home-missions" style={styles.missionSignals}>{home.missions.slice(0, 3).map((mission, index) => <MissionSignal key={mission.id} mission={mission} index={index} onPress={() => navigate('/missions')} />)}</View> : <View style={[styles.emptyState, { borderColor: colors.border }]}><Icon name="compass" color={colors.mutedForeground} size={21} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>SIN FRENTE ACTIVO</Text><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Las próximas misiones aparecerán cuando el Nexus publique el siguiente ciclo.</Text></View>}
                  </View>
                  <View style={styles.signalColumnFinal}>
                    <SectionMarker eyebrow="PULSO PÚBLICO" title="Actividad" action="MUNDO" onAction={() => navigate('/world')} accent={colors.rarityRare} />
                    <View testID="home-activity" style={styles.activitySignals}>{home.activity.length > 0 ? home.activity.slice(0, 3).map((item, index, items) => <ActivitySignal key={item.id} item={item} index={index} last={index === items.length - 1} onPress={() => navigate('/world')} />) : <View style={styles.emptyActivity}><Icon name="radio" color={colors.mutedForeground} size={18} /><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>El pulso público se mostrará cuando exista actividad confirmada.</Text></View>}</View>
                  </View>
                 </Animated.View>

                <View style={styles.rankingDeckFinal}>
                  <SectionMarker eyebrow="CIRCUITO ACTIVO" title="Clasificación del frente" action="ABRIR MUNDO" onAction={() => navigate('/world')} accent={colors.accent} />
                   <Pressable
                     accessibilityRole="button"
                     accessibilityLabel={ranking[0] ? `Abrir Mundo. Lidera la clasificación ${ranking[0].display_name}` : 'Abrir Mundo. Clasificación en espera'}
                     testID="home-ranking-monument"
                     onPress={() => navigate('/world')}
                     style={({ pressed }) => [
                       styles.rankingMonument,
                       {
                         borderLeftColor: `${colors.accent}B8`,
                         backgroundColor: `${colors.ink}66`,
                         opacity: pressed ? 0.72 : 1,
                         transform: [{ translateY: pressed ? 2 : 0 }],
                       },
                     ]}
                   >
                     <Animated.View style={[styles.rankingMonumentSeal, { borderColor: colors.accent, backgroundColor: `${colors.accent}12` }, pulseStyle]}>
                       <Icon name="award" color={colors.accent} size={16} />
                     </Animated.View>
                     <View style={styles.rankingMonumentCopy}>
                       <Text style={[styles.rankingMonumentEyebrow, { color: colors.accent }]}>ESTELA DE PRESTIGIO</Text>
                       <Text numberOfLines={1} style={[styles.rankingMonumentLeader, { color: colors.foreground }]}>
                         {ranking[0] ? `#${ranking[0].rank} ${ranking[0].display_name}` : 'CLASIFICACIÓN EN ESPERA'}
                       </Text>
                       <Text style={[styles.rankingMonumentMeta, { color: colors.mutedForeground }]}>
                         {ranking[0] ? `${formatMetric(ranking[0].mmr, 'MMR', 'MMR NO REPORTADO')} · ${formatMetric(ranking[0].wins, 'VICTORIAS', 'VICTORIAS NO REPORTADAS')}` : 'El frente aún no ha inscrito posiciones.'}
                       </Text>
                     </View>
                     <Text style={[styles.rankingMonumentCount, { color: colors.accent }]}>{ranking.length ? `${ranking.length} POS.` : 'SIN POSICIONES PUBLICADAS'}</Text>
                   </Pressable>
                  <View testID="home-ranking" style={styles.rankingSignals}>{ranking.length > 0 ? ranking.map((entry, index) => <RankingSignal key={entry.rank + '-' + entry.display_name} entry={entry} index={index} onPress={() => navigate('/world')} />) : <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>El ranking de la temporada todavía no tiene posiciones publicadas.</Text>}</View>
                </View>
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
  heroSceneViewport: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  sceneDepthLayer: { ...StyleSheet.absoluteFillObject },
  nexusWorldScene: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  sceneSkyVeil: { ...StyleSheet.absoluteFillObject },
  sceneAurora: { borderRadius: 220, borderWidth: 1, height: 360, left: '18%', opacity: 0.72, position: 'absolute', top: -120, width: 360 },
  sceneLightColumns: { ...StyleSheet.absoluteFillObject },
  sceneLightColumn: { borderRadius: 90, height: '78%', opacity: 0.58, position: 'absolute', top: '-8%', transform: [{ skewX: '-14deg' }], width: 34 },
  sceneLightColumnLeft: { left: '20%' },
  sceneLightColumnCenter: { left: '48%', width: 46 },
  sceneLightColumnRight: { right: '18%' },
  sceneStars: { ...StyleSheet.absoluteFillObject },
  sceneStar: { borderRadius: 3, height: 3, position: 'absolute', width: 3 },
  sceneCitadel: { alignItems: 'center', height: 290, left: '50%', marginLeft: -105, position: 'absolute', top: 62, width: 210 },
  sceneCitadelHalo: { borderRadius: 110, borderWidth: 1, height: 210, position: 'absolute', top: 2, width: 210 },
  sceneCitadelCrown: { borderBottomWidth: 34, borderLeftWidth: 48, borderRightWidth: 48, borderStyle: 'solid', borderTopColor: 'transparent', height: 0, position: 'absolute', top: 28, width: 0 },
  sceneCitadelTower: { alignItems: 'center', borderWidth: 1, height: 150, position: 'absolute', top: 58, width: 80 },
  sceneCitadelWindow: { height: 84, opacity: 0.72, position: 'absolute', top: 34, width: 12 },
  sceneCitadelWindowCore: { height: 18, opacity: 0.8, position: 'absolute', top: 67, width: 4 },
  sceneCitadelSpire: { height: 68, position: 'absolute', top: 12, transform: [{ rotate: '45deg' }], width: 18 },
  sceneCitadelWing: { borderWidth: 1, bottom: 28, height: 112, position: 'absolute', transform: [{ skewY: '-12deg' }], width: 44 },
  sceneCitadelWingLeft: { left: 12 },
  sceneCitadelWingRight: { right: 12, transform: [{ skewY: '12deg' }] },
  sceneBridge: { bottom: 0, height: 230, left: 0, position: 'absolute', right: 0 },
  sceneBridgeRail: { bottom: 70, height: 1, left: '17%', position: 'absolute', right: '17%' },
  sceneForgeCore: { alignSelf: 'center', borderRadius: 22, bottom: 47, height: 44, opacity: 0.5, position: 'absolute', width: 44 },
  scenePortalMarker: { alignItems: 'center', position: 'absolute', width: 82, zIndex: 3 },
  scenePortalLeft: { left: '10%' },
  scenePortalRight: { right: '10%' },
  scenePortalHigh: { top: '31%' },
  scenePortalLow: { top: '49%' },
  scenePortalRing: { alignItems: 'center', borderRadius: 31, borderWidth: 1, height: 62, justifyContent: 'center', width: 62 },
  scenePortalCore: { borderRadius: 18, height: 36, opacity: 0.34, position: 'absolute', width: 36 },
  scenePortalLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.1, marginTop: 6 },
  scenePortalStatus: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 7, letterSpacing: 0.8, marginTop: 1 },
  heroIdentityBackdrop: { height: '124%', left: '-26%', opacity: 0.22, position: 'absolute', top: '-14%', width: '152%' },
  heroSceneAtmosphere: { borderRadius: 220, height: 360, position: 'absolute', right: -154, top: 52, width: 360 },
  heroSceneMist: { bottom: -80, height: 360, left: -80, position: 'absolute', width: '120%' },
  identityStage: { bottom: 36, borderBottomLeftRadius: 148, borderTopLeftRadius: 148, borderWidth: 1, borderRightWidth: 0, height: 432, overflow: 'hidden', position: 'absolute', right: -36, width: 286, zIndex: 1 },
  identityArt: { height: '135%', left: -120, opacity: 0.96, position: 'absolute', top: -30, width: '205%' },
  identityAtmosphere: { borderRadius: 150, borderWidth: 1, height: 296, left: -36, position: 'absolute', top: 46, transform: [{ rotate: '18deg' }], width: 296 },
  identityAxis: { bottom: 52, position: 'absolute', right: 42, top: 52, width: 1 },
  identityStageRule: { borderLeftWidth: 1, borderTopWidth: 1, height: 68, left: 22, position: 'absolute', top: 22, width: 68 },
  identityStageCopy: { bottom: 22, left: 27, position: 'absolute', right: 24 },
  identityStageKicker: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1.3 },
  identityStageCode: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1, marginTop: 4 },
  identityStageName: { fontFamily: 'Cinzel_600SemiBold', fontSize: 16, lineHeight: 20, marginTop: 4 },
  identityStageMeta: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 0.6, marginTop: 4 },
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
  heroCardFrame: { borderBottomLeftRadius: 48, borderTopRightRadius: 48, borderWidth: 1, height: 164, overflow: 'hidden', position: 'relative', transform: [{ rotate: '3deg' }], width: 114 },
  heroCardArt: { height: '122%', left: '-12%', position: 'absolute', top: '-8%', width: '124%' },
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
   markerSeal: { alignItems: 'center', borderWidth: 1, height: 9, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 9 },
   markerSealCore: { height: 3, transform: [{ rotate: '-45deg' }], width: 3 },
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
    domainPulseWrapper: { width: '48%' },
  domainWorldObject: {
    alignItems: 'center',
    minHeight: VISUAL_TOKENS.domainPortal.object.minHeight,
    paddingHorizontal: VISUAL_TOKENS.domainPortal.object.paddingHorizontal,
    paddingVertical: VISUAL_TOKENS.domainPortal.object.paddingVertical,
    width: '100%',
  },
   domainWorldObjectTop: { alignItems: 'center', height: 61, justifyContent: 'flex-start', position: 'relative', width: '100%' },
  domainWorldHalo: {
    alignItems: 'center',
    borderRadius: VISUAL_TOKENS.domainPortal.halo.radius,
    borderWidth: VISUAL_TOKENS.domainPortal.halo.borderWidth,
    height: VISUAL_TOKENS.domainPortal.halo.size,
    justifyContent: 'center',
    transform: [{ rotate: VISUAL_TOKENS.domainPortal.halo.rotation }],
    width: VISUAL_TOKENS.domainPortal.halo.size,
  },
  domainWorldSigil: {
    alignItems: 'center',
    borderWidth: VISUAL_TOKENS.domainPortal.sigil.borderWidth,
    height: VISUAL_TOKENS.domainPortal.sigil.size,
    justifyContent: 'center',
    transform: [{ rotate: VISUAL_TOKENS.domainPortal.sigil.rotation }],
    width: VISUAL_TOKENS.domainPortal.sigil.size,
  },
   domainWorldGlyph: { alignItems: 'center', justifyContent: 'center' },
  domainWorldCore: {
    borderRadius: VISUAL_TOKENS.domainPortal.core.radius,
    height: VISUAL_TOKENS.domainPortal.core.size,
    position: 'absolute',
    right: VISUAL_TOKENS.domainPortal.core.offset,
    top: VISUAL_TOKENS.domainPortal.core.offset,
    width: VISUAL_TOKENS.domainPortal.core.size,
  },
  domainWorldTrace: {
    bottom: 0,
    height: VISUAL_TOKENS.domainPortal.trace.height,
    position: 'absolute',
    width: VISUAL_TOKENS.domainPortal.trace.width,
  },
  domainWorldLabel: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: VISUAL_TOKENS.domainPortal.label.fontSize,
    letterSpacing: VISUAL_TOKENS.domainPortal.label.letterSpacing,
    marginTop: VISUAL_TOKENS.domainPortal.label.marginTop,
  },
  domainWorldTitle: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: VISUAL_TOKENS.domainPortal.title.fontSize,
    lineHeight: VISUAL_TOKENS.domainPortal.title.lineHeight,
    marginTop: VISUAL_TOKENS.domainPortal.title.marginTop,
    textAlign: 'center',
  },
  domainWorldStatusLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: VISUAL_TOKENS.domainPortal.status.gap,
    marginTop: VISUAL_TOKENS.domainPortal.status.marginTop,
    maxWidth: '100%',
  },
  domainWorldStatusMark: {
    borderRadius: VISUAL_TOKENS.domainPortal.status.markRadius,
    height: VISUAL_TOKENS.domainPortal.status.markSize,
    width: VISUAL_TOKENS.domainPortal.status.markSize,
  },
   domainWorldStatus: { flexShrink: 1, fontFamily: 'Rajdhani_600SemiBold', fontSize: 8, letterSpacing: 0.2, textAlign: 'center' },
  signalBand: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8, paddingVertical: 12, rowGap: 13 },
  signalMetric: { alignItems: 'center', flexDirection: 'row', gap: 7, minWidth: '47%' },
  signalMetricCopy: { gap: 1 },
  signalValue: { fontFamily: 'Cinzel_700Bold', fontSize: 15 },
  signalLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1 },
  continuumBridge: { borderLeftWidth: 1, marginTop: 19, paddingBottom: 12, paddingLeft: 10, paddingTop: 2 },
  continuumBridgeHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  continuumBridgeEyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.45 },
  continuumBridgeTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 17, marginTop: 4 },
  continuumBridgeCore: { alignItems: 'center', borderWidth: 1, height: 25, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 25 },
  continuumBridgeRail: { gap: 8, marginTop: 12, position: 'relative' },
  continuumBridgeAxis: { bottom: 8, left: 17, position: 'absolute', top: 8, width: 1 },
  continuumNode: { alignItems: 'center', borderLeftWidth: 2, borderWidth: 1, flexDirection: 'row', gap: 8, minHeight: 58, paddingHorizontal: 9, paddingVertical: 8 },
  continuumNodeDetail: { flex: 1, fontFamily: 'Rajdhani_500Medium', fontSize: 9, letterSpacing: 0.35, lineHeight: 13 },
  continuumNodeMark: { borderRadius: 3, height: 6, width: 6 },
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
  missionSignals: { gap: 8, marginTop: 7 },
  missionSignal: { alignItems: 'center', borderLeftWidth: 2, borderWidth: 1, flexDirection: 'row', gap: 9, minHeight: 74, paddingHorizontal: 9, paddingVertical: 8 },
  missionSignalBeacon: { alignItems: 'center', height: 56, justifyContent: 'center', width: 43 },
  missionSignalOrbit: { alignItems: 'center', borderRadius: 17, borderWidth: 1, height: 34, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 34 },
  missionSignalIndex: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, transform: [{ rotate: '-45deg' }] },
  missionSignalAxis: { bottom: 0, height: 10, position: 'absolute', width: 1 },
  missionSignalCopy: { flex: 1, gap: 6, minWidth: 0 },
  missionSignalName: { fontFamily: 'Rajdhani_700Bold', fontSize: 14, letterSpacing: 0.3 },
  missionSignalMeta: { alignItems: 'center', flexDirection: 'row', gap: 6, minWidth: 0 },
  missionSignalDifficulty: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.8 },
  missionSignalDivider: { height: 1, width: 12 },
  missionSignalReward: { flexShrink: 1, fontFamily: 'Rajdhani_500Medium', fontSize: 9, letterSpacing: 0.3 },
  missionSignalPulse: { alignItems: 'flex-end', gap: 5, justifyContent: 'center', minWidth: 39 },
  missionSignalPulseMark: { borderRadius: 3, height: 6, width: 6 },
  missionSignalPulseText: { fontFamily: 'Rajdhani_700Bold', fontSize: 7, letterSpacing: 0.65 },
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
  activitySignals: { paddingTop: 7 },
  activitySignal: { alignItems: 'stretch', flexDirection: 'row', gap: 9, minHeight: 60 },
   activitySignalRail: { alignItems: 'center', width: 23 },
   activitySignalSeal: { alignItems: 'center', borderWidth: 1, height: 21, justifyContent: 'center', marginTop: 1, transform: [{ rotate: '45deg' }], width: 21 },
   activitySignalSealIcon: { transform: [{ rotate: '-45deg' }] },
  activitySignalLine: { flex: 1, marginVertical: 3, width: 1 },
  activitySignalBody: { borderBottomWidth: 1, flex: 1, gap: 4, paddingBottom: 10, paddingTop: 1 },
  activitySignalCopy: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, lineHeight: 16 },
  activitySignalTime: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 0.85 },
  activitySignalStamp: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.8, paddingTop: 1, width: 18 },
  emptyActivity: { alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingVertical: 20 },
  rankingSignals: { gap: 8, paddingTop: 7 },
  rankingSignal: { alignItems: 'center', borderLeftWidth: 2, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 57, paddingHorizontal: 10, paddingVertical: 8 },
  rankingSignalSigil: { alignItems: 'center', borderWidth: 1, height: 31, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 31 },
  rankingSignalPosition: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, transform: [{ rotate: '-45deg' }] },
  rankingSignalIdentity: { flex: 1, gap: 3, minWidth: 0 },
  rankingSignalName: { fontFamily: 'Rajdhani_700Bold', fontSize: 13, letterSpacing: 0.3 },
  rankingSignalMeta: { fontFamily: 'Rajdhani_500Medium', fontSize: 9, letterSpacing: 0.65 },
  rankingSignalScore: { alignItems: 'flex-end', gap: 1, minWidth: 42 },
  rankingSignalScoreValue: { fontFamily: 'Cinzel_700Bold', fontSize: 13 },
  rankingSignalScoreLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 7, letterSpacing: 0.8 },

    nexusWorldFinal: { marginTop: -14, overflow: 'hidden', paddingHorizontal: 8, paddingTop: 16, position: 'relative' },
    continuumArt: { height: '62%', left: '-12%', position: 'absolute', top: 0, width: '124%' },
    continuumGlow: { borderRadius: 220, height: 270, opacity: 0.15, position: 'absolute', right: -132, top: 64, width: 270 },
    continuumContent: { position: 'relative', zIndex: 1 },
    signalLedgerFinal: { alignItems: 'center', borderLeftWidth: 2, flexDirection: 'row', gap: 12, paddingBottom: 14, paddingLeft: 12 },
    signalIdentityFinal: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10, minWidth: 0 },
    signalCrestFinal: { alignItems: 'center', borderRadius: 4, borderWidth: 1, height: 39, justifyContent: 'center', width: 39 },
    signalCrestInnerFinal: { display: 'none' },
    signalCrestLetterFinal: { fontFamily: 'Cinzel_700Bold', fontSize: 15 },
    signalIdentityCopyFinal: { flex: 1, gap: 2, minWidth: 0 },
    signalKickerFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1.1 },
    signalPlayerNameFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 14 },
    signalPlayerMetaFinal: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 0.6 },
     identitySourceFinal: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 3, minWidth: 0 },
     identitySourceMarkFinal: { height: 5, transform: [{ rotate: '45deg' }], width: 5 },
     identitySourceTextFinal: { flex: 1, fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 0.65 },
    signalProgressFinal: { flex: 0.9, gap: 7 },
    signalProgressLineFinal: { flexDirection: 'row', justifyContent: 'space-between' },
    signalProgressValueFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9 },
    frontStageFinal: { marginTop: 25 },
    frontStageHeaderFinal: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11 },
    frontStageEyebrowFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.7 },
    frontStageTitleFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 20, marginTop: 4 },
    frontStageLinkFinal: { alignItems: 'center', flexDirection: 'row', gap: 4, paddingBottom: 2 },
    frontStageLinkTextFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 0.8 },
    eventRibbonFinal: { alignItems: 'center', borderLeftWidth: 2, flexDirection: 'row', gap: 9, minHeight: 126, paddingLeft: 12, paddingVertical: 12 },
    eventBeaconFinal: { alignItems: 'center', borderWidth: 1, height: 58, justifyContent: 'center', width: 43 },
    eventOrbFinal: { display: 'none' },
    eventOrbCoreFinal: { display: 'none' },
    eventBeaconAxisFinal: { display: 'none' },
    eventCopyFinal: { flex: 1, gap: 3, minWidth: 0 },
    eventTypeFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.35 },
    eventTitleFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 14, lineHeight: 18 },
    eventMetaFinal: { fontFamily: 'Rajdhani_500Medium', fontSize: 10, letterSpacing: 0.45 },
    eventProgressFinal: { alignItems: 'flex-end', gap: 6, width: 42 },
    eventProgressValueFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 13 },
    eventIdleRule: { height: 2, width: 26 },
    artifactFeatureFinal: { alignItems: 'center', flexDirection: 'row', gap: 14, minHeight: 204, paddingVertical: 15 },
    artifactFrameFinal: { borderBottomLeftRadius: 18, borderTopRightRadius: 72, borderWidth: 1, height: 190, overflow: 'hidden', position: 'relative', transform: [{ rotate: '-2deg' }], width: 130 },
    artifactArtFinal: { height: '122%', left: '-12%', position: 'absolute', top: '-8%', width: '124%' },
    artifactRarityFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, left: 7, letterSpacing: 0.8, position: 'absolute', top: 7 },
    artifactCodeFinal: { bottom: 7, fontFamily: 'Rajdhani_700Bold', fontSize: 8, left: 8, letterSpacing: 0.9, position: 'absolute' },
    artifactCopyFinal: { flex: 1, justifyContent: 'center', minWidth: 0, paddingVertical: 7 },
    artifactTagFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.1 },
    artifactNameFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 18, lineHeight: 23, marginTop: 9 },
    artifactLoreFinal: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, lineHeight: 16, marginTop: 9 },
    artifactHintFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1, marginTop: 16 },
     domainArchiveFinal: { borderLeftWidth: 1, marginTop: 24, paddingLeft: 10 },
    domainArchiveHeaderFinal: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    domainArchiveEyebrowFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.55 },
    domainArchiveTitleFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 19, marginTop: 4 },
  domainArchiveCoreFinal: { alignItems: 'center', borderLeftWidth: 2, height: 28, justifyContent: 'center', width: 28 },
    constellationFinal: { minHeight: 190, paddingVertical: 8, position: 'relative' },
    constellationAxisFinal: { bottom: 12, left: '50%', opacity: 0.48, position: 'absolute', top: 12, width: 1 },
    constellationCoreFinal: { alignItems: 'center', borderWidth: 1, height: 22, justifyContent: 'center', left: '50%', marginLeft: -11, position: 'absolute', top: '50%', transform: [{ rotate: '45deg' }], width: 22, zIndex: 2 },
    ritualDeckFinal: { marginTop: 24, paddingBottom: 12, paddingTop: 13 },
    ritualHeadingFinal: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    ritualHeadingMarkFinal: { alignItems: 'center', borderWidth: 1, height: 27, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 27 },
    ritualEyebrowFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.45 },
    ritualTitleFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 17, marginTop: 4 },
    operationRowFinal: { flexDirection: 'row', gap: 10, marginTop: 13 },
    operationGate: { alignItems: 'center', borderLeftWidth: 2, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 8, minHeight: 83, paddingHorizontal: 8, paddingVertical: 8 },
    operationGateGlyph: { alignItems: 'center', borderWidth: 1, height: 35, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 35 },
    operationGateCopy: { flex: 1, gap: 3, minWidth: 0 },
    operationGateLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1.15 },
    operationGateTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 12, lineHeight: 16 },
    operationGateDetail: { fontFamily: 'Rajdhani_500Medium', fontSize: 8, letterSpacing: 0.35 },
    operationGateBeacon: { alignItems: 'flex-end', gap: 5, justifyContent: 'center', minWidth: 28 },
    operationGateBeaconMark: { borderRadius: 3, height: 6, width: 6 },
    operationGateBeaconText: { fontFamily: 'Rajdhani_700Bold', fontSize: 7, letterSpacing: 0.65 },
    operationLabelFinal: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 1.15 },
    operationTitleFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 12, lineHeight: 16, marginTop: 3 },
    storeRitualFinal: { marginTop: 18, paddingTop: 13 },
    storeHeadingFinal: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    storeHeadingMarkFinal: { alignItems: 'center', borderWidth: 1, height: 27, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 27 },
    storeTitleFinal: { fontFamily: 'Cinzel_600SemiBold', fontSize: 15, marginTop: 4 },
    forgeChamberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 },
    forgeChamber: { alignItems: 'center', borderWidth: 1, flexDirection: 'row', gap: 7, minHeight: 43, paddingHorizontal: 8, width: '47%' },
    forgeChamberGlyph: { alignItems: 'center', borderWidth: 1, height: 23, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 23 },
    forgeChamberLabel: { flex: 1, fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 0.8 },
    forgeChamberMark: { borderRadius: 2, height: 4, width: 4 },
    signalColumnsFinal: { flexDirection: 'row', gap: 18, marginTop: 7 },
     signalColumnFinal: { flex: 1, minWidth: 0 },
     rankingDeckFinal: { marginTop: 17, paddingBottom: 16 },
     rankingMonument: { alignItems: 'center', borderLeftWidth: 2, flexDirection: 'row', gap: 10, marginTop: 10, minHeight: 70, paddingHorizontal: 10, paddingVertical: 10 },
     rankingMonumentSeal: { alignItems: 'center', borderWidth: 1, height: 34, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 34 },
     rankingMonumentCopy: { flex: 1, gap: 3, minWidth: 0 },
     rankingMonumentEyebrow: { fontFamily: 'Rajdhani_700Bold', fontSize: 8, letterSpacing: 1.15 },
     rankingMonumentLeader: { fontFamily: 'Cinzel_600SemiBold', fontSize: 13, lineHeight: 17 },
     rankingMonumentMeta: { fontFamily: 'Rajdhani_500Medium', fontSize: 9, letterSpacing: 0.35 },
     rankingMonumentCount: { fontFamily: 'Rajdhani_700Bold', fontSize: 9, letterSpacing: 0.7 },

});