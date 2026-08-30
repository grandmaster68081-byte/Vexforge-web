import { Image, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function ForgeMark({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.frame, compact && styles.compact, { borderColor: colors.primary }]}>
      <Image source={require('@/assets/images/icon.jpg')} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  compact: {
    width: 30,
    height: 30,
    borderRadius: 9,
  },
  image: {
    width: '72%',
    height: '72%',
    borderRadius: 6,
  },
});