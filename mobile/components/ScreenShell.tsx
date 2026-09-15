import { useEffect, useState } from 'react';
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
import { CANONICAL_BACKGROUNDS, OFFICIAL_ASSETS, type VisualSurface } from '@/constants/visual';
import { VISUAL_TOKENS } from '@/constants/experience';
import { DomainHeader } from '@/components/DomainHeader';

export function ScreenShell({ surface = 'home', sceneMode = 'shell', children, style, ...props }: ViewProps & { surface?: VisualSurface; sceneMode?: 'shell' | 'hero' }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? VISUAL_TOKENS.safeArea.webTopInset : 0;
  const ownsScene = sceneMode === 'shell';
  const pulse = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const [sceneState, setSceneState] = useState<'loading' | 'ready' | 'error'>('loading');
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
          <Image
            source={
              typeof CANONICAL_BACKGROUNDS[surface] === 'string'
                ? { uri: CANONICAL_BACKGROUNDS[surface] }
                : CANONICAL_BACKGROUNDS[surface]
            }
            style={[StyleSheet.absoluteFillObject, styles.backgroundImage]}
            resizeMode="cover"
            accessibilityLabel="Escena oficial del Nexus"
            onLoad={() => setSceneState('ready')}
            onError={() => setSceneState('error')}
          />
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
          <Image
            source={{ uri: OFFICIAL_ASSETS.logo }}
            style={styles.watermark}
            resizeMode="contain"
          />
        </>
      ) : null}
      {ownsScene && sceneState === 'error' ? (
        <View pointerEvents="none" style={styles.assetError}>
          <View style={[styles.assetErrorPanel, { backgroundColor: `${colors.panelStrong}F2`, borderColor: `${colors.accent}66` }]}>
            <Text style={[styles.assetErrorTitle, { color: colors.accent }]}>ESCENA DEL NEXUS</Text>
            <Text style={[styles.assetErrorBody, { color: colors.mutedForeground }]}>El arte oficial no está disponible.</Text>
          </View>
        </View>
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
