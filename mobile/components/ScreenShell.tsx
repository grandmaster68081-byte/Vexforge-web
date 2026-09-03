import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Image, Platform, StyleSheet, Text, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CANONICAL_BACKGROUNDS, OFFICIAL_ASSETS, type VisualSurface } from '@/constants/visual';

export function ScreenShell({ surface = 'home', sceneMode = 'shell', children, style, ...props }: ViewProps & { surface?: VisualSurface; sceneMode?: 'shell' | 'hero' }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const ownsScene = sceneMode === 'shell';
  const pulse = useSharedValue(0);
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
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2800 }),
        withTiming(0, { duration: 2800 }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const leftGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.1 + pulse.value * 0.1,
    transform: [
      { translateY: pulse.value * -16 },
      { scale: 1 + pulse.value * 0.08 },
    ],
  }));
  const rightGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.08 + (1 - pulse.value) * 0.1,
    transform: [
      { translateY: (1 - pulse.value) * 14 },
      { scale: 1 + (1 - pulse.value) * 0.06 },
    ],
  }));

  return (
    <View {...props} style={[styles.root, { backgroundColor: colors.background, paddingTop: webTopInset }, style]}>
      {ownsScene ? (
        <>
          <Image
            source={{ uri: CANONICAL_BACKGROUNDS[surface] }}
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
      <Animated.View
        pointerEvents="none"
        style={[styles.ambientGlow, styles.ambientGlowLeft, { backgroundColor: atmosphereColor }, leftGlowStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.ambientGlow, styles.ambientGlowRight, { backgroundColor: colors.primary }, rightGlowStyle]}
      />
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
      <View style={[styles.content, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  content: { flex: 1 },
  backgroundImage: { opacity: 0.74 },
  ambientGlow: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  ambientGlowLeft: { top: 96, left: -174 },
  ambientGlowRight: { top: 300, right: -188 },
  orbit: {
    position: 'absolute',
    width: 430,
    height: 430,
    borderWidth: 1,
    borderRadius: 215,
    top: 86,
    right: -250,
    transform: [{ rotate: '18deg' }],
  },
  watermark: { position: 'absolute', width: 220, height: 220, top: 12, right: -54, opacity: 0.16 },
  assetError: { position: 'absolute', left: 20, right: 20, top: '42%', alignItems: 'center' },
  assetErrorPanel: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  assetErrorTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1.4 },
  assetErrorBody: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, marginTop: 4 },
});
