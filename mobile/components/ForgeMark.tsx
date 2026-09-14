import { Image, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { OFFICIAL_ASSETS } from '@/constants/visual';
import { VISUAL_TOKENS } from '@/constants/experience';

export function ForgeMark({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.frame, compact && styles.compact, { borderColor: colors.primary }]}>
      <Image source={{ uri: OFFICIAL_ASSETS.logo }} style={styles.image} resizeMode="cover" accessibilityLabel="Logotipo oficial de VEXFORGE" />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: VISUAL_TOKENS.identityMark.frame.size,
    height: VISUAL_TOKENS.identityMark.frame.size,
    borderWidth: VISUAL_TOKENS.identityMark.frame.borderWidth,
    borderRadius: VISUAL_TOKENS.identityMark.frame.radius,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: VISUAL_TOKENS.identityMark.frame.rotation }],
  },
  compact: {
    width: VISUAL_TOKENS.identityMark.compact.size,
    height: VISUAL_TOKENS.identityMark.compact.size,
    borderRadius: VISUAL_TOKENS.identityMark.compact.radius,
  },
  image: {
    width: VISUAL_TOKENS.identityMark.image.scale,
    height: VISUAL_TOKENS.identityMark.image.scale,
    borderRadius: VISUAL_TOKENS.identityMark.image.radius,
  },
});