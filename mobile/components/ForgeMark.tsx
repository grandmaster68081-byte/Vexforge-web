import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export function ForgeMark({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.frame, compact && styles.compact, { borderColor: colors.primary }]}>
      <Ionicons name="flash" size={compact ? 14 : 18} color={colors.primary} />
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
});