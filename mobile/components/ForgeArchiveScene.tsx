import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { CANONICAL_BACKGROUNDS } from '@/constants/visual';
import { VISUAL_TOKENS } from '@/constants/experience';
import type { PublicCard } from '@/lib/supabase';
import { Feather } from '@/components/ForgeIcon';

type ForgeArchiveSceneProps = {
  scrollY: Animated.Value;
  reducedMotion: boolean;
  featuredCard: PublicCard | null;
  ownedCount: number;
  totalCount: number;
  onInspect: () => void;
  onRefresh: () => void;
};

export function ForgeArchiveScene({
  scrollY,
  reducedMotion,
  featuredCard,
  ownedCount,
  totalCount,
  onInspect,
  onRefresh,
}: ForgeArchiveSceneProps) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(0)).current;
  const parallaxY = reducedMotion
    ? 0
    : scrollY.interpolate({
      inputRange: [-120, 0, 520],
      outputRange: [-3, 0, -VISUAL_TOKENS.archive.performance.parallaxMaxTranslateY],
      extrapolate: 'clamp',
    });

  useEffect(() => {
    if (reducedMotion) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, reducedMotion]);

  const sceneSource = CANONICAL_BACKGROUNDS.collection;
  const featuredName = featuredCard?.name ?? 'ARTEFACTO NO REPORTADO';
  const completion = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : null;

  return (
    <View testID="cards-scene-viewport" style={styles.scene}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.imageBleed,
          { transform: [{ translateY: parallaxY }] },
        ]}
      >
        <Image source={sceneSource} resizeMode="cover" style={styles.sceneImage} />
      </Animated.View>
      <LinearGradient
        pointerEvents="none"
        colors={[`${colors.ink}28`, `${colors.ink}18`, `${colors.background}E6`]}
        locations={[0, 0.46, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[`${colors.rarityRare}46`, 'transparent', `${colors.primary}38`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          styles.glowLeft,
          {
            backgroundColor: colors.rarityRare,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.24] }),
            transform: [{ translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [8, -8] }) }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          styles.glowRight,
          {
            backgroundColor: colors.primary,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.18] }),
            transform: [{ translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [-7, 7] }) }],
          },
        ]}
      />

      <View style={styles.sceneTop}>
        <View>
          <Text style={[styles.sceneKicker, { color: colors.rarityRare }]}>ARCHIVO VIVO</Text>
          <Text style={[styles.sceneTitle, { color: colors.foreground }]}>Santuario de cartas</Text>
          <Text style={[styles.sceneCopy, { color: colors.mutedForeground }]}>
            Cada carta conserva una identidad, una rareza y un lugar dentro de tu legado.
          </Text>
        </View>
        <Pressable
          testID="collection-refresh"
          accessibilityRole="button"
          accessibilityLabel="Actualizar colección"
          onPress={onRefresh}
          style={({ pressed }) => [
            styles.refresh,
            {
              borderColor: `${colors.rarityRare}99`,
              backgroundColor: `${colors.ink}B8`,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <Feather name="refresh-cw" size={17} color={colors.rarityRare} />
        </Pressable>
      </View>

      <View pointerEvents="box-none" style={styles.portalArea}>
        <Pressable
          testID="cards-featured-portal"
          accessibilityRole="button"
          accessibilityLabel={featuredCard ? `Abrir carta destacada ${featuredName}` : 'Carta destacada no disponible'}
          accessibilityState={{ disabled: !featuredCard }}
          disabled={!featuredCard}
          onPress={onInspect}
          style={({ pressed }) => [
            styles.portal,
            {
              borderColor: `${colors.rarityRare}C7`,
              backgroundColor: `${colors.ink}A8`,
              opacity: pressed ? 0.78 : featuredCard ? 1 : 0.58,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={[styles.portalCore, { borderColor: colors.rarityRare, backgroundColor: `${colors.rarityRare}28` }]}>
            <View style={[styles.portalCoreInner, { backgroundColor: colors.rarityRare }]} />
          </View>
          <Text style={[styles.portalLabel, { color: colors.rarityRare }]}>
            {featuredCard ? 'ABRIR CARTA DESTACADA' : 'CARTA DESTACADA NO REPORTADA'}
          </Text>
          <Text style={[styles.portalName, { color: colors.foreground }]} numberOfLines={1}>{featuredName}</Text>
          <Feather name="chevron-down-outline" size={17} color={colors.rarityRare} />
        </Pressable>
      </View>

      <View style={[styles.sceneFooter, { borderColor: `${colors.rarityRare}66`, backgroundColor: `${colors.ink}B8` }]}>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>{ownedCount}</Text>
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>EN TU ARCHIVO</Text>
        </View>
        <View style={[styles.metricDivider, { backgroundColor: `${colors.rarityRare}66` }]} />
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.rarityRare }]}>{totalCount || '—'}</Text>
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>CATÁLOGO VIVO</Text>
        </View>
        <View style={[styles.metricDivider, { backgroundColor: `${colors.rarityRare}66` }]} />
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.primary }]}>{completion === null ? '—' : `${completion}%`}</Text>
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>DOMINIO</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    height: VISUAL_TOKENS.archive.scene.height,
    overflow: 'hidden',
    borderRadius: VISUAL_TOKENS.archive.scene.radius,
    borderWidth: VISUAL_TOKENS.archive.scene.borderWidth,
    borderColor: 'rgba(174, 142, 255, 0.34)',
    marginTop: 10,
    marginBottom: 14,
    position: 'relative',
  },
  imageBleed: { top: -18, bottom: -18 },
  sceneImage: { width: '100%', height: '100%' },
  glow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
  },
  glowLeft: { left: -115, top: 105 },
  glowRight: { right: -120, top: 215 },
  sceneTop: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  sceneKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  sceneTitle: { fontSize: 25, fontWeight: '900', letterSpacing: -0.4, marginTop: 4 },
  sceneCopy: { fontSize: 12, lineHeight: 17, maxWidth: 275, marginTop: 5 },
  refresh: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  portalArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 164,
    alignItems: 'center',
  },
  portal: {
    width: '58%',
    minHeight: 168,
    borderWidth: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 7,
  },
  portalCore: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalCoreInner: { width: 18, height: 18, borderRadius: 9 },
  portalLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  portalName: { fontSize: 14, fontWeight: '900', textAlign: 'center' },
  sceneFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    minHeight: 60,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metric: { flex: 1, alignItems: 'center', gap: 2 },
  metricValue: { fontSize: 17, fontWeight: '900' },
  metricLabel: { fontSize: 7, fontWeight: '900', letterSpacing: 0.7, textAlign: 'center' },
  metricDivider: { width: 1, height: 28 },
});