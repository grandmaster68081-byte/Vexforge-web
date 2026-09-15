import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Image, Platform, StyleSheet, Text, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CANONICAL_BACKGROUNDS, type VisualSurface } from '@/constants/visual';
import { VISUAL_TOKENS } from '@/constants/experience';
import { DomainHeader } from '@/components/DomainHeader';

export function ScreenShell({ surface = 'home', sceneMode = 'shell', children, style, ...props }: ViewProps & { surface?: VisualSurface; sceneMode?: 'shell' | 'hero' }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? VISUAL_TOKENS.safeArea.webTopInset : 0;
  const ownsScene = sceneMode === 'shell';
  const pulse = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const backgroundAsset = CANONICAL_BACKGROUNDS[surface];
  const atmosphereKey: Record<VisualSurface, 'accent' | 'primary' | 'danger' | 'success' | 'rarityEpic' | 'rarityRare'> = {
    home: 'accent',
    auth: 'primary',
    pvp: 'danger',
    missions: 'success',
    packs: 'rarityEpic',
    forge: 'primary',
    collection: 'rarityRare',
    economy: 'accent',
    profile: 'rarityEpic',
    clans: 'rarityEpic',
    leaderboard: 'accent',
    achievements: 'success',
    raids: 'danger',
    world: 'danger',
    tutorial: 'accent',
  };
  const atmosphereColor = colors[atmosphereKey[surface]];
  const backgroundSource = typeof backgroundAsset === 'string' ? { uri: backgroundAsset } : backgroundAsset;

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: VISUAL_TOKENS.motion.ambient }),
        withTiming(0, { duration: VISUAL_TOKENS.motion.ambient }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion]);

  const leftGlowStyle = useAnimatedStyle(() => ({
    opacity:
      VISUAL_TOKENS.scene.ambientMotion.left.baseOpacity
      + pulse.value * VISUAL_TOKENS.scene.ambientMotion.left.pulseOpacity,
    transform: [
      { translateY: pulse.value * VISUAL_TOKENS.scene.ambientMotion.left.translateY },
      { scale: 1 + pulse.value * VISUAL_TOKENS.scene.ambientMotion.left.scale },
    ],
  }));
  const rightGlowStyle = useAnimatedStyle(() => ({
    opacity:
      VISUAL_TOKENS.scene.ambientMotion.right.baseOpacity
      + (1 - pulse.value) * VISUAL_TOKENS.scene.ambientMotion.right.pulseOpacity,
    transform: [
      { translateY: (1 - pulse.value) * VISUAL_TOKENS.scene.ambientMotion.right.translateY },
      { scale: 1 + (1 - pulse.value) * VISUAL_TOKENS.scene.ambientMotion.right.scale },
    ],
  }));

  return (
    <View {...props} style={[styles.root, { backgroundColor: colors.background, paddingTop: webTopInset }, style]}>
      {ownsScene ? (
        <>
          {backgroundSource ? (
            <Image
              source={backgroundSource}
              style={[StyleSheet.absoluteFillObject, styles.backgroundImage]}
              resizeMode="cover"
              accessibilityLabel="Escena oficial de VEXFORGE"
            />
          ) : null}
          <LinearGradient
            colors={[`${colors.ink}18`, `${colors.ink}38`, `${colors.background}C8`]}
            locations={[0, 0.48, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={[`${atmosphereColor}48`, 'transparent', `${colors.primary}32`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </>
      ) : null}
      {ownsScene ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[styles.ambientGlow, styles.ambientGlowLeft, { backgroundColor: atmosphereColor }, leftGlowStyle]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.ambientGlow, styles.ambientGlowRight, { backgroundColor: colors.primary }, rightGlowStyle]}
          />
        </>
      ) : null}
      {ownsScene ? (
        <>
          <View
            pointerEvents="none"
            style={[styles.orbit, { borderColor: `${atmosphereColor}26` }]}
          />
          {backgroundAsset ? null : (
            <View pointerEvents="none" style={styles.pendingScene}>
              <Text style={[styles.pendingSceneTitle, { color: colors.accent }]}>ARTE DE ESCENA PENDIENTE</Text>
              <Text style={[styles.pendingSceneBody, { color: colors.mutedForeground }]}>Esta superficie espera un asset oficial aprobado.</Text>
            </View>
          )}
        </>
      ) : null}
      <View style={[styles.content, { paddingBottom: Platform.OS === 'web' ? VISUAL_TOKENS.safeArea.webBottomInset : insets.bottom }]}>
        {surface === 'clans' ? (
          <DomainHeader
            domain="legado"
            title="Red de Forjadores"
            purpose="La comunidad vive dentro del Legado, no como un panel separado."
          />
        ) : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  content: { flex: 1 },
  backgroundImage: { opacity: VISUAL_TOKENS.scene.backgroundOpacity },
  ambientGlow: {
    position: 'absolute',
    width: VISUAL_TOKENS.scene.ambientGlow.size,
    height: VISUAL_TOKENS.scene.ambientGlow.size,
    borderRadius: VISUAL_TOKENS.scene.ambientGlow.radius,
  },
  ambientGlowLeft: {
    top: VISUAL_TOKENS.scene.ambientGlow.leftTop,
    left: VISUAL_TOKENS.scene.ambientGlow.leftOffset,
  },
  ambientGlowRight: {
    top: VISUAL_TOKENS.scene.ambientGlow.rightTop,
    right: VISUAL_TOKENS.scene.ambientGlow.rightOffset,
  },
  orbit: {
    position: 'absolute',
    width: VISUAL_TOKENS.scene.orbit.size,
    height: VISUAL_TOKENS.scene.orbit.size,
    borderWidth: VISUAL_TOKENS.scene.orbit.borderWidth,
    borderRadius: VISUAL_TOKENS.scene.orbit.radius,
    top: VISUAL_TOKENS.scene.orbit.top,
    right: VISUAL_TOKENS.scene.orbit.right,
    transform: [{ rotate: VISUAL_TOKENS.scene.orbit.rotation }],
  },
  pendingScene: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 104,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
  },
  pendingSceneTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 11,
    letterSpacing: 1.4,
  },
  pendingSceneBody: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  watermark: {
    position: 'absolute',
    width: VISUAL_TOKENS.scene.watermark.size,
    height: VISUAL_TOKENS.scene.watermark.size,
    top: VISUAL_TOKENS.scene.watermark.top,
    right: VISUAL_TOKENS.scene.watermark.right,
    opacity: VISUAL_TOKENS.scene.watermark.opacity,
  },
  assetError: {
    position: 'absolute',
    left: VISUAL_TOKENS.state.assetError.rootInset,
    right: VISUAL_TOKENS.state.assetError.rootInset,
    top: VISUAL_TOKENS.state.assetError.rootTop,
    alignItems: 'center',
  },
  assetErrorPanel: {
    borderWidth: VISUAL_TOKENS.state.assetError.panelBorderWidth,
    borderRadius: VISUAL_TOKENS.state.assetError.panelRadius,
    paddingHorizontal: VISUAL_TOKENS.state.assetError.panelPaddingHorizontal,
    paddingVertical: VISUAL_TOKENS.state.assetError.panelPaddingVertical,
    alignItems: 'center',
  },
  assetErrorTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: VISUAL_TOKENS.state.assetError.titleSize,
    letterSpacing: VISUAL_TOKENS.state.assetError.titleTracking,
  },
  assetErrorBody: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: VISUAL_TOKENS.state.assetError.bodySize,
    marginTop: VISUAL_TOKENS.state.assetError.bodyMarginTop,
  },
});
