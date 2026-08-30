import { LinearGradient } from 'expo-linear-gradient';
import { Image, Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CANONICAL_BACKGROUNDS, OFFICIAL_ASSETS, type VisualSurface } from '@/constants/visual';

export function ScreenShell({ surface = 'home', children, style, ...props }: ViewProps & { surface?: VisualSurface }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View {...props} style={[styles.root, { backgroundColor: colors.background, paddingTop: webTopInset }, style]}>
      <Image source={{ uri: CANONICAL_BACKGROUNDS[surface] }} style={[StyleSheet.absoluteFillObject, styles.backgroundImage]} resizeMode="cover" />
      <LinearGradient
        colors={[`${colors.ink}B8`, `${colors.ink}C9`, `${colors.background}F0`]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={[`${colors.accent}18`, 'transparent', `${colors.primary}12`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Image
        source={{ uri: OFFICIAL_ASSETS.logo }}
        style={styles.watermark}
        resizeMode="contain"
      />
      <View style={[styles.content, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  content: { flex: 1 },
  backgroundImage: { opacity: 0.94 },
  watermark: { position: 'absolute', width: 180, height: 180, top: 18, right: -46, opacity: 0.1 },
});
